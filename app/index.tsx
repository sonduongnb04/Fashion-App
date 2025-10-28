import { loadToken, loadUserRole } from "@/services/auth";
import { getMe } from "@/services/user";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ImageBackground, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function WelcomeScreen() {
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = await loadToken();
            if (token) {
                const cachedRole = await loadUserRole();
                if (cachedRole === 'admin') {
                    router.replace('/admin' as any);
                    return;
                }
                try {
                    const me = await getMe();
                    if ((me as any)?.role === 'admin') {
                        router.replace('/admin' as any);
                        return;
                    }
                } catch { }
                router.replace("/(tabs)/homescreen");
            }
        } catch (error) {
            console.error('Error checking auth:', error);
        } finally {
            setChecking(false);
        }
    };

    if (checking) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#8B4513" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ImageBackground
                source={require('@/assets/images/partial-react-logo.png')}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <View style={styles.overlay}>
                    <View style={styles.content}>
                        <Text style={styles.title}>LUXURY</Text>
                        <Text style={styles.title}>FASHION</Text>
                        <Text style={styles.title}>ACCESSORIES</Text>

                        <TouchableOpacity
                            style={styles.exploreButton}
                            onPress={() => router.push("/(tabs)/homescreen")}
                        >
                            <Text style={styles.exploreButtonText}>EXPLORE COLLECTION</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.authButton} onPress={() => router.push("/auth/register")}>
                            <Text style={styles.authButtonText}>Đăng ký</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.authButton} onPress={() => router.push("/auth/login")}>
                            <Text style={styles.authButtonText}>Đăng nhập</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ImageBackground>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundImage: {
        flex: 1,
        width: "100%",
        height: "100%",
    },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        justifyContent: "space-between",
        paddingHorizontal: 30,
        paddingTop: 120,
        paddingBottom: 60,
    },
    content: {
        alignItems: "center",
        flex: 1,
        justifyContent: "center",
    },
    title: {
        fontSize: 42,
        fontWeight: "bold",
        color: "white",
        textAlign: "center",
        letterSpacing: 2,
        lineHeight: 50,
    },
    exploreButton: {
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
        marginTop: 40,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.3)",
    },
    exploreButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
        letterSpacing: 1,
    },
    buttonContainer: {
        gap: 15,
    },
    authButton: {
        backgroundColor: "#8B4513",
        paddingVertical: 18,
        borderRadius: 25,
        alignItems: "center",
    },
    authButtonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "600",
    },
})


