import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
  ScrollView,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import {
  useCurrentProfile,
  useProveedorProductos,
  useCreateProducto,
  useUpdateProducto,
  useDeleteProducto,
  useCategorias,
} from '@/features/profile/hooks';
import { pickImageFree, uploadCompressedImage } from '@/lib/uploadImage';
import type { ProveedorProfile, HibridoProfile } from '@/types/user';
import type { ProductoItem } from '@/types/database';

type LocalImage =
  | { type: 'existing'; id_imagen: string; imagen_url: string }
  | { type: 'new'; localUri: string };

interface ProductoForm {
  nombre: string;
  descripcion: string;
  precio: string;
  cantidad: string;
  categoriaId: string | null;
  images: LocalImage[];
}

const EMPTY_FORM: ProductoForm = {
  nombre: '',
  descripcion: '',
  precio: '',
  cantidad: '',
  categoriaId: null,
  images: [],
};

export default function ShopItems() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { data: profile, isLoading: loadingProfile } = useCurrentProfile();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const proveedorId =
    profile?.role === 'proveedor'
      ? (profile as ProveedorProfile).proveedor.id_proveedor
      : profile?.role === 'hibrido'
      ? (profile as HibridoProfile).proveedor.id_proveedor
      : '';

  const { data: productos = [], isLoading: loadingProductos } = useProveedorProductos(proveedorId);
  const { data: categorias = [] } = useCategorias();
  const { mutateAsync: createProducto } = useCreateProducto(proveedorId);
  const { mutateAsync: updateProducto } = useUpdateProducto(proveedorId);
  const { mutateAsync: deleteProducto } = useDeleteProducto(proveedorId);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductoItem | null>(null);
  const [form, setForm] = useState<ProductoForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showCatPicker, setShowCatPicker] = useState(false);

  const filtered = search.trim()
    ? productos.filter((p) =>
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        (p.descripcion ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (p.categoria?.nombre ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : productos;

  const toggleSelect = (stockId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(stockId) ? next.delete(stockId) : next.add(stockId);
      return next;
    });
  };

  const openAdd = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEdit = (p: ProductoItem) => {
    setEditingProduct(p);
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      precio: p.precio != null ? String(p.precio) : '',
      cantidad: String(p.cantidad),
      categoriaId: p.categoria?.id_categoria ?? null,
      images: p.imagenes.map((img) => ({
        type: 'existing' as const,
        id_imagen: img.id_imagen,
        imagen_url: img.imagen_url,
      })),
    });
    setModalVisible(true);
  };

  const handleAddImage = async () => {
    if (form.images.length >= 3) {
      Alert.alert('Máximo 3 imágenes por producto.');
      return;
    }
    const uri = await pickImageFree();
    if (uri) {
      setForm((f) => ({ ...f, images: [...f.images, { type: 'new', localUri: uri }] }));
    }
  };

  const handleRemoveImage = (index: number) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      Alert.alert('El nombre del producto es obligatorio.');
      return;
    }
    setSaving(true);
    try {
      const uploadedUrls: string[] = [];
      for (const img of form.images) {
        if (img.type === 'new') {
          const path = `productos/${proveedorId}/${Date.now()}_${Math.random().toString(36).slice(2)}.webp`;
          const url = await uploadCompressedImage(img.localUri, path);
          if (url) uploadedUrls.push(url);
        }
      }

      if (editingProduct) {
        const imageIdsToDelete = editingProduct.imagenes
          .filter((img) => !form.images.some((f) => f.type === 'existing' && f.id_imagen === img.id_imagen))
          .map((img) => img.id_imagen);

        await updateProducto({
          stockId: editingProduct.stock_id,
          repuestoId: editingProduct.repuesto_id,
          data: {
            nombre: form.nombre.trim(),
            descripcion: form.descripcion.trim() || null,
            precio: form.precio ? parseFloat(form.precio) : null,
            cantidad: form.cantidad ? parseInt(form.cantidad, 10) : 0,
            categoriaId: form.categoriaId,
            imageUrlsToAdd: uploadedUrls,
            imageIdsToDelete,
          },
        });
      } else {
        await createProducto({
          vendedorId: proveedorId,
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || null,
          precio: form.precio ? parseFloat(form.precio) : null,
          cantidad: form.cantidad ? parseInt(form.cantidad, 10) : 0,
          categoriaId: form.categoriaId,
          imageUrls: uploadedUrls,
        });
      }
      setModalVisible(false);
      setSelected(new Set());
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo guardar el producto.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (p: ProductoItem) => {
    Alert.alert('Eliminar producto', `¿Eliminar "${p.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteProducto({ stockId: p.stock_id, repuestoId: p.repuesto_id });
          setSelected((prev) => {
            const next = new Set(prev);
            next.delete(p.stock_id);
            return next;
          });
        },
      },
    ]);
  };

  const handleBulkDelete = () => {
    Alert.alert('Eliminar seleccionados', `¿Eliminar ${selected.size} producto(s)?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          for (const stockId of selected) {
            const p = productos.find((x) => x.stock_id === stockId);
            if (p) await deleteProducto({ stockId: p.stock_id, repuestoId: p.repuesto_id });
          }
          setSelected(new Set());
        },
      },
    ]);
  };

  const isLoading = loadingProfile || loadingProductos;

  if (isLoading) {
    return (
      <View className="flex-1 bg-navy-900 items-center justify-center">
        <ActivityIndicator color="#1DB88A" />
      </View>
    );
  }

  if (!proveedorId) {
    return (
      <View className="flex-1 bg-navy-900 items-center justify-center px-6">
        <Text className="text-ink-secondary text-center">
          Esta sección es solo para proveedores.
        </Text>
      </View>
    );
  }

  const selectedNombre = categorias.find((c) => c.id_categoria === form.categoriaId)?.nombre;

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
        <Text className="text-ink-primary text-lg font-bold flex-1">Mis Productos</Text>
        {selected.size > 0 ? (
          <TouchableOpacity
            onPress={handleBulkDelete}
            className="bg-red-600 px-3 py-1.5 rounded-lg"
            activeOpacity={0.8}
          >
            <Text className="text-white text-xs font-bold">Eliminar {selected.size}</Text>
          </TouchableOpacity>
        ) : (
          <Text className="text-ink-secondary text-sm">
            {productos.length} {productos.length === 1 ? 'producto' : 'productos'}
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
      <FlatList
        data={filtered}
        keyExtractor={(p) => p.stock_id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-ink-muted text-sm text-center">
              {search ? 'Sin resultados para tu búsqueda.' : 'Aún no tienes productos.\nToca "Añadir producto" para agregar el primero.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isSelected = selected.has(item.stock_id);
          const firstImage = item.imagenes[0]?.imagen_url;
          return (
            <TouchableOpacity
              onPress={() => toggleSelect(item.stock_id)}
              activeOpacity={0.85}
              className={`flex-row items-center bg-navy-800 rounded-2xl p-3 ${isSelected ? 'border border-accent' : ''}`}
            >
              {/* Checkbox */}
              <View
                className={`w-5 h-5 rounded-md border mr-3 items-center justify-center ${isSelected ? 'bg-accent border-accent' : 'border-navy-600'}`}
              >
                {isSelected ? <Icon name="check" size={12} color="#0D1B3E" /> : null}
              </View>

              {/* Imagen */}
              {firstImage ? (
                <Image source={{ uri: firstImage }} className="w-12 h-12 rounded-xl mr-3" />
              ) : (
                <View className="w-12 h-12 rounded-xl bg-navy-700 items-center justify-center mr-3">
                  <Icon name="box" size={22} color="#4B5563" />
                </View>
              )}

              {/* Info */}
              <View className="flex-1">
                <Text className="text-ink-primary text-sm font-semibold" numberOfLines={1}>
                  {item.nombre}
                </Text>
                {item.descripcion ? (
                  <Text className="text-ink-secondary text-xs mt-0.5" numberOfLines={1}>
                    {item.descripcion}
                  </Text>
                ) : null}
                <Text className="text-accent text-xs font-bold mt-1">
                  Bs. {item.precio ?? '—'} · {item.cantidad} stock
                  {item.imagenes.length > 0 ? ` · ${item.imagenes.length} img` : ''}
                </Text>
              </View>

              {/* Acciones */}
              <View className="flex-row gap-2 ml-2">
                <TouchableOpacity
                  onPress={() => openEdit(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  className="w-8 h-8 rounded-lg bg-navy-700 items-center justify-center"
                >
                  <Icon name="edit" size={14} color="#94A3B8" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  className="w-8 h-8 rounded-lg bg-red-950 items-center justify-center"
                >
                  <Icon name="trash" size={14} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
      />

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
          <Text className="text-navy-900 font-bold text-sm">Añadir producto</Text>
        </TouchableOpacity>
      </View>

      {/* Modal crear / editar */}
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
                    {editingProduct ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO'}
                  </Text>
                  <Text className="text-ink-primary text-lg font-bold">
                    {editingProduct ? editingProduct.nombre : 'Añadir producto'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} className="ml-3 mt-1">
                  <Icon name="close" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* Imágenes */}
              <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-2">
                Imágenes del producto
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                <View className="flex-row gap-2">
                  {form.images.map((img, i) => (
                    <View key={i} className="relative">
                      <Image
                        source={{ uri: img.type === 'existing' ? img.imagen_url : img.localUri }}
                        className="w-20 h-20 rounded-xl"
                      />
                      <TouchableOpacity
                        onPress={() => handleRemoveImage(i)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 items-center justify-center"
                      >
                        <Icon name="close" size={10} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {form.images.length < 5 ? (
                    <TouchableOpacity
                      onPress={handleAddImage}
                      className="w-20 h-20 rounded-xl bg-navy-700 items-center justify-center border border-dashed border-navy-600"
                      activeOpacity={0.8}
                    >
                      <Icon name="plus" size={22} color="#4B5563" />
                      <Text className="text-ink-muted text-xs mt-1">Añadir</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </ScrollView>

              {/* Nombre */}
              <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-2">
                Nombre del producto
              </Text>
              <TextInput
                value={form.nombre}
                onChangeText={(t) => setForm((f) => ({ ...f, nombre: t }))}
                placeholder="Ej: Filtro de aceite"
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
                placeholder="Descripción del producto"
                placeholderTextColor="#4B5563"
                multiline
                numberOfLines={3}
                className="bg-navy-700 text-ink-primary px-4 py-3 rounded-xl mb-4"
                style={{ textAlignVertical: 'top' }}
              />

              {/* Precio y stock */}
              <View className="flex-row gap-3 mb-4">
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
                <View className="flex-1">
                  <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-2">
                    Stock
                  </Text>
                  <TextInput
                    value={form.cantidad}
                    onChangeText={(t) => setForm((f) => ({ ...f, cantidad: t }))}
                    placeholder="0"
                    placeholderTextColor="#4B5563"
                    keyboardType="number-pad"
                    className="bg-navy-700 text-ink-primary px-4 py-3 rounded-xl"
                  />
                </View>
              </View>

              {/* Categoría */}
              <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-2">
                Categoría
              </Text>
              <TouchableOpacity
                onPress={() => setShowCatPicker(true)}
                className="bg-navy-700 px-4 py-3 rounded-xl flex-row items-center justify-between mb-6"
                activeOpacity={0.8}
              >
                <Text className={selectedNombre ? 'text-ink-primary text-sm' : 'text-ink-muted text-sm'}>
                  {selectedNombre ?? 'Seleccionar categoría'}
                </Text>
                <Icon name="chevronRight" size={16} color="#4B5563" />
              </TouchableOpacity>

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
                      {editingProduct ? 'Guardar' : 'Crear'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Picker de categorías — overlay dentro del mismo Modal para evitar problemas con modales anidados en iOS */}
            {showCatPicker && (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#162347', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
                <View style={{ padding: 24, paddingTop: 20 }}>
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-ink-primary text-base font-bold">Seleccionar categoría</Text>
                    <TouchableOpacity onPress={() => setShowCatPicker(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Icon name="close" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={{ maxHeight: 400 }} keyboardShouldPersistTaps="handled">
                    <TouchableOpacity
                      onPress={() => { setForm((f) => ({ ...f, categoriaId: null })); setShowCatPicker(false); }}
                      className="py-3.5 border-b border-navy-700 flex-row items-center justify-between"
                    >
                      <Text className="text-ink-secondary text-sm">Sin categoría</Text>
                      {form.categoriaId === null ? <Icon name="check" size={16} color="#1DB88A" /> : null}
                    </TouchableOpacity>
                    {categorias.map((cat) => (
                      <TouchableOpacity
                        key={cat.id_categoria}
                        onPress={() => { setForm((f) => ({ ...f, categoriaId: cat.id_categoria })); setShowCatPicker(false); }}
                        className="py-3.5 border-b border-navy-700 flex-row items-center justify-between"
                      >
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
    </View>
  );
}
