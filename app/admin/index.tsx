import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import api, { setAuthToken } from '@/services/api'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native'

export default function AdminHome() {
    const router = useRouter()
    const [revenue, setRevenue] = useState<number | null>(null)

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/orders', { params: { status: 'completed', limit: 1000 } })
                const list = res.data?.data?.orders || res.data?.data || []
                const total = list.reduce((sum: number, o: any) => sum + (o?.amounts?.total || 0), 0)
                setRevenue(total)
            } catch (e) {
                setRevenue(null)
            }
        }
        load()
    }, [])

    const handleLogout = () => {
        Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Đăng xuất', style: 'destructive', onPress: async () => {
                    try {
                        await AsyncStorage.removeItem('auth_token')
                        await AsyncStorage.removeItem('user_role')
                        setAuthToken(null)
                        router.replace('/auth/login' as any)
                    } catch { }
                }
            }
        ])
    }
    return (
        <ThemedView style={styles.container}>
            <ThemedText style={styles.brand}>FASHION SHOP</ThemedText>
            {/* 3 ô xếp dọc */}
            <View style={styles.stack}>
                <View style={[styles.card, styles.revenueCard, styles.equalCard]}>
                    <ThemedText style={styles.cardTitle}>Tổng doanh thu</ThemedText>
                    <ThemedText style={styles.revenueValue}>
                        {revenue == null ? '—' : `${Intl.NumberFormat('vi-VN').format(revenue)}₫`}
                    </ThemedText>
                </View>

                <TouchableOpacity style={[styles.card, styles.productsCard, styles.equalCard]} onPress={() => router.push('/admin/products')}>
                    <ThemedText style={styles.cardTitle}>Sản phẩm</ThemedText>
                    <ThemedText>Thêm/Sửa/Xóa, tồn kho, trạng thái</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.card, styles.ordersCard, styles.equalCard]} onPress={() => router.push('/admin/orders')}>
                    <ThemedText style={styles.cardTitle}>Đơn hàng</ThemedText>
                    <ThemedText>Xem, xác nhận, chuyển giao vận chuyển</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.card, styles.revenueReportCard, styles.equalCard]} onPress={() => router.push('/admin/revenue' as any)}>
                    <ThemedText style={styles.cardTitle}>Doanh thu</ThemedText>
                    <ThemedText>Top khách, tháng, tuần, danh mục</ThemedText>
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <ThemedText style={styles.logoutText}>Đăng xuất</ThemedText>
            </TouchableOpacity>
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#f6f7fb' },
    brand: { fontSize: 22, fontWeight: '800', letterSpacing: 1, marginBottom: 12, textAlign: 'center', marginTop: 28 },
    stack: { flex: 1, gap: 12 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#eee', justifyContent: 'center' },
    cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
    revenueCard: { backgroundColor: '#EAF3FF', borderColor: '#D3E5FF' },
    productsCard: { backgroundColor: '#FFF4E0', borderColor: '#FFE2B8' },
    ordersCard: { backgroundColor: '#EAF7EE', borderColor: '#CFEAD9' },
    revenueReportCard: { backgroundColor: '#F3E5F5', borderColor: '#E1BEE7' },
    revenueValue: { fontSize: 22, fontWeight: '800', color: '#0A66C2' },
    equalCard: { flex: 1 },
    logoutBtn: { marginTop: 12, backgroundColor: '#FF6B00', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
    logoutText: { color: '#fff', fontWeight: '700' },
})



