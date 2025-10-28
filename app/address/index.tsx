import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useRouter } from 'expo-router'
import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

export default function AddressRedirect() {
    const router = useRouter()

    // Automatically redirect to the address tab
    React.useEffect(() => {
        router.replace('/(tabs)/address-list')
    }, [router])

    return (
        <ThemedView style={styles.container}>
            <View style={styles.content}>
                <ThemedText style={styles.text}>Đang chuyển hướng...</ThemedText>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.replace('/(tabs)/address-list')}
                >
                    <ThemedText style={styles.buttonText}>
                        Quay lại trang địa chỉ
                    </ThemedText>
                </TouchableOpacity>
            </View>
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16
    },
    content: {
        alignItems: 'center'
    },
    text: {
        fontSize: 16,
        marginBottom: 20
    },
    button: {
        backgroundColor: '#FF4500',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600'
    }
})
