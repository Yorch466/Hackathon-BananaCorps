import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { tokens } from '@/theme/tokens';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline' | 'danger';
  disabled?: boolean;
}

export const Button = ({ label, onPress, variant = 'primary', disabled = false }: ButtonProps) => {
  const bgColor =
    variant === 'danger'  ? tokens.colors.danger :
    variant === 'outline' ? 'transparent' :
    tokens.colors.accent;

  const textColor =
    variant === 'outline' ? tokens.colors.accent : tokens.colors.bg[1];

  const borderColor =
    variant === 'outline' ? tokens.colors.accent : 'transparent';

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: bgColor, borderColor, opacity: disabled ? 0.5 : 1 }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
    >
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: tokens.radii.md,
    alignItems: 'center',
    marginVertical: 6,
    borderWidth: 1.5,
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
