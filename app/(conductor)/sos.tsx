import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Pressable,
  ActivityIndicator,
  Linking,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Svg, { Path } from 'react-native-svg';
import { useQuery } from '@tanstack/react-query';
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { DiagnosticoModal } from '@/components/ai/DiagnosticoModal';
import { useLocation } from '@/hooks/useLocation';
import {
  fetchEstablecimientos,
  isTaller,
  getId,
  type Establecimiento,
} from '@/features/shops/api';
import { MAP_DEFAULT, MARKER_COLORS, ZOOM_DELTA, GOOGLE_DARK_STYLE } from '@/config/map';
import { tokens } from '@/theme/tokens';

// ─── Marker sin elevation para PROVIDER_GOOGLE en Android ────────────────────

const PIN = 36;
const TAIL = 10;

function SOSMapPin() {
  return (
    <View collapsable={false} style={pinStyles.pin}>
      <View style={[pinStyles.circle, { borderColor: tokens.colors.danger }]}>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77Z" stroke={tokens.colors.danger} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
      <View style={[pinStyles.tail, { borderTopColor: tokens.colors.danger }]} />
    </View>
  );
}

const pinStyles = StyleSheet.create({
  pin: {
    width:      PIN,
    height:     PIN + TAIL,
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
});

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Phase = 'panic' | 'map';
type TallerItem = Extract<Establecimiento, { _kind: 'taller' }>;

// ─── Constantes ───────────────────────────────────────────────────────────────

const SHEET_H = 360;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R    = 6371;
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
    e.lat !== 0    && e.lng !== 0 &&
    Math.abs(e.lat) <= 90 && Math.abs(e.lng) <= 180
  );
}

// ─── SOS Bottom Sheet ─────────────────────────────────────────────────────────

interface SheetProps {
  item:         TallerItem | null;
  distanciaKm:  number | null;
  onClose:      () => void;
}

