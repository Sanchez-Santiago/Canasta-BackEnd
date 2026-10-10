// Zod de invitaciones: destino por email y respuesta.
import { z } from "zod";

// pendiente | aceptada | rechazada.
export const estadoInvitacionSchema = z.enum(["pendiente", "aceptada", "rechazada"]);

/** Body de POST: email del invitado. */
export const crearInvitacionBodySchema = z.object({
  email_destino: z
    .string({ required_error: "El email del invitado es obligatorio" })
    .email("El email no es válido")
    .max(150, "El email no puede superar 150 caracteres")
    .toLowerCase()
    .trim(),
});

/** Body de PATCH responder: aceptada o rechazada. */
export const responderInvitacionBodySchema = z.object({
  estado: z.enum(["aceptada", "rechazada"], {
    required_error: "Indicar aceptada o rechazada",
  }),
});

/** Invitacion con nombres y emails por JOIN. */
export const invitacionRespuestaSchema = z.object({
  id_invitacion: z.number().int().positive(),
  id_grupo: z.number().int().positive(),
  id_usuario_origen: z.number().int().positive(),
  nombre_origen: z.string().nullable().optional(),
  id_usuario_destino: z.number().int().positive(),
  email_destino: z.string().email(),
  nombre_destino: z.string().nullable().optional(),
  estado: estadoInvitacionSchema,
  fecha_creacion: z.string(),
  fecha_respuesta: z.string().nullable().optional(),
});

// Param :idInvitacion como entero positivo.
export const idInvitacionParamSchema = z.object({
  idInvitacion: z
    .string()
    .transform((v) => Number(v))
    .pipe(z.number().int().positive()),
});

// Param :idGrupo para rutas anidadas.
export const idGrupoParamSchemaInvitaciones = z.object({
  idGrupo: z
    .string()
    .transform((v) => Number(v))
    .pipe(z.number().int().positive()),
});

export type CrearInvitacionBody = z.infer<typeof crearInvitacionBodySchema>;
export type ResponderInvitacionBody = z.infer<typeof responderInvitacionBodySchema>;
/** Fila de invitacion con datos JOIN. */
export type InvitacionDB = {
  id_invitacion: number;
  id_usuario_origen: number;
  id_usuario_destino: number;
  id_grupo: number;
  estado: "pendiente" | "aceptada" | "rechazada";
  fecha_creacion: string;
  fecha_respuesta: string | null;
  nombre_origen: string | null;
  email_destino: string;
  nombre_destino: string | null;
};
export type InvitacionRespuesta = z.infer<typeof invitacionRespuestaSchema>;
