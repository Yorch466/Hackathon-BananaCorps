import React from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { tokens } from '@/theme/tokens';
import { useCurrentProfile } from '@/features/profile/hooks';

export default function ShopLayout() {
  const insets = useSafeAreaInsets();
  const { data: profile } = useCurrentProfile();
  const role = profile?.role;

  const tabBarStyle = {
    backgroundColor: tokens.colors.bg[1],
    borderTopColor: tokens.colors.line,
    borderTopWidth: 1,
    paddingBottom: insets.bottom + 4,
    height: 56 + insets.bottom + 4,
  };

  // Taller:    Inicio | Servicios | Alertas | Perfil | Mapa
  // Proveedor: Inicio | Productos | Alertas | Perfil | Mapa
  // Híbrido:   Inicio | Servicios | Productos | Alertas | Perfil | Mapa
  const hideServices = role === 'proveedor';
  const hideItems    = role === 'taller';

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
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Servicios',
          tabBarIcon: ({ color, size }) => <Icon name="wrench" size={size} color={color} />,
          tabBarItemStyle: hideServices ? { display: 'none', width: 0 } : undefined,
        }}
      />
      <Tabs.Screen
        name="items/index"
        options={{
          title: 'Productos',
          tabBarIcon: ({ color, size }) => <Icon name="cart" size={size} color={color} />,
          tabBarItemStyle: hideItems ? { display: 'none', width: 0 } : undefined,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alertas',
          tabBarIcon: ({ color, size }) => <Icon name="bell" size={size} color={color} />,
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
      {/* Rutas internas sin tab */}
      <Tabs.Screen name="items/[id]" options={{ tabBarItemStyle: { display: 'none', width: 0 } }} />
    </Tabs>
  );
}
