import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCurrentProfile,
  updateConductorProfile,
  updateTallerProfile,
  updateTallerEspecialidades,
  updateProveedorProfile,
  fetchAllEspecialidades,
  upsertServicio,
  deleteServicio,
  fetchPublicTallerProfile,
  fetchPublicProveedorProfile,
  fetchPublicConductorProfile,
  fetchRatingDistribution,
  fetchMyRating,
  submitCalificacion,
  fetchFavoritos,
  fetchIsFavorito,
  addFavorito,
  removeFavorito,
  fetchAllCategorias,
  fetchProveedorProductos,
  createProducto,
  updateProducto,
  deleteProducto,
} from './api';
import { getDemoRole } from '@/lib/demoMode';
import type { DbServicio } from '@/types/database';

const PROFILE_KEY = ['profile', 'current'];

export function useCurrentProfile() {
  // Incluir el rol demo en el key para que cada rol tenga su propia entrada de caché
  const demoRole = getDemoRole() ?? 'real';
  return useQuery({
    queryKey: [...PROFILE_KEY, demoRole],
    queryFn: fetchCurrentProfile,
    staleTime: 1000 * 60 * 2,
  });
}

export function useAllEspecialidades() {
  return useQuery({
    queryKey: ['especialidades'],
    queryFn: fetchAllEspecialidades,
    staleTime: 1000 * 60 * 10,
  });
}

export function useUpdateConductorProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateConductorProfile>[1] }) =>
      updateConductorProfile(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILE_KEY }),
  });
}

export function useUpdateTallerProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateTallerProfile>[1] }) =>
      updateTallerProfile(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILE_KEY }),
  });
}

export function useUpdateTallerEspecialidades() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tallerId, ids }: { tallerId: string; ids: string[] }) =>
      updateTallerEspecialidades(tallerId, ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILE_KEY }),
  });
}

export function useUpsertServicio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (servicio: Omit<DbServicio, 'id_servicio'> & { id_servicio?: string }) =>
      upsertServicio(servicio),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILE_KEY }),
  });
}

export function useDeleteServicio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteServicio(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILE_KEY }),
  });
}

export function useUpdateProveedorProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateProveedorProfile>[1] }) =>
      updateProveedorProfile(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILE_KEY }),
  });
}

export function usePublicTallerProfile(id: string) {
  return useQuery({
    queryKey: ['profile', 'public', 'taller', id],
    queryFn: () => fetchPublicTallerProfile(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePublicProveedorProfile(id: string) {
  return useQuery({
    queryKey: ['profile', 'public', 'proveedor', id],
    queryFn: () => fetchPublicProveedorProfile(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePublicConductorProfile(id: string) {
  return useQuery({
    queryKey: ['profile', 'public', 'conductor', id],
    queryFn: () => fetchPublicConductorProfile(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useRatingDistribution(entidadId: string) {
  return useQuery({
    queryKey: ['rating-distribution', entidadId],
    queryFn: () => fetchRatingDistribution(entidadId),
    enabled: !!entidadId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useMyRating(conductorId: string, entidadId: string) {
  return useQuery({
    queryKey: ['my-rating', conductorId, entidadId],
    queryFn: () => fetchMyRating(conductorId, entidadId),
    enabled: !!conductorId && !!entidadId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useSubmitCalificacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      conductorId,
      entidadId,
      estrellas,
      tags,
    }: {
      conductorId: string;
      entidadId: string;
      estrellas: number;
      tags: string[];
    }) => submitCalificacion(conductorId, entidadId, estrellas, tags),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['my-rating', v.conductorId, v.entidadId] });
      qc.invalidateQueries({ queryKey: ['rating-distribution', v.entidadId] });
      qc.invalidateQueries({ queryKey: ['profile', 'public'] });
      qc.invalidateQueries({ queryKey: PROFILE_KEY });
    },
  });
}

export function useFavoritos(conductorId: string) {
  return useQuery({
    queryKey: ['favoritos', conductorId],
    queryFn: () => fetchFavoritos(conductorId),
    enabled: !!conductorId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useIsFavorito(
  conductorId: string,
  entidadId: string,
  entidadTipo: 'taller' | 'proveedor',
) {
  return useQuery({
    queryKey: ['favorito', conductorId, entidadId, entidadTipo],
    queryFn: () => fetchIsFavorito(conductorId, entidadId, entidadTipo),
    enabled: !!conductorId && !!entidadId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useToggleFavorito() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conductorId,
      entidadId,
      entidadTipo,
      nombre,
      imagenUrl,
      isFav,
    }: {
      conductorId: string;
      entidadId: string;
      entidadTipo: 'taller' | 'proveedor';
      nombre: string;
      imagenUrl: string | null;
      isFav: boolean;
    }) => {
      if (isFav) {
        await removeFavorito(conductorId, entidadId, entidadTipo);
      } else {
        await addFavorito(conductorId, entidadId, entidadTipo, nombre, imagenUrl);
      }
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['favorito', v.conductorId, v.entidadId, v.entidadTipo] });
      qc.invalidateQueries({ queryKey: ['favoritos', v.conductorId] });
    },
  });
}

// ─── categorías ──────────────────────────────────────────────────────────────

export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: fetchAllCategorias,
    staleTime: 1000 * 60 * 10,
  });
}

// ─── productos ───────────────────────────────────────────────────────────────

const PRODUCTOS_KEY = (proveedorId: string) => ['productos', proveedorId];

export function useProveedorProductos(proveedorId: string) {
  return useQuery({
    queryKey: PRODUCTOS_KEY(proveedorId),
    queryFn: () => fetchProveedorProductos(proveedorId),
    enabled: !!proveedorId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateProducto(proveedorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createProducto>[0]) => createProducto(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTOS_KEY(proveedorId) }),
  });
}

export function useUpdateProducto(proveedorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      stockId,
      repuestoId,
      data,
    }: {
      stockId: string;
      repuestoId: string;
      data: Parameters<typeof updateProducto>[2];
    }) => updateProducto(stockId, repuestoId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTOS_KEY(proveedorId) }),
  });
}

export function useDeleteProducto(proveedorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ stockId, repuestoId }: { stockId: string; repuestoId: string }) =>
      deleteProducto(stockId, repuestoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTOS_KEY(proveedorId) }),
  });
}
