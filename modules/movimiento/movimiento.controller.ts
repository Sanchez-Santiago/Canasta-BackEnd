// HTTP de movimientos: query ?tipo= y mapeo del error a status.
import type { Request, Response } from "express";
import {
  crearMovimientoService,
  obtenerMovimientosPorGrupoService,
  obtenerMovimientoPorIdService,
  actualizarMovimientoService,
  eliminarMovimientoService,
  obtenerResumenService,
  MovimientoError,
} from "./movimiento.service";
import { asyncHandler } from "../../shared/middlewares/asyncHandler";
import { creado, ok } from "../../shared/utils/http";

/** POST /grupos/:idGrupo/movimientos -> 201. */
export const crearMovimiento = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idGrupo = Number(req.params.idGrupo);
  try {
    const r = await crearMovimientoService(req.user.idUsuario, idGrupo, req.body);
    return creado(res, r);
  } catch (err) {
    if (err instanceof MovimientoError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});

/** GET /grupos/:idGrupo/movimientos. */
export const obtenerMovimientosPorGrupo = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
    const idGrupo = Number(req.params.idGrupo);
    const tipo = (req.query as any)?.tipo as "ingreso" | "gasto" | undefined;
    try {
      const r = await obtenerMovimientosPorGrupoService(req.user.idUsuario, idGrupo, tipo);
      return ok(res, r);
    } catch (err) {
      if (err instanceof MovimientoError)
        return res.status(err.status).json({ ok: false, error: err.message });
      throw err;
    }
  }
);

/** GET /grupos/:idGrupo/movimientos/resumen. */
export const obtenerResumen = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idGrupo = Number(req.params.idGrupo);
  try {
    const r = await obtenerResumenService(req.user.idUsuario, idGrupo);
    return ok(res, r);
  } catch (err) {
    if (err instanceof MovimientoError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});

/** GET /movimientos/:idMovimiento. */
export const obtenerMovimiento = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idMovimiento = Number(req.params.idMovimiento);
  try {
    const r = await obtenerMovimientoPorIdService(req.user.idUsuario, idMovimiento);
    return ok(res, r);
  } catch (err) {
    if (err instanceof MovimientoError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});

/** PUT /movimientos/:idMovimiento. */
export const actualizarMovimiento = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idMovimiento = Number(req.params.idMovimiento);
  try {
    const r = await actualizarMovimientoService(req.user.idUsuario, idMovimiento, req.body);
    return ok(res, r);
  } catch (err) {
    if (err instanceof MovimientoError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});

/** DELETE /movimientos/:idMovimiento. */
export const eliminarMovimiento = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idMovimiento = Number(req.params.idMovimiento);
  try {
    const r = await eliminarMovimientoService(req.user.idUsuario, idMovimiento);
    return ok(res, r);
  } catch (err) {
    if (err instanceof MovimientoError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});
