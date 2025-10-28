import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { getUserOrdersByStatus, type Order } from '@/services/user'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native'

const STATUS_LABELS: Record<string, string> = {
    processing: 'Chờ xử lý',
    shipped: 'Đang giao',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
}

export default function OrdersListScreen() {
    const router = useRouter()
    const params = useLocalSearchParams<{ status?: string }>()
    const status = (params.status as string) || 'processing'
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const load = async () => {
        try {
            setLoading(true)
            const data = await getUserOrdersByStatus(status as any)
            setOrders(data)
        } catch (e) {
            console.error('Load orders error:', e)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        load()
    }, [status])

    const onRefresh = () => {
        setRefreshing(true)
        load()
    }

    if (loading) {
        return (
            <ThemedView style={styles.container}>
                <ActivityIndicator color="#FF4500" />
            </ThemedView>
        )
    }

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <ThemedText style={styles.title}>Đơn hàng - {STATUS_LABELS[status] || status}</ThemedText>
            </View>

            <FlatList
                data={orders}
                keyExtractor={(item) => item._id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => router.push({ pathname: '/orders/[id]', params: { id: item._id } })}
                    >
                        <View style={styles.row}>
                            <ThemedText style={styles.label}>Mã đơn:</ThemedText>
                            <ThemedText style={styles.value}>{item.code}</ThemedText>
                        </View>
                        <View style={styles.row}>
                            <ThemedText style={styles.label}>Tổng tiền:</ThemedText>
                            <ThemedText style={styles.price}>{Intl.NumberFormat('vi-VN').format(item.amounts.total)}₫</ThemedText>
                        </View>
                        <View style={styles.row}>
                            <ThemedText style={styles.label}>Trạng thái:</ThemedText>
                            <ThemedText style={styles.value}>{STATUS_LABELS[item.status] || item.status}</ThemedText>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', marginTop: 40 }}>
                        <ThemedText>Không có đơn hàng</ThemedText>
                    </View>
                }
            />
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    header: { marginBottom: 12 },
    title: { fontSize: 18, fontWeight: '700' },
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#eee',
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    label: { color: '#666' },
    value: { fontWeight: '600' },
    price: { fontWeight: '700', color: '#FF4500' },
})


