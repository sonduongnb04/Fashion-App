import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { Address, createAddress, updateAddress } from '@/services/user'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
    Alert,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'

export default function NewAddressScreen() {
    const router = useRouter()
    const params = useLocalSearchParams<{ address: string }>()
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

    useEffect(() => {
        if (params.address) {
            try {
                const addressData = JSON.parse(params.address)
                setFormData(addressData)
                setEditingAddress(addressData)
            } catch (e) {
                console.error('Lỗi parse dữ liệu địa chỉ:', e)
            }
        }
    }, [params.address])

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
                Alert.alert('Thành công', 'Cập nhật địa chỉ thành công', [
                    { text: 'OK', onPress: () => router.replace('/(tabs)/address-list') }
                ])
            } else {
                await createAddress(formData)
                Alert.alert('Thành công', 'Tạo địa chỉ thành công', [
                    { text: 'OK', onPress: () => router.replace('/(tabs)/address-list') }
                ])
            }
        } catch (error: any) {
            Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể lưu địa chỉ')
        }
    }

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ThemedText style={styles.backButtonText}>← Quay lại</ThemedText>
                </TouchableOpacity>
                <ThemedText style={styles.title}>
                    {editingAddress ? 'Cập Nhật Địa Chỉ' : 'Thêm Địa Chỉ Mới'}
                </ThemedText>
                <View style={styles.placeholder} />
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

                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveAddress}
                >
                    <ThemedText style={styles.saveButtonText}>
                        {editingAddress ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ'}
                    </ThemedText>
                </TouchableOpacity>
            </ScrollView>
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingTop: 8
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        fontSize: 16,
        color: '#FF4500',
    },
    placeholder: {
        width: 80,
    },
    title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },

    form: { flex: 1 },
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

    saveButton: {
        backgroundColor: '#FF4500',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 40
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16
    },
})
