
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { fetchCategories, fetchProducts, getImageURL, type Category, type Product } from '@/services/api';

export default function HomeScreen() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [discountedProducts, setDiscountedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // Fetch categories
            const categoriesData = await fetchCategories();
            setCategories(categoriesData);

            // Fetch featured products (isFeatured: true)
            const featured = await fetchProducts({ isFeatured: true, limit: 20 });
            setFeaturedProducts(featured);

            // Fetch discounted products (có discount > 0)
            const discounted = await fetchProducts({ hasDiscount: true, limit: 20 });
            setDiscountedProducts(discounted);

        } catch (error) {
            console.error('Error loading home data:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderCategoryItem = ({ item }: { item: Category }) => (
        <TouchableOpacity
            style={styles.categoryItem}
            onPress={() => {
                // Navigate với category ID để filter
                router.push({
                    pathname: '/(tabs)/categories',
                    params: { categoryId: item._id, categoryName: item.name }
                } as any);
            }}
        >
            <View style={styles.categoryImageContainer}>
                <Image source={{ uri: getImageURL(item.image?.url) }} style={styles.categoryImage} />
            </View>
            <ThemedText style={styles.categoryName}>{item.name}</ThemedText>
        </TouchableOpacity>
    );

    const renderProductItem = ({ item }: { item: Product }) => {
        // Lấy ảnh chính từ images array hoặc mainImage
        const mainImage = item.images?.[0]?.url || item.mainImage?.url || '';

        return (
            <TouchableOpacity
                style={styles.productItem}
                onPress={() => {
                    // Navigate đến màn chi tiết sản phẩm với slug hoặc _id
                    const identifier = item.slug || item._id;
                    router.push(`/(tabs)/products/${identifier}` as any);
                }}
            >
                <Image
                    source={{ uri: getImageURL(mainImage) }}
                    style={styles.productImage}
                    defaultSource={require('@/assets/images/icon.png')}
                />
                <ThemedView style={styles.productInfo}>
                    <ThemedText style={styles.productName} numberOfLines={2}>
                        {item.name}
                    </ThemedText>
                    <ThemedText style={styles.productPrice}>
                        {Intl.NumberFormat('vi-VN').format(item.price)}₫
                    </ThemedText>
                </ThemedView>
            </TouchableOpacity>
        );
    };

    const renderDiscountedProductItem = ({ item }: { item: Product }) => {
        // Lấy ảnh chính
        const mainImage = item.images?.[0]?.url || item.mainImage?.url || '';

        // Tính giá sau giảm và % giảm
        const discountPercent = item.discount || 0;
        const finalPrice = item.price;
        const originalPrice = item.originalPrice || item.price;

        return (
            <TouchableOpacity
                style={styles.discountedProductItem}
                onPress={() => {
                    // Navigate đến màn chi tiết sản phẩm
                    const identifier = item.slug || item._id;
                    router.push(`/(tabs)/products/${identifier}` as any);
                }}
            >
                <View style={styles.discountedProductImageContainer}>
                    <Image
                        source={{ uri: getImageURL(mainImage) }}
                        style={styles.discountedProductImage}
                        defaultSource={require('@/assets/images/icon.png')}
                    />
                    {discountPercent > 0 && (
                        <View style={styles.discountBadge}>
                            <ThemedText style={styles.discountBadgeText}>-{discountPercent}%</ThemedText>
                        </View>
                    )}
                </View>
                <ThemedView style={styles.discountedProductInfo}>
                    <ThemedText style={styles.discountedProductName} numberOfLines={2}>
                        {item.name}
                    </ThemedText>
                    <View style={styles.discountedPriceContainer}>
                        <ThemedText style={styles.discountedPrice}>
                            {Intl.NumberFormat('vi-VN').format(finalPrice)}₫
                        </ThemedText>
                        {originalPrice > finalPrice && (
                            <ThemedText style={styles.originalPrice}>
                                {Intl.NumberFormat('vi-VN').format(originalPrice)}₫
                            </ThemedText>
                        )}
                    </View>
                </ThemedView>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <ThemedView style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#FF4500" />
                <ThemedText style={{ marginTop: 16 }}>Đang tải dữ liệu...</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Banner */}
            <ThemedView style={styles.banner}>
                <Image
                    source={require('@/assets/images/ao/ao-khoac-flanel3.jpg')}
                    style={styles.bannerImage}
                />
                <View style={styles.bannerOverlay} />
                <View style={styles.bannerGradient} />
                <ThemedView style={styles.bannerContent}>
                    <ThemedText type="title" style={styles.bannerTitle}>THỜI TRANG MỚI</ThemedText>
                    <ThemedText style={styles.bannerSubtitle}>Khám phá bộ sưu tập mới nhất</ThemedText>
                    <TouchableOpacity style={styles.bannerButton} onPress={() => router.push('/(tabs)/categories' as any)}>
                        <ThemedText style={styles.bannerButtonText}>Mua ngay</ThemedText>
                    </TouchableOpacity>
                </ThemedView>
            </ThemedView>

            {/* Danh mục sản phẩm */}
            <ThemedView style={styles.section}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>Danh mục</ThemedText>
                {categories.length > 0 ? (
                    <FlatList
                        data={categories}
                        renderItem={renderCategoryItem}
                        keyExtractor={(item) => item._id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesList}
                    />
                ) : (
                    <ThemedText style={styles.emptyText}>Không có danh mục</ThemedText>
                )}
            </ThemedView>

            {/* Sản phẩm nổi bật */}
            <ThemedView style={styles.section}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>Sản phẩm nổi bật</ThemedText>
                {featuredProducts.length > 0 ? (
                    <FlatList
                        data={featuredProducts}
                        renderItem={renderProductItem}
                        keyExtractor={(item) => item._id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.productsList}
                    />
                ) : (
                    <ThemedText style={styles.emptyText}>Chưa có sản phẩm nổi bật</ThemedText>
                )}
            </ThemedView>

            {/* Khuyến mãi */}
            <ThemedView style={[styles.section, styles.promoSection]}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>Khuyến mãi đặc biệt</ThemedText>
                <ThemedView style={styles.promoCard}>
                    <ThemedText style={styles.promoTitle}>GIẢM 30%</ThemedText>
                    <ThemedText style={styles.promoDesc}>Cho tất cả sản phẩm mới</ThemedText>
                    <TouchableOpacity
                        style={styles.promoButton}
                        onPress={() => router.push({
                            pathname: '/(tabs)/categories',
                            params: { hasDiscount: 'true' }
                        } as any)}
                    >
                        <ThemedText style={styles.promoButtonText}>Xem ngay</ThemedText>
                    </TouchableOpacity>
                </ThemedView>

                {/* Danh sách sản phẩm khuyến mãi */}
                {discountedProducts.length > 0 ? (
                    <FlatList
                        data={discountedProducts}
                        renderItem={renderDiscountedProductItem}
                        keyExtractor={(item) => item._id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.discountedProductsList}
                    />
                ) : (
                    <ThemedText style={styles.emptyText}>Chưa có sản phẩm khuyến mãi</ThemedText>
                )}
            </ThemedView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 14,
        padding: 20,
    },
    banner: {
        height: 220,
        position: 'relative',
        marginBottom: 20,
        borderRadius: 0,
        overflow: 'hidden',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    bannerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    bannerGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '70%',
        backgroundColor: 'rgba(0,0,0,0.35)'
    },
    bannerContent: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    bannerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#ffffff',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    bannerSubtitle: {
        fontSize: 16,
        marginBottom: 15,
        color: '#ffffff',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    bannerButton: {
        backgroundColor: '#FF4500',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 5,
        alignSelf: 'flex-start',
    },
    bannerButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 20,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    categoriesList: {
        paddingVertical: 10,
    },
    categoryItem: {
        marginRight: 16,
        alignItems: 'center',
        width: 80,
    },
    categoryImageContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        overflow: 'hidden',
    },
    categoryImage: {
        width: 40,
        height: 40,
    },
    categoryName: {
        fontSize: 14,
        textAlign: 'center',
    },
    productsList: {
        paddingVertical: 10,
    },
    productItem: {
        width: 150,
        marginRight: 16,
    },
    productImage: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginBottom: 8,
    },
    productInfo: {
        paddingHorizontal: 5,
    },
    productName: {
        fontSize: 14,
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FF4500',
    },
    promoSection: {
        marginBottom: 30,
    },
    promoCard: {
        backgroundColor: '#FFE4E1',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    promoTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FF4500',
        marginBottom: 8,
    },
    promoDesc: {
        fontSize: 16,
        marginBottom: 16,
    },
    promoButton: {
        backgroundColor: '#FF4500',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    promoButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    discountedProductsList: {
        paddingVertical: 15,
    },
    discountedProductItem: {
        width: 150,
        marginRight: 16,
        borderRadius: 8,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        overflow: 'hidden',
    },
    discountedProductImageContainer: {
        position: 'relative',
        width: '100%',
        height: 150,
    },
    discountedProductImage: {
        width: '100%',
        height: '100%',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    discountBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#e74c3c',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    discountBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    discountedProductInfo: {
        padding: 10,
    },
    discountedProductName: {
        fontSize: 14,
        marginBottom: 4,
    },
    discountedPriceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    discountedPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FF4500',
        marginRight: 6,
    },
    originalPrice: {
        fontSize: 12,
        textDecorationLine: 'line-through',
        color: '#95a5a6',
    },
});
