import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { getImageURL } from '@/services/api'
import {
    Address,
    clearCart,
    confirmPayment,
    createOrder,
    getAddresses,
    initiatePayment,
    updateOrderStatus
} from '@/services/user'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import React, { useCallback, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native'

interface CheckoutItem {
    _id: string
    product: any
    quantity: number
    selectedColor?: string
    selectedSize?: string
}

export default function PaymentScreen() {
    const route = useRoute<any>()
    const navigation = useNavigation<any>()
    const router = useRouter()

    let cartItems: CheckoutItem[] = []
    let subtotal = 0
    let shipping = 0

    if (route.params?.items) {
        try {
            cartItems = typeof route.params.items === 'string'
                ? JSON.parse(route.params.items)
                : route.params.items
        } catch (e) {
            cartItems = []
        }
    }

    subtotal = Number(route.params?.subtotal) || 0
    shipping = Number(route.params?.shipping) || 30000


    const [addresses, setAddresses] = useState<Address[]>([])
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('cod')
    const [showAddressModal, setShowAddressModal] = useState(false)
    const [loading, setLoading] = useState(false)
    const [loadingAddresses, setLoadingAddresses] = useState(true)

    const paymentMethods = [
        { id: 'cod', name: 'Thanh toán khi nhận hàng', icon: '🚚' },
        { id: 'vnpay', name: 'VNPay', icon: '💳', disabled: true },
        { id: 'momo', name: 'Momo', icon: '📱', disabled: true },
        { id: 'stripe', name: 'Stripe', icon: '💰', disabled: true },
    ]

    // Load addresses when screen gains focus (e.g., after adding new address)
    useFocusEffect(
        useCallback(() => {
            loadAddresses()
        }, [])
    )

    const loadAddresses = async () => {
        try {
            setLoadingAddresses(true)
            const data = await getAddresses()
            console.log('📍 Addresses loaded:', data.length, 'addresses')
            setAddresses(data)
            const defaultAddr = data.find((a) => a.isDefault)
            if (defaultAddr?._id) {
                setSelectedAddressId(defaultAddr._id)
            } else if (data.length > 0) {
                setSelectedAddressId(data[0]._id!)
            } else {
                console.warn('⚠️ No addresses found')
                Alert.alert('Thông báo', 'Bạn chưa có địa chỉ nào. Vui lòng thêm địa chỉ giao hàng.')
            }
        } catch (error) {
            console.error('❌ Error loading addresses:', error)
            Alert.alert('Lỗi', 'Không thể tải danh sách địa chỉ')
        } finally {
            setLoadingAddresses(false)
        }
    }

    const handleAddNewAddress = () => {
        // Navigate to new-address screen in address stack
        setShowAddressModal(false)
        router.push('/address/new-address')
    }

    const handlePayment = async () => {
        if (!selectedAddressId) {
            Alert.alert('Lỗi', 'Vui lòng chọn địa chỉ giao hàng')
            return
        }

        if (cartItems.length === 0) {
            Alert.alert('Lỗi', 'Giỏ hàng trống')
            return
        }

        try {
            setLoading(true)

            console.log('🛒 Payment processing:', {
                items: cartItems.length,
                subtotal,
                shipping,
                total: subtotal + shipping,
                selectedAddressId,
                selectedPaymentMethod,
            })

            const items = cartItems.map((item) => ({
                product: item.product._id,
                productId: item.product._id,
                name: item.product.name,
                price: item.product.discountPrice ?? item.product.price,
                quantity: item.quantity,
            }))

            const total = Number(subtotal) + Number(shipping)


            // Get selected address details
            const selectedAddress = addresses.find((a) => a._id === selectedAddressId)
            if (!selectedAddress) {
                throw new Error('Địa chỉ không hợp lệ')
            }

            console.log('📍 Selected address:', {
                id: selectedAddress._id,
                fullName: selectedAddress.fullName,
                phone: selectedAddress.phone,
            })

            const order = await createOrder({
                items,
                amounts: {
                    subtotal: Math.round(subtotal),
                    tax: Math.round(subtotal * 0.1),
                    shipping,
                    total: Math.round(total),
                },
                notes: `Giao đến: ${selectedAddress.fullName} | SĐT: ${selectedAddress.phone} | Địa chỉ ID: ${selectedAddressId}`,
                meta: {
                    addressId: selectedAddressId,  // Store address ID in meta
                    addressDetails: {
                        fullName: selectedAddress.fullName || '',
                        phone: selectedAddress.phone || '',
                        address: selectedAddress.addressLine1 || '',
                        ward: selectedAddress.ward || '',
                        district: selectedAddress.district || '',
                        province: selectedAddress.province || '',
                    }
                },
            })

            console.log('✅ Order created:', order.code, 'Order ID:', order._id)

            const payment = await initiatePayment(order._id, selectedPaymentMethod)
            console.log('✅ Payment initiated:', payment._id, 'Status:', payment.status)

            if (selectedPaymentMethod === 'cod') {
                await confirmPayment(payment._id, 'authorized')
                console.log('✅ Payment confirmed as COD')
                // Cập nhật trạng thái đơn hàng sang 'processing' ngay lập tức
                try {
                    await updateOrderStatus(order._id, 'processing')
                } catch (e) {
                    console.warn('⚠️ Could not update order status to processing:', (e as any)?.message)
                }
                // Xóa giỏ hàng sau khi thanh toán thành công
                try {
                    await clearCart()
                    console.log('🧹 Cart cleared after successful order')
                } catch (e) {
                    console.warn('⚠️ Could not clear cart:', (e as any)?.message)
                }

                Alert.alert(
                    'Thành công',
                    `Đơn hàng ${order.code} đã được tạo!\n\nBạn sẽ thanh toán khi nhận hàng.`,
                    [
                        {
                            text: 'OK',
                            onPress: async () => {
                                navigation.navigate('orderSuccess', { orderId: order._id, orderCode: order.code })
                            },
                        },
                    ]
                )
            } else {
                Alert.alert('Thông tin', 'Chức năng thanh toán online đang được phát triển.')
            }
        } catch (error: any) {
            console.error('❌ Payment error:', error)
            Alert.alert('Lỗi', error?.response?.data?.message || error.message || 'Không thể xử lý thanh toán')
        } finally {
            setLoading(false)
        }
    }

    if (loadingAddresses) {
        return (
            <ThemedView style={styles.container}>
                <ActivityIndicator size="large" color="#FF4500" />
            </ThemedView>
        )
    }

    const selectedAddress = addresses.find((a) => a._id === selectedAddressId)
    const total = subtotal + shipping

    return (
        <ThemedView style={styles.container}>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>📦 Đơn Hàng Của Bạn</ThemedText>
                </View>

                <FlatList
                    data={cartItems}
                    scrollEnabled={false}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <View style={styles.orderItem}>
                            <Image
                                source={{
                                    uri: getImageURL(
                                        item.product?.mainImage?.url ||
                                        item.product?.images?.[0]?.url
                                    ),
                                }}
                                style={styles.itemImage}
                            />
                            <View style={styles.itemInfo}>
                                <ThemedText style={styles.itemName}>
                                    {item.product?.name}
                                </ThemedText>
                                <ThemedText style={styles.itemPrice}>
                                    {Intl.NumberFormat('vi-VN').format(
                                        item.product?.discountPrice ??
                                        item.product?.price
                                    )}
                                    ₫ x {item.quantity}
                                </ThemedText>
                                {item.selectedColor && (
                                    <ThemedText style={styles.itemVariant}>
                                        Màu: {item.selectedColor}
                                    </ThemedText>
                                )}
                                {item.selectedSize && (
                                    <ThemedText style={styles.itemVariant}>
                                        Size: {item.selectedSize}
                                    </ThemedText>
                                )}
                            </View>
                            <ThemedText style={styles.itemTotal}>
                                {Intl.NumberFormat('vi-VN').format(
                                    (item.product?.discountPrice ?? item.product?.price) *
                                    item.quantity
                                )}
                                ₫
                            </ThemedText>
                        </View>
                    )}
                />

                <View style={styles.summary}>
                    <View style={styles.summaryRow}>
                        <ThemedText style={styles.summaryLabel}>Tạm tính:</ThemedText>
                        <ThemedText style={styles.summaryValue}>
                            {Intl.NumberFormat('vi-VN').format(subtotal)}₫
                        </ThemedText>
                    </View>
                    <View style={styles.summaryRow}>
                        <ThemedText style={styles.summaryLabel}>Vận chuyển:</ThemedText>
                        <ThemedText style={styles.summaryValue}>
                            {Intl.NumberFormat('vi-VN').format(shipping)}₫
                        </ThemedText>
                    </View>
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <ThemedText style={styles.totalLabel}>Tổng cộng:</ThemedText>
                        <ThemedText style={styles.totalValue}>
                            {Intl.NumberFormat('vi-VN').format(total)}₫
                        </ThemedText>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <ThemedText style={styles.sectionTitle}>📍 Địa Chỉ Giao Hàng</ThemedText>
                        <TouchableOpacity onPress={() => setShowAddressModal(true)}>
                            <ThemedText style={styles.changeBtn}>Thay đổi</ThemedText>
                        </TouchableOpacity>
                    </View>

                    {selectedAddress ? (
                        <View style={styles.addressCard}>
                            <ThemedText style={styles.addressName}>
                                {selectedAddress.fullName}
                            </ThemedText>
                            <ThemedText style={styles.addressDetail}>
                                📞 {selectedAddress.phone}
                            </ThemedText>
                            <ThemedText style={styles.addressDetail}>
                                {selectedAddress.addressLine1}
                                {selectedAddress.addressLine2
                                    ? `, ${selectedAddress.addressLine2}`
                                    : ''}
                            </ThemedText>
                            {selectedAddress.ward && (
                                <ThemedText style={styles.addressDetail}>
                                    {selectedAddress.ward}
                                    {selectedAddress.district
                                        ? `, ${selectedAddress.district}`
                                        : ''}
                                    {selectedAddress.province
                                        ? `, ${selectedAddress.province}`
                                        : ''}
                                </ThemedText>
                            )}
                        </View>
                    ) : (
                        <View style={styles.noAddressCard}>
                            <ThemedText style={styles.noAddressText}>
                                Vui lòng chọn địa chỉ giao hàng
                            </ThemedText>
                            <TouchableOpacity
                                style={styles.selectAddressBtn}
                                onPress={() => setShowAddressModal(true)}
                            >
                                <ThemedText style={styles.selectAddressBtnText}>
                                    Chọn Địa Chỉ
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>💳 Phương Thức Thanh Toán</ThemedText>
                    {paymentMethods.map((method) => (
                        <TouchableOpacity
                            key={method.id}
                            style={styles.paymentMethod}
                            onPress={() => !method.disabled && setSelectedPaymentMethod(method.id)}
                            disabled={method.disabled}
                        >
                            <View
                                style={[
                                    styles.radioButton,
                                    selectedPaymentMethod === method.id &&
                                    styles.radioButtonSelected,
                                ]}
                            >
                                {selectedPaymentMethod === method.id && (
                                    <View style={styles.radioDot} />
                                )}
                            </View>
                            <ThemedText style={[styles.paymentMethodText, method.disabled && { opacity: 0.5 }]}>
                                {method.icon} {method.name}
                            </ThemedText>
                            {method.disabled && (
                                <ThemedText style={styles.comingSoon}>
                                    Sắp ra mắt
                                </ThemedText>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {selectedPaymentMethod === 'cod' && (
                    <View style={styles.infoBox}>
                        <ThemedText style={styles.infoTitle}>ℹ️ Thông Tin</ThemedText>
                        <ThemedText style={styles.infoText}>
                            Bạn sẽ thanh toán trực tiếp cho nhân viên giao hàng khi nhận hàng.
                        </ThemedText>
                    </View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.payBtn, loading && styles.payBtnDisabled]}
                    onPress={handlePayment}
                    disabled={loading || !selectedAddressId}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <ThemedText style={styles.payBtnText}>
                            Đặt Hàng ({Intl.NumberFormat('vi-VN').format(total)}₫)
                        </ThemedText>
                    )}
                </TouchableOpacity>
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={showAddressModal}
                onRequestClose={() => setShowAddressModal(false)}
            >
                <View style={styles.modal}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>
                                Chọn Địa Chỉ Giao Hàng
                            </ThemedText>
                            <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                                <ThemedText style={styles.closeBtn}>✕</ThemedText>
                            </TouchableOpacity>
                        </View>

                        {addresses.length === 0 ? (
                            <View style={styles.emptyAddressContainer}>
                                <ThemedText style={styles.emptyAddressIcon}>📍</ThemedText>
                                <ThemedText style={styles.emptyAddressText}>
                                    Bạn chưa có địa chỉ nào
                                </ThemedText>
                                <TouchableOpacity
                                    style={styles.addNewAddressBtnLarge}
                                    onPress={handleAddNewAddress}
                                >
                                    <ThemedText style={styles.addNewAddressBtnLargeText}>
                                        Thêm địa chỉ mới
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <FlatList
                                data={addresses}
                                keyExtractor={(item) => item._id || Math.random().toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.modalAddressItem,
                                            selectedAddressId === item._id &&
                                            styles.modalAddressItemSelected,
                                        ]}
                                        onPress={() => {
                                            setSelectedAddressId(item._id!)
                                            setShowAddressModal(false)
                                        }}
                                    >
                                        <View
                                            style={[
                                                styles.checkRadio,
                                                selectedAddressId === item._id &&
                                                styles.checkRadioSelected,
                                            ]}
                                        >
                                            {selectedAddressId === item._id && (
                                                <ThemedText style={styles.checkMark}>
                                                    ✓
                                                </ThemedText>
                                            )}
                                        </View>
                                        <View style={styles.addressInfo}>
                                            <ThemedText style={styles.addressInfoName}>
                                                {item.fullName}
                                                {item.isDefault && (
                                                    <ThemedText style={styles.defaultTag}>
                                                        (Mặc định)
                                                    </ThemedText>
                                                )}
                                            </ThemedText>
                                            <ThemedText style={styles.addressInfoPhone}>
                                                {item.phone}
                                            </ThemedText>
                                            <ThemedText style={styles.addressInfoAddress}>
                                                {item.addressLine1}
                                                {item.addressLine2
                                                    ? `, ${item.addressLine2}`
                                                    : ''}
                                            </ThemedText>
                                        </View>
                                    </TouchableOpacity>
                                )}
                                ListFooterComponent={
                                    <TouchableOpacity
                                        style={styles.addNewAddressBtn}
                                        onPress={handleAddNewAddress}
                                    >
                                        <ThemedText style={styles.addNewAddressBtnText}>
                                            ➕ Thêm địa chỉ mới
                                        </ThemedText>
                                    </TouchableOpacity>
                                }
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9' },
    content: { flex: 1, padding: 16 },

    section: { marginBottom: 20 },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
    changeBtn: { color: '#FF4500', fontWeight: '600', fontSize: 14 },

    orderItem: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        alignItems: 'center',
    },
    itemImage: { width: 60, height: 60, borderRadius: 6, marginRight: 12 },
    itemInfo: { flex: 1 },
    itemName: { fontWeight: '600', marginBottom: 4, fontSize: 13 },
    itemPrice: { color: '#FF4500', fontWeight: '600', fontSize: 12, marginBottom: 3 },
    itemVariant: { fontSize: 11, color: '#666' },
    itemTotal: { fontWeight: '700', color: '#FF4500', fontSize: 13 },

    summary: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    summaryLabel: { fontSize: 14, color: '#666' },
    summaryValue: { fontWeight: '600', fontSize: 14 },
    totalRow: { paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
    totalLabel: { fontSize: 15, fontWeight: '700' },
    totalValue: { fontSize: 15, fontWeight: '700', color: '#FF4500' },

    addressCard: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    addressName: { fontWeight: '600', marginBottom: 4 },
    addressDetail: { fontSize: 13, color: '#666', marginBottom: 3, lineHeight: 18 },

    noAddressCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
    },
    noAddressText: { color: '#999', marginBottom: 12 },
    selectAddressBtn: {
        backgroundColor: '#FF4500',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 6,
    },
    selectAddressBtnText: { color: '#fff', fontWeight: '600' },

    paymentMethod: {
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 8,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#ddd',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonSelected: { borderColor: '#FF4500', borderWidth: 2 },
    radioDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF4500',
    },
    paymentMethodText: { flex: 1, fontWeight: '500', fontSize: 14 },
    comingSoon: { fontSize: 12, color: '#999', fontStyle: 'italic' },

    infoBox: {
        backgroundColor: '#FFF5E6',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#FF4500',
    },
    infoTitle: { fontWeight: '600', marginBottom: 6, fontSize: 14 },
    infoText: { fontSize: 13, color: '#666', lineHeight: 18 },

    footer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    payBtn: {
        backgroundColor: '#FF4500',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    payBtnDisabled: { opacity: 0.5 },
    payBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

    modal: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: { fontSize: 16, fontWeight: '700' },
    closeBtn: { fontSize: 24, color: '#666' },

    modalAddressItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    modalAddressItemSelected: { backgroundColor: '#FFF5E6' },
    checkRadio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#ddd',
        marginRight: 12,
        marginTop: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkRadioSelected: { borderColor: '#FF4500', backgroundColor: '#FF4500' },
    checkMark: { color: '#fff', fontWeight: 'bold' },
    addressInfo: { flex: 1 },
    addressInfoName: { fontWeight: '600', marginBottom: 4, fontSize: 14 },
    defaultTag: { fontSize: 11, color: '#FF4500', fontWeight: '600' },
    addressInfoPhone: { fontSize: 13, color: '#666', marginBottom: 3 },
    addressInfoAddress: { fontSize: 13, color: '#666', lineHeight: 18 },
    addNewAddressBtn: {
        backgroundColor: '#FF4500',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    addNewAddressBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    emptyAddressContainer: {
        alignItems: 'center',
        paddingVertical: 20,
        marginTop: 20,
    },
    emptyAddressIcon: { fontSize: 40, marginBottom: 10 },
    emptyAddressText: {
        fontSize: 16,
        color: '#999',
        marginBottom: 20,
    },
    addNewAddressBtnLarge: {
        backgroundColor: '#FF4500',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        width: '100%',
    },
    addNewAddressBtnLargeText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
})
