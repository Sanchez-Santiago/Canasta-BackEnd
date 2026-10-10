// Zod de ofertas: comercio, fechas, descuento y precios en centavos.
import { z } from "zod";

const fechaOfertaRegex = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}(:\d{2})?)?$/;

// Fecha YYYY-MM-DD o con hora.
const fechaOfertaSchema = z
  .string({ required_error: "La fecha es obligatoria" })
  .max(30, "La fecha no puede superar 30 caracteres")
  .trim()
  .regex(fechaOfertaRegex, "Formato inválido: usar YYYY-MM-DD o YYYY-MM-DD HH:MM:SS");

/** Campos comunes (crear exige fechas; ver refines). */
export const baseOfertaBodySchema = z.object({
    nombre_comercio: z
      .string({ required_error: "El nombre del comercio es obligatorio" })
      .min(2, "El nombre del comercio debe tener al menos 2 caracteres")
      .max(100, "El nombre del comercio no puede superar 100 caracteres")
      .trim(),
    ubicacion: z
      .string()
      .max(200, "La ubicación no puede superar 200 caracteres")
      .trim()
      .optional(),
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
    latitud: z
      .number()
      .min(-90, "Latitud inválida")
      .max(90, "Latitud inválida")
      .optional()
      .nullable(),
    longitud: z
      .number()
      .min(-180, "Longitud inválida")
      .max(180, "Longitud inválida")
      .optional()
      .nullable(),
    fecha_inicio: fechaOfertaSchema,
    fecha_fin: fechaOfertaSchema,
    porcentaje_descuento: z
      .number()
      .min(0, "El descuento no puede ser negativo")
      .max(100, "El descuento no puede superar 100")
      .optional()
      .nullable(),
    precio_original: z
      .number()
      .int("El precio debe ser entero en centavos")
      .min(0, "El precio no puede ser negativo")
      .optional()
      .nullable(),
    precio_oferta: z
      .number()
      .int("El precio debe ser entero en centavos")
      .min(0, "El precio no puede ser negativo")
      .optional()
      .nullable(),
    descripcion: z
      .string()
      .max(250, "La descripción no puede superar 250 caracteres")
      .trim()
      .optional(),
  });

/** Alta: exige fin posterior a inicio. */
export const crearOfertaBodySchema = baseOfertaBodySchema.refine(
  (d) => d.fecha_fin > d.fecha_inicio,
  {
    message: "La fecha de fin debe ser posterior a la de inicio",
    path: ["fecha_fin"],
  }
);

// Parcial: valida fechas solo si vienen ambas.
export const actualizarOfertaBodySchema = baseOfertaBodySchema
  .partial()
  .refine(
    (d) =>
      d.fecha_inicio === undefined ||
      d.fecha_fin === undefined ||
      d.fecha_fin > d.fecha_inicio,
    {
      message: "La fecha de fin debe ser posterior a la de inicio",
      path: ["fecha_fin"],
    }
  );

// Filtros ?vigentes y localidad/provincia.
export const ofertasQuerySchema = z.object({
  vigentes: z.enum(["true", "false"]).optional(),
  localidad: z.string().max(100).trim().optional(),
  provincia: z.string().max(100).trim().optional(),
});

/** Oferta expuesta. */
export const ofertaRespuestaSchema = z.object({
  id_oferta: z.number().int().positive(),
  id_producto_lista: z.number().int().positive(),
  nombre_comercio: z.string(),
  ubicacion: z.string().nullable().optional(),
  localidad: z.string().nullable().optional(),
  provincia: z.string().nullable().optional(),
  latitud: z.number().nullable().optional(),
  longitud: z.number().nullable().optional(),
  fecha_inicio: z.string(),
  fecha_fin: z.string(),
  porcentaje_descuento: z.number().nullable().optional(),
  precio_original: z.number().int().min(0).nullable().optional(),
  precio_oferta: z.number().int().min(0).nullable().optional(),
  descripcion: z.string().nullable().optional(),
  fecha_creacion: z.string(),
});

// Param :idOferta como entero positivo.
export const idOfertaParamSchema = z.object({
  idOferta: z
    .string()
    .transform((v) => Number(v))
    .pipe(z.number().int().positive()),
});

// Param :idProductoLista para rutas anidadas.
export const idProductoParamSchemaOfertas = z.object({
  idProductoLista: z
    .string()
    .transform((v) => Number(v))
    .pipe(z.number().int().positive()),
});

// Param :idLista para rutas anidadas.
export const idListaParamSchemaOfertas = z.object({
  idLista: z
    .string()
    .transform((v) => Number(v))
    .pipe(z.number().int().positive()),
});

export type CrearOfertaBody = z.infer<typeof crearOfertaBodySchema>;
export type ActualizarOfertaBody = z.infer<typeof actualizarOfertaBodySchema>;
export type OfertasQuery = z.infer<typeof ofertasQuerySchema>;
/** Fila de oferta. */
export type OfertaDB = {
  id_oferta: number;
  id_producto_lista: number;
  nombre_comercio: string;
  ubicacion: string | null;
  localidad: string | null;
  provincia: string | null;
  latitud: number | null;
  longitud: number | null;
  fecha_inicio: string;
  fecha_fin: string;
  porcentaje_descuento: number | null;
  precio_original: number | null;
  precio_oferta: number | null;
  descripcion: string | null;
  fecha_creacion: string;
};
export type OfertaRespuesta = z.infer<typeof ofertaRespuestaSchema>;
