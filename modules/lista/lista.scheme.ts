// Zod de listas y del total estimado.
import { z } from "zod";

// Estados posibles de una lista.
export const estadoListaSchema = z.enum(["activa", "completada", "archivada"]);

/** Body de POST /grupos/:idGrupo/listas. */
export const crearListaBodySchema = z.object({
  nombre: z
    .string({ required_error: "El nombre de la lista es obligatorio" })
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede superar 100 caracteres")
    .trim(),
  descripcion: z
    .string()
    .max(250, "La descripción no puede superar 250 caracteres")
    .trim()
    .optional(),
});

// Edicion parcial + cambio de estado.
export const actualizarListaBodySchema = crearListaBodySchema.partial().extend({
  estado: estadoListaSchema.optional(),
});

/** Body de PATCH .../estado. */
export const cambiarEstadoListaBodySchema = z.object({
  estado: estadoListaSchema,
});

/** Lista expuesta en la API. */
export const listaRespuestaSchema = z.object({
  id_lista: z.number().int().positive(),
  id_grupo: z.number().int().positive(),
  id_usuario_creador: z.number().int().positive(),
  id_usuario_administrador: z.number().int().positive().nullable().optional(),
  nombre: z.string(),
  descripcion: z.string().nullable().optional(),
  estado: estadoListaSchema,
  fecha_creacion: z.string(),
  fecha_actualizacion: z.string(),
});

// Param :idLista como entero positivo.
export const idListaParamSchema = z.object({
  idLista: z
    .string()
    .transform((v) => Number(v))
    .pipe(z.number().int().positive()),
});

// Param :idGrupo para rutas anidadas.
export const idGrupoParamSchemaListas = z.object({
  idGrupo: z
    .string()
    .transform((v) => Number(v))
    .pipe(z.number().int().positive()),
});

/** Total en centavos y pesos + conteos. */
export const totalEstimadoRespuestaSchema = z.object({
  total_estimado_centavos: z.number().int().min(0),
  total_estimado_pesos: z.number().min(0),
  cantidad_items_con_precio: z.number().int().min(0),
  cantidad_items_total: z.number().int().min(0),
});

export type CrearListaBody = z.infer<typeof crearListaBodySchema>;
export type ActualizarListaBody = z.infer<typeof actualizarListaBodySchema>;
export type CambiarEstadoListaBody = z.infer<typeof cambiarEstadoListaBodySchema>;
/** Fila de lista. */
export type ListaDB = {
  id_lista: number;
  id_grupo: number;
  id_usuario_creador: number;
  id_usuario_administrador: number | null;
  nombre: string;
  descripcion: string | null;
  estado: "activa" | "completada" | "archivada";
  fecha_creacion: string;
  fecha_actualizacion: string;
};
export type ListaRespuesta = z.infer<typeof listaRespuestaSchema>;
export type TotalEstimadoRespuesta = z.infer<typeof totalEstimadoRespuestaSchema>;
