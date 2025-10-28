import { login } from '@/services/auth';
import { setCurrentUser } from '@/services/session';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const onSubmit = async () => {
        if (!email || !password) {
            Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
            return;
        }

        try {
            setLoading(true);
            const data = await login({ email, password });
            if (data?.token) {
                const role = data?.user?.role;
                setCurrentUser(data.user);
                const next = role === 'admin' ? '/admin' : '/(tabs)/homescreen';
                Alert.alert('Thành công', 'Đăng nhập thành công!', [
                    { text: 'OK', onPress: () => router.replace(next as any) }
                ]);
            } else {
                Alert.alert('Đăng nhập thất bại', 'Không nhận được token');
            }
        } catch (e: any) {
            console.error('Login error:', e);
            Alert.alert('Đăng nhập thất bại', e?.response?.data?.message || 'Vui lòng kiểm tra lại email và mật khẩu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.brand}>FASHION SHOP</Text>
                </View>

                <Text style={styles.title}>Đăng nhập</Text>

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
                <TextInput
                    placeholder="********"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                />

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={onSubmit}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>{loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push('/auth/register')} style={{ marginTop: 16 }}>
                    <Text style={{ textAlign: 'center', color: '#666' }}>
                        Chưa có tài khoản? <Text style={{ color: '#FF4500', fontWeight: '600' }}>Đăng ký</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        marginVertical: 12,
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