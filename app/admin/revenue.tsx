import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import api from '@/services/api'
import { useNavigation } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'

export default function RevenueScreen() {
    const router = useRouter()
    const navigation = useNavigation()
    const [loading, setLoading] = useState(true)
    const [topCustomers, setTopCustomers] = useState<any[]>([])
    const [byMonth, setByMonth] = useState<any[]>([])
    const [byCategory, setByCategory] = useState<any[]>([])

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)
                const [customers, months, categories] = await Promise.all([
                    api.get('/revenue/top-customers', { params: { limit: 5 } }),
                    api.get('/revenue/by-month'),
                    api.get('/revenue/by-category'),
                ])
                setTopCustomers(customers.data?.data || [])
                setByMonth(months.data?.data || [])
                setByCategory(categories.data?.data || [])
            } catch (e) {
                console.error('Load revenue error:', e)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    if (loading) return (
        <ThemedView style={styles.container}>
            <ActivityIndicator color="#FF4500" />
        </ThemedView>
    )

    return (
        <ScrollView style={styles.container}>
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

            <ThemedText style={styles.title}>Báo cáo doanh thu</ThemedText>

            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Top khách hàng</ThemedText>
                {topCustomers.map((c, idx) => (
                    <View key={idx} style={styles.card}>
                        <ThemedText style={styles.customerName}>{c.userName}</ThemedText>
                        <ThemedText>{c.email}</ThemedText>
                        <ThemedText style={styles.amount}>{Intl.NumberFormat('vi-VN').format(c.totalSpent)}₫</ThemedText>
                        <ThemedText>Đơn: {c.orderCount}</ThemedText>
                    </View>
                ))}
            </View>

            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Doanh thu theo tháng</ThemedText>
                {byMonth.map((m, idx) => (
                    <View key={idx} style={styles.card}>
                        <ThemedText>Tháng {m._id.month}/{m._id.year}</ThemedText>
                        <ThemedText style={styles.amount}>{Intl.NumberFormat('vi-VN').format(m.revenue)}₫</ThemedText>
                        <ThemedText>Đơn: {m.orderCount}</ThemedText>
                    </View>
                ))}
            </View>

            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Doanh thu theo danh mục</ThemedText>
                {byCategory.map((cat, idx) => (
                    <View key={idx} style={styles.card}>
                        <ThemedText style={styles.customerName}>{cat.categoryName}</ThemedText>
                        <ThemedText style={styles.amount}>{Intl.NumberFormat('vi-VN').format(cat.revenue)}₫</ThemedText>
                        <ThemedText>Sản phẩm đã bán: {cat.itemCount}</ThemedText>
                    </View>
                ))}
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#f6f7fb' },
    backText: { color: '#0A66C2', fontWeight: '700', marginBottom: 10, marginTop: 12 },
    title: { fontSize: 20, fontWeight: '800', marginBottom: 12 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
    card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#eee', marginBottom: 8 },
    customerName: { fontWeight: '700', marginBottom: 4 },
    amount: { fontSize: 16, fontWeight: '800', color: '#FF4500', marginTop: 4 },
})

