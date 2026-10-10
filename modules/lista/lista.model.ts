// Tabla lista: CRUD + permisos por JOIN con usuario_grupo.
import { run, getOne, getAll, filasAfectadas } from "../../shared/db.helpers";
import type { ListaDB } from "./lista.scheme";
import { ahoraIso } from "../../shared/utils/dates";

/** Crea en estado activa con el usuario como creador. */
export async function crearLista(
  idGrupo: number,
  idUsuarioCreador: number,
  datos: { nombre: string; descripcion?: string }
): Promise<ListaDB | undefined> {
  const fecha = ahoraIso();
  const sql = `
    INSERT INTO lista (
      id_grupo, id_usuario_creador, id_usuario_administrador,
      nombre, descripcion, estado, fecha_creacion, fecha_actualizacion
    )
    VALUES (
      @idGrupo, @idUsuarioCreador, NULL,
      @nombre, @descripcion, 'activa', @fechaCreacion, @fechaActualizacion
    )
  `;
  const rs = await run(sql, {
    idGrupo,
    idUsuarioCreador,
    nombre: datos.nombre,
    descripcion: datos.descripcion ?? null,
    fechaCreacion: fecha,
    fechaActualizacion: fecha,
  });
  const id = rs.lastInsertRowid;
  if (id == null) return undefined;
  return obtenerListaPorId(Number(id));
}

/** Por id, sin chequear pertenencia. */
export async function obtenerListaPorId(idLista: number): Promise<ListaDB | undefined> {
  const sql = `
    SELECT id_lista, id_grupo, id_usuario_creador, id_usuario_administrador,
           nombre, descripcion, estado, fecha_creacion, fecha_actualizacion
    FROM lista
    WHERE id_lista = @idLista
    LIMIT 1
  `;
  return getOne<ListaDB>(sql, { idLista });
}

/** Listas del grupo (actualizadas primero). */
export async function obtenerListasPorGrupo(idGrupo: number): Promise<ListaDB[]> {
  const sql = `
    SELECT id_lista, id_grupo, id_usuario_creador, id_usuario_administrador,
           nombre, descripcion, estado, fecha_creacion, fecha_actualizacion
    FROM lista
    WHERE id_grupo = @idGrupo
    ORDER BY fecha_actualizacion DESC, fecha_creacion DESC
  `;
  return getAll<ListaDB>(sql, { idGrupo });
}

/** UPDATE parcial y refresca fecha_actualizacion. */
export async function actualizarLista(
  idLista: number,
  datos: { nombre?: string; descripcion?: string; estado?: string }
): Promise<ListaDB | undefined> {
  const sets: string[] = [];
  const params: Record<string, unknown> = { idLista };
  if (datos.nombre !== undefined) {
    sets.push("nombre = @nombre");
    params.nombre = datos.nombre.trim();
  }
  if (datos.descripcion !== undefined) {
    sets.push("descripcion = @descripcion");
    params.descripcion = datos.descripcion.trim() === "" ? null : datos.descripcion.trim();
  }
  if (datos.estado !== undefined) {
    sets.push("estado = @estado");
    params.estado = datos.estado;
  }
  sets.push("fecha_actualizacion = @fechaActualizacion");
  params.fechaActualizacion = ahoraIso();
  const sql = `UPDATE lista SET ${sets.join(", ")} WHERE id_lista = @idLista`;
  await run(sql, params);
  return obtenerListaPorId(idLista);
}

/** DELETE (productos caen por CASCADE). */
export async function eliminarLista(idLista: number): Promise<boolean> {
  const sql = `DELETE FROM lista WHERE id_lista = @idLista`;
  const rs = await run(sql, { idLista });
  return filasAfectadas(rs) > 0;
}

/** Existe + pertenencia + rol: lo que usan todos los permisos. */
export async function obtenerPermisosSobreLista(
  idUsuario: number,
  idLista: number
): Promise<{
  existe: boolean;
  pertenece: boolean;
  idGrupo: number | null;
  esCreadorLista: boolean;
  esAdminGrupo: boolean;
  rolGrupo: "administrador" | "miembro" | null;
  lista: ListaDB | null;
}> {
  const lista = await obtenerListaPorId(idLista);
  if (!lista) {
    return {
      existe: false,
      pertenece: false,
      idGrupo: null,
      esCreadorLista: false,
      esAdminGrupo: false,
      rolGrupo: null,
      lista: null,
    };
  }
  const sqlRol = `
    SELECT ug.rol
    FROM usuario_grupo ug
    WHERE ug.id_usuario = @idUsuario AND ug.id_grupo = @idGrupo
    LIMIT 1
  `;
  const rolRow = await getOne<{ rol: "administrador" | "miembro" }>(sqlRol, {
    idUsuario,
    idGrupo: lista.id_grupo,
  });
  const pertenece = !!rolRow;
  const rolGrupo = rolRow?.rol ?? null;
  const esAdminGrupo = rolGrupo === "administrador";
  const esCreadorLista = lista.id_usuario_creador === idUsuario;
  return {
    existe: true,
    pertenece,
    idGrupo: lista.id_grupo,
    esCreadorLista,
    esAdminGrupo,
    rolGrupo,
    lista,
  };
}
