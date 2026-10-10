// Zod de movimientos: tipo, monto en centavos y fecha manual.
import { z } from "zod";

// ingreso | gasto.
export const tipoMovimientoSchema = z.enum(["ingreso", "gasto"]);

// YYYY-MM-DD o con hora.
const fechaMovimientoRegex = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}(:\d{2})?)?$/;

/** Body de POST /grupos/:idGrupo/movimientos. */
export const crearMovimientoBodySchema = z.object({
  nombre: z
    .string({ required_error: "El nombre del movimiento es obligatorio" })
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede superar 100 caracteres")
    .trim(),
  monto: z
    .number({ required_error: "El monto es obligatorio" })
    .int("El monto debe ser entero en centavos")
    .min(0, "El monto no puede ser negativo"),
  descripcion: z
    .string()
    .max(250, "La descripción no puede superar 250 caracteres")
    .trim()
    .optional(),
  tipo: tipoMovimientoSchema,
  foto_url: z
    .string()
    .max(500, "La foto_url no puede superar 500 caracteres")
    .trim()
    .optional()
    .nullable(),
  fecha_movimiento: z
    .string({ required_error: "La fecha del movimiento es obligatoria" })
    .max(30, "La fecha no puede superar 30 caracteres")
    .trim()
    .regex(
      fechaMovimientoRegex,
      "Formato inválido: usar YYYY-MM-DD o YYYY-MM-DD HH:MM:SS"
    ),
});

// Edicion parcial.
export const actualizarMovimientoBodySchema = crearMovimientoBodySchema.partial();

// Filtro ?tipo=.
export const movimientosQuerySchema = z.object({
  tipo: tipoMovimientoSchema.optional(),
});

/** Movimiento expuesto. */
export const movimientoRespuestaSchema = z.object({
  id_movimiento: z.number().int().positive(),
  id_usuario_creador: z.number().int().positive(),
  id_grupo: z.number().int().positive(),
  nombre: z.string(),
  monto: z.number().int().min(0),
  descripcion: z.string().nullable().optional(),
  tipo: tipoMovimientoSchema,
  foto_url: z.string().nullable().optional(),
  fecha_movimiento: z.string(),
  fecha_creacion: z.string(),
});

// Param :idMovimiento como entero positivo.
export const idMovimientoParamSchema = z.object({
  idMovimiento: z
    .string()
    .transform((v) => Number(v))
    .pipe(z.number().int().positive()),
});

// Param :idGrupo para rutas anidadas.
export const idGrupoParamSchemaMovimientos = z.object({
  idGrupo: z
    .string()
    .transform((v) => Number(v))
    .pipe(z.number().int().positive()),
});

/** Resumen en centavos y pesos + conteo. */
export const resumenFinanzasRespuestaSchema = z.object({
  total_ingresos_centavos: z.number().int().min(0),
  total_ingresos_pesos: z.number().min(0),
  total_gastos_centavos: z.number().int().min(0),
  total_gastos_pesos: z.number().min(0),
  balance_centavos: z.number().int(),
  balance_pesos: z.number(),
  cantidad_movimientos: z.number().int().min(0),
});

export type CrearMovimientoBody = z.infer<typeof crearMovimientoBodySchema>;
export type ActualizarMovimientoBody = z.infer<typeof actualizarMovimientoBodySchema>;
export type MovimientosQuery = z.infer<typeof movimientosQuerySchema>;
/** Fila de movimiento. */
export type MovimientoDB = {
  id_movimiento: number;
  id_usuario_creador: number;
  id_grupo: number;
  nombre: string;
  monto: number;
  descripcion: string | null;
  tipo: "ingreso" | "gasto";
  foto_url: string | null;
  fecha_movimiento: string;
  fecha_creacion: string;
};
export type MovimientoRespuesta = z.infer<typeof movimientoRespuestaSchema>;
export type ResumenFinanzasRespuesta = z.infer<typeof resumenFinanzasRespuestaSchema>;
