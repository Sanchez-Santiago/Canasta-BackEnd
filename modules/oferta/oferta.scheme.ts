// Zod del catalogo de ofertas scrapeadas + mapeo fila<->respuesta.
// Los arrays (categoria_ruta, cuotas, promos) se guardan como JSON en TEXT.
import { z } from "zod";

/** Fecha de vigencia: ISO 8601 o YYYY-MM-DD. */
const fechaSchema = z
  .string()
  .max(40, "La fecha no puede superar 40 caracteres")
  .trim()
  .refine((v) => !Number.isNaN(new Date(v).getTime()), {
    message: "Fecha inválida (usar ISO 8601 o YYYY-MM-DD)",
  });

/** Array de textos (se persiste como JSON). Acepta un string suelto. */
const listaTextoSchema = z
  .union([z.array(z.string().trim().min(1).max(200)), z.string().trim().min(1)])
  .transform((v) => (typeof v === "string" ? [v] : v))
  .nullable()
  .optional();

const noNegativo = (campo: string) =>
  z
    .number({ invalid_type_error: `${campo} debe ser un número` })
    .min(0, `${campo} no puede ser negativo`)
    .optional()
    .nullable();

/** Cuerpo de alta: fuente, producto y url son obligatorios. */
export const baseOfertaBodySchema = z.object({
  // Origen e identificación
  fuente: z
    .string({ required_error: "La fuente es obligatoria" })
    .min(1, "La fuente es obligatoria")
    .max(60, "La fuente no puede superar 60 caracteres")
    .trim(),
  comercio: z.string().max(120).trim().optional().nullable(),
  producto: z
    .string({ required_error: "El producto es obligatorio" })
    .min(2, "El producto debe tener al menos 2 caracteres")
    .max(300, "El producto no puede superar 300 caracteres")
    .trim(),
  url: z
    .string({ required_error: "La URL es obligatoria" })
    .url("La URL no es válida")
    .max(1000),
  producto_id: z.string().max(120).trim().optional().nullable(),

  // Precios (pesos)
  precio_lista_pesos: noNegativo("El precio de lista"),
  precio_oferta_pesos: noNegativo("El precio de oferta"),
  descuento_porc: z
    .number()
    .min(0, "El descuento no puede ser negativo")
    .max(100, "El descuento no puede superar 100")
    .optional()
    .nullable(),

  // Identificación y clasificación
  ean: z
    .string()
    .max(20)
    .trim()
    .regex(/^\d*$/, "El EAN debe contener solo dígitos")
    .optional()
    .nullable(),
  marca: z.string().max(120).trim().optional().nullable(),
  categoria: z.string().max(120).trim().optional().nullable(),
  categoria_ruta: listaTextoSchema,
  detalle: z.string().max(1000).trim().optional().nullable(),

  // Presentación
  precio_unidad: noNegativo("El precio por unidad"),
  unidad_medida: z
    .enum(["kg", "L"], { invalid_type_error: "La unidad debe ser 'kg' o 'L'" })
    .optional()
    .nullable(),

  // Imagen y disponibilidad
  imagen_url: z.string().url("La URL de imagen no es válida").max(1000).optional().nullable(),
  stock: z.number().int("El stock debe ser entero").min(0, "El stock no puede ser negativo").optional().nullable(),
  disponible: z.boolean().optional(),

  // Ubicación
  ubicacion: z.string().max(200).trim().optional().nullable(),
  localidad: z.string().max(100).trim().optional().nullable(),
  provincia: z.string().max(100).trim().optional().nullable(),

  // Vigencia
  fecha_inicio: fechaSchema.optional().nullable(),
  fecha_fin: fechaSchema.optional().nullable(),

  // Beneficios y condiciones
  cuotas: listaTextoSchema,
  reintegro: z.string().max(120).trim().optional().nullable(),
  promos: listaTextoSchema,
  tipo_promo: z.string().max(60).trim().optional().nullable(),

  // Vincular la oferta a un producto de lista (opcional; null = catalogo global).
  id_producto_lista: z
    .number()
    .int()
    .positive("El id de producto de lista debe ser positivo")
    .optional()
    .nullable(),

  // Control de extracción
  fecha_captura: fechaSchema.optional(),
});

/** Alta: si vienen ambas fechas, fin > inicio. */
export const crearOfertaBodySchema = baseOfertaBodySchema.refine(
  (d) =>
    !d.fecha_inicio || !d.fecha_fin || new Date(d.fecha_fin) > new Date(d.fecha_inicio),
  {
    message: "La fecha de fin debe ser posterior a la de inicio",
    path: ["fecha_fin"],
  }
);

/** Edición parcial: valida las fechas solo si vienen las dos. */
export const actualizarOfertaBodySchema = baseOfertaBodySchema
  .partial()
  .refine(
    (d) =>
      !d.fecha_inicio || !d.fecha_fin || new Date(d.fecha_fin) > new Date(d.fecha_inicio),
    {
      message: "La fecha de fin debe ser posterior a la de inicio",
      path: ["fecha_fin"],
    }
  );

