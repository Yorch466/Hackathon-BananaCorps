import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { InfoRow } from '@/components/profile/InfoRow';
import { useCurrentProfile, useFavoritos } from '@/features/profile/hooks';
import { supabase } from '@/lib/supabase';
import type { ConductorProfile } from '@/types/user';
import type { DbFavorito } from '@/types/database';

function NavLink({ label, icon, onPress }: { label: string; icon: React.ReactNode; onPress?: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center px-4 py-4"
      activeOpacity={0.7}
    >
      {icon}
      <Text className="text-ink-primary text-sm ml-3 flex-1">{label}</Text>
      <Icon name="chevronRight" size={18} color="#4B5563" />
    </TouchableOpacity>
  );
}

function FavoritoRow({ item, onPress }: { item: DbFavorito; onPress: () => void }) {
  const initials = (item.nombre ?? '??').slice(0, 2).toUpperCase();
  const isTaller = item.entidad_tipo === 'taller';
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center px-4 py-3 border-b border-navy-700"
      activeOpacity={0.75}
    >
      <Avatar size={38} uri={item.imagen_url} initials={initials} bgColor="#243050" />
      <View className="flex-1 ml-3">
        <Text className="text-ink-primary text-sm font-semibold" numberOfLines={1}>
          {item.nombre ?? '—'}
        </Text>
        <Text style={{ color: isTaller ? '#1DB88A' : '#94A3B8' }} className="text-xs">
          {isTaller ? 'Taller' : 'Proveedor'}
        </Text>
      </View>
      <Icon name="chevronRight" size={16} color="#4B5563" />
    </TouchableOpacity>
  );
}

export default function ConductorProfile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: profile, isLoading, isError } = useCurrentProfile();

  const conductorId =
    profile?.role === 'conductor'
      ? (profile as ConductorProfile).usuario.id_usuario
      : null;
  const { data: favoritos = [] } = useFavoritos(conductorId ?? '');

  const handleSignOut = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que quieres cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-navy-900 items-center justify-center">
        <ActivityIndicator color="#1DB88A" />
      </View>
    );
  }

  if (isError || !profile || profile.role !== 'conductor') {
    return (
      <View className="flex-1 bg-navy-900 items-center justify-center px-6">
        <Text className="text-ink-secondary text-center">No se pudo cargar el perfil.</Text>
      </View>
    );
  }

  const { usuario, meta } = profile as ConductorProfile;
  const displayName = meta.full_name ?? usuario.email.split('@')[0];

  return (
    <ScrollView className="flex-1 bg-navy-900" contentContainerStyle={{ paddingBottom: 32 }}>

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pb-2" style={{ paddingTop: insets.top + 12 }}>
        <Text className="text-ink-primary text-xl font-bold">Mi Perfil</Text>
        <TouchableOpacity
          onPress={() => router.push('/edit-profile/conductor')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="settings" size={22} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Avatar + nombre + badge */}
      <View className="items-center py-6">
        <View
          style={{
            borderRadius: 50,
            borderWidth: 3,
            borderColor: '#1DB88A',
            shadowColor: '#1DB88A',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <Avatar size={84} uri={usuario.avatar_url} initials={displayName} bgColor="#1A2540" />
        </View>
        <Text className="text-ink-primary text-2xl font-bold mt-4">{displayName}</Text>
        <View className="bg-navy-700 px-4 py-1 rounded-full mt-1.5">
          <Text className="text-ink-secondary text-xs font-semibold tracking-wider">CONDUCTOR</Text>
        </View>
      </View>

      {/* Editar perfil */}
      <TouchableOpacity
        onPress={() => router.push('/edit-profile/conductor')}
        className="mx-4 bg-accent py-3.5 rounded-xl flex-row items-center justify-center gap-2"
        activeOpacity={0.85}
      >
        <Icon name="edit" size={16} color="#0D1B3E" />
        <Text className="text-navy-900 font-bold text-sm">Editar perfil</Text>
      </TouchableOpacity>

      {/* Datos personales */}
      <View className="mx-4 mt-4 bg-navy-800 rounded-2xl overflow-hidden">
        <InfoRow icon="id" value={usuario.ci || '—'} />
        <InfoRow icon="mail" value={usuario.email} />
        <InfoRow icon="phone" value={usuario.phone || '—'} last />
      </View>

      {/* Mis favoritos */}
      <View className="mx-4 mt-3 bg-navy-800 rounded-2xl overflow-hidden">
        <View className="flex-row items-center px-4 py-3.5 border-b border-navy-700">
          <Icon name="heartFill" size={18} color="#94A3B8" filled />
          <Text className="text-ink-primary text-sm ml-3 flex-1 font-semibold">Mis favoritos</Text>
          {favoritos.length > 0 && (
            <View className="bg-navy-700 px-2 py-0.5 rounded-full">
              <Text className="text-ink-secondary text-xs">{favoritos.length}</Text>
            </View>
          )}
        </View>

        {favoritos.length === 0 ? (
          <View className="px-4 py-5 items-center">
            <Text className="text-ink-muted text-sm text-center">
              Aún no tienes favoritos.{'\n'}Toca el corazón en un taller o proveedor para guardarlo aquí.
            </Text>
          </View>
        ) : (
          favoritos.map((item) => (
            <FavoritoRow
              key={item.id_favoritos}
              item={item}
              onPress={() =>
                router.push(`/shop/${item.taller_proveedor_id}?type=${item.entidad_tipo}` as any)
              }
            />
          ))
        )}
      </View>

      {/* Notificaciones */}
      <View className="mx-4 mt-3 bg-navy-800 rounded-2xl overflow-hidden">
        <NavLink
          label="Notificaciones"
          icon={<Icon name="bell" size={18} color="#94A3B8" />}
        />
      </View>

      {/* Cerrar sesión */}
      <TouchableOpacity
        onPress={handleSignOut}
        className="mx-4 mt-3 bg-navy-800 rounded-2xl flex-row items-center px-4 py-4 gap-3"
        activeOpacity={0.75}
      >
        <Icon name="logout" size={18} color="#EF4444" />
        <Text className="text-danger font-semibold text-sm">Cerrar sesión</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}
