import { supabase } from '@/lib/supabase';
import type { Taller, Proveedor, CommonStatus } from '@/types/database';
import type { UiRole } from '@/types/user';

// ─── Tipo híbrido (usuario con taller Y proveedor) ────────────────────────────

export interface EstablecimientoHibrido {
  _kind: 'hibrido';
  id_taller: string;
  id_proveedor: string;
  usuario_id: string;
  nombre_taller: string;
  nombre_proveedor: string;
  lat: number;
  lng: number;
  direccion: string | null;
  imagenUrl: string | null;
  estado: CommonStatus;
}

// ─── Tipo unificado ───────────────────────────────────────────────────────────

export type Establecimiento =
  | (Taller    & { _kind: 'taller';    imagenUrl: string | null })
  | (Proveedor & { _kind: 'proveedor'; imagenUrl: string | null })
  | EstablecimientoHibrido;

// ─── Type guards ─────────────────────────────────────────────────────────────

export function isTaller(e: Establecimiento): e is Taller & { _kind: 'taller'; imagenUrl: string | null } {
  return e._kind === 'taller';
}

export function isProveedor(e: Establecimiento): e is Proveedor & { _kind: 'proveedor'; imagenUrl: string | null } {
  return e._kind === 'proveedor';
}

export function isHibrido(e: Establecimiento): e is EstablecimientoHibrido {
  return e._kind === 'hibrido';
}

export function getNombre(e: Establecimiento): string {
  if (e._kind === 'taller')    return e.nombre_taller;
  if (e._kind === 'proveedor') return e.nombre_proveedor;
  return e.nombre_taller;  // híbrido: nombre principal del taller
}

export function getId(e: Establecimiento): string {
  if (e._kind === 'taller')    return e.id_taller;
  if (e._kind === 'proveedor') return e.id_proveedor;
  return e.id_taller;  // híbrido: usar id_taller como clave primaria del marcador
}

// ─── Fetch con detección de híbridos ─────────────────────────────────────────

export async function fetchEstablecimientos(): Promise<Establecimiento[]> {
  const [tallRes, provRes] = await Promise.all([
    supabase.from('taller').select('*').eq('estado', 'activo'),
    supabase.from('proveedor').select('*').eq('estado', 'activo'),
  ]);

  if (tallRes.error) throw tallRes.error;
  if (provRes.error) throw provRes.error;

  const talleres   = tallRes.data as Taller[];
  const proveedores = provRes.data as Proveedor[];

  // Mapa de proveedores por usuario_id para detección O(1)
  const provByUser = new Map(proveedores.map((p) => [p.usuario_id, p]));
  const hybridUsers = new Set<string>();
  const result: Establecimiento[] = [];

  for (const t of talleres) {
    const p = provByUser.get(t.usuario_id);
    if (p) {
      // Mismo usuario tiene taller Y proveedor → híbrido (un solo marcador)
      hybridUsers.add(t.usuario_id);
      result.push({
        _kind:           'hibrido',
        id_taller:       t.id_taller,
        id_proveedor:    p.id_proveedor,
        usuario_id:      t.usuario_id,
        nombre_taller:   t.nombre_taller,
        nombre_proveedor: p.nombre_proveedor,
        lat:             t.lat,
        lng:             t.lng,
        direccion:       t.direccion,
        imagenUrl:       t.perfil_taller_url ?? p.perfil_proveedor_url ?? null,
        estado:          t.estado,
      });
    } else {
      result.push({ ...t, _kind: 'taller', imagenUrl: t.perfil_taller_url ?? null });
    }
  }

  // Solo agregar proveedores que NO son parte de un híbrido ya registrado
  for (const p of proveedores) {
    if (!hybridUsers.has(p.usuario_id)) {
      result.push({ ...p, _kind: 'proveedor', imagenUrl: p.perfil_proveedor_url ?? null });
    }
  }

  return result;
}

// ─── Búsqueda por nombre (autocomplete) ──────────────────────────────────────

export async function searchEstablecimientos(query: string): Promise<Establecimiento[]> {
  const pattern = `%${query}%`;
  const [tallRes, provRes] = await Promise.all([
    supabase.from('taller').select('*').ilike('nombre_taller', pattern).eq('estado', 'activo').limit(4),
    supabase.from('proveedor').select('*').ilike('nombre_proveedor', pattern).eq('estado', 'activo').limit(4),
  ]);
  const talleres = ((tallRes.data ?? []) as Taller[]).map(
    (t): Establecimiento => ({ ...t, _kind: 'taller', imagenUrl: t.perfil_taller_url ?? null }),
  );
  const proveedores = ((provRes.data ?? []) as Proveedor[]).map(
    (p): Establecimiento => ({ ...p, _kind: 'proveedor', imagenUrl: p.perfil_proveedor_url ?? null }),
  );
  return [...talleres, ...proveedores];
}

