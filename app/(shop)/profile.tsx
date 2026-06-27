import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  TextInput,
  Image,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { InfoRow } from '@/components/profile/InfoRow';
import { BannerCard } from '@/components/profile/BannerCard';
import { ChipList } from '@/components/profile/ChipList';
import { RatingCard } from '@/components/profile/RatingCard';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCurrentProfile,
  useRatingDistribution,
  useUpsertServicio,
  useDeleteServicio,
  useProveedorProductos,
  useCreateProducto,
  useUpdateProducto,
  useDeleteProducto,
  useCategorias,
} from '@/features/profile/hooks';
import { pickImageFree, uploadCompressedImage } from '@/lib/uploadImage';
import { supabase } from '@/lib/supabase';
import { LocationPickerModal } from '@/components/map/LocationPickerModal';
import type { TallerProfile, ProveedorProfile, HibridoProfile } from '@/types/user';
import type { ProductoItem } from '@/types/database';

// ─── Shared helpers ───────────────────────────────────────────────────────────

function SectionLabel({ label, action, onAction }: { label: string; action?: string; onAction?: () => void }) {
  return (
    <View className="flex-row items-center justify-between px-4 pt-5 pb-2">
      <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase">{label}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text className="text-accent text-xs font-semibold">{action} →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function useKeyboardHeight() {
  const [kbHeight, setKbHeight] = useState(0);
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (e) => setKbHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setKbHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);
  return kbHeight;
}

// ─── Taller content ───────────────────────────────────────────────────────────

type LocalImg =
  | { type: 'existing'; id_imagen: string; imagen_url: string }
  | { type: 'new'; localUri: string };

interface ServicioForm { nombre: string; descripcion: string; duracion: string; precio: string; imageUri: string | null; imageChanged: boolean; }
const EMPTY_SVC: ServicioForm = { nombre: '', descripcion: '', duracion: '', precio: '', imageUri: null, imageChanged: false };

