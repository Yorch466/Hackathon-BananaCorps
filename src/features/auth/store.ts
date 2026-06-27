import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { AuthUser, UiRole } from '@/types/user';
import { resolveUiRole } from '@/types/user';

interface AuthState {
  // ─── Estado ──────────────────────────────────────────────────────────────
  session: Session | null;
  user: AuthUser | null;
  role: UiRole | null;      // rol derivado (incluye 'hibrido')
  isLoading: boolean;

  // ─── Acciones ────────────────────────────────────────────────────────────
  setSession: (session: Session | null) => void;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;        // limpia todo al cerrar sesión
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  role: null,
  isLoading: true,          // true al inicio: cargando sesión persistida

  setSession: (session) => set({ session }),

  setUser: (user) =>
    set({
      user,
      role: user ? resolveUiRole(user) : null,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  clear: () =>
    set({
      session: null,
      user: null,
      role: null,
      isLoading: false,
    }),
}));
