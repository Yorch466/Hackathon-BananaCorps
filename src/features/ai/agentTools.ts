import { supabase } from '@/lib/supabase';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function buscarRepuesto(
  nombreProducto: string,
  latUsuario: number,
  lngUsuario: number,
) {
  // Primero buscar IDs de repuestos que coincidan
  const { data: repuestos, error: repErr } = await supabase
    .from('repuesto')
    .select('id_repuesto, producto')
    .ilike('producto', `%${nombreProducto}%`);

  if (repErr) throw repErr;
  if (!repuestos?.length) return [];

  const ids = repuestos.map((r) => r.id_repuesto);

  // Luego buscar stock de esos repuestos con info del proveedor
  const { data: stocks, error: stErr } = await supabase
    .from('stock')
    .select(`
      cantidad, precio, vendedor_id,
      repuesto:repuesto_id ( producto ),
      proveedor:vendedor_id ( id_proveedor, nombre_proveedor, direccion, telefono, lat, lng )
    `)
    .in('repuesto_id', ids)
    .gt('cantidad', 0);

  if (stErr) throw stErr;
  if (!stocks?.length) return [];

  return stocks
    .filter((r: any) => r.repuesto && r.proveedor)
    .map((r: any) => ({
      idProveedor:     r.proveedor.id_proveedor,
      nombreProveedor: r.proveedor.nombre_proveedor,
      direccion:       r.proveedor.direccion ?? 'Sin dirección',
      telefono:        r.proveedor.telefono  ?? null,
      producto:        r.repuesto.producto,
      cantidad:        r.cantidad,
      precio:          r.precio != null ? `Bs ${r.precio}` : 'Precio no disponible',
      distanciaKm:     parseFloat(haversineKm(latUsuario, lngUsuario, r.proveedor.lat, r.proveedor.lng).toFixed(1)),
    }))
    .sort((a: any, b: any) => a.distanciaKm - b.distanciaKm)
    .slice(0, 5);
}

export async function buscarTallerPorEspecialidad(
  especialidad: string,
  latUsuario: number,
  lngUsuario: number,
) {
  // Primero buscar IDs de especialidades que coincidan
  const { data: especs, error: espErr } = await supabase
    .from('especialidad')
    .select('id_especialidad')
    .ilike('nombre_especialidad', `%${especialidad}%`);

  if (espErr) throw espErr;
  if (!especs?.length) return [];

  const ids = especs.map((e) => e.id_especialidad);

  const { data: relaciones, error: relErr } = await supabase
    .from('taller_especialidad')
    .select('taller:taller_id ( id_taller, nombre_taller, direccion, telefono, lat, lng, estado )')
    .in('especialidad_id', ids);

  if (relErr) throw relErr;
  if (!relaciones?.length) return [];

  return relaciones
    .filter((r: any) => r.taller && r.taller.estado === 'activo')
    .map((r: any) => ({
      idTaller:     r.taller.id_taller,
      nombreTaller: r.taller.nombre_taller,
      direccion:    r.taller.direccion ?? 'Sin dirección',
      telefono:     r.taller.telefono  ?? 'Sin teléfono',
      distanciaKm:  parseFloat(haversineKm(latUsuario, lngUsuario, r.taller.lat, r.taller.lng).toFixed(1)),
    }))
    .sort((a: any, b: any) => a.distanciaKm - b.distanciaKm)
    .slice(0, 5);
}

export async function consultarStockProveedor(nombreProveedor: string) {
  // Primero buscar el proveedor
  const { data: proveedores, error: provErr } = await supabase
    .from('proveedor')
    .select('id_proveedor, nombre_proveedor')
    .ilike('nombre_proveedor', `%${nombreProveedor}%`);

  if (provErr) throw provErr;
  if (!proveedores?.length) return [];

  const ids = proveedores.map((p) => p.id_proveedor);

  const { data: stocks, error: stErr } = await supabase
    .from('stock')
    .select(`
      cantidad, precio,
      repuesto:repuesto_id ( producto )
    `)
    .in('vendedor_id', ids)
    .gt('cantidad', 0);

  if (stErr) throw stErr;
  if (!stocks?.length) return [];

  return stocks
    .filter((r: any) => r.repuesto)
    .map((r: any) => ({
      producto:  r.repuesto.producto,
      cantidad:  r.cantidad,
      precio:    r.precio != null ? `Bs ${r.precio}` : 'Precio no disponible',
    }));
}
