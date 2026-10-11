// Rutas /grupos (todas protegidas). Miembros va antes que :idGrupo.
import { Router } from "express";
import { validate } from "../../shared/middlewares/validate";
import {
  crearGrupoGrupalBodySchema,
  actualizarGrupoGrupalBodySchema,
  idGrupoParamSchema,
  idMiembroParamSchema,
} from "./grupo.scheme";
import {
  crearGrupal,
  obtenerMisGrupos,
  obtenerGrupo,
  obtenerMiembros,
  actualizarGrupal,
  eliminarGrupal,
  expulsarMiembro,
  abandonarGrupo,
} from "./grupo.controller";

// Router del dominio (montado en index.ts).
const router = Router();

// Mis grupos.
router.get("/", obtenerMisGrupos);
router.post(
  "/grupal",
  validate({ body: crearGrupoGrupalBodySchema }),
// Crear grupal.
  crearGrupal
);
router.get(
  "/:idGrupo/miembros",
  validate({ params: idGrupoParamSchema }),
// Miembros con rol.
  obtenerMiembros
);
// Abandonar (literal "yo" antes que :idUsuario para no caer en el param).
router.delete(
  "/:idGrupo/miembros/yo",
  validate({ params: idGrupoParamSchema }),
// Salir del grupo grupal.
  abandonarGrupo
);
// Expulsar un miembro (solo admin).
router.delete(
  "/:idGrupo/miembros/:idUsuario",
  validate({ params: idMiembroParamSchema }),
// Expulsar miembro.
  expulsarMiembro
);
router.get(
  "/:idGrupo",
  validate({ params: idGrupoParamSchema }),
// Detalle con mi rol.
  obtenerGrupo
);
router.put(
  "/:idGrupo",
  validate({ params: idGrupoParamSchema, body: actualizarGrupoGrupalBodySchema }),
// Editar (valida body parcial).
  actualizarGrupal
);
router.delete(
  "/:idGrupo",
  validate({ params: idGrupoParamSchema }),
// Eliminar.
  eliminarGrupal
);

export default router;
