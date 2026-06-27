import { supabase } from '@/lib/supabase';
import type {
  AnyProfile,
  ConductorProfile,
  HibridoProfile,
  ProveedorProfile,
  TallerProfile,
  UserMeta,
} from '@/types/user';
import type { DbCategoria, DbEspecialidad, DbFavorito, DbServicio, ProductoItem } from '@/types/database';

// ─── helpers ────────────────────────────────────────────────────────────────

async function getRating(
  tallerId?: string,
  proveedorId?: string,
): Promise<{ rating: number; count: number }> {
  const id = tallerId ?? proveedorId;
  if (!id) return { rating: 0, count: 0 };

  const { data } = await supabase
    .from('calificacion')
    .select('estrellas')
    .eq('taller_proveedor_id', id)
    .eq('estado', true);

  if (!data || data.length === 0) return { rating: 0, count: 0 };
  const avg = data.reduce((acc, r) => acc + (r.estrellas ?? 0), 0) / data.length;
  return { rating: Math.round(avg * 10) / 10, count: data.length };
}

async function getEspecialidades(tallerId: string): Promise<DbEspecialidad[]> {
  const { data } = await supabase
    .from('taller_especialidad')
    .select('especialidad:especialidad_id(id_especialidad, nombre_especialidad, descripcion, activo)')
    .eq('taller_id', tallerId);

  return (data ?? []).map((r: any) => r.especialidad).filter(Boolean);
}

async function getServicios(tallerId: string): Promise<DbServicio[]> {
  const { data } = await supabase
    .from('servicios')
    .select('*')
    .eq('taller_id', tallerId);

  return data ?? [];
}

// ─── fetch current user profile ─────────────────────────────────────────────

export async function fetchCurrentProfile(): Promise<AnyProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const meta: UserMeta = {
    full_name: user.user_metadata?.full_name,
    direccion: user.user_metadata?.direccion,
    bio: user.user_metadata?.bio,
  };

  const { data: usuario } = await supabase
    .from('usuario')
    .select('*')
    .eq('id_usuario', user.id)
    .single();

  if (!usuario) return null;

  const { data: taller } = await supabase
    .from('taller')
    .select('*')
    .eq('usuario_id', user.id)
    .maybeSingle();

  const { data: proveedor } = await supabase
    .from('proveedor')
    .select('*')
    .eq('usuario_id', user.id)
    .maybeSingle();

  if (taller && proveedor) {
    const [especialidades, servicios, ratingData] = await Promise.all([
      getEspecialidades(taller.id_taller),
      getServicios(taller.id_taller),
      getRating(taller.id_taller),
    ]);
    return {
      role: 'hibrido',
      usuario,
      meta,
      taller,
      proveedor,
      especialidades,
      servicios,
      rating: ratingData.rating,
      ratingCount: ratingData.count,
    } satisfies HibridoProfile;
  }

  if (taller) {
    const [especialidades, servicios, ratingData] = await Promise.all([
      getEspecialidades(taller.id_taller),
      getServicios(taller.id_taller),
      getRating(taller.id_taller),
    ]);
    return {
      role: 'taller',
      usuario,
      meta,
      taller,
      especialidades,
      servicios,
      rating: ratingData.rating,
      ratingCount: ratingData.count,
    } satisfies TallerProfile;
  }

  if (proveedor) {
    const ratingData = await getRating(undefined, proveedor.id_proveedor);
    return {
      role: 'proveedor',
      usuario,
      meta,
      proveedor,
      rating: ratingData.rating,
      ratingCount: ratingData.count,
    } satisfies ProveedorProfile;
  }

  return { role: 'conductor', usuario, meta } satisfies ConductorProfile;
}

// ─── update conductor ────────────────────────────────────────────────────────

