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
  Modal,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { signUpTaller, signUpProveedor } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';
import type { AuthUser } from '@/types/user';

// ══════════════════════════════════════════════════════════════════════════════
// TÉRMINOS Y CONDICIONES — ANFIAUTO
// ══════════════════════════════════════════════════════════════════════════════
const TERMINOS_Y_CONDICIONES = `TÉRMINOS Y CONDICIONES DE USO
Plataforma ANFIAUTO — Versión 1.0
Última actualización: mayo de 2026

I. GENERALIDADES

Bienvenido a ANFIAUTO, plataforma digital de intermediación entre conductores, talleres mecánicos y proveedores de repuestos automotrices, desarrollada y operada en Bolivia. Al completar el proceso de registro y utilizar esta aplicación, el usuario acepta de manera voluntaria, expresa e irrevocable los presentes Términos y Condiciones de Uso ("Términos"), así como la Política de Privacidad vigente.

Si el usuario no está de acuerdo con estos Términos, deberá abstenerse de utilizar la plataforma.

II. DESCRIPCIÓN DEL SERVICIO

ANFIAUTO es un marketplace digital que facilita la conexión entre:
a) Conductores que requieran asistencia mecánica o adquisición de repuestos automotrices;
b) Talleres mecánicos registrados que ofrecen servicios de reparación y mantenimiento;
c) Proveedores de repuestos y accesorios automotrices.

La plataforma actúa exclusivamente como intermediario tecnológico y no es parte de ninguna transacción económica directa entre los usuarios.

III. REGISTRO Y CUENTAS DE USUARIO

3.1. El registro requiere información verídica, completa y actualizada. El usuario es el único responsable de la veracidad de los datos proporcionados.

3.2. Los talleres y proveedores deberán completar un proceso de verificación que incluye la contratación y pago de un plan de suscripción.

3.3. ANFIAUTO se reserva el derecho de rechazar, suspender o cancelar cuentas que incumplan estos Términos, presenten información falsa o realicen actividades contrarias a la legalidad vigente en Bolivia.

3.4. El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso. ANFIAUTO no se hace responsable de accesos no autorizados derivados de negligencia del usuario.

IV. PLANES DE SUSCRIPCIÓN Y PAGOS

4.1. Los talleres y proveedores acceden a las funcionalidades completas de la plataforma mediante planes de suscripción de pago previo.

4.2. Los planes disponibles son:
   • Plan Mensual: 30 días de acceso
   • Plan Semestral: 180 días de acceso
   • Plan Anual: 365 días de acceso

4.3. El pago se realiza mediante transferencia bancaria o código QR proporcionado en la aplicación. El usuario asume la responsabilidad de efectuar el pago correctamente.

4.4. La activación de la cuenta está sujeta a la confirmación manual del pago por parte del equipo de ANFIAUTO.

4.5. No se realizan devoluciones ni reembolsos una vez activada la cuenta, salvo en casos excepcionales a criterio exclusivo de ANFIAUTO.

V. POLÍTICA DE APROBACIÓN DE CUENTAS

5.1. Una vez enviada la solicitud de registro junto con la confirmación de pago, el equipo de ANFIAUTO verificará la transacción en un plazo de 24 a 72 horas hábiles.

5.2. La cuenta permanecerá en estado "Pendiente de aprobación" hasta que el pago sea confirmado por el equipo administrativo.

5.3. El usuario recibirá una notificación a través de la aplicación una vez que su cuenta sea activada.

5.4. ANFIAUTO se reserva el derecho de solicitar documentación adicional para verificar la identidad del negocio registrado.

VI. RESPONSABILIDADES Y LIMITACIONES

6.1. ANFIAUTO no garantiza la disponibilidad ininterrumpida de la plataforma y podrá realizar mantenimientos programados o no programados.

6.2. La plataforma no se responsabiliza por la calidad de los servicios prestados por los talleres ni por la calidad o autenticidad de los productos comercializados por los proveedores.

6.3. ANFIAUTO no será responsable de daños directos, indirectos, incidentales o consecuentes derivados del uso o imposibilidad de uso de la plataforma.

VII. PROTECCIÓN DE DATOS PERSONALES

Los datos personales recopilados son tratados conforme a las disposiciones de la Ley N° 164 de Telecomunicaciones y Tecnologías de Información y Comunicación del Estado Plurinacional de Bolivia. ANFIAUTO se compromete a no ceder, vender ni transferir datos personales a terceros sin el consentimiento expreso del titular, salvo requerimiento de autoridad competente.

VIII. PROPIEDAD INTELECTUAL

Todos los contenidos, marcas, logotipos y elementos de diseño de ANFIAUTO son propiedad exclusiva de sus titulares y están protegidos por la legislación boliviana e internacional de propiedad intelectual. Queda prohibida su reproducción, distribución o uso sin autorización expresa.

IX. MODIFICACIONES A LOS TÉRMINOS

ANFIAUTO se reserva el derecho de modificar los presentes Términos en cualquier momento. Las modificaciones serán notificadas a los usuarios mediante la aplicación con al menos 15 días de anticipación a su entrada en vigor. El uso continuado de la plataforma tras la notificación implica la aceptación de los nuevos términos.

X. JURISDICCIÓN Y LEY APLICABLE

Para cualquier controversia derivada del uso de esta plataforma, las partes se someten expresamente a la jurisdicción de los tribunales competentes del Estado Plurinacional de Bolivia, con aplicación del derecho boliviano vigente.

Al marcar la casilla de aceptación, el usuario declara haber leído íntegramente, comprendido y aceptado los presentes Términos y Condiciones en su totalidad.`;

