import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MARKER_COLORS } from '@/config/map';

const RING = 66;
const BUBBLE = 48;

export function MarkerProveedor() {
  return (
    <View style={styles.pin}>
      <View style={styles.container}>
        {/* Halo neon exterior */}
        <View style={styles.ring} />
        <View style={styles.bubble}>
          {/* Gear/Settings — ícono de autopartes y repuestos */}
          <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
              stroke={MARKER_COLORS.proveedor}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
              stroke={MARKER_COLORS.proveedor}
              strokeWidth={2}
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
    backgroundColor: MARKER_COLORS.proveedorGlow,
    borderWidth: 1,
    borderColor: MARKER_COLORS.proveedorGlow,
  },
  bubble: {
    width: BUBBLE,
    height: BUBBLE,
    borderRadius: BUBBLE / 2,
    backgroundColor: MARKER_COLORS.markerBg,
    borderWidth: 3,
    borderColor: MARKER_COLORS.proveedor,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: MARKER_COLORS.proveedor,
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
    borderTopColor: MARKER_COLORS.proveedor,
    marginTop: -1,
  },
});