// ─── Actualizar coordenadas del establecimiento ───────────────────────────────

export async function updateUbicacion(
  usuarioId: string,
  role: UiRole,
  lat: number,
  lng: number,
): Promise<void> {
  if (role === 'taller' || role === 'hibrido') {
    const { error } = await supabase.from('taller').update({ lat, lng }).eq('usuario_id', usuarioId);
    if (error) throw error;
  }
  if (role === 'proveedor' || role === 'hibrido') {
    const { error } = await supabase.from('proveedor').update({ lat, lng }).eq('usuario_id', usuarioId);
    if (error) throw error;
  }
}

// ─── Datos extra para el mini perfil del sheet del mapa ──────────────────────

export interface SheetExtraData {
  rating: number;
  ratingCount: number;
  especialidades: string[];
  horarioApertura: string | null;
  horarioCierre: string | null;
  servicioRemolque: boolean;
}

export async function fetchSheetData(item: Establecimiento): Promise<SheetExtraData> {
  const id = getId(item);

  // Rating
  const { data: calData } = await supabase
    .from('calificacion')
    .select('estrellas')
    .eq('taller_proveedor_id', id)
    .eq('estado', true);

  const count  = calData?.length ?? 0;
  const rating = count > 0
    ? Math.round(calData!.reduce((a, r) => a + (r.estrellas ?? 0), 0) / count * 10) / 10
    : 0;

  // Especialidades (solo taller / híbrido)
  const tallerId = item._kind !== 'proveedor' ? item.id_taller : null;
  let especialidades: string[] = [];
  if (tallerId) {
    const { data: espData } = await supabase
      .from('taller_especialidad')
      .select('especialidad:especialidad_id(nombre_especialidad)')
      .eq('taller_id', tallerId)
      .limit(3);
    especialidades = (espData ?? [])
      .map((r: any) => r.especialidad?.nombre_especialidad)
      .filter(Boolean);
  }

  // Horario + remolque
  let horarioApertura: string | null = null;
  let horarioCierre:   string | null = null;
  let servicioRemolque = false;

  if (item._kind === 'taller') {
    horarioApertura  = item.horario_apertura ?? null;
    horarioCierre    = item.horario_cierre   ?? null;
    servicioRemolque = item.servicio_remolque ?? false;
  } else if (item._kind === 'proveedor') {
    horarioApertura = item.horario_apertura ?? null;
    horarioCierre   = item.horario_cierre   ?? null;
  } else {
    // híbrido: buscar en la tabla taller
    const { data: t } = await supabase
      .from('taller')
      .select('horario_apertura, horario_cierre, servicio_remolque')
      .eq('id_taller', item.id_taller)
      .single();
    horarioApertura  = t?.horario_apertura  ?? null;
    horarioCierre    = t?.horario_cierre    ?? null;
    servicioRemolque = t?.servicio_remolque ?? false;
  }

  return { rating, ratingCount: count, especialidades, horarioApertura, horarioCierre, servicioRemolque };
}

// ─── Mock data (fallback cuando Supabase falla o BD está vacía) ───────────────

export const MOCK_ESTABLECIMIENTOS: Establecimiento[] = [
  {
    _kind: 'taller',
    id_taller: 'mock-t1',
    usuario_id: 'mock-u1',
    nombre_taller: 'Taller El Rápido',
    descripcion: null,
    horario_apertura: '08:00',
    horario_cierre: '18:00',
    direccion: 'Av. Blanco Galindo km 5, Cochabamba',
    telefono: '77712345',
    correo: null,
    servicio_remolque: true,
    lat: -17.394,
    lng: -66.157,
    perfil_taller_url: null,
    banner_taller_url: null,
    estado: 'activo',
    imagenUrl: null,
  },
  {
    _kind: 'proveedor',
    id_proveedor: 'mock-p1',
    usuario_id: 'mock-u2',
    nombre_proveedor: 'Repuestos Andina',
    descripcion: null,
    horario_apertura: '08:00',
    horario_cierre: '18:00',
    direccion: 'Av. Heroínas 1200, Cochabamba',
    telefono: '4441234',
    correo: null,
    lat: -17.386,
    lng: -66.160,
    perfil_proveedor_url: null,
    banner_proveedor_url: null,
    estado: 'activo',
    imagenUrl: null,
  },
  {
    _kind: 'hibrido',
    id_taller: 'mock-h-t',
    id_proveedor: 'mock-h-p',
    usuario_id: 'mock-u3',
    nombre_taller: 'AutoServicios Zenteno',
    nombre_proveedor: 'Repuestos Zenteno',
    lat: -17.389,
    lng: -66.162,
    direccion: 'C. Jordán 456, Cochabamba',
    imagenUrl: null,
    estado: 'activo',
  },
];
