import type {
  ConductorProfile,
  TallerProfile,
  ProveedorProfile,
  HibridoProfile,
} from '@/types/user';

const MOCK_USUARIO = {
  id_usuario: 'mock-user-1',
  email: 'juan.morales@correo.com',
  ci: '1234567',
  phone: '+591 70000000',
  type: 'conductor' as const,
  avatar_url: null,
  created_at: new Date().toISOString(),
};

export const mockConductor: ConductorProfile = {
  role: 'conductor',
  usuario: MOCK_USUARIO,
  meta: {
    full_name: 'Juan Morales',
    direccion: 'Av. Cristo Redentor #456',
    bio: 'Conductor con 8 años de experiencia.',
  },
};

const MOCK_TALLER = {
  id_taller: 'mock-taller-1',
  usuario_id: 'mock-user-2',
  nombre_taller: 'Taller 1',
  descripcion: 'Especialistas en mecánica general y diagnóstico computarizado. Más de 15 años de experiencia.',
  horario_apertura: '08:00',
  horario_cierre: '18:00',
  direccion: 'Av. Cristo Redentor #456',
  telefono: '+591 70000000',
  correo: 'contacto@taller1.com',
  servicio_remolque: true,
  lat: -17.39,
  lng: -66.16,
  perfil_taller_url: null,
  banner_taller_url: null,
  estado: 'activo' as const,
};

const MOCK_ESPECIALIDADES = [
  { id_especialidad: 'esp-1', nombre_especialidad: 'Mecánica general', descripcion: null, activo: true },
  { id_especialidad: 'esp-2', nombre_especialidad: 'Frenos', descripcion: null, activo: true },
  { id_especialidad: 'esp-3', nombre_especialidad: 'Suspensión', descripcion: null, activo: true },
];

const MOCK_SERVICIOS = [
  { id_servicio: 'svc-1', taller_id: 'mock-taller-1', nombre_servicio: 'Cambio de aceite y filtro', descripcion: 'Incluye revisión general', imagen_servicio_url: null },
  { id_servicio: 'svc-2', taller_id: 'mock-taller-1', nombre_servicio: 'Diagnóstico computarizado', descripcion: null, imagen_servicio_url: null },
  { id_servicio: 'svc-3', taller_id: 'mock-taller-1', nombre_servicio: 'Servicio de remolque', descripcion: null, imagen_servicio_url: null },
];

export const mockTaller: TallerProfile = {
  role: 'taller',
  usuario: { ...MOCK_USUARIO, type: 'taller' },
  meta: {
    full_name: 'Taller 1',
  },
  taller: MOCK_TALLER,
  especialidades: MOCK_ESPECIALIDADES,
  servicios: MOCK_SERVICIOS,
  rating: 4.6,
  ratingCount: 226,
};

const MOCK_PROVEEDOR = {
  id_proveedor: 'mock-proveedor-1',
  usuario_id: 'mock-user-3',
  nombre_proveedor: 'Proveedor 1',
  descripcion: 'Especialistas en repuestos originales y alternativos. Más de 16 años de experiencia.',
  horario_apertura: '08:00',
  horario_cierre: '18:00',
  direccion: 'Av. Cristo Redentor #456',
  telefono: '+591 70000000',
  correo: 'contacto@proveedor1.com',
  lat: -17.39,
  lng: -66.16,
  perfil_proveedor_url: null,
  banner_proveedor_url: null,
  estado: 'activo' as const,
};

export const mockProveedor: ProveedorProfile = {
  role: 'proveedor',
  usuario: { ...MOCK_USUARIO, type: 'proveedor' },
  meta: {
    full_name: 'Proveedor 1',
  },
  proveedor: MOCK_PROVEEDOR,
  rating: 4.6,
  ratingCount: 286,
};

export const mockHibrido: HibridoProfile = {
  role: 'hibrido',
  usuario: { ...MOCK_USUARIO, type: 'taller' },
  meta: {
    full_name: 'Taller / Proveedor 1',
  },
  taller: MOCK_TALLER,
  proveedor: MOCK_PROVEEDOR,
  especialidades: MOCK_ESPECIALIDADES,
  servicios: MOCK_SERVICIOS,
  rating: 4.4,
  ratingCount: 182,
};
