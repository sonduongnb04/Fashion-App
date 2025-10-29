import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import api, { getImageURL } from '@/services/api'
import { updateOrderStatus, type Order } from '@/services/user'
import { useNavigation } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native'

const STATUS_LABELS: Record<string, string> = {
    processing: 'Chờ xử lý',
    shipped: 'Đang giao',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
}

export default function AdminOrdersScreen() {
    const router = useRouter()
    const navigation = useNavigation()
    const [status, setStatus] = useState<'processing' | 'shipped' | 'completed' | 'cancelled'>('processing')
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)

    const load = async () => {
        try {
            setLoading(true)
            const res = await api.get('/orders', { params: { status } })
            const data = res.data?.data?.orders || res.data?.data || []
            setOrders(data as Order[])
        } catch (e) {
            console.error('Load orders error:', e)
        } finally { setLoading(false) }
    }

    useEffect(() => { load() }, [status])

    const confirmAndShip = async (id: string) => {
        try {
            await updateOrderStatus(id, 'shipped')
            load()
        } catch (e) {
            Alert.alert('Lỗi', 'Không thể xác nhận giao hàng')
        }
    }

    const markCompleted = async (id: string) => {
        try {
            await updateOrderStatus(id, 'completed')
            load()
        } catch (e) {
            Alert.alert('Lỗi', 'Không thể chuyển sang hoàn thành')
        }
    }

    if (loading) return (
        <ThemedView style={styles.container}>
            <ActivityIndicator color="#FF4500" />
        </ThemedView>
    )

    return (
        <ThemedView style={styles.container}>
            <TouchableOpacity
                style={styles.backBtn}
                onPress={() => {
                    try {
                        if (navigation && navigation.canGoBack && navigation.canGoBack()) {
                            navigation.goBack()
                        } else {
                            router.replace('/admin' as any)
                        }
                    } catch {
                        router.replace('/admin' as any)
                    }
                }}
            >
                <ThemedText style={styles.backText}>{'<'} Trở về</ThemedText>
            </TouchableOpacity>

            <View style={styles.segment}>
                {(['processing', 'shipped', 'completed', 'cancelled'] as const).map(s => (
                    <TouchableOpacity key={s} style={[styles.segBtn, status === s && styles.segActive]} onPress={() => setStatus(s)}>
                        <ThemedText style={[styles.segText, status === s && styles.segActiveText]}>{STATUS_LABELS[s]}</ThemedText>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={orders}
                keyExtractor={(i) => i._id}
                contentContainerStyle={{ paddingTop: 12 }}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={{ flex: 1 }}>
                                <ThemedText style={styles.orderCode}>{item.code}</ThemedText>
                                <ThemedText style={styles.price}>{Intl.NumberFormat('vi-VN').format(item.amounts.total)}₫</ThemedText>
                                <ThemedText style={styles.statusText}>Trạng thái: {STATUS_LABELS[item.status] || item.status}</ThemedText>
                            </View>
                        </View>

                        {/* Hiển thị danh sách sản phẩm */}
                        {item.items && item.items.length > 0 && (
                            <View style={styles.productsSection}>
                                <ThemedText style={styles.sectionTitle}>Sản phẩm:</ThemedText>
                                {item.items.map((product: any, idx: number) => (
                                    <View key={idx} style={styles.productRow}>
                                        <Image
                                            source={{ uri: getImageURL(product.product?.mainImage?.url || product.product?.images?.[0]?.url) }}
                                            style={styles.productImage}
                                        />
                                        <View style={styles.productInfo}>
                                            <ThemedText style={styles.productName} numberOfLines={2}>{product.product?.name || 'Sản phẩm'}</ThemedText>
                                            <ThemedText style={styles.productDetail}>SL: {product.quantity} | {Intl.NumberFormat('vi-VN').format(product.price)}₫</ThemedText>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {item.status === 'processing' && (
                            <TouchableOpacity style={styles.primaryBtn} onPress={() => confirmAndShip(item._id)}>
                                <ThemedText style={styles.primaryText}>Xác nhận & giao</ThemedText>
                            </TouchableOpacity>
                        )}
                        {item.status === 'shipped' && (
                            <TouchableOpacity style={styles.primaryBtn} onPress={() => markCompleted(item._id)}>
                                <ThemedText style={styles.primaryText}>Đã giao</ThemedText>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            />
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#f6f7fb' },
    backBtn: { marginTop: 12, marginBottom: 12 },
    backText: { color: '#0A66C2', fontWeight: '700', fontSize: 15 },
    segment: { flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
    segBtn: { borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#fff' },
    segActive: { backgroundColor: '#000', borderColor: '#000' },
    segText: { fontSize: 13, color: '#333' },
    segActiveText: { color: '#fff', fontWeight: '700' },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#eee', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    cardHeader: { flexDirection: 'row', marginBottom: 10 },
    orderCode: { fontWeight: '800', fontSize: 15, marginBottom: 4, color: '#000' },
    price: { fontSize: 16, fontWeight: '700', color: '#FF4500', marginBottom: 4 },
    statusText: { fontSize: 13, color: '#666' },
    productsSection: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    sectionTitle: { fontWeight: '700', fontSize: 13, marginBottom: 8, color: '#333' },
    productRow: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'center' },
    productImage: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#f5f5f5' },
    productInfo: { flex: 1 },
    productName: { fontWeight: '600', fontSize: 13, marginBottom: 2, color: '#000' },
    productDetail: { fontSize: 12, color: '#666' },
    primaryBtn: { backgroundColor: '#000', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginTop: 12, alignItems: 'center' },
    primaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
})