function TallerContent({ profile, onEditRoute }: { profile: TallerProfile | HibridoProfile; onEditRoute: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const { height: screenHeight } = useWindowDimensions();
  const kbHeight = useKeyboardHeight();
  const { taller, usuario, especialidades, servicios, rating, ratingCount } = profile;
  const { data: distribution } = useRatingDistribution(taller.id_taller);
  const { mutateAsync: upsert } = useUpsertServicio();
  const { mutateAsync: remove } = useDeleteServicio();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingSvc, setEditingSvc] = useState<{ id: string; imageUrl: string | null } | null>(null);
  const [form, setForm] = useState<ServicioForm>(EMPTY_SVC);
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setEditingSvc(null); setForm(EMPTY_SVC); setModalVisible(true); };
  const openEdit = (s: { id_servicio: string; nombre_servicio: string; descripcion: string | null; duracion: string | null; precio: number | null; imagen_servicio_url: string | null }) => {
    setEditingSvc({ id: s.id_servicio, imageUrl: s.imagen_servicio_url });
    setForm({ nombre: s.nombre_servicio, descripcion: s.descripcion ?? '', duracion: s.duracion ?? '', precio: s.precio != null ? String(s.precio) : '', imageUri: s.imagen_servicio_url, imageChanged: false });
    setModalVisible(true);
  };
  const handlePickImage = async () => {
    const uri = await pickImageFree();
    if (uri) setForm((f) => ({ ...f, imageUri: uri, imageChanged: true }));
  };
  const handleSave = async () => {
    if (!form.nombre.trim()) { Alert.alert('El nombre es obligatorio.'); return; }
    setSaving(true);
    try {
      let imageUrl = editingSvc?.imageUrl ?? null;
      if (form.imageChanged && form.imageUri) {
        const path = `servicios/${taller.id_taller}/${Date.now()}.webp`;
        imageUrl = await uploadCompressedImage(form.imageUri, path);
      }
      await upsert({
        id_servicio: editingSvc?.id,
        taller_id: taller.id_taller,
        nombre_servicio: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        imagen_servicio_url: imageUrl,
        precio: form.precio ? parseFloat(form.precio) : null,
        duracion: form.duracion.trim() || null,
      });
      setModalVisible(false);
    } catch { Alert.alert('Error', 'No se pudo guardar el servicio.'); }
    finally { setSaving(false); }
  };
  const handleDelete = (id: string) => Alert.alert('Eliminar servicio', '¿Estás seguro?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: () => remove(id) },
  ]);

  const handleCall = () => {
    const num = taller.telefono;
    if (!num) return;
    Alert.alert('Llamar', num, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Llamar', onPress: () => Linking.openURL(`tel:${num}`) },
    ]);
  };

  return (
    <>
      <BannerCard
        name={taller.nombre_taller}
        initials={taller.nombre_taller.slice(0, 2).toUpperCase()}
        badge="Taller"
        rating={rating}
        ratingCount={ratingCount}
        bannerUri={taller.banner_taller_url}
        avatarUri={taller.perfil_taller_url}
        description={taller.descripcion ?? undefined}
        direccion={taller.direccion}
        horarioApertura={taller.horario_apertura ?? undefined}
        horarioCierre={taller.horario_cierre ?? undefined}
      />

      <View className="px-4 pb-2 gap-2">
        <TouchableOpacity onPress={() => router.push(onEditRoute as any)} className="bg-accent py-3 rounded-xl flex-row items-center justify-center gap-2" activeOpacity={0.85}>
          <Icon name="edit" size={16} color="#0D1B3E" />
          <Text className="text-navy-900 font-bold text-sm">Editar perfil</Text>
        </TouchableOpacity>
        <View className="flex-row gap-2">
          <TouchableOpacity onPress={handleCall} className="flex-1 border border-navy-600 py-2.5 rounded-xl flex-row items-center justify-center gap-2" activeOpacity={0.8}>
            <Icon name="call" size={16} color="#FFFFFF" />
            <Text className="text-ink-primary text-sm">Llamar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowLocationPicker(true)} className="flex-1 border border-navy-600 py-2.5 rounded-xl flex-row items-center justify-center gap-2" activeOpacity={0.8}>
            <Icon name="pin" size={16} color="#1DB88A" />
            <Text className="text-accent text-sm">Añadir Ubicación</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="mx-4 mt-2 bg-navy-800 rounded-2xl overflow-hidden">
        <InfoRow icon="id" value={usuario.ci || '—'} />
        <InfoRow icon="phone" value={taller.telefono || '—'} />
        <InfoRow icon="mail" value={taller.correo || '—'} last />
      </View>

      <SectionLabel label="Especialidades" action="Gestionar" onAction={() => router.push(onEditRoute as any)} />
      <View className="px-4">
        {especialidades.length > 0 ? (
          <ChipList chips={especialidades.map((e) => ({ id: e.id_especialidad, label: e.nombre_especialidad }))} selected={especialidades.map((e) => e.id_especialidad)} readonly />
        ) : (
          <View className="bg-navy-800 rounded-2xl px-4 py-3">
            <Text className="text-ink-secondary text-sm text-center">Gestiona tus especialidades desde la edición de perfil.</Text>
          </View>
        )}
      </View>

      {/* Mis Servicios */}
      <SectionLabel label="Mis Servicios" action="Gestionar →" onAction={() => router.push('/(shop)/services' as any)} />
      <View className="mx-4 bg-navy-800 rounded-2xl overflow-hidden">
        {servicios.length > 0 ? (
          servicios.slice(0, 5).map((s, i, arr) => (
              <View key={s.id_servicio} className={`flex-row items-center px-4 py-3 ${i < arr.length - 1 ? 'border-b border-navy-700' : ''}`}>
                <View className="w-9 h-9 rounded-xl bg-navy-700 items-center justify-center mr-3">
                  {s.imagen_servicio_url
                    ? <Image source={{ uri: s.imagen_servicio_url }} className="w-9 h-9 rounded-xl" />
                    : <Icon name="wrench" size={18} color="#1DB88A" />}
                </View>
                <View className="flex-1">
                  <Text className="text-ink-primary text-sm font-medium">{s.nombre_servicio}</Text>
                  {s.duracion ? <Text className="text-ink-secondary text-xs mt-0.5">{s.duracion}</Text> : null}
                </View>
                {s.precio != null ? <Text className="text-accent text-sm font-bold mr-3">Bs. {s.precio}</Text> : null}
                <TouchableOpacity onPress={() => openEdit(s)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} className="mr-2">
                  <Icon name="edit" size={15} color="#94A3B8" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(s.id_servicio)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon name="trash" size={15} color="#EF4444" />
                </TouchableOpacity>
              </View>
          ))
        ) : (
          <TouchableOpacity onPress={openAdd} className="px-4 py-5 items-center" activeOpacity={0.75}>
            <Icon name="plus" size={22} color="#1DB88A" />
            <Text className="text-accent text-sm mt-2 font-semibold">Añadir primer servicio</Text>
          </TouchableOpacity>
        )}
      </View>
      {servicios.length > 5 && (
        <TouchableOpacity onPress={() => router.push('/(shop)/services' as any)} className="mx-4 mt-2 py-2.5 flex-row items-center justify-center gap-1" activeOpacity={0.75}>
          <Text className="text-ink-secondary text-xs">Ver todos ({servicios.length} servicios)</Text>
          <Icon name="chevronRight" size={13} color="#94A3B8" />
        </TouchableOpacity>
      )}

      <SectionLabel label="Calificación" />
      <RatingCard rating={rating} ratingCount={ratingCount} distribution={distribution} />

      {/* Modal servicio */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} />
          </TouchableWithoutFeedback>
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: kbHeight, maxHeight: screenHeight * 0.85, backgroundColor: '#162347', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingTop: 20, paddingBottom: kbHeight > 0 ? 16 : insets.bottom + 24 }} keyboardShouldPersistTaps="handled" bounces={false}>
              <View className="flex-row items-start justify-between mb-5">
                <View className="flex-1">
                  <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-1">{editingSvc ? 'EDITAR SERVICIO' : 'NUEVO SERVICIO'}</Text>
                  <Text className="text-ink-primary text-lg font-bold">{editingSvc ? form.nombre : 'Añadir servicio'}</Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} className="ml-3 mt-1">
                  <Icon name="close" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-2">Imagen (opcional)</Text>
              <TouchableOpacity onPress={handlePickImage} className="w-20 h-20 rounded-2xl bg-navy-700 items-center justify-center mb-5 overflow-hidden" activeOpacity={0.8}>
                {form.imageUri ? <Image source={{ uri: form.imageUri }} style={{ width: 80, height: 80 }} /> : <><Icon name="camera" size={24} color="#4B5563" /><Text className="text-ink-muted text-xs mt-1">Añadir</Text></>}
              </TouchableOpacity>

              <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-2">Nombre del servicio</Text>
              <TextInput value={form.nombre} onChangeText={(t) => setForm((f) => ({ ...f, nombre: t }))} placeholder="Ej: Cambio de aceite" placeholderTextColor="#4B5563" className="bg-navy-700 text-ink-primary px-4 py-3 rounded-xl mb-4" />

              <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-2">Descripción</Text>
              <TextInput value={form.descripcion} onChangeText={(t) => setForm((f) => ({ ...f, descripcion: t }))} placeholder="Describe el servicio…" placeholderTextColor="#4B5563" multiline numberOfLines={2} className="bg-navy-700 text-ink-primary px-4 py-3 rounded-xl mb-4" style={{ textAlignVertical: 'top' }} />

              <View className="flex-row gap-3 mb-6">
                <View className="flex-1">
                  <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-2">Duración</Text>
                  <TextInput value={form.duracion} onChangeText={(t) => setForm((f) => ({ ...f, duracion: t }))} placeholder="~30 min" placeholderTextColor="#4B5563" className="bg-navy-700 text-ink-primary px-4 py-3 rounded-xl" />
                </View>
                <View className="flex-1">
                  <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-2">Precio (Bs.)</Text>
                  <TextInput value={form.precio} onChangeText={(t) => setForm((f) => ({ ...f, precio: t }))} placeholder="0" placeholderTextColor="#4B5563" keyboardType="decimal-pad" className="bg-navy-700 text-ink-primary px-4 py-3 rounded-xl" />
                </View>
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity onPress={() => setModalVisible(false)} className="flex-1 border border-navy-600 py-3.5 rounded-xl items-center" activeOpacity={0.8}>
                  <Text className="text-ink-secondary font-semibold text-sm">Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} disabled={saving || !form.nombre.trim()} className={`flex-1 bg-accent py-3.5 rounded-xl items-center ${saving || !form.nombre.trim() ? 'opacity-50' : ''}`} activeOpacity={0.85}>
                  {saving ? <ActivityIndicator size="small" color="#0D1B3E" /> : <Text className="text-navy-900 font-bold text-sm">{editingSvc ? 'Guardar' : 'Crear'}</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <LocationPickerModal
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        usuarioId={usuario.id_usuario}
        role={profile.role}
        onSuccess={() => {
          setShowLocationPicker(false);
          qc.invalidateQueries({ queryKey: ['profile', 'current'] });
        }}
      />
    </>
  );
}

