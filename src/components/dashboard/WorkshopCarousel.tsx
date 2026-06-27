import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { useNearbyWorkshops } from '@/features/dashboard/hooks';
import { useRouter } from 'expo-router';

interface WorkshopCardProps {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  distance: string;
  isOpen?: boolean;
  bannerUrl?: string | null;
  onPress: (id: string) => void;
}

const WorkshopCard = ({ id, name, specialty, rating, distance, isOpen, bannerUrl, onPress }: WorkshopCardProps) => (
  <TouchableOpacity 
    onPress={() => onPress(id)}
    activeOpacity={0.8}
    className="bg-navy-800 rounded-2xl w-64 mr-4 overflow-hidden"
  >
    {/* Banner Image or Placeholder */}
    <View className="h-28 bg-navy-700 items-center justify-center relative">
      {bannerUrl ? (
        <Image 
          source={{ uri: bannerUrl }} 
          className="absolute inset-0 w-full h-full"
          resizeMode="cover"
        />
      ) : (
        <>
          <View className="absolute inset-0 opacity-10 flex-row flex-wrap">
            {Array.from({ length: 20 }).map((_, i) => (
              <View key={i} className="w-16 h-16 border-r border-b border-white" style={{ transform: [{ rotate: '45deg' }] }} />
            ))}
          </View>
          <Text className="text-ink-secondary text-[10px] font-bold tracking-widest opacity-50 uppercase">BANNER · {name.toUpperCase()}</Text>
        </>
      )}
    </View>

    <View className="p-4">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-ink-primary font-bold text-base" numberOfLines={1}>{name}</Text>
        <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="heart" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>
      <Text className="text-ink-secondary text-xs mb-3" numberOfLines={1}>{specialty}</Text>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Icon name="starFill" size={14} color="#1DB88A" />
          <Text className="text-accent font-bold text-xs ml-1">{rating.toFixed(1)}</Text>
          <View className="w-1 h-1 rounded-full bg-ink-muted mx-2" />
          <Text className="text-ink-secondary text-xs">{distance}</Text>
        </View>
        
        {isOpen && (
          <View className="flex-row items-center bg-success/10 px-2 py-1 rounded-full">
            <View className="w-1.5 h-1.5 rounded-full bg-success mr-1.5" />
            <Text className="text-success text-[10px] font-bold">Abierto</Text>
          </View>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

export const WorkshopCarousel = ({ data: workshops, isFiltered }: { data?: any[], isFiltered?: boolean }) => {
  const router = useRouter();
  const { isLoading } = useNearbyWorkshops();

  const handlePress = (id: string) => {
    router.push({
      pathname: '/shop/[id]',
      params: { id, type: 'taller' }
    });
  };

  if (isLoading && !workshops) {
    return <ActivityIndicator className="mt-8" color="#1DB88A" />;
  }

  return (
    <View className="mt-8">
      <View className="px-4 flex-row items-center justify-between mb-4">
        <Text className="text-ink-primary font-bold text-lg">Talleres cerca de ti</Text>
        <TouchableOpacity onPress={() => router.push('/(conductor)/map')}>
          <Text className="text-accent text-xs font-semibold">Ver mapa →</Text>
        </TouchableOpacity>
      </View>

      {isFiltered && workshops?.length === 0 ? (
        <View className="px-4 py-4">
          <Text className="text-ink-secondary text-xs italic">No se encontraron talleres coincidentes</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {workshops?.map((t: any) => (
            <WorkshopCard 
              key={t.id_taller}
              id={t.id_taller}
              name={t.nombre_taller} 
              specialty={t.especialidad} 
              rating={t.rating} 
              distance="1.2 km"
              isOpen={t.estado === 'activo'} 
              bannerUrl={t.banner_taller_url}
              onPress={handlePress}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};
