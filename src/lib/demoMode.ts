import type { UiRole } from '@/types/user';

// Módulo-level singleton: persiste mientras la app está en memoria.
// El index.tsx lo setea antes de navegar a las pantallas de perfil.
let _demoRole: UiRole | null = null;

export function setDemoRole(role: UiRole | null) {
  _demoRole = role;
}

export function getDemoRole(): UiRole | null {
  return _demoRole;
}
