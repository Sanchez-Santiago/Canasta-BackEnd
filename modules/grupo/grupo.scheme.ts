import { z } from "zod";

export const tipoGrupoSchema = z.enum(["personal", "grupal"]);

export const crearGrupoGrupalBodySchema = z.object({
  nombre: z
    .string({ required_error: "El nombre del grupo es obligatorio" })
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede superar 100 caracteres")
    .trim(),
  descripcion: z
    .string()
    .max(250, "La descripción no puede superar 250 caracteres")
    .trim()
    .optional(),
  categoria: z
    .string()
    .max(100, "La categoría no puede superar 100 caracteres")
    .trim()
    .optional(),
});

export const actualizarGrupoGrupalBodySchema = crearGrupoGrupalBodySchema.partial();

export const grupoRespuestaSchema = z.object({
  id_grupo: z.number().int().positive(),
  nombre: z.string(),
  descripcion: z.string().nullable().optional(),
  categoria: z.string().nullable().optional(),
  tipo: tipoGrupoSchema,
  fecha_creacion: z.string(),
});

export const grupoConRolSchema = grupoRespuestaSchema.extend({
  rol: z.enum(["administrador", "miembro"]),
  fecha_ingreso: z.string(),
});

export const miembroGrupoSchema = z.object({
  id_usuario: z.number().int().positive(),
  nombre: z.string(),
  email: z.string().email(),
  rol: z.enum(["administrador", "miembro"]),
  fecha_ingreso: z.string(),
});

export const idGrupoParamSchema = z.object({
  idGrupo: z
    .string()
    .transform((v) => Number(v))
    .pipe(z.number().int().positive()),
});

export type CrearGrupoGrupalBody = z.infer<typeof crearGrupoGrupalBodySchema>;
export type ActualizarGrupoGrupalBody = z.infer<typeof actualizarGrupoGrupalBodySchema>;
export type GrupoDB = {
  id_grupo: number;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  tipo: "personal" | "grupal";
  fecha_creacion: string;
};
export type GrupoConRolDB = GrupoDB & {
  rol: "administrador" | "miembro";
  fecha_ingreso: string;
};
export type MiembroGrupoDB = {
  id_usuario: number;
  nombre: string;
  email: string;
  rol: "administrador" | "miembro";
  fecha_ingreso: string;
};
export type GrupoRespuesta = z.infer<typeof grupoRespuestaSchema>;
export type GrupoConRolRespuesta = z.infer<typeof grupoConRolSchema>;
export type MiembroGrupoRespuesta = z.infer<typeof miembroGrupoSchema>;
