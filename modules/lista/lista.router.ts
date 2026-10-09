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

const router = Router();

router.get(
  "/grupos/:idGrupo/listas",
  validate({ params: idGrupoParamSchemaListas }),
  obtenerListasPorGrupo
);
router.post(
  "/grupos/:idGrupo/listas",
  validate({ params: idGrupoParamSchemaListas, body: crearListaBodySchema }),
  crearLista
);

router.get(
  "/listas/:idLista",
  validate({ params: idListaParamSchema }),
  obtenerLista
);
router.put(
  "/listas/:idLista",
  validate({ params: idListaParamSchema, body: actualizarListaBodySchema }),
  actualizarLista
);
router.patch(
  "/listas/:idLista/estado",
  validate({ params: idListaParamSchema, body: cambiarEstadoListaBodySchema }),
  cambiarEstadoLista
);
router.delete(
  "/listas/:idLista",
  validate({ params: idListaParamSchema }),
  eliminarLista
);
router.get(
  "/listas/:idLista/total-estimado",
  validate({ params: idListaParamSchema }),
  obtenerTotalEstimado
);

export default router;
