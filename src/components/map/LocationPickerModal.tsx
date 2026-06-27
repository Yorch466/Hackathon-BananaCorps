import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import Svg, { Path, Circle } from 'react-native-svg';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { MapLegend } from '@/components/map/MapLegend';
import { MAP_DEFAULT, MARKER_COLORS, ZOOM_DELTA, GOOGLE_DARK_STYLE } from '@/config/map';
import { tokens } from '@/theme/tokens';
import { supabase } from '@/lib/supabase';
import {
  fetchEstablecimientos,
  updateUbicacion,
  getId,
  isHibrido,
  type Establecimiento,
} from '@/features/shops/api';
import type { UiRole } from '@/types/user';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Props {
  visible:    boolean;
  onClose:    () => void;
  usuarioId:  string;
  role:       UiRole;
  onSuccess?: () => void;
}

// [lng, lat] — mismo orden que antes para no romper updateUbicacion
const DEFAULT_CENTER: [number, number] = [MAP_DEFAULT.lng, MAP_DEFAULT.lat];

function hasValidCoords(e: Establecimiento): boolean {
  return (
    isFinite(e.lat) && isFinite(e.lng) &&
    e.lat !== 0 && e.lng !== 0 &&
    Math.abs(e.lat) <= 90 && Math.abs(e.lng) <= 180
  );
}

// ─── Marker sin elevation para PROVIDER_GOOGLE en Android ────────────────────

const PIN = 36;
const TAIL = 10;

function LocationMapPin({ tipo }: { tipo: 'taller' | 'proveedor' | 'hibrido' }) {
  const color =
    tipo === 'taller'    ? MARKER_COLORS.taller    :
    tipo === 'proveedor' ? MARKER_COLORS.proveedor :
                           MARKER_COLORS.hibrido;
  return (
    <View collapsable={false} style={pinStyles.pin}>
      <View style={[pinStyles.circle, { borderColor: color }]}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      </View>
      <View style={[pinStyles.tail, { borderTopColor: color }]} />
    </View>
  );
}

const pinStyles = StyleSheet.create({
  pin:    { width: PIN, height: PIN + TAIL, alignItems: 'center' },
  circle: {
    width: PIN, height: PIN, borderRadius: PIN / 2,
    backgroundColor: MARKER_COLORS.markerBg,
    borderWidth: 3, alignItems: 'center', justifyContent: 'center',
  },
  tail: {
    width: 0, height: 0,
    borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: TAIL,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    marginTop: -1,
  },
});

// ─── Pin rojo fijo en el centro del mapa ─────────────────────────────────────

