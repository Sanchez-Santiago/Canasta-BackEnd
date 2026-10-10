// Zod de anuncios: tipo libre, titulo y descripcion opcional.
import { z } from "zod";

/** Body de POST /grupos/:idGrupo/notificaciones. */
export const crearNotificacionBodySchema = z.object({
  tipo: z
    .string({ required_error: "El tipo es obligatorio" })
    .min(2, "El tipo debe tener al menos 2 caracteres")
    .max(50, "El tipo no puede superar 50 caracteres")
    .trim(),
  titulo: z
    .string({ required_error: "El título es obligatorio" })
    .min(2, "El título debe tener al menos 2 caracteres")
    .max(100, "El título no puede superar 100 caracteres")
    .trim(),
  descripcion: z
    .string()
    .max(250, "La descripción no puede superar 250 caracteres")
    .trim()
    .optional(),
});

/** Anuncio expuesto en la API. */
export const notificacionRespuestaSchema = z.object({
  id_notificacion: z.number().int().positive(),
  id_grupo: z.number().int().positive(),
  tipo: z.string(),
  titulo: z.string(),
  descripcion: z.string().nullable().optional(),
  fecha_creacion: z.string(),
});

// Param :idNotificacion como entero positivo.
export const idNotificacionParamSchema = z.object({
  idNotificacion: z
    .string()
    .transform((v) => Number(v))
    .pipe(z.number().int().positive()),
});

// Param :idGrupo para rutas anidadas.
export const idGrupoParamSchemaNotificaciones = z.object({
  idGrupo: z
    .string()
    .transform((v) => Number(v))
    .pipe(z.number().int().positive()),
});

export type CrearNotificacionBody = z.infer<typeof crearNotificacionBodySchema>;
/** Fila de notificacion. */
export type NotificacionDB = {
  id_notificacion: number;
  id_grupo: number;
  tipo: string;
  titulo: string;
  descripcion: string | null;
  fecha_creacion: string;
};
export type NotificacionRespuesta = z.infer<typeof notificacionRespuestaSchema>;
