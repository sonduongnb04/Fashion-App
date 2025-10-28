import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import api from '@/services/api'
import { updateOrderStatus, type Order } from '@/services/user'
import { useNavigation } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native'

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
                <View style={styles.segment}>
                    {(['processing', 'shipped', 'completed', 'cancelled'] as const).map(s => (
                        <TouchableOpacity key={s} style={[styles.segBtn, status === s && styles.segActive]} onPress={() => setStatus(s)}>
                            <ThemedText style={status === s ? styles.segActiveText : undefined}>{STATUS_LABELS[s]}</ThemedText>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <FlatList
                data={orders}
                keyExtractor={(i) => i._id}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <ThemedText style={styles.name}>{item.code}</ThemedText>
                        <ThemedText>{Intl.NumberFormat('vi-VN').format(item.amounts.total)}₫</ThemedText>
                        <ThemedText>Trạng thái: {STATUS_LABELS[item.status] || item.status}</ThemedText>
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
    container: { flex: 1, padding: 16 },
    header: { marginBottom: 12, marginTop: 12 },
    backText: { color: '#0A66C2', fontWeight: '700', marginBottom: 10 },
    segment: { flexDirection: 'row', gap: 8 },
    segBtn: { borderWidth: 1, borderColor: '#eee', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fff' },
    segActive: { backgroundColor: '#000', borderColor: '#000' },
    segActiveText: { color: '#fff', fontWeight: '700' },
    card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#eee', marginBottom: 10 },
    name: { fontWeight: '700', marginBottom: 6 },
    primaryBtn: { backgroundColor: '#000', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginTop: 8, alignItems: 'center' },
    primaryText: { color: '#fff', fontWeight: '700' },
})



