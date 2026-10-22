// Rutas del tablon (todas protegidas). Las crea el sistema; no hay POST.
import { Router } from "express";
import { validate } from "../../shared/middlewares/validate";
import {
  idNotificacionParamSchema,
  idGrupoParamSchemaNotificaciones,
} from "./notificacion.scheme";
import {
  obtenerNotificacionesPorGrupo,
  obtenerNotificacion,
  eliminarNotificacion,
} from "./notificacion.controller";

// Router del dominio (montado en index.ts).
const router = Router();

router.get(
  "/grupos/:idGrupo/notificaciones",
  validate({ params: idGrupoParamSchemaNotificaciones }),
// Listar del grupo.
  obtenerNotificacionesPorGrupo
);

router.get(
  "/notificaciones/:idNotificacion",
  validate({ params: idNotificacionParamSchema }),
// Detalle.
  obtenerNotificacion
);
router.delete(
  "/notificaciones/:idNotificacion",
  validate({ params: idNotificacionParamSchema }),
// Borrar.
  eliminarNotificacion
);

export default router;