function SOSBottomSheet({ item, distanciaKm, onClose }: SheetProps) {
  const [displayItem,     setDisplayItem]     = useState<TallerItem | null>(null);
  const [diagnosticoOpen, setDiagnosticoOpen] = useState(false);
  const translateY      = useRef(new Animated.Value(SHEET_H)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const { bottom: bottomInset } = useSafeAreaInsets();

  useEffect(() => {
    if (item) {
      setDisplayItem(item);
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else if (displayItem) {
      Animated.parallel([
        Animated.timing(translateY,      { toValue: SHEET_H, duration: 240, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0,       duration: 200, useNativeDriver: true }),
      ]).start(() => setDisplayItem(null));
    }
  }, [item]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!displayItem) return null;

  return (
    <>
      <Animated.View
        style={[sheetStyles.backdrop, { opacity: backdropOpacity }]}
        pointerEvents={item ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[sheetStyles.sheet, { transform: [{ translateY }], paddingBottom: Math.max(bottomInset + 16, 28) }]}>

        <View style={sheetStyles.topRow}>
          <View style={sheetStyles.handle} />
          <TouchableOpacity
            onPress={onClose}
            style={sheetStyles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="close" size={20} color={tokens.colors.ink[2]} />
          </TouchableOpacity>
        </View>

        <View style={sheetStyles.identity}>
          <View style={sheetStyles.avatar}>
            <Icon name="wrench" size={22} color={tokens.colors.danger} />
          </View>
          <View style={sheetStyles.identityText}>
            <Text style={sheetStyles.nombre} numberOfLines={2}>
              {displayItem.nombre_taller}
            </Text>
            <View style={sheetStyles.badge}>
              <Text style={sheetStyles.badgeText}>Taller con Grúa</Text>
            </View>
          </View>
        </View>

        <View style={sheetStyles.divider} />

        <View style={sheetStyles.infoBlock}>
          {!!displayItem.direccion && (
            <View style={sheetStyles.infoRow}>
              <Icon name="pin"  size={16} color={tokens.colors.ink[3]} />
              <Text style={sheetStyles.infoText}>{displayItem.direccion}</Text>
            </View>
          )}
          {distanciaKm !== null && (
            <View style={sheetStyles.infoRow}>
              <Icon name="navigate" size={16} color={tokens.colors.ink[3]} />
              <Text style={sheetStyles.infoText}>
                {distanciaKm < 1
                  ? `${Math.round(distanciaKm * 1000)} m`
                  : `${distanciaKm.toFixed(1)} km`}
              </Text>
            </View>
          )}
          {!!displayItem.telefono && (
            <View style={sheetStyles.infoRow}>
              <Icon name="phone" size={16} color={tokens.colors.ink[3]} />
              <Text style={sheetStyles.infoText}>{displayItem.telefono}</Text>
            </View>
          )}
          {!!displayItem.correo && (
            <View style={sheetStyles.infoRow}>
              <Icon name="info"  size={16} color={tokens.colors.ink[3]} />
              <Text style={sheetStyles.infoText}>{displayItem.correo}</Text>
            </View>
          )}
        </View>

        <View style={sheetStyles.divider} />

        <TouchableOpacity
          style={[sheetStyles.whatsappBtn, !displayItem.telefono && sheetStyles.btnDisabled]}
          onPress={() => setDiagnosticoOpen(true)}
          disabled={!displayItem.telefono}
          activeOpacity={0.8}
        >
          <Icon name="phone" size={18} color={tokens.colors.bg[0]} />
          <Text style={sheetStyles.whatsappText}>Enviar mensaje por WhatsApp</Text>
        </TouchableOpacity>

      </Animated.View>

      <DiagnosticoModal
        visible={diagnosticoOpen}
        onClose={() => setDiagnosticoOpen(false)}
        tallerNombre={displayItem.nombre_taller}
        telefono={displayItem.telefono}
        distanciaKm={distanciaKm}
      />
    </>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function ConductorSOS() {
  const { location } = useLocation();
  const mapRef       = useRef<MapView>(null);
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();

  // ── Fases ────────────────────────────────────────────────────────────────────
  const [phase,        setPhase]        = useState<Phase>('panic');
  const [sosActivated, setSosActivated] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const mapOpacity     = useRef(new Animated.Value(0)).current;

  // ── Pulse con Reanimated ──────────────────────────────────────────────────────
  const pulse      = useSharedValue(1.0);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => cancelAnimation(pulse);
  }, []);

  const handlePanic = useCallback(() => {
    cancelAnimation(pulse);
    setSosActivated(true);

    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setPhase('map');
      Animated.timing(mapOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── React Query ──────────────────────────────────────────────────────────────
  const {
    data: rawData = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['establecimientos'],
    queryFn:  fetchEstablecimientos,
    enabled:  sosActivated,
  });

  // ── Filtrar talleres con remolque ────────────────────────────────────────────
  const markers = useMemo<TallerItem[]>(() =>
    rawData
      .filter(isTaller)
      .filter((e) => e.servicio_remolque === true)
      .filter(hasValidCoords),
    [rawData],
  );

  // ── Bottom sheet ─────────────────────────────────────────────────────────────
  const [selectedItem, setSelectedItem] = useState<TallerItem | null>(null);

  const selectedDistancia = useMemo(() => {
    if (!selectedItem || !location) return null;
    return haversineKm(
      location.latitude, location.longitude,
      selectedItem.lat,  selectedItem.lng,
    );
  }, [selectedItem, location]);

  // ── Centrar en usuario al entrar al mapa ─────────────────────────────────────
  const firstCenterDone = useRef(false);
  useEffect(() => {
    if (phase !== 'map' || firstCenterDone.current || !location) return;
    firstCenterDone.current = true;
    mapRef.current?.animateToRegion(
      { latitude: location.latitude, longitude: location.longitude, latitudeDelta: ZOOM_DELTA.z14, longitudeDelta: ZOOM_DELTA.z14 },
      MAP_DEFAULT.animMs.first,
    );
  }, [location, phase]);

  const centerOnUser = useCallback(() => {
    if (!location) return;
    mapRef.current?.animateToRegion(
      { latitude: location.latitude, longitude: location.longitude, latitudeDelta: ZOOM_DELTA.z15, longitudeDelta: ZOOM_DELTA.z15 },
      MAP_DEFAULT.animMs.button,
    );
  }, [location]);

  const initialRegion = {
    latitude:      location ? location.latitude  : -16.5,
    longitude:     location ? location.longitude : -68.15,
    latitudeDelta:  ZOOM_DELTA.z13,
    longitudeDelta: ZOOM_DELTA.z13,
  };

  return (
    <View style={styles.root}>

      {/* ── Fase 2: Mapa ────────────────────────────────────────────────── */}
      {sosActivated && (
        <Animated.View style={[styles.mapContainer, { opacity: mapOpacity }]}>

          {isLoading && (
            <View style={styles.stateOverlay}>
              <ActivityIndicator color={tokens.colors.danger} size="large" />
              <Text style={styles.stateText}>Buscando talleres con grúa…</Text>
            </View>
          )}

          {isError && !isLoading && (
            <View style={styles.stateOverlay}>
              <Icon name="info" size={40} color={tokens.colors.danger} />
              <Text style={styles.stateText}>No se pudieron cargar los talleres</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
                <Text style={styles.retryText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isLoading && !isError && markers.length === 0 && (
            <View style={styles.emptyBanner} pointerEvents="none">
              <Icon name="truck" size={16} color={tokens.colors.ink[2]} />
              <Text style={styles.emptyText}>
                No hay talleres con grúa disponibles cerca
              </Text>
            </View>
          )}

          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            provider={PROVIDER_GOOGLE}
            customMapStyle={GOOGLE_DARK_STYLE}
            showsUserLocation
            showsMyLocationButton={false}
            showsCompass={false}
            initialRegion={initialRegion}
          >
            {markers.map((item) => (
              <Marker
                key={getId(item)}
                coordinate={{ latitude: item.lat, longitude: item.lng }}
                onPress={() => setSelectedItem(item)}
                anchor={{ x: 0.5, y: 1 }}
              >
                <SOSMapPin />
              </Marker>
            ))}
          </MapView>

          <TouchableOpacity
            style={[styles.centerBtn, { bottom: bottomInset + 28 }]}
            onPress={centerOnUser}
            activeOpacity={0.8}
          >
            <Icon name="navigate" size={22} color={tokens.colors.danger} />
          </TouchableOpacity>

          {selectedItem && (
            <TouchableOpacity
              style={[styles.navBtn, { top: topInset + 12 }]}
              onPress={() =>
                Linking.openURL(
                  `https://www.google.com/maps/dir/?api=1&destination=${selectedItem.lat},${selectedItem.lng}`,
                )
              }
              activeOpacity={0.8}
            >
              <Icon name="navigate" size={16} color={tokens.colors.danger} />
              <Text style={styles.navBtnText}>Cómo llegar</Text>
            </TouchableOpacity>
          )}

        </Animated.View>
      )}

      {/* ── Fase 1: Botón de pánico ─────────────────────────────────────── */}
      {phase === 'panic' && (
        <Animated.View
          style={[StyleSheet.absoluteFillObject, styles.panicContainer, { opacity: overlayOpacity }]}
          pointerEvents="auto"
        >
          <Text style={styles.panicTitle}>EMERGENCIA</Text>
          <Text style={styles.panicSub}>Pulsa para localizar grúas cercanas</Text>

          <Reanimated.View style={[styles.pulseWrapper, pulseStyle]}>
            <TouchableOpacity
              style={styles.panicBtn}
              onPress={handlePanic}
              activeOpacity={0.85}
            >
              <Icon name="sos" size={56} color={tokens.colors.ink[0]} />
            </TouchableOpacity>
          </Reanimated.View>

          <Text style={styles.panicHint}>Toca para activar</Text>
        </Animated.View>
      )}

      {/* ── Bottom Sheet ────────────────────────────────────────────────── */}
      {phase === 'map' && (
        <SOSBottomSheet
          item={selectedItem}
          distanciaKm={selectedDistancia}
          onClose={() => setSelectedItem(null)}
        />
      )}

    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.colors.bg[0],
  },

  panicContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.bg[0],
    gap: 16,
  },
  panicTitle: {
    color:         tokens.colors.danger,
    fontSize:      28,
    fontWeight:    '900',
    letterSpacing: 4,
  },
  panicSub: {
    color:    tokens.colors.ink[2],
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  pulseWrapper: {
    marginVertical: 24,
  },
  panicBtn: {
    width:           140,
    height:          140,
    borderRadius:    70,
    backgroundColor: tokens.colors.danger,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     tokens.colors.danger,
    shadowOffset:    tokens.shadows.lg.shadowOffset,
    shadowOpacity:   tokens.shadows.lg.shadowOpacity,
    shadowRadius:    tokens.shadows.lg.shadowRadius,
    elevation:       tokens.shadows.lg.elevation,
  },
  panicHint: {
    color:         tokens.colors.ink[3],
    fontSize:      12,
    letterSpacing: 1,
  },

  mapContainer: {
    flex: 1,
  },
  stateOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: tokens.colors.bg[0],
    gap: 14,
    zIndex: 10,
  },
  stateText: {
    color:    tokens.colors.ink[2],
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryBtn: {
    backgroundColor:   tokens.colors.danger,
    paddingHorizontal: 24,
    paddingVertical:   10,
    borderRadius:      tokens.radii.md,
    marginTop: 8,
  },
  retryText: {
    color:      tokens.colors.ink[0],
    fontWeight: '700',
    fontSize:   14,
  },
  emptyBanner: {
    position:          'absolute',
    top:               12,
    alignSelf:         'center',
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    backgroundColor:   'rgba(8,13,28,0.88)',
    borderRadius:      tokens.radii.sm,
    borderWidth:       1,
    borderColor:       tokens.colors.line,
    paddingHorizontal: 14,
    paddingVertical:   9,
    maxWidth:          '85%',
    zIndex:            20,
  },
  emptyText: {
    color:    tokens.colors.ink[2],
    fontSize: 13,
    flexShrink: 1,
  },
  centerBtn: {
    position:        'absolute',
    right:           16,
    width:           50,
    height:          50,
    borderRadius:    25,
    backgroundColor: MARKER_COLORS.markerBg,
    borderWidth:     2.5,
    borderColor:     tokens.colors.danger,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     tokens.colors.danger,
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   0.9,
    shadowRadius:    12,
    elevation:       10,
  },
  navBtn: {
    position:          'absolute',
    right:             16,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor:   MARKER_COLORS.markerBg,
    borderWidth:       2,
    borderColor:       tokens.colors.danger,
    borderRadius:      10,
    paddingHorizontal: 12,
    paddingVertical:   8,
    zIndex:            20,
    elevation:         8,
  },
  navBtnText: {
    color:      tokens.colors.danger,
    fontSize:   13,
    fontWeight: '700',
  },
});

const sheetStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position:             'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor:      tokens.colors.bg[2],
    borderTopLeftRadius:  20,
    borderTopRightRadius: 20,
    borderTopWidth:       1,
    borderTopColor:       tokens.colors.line,
    paddingHorizontal:    20,
    shadowColor:          '#000',
    shadowOffset:         { width: 0, height: -4 },
    shadowOpacity:        0.35,
    shadowRadius:         14,
    elevation:            20,
  },
  topRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    paddingTop:     12,
    marginBottom:   16,
  },
  handle: {
    width: 40, height: 4,
    borderRadius:    2,
    backgroundColor: tokens.colors.line,
  },
  closeBtn: {
    position: 'absolute',
    right: 0, top: 8,
    padding: 4,
  },
  identity: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           14,
    marginBottom:  16,
  },
  avatar: {
    width:           52,
    height:          52,
    borderRadius:    26,
    backgroundColor: MARKER_COLORS.markerBg,
    borderWidth:     2.5,
    borderColor:     tokens.colors.danger,
    alignItems:      'center',
    justifyContent:  'center',
  },
  identityText: { flex: 1 },
  nombre: {
    color:        tokens.colors.ink[0],
    fontSize:     17,
    fontWeight:   '700',
    marginBottom: 6,
  },
  badge: {
    alignSelf:         'flex-start',
    backgroundColor:   `${tokens.colors.danger}22`,
    borderRadius:      tokens.radii.xs,
    paddingHorizontal: 8,
    paddingVertical:   3,
  },
  badgeText: {
    color:         tokens.colors.danger,
    fontSize:      11,
    fontWeight:    '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    height:          1,
    backgroundColor: tokens.colors.line,
    marginVertical:  14,
  },
  infoBlock: { gap: 10 },
  infoRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           10,
  },
  infoText: {
    color:    tokens.colors.ink[1],
    fontSize: 14,
    flex:     1,
    lineHeight: 20,
  },
  whatsappBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             10,
    backgroundColor: tokens.colors.success,
    borderRadius:    tokens.radii.md,
    paddingVertical: 14,
    marginTop:       4,
  },
  whatsappText: {
    color:      tokens.colors.bg[0],
    fontSize:   15,
    fontWeight: '700',
  },
  btnDisabled: { opacity: 0.4 },
});
