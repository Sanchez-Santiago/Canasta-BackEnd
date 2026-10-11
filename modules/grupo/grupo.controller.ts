// HTTP de grupos: auth via req.user y mapeo de GrupoError a status.
import type { Request, Response } from "express";
import {
  crearGrupoGrupalService,
  obtenerMisGruposService,
  obtenerGrupoPorIdService,
  obtenerMiembrosDeGrupoService,
  actualizarGrupoGrupalService,
  eliminarGrupoGrupalService,
  expulsarMiembroService,
  abandonarGrupoService,
  GrupoError,
} from "./grupo.service";
import { asyncHandler } from "../../shared/middlewares/asyncHandler";
import { creado, ok } from "../../shared/utils/http";

/** POST /grupos/grupal -> 201. */
export const crearGrupal = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  try {
    const r = await crearGrupoGrupalService(req.user.idUsuario, req.body);
    return creado(res, r);
  } catch (err) {
    if (err instanceof GrupoError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});

/** GET /grupos. */
export const obtenerMisGrupos = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const r = await obtenerMisGruposService(req.user.idUsuario);
  return ok(res, r);
});

/** GET /grupos/:idGrupo. */
export const obtenerGrupo = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idGrupo = Number(req.params.idGrupo);
  try {
    const r = await obtenerGrupoPorIdService(req.user.idUsuario, idGrupo);
    return ok(res, r);
  } catch (err) {
    if (err instanceof GrupoError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});

/** GET /grupos/:idGrupo/miembros. */
export const obtenerMiembros = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idGrupo = Number(req.params.idGrupo);
  try {
    const r = await obtenerMiembrosDeGrupoService(req.user.idUsuario, idGrupo);
    return ok(res, r);
  } catch (err) {
    if (err instanceof GrupoError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});

/** PUT /grupos/:idGrupo. */
export const actualizarGrupal = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idGrupo = Number(req.params.idGrupo);
  try {
    const r = await actualizarGrupoGrupalService(req.user.idUsuario, idGrupo, req.body);
    return ok(res, r);
  } catch (err) {
    if (err instanceof GrupoError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});

/** DELETE /grupos/:idGrupo. */
export const eliminarGrupal = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idGrupo = Number(req.params.idGrupo);
  try {
    const r = await eliminarGrupoGrupalService(req.user.idUsuario, idGrupo);
    return ok(res, r);
  } catch (err) {
    if (err instanceof GrupoError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});

/** DELETE /grupos/:idGrupo/miembros/:idUsuario: expulsa (admin). */
export const expulsarMiembro = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idGrupo = Number(req.params.idGrupo);
  const idUsuarioObjetivo = Number(req.params.idUsuario);
  try {
    const r = await expulsarMiembroService(req.user.idUsuario, idGrupo, idUsuarioObjetivo);
    return ok(res, r);
  } catch (err) {
    if (err instanceof GrupoError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});

/** DELETE /grupos/:idGrupo/miembros/yo: abandona el grupo. */
export const abandonarGrupo = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idGrupo = Number(req.params.idGrupo);
  try {
    const r = await abandonarGrupoService(req.user.idUsuario, idGrupo);
    return ok(res, r);
  } catch (err) {
    if (err instanceof GrupoError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});
