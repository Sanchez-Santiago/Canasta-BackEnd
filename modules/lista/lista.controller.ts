import type { Request, Response } from "express";
import {
  crearListaService,
  obtenerListasPorGrupoService,
  obtenerListaPorIdService,
  actualizarListaService,
  cambiarEstadoListaService,
  eliminarListaService,
  obtenerTotalEstimadoService,
  ListaError,
} from "./lista.service";
import { asyncHandler } from "../../shared/middlewares/asyncHandler";
import { creado, ok } from "../../shared/utils/http";

export const crearLista = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idGrupo = Number(req.params.idGrupo);
  try {
    const r = await crearListaService(req.user.idUsuario, idGrupo, req.body);
    return creado(res, r);
  } catch (err) {
    if (err instanceof ListaError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});

export const obtenerListasPorGrupo = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idGrupo = Number(req.params.idGrupo);
  try {
    const r = await obtenerListasPorGrupoService(req.user.idUsuario, idGrupo);
    return ok(res, r);
  } catch (err) {
    if (err instanceof ListaError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});

export const obtenerLista = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idLista = Number(req.params.idLista);
  try {
    const r = await obtenerListaPorIdService(req.user.idUsuario, idLista);
    return ok(res, r);
  } catch (err) {
    if (err instanceof ListaError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});

export const actualizarLista = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idLista = Number(req.params.idLista);
  try {
    const r = await actualizarListaService(req.user.idUsuario, idLista, req.body);
    return ok(res, r);
  } catch (err) {
    if (err instanceof ListaError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});

export const cambiarEstadoLista = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idLista = Number(req.params.idLista);
  try {
    const r = await cambiarEstadoListaService(req.user.idUsuario, idLista, req.body);
    return ok(res, r);
  } catch (err) {
    if (err instanceof ListaError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});

export const eliminarLista = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idLista = Number(req.params.idLista);
  try {
    const r = await eliminarListaService(req.user.idUsuario, idLista);
    return ok(res, r);
  } catch (err) {
    if (err instanceof ListaError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});

export const obtenerTotalEstimado = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idLista = Number(req.params.idLista);
  try {
    const r = await obtenerTotalEstimadoService(req.user.idUsuario, idLista);
    return ok(res, r);
  } catch (err) {
    if (err instanceof ListaError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});
