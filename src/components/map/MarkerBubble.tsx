import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { MARKER_COLORS } from '@/config/map';

// ─── Dimensiones ──────────────────────────────────────────────────────────────
// width/height OBLIGATORIOS en pin root para que @rnmapbox/maps renderice
// el custom view en lugar del triángulo por defecto.

const HEAD   = 48;   // diámetro del círculo de cabeza (solid color)
const INNER  = 32;   // diámetro del círculo blanco interior (foto/icono)
const TAIL_H = 14;   // altura del triángulo apuntador

// ─── Iconos SVG (fallback cuando no hay imagen de perfil) ────────────────────

function WrenchIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77Z"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function GearIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Cabeza del pin (círculo sólido con inner blanco) ─────────────────────────

interface HeadProps {
  tipo: 'taller' | 'proveedor' | 'hibrido';
  imagenUrl: string | null;
}

function PinHead({ tipo, imagenUrl }: HeadProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = !!imagenUrl && !imgFailed;

  const bodyColor =
    tipo === 'taller'    ? MARKER_COLORS.taller    :
    tipo === 'proveedor' ? MARKER_COLORS.proveedor :
                           MARKER_COLORS.hibrido;

  // Ícono en el círculo blanco — mismo color que el cuerpo del pin
  const icon =
    tipo === 'hibrido' ? (
      <View style={innerStyles.hybridRow}>
        <WrenchIcon color={MARKER_COLORS.taller}    size={13} />
        <GearIcon   color={MARKER_COLORS.proveedor} size={13} />
      </View>
    ) : tipo === 'taller' ? (
      <WrenchIcon color={bodyColor} />
    ) : (
      <GearIcon color={bodyColor} />
    );

  // Círculo interior blanco con imagen o ícono
  const inner = (
    <View style={innerStyles.inner}>
      {showImage ? (
        <Image
          source={{ uri: imagenUrl! }}
          style={innerStyles.img}
          onError={() => setImgFailed(true)}
        />
      ) : icon}
    </View>
  );

  // Para híbrido: gradiente diagonal naranja→azul como fondo
  if (tipo === 'hibrido') {
    return (
      <LinearGradient
        colors={[MARKER_COLORS.taller, MARKER_COLORS.proveedor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={innerStyles.head}
      >
        {inner}
      </LinearGradient>
    );
  }

  return (
    <View style={[innerStyles.head, { backgroundColor: bodyColor }]}>
      {inner}
    </View>
  );
}

const innerStyles = StyleSheet.create({
  head: {
    width: HEAD,
    height: HEAD,
    borderRadius: HEAD / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  inner: {
    width: INNER,
    height: INNER,
    borderRadius: INNER / 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  img: {
    width: INNER,
    height: INNER,
    borderRadius: INNER / 2,
  },
  hybridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
});

// ─── Componente exportable ────────────────────────────────────────────────────

interface MarkerBubbleProps {
  tipo:      'taller' | 'proveedor' | 'hibrido';
  imagenUrl: string | null;
  compact?:  boolean;   // true en zoom bajo → solo un dot de color, sin icon ni cola
}

// Dot compacto — reduce el clutter visual cuando hay muchos marcadores en el mapa
function CompactDot({ tipo }: { tipo: MarkerBubbleProps['tipo'] }) {
  const color =
    tipo === 'taller'    ? MARKER_COLORS.taller    :
    tipo === 'proveedor' ? MARKER_COLORS.proveedor :
                           MARKER_COLORS.hibrido;
  return <View style={[dotStyles.dot, { backgroundColor: color }]} />;
}

const DOT = 18;
const dotStyles = StyleSheet.create({
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 2,
    borderColor: '#fff',
  },
});

export function MarkerBubble({ tipo, imagenUrl, compact = false }: MarkerBubbleProps) {
  if (compact) return <CompactDot tipo={tipo} />;

  const tailColor =
    tipo === 'taller'    ? MARKER_COLORS.taller    :
    tipo === 'proveedor' ? MARKER_COLORS.proveedor :
                           MARKER_COLORS.hibrido;

  return (
    <View style={styles.pin}>
      <PinHead tipo={tipo} imagenUrl={imagenUrl} />
      <View style={[styles.tail, { borderTopColor: tailColor }]} />
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pin: {
    width: HEAD,
    height: HEAD + TAIL_H,
    alignItems: 'center',
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth:   HEAD / 4,
    borderRightWidth:  HEAD / 4,
    borderTopWidth:    TAIL_H,
    borderLeftColor:   'transparent',
    borderRightColor:  'transparent',
    marginTop: -1,
  },
});
