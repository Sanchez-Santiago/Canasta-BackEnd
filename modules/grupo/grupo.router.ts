import { Router } from "express";
import { validate } from "../../shared/middlewares/validate";
import {
  crearGrupoGrupalBodySchema,
  actualizarGrupoGrupalBodySchema,
  idGrupoParamSchema,
} from "./grupo.scheme";
import {
  crearGrupal,
  obtenerMisGrupos,
  obtenerGrupo,
  obtenerMiembros,
  actualizarGrupal,
  eliminarGrupal,
} from "./grupo.controller";

const router = Router();

router.get("/", obtenerMisGrupos);
router.post(
  "/grupal",
  validate({ body: crearGrupoGrupalBodySchema }),
  crearGrupal
);
router.get(
  "/:idGrupo/miembros",
  validate({ params: idGrupoParamSchema }),
  obtenerMiembros
);
router.get(
  "/:idGrupo",
  validate({ params: idGrupoParamSchema }),
  obtenerGrupo
);
router.put(
  "/:idGrupo",
  validate({ params: idGrupoParamSchema, body: actualizarGrupoGrupalBodySchema }),
  actualizarGrupal
);
router.delete(
  "/:idGrupo",
  validate({ params: idGrupoParamSchema }),
  eliminarGrupal
);

export default router;
