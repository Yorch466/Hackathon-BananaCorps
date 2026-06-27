import React from 'react';
import { View, Text } from 'react-native';
import { Icon, IconName } from '@/components/ui/Icon';

interface InfoRowProps {
  icon: IconName;
  value: string;
  label?: string;
  last?: boolean;
}

export const InfoRow = ({ icon, value, label, last = false }: InfoRowProps) => (
  <View
    className={`flex-row items-center px-4 py-3.5 ${!last ? 'border-b border-navy-700' : ''}`}
  >
    <Icon name={icon} size={18} color="#94A3B8" />
    <View className="ml-3 flex-1">
      {label ? <Text className="text-ink-secondary text-xs mb-0.5">{label}</Text> : null}
      <Text className="text-ink-primary text-sm">{value}</Text>
    </View>
  </View>
);
