import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentProfile, useUpdateConductorProfile } from '@/features/profile/hooks';
import { pickAndCompress, uploadCompressedImage } from '@/lib/uploadImage';
import { supabase } from '@/lib/supabase';
import type { ConductorProfile } from '@/types/user';

const schema = z.object({
  full_name: z.string().min(2, 'Mínimo 2 caracteres'),
  ci: z.string().min(4, 'C.I. inválido'),
  phone: z.string().min(7, 'Teléfono inválido').optional().or(z.literal('')),
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
      <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-1.5">
        {label}
      </Text>
      <View
        className={`flex-row items-center bg-navy-800 rounded-xl px-3 border ${
          error ? 'border-danger' : 'border-navy-700'
        }`}
      >
        {icon && <View className="mr-2">{icon}</View>}
        {children}
      </View>
      {error ? <Text className="text-danger text-xs mt-1">{error}</Text> : null}
    </View>
  );
}

export default function EditConductorProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data: profile, isLoading } = useCurrentProfile();
  const { mutateAsync: updateProfile, isPending: isSaving } = useUpdateConductorProfile();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (profile?.role === 'conductor') {
      const p = profile as ConductorProfile;
      setAvatarUrl((prev) => prev ?? (p.usuario.avatar_url || null));
      reset({
        full_name: p.meta.full_name ?? '',
        ci: p.usuario.ci ?? '',
        phone: p.usuario.phone ?? '',
      });
    }
  }, [profile, reset]);

  const handleAvatarPress = () => {
    if (uploadingAvatar || profile?.role !== 'conductor') return;
    const p = profile as ConductorProfile;

    Alert.alert('Cambiar foto', 'Elige una opción', [
      {
        text: 'Cámara',
        onPress: () => doAvatarUpload(p, 'camera'),
      },
      {
        text: 'Galería',
        onPress: () => doAvatarUpload(p, 'gallery'),
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const doAvatarUpload = async (p: ConductorProfile, source: 'camera' | 'gallery') => {
    try {
      const localUri = await pickAndCompress(source, 'avatar');
      if (!localUri) return;
      setAvatarUrl(localUri);
      setUploadingAvatar(true);
      const url = await uploadCompressedImage(localUri, `avatars/${p.usuario.id_usuario}.webp`);
      if (!url) { Alert.alert('Error storage', 'No se pudo subir al servidor.'); return; }
      const { error: dbErr } = await supabase.from('usuario').update({ avatar_url: url }).eq('id_usuario', p.usuario.id_usuario);
      if (dbErr) Alert.alert('Error BD', dbErr.message);
      else qc.invalidateQueries({ queryKey: ['profile', 'current'] });
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Error desconocido');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (profile?.role !== 'conductor') return;
    const p = profile as ConductorProfile;
    try {
      await updateProfile({
        id: p.usuario.id_usuario,
        data: {
          ci: values.ci,
          phone: values.phone || undefined,
          full_name: values.full_name,
        },
      });
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

  const displayName =
    (profile as ConductorProfile | undefined)?.meta?.full_name ??
    (profile as ConductorProfile | undefined)?.usuario?.email?.split('@')[0] ??
    '';

  const email = (profile as ConductorProfile | undefined)?.usuario?.email ?? '';

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-navy-900"
      behavior="padding"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pb-3 border-b border-navy-700" style={{ paddingTop: insets.top + 12 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="chevronLeft" size={24} color="#1DB88A" />
        </TouchableOpacity>
        <Text className="text-ink-primary text-base font-bold">Editar perfil</Text>
        <TouchableOpacity onPress={handleSubmit(onSubmit)} disabled={isSaving} className={isSaving ? 'opacity-50' : ''}>
          <Text className="text-accent font-bold text-sm">{isSaving ? 'Guardando…' : 'Guardar'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        {/* Avatar */}
        <View className="items-center mb-6">
          <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8} disabled={uploadingAvatar}>
            <View>
              <Avatar size={88} uri={avatarUrl} initials={displayName} bgColor="#1A2540" />
              <View className="absolute -bottom-1 -right-1 bg-accent rounded-full p-1.5">
                {uploadingAvatar
                  ? <ActivityIndicator size={14} color="#0D1B3E" />
                  : <Icon name="camera" size={14} color="#0D1B3E" />}
              </View>
            </View>
          </TouchableOpacity>
          <Text className="text-ink-secondary text-xs mt-2">Toca para cambiar foto</Text>
        </View>

        {/* Nombre */}
        <Controller
          control={control}
          name="full_name"
          render={({ field: { value, onChange, onBlur } }) => (
            <Field label="Nombre completo" error={errors.full_name?.message}>
              <TextInput
                className="flex-1 text-ink-primary text-sm py-3.5"
                placeholder="Tu nombre completo"
                placeholderTextColor="#4B5563"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            </Field>
          )}
        />

        {/* CI */}
        <Controller
          control={control}
          name="ci"
          render={({ field: { value, onChange, onBlur } }) => (
            <Field label="C.I." icon={<Icon name="id" size={16} color="#4B5563" />} error={errors.ci?.message}>
              <TextInput
                className="flex-1 text-ink-primary text-sm py-3.5"
                placeholder="Número de cédula"
                placeholderTextColor="#4B5563"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="numeric"
              />
            </Field>
          )}
        />

        {/* Correo read-only */}
        <View className="mb-4">
          <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-1.5">Correo</Text>
          <View className="flex-row items-center bg-navy-800 rounded-xl px-3 border border-navy-700 opacity-60">
            <Icon name="mail" size={16} color="#4B5563" />
            <Text className="flex-1 text-ink-secondary text-sm py-3.5 ml-2">{email}</Text>
          </View>
          <Text className="text-ink-muted text-xs mt-1">El correo no se puede modificar aquí.</Text>
        </View>

        {/* Teléfono */}
        <Controller
          control={control}
          name="phone"
          render={({ field: { value, onChange, onBlur } }) => (
            <Field label="Teléfono" icon={<Icon name="phone" size={16} color="#4B5563" />} error={errors.phone?.message}>
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

        {/* Eliminar cuenta */}
        <TouchableOpacity
          onPress={handleDeleteAccount}
          className="mt-4 border border-danger rounded-xl py-3.5 flex-row items-center justify-center gap-2"
          activeOpacity={0.75}
        >
          <Icon name="trash" size={16} color="#EF4444" />
          <Text className="text-danger font-semibold text-sm">Eliminar cuenta</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