export async function updateConductorProfile(
  usuarioId: string,
  data: { ci?: string; phone?: string; full_name?: string; direccion?: string; bio?: string; avatar_url?: string },
) {
  const { full_name, direccion, bio, ...dbFields } = data;
  const promises: PromiseLike<any>[] = [];

  if (Object.keys(dbFields).length > 0) {
    promises.push(supabase.from('usuario').update(dbFields).eq('id_usuario', usuarioId));
  }

  const metaUpdates: Record<string, string> = {};
  if (full_name !== undefined) metaUpdates.full_name = full_name;
  if (direccion !== undefined) metaUpdates.direccion = direccion;
  if (bio !== undefined) metaUpdates.bio = bio;

  if (Object.keys(metaUpdates).length > 0) {
    promises.push(supabase.auth.updateUser({ data: metaUpdates }));
  }

  await Promise.all(promises);
}

// ─── update taller ───────────────────────────────────────────────────────────

export async function updateTallerProfile(
  tallerId: string,
  data: {
    nombre_taller?: string;
    descripcion?: string;
    horario_apertura?: string;
    horario_cierre?: string;
    direccion?: string;
    telefono?: string;
    correo?: string;
    banner_taller_url?: string;
    perfil_taller_url?: string;
  },
) {
  await supabase.from('taller').update(data).eq('id_taller', tallerId);
}

export async function updateTallerEspecialidades(
  tallerId: string,
  especialidadIds: string[],
) {
  await supabase.from('taller_especialidad').delete().eq('taller_id', tallerId);
  if (especialidadIds.length > 0) {
    await supabase.from('taller_especialidad').insert(
      especialidadIds.map((id) => ({ taller_id: tallerId, especialidad_id: id })),
    );
  }
}

export async function upsertServicio(servicio: Omit<DbServicio, 'id_servicio'> & { id_servicio?: string }) {
  if (servicio.id_servicio) {
    return supabase.from('servicios').update(servicio).eq('id_servicio', servicio.id_servicio);
  }
  return supabase.from('servicios').insert(servicio);
}

export async function deleteServicio(servicioId: string) {
  return supabase.from('servicios').delete().eq('id_servicio', servicioId);
}

// ─── update proveedor ────────────────────────────────────────────────────────

export async function updateProveedorProfile(
  proveedorId: string,
  data: {
    nombre_proveedor?: string;
    descripcion?: string;
    horario_apertura?: string;
    horario_cierre?: string;
    direccion?: string;
    telefono?: string;
    correo?: string;
    banner_proveedor_url?: string;
    perfil_proveedor_url?: string;
  },
) {
  await supabase.from('proveedor').update(data).eq('id_proveedor', proveedorId);
}

// ─── fetch public profiles (viewed by other users) ──────────────────────────

export async function fetchPublicTallerProfile(tallerId: string) {
  const { data: taller } = await supabase
    .from('taller')
    .select('*')
    .eq('id_taller', tallerId)
    .single();
  if (!taller) return null;

  const [especialidades, servicios, ratingData] = await Promise.all([
    getEspecialidades(taller.id_taller),
    getServicios(taller.id_taller),
    getRating(taller.id_taller),
  ]);
  return { taller, especialidades, servicios, rating: ratingData.rating, ratingCount: ratingData.count };
}

export async function fetchPublicProveedorProfile(proveedorId: string) {
  const { data: proveedor } = await supabase
    .from('proveedor')
    .select('*')
    .eq('id_proveedor', proveedorId)
    .single();
  if (!proveedor) return null;

  const [ratingData, productos] = await Promise.all([
    getRating(undefined, proveedor.id_proveedor),
    fetchProveedorProductos(proveedor.id_proveedor),
  ]);
  return { proveedor, rating: ratingData.rating, ratingCount: ratingData.count, productos };
}

export async function fetchPublicConductorProfile(usuarioId: string) {
  const { data: usuario } = await supabase
    .from('usuario')
    .select('*')
    .eq('id_usuario', usuarioId)
    .single();
  return usuario ?? null;
}

// ─── calificaciones ──────────────────────────────────────────────────────────

export async function fetchRatingDistribution(
  entidadId: string,
): Promise<{ star: number; count: number; percent: number }[]> {
  const { data } = await supabase
    .from('calificacion')
    .select('estrellas')
    .eq('taller_proveedor_id', entidadId)
    .eq('estado', true);

  if (!data || data.length === 0) {
    return [5, 4, 3, 2, 1].map((s) => ({ star: s, count: 0, percent: 0 }));
  }
  const total = data.length;
  return [5, 4, 3, 2, 1].map((s) => {
    const count = data.filter((r: any) => r.estrellas === s).length;
    return { star: s, count, percent: Math.round((count / total) * 100) };
  });
}

