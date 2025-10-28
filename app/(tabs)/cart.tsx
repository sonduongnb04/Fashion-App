import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { getImageURL } from '@/services/api'
import { getCart, removeFromCart, updateCartItem } from '@/services/user'
import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import React, { useMemo, useState } from 'react'
import { Alert, FlatList, Image, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native'

export default function CartScreen() {
    const router = useRouter()
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    useFocusEffect(
        React.useCallback(() => {
            loadCart()
        }, [])
    )

    const loadCart = async () => {
        try {
            setLoading(true)
            const cartItems = await getCart()
            console.log('📦 Cart loaded:', cartItems.length, 'items')
            setItems(cartItems)
        } catch (error) {
            console.error('Error loading cart:', error)
            Alert.alert('Lỗi', 'Không thể tải giỏ hàng')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const onRefresh = () => {
        setRefreshing(true)
        loadCart()
    }

    const handleRemove = async (cartItemId: string) => {
        try {
            await removeFromCart(cartItemId)
            Alert.alert('Thành công', 'Đã xóa khỏi giỏ hàng')
            loadCart() // Refresh cart
        } catch (error) {
            console.error('Error removing from cart:', error)
            Alert.alert('Lỗi', 'Không thể xóa sản phẩm')
        }
    }

    const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
        try {
            if (newQuantity <= 0) {
                handleRemove(cartItemId)
                return
            }
            await updateCartItem(cartItemId, newQuantity)
            loadCart() // Refresh cart
        } catch (error) {
            console.error('Error updating quantity:', error)
        }
    }

    // Tính toán tổng tiền
    const subtotal = useMemo(() => {
        const sum = items.reduce((acc, item) => {
            const price = item.product?.discountPrice ?? item.product?.price ?? 0
            const itemTotal = Math.round(price * item.quantity)
            console.log(`🛒 Item: ${item.product?.name}, Price: ${price}, Qty: ${item.quantity}, Subtotal: ${itemTotal}`)
            return acc + itemTotal
        }, 0)
        console.log(`💰 Cart subtotal: ${sum}`)
        return sum
    }, [items])

    const shipping = items.length > 0 ? 30000 : 0
    const total = subtotal + shipping

    const handleCheckout = () => {
        if (items.length === 0) {
            Alert.alert('Giỏ hàng trống', 'Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán.')
            return
        }

        console.log('📦 Checkout summary:', {
            items: items.length,
            subtotal,
            shipping,
            total,
        })

        // Navigate to payment screen with cart items and amounts
        router.push({
            pathname: '/(tabs)/payment',
            params: {
                items: JSON.stringify(items),
                subtotal: Math.round(subtotal),  // Ensure integer
                shipping,
                total: Math.round(total),  // Ensure integer
            }
        } as any)
    }

    if (loading) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText>Đang tải giỏ hàng...</ThemedText>
            </ThemedView>
        )
    }

    return (
        <ThemedView style={styles.container}>
            <FlatList
                data={items}
                keyExtractor={(item) => item._id || item.product?._id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                renderItem={({ item }) => (
                    <View style={styles.cartItem}>
                        <Image
                            source={{ uri: getImageURL(item.product?.mainImage?.url || item.product?.images?.[0]?.url) }}
                            style={styles.image}
                        />
                        <View style={styles.itemInfo}>
                            <ThemedText style={styles.productName}>{item.product?.name}</ThemedText>
                            <ThemedText style={styles.price}>
                                {Intl.NumberFormat('vi-VN').format(item.product?.discountPrice ?? item.product?.price)}₫
                            </ThemedText>
                            {item.selectedColor && (
                                <ThemedText style={styles.variant}>Màu: {item.selectedColor}</ThemedText>
                            )}
                            {item.selectedSize && (
                                <ThemedText style={styles.variant}>Size: {item.selectedSize}</ThemedText>
                            )}
                        </View>
                        <View style={styles.quantity}>
                            <TouchableOpacity onPress={() => handleUpdateQuantity(item._id, item.quantity - 1)}>
                                <ThemedText style={styles.quantityBtn}>−</ThemedText>
                            </TouchableOpacity>
                            <ThemedText style={styles.quantityValue}>{item.quantity}</ThemedText>
                            <TouchableOpacity onPress={() => handleUpdateQuantity(item._id, item.quantity + 1)}>
                                <ThemedText style={styles.quantityBtn}>+</ThemedText>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={() => handleRemove(item._id)}>
                            <ThemedText style={styles.deleteBtn}>🗑️</ThemedText>
                        </TouchableOpacity>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <ThemedText style={styles.emptyIcon}>🛒</ThemedText>
                        <ThemedText style={styles.emptyText}>Giỏ hàng của bạn đang trống</ThemedText>
                        <TouchableOpacity
                            style={styles.shopButton}
                            onPress={() => router.push('/(tabs)/categories')}
                        >
                            <ThemedText style={styles.shopButtonText}>Mua sắm ngay</ThemedText>
                        </TouchableOpacity>
                    </View>
                }
                ListFooterComponent={
                    items.length > 0 ? (
                        <View style={styles.summary}>
                            <View style={styles.summaryRow}>
                                <ThemedText>Tạm tính:</ThemedText>
                                <ThemedText>{Intl.NumberFormat('vi-VN').format(subtotal)}₫</ThemedText>
                            </View>
                            <View style={styles.summaryRow}>
                                <ThemedText>Vận chuyển:</ThemedText>
                                <ThemedText>{Intl.NumberFormat('vi-VN').format(shipping)}₫</ThemedText>
                            </View>
                            <View style={[styles.summaryRow, styles.totalRow]}>
                                <ThemedText style={styles.totalText}>Tổng cộng:</ThemedText>
                                <ThemedText style={styles.totalPrice}>
                                    {Intl.NumberFormat('vi-VN').format(total)}₫
                                </ThemedText>
                            </View>
                            <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
                                <ThemedText style={styles.checkoutBtnText}>Thanh Toán</ThemedText>
                            </TouchableOpacity>
                        </View>
                    ) : null
                }
            />
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    image: { width: 80, height: 80, borderRadius: 8, marginRight: 12 },
    itemInfo: { flex: 1 },
    productName: { fontWeight: '600', marginBottom: 4 },
    price: { color: '#FF4500', fontWeight: 'bold', marginBottom: 4 },
    variant: { fontSize: 12, color: '#666' },
    quantity: { flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 8 },
    quantityBtn: { fontSize: 18, fontWeight: 'bold', width: 28, textAlign: 'center' },
    quantityValue: { minWidth: 30, textAlign: 'center' },
    deleteBtn: { fontSize: 20 },
    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyIcon: { fontSize: 80, marginBottom: 16 },
    emptyText: { fontSize: 16, marginBottom: 24 },
    shopButton: { backgroundColor: '#FF4500', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 },
    shopButtonText: { color: '#fff', fontWeight: '600' },
    summary: { padding: 16, backgroundColor: '#fff', marginTop: 12, borderRadius: 8 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    totalRow: { paddingTop: 8, borderTopWidth: 1, borderTopColor: '#eee' },
    totalText: { fontWeight: 'bold', fontSize: 16 },
    totalPrice: { fontWeight: 'bold', fontSize: 16, color: '#FF4500' },
    checkoutBtn: { backgroundColor: '#FF4500', paddingVertical: 14, borderRadius: 8, marginTop: 12, alignItems: 'center' },
    checkoutBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})
