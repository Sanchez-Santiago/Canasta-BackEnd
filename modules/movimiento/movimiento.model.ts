// Tabla movimiento: CRUD + totales por tipo + permisos.
import { run, getOne, getAll, filasAfectadas } from "../../shared/db.helpers";
import type { MovimientoDB } from "./movimiento.scheme";
import { ahoraIso } from "../../shared/utils/dates";

/** Alta con el usuario como creador. */
export async function crearMovimiento(
  idGrupo: number,
  idUsuarioCreador: number,
  datos: {
    nombre: string;
    monto: number;
    descripcion?: string;
    tipo: "ingreso" | "gasto";
    foto_url?: string | null;
    fecha_movimiento: string;
  }
): Promise<MovimientoDB | undefined> {
  const sql = `
    INSERT INTO movimiento (
      id_usuario_creador, id_grupo, nombre, monto, descripcion,
      tipo, foto_url, fecha_movimiento, fecha_creacion
    )
    VALUES (
      @idUsuarioCreador, @idGrupo, @nombre, @monto, @descripcion,
      @tipo, @fotoUrl, @fechaMovimiento, @fechaCreacion
    )
  `;
  const rs = await run(sql, {
    idUsuarioCreador,
    idGrupo,
    nombre: datos.nombre,
    monto: datos.monto,
    descripcion: datos.descripcion ?? null,
    tipo: datos.tipo,
    fotoUrl: datos.foto_url ?? null,
    fechaMovimiento: datos.fecha_movimiento,
    fechaCreacion: ahoraIso(),
  });
  const id = rs.lastInsertRowid;
  if (id == null) return undefined;
  return obtenerMovimientoPorId(Number(id));
}

/** Por id, sin chequear pertenencia. */
export async function obtenerMovimientoPorId(
  idMovimiento: number
): Promise<MovimientoDB | undefined> {
  const sql = `
    SELECT id_movimiento, id_usuario_creador, id_grupo, nombre, monto,
           descripcion, tipo, foto_url, fecha_movimiento, fecha_creacion
    FROM movimiento
    WHERE id_movimiento = @idMovimiento
    LIMIT 1
  `;
  return getOne<MovimientoDB>(sql, { idMovimiento });
}

/** Del grupo, recientes primero, con filtro ?tipo=. */
export async function obtenerMovimientosPorGrupo(
  idGrupo: number,
  tipo?: "ingreso" | "gasto"
): Promise<MovimientoDB[]> {
  const filtro = tipo ? "AND tipo = @tipo" : "";
  const sql = `
    SELECT id_movimiento, id_usuario_creador, id_grupo, nombre, monto,
           descripcion, tipo, foto_url, fecha_movimiento, fecha_creacion
    FROM movimiento
    WHERE id_grupo = @idGrupo ${filtro}
    ORDER BY fecha_movimiento DESC, id_movimiento DESC
  `;
  const params: Record<string, unknown> = { idGrupo };
  if (tipo) params.tipo = tipo;
  return getAll<MovimientoDB>(sql, params);
}

/** UPDATE parcial. */
export async function actualizarMovimiento(
  idMovimiento: number,
  datos: Partial<{
    nombre: string;
    monto: number;
    descripcion: string;
    tipo: "ingreso" | "gasto";
    foto_url: string | null;
    fecha_movimiento: string;
  }>
): Promise<MovimientoDB | undefined> {
  const sets: string[] = [];
  const params: Record<string, unknown> = { idMovimiento };
  if (datos.nombre !== undefined) {
    sets.push("nombre = @nombre");
    params.nombre = datos.nombre.trim();
  }
  if (datos.monto !== undefined) {
    sets.push("monto = @monto");
    params.monto = datos.monto;
  }
  if (datos.descripcion !== undefined) {
    sets.push("descripcion = @descripcion");
    params.descripcion = datos.descripcion.trim() === "" ? null : datos.descripcion.trim();
  }
  if (datos.tipo !== undefined) {
    sets.push("tipo = @tipo");
    params.tipo = datos.tipo;
  }
  if (datos.foto_url !== undefined) {
    sets.push("foto_url = @fotoUrl");
    params.fotoUrl = datos.foto_url;
  }
  if (datos.fecha_movimiento !== undefined) {
    sets.push("fecha_movimiento = @fechaMovimiento");
    params.fechaMovimiento = datos.fecha_movimiento.trim();
  }
  if (sets.length === 0) return obtenerMovimientoPorId(idMovimiento);
  const sql = `UPDATE movimiento SET ${sets.join(", ")} WHERE id_movimiento = @idMovimiento`;
  await run(sql, params);
  return obtenerMovimientoPorId(idMovimiento);
}

/** DELETE. */
export async function eliminarMovimiento(idMovimiento: number): Promise<boolean> {
  const sql = `DELETE FROM movimiento WHERE id_movimiento = @idMovimiento`;
  const rs = await run(sql, { idMovimiento });
  return filasAfectadas(rs) > 0;
}

/** SUM y COUNT por tipo (base del resumen). */
export async function obtenerTotalesPorGrupo(
  idGrupo: number
): Promise<{ tipo: "ingreso" | "gasto"; total: number; cantidad: number }[]> {
  const sql = `
    SELECT tipo, SUM(monto) AS total, COUNT(*) AS cantidad
    FROM movimiento
    WHERE id_grupo = @idGrupo
    GROUP BY tipo
  `;
  return getAll<{ tipo: "ingreso" | "gasto"; total: number; cantidad: number }>(sql, {
    idGrupo,
  });
}

/** Existe + pertenencia + rol/creador. */
export async function obtenerPermisosSobreMovimiento(
  idUsuario: number,
  idMovimiento: number
): Promise<{
  existe: boolean;
  pertenece: boolean;
  idGrupo: number | null;
  esCreador: boolean;
  esAdminGrupo: boolean;
  rolGrupo: "administrador" | "miembro" | null;
  movimiento: MovimientoDB | null;
}> {
  const movimiento = await obtenerMovimientoPorId(idMovimiento);
  if (!movimiento) {
    return {
      existe: false,
      pertenece: false,
      idGrupo: null,
      esCreador: false,
      esAdminGrupo: false,
      rolGrupo: null,
      movimiento: null,
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
    idGrupo: movimiento.id_grupo,
  });
  const pertenece = !!rolRow;
  const rolGrupo = rolRow?.rol ?? null;
  const esAdminGrupo = rolGrupo === "administrador";
  const esCreador = movimiento.id_usuario_creador === idUsuario;
  return {
    existe: true,
    pertenece,
    idGrupo: movimiento.id_grupo,
    esCreador,
    esAdminGrupo,
    rolGrupo,
    movimiento,
  };
}