export async function fetchMyRating(
  conductorId: string,
  entidadId: string,
): Promise<number | null> {
  const { data } = await supabase
    .from('calificacion')
    .select('estrellas')
    .eq('usuario_id', conductorId)
    .eq('taller_proveedor_id', entidadId)
    .maybeSingle();
  return (data as any)?.estrellas ?? null;
}

export async function submitCalificacion(
  conductorId: string,
  entidadId: string,
  estrellas: number,
  tags: string[],
): Promise<void> {
  const { error } = await supabase.from('calificacion').insert({
    usuario_id: conductorId,
    taller_proveedor_id: entidadId,
    estrellas,
    estado: true,
    tags,
  });
  if (error) throw new Error(error.message);
}

// ─── favoritos ───────────────────────────────────────────────────────────────

export async function fetchFavoritos(conductorId: string): Promise<DbFavorito[]> {
  const { data } = await supabase
    .from('favoritos')
    .select('*')
    .eq('usuario_id', conductorId)
    .eq('estado', true)
    .order('id_favoritos', { ascending: false });
  return (data ?? []) as DbFavorito[];
}

export async function fetchIsFavorito(
  conductorId: string,
  entidadId: string,
  entidadTipo: 'taller' | 'proveedor',
): Promise<boolean> {
  const { data } = await supabase
    .from('favoritos')
    .select('id_favoritos')
    .eq('usuario_id', conductorId)
    .eq('taller_proveedor_id', entidadId)
    .eq('entidad_tipo', entidadTipo)
    .eq('estado', true)
    .maybeSingle();
  return !!data;
}

export async function addFavorito(
  conductorId: string,
  entidadId: string,
  entidadTipo: 'taller' | 'proveedor',
  nombre: string,
  imagenUrl: string | null,
): Promise<void> {
  await supabase.from('favoritos').upsert(
    {
      usuario_id: conductorId,
      taller_proveedor_id: entidadId,
      entidad_tipo: entidadTipo,
      nombre,
      imagen_url: imagenUrl,
      estado: true,
    },
    { onConflict: 'usuario_id,taller_proveedor_id' },
  );
}

export async function removeFavorito(
  conductorId: string,
  entidadId: string,
  entidadTipo: 'taller' | 'proveedor',
): Promise<void> {
  await supabase
    .from('favoritos')
    .update({ estado: false })
    .eq('usuario_id', conductorId)
    .eq('taller_proveedor_id', entidadId)
    .eq('entidad_tipo', entidadTipo);
}

// ─── fetch all especialidades (catalog) ─────────────────────────────────────

export async function fetchAllEspecialidades() {
  const { data } = await supabase
    .from('especialidad')
    .select('*')
    .eq('activo', true)
    .order('nombre_especialidad');
  return data ?? [];
}

// ─── categorías (catalog) ────────────────────────────────────────────────────

export async function fetchAllCategorias(): Promise<DbCategoria[]> {
  const { data } = await supabase.from('categoria').select('*').order('nombre');
  return (data ?? []) as DbCategoria[];
}

// ─── productos (repuesto + stock + imagenes) ─────────────────────────────────

