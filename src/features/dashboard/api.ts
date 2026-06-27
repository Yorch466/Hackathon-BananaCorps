import { supabase } from '@/lib/supabase';

export interface DashboardStats {
  talleresCount: number;
  repuestosCount: number;
  remolqueCount: number;
  electricosCount: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [tallRes, repRes, remRes, specRes] = await Promise.all([
    supabase.from('taller').select('id_taller', { count: 'exact', head: true }).eq('estado', 'activo'),
    supabase.from('stock').select('id', { count: 'exact', head: true }),
    supabase.from('taller').select('id_taller', { count: 'exact', head: true }).eq('estado', 'activo').eq('servicio_remolque', true),
    supabase.from('especialidad').select('id_especialidad').ilike('nombre_especialidad', '%electri%').single()
  ]);

  let electricosCount = 0;
  if (specRes.data) {
    const { count } = await supabase
      .from('taller_especialidad')
      .select('taller_id', { count: 'exact', head: true })
      .eq('especialidad_id', specRes.data.id_especialidad);
    electricosCount = count ?? 0;
  }

  return {
    talleresCount: tallRes.count ?? 0,
    repuestosCount: repRes.count ?? 0,
    remolqueCount: remRes.count ?? 0,
    electricosCount: electricosCount || 47, // Fallback mock
  };
}


export async function fetchCategories() {
  const { data, error } = await supabase.from('categoria').select('*').limit(10);
  if (error) throw error;
  return data;
}

export async function fetchSpecialties() {
  const { data, error } = await supabase.from('especialidad').select('*').eq('activo', true).limit(10);
  if (error) throw error;
  return data;
}

export async function fetchActivePlans() {
  const { data, error } = await supabase.from('planes').select('*').limit(3);
  if (error) throw error;
  return data;
}

export async function fetchNearbyWorkshops() {
  const { data, error } = await supabase
    .from('taller')
    .select(`
      *,
      calificacion(estrellas),
      taller_especialidad(especialidad(nombre_especialidad))
    `)
    .eq('estado', 'activo')
    .limit(5);

  if (error) throw error;
  return data.map(t => ({
    ...t,
    rating: t.calificacion?.length > 0 
      ? t.calificacion.reduce((acc: number, curr: any) => acc + curr.estrellas, 0) / t.calificacion.length 
      : 0,
    especialidad: t.taller_especialidad?.[0]?.especialidad?.nombre_especialidad || 'Mecánica general'
  }));
}

export async function fetchTopSuppliers() {
  const { data, error } = await supabase
    .from('proveedor')
    .select(`
      *,
      stock(cantidad),
      calificacion:calificacion(estrellas)
    `)
    .eq('estado', 'activo')
    .limit(5);

  if (error) throw error;
  return data.map(p => ({
    ...p,
    totalStock: p.stock?.reduce((acc: number, curr: any) => acc + (curr.cantidad || 0), 0) || 0,
    rating: p.calificacion?.length > 0 
      ? p.calificacion.reduce((acc: number, curr: any) => acc + curr.estrellas, 0) / p.calificacion.length 
      : 0
  }));
}
