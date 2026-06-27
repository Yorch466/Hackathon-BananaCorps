import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { tokens } from '@/theme/tokens';

export default function ConductorLayout() {
  const insets = useSafeAreaInsets();

  const tabBarStyle = {
    backgroundColor: tokens.colors.bg[1],
    borderTopColor: tokens.colors.line,
    borderTopWidth: 1,
    paddingBottom: insets.bottom + 4,
    height: 56 + insets.bottom + 4,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: tokens.colors.accent,
        tabBarInactiveTintColor: tokens.colors.ink[3],
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500', marginTop: 2 },
      }}
    >
      {/* Orden: SOS | Productos | Inicio | Perfil | Mapa */}
      <Tabs.Screen
        name="sos"
        options={{
          title: 'SOS',
          tabBarIcon: ({ focused }) => (
            <Icon name="sos" size={22} color={focused ? '#EF4444' : '#DC2626'} />
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{ fontSize: 10, fontWeight: '500', marginTop: 2, color: focused ? '#EF4444' : '#DC2626' }}>SOS</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="products/index"
        options={{
          title: 'Productos',
          tabBarIcon: ({ color, size }) => <Icon name="cart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Icon name="user" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => <Icon name="map" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="products/[id]"   options={{ href: null }} />
      <Tabs.Screen name="supplier/[id]"   options={{ href: null }} />
      <Tabs.Screen name="workshop/[id]"   options={{ href: null }} />
    </Tabs>
  );
}
