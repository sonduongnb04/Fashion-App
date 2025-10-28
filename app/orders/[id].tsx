import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { getOrderById, updateOrderStatus, type Order } from '@/services/user'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native'

const STATUS_LABELS: Record<string, string> = {
    processing: 'Chờ xử lý',
    shipped: 'Đang giao',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
}

export default function OrderDetailScreen() {
    const router = useRouter()
    const { id } = useLocalSearchParams<{ id: string }>()
    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)
                const data = await getOrderById(id!)
                setOrder(data)
            } catch (e) {
                console.error('Load order error:', e)
            } finally {
                setLoading(false)
            }
        }
        if (id) load()
    }, [id])

    const handleCancelOrder = () => {
        if (!order) return
        Alert.alert('Hủy đơn hàng', 'Bạn có chắc muốn hủy đơn hàng này?', [
            { text: 'Không', style: 'cancel' },
            {
                text: 'Hủy đơn',
                style: 'destructive',
                onPress: async () => {
                    try {
                        setUpdating(true)
                        const updated = await updateOrderStatus(order._id, 'cancelled')
                        setOrder(updated)
                        router.replace({ pathname: '/orders', params: { status: 'cancelled' } })
                    } catch (e) {
                        console.error('Cancel order error:', e)
                        Alert.alert('Lỗi', 'Không thể hủy đơn hàng, vui lòng thử lại')
                    } finally {
                        setUpdating(false)
                    }
                },
            },
        ])
    }

    if (loading || !order) {
        return (
            <ThemedView style={styles.container}>
                <ActivityIndicator color="#FF4500" />
            </ThemedView>
        )
    }

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ThemedText style={styles.back}>{'<'} Quay lại</ThemedText>
                </TouchableOpacity>
                <ThemedText style={styles.title}>Đơn hàng {order.code}</ThemedText>
            </View>

            <View style={styles.block}>
                <ThemedText style={styles.blockTitle}>Thông tin</ThemedText>
                <ThemedText>Mã đơn: {order.code}</ThemedText>
                <ThemedText>Trạng thái: {STATUS_LABELS[order.status] || order.status}</ThemedText>
                <ThemedText>Tổng tiền: {Intl.NumberFormat('vi-VN').format(order.amounts.total)}₫</ThemedText>
            </View>

            {order.status === 'processing' && (
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelOrder}
                    disabled={updating}
                >
                    <ThemedText style={styles.cancelText}>{updating ? 'Đang hủy...' : 'Hủy đơn hàng'}</ThemedText>
                </TouchableOpacity>
            )}

            <View style={styles.block}>
                <ThemedText style={styles.blockTitle}>Sản phẩm</ThemedText>
                <FlatList
                    data={order.items}
                    keyExtractor={(item, idx) => `${item.productId || item.product?._id || idx}`}
                    renderItem={({ item }) => (
                        <View style={styles.itemRow}>
                            <ThemedText style={{ flex: 1 }}>{item.name}</ThemedText>
                            <ThemedText>x{item.quantity}</ThemedText>
                            <ThemedText style={styles.price}>{Intl.NumberFormat('vi-VN').format(item.price)}₫</ThemedText>
                        </View>
                    )}
                />
            </View>
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    header: { marginBottom: 12 },
    back: { color: '#FF4500', fontWeight: '700', marginBottom: 8 },
    title: { fontSize: 18, fontWeight: '700' },
    block: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
    blockTitle: { fontWeight: '700', marginBottom: 8 },
    itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    price: { fontWeight: '700', color: '#FF4500' },
    cancelButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#FF3B30',
        borderRadius: 10,
        padding: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    cancelText: { color: '#FF3B30', fontWeight: '700' },
})