function RedPin() {
  return (
    <Svg width={28} height={36} viewBox="0 0 28 36" fill="none">
      <Path
        d="M14 1C7.37 1 2 6.37 2 13c0 8.5 12 23 12 23S26 21.5 26 13C26 6.37 20.63 1 14 1Z"
        fill={tokens.colors.danger}
        stroke="#fff"
        strokeWidth={1.5}
      />
      <Circle cx="14" cy="13" r="4.5" fill="white" />
    </Svg>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function LocationPickerModal({ visible, onClose, usuarioId, role, onSuccess }: Props) {
  const insets      = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const mapRef      = useRef<MapView>(null);

  const [establecimientos, setEstablecimientos] = useState<Establecimiento[]>([]);
  const [selectedCoord, setSelectedCoord]       = useState<[number, number]>(DEFAULT_CENTER);
  const [saving, setSaving]                     = useState(false);
  const [nombreNegocio, setNombreNegocio]       = useState<string | null>(null);

  // ─── Cargar establecimientos de referencia ───────────────────────────
  useEffect(() => {
    fetchEstablecimientos()
      .then((data) => setEstablecimientos(data.filter(hasValidCoords)))
      .catch((e) => console.warn('[LocationPicker] fetchEstablecimientos error:', e));
  }, []);

  // ─── Cargar nombre del negocio del usuario autenticado ───────────────
  useEffect(() => {
    if (!visible) return;
    async function loadNombreNegocio() {
      if (role === 'taller' || role === 'hibrido') {
        const { data } = await supabase
          .from('taller')
          .select('nombre_taller')
          .eq('usuario_id', usuarioId)
          .single();
        if (data) setNombreNegocio(data.nombre_taller);
      } else if (role === 'proveedor') {
        const { data } = await supabase
          .from('proveedor')
          .select('nombre_proveedor')
          .eq('usuario_id', usuarioId)
          .single();
        if (data) setNombreNegocio(data.nombre_proveedor);
      }
    }
    loadNombreNegocio();
  }, [visible, usuarioId, role]);

  // ─── Centrar en GPS al abrir ─────────────────────────────────────────
  const firstCenter = useRef(false);

  useEffect(() => {
    if (!visible) { firstCenter.current = false; return; }
    if (firstCenter.current) return;

    import('expo-location').then(async (Location) => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const coord: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        if (!isFinite(coord[0]) || !isFinite(coord[1])) return;
        firstCenter.current = true;
        setSelectedCoord(coord);
        mapRef.current?.animateToRegion(
          { latitude: coord[1], longitude: coord[0], latitudeDelta: ZOOM_DELTA.z15, longitudeDelta: ZOOM_DELTA.z15 },
          900,
        );
      } catch (e) {
        console.warn('[LocationPicker] GPS error:', e);
      }
    });
  }, [visible]);

  // ─── Botón centrar en usuario ────────────────────────────────────────
  const handleCenterOnUser = useCallback(() => {
    import('expo-location').then(async (Location) => {
      try {
        let pos = await Location.getLastKnownPositionAsync({
          maxAge: 60_000,
          requiredAccuracy: 500,
        });

        if (!pos) {
          pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        }

        const coord: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        if (!isFinite(coord[0]) || !isFinite(coord[1])) return;
        setSelectedCoord(coord);
        mapRef.current?.animateToRegion(
          { latitude: coord[1], longitude: coord[0], latitudeDelta: ZOOM_DELTA.z15, longitudeDelta: ZOOM_DELTA.z15 },
          700,
        );
      } catch (e) {
        console.warn('[LocationPicker] handleCenterOnUser error:', e);
      }
    });
  }, []);

  // ─── Confirmar → guardar en Supabase ─────────────────────────────────
  const handleConfirm = useCallback(async () => {
    setSaving(true);
    try {
      const [lng, lat] = selectedCoord;

      if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        Alert.alert('Error', 'Coordenadas inválidas. Mueve el mapa e intenta de nuevo.');
        return;
      }

      console.log(`[LocationPicker] Guardando: lat=${lat.toFixed(6)}, lng=${lng.toFixed(6)}, role=${role}`);
      await updateUbicacion(usuarioId, role, lat, lng);

      queryClient.invalidateQueries({ queryKey: ['establecimientos'] });

      Alert.alert('¡Ubicación registrada!', 'Tu negocio ya aparece en el mapa.');
      onSuccess?.();
      onClose();
    } catch (e) {
      console.error('[LocationPicker] updateUbicacion error:', e);
      Alert.alert('Error', 'No se pudo guardar la ubicación. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }, [usuarioId, role, selectedCoord, onSuccess, onClose, queryClient]);

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Mapa ──────────────────────────────────────────────────────── */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            provider={PROVIDER_GOOGLE}
            customMapStyle={GOOGLE_DARK_STYLE}
            showsUserLocation
            showsMyLocationButton={false}
            showsCompass={false}
            initialRegion={{
              latitude:      MAP_DEFAULT.lat,
              longitude:     MAP_DEFAULT.lng,
              latitudeDelta: ZOOM_DELTA.z13,
              longitudeDelta: ZOOM_DELTA.z13,
            }}
            onRegionChangeComplete={(region: Region) => {
              setSelectedCoord([region.longitude, region.latitude]);
            }}
          >
            {establecimientos.map((item) => (
              <Marker
                key={getId(item)}
                coordinate={{ latitude: item.lat, longitude: item.lng }}
                anchor={{ x: 0.5, y: 1 }}
              >
                <LocationMapPin
                  tipo={isHibrido(item) ? 'hibrido' : item._kind as 'taller' | 'proveedor'}
                />
              </Marker>
            ))}
          </MapView>

          {/* Pin rojo fijo en el centro */}
          <View pointerEvents="none" style={styles.pinOverlay}>
            <View style={{ transform: [{ translateY: -18 }] }}>
              <RedPin />
            </View>
          </View>

          <MapLegend style={styles.legend} />

          <TouchableOpacity style={styles.centerBtn} onPress={handleCenterOnUser} activeOpacity={0.8}>
            <Icon name="navigate" size={22} color={MARKER_COLORS.taller} />
          </TouchableOpacity>
        </View>

        {/* ── Panel inferior con safe area ──────────────────────────────── */}
        <View style={[
          styles.bottomPanel,
          { paddingBottom: Math.max(insets.bottom + 16, 28) },
        ]}>
          <Text style={styles.businessName} numberOfLines={1}>
            {nombreNegocio ?? 'Mi Negocio'}
          </Text>
          <Text style={styles.hintText}>Arrastra el mapa para posicionar el pin</Text>

          <Button
            label={saving ? 'Guardando…' : 'Confirmar Ubicación'}
            onPress={handleConfirm}
            disabled={saving}
          />
          <Button label="Cancelar" variant="outline" onPress={onClose} disabled={saving} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: tokens.colors.bg[1] },
  mapContainer: { flex: 1 },

  pinOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },

  legend: {
    position: 'absolute',
    bottom: 56,
    left: 12,
  },

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

  bottomPanel: {
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: tokens.colors.bg[1],
    borderTopWidth: 1,
    borderTopColor: tokens.colors.line,
    gap: 8,
  },

  businessName: {
    color: tokens.colors.ink[0],
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  hintText: {
    color: tokens.colors.ink[2],
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
});
