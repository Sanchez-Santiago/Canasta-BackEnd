// HTTP de items: params a numero y mapeo del error a status.
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

/** POST /listas/:idLista/productos -> 201. */
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

/** GET /listas/:idLista/productos. */
export const obtenerProductosPorLista = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idLista = Number(req.params.idLista);
  try {
    const r = await obtenerProductosPorListaService(
      req.user.idUsuario,
      idLista,
      req.query as any
    );
    return ok(res, r);
  } catch (err) {
    if (err instanceof ProductoListaError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});

/** GET /productos-lista/:idProductoLista. */
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

/** PUT /productos-lista/:idProductoLista. */
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

/** PATCH /productos-lista/:idProductoLista/estado. */
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

/** DELETE /productos-lista/:idProductoLista. */
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
