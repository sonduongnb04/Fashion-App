import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { fetchCategories, fetchProducts, getImageURL } from '@/services/api'
import { addToCart, getFavorites, toggleFavorite } from '@/services/user'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Alert, FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native'

export default function CategoriesScreen() {
    const [categories, setCategories] = useState<any[]>([])
    const [products, setProducts] = useState<any[]>([])
    const [selected, setSelected] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [favorites, setFavorites] = useState<any[]>([])
    const router = useRouter()
    const params = useLocalSearchParams<{ categoryId?: string; categoryName?: string; hasDiscount?: string }>()

    useEffect(() => {
        loadInitialData()
    }, [])

    useEffect(() => {
        // Nếu có categoryId từ navigation params, tự động filter
        if (params.categoryId && categories.length > 0) {
            console.log('🎯 Auto-filtering category:', params.categoryName, params.categoryId)
            onCategoryPress(params.categoryId)
        }
        // Nếu từ banner khuyến mãi chuyển sang
        if (params.hasDiscount === 'true') {
            console.log('🎯 Showing discounted products only')
            onShowDiscountOnly()
        }
    }, [params.categoryId, categories])

    const refreshFavorites = async () => {
        try {
            const faves = await getFavorites()
            console.log('❤️ Refreshed favorites:', faves.length)
            setFavorites(faves)
        } catch (error) {
            console.error('Error refreshing favorites:', error)
        }
    }

    const loadInitialData = async () => {
        setLoading(true)
        try {
            const cats = await fetchCategories()
            console.log('📂 Loaded categories:', cats.length)
            setCategories(cats)

            const prods = await fetchProducts({ limit: 200 })
            console.log('📦 Loaded products:', prods.length)
            setProducts(prods)

            await refreshFavorites()
        } catch (error) {
            console.error('Error loading initial data:', error)
        } finally {
            setLoading(false)
        }
    }

    const onCategoryPress = async (catId: string) => {
        console.log('🔍 Filtering by category:', catId)
        setSelected(catId)
        setLoading(true)
        try {
            const list = await fetchProducts({ category: catId, limit: 200 })
            console.log('📦 Filtered products:', list.length, 'for category:', catId)
            setProducts(list)
        } catch (error) {
            console.error('Error filtering products:', error)
        } finally {
            setLoading(false)
        }
    }

    const onShowDiscountOnly = async () => {
        console.log('🔍 Filtering discounted products')
        setSelected(null)
        setLoading(true)
        try {
            const list = await fetchProducts({ hasDiscount: true, limit: 200 })
            console.log('📦 Discounted products:', list.length)
            setProducts(list)
        } catch (error) {
            console.error('Error fetching discounted products:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddToCart = async (product: any) => {
        try {
            console.log('➕ Adding to cart:', product.name)
            await addToCart(product, 1)
            Alert.alert(
                '✓ Thành công',
                `Đã thêm "${product.name}" vào giỏ hàng`,
                [
                    { text: 'Tiếp tục mua', style: 'cancel' },
                    { text: 'Xem giỏ hàng', onPress: () => router.push('/(tabs)/cart' as any) }
                ]
            )
        } catch (error) {
            console.error('Error adding to cart:', error)
            Alert.alert('Lỗi', 'Không thể thêm sản phẩm vào giỏ hàng')
        }
    }

    const handleToggleFavorite = async (product: any) => {
        try {
            console.log('💓 Toggling favorite:', product.name, product._id)
            const added = await toggleFavorite(product)
            await refreshFavorites()
            Alert.alert(
                added ? '❤️ Đã thêm' : '💔 Đã xóa',
                added
                    ? `Đã thêm "${product.name}" vào yêu thích`
                    : `Đã xóa "${product.name}" khỏi yêu thích`,
                [
                    { text: 'OK' },
                    added && { text: 'Xem yêu thích', onPress: () => router.push('/(tabs)/favorites' as any) }
                ].filter(Boolean) as any
            )
        } catch (error) {
            console.error('Error toggling favorite:', error)
            Alert.alert('Lỗi', 'Không thể thêm/xóa yêu thích')
        }
    }

    return (
        <ThemedView style={styles.container}>
            <View style={styles.categoryContainer}>
                {categories.map((item) => (
                    <TouchableOpacity
                        key={item._id}
                        style={[styles.cat, selected === item._id && styles.catActive]}
                        onPress={() => onCategoryPress(item._id)}
                    >
                        <Image
                            source={{ uri: getImageURL(item.image?.url || item.image) }}
                            style={[styles.catImg, selected === item._id && styles.catImgActive]}
                        />
                        <ThemedText
                            style={[
                                styles.catName,
                                selected === item._id && styles.catNameActive,
                            ]}
                            numberOfLines={2}
                        >
                            {item.name}
                        </ThemedText>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ThemedText>Đang tải sản phẩm...</ThemedText>
                </View>
            ) : products.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <ThemedText>Không có sản phẩm nào</ThemedText>
                </View>
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={(p) => p._id}
                    numColumns={2}
                    columnWrapperStyle={{ gap: 12 }}
                    contentContainerStyle={{ gap: 12, paddingTop: 8 }}
                    scrollEnabled={true}
                    removeClippedSubviews={false}
                    maxToRenderPerBatch={10}
                    updateCellsBatchingPeriod={50}
                    renderItem={({ item }) => {
                        const imageUrl = getImageURL(item.mainImage?.url || item.images?.[0]?.url)
                        const isFavorite = favorites.some(fav => fav._id === item._id)

                        return (
                            <View style={styles.card}>
                                <TouchableOpacity
                                    style={styles.cardTouchable}
                                    onPress={() => router.push(`/(tabs)/products/${item.slug || item._id}`)}
                                >
                                    <Image
                                        source={{ uri: imageUrl }}
                                        style={styles.image}
                                        resizeMode="cover"
                                        onError={(e) => console.log('Image load error:', imageUrl, e.nativeEvent.error)}
                                    />
                                    <View style={styles.cardInfo}>
                                        <ThemedText numberOfLines={2} style={styles.productName}>
                                            {item.name}
                                        </ThemedText>
                                        <ThemedText style={styles.price}>
                                            {Intl.NumberFormat('vi-VN').format(item.discountPrice ?? item.price)}₫
                                        </ThemedText>
                                    </View>
                                </TouchableOpacity>

                                {/* Favorite Button */}
                                <TouchableOpacity
                                    style={styles.favoriteBtn}
                                    onPress={() => handleToggleFavorite(item)}
                                >
                                    <ThemedText style={styles.favoriteIcon}>
                                        {isFavorite ? '❤️' : '🤍'}
                                    </ThemedText>
                                </TouchableOpacity>

                                {/* Cart Button */}
                                <TouchableOpacity
                                    style={styles.addToCartBtn}
                                    onPress={() => handleAddToCart(item)}
                                >
                                    <ThemedText style={styles.addToCartIcon}>🛒</ThemedText>
                                </TouchableOpacity>
                            </View>
                        )
                    }}
                />
            )}
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
    categoryContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        height: 140,
        justifyContent: 'space-around',
    },
    cat: { flex: 1, alignItems: 'center', marginHorizontal: 4 },
    catActive: {},
    catImg: { width: 70, height: 70, borderRadius: 50, marginBottom: 6 },
    catImgActive: { borderWidth: 3, borderColor: '#FF4500' },
    catName: { fontSize: 12, textAlign: 'center', marginBottom: 4 },
    catNameActive: { fontWeight: 'bold', color: '#FF4500' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { flex: 1, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
    cardTouchable: { flex: 1 },
    image: { width: '100%', height: 140, backgroundColor: '#f0f0f0' },
    cardInfo: { padding: 8, paddingBottom: 42 },
    productName: { fontWeight: '600', fontSize: 13, marginBottom: 4 },
    price: { color: '#FF4500', fontWeight: 'bold', fontSize: 14 },
    favoriteBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#fff',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    favoriteIcon: { fontSize: 20 },
    addToCartBtn: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: '#FF4500',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    addToCartIcon: { fontSize: 18, color: '#fff' },
})


