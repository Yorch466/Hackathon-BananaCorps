import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Icon, IconName } from '@/components/ui/Icon';
import { useDashboardStats } from '@/features/dashboard/hooks';

interface CategoryItemProps {
  icon: IconName;
  label: string;
  count: number;
}

const CategoryItem = ({ icon, label, count }: CategoryItemProps) => (
  <TouchableOpacity className="bg-navy-800 rounded-2xl p-4 items-center flex-1 mx-1.5">
    <View className="bg-navy-700 p-3 rounded-xl mb-3">
      <Icon name={icon} size={24} color="#1DB88A" />
    </View>
    <Text className="text-ink-primary font-semibold text-xs mb-1">{label}</Text>
    <Text className="text-ink-secondary text-[10px]">{count}</Text>
  </TouchableOpacity>
);

export const CategorySection = () => {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <View className="px-4 mt-4 h-32 items-center justify-center">
        <ActivityIndicator color="#1DB88A" />
      </View>
    );
  }

  return (
    <View className="px-4 mt-4">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-ink-primary font-bold text-lg">Categorías</Text>
        <TouchableOpacity>
          <Text className="text-accent text-xs font-semibold">Todas →</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row -mx-1.5">
        <CategoryItem icon="wrench" label="Talleres" count={stats?.talleresCount ?? 0} />
        <CategoryItem icon="box" label="Repuestos" count={stats?.repuestosCount ?? 0} />
        <CategoryItem icon="truck" label="Remolque" count={stats?.remolqueCount ?? 0} />
        <CategoryItem icon="bolt" label="Eléctricos" count={stats?.electricosCount ?? 0} />
      </View>
    </View>
  );
};
