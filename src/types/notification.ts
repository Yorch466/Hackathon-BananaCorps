import type { SolicitudSos, Taller } from './database';

export type { SolicitudSos };

// Vista enriquecida de una solicitud SOS con datos del taller asignado
export interface SolicitudSosConTaller extends SolicitudSos {
  taller: Pick<Taller, 'id_taller' | 'nombre_taller' | 'telefono' | 'lat' | 'lng'> | null;
}

export type InsertSolicitudSos = Pick<
  SolicitudSos,
  'conductor_id' | 'lat_emergencia' | 'lng_emergencia'
>;
