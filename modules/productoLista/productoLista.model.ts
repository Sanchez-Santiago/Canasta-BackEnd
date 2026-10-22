// Tabla producto_lista: CRUD + contexto para permisos.
import { run, getOne, getAll, filasAfectadas } from "../../shared/db.helpers";
import type { ProductoListaDB } from "./productoLista.scheme";

/** Alta con defaults (secundario/pendiente/'unidad'). */
export async function crearProductoLista(
  idLista: number,
  idUsuarioCreador: number,
  datos: {
    nombre: string;
    descripcion?: string;
    prioridad?: "prioritario" | "esencial" | "secundario";
    cantidad: number;
    precio_estimado_unitario?: number | null;
    codigo_producto?: string | null;
    unidad_medida?: string;
    marca?: string | null;
    categoria?: string | null;
    estado?: "pendiente" | "comprado" | "omitido";
  }
): Promise<ProductoListaDB | undefined> {
  const sql = `
    INSERT INTO producto_lista (
      id_lista, id_usuario_creador, nombre, descripcion,
      prioridad, cantidad, precio_estimado_unitario, codigo_producto,
      unidad_medida, marca, categoria, estado, fecha_creacion
    )
    VALUES (
      @idLista, @idUsuarioCreador, @nombre, @descripcion,
      @prioridad, @cantidad, @precioEstimado, @codigoProducto,
      @unidadMedida, @marca, @categoria, @estado, datetime('now')
    )
  `;
  const rs = await run(sql, {
    idLista,
    idUsuarioCreador,
    nombre: datos.nombre,
    descripcion: datos.descripcion ?? null,
    prioridad: datos.prioridad ?? "secundario",
    cantidad: datos.cantidad,
    precioEstimado: datos.precio_estimado_unitario ?? null,
    codigoProducto: datos.codigo_producto ?? null,
    unidadMedida: datos.unidad_medida ?? "unidad",
    marca: datos.marca ?? null,
    categoria: datos.categoria ?? null,
    estado: datos.estado ?? "pendiente",
  });
  const id = rs.lastInsertRowid;
  if (id == null) return undefined;
  return obtenerProductoListaPorId(Number(id));
}

/** Columnas del item (evita repetir el SELECT). */
const COLUMNAS_ITEM = `id_producto_lista, id_lista, id_usuario_creador, nombre, descripcion,
       prioridad, cantidad, precio_estimado_unitario, codigo_producto,
       unidad_medida, marca, categoria, estado, fecha_creacion`;

/** Por id, sin chequear pertenencia. */
export async function obtenerProductoListaPorId(
  idProductoLista: number
): Promise<ProductoListaDB | undefined> {
  const sql = `
    SELECT ${COLUMNAS_ITEM}
    FROM producto_lista
    WHERE id_producto_lista = @idProductoLista
    LIMIT 1
  `;
  return getOne<ProductoListaDB>(sql, { idProductoLista });
}

/** Items de una lista, con filtros opcionales por marca/categoria/unidad. */
export async function obtenerProductosPorLista(
  idLista: number,
  filtros: { marca?: string; categoria?: string; unidad_medida?: string } = {}
): Promise<ProductoListaDB[]> {
  const conds = ["id_lista = @idLista"];
  const params: Record<string, unknown> = { idLista };
  if (filtros.marca) {
    conds.push("marca LIKE @marca");
    params.marca = `%${filtros.marca}%`;
  }
  if (filtros.categoria) {
    conds.push("categoria LIKE @categoria");
    params.categoria = `%${filtros.categoria}%`;
  }
  if (filtros.unidad_medida) {
    conds.push("unidad_medida = @unidadMedida");
    params.unidadMedida = filtros.unidad_medida;
  }
  const sql = `
    SELECT ${COLUMNAS_ITEM}
    FROM producto_lista
    WHERE ${conds.join(" AND ")}
    ORDER BY
      CASE prioridad
        WHEN 'prioritario' THEN 0
        WHEN 'esencial' THEN 1
        WHEN 'secundario' THEN 2
        ELSE 3
      END,
      fecha_creacion ASC,
      id_producto_lista ASC
  `;
  return getAll<ProductoListaDB>(sql, params);
}

