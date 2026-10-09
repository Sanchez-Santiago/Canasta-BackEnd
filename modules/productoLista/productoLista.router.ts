import { Router } from "express";
import { validate } from "../../shared/middlewares/validate";
import {
  crearProductoListaBodySchema,
  actualizarProductoListaBodySchema,
  cambiarEstadoItemBodySchema,
  idListaParamSchemaItems,
  idProductoListaParamSchema,
} from "./productoLista.scheme";
import {
  crearProducto,
  obtenerProductosPorLista,
  obtenerProducto,
  actualizarProducto,
  cambiarEstadoProducto,
  eliminarProducto,
} from "./productoLista.controller";

const router = Router();

router.get(
  "/listas/:idLista/productos",
  validate({ params: idListaParamSchemaItems }),
  obtenerProductosPorLista
);
router.post(
  "/listas/:idLista/productos",
  validate({ params: idListaParamSchemaItems, body: crearProductoListaBodySchema }),
  crearProducto
);

router.get(
  "/productos-lista/:idProductoLista",
  validate({ params: idProductoListaParamSchema }),
  obtenerProducto
);
router.put(
  "/productos-lista/:idProductoLista",
  validate({ params: idProductoListaParamSchema, body: actualizarProductoListaBodySchema }),
  actualizarProducto
);
router.patch(
  "/productos-lista/:idProductoLista/estado",
  validate({ params: idProductoListaParamSchema, body: cambiarEstadoItemBodySchema }),
  cambiarEstadoProducto
);
router.delete(
  "/productos-lista/:idProductoLista",
  validate({ params: idProductoListaParamSchema }),
  eliminarProducto
);

export default router;
