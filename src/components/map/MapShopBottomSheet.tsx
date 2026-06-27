import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { MARKER_COLORS } from '@/config/map';
import { tokens } from '@/theme/tokens';
import {
  getNombre,
  getId,
  isHibrido,
  fetchSheetData,
  type Establecimiento,
} from '@/features/shops/api';
import type { UserLocation } from '@/hooks/useLocation';

// ─── Constantes ───────────────────────────────────────────────────────────────

const SHEET_H = 260;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isOpenNow(apertura: string | null, cierre: string | null): boolean {
  if (!apertura || !cierre) return false;
  const [ah, am] = apertura.split(':').map(Number);
  const [ch, cm] = cierre.split(':').map(Number);
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  return cur >= ah * 60 + am && cur < ch * 60 + cm;
}

function formatHorario(apertura: string | null, cierre: string | null): string {
  if (!apertura || !cierre) return '—';
  return `${apertura} - ${cierre}`;
}

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

// ─── Avatar ───────────────────────────────────────────────────────────────────

function ShopAvatar({ tipo, imagenUrl, nombre, accentColor }: {
  tipo: 'taller' | 'proveedor' | 'hibrido';
  imagenUrl: string | null;
  nombre: string;
  accentColor: string;
}) {
  const initials = nombre.slice(0, 2).toUpperCase();
  return (
    <View style={[avatarStyles.ring, { borderColor: accentColor }]}>
      {imagenUrl ? (
        <Image source={{ uri: imagenUrl }} style={avatarStyles.img} />
      ) : (
        <Text style={[avatarStyles.initials, { color: accentColor }]}>{initials}</Text>
      )}
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  ring: {
    width: 52, height: 52, borderRadius: 10,
    borderWidth: 2,
    backgroundColor: MARKER_COLORS.markerBg,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  img: { width: 52, height: 52 },
  initials: { fontSize: 18, fontWeight: '700' },
});

// ─── Estrellas ────────────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon
          key={i}
          name={i <= Math.round(rating) ? 'starFill' : 'star'}
          size={13}
          color="#FACC15"
          filled={i <= Math.round(rating)}
        />
      ))}
    </View>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  item:         Establecimiento | null;
  userLocation: UserLocation | null;
  onClose:      () => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function MapShopBottomSheet({ item, userLocation, onClose }: Props) {
  const router = useRouter();

  const [displayItem, setDisplayItem] = useState<Establecimiento | null>(null);
  const translateY      = useRef(new Animated.Value(SHEET_H)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (item) {
      setDisplayItem(item);
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else if (displayItem) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: SHEET_H, duration: 240, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setDisplayItem(null));
    }
  }, [item]); // eslint-disable-line react-hooks/exhaustive-deps

  // Extra data: rating, especialidades, horario para híbrido
  const sheetId = displayItem ? getId(displayItem) : '';
  const { data: extra, isLoading: extraLoading } = useQuery({
    queryKey: ['sheet-extra', sheetId],
    queryFn:  () => fetchSheetData(displayItem!),
    enabled:  !!displayItem,
    staleTime: 1000 * 60 * 5,
  });

  if (!displayItem) return null;

  const tipo        = isHibrido(displayItem) ? 'hibrido' : displayItem._kind as 'taller' | 'proveedor';
  const nombre      = getNombre(displayItem);
  const id          = getId(displayItem);
  const accentColor =
    tipo === 'taller'    ? MARKER_COLORS.taller :
    tipo === 'proveedor' ? MARKER_COLORS.proveedor :
                           MARKER_COLORS.hibrido;

  const typeLabel =
    tipo === 'taller'    ? 'Taller Mecánico' :
    tipo === 'proveedor' ? 'Autopartes' :
                           'Taller + Autopartes';

  const distanciaKm = userLocation
    ? haversineKm(userLocation.latitude, userLocation.longitude, displayItem.lat, displayItem.lng)
    : null;

  const horarioApertura = extra?.horarioApertura ?? null;
  const horarioCierre   = extra?.horarioCierre   ?? null;
  const abierto         = isOpenNow(horarioApertura, horarioCierre);
  const especialidades  = extra?.especialidades ?? [];
  const rating          = extra?.rating ?? 0;
  const ratingCount     = extra?.ratingCount ?? 0;
  const remolque        = extra?.servicioRemolque ?? false;

  const handleViewProfile = () => {
    onClose();
    router.push({
      pathname: '/shop/[id]',
      params: { id, type: isHibrido(displayItem) ? 'taller' : displayItem._kind },
    });
  };

  return (
    <>
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
        pointerEvents={item ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>

        {/* Handle + X */}
        <View style={styles.topRow}>
          <View style={styles.handle} />
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="close" size={20} color={tokens.colors.ink[2]} />
          </TouchableOpacity>
        </View>

        {/* Fila principal: avatar + info + badge abierto/cerrado */}
        <View style={styles.headerRow}>
          <ShopAvatar tipo={tipo} imagenUrl={displayItem.imagenUrl} nombre={nombre} accentColor={accentColor} />

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.nombre} numberOfLines={1}>{nombre}</Text>

            {/* Tipo · especialidades */}
            <Text style={styles.subtipo} numberOfLines={1}>
              {typeLabel}
              {especialidades.length > 0 ? ` · ${especialidades.slice(0, 2).join(' · ')}` : ''}
            </Text>

            {/* Estrellas */}
            {extraLoading ? (
              <ActivityIndicator size={12} color={tokens.colors.ink[3]} style={{ marginTop: 4, alignSelf: 'flex-start' }} />
            ) : (
              <View style={styles.ratingRow}>
                <Stars rating={rating} />
                <Text style={styles.ratingText}>
                  {rating > 0 ? ` ${rating.toFixed(1)} (${ratingCount})` : ' Sin reseñas'}
                </Text>
              </View>
            )}
          </View>

          {/* Badge abierto/cerrado */}
          {(horarioApertura || horarioCierre) && (
            <View style={[styles.statusBadge, { backgroundColor: abierto ? '#10B98122' : '#EF444422' }]}>
              <View style={[styles.statusDot, { backgroundColor: abierto ? '#10B981' : '#EF4444' }]} />
              <Text style={[styles.statusText, { color: abierto ? '#10B981' : '#EF4444' }]}>
                {abierto ? 'Abierto' : 'Cerrado'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Fila de stats: distancia | horario | remolque */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>DISTANCIA</Text>
            <Text style={styles.statValue}>
              {distanciaKm != null ? `${distanciaKm.toFixed(1)} km` : '—'}
            </Text>
          </View>

          <View style={styles.statSep} />

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>HORARIO</Text>
            <Text style={styles.statValue}>{formatHorario(horarioApertura, horarioCierre)}</Text>
          </View>

          {tipo !== 'proveedor' && (
            <>
              <View style={styles.statSep} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>REMOLQUE</Text>
                <Text style={[styles.statValue, { color: remolque ? '#10B981' : tokens.colors.ink[2] }]}>
                  {remolque ? 'Sí' : 'No'}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={[styles.divider, { marginTop: 14 }]} />

        <View style={styles.actions}>
          <Button label="Ver perfil completo →" onPress={handleViewProfile} />
        </View>

      </Animated.View>
    </>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: tokens.colors.bg[2],
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.line,
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    marginBottom: 14,
  },
  handle: {
    width: 40, height: 4,
    borderRadius: 2,
    backgroundColor: tokens.colors.line,
  },
  closeBtn: {
    position: 'absolute',
    right: 0, top: 8,
    padding: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  nombre: {
    color: tokens.colors.ink[0],
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  subtipo: {
    color: tokens.colors.ink[2],
    fontSize: 12,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    color: tokens.colors.ink[2],
    fontSize: 12,
    marginLeft: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 8,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 7, height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: tokens.colors.line,
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    color: tokens.colors.ink[3],
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statValue: {
    color: tokens.colors.ink[0],
    fontSize: 14,
    fontWeight: '700',
  },
  statSep: {
    width: 1,
    height: 32,
    backgroundColor: tokens.colors.line,
  },
  actions: { marginTop: 4 },
});
