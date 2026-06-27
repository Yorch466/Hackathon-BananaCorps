import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function UserTypeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-navy-900 px-6 pt-16 pb-10">
      <StatusBar barStyle="light-content" backgroundColor="#0D1B3E" />

      {/* Logo */}
      <View className="items-center mb-12">
        <View className="w-28 h-28 rounded-full border-2 border-accent overflow-hidden bg-navy-800">
          <Image
            source={require('../../assets/images/AMANTES DE LOS FIERROS LOGO PEQUE.jpeg')}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Título */}
      <Text className="text-ink-primary text-xl font-bold text-center mb-2">
        ¿Cómo quieres usar la app?
      </Text>
      <Text className="text-ink-secondary text-sm text-center mb-12">
        Elige tu tipo de perfil para continuar
      </Text>

      {/* Opciones */}
      <View className="gap-4">
        <TouchableOpacity
          className="bg-navy-800 border border-navy-700 rounded-2xl p-5 flex-row items-center gap-4"
          onPress={() => router.push('/(auth)/signup-conductor')}
          activeOpacity={0.8}
        >
          <View className="w-12 h-12 rounded-full bg-accent/20 items-center justify-center">
            <Text className="text-2xl">🚗</Text>
          </View>
          <View className="flex-1">
            <Text className="text-ink-primary font-bold text-base mb-1">Conductor</Text>
            <Text className="text-ink-secondary text-xs">
              Busca talleres y repuestos cerca de ti
            </Text>
          </View>
          <Text className="text-accent text-lg">→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-navy-800 border border-navy-700 rounded-2xl p-5 flex-row items-center gap-4"
          onPress={() => router.push('/(auth)/signup-shop')}
          activeOpacity={0.8}
        >
          <View className="w-12 h-12 rounded-full bg-accent/20 items-center justify-center">
            <Text className="text-2xl">🔧</Text>
          </View>
          <View className="flex-1">
            <Text className="text-ink-primary font-bold text-base mb-1">Taller / Proveedor</Text>
            <Text className="text-ink-secondary text-xs">
              Ofrece servicios mecánicos o vende repuestos
            </Text>
          </View>
          <Text className="text-accent text-lg">→</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View className="flex-row justify-center mt-12">
        <Text className="text-ink-secondary text-sm">¿Ya tienes cuenta? </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text className="text-accent text-sm font-bold">Inicia sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
