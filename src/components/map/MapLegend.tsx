import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MARKER_COLORS } from '@/config/map';
import { tokens } from '@/theme/tokens';

// ─── Fila individual ──────────────────────────────────────────────────────────

function LegendRow({ color, label, isWrench }: { color: string; label: string; isWrench: boolean }) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]}>
        <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
          {isWrench ? (
            <Path
              d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77Z"
              stroke="#fff"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <>
              <Path
                d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                stroke="#fff"
                strokeWidth={2.5}
                strokeLinecap="round"
              />
              <Path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
                stroke="#fff"
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            </>
          )}
        </Svg>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

// ─── Contenedor exportable ────────────────────────────────────────────────────

interface MapLegendProps {
  style?: ViewStyle;
}

export function MapLegend({ style }: MapLegendProps) {
  return (
    <View style={[styles.container, style]}>
      <LegendRow color={MARKER_COLORS.taller}    label="Taller Mecánico" isWrench />
      <LegendRow color={MARKER_COLORS.proveedor} label="Autopartes"      isWrench={false} />
      <LegendRow color={MARKER_COLORS.hibrido}   label="Taller + Repuestos" isWrench />
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(8,13,28,0.82)',
    borderRadius: tokens.radii.sm,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  label: {
    color: tokens.colors.ink[0],
    fontSize: 11,
    fontWeight: '600',
  },
});
