import React, { useState } from 'react';
import { View, Text, Image } from 'react-native';

interface AvatarProps {
  size?: number;
  uri?: string | null;
  initials?: string;
  bgColor?: string;
}

function getInitials(text?: string): string {
  if (!text) return '?';
  const parts = text.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const Avatar = ({ size = 50, uri, initials, bgColor = '#1A2540' }: AvatarProps) => {
  const radius = size / 2;
  const fontSize = size * 0.35;
  const [imgError, setImgError] = useState(false);

  React.useEffect(() => { setImgError(false); }, [uri]);

  const showImage = !!uri && !imgError;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: bgColor,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {showImage ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: radius }}
          resizeMode="cover"
          onError={(e) => {
              console.warn('[Avatar] failed to load:', uri, e.nativeEvent?.error);
              setImgError(true);
            }}
        />
      ) : (
        <Text
          style={{
            color: '#FFFFFF',
            fontSize,
            fontWeight: '700',
            letterSpacing: 1,
          }}
        >
          {getInitials(initials)}
        </Text>
      )}
    </View>
  );
};

export { getInitials };
