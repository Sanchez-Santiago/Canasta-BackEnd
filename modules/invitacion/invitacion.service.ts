// Reglas: invita admin; responde el destino; aceptada suma miembro.
import {
  crearInvitacion,
  obtenerInvitacionesPorGrupo,
  obtenerRecibidasPendientes,
  existePendiente,
  responderInvitacion,
  eliminarInvitacion,
  agregarMiembro,
  obtenerInvitacionPorId,
} from "./invitacion.model";
import { obtenerGrupoConRol } from "../grupo/grupo.model";
import { obtenerUsuarioPorEmail } from "../user/user.model";
import type {
  CrearInvitacionBody,
  ResponderInvitacionBody,
  InvitacionRespuesta,
} from "./invitacion.scheme";

/** Error con status para responder desde el controller. */
export class InvitacionError extends Error {
  status: number;
  constructor(mensaje: string, status = 400) {
    super(mensaje);
    this.name = "InvitacionError";
    this.status = status;
  }
}

// Recorta la fila a lo publico.
function aInvitacionRespuesta(i: any): InvitacionRespuesta {
  return {
    id_invitacion: i.id_invitacion,
    id_grupo: i.id_grupo,
    id_usuario_origen: i.id_usuario_origen,
    nombre_origen: i.nombre_origen ?? null,
    id_usuario_destino: i.id_usuario_destino,
    email_destino: i.email_destino,
    nombre_destino: i.nombre_destino ?? null,
    estado: i.estado,
    fecha_creacion: i.fecha_creacion,
    fecha_respuesta: i.fecha_respuesta ?? null,
  };
}

/** Invita por email: admin, grupal, no miembro, no duplicada. */
export async function crearInvitacionService(
  idUsuarioOrigen: number,
  idGrupo: number,
  datos: CrearInvitacionBody
): Promise<{ invitacion: InvitacionRespuesta }> {
  const miembro = await obtenerGrupoConRol(idUsuarioOrigen, idGrupo);
  if (!miembro) throw new InvitacionError("No perteneces a este grupo", 403);
  if (miembro.tipo === "personal") {
    throw new InvitacionError("No se puede invitar al grupo personal", 403);
  }
  if (miembro.rol !== "administrador") {
    throw new InvitacionError("Solo el administrador puede invitar", 403);
  }

  const destino = await obtenerUsuarioPorEmail(datos.email_destino);
  if (!destino) throw new InvitacionError("No existe un usuario con ese email", 404);

  const yaMiembro = await obtenerGrupoConRol(destino.id_usuario, idGrupo);
  if (yaMiembro) throw new InvitacionError("El usuario ya es miembro del grupo", 409);

  if (await existePendiente(destino.id_usuario, idGrupo)) {
    throw new InvitacionError("Ya hay una invitación pendiente para ese usuario", 409);
  }

  const creada = await crearInvitacion(idUsuarioOrigen, destino.id_usuario, idGrupo);
  if (!creada) throw new InvitacionError("No se pudo crear la invitación", 500);
  return { invitacion: aInvitacionRespuesta(creada) };
}

/** Lista solo si pertenezco. */
export async function obtenerInvitacionesPorGrupoService(
  idUsuario: number,
  idGrupo: number
): Promise<{ invitaciones: InvitacionRespuesta[] }> {
  const miembro = await obtenerGrupoConRol(idUsuario, idGrupo);
  if (!miembro) throw new InvitacionError("No perteneces a este grupo", 403);
  const items = await obtenerInvitacionesPorGrupo(idGrupo);
  return { invitaciones: items.map(aInvitacionRespuesta) };
}

/** Mis pendientes como destino. */
export async function obtenerRecibidasService(
  idUsuario: number
): Promise<{ invitaciones: InvitacionRespuesta[] }> {
  const items = await obtenerRecibidasPendientes(idUsuario);
  return { invitaciones: items.map(aInvitacionRespuesta) };
}

/** Solo destino; aceptada inserta miembro antes de marcar. */
export async function responderInvitacionService(
  idUsuario: number,
  idInvitacion: number,
  datos: ResponderInvitacionBody
): Promise<{ invitacion: InvitacionRespuesta }> {
  const inv = await obtenerInvitacionPorId(idInvitacion);
  if (!inv) throw new InvitacionError("Invitación no encontrada", 404);
  if (inv.id_usuario_destino !== idUsuario) {
    throw new InvitacionError("Solo el destinatario puede responder", 403);
  }
  if (inv.estado !== "pendiente") {
    throw new InvitacionError("La invitación ya fue respondida", 409);
  }

  if (datos.estado === "aceptada") {
    const yaMiembro = await obtenerGrupoConRol(idUsuario, inv.id_grupo);
    if (yaMiembro) throw new InvitacionError("Ya eres miembro del grupo", 409);
    const ok = await agregarMiembro(idUsuario, inv.id_grupo);
    if (!ok) throw new InvitacionError("No se pudo unir al grupo", 500);
  }

  const actualizada = await responderInvitacion(idInvitacion, datos.estado);
  if (!actualizada) throw new InvitacionError("No se pudo responder la invitación", 500);
  return { invitacion: aInvitacionRespuesta(actualizada) };
}

/** Cancela pendiente: origen o admin. */
export async function eliminarInvitacionService(
  idUsuario: number,
  idInvitacion: number
): Promise<{ eliminado: boolean }> {
  const inv = await obtenerInvitacionPorId(idInvitacion);
  if (!inv) throw new InvitacionError("Invitación no encontrada", 404);
  if (inv.estado !== "pendiente") {
    throw new InvitacionError("Solo se pueden cancelar invitaciones pendientes", 409);
  }
  if (inv.id_usuario_origen !== idUsuario) {
    const miembro = await obtenerGrupoConRol(idUsuario, inv.id_grupo);
    if (!miembro || miembro.rol !== "administrador") {
      throw new InvitacionError("Solo quien invitó o el administrador puede cancelar", 403);
    }
  }
  const ok = await eliminarInvitacion(idInvitacion);
  if (!ok) throw new InvitacionError("No se pudo cancelar la invitación", 500);
  return { eliminado: true };
}
