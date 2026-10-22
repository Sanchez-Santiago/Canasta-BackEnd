// Zod de notificaciones: las genera el sistema, no una persona.
import { z } from "zod";

/** Tipos que puede emitir el sistema (mismo enum que `shared/eventos`). */
export const tipoSistemaSchema = z.enum([
  "producto_agregado",
  "producto_estado",
  "oferta_encontrada",
  "invitacion_recibida",
  "invitacion_respondida",
  "movimiento_agregado",
]);

/** Notificacion expuesta en la API. */
export const notificacionRespuestaSchema = z.object({
  id_notificacion: z.number().int().positive(),
  id_grupo: z.number().int().positive(),
  tipo: tipoSistemaSchema,
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

export type NotificacionDB = {
  id_notificacion: number;
  id_grupo: number;
  tipo: string;
  titulo: string;
  descripcion: string | null;
  fecha_creacion: string;
};
export type NotificacionRespuesta = z.infer<typeof notificacionRespuestaSchema>;
