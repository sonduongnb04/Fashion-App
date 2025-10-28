import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { fetchProductDetail, getImageURL } from '@/services/api'
import { addToCart, getFavorites, toggleFavorite } from '@/services/user'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Alert, Dimensions, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'

const { width } = Dimensions.get('window')

export default function ProductDetailScreen() {
    const { identifier } = useLocalSearchParams<{ identifier: string }>()
    const router = useRouter()
    const [product, setProduct] = useState<any>(null)
    const [selectedImage, setSelectedImage] = useState<number>(0)
    const [selectedColor, setSelectedColor] = useState<string>('')
    const [selectedSize, setSelectedSize] = useState<string>('')
    const [quantity, setQuantity] = useState<number>(1)
    const [loading, setLoading] = useState(true)
    const [isFavorite, setIsFavorite] = useState<boolean>(false)

    useEffect(() => {
        if (identifier) {
            loadProductData()
        }
    }, [identifier])

    const loadProductData = async () => {
        try {
            setLoading(true)

            // Fetch product
            const data = await fetchProductDetail(identifier as string)
            setProduct(data)

            // Check if product is in favorites
            const favorites = await getFavorites()
            setIsFavorite(favorites.some(f => f._id === data._id))

            // Set default selections
            if (data?.colors && data.colors.length > 0) setSelectedColor(data.colors[0])
            if (data?.sizes && data.sizes.length > 0) setSelectedSize(data.sizes[0])
        } catch (error) {
            console.error('Error loading product:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleToggleFavorite = async () => {
        if (!product) return
        try {
            const added = await toggleFavorite(product)
            setIsFavorite(added)
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

    const handleAddToCart = async () => {
        if (!product) return
        try {
            await addToCart(product, quantity, {
                color: selectedColor,
                size: selectedSize
            })
            Alert.alert(
                '✓ Thành công',
                `Đã thêm ${quantity} "${product.name}" vào giỏ hàng`,
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

    if (loading) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText>Đang tải sản phẩm...</ThemedText>
            </ThemedView>
        )
    }

    if (!product) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText>Sản phẩm không tồn tại</ThemedText>
            </ThemedView>
        )
    }

    const allImages = product.mainImage
        ? [product.mainImage, ...(product.images || [])]
        : product.images || []

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Image Gallery */}
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: getImageURL(allImages[selectedImage]?.url) }}
                    style={styles.mainImage}
                />
                {allImages.length > 1 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.thumbnailScroll}
                    >
                        {allImages.map((img: any, idx: number) => (
                            <TouchableOpacity
                                key={idx}
                                onPress={() => setSelectedImage(idx)}
                                style={[
                                    styles.thumbnail,
                                    selectedImage === idx && styles.thumbnailActive
                                ]}
                            >
                                <Image
                                    source={{ uri: getImageURL(img?.url) }}
                                    style={styles.thumbnailImage}
                                />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>

            {/* Product Info */}
            <View style={styles.info}>
                <ThemedText style={styles.productName}>{product.name}</ThemedText>

                {/* Price */}
                <View style={styles.priceContainer}>
                    {product.discountPrice ? (
                        <>
                            <ThemedText style={styles.discountPrice}>
                                {Intl.NumberFormat('vi-VN').format(product.discountPrice)}₫
                            </ThemedText>
                            <ThemedText style={styles.originalPrice}>
                                {Intl.NumberFormat('vi-VN').format(product.price)}₫
                            </ThemedText>
                        </>
                    ) : (
                        <ThemedText style={styles.price}>
                            {Intl.NumberFormat('vi-VN').format(product.price)}₫
                        </ThemedText>
                    )}
                </View>

                {/* Rating */}
                {product.rating && (
                    <ThemedText style={styles.rating}>
                        ⭐ {product.rating.average || 0} | 📦 {product.sales || 0} bán
                    </ThemedText>
                )}

                {/* Colors */}
                {product.colors && product.colors.length > 0 && (
                    <View style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>Màu sắc</ThemedText>
                        <View style={styles.optionsRow}>
                            {product.colors.map((color: string) => (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.option,
                                        selectedColor === color && styles.optionActive
                                    ]}
                                    onPress={() => setSelectedColor(color)}
                                >
                                    <ThemedText style={styles.optionText}>{color}</ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Sizes */}
                {product.sizes && product.sizes.length > 0 && (
                    <View style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>Kích cỡ</ThemedText>
                        <View style={styles.optionsRow}>
                            {product.sizes.map((size: string) => (
                                <TouchableOpacity
                                    key={size}
                                    style={[
                                        styles.option,
                                        selectedSize === size && styles.optionActive
                                    ]}
                                    onPress={() => setSelectedSize(size)}
                                >
                                    <ThemedText style={styles.optionText}>{size}</ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Quantity */}
                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Số lượng</ThemedText>
                    <View style={styles.quantityControl}>
                        <TouchableOpacity
                            style={styles.quantityBtn}
                            onPress={() => quantity > 1 && setQuantity(quantity - 1)}
                        >
                            <ThemedText style={styles.quantityBtnText}>−</ThemedText>
                        </TouchableOpacity>
                        <ThemedText style={styles.quantityValue}>{quantity}</ThemedText>
                        <TouchableOpacity
                            style={styles.quantityBtn}
                            onPress={() => setQuantity(quantity + 1)}
                        >
                            <ThemedText style={styles.quantityBtnText}>+</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Description */}
                {product.description && (
                    <View style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>Mô tả</ThemedText>
                        <ThemedText style={styles.description}>{product.description}</ThemedText>
                    </View>
                )}

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                        {product.tags.map((tag: string) => (
                            <View key={tag} style={styles.tag}>
                                <ThemedText style={styles.tagText}>#{tag}</ThemedText>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={handleToggleFavorite}
                >
                    <ThemedText style={styles.favoriteButtonText}>
                        {isFavorite ? '❤️ Yêu thích' : '🤍 Yêu thích'}
                    </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.addToCartButton}
                    onPress={handleAddToCart}
                >
                    <ThemedText style={styles.addToCartButtonText}>Thêm vào giỏ hàng</ThemedText>
                </TouchableOpacity>
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: { paddingBottom: 100 },
    imageContainer: { width, backgroundColor: '#f0f0f0' },
    mainImage: { width: '100%', height: 300, backgroundColor: '#f0f0f0' },
    thumbnailScroll: { paddingHorizontal: 16, paddingVertical: 8 },
    thumbnail: { marginRight: 8, borderRadius: 8, overflow: 'hidden' },
    thumbnailActive: { borderWidth: 2, borderColor: '#FF4500' },
    thumbnailImage: { width: 70, height: 70 },
    info: { padding: 16 },
    productName: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
    priceContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    price: { fontSize: 18, fontWeight: '700', color: '#FF4500' },
    discountPrice: { fontSize: 18, fontWeight: '700', color: '#FF4500' },
    originalPrice: { fontSize: 14, color: '#999', textDecorationLine: 'line-through' },
    rating: { fontSize: 14, color: '#666', marginBottom: 16 },
    section: { marginBottom: 16 },
    sectionTitle: { fontWeight: '600', marginBottom: 8 },
    optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    option: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#ddd', borderRadius: 6 },
    optionActive: { borderColor: '#FF4500', backgroundColor: '#FF4500' },
    optionText: { fontSize: 13 },
    quantityControl: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12 },
    quantityBtn: { width: 36, height: 36, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
    quantityBtnText: { fontSize: 18, fontWeight: 'bold' },
    quantityValue: { minWidth: 40, textAlign: 'center', fontWeight: '600' },
    description: { fontSize: 14, color: '#666', lineHeight: 20 },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: { backgroundColor: '#f0f0f0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
    tagText: { fontSize: 12, color: '#666' },
    actionButtons: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff' },
    favoriteButton: { flex: 1, backgroundColor: '#fff', paddingVertical: 14, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#FF4500' },
    favoriteButtonText: { color: '#FF4500', fontWeight: '600', fontSize: 16 },
    addToCartButton: { flex: 2, backgroundColor: '#FF4500', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
    addToCartButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
})
