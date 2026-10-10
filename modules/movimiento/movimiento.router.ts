// Rutas de movimientos (todas protegidas). Resumen antes que lista.
import { Router } from "express";
import { validate } from "../../shared/middlewares/validate";
import {
  crearMovimientoBodySchema,
  actualizarMovimientoBodySchema,
  movimientosQuerySchema,
  idMovimientoParamSchema,
  idGrupoParamSchemaMovimientos,
} from "./movimiento.scheme";
import {
  crearMovimiento,
  obtenerMovimientosPorGrupo,
  obtenerResumen,
  obtenerMovimiento,
  actualizarMovimiento,
  eliminarMovimiento,
} from "./movimiento.controller";

// Router del dominio (montado en index.ts).
const router = Router();

router.get(
  "/grupos/:idGrupo/movimientos/resumen",
  validate({ params: idGrupoParamSchemaMovimientos }),
// Resumen de finanzas.
  obtenerResumen
);
router.get(
  "/grupos/:idGrupo/movimientos",
  validate({ params: idGrupoParamSchemaMovimientos, query: movimientosQuerySchema }),
// Listar del grupo.
  obtenerMovimientosPorGrupo
);
router.post(
  "/grupos/:idGrupo/movimientos",
  validate({ params: idGrupoParamSchemaMovimientos, body: crearMovimientoBodySchema }),
// Crear en el grupo.
  crearMovimiento
);

router.get(
  "/movimientos/:idMovimiento",
  validate({ params: idMovimientoParamSchema }),
// Detalle.
  obtenerMovimiento
);
router.put(
  "/movimientos/:idMovimiento",
  validate({ params: idMovimientoParamSchema, body: actualizarMovimientoBodySchema }),
// Editar.
  actualizarMovimiento
);
router.delete(
  "/movimientos/:idMovimiento",
  validate({ params: idMovimientoParamSchema }),
// Eliminar.
  eliminarMovimiento
);

export default router;
