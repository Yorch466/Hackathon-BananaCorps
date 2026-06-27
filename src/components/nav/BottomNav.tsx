import React from 'react';
import { Icon } from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';

/**
 * Crea la función tabBarIcon para un Tabs.Screen dado un nombre de ícono.
 * Uso: tabBarIcon: makeTabIcon('home')
 */
export const makeTabIcon =
  (iconName: IconName) =>
  ({ color }: { color: string }) =>
    <Icon name={iconName} size={22} color={color} />;

/** Opciones compartidas para el componente Tabs en todos los roles. */
export const TAB_SCREEN_OPTIONS = {
  headerShown: false,
  tabBarStyle: {
    backgroundColor: '#0D1B3E',
    borderTopColor: '#162347',
    borderTopWidth: 1,
  },
  tabBarActiveTintColor: '#1DB88A',
  tabBarInactiveTintColor: '#757575',
  tabBarLabelStyle: {
    fontSize: 10,
    fontWeight: '500' as const,
    marginTop: 2,
  },
} as const;
