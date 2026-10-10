// Rutas de listas (todas protegidas).
import { Router } from "express";
import { validate } from "../../shared/middlewares/validate";
import {
  crearListaBodySchema,
  actualizarListaBodySchema,
  cambiarEstadoListaBodySchema,
  idListaParamSchema,
  idGrupoParamSchemaListas,
} from "./lista.scheme";
import {
  crearLista,
  obtenerListasPorGrupo,
  obtenerLista,
  actualizarLista,
  cambiarEstadoLista,
  eliminarLista,
  obtenerTotalEstimado,
} from "./lista.controller";

// Router del dominio (montado en index.ts).
const router = Router();

router.get(
  "/grupos/:idGrupo/listas",
  validate({ params: idGrupoParamSchemaListas }),
// Listar del grupo.
  obtenerListasPorGrupo
);
router.post(
  "/grupos/:idGrupo/listas",
  validate({ params: idGrupoParamSchemaListas, body: crearListaBodySchema }),
// Crear en el grupo.
  crearLista
);

router.get(
  "/listas/:idLista",
  validate({ params: idListaParamSchema }),
// Detalle.
  obtenerLista
);
router.put(
  "/listas/:idLista",
  validate({ params: idListaParamSchema, body: actualizarListaBodySchema }),
// Editar.
  actualizarLista
);
router.patch(
  "/listas/:idLista/estado",
  validate({ params: idListaParamSchema, body: cambiarEstadoListaBodySchema }),
// Cambiar estado.
  cambiarEstadoLista
);
router.delete(
  "/listas/:idLista",
  validate({ params: idListaParamSchema }),
// Eliminar.
  eliminarLista
);
router.get(
  "/listas/:idLista/total-estimado",
  validate({ params: idListaParamSchema }),
// Total estimado.
  obtenerTotalEstimado
);

export default router;
