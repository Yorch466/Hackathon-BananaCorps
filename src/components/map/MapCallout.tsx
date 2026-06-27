import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MARKER_COLORS } from '@/config/map';
import { tokens } from '@/theme/tokens';

interface Props {
  nombre:         string;
  direccion:      string | null;
  distanciaKm:    number | null;
  tipo:           'taller' | 'proveedor' | 'hibrido';
  id:             string;
  onViewProfile?: () => void;
}

export function MapCallout({ nombre, direccion, distanciaKm, tipo, onViewProfile }: Props) {
  const accentColor =
    tipo === 'taller'    ? MARKER_COLORS.taller :
    tipo === 'proveedor' ? MARKER_COLORS.proveedor :
                           MARKER_COLORS.hibrido;

  const label =
    tipo === 'taller'    ? 'Taller Mecánico' :
    tipo === 'proveedor' ? 'Autopartes' :
                           'Taller + Autopartes';

  return (
    <View style={[styles.container, { borderColor: accentColor }]}>
      <View style={[styles.badge, { backgroundColor: `${accentColor}22` }]}>
        <Text style={[styles.badgeText, { color: accentColor }]}>{label}</Text>
      </View>

      <Text style={styles.nombre} numberOfLines={2}>{nombre}</Text>

      {direccion ? (
        <Text style={styles.direccion} numberOfLines={2}>{direccion}</Text>
      ) : null}

      {distanciaKm !== null ? (
        <Text style={[styles.distancia, { color: accentColor }]}>
          {distanciaKm < 1
            ? `${Math.round(distanciaKm * 1000)} m`
            : `${distanciaKm.toFixed(1)} km`}
        </Text>
      ) : null}

      {/* Botón para navegar al mini-perfil */}
      {onViewProfile && (
        <TouchableOpacity onPress={onViewProfile} style={styles.profileBtn} activeOpacity={0.7}>
          <Text style={[styles.profileBtnText, { color: accentColor }]}>Ver perfil →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#080D1C',
    borderRadius: tokens.radii.md,
    borderWidth: 1.5,
    padding: 10,
    minWidth: 170,
    maxWidth: 230,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: tokens.radii.xs,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginBottom: 7,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  nombre: {
    color: tokens.colors.ink[0],
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  direccion: {
    color: tokens.colors.ink[2],
    fontSize: 12,
    marginBottom: 4,
  },
  distancia: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  profileBtn: {
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  profileBtnText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