// ══════════════════════════════════════════════════════════════════════════════
// TIPOS Y CONSTANTES DE PLANES
// ══════════════════════════════════════════════════════════════════════════════
interface Plan {
  id_plan:     string | null;
  nombre:      string;
  precio:      number;
  descripcion: string | null;
  tiempo_dias: number | null;
}

const PLANES_DEFAULT: Plan[] = [
  { id_plan: null, nombre: 'Plan Mensual',   precio: 50,  descripcion: '30 días de acceso completo a la plataforma',                      tiempo_dias: 30  },
  { id_plan: null, nombre: 'Plan Semestral', precio: 250, descripcion: '6 meses de acceso · ahorra 50 Bs respecto al plan mensual',        tiempo_dias: 180 },
  { id_plan: null, nombre: 'Plan Anual',     precio: 450, descripcion: '12 meses de acceso · ahorra 150 Bs respecto al plan mensual',      tiempo_dias: 365 },
];

// ══════════════════════════════════════════════════════════════════════════════
// TIPO DE NEGOCIO
// ══════════════════════════════════════════════════════════════════════════════
type ShopType = 'taller' | 'proveedor' | 'ambos';

// ══════════════════════════════════════════════════════════════════════════════
// SCHEMA ZOD
// ══════════════════════════════════════════════════════════════════════════════
const shopSchema = z
  .object({
    email:            z.string().email('Email inválido'),
    ci:               z.string()
                        .min(5,  'Mínimo 5 caracteres')
                        .max(15, 'Máximo 15 caracteres')
                        .regex(/^[a-zA-Z0-9]+$/, 'Solo letras y números'),
    phone:            z.string()
                        .regex(/^\d{6,15}$/, 'Solo números, entre 6 y 15 dígitos')
                        .optional()
                        .or(z.literal('')),
    password:         z.string().min(6, 'Mínimo 6 caracteres'),
    confirmPassword:  z.string(),
    direccion:        z.string().optional(),
    correo:           z.string().email('Email inválido').optional().or(z.literal('')),
    telefono:         z.string().optional(),
    nombre_taller:    z.string().optional(),
    nombre_proveedor: z.string().optional(),
    servicio_remolque: z.boolean(),
    robot_check:      z.boolean()
                        .refine((v) => v === true, 'Debes confirmar que no eres un robot'),
  })
  .superRefine((d, ctx) => {
    if (d.password !== d.confirmPassword) {
      ctx.addIssue({
        code:    'custom',
        message: 'Las contraseñas no coinciden',
        path:    ['confirmPassword'],
      });
    }
  });

type ShopForm = z.infer<typeof shopSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTES AUXILIARES
// ══════════════════════════════════════════════════════════════════════════════
function FieldLabel({ children }: { children: string }) {
  return (
    <Text className="text-ink-secondary text-xs font-bold tracking-widest mb-2">
      {children}
    </Text>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <Text className="text-danger text-xs mt-1">{msg}</Text>;
}

function StyledInput(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor="#4B5563"
      className="bg-navy-800 border border-navy-700 rounded-xl px-4 py-3.5 text-ink-primary text-sm"
      {...props}
    />
  );
}

