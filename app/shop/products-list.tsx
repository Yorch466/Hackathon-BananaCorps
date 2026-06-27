import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { usePublicProveedorProfile } from '@/features/profile/hooks';
import type { ProductoItem } from '@/types/database';

function ProductoCard({ producto }: { producto: ProductoItem }) {
  const firstImg = producto.imagenes[0]?.imagen_url;
  return (
    <View className="bg-navy-800 rounded-2xl overflow-hidden" style={{ flex: 1, margin: 6 }}>
      <View style={{ height: 110 }} className="bg-navy-700 items-center justify-center">
        {firstImg ? (
          <Image source={{ uri: firstImg }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <Icon name="box" size={36} color="#4B5563" />
        )}
      </View>
      <View className="p-3">
        <Text className="text-ink-primary text-sm font-bold" numberOfLines={2}>{producto.nombre}</Text>
        {producto.descripcion ? (
          <Text className="text-ink-secondary text-xs mt-1" numberOfLines={2}>{producto.descripcion}</Text>
        ) : null}
        {producto.precio != null ? (
          <Text className="text-accent text-sm font-bold mt-1">Bs. {producto.precio}</Text>
        ) : null}
        <Text className="text-ink-muted text-xs mt-1">{producto.cantidad} en stock</Text>
      </View>
    </View>
  );
}

export default function ProductsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = usePublicProveedorProfile(id);
  const [search, setSearch] = useState('');

  const productos = data?.productos ?? [];
  const filtered = search.trim()
    ? productos.filter((p) =>
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        (p.descripcion ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : productos;

  const pairs: (typeof filtered[number] | null)[][] = [];
  for (let i = 0; i < filtered.length; i += 2) {
    pairs.push([filtered[i], filtered[i + 1] ?? null]);
  }

  return (
    <View className="flex-1 bg-navy-900">
      {/* Header */}
      <View
        className="flex-row items-center gap-3 px-4 pb-3 border-b border-navy-700"
        style={{ paddingTop: insets.top + 12 }}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="chevronLeft" size={24} color="#1DB88A" />
        </TouchableOpacity>
        <Text className="text-ink-primary text-base font-bold flex-1">
          {data?.proveedor.nombre_proveedor ?? 'Productos'}
        </Text>
      </View>

      {/* Buscador */}
      <View className="px-4 py-3">
        <View className="flex-row items-center bg-navy-800 rounded-xl px-3 gap-2">
          <Icon name="search" size={16} color="#4B5563" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar producto…"
            placeholderTextColor="#4B5563"
            className="flex-1 text-ink-primary py-3 text-sm"
          />
          {search.length > 0 ? (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="close" size={14} color="#4B5563" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Lista */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1DB88A" />
        </View>
      ) : filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-ink-muted text-sm text-center">
            {search ? 'Sin resultados para tu búsqueda.' : 'Este proveedor aún no tiene productos.'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 10, paddingBottom: 32 }}>
          {pairs.map((pair, i) => (
            <View key={i} className="flex-row">
              <ProductoCard producto={pair[0]!} />
              {pair[1] ? <ProductoCard producto={pair[1]} /> : <View style={{ flex: 1, margin: 6 }} />}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
