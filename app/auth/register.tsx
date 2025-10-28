import { register as registerApi } from '@/services/auth';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RegisterScreen() {
    const router = useRouter();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const onSubmit = async () => {
        // Validation
        if (!name || !email || !password) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        try {
            setLoading(true);
            const data = await registerApi({ name, email, password });
            if (data?.token) {
                Alert.alert(
                    'Thành công',
                    'Đăng ký tài khoản thành công!',
                    [{ text: 'OK', onPress: () => router.replace('/(tabs)/homescreen') }]
                );
            } else {
                Alert.alert('Đăng ký thất bại', 'Không nhận được token');
            }
        } catch (e: any) {
            console.error('Register error:', e?.response?.data);
            Alert.alert('Đăng ký thất bại', e?.response?.data?.message || 'Email có thể đã được sử dụng');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Text style={styles.brand}>FASHION SHOP</Text>
                </View>

                <Text style={styles.title}>Đăng Ký</Text>

                <Text style={styles.label}>Họ và tên</Text>
                <TextInput placeholder="Họ và tên" style={styles.input} value={name} onChangeText={setName} />

                <Text style={styles.label}>Email</Text>
                <TextInput
                    placeholder="example@gmail.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                />

                <Text style={styles.label}>Mật khẩu</Text>
                <TextInput placeholder="********" secureTextEntry style={styles.input} value={password} onChangeText={setPassword} />

                <Text style={styles.label}>Xác thực mật khẩu</Text>
                <TextInput
                    placeholder="********"
                    secureTextEntry
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={onSubmit}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>{loading ? 'Đang đăng ký...' : 'Tạo Tài Khoản'}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push('/auth/login')} style={{ marginTop: 16, marginBottom: 24 }}>
                    <Text style={{ textAlign: 'center', color: '#666' }}>
                        Đã có tài khoản? <Text style={{ color: '#FF4500', fontWeight: '600' }}>Đăng nhập</Text>
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    brand: {
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        marginTop: 14,
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e5e5e5',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    button: {
        marginTop: 24,
        backgroundColor: '#000',
        paddingVertical: 16,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#999',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
});