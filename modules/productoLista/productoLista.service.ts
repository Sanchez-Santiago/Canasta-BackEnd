// Reglas de items: editar cualquiera; borrar creadores o admin.
import {
  crearProductoLista,
  obtenerProductosPorLista,
  actualizarProductoLista,
  eliminarProductoLista,
  obtenerItemConContexto,
  obtenerRolEnGrupo,
} from "./productoLista.model";
import { obtenerPermisosSobreLista } from "../lista/lista.model";
import type {
  CrearProductoListaBody,
  ActualizarProductoListaBody,
  CambiarEstadoItemBody,
  ProductoListaRespuesta,
} from "./productoLista.scheme";

/** Error con status para responder desde el controller. */
export class ProductoListaError extends Error {
  status: number;
  constructor(mensaje: string, status = 400) {
    super(mensaje);
    this.name = "ProductoListaError";
    this.status = status;
  }
}

// Recorta la fila a lo publico.
function aItemRespuesta(i: any): ProductoListaRespuesta {
  return {
    id_producto_lista: i.id_producto_lista,
    id_lista: i.id_lista,
    id_usuario_creador: i.id_usuario_creador,
    nombre: i.nombre,
    descripcion: i.descripcion,
    prioridad: i.prioridad,
    cantidad: i.cantidad,
    precio_estimado_unitario: i.precio_estimado_unitario ?? null,
    codigo_producto: i.codigo_producto ?? null,
    estado: i.estado,
    fecha_creacion: i.fecha_creacion,
  };
}

/** Borrar: admin, creador de la lista o del item. */
function puedeEliminarItem(
  idUsuario: number,
  ctx: {
    itemCreador: number;
    listaCreador: number | null;
    rolGrupo: "administrador" | "miembro" | null;
  }
): boolean {
  if (ctx.rolGrupo === "administrador") return true;
  if (ctx.listaCreador === idUsuario) return true;
  if (ctx.itemCreador === idUsuario) return true;
  return false;
}

/** Crea si la lista existe y pertenezco. */
export async function crearProductoListaService(
  idUsuario: number,
  idLista: number,
  datos: CrearProductoListaBody
): Promise<{ producto: ProductoListaRespuesta }> {
  const p = await obtenerPermisosSobreLista(idUsuario, idLista);
  if (!p.existe) throw new ProductoListaError("Lista no encontrada", 404);
  if (!p.pertenece) throw new ProductoListaError("No perteneces al grupo de esta lista", 403);
  const creado = await crearProductoLista(idLista, idUsuario, datos as any);
  if (!creado) throw new ProductoListaError("No se pudo crear el producto", 500);
  return { producto: aItemRespuesta(creado) };
}

/** Items solo si pertenezco. */
export async function obtenerProductosPorListaService(
  idUsuario: number,
  idLista: number
): Promise<{ productos: ProductoListaRespuesta[] }> {
  const p = await obtenerPermisosSobreLista(idUsuario, idLista);
  if (!p.existe) throw new ProductoListaError("Lista no encontrada", 404);
  if (!p.pertenece) throw new ProductoListaError("No perteneces al grupo de esta lista", 403);
  const items = await obtenerProductosPorLista(idLista);
  return { productos: items.map(aItemRespuesta) };
}

/** Detalle: 404/403 segun corresponda. */
export async function obtenerProductoListaPorIdService(
  idUsuario: number,
  idProductoLista: number
): Promise<{ producto: ProductoListaRespuesta }> {
  const ctx = await obtenerItemConContexto(idProductoLista);
  if (!ctx.item || !ctx.idGrupo) throw new ProductoListaError("Producto no encontrado", 404);
  const rol = await obtenerRolEnGrupo(idUsuario, ctx.idGrupo);
  if (!rol) throw new ProductoListaError("No perteneces al grupo de esta lista", 403);
  return { producto: aItemRespuesta(ctx.item) };
}

/** Edita: cualquier miembro del grupo. */
export async function actualizarProductoListaService(
  idUsuario: number,
  idProductoLista: number,
  datos: ActualizarProductoListaBody
): Promise<{ producto: ProductoListaRespuesta }> {
  const ctx = await obtenerItemConContexto(idProductoLista);
  if (!ctx.item || !ctx.idGrupo) throw new ProductoListaError("Producto no encontrado", 404);
  const rol = await obtenerRolEnGrupo(idUsuario, ctx.idGrupo);
  if (!rol) throw new ProductoListaError("No perteneces al grupo de esta lista", 403);
  const actualizado = await actualizarProductoLista(idProductoLista, datos as any);
  if (!actualizado) throw new ProductoListaError("No se pudo actualizar el producto", 500);
  return { producto: aItemRespuesta(actualizado) };
}

/** Cambia estado: cualquier miembro. */
export async function cambiarEstadoItemService(
  idUsuario: number,
  idProductoLista: number,
  datos: CambiarEstadoItemBody
): Promise<{ producto: ProductoListaRespuesta }> {
  const ctx = await obtenerItemConContexto(idProductoLista);
  if (!ctx.item || !ctx.idGrupo) throw new ProductoListaError("Producto no encontrado", 404);
  const rol = await obtenerRolEnGrupo(idUsuario, ctx.idGrupo);
  if (!rol) throw new ProductoListaError("No perteneces al grupo de esta lista", 403);
  const actualizado = await actualizarProductoLista(idProductoLista, { estado: datos.estado });
  if (!actualizado) throw new ProductoListaError("No se pudo cambiar el estado", 500);
  return { producto: aItemRespuesta(actualizado) };
}

/** Elimina: 403 salvo admin/creadores. */
export async function eliminarProductoListaService(
  idUsuario: number,
  idProductoLista: number
): Promise<{ eliminado: boolean }> {
  const ctx = await obtenerItemConContexto(idProductoLista);
  if (!ctx.item || !ctx.idGrupo) throw new ProductoListaError("Producto no encontrado", 404);
  const rol = await obtenerRolEnGrupo(idUsuario, ctx.idGrupo);
  if (!rol) throw new ProductoListaError("No perteneces al grupo de esta lista", 403);
  if (
    !puedeEliminarItem(idUsuario, {
      itemCreador: ctx.item.id_usuario_creador,
      listaCreador: ctx.idUsuarioCreadorLista,
      rolGrupo: rol,
    })
  ) {
    throw new ProductoListaError("No tienes permisos para eliminar este producto", 403);
  }
  const ok = await eliminarProductoLista(idProductoLista);
  if (!ok) throw new ProductoListaError("No se pudo eliminar el producto", 500);
  return { eliminado: true };
}
