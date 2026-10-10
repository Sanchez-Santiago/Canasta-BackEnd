// Rutas del tablon (todas protegidas). Sin PUT: no se editan.
import { Router } from "express";
import { validate } from "../../shared/middlewares/validate";
import {
  crearNotificacionBodySchema,
  idNotificacionParamSchema,
  idGrupoParamSchemaNotificaciones,
} from "./notificacion.scheme";
import {
  crearNotificacion,
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
router.post(
  "/grupos/:idGrupo/notificaciones",
  validate({ params: idGrupoParamSchemaNotificaciones, body: crearNotificacionBodySchema }),
// Publicar.
  crearNotificacion
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
