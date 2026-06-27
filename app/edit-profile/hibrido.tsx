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
import {
  useCurrentProfile,
  useUpdateTallerProfile,
  useUpdateProveedorProfile,
  useUpdateTallerEspecialidades,
  useAllEspecialidades,
  useDeleteServicio,
} from '@/features/profile/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { pickAndCompress, uploadCompressedImage } from '@/lib/uploadImage';
import { supabase } from '@/lib/supabase';
import { LocationPickerModal } from '@/components/map/LocationPickerModal';
import type { HibridoProfile } from '@/types/user';
import type { DbServicio } from '@/types/database';

const tallerSchema = z.object({
  nombre_taller: z.string().min(2, 'Mínimo 2 caracteres'),
  descripcion: z.string().max(400).optional().or(z.literal('')),
  telefono: z.string().min(7).optional().or(z.literal('')),
  correo: z.string().email('Correo inválido').optional().or(z.literal('')),
  direccion: z.string().optional().or(z.literal('')),
  horario_apertura: z.string().optional().or(z.literal('')),
  horario_cierre: z.string().optional().or(z.literal('')),
});

const proveedorSchema = z.object({
  nombre_proveedor: z.string().min(2, 'Mínimo 2 caracteres'),
  descripcion_prov: z.string().max(400).optional().or(z.literal('')),
  telefono_prov: z.string().min(7).optional().or(z.literal('')),
  correo_prov: z.string().email('Correo inválido').optional().or(z.literal('')),
  direccion_prov: z.string().optional().or(z.literal('')),
  horario_apertura: z.string().optional().or(z.literal('')),
  horario_cierre: z.string().optional().or(z.literal('')),
});

type TallerForm = z.infer<typeof tallerSchema>;
type ProveedorForm = z.infer<typeof proveedorSchema>;

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

