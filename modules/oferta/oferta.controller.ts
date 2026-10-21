// HTTP del catalogo de ofertas: mapeo del error a status.
import type { Request, Response } from "express";
import {
  crearOfertaService,
  listarOfertasService,
  obtenerOfertaService,
  actualizarOfertaService,
  eliminarOfertaService,
  buscarOfertasService,
  listarOfertasDeProductoService,
  sincronizarOfertasDeProducto as sincronizarOfertasDeProductoService,
  eliminarVencidasService,
  OfertaError,
} from "./oferta.service";
import { asyncHandler } from "../../shared/middlewares/asyncHandler";
import { creado, ok } from "../../shared/utils/http";

/** Responde el error de dominio o lo propaga al middleware global. */
function responderError(err: unknown, res: Response): Response {
  if (err instanceof OfertaError) {
    return res.status(err.status).json({ ok: false, error: err.message });
  }
  throw err;
}

/** GET /ofertas/buscar -> busqueda en vivo (no persiste). */
export const buscarOfertas = asyncHandler(async (req: Request, res: Response) => {
  try {
    const r = await buscarOfertasService(req.query as any);
    return ok(res, r);
  } catch (err) {
    return responderError(err, res);
  }
});

/** GET /ofertas -> listado con filtros (DB). */
export const listarOfertas = asyncHandler(async (req: Request, res: Response) => {
  try {
    const r = await listarOfertasService(req.query as any);
    return ok(res, r);
  } catch (err) {
    return responderError(err, res);
  }
});

/** GET /ofertas/:idOferta -> detalle. */
export const obtenerOferta = asyncHandler(async (req: Request, res: Response) => {
  try {
    const idOferta = Number(req.params.idOferta);
    const r = await obtenerOfertaService(idOferta);
    return ok(res, r);
  } catch (err) {
    return responderError(err, res);
  }
});

/** POST /ofertas -> 201. */
export const crearOferta = asyncHandler(async (req: Request, res: Response) => {
  try {
    const r = await crearOfertaService(req.body);
    return creado(res, r);
  } catch (err) {
    return responderError(err, res);
  }
});

/** PUT /ofertas/:idOferta. */
export const actualizarOferta = asyncHandler(async (req: Request, res: Response) => {
  try {
    const idOferta = Number(req.params.idOferta);
    const r = await actualizarOfertaService(idOferta, req.body);
    return ok(res, r);
  } catch (err) {
    return responderError(err, res);
  }
});

/** DELETE /ofertas/:idOferta -> solo admin/creadores (o el sistema). */
export const eliminarOferta = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  try {
    const idOferta = Number(req.params.idOferta);
    const r = await eliminarOfertaService(req.user.idUsuario, idOferta);
    return ok(res, r);
  } catch (err) {
    return responderError(err, res);
  }
});

/** GET /productos-lista/:idProductoLista/ofertas -> ofertas guardadas. */
export const listarOfertasDeProducto = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
    try {
      const idProductoLista = Number(req.params.idProductoLista);
      const r = await listarOfertasDeProductoService(
        req.user.idUsuario,
        idProductoLista
      );
      return ok(res, r);
    } catch (err) {
      return responderError(err, res);
    }
  }
);

/** POST /productos-lista/:idProductoLista/ofertas -> re-buscar y guardar. */
export const sincronizarOfertasDeProducto = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
    try {
      const idProductoLista = Number(req.params.idProductoLista);
      const r = await sincronizarOfertasDeProductoService(
        idProductoLista,
        (req.body as { producto?: string } | undefined)?.producto
      );
      return ok(res, r);
    } catch (err) {
      return responderError(err, res);
    }
  }
);

/** DELETE /ofertas/vencidas -> limpieza manual (sistema). */
export const eliminarVencidas = asyncHandler(
  async (_req: Request, res: Response) => {
    try {
      const r = await eliminarVencidasService();
      return ok(res, r);
    } catch (err) {
      return responderError(err, res);
    }
  }
);
