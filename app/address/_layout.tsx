import { Stack } from 'expo-router';
import React from 'react';

export default function AddressLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="new-address" />
            <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
    );
}
