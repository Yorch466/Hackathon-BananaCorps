import React from 'react';
import { View, Text } from 'react-native';
import { Icon } from '@/components/ui/Icon';

interface DistRow { star: number; count: number; percent: number; }

interface RatingCardProps {
  rating: number;
  ratingCount: number;
  distribution?: DistRow[];
}

export const RatingCard = ({ rating, ratingCount, distribution }: RatingCardProps) => {
  const filled = Math.round(rating);

  return (
    <View className="mx-4 bg-navy-800 rounded-2xl p-4">
      <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-3">
        Calificación
      </Text>
      <View className="flex-row items-center gap-4">
        {/* Número grande + estrellas + reseñas */}
        <View className="items-center" style={{ minWidth: 72 }}>
          <Text className="text-ink-primary font-bold" style={{ fontSize: 40, lineHeight: 44 }}>
            {ratingCount > 0 ? rating.toFixed(1) : '—'}
          </Text>
          <View className="flex-row gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Icon
                key={i}
                name={i <= filled ? 'starFill' : 'star'}
                size={12}
                color="#1DB88A"
                filled={i <= filled}
              />
            ))}
          </View>
          <Text className="text-ink-muted text-xs mt-1.5 text-center">
            {ratingCount} {ratingCount === 1 ? 'calificación' : 'calificaciones'}
          </Text>
        </View>

        {/* Barras de distribución */}
        {distribution ? (
          <View className="flex-1 gap-2">
            {distribution.map(({ star, percent }) => (
              <View key={star} className="flex-row items-center gap-1.5">
                <Text className="text-ink-muted text-xs" style={{ width: 10, textAlign: 'right' }}>
                  {star}
                </Text>
                <Icon name="starFill" size={10} color="#1DB88A" filled />
                <View className="flex-1 bg-navy-700 rounded-full overflow-hidden" style={{ height: 6 }}>
                  <View
                    className="bg-accent rounded-full"
                    style={{ width: `${percent}%`, height: 6 }}
                  />
                </View>
                <Text className="text-ink-muted text-xs" style={{ width: 32, textAlign: 'right' }}>
                  {percent}%
                </Text>
              </View>
            ))}
          </View>
        ) : ratingCount === 0 ? (
          <Text className="text-ink-muted text-sm flex-1 text-center">
            Aún no hay reseñas
          </Text>
        ) : null}
      </View>
    </View>
  );
};