// ── Chip selector de tipo de negocio ────────────────────────────────────────
function TypeChip({
  type, label, selected, onSelect,
}: {
  type: ShopType;
  label: string;
  selected: boolean;
  onSelect: (t: ShopType) => void;
}) {
  return (
    <TouchableOpacity
      className={`flex-1 py-2.5 rounded-xl items-center border ${
        selected ? 'bg-accent border-accent' : 'bg-navy-800 border-navy-700'
      }`}
      onPress={() => onSelect(type)}
    >
      <Text className={`text-xs font-bold tracking-widest ${
        selected ? 'text-navy-900' : 'text-ink-secondary'
      }`}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── QR placeholder ──────────────────────────────────────────────────────────
const QR_S = 44;
const QR_D = 8;
const QR_I = 16;

function QrCorner({ style }: { style: object }) {
  return (
    <View style={[{ position: 'absolute', width: QR_S, height: QR_S, borderColor: '#0D1B3E', borderWidth: QR_D }, style]}>
      <View style={{ position: 'absolute', top: QR_D, left: QR_D, right: QR_D, bottom: QR_D, backgroundColor: '#0D1B3E' }} />
    </View>
  );
}

// Marcador visual de QR — reemplazar con <Image source={...} /> cuando estén los QR reales
function QrPlaceholder({ planName }: { planName: string }) {
  const dots: React.ReactNode[] = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if ((row + col) % 2 === 0) {
        dots.push(
          <View
            key={`${row}-${col}`}
            style={{
              position:        'absolute',
              width:           6,
              height:          6,
              backgroundColor: '#0D1B3E',
              borderRadius:    1,
              top:  72 + row * 10,
              left: 72 + col * 10,
            }}
          />
        );
      }
    }
  }

  return (
    <View style={{ width: 200, height: 200, backgroundColor: 'white', borderRadius: 12, padding: QR_I, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <QrCorner style={{ top: QR_I, left: QR_I }} />
      <QrCorner style={{ top: QR_I, right: QR_I }} />
      <QrCorner style={{ bottom: QR_I, left: QR_I }} />
      {dots}
      <Text style={{ color: '#0D1B3E', fontSize: 9, textAlign: 'center', marginTop: 60, fontWeight: 'bold', zIndex: 1 }}>
        QR DE PAGO{'\n'}{planName.toUpperCase()}
      </Text>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PANTALLA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function SignUpShopScreen() {
  const router  = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  // ── Estado del formulario base ─────────────────────────────────────────────
  const [shopType,    setShopType]    = useState<ShopType>('taller');
  const [apiError,    setApiError]    = useState<string | null>(null);
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Estado de suscripción / pago ───────────────────────────────────────────
  const [planes,         setPlanes]         = useState<Plan[]>(PLANES_DEFAULT);
  const [selectedPlan,   setSelectedPlan]   = useState<Plan | null>(null);
  const [openPlanNombre, setOpenPlanNombre] = useState<string | null>(null);
  const [termsAccepted,  setTermsAccepted]  = useState(false);

  // ── Estado de modales / flujo ──────────────────────────────────────────────
  const [showTermsModal,   setShowTermsModal]   = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing,     setIsProcessing]     = useState(false);
  const [isSuccess,        setIsSuccess]        = useState(false);

  // ── Animaciones de entrada ────────────────────────────────────────────────
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerSlide   = useRef(new Animated.Value(-16)).current;
  const logoScale     = useRef(new Animated.Value(0.7)).current;
  const logoOpacity   = useRef(new Animated.Value(0)).current;
  const formOpacity   = useRef(new Animated.Value(0)).current;
  const formSlide     = useRef(new Animated.Value(24)).current;

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

  // ── Cargar planes desde BD (fallback a hardcoded si no hay datos) ──────────
  useEffect(() => {
    supabase
      .from('planes')
      .select('id_plan, nombre, precio, descripcion, tiempo_dias')
      .then(({ data }) => {
        if (data && data.length > 0) setPlanes(data as Plan[]);
      });
  }, []);

  // ── React Hook Form ────────────────────────────────────────────────────────
  const {
    control,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<ShopForm>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      email:            '',
      ci:               '',
      phone:            '',
      password:         '',
      confirmPassword:  '',
      direccion:        '',
      correo:           '',
      telefono:         '',
      nombre_taller:    '',
      nombre_proveedor: '',
      servicio_remolque: false,
      robot_check:      false,
    },
  });

  const validateConditional = (data: ShopForm): string | null => {
    if ((shopType === 'taller'    || shopType === 'ambos') && !data.nombre_taller?.trim())
      return 'El nombre del taller es requerido';
    if ((shopType === 'proveedor' || shopType === 'ambos') && !data.nombre_proveedor?.trim())
      return 'El nombre del proveedor es requerido';
    return null;
  };

  // ── Envío real (llamado desde modal de confirmación) ──────────────────────
  const doRegistration = async (data: ShopForm) => {
    setShowPaymentModal(false);
    setIsProcessing(true);
    setApiError(null);

    const base = {
      email:    data.email,
      password: data.password,
      ci:       data.ci,
      phone:    data.phone || undefined,
    };

    let result: { user: AuthUser | null; error: string | null };

    if (shopType === 'taller') {
      result = await signUpTaller({
        ...base,
        nombre_taller:    data.nombre_taller!,
        direccion:        data.direccion,
        telefono:         data.telefono,
        correo:           data.correo,
        servicio_remolque: data.servicio_remolque,
        lat: 0, lng: 0,
      });
    } else if (shopType === 'proveedor') {
      result = await signUpProveedor({
        ...base,
        nombre_proveedor: data.nombre_proveedor!,
        direccion:        data.direccion,
        telefono:         data.telefono,
        correo:           data.correo,
        lat: 0, lng: 0,
      });
    } else {
      // AMBOS: taller + perfil proveedor
      result = await signUpTaller({
        ...base,
        nombre_taller:    data.nombre_taller!,
        direccion:        data.direccion,
        telefono:         data.telefono,
        correo:           data.correo,
        servicio_remolque: data.servicio_remolque,
        lat: 0, lng: 0,
      });
      if (!result.error && result.user) {
        await supabase.from('proveedor').insert({
          usuario_id:          result.user.id_usuario,
          nombre_proveedor:    data.nombre_proveedor!,
          direccion:           data.direccion ?? null,
          telefono:            data.telefono  ?? null,
          correo:              data.correo    ?? null,
          lat: 0, lng: 0,
          perfil_proveedor_url: null,
          banner_proveedor_url: null,
        });
      }
    }

    if (result.error || !result.user) {
      setApiError(result.error ?? 'Error al registrar');
      setIsProcessing(false);
      return;
    }

    // ── Insertar suscripción en estado "pendiente" (estado: false) ───────────
    if (selectedPlan) {
      const inicio = new Date();
      const fin    = new Date();
      fin.setDate(fin.getDate() + (selectedPlan.tiempo_dias ?? 30));

      await supabase.from('suscripcion').insert({
        usuario_id:      result.user.id_usuario,
        plan_id:         selectedPlan.id_plan,  // null si vino del fallback
        tipo:            selectedPlan.nombre,
        inicio:          inicio.toISOString(),
        fin:             fin.toISOString(),
        comprobante_url: null,
        estado:          false,                 // pendiente de aprobación
      });
    }

    setUser(result.user);
    setIsProcessing(false);
    setIsSuccess(true);
  };

  // ── Botón "FINALIZAR REGISTRO" → validar todo y abrir modal de confirmación ─
  const handlePaymentTap = async () => {
    setApiError(null);

    const isValid   = await trigger();
    const condError = validateConditional(getValues());

    if (!isValid || condError) {
      setApiError(condError ?? 'Completa todos los campos requeridos antes de continuar');
      return;
    }
    if (!selectedPlan) {
      setApiError('Selecciona un plan de suscripción');
      return;
    }
    if (!termsAccepted) {
      setApiError('Debes aceptar los Términos y Condiciones');
      return;
    }

    setShowPaymentModal(true);
  };

  const isTaller    = shopType === 'taller'    || shopType === 'ambos';
  const isProveedor = shopType === 'proveedor' || shopType === 'ambos';

  // ══════════════════════════════════════════════════════════════════════════
  // PANTALLA DE ÉXITO / APROBACIÓN PENDIENTE
  // ══════════════════════════════════════════════════════════════════════════
  if (isProcessing) {
    return (
      <View className="flex-1 bg-navy-900 items-center justify-center px-8">
        <ActivityIndicator size="large" color="#1DB88A" />
        <Text className="text-ink-secondary text-sm mt-6 text-center">
          Registrando tu cuenta…
        </Text>
      </View>
    );
  }

  if (isSuccess) {
    return (
      <View className="flex-1 bg-navy-900 items-center justify-center px-8">
        <StatusBar barStyle="light-content" backgroundColor="#0D1B3E" />
        <View className="w-24 h-24 rounded-full bg-accent/10 border-2 border-accent items-center justify-center mb-8">
          <Text style={{ fontSize: 40 }}>✓</Text>
        </View>
        <Text className="text-accent text-xl font-bold text-center tracking-widest mb-6">
          SOLICITUD ENVIADA
        </Text>
        <View className="bg-navy-800 border border-navy-700 rounded-2xl p-6">
          <Text className="text-ink-primary text-sm text-center leading-6">
            Su cuenta ha sido puesta a aprobación del pago, una vez confirmada se habilitará su cuenta, gracias por ser parte de{' '}
            <Text className="text-accent font-bold">ANFIAUTO</Text>.
          </Text>
        </View>
        <TouchableOpacity
          className="mt-10 border border-navy-700 rounded-xl px-8 py-3"
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text className="text-ink-secondary text-sm">Volver al inicio de sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FORMULARIO PRINCIPAL
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <>
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
          <View className="px-6 pt-12 pb-6">

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
                REGISTRO · TALLER / PROVEEDOR
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
                onPress={() => router.push('/(auth)/login')}
              >
                <Text className="text-ink-secondary text-xs font-bold tracking-widest">
                  INICIAR SESIÓN
                </Text>
              </TouchableOpacity>
            </View>

            {/* ════════════════════════════════════════════════════════════
                DATOS DEL USUARIO Y NEGOCIO
            ════════════════════════════════════════════════════════════ */}
            <View className="gap-5">

              {/* Email */}
              <View>
                <FieldLabel>NOMBRE DE USUARIO (EMAIL)</FieldLabel>
                <Controller control={control} name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <StyledInput placeholder="correo@ejemplo.com" keyboardType="email-address"
                      autoCapitalize="none" autoCorrect={false}
                      onBlur={onBlur} onChangeText={onChange} value={value} />
                  )} />
                <FieldError msg={errors.email?.message} />
              </View>

              {/* Dirección */}
              <View>
                <FieldLabel>DIRECCIÓN</FieldLabel>
                <Controller control={control} name="direccion"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <StyledInput placeholder="Av. Ejemplo 123, Ciudad"
                      onBlur={onBlur} onChangeText={onChange} value={value} />
                  )} />
                <FieldError msg={errors.direccion?.message} />
              </View>

              {/* Tipo de negocio */}
              <View>
                <FieldLabel>TIPO DE NEGOCIO</FieldLabel>
                <View className="flex-row gap-2">
                  <TypeChip type="taller"    label="TALLER"    selected={shopType === 'taller'}    onSelect={setShopType} />
                  <TypeChip type="ambos"     label="AMBOS"     selected={shopType === 'ambos'}     onSelect={setShopType} />
                  <TypeChip type="proveedor" label="PROVEEDOR" selected={shopType === 'proveedor'} onSelect={setShopType} />
                </View>
              </View>

              {/* Nombre Taller */}
              {isTaller && (
                <View>
                  <FieldLabel>NOMBRE DEL TALLER</FieldLabel>
                  <Controller control={control} name="nombre_taller"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <StyledInput placeholder="Mi Taller Mecánico"
                        onBlur={onBlur} onChangeText={onChange} value={value} />
                    )} />
                  <FieldError msg={errors.nombre_taller?.message} />
                </View>
              )}

              {/* Nombre Proveedor */}
              {isProveedor && (
                <View>
                  <FieldLabel>NOMBRE DEL NEGOCIO</FieldLabel>
                  <Controller control={control} name="nombre_proveedor"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <StyledInput placeholder="Mi Tienda de Repuestos"
                        onBlur={onBlur} onChangeText={onChange} value={value} />
                    )} />
                  <FieldError msg={errors.nombre_proveedor?.message} />
                </View>
              )}

              {/* Servicio remolque */}
              {isTaller && (
                <View>
                  <FieldLabel>SERVICIO DE REMOLQUE</FieldLabel>
                  <Controller control={control} name="servicio_remolque"
                    render={({ field: { onChange, value } }) => (
                      <View className="flex-row gap-3">
                        {([{ label: 'SÍ', val: true }, { label: 'NO', val: false }] as const).map(({ label, val }) => (
                          <TouchableOpacity key={label}
                            className={`flex-1 py-2.5 rounded-xl items-center border ${
                              value === val ? 'bg-accent border-accent' : 'bg-navy-800 border-navy-700'
                            }`}
                            onPress={() => onChange(val)}
                          >
                            <Text className={`text-xs font-bold tracking-widest ${
                              value === val ? 'text-navy-900' : 'text-ink-secondary'
                            }`}>{label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )} />
                </View>
              )}

              {/* Correo */}
              <View>
                <FieldLabel>CORREO DEL NEGOCIO</FieldLabel>
                <Controller control={control} name="correo"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <StyledInput placeholder="negocio@ejemplo.com" keyboardType="email-address"
                      autoCapitalize="none" onBlur={onBlur} onChangeText={onChange} value={value} />
                  )} />
                <FieldError msg={errors.correo?.message} />
              </View>

              {/* Teléfono negocio */}
              <View>
                <FieldLabel>TELÉFONO DEL NEGOCIO</FieldLabel>
                <Controller control={control} name="telefono"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <StyledInput placeholder="71234567" keyboardType="phone-pad"
                      onBlur={onBlur} onChangeText={onChange} value={value} />
                  )} />
                <FieldError msg={errors.telefono?.message} />
              </View>

              {/* CI */}
              <View>
                <FieldLabel>C.I. / CARNET DE IDENTIDAD</FieldLabel>
                <Controller control={control} name="ci"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <StyledInput placeholder="12345678" autoCapitalize="none"
                      onBlur={onBlur} onChangeText={onChange} value={value} />
                  )} />
                <FieldError msg={errors.ci?.message} />
              </View>

              {/* Teléfono personal */}
              <View>
                <FieldLabel>TELÉFONO PERSONAL</FieldLabel>
                <Controller control={control} name="phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <StyledInput placeholder="71234567" keyboardType="phone-pad"
                      onBlur={onBlur} onChangeText={onChange} value={value} />
                  )} />
                <FieldError msg={errors.phone?.message} />
              </View>

              {/* Contraseña */}
              <View>
                <FieldLabel>CONTRASEÑA</FieldLabel>
                <View className="relative">
                  <Controller control={control} name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput placeholderTextColor="#4B5563"
                        className="bg-navy-800 border border-navy-700 rounded-xl px-4 py-3.5 text-ink-primary text-sm pr-20"
                        placeholder="Mínimo 6 caracteres" secureTextEntry={!showPass}
                        onBlur={onBlur} onChangeText={onChange} value={value} />
                    )} />
                  <TouchableOpacity className="absolute right-4 top-0 bottom-0 justify-center"
                    onPress={() => setShowPass((p) => !p)}>
                    <Text className="text-ink-muted text-xs">{showPass ? 'OCULTAR' : 'VER'}</Text>
                  </TouchableOpacity>
                </View>
                <FieldError msg={errors.password?.message} />
              </View>

              {/* Repetir contraseña */}
              <View>
                <FieldLabel>REPETIR CONTRASEÑA</FieldLabel>
                <View className="relative">
                  <Controller control={control} name="confirmPassword"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput placeholderTextColor="#4B5563"
                        className="bg-navy-800 border border-navy-700 rounded-xl px-4 py-3.5 text-ink-primary text-sm pr-20"
                        placeholder="Repite tu contraseña" secureTextEntry={!showConfirm}
                        onBlur={onBlur} onChangeText={onChange} value={value} />
                    )} />
                  <TouchableOpacity className="absolute right-4 top-0 bottom-0 justify-center"
                    onPress={() => setShowConfirm((p) => !p)}>
                    <Text className="text-ink-muted text-xs">{showConfirm ? 'OCULTAR' : 'VER'}</Text>
                  </TouchableOpacity>
                </View>
                <FieldError msg={errors.confirmPassword?.message} />
              </View>

              {/* No soy un robot */}
              <Controller control={control} name="robot_check"
                render={({ field: { onChange, value } }) => (
                  <TouchableOpacity
                    className="flex-row items-center gap-3 bg-navy-800 border border-navy-700 rounded-xl px-4 py-3.5"
                    onPress={() => onChange(!value)} activeOpacity={0.8}
                  >
                    <View className={`w-5 h-5 rounded border-2 items-center justify-center ${
                      value ? 'bg-accent border-accent' : 'border-navy-600'
                    }`}>
                      {value ? <Text className="text-navy-900 text-xs font-bold">✓</Text> : null}
                    </View>
                    <Text className="text-ink-secondary text-sm">No soy un robot</Text>
                  </TouchableOpacity>
                )} />
              <FieldError msg={errors.robot_check?.message} />

              {/* ════════════════════════════════════════════════════════
                  SECCIÓN DE SUSCRIPCIÓN
              ════════════════════════════════════════════════════════ */}
              <View className="mt-4">
                <View className="flex-row items-center gap-3 mb-4">
                  <View className="flex-1 h-px bg-navy-700" />
                  <Text className="text-accent text-xs font-bold tracking-widest">
                    PLAN DE SUSCRIPCIÓN
                  </Text>
                  <View className="flex-1 h-px bg-navy-700" />
                </View>

                <Text className="text-ink-secondary text-xs text-center mb-4">
                  Selecciona tu plan, escanea el QR y realiza el pago
                </Text>

                {/* ── Acordeón de planes ──────────────────────────────── */}
                <View className="gap-3">
                  {planes.map((plan) => {
                    const isOpen     = openPlanNombre === plan.nombre;
                    const isSelected = selectedPlan?.nombre === plan.nombre;

                    return (
                      <View
                        key={plan.nombre}
                        className={`rounded-xl border overflow-hidden ${
                          isSelected ? 'border-accent' : 'border-navy-700'
                        }`}
                      >
                        {/* Cabecera del acordeón */}
                        <TouchableOpacity
                          className={`px-4 py-4 flex-row items-center justify-between ${
                            isSelected ? 'bg-accent/10' : 'bg-navy-800'
                          }`}
                          onPress={() => {
                            setSelectedPlan(plan);
                            setOpenPlanNombre(isOpen ? null : plan.nombre);
                          }}
                          activeOpacity={0.8}
                        >
                          <View className="flex-1">
                            <Text className={`text-sm font-bold ${isSelected ? 'text-accent' : 'text-ink-primary'}`}>
                              {plan.nombre.toUpperCase()}
                            </Text>
                            <Text className="text-ink-muted text-xs mt-0.5">
                              {plan.descripcion ?? ''}
                            </Text>
                          </View>
                          <View className="items-end ml-3">
                            <Text className={`text-base font-bold ${isSelected ? 'text-accent' : 'text-ink-primary'}`}>
                              {plan.precio} Bs.
                            </Text>
                            <Text className="text-ink-muted text-xs mt-0.5">
                              {isOpen ? '▲ cerrar' : '▼ ver QR'}
                            </Text>
                          </View>
                        </TouchableOpacity>

                        {/* Cuerpo del acordeón — QR y monto */}
                        {isOpen && (
                          <View className="bg-navy-800 border-t border-navy-700 px-4 pt-2 pb-6 items-center">
                            <Text className="text-ink-secondary text-xs text-center mb-4 mt-2">
                              Escanea el código QR para realizar el pago
                            </Text>

                            {/* QR placeholder — reemplazar con Image cuando estén los QR reales */}
                            <QrPlaceholder planName={plan.nombre} />

                            <View className="mt-5 items-center">
                              <Text className="text-ink-secondary text-xs tracking-widest mb-1">
                                MONTO A PAGAR
                              </Text>
                              <Text className="text-accent text-3xl font-bold">
                                {plan.precio} Bs.
                              </Text>
                              <Text className="text-ink-muted text-xs mt-1">
                                {plan.tiempo_dias} días de acceso
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* ── Términos y Condiciones ──────────────────────────────── */}
              <TouchableOpacity
                className={`flex-row items-center gap-3 rounded-xl px-4 py-3.5 border ${
                  termsAccepted ? 'bg-accent/10 border-accent' : 'bg-navy-800 border-navy-700'
                }`}
                onPress={() => setTermsAccepted((v) => !v)}
                activeOpacity={0.8}
              >
                <View className={`w-5 h-5 rounded border-2 items-center justify-center flex-shrink-0 ${
                  termsAccepted ? 'bg-accent border-accent' : 'border-navy-600'
                }`}>
                  {termsAccepted ? <Text className="text-navy-900 text-xs font-bold">✓</Text> : null}
                </View>
                <View className="flex-1 flex-row flex-wrap">
                  <Text className="text-ink-secondary text-sm">Acepto los </Text>
                  <TouchableOpacity onPress={() => setShowTermsModal(true)}>
                    <Text className="text-accent text-sm font-bold underline">
                      Términos y Condiciones
                    </Text>
                  </TouchableOpacity>
                  <Text className="text-ink-secondary text-sm"> de ANFIAUTO</Text>
                </View>
              </TouchableOpacity>

              {/* ── Botón finalizar registro ─────────────────────────────── */}
              <TouchableOpacity
                className="bg-accent rounded-xl py-4 items-center mt-1"
                onPress={handlePaymentTap}
                activeOpacity={0.8}
              >
                <Text className="text-navy-900 font-bold text-sm tracking-widest">
                  FINALIZAR REGISTRO
                </Text>
              </TouchableOpacity>

              {/* ── Error de API / validación ────────────────────────────── */}
              {apiError ? (
                <View className="bg-danger/20 border border-danger rounded-xl px-4 py-3">
                  <Text className="text-danger text-sm text-center">{apiError}</Text>
                </View>
              ) : null}

            </View>

            {/* ── Footer ──────────────────────────────────────────────── */}
            <View className="flex-row justify-center mt-8 mb-4">
              <Text className="text-ink-secondary text-sm">¿Ya tienes cuenta? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text className="text-accent text-sm font-bold">Inicia sesión</Text>
              </TouchableOpacity>
            </View>

            </Animated.View>

          </View>
        </ScrollView>

      </KeyboardAvoidingView>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL — TÉRMINOS Y CONDICIONES
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View className="flex-1 bg-navy-900">
          <View className="flex-row items-center px-6 pt-12 pb-4 border-b border-navy-700">
            <TouchableOpacity
              onPress={() => setShowTermsModal(false)}
              className="mr-4 w-8 h-8 rounded-full bg-navy-800 items-center justify-center"
            >
              <Text className="text-accent text-base">←</Text>
            </TouchableOpacity>
            <Text className="text-ink-primary text-sm font-bold tracking-widest flex-1">
              TÉRMINOS Y CONDICIONES
            </Text>
          </View>

          <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
            <Text className="text-ink-secondary text-sm leading-6 mb-8">
              {TERMINOS_Y_CONDICIONES}
            </Text>
          </ScrollView>

          <View className="px-6 pb-10 pt-4 border-t border-navy-700">
            <TouchableOpacity
              className="bg-accent rounded-xl py-4 items-center"
              onPress={() => {
                setTermsAccepted(true);
                setShowTermsModal(false);
              }}
              activeOpacity={0.8}
            >
              <Text className="text-navy-900 font-bold text-sm tracking-widest">
                ACEPTO LOS TÉRMINOS
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL — CONFIRMACIÓN DE PAGO
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showPaymentModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View className="flex-1 bg-navy-950/80 items-center justify-center px-8">
          <View className="bg-navy-800 border border-navy-700 rounded-2xl p-6 w-full">
            <Text className="text-ink-primary text-base font-bold text-center tracking-widest mb-2">
              ¿ESTÁ SEGURO DEL PAGO REALIZADO?
            </Text>
            {selectedPlan ? (
              <Text className="text-ink-secondary text-sm text-center mb-6">
                {selectedPlan.nombre} — {selectedPlan.precio} Bs.
              </Text>
            ) : null}

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 border border-navy-700 rounded-xl py-3.5 items-center"
                onPress={() => setShowPaymentModal(false)}
                activeOpacity={0.8}
              >
                <Text className="text-ink-secondary font-bold text-sm">NO</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-accent rounded-xl py-3.5 items-center"
                onPress={() => handleSubmit(doRegistration)()}
                activeOpacity={0.8}
              >
                <Text className="text-navy-900 font-bold text-sm">SÍ, CONFIRMAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
