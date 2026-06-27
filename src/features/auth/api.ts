import { supabase } from '@/lib/supabase';
import type { AuthUser, InsertTaller, InsertProveedor } from '@/types/user';
import type { Usuario, Taller, Proveedor } from '@/types/database';

// ─── Helper interno ───────────────────────────────────────────────────────────

async function fetchAuthUser(id_usuario: string): Promise<AuthUser | null> {
  const { data: usuario, error } = await supabase
    .from('usuario')
    .select('*')
    .eq('id_usuario', id_usuario)
    .single();

  if (error || !usuario) return null;

  const { data: taller } = await supabase
    .from('taller')
    .select('*')
    .eq('usuario_id', id_usuario)
    .maybeSingle();

  const { data: proveedor } = await supabase
    .from('proveedor')
    .select('*')
    .eq('usuario_id', id_usuario)
    .maybeSingle();

  return {
    ...(usuario as Usuario),
    taller:    (taller    as Taller)    ?? null,
    proveedor: (proveedor as Proveedor) ?? null,
  };
}

// ─── Sign In ──────────────────────────────────────────────────────────────────

export interface SignInPayload {
  email:    string;
  password: string;
}

export async function signIn(payload: SignInPayload): Promise<{
  user:  AuthUser | null;
  error: string   | null;
}> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email:    payload.email,
    password: payload.password,
  });

  if (error || !data.user) {
    return { user: null, error: error?.message ?? 'Error al iniciar sesión' };
  }

  const authUser = await fetchAuthUser(data.user.id);
  if (!authUser) {
    return { user: null, error: 'Perfil de usuario no encontrado' };
  }

  return { user: authUser, error: null };
}

// ─── Payloads de registro ─────────────────────────────────────────────────────

export interface SignUpConductorPayload {
  name?:    string;   // requerido en el form de conductor, opcional para taller/proveedor
  email:    string;
  password: string;
  ci:       string;
  phone?:   string;
}

export interface SignUpTallerPayload extends SignUpConductorPayload {
  nombre_taller:     string;
  direccion?:        string;
  telefono?:         string;
  correo?:           string;
  servicio_remolque?: boolean;
  lat: number;
  lng: number;
}

export interface SignUpProveedorPayload extends SignUpConductorPayload {
  nombre_proveedor: string;
  direccion?:       string;
  telefono?:        string;
  correo?:          string;
  lat: number;
  lng: number;
}

// ─── Registro Conductor ───────────────────────────────────────────────────────
// La fila en `usuario` la crea el trigger handle_new_auth_user() en Supabase.
// Aquí solo llamamos auth.signUp() pasando los datos como metadata.
export async function signUpConductor(payload: SignUpConductorPayload): Promise<{
  user:  AuthUser | null;
  error: string   | null;
}> {
  const { data, error } = await supabase.auth.signUp({
    email:    payload.email,
    password: payload.password,
    options: {
      data: {
        name:  payload.name  ?? '',
        ci:    payload.ci,
        phone: payload.phone ?? '',
        type:  'conductor',
      },
    },
  });

  if (error || !data.user) {
    return { user: null, error: error?.message ?? 'Error al registrar usuario' };
  }

  const authUser = await fetchAuthUser(data.user.id);
  return { user: authUser, error: null };
}

// ─── Registro Taller ──────────────────────────────────────────────────────────
// 1. auth.signUp() + metadata → trigger crea fila en `usuario`
// 2. INSERT en `taller` (requiere sesión activa → confirmar email desactivado)
export async function signUpTaller(payload: SignUpTallerPayload): Promise<{
  user:  AuthUser | null;
  error: string   | null;
}> {
  const { data, error } = await supabase.auth.signUp({
    email:    payload.email,
    password: payload.password,
    options: {
      data: {
        ci:    payload.ci,
        phone: payload.phone ?? '',
        type:  'taller',
      },
    },
  });

  if (error || !data.user) {
    return { user: null, error: error?.message ?? 'Error al registrar taller' };
  }

  const tallerPayload: InsertTaller = {
    usuario_id:        data.user.id,
    nombre_taller:     payload.nombre_taller,
    direccion:         payload.direccion         ?? null,
    telefono:          payload.telefono          ?? null,
    correo:            payload.correo            ?? null,
    servicio_remolque: payload.servicio_remolque ?? false,
    lat:               payload.lat,
    lng:               payload.lng,
    perfil_taller_url: null,
    banner_taller_url: null,
  };

  const { error: tallerError } = await supabase
    .from('taller')
    .insert(tallerPayload);

  if (tallerError) return { user: null, error: tallerError.message };

  const authUser = await fetchAuthUser(data.user.id);
  return { user: authUser, error: null };
}

// ─── Registro Proveedor ───────────────────────────────────────────────────────
export async function signUpProveedor(payload: SignUpProveedorPayload): Promise<{
  user:  AuthUser | null;
  error: string   | null;
}> {
  const { data, error } = await supabase.auth.signUp({
    email:    payload.email,
    password: payload.password,
    options: {
      data: {
        ci:    payload.ci,
        phone: payload.phone ?? '',
        type:  'proveedor',
      },
    },
  });

  if (error || !data.user) {
    return { user: null, error: error?.message ?? 'Error al registrar proveedor' };
  }

  const proveedorPayload: InsertProveedor = {
    usuario_id:          data.user.id,
    nombre_proveedor:    payload.nombre_proveedor,
    direccion:           payload.direccion ?? null,
    telefono:            payload.telefono  ?? null,
    correo:              payload.correo    ?? null,
    lat:                 payload.lat,
    lng:                 payload.lng,
    perfil_proveedor_url: null,
    banner_proveedor_url: null,
  };

  const { error: proveedorError } = await supabase
    .from('proveedor')
    .insert(proveedorPayload);

  if (proveedorError) return { user: null, error: proveedorError.message };

  const authUser = await fetchAuthUser(data.user.id);
  return { user: authUser, error: null };
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────

export async function signOut(): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signOut();
  return { error: error?.message ?? null };
}

// ─── Restaurar sesión al abrir la app ────────────────────────────────────────

export async function restoreSession(): Promise<{
  user:  AuthUser | null;
  error: string   | null;
}> {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      // Token expirado o inválido → limpiar SecureStore (ignorar error de red)
      try { await supabase.auth.signOut(); } catch {}
      return { user: null, error: null };
    }

    if (!data.session) {
      return { user: null, error: null };
    }

    const authUser = await fetchAuthUser(data.session.user.id);
    return { user: authUser, error: null };
  } catch {
    // Sin red al arrancar → mostrar login sin crashear
    return { user: null, error: null };
  }
}
