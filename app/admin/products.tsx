import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { adminApi, fetchCategories, fetchProducts, getImageURL, type Category, type Product } from '@/services/api'
import { useNavigation } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native'

export default function AdminProductsScreen() {
    const router = useRouter()
    const navigation = useNavigation()
    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [keyword, setKeyword] = useState('')
    const [activeCategoryId, setActiveCategoryId] = useState<string | 'all'>('all')
    const [statusFilter, setStatusFilter] = useState<'all' | 'trash' | 'active'>('active')

    const load = async () => {
        try {
            setLoading(true)
            const [list, cats] = await Promise.all([
                fetchProducts({
                    q: keyword,
                    limit: 100,
                    category: activeCategoryId === 'all' ? undefined : activeCategoryId,
                    isActive: statusFilter === 'all' ? 'all' : statusFilter === 'trash' ? 'false' : 'true'
                }),
                fetchCategories(),
            ])
            setProducts(list)
            setCategories(cats)
        } catch (e) {
            console.error('Load admin products error:', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [activeCategoryId, statusFilter])

    const onDelete = async (id: string) => {
        Alert.alert('Xóa sản phẩm', 'Bạn có chắc muốn xóa sản phẩm này?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa', style: 'destructive', onPress: async () => {
                    try {
                        await adminApi.deleteProduct(id)
                        load()
                    } catch (e: any) {
                        const msg = e?.response?.data?.message || e?.message || 'Không thể xóa sản phẩm'
                        Alert.alert('Lỗi', msg)
                    }
                }
            }
        ])
    }

    if (loading) return (
        <ThemedView style={styles.container}>
            <ActivityIndicator color="#FF4500" />
        </ThemedView>
    )

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => {
                    try {
                        if (navigation && navigation.canGoBack && navigation.canGoBack()) {
                            navigation.goBack()
                        } else {
                            router.replace('/admin' as any)
                        }
                    } catch {
                        router.replace('/admin' as any)
                    }
                }}>
                    <ThemedText style={styles.backText}>{'<'} Trở về</ThemedText>
                </TouchableOpacity>
            </View>
            <View style={styles.metaRow}>
                <ThemedText style={styles.countText}>Số sản phẩm: {products.length}</ThemedText>
            </View>
            {/* Lọc trạng thái */}
            <View style={styles.statusRow}>
                <TouchableOpacity onPress={() => setStatusFilter('active')} style={[styles.catChip, statusFilter === 'active' && styles.catChipActive]}>
                    <ThemedText style={[styles.catText, statusFilter === 'active' && styles.catTextActive]}>Đang bán</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStatusFilter('all')} style={[styles.catChip, statusFilter === 'all' && styles.catChipActive]}>
                    <ThemedText style={[styles.catText, statusFilter === 'all' && styles.catTextActive]}>Tất cả</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStatusFilter('trash')} style={[styles.catChip, statusFilter === 'trash' && styles.catChipActive]}>
                    <ThemedText style={[styles.catText, statusFilter === 'trash' && styles.catTextActive]}>Thùng rác</ThemedText>
                </TouchableOpacity>
            </View>
            {/* Bộ lọc theo danh mục */}
            <View style={styles.catRow}>
                <TouchableOpacity
                    onPress={() => setActiveCategoryId('all')}
                    style={[styles.catChip, activeCategoryId === 'all' && styles.catChipActive]}
                >
                    <ThemedText style={[styles.catText, activeCategoryId === 'all' && styles.catTextActive]}>Tất cả</ThemedText>
                </TouchableOpacity>
                {categories.map((c) => (
                    <TouchableOpacity
                        key={c._id}
                        onPress={() => setActiveCategoryId(c._id)}
                        style={[styles.catChip, activeCategoryId === c._id && styles.catChipActive]}
                    >
                        <ThemedText style={[styles.catText, activeCategoryId === c._id && styles.catTextActive]}>{c.name}</ThemedText>
                    </TouchableOpacity>
                ))}
            </View>
            <FlatList
                data={products}
                keyExtractor={(i) => i._id}
                renderItem={({ item }) => (
                    <View style={styles.cardRow}>
                        <Image
                            source={{ uri: getImageURL(item.mainImage?.url || item.images?.[0]?.url) }}
                            style={styles.thumb}
                        />
                        <View style={{ flex: 1 }}>
                            <ThemedText style={styles.name}>{item.name}</ThemedText>
                            <ThemedText>{Intl.NumberFormat('vi-VN').format(item.price)}₫</ThemedText>
                            <ThemedText style={styles.stock}>Tồn kho: {item.stock?.quantity || 0}</ThemedText>
                            <View style={styles.row}>
                                <TouchableOpacity style={styles.btn} onPress={() => router.push({ pathname: '/admin/product-edit', params: { id: item._id } })}>
                                    <ThemedText>Sửa</ThemedText>
                                </TouchableOpacity>
                                {(item as any).isActive !== false ? (
                                    <TouchableOpacity style={[styles.btn, styles.danger]} onPress={async () => {
                                        try {
                                            await adminApi.toggleProductStatus(item._id)
                                            load()
                                        } catch (e) { Alert.alert('Lỗi', 'Không thể đưa vào thùng rác') }
                                    }}>
                                        <ThemedText style={{ color: '#fff' }}>Xóa</ThemedText>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity style={[styles.btn, { backgroundColor: '#0A66C2', borderColor: '#0A66C2' }]} onPress={async () => {
                                        try {
                                            await adminApi.toggleProductStatus(item._id)
                                            load()
                                        } catch (e) { Alert.alert('Lỗi', 'Không thể khôi phục') }
                                    }}>
                                        <ThemedText style={{ color: '#fff' }}>Khôi phục</ThemedText>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>
                )}
            />

            {/* Floating add button to avoid touch conflicts */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => {
                    console.log('🧭 FAB -> /admin/product-edit, cat:', activeCategoryId)
                    if (activeCategoryId === 'all') {
                        router.push('/admin/product-edit' as any)
                    } else {
                        router.push({ pathname: '/admin/product-edit', params: { cat: String(activeCategoryId) } } as any)
                    }
                }}
            >
                <ThemedText style={styles.fabText}>+ Thêm sản phẩm</ThemedText>
            </TouchableOpacity>
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 12 },
    backText: { color: '#0A66C2', fontWeight: '700' },
    primaryBtn: { backgroundColor: '#000', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
    primaryText: { color: '#fff', fontWeight: '700' },
    metaRow: { marginBottom: 10 },
    countText: { color: '#666', fontWeight: '600' },
    statusRow: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
    catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    catChip: { borderWidth: 1, borderColor: '#ddd', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fff' },
    catChipActive: { backgroundColor: '#000', borderColor: '#000' },
    catText: { color: '#333', fontWeight: '600' },
    catTextActive: { color: '#fff' },
    cardRow: { backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#eee', marginBottom: 10, flexDirection: 'row', gap: 12, alignItems: 'center' },
    thumb: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#f0f0f0' },
    name: { fontWeight: '700', marginBottom: 6 },
    stock: { color: '#666', fontSize: 12, marginBottom: 4 },
    row: { flexDirection: 'row', gap: 8, marginTop: 8 },
    btn: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8 },
    danger: { backgroundColor: '#FF3B30', borderColor: '#FF3B30' },
    fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#000', borderRadius: 24, paddingHorizontal: 14, paddingVertical: 12, elevation: 4 },
    fabText: { color: '#fff', fontWeight: '700' },
})



