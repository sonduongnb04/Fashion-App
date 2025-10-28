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

    const load = async () => {
        try {
            setLoading(true)
            const [list, cats] = await Promise.all([
                fetchProducts({ q: keyword, limit: 100 }),
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

    useEffect(() => { load() }, [])

    const onDelete = async (id: string) => {
        Alert.alert('Xóa sản phẩm', 'Bạn có chắc muốn xóa sản phẩm này?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa', style: 'destructive', onPress: async () => {
                    try {
                        await adminApi.deleteProduct(id)
                        load()
                    } catch (e) {
                        Alert.alert('Lỗi', 'Không thể xóa sản phẩm')
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
                    <ThemedText style={styles.backText}>{'<'} Trang chính</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/admin/product-edit')}>
                    <ThemedText style={styles.primaryText}>+ Thêm sản phẩm</ThemedText>
                </TouchableOpacity>
            </View>
            <View style={styles.metaRow}>
                <ThemedText style={styles.countText}>Số sản phẩm: {products.length}</ThemedText>
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
                                <TouchableOpacity style={[styles.btn, styles.danger]} onPress={() => onDelete(item._id)}>
                                    <ThemedText style={{ color: '#fff' }}>Xóa</ThemedText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            />
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
    cardRow: { backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#eee', marginBottom: 10, flexDirection: 'row', gap: 12, alignItems: 'center' },
    thumb: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#f0f0f0' },
    name: { fontWeight: '700', marginBottom: 6 },
    stock: { color: '#666', fontSize: 12, marginBottom: 4 },
    row: { flexDirection: 'row', gap: 8, marginTop: 8 },
    btn: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8 },
    danger: { backgroundColor: '#FF3B30', borderColor: '#FF3B30' },
})



