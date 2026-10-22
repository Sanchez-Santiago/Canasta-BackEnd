// Reglas del tablon: las notificaciones las genera el sistema; el admin
// puede limpiar el historial; cualquier miembro puede leer.
import {
  obtenerNotificacionPorId,
  obtenerNotificacionesPorGrupo,
  eliminarNotificacion,
} from "./notificacion.model";
import { obtenerGrupoConRol } from "../grupo/grupo.model";
import type { NotificacionRespuesta } from "./notificacion.scheme";

/** Error con status para responder desde el controller. */
export class NotificacionError extends Error {
  status: number;
  constructor(mensaje: string, status = 400) {
    super(mensaje);
    this.name = "NotificacionError";
    this.status = status;
  }
}

// Recorta la fila a lo publico.
function aNotificacionRespuesta(n: any): NotificacionRespuesta {
  return {
    id_notificacion: n.id_notificacion,
    id_grupo: n.id_grupo,
    tipo: n.tipo,
    titulo: n.titulo,
    descripcion: n.descripcion,
    fecha_creacion: n.fecha_creacion,
  };
}

/** 403 si no pertenece; devuelve el rol. */
async function exigirMiembro(idUsuario: number, idGrupo: number) {
  const miembro = await obtenerGrupoConRol(idUsuario, idGrupo);
  if (!miembro) throw new NotificacionError("No perteneces a este grupo", 403);
  return miembro;
}

/** 403 si no es administrador. */
async function exigirAdmin(idUsuario: number, idGrupo: number) {
  const miembro = await exigirMiembro(idUsuario, idGrupo);
  if (miembro.rol !== "administrador") {
    throw new NotificacionError("Solo el administrador puede eliminar notificaciones", 403);
  }
  return miembro;
}

/** Lee: cualquier miembro. */
export async function obtenerNotificacionesPorGrupoService(
  idUsuario: number,
  idGrupo: number
): Promise<{ notificaciones: NotificacionRespuesta[] }> {
  await exigirMiembro(idUsuario, idGrupo);
  const items = await obtenerNotificacionesPorGrupo(idGrupo);
  return { notificaciones: items.map(aNotificacionRespuesta) };
}

/** Detalle: 404/403 segun corresponda. */
export async function obtenerNotificacionPorIdService(
  idUsuario: number,
  idNotificacion: number
): Promise<{ notificacion: NotificacionRespuesta }> {
  const n = await obtenerNotificacionPorId(idNotificacion);
  if (!n) throw new NotificacionError("Notificación no encontrada", 404);
  await exigirMiembro(idUsuario, n.id_grupo);
  return { notificacion: aNotificacionRespuesta(n) };
}

/** Borra: solo admin. */
export async function eliminarNotificacionService(
  idUsuario: number,
  idNotificacion: number
): Promise<{ eliminado: boolean }> {
  const n = await obtenerNotificacionPorId(idNotificacion);
  if (!n) throw new NotificacionError("Notificación no encontrada", 404);
  await exigirAdmin(idUsuario, n.id_grupo);
  const ok = await eliminarNotificacion(idNotificacion);
  if (!ok) throw new NotificacionError("No se pudo eliminar la notificación", 500);
  return { eliminado: true };
}
