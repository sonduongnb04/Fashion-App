import { ThemedText } from '@/components/themed-text'
import { adminApi, fetchCategories, fetchProductDetail } from '@/services/api'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'

export default function ProductEditScreen() {
    const router = useRouter()
    const { id } = useLocalSearchParams<{ id?: string }>()
    const isEdit = Boolean(id)
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState<any[]>([])
    const [form, setForm] = useState<any>({ name: '', price: '', description: '', category: '', colors: '', sizes: '', stock: '0' })

    useEffect(() => {
        const load = async () => {
            const cats = await fetchCategories()
            setCategories(cats)
            if (id) {
                const p = await fetchProductDetail(id)
                setForm({
                    name: p.name || '',
                    price: String(p.price || ''),
                    description: p.description || '',
                    category: p.category?._id || '',
                    colors: (p.colors || []).join(','),
                    sizes: (p.sizes || []).join(','),
                    stock: String(p.stock?.quantity || '0'),
                })
            }
        }
        load()
    }, [id])

    const onSubmit = async () => {
        try {
            setLoading(true)
            const body: any = {
                name: form.name,
                price: Number(form.price) || 0,
                description: form.description,
                colors: form.colors ? String(form.colors).split(',').map((s: string) => s.trim()).filter(Boolean) : [],
                sizes: form.sizes ? String(form.sizes).split(',').map((s: string) => s.trim()).filter(Boolean) : [],
                stock: { quantity: Number(form.stock) || 0 },
            }

            // Chỉ thêm category nếu có giá trị
            if (form.category) {
                body.category = form.category
            }

            if (isEdit) {
                await adminApi.updateProduct(id!, body)
            } else {
                await adminApi.createProduct(body)
            }

            Alert.alert('Thành công', isEdit ? 'Đã cập nhật sản phẩm' : 'Đã tạo sản phẩm', [
                { text: 'OK', onPress: () => router.replace('/admin/products') }
            ])
        } catch (e: any) {
            console.error('Save product error:', e)
            const errorMsg = e?.response?.data?.message || e?.message || 'Không thể lưu sản phẩm'
            Alert.alert('Lỗi', errorMsg)
        } finally { setLoading(false) }
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
            <View style={{ marginTop: 12 }}>
                <ThemedText style={styles.title}>{isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</ThemedText>
            </View>
            <TextInput placeholder="Tên sản phẩm" style={styles.input} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
            <TextInput placeholder="Giá" keyboardType="numeric" style={styles.input} value={form.price} onChangeText={(v) => setForm({ ...form, price: v })} />
            <TextInput placeholder="Mô tả" multiline numberOfLines={4} style={[styles.input, { height: 100 }]} value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} />
            <TextInput placeholder="Danh mục (ID)" style={styles.input} value={form.category} onChangeText={(v) => setForm({ ...form, category: v })} />
            <TextInput placeholder="Màu (ngăn bởi dấu phẩy)" style={styles.input} value={form.colors} onChangeText={(v) => setForm({ ...form, colors: v })} />
            <TextInput placeholder="Size (ngăn bởi dấu phẩy)" style={styles.input} value={form.sizes} onChangeText={(v) => setForm({ ...form, sizes: v })} />
            <TextInput placeholder="Tồn kho" keyboardType="numeric" style={styles.input} value={form.stock} onChangeText={(v) => setForm({ ...form, stock: v })} />
            <TouchableOpacity style={[styles.primaryBtn, loading && { opacity: 0.6 }]} onPress={onSubmit} disabled={loading}>
                <ThemedText style={styles.primaryText}>{loading ? 'Đang lưu...' : (isEdit ? 'Lưu' : 'Tạo')}</ThemedText>
            </TouchableOpacity>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    title: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
    input: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 10, marginBottom: 10, backgroundColor: '#fff' },
    primaryBtn: { backgroundColor: '#000', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 14, alignItems: 'center' },
    primaryText: { color: '#fff', fontWeight: '700' },
})



