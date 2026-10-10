// Tabla notificacion: altas, lecturas y borrado (sin update).
import { run, getOne, getAll, filasAfectadas } from "../../shared/db.helpers";
import type { NotificacionDB } from "./notificacion.scheme";
import { ahoraIso } from "../../shared/utils/dates";

/** Publica el anuncio. */
export async function crearNotificacion(
  idGrupo: number,
  datos: { tipo: string; titulo: string; descripcion?: string }
): Promise<NotificacionDB | undefined> {
  const sql = `
    INSERT INTO notificacion (id_grupo, tipo, titulo, descripcion, fecha_creacion)
    VALUES (@idGrupo, @tipo, @titulo, @descripcion, @fechaCreacion)
  `;
  const rs = await run(sql, {
    idGrupo,
    tipo: datos.tipo,
    titulo: datos.titulo,
    descripcion: datos.descripcion ?? null,
    fechaCreacion: ahoraIso(),
  });
  const id = rs.lastInsertRowid;
  if (id == null) return undefined;
  return obtenerNotificacionPorId(Number(id));
}

/** Por id, sin chequear pertenencia. */
export async function obtenerNotificacionPorId(
  idNotificacion: number
): Promise<NotificacionDB | undefined> {
  const sql = `
    SELECT id_notificacion, id_grupo, tipo, titulo, descripcion, fecha_creacion
    FROM notificacion
    WHERE id_notificacion = @idNotificacion
    LIMIT 1
  `;
  return getOne<NotificacionDB>(sql, { idNotificacion });
}

/** Del grupo, recientes primero. */
export async function obtenerNotificacionesPorGrupo(
  idGrupo: number
): Promise<NotificacionDB[]> {
  const sql = `
    SELECT id_notificacion, id_grupo, tipo, titulo, descripcion, fecha_creacion
    FROM notificacion
    WHERE id_grupo = @idGrupo
    ORDER BY fecha_creacion DESC, id_notificacion DESC
  `;
  return getAll<NotificacionDB>(sql, { idGrupo });
}

/** DELETE. */
export async function eliminarNotificacion(idNotificacion: number): Promise<boolean> {
  const sql = `DELETE FROM notificacion WHERE id_notificacion = @idNotificacion`;
  const rs = await run(sql, { idNotificacion });
  return filasAfectadas(rs) > 0;
}
