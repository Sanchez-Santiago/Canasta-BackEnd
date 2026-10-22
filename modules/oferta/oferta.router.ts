// Rutas del catalogo de ofertas (todas protegidas por el auth global).
import { Router } from "express";
import { validate } from "../../shared/middlewares/validate";
import {
  crearOfertaBodySchema,
  actualizarOfertaBodySchema,
  listarOfertasQuerySchema,
  buscarOfertasQuerySchema,
  idOfertaParamSchema,
  idProductoListaParamOfertasSchema,
  sincronizarOfertasBodySchema,
} from "./oferta.scheme";
import {
  buscarOfertas,
  listarOfertas,
  obtenerOferta,
  crearOferta,
  actualizarOferta,
  eliminarOferta,
  listarOfertasDeProducto,
  sincronizarOfertasDeProducto,
  eliminarVencidas,
} from "./oferta.controller";

// Router del dominio (montado en index.ts).
const router = Router();

// /ofertas/buscar y /ofertas/vencidas van ANTES de /ofertas/:idOferta:
// si no, "buscar"/"vencidas" caen en el param.
router.get(
  "/ofertas/buscar",
  validate({ query: buscarOfertasQuerySchema }),
  // Busqueda en vivo (no guarda nada).
  buscarOfertas
);

router.delete(
  "/ofertas/vencidas",
  // Limpieza manual de vencidas (el sistema tambien barre al arrancar).
  eliminarVencidas
);

router.get(
  "/productos-lista/:idProductoLista/ofertas",
  validate({ params: idProductoListaParamOfertasSchema }),
  // Ofertas guardadas del producto.
  listarOfertasDeProducto
);

router.post(
  "/productos-lista/:idProductoLista/ofertas",
  validate({
    params: idProductoListaParamOfertasSchema,
    body: sincronizarOfertasBodySchema,
  }),
  // Re-busca en las fuentes y guarda las ofertas del producto.
  sincronizarOfertasDeProducto
);

router.get(
  "/ofertas",
  validate({ query: listarOfertasQuerySchema }),
  // Listado con filtros.
  listarOfertas
);

router.post(
  "/ofertas",
  validate({ body: crearOfertaBodySchema }),
  // Alta.
  crearOferta
);

router.get(
  "/ofertas/:idOferta",
  validate({ params: idOfertaParamSchema }),
  // Detalle.
  obtenerOferta
);

router.put(
  "/ofertas/:idOferta",
  validate({ params: idOfertaParamSchema, body: actualizarOfertaBodySchema }),
  // Editar.
  actualizarOferta
);

router.delete(
  "/ofertas/:idOferta",
  validate({ params: idOfertaParamSchema }),
  // Eliminar.
  eliminarOferta
);

export default router;
