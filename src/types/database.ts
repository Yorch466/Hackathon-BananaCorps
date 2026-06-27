// Tipos raw que mapean 1:1 con las columnas de Supabase.
// Prefijo Db = tipo directo de tabla. Sin prefijo = tipo compuesto/legacy.

// ─── Enums ───────────────────────────────────────────────────────────────────
export type UserRole = 'conductor' | 'taller' | 'proveedor' | 'administrador';
export type CommonStatus = 'activo' | 'inactivo';
export type SosStatus = 'pendiente' | 'atendida';

// ─── usuario ─────────────────────────────────────────────────────────────────
export interface DbUsuario {
  id_usuario: string;
  email: string;
  ci: string;
  phone: string | null;
  type: UserRole;
  avatar_url: string | null;
  created_at: string;
}
export type Usuario = DbUsuario; // alias legacy

// ─── taller ──────────────────────────────────────────────────────────────────
export interface DbTaller {
  id_taller: string;
  usuario_id: string;
  nombre_taller: string;
  descripcion: string | null;
  horario_apertura: string | null;
  horario_cierre: string | null;
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
  servicio_remolque: boolean;
  lat: number;
  lng: number;
  perfil_taller_url: string | null;
  banner_taller_url: string | null;
  estado: CommonStatus;
}
export type Taller = DbTaller; // alias legacy

// ─── proveedor ───────────────────────────────────────────────────────────────
export interface DbProveedor {
  id_proveedor: string;
  usuario_id: string;
  nombre_proveedor: string;
  descripcion: string | null;
  horario_apertura: string | null;
  horario_cierre: string | null;
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
  lat: number;
  lng: number;
  perfil_proveedor_url: string | null;
  banner_proveedor_url: string | null;
  estado: CommonStatus;
}
export type Proveedor = DbProveedor; // alias legacy

// ─── especialidad ────────────────────────────────────────────────────────────
export interface DbEspecialidad {
  id_especialidad: string;
  nombre_especialidad: string;
  descripcion: string | null;
  activo: boolean;
}
export type Especialidad = DbEspecialidad; // alias legacy

// ─── servicio ────────────────────────────────────────────────────────────────
export interface DbServicio {
  id_servicio: string;
  taller_id: string;
  nombre_servicio: string;
  descripcion: string | null;
  imagen_servicio_url: string | null;
  precio: number | null;
  duracion: string | null;
}
export type Servicio = DbServicio; // alias legacy

// ─── repuesto / stock / imagenes ─────────────────────────────────────────────
export interface DbRepuesto {
  id_repuesto: string;
  producto: string;
  descripcion: string | null;
}
export type Repuesto = DbRepuesto; // alias legacy

export interface DbStock {
  id: string;
  repuesto_id: string;
  vendedor_id: string;
  cantidad: number;
  precio: number | null;
}
export type Stock = DbStock; // alias legacy

export interface DbImagen {
  id_imagen: string;
  id_repuesto: string;
  imagen_url: string;
}
export type ImagenRepuesto = DbImagen; // alias legacy

// ─── categoria ───────────────────────────────────────────────────────────────
export interface DbCategoria {
  id_categoria: string;
  nombre: string;
  descripcion: string | null;
}
export type Categoria = DbCategoria; // alias legacy

// ─── Producto compuesto (stock + repuesto + imágenes + categoría) ─────────────
export interface ProductoItem {
  stock_id: string;
  repuesto_id: string;
  nombre: string;
  descripcion: string | null;
  precio: number | null;
  cantidad: number;
  imagenes: { id_imagen: string; imagen_url: string }[];
  categoria: { id_categoria: string; nombre: string } | null;
}

// ─── favoritos ───────────────────────────────────────────────────────────────
export interface DbFavorito {
  id_favoritos: string;
  usuario_id: string;
  taller_proveedor_id: string;
  entidad_tipo: 'taller' | 'proveedor';
  nombre: string | null;
  imagen_url: string | null;
  estado: boolean;
  created_at?: string;
}
export type Favorito = DbFavorito; // alias legacy

// ─── planes ──────────────────────────────────────────────────────────────────
export interface Plan {
  id_plan: string;
  nombre: string;
  precio: number;
  descripcion: string | null;
  tiempo_dias: number | null;
}

// ─── suscripcion ─────────────────────────────────────────────────────────────
export interface Suscripcion {
  id_suscripcion: string;
  usuario_id: string;
  plan_id: string | null;
  tipo: string | null;
  inicio: string;
  fin: string | null;
  comprobante_url: string | null;
  estado: boolean;
}

// ─── solicitud_sos ───────────────────────────────────────────────────────────
export interface SolicitudSos {
  id: string;
  conductor_id: string;
  taller_id: string | null;
  lat_emergencia: number;
  lng_emergencia: number;
  fecha_hora: string;
  estado: SosStatus;
}

// ─── calificacion ────────────────────────────────────────────────────────────
export interface Calificacion {
  id_calificacion: string;
  usuario_id: string;
  taller_proveedor_id: string;
  estrellas: 1 | 2 | 3 | 4 | 5;
  estado: boolean;
}

// ─── relaciones M:M ──────────────────────────────────────────────────────────
export interface TallerEspecialidad {
  taller_id: string;
  especialidad_id: string;
}

export interface RepuestoCategoria {
  repuesto_id: string;
  categoria_id: string;
}
