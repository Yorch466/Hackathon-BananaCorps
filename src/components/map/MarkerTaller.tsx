import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MARKER_COLORS } from '@/config/map';

const RING = 66;
const BUBBLE = 48;

export function MarkerTaller() {
  return (
    <View style={styles.pin}>
      <View style={styles.container}>
        {/* Halo neon exterior */}
        <View style={styles.ring} />
        <View style={styles.bubble}>
          {/* Wrench — ícono universal de taller mecánico */}
          <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <Path
              d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77Z"
              stroke={MARKER_COLORS.taller}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </View>
      {/* Cola del pin */}
      <View style={styles.tail} />
    </View>
  );
}

const styles = StyleSheet.create({
  // width/height explícitos son obligatorios para que @rnmapbox/maps
  // renderice el custom view correctamente (sin ellos muestra el triángulo por defecto).
  pin: {
    width: RING,
    height: RING + 10,   // container (66) + tail (10)
    alignItems: 'center',
  },
  container: {
    width: RING,
    height: RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    backgroundColor: MARKER_COLORS.tallerGlow,
    borderWidth: 1,
    borderColor: MARKER_COLORS.tallerGlow,
  },
  bubble: {
    width: BUBBLE,
    height: BUBBLE,
    borderRadius: BUBBLE / 2,
    backgroundColor: MARKER_COLORS.markerBg,
    borderWidth: 3,
    borderColor: MARKER_COLORS.taller,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: MARKER_COLORS.taller,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 12,
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: MARKER_COLORS.taller,
    marginTop: -1,
  },
});
