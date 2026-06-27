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
import { usePublicTallerProfile } from '@/features/profile/hooks';
import type { DbServicio } from '@/types/database';

function ServicioCard({ servicio }: { servicio: DbServicio }) {
  return (
    <View className="bg-navy-800 rounded-2xl overflow-hidden" style={{ flex: 1, margin: 6 }}>
      <View style={{ height: 110 }} className="bg-navy-700 items-center justify-center">
        {servicio.imagen_servicio_url ? (
          <Image source={{ uri: servicio.imagen_servicio_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <Icon name="wrench" size={36} color="#1DB88A" />
        )}
      </View>
      <View className="p-3">
        <Text className="text-ink-primary text-sm font-bold" numberOfLines={2}>{servicio.nombre_servicio}</Text>
        {servicio.descripcion ? (
          <Text className="text-ink-secondary text-xs mt-1" numberOfLines={2}>{servicio.descripcion}</Text>
        ) : null}
        {servicio.duracion ? (
          <Text className="text-ink-muted text-xs mt-1">{servicio.duracion}</Text>
        ) : null}
        {servicio.precio != null ? (
          <Text className="text-accent text-sm font-bold mt-1">Bs. {servicio.precio}</Text>
        ) : null}
      </View>
    </View>
  );
}

export default function ServicesListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = usePublicTallerProfile(id);
  const [search, setSearch] = useState('');

  const servicios = data?.servicios ?? [];
  const filtered = search.trim()
    ? servicios.filter((s) =>
        s.nombre_servicio.toLowerCase().includes(search.toLowerCase()) ||
        (s.descripcion ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : servicios;

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
          {data?.taller.nombre_taller ?? 'Servicios'}
        </Text>
      </View>

      {/* Buscador */}
      <View className="px-4 py-3">
        <View className="flex-row items-center bg-navy-800 rounded-xl px-3 gap-2">
          <Icon name="search" size={16} color="#4B5563" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar servicio…"
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
            {search ? 'Sin resultados para tu búsqueda.' : 'Este taller aún no tiene servicios.'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 10, paddingBottom: 32 }}>
          {pairs.map((pair, i) => (
            <View key={i} className="flex-row">
              <ServicioCard servicio={pair[0]!} />
              {pair[1] ? <ServicioCard servicio={pair[1]} /> : <View style={{ flex: 1, margin: 6 }} />}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
