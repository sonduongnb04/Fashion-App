import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useNavigation, useRoute } from '@react-navigation/native'
import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

export default function OrderSuccessScreen() {
    const route = useRoute<any>()
    const navigation = useNavigation<any>()

    const orderCode = route.params?.orderCode || 'N/A'
    const orderId = route.params?.orderId || ''

    return (
        <ThemedView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.successIcon}>
                    <ThemedText style={styles.icon}>✅</ThemedText>
                </View>

                <ThemedText style={styles.title}>Đặt Hàng Thành Công!</ThemedText>

                <ThemedText style={styles.message}>
                    Cảm ơn bạn đã mua sắm tại cửa hàng của chúng tôi.
                </ThemedText>

                <View style={styles.orderInfo}>
                    <View style={styles.infoRow}>
                        <ThemedText style={styles.label}>Mã Đơn Hàng:</ThemedText>
                        <ThemedText style={styles.value}>{orderCode}</ThemedText>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <ThemedText style={styles.label}>Trạng Thái:</ThemedText>
                        <ThemedText style={styles.statusValue}>⏳ Chờ Xác Nhận</ThemedText>
                    </View>
                </View>

                <View style={styles.stepContainer}>
                    <ThemedText style={styles.stepTitle}>📋 Các Bước Tiếp Theo:</ThemedText>

                    <View style={styles.step}>
                        <View style={styles.stepNumber}>
                            <ThemedText style={styles.stepNumberText}>1</ThemedText>
                        </View>
                        <ThemedText style={styles.stepText}>
                            Bạn sẽ nhận được xác nhận qua Email/SMS
                        </ThemedText>
                    </View>

                    <View style={styles.step}>
                        <View style={styles.stepNumber}>
                            <ThemedText style={styles.stepNumberText}>2</ThemedText>
                        </View>
                        <ThemedText style={styles.stepText}>
                            Chúng tôi sẽ chuẩn bị và gửi hàng cho bạn
                        </ThemedText>
                    </View>

                    <View style={styles.step}>
                        <View style={styles.stepNumber}>
                            <ThemedText style={styles.stepNumberText}>3</ThemedText>
                        </View>
                        <ThemedText style={styles.stepText}>
                            Thanh toán khi nhân viên giao hàng đến
                        </ThemedText>
                    </View>

                    <View style={styles.step}>
                        <View style={styles.stepNumber}>
                            <ThemedText style={styles.stepNumberText}>4</ThemedText>
                        </View>
                        <ThemedText style={styles.stepText}>
                            Nhận hàng và đánh giá sản phẩm
                        </ThemedText>
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <ThemedText style={styles.infoBoxTitle}>💡 Lưu Ý</ThemedText>
                    <ThemedText style={styles.infoBoxText}>
                        • Vui lòng chuẩn bị sẵn tiền mặt để thanh toán
                    </ThemedText>
                    <ThemedText style={styles.infoBoxText}>
                        • Hãy theo dõi email hoặc SMS để cập nhật trạng thái đơn hàng
                    </ThemedText>
                    <ThemedText style={styles.infoBoxText}>
                        • Nếu có thắc mắc, liên hệ với chúng tôi qua hotline
                    </ThemedText>
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.btn}
                    onPress={() => navigation.navigate('homescreen')}
                >
                    <ThemedText style={styles.btnText}>Tiếp Tục Mua Sắm</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.btn, styles.secondaryBtn]}
                    onPress={() => navigation.navigate('orders/[id]' as never, { id: orderId } as never)}
                >
                    <ThemedText style={styles.secondaryBtnText}>Xem Chi Tiết Đơn</ThemedText>
                </TouchableOpacity>
            </View>
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9' },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },

    successIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    icon: {
        fontSize: 50,
    },

    title: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
    },

    message: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },

    orderInfo: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        width: '100%',
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: '#FF4500',
    },

    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },

    divider: {
        height: 1,
        backgroundColor: '#eee',
    },

    label: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },

    value: {
        fontSize: 14,
        fontWeight: '700',
        color: '#000',
    },

    statusValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FF9800',
    },

    stepContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        width: '100%',
        marginBottom: 16,
    },

    stepTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
    },

    step: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },

    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FF4500',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    stepNumberText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },

    stepText: {
        flex: 1,
        fontSize: 13,
        color: '#555',
        lineHeight: 18,
        paddingTop: 6,
    },

    infoBox: {
        backgroundColor: '#FFF5E6',
        borderRadius: 12,
        padding: 16,
        width: '100%',
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#FF4500',
    },

    infoBoxTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 10,
    },

    infoBoxText: {
        fontSize: 13,
        color: '#666',
        marginBottom: 6,
        lineHeight: 18,
    },

    footer: {
        paddingHorizontal: 16,
        paddingBottom: 20,
        gap: 10,
    },

    btn: {
        backgroundColor: '#FF4500',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },

    btnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },

    secondaryBtn: {
        backgroundColor: '#f0f0f0',
    },

    secondaryBtnText: {
        color: '#333',
        fontWeight: '700',
        fontSize: 16,
    },
})
