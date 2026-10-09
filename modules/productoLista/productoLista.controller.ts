import type { Request, Response } from "express";
import {
  crearProductoListaService,
  obtenerProductosPorListaService,
  obtenerProductoListaPorIdService,
  actualizarProductoListaService,
  cambiarEstadoItemService,
  eliminarProductoListaService,
  ProductoListaError,
} from "./productoLista.service";
import { asyncHandler } from "../../shared/middlewares/asyncHandler";
import { creado, ok } from "../../shared/utils/http";

export const crearProducto = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idLista = Number(req.params.idLista);
  try {
    const r = await crearProductoListaService(req.user.idUsuario, idLista, req.body);
    return creado(res, r);
  } catch (err) {
    if (err instanceof ProductoListaError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});

export const obtenerProductosPorLista = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idLista = Number(req.params.idLista);
  try {
    const r = await obtenerProductosPorListaService(req.user.idUsuario, idLista);
    return ok(res, r);
  } catch (err) {
    if (err instanceof ProductoListaError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});

export const obtenerProducto = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idProductoLista = Number(req.params.idProductoLista);
  try {
    const r = await obtenerProductoListaPorIdService(req.user.idUsuario, idProductoLista);
    return ok(res, r);
  } catch (err) {
    if (err instanceof ProductoListaError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});

export const actualizarProducto = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idProductoLista = Number(req.params.idProductoLista);
  try {
    const r = await actualizarProductoListaService(req.user.idUsuario, idProductoLista, req.body);
    return ok(res, r);
  } catch (err) {
    if (err instanceof ProductoListaError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});

export const cambiarEstadoProducto = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idProductoLista = Number(req.params.idProductoLista);
  try {
    const r = await cambiarEstadoItemService(req.user.idUsuario, idProductoLista, req.body);
    return ok(res, r);
  } catch (err) {
    if (err instanceof ProductoListaError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});

export const eliminarProducto = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idProductoLista = Number(req.params.idProductoLista);
  try {
    const r = await eliminarProductoListaService(req.user.idUsuario, idProductoLista);
    return ok(res, r);
  } catch (err) {
    if (err instanceof ProductoListaError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});