// ─── Proveedor content ────────────────────────────────────────────────────────

interface ProductoForm { nombre: string; descripcion: string; precio: string; cantidad: string; categoriaId: string | null; images: LocalImg[]; }
const EMPTY_PROD: ProductoForm = { nombre: '', descripcion: '', precio: '', cantidad: '', categoriaId: null, images: [] };

function ProveedorContent({ profile, onEditRoute }: { profile: ProveedorProfile | HibridoProfile; onEditRoute: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { height: screenHeight } = useWindowDimensions();
  const kbHeight = useKeyboardHeight();
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const proveedor = 'proveedor' in profile ? profile.proveedor : null;
  if (!proveedor) return null;

  const { usuario, rating, ratingCount } = profile;
  const { data: distribution } = useRatingDistribution(proveedor.id_proveedor);
  const { data: productos = [], isLoading: loadingProductos } = useProveedorProductos(proveedor.id_proveedor);
  const { data: categorias = [] } = useCategorias();
  const { mutateAsync: createProducto } = useCreateProducto(proveedor.id_proveedor);
  const { mutateAsync: updateProducto } = useUpdateProducto(proveedor.id_proveedor);
  const { mutateAsync: deleteProducto } = useDeleteProducto(proveedor.id_proveedor);

  const [modalVisible, setModalVisible] = useState(false);
  const [catPickerVisible, setCatPickerVisible] = useState(false);
  const [editingProd, setEditingProd] = useState<ProductoItem | null>(null);
  const [form, setForm] = useState<ProductoForm>(EMPTY_PROD);
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setEditingProd(null); setForm(EMPTY_PROD); setModalVisible(true); };
  const openEditProd = (p: ProductoItem) => {
    setEditingProd(p);
    setForm({ nombre: p.nombre, descripcion: p.descripcion ?? '', precio: p.precio != null ? String(p.precio) : '', cantidad: String(p.cantidad), categoriaId: p.categoria?.id_categoria ?? null, images: p.imagenes.map((i) => ({ type: 'existing' as const, id_imagen: i.id_imagen, imagen_url: i.imagen_url })) });
    setModalVisible(true);
  };
  const handleAddImage = async () => {
    if (form.images.length >= 3) { Alert.alert('Máximo 3 imágenes.'); return; }
    const uri = await pickImageFree();
    if (uri) setForm((f) => ({ ...f, images: [...f.images, { type: 'new', localUri: uri }] }));
  };
  const handleRemoveImage = (i: number) => setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));

  const handleSaveProd = async () => {
    if (!form.nombre.trim()) { Alert.alert('El nombre es obligatorio.'); return; }
    setSaving(true);
    try {
      const uploadedUrls: string[] = [];
      for (const img of form.images) {
        if (img.type === 'new') {
          const path = `productos/${proveedor.id_proveedor}/${Date.now()}_${Math.random().toString(36).slice(2)}.webp`;
          const url = await uploadCompressedImage(img.localUri, path);
          if (url) uploadedUrls.push(url);
        }
      }
      if (editingProd) {
        const toDelete = editingProd.imagenes.filter((img) => !form.images.some((f) => f.type === 'existing' && f.id_imagen === img.id_imagen)).map((img) => img.id_imagen);
        await updateProducto({ stockId: editingProd.stock_id, repuestoId: editingProd.repuesto_id, data: { nombre: form.nombre.trim(), descripcion: form.descripcion.trim() || null, precio: form.precio ? parseFloat(form.precio) : null, cantidad: form.cantidad ? parseInt(form.cantidad, 10) : 0, categoriaId: form.categoriaId, imageUrlsToAdd: uploadedUrls, imageIdsToDelete: toDelete } });
      } else {
        await createProducto({ vendedorId: proveedor.id_proveedor, nombre: form.nombre.trim(), descripcion: form.descripcion.trim() || null, precio: form.precio ? parseFloat(form.precio) : null, cantidad: form.cantidad ? parseInt(form.cantidad, 10) : 0, categoriaId: form.categoriaId, imageUrls: uploadedUrls });
      }
      setModalVisible(false);
    } catch (e: any) { Alert.alert('Error', e?.message ?? 'No se pudo guardar.'); }
    finally { setSaving(false); }
  };

  const handleDeleteProd = (p: ProductoItem) => Alert.alert('Eliminar producto', `¿Eliminar "${p.nombre}"?`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: () => deleteProducto({ stockId: p.stock_id, repuestoId: p.repuesto_id }) },
  ]);

  const handleCall = () => {
    const num = proveedor.telefono;
    if (!num) return;
    Alert.alert('Llamar', num, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Llamar', onPress: () => Linking.openURL(`tel:${num}`) },
    ]);
  };

  const selectedCatNombre = categorias.find((c) => c.id_categoria === form.categoriaId)?.nombre;

  return (
    <>
      <BannerCard
        name={proveedor.nombre_proveedor}
        initials={proveedor.nombre_proveedor.slice(0, 2).toUpperCase()}
        badge="Proveedor"
        rating={rating}
        ratingCount={ratingCount}
        bannerUri={'taller' in profile ? (profile as HibridoProfile).taller.banner_taller_url : proveedor.banner_proveedor_url}
        avatarUri={'taller' in profile ? (profile as HibridoProfile).taller.perfil_taller_url : proveedor.perfil_proveedor_url}
        description={proveedor.descripcion ?? undefined}
        direccion={proveedor.direccion}
        horarioApertura={proveedor.horario_apertura ?? undefined}
        horarioCierre={proveedor.horario_cierre ?? undefined}
      />

      <View className="px-4 pb-2 gap-2">
        <TouchableOpacity onPress={() => router.push(onEditRoute as any)} className="bg-accent py-3 rounded-xl flex-row items-center justify-center gap-2" activeOpacity={0.85}>
          <Icon name="edit" size={16} color="#0D1B3E" />
          <Text className="text-navy-900 font-bold text-sm">Editar perfil</Text>
        </TouchableOpacity>
        <View className="flex-row gap-2">
          <TouchableOpacity onPress={handleCall} className="flex-1 border border-navy-600 py-2.5 rounded-xl flex-row items-center justify-center gap-2" activeOpacity={0.8}>
            <Icon name="call" size={16} color="#FFFFFF" />
            <Text className="text-ink-primary text-sm">Llamar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowLocationPicker(true)} className="flex-1 border border-navy-600 py-2.5 rounded-xl flex-row items-center justify-center gap-2" activeOpacity={0.8}>
            <Icon name="pin" size={16} color="#1DB88A" />
            <Text className="text-accent text-sm">Añadir Ubicación</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="mx-4 mt-2 bg-navy-800 rounded-2xl overflow-hidden">
        <InfoRow icon="id" value={usuario.ci || '—'} />
        <InfoRow icon="phone" value={proveedor.telefono || '—'} />
        <InfoRow icon="mail" value={proveedor.correo || '—'} last />
      </View>

      {/* Mis Productos */}
      <SectionLabel label="Mis Productos" action="Gestionar →" onAction={() => router.push('/(shop)/items' as any)} />
      <View className="mx-4 bg-navy-800 rounded-2xl overflow-hidden">
        {loadingProductos ? (
          <View className="py-6 items-center"><ActivityIndicator color="#1DB88A" /></View>
        ) : productos.length === 0 ? (
          <TouchableOpacity onPress={openAdd} className="px-4 py-5 items-center" activeOpacity={0.75}>
            <Icon name="plus" size={22} color="#1DB88A" />
            <Text className="text-accent text-sm mt-2 font-semibold">Añadir primer producto</Text>
          </TouchableOpacity>
        ) : (
          productos.slice(0, 5).map((p, i, arr) => {
            const firstImg = p.imagenes[0]?.imagen_url;
            return (
              <View key={p.stock_id} className={`flex-row items-center px-4 py-3 ${i < arr.length - 1 ? 'border-b border-navy-700' : ''}`}>
                {firstImg
                  ? <Image source={{ uri: firstImg }} style={{ width: 40, height: 40, borderRadius: 10, marginRight: 10 }} />
                  : <View className="w-10 h-10 rounded-xl bg-navy-700 items-center justify-center mr-3"><Icon name="box" size={18} color="#4B5563" /></View>}
                <View className="flex-1">
                  <Text className="text-ink-primary text-sm font-medium" numberOfLines={1}>{p.nombre}</Text>
                  <Text className="text-accent text-xs font-bold mt-0.5">Bs. {p.precio ?? '—'} · {p.cantidad} stock</Text>
                </View>
                <TouchableOpacity onPress={() => openEditProd(p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} className="mr-2">
                  <Icon name="edit" size={15} color="#94A3B8" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteProd(p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon name="trash" size={15} color="#EF4444" />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>
      {productos.length > 5 && (
        <TouchableOpacity onPress={() => router.push('/(shop)/items' as any)} className="mx-4 mt-2 py-2.5 flex-row items-center justify-center gap-1" activeOpacity={0.75}>
          <Text className="text-ink-secondary text-xs">Ver todos ({productos.length} productos)</Text>
          <Icon name="chevronRight" size={13} color="#94A3B8" />
        </TouchableOpacity>
      )}

      <SectionLabel label="Calificación" />
      <RatingCard rating={rating} ratingCount={ratingCount} distribution={distribution} />

      {/* Modal producto */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} />
          </TouchableWithoutFeedback>
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: kbHeight, maxHeight: screenHeight * 0.9, backgroundColor: '#162347', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingTop: 20, paddingBottom: kbHeight > 0 ? 16 : insets.bottom + 24 }} keyboardShouldPersistTaps="handled" bounces={false}>
              <View className="flex-row items-start justify-between mb-5">
                <View className="flex-1">
                  <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-1">{editingProd ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO'}</Text>
                  <Text className="text-ink-primary text-lg font-bold">{editingProd ? editingProd.nombre : 'Añadir producto'}</Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} className="ml-3 mt-1">
                  <Icon name="close" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* Imágenes */}
              <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-2">Imágenes (máx. 3)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                <View className="flex-row gap-2">
                  {form.images.map((img, i) => (
                    <View key={i} style={{ position: 'relative' }}>
                      <Image source={{ uri: img.type === 'existing' ? img.imagen_url : img.localUri }} style={{ width: 80, height: 80, borderRadius: 12 }} />
                      <TouchableOpacity onPress={() => handleRemoveImage(i)} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="close" size={10} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {form.images.length < 3 && (
                    <TouchableOpacity onPress={handleAddImage} style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: '#243050', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155', borderStyle: 'dashed' }} activeOpacity={0.8}>
                      <Icon name="plus" size={22} color="#4B5563" />
                      <Text className="text-ink-muted text-xs mt-1">Añadir</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>

              <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-2">Nombre</Text>
              <TextInput value={form.nombre} onChangeText={(t) => setForm((f) => ({ ...f, nombre: t }))} placeholder="Ej: Filtro de aceite" placeholderTextColor="#4B5563" className="bg-navy-700 text-ink-primary px-4 py-3 rounded-xl mb-4" />

              <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-2">Descripción</Text>
              <TextInput value={form.descripcion} onChangeText={(t) => setForm((f) => ({ ...f, descripcion: t }))} placeholder="Descripción del producto" placeholderTextColor="#4B5563" multiline numberOfLines={3} className="bg-navy-700 text-ink-primary px-4 py-3 rounded-xl mb-4" style={{ textAlignVertical: 'top' }} />

              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-2">Precio (Bs.)</Text>
                  <TextInput value={form.precio} onChangeText={(t) => setForm((f) => ({ ...f, precio: t }))} placeholder="0" placeholderTextColor="#4B5563" keyboardType="decimal-pad" className="bg-navy-700 text-ink-primary px-4 py-3 rounded-xl" />
                </View>
                <View className="flex-1">
                  <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-2">Stock</Text>
                  <TextInput value={form.cantidad} onChangeText={(t) => setForm((f) => ({ ...f, cantidad: t }))} placeholder="0" placeholderTextColor="#4B5563" keyboardType="number-pad" className="bg-navy-700 text-ink-primary px-4 py-3 rounded-xl" />
                </View>
              </View>

              <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-2">Categoría</Text>
              <TouchableOpacity onPress={() => setCatPickerVisible(true)} className="bg-navy-700 px-4 py-3 rounded-xl flex-row items-center justify-between mb-6" activeOpacity={0.8}>
                <Text className={selectedCatNombre ? 'text-ink-primary text-sm' : 'text-ink-muted text-sm'}>{selectedCatNombre ?? 'Seleccionar categoría'}</Text>
                <Icon name="chevronRight" size={16} color="#4B5563" />
              </TouchableOpacity>

              <View className="flex-row gap-3">
                <TouchableOpacity onPress={() => setModalVisible(false)} className="flex-1 border border-navy-600 py-3.5 rounded-xl items-center" activeOpacity={0.8}>
                  <Text className="text-ink-secondary font-semibold text-sm">Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveProd} disabled={saving || !form.nombre.trim()} className={`flex-1 bg-accent py-3.5 rounded-xl items-center ${saving || !form.nombre.trim() ? 'opacity-50' : ''}`} activeOpacity={0.85}>
                  {saving ? <ActivityIndicator size="small" color="#0D1B3E" /> : <Text className="text-navy-900 font-bold text-sm">{editingProd ? 'Guardar' : 'Crear'}</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Overlay categorías — dentro del mismo Modal para evitar problemas iOS */}
            {catPickerVisible && (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#162347', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
                <View style={{ padding: 24, paddingTop: 20 }}>
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-ink-primary text-base font-bold">Seleccionar categoría</Text>
                    <TouchableOpacity onPress={() => setCatPickerVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Icon name="close" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={{ maxHeight: 380 }} keyboardShouldPersistTaps="handled">
                    <TouchableOpacity onPress={() => { setForm((f) => ({ ...f, categoriaId: null })); setCatPickerVisible(false); }} className="py-3.5 border-b border-navy-700 flex-row items-center justify-between">
                      <Text className="text-ink-secondary text-sm">Sin categoría</Text>
                      {form.categoriaId === null ? <Icon name="check" size={16} color="#1DB88A" /> : null}
                    </TouchableOpacity>
                    {categorias.map((cat) => (
                      <TouchableOpacity key={cat.id_categoria} onPress={() => { setForm((f) => ({ ...f, categoriaId: cat.id_categoria })); setCatPickerVisible(false); }} className="py-3.5 border-b border-navy-700 flex-row items-center justify-between">
                        <Text className="text-ink-primary text-sm">{cat.nombre}</Text>
                        {form.categoriaId === cat.id_categoria ? <Icon name="check" size={16} color="#1DB88A" /> : null}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <LocationPickerModal
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        usuarioId={usuario.id_usuario}
        role={profile.role}
        onSuccess={() => {
          setShowLocationPicker(false);
          qc.invalidateQueries({ queryKey: ['profile', 'current'] });
        }}
      />
    </>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ShopProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: profile, isLoading, isError } = useCurrentProfile();
  const [activeTab, setActiveTab] = useState<'taller' | 'proveedor'>('taller');

  if (isLoading) {
    return <View className="flex-1 bg-navy-900 items-center justify-center"><ActivityIndicator color="#1DB88A" /></View>;
  }

  if (isError || !profile || profile.role === 'conductor') {
    return <View className="flex-1 bg-navy-900 items-center justify-center px-6"><Text className="text-ink-secondary text-center">No se pudo cargar el perfil.</Text></View>;
  }

  const editRoute =
    profile.role === 'hibrido' ? '/edit-profile/hibrido'
    : profile.role === 'taller' ? '/edit-profile/taller'
    : '/edit-profile/proveedor';

  const handleSettings = () => {
    Alert.alert('Opciones', undefined, [
      { text: 'Editar perfil', onPress: () => router.push(editRoute as any) },
      { text: 'Cerrar sesión', style: 'destructive', onPress: async () => { await supabase.auth.signOut(); router.replace('/(auth)/login'); } },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const headerName =
    profile.role === 'taller' ? (profile as TallerProfile).taller.nombre_taller
    : profile.role === 'proveedor' ? (profile as ProveedorProfile).proveedor.nombre_proveedor
    : activeTab === 'taller' ? (profile as HibridoProfile).taller.nombre_taller
    : (profile as HibridoProfile).proveedor.nombre_proveedor;

  return (
    <View className="flex-1 bg-navy-900">
      <View className="flex-row items-center px-4 pb-3 gap-3 border-b border-navy-700" style={{ paddingTop: insets.top + 12 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="chevronLeft" size={24} color="#1DB88A" />
        </TouchableOpacity>
        <Text className="text-ink-primary text-lg font-bold flex-1" numberOfLines={1}>{headerName}</Text>
        {profile.role === 'hibrido' && (
          <View className="flex-row items-center gap-1">
            {(['taller', 'proveedor'] as const).map((tab) => (
              <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} className={`px-3 py-1 rounded-full ${activeTab === tab ? 'bg-accent' : 'border border-navy-600'}`} activeOpacity={0.8}>
                <Text className={`text-xs font-bold ${activeTab === tab ? 'text-navy-900' : 'text-ink-secondary'}`}>{tab === 'taller' ? 'Taller' : 'Proveedor'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <TouchableOpacity onPress={handleSettings} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="settings" size={22} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {profile.role === 'taller' && <TallerContent profile={profile as TallerProfile} onEditRoute={editRoute} />}
        {profile.role === 'proveedor' && <ProveedorContent profile={profile as ProveedorProfile} onEditRoute={editRoute} />}
        {profile.role === 'hibrido' && activeTab === 'taller' && <TallerContent profile={profile as HibridoProfile} onEditRoute={editRoute} />}
        {profile.role === 'hibrido' && activeTab === 'proveedor' && <ProveedorContent profile={profile as HibridoProfile} onEditRoute={editRoute} />}
      </ScrollView>
    </View>
  );
}
