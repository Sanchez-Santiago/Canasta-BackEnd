// HTTP del tablon y mapeo del error a status.
import type { Request, Response } from "express";
import {
  obtenerNotificacionesPorGrupoService,
  obtenerNotificacionPorIdService,
  eliminarNotificacionService,
  NotificacionError,
} from "./notificacion.service";
import { asyncHandler } from "../../shared/middlewares/asyncHandler";
import { ok } from "../../shared/utils/http";

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
