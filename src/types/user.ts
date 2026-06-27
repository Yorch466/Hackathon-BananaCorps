import type { DbEspecialidad, DbServicio, DbTaller, DbUsuario, DbProveedor, UserRole } from './database';

export type { UserRole };
export type UiRole = 'conductor' | 'taller' | 'proveedor' | 'hibrido';

// Metadata stored in Supabase Auth user_metadata (conductor-only fields)
export interface UserMeta {
  full_name?: string;
  direccion?: string;
  bio?: string;
}

// ─── Perfiles tipados por rol ─────────────────────────────────────────────────
export interface ConductorProfile {
  usuario: DbUsuario;
  meta: UserMeta;
  role: 'conductor';
}

export interface TallerProfile {
  usuario: DbUsuario;
  meta: UserMeta;
  taller: DbTaller;
  especialidades: DbEspecialidad[];
  servicios: DbServicio[];
  rating: number;
  ratingCount: number;
  role: 'taller';
}

export interface ProveedorProfile {
  usuario: DbUsuario;
  meta: UserMeta;
  proveedor: DbProveedor;
  rating: number;
  ratingCount: number;
  role: 'proveedor';
}

export interface HibridoProfile {
  usuario: DbUsuario;
  meta: UserMeta;
  taller: DbTaller;
  proveedor: DbProveedor;
  especialidades: DbEspecialidad[];
  servicios: DbServicio[];
  rating: number;
  ratingCount: number;
  role: 'hibrido';
}

export type AnyProfile = ConductorProfile | TallerProfile | ProveedorProfile | HibridoProfile;

// ─── Tipos legacy para compatibilidad con MapModule ─────────────────────────
export interface AuthUser extends DbUsuario {
  taller: DbTaller | null;
  proveedor: DbProveedor | null;
}

export function resolveUiRole(user: AuthUser): UiRole {
  const hasTaller = user.taller !== null;
  const hasProveedor = user.proveedor !== null;
  if (hasTaller && hasProveedor) return 'hibrido';
  if (hasTaller) return 'taller';
  if (hasProveedor) return 'proveedor';
  return user.type as UiRole;
}

export type InsertUsuario = Omit<DbUsuario, 'id_usuario' | 'created_at'>;
export type InsertTaller = Omit<DbTaller, 'id_taller' | 'estado'>;
export type InsertProveedor = Omit<DbProveedor, 'id_proveedor' | 'estado'>;
