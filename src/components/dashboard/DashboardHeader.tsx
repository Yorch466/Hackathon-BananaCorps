import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { useAuthStore } from '@/features/auth/store';

interface DashboardHeaderProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onSearchSubmit: (text: string) => void;
}

export const DashboardHeader = ({ searchQuery, onSearchChange, onSearchSubmit }: DashboardHeaderProps) => {
  const { user } = useAuthStore();
  const firstName = user?.name?.split(' ')[0] || 'Conductor';

  return (
    <View className="px-4 pt-4 pb-2">
      {/* Top Row */}
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-row items-center flex-1">
          <Avatar initials={user?.name || 'JM'} size={44} uri={user?.avatar_url} />
          <View className="ml-3">
            <Text className="text-ink-secondary text-xs">Hola, {firstName}</Text>
            <View className="flex-row items-center mt-0.5">
              <Icon name="pin" size={14} color="#1DB88A" />
              <Text className="text-ink-primary font-bold ml-1 text-sm">Santa Cruz - Centro</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity className="relative p-2 bg-navy-800 rounded-full">
          <Icon name="bell" size={22} color="#FFFFFF" />
          <View className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-danger rounded-full border-2 border-navy-800" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="flex-row items-center gap-3">
        <View className="flex-1 flex-row items-center bg-navy-800 rounded-xl px-4 py-3">
          <Icon name="search" size={20} color="#94A3B8" />
          <TextInput
            placeholder="Buscar talleres, repuestos..."
            placeholderTextColor="#94A3B8"
            className="flex-1 ml-3 text-ink-primary text-sm"
            value={searchQuery}
            onChangeText={onSearchChange}
            onSubmitEditing={() => onSearchSubmit(searchQuery)}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange('')}>
              <Icon name="close" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity className="bg-accent p-3.5 rounded-xl">
          <Icon name="filter" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

