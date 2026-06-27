import { z } from 'zod';

// CI boliviano: entre 5 y 15 caracteres alfanuméricos
const ciSchema = z
  .string()
  .min(5, 'El CI debe tener al menos 5 caracteres')
  .max(15, 'El CI no puede tener más de 15 caracteres')
  .regex(/^[a-zA-Z0-9]+$/, 'El CI solo puede contener letras y números');

// Teléfono: solo dígitos, entre 6 y 15 caracteres (opcional)
const phoneSchema = z
  .string()
  .regex(/^\d{6,15}$/, 'Solo números, entre 6 y 15 dígitos')
  .optional()
  .or(z.literal(''));

const passwordSchema = z
  .string()
  .min(6, 'La contraseña debe tener al menos 6 caracteres');

// ─── Login ───────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: passwordSchema,
});
export type LoginForm = z.infer<typeof loginSchema>;

// ─── Registro Conductor ──────────────────────────────────────────────────────
// Mapea a: usuario.name, usuario.email, usuario.ci, usuario.phone, usuario.type = 'conductor'
export const signUpConductorSchema = z
  .object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'Nombre demasiado largo'),
    email: z.string().email('Email inválido'),
    ci: ciSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });
export type SignUpConductorForm = z.infer<typeof signUpConductorSchema>;

// ─── Registro Taller ─────────────────────────────────────────────────────────
// Mapea a: usuario.* + taller.nombre_taller, taller.direccion,
//          taller.telefono, taller.servicio_remolque, taller.lat, taller.lng
export const signUpTallerSchema = z
  .object({
    email: z.string().email('Email inválido'),
    ci: ciSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    nombre_taller: z.string().min(3, 'Nombre del taller requerido'),
    direccion: z.string().optional(),
    telefono: z.string().optional(),
    servicio_remolque: z.boolean().default(false),
    lat: z.number(),
    lng: z.number(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });
export type SignUpTallerForm = z.infer<typeof signUpTallerSchema>;

// ─── Registro Proveedor ──────────────────────────────────────────────────────
// Mapea a: usuario.* + proveedor.nombre_proveedor, proveedor.direccion,
//          proveedor.telefono, proveedor.lat, proveedor.lng
export const signUpProveedorSchema = z
  .object({
    email: z.string().email('Email inválido'),
    ci: ciSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    nombre_proveedor: z.string().min(3, 'Nombre del negocio requerido'),
    direccion: z.string().optional(),
    telefono: z.string().optional(),
    lat: z.number(),
    lng: z.number(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });
export type SignUpProveedorForm = z.infer<typeof signUpProveedorSchema>;
