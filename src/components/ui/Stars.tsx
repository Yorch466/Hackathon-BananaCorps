import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface StarsProps {
  rating?: number;
  size?: number;
}

export const Stars = ({ rating = 5, size = 16 }: StarsProps) => {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Svg key={i} width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={i <= Math.round(rating) ? '#1DB88A' : '#2C2C2C'}
            stroke="#1DB88A"
            strokeWidth="1"
          />
        </Svg>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 2,
  },
});
