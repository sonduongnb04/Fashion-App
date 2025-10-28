import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { Order } from '@/services/user';
import { getMe, getUserOrders, type UserProfile } from '@/services/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [counts, setCounts] = useState({ processing: 0, shipped: 0, completed: 0, cancelled: 0 });

    useEffect(() => {
        loadProfile();
    }, []);

    // Refresh counters when returning to this tab/screen
    useFocusEffect(
        useCallback(() => {
            loadProfile();
        }, [])
    );

    const loadProfile = async () => {
        try {
            setLoading(true);
            const data = await getMe();
            setProfile(data);
            console.log('Profile loaded:', data);
            // fetch order counts
            const orders: Order[] = await getUserOrders();
            const processing = orders.filter((o: Order) => o.status === 'processing').length;
            const shipped = orders.filter((o: Order) => o.status === 'shipped').length;
            const completed = orders.filter((o: Order) => o.status === 'completed').length;
            const cancelled = orders.filter((o: Order) => o.status === 'cancelled').length;
            setCounts({ processing, shipped, completed, cancelled });
        } catch (error: any) {
            console.error('Error loading profile:', error);
            // If token expired or not logged in
            if (error?.response?.status === 401) {
                Alert.alert('Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại', [
                    { text: 'OK', onPress: () => router.replace('/auth/login') }
                ]);
            } else {
                Alert.alert('Lỗi', 'Không thể tải thông tin người dùng');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Đăng xuất',
            'Bạn có chắc muốn đăng xuất?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Đăng xuất',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem('auth_token');
                            router.replace('/auth/login');
                        } catch (error) {
                            console.error('Logout error:', error);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <ThemedView style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#FF4500" />
                <ThemedText style={{ marginTop: 16 }}>Đang tải...</ThemedText>
            </ThemedView>
        );
    }

    if (!profile) {
        return (
            <ThemedView style={styles.centerContainer}>
                <ThemedText style={styles.errorText}>Không thể tải thông tin</ThemedText>
                <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
                    <ThemedText style={styles.retryButtonText}>Thử lại</ThemedText>
                </TouchableOpacity>
            </ThemedView>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Hồ Sơ</Text>
            </View>

            {/* Profile Card */}
            <View style={styles.profileCard}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>
                            {profile.firstName?.charAt(0).toUpperCase() ||
                                profile.username?.charAt(0).toUpperCase() ||
                                profile.email?.charAt(0).toUpperCase() || '👤'}
                        </Text>
                    </View>
                </View>
                <Text style={styles.profileName}>
                    {profile.firstName || profile.lastName
                        ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
                        : profile.username || 'Người dùng'}
                </Text>
                <Text style={styles.profileEmail}>{profile.email}</Text>
            </View>

            {/* Menu Items */}
            <View style={styles.menuSection}>
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => router.push('/auth/user-info')}
                >
                    <View style={styles.menuItemLeft}>
                        <Text style={styles.menuIcon}>👤</Text>
                        <Text style={styles.menuText}>Thông tin người dùng</Text>
                    </View>
                    <Text style={styles.menuArrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => router.push('/auth/settings')}
                >
                    <View style={styles.menuItemLeft}>
                        <Text style={styles.menuIcon}>⚙️</Text>
                        <Text style={styles.menuText}>Cài đặt</Text>
                    </View>
                    <Text style={styles.menuArrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleLogout}
                >
                    <View style={styles.menuItemLeft}>
                        <Text style={styles.menuIcon}>🚪</Text>
                        <Text style={[styles.menuText, styles.logoutText]}>Đăng xuất</Text>
                    </View>
                    <Text style={styles.menuArrow}>›</Text>
                </TouchableOpacity>
            </View>

            {/* Order Status Section */}
            <View style={styles.orderSection}>
                <Text style={styles.sectionTitle}>Trạng thái đơn hàng</Text>

                <View style={styles.orderStatusRow}>
                    <TouchableOpacity
                        style={styles.orderStatusItem}
                        onPress={() => router.push({ pathname: '/orders', params: { status: 'processing' } })}
                    >
                        <View style={styles.orderStatusIcon}>
                            <Text style={styles.orderStatusIconText}>⏳</Text>
                        </View>
                        <Text style={styles.orderStatusLabel}>Chờ xử lý</Text>
                        <Text style={styles.orderStatusCount}>{counts.processing}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.orderStatusItem}
                        onPress={() => router.push({ pathname: '/orders', params: { status: 'shipped' } })}
                    >
                        <View style={styles.orderStatusIcon}>
                            <Text style={styles.orderStatusIconText}>🚚</Text>
                        </View>
                        <Text style={styles.orderStatusLabel}>Đang giao</Text>
                        <Text style={styles.orderStatusCount}>{counts.shipped}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.orderStatusItem}
                        onPress={() => router.push({ pathname: '/orders', params: { status: 'completed' } })}
                    >
                        <View style={styles.orderStatusIcon}>
                            <Text style={styles.orderStatusIconText}>✅</Text>
                        </View>
                        <Text style={styles.orderStatusLabel}>Hoàn thành</Text>
                        <Text style={styles.orderStatusCount}>{counts.completed}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.orderStatusItem}
                        onPress={() => router.push({ pathname: '/orders', params: { status: 'cancelled' } })}
                    >
                        <View style={styles.orderStatusIcon}>
                            <Text style={styles.orderStatusIconText}>❌</Text>
                        </View>
                        <Text style={styles.orderStatusLabel}>Đã hủy</Text>
                        <Text style={styles.orderStatusCount}>{counts.cancelled}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    header: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        marginTop: 40,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    profileCard: {
        backgroundColor: '#fff',
        marginTop: 16,
        marginHorizontal: 16,
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    avatarContainer: {
        marginBottom: 16,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FF4500',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 40,
        color: '#fff',
        fontWeight: 'bold',
    },
    profileName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 14,
        color: '#666',
    },
    menuSection: {
        backgroundColor: '#fff',
        marginTop: 16,
        marginHorizontal: 16,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    menuText: {
        fontSize: 16,
    },
    logoutText: {
        color: '#FF4500',
    },
    menuArrow: {
        fontSize: 24,
        color: '#ccc',
    },
    orderSection: {
        backgroundColor: '#fff',
        marginTop: 16,
        marginHorizontal: 16,
        marginBottom: 24,
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    orderStatusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    orderStatusItem: {
        flex: 1,
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
    },
    orderStatusIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    orderStatusIconText: {
        fontSize: 24,
    },
    orderStatusLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
        textAlign: 'center',
    },
    orderStatusCount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF4500',
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#FF4500',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});


