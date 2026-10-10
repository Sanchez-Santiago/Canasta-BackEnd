// HTTP de ofertas: query a filtros y mapeo del error a status.
import type { Request, Response } from "express";
import {
  crearOfertaService,
  obtenerOfertasPorProductoService,
  obtenerOfertasPorListaService,
  obtenerOfertaPorIdService,
  actualizarOfertaService,
  eliminarOfertaService,
  OfertaError,
} from "./oferta.service";
import type { FiltrosOferta } from "./oferta.model";
import { asyncHandler } from "../../shared/middlewares/asyncHandler";
import { creado, ok } from "../../shared/utils/http";

function filtrosDesdeQuery(query: any): FiltrosOferta {
  const f: FiltrosOferta = {};
  if (query?.vigentes === "true") f.vigentes = true;
  if (typeof query?.localidad === "string" && query.localidad.trim() !== "") {
    f.localidad = query.localidad.trim();
  }
  if (typeof query?.provincia === "string" && query.provincia.trim() !== "") {
    f.provincia = query.provincia.trim();
  }
  return f;
}

/** POST /productos-lista/:idProductoLista/ofertas -> 201. */
export const crearOferta = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idProductoLista = Number(req.params.idProductoLista);
  try {
    const r = await crearOfertaService(req.user.idUsuario, idProductoLista, req.body);
    return creado(res, r);
  } catch (err) {
    if (err instanceof OfertaError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});

/** GET /productos-lista/:idProductoLista/ofertas. */
export const obtenerOfertasPorProducto = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
    const idProductoLista = Number(req.params.idProductoLista);
    try {
      const r = await obtenerOfertasPorProductoService(
        req.user.idUsuario,
        idProductoLista,
        filtrosDesdeQuery(req.query)
      );
      return ok(res, r);
    } catch (err) {
      if (err instanceof OfertaError)
        return res.status(err.status).json({ ok: false, error: err.message });
      throw err;
    }
  }
);

/** GET /listas/:idLista/ofertas. */
export const obtenerOfertasPorLista = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idLista = Number(req.params.idLista);
  try {
    const r = await obtenerOfertasPorListaService(
      req.user.idUsuario,
      idLista,
      filtrosDesdeQuery(req.query)
    );
    return ok(res, r);
  } catch (err) {
    if (err instanceof OfertaError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});

/** GET /ofertas/:idOferta. */
export const obtenerOferta = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idOferta = Number(req.params.idOferta);
  try {
    const r = await obtenerOfertaPorIdService(req.user.idUsuario, idOferta);
    return ok(res, r);
  } catch (err) {
    if (err instanceof OfertaError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});

/** PUT /ofertas/:idOferta. */
export const actualizarOferta = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idOferta = Number(req.params.idOferta);
  try {
    const r = await actualizarOfertaService(req.user.idUsuario, idOferta, req.body);
    return ok(res, r);
  } catch (err) {
    if (err instanceof OfertaError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});

/** DELETE /ofertas/:idOferta. */
export const eliminarOferta = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "No autorizado" });
  const idOferta = Number(req.params.idOferta);
  try {
    const r = await eliminarOfertaService(req.user.idUsuario, idOferta);
    return ok(res, r);
  } catch (err) {
    if (err instanceof OfertaError) return res.status(err.status).json({ ok: false, error: err.message });
    throw err;
  }
});
