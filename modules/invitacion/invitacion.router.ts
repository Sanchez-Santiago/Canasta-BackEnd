// Rutas de invitaciones (todas protegidas). Recibidas antes que :id.
import { Router } from "express";
import { validate } from "../../shared/middlewares/validate";
import {
  crearInvitacionBodySchema,
  responderInvitacionBodySchema,
  idInvitacionParamSchema,
  idGrupoParamSchemaInvitaciones,
} from "./invitacion.scheme";
import {
  crearInvitacion,
  obtenerInvitacionesPorGrupo,
  obtenerRecibidas,
  responderInvitacion,
  eliminarInvitacion,
} from "./invitacion.controller";

// Router del dominio (montado en index.ts).
const router = Router();

router.get(
  "/grupos/:idGrupo/invitaciones",
  validate({ params: idGrupoParamSchemaInvitaciones }),
// Listar del grupo.
  obtenerInvitacionesPorGrupo
);
router.post(
  "/grupos/:idGrupo/invitaciones",
  validate({ params: idGrupoParamSchemaInvitaciones, body: crearInvitacionBodySchema }),
// Invitar por email.
  crearInvitacion
);

// Mis pendientes.
router.get("/invitaciones/recibidas", obtenerRecibidas);
router.patch(
  "/invitaciones/:idInvitacion/responder",
  validate({ params: idInvitacionParamSchema, body: responderInvitacionBodySchema }),
// Aceptar o rechazar.
  responderInvitacion
);
router.delete(
  "/invitaciones/:idInvitacion",
  validate({ params: idInvitacionParamSchema }),
// Cancelar pendiente.
  eliminarInvitacion
);

export default router;
