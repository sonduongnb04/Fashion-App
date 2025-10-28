import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { Address, createAddress, deleteAddress, getAddresses, setDefaultAddress, updateAddress } from '@/services/user'
import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import React, { useCallback, useState } from 'react'
import {
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'

export default function AddressScreen() {
    const router = useRouter()
    const [addresses, setAddresses] = useState<Address[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [editingAddress, setEditingAddress] = useState<Address | null>(null)

    const [formData, setFormData] = useState<Address>({
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        ward: '',
        district: '',
        province: '',
        country: 'VN',
        postalCode: '',
        isDefault: false,
    })

    useFocusEffect(
        useCallback(() => {
            loadAddresses()
        }, [])
    )

    const loadAddresses = async () => {
        try {
            setLoading(true)
            const data = await getAddresses()
            setAddresses(data)
        } catch (error) {
            console.error('Error loading addresses:', error)
            Alert.alert('Lỗi', 'Không thể tải danh sách địa chỉ')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const onRefresh = () => {
        setRefreshing(true)
        loadAddresses()
    }

    const resetForm = () => {
        setFormData({
            fullName: '',
            phone: '',
            addressLine1: '',
            addressLine2: '',
            ward: '',
            district: '',
            province: '',
            country: 'VN',
            postalCode: '',
            isDefault: false,
        })
        setEditingAddress(null)
    }

    const openAddModal = () => {
        // Chuyển hướng đến màn hình tạo địa chỉ mới
        router.navigate('/address/new-address')
    }

    const openEditModal = (address: Address) => {
        // Chuyển hướng đến màn hình sửa địa chỉ với thông tin địa chỉ được chọn
        const addressParam = JSON.stringify(address)
        router.navigate({
            pathname: '/address/new-address',
            params: { address: addressParam }
        })
    }

    const handleSaveAddress = async () => {
        if (!formData.fullName.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập tên đầy đủ')
            return
        }
        if (!formData.phone.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại')
            return
        }
        if (!formData.addressLine1.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ')
            return
        }

        try {
            if (editingAddress?._id) {
                await updateAddress(editingAddress._id, formData)
                Alert.alert('Thành công', 'Cập nhật địa chỉ thành công')
            } else {
                await createAddress(formData)
                Alert.alert('Thành công', 'Tạo địa chỉ thành công')
            }
            setModalVisible(false)
            resetForm()
            loadAddresses()
        } catch (error: any) {
            Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể lưu địa chỉ')
        }
    }

    const handleDeleteAddress = async (id: string) => {
        Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xóa địa chỉ này?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteAddress(id)
                        Alert.alert('Thành công', 'Xóa địa chỉ thành công')
                        loadAddresses()
                    } catch (error: any) {
                        Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể xóa địa chỉ')
                    }
                },
            },
        ])
    }

    const handleSetDefault = async (id: string) => {
        try {
            await setDefaultAddress(id)
            loadAddresses()
        } catch (error: any) {
            Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể đặt địa chỉ mặc định')
        }
    }

    if (loading) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText>Đang tải địa chỉ...</ThemedText>
            </ThemedView>
        )
    }

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <ThemedText style={styles.title}>Địa Chỉ Của Tôi</ThemedText>
                <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                    <ThemedText style={styles.addButtonText}>+ Thêm</ThemedText>
                </TouchableOpacity>
            </View>

            <FlatList
                data={addresses}
                keyExtractor={(item) => item._id || Math.random().toString()}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                renderItem={({ item }) => (
                    <View style={[styles.addressCard, item.isDefault && styles.defaultCard]}>
                        {item.isDefault && (
                            <View style={styles.defaultBadge}>
                                <ThemedText style={styles.defaultBadgeText}>Mặc định</ThemedText>
                            </View>
                        )}
                        <ThemedText style={styles.addressName}>{item.fullName}</ThemedText>
                        <ThemedText style={styles.addressPhone}>📞 {item.phone}</ThemedText>
                        <ThemedText style={styles.addressText}>
                            {item.addressLine1}
                            {item.addressLine2 ? `, ${item.addressLine2}` : ''}
                        </ThemedText>
                        {item.ward && (
                            <ThemedText style={styles.addressText}>
                                {item.ward}
                                {item.district ? `, ${item.district}` : ''}
                                {item.province ? `, ${item.province}` : ''}
                            </ThemedText>
                        )}

                        <View style={styles.actions}>
                            {!item.isDefault && (
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.defaultBtn]}
                                    onPress={() => handleSetDefault(item._id!)}
                                >
                                    <ThemedText style={styles.actionText}>Mặc định</ThemedText>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.editBtn]}
                                onPress={() => openEditModal(item)}
                            >
                                <ThemedText style={styles.actionText}>Sửa</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.deleteBtn]}
                                onPress={() => handleDeleteAddress(item._id!)}
                            >
                                <ThemedText style={styles.actionText}>Xóa</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <ThemedText style={styles.emptyIcon}>📍</ThemedText>
                        <ThemedText style={styles.emptyText}>Bạn chưa có địa chỉ nào</ThemedText>
                    </View>
                }
            />

            {/* Add/Edit Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modal}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>
                                {editingAddress ? 'Cập Nhật Địa Chỉ' : 'Thêm Địa Chỉ Mới'}
                            </ThemedText>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <ThemedText style={styles.closeBtn}>✕</ThemedText>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                            <ThemedText style={styles.label}>Tên đầy đủ</ThemedText>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập tên đầy đủ"
                                value={formData.fullName}
                                onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                                placeholderTextColor="#999"
                            />

                            <ThemedText style={styles.label}>Số điện thoại</ThemedText>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập số điện thoại"
                                value={formData.phone}
                                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                keyboardType="phone-pad"
                                placeholderTextColor="#999"
                            />

                            <ThemedText style={styles.label}>Địa chỉ</ThemedText>
                            <TextInput
                                style={styles.input}
                                placeholder="Số nhà, tên đường"
                                value={formData.addressLine1}
                                onChangeText={(text) => setFormData({ ...formData, addressLine1: text })}
                                placeholderTextColor="#999"
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Số nhà, tên đường (tiếp)"
                                value={formData.addressLine2}
                                onChangeText={(text) => setFormData({ ...formData, addressLine2: text })}
                                placeholderTextColor="#999"
                            />

                            <ThemedText style={styles.label}>Phường/Xã</ThemedText>
                            <TextInput
                                style={styles.input}
                                placeholder="Phường/Xã"
                                value={formData.ward}
                                onChangeText={(text) => setFormData({ ...formData, ward: text })}
                                placeholderTextColor="#999"
                            />

                            <ThemedText style={styles.label}>Quận/Huyện</ThemedText>
                            <TextInput
                                style={styles.input}
                                placeholder="Quận/Huyện"
                                value={formData.district}
                                onChangeText={(text) => setFormData({ ...formData, district: text })}
                                placeholderTextColor="#999"
                            />

                            <ThemedText style={styles.label}>Tỉnh/Thành phố</ThemedText>
                            <TextInput
                                style={styles.input}
                                placeholder="Tỉnh/Thành phố"
                                value={formData.province}
                                onChangeText={(text) => setFormData({ ...formData, province: text })}
                                placeholderTextColor="#999"
                            />

                            <ThemedText style={styles.label}>Mã bưu chính</ThemedText>
                            <TextInput
                                style={styles.input}
                                placeholder="Mã bưu chính (tùy chọn)"
                                value={formData.postalCode}
                                onChangeText={(text) => setFormData({ ...formData, postalCode: text })}
                                placeholderTextColor="#999"
                            />

                            <TouchableOpacity
                                style={styles.checkboxContainer}
                                onPress={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
                            >
                                <View
                                    style={[
                                        styles.checkbox,
                                        formData.isDefault && styles.checkboxChecked,
                                    ]}
                                >
                                    {formData.isDefault && (
                                        <ThemedText style={styles.checkmark}>✓</ThemedText>
                                    )}
                                </View>
                                <ThemedText style={styles.checkboxLabel}>
                                    Đặt làm địa chỉ mặc định
                                </ThemedText>
                            </TouchableOpacity>

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.cancelBtn]}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <ThemedText style={styles.modalBtnText}>Hủy</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.saveBtn]}
                                    onPress={handleSaveAddress}
                                >
                                    <ThemedText style={styles.modalBtnText}>Lưu</ThemedText>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 20, fontWeight: 'bold' },
    addButton: { backgroundColor: '#FF4500', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
    addButtonText: { color: '#fff', fontWeight: '600' },

    addressCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    defaultCard: {
        borderColor: '#FF4500',
        borderWidth: 2,
    },
    defaultBadge: {
        backgroundColor: '#FF4500',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    defaultBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    addressName: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
    addressPhone: { marginBottom: 6, color: '#666' },
    addressText: { color: '#555', marginBottom: 3, lineHeight: 20 },

    actions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
    defaultBtn: { backgroundColor: '#f0f0f0' },
    editBtn: { backgroundColor: '#007AFF' },
    deleteBtn: { backgroundColor: '#ff3b30' },
    actionText: { color: '#fff', fontWeight: '600', fontSize: 12 },

    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyIcon: { fontSize: 60, marginBottom: 16 },
    emptyText: { fontSize: 16, color: '#999' },

    // Modal styles
    modal: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingTop: 16,
        maxHeight: '95%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    closeBtn: { fontSize: 24, color: '#666' },

    form: { padding: 16 },
    label: { fontWeight: '600', marginBottom: 8, marginTop: 12 },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 8,
        fontSize: 14,
        color: '#000',
    },

    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 20,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: '#FF4500',
        borderRadius: 4,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: { backgroundColor: '#FF4500' },
    checkmark: { color: '#fff', fontWeight: 'bold' },
    checkboxLabel: { fontSize: 14 },

    modalActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
        marginBottom: 20,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelBtn: { backgroundColor: '#f0f0f0' },
    saveBtn: { backgroundColor: '#FF4500' },
    modalBtnText: { fontWeight: '600', fontSize: 14 },
})
