// HTTP del tablon y mapeo del error a status.
import type { Request, Response } from "express";
import {
  crearNotificacionService,
  obtenerNotificacionesPorGrupoService,
  obtenerNotificacionPorIdService,
  eliminarNotificacionService,
  NotificacionError,
} from "./notificacion.service";
import { asyncHandler } from "../../shared/middlewares/asyncHandler";
import { creado, ok } from "../../shared/utils/http";

/** POST /grupos/:idGrupo/notificaciones -> 201. */
export const crearNotificacion = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idGrupo = Number(req.params.idGrupo);
  try {
    const r = await crearNotificacionService(req.user.idUsuario, idGrupo, req.body);
    return creado(res, r);
  } catch (err) {
    if (err instanceof NotificacionError)
      return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});

/** GET /grupos/:idGrupo/notificaciones. */
export const obtenerNotificacionesPorGrupo = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
    const idGrupo = Number(req.params.idGrupo);
    try {
      const r = await obtenerNotificacionesPorGrupoService(req.user.idUsuario, idGrupo);
      return ok(res, r);
    } catch (err) {
      if (err instanceof NotificacionError)
        return res.status(err.status).json({ ok: false, error: err.message });
      throw err;
    }
  }
);

/** GET /notificaciones/:idNotificacion. */
export const obtenerNotificacion = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idNotificacion = Number(req.params.idNotificacion);
  try {
    const r = await obtenerNotificacionPorIdService(req.user.idUsuario, idNotificacion);
    return ok(res, r);
  } catch (err) {
    if (err instanceof NotificacionError)
      return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});

/** DELETE /notificaciones/:idNotificacion. */
export const eliminarNotificacion = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idNotificacion = Number(req.params.idNotificacion);
  try {
    const r = await eliminarNotificacionService(req.user.idUsuario, idNotificacion);
    return ok(res, r);
  } catch (err) {
    if (err instanceof NotificacionError)
      return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});
