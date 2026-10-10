// Zod de auth + forma publica del usuario (sin contrasena).
import { z } from "zod";

/** Body de POST /auth/registrar. */
export const registrarUsuarioBodySchema = z.object({
  nombre: z
    .string({ required_error: "El nombre es obligatorio" })
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede superar 100 caracteres")
    .trim(),
  email: z
    .string({ required_error: "El email es obligatorio" })
    .email("El email no es válido")
    .max(150, "El email no puede superar 150 caracteres")
    .toLowerCase()
    .trim(),
  contrasena: z
    .string({ required_error: "La contraseña es obligatoria" })
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100, "La contraseña no puede superar 100 caracteres"),
  localidad: z
    .string()
    .max(100, "La localidad no puede superar 100 caracteres")
    .trim()
    .optional(),
  provincia: z
    .string()
    .max(100, "La provincia no puede superar 100 caracteres")
    .trim()
    .optional(),
  pais: z
    .string()
    .max(100, "El país no puede superar 100 caracteres")
    .trim()
    .optional(),
  domicilio: z
    .string()
    .max(200, "El domicilio no puede superar 200 caracteres")
    .trim()
    .optional(),
});

/** Body de POST /auth/login. */
export const loginBodySchema = z.object({
  email: z
    .string({ required_error: "El email es obligatorio" })
    .email("El email no es válido")
    .toLowerCase()
    .trim(),
  contrasena: z
    .string({ required_error: "La contraseña es obligatoria" })
    .min(1, "La contraseña es obligatoria"),
});

/** Usuario expuesto en la API (nunca lleva el hash). */
export const usuarioRespuestaSchema = z.object({
  id_usuario: z.number().int().positive(),
  nombre: z.string(),
  email: z.string().email(),
  localidad: z.string().nullable().optional(),
  provincia: z.string().nullable().optional(),
  pais: z.string().nullable().optional(),
  domicilio: z.string().nullable().optional(),
  fecha_creacion: z.string(),
});

export const registrarUsuarioSchema = z.object({
  body: registrarUsuarioBodySchema,
});

export const loginSchema = z.object({
  body: loginBodySchema,
});

export type RegistrarUsuarioBody = z.infer<typeof registrarUsuarioBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type UsuarioRespuesta = z.infer<typeof usuarioRespuestaSchema>;

/** Fila de usuario (incluye hash: solo uso interno). */
export interface UsuarioDB {
  id_usuario: number;
  nombre: string;
  email: string;
  contrasena: string;
  localidad: string | null;
  provincia: string | null;
  pais: string | null;
  domicilio: string | null;
  fecha_creacion: string;
}
