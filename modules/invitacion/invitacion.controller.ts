// HTTP de invitaciones y mapeo del error a status.
import type { Request, Response } from "express";
import {
  crearInvitacionService,
  obtenerInvitacionesPorGrupoService,
  obtenerRecibidasService,
  responderInvitacionService,
  eliminarInvitacionService,
  InvitacionError,
} from "./invitacion.service";
import { asyncHandler } from "../../shared/middlewares/asyncHandler";
import { creado, ok } from "../../shared/utils/http";

/** POST /grupos/:idGrupo/invitaciones -> 201. */
export const crearInvitacion = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idGrupo = Number(req.params.idGrupo);
  try {
    const r = await crearInvitacionService(req.user.idUsuario, idGrupo, req.body);
    return creado(res, r);
  } catch (err) {
    if (err instanceof InvitacionError)
      return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});

/** GET /grupos/:idGrupo/invitaciones. */
export const obtenerInvitacionesPorGrupo = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
    const idGrupo = Number(req.params.idGrupo);
    try {
      const r = await obtenerInvitacionesPorGrupoService(req.user.idUsuario, idGrupo);
      return ok(res, r);
    } catch (err) {
      if (err instanceof InvitacionError)
        return res.status(err.status).json({ ok: false, error: err.message });
      throw err;
    }
  }
);

/** GET /invitaciones/recibidas. */
export const obtenerRecibidas = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const r = await obtenerRecibidasService(req.user.idUsuario);
  return ok(res, r);
});

/** PATCH /invitaciones/:idInvitacion/responder. */
export const responderInvitacion = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idInvitacion = Number(req.params.idInvitacion);
  try {
    const r = await responderInvitacionService(req.user.idUsuario, idInvitacion, req.body);
    return ok(res, r);
  } catch (err) {
    if (err instanceof InvitacionError)
      return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});

/** DELETE /invitaciones/:idInvitacion. */
export const eliminarInvitacion = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idInvitacion = Number(req.params.idInvitacion);
  try {
    const r = await eliminarInvitacionService(req.user.idUsuario, idInvitacion);
    return ok(res, r);
  } catch (err) {
    if (err instanceof InvitacionError)
      return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});
