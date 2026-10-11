// Tablas grupo + usuario_grupo: altas, pertenencia y roles.
import { run, getOne, getAll, filasAfectadas } from "../../shared/db.helpers";
import type { GrupoDB, GrupoConRolDB, MiembroGrupoDB } from "./grupo.scheme";
import { ahoraIso } from "../../shared/utils/dates";

/** Grupo personal + alta del usuario como administrador. */
export async function crearGrupoPersonal(
  idUsuario: number,
  nombreUsuario: string
): Promise<GrupoDB | undefined> {
  const fecha = ahoraIso();
  const nombreGrupo = `Mi grupo (${nombreUsuario})`;

  const sqlGrupo = `
    INSERT INTO grupo (nombre, descripcion, categoria, tipo, fecha_creacion)
    VALUES (@nombre, NULL, NULL, 'personal', @fecha_creacion)
  `;
  const rs = await run(sqlGrupo, { nombre: nombreGrupo, fecha_creacion: fecha });
  const idGrupo = rs.lastInsertRowid;
  if (idGrupo == null) return undefined;
  const idGrupoNum = Number(idGrupo);

  const sqlMiembro = `
    INSERT INTO usuario_grupo (id_usuario, id_grupo, rol, fecha_ingreso)
    VALUES (@idUsuario, @idGrupo, 'administrador', @fecha_ingreso)
  `;
  await run(sqlMiembro, {
    idUsuario,
    idGrupo: idGrupoNum,
    fecha_ingreso: fecha,
  });

  return obtenerGrupoPorId(idGrupoNum);
}

/** Grupo grupal + alta del creador como administrador. */
export async function crearGrupoGrupal(
  idUsuarioCreador: number,
  datos: { nombre: string; descripcion?: string; categoria?: string }
): Promise<GrupoDB | undefined> {
  const fecha = ahoraIso();

  const sqlGrupo = `
    INSERT INTO grupo (nombre, descripcion, categoria, tipo, fecha_creacion)
    VALUES (@nombre, @descripcion, @categoria, 'grupal', @fecha_creacion)
  `;
  const rs = await run(sqlGrupo, {
    nombre: datos.nombre,
    descripcion: datos.descripcion ?? null,
    categoria: datos.categoria ?? null,
    fecha_creacion: fecha,
  });
  const idGrupo = rs.lastInsertRowid;
  if (idGrupo == null) return undefined;
  const idGrupoNum = Number(idGrupo);

  const sqlMiembro = `
    INSERT INTO usuario_grupo (id_usuario, id_grupo, rol, fecha_ingreso)
    VALUES (@idUsuario, @idGrupo, 'administrador', @fecha_ingreso)
  `;
  await run(sqlMiembro, {
    idUsuario: idUsuarioCreador,
    idGrupo: idGrupoNum,
    fecha_ingreso: fecha,
  });

  return obtenerGrupoPorId(idGrupoNum);
}

/** Por id, sin chequear pertenencia. */
export async function obtenerGrupoPorId(idGrupo: number): Promise<GrupoDB | undefined> {
  const sql = `
    SELECT id_grupo, nombre, descripcion, categoria, tipo, fecha_creacion
    FROM grupo
    WHERE id_grupo = @idGrupo
    LIMIT 1
  `;
  return getOne<GrupoDB>(sql, { idGrupo });
}

/** Grupo + rol del usuario: base de todos los permisos. */
export async function obtenerGrupoConRol(
  idUsuario: number,
  idGrupo: number
): Promise<GrupoConRolDB | undefined> {
  const sql = `
    SELECT g.id_grupo, g.nombre, g.descripcion, g.categoria, g.tipo, g.fecha_creacion,
           ug.rol, ug.fecha_ingreso
    FROM grupo g
    INNER JOIN usuario_grupo ug ON ug.id_grupo = g.id_grupo
    WHERE ug.id_usuario = @idUsuario AND g.id_grupo = @idGrupo
    LIMIT 1
  `;
  return getOne<GrupoConRolDB>(sql, { idUsuario, idGrupo });
}

