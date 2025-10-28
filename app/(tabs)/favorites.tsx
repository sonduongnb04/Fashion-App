import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { getImageURL } from '@/services/api'
import { addToCart, getFavorites, removeFromFavorites } from '@/services/user'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Alert, FlatList, Image, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native'

export default function FavoritesScreen() {
    const router = useRouter()
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        loadFavorites()
    }, [])

    const loadFavorites = async () => {
        try {
            setLoading(true)
            const favorites = await getFavorites()
            console.log('❤️ Favorites loaded:', favorites.length)
            setItems(favorites)
        } catch (error) {
            console.error('Error loading favorites:', error)
            Alert.alert('Lỗi', 'Không thể tải danh sách yêu thích')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const onRefresh = () => {
        setRefreshing(true)
        loadFavorites()
    }

    const handleAddToCart = async (item: any) => {
        try {
            console.log('➕ Adding to cart:', item.name)
            await addToCart(item, 1)
            Alert.alert('Thành công', 'Đã thêm vào giỏ hàng!', [
                { text: 'OK' },
                { text: 'Xem giỏ hàng', onPress: () => router.push('/(tabs)/cart') }
            ])
        } catch (error) {
            console.error('Error adding to cart:', error)
            Alert.alert('Lỗi', 'Không thể thêm vào giỏ hàng')
        }
    }

    const handleRemove = async (item: any) => {
        Alert.alert(
            'Xác nhận',
            'Bạn có chắc muốn xóa sản phẩm này khỏi yêu thích?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            console.log('💔 Removing from favorites:', item._id)
                            await removeFromFavorites(item._id)
                            Alert.alert('Thành công', 'Đã xóa khỏi yêu thích')
                            await loadFavorites() // Refresh list
                        } catch (error) {
                            console.error('Error removing from favorites:', error)
                            Alert.alert('Lỗi', 'Không thể xóa khỏi yêu thích')
                        }
                    }
                }
            ]
        )
    }

    if (loading) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText>Đang tải yêu thích...</ThemedText>
            </ThemedView>
        )
    }

    console.log('📌 Rendering Favorites Screen with', items.length, 'items')

    return (
        <ThemedView style={styles.container}>
            <FlatList
                data={items}
                keyExtractor={(item) => item._id}
                scrollEnabled={true}
                nestedScrollEnabled={true}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                renderItem={({ item }) => (
                    <View style={styles.favoriteItem}>
                        <TouchableOpacity
                            style={styles.itemContent}
                            onPress={() => router.push(`/(tabs)/products/${item.slug || item._id}`)}
                        >
                            <Image
                                source={{ uri: getImageURL(item.mainImage?.url || item.images?.[0]?.url) }}
                                style={styles.image}
                            />
                            <View style={styles.itemInfo}>
                                <ThemedText style={styles.productName} numberOfLines={2}>
                                    {item.name}
                                </ThemedText>
                                <ThemedText style={styles.price}>
                                    {Intl.NumberFormat('vi-VN').format(item.discountPrice ?? item.price)}₫
                                </ThemedText>
                                {item.rating && (
                                    <ThemedText style={styles.rating}>
                                        ⭐ {item.rating.average || 0} | 📦 {item.sales || 0} bán
                                    </ThemedText>
                                )}
                            </View>
                        </TouchableOpacity>
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={() => handleAddToCart(item)}
                            >
                                <ThemedText style={styles.actionBtnText}>🛒 Giỏ</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.removeBtn]}
                                onPress={() => handleRemove(item)}
                            >
                                <ThemedText style={styles.removeBtnText}>❌</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <ThemedText style={styles.emptyIcon}>❤️</ThemedText>
                        <ThemedText style={styles.emptyText}>Chưa có sản phẩm yêu thích</ThemedText>
                        <TouchableOpacity
                            style={styles.shopButton}
                            onPress={() => router.push('/(tabs)/categories' as any)}
                        >
                            <ThemedText style={styles.shopButtonText}>Khám phá sản phẩm</ThemedText>
                        </TouchableOpacity>
                    </View>
                }
                removeClippedSubviews={false}
                maxToRenderPerBatch={10}
                updateCellsBatchingPeriod={50}
            />
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    favoriteItem: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    itemContent: { flex: 1, flexDirection: 'row' },
    image: { width: 100, height: 100 },
    itemInfo: { flex: 1, padding: 12 },
    productName: { fontWeight: '600', marginBottom: 4 },
    price: { color: '#FF4500', fontWeight: 'bold', marginBottom: 4 },
    rating: { fontSize: 12, color: '#666' },
    actions: { flexDirection: 'row', padding: 8, gap: 8, alignItems: 'center' },
    actionBtn: {
        backgroundColor: '#FF4500',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        alignItems: 'center',
    },
    actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    removeBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
    removeBtnText: { fontSize: 14 },
    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyIcon: { fontSize: 80, marginBottom: 16 },
    emptyText: { fontSize: 16, marginBottom: 24 },
    shopButton: { backgroundColor: '#FF4500', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 },
    shopButtonText: { color: '#fff', fontWeight: '600' },
})


