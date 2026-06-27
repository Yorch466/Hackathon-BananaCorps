import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { useTopSuppliers } from '@/features/dashboard/hooks';
import { useRouter } from 'expo-router';

interface SupplierItemProps {
  id: string;
  name: string;
  stock: number;
  rating: number;
  onPress: (id: string) => void;
}

const SupplierItem = ({ id, name, stock, rating, onPress }: SupplierItemProps) => (
  <TouchableOpacity 
    onPress={() => onPress(id)}
    activeOpacity={0.8}
    className="flex-row items-center bg-navy-800 rounded-2xl p-4 mb-3"
  >
    <View className="bg-navy-700 p-3 rounded-xl">
      <Icon name="box" size={24} color="#1DB88A" />
    </View>

    <View className="flex-1 ml-4">
      <Text className="text-ink-primary font-bold text-base mb-0.5" numberOfLines={1}>{name}</Text>
      <Text className="text-ink-secondary text-xs">{stock} repuestos · stock</Text>
    </View>

    <View className="flex-row items-center">
      <View className="flex-row mr-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Icon key={i} name="starFill" size={10} color={i < Math.round(rating) ? "#1DB88A" : "#1A2540"} />
        ))}
      </View>
      <Icon name="chevronRight" size={18} color="#4B5563" />
    </View>
  </TouchableOpacity>
);

export const SupplierList = ({ data: suppliers, isFiltered }: { data?: any[], isFiltered?: boolean }) => {
  const router = useRouter();
  const { isLoading } = useTopSuppliers();

  const handlePress = (id: string) => {
    router.push({
      pathname: '/shop/[id]',
      params: { id, type: 'proveedor' }
    });
  };

  if (isLoading && !suppliers) {
    return (
      <View className="mt-8 mb-8 items-center justify-center">
        <ActivityIndicator color="#1DB88A" />
      </View>
    );
  }

  return (
    <View className="mt-8 px-4 mb-8">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-ink-primary font-bold text-lg">Proveedores</Text>
        <TouchableOpacity>
          <Text className="text-accent text-xs font-semibold">Ver todos →</Text>
        </TouchableOpacity>
      </View>

      {isFiltered && suppliers?.length === 0 ? (
        <View className="py-4">
          <Text className="text-ink-secondary text-xs italic">No se encontraron proveedores coincidentes</Text>
        </View>
      ) : (
        suppliers?.map((p: any) => (
          <SupplierItem 
            key={p.id_proveedor}
            id={p.id_proveedor}
            name={p.nombre_proveedor} 
            stock={p.totalStock} 
            rating={p.rating} 
            onPress={handlePress}
          />
        ))
      )}
    </View>
  );
};