/** Grupos del usuario (personal primero). */
export async function obtenerGruposDeUsuario(idUsuario: number): Promise<GrupoConRolDB[]> {
  const sql = `
    SELECT g.id_grupo, g.nombre, g.descripcion, g.categoria, g.tipo, g.fecha_creacion,
           ug.rol, ug.fecha_ingreso
    FROM grupo g
    INNER JOIN usuario_grupo ug ON ug.id_grupo = g.id_grupo
    WHERE ug.id_usuario = @idUsuario
    ORDER BY g.tipo ASC, g.fecha_creacion ASC
  `;
  return getAll<GrupoConRolDB>(sql, { idUsuario });
}

/** Miembros con rol: administradores primero. */
export async function obtenerMiembrosDeGrupo(idGrupo: number): Promise<MiembroGrupoDB[]> {
  const sql = `
    SELECT u.id_usuario,
           u.nombre,
           u.email,
           ug.rol,
           ug.fecha_ingreso
    FROM usuario_grupo ug
    INNER JOIN usuario u ON u.id_usuario = ug.id_usuario
    WHERE ug.id_grupo = @idGrupo
    ORDER BY
      CASE WHEN ug.rol = 'administrador' THEN 0 ELSE 1 END,
      u.nombre ASC,
      u.id_usuario ASC
  `;
  return getAll<MiembroGrupoDB>(sql, { idGrupo });
}

// true si ya tiene su personal (invariante: exactamente 1).
export async function existeGrupoPersonalDeUsuario(idUsuario: number): Promise<boolean> {
  const sql = `
    SELECT 1
    FROM grupo g
    INNER JOIN usuario_grupo ug ON ug.id_grupo = g.id_grupo
    WHERE ug.id_usuario = @idUsuario AND g.tipo = 'personal'
    LIMIT 1
  `;
  const row = await getOne<{ "1": number }>(sql, { idUsuario });
  return !!row;
}

/** UPDATE parcial solo en grupales. */
export async function actualizarGrupoGrupal(
  idGrupo: number,
  datos: { nombre?: string; descripcion?: string; categoria?: string }
): Promise<GrupoDB | undefined> {
  const sets: string[] = [];
  const params: Record<string, unknown> = { idGrupo };

  if (datos.nombre !== undefined) {
    sets.push("nombre = @nombre");
    params.nombre = datos.nombre.trim();
  }
  if (datos.descripcion !== undefined) {
    sets.push("descripcion = @descripcion");
    params.descripcion = datos.descripcion.trim() === "" ? null : datos.descripcion.trim();
  }
  if (datos.categoria !== undefined) {
    sets.push("categoria = @categoria");
    params.categoria = datos.categoria.trim() === "" ? null : datos.categoria.trim();
  }
  if (sets.length === 0) return obtenerGrupoPorId(idGrupo);

  const sql = `UPDATE grupo SET ${sets.join(", ")} WHERE id_grupo = @idGrupo AND tipo = 'grupal'`;
  await run(sql, params);
  return obtenerGrupoPorId(idGrupo);
}

/** DELETE solo en grupales; el personal se frena en el service. */
export async function eliminarGrupoGrupal(idGrupo: number): Promise<boolean> {
  const sql = `DELETE FROM grupo WHERE id_grupo = @idGrupo AND tipo = 'grupal'`;
  const rs = await run(sql, { idGrupo });
  return filasAfectadas(rs) > 0;
}

/** Saca a un miembro del grupo (expulsar o abandonar usan esto). */
export async function eliminarMiembro(
  idGrupo: number,
  idUsuario: number
): Promise<boolean> {
  const sql = `DELETE FROM usuario_grupo WHERE id_grupo = @idGrupo AND id_usuario = @idUsuario`;
  const rs = await run(sql, { idGrupo, idUsuario });
  return filasAfectadas(rs) > 0;
}

/** Cuantos administradores tiene el grupo. */
export async function contarAdministradores(idGrupo: number): Promise<number> {
  const sql = `
    SELECT COUNT(*) AS cantidad FROM usuario_grupo
    WHERE id_grupo = @idGrupo AND rol = 'administrador'
  `;
  const row = await getOne<{ cantidad: number }>(sql, { idGrupo });
  return Number(row?.cantidad ?? 0);
}
