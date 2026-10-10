// Reglas de ofertas: editar cualquiera; borrar solo admin.
import {
  crearOferta,
  obtenerOfertasPorProducto,
  obtenerOfertasPorLista,
  actualizarOferta,
  eliminarOferta,
  obtenerOfertaConContexto,
  obtenerRolSobreProducto,
  type FiltrosOferta,
} from "./oferta.model";
import { obtenerPermisosSobreLista } from "../lista/lista.model";
import type {
  CrearOfertaBody,
  ActualizarOfertaBody,
  OfertaRespuesta,
} from "./oferta.scheme";

/** Error con status para responder desde el controller. */
export class OfertaError extends Error {
  status: number;
  constructor(mensaje: string, status = 400) {
    super(mensaje);
    this.name = "OfertaError";
    this.status = status;
  }
}

// Recorta la fila a lo publico.
function aOfertaRespuesta(o: any): OfertaRespuesta {
  return {
    id_oferta: o.id_oferta,
    id_producto_lista: o.id_producto_lista,
    nombre_comercio: o.nombre_comercio,
    ubicacion: o.ubicacion,
    localidad: o.localidad,
    provincia: o.provincia,
    latitud: o.latitud,
    longitud: o.longitud,
    fecha_inicio: o.fecha_inicio,
    fecha_fin: o.fecha_fin,
    porcentaje_descuento: o.porcentaje_descuento,
    precio_original: o.precio_original,
    precio_oferta: o.precio_oferta,
    descripcion: o.descripcion,
    fecha_creacion: o.fecha_creacion,
  };
}

/** Crea si el producto existe y pertenezco. */
export async function crearOfertaService(
  idUsuario: number,
  idProductoLista: number,
  datos: CrearOfertaBody
): Promise<{ oferta: OfertaRespuesta }> {
  const ctx = await obtenerRolSobreProducto(idUsuario, idProductoLista);
  if (!ctx.existeProducto) throw new OfertaError("Producto no encontrado", 404);
  if (!ctx.pertenece) throw new OfertaError("No perteneces al grupo de este producto", 403);
  const creada = await crearOferta(idProductoLista, datos as any);
  if (!creada) throw new OfertaError("No se pudo crear la oferta", 500);
  return { oferta: aOfertaRespuesta(creada) };
}

/** Lista solo si pertenezco (con filtros). */
export async function obtenerOfertasPorProductoService(
  idUsuario: number,
  idProductoLista: number,
  filtros: FiltrosOferta
): Promise<{ ofertas: OfertaRespuesta[] }> {
  const ctx = await obtenerRolSobreProducto(idUsuario, idProductoLista);
  if (!ctx.existeProducto) throw new OfertaError("Producto no encontrado", 404);
  if (!ctx.pertenece) throw new OfertaError("No perteneces al grupo de este producto", 403);
  const items = await obtenerOfertasPorProducto(idProductoLista, filtros);
  return { ofertas: items.map(aOfertaRespuesta) };
}

/** Lista de la lista: 404/403 segun corresponda. */
export async function obtenerOfertasPorListaService(
  idUsuario: number,
  idLista: number,
  filtros: FiltrosOferta
): Promise<{ ofertas: OfertaRespuesta[] }> {
  const p = await obtenerPermisosSobreLista(idUsuario, idLista);
  if (!p.existe) throw new OfertaError("Lista no encontrada", 404);
  if (!p.pertenece) throw new OfertaError("No perteneces al grupo de esta lista", 403);
  const items = await obtenerOfertasPorLista(idLista, filtros);
  return { ofertas: items.map(aOfertaRespuesta) };
}

/** Detalle: 404/403 segun corresponda. */
export async function obtenerOfertaPorIdService(
  idUsuario: number,
  idOferta: number
): Promise<{ oferta: OfertaRespuesta }> {
  const ctx = await obtenerOfertaConContexto(idUsuario, idOferta);
  if (!ctx.existe || !ctx.oferta) throw new OfertaError("Oferta no encontrada", 404);
  if (!ctx.pertenece) throw new OfertaError("No perteneces al grupo de esta oferta", 403);
  return { oferta: aOfertaRespuesta(ctx.oferta) };
}

/** Edita cualquiera; valida fin > inicio contra la fila. */
export async function actualizarOfertaService(
  idUsuario: number,
  idOferta: number,
  datos: ActualizarOfertaBody
): Promise<{ oferta: OfertaRespuesta }> {
  const ctx = await obtenerOfertaConContexto(idUsuario, idOferta);
  if (!ctx.existe || !ctx.oferta) throw new OfertaError("Oferta no encontrada", 404);
  if (!ctx.pertenece) throw new OfertaError("No perteneces al grupo de esta oferta", 403);

  const inicio = datos.fecha_inicio ?? ctx.oferta.fecha_inicio;
  const fin = datos.fecha_fin ?? ctx.oferta.fecha_fin;
  if (fin <= inicio) {
    throw new OfertaError("La fecha de fin debe ser posterior a la de inicio", 400);
  }

  const actualizada = await actualizarOferta(idOferta, datos as any);
  if (!actualizada) throw new OfertaError("No se pudo actualizar la oferta", 500);
  return { oferta: aOfertaRespuesta(actualizada) };
}

/** Elimina: 403 si no soy admin. */
export async function eliminarOfertaService(
  idUsuario: number,
  idOferta: number
): Promise<{ eliminado: boolean }> {
  const ctx = await obtenerOfertaConContexto(idUsuario, idOferta);
  if (!ctx.existe || !ctx.oferta) throw new OfertaError("Oferta no encontrada", 404);
  if (!ctx.pertenece) throw new OfertaError("No perteneces al grupo de esta oferta", 403);
  if (!ctx.esAdminGrupo) {
    throw new OfertaError("Solo el administrador puede eliminar ofertas", 403);
  }
  const ok = await eliminarOferta(idOferta);
  if (!ok) throw new OfertaError("No se pudo eliminar la oferta", 500);
  return { eliminado: true };
}
