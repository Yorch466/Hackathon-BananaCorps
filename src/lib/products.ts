import { supabase } from './supabase';

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  supplier?: {
    id: string;
    name: string;
    zone: string;
    distance: string;
    initials: string;
    phone: string;
  };
};

export const productsApi = {
  /**
   * Fetch all categories
   */
  async getCategories() {
    const { data, error } = await supabase
      .from('categoria')
      .select('*')
      .order('nombre');
    
    console.log("Supabase (getCategories):");
    console.log(data);
    if (error) {
        console.error("❌ Error en Supabase (getCategories):", error.message, error.details, error.hint);
        throw error;
    }
    return data;
  },

  /**
   * Fetch products with stock and images
   * Note: This performs multiple joins based on the provided schema.
   */
  async getProducts(categoryId?: string) {
    let query = supabase
      .from('repuesto')
      .select(`
        id_repuesto,
        producto,
        descripcion,
        stock (
          precio,
          cantidad,
          vendedor_id
        ),
        imagenes (
          imagen_url
        ),
        repuesto_categoria!inner (
          categoria_id,
          categoria (
            nombre
          )
        )
      `);

    if (categoryId) {
      query = query.eq('repuesto_categoria.categoria_id', categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Transform database structure to UI-friendly object
    return data.map((item: any) => ({
      id: item.id_repuesto,
      name: item.producto,
      description: item.descripcion,
      price: item.stock?.[0]?.precio || 0,
      stock: item.stock?.[0]?.cantidad || 0,
      category: item.repuesto_categoria?.[0]?.categoria?.nombre || 'General',
      images: item.imagenes?.map((img: any) => img.imagen_url) || [],
    })) as Product[];
  },

  /**
   * Fetch detailed product info by ID, including supplier data
   */
  async getProductById(id: string) {
    const { data, error } = await supabase
      .from('repuesto')
      .select(`
        id_repuesto,
        producto,
        descripcion,
        stock (
          precio,
          cantidad,
          vendedor_id,
          proveedor (
            id_proveedor,
            nombre_proveedor,
            direccion,
            telefono
          )
        ),
        imagenes (
          imagen_url
        ),
        repuesto_categoria (
          categoria (
            nombre
          )
        )
      `)
      .eq('id_repuesto', id)
      .single();

    if (error) throw error;

    const supplier = data.stock?.[0]?.proveedor;

    return {
      id: data.id_repuesto,
      name: data.producto,
      description: data.descripcion,
      price: data.stock?.[0]?.precio || 0,
      stock: data.stock?.[0]?.cantidad || 0,
      category: data.repuesto_categoria?.[0]?.categoria?.nombre || 'General',
      images: data.imagenes?.map((img: any) => img.imagen_url) || [],
      supplier: supplier ? {
        id: supplier.id_proveedor,
        name: supplier.nombre_proveedor,
        zone: supplier.direccion || 'No especificada',
        distance: '--- km', // Logic for distance would go here
        initials: supplier.nombre_proveedor.substring(0, 2).toUpperCase(),
        phone: supplier.telefono
      } : undefined
    } as Product;
  }
};
