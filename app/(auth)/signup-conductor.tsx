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
import { z } from 'zod';
import { signUpConductor } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';

// ── Schema del formulario ─────────────────────────────────────────────────────
// Campos que se guardan en BD → usuario.email, usuario.ci, usuario.phone
// password/confirmPassword solo para Supabase Auth (no se almacena en usuario)
// robot_check es validación UI (no se persiste)
const conductorFormSchema = z
  .object({
    name:            z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'Nombre demasiado largo'),
    email:           z.string().email('Email inválido'),
    ci:              z
                       .string()
                       .min(5, 'El CI debe tener al menos 5 caracteres')
                       .max(15, 'El CI no puede tener más de 15 caracteres')
                       .regex(/^[a-zA-Z0-9]+$/, 'Solo letras y números'),
    phone:           z
                       .string()
                       .regex(/^\d{6,15}$/, 'Solo números, entre 6 y 15 dígitos')
                       .optional()
                       .or(z.literal('')),
    password:        z.string().min(6, 'Mínimo 6 caracteres'),
    confirmPassword: z.string(),
    robot_check:     z
                       .boolean()
                       .refine((v) => v === true, 'Debes confirmar que no eres un robot'),
  })
  .superRefine((d, ctx) => {
    if (d.password !== d.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Las contraseñas no coinciden',
        path: ['confirmPassword'],
      });
    }
  });

type ConductorForm = z.infer<typeof conductorFormSchema>;

// ── Componentes auxiliares ────────────────────────────────────────────────────
function FieldWrapper({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View>
      <Text className="text-ink-secondary text-xs font-bold tracking-widest mb-2">
        {label}
      </Text>
      {children}
      {error ? (
        <Text className="text-danger text-xs mt-1">{error}</Text>
      ) : null}
    </View>
  );
}

