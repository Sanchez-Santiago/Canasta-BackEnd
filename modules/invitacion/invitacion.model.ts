// Tabla invitacion_grupo: altas, respuestas y alta de miembros.
import { run, getOne, getAll, filasAfectadas } from "../../shared/db.helpers";
import type { InvitacionDB } from "./invitacion.scheme";
import { ahoraIso } from "../../shared/utils/dates";

// Columnas + JOINs (evita repetir el SELECT).
const SELECT_INVITACION = `
  SELECT i.id_invitacion, i.id_usuario_origen, i.id_usuario_destino, i.id_grupo,
         i.estado, i.fecha_creacion, i.fecha_respuesta,
         uo.nombre AS nombre_origen, ud.email AS email_destino, ud.nombre AS nombre_destino
  FROM invitacion_grupo i
  INNER JOIN usuario uo ON uo.id_usuario = i.id_usuario_origen
  INNER JOIN usuario ud ON ud.id_usuario = i.id_usuario_destino
`;

/** Alta en pendiente. */
export async function crearInvitacion(
  idUsuarioOrigen: number,
  idUsuarioDestino: number,
  idGrupo: number
): Promise<InvitacionDB | undefined> {
  const sql = `
    INSERT INTO invitacion_grupo (
      id_usuario_origen, id_usuario_destino, id_grupo, estado, fecha_creacion, fecha_respuesta
    )
    VALUES (
      @idUsuarioOrigen, @idUsuarioDestino, @idGrupo, 'pendiente', @fechaCreacion, NULL
    )
  `;
  const rs = await run(sql, {
    idUsuarioOrigen,
    idUsuarioDestino,
    idGrupo,
    fechaCreacion: ahoraIso(),
  });
  const id = rs.lastInsertRowid;
  if (id == null) return undefined;
  return obtenerInvitacionPorId(Number(id));
}

/** Con nombres y emails por JOIN. */
export async function obtenerInvitacionPorId(
  idInvitacion: number
): Promise<InvitacionDB | undefined> {
  const sql = `${SELECT_INVITACION} WHERE i.id_invitacion = @idInvitacion LIMIT 1`;
  return getOne<InvitacionDB>(sql, { idInvitacion });
}

/** Del grupo, recientes primero. */
export async function obtenerInvitacionesPorGrupo(
  idGrupo: number
): Promise<InvitacionDB[]> {
  const sql = `
    ${SELECT_INVITACION}
    WHERE i.id_grupo = @idGrupo
    ORDER BY i.fecha_creacion DESC, i.id_invitacion DESC
  `;
  return getAll<InvitacionDB>(sql, { idGrupo });
}

/** Pendientes donde soy destino. */
export async function obtenerRecibidasPendientes(
  idUsuarioDestino: number
): Promise<InvitacionDB[]> {
  const sql = `
    ${SELECT_INVITACION}
    WHERE i.id_usuario_destino = @idUsuarioDestino AND i.estado = 'pendiente'
    ORDER BY i.fecha_creacion DESC, i.id_invitacion DESC
  `;
  return getAll<InvitacionDB>(sql, { idUsuarioDestino });
}

/** true si ya hay pendiente igual (evita duplicadas). */
export async function existePendiente(
  idUsuarioDestino: number,
  idGrupo: number
): Promise<boolean> {
  const sql = `
    SELECT 1 FROM invitacion_grupo
    WHERE id_usuario_destino = @idUsuarioDestino
      AND id_grupo = @idGrupo
      AND estado = 'pendiente'
    LIMIT 1
  `;
  const row = await getOne<{ "1": number }>(sql, { idUsuarioDestino, idGrupo });
  return !!row;
}

/** Marca respuesta con fecha; el alta la hace el service. */
export async function responderInvitacion(
  idInvitacion: number,
  estado: "aceptada" | "rechazada"
): Promise<InvitacionDB | undefined> {
  const sql = `
    UPDATE invitacion_grupo
    SET estado = @estado, fecha_respuesta = @fechaRespuesta
    WHERE id_invitacion = @idInvitacion
  `;
  await run(sql, { estado, fechaRespuesta: ahoraIso(), idInvitacion });
  return obtenerInvitacionPorId(idInvitacion);
}

/** DELETE (solo pendientes, lo valida el service). */
export async function eliminarInvitacion(idInvitacion: number): Promise<boolean> {
  const sql = `DELETE FROM invitacion_grupo WHERE id_invitacion = @idInvitacion`;
  const rs = await run(sql, { idInvitacion });
  return filasAfectadas(rs) > 0;
}

/** Alta como miembro (rol fijo). */
export async function agregarMiembro(
  idUsuario: number,
  idGrupo: number
): Promise<boolean> {
  const sql = `
    INSERT INTO usuario_grupo (id_usuario, id_grupo, rol, fecha_ingreso)
    VALUES (@idUsuario, @idGrupo, 'miembro', @fechaIngreso)
  `;
  const rs = await run(sql, { idUsuario, idGrupo, fechaIngreso: ahoraIso() });
  return filasAfectadas(rs) > 0;
}
