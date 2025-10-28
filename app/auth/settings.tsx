import { changePassword } from '@/services/user';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
    const router = useRouter();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChangePassword = async () => {
        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu mới không khớp');
            return;
        }

        try {
            setLoading(true);
            await changePassword({
                currentPassword,
                newPassword,
            });
            Alert.alert('Thành công', 'Đã đổi mật khẩu thành công!', [
                {
                    text: 'OK',
                    onPress: () => {
                        // Clear form
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        router.back();
                    }
                }
            ]);
        } catch (error: any) {
            console.error('Change password error:', error);
            const message = error?.response?.data?.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại';
            Alert.alert('Lỗi', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← Quay lại</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Cài đặt</Text>
                    <View style={{ width: 80 }} />
                </View>

                <View style={styles.content}>
                    {/* Change Password Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Đổi mật khẩu</Text>
                        <Text style={styles.sectionDescription}>
                            Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác
                        </Text>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Mật khẩu hiện tại</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    placeholder="Nhập mật khẩu hiện tại"
                                    secureTextEntry={!showCurrentPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                    <Text style={styles.eyeIcon}>{showCurrentPassword ? '👁️' : '👁️‍🗨️'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Mật khẩu mới</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                                    secureTextEntry={!showNewPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowNewPassword(!showNewPassword)}
                                >
                                    <Text style={styles.eyeIcon}>{showNewPassword ? '👁️' : '👁️‍🗨️'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder="Nhập lại mật khẩu mới"
                                    secureTextEntry={!showConfirmPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.changePasswordButton, loading && styles.buttonDisabled]}
                            onPress={handleChangePassword}
                            disabled={loading}
                        >
                            <Text style={styles.changePasswordButtonText}>
                                {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Other Settings (Optional) */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Cài đặt khác</Text>

                        <TouchableOpacity style={styles.settingItem}>
                            <View style={styles.settingItemLeft}>
                                <Text style={styles.settingIcon}>🔔</Text>
                                <Text style={styles.settingText}>Thông báo</Text>
                            </View>
                            <Text style={styles.settingArrow}>›</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.settingItem}>
                            <View style={styles.settingItemLeft}>
                                <Text style={styles.settingIcon}>🌙</Text>
                                <Text style={styles.settingText}>Chế độ tối</Text>
                            </View>
                            <Text style={styles.settingArrow}>›</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.settingItem}>
                            <View style={styles.settingItemLeft}>
                                <Text style={styles.settingIcon}>🌍</Text>
                                <Text style={styles.settingText}>Ngôn ngữ</Text>
                            </View>
                            <Text style={styles.settingArrow}>›</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        marginTop: 40,
    },
    backButton: {
        width: 80,
    },
    backButtonText: {
        fontSize: 16,
        color: '#FF4500',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    content: {
        padding: 20,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    sectionDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
        lineHeight: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
    },
    eyeButton: {
        padding: 12,
    },
    eyeIcon: {
        fontSize: 20,
    },
    changePasswordButton: {
        backgroundColor: '#FF4500',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 4,
    },
    buttonDisabled: {
        backgroundColor: '#999',
    },
    changePasswordButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    settingItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    settingText: {
        fontSize: 16,
    },
    settingArrow: {
        fontSize: 24,
        color: '#ccc',
    },
});

