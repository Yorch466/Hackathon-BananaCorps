import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { useCurrentProfile, useUpsertServicio, useDeleteServicio } from '@/features/profile/hooks';
import { pickImageFree, uploadCompressedImage } from '@/lib/uploadImage';
import type { TallerProfile, HibridoProfile } from '@/types/user';
import type { DbServicio } from '@/types/database';

interface ServicioFormState {
  nombre: string;
  descripcion: string;
  duracion: string;
  precio: string;
  imageUri: string | null;
  imageChanged: boolean;
}

const EMPTY_FORM: ServicioFormState = {
  nombre: '',
  descripcion: '',
  duracion: '',
  precio: '',
  imageUri: null,
  imageChanged: false,
};

export default function ShopServices() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { data: profile, isLoading } = useCurrentProfile();
  const { mutateAsync: upsert } = useUpsertServicio();
  const { mutateAsync: remove } = useDeleteServicio();

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<DbServicio | null>(null);
  const [form, setForm] = useState<ServicioFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    Alert.alert('Eliminar seleccionados', `¿Eliminar ${selected.size} servicio(s)?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          for (const id of selected) {
            await remove(id);
          }
          setSelected(new Set());
        },
      },
    ]);
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const tallerId =
    profile?.role === 'taller'
      ? (profile as TallerProfile).taller.id_taller
      : profile?.role === 'hibrido'
      ? (profile as HibridoProfile).taller.id_taller
      : null;

  const servicios: DbServicio[] =
    profile && 'servicios' in profile ? (profile as any).servicios : [];

  const filtered = search.trim()
    ? servicios.filter((s) =>
        s.nombre_servicio.toLowerCase().includes(search.toLowerCase()) ||
        (s.descripcion ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (s.duracion ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : servicios;

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEdit = (s: DbServicio) => {
    setEditing(s);
    setForm({
      nombre: s.nombre_servicio,
      descripcion: s.descripcion ?? '',
      duracion: s.duracion ?? '',
      precio: s.precio != null ? String(s.precio) : '',
      imageUri: s.imagen_servicio_url ?? null,
      imageChanged: false,
    });
    setModalVisible(true);
  };

  const handlePickImage = async () => {
    const uri = await pickImageFree();
    if (uri) setForm((f) => ({ ...f, imageUri: uri, imageChanged: true }));
  };

  const handleSave = async () => {
    if (!tallerId || !form.nombre.trim()) {
      Alert.alert('El nombre del servicio es obligatorio.');
      return;
    }
    setSaving(true);
    try {
      let imageUrl = editing?.imagen_servicio_url ?? null;
      if (form.imageChanged && form.imageUri) {
        const path = `servicios/${tallerId}/${Date.now()}.webp`;
        imageUrl = await uploadCompressedImage(form.imageUri, path);
      }
      await upsert({
        id_servicio: editing?.id_servicio,
        taller_id: tallerId,
        nombre_servicio: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        imagen_servicio_url: imageUrl,
        precio: form.precio ? parseFloat(form.precio) : null,
        duracion: form.duracion.trim() || null,
      });
      setModalVisible(false);
    } catch {
      Alert.alert('Error', 'No se pudo guardar el servicio.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar servicio', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await remove(id);
          setSelected((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
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

  if (!tallerId) {
    return (
      <View className="flex-1 bg-navy-900 items-center justify-center px-6">
        <Text className="text-ink-secondary text-center">
          Esta sección es solo para talleres.
        </Text>
      </View>
    );
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
        <Text className="text-ink-primary text-lg font-bold flex-1">Mis Servicios</Text>
        {selected.size > 0 ? (
          <TouchableOpacity onPress={handleBulkDelete} className="bg-red-600 px-3 py-1.5 rounded-lg" activeOpacity={0.8}>
            <Text className="text-white text-xs font-bold">Eliminar {selected.size}</Text>
          </TouchableOpacity>
        ) : (
          <Text className="text-ink-secondary text-sm">
            {servicios.length} {servicios.length === 1 ? 'servicio' : 'servicios'}
          </Text>
        )}
      </View>

      {/* Buscador */}
      <View className="px-4 pt-3 pb-1">
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

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="mx-4 mt-3 bg-navy-800 rounded-2xl overflow-hidden">
          {filtered.length === 0 ? (
            <View className="px-4 py-6 items-center">
              <Text className="text-ink-muted text-sm text-center">
                {search ? 'Sin resultados para tu búsqueda.' : 'Aún no tienes servicios.\nToca "Añadir servicio" para agregar el primero.'}
              </Text>
            </View>
          ) : (
            filtered.map((s, i) => {
              const isSelected = selected.has(s.id_servicio);
              return (
                <TouchableOpacity
                  key={s.id_servicio}
                  onPress={() => toggleSelect(s.id_servicio)}
                  activeOpacity={0.85}
                  className={`flex-row items-center px-4 py-3 ${i < filtered.length - 1 ? 'border-b border-navy-700' : ''} ${isSelected ? 'bg-navy-700' : ''}`}
                >
                  {/* Checkbox */}
                  <View className={`w-5 h-5 rounded-md border mr-3 items-center justify-center ${isSelected ? 'bg-accent border-accent' : 'border-navy-600'}`}>
                    {isSelected ? <Icon name="check" size={12} color="#0D1B3E" /> : null}
                  </View>

                  {/* Imagen */}
                  <View className="mr-3">
                    {s.imagen_servicio_url ? (
                      <Image source={{ uri: s.imagen_servicio_url }} className="w-10 h-10 rounded-xl" />
                    ) : (
                      <View className="w-10 h-10 rounded-xl bg-navy-700 items-center justify-center">
                        <Icon name="wrench" size={18} color="#1DB88A" />
                      </View>
                    )}
                  </View>

                  {/* Info */}
                  <View className="flex-1">
                    <Text className="text-ink-primary text-sm font-medium">{s.nombre_servicio}</Text>
                    {s.descripcion ? (
                      <Text className="text-ink-secondary text-xs mt-0.5" numberOfLines={1}>{s.descripcion}</Text>
                    ) : null}
                    {s.duracion ? (
                      <Text className="text-ink-muted text-xs mt-0.5">{s.duracion}</Text>
                    ) : null}
                  </View>

                  {s.precio != null ? (
                    <Text className="text-accent text-sm font-bold mr-3">Bs. {s.precio}</Text>
                  ) : null}

                  {/* Acciones */}
                  <View className="flex-row gap-2">
                    <TouchableOpacity onPress={() => openEdit(s)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} className="w-8 h-8 rounded-lg bg-navy-700 items-center justify-center">
                      <Icon name="edit" size={14} color="#94A3B8" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(s.id_servicio)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} className="w-8 h-8 rounded-lg bg-red-950 items-center justify-center">
                      <Icon name="trash" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Botón añadir */}
      <View
        className="absolute bottom-0 left-0 right-0 px-4 pt-3 bg-navy-900"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <TouchableOpacity
          onPress={openAdd}
          className="bg-accent py-3.5 rounded-xl flex-row items-center justify-center gap-2"
          activeOpacity={0.85}
        >
          <Icon name="plus" size={18} color="#0D1B3E" />
          <Text className="text-navy-900 font-bold text-sm">Añadir servicio</Text>
        </TouchableOpacity>
      </View>

      {/* Modal añadir / editar */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} />
          </TouchableWithoutFeedback>

          <View style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: keyboardHeight,
            maxHeight: screenHeight * 0.9,
            backgroundColor: '#162347',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 24, paddingTop: 20, paddingBottom: keyboardHeight > 0 ? 16 : insets.bottom + 24 }}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              <View className="flex-row items-start justify-between mb-5">
                <View className="flex-1">
                  <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-1">
                    {editing ? 'EDITAR SERVICIO' : 'NUEVO SERVICIO'}
                  </Text>
                  <Text className="text-ink-primary text-lg font-bold">
                    {editing ? editing.nombre_servicio : 'Añadir servicio'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} className="ml-3 mt-1">
                  <Icon name="close" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* Imagen */}
              <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-2">
                Imagen (opcional)
              </Text>
              <TouchableOpacity
                onPress={handlePickImage}
                className="w-20 h-20 rounded-2xl bg-navy-700 items-center justify-center mb-5 overflow-hidden"
                activeOpacity={0.8}
              >
                {form.imageUri ? (
                  <Image source={{ uri: form.imageUri }} className="w-20 h-20" />
                ) : (
                  <>
                    <Icon name="camera" size={24} color="#4B5563" />
                    <Text className="text-ink-muted text-xs mt-1">Añadir</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Nombre */}
              <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-2">
                Nombre del servicio
              </Text>
              <TextInput
                value={form.nombre}
                onChangeText={(t) => setForm((f) => ({ ...f, nombre: t }))}
                placeholder="Ej: Cambio de aceite"
                placeholderTextColor="#4B5563"
                className="bg-navy-700 text-ink-primary px-4 py-3 rounded-xl mb-4"
              />

              {/* Descripción */}
              <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-2">
                Descripción
              </Text>
              <TextInput
                value={form.descripcion}
                onChangeText={(t) => setForm((f) => ({ ...f, descripcion: t }))}
                placeholder="Describe el servicio…"
                placeholderTextColor="#4B5563"
                multiline
                numberOfLines={2}
                className="bg-navy-700 text-ink-primary px-4 py-3 rounded-xl mb-4"
                style={{ textAlignVertical: 'top' }}
              />

              {/* Duración y precio */}
              <View className="flex-row gap-3 mb-6">
                <View className="flex-1">
                  <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-2">
                    Duración
                  </Text>
                  <TextInput
                    value={form.duracion}
                    onChangeText={(t) => setForm((f) => ({ ...f, duracion: t }))}
                    placeholder="~30 min"
                    placeholderTextColor="#4B5563"
                    className="bg-navy-700 text-ink-primary px-4 py-3 rounded-xl"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-2">
                    Precio (Bs.)
                  </Text>
                  <TextInput
                    value={form.precio}
                    onChangeText={(t) => setForm((f) => ({ ...f, precio: t }))}
                    placeholder="0"
                    placeholderTextColor="#4B5563"
                    keyboardType="decimal-pad"
                    className="bg-navy-700 text-ink-primary px-4 py-3 rounded-xl"
                  />
                </View>
              </View>

              {/* Botones */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  className="flex-1 border border-navy-600 py-3.5 rounded-xl items-center"
                  activeOpacity={0.8}
                >
                  <Text className="text-ink-secondary font-semibold text-sm">Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving || !form.nombre.trim()}
                  className={`flex-1 bg-accent py-3.5 rounded-xl items-center ${saving || !form.nombre.trim() ? 'opacity-50' : ''}`}
                  activeOpacity={0.85}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#0D1B3E" />
                  ) : (
                    <Text className="text-navy-900 font-bold text-sm">
                      {editing ? 'Guardar' : 'Crear'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