export default function EditHibridoProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data: profile, isLoading } = useCurrentProfile();
  const { mutateAsync: updateTaller, isPending: savingTaller } = useUpdateTallerProfile();
  const { mutateAsync: updateProveedor, isPending: savingProv } = useUpdateProveedorProfile();
  const { mutateAsync: updateEspecialidades } = useUpdateTallerEspecialidades();
  const { mutateAsync: deleteServicio } = useDeleteServicio();
  const { data: allEspecialidades = [] } = useAllEspecialidades();

  const [activeTab, setActiveTab] = useState<'taller' | 'proveedor'>('taller');
  const [selectedEspecialidades, setSelectedEspecialidades] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const isSaving = savingTaller || savingProv;

  const tallerForm = useForm<TallerForm>({ resolver: zodResolver(tallerSchema) });
  const proveedorForm = useForm<ProveedorForm>({ resolver: zodResolver(proveedorSchema) });

  useEffect(() => {
    if (profile?.role === 'hibrido') {
      const p = profile as HibridoProfile;
      setAvatarUrl((prev) => prev ?? (p.taller.perfil_taller_url || null));
      setBannerUrl((prev) => prev ?? (p.taller.banner_taller_url || null));
      tallerForm.reset({
        nombre_taller: p.taller.nombre_taller,
        descripcion: p.taller.descripcion ?? '',
        telefono: p.taller.telefono ?? '',
        correo: p.taller.correo ?? '',
        direccion: p.taller.direccion ?? '',
        horario_apertura: p.taller.horario_apertura ?? '',
        horario_cierre: p.taller.horario_cierre ?? '',
      });
      proveedorForm.reset({
        nombre_proveedor: p.proveedor.nombre_proveedor,
        descripcion_prov: p.proveedor.descripcion ?? '',
        telefono_prov: p.proveedor.telefono ?? '',
        correo_prov: p.proveedor.correo ?? '',
        direccion_prov: p.proveedor.direccion ?? '',
        horario_apertura: p.proveedor.horario_apertura ?? '',
        horario_cierre: p.proveedor.horario_cierre ?? '',
      });
      setSelectedEspecialidades(p.especialidades.map((e) => e.id_especialidad));
    }
  }, [profile]);

  const handleAvatarPress = () => {
    if (uploadingAvatar || profile?.role !== 'hibrido') return;
    const p = profile as HibridoProfile;
    Alert.alert('Cambiar foto', 'Elige una opción', [
      { text: 'Cámara',  onPress: () => doAvatarUpload(p, 'camera') },
      { text: 'Galería', onPress: () => doAvatarUpload(p, 'gallery') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const doAvatarUpload = async (p: HibridoProfile, source: 'camera' | 'gallery') => {
    try {
      const localUri = await pickAndCompress(source, 'avatar');
      if (!localUri) return;
      setAvatarUrl(localUri);
      setUploadingAvatar(true);
      const url = await uploadCompressedImage(localUri, `talleres/perfil/${p.taller.id_taller}.webp`);
      if (!url) { Alert.alert('Error storage', 'No se pudo subir al servidor.'); return; }
      const [t, pr] = await Promise.all([
        supabase.from('taller').update({ perfil_taller_url: url }).eq('id_taller', p.taller.id_taller),
        supabase.from('proveedor').update({ perfil_proveedor_url: url }).eq('id_proveedor', p.proveedor.id_proveedor),
      ]);
      if (t.error || pr.error) Alert.alert('Error BD', t.error?.message ?? pr.error?.message);
      else qc.invalidateQueries({ queryKey: ['profile', 'current'] });
    } catch {
      Alert.alert('Error', 'No se pudo subir la foto.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleBannerPress = () => {
    if (uploadingBanner || profile?.role !== 'hibrido') return;
    const p = profile as HibridoProfile;
    Alert.alert('Cambiar banner', 'Elige una opción', [
      { text: 'Cámara',  onPress: () => doBannerUpload(p, 'camera') },
      { text: 'Galería', onPress: () => doBannerUpload(p, 'gallery') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const doBannerUpload = async (p: HibridoProfile, source: 'camera' | 'gallery') => {
    try {
      const localUri = await pickAndCompress(source, 'banner');
      if (!localUri) return;
      setBannerUrl(localUri);
      setUploadingBanner(true);
      const url = await uploadCompressedImage(localUri, `talleres/banner/${p.taller.id_taller}.webp`);
      if (!url) { Alert.alert('Error storage', 'No se pudo subir el banner.'); return; }
      const [t, pr] = await Promise.all([
        supabase.from('taller').update({ banner_taller_url: url }).eq('id_taller', p.taller.id_taller),
        supabase.from('proveedor').update({ banner_proveedor_url: url }).eq('id_proveedor', p.proveedor.id_proveedor),
      ]);
      if (t.error || pr.error) Alert.alert('Error BD', t.error?.message ?? pr.error?.message);
      else qc.invalidateQueries({ queryKey: ['profile', 'current'] });
    } catch {
      Alert.alert('Error', 'No se pudo subir el banner.');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSave = async () => {
    if (profile?.role !== 'hibrido') return;
    const p = profile as HibridoProfile;

    const [tallerValid, provValid] = await Promise.all([
      tallerForm.trigger(),
      proveedorForm.trigger(),
    ]);
    if (!tallerValid || !provValid) return;

    const tv = tallerForm.getValues();
    const pv = proveedorForm.getValues();

    try {
      await Promise.all([
        updateTaller({
          id: p.taller.id_taller,
          data: {
            nombre_taller: tv.nombre_taller,
            descripcion: tv.descripcion,
            telefono: tv.telefono,
            correo: tv.correo,
            direccion: tv.direccion,
            horario_apertura: tv.horario_apertura,
            horario_cierre: tv.horario_cierre,
          },
        }),
        updateProveedor({
          id: p.proveedor.id_proveedor,
          data: {
            nombre_proveedor: pv.nombre_proveedor,
            descripcion: pv.descripcion_prov,
            telefono: pv.telefono_prov,
            correo: pv.correo_prov,
            direccion: pv.direccion_prov,
            horario_apertura: pv.horario_apertura,
            horario_cierre: pv.horario_cierre,
          },
        }),
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

  if (isLoading) {
    return (
      <View className="flex-1 bg-navy-900 items-center justify-center">
        <ActivityIndicator color="#1DB88A" />
      </View>
    );
  }

  const p = profile as HibridoProfile | undefined;
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
        <Text className="text-ink-primary text-base font-bold">Editar perfil — Taller / Prov.</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving} className={isSaving ? 'opacity-50' : ''}>
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
        <View className="items-center -mt-8 mb-3">
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

        {/* Tabs */}
        <View className="flex-row mx-4 mb-2 bg-navy-800 rounded-xl p-1">
          {(['taller', 'proveedor'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg items-center ${activeTab === tab ? 'bg-accent' : ''}`}
              activeOpacity={0.8}
            >
              <Text className={`text-sm font-semibold capitalize ${activeTab === tab ? 'text-navy-900' : 'text-ink-secondary'}`}>
                {tab === 'taller' ? 'Taller' : 'Proveedor'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ padding: 16 }}>
        {/* ── Taller tab ── */}
        {activeTab === 'taller' && (
          <>
            <SectionLabel label="Datos del Taller" />

            <Controller control={tallerForm.control} name="nombre_taller" render={({ field: { value, onChange, onBlur } }) => (
              <Field label="Nombre del Taller" error={tallerForm.formState.errors.nombre_taller?.message}>
                <TextInput className="flex-1 text-ink-primary text-sm py-3.5" placeholder="Nombre del taller" placeholderTextColor="#4B5563" value={value} onChangeText={onChange} onBlur={onBlur} />
              </Field>
            )} />

            <Controller control={tallerForm.control} name="descripcion" render={({ field: { value, onChange, onBlur } }) => (
              <View className="mb-4">
                <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-1.5">Descripción</Text>
                <TextInput className="bg-navy-800 text-ink-primary text-sm rounded-xl px-3 py-3 border border-navy-700" placeholder="Describe tu taller…" placeholderTextColor="#4B5563" value={value} onChangeText={onChange} onBlur={onBlur} multiline numberOfLines={3} textAlignVertical="top" style={{ minHeight: 80 }} />
              </View>
            )} />

            <Controller control={tallerForm.control} name="telefono" render={({ field: { value, onChange, onBlur } }) => (
              <Field label="Teléfono" icon={<Icon name="phone" size={16} color="#4B5563" />} error={tallerForm.formState.errors.telefono?.message}>
                <TextInput className="flex-1 text-ink-primary text-sm py-3.5" placeholder="+591 70000000" placeholderTextColor="#4B5563" value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="phone-pad" />
              </Field>
            )} />

            <Controller control={tallerForm.control} name="correo" render={({ field: { value, onChange, onBlur } }) => (
              <Field label="Correo de empresa" icon={<Icon name="mail" size={16} color="#4B5563" />} error={tallerForm.formState.errors.correo?.message}>
                <TextInput className="flex-1 text-ink-primary text-sm py-3.5" placeholder="contacto@taller.com" placeholderTextColor="#4B5563" value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="email-address" autoCapitalize="none" />
              </Field>
            )} />

            <View className="mb-4">
              <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-1.5">Correo personal</Text>
              <View className="flex-row items-center bg-navy-800 rounded-xl px-3 border border-navy-700 opacity-60">
                <Icon name="mail" size={16} color="#4B5563" />
                <Text className="flex-1 text-ink-secondary text-sm py-3.5 ml-2">{(profile as HibridoProfile | undefined)?.usuario?.email ?? ''}</Text>
              </View>
              <Text className="text-ink-muted text-xs mt-1">El correo de acceso no se puede modificar aquí.</Text>
            </View>

            <Controller control={tallerForm.control} name="direccion" render={({ field: { value, onChange, onBlur } }) => (
              <Field label="Dirección" icon={<Icon name="pin" size={16} color="#4B5563" />}>
                <TextInput className="flex-1 text-ink-primary text-sm py-3.5" placeholder="Av. ..." placeholderTextColor="#4B5563" value={value} onChangeText={onChange} onBlur={onBlur} />
              </Field>
            )} />

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
              <Text className="text-ink-muted text-xs mt-1">Esta ubicación aplica tanto al taller como al proveedor.</Text>
            </View>

            {/* Horario */}
            <SectionLabel label="Horario de Atención" />
            <View className="flex-row gap-3 mb-4">
              <Controller control={tallerForm.control} name="horario_apertura" render={({ field: { value, onChange, onBlur } }) => (
                <View className="flex-1">
                  <Text className="text-ink-secondary text-xs mb-1">Apertura</Text>
                  <View className="flex-row items-center bg-navy-800 rounded-xl px-3 border border-navy-700">
                    <Icon name="clock" size={15} color="#4B5563" />
                    <TextInput className="flex-1 text-ink-primary text-sm py-3 ml-2" placeholder="08:00" placeholderTextColor="#4B5563" value={value} onChangeText={(t) => onChange(formatTimeInput(t))} onBlur={onBlur} keyboardType="number-pad" maxLength={5} />
                  </View>
                </View>
              )} />
              <Controller control={tallerForm.control} name="horario_cierre" render={({ field: { value, onChange, onBlur } }) => (
                <View className="flex-1">
                  <Text className="text-ink-secondary text-xs mb-1">Cierre</Text>
                  <View className="flex-row items-center bg-navy-800 rounded-xl px-3 border border-navy-700">
                    <TextInput className="flex-1 text-ink-primary text-sm py-3" placeholder="18:00" placeholderTextColor="#4B5563" value={value} onChangeText={(t) => onChange(formatTimeInput(t))} onBlur={onBlur} keyboardType="number-pad" maxLength={5} />
                  </View>
                </View>
              )} />
            </View>

            {/* Especialidades */}
            <SectionLabel label="Especialidades" />
            <View className="mb-5">
              <ChipList
                chips={allEspecialidades.map((e) => ({ id: e.id_especialidad, label: e.nombre_especialidad }))}
                selected={selectedEspecialidades}
                onToggle={(id) => setSelectedEspecialidades((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])}
              />
            </View>

            {/* Servicios */}
            <SectionLabel label="Mis Servicios" />
            <ServicesEditor
              tallerId={tallerId}
              servicios={servicios}
              onDelete={async (id) => { await deleteServicio(id); }}
            />
          </>
        )}

        {/* ── Proveedor tab ── */}
        {activeTab === 'proveedor' && (
          <>
            <SectionLabel label="Datos del Proveedor" />

            <Controller control={proveedorForm.control} name="nombre_proveedor" render={({ field: { value, onChange, onBlur } }) => (
              <Field label="Nombre del Proveedor" error={proveedorForm.formState.errors.nombre_proveedor?.message}>
                <TextInput className="flex-1 text-ink-primary text-sm py-3.5" placeholder="Nombre del negocio" placeholderTextColor="#4B5563" value={value} onChangeText={onChange} onBlur={onBlur} />
              </Field>
            )} />

            <Controller control={proveedorForm.control} name="descripcion_prov" render={({ field: { value, onChange, onBlur } }) => (
              <View className="mb-4">
                <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-1.5">Descripción</Text>
                <TextInput className="bg-navy-800 text-ink-primary text-sm rounded-xl px-3 py-3 border border-navy-700" placeholder="Describe tu negocio…" placeholderTextColor="#4B5563" value={value} onChangeText={onChange} onBlur={onBlur} multiline numberOfLines={3} textAlignVertical="top" style={{ minHeight: 80 }} />
              </View>
            )} />

            <Controller control={proveedorForm.control} name="telefono_prov" render={({ field: { value, onChange, onBlur } }) => (
              <Field label="Teléfono" icon={<Icon name="phone" size={16} color="#4B5563" />}>
                <TextInput className="flex-1 text-ink-primary text-sm py-3.5" placeholder="+591 70000000" placeholderTextColor="#4B5563" value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="phone-pad" />
              </Field>
            )} />

            <Controller control={proveedorForm.control} name="correo_prov" render={({ field: { value, onChange, onBlur } }) => (
              <Field label="Correo de empresa" icon={<Icon name="mail" size={16} color="#4B5563" />}>
                <TextInput className="flex-1 text-ink-primary text-sm py-3.5" placeholder="contacto@proveedor.com" placeholderTextColor="#4B5563" value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="email-address" autoCapitalize="none" />
              </Field>
            )} />

            <View className="mb-4">
              <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-1.5">Correo personal</Text>
              <View className="flex-row items-center bg-navy-800 rounded-xl px-3 border border-navy-700 opacity-60">
                <Icon name="mail" size={16} color="#4B5563" />
                <Text className="flex-1 text-ink-secondary text-sm py-3.5 ml-2">{(profile as HibridoProfile | undefined)?.usuario?.email ?? ''}</Text>
              </View>
              <Text className="text-ink-muted text-xs mt-1">El correo de acceso no se puede modificar aquí.</Text>
            </View>

            <Controller control={proveedorForm.control} name="direccion_prov" render={({ field: { value, onChange, onBlur } }) => (
              <Field label="Dirección" icon={<Icon name="pin" size={16} color="#4B5563" />}>
                <TextInput className="flex-1 text-ink-primary text-sm py-3.5" placeholder="Av. ..." placeholderTextColor="#4B5563" value={value} onChangeText={onChange} onBlur={onBlur} />
              </Field>
            )} />

            <SectionLabel label="Horario de Atención" />
            <View className="flex-row gap-3 mb-4">
              <Controller control={proveedorForm.control} name="horario_apertura" render={({ field: { value, onChange, onBlur } }) => (
                <View className="flex-1">
                  <Text className="text-ink-secondary text-xs mb-1">Apertura</Text>
                  <View className="flex-row items-center bg-navy-800 rounded-xl px-3 border border-navy-700">
                    <Icon name="clock" size={15} color="#4B5563" />
                    <TextInput className="flex-1 text-ink-primary text-sm py-3 ml-2" placeholder="08:00" placeholderTextColor="#4B5563" value={value} onChangeText={(t) => onChange(formatTimeInput(t))} onBlur={onBlur} keyboardType="number-pad" maxLength={5} />
                  </View>
                </View>
              )} />
              <Controller control={proveedorForm.control} name="horario_cierre" render={({ field: { value, onChange, onBlur } }) => (
                <View className="flex-1">
                  <Text className="text-ink-secondary text-xs mb-1">Cierre</Text>
                  <View className="flex-row items-center bg-navy-800 rounded-xl px-3 border border-navy-700">
                    <TextInput className="flex-1 text-ink-primary text-sm py-3" placeholder="18:00" placeholderTextColor="#4B5563" value={value} onChangeText={(t) => onChange(formatTimeInput(t))} onBlur={onBlur} keyboardType="number-pad" maxLength={5} />
                  </View>
                </View>
              )} />
            </View>
          </>
        )}

        {/* Guardar */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          className={`mt-2 bg-accent py-3.5 rounded-xl items-center ${isSaving ? 'opacity-50' : ''}`}
          activeOpacity={0.85}
        >
          <Text className="text-navy-900 font-bold">Guardar cambios</Text>
        </TouchableOpacity>

        {/* Eliminar cuenta */}
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
          role="hibrido"
          onSuccess={() => {
            setShowLocationPicker(false);
            qc.invalidateQueries({ queryKey: ['profile', 'current'] });
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
}
