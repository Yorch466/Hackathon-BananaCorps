import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  TextInput,
  FlatList,
  Alert,
  Linking,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import Svg, { Path } from 'react-native-svg';
import { Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Icon } from '@/components/ui/Icon';
import { MapLegend } from '@/components/map/MapLegend';
import { MapShopBottomSheet } from '@/components/map/MapShopBottomSheet';
import { useLocation } from '@/hooks/useLocation';
import {
  fetchEstablecimientos,
  searchEstablecimientos,
  MOCK_ESTABLECIMIENTOS,
  isHibrido,
  getNombre,
  getId,
  type Establecimiento,
} from '@/features/shops/api';
import {
  MAP_DEFAULT,
  MARKER_COLORS,
  ZOOM_DELTA,
  COMPACT_DELTA_THRESHOLD,
  GOOGLE_DARK_STYLE,
} from '@/config/map';
import { tokens } from '@/theme/tokens';

// ─── Marker compatible con PROVIDER_GOOGLE en Android ────────────────────────
// Sin elevation/shadow para evitar clipping en el bitmap de react-native-maps

const PIN = 36;
const TAIL = 10;

function GoogleMapPin({
  tipo,
  imagenUrl,
  compact,
}: {
  tipo: 'taller' | 'proveedor' | 'hibrido';
  imagenUrl: string | null;
  compact?: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const color =
    tipo === 'taller'    ? MARKER_COLORS.taller    :
    tipo === 'proveedor' ? MARKER_COLORS.proveedor :
                           MARKER_COLORS.hibrido;

  if (compact) {
    return (
      <View collapsable={false} style={pinStyles.dotWrap}>
        <View style={[pinStyles.dot, { backgroundColor: color }]} />
      </View>
    );
  }

  const fallbackIcon =
    tipo === 'proveedor' ? (
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
        <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      </Svg>
    ) : (
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77Z" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );

  const inner = imagenUrl && !imgFailed ? (
    <Image
      source={{ uri: imagenUrl }}
      style={pinStyles.photo}
      onError={() => setImgFailed(true)}
    />
  ) : fallbackIcon;

  return (
    <View collapsable={false} style={pinStyles.pin}>
      <View style={[pinStyles.circle, { borderColor: color }]}>
        {inner}
      </View>
      <View style={[pinStyles.tail, { borderTopColor: color }]} />
    </View>
  );
}

const pinStyles = StyleSheet.create({
  pin: {
    width:  PIN,
    height: PIN + TAIL,
    alignItems: 'center',
  },
  circle: {
    width:           PIN,
    height:          PIN,
    borderRadius:    PIN / 2,
    backgroundColor: MARKER_COLORS.markerBg,
    borderWidth:     3,
    alignItems:      'center',
    justifyContent:  'center',
  },
  tail: {
    width: 0, height: 0,
    borderLeftWidth:  5,
    borderRightWidth: 5,
    borderTopWidth:   TAIL,
    borderLeftColor:  'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  dotWrap: { width: 14, height: 14 },
  dot: {
    width:        14,
    height:       14,
    borderRadius: 7,
    borderWidth:  2,
    borderColor:  '#fff',
  },
  photo: {
    width:        PIN - 8,
    height:       PIN - 8,
    borderRadius: (PIN - 8) / 2,
  },
});

// ─── Tipos ────────────────────────────────────────────────────────────────────

type MapFilter = 'all' | 'taller' | 'proveedor';

const FILTER_OPTIONS: { key: MapFilter; label: string; color: string }[] = [
  { key: 'all',       label: 'Todos',      color: tokens.colors.accent },
  { key: 'taller',    label: 'Talleres',   color: MARKER_COLORS.taller },
  { key: 'proveedor', label: 'Autopartes', color: MARKER_COLORS.proveedor },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function hasValidCoords(e: Establecimiento): boolean {
  return (
    isFinite(e.lat) && isFinite(e.lng) &&
    e.lat !== 0 && e.lng !== 0 &&
    Math.abs(e.lat) <= 90 && Math.abs(e.lng) <= 180
  );
}

function matchesFilter(e: Establecimiento, filter: MapFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'taller')    return e._kind === 'taller'    || e._kind === 'hibrido';
  if (filter === 'proveedor') return e._kind === 'proveedor' || e._kind === 'hibrido';
  return true;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function SharedMapScreen() {
  const mapRef = useRef<MapView>(null);
  const { location, errorMsg, loading: locationLoading } = useLocation();

  const [selectedItem, setSelectedItem] = useState<Establecimiento | null>(null);
  const [filter, setFilter]             = useState<MapFilter>('all');
  const [latDelta, setLatDelta]         = useState(ZOOM_DELTA.z13);

  // ── React Query ─────────────────────────────────────────────────────────────
  const { data: rawData = [], isLoading: fetchLoading } = useQuery({
    queryKey: ['establecimientos'],
    queryFn:  fetchEstablecimientos,
  });
  const establecimientos = rawData.length > 0 ? rawData : MOCK_ESTABLECIMIENTOS;

  // ── Búsqueda ────────────────────────────────────────────────────────────────
  const [query,     setQuery]     = useState('');
  const [results,   setResults]   = useState<Establecimiento[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (query.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const data = await searchEstablecimientos(query.trim());
        setResults(data.filter(hasValidCoords));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [query]);

  const handleSelectResult = useCallback((item: Establecimiento) => {
    setQuery(getNombre(item));
    setResults([]);
    mapRef.current?.animateToRegion(
      { latitude: item.lat, longitude: item.lng, latitudeDelta: ZOOM_DELTA.z16, longitudeDelta: ZOOM_DELTA.z16 },
      700,
    );
  }, []);

  // ── Marcadores filtrados + distancia ─────────────────────────────────────────
  const markers = useMemo(() =>
    establecimientos
      .filter(hasValidCoords)
      .filter((e) => matchesFilter(e, filter))
      .map((e) => ({
        item:        e,
        id:          getId(e),
        distanciaKm: location
          ? haversineKm(location.latitude, location.longitude, e.lat, e.lng)
          : null,
      })),
  [establecimientos, location, filter]);

  // ── Centrar en usuario ───────────────────────────────────────────────────────
  const centerOnUser = useCallback(() => {
    if (!location) {
      Alert.alert('Ubicación no disponible', errorMsg ?? 'Activa el GPS e intenta de nuevo.');
      return;
    }
    mapRef.current?.animateToRegion(
      { latitude: location.latitude, longitude: location.longitude, latitudeDelta: ZOOM_DELTA.z15, longitudeDelta: ZOOM_DELTA.z15 },
      MAP_DEFAULT.animMs.button,
    );
  }, [location, errorMsg]);

  const firstCenterDone = useRef(false);
  useEffect(() => {
    if (!location || firstCenterDone.current) return;
    firstCenterDone.current = true;
    mapRef.current?.animateToRegion(
      { latitude: location.latitude, longitude: location.longitude, latitudeDelta: ZOOM_DELTA.z14, longitudeDelta: ZOOM_DELTA.z14 },
      MAP_DEFAULT.animMs.first,
    );
  }, [location]);

  // Centrar en coordenadas recibidas por params (desde botón "Ruta" en perfiles)
  const { focusLat, focusLng } = useLocalSearchParams<{ focusLat?: string; focusLng?: string }>();
  const focusDone = useRef(false);
  useEffect(() => {
    if (!focusLat || !focusLng || focusDone.current) return;
    const lat = parseFloat(focusLat);
    const lng = parseFloat(focusLng);
    if (!isFinite(lat) || !isFinite(lng)) return;
    focusDone.current = true;
    mapRef.current?.animateToRegion(
      { latitude: lat, longitude: lng, latitudeDelta: ZOOM_DELTA.z15, longitudeDelta: ZOOM_DELTA.z15 },
      MAP_DEFAULT.animMs.button,
    );
  }, [focusLat, focusLng]);

  // ── Modo compacto según zoom ─────────────────────────────────────────────────
  const compact = latDelta > COMPACT_DELTA_THRESHOLD;

  const openInMaps = useCallback((lat: number, lng: number) => {
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
  }, []);

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Mapa"
        rightAction={
          selectedItem ? (
            <TouchableOpacity
              onPress={() => openInMaps(selectedItem.lat, selectedItem.lng)}
              style={styles.navHeaderBtn}
              activeOpacity={0.75}
            >
              <Icon name="navigate" size={20} color={tokens.colors.accent} />
              <Text style={styles.navHeaderText}>Cómo llegar</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          customMapStyle={GOOGLE_DARK_STYLE}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          showsScale={false}
          initialRegion={{
            latitude:      MAP_DEFAULT.lat,
            longitude:     MAP_DEFAULT.lng,
            latitudeDelta: ZOOM_DELTA.z13,
            longitudeDelta: ZOOM_DELTA.z13,
          }}
          onRegionChange={(region: Region) => setLatDelta(region.latitudeDelta)}
        >
          {markers.map(({ item, id }) => {
            const tipo = isHibrido(item) ? 'hibrido' : item._kind as 'taller' | 'proveedor';
            return (
              <Marker
                key={id}
                coordinate={{ latitude: item.lat, longitude: item.lng }}
                onPress={() => setSelectedItem(item)}
                anchor={{ x: 0.5, y: 1 }}
              >
                <GoogleMapPin tipo={tipo} imagenUrl={item.imagenUrl} compact={compact} />
              </Marker>
            );
          })}
        </MapView>

        {/* ── Buscador + filtros ──────────────────────────────────────────── */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchBar}>
            <Icon name="search" size={18} color={tokens.colors.ink[2]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar taller o proveedor…"
              placeholderTextColor={tokens.colors.ink[2]}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => { setQuery(''); setResults([]); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.clearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.filterRow}>
            {FILTER_OPTIONS.map(({ key, label, color }) => {
              const active = filter === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setFilter(key)}
                  style={[
                    styles.filterChip,
                    active
                      ? { backgroundColor: color, borderColor: color }
                      : { backgroundColor: 'rgba(8,13,28,0.85)', borderColor: tokens.colors.line },
                  ]}
                  activeOpacity={0.75}
                >
                  <Text style={[
                    styles.filterChipText,
                    { color: active ? tokens.colors.bg[1] : tokens.colors.ink[2] },
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {(results.length > 0 || searching) && (
            <View style={styles.resultsList}>
              {searching ? (
                <ActivityIndicator color={MARKER_COLORS.taller} style={{ paddingVertical: 14 }} />
              ) : (
                <FlatList
                  data={results}
                  keyExtractor={getId}
                  keyboardShouldPersistTaps="handled"
                  scrollEnabled={results.length > 5}
                  renderItem={({ item }) => {
                    const tipo = isHibrido(item) ? 'hibrido' : item._kind as 'taller' | 'proveedor';
                    const dot  =
                      tipo === 'taller'    ? MARKER_COLORS.taller    :
                      tipo === 'proveedor' ? MARKER_COLORS.proveedor :
                                             MARKER_COLORS.hibrido;
                    return (
                      <TouchableOpacity
                        style={styles.resultItem}
                        onPress={() => handleSelectResult(item)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.resultDot, { backgroundColor: dot }]} />
                        <Text style={styles.resultText} numberOfLines={1}>{getNombre(item)}</Text>
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={<Text style={styles.noResults}>Sin resultados</Text>}
                />
              )}
            </View>
          )}
        </View>

        {/* ── Leyenda ─────────────────────────────────────────────────────── */}
        <MapLegend style={styles.legend} />

        {/* ── Error GPS ────────────────────────────────────────────────────── */}
        {errorMsg && !locationLoading && !location && (
          <View style={styles.errorBanner} pointerEvents="none">
            <Icon name="pin" size={14} color={tokens.colors.danger} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* ── Botón centrar ─────────────────────────────────────────────────── */}
        <TouchableOpacity style={styles.centerBtn} onPress={centerOnUser} activeOpacity={0.8}>
          <Icon name="navigate" size={22} color={MARKER_COLORS.taller} />
        </TouchableOpacity>

        {(locationLoading || fetchLoading) && (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator color={tokens.colors.accent} size="large" />
          </View>
        )}
      </View>

      <MapShopBottomSheet
        item={selectedItem}
        userLocation={location}
        onClose={() => setSelectedItem(null)}
      />
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: tokens.colors.bg[1] },
  mapContainer: { flex: 1 },

  searchWrapper: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    zIndex: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8,13,28,0.92)',
    borderRadius: tokens.radii.md,
    borderWidth: 1.5,
    borderColor: tokens.colors.line,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput:  { flex: 1, color: tokens.colors.ink[0], fontSize: 14, padding: 0 },
  clearBtn:     { color: tokens.colors.ink[2], fontSize: 14, paddingLeft: 4 },

  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: tokens.radii.full,
    borderWidth: 1.5,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  resultsList: {
    backgroundColor: 'rgba(8,13,28,0.97)',
    borderRadius: tokens.radii.sm,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: tokens.colors.line,
    maxHeight: 220,
    overflow: 'hidden',
    marginTop: 2,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.line,
  },
  resultDot:  { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  resultText: { color: tokens.colors.ink[0], fontSize: 14 },
  noResults:  { color: tokens.colors.ink[2], fontSize: 13, textAlign: 'center', paddingVertical: 14 },

  legend: { position: 'absolute', bottom: 56, left: 12 },

  errorBanner: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(8,13,28,0.88)',
    borderRadius: tokens.radii.sm,
    borderWidth: 1,
    borderColor: tokens.colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '85%',
  },
  errorText: { color: tokens.colors.ink[1], fontSize: 12, flexShrink: 1 },

  centerBtn: {
    position: 'absolute',
    bottom: 28,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: MARKER_COLORS.markerBg,
    borderWidth: 2.5,
    borderColor: MARKER_COLORS.taller,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: MARKER_COLORS.taller,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 10,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(13,27,62,0.6)',
  },

  markerWrapper: {
    padding: 8,
  },

  navHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,204,0,0.12)',
  },
  navHeaderText: {
    color: tokens.colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
});
