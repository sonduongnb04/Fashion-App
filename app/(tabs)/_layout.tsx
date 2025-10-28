import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="homescreen"
        options={{
          title: 'HomeScreen',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="square.grid.2x2.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="categories/index"
        options={{
          href: null, // ẩn khỏi tab bar
        }}
      />
      <Tabs.Screen
        name="products/[identifier]"
        options={{
          href: null, // ẩn khỏi tab bar
        }}
      />
      <Tabs.Screen
        name="address-list"
        options={{
          href: null, // ẩn khỏi tab bar
        }}
      />
      <Tabs.Screen
        name="payment"
        options={{
          href: null, // ẩn khỏi tab bar
        }}
      />
      <Tabs.Screen
        name="orderSuccess"
        options={{
          href: null, // ẩn khỏi tab bar
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Giỏ hàng',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="cart.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Yêu thích',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="heart.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.crop.circle.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
