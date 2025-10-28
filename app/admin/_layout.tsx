import { Stack } from 'expo-router'
import React from 'react'

export default function AdminLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="products" />
            <Stack.Screen name="orders" />
            <Stack.Screen name="product-edit" />
            <Stack.Screen name="revenue" />
        </Stack>
    )
}