export async function fetchProveedorProductos(proveedorId: string): Promise<ProductoItem[]> {
  const { data: stocks } = await supabase
    .from('stock')
    .select('id, repuesto_id, cantidad, precio')
    .eq('vendedor_id', proveedorId);

  if (!stocks || stocks.length === 0) return [];

  const repuestoIds = stocks.map((s: any) => s.repuesto_id as string);

  const [{ data: repuestos }, { data: imagenes }, { data: repCats }] = await Promise.all([
    supabase.from('repuesto').select('id_repuesto, producto, descripcion').in('id_repuesto', repuestoIds),
    supabase.from('imagenes').select('id_imagen, id_repuesto, imagen_url').in('id_repuesto', repuestoIds),
    supabase.from('repuesto_categoria').select('repuesto_id, categoria_id').in('repuesto_id', repuestoIds),
  ]);

  const catIds = [...new Set((repCats ?? []).map((rc: any) => rc.categoria_id as string))];
  const { data: cats } = catIds.length > 0
    ? await supabase.from('categoria').select('id_categoria, nombre').in('id_categoria', catIds)
    : { data: [] as any[] };

  return stocks.map((stock: any) => {
    const rep = (repuestos ?? []).find((r: any) => r.id_repuesto === stock.repuesto_id);
    const imgs = (imagenes ?? []).filter((i: any) => i.id_repuesto === stock.repuesto_id);
    const rc = (repCats ?? []).find((x: any) => x.repuesto_id === stock.repuesto_id);
    const cat = rc ? (cats ?? []).find((c: any) => c.id_categoria === rc.categoria_id) : null;
    return {
      stock_id: stock.id,
      repuesto_id: stock.repuesto_id,
      nombre: rep?.producto ?? '',
      descripcion: rep?.descripcion ?? null,
      precio: stock.precio,
      cantidad: stock.cantidad,
      imagenes: imgs,
      categoria: cat ? { id_categoria: cat.id_categoria, nombre: cat.nombre } : null,
    };
  });
}

export async function createProducto(data: {
  vendedorId: string;
  nombre: string;
  descripcion: string | null;
  precio: number | null;
  cantidad: number;
  categoriaId: string | null;
  imageUrls: string[];
}): Promise<void> {
  const { data: repuesto, error } = await supabase
    .from('repuesto')
    .insert({ producto: data.nombre, descripcion: data.descripcion })
    .select('id_repuesto')
    .single();
  if (error || !repuesto) throw new Error(error?.message ?? 'Error creando producto');

  const repuestoId = repuesto.id_repuesto;

  await supabase.from('stock').insert({
    repuesto_id: repuestoId,
    vendedor_id: data.vendedorId,
    cantidad: data.cantidad,
    precio: data.precio,
  });

  if (data.imageUrls.length > 0) {
    await supabase.from('imagenes').insert(
      data.imageUrls.map((url) => ({ id_repuesto: repuestoId, imagen_url: url })),
    );
  }

  if (data.categoriaId) {
    await supabase.from('repuesto_categoria').insert({
      repuesto_id: repuestoId,
      categoria_id: data.categoriaId,
    });
  }
}

export async function updateProducto(
  stockId: string,
  repuestoId: string,
  data: {
    nombre: string;
    descripcion: string | null;
    precio: number | null;
    cantidad: number;
    categoriaId: string | null;
    imageUrlsToAdd: string[];
    imageIdsToDelete: string[];
  },
): Promise<void> {
  await Promise.all([
    supabase.from('repuesto').update({ producto: data.nombre, descripcion: data.descripcion }).eq('id_repuesto', repuestoId),
    supabase.from('stock').update({ precio: data.precio, cantidad: data.cantidad }).eq('id', stockId),
  ]);

  if (data.imageIdsToDelete.length > 0) {
    await supabase.from('imagenes').delete().in('id_imagen', data.imageIdsToDelete);
  }
  if (data.imageUrlsToAdd.length > 0) {
    await supabase.from('imagenes').insert(
      data.imageUrlsToAdd.map((url) => ({ id_repuesto: repuestoId, imagen_url: url })),
    );
  }

  await supabase.from('repuesto_categoria').delete().eq('repuesto_id', repuestoId);
  if (data.categoriaId) {
    await supabase.from('repuesto_categoria').insert({ repuesto_id: repuestoId, categoria_id: data.categoriaId });
  }
}

export async function deleteProducto(stockId: string, repuestoId: string): Promise<void> {
  await supabase.from('repuesto_categoria').delete().eq('repuesto_id', repuestoId);
  await supabase.from('imagenes').delete().eq('id_repuesto', repuestoId);
  await supabase.from('stock').delete().eq('id', stockId);
  await supabase.from('repuesto').delete().eq('id_repuesto', repuestoId);
}
