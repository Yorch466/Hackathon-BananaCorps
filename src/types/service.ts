import type { Servicio, Especialidad, Taller } from './database';

export type { Servicio, Especialidad };

// Vista enriquecida de un taller con sus servicios y especialidades
export interface TallerConDetalle extends Taller {
  especialidades: Especialidad[];
  servicios: Servicio[];
  calificacion_promedio?: number;
  total_calificaciones?: number;
}

export type InsertServicio = Omit<Servicio, 'id_servicio'>;
