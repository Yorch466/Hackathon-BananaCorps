/**
 * Configuración central del módulo de mapa.
 *
 * PARA CAMBIAR DE PROVIDER — editar solo este archivo + map.tsx:
 *
 * ─── Mapbox (actual) ──────────────────────────────────────────────────────────
 *   Paquete : @rnmapbox/maps
 *   Token   : EXPO_PUBLIC_MAPBOX_TOKEN (runtime) + RNMAPBOX_MAPS_DOWNLOAD_TOKEN (build)
 *   Formato coord: [longitude, latitude]  ← GeoJSON
 *   Requiere dev build: SÍ
 *
 * ─── Google Maps ─────────────────────────────────────────────────────────────
 *   Paquete : react-native-maps  (ya instalado como dep de expo)
 *   Token   : EXPO_PUBLIC_GOOGLE_MAPS_KEY
 *   app.json: android.config.googleMaps.apiKey
 *   Formato coord: { latitude, longitude }
 *   Requiere dev build: SÍ (PROVIDER_GOOGLE necesita key en AndroidManifest)
 *   map.tsx: import { PROVIDER_GOOGLE } from 'react-native-maps'
 *            <MapView provider={PROVIDER_GOOGLE} ...>
 *            animateToRegion() en lugar de setCamera()
 *
 * ─── OpenStreetMap / CARTO (sin API key) ─────────────────────────────────────
 *   Paquete : react-native-maps  (ya instalado)
 *   Token   : ninguno
 *   Formato coord: { latitude, longitude }
 *   Requiere dev build: NO (funciona en Expo Go)
 *   map.tsx: mapType="none" + <UrlTile urlTemplate="https://basemaps.cartocdn.com/dark_matter/{z}/{x}/{y}.png" />
 *            animateToRegion() en lugar de setCamera()
 */

// ─── Provider activo ──────────────────────────────────────────────────────────

export const MAP_PROVIDER = 'google' as const;
export type MapProvider = typeof MAP_PROVIDER;

// ─── Coordenadas por defecto (formato neutro lat/lng) ─────────────────────────
// map.tsx convierte al formato que necesite el provider activo.

export const MAP_DEFAULT = {
  lat:       -17.3895,
  lng:       -66.1568,
  zoom:      13,
  zoomUser:  14,   // al obtener la primera posición GPS
  zoomClose: 15,   // al pulsar el botón "centrar"
  animMs:    { first: 800, button: 600 },
} as const;

// ─── Colores de marcadores (independientes del provider) ──────────────────────
// Cambiar aquí actualiza MarkerTaller, MarkerProveedor y MapCallout a la vez.
//
// ESTILO DEL MAPA:
//   Neon dark (actual): styleURL={MapboxGL.StyleURL.Dark}  ← máximo contraste neon
//   Blanco/claro      : styleURL={MapboxGL.StyleURL.Light} ← cambiar en map.tsx línea ~121

// ─── Equivalencias zoom Mapbox → latitudeDelta Google Maps ───────────────────

export const ZOOM_DELTA = {
  z13: 0.044,
  z14: 0.022,
  z15: 0.011,
  z16: 0.005,
} as const;

export const COMPACT_DELTA_THRESHOLD = 0.044;

// ─── Estilo oscuro para Google Maps ──────────────────────────────────────────

export const GOOGLE_DARK_STYLE = [
  { elementType: 'geometry',           stylers: [{ color: '#0d1b2a' }] },
  { elementType: 'labels.text.fill',   stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d1b2a' }] },
  { featureType: 'road',             elementType: 'geometry',        stylers: [{ color: '#1a2a3a' }] },
  { featureType: 'road',             elementType: 'geometry.stroke', stylers: [{ color: '#0d1b2a' }] },
  { featureType: 'road.highway',     elementType: 'geometry',        stylers: [{ color: '#2a3a4a' }] },
  { featureType: 'water',            elementType: 'geometry',        stylers: [{ color: '#080d1c' }] },
  { featureType: 'poi',              elementType: 'geometry',        stylers: [{ color: '#0d1b2a' }] },
  { featureType: 'transit',          elementType: 'geometry',        stylers: [{ color: '#0d1b2a' }] },
  { featureType: 'administrative',   elementType: 'geometry.stroke', stylers: [{ color: '#1a2a3a' }] },
];

// ─── Colores de marcadores (independientes del provider) ──────────────────────

export const MARKER_COLORS = {
  taller:        '#FF6B35',              // naranja neon — talleres mecánicos
  tallerGlow:    'rgba(255,107,53,0.22)',
  proveedor:     '#00B4FF',              // azul neon — autopartes / proveedores
  proveedorGlow: 'rgba(0,180,255,0.22)',
  hibrido:       '#C47FFF',              // violeta neon — taller + proveedor
  hibridoGlow:   'rgba(196,127,255,0.22)',
  markerBg:      '#080D1C',              // casi negro — máximo contraste neon
} as const;
