import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'accent' | 'danger' | 'success';
}

export const Badge = ({ label, variant = 'default' }: BadgeProps) => {
  const bg = variant === 'accent' ? '#1DB88A20' : variant === 'danger' ? '#EF444420' : variant === 'success' ? '#10B98120' : '#2C2C2C';
  const color = variant === 'accent' ? '#1DB88A' : variant === 'danger' ? '#EF4444' : variant === 'success' ? '#10B981' : '#B0B0B0';

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
