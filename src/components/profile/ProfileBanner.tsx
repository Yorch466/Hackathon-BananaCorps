import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { useTheme } from '@/theme/useTheme';

interface ProfileBannerProps {
  name: string;
  subtitle?: string;
  avatarUri?: string;
}

export default function ProfileBanner({ name, subtitle, avatarUri }: ProfileBannerProps) {
  const { tokens } = useTheme();
  const { colors } = tokens;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg[1] }]}>
      <Avatar uri={avatarUri} size={72} />
      <Text style={[styles.name, { color: colors.ink[0] }]}>{name}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.ink[2] }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  name: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 14 },
});
