import { z } from "zod";

export const prioridadItemSchema = z.enum(["prioritario", "esencial", "secundario"]);
export const estadoItemSchema = z.enum(["pendiente", "comprado", "omitido"]);

export const crearProductoListaBodySchema = z.object({
  nombre: z
    .string({ required_error: "El nombre del producto es obligatorio" })
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(150, "El nombre no puede superar 150 caracteres")
    .trim(),
  descripcion: z
    .string()
    .max(250, "La descripción no puede superar 250 caracteres")
    .trim()
    .optional(),
  prioridad: prioridadItemSchema.optional(),
  cantidad: z
    .number({ required_error: "La cantidad es obligatoria" })
    .positive("La cantidad debe ser mayor a 0")
    .refine((v) => Number.isFinite(v), "Cantidad inválida"),
  precio_estimado_unitario: z
    .number()
    .int("El precio debe ser entero en centavos")
    .min(0, "El precio no puede ser negativo")
    .optional()
    .nullable(),
  codigo_producto: z
    .string()
    .max(50, "El código no puede superar 50 caracteres")
    .trim()
    .optional()
    .nullable(),
  estado: estadoItemSchema.optional(),
});

export const actualizarProductoListaBodySchema = crearProductoListaBodySchema.partial();

export const cambiarEstadoItemBodySchema = z.object({
  estado: estadoItemSchema,
});

export const productoListaRespuestaSchema = z.object({
  id_producto_lista: z.number().int().positive(),
  id_lista: z.number().int().positive(),
  id_usuario_creador: z.number().int().positive(),
  nombre: z.string(),
  descripcion: z.string().nullable().optional(),
  prioridad: prioridadItemSchema,
  cantidad: z.number(),
  precio_estimado_unitario: z.number().int().min(0).nullable().optional(),
  codigo_producto: z.string().nullable().optional(),
  estado: estadoItemSchema,
  fecha_creacion: z.string(),
});

export const idProductoListaParamSchema = z.object({
  idProductoLista: z
    .string()
    .transform((v) => Number(v))
    .pipe(z.number().int().positive()),
});

export const idListaParamSchemaItems = z.object({
  idLista: z
    .string()
    .transform((v) => Number(v))
    .pipe(z.number().int().positive()),
});

export type CrearProductoListaBody = z.infer<typeof crearProductoListaBodySchema>;
export type ActualizarProductoListaBody = z.infer<typeof actualizarProductoListaBodySchema>;
export type CambiarEstadoItemBody = z.infer<typeof cambiarEstadoItemBodySchema>;
export type ProductoListaDB = {
  id_producto_lista: number;
  id_lista: number;
  id_usuario_creador: number;
  nombre: string;
  descripcion: string | null;
  prioridad: "prioritario" | "esencial" | "secundario";
  cantidad: number;
  precio_estimado_unitario: number | null;
  codigo_producto: string | null;
  estado: "pendiente" | "comprado" | "omitido";
  fecha_creacion: string;
};
export type ProductoListaRespuesta = z.infer<typeof productoListaRespuestaSchema>;
