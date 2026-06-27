import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Chip {
  id: string;
  label: string;
}

interface ChipListProps {
  chips: Chip[];
  selected?: string[];
  onToggle?: (id: string) => void;
  readonly?: boolean;
}

export const ChipList = ({ chips, selected = [], onToggle, readonly = false }: ChipListProps) => (
  <View className="flex-row flex-wrap gap-2">
    {chips.map((chip) => {
      const active = selected.includes(chip.id);
      if (readonly) {
        return (
          <View
            key={chip.id}
            className="bg-navy-700 px-3 py-1 rounded-full"
          >
            <Text className="text-ink-secondary text-xs">{chip.label}</Text>
          </View>
        );
      }
      return (
        <TouchableOpacity
          key={chip.id}
          onPress={() => onToggle?.(chip.id)}
          className={`px-3 py-1 rounded-full border ${
            active ? 'bg-accent border-accent' : 'bg-navy-700 border-navy-600'
          }`}
          activeOpacity={0.75}
        >
          <Text className={`text-xs font-semibold ${active ? 'text-navy-900' : 'text-ink-secondary'}`}>
            {chip.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);
