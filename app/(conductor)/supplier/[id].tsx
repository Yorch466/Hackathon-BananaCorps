import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { BannerCard } from '@/components/profile/BannerCard';
import { InfoRow } from '@/components/profile/InfoRow';
import { ChipList } from '@/components/profile/ChipList';
import { RatingCard } from '@/components/profile/RatingCard';
import { RateModal } from '@/components/profile/RateModal';
import {
  useCurrentProfile,
  usePublicTallerProfile,
  usePublicProveedorProfile,
  useIsFavorito,
  useToggleFavorito,
  useRatingDistribution,
  useMyRating,
  useSubmitCalificacion,
} from '@/features/profile/hooks';
import type { DbServicio } from '@/types/database';

function SectionLabel({ label, action, onAction }: { label: string; action?: string; onAction?: () => void }) {
  return (
    <View className="flex-row items-center justify-between px-4 pt-5 pb-2">
      <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase">{label}</Text>
      {action ? (
        <TouchableOpacity onPress={onAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text className="text-accent text-xs font-semibold">{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function ServicioCard({ servicio }: { servicio: DbServicio }) {
  return (
    <View style={{ width: 140 }} className="bg-navy-800 rounded-2xl overflow-hidden mr-3">
      <View style={{ height: 90 }} className="bg-navy-700 items-center justify-center">
        {servicio.imagen_servicio_url ? (
          <Image source={{ uri: servicio.imagen_servicio_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <Icon name="wrench" size={32} color="#1DB88A" />
        )}
      </View>
      <View className="p-3">
        <Text className="text-ink-primary text-xs font-bold" numberOfLines={2}>{servicio.nombre_servicio}</Text>
        {servicio.duracion ? <Text className="text-ink-secondary text-xs mt-1">{servicio.duracion}</Text> : null}
        {servicio.precio != null ? <Text className="text-accent text-xs font-bold mt-1">Bs. {servicio.precio}</Text> : null}
      </View>
    </View>
  );
}

function ProductoCard({ nombre, precio, imagenUrl }: { nombre: string; precio: number | null; imagenUrl?: string }) {
  return (
    <View style={{ width: 140 }} className="bg-navy-800 rounded-2xl overflow-hidden mr-3">
      <View style={{ height: 90 }} className="bg-navy-700 items-center justify-center">
        {imagenUrl ? (
          <Image source={{ uri: imagenUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <Icon name="box" size={32} color="#4B5563" />
        )}
      </View>
      <View className="p-3">
        <Text className="text-ink-primary text-xs font-bold" numberOfLines={2}>{nombre}</Text>
        {precio != null ? <Text className="text-accent text-xs font-bold mt-1">Bs. {precio}</Text> : null}
      </View>
    </View>
  );
}

export default function ConductorShopProfile() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>();
  const entidadTipo: 'taller' | 'proveedor' = type === 'proveedor' ? 'proveedor' : 'taller';

  const [rateModalVisible, setRateModalVisible] = useState(false);

  const { data: tallerData,    isLoading: loadingTaller,    isError: errorTaller }    = usePublicTallerProfile(entidadTipo === 'taller' ? id : '');
  const { data: proveedorData, isLoading: loadingProveedor, isError: errorProveedor } = usePublicProveedorProfile(entidadTipo === 'proveedor' ? id : '');

  const isLoading = entidadTipo === 'taller' ? loadingTaller    : loadingProveedor;
  const isError   = entidadTipo === 'taller' ? errorTaller      : errorProveedor;
  const hasData   = entidadTipo === 'taller' ? !!tallerData     : !!proveedorData;

  const entityName  = entidadTipo === 'taller' ? tallerData?.taller.nombre_taller : proveedorData?.proveedor.nombre_proveedor;
  const entityImage = entidadTipo === 'taller' ? tallerData?.taller.perfil_taller_url : proveedorData?.proveedor.perfil_proveedor_url;

  const { data: currentProfile } = useCurrentProfile();
  const conductorId = currentProfile?.role === 'conductor' ? currentProfile.usuario.id_usuario : null;

  const handleRuta = (lat: number | null | undefined, lng: number | null | undefined) => {
    if (!lat || !lng || lat === 0 || lng === 0) return;
    router.push({ pathname: '/(conductor)/map' as any, params: { focusLat: lat.toString(), focusLng: lng.toString() } });
  };

  const { data: isFav = false }                         = useIsFavorito(conductorId ?? '', id, entidadTipo);
  const { mutateAsync: toggleFav, isPending: togglingFav } = useToggleFavorito();
  const { data: distribution }                          = useRatingDistribution(id);
  const { data: myRating }                              = useMyRating(conductorId ?? '', id);
  const { mutateAsync: submitCalificacion }             = useSubmitCalificacion();

  const handleToggleFav = async () => {
    if (!conductorId || !entityName) return;
    await toggleFav({ conductorId, entidadId: id, entidadTipo, nombre: entityName, imagenUrl: entityImage ?? null, isFav });
  };

  const handleSubmitRating = async (stars: number, tags: string[]) => {
    if (!conductorId) return;
    await submitCalificacion({ conductorId, entidadId: id, estrellas: stars, tags });
  };

  const handleCall = (num: string | null | undefined) => {
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
          {entityName ?? (entidadTipo === 'taller' ? 'Taller' : 'Proveedor')}
        </Text>
        {conductorId && !isLoading && hasData ? (
          <TouchableOpacity onPress={handleToggleFav} disabled={togglingFav} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name={isFav ? 'heartFill' : 'heart'} size={22} color={isFav ? '#EF4444' : '#94A3B8'} filled={isFav} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Body */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1DB88A" />
        </View>
      ) : isError || !hasData ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-ink-secondary text-center">No se pudo cargar el perfil.</Text>
        </View>
      ) : entidadTipo === 'taller' && tallerData ? (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          <BannerCard
            name={tallerData.taller.nombre_taller}
            initials={tallerData.taller.nombre_taller.slice(0, 2).toUpperCase()}
            badge="Taller"
            rating={tallerData.rating}
            ratingCount={tallerData.ratingCount}
            bannerUri={tallerData.taller.banner_taller_url}
            avatarUri={tallerData.taller.perfil_taller_url}
            description={tallerData.taller.descripcion ?? undefined}
            direccion={tallerData.taller.direccion}
            horarioApertura={tallerData.taller.horario_apertura ?? undefined}
            horarioCierre={tallerData.taller.horario_cierre ?? undefined}
          />
          <View className="px-4 pb-2 flex-row gap-2">
            <TouchableOpacity onPress={() => handleCall(tallerData.taller.telefono)} className="flex-1 border border-navy-600 py-2.5 rounded-xl flex-row items-center justify-center gap-2" activeOpacity={0.8}>
              <Icon name="call" size={16} color="#FFFFFF" />
              <Text className="text-ink-primary text-sm">Llamar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleRuta(tallerData.taller.lat, tallerData.taller.lng)} className="flex-1 border border-navy-600 py-2.5 rounded-xl flex-row items-center justify-center gap-2" activeOpacity={0.8}>
              <Icon name="route" size={16} color="#FFFFFF" />
              <Text className="text-ink-primary text-sm">Ruta</Text>
            </TouchableOpacity>
          </View>
          <View className="mx-4 mt-2 bg-navy-800 rounded-2xl overflow-hidden">
            <InfoRow icon="phone" value={tallerData.taller.telefono || '—'} />
            <InfoRow icon="mail" value={tallerData.taller.correo || '—'} last />
          </View>
          {tallerData.especialidades.length > 0 && (
            <>
              <SectionLabel label="Especialidades" />
              <View className="px-4">
                <ChipList chips={tallerData.especialidades.map((e) => ({ id: e.id_especialidad, label: e.nombre_especialidad }))} selected={tallerData.especialidades.map((e) => e.id_especialidad)} readonly />
              </View>
            </>
          )}
          {tallerData.servicios.length > 0 && (
            <>
              <SectionLabel label="Servicios" action={tallerData.servicios.length > 5 ? `Ver más (${tallerData.servicios.length}) →` : undefined} onAction={() => router.push(`/shop/services-list?id=${id}` as any)} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}>
                {tallerData.servicios.slice(0, 5).map((s) => <ServicioCard key={s.id_servicio} servicio={s} />)}
              </ScrollView>
            </>
          )}
          <SectionLabel label="Calificación" />
          <RatingCard rating={tallerData.rating} ratingCount={tallerData.ratingCount} distribution={distribution} />
          {conductorId && myRating == null && (
            <View className="px-4 mt-3">
              <TouchableOpacity onPress={() => setRateModalVisible(true)} className="bg-accent py-3 rounded-xl flex-row items-center justify-center gap-2" activeOpacity={0.85}>
                <Icon name="starFill" size={16} color="#0D1B3E" filled />
                <Text className="text-navy-900 font-bold text-sm">Calificar</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      ) : proveedorData ? (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          <BannerCard
            name={proveedorData.proveedor.nombre_proveedor}
            initials={proveedorData.proveedor.nombre_proveedor.slice(0, 2).toUpperCase()}
            badge="Proveedor"
            rating={proveedorData.rating}
            ratingCount={proveedorData.ratingCount}
            bannerUri={proveedorData.proveedor.banner_proveedor_url}
            avatarUri={proveedorData.proveedor.perfil_proveedor_url}
            description={proveedorData.proveedor.descripcion ?? undefined}
            direccion={proveedorData.proveedor.direccion}
            horarioApertura={proveedorData.proveedor.horario_apertura ?? undefined}
            horarioCierre={proveedorData.proveedor.horario_cierre ?? undefined}
          />
          <View className="px-4 pb-2 flex-row gap-2">
            <TouchableOpacity onPress={() => handleCall(proveedorData.proveedor.telefono)} className="flex-1 border border-navy-600 py-2.5 rounded-xl flex-row items-center justify-center gap-2" activeOpacity={0.8}>
              <Icon name="call" size={16} color="#FFFFFF" />
              <Text className="text-ink-primary text-sm">Llamar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleRuta(proveedorData.proveedor.lat, proveedorData.proveedor.lng)} className="flex-1 border border-navy-600 py-2.5 rounded-xl flex-row items-center justify-center gap-2" activeOpacity={0.8}>
              <Icon name="route" size={16} color="#FFFFFF" />
              <Text className="text-ink-primary text-sm">Ruta</Text>
            </TouchableOpacity>
          </View>
          <View className="mx-4 mt-2 bg-navy-800 rounded-2xl overflow-hidden">
            <InfoRow icon="phone" value={proveedorData.proveedor.telefono || '—'} />
            <InfoRow icon="mail" value={proveedorData.proveedor.correo || '—'} last />
          </View>
          {proveedorData.productos.length > 0 && (
            <>
              <SectionLabel label="Productos" action={proveedorData.productos.length > 5 ? `Ver más (${proveedorData.productos.length}) →` : undefined} onAction={() => router.push(`/shop/products-list?id=${id}` as any)} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}>
                {proveedorData.productos.slice(0, 5).map((p) => (
                  <ProductoCard key={p.stock_id} nombre={p.nombre} precio={p.precio} imagenUrl={p.imagenes[0]?.imagen_url} />
                ))}
              </ScrollView>
            </>
          )}
          <SectionLabel label="Calificación" />
          <RatingCard rating={proveedorData.rating} ratingCount={proveedorData.ratingCount} distribution={distribution} />
          {conductorId && myRating == null && (
            <View className="px-4 mt-3">
              <TouchableOpacity onPress={() => setRateModalVisible(true)} className="bg-accent py-3 rounded-xl flex-row items-center justify-center gap-2" activeOpacity={0.85}>
                <Icon name="starFill" size={16} color="#0D1B3E" filled />
                <Text className="text-navy-900 font-bold text-sm">Calificar</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      ) : null}

      {conductorId && entityName ? (
        <RateModal
          visible={rateModalVisible}
          entityName={entityName}
          entityType={entidadTipo}
          onClose={() => setRateModalVisible(false)}
          onSubmit={handleSubmitRating}
        />
      ) : null}
    </View>
  );
}
