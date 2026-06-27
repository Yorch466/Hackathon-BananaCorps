import React from 'react';
import { View, Text, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';

type RoleBadge = 'Taller' | 'Proveedor' | 'Híbrido';

interface BannerCardProps {
  name: string;
  initials: string;
  badge: RoleBadge;
  rating?: number;
  ratingCount?: number;
  bannerUri?: string | null;
  avatarUri?: string | null;
  subtitle?: string;
  description?: string;
  direccion?: string | null;
  horarioApertura?: string;
  horarioCierre?: string;
}

const BADGE_COLORS: Record<RoleBadge, string> = {
  Taller: '#1DB88A',
  Proveedor: '#94A3B8',
  Híbrido: '#10B981',
};

function isOpenNow(apertura?: string, cierre?: string): boolean {
  if (!apertura || !cierre) return false;
  const now = new Date();
  const [ah, am] = apertura.split(':').map(Number);
  const [ch, cm] = cierre.split(':').map(Number);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin >= ah * 60 + am && nowMin < ch * 60 + cm;
}

export const BannerCard = ({
  name,
  initials,
  badge,
  rating = 0,
  ratingCount = 0,
  bannerUri,
  avatarUri,
  subtitle,
  description,
  direccion,
  horarioApertura,
  horarioCierre,
}: BannerCardProps) => {
  const badgeColor = BADGE_COLORS[badge];
  const hasHorario = !!(horarioApertura && horarioCierre);
  const open = isOpenNow(horarioApertura, horarioCierre);

  return (
    <View>
      {/* Banner */}
      <View className="h-28 bg-navy-800 overflow-hidden">
        {bannerUri ? (
          <ImageBackground source={{ uri: bannerUri }} className="flex-1" resizeMode="cover">
            <LinearGradient
              colors={['transparent', 'rgba(13,27,62,0.85)']}
              className="flex-1"
            />
          </ImageBackground>
        ) : (
          <LinearGradient
            colors={['#162347', '#0D1B3E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="flex-1"
          />
        )}
      </View>

      {/* Avatar + info */}
      <View className="px-4 pb-4">
        {/* Avatar row */}
        <View className="flex-row items-end -mt-10 mb-3">
          <View
            style={{
              borderRadius: 44,
              borderWidth: 3,
              borderColor: '#0D1B3E',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Avatar size={72} uri={avatarUri} initials={initials} bgColor="#243050" />
          </View>

          {/* Badge + rating */}
          <View className="ml-3 flex-row items-center gap-2 pb-1">
            <View style={{ backgroundColor: badgeColor }} className="px-2.5 py-0.5 rounded-full">
              <Text className="text-navy-900 text-xs font-bold">{badge}</Text>
            </View>
            {rating > 0 && (
              <View className="flex-row items-center gap-1">
                <Icon name="starFill" size={13} color="#1DB88A" filled />
                <Text className="text-ink-primary text-sm font-semibold">{rating}</Text>
                <Text className="text-ink-secondary text-xs">({ratingCount})</Text>
              </View>
            )}
          </View>
        </View>

        <Text className="text-ink-primary text-xl font-bold">{name}</Text>

        {/* Location + hours row */}
        {(direccion || hasHorario) ? (
          <View className="flex-row items-center flex-wrap gap-x-2 gap-y-0.5 mt-1">
            {direccion ? (
              <View className="flex-row items-center gap-1">
                <Icon name="pin" size={12} color="#94A3B8" />
                <Text className="text-ink-secondary text-xs">{direccion}</Text>
              </View>
            ) : null}
            {hasHorario ? (
              <View className="flex-row items-center gap-1">
                {direccion ? <Text className="text-ink-muted text-xs">·</Text> : null}
                <View
                  className={`w-2 h-2 rounded-full ${open ? 'bg-success' : 'bg-danger'}`}
                />
                <Text className={`text-xs font-medium ${open ? 'text-success' : 'text-danger'}`}>
                  {open ? 'Abierto' : 'Cerrado'}
                </Text>
                <Text className="text-ink-secondary text-xs">
                  · {horarioApertura}–{horarioCierre}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {subtitle ? (
          <Text className="text-ink-secondary text-xs mt-1">{subtitle}</Text>
        ) : null}

        {description ? (
          <Text className="text-ink-secondary text-sm mt-2 leading-5">{description}</Text>
        ) : null}
      </View>
    </View>
  );
};
