// Reglas de listas: miembros crean/leen; editar/borrar creador o admin.
import {
  crearLista,
  obtenerListaPorId,
  obtenerListasPorGrupo,
  actualizarLista,
  eliminarLista,
  obtenerPermisosSobreLista,
} from "./lista.model";
import { obtenerProductosPorLista } from "../productoLista/productoLista.model";
import { calcularTotalEstimado, type TotalEstimado } from "./lista.calculos";
import { obtenerGrupoConRol } from "../grupo/grupo.model";
import type {
  CrearListaBody,
  ActualizarListaBody,
  CambiarEstadoListaBody,
  ListaRespuesta,
  TotalEstimadoRespuesta,
} from "./lista.scheme";

/** Error con status para responder desde el controller. */
export class ListaError extends Error {
  status: number;
  constructor(mensaje: string, status = 400) {
    super(mensaje);
    this.name = "ListaError";
    this.status = status;
  }
}

// Recorta la fila a lo publico.
function aListaRespuesta(l: any): ListaRespuesta {
  return {
    id_lista: l.id_lista,
    id_grupo: l.id_grupo,
    id_usuario_creador: l.id_usuario_creador,
    id_usuario_administrador: l.id_usuario_administrador ?? null,
    nombre: l.nombre,
    descripcion: l.descripcion,
    estado: l.estado,
    fecha_creacion: l.fecha_creacion,
    fecha_actualizacion: l.fecha_actualizacion,
  };
}

// Adapta el calculo a la respuesta.
function aTotalRespuesta(t: TotalEstimado): TotalEstimadoRespuesta {
  return {
    total_estimado_centavos: t.total_estimado_centavos,
    total_estimado_pesos: t.total_estimado_pesos,
    cantidad_items_con_precio: t.cantidad_items_con_precio,
    cantidad_items_total: t.cantidad_items_total,
  };
}

/** Crea lista si pertenezco al grupo. */
export async function crearListaService(
  idUsuario: number,
  idGrupo: number,
  datos: CrearListaBody
): Promise<{ lista: ListaRespuesta }> {
  const miembro = await obtenerGrupoConRol(idUsuario, idGrupo);
  if (!miembro) throw new ListaError("No perteneces a este grupo", 403);
  const creada = await crearLista(idGrupo, idUsuario, {
    nombre: datos.nombre,
    descripcion: datos.descripcion,
  });
  if (!creada) throw new ListaError("No se pudo crear la lista", 500);
  return { lista: aListaRespuesta(creada) };
}

/** Listas solo si pertenezco. */
export async function obtenerListasPorGrupoService(
  idUsuario: number,
  idGrupo: number
): Promise<{ listas: ListaRespuesta[] }> {
  const miembro = await obtenerGrupoConRol(idUsuario, idGrupo);
  if (!miembro) throw new ListaError("No perteneces a este grupo", 403);
  const listas = await obtenerListasPorGrupo(idGrupo);
  return { listas: listas.map(aListaRespuesta) };
}

/** Detalle: 404 si no existe, 403 si no pertenezco. */
export async function obtenerListaPorIdService(
  idUsuario: number,
  idLista: number
): Promise<{ lista: ListaRespuesta }> {
  const p = await obtenerPermisosSobreLista(idUsuario, idLista);
  if (!p.existe) throw new ListaError("Lista no encontrada", 404);
  if (!p.pertenece) throw new ListaError("No perteneces al grupo de esta lista", 403);
  return { lista: aListaRespuesta(p.lista!) };
}

/** Edita: 403 si no soy creador ni admin. */
export async function actualizarListaService(
  idUsuario: number,
  idLista: number,
  datos: ActualizarListaBody
): Promise<{ lista: ListaRespuesta }> {
  const p = await obtenerPermisosSobreLista(idUsuario, idLista);
  if (!p.existe) throw new ListaError("Lista no encontrada", 404);
  if (!p.pertenece) throw new ListaError("No perteneces al grupo de esta lista", 403);
  const puedeEditar = p.esCreadorLista || p.esAdminGrupo;
  if (!puedeEditar) throw new ListaError("No tienes permisos para editar esta lista", 403);
  const actualizada = await actualizarLista(idLista, datos);
  if (!actualizada) throw new ListaError("No se pudo actualizar la lista", 500);
  return { lista: aListaRespuesta(actualizada) };
}

/** Cambia estado con el mismo permiso de edicion. */
export async function cambiarEstadoListaService(
  idUsuario: number,
  idLista: number,
  datos: CambiarEstadoListaBody
): Promise<{ lista: ListaRespuesta }> {
  const p = await obtenerPermisosSobreLista(idUsuario, idLista);
  if (!p.existe) throw new ListaError("Lista no encontrada", 404);
  if (!p.pertenece) throw new ListaError("No perteneces al grupo de esta lista", 403);
  const puedeEditar = p.esCreadorLista || p.esAdminGrupo;
  if (!puedeEditar) throw new ListaError("No tienes permisos para cambiar el estado", 403);
  const actualizada = await actualizarLista(idLista, { estado: datos.estado });
  if (!actualizada) throw new ListaError("No se pudo cambiar el estado", 500);
  return { lista: aListaRespuesta(actualizada) };
}

/** Elimina: 403 si no soy creador ni admin. */
export async function eliminarListaService(
  idUsuario: number,
  idLista: number
): Promise<{ eliminado: boolean }> {
  const p = await obtenerPermisosSobreLista(idUsuario, idLista);
  if (!p.existe) throw new ListaError("Lista no encontrada", 404);
  if (!p.pertenece) throw new ListaError("No perteneces al grupo de esta lista", 403);
  const puedeEliminar = p.esCreadorLista || p.esAdminGrupo;
  if (!puedeEliminar) throw new ListaError("No tienes permisos para eliminar esta lista", 403);
  const ok = await eliminarLista(idLista);
  if (!ok) throw new ListaError("No se pudo eliminar la lista", 500);
  return { eliminado: true };
}

/** Calcula el total sobre los items actuales. */
export async function obtenerTotalEstimadoService(
  idUsuario: number,
  idLista: number
): Promise<{ total: TotalEstimadoRespuesta }> {
  const p = await obtenerPermisosSobreLista(idUsuario, idLista);
  if (!p.existe) throw new ListaError("Lista no encontrada", 404);
  if (!p.pertenece) throw new ListaError("No perteneces al grupo de esta lista", 403);
  const items = await obtenerProductosPorLista(idLista);
  const total = calcularTotalEstimado(items);
  return { total: aTotalRespuesta(total) };
}
