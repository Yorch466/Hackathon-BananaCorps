import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { useActivePlans } from '@/features/dashboard/hooks';

export const PromoBanner = () => {
  const { data: plans, isLoading } = useActivePlans();
  const mainPlan = plans?.[0];

  if (isLoading) {
    return (
      <View className="mx-4 my-4 bg-navy-800 h-32 rounded-3xl items-center justify-center">
        <ActivityIndicator color="#1DB88A" />
      </View>
    );
  }

  return (
    <TouchableOpacity className="mx-4 my-4 bg-accent/10 border border-accent/20 rounded-3xl p-5 flex-row items-center justify-between overflow-hidden">
      <View className="flex-1 pr-4">
        <Text className="text-accent font-bold text-[10px] tracking-widest uppercase mb-1">PLAN {mainPlan?.nombre?.toUpperCase() || 'PRO'}</Text>
        <Text className="text-ink-primary font-bold text-lg leading-tight mb-1">
          {mainPlan?.descripcion || "Asistencia 24/7 +\nRemolque ilimitado"}
        </Text>
        <Text className="text-ink-secondary text-xs">Desde Bs. {mainPlan?.precio || 49} / mes</Text>
      </View>
      
      <View className="bg-accent/20 p-4 rounded-2xl">
        <Icon name="shield" size={40} color="#1DB88A" />
      </View>

      {/* Decorative element */}
      <View className="absolute -bottom-6 -right-6 w-24 h-24 bg-accent/5 rounded-full" />
    </TouchableOpacity>
  );
};
