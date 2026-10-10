// Rutas de ofertas (todas protegidas).
import { Router } from "express";
import { validate } from "../../shared/middlewares/validate";
import {
  crearOfertaBodySchema,
  actualizarOfertaBodySchema,
  ofertasQuerySchema,
  idOfertaParamSchema,
  idProductoParamSchemaOfertas,
  idListaParamSchemaOfertas,
} from "./oferta.scheme";
import {
  crearOferta,
  obtenerOfertasPorProducto,
  obtenerOfertasPorLista,
  obtenerOferta,
  actualizarOferta,
  eliminarOferta,
} from "./oferta.controller";

// Router del dominio (montado en index.ts).
const router = Router();

router.get(
  "/productos-lista/:idProductoLista/ofertas",
  validate({ params: idProductoParamSchemaOfertas, query: ofertasQuerySchema }),
// Listar del producto.
  obtenerOfertasPorProducto
);
router.post(
  "/productos-lista/:idProductoLista/ofertas",
  validate({ params: idProductoParamSchemaOfertas, body: crearOfertaBodySchema }),
// Crear en el producto.
  crearOferta
);

router.get(
  "/listas/:idLista/ofertas",
  validate({ params: idListaParamSchemaOfertas, query: ofertasQuerySchema }),
// Listar de la lista.
  obtenerOfertasPorLista
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
