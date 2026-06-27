import type { Repuesto, Stock, Categoria, ImagenRepuesto, Proveedor } from './database';

export type { Repuesto, Stock, Categoria, ImagenRepuesto };

// Vista enriquecida que combina repuesto + stock + imágenes + proveedor
export interface RepuestoConStock extends Repuesto {
  stock: Stock[];
  imagenes: ImagenRepuesto[];
  categorias: Categoria[];
  proveedor: Pick<Proveedor, 'id_proveedor' | 'nombre_proveedor' | 'telefono'> | null;
}

export type InsertRepuesto = Omit<Repuesto, 'id_repuesto'>;
export type InsertStock = Omit<Stock, 'id'>;
