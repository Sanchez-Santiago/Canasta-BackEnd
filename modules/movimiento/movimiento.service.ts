// Reglas de movimientos: crear/leer miembros; editar/borrar creador o admin.
import {
  crearMovimiento,
  obtenerMovimientosPorGrupo,
  actualizarMovimiento,
  eliminarMovimiento,
  obtenerTotalesPorGrupo,
  obtenerPermisosSobreMovimiento,
} from "./movimiento.model";
import { construirResumen } from "./movimiento.finanzas";
import { obtenerGrupoConRol } from "../grupo/grupo.model";
import type {
  CrearMovimientoBody,
  ActualizarMovimientoBody,
  MovimientoRespuesta,
  ResumenFinanzasRespuesta,
} from "./movimiento.scheme";

/** Error con status para responder desde el controller. */
export class MovimientoError extends Error {
  status: number;
  constructor(mensaje: string, status = 400) {
    super(mensaje);
    this.name = "MovimientoError";
    this.status = status;
  }
}

// Recorta la fila a lo publico.
function aMovimientoRespuesta(m: any): MovimientoRespuesta {
  return {
    id_movimiento: m.id_movimiento,
    id_usuario_creador: m.id_usuario_creador,
    id_grupo: m.id_grupo,
    nombre: m.nombre,
    monto: m.monto,
    descripcion: m.descripcion,
    tipo: m.tipo,
    foto_url: m.foto_url ?? null,
    fecha_movimiento: m.fecha_movimiento,
    fecha_creacion: m.fecha_creacion,
  };
}

/** Crea si pertenezco al grupo. */
export async function crearMovimientoService(
  idUsuario: number,
  idGrupo: number,
  datos: CrearMovimientoBody
): Promise<{ movimiento: MovimientoRespuesta }> {
  const miembro = await obtenerGrupoConRol(idUsuario, idGrupo);
  if (!miembro) throw new MovimientoError("No perteneces a este grupo", 403);
  const creado = await crearMovimiento(idGrupo, idUsuario, {
    nombre: datos.nombre,
    monto: datos.monto,
    descripcion: datos.descripcion,
    tipo: datos.tipo,
    foto_url: datos.foto_url ?? null,
    fecha_movimiento: datos.fecha_movimiento,
  });
  if (!creado) throw new MovimientoError("No se pudo crear el movimiento", 500);
  return { movimiento: aMovimientoRespuesta(creado) };
}

/** Lista solo si pertenezco (con filtro). */
export async function obtenerMovimientosPorGrupoService(
  idUsuario: number,
  idGrupo: number,
  tipo?: "ingreso" | "gasto"
): Promise<{ movimientos: MovimientoRespuesta[] }> {
  const miembro = await obtenerGrupoConRol(idUsuario, idGrupo);
  if (!miembro) throw new MovimientoError("No perteneces a este grupo", 403);
  const items = await obtenerMovimientosPorGrupo(idGrupo, tipo);
  return { movimientos: items.map(aMovimientoRespuesta) };
}

/** Detalle: 404/403 segun corresponda. */
export async function obtenerMovimientoPorIdService(
  idUsuario: number,
  idMovimiento: number
): Promise<{ movimiento: MovimientoRespuesta }> {
  const p = await obtenerPermisosSobreMovimiento(idUsuario, idMovimiento);
  if (!p.existe) throw new MovimientoError("Movimiento no encontrado", 404);
  if (!p.pertenece) throw new MovimientoError("No perteneces al grupo de este movimiento", 403);
  return { movimiento: aMovimientoRespuesta(p.movimiento!) };
}

/** Edita: 403 si no soy creador ni admin. */
export async function actualizarMovimientoService(
  idUsuario: number,
  idMovimiento: number,
  datos: ActualizarMovimientoBody
): Promise<{ movimiento: MovimientoRespuesta }> {
  const p = await obtenerPermisosSobreMovimiento(idUsuario, idMovimiento);
  if (!p.existe) throw new MovimientoError("Movimiento no encontrado", 404);
  if (!p.pertenece) throw new MovimientoError("No perteneces al grupo de este movimiento", 403);
  if (!p.esCreador && !p.esAdminGrupo) {
    throw new MovimientoError("No tienes permisos para editar este movimiento", 403);
  }
  const actualizado = await actualizarMovimiento(idMovimiento, datos as any);
  if (!actualizado) throw new MovimientoError("No se pudo actualizar el movimiento", 500);
  return { movimiento: aMovimientoRespuesta(actualizado) };
}

/** Elimina: 403 si no soy creador ni admin. */
export async function eliminarMovimientoService(
  idUsuario: number,
  idMovimiento: number
): Promise<{ eliminado: boolean }> {
  const p = await obtenerPermisosSobreMovimiento(idUsuario, idMovimiento);
  if (!p.existe) throw new MovimientoError("Movimiento no encontrado", 404);
  if (!p.pertenece) throw new MovimientoError("No perteneces al grupo de este movimiento", 403);
  if (!p.esCreador && !p.esAdminGrupo) {
    throw new MovimientoError("No tienes permisos para eliminar este movimiento", 403);
  }
  const ok = await eliminarMovimiento(idMovimiento);
  if (!ok) throw new MovimientoError("No se pudo eliminar el movimiento", 500);
  return { eliminado: true };
}

/** Totales y balance del grupo. */
export async function obtenerResumenService(
  idUsuario: number,
  idGrupo: number
): Promise<{ resumen: ResumenFinanzasRespuesta }> {
  const miembro = await obtenerGrupoConRol(idUsuario, idGrupo);
  if (!miembro) throw new MovimientoError("No perteneces a este grupo", 403);
  const filas = await obtenerTotalesPorGrupo(idGrupo);
  const resumen = construirResumen(filas);
  return { resumen };
}
