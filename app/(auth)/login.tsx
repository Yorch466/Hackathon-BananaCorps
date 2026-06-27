import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginForm } from '@/features/auth/schemas';
import { signIn } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';

export default function LoginScreen() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // ── Animaciones de entrada ───────────────────────────────────────────────
  const logoScale   = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const formSlide   = useRef(new Animated.Value(28)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const btnScale    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(90, [
      // Logo: spring con más bounce
      Animated.parallel([
        Animated.spring(logoScale,   { toValue: 1, tension: 55, friction: 6, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      // Formulario sube con spring orgánico
      Animated.parallel([
        Animated.spring(formSlide,   { toValue: 0, tension: 65, friction: 9, useNativeDriver: true }),
        Animated.timing(formOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setApiError(null);
    const { user, error } = await signIn(data);
    if (error || !user) {
      setApiError(error ?? 'Error al iniciar sesión');
      return;
    }
    setUser(user);
    if (user.type === 'conductor') {
      router.replace('/(conductor)/dashboard');
    } else {
      router.replace('/(shop)/dashboard');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior="padding"
      className="flex-1 bg-navy-900"
    >
      <StatusBar barStyle="light-content" backgroundColor="#0D1B3E" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 pt-16 pb-10">

          {/* ── Logo ────────────────────────────────────────────────────── */}
          <Animated.View
            className="items-center mb-10"
            style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}
          >
            <View className="w-28 h-28 rounded-full border-2 border-accent overflow-hidden bg-navy-800">
              <Image
                source={require('../../assets/images/AMANTES DE LOS FIERROS LOGO PEQUE.jpeg')}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </View>
          </Animated.View>

          {/* ── Tabs + Formulario (animados juntos) ─────────────────────── */}
          <Animated.View style={{ opacity: formOpacity, transform: [{ translateY: formSlide }] }}>

          {/* ── Tabs ────────────────────────────────────────────────────── */}
          <View className="flex-row mb-8">
            <TouchableOpacity
              className="flex-1 py-3 items-center border-b border-navy-700"
              onPress={() => router.push('/(auth)/user-type')}
            >
              <Text className="text-ink-secondary text-xs font-bold tracking-widest">
                REGISTRO
              </Text>
            </TouchableOpacity>
            <View className="flex-1 py-3 items-center border-b-2 border-accent">
              <Text className="text-accent text-xs font-bold tracking-widest">
                INICIAR SESIÓN
              </Text>
            </View>
          </View>

          {/* ── Campos ──────────────────────────────────────────────────── */}
          <View className="gap-5">

            {/* Email */}
            <View>
              <Text className="text-ink-secondary text-xs font-bold tracking-widest mb-2">
                NOMBRE DE USUARIO
              </Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="bg-navy-800 border border-navy-700 rounded-xl px-4 py-3.5 text-ink-primary text-sm"
                    placeholder="correo@ejemplo.com"
                    placeholderTextColor="#4B5563"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.email && (
                <Text className="text-danger text-xs mt-1">{errors.email.message}</Text>
              )}
            </View>

            {/* Contraseña */}
            <View>
              <Text className="text-ink-secondary text-xs font-bold tracking-widest mb-2">
                CONTRASEÑA
              </Text>
              <View className="relative">
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="bg-navy-800 border border-navy-700 rounded-xl px-4 py-3.5 text-ink-primary text-sm pr-12"
                      placeholder="••••••••"
                      placeholderTextColor="#4B5563"
                      secureTextEntry={!showPassword}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                <TouchableOpacity
                  className="absolute right-4 top-0 bottom-0 justify-center"
                  onPress={() => setShowPassword((p) => !p)}
                >
                  <Text className="text-ink-muted text-xs">
                    {showPassword ? 'OCULTAR' : 'VER'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text className="text-danger text-xs mt-1">{errors.password.message}</Text>
              )}
            </View>

            {/* Recuperar contraseña */}
            <TouchableOpacity className="self-end -mt-2">
              <Text className="text-accent text-xs">Recuperar contraseña</Text>
            </TouchableOpacity>

            {/* Error de API */}
            {apiError && (
              <View className="bg-danger/20 border border-danger rounded-xl px-4 py-3">
                <Text className="text-danger text-sm text-center">{apiError}</Text>
              </View>
            )}

            {/* Botón principal */}
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                className="bg-accent rounded-xl py-4 items-center mt-1"
                onPress={handleSubmit(onSubmit)}
                onPressIn={() => Animated.spring(btnScale, { toValue: 0.96, tension: 200, friction: 6, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(btnScale, { toValue: 1,    tension: 200, friction: 6, useNativeDriver: true }).start()}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#0D1B3E" />
                ) : (
                  <Text className="text-navy-900 font-bold text-sm tracking-widest">
                    INICIAR SESIÓN
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>

          </View>

          </Animated.View>{/* fin Animated.View formulario */}

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <Animated.View
            className="flex-row justify-center mt-10"
            style={{ opacity: formOpacity }}
          >
            <Text className="text-ink-secondary text-sm">¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/user-type')}>
              <Text className="text-accent text-sm font-bold">Regístrate</Text>
            </TouchableOpacity>
          </Animated.View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