// ── Pantalla ──────────────────────────────────────────────────────────────────
export default function SignUpConductorScreen() {
  const router  = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const [apiError,    setApiError]    = useState<string | null>(null);
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Animaciones de entrada ────────────────────────────────────────────────
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerSlide   = useRef(new Animated.Value(-16)).current;
  const logoScale     = useRef(new Animated.Value(0.7)).current;
  const logoOpacity   = useRef(new Animated.Value(0)).current;
  const formOpacity   = useRef(new Animated.Value(0)).current;
  const formSlide     = useRef(new Animated.Value(24)).current;
  const btnScale      = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(70, [
      Animated.parallel([
        Animated.timing(headerOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(headerSlide,   { toValue: 0, tension: 80,  friction: 9, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(logoScale,   { toValue: 1, tension: 55, friction: 6, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 230, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(formSlide,   { toValue: 0, tension: 65, friction: 9, useNativeDriver: true }),
        Animated.timing(formOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConductorForm>({
    resolver: zodResolver(conductorFormSchema),
    defaultValues: {
      name:            '',
      email:           '',
      ci:              '',
      phone:           '',
      password:        '',
      confirmPassword: '',
      robot_check:     false,
    },
  });

  const onSubmit = async (data: ConductorForm) => {
    setApiError(null);

    const { user, error } = await signUpConductor({
      name:     data.name,
      email:    data.email,
      password: data.password,
      ci:       data.ci,
      phone:    data.phone || undefined,
    });

    if (error || !user) {
      setApiError(error ?? 'Error al registrar');
      return;
    }

    setUser(user);
    router.replace('/(conductor)/dashboard');
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
        <View className="flex-1 px-6 pt-12 pb-10">

          {/* ── Header ──────────────────────────────────────────────── */}
          <Animated.View
            className="flex-row items-center mb-6"
            style={{ opacity: headerOpacity, transform: [{ translateX: headerSlide }] }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-3 w-8 h-8 rounded-full bg-navy-800 items-center justify-center"
            >
              <Text className="text-accent text-base">←</Text>
            </TouchableOpacity>
            <Text className="text-ink-primary text-sm font-bold tracking-widest flex-1">
              REGISTRO · CONDUCTOR
            </Text>
          </Animated.View>

          {/* ── Logo ────────────────────────────────────────────────── */}
          <Animated.View
            className="items-center mb-6"
            style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}
          >
            <View className="w-20 h-20 rounded-full border-2 border-accent overflow-hidden bg-navy-800">
              <Image
                source={require('../../assets/images/AMANTES DE LOS FIERROS LOGO PEQUE.jpeg')}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: formOpacity, transform: [{ translateY: formSlide }] }}>

          {/* ── Tabs ────────────────────────────────────────────────── */}
          <View className="flex-row mb-8">
            <View className="flex-1 py-3 items-center border-b-2 border-accent">
              <Text className="text-accent text-xs font-bold tracking-widest">REGISTRO</Text>
            </View>
            <TouchableOpacity
              className="flex-1 py-3 items-center border-b border-navy-700"
              onPress={() => router.replace('/(auth)/login')}
            >
              <Text className="text-ink-secondary text-xs font-bold tracking-widest">
                INICIAR SESIÓN
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Campos BD: usuario.email ─────────────────────────────── */}
          <View className="gap-5">

            {/* ── Campo BD: usuario.name ───────────────────────────── */}
            <FieldWrapper label="NOMBRE COMPLETO" error={errors.name?.message}>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholderTextColor="#4B5563"
                    className="bg-navy-800 border border-navy-700 rounded-xl px-4 py-3.5 text-ink-primary text-sm"
                    placeholder="Juan Pérez"
                    autoCapitalize="words"
                    autoCorrect={false}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
            </FieldWrapper>

            <FieldWrapper label="CORREO ELECTRÓNICO" error={errors.email?.message}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholderTextColor="#4B5563"
                    className="bg-navy-800 border border-navy-700 rounded-xl px-4 py-3.5 text-ink-primary text-sm"
                    placeholder="correo@ejemplo.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
            </FieldWrapper>

            {/* ── Campo BD: usuario.ci ─────────────────────────────── */}
            <FieldWrapper label="C.I. / CARNET DE IDENTIDAD" error={errors.ci?.message}>
              <Controller
                control={control}
                name="ci"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholderTextColor="#4B5563"
                    className="bg-navy-800 border border-navy-700 rounded-xl px-4 py-3.5 text-ink-primary text-sm"
                    placeholder="12345678"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
            </FieldWrapper>

            {/* ── Campo BD: usuario.phone ──────────────────────────── */}
            <FieldWrapper label="TELÉFONO" error={errors.phone?.message}>
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholderTextColor="#4B5563"
                    className="bg-navy-800 border border-navy-700 rounded-xl px-4 py-3.5 text-ink-primary text-sm"
                    placeholder="71234567"
                    keyboardType="phone-pad"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
            </FieldWrapper>

            {/* ── Contraseña (Supabase Auth, no se almacena en usuario) */}
            <FieldWrapper label="CONTRASEÑA" error={errors.password?.message}>
              <View className="relative">
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      placeholderTextColor="#4B5563"
                      className="bg-navy-800 border border-navy-700 rounded-xl px-4 py-3.5 text-ink-primary text-sm pr-20"
                      placeholder="Mínimo 6 caracteres"
                      secureTextEntry={!showPass}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                <TouchableOpacity
                  className="absolute right-4 top-0 bottom-0 justify-center"
                  onPress={() => setShowPass((p) => !p)}
                >
                  <Text className="text-ink-muted text-xs">
                    {showPass ? 'OCULTAR' : 'VER'}
                  </Text>
                </TouchableOpacity>
              </View>
            </FieldWrapper>

            <FieldWrapper label="REPETIR CONTRASEÑA" error={errors.confirmPassword?.message}>
              <View className="relative">
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      placeholderTextColor="#4B5563"
                      className="bg-navy-800 border border-navy-700 rounded-xl px-4 py-3.5 text-ink-primary text-sm pr-20"
                      placeholder="Repite tu contraseña"
                      secureTextEntry={!showConfirm}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                <TouchableOpacity
                  className="absolute right-4 top-0 bottom-0 justify-center"
                  onPress={() => setShowConfirm((p) => !p)}
                >
                  <Text className="text-ink-muted text-xs">
                    {showConfirm ? 'OCULTAR' : 'VER'}
                  </Text>
                </TouchableOpacity>
              </View>
            </FieldWrapper>

            {/* ── Checkbox "No soy un robot" ───────────────────────── */}
            <Controller
              control={control}
              name="robot_check"
              render={({ field: { onChange, value } }) => (
                <TouchableOpacity
                  className="flex-row items-center gap-3 bg-navy-800 border border-navy-700 rounded-xl px-4 py-3.5"
                  onPress={() => onChange(!value)}
                  activeOpacity={0.8}
                >
                  <View
                    className={`w-5 h-5 rounded border-2 items-center justify-center ${
                      value ? 'bg-accent border-accent' : 'border-navy-600'
                    }`}
                  >
                    {value ? (
                      <Text className="text-navy-900 text-xs font-bold">✓</Text>
                    ) : null}
                  </View>
                  <Text className="text-ink-secondary text-sm">No soy un robot</Text>
                </TouchableOpacity>
              )}
            />
            {errors.robot_check ? (
              <Text className="text-danger text-xs -mt-3">
                {errors.robot_check.message}
              </Text>
            ) : null}

            {/* ── Error de API ─────────────────────────────────────── */}
            {apiError ? (
              <View className="bg-danger/20 border border-danger rounded-xl px-4 py-3">
                <Text className="text-danger text-sm text-center">{apiError}</Text>
              </View>
            ) : null}

            {/* ── Botón registrar ──────────────────────────────────── */}
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
                    REGISTRAR
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>

          </View>

          {/* ── Resumen de campos BD (visible solo en dev) ─────────── */}
          {/* usuario.email, usuario.ci, usuario.phone → type='conductor' */}

          {/* ── Footer ──────────────────────────────────────────────── */}
          <View className="flex-row justify-center mt-8">
            <Text className="text-ink-secondary text-sm">¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text className="text-accent text-sm font-bold">Inicia sesión</Text>
            </TouchableOpacity>
          </View>

          </Animated.View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
