import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { ChipList } from '@/components/profile/ChipList';
import { ServicesEditor } from '@/components/profile/ServicesEditor';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCurrentProfile,
  useUpdateTallerProfile,
  useUpdateTallerEspecialidades,
  useAllEspecialidades,
  useDeleteServicio,
} from '@/features/profile/hooks';
import { pickAndCompress, uploadCompressedImage } from '@/lib/uploadImage';
import { supabase } from '@/lib/supabase';
import { LocationPickerModal } from '@/components/map/LocationPickerModal';
import type { TallerProfile, HibridoProfile } from '@/types/user';
import type { DbServicio } from '@/types/database';

const schema = z.object({
  nombre_taller: z.string().min(2, 'Mínimo 2 caracteres'),
  descripcion: z.string().max(400, 'Máximo 400 caracteres').optional().or(z.literal('')),
  telefono: z.string().min(7, 'Teléfono inválido').optional().or(z.literal('')),
  correo: z.string().email('Correo inválido').optional().or(z.literal('')),
  direccion: z.string().optional().or(z.literal('')),
  horario_apertura: z.string().optional().or(z.literal('')),
  horario_cierre: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface FieldProps {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, icon, error, children }: FieldProps) {
  return (
    <View className="mb-4">
      <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-1.5">{label}</Text>
      <View className={`flex-row items-center bg-navy-800 rounded-xl px-3 border ${error ? 'border-danger' : 'border-navy-700'}`}>
        {icon && <View className="mr-2">{icon}</View>}
        {children}
      </View>
      {error ? <Text className="text-danger text-xs mt-1">{error}</Text> : null}
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-3 mt-2">{label}</Text>
  );
}

function formatTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export default function EditTallerProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data: profile, isLoading } = useCurrentProfile();
  const { mutateAsync: updateTaller, isPending: isSaving } = useUpdateTallerProfile();
  const { mutateAsync: updateEspecialidades } = useUpdateTallerEspecialidades();
  const { mutateAsync: deleteServicio } = useDeleteServicio();
  const { data: allEspecialidades = [] } = useAllEspecialidades();

  const [selectedEspecialidades, setSelectedEspecialidades] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (profile?.role === 'taller' || profile?.role === 'hibrido') {
      const p = profile as TallerProfile | HibridoProfile;
      setAvatarUrl((prev) => prev ?? (p.taller.perfil_taller_url || null));
      setBannerUrl((prev) => prev ?? (p.taller.banner_taller_url || null));
      reset({
        nombre_taller: p.taller.nombre_taller,
        descripcion: p.taller.descripcion ?? '',
        telefono: p.taller.telefono ?? '',
        correo: p.taller.correo ?? '',
        direccion: p.taller.direccion ?? '',
        horario_apertura: p.taller.horario_apertura ?? '',
        horario_cierre: p.taller.horario_cierre ?? '',
      });
      setSelectedEspecialidades(p.especialidades.map((e) => e.id_especialidad));
    }
  }, [profile, reset]);

  const isTallerProfile = () =>
    profile?.role === 'taller' || profile?.role === 'hibrido';

  const handleAvatarPress = () => {
    if (uploadingAvatar || !isTallerProfile()) return;
    const prof = profile as TallerProfile | HibridoProfile;
    Alert.alert('Cambiar foto', 'Elige una opción', [
      { text: 'Cámara',  onPress: () => doAvatarUpload(prof, 'camera') },
      { text: 'Galería', onPress: () => doAvatarUpload(prof, 'gallery') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const doAvatarUpload = async (prof: TallerProfile | HibridoProfile, source: 'camera' | 'gallery') => {
    try {
      const localUri = await pickAndCompress(source, 'avatar');
      if (!localUri) return;
      setAvatarUrl(localUri);
      setUploadingAvatar(true);
      const url = await uploadCompressedImage(localUri, `talleres/perfil/${prof.taller.id_taller}.webp`);
      if (!url) { Alert.alert('Error storage', 'No se pudo subir al servidor.'); return; }
      const { error: dbErr } = await supabase.from('taller').update({ perfil_taller_url: url }).eq('id_taller', prof.taller.id_taller);
      if (dbErr) Alert.alert('Error BD', dbErr.message);
      else qc.invalidateQueries({ queryKey: ['profile', 'current'] });
    } catch {
      Alert.alert('Error', 'No se pudo subir la foto.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleBannerPress = () => {
    if (uploadingBanner || !isTallerProfile()) return;
    const prof = profile as TallerProfile | HibridoProfile;
    Alert.alert('Cambiar banner', 'Elige una opción', [
      { text: 'Cámara',  onPress: () => doBannerUpload(prof, 'camera') },
      { text: 'Galería', onPress: () => doBannerUpload(prof, 'gallery') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const doBannerUpload = async (prof: TallerProfile | HibridoProfile, source: 'camera' | 'gallery') => {
    try {
      const localUri = await pickAndCompress(source, 'banner');
      if (!localUri) return;
      setBannerUrl(localUri);
      setUploadingBanner(true);
      const url = await uploadCompressedImage(localUri, `talleres/banner/${prof.taller.id_taller}.webp`);
      if (!url) { Alert.alert('Error storage', 'No se pudo subir el banner.'); return; }
      const { error: dbErr } = await supabase.from('taller').update({ banner_taller_url: url }).eq('id_taller', prof.taller.id_taller);
      if (dbErr) Alert.alert('Error BD', dbErr.message);
      else qc.invalidateQueries({ queryKey: ['profile', 'current'] });
    } catch {
      Alert.alert('Error', 'No se pudo subir el banner.');
    } finally {
      setUploadingBanner(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (profile?.role !== 'taller' && profile?.role !== 'hibrido') return;
    const p = profile as TallerProfile | HibridoProfile;
    try {
      await Promise.all([
        updateTaller({ id: p.taller.id_taller, data: { ...values } }),
        updateEspecialidades({ tallerId: p.taller.id_taller, ids: selectedEspecialidades }),
      ]);
      router.back();
    } catch {
      Alert.alert('Error', 'No se pudo guardar. Inténtalo de nuevo.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert('Eliminar cuenta', 'Esta acción es irreversible. ¿Continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => {} },
    ]);
  };

  const toggleEspecialidad = (id: string) => {
    setSelectedEspecialidades((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-navy-900 items-center justify-center">
        <ActivityIndicator color="#1DB88A" />
      </View>
    );
  }

  const p = profile as TallerProfile | HibridoProfile | undefined;
  const initials = (p?.taller.nombre_taller ?? 'T').slice(0, 2).toUpperCase();
  const servicios: DbServicio[] = p?.servicios ?? [];
  const tallerId = p?.taller.id_taller ?? '';

  return (
    <KeyboardAvoidingView className="flex-1 bg-navy-900" behavior="padding">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pb-3 border-b border-navy-700" style={{ paddingTop: insets.top + 12 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="chevronLeft" size={24} color="#1DB88A" />
        </TouchableOpacity>
        <Text className="text-ink-primary text-base font-bold">Editar perfil — Taller</Text>
        <TouchableOpacity onPress={handleSubmit(onSubmit)} disabled={isSaving} className={isSaving ? 'opacity-50' : ''}>
          <Text className="text-accent font-bold text-sm">{isSaving ? 'Guardando…' : 'Guardar'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        {/* Banner */}
        <View className="h-24 bg-navy-800 overflow-hidden">
          {bannerUrl
            ? <Image source={{ uri: bannerUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            : <LinearGradient colors={['#162347', '#0D1B3E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="flex-1" />}
          <TouchableOpacity
            onPress={handleBannerPress}
            disabled={uploadingBanner}
            className="absolute top-3 right-3 bg-navy-700 px-3 py-1.5 rounded-lg flex-row items-center gap-1.5"
            activeOpacity={0.8}
          >
            {uploadingBanner
              ? <ActivityIndicator size={13} color="#94A3B8" />
              : <Icon name="upload" size={13} color="#94A3B8" />}
            <Text className="text-ink-secondary text-xs">Cambiar banner</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View className="items-center -mt-8 mb-5">
          <TouchableOpacity onPress={handleAvatarPress} disabled={uploadingAvatar} activeOpacity={0.8}>
            <View className="border-2 border-navy-900 rounded-full">
              <Avatar size={72} uri={avatarUrl} initials={initials} bgColor="#243050" />
            </View>
            <View className="absolute -bottom-1 -right-1 bg-accent rounded-full p-1">
              {uploadingAvatar
                ? <ActivityIndicator size={12} color="#0D1B3E" />
                : <Icon name="camera" size={12} color="#0D1B3E" />}
            </View>
          </TouchableOpacity>
        </View>

        <View className="px-4">
          <SectionLabel label="Datos Generales" />

          <Controller
            control={control}
            name="nombre_taller"
            render={({ field: { value, onChange, onBlur } }) => (
              <Field label="Nombre del Taller" error={errors.nombre_taller?.message}>
                <TextInput
                  className="flex-1 text-ink-primary text-sm py-3.5"
                  placeholder="Nombre del taller"
                  placeholderTextColor="#4B5563"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              </Field>
            )}
          />

          <Controller
            control={control}
            name="descripcion"
            render={({ field: { value, onChange, onBlur } }) => (
              <View className="mb-4">
                <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-1.5">Descripción</Text>
                <TextInput
                  className="bg-navy-800 text-ink-primary text-sm rounded-xl px-3 py-3 border border-navy-700"
                  placeholder="Describe tu taller…"
                  placeholderTextColor="#4B5563"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  style={{ minHeight: 80 }}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="telefono"
            render={({ field: { value, onChange, onBlur } }) => (
              <Field label="Teléfono" icon={<Icon name="phone" size={16} color="#4B5563" />} error={errors.telefono?.message}>
                <TextInput
                  className="flex-1 text-ink-primary text-sm py-3.5"
                  placeholder="+591 70000000"
                  placeholderTextColor="#4B5563"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="phone-pad"
                />
              </Field>
            )}
          />

          <Controller
            control={control}
            name="correo"
            render={({ field: { value, onChange, onBlur } }) => (
              <Field label="Correo de empresa" icon={<Icon name="mail" size={16} color="#4B5563" />} error={errors.correo?.message}>
                <TextInput
                  className="flex-1 text-ink-primary text-sm py-3.5"
                  placeholder="contacto@taller.com"
                  placeholderTextColor="#4B5563"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </Field>
            )}
          />

          {/* Correo personal read-only */}
          <View className="mb-4">
            <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-1.5">Correo personal</Text>
            <View className="flex-row items-center bg-navy-800 rounded-xl px-3 border border-navy-700 opacity-60">
              <Icon name="mail" size={16} color="#4B5563" />
              <Text className="flex-1 text-ink-secondary text-sm py-3.5 ml-2">
                {(profile as TallerProfile | HibridoProfile | undefined)?.usuario?.email ?? ''}
              </Text>
            </View>
            <Text className="text-ink-muted text-xs mt-1">El correo de acceso no se puede modificar aquí.</Text>
          </View>

          <Controller
            control={control}
            name="direccion"
            render={({ field: { value, onChange, onBlur } }) => (
              <Field label="Dirección" icon={<Icon name="pin" size={16} color="#4B5563" />} error={errors.direccion?.message}>
                <TextInput
                  className="flex-1 text-ink-primary text-sm py-3.5"
                  placeholder="Av. ..."
                  placeholderTextColor="#4B5563"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              </Field>
            )}
          />

          {/* Ubicación */}
          <SectionLabel label="Ubicación en Mapa" />
          <View className="mb-4">
            <TouchableOpacity
              onPress={() => setShowLocationPicker(true)}
              className="flex-row items-center bg-navy-800 rounded-xl px-3 py-3.5 border border-navy-700"
              activeOpacity={0.8}
            >
              <Icon name="map" size={16} color="#4B5563" />
              <Text className="flex-1 text-ink-primary text-sm ml-2">
                {p?.taller.lat && p?.taller.lng && (p.taller.lat !== 0 || p.taller.lng !== 0)
                  ? `${p.taller.lat.toFixed(5)}, ${p.taller.lng.toFixed(5)}`
                  : 'Toca para registrar tu ubicación'}
              </Text>
              <Icon name="chevronRight" size={16} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Horario */}
          <SectionLabel label="Horario de Atención" />
          <View className="flex-row gap-3 mb-4">
            <Controller
              control={control}
              name="horario_apertura"
              render={({ field: { value, onChange, onBlur } }) => (
                <View className="flex-1">
                  <Text className="text-ink-secondary text-xs mb-1">Apertura</Text>
                  <View className="flex-row items-center bg-navy-800 rounded-xl px-3 border border-navy-700">
                    <Icon name="clock" size={15} color="#4B5563" />
                    <TextInput
                      className="flex-1 text-ink-primary text-sm py-3 ml-2"
                      placeholder="08:00"
                      placeholderTextColor="#4B5563"
                      value={value}
                      onChangeText={(t) => onChange(formatTimeInput(t))}
                      onBlur={onBlur}
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                  </View>
                </View>
              )}
            />
            <Controller
              control={control}
              name="horario_cierre"
              render={({ field: { value, onChange, onBlur } }) => (
                <View className="flex-1">
                  <Text className="text-ink-secondary text-xs mb-1">Cierre</Text>
                  <View className="flex-row items-center bg-navy-800 rounded-xl px-3 border border-navy-700">
                    <TextInput
                      className="flex-1 text-ink-primary text-sm py-3"
                      placeholder="18:00"
                      placeholderTextColor="#4B5563"
                      value={value}
                      onChangeText={(t) => onChange(formatTimeInput(t))}
                      onBlur={onBlur}
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                  </View>
                </View>
              )}
            />
          </View>

          {/* Especialidades */}
          <SectionLabel label="Especialidades" />
          <View className="mb-5">
            <ChipList
              chips={allEspecialidades.map((e) => ({ id: e.id_especialidad, label: e.nombre_especialidad }))}
              selected={selectedEspecialidades}
              onToggle={toggleEspecialidad}
            />
          </View>

          {/* Servicios */}
          <SectionLabel label="Mis Servicios" />
          <ServicesEditor
            tallerId={tallerId}
            servicios={servicios}
            onDelete={async (id) => { await deleteServicio(id); }}
          />

          {/* Guardar */}
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={isSaving}
            className={`mt-4 bg-accent py-3.5 rounded-xl items-center ${isSaving ? 'opacity-50' : ''}`}
            activeOpacity={0.85}
          >
            <Text className="text-navy-900 font-bold">Guardar cambios</Text>
          </TouchableOpacity>

          {/* Eliminar */}
          <TouchableOpacity
            onPress={handleDeleteAccount}
            className="mt-3 border border-danger rounded-xl py-3.5 flex-row items-center justify-center gap-2"
            activeOpacity={0.75}
          >
            <Icon name="trash" size={16} color="#EF4444" />
            <Text className="text-danger font-semibold text-sm">Eliminar cuenta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {p && (
        <LocationPickerModal
          visible={showLocationPicker}
          onClose={() => setShowLocationPicker(false)}
          usuarioId={p.usuario.id_usuario}
          role={profile!.role}
          onSuccess={() => {
            setShowLocationPicker(false);
            qc.invalidateQueries({ queryKey: ['profile', 'current'] });
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
}
