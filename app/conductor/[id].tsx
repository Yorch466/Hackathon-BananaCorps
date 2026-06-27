import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { InfoRow } from '@/components/profile/InfoRow';
import { usePublicConductorProfile } from '@/features/profile/hooks';

export default function PublicConductorProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: usuario, isLoading, isError } = usePublicConductorProfile(id);

  if (isLoading) {
    return (
      <View className="flex-1 bg-navy-900 items-center justify-center">
        <ActivityIndicator color="#1DB88A" />
      </View>
    );
  }

  if (isError || !usuario) {
    return (
      <View className="flex-1 bg-navy-900 items-center justify-center px-6">
        <Text className="text-ink-secondary text-center">No se pudo cargar el perfil del conductor.</Text>
      </View>
    );
  }

  const displayName = usuario.email.split('@')[0];
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleCall = () => {
    const num = usuario.phone;
    if (!num) return;
    Alert.alert('Llamar', num, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Llamar', onPress: () => Linking.openURL(`tel:${num}`) },
    ]);
  };

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
        <Text className="text-ink-primary text-base font-bold flex-1" numberOfLines={1}>
          Perfil del conductor
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Avatar block */}
        <View className="h-24 bg-navy-800" />
        <View className="px-4 pb-4">
          <View className="flex-row items-end -mt-10 mb-3">
            <View
              style={{
                borderRadius: 44,
                borderWidth: 3,
                borderColor: '#0D1B3E',
              }}
            >
              <Avatar size={72} uri={usuario.avatar_url} initials={initials} bgColor="#243050" />
            </View>
            <View className="ml-3 pb-1">
              <View className="bg-navy-700 px-2.5 py-0.5 rounded-full">
                <Text className="text-ink-secondary text-xs font-bold">Conductor</Text>
              </View>
            </View>
          </View>
          <Text className="text-ink-primary text-xl font-bold">{displayName}</Text>
        </View>

        {/* Action buttons */}
        {usuario.phone ? (
          <View className="px-4 pb-2">
            <TouchableOpacity
              onPress={handleCall}
              className="border border-navy-600 py-2.5 rounded-xl flex-row items-center justify-center gap-2"
              activeOpacity={0.8}
            >
              <Icon name="call" size={16} color="#FFFFFF" />
              <Text className="text-ink-primary text-sm">Llamar</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Info */}
        <View className="mx-4 mt-2 bg-navy-800 rounded-2xl overflow-hidden">
          <InfoRow icon="id" value={usuario.ci || '—'} />
          <InfoRow icon="phone" value={usuario.phone || '—'} />
          <InfoRow icon="mail" value={usuario.email || '—'} last />
        </View>
      </ScrollView>
    </View>
  );
}
