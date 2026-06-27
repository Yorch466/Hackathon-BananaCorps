import type { Calificacion, Favorito } from './database';

export type { Calificacion, Favorito };

export type InsertCalificacion = Omit<Calificacion, 'id_calificacion' | 'estado'>;
export type InsertFavorito = Omit<Favorito, 'id_favoritos' | 'estado'>;
