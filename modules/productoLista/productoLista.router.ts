// Rutas de items (todas protegidas).
import { Router } from "express";
import { validate } from "../../shared/middlewares/validate";
import {
  crearProductoListaBodySchema,
  actualizarProductoListaBodySchema,
  cambiarEstadoItemBodySchema,
  idListaParamSchemaItems,
  idProductoListaParamSchema,
  listarProductosQuerySchema,
} from "./productoLista.scheme";
import {
  crearProducto,
  obtenerProductosPorLista,
  obtenerProducto,
  actualizarProducto,
  cambiarEstadoProducto,
  eliminarProducto,
} from "./productoLista.controller";

// Router del dominio (montado en index.ts).
const router = Router();

router.get(
  "/listas/:idLista/productos",
  validate({
    params: idListaParamSchemaItems,
    query: listarProductosQuerySchema,
  }),
// Listar de la lista (filtros opcionales por marca/categoria/unidad).
  obtenerProductosPorLista
);
router.post(
  "/listas/:idLista/productos",
  validate({ params: idListaParamSchemaItems, body: crearProductoListaBodySchema }),
// Crear en la lista.
  crearProducto
);

router.get(
  "/productos-lista/:idProductoLista",
  validate({ params: idProductoListaParamSchema }),
// Detalle.
  obtenerProducto
);
router.put(
  "/productos-lista/:idProductoLista",
  validate({ params: idProductoListaParamSchema, body: actualizarProductoListaBodySchema }),
// Editar.
  actualizarProducto
);
router.patch(
  "/productos-lista/:idProductoLista/estado",
  validate({ params: idProductoListaParamSchema, body: cambiarEstadoItemBodySchema }),
// Cambiar estado.
  cambiarEstadoProducto
);
router.delete(
  "/productos-lista/:idProductoLista",
  validate({ params: idProductoListaParamSchema }),
// Eliminar.
  eliminarProducto
);

export default router;