/** UPDATE parcial. */
export async function actualizarProductoLista(
  idProductoLista: number,
  datos: Partial<{
    nombre: string;
    descripcion: string;
    prioridad: "prioritario" | "esencial" | "secundario";
    cantidad: number;
    precio_estimado_unitario: number | null;
    codigo_producto: string | null;
    unidad_medida: "unidad" | "kg" | "gramos" | "L" | "ml" | "docena" | "media_docena" | "paquete" | "caja" | "botella" | "lata" | "sobre" | "rollo" | "bolsa" | "m";
    marca: string | null;
    categoria: string | null;
    estado: "pendiente" | "comprado" | "omitido";
  }>
): Promise<ProductoListaDB | undefined> {
  const sets: string[] = [];
  const params: Record<string, unknown> = { idProductoLista };
  if (datos.nombre !== undefined) {
    sets.push("nombre = @nombre");
    params.nombre = datos.nombre.trim();
  }
  if (datos.descripcion !== undefined) {
    sets.push("descripcion = @descripcion");
    params.descripcion = datos.descripcion.trim() === "" ? null : datos.descripcion.trim();
  }
  if (datos.prioridad !== undefined) {
    sets.push("prioridad = @prioridad");
    params.prioridad = datos.prioridad;
  }
  if (datos.cantidad !== undefined) {
    sets.push("cantidad = @cantidad");
    params.cantidad = datos.cantidad;
  }
  if (datos.precio_estimado_unitario !== undefined) {
    sets.push("precio_estimado_unitario = @precioEstimado");
    params.precioEstimado = datos.precio_estimado_unitario;
  }
  if (datos.codigo_producto !== undefined) {
    sets.push("codigo_producto = @codigoProducto");
    params.codigoProducto = datos.codigo_producto;
  }
  if (datos.unidad_medida !== undefined) {
    sets.push("unidad_medida = @unidadMedida");
    params.unidadMedida = datos.unidad_medida;
  }
  if (datos.marca !== undefined) {
    sets.push("marca = @marca");
    params.marca = datos.marca;
  }
  if (datos.categoria !== undefined) {
    sets.push("categoria = @categoria");
    params.categoria = datos.categoria;
  }
  if (datos.estado !== undefined) {
    sets.push("estado = @estado");
    params.estado = datos.estado;
  }
  if (sets.length === 0) return obtenerProductoListaPorId(idProductoLista);
  const sql = `UPDATE producto_lista SET ${sets.join(", ")} WHERE id_producto_lista = @idProductoLista`;
  await run(sql, params);
  return obtenerProductoListaPorId(idProductoLista);
}

/** DELETE. */
export async function eliminarProductoLista(idProductoLista: number): Promise<boolean> {
  const sql = `DELETE FROM producto_lista WHERE id_producto_lista = @idProductoLista`;
  const rs = await run(sql, { idProductoLista });
  return filasAfectadas(rs) > 0;
}

/** Item + grupo y creador de su lista (permisos). */
export async function obtenerItemConContexto(idProductoLista: number): Promise<{
  item: ProductoListaDB | null;
  idLista: number | null;
  idGrupo: number | null;
  idUsuarioCreadorLista: number | null;
}> {
  const sql = `
    SELECT pl.id_producto_lista, pl.id_lista, pl.id_usuario_creador, pl.nombre, pl.descripcion,
           pl.prioridad, pl.cantidad, pl.precio_estimado_unitario, pl.codigo_producto,
           pl.unidad_medida, pl.marca, pl.categoria, pl.estado, pl.fecha_creacion,
           l.id_grupo, l.id_usuario_creador AS creador_lista
    FROM producto_lista pl
    INNER JOIN lista l ON l.id_lista = pl.id_lista
    WHERE pl.id_producto_lista = @idProductoLista
    LIMIT 1
  `;
  const row = await getOne<any>(sql, { idProductoLista });
  if (!row) {
    return { item: null, idLista: null, idGrupo: null, idUsuarioCreadorLista: null };
  }
  const item: ProductoListaDB = {
    id_producto_lista: row.id_producto_lista,
    id_lista: row.id_lista,
    id_usuario_creador: row.id_usuario_creador,
    nombre: row.nombre,
    descripcion: row.descripcion,
    prioridad: row.prioridad,
    cantidad: row.cantidad,
    precio_estimado_unitario: row.precio_estimado_unitario,
    codigo_producto: row.codigo_producto,
    unidad_medida: row.unidad_medida,
    marca: row.marca,
    categoria: row.categoria,
    estado: row.estado,
    fecha_creacion: row.fecha_creacion,
  };
  return {
    item,
    idLista: row.id_lista,
    idGrupo: row.id_grupo,
    idUsuarioCreadorLista: row.creador_lista,
  };
}

/** Rol del usuario o null si no pertenece. */
export async function obtenerRolEnGrupo(
  idUsuario: number,
  idGrupo: number
): Promise<"administrador" | "miembro" | null> {
  const sql = `SELECT rol FROM usuario_grupo WHERE id_usuario=@idUsuario AND id_grupo=@idGrupo LIMIT 1`;
  const row = await getOne<{ rol: "administrador" | "miembro" }>(sql, { idUsuario, idGrupo });
  return row?.rol ?? null;
}