/** Filtros del listado (DB). */
export const listarOfertasQuerySchema = z.object({
  fuente: z.string().max(60).trim().optional(),
  comercio: z.string().max(120).trim().optional(),
  ean: z.string().max(20).trim().optional(),
  marca: z.string().max(120).trim().optional(),
  categoria: z.string().max(120).trim().optional(),
  producto: z.string().max(300).trim().optional(),
  localidad: z.string().max(100).trim().optional(),
  provincia: z.string().max(100).trim().optional(),
  id_producto_lista: z.coerce.number().int().positive().optional(),
  vigentes: z.enum(["true", "false"]).optional(),
  disponible: z.enum(["true", "false"]).optional(),
  limite: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

/** Param :idProductoLista como entero positivo. */
export const idProductoListaParamOfertasSchema = z.object({
  idProductoLista: z
    .string()
    .transform((v) => Number(v))
    .pipe(z.number().int().positive()),
});

/** Body opcional de la sincronizacion: override del termino de busqueda. */
export const sincronizarOfertasBodySchema = z
  .object({
    producto: z
      .string()
      .min(2, "El término de búsqueda debe tener al menos 2 caracteres")
      .max(100, "El término no puede superar 100 caracteres")
      .trim()
      .optional(),
  })
  .optional();

/** Query del buscador en vivo. Los conectores ("0"/"1") llegan como string. */
const booleanoQuery = z
  .enum(["true", "false", "1", "0"])
  .optional()
  .transform((v) => v === "true" || v === "1");

export const buscarOfertasQuerySchema = z.object({
  producto: z
    .string({ required_error: "El término 'producto' es obligatorio" })
    .min(2, "El término debe tener al menos 2 caracteres")
    .max(100, "El término no puede superar 100 caracteres")
    .trim(),
  limite: z.coerce.number().int().min(1).max(50).optional().default(10),
  mercados: z.string().max(200).trim().optional(),
  categoria: z.string().max(120).trim().optional(),
  localidad: z.string().max(100).trim().optional(),
  provincia: z.string().max(100).trim().optional(),
  min_desc: z.coerce.number().min(0).max(100).optional(),
  min_precio: z.coerce.number().min(0).optional(),
  max_precio: z.coerce.number().min(0).optional(),
  orden: z.enum(["1", "2", "3", "4"]).optional(),
  exacto: booleanoQuery,
  parecidos: booleanoQuery,
  agotados: booleanoQuery,
  solo_ofertas: booleanoQuery,
});

/** Param :idOferta como entero positivo. */
export const idOfertaParamSchema = z.object({
  idOferta: z
    .string()
    .transform((v) => Number(v))
    .pipe(z.number().int().positive()),
});

/** Fila cruda de la tabla. */
export type OfertaDB = {
  id: number;
  fuente: string;
  comercio: string | null;
  producto: string;
  url: string;
  producto_id: string | null;
  precio_lista_pesos: number | null;
  precio_oferta_pesos: number | null;
  descuento_porc: number | null;
  ean: string | null;
  marca: string | null;
  categoria: string | null;
  categoria_ruta: string | null;
  detalle: string | null;
  precio_unidad: number | null;
  unidad_medida: string | null;
  imagen_url: string | null;
  stock: number | null;
  disponible: number;
  ubicacion: string | null;
  localidad: string | null;
  provincia: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  cuotas: string | null;
  reintegro: string | null;
  promos: string | null;
  tipo_promo: string | null;
  fecha_captura: string;
  creado_en: string;
  actualizado_en: string;
  /** Vinculo con la lista del usuario (NULL = catalogo global). */
  id_producto_lista: number | null;
};

/** Oferta tal como se devuelve por la API (arrays ya parseados). */
export type OfertaRespuesta = Omit<
  OfertaDB,
  "categoria_ruta" | "cuotas" | "promos" | "disponible"
> & {
  categoria_ruta: string[] | null;
  cuotas: string[] | null;
  promos: string[] | null;
  disponible: boolean;
};

/** Parsea un TEXT con JSON array; devuelve null si no aplica. */
export function parsearListaJson(raw: string | null): string[] | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as string[]) : null;
  } catch {
    return null;
  }
}

/** Serializa un array a JSON para guardar en TEXT. */
export function serializarListaJson(v?: string[] | null): string | null {
  return v && v.length > 0 ? JSON.stringify(v) : null;
}

/** Fila -> respuesta pública. */
export function aOfertaRespuesta(o: OfertaDB): OfertaRespuesta {
  return {
    ...o,
    categoria_ruta: parsearListaJson(o.categoria_ruta),
    cuotas: parsearListaJson(o.cuotas),
    promos: parsearListaJson(o.promos),
    disponible: o.disponible === 1,
  };
}

export type CrearOfertaBody = z.infer<typeof crearOfertaBodySchema>;
export type ActualizarOfertaBody = z.infer<typeof actualizarOfertaBodySchema>;
export type ListarOfertasQuery = z.infer<typeof listarOfertasQuerySchema>;
export type BuscarOfertasQuery = z.infer<typeof buscarOfertasQuerySchema>;
