// Tabla oferta: CRUD + listados con filtros + contexto de grupo.
import { run, getOne, getAll, filasAfectadas } from "../../shared/db.helpers";
import type { OfertaDB } from "./oferta.scheme";
import {
  obtenerItemConContexto,
  obtenerRolEnGrupo,
} from "../productoLista/productoLista.model";
import { ahoraIso } from "../../shared/utils/dates";

// Filtros compartidos por los dos listados.
export interface FiltrosOferta {
  vigentes?: boolean;
  localidad?: string;
  provincia?: string;
}

// Columnas comunes (evita repetir el SELECT).
const SELECT_OFERTA = `
  SELECT o.id_oferta, o.id_producto_lista, o.nombre_comercio, o.ubicacion,
         o.localidad, o.provincia, o.latitud, o.longitud,
         o.fecha_inicio, o.fecha_fin, o.porcentaje_descuento,
         o.precio_original, o.precio_oferta, o.descripcion, o.fecha_creacion
  FROM oferta o
`;

// Arma ANDs + params de vigentes/ubicacion.
function whereFiltros(f: FiltrosOferta): {
  sql: string;
  params: Record<string, unknown>;
} {
  const conds: string[] = [];
  const params: Record<string, unknown> = {};
  if (f.vigentes) {
    conds.push("o.fecha_inicio <= @ahora AND o.fecha_fin >= @ahora");
    params.ahora = ahoraIso();
  }
  if (f.localidad) {
    conds.push("o.localidad = @localidad");
    params.localidad = f.localidad;
  }
  if (f.provincia) {
    conds.push("o.provincia = @provincia");
    params.provincia = f.provincia;
  }
  return { sql: conds.length ? `AND ${conds.join(" AND ")}` : "", params };
}

/** Alta ligada al producto. */
export async function crearOferta(
  idProductoLista: number,
  datos: {
    nombre_comercio: string;
    ubicacion?: string;
    localidad?: string;
    provincia?: string;
    latitud?: number | null;
    longitud?: number | null;
    fecha_inicio: string;
    fecha_fin: string;
    porcentaje_descuento?: number | null;
    precio_original?: number | null;
    precio_oferta?: number | null;
    descripcion?: string;
  }
): Promise<OfertaDB | undefined> {
  const sql = `
    INSERT INTO oferta (
      id_producto_lista, nombre_comercio, ubicacion, localidad, provincia,
      latitud, longitud, fecha_inicio, fecha_fin,
      porcentaje_descuento, precio_original, precio_oferta,
      descripcion, fecha_creacion
    )
    VALUES (
      @idProductoLista, @nombreComercio, @ubicacion, @localidad, @provincia,
      @latitud, @longitud, @fechaInicio, @fechaFin,
      @porcentaje, @precioOriginal, @precioOferta,
      @descripcion, @fechaCreacion
    )
  `;
  const rs = await run(sql, {
    idProductoLista,
    nombreComercio: datos.nombre_comercio,
    ubicacion: datos.ubicacion ?? null,
    localidad: datos.localidad ?? null,
    provincia: datos.provincia ?? null,
    latitud: datos.latitud ?? null,
    longitud: datos.longitud ?? null,
    fechaInicio: datos.fecha_inicio,
    fechaFin: datos.fecha_fin,
    porcentaje: datos.porcentaje_descuento ?? null,
    precioOriginal: datos.precio_original ?? null,
    precioOferta: datos.precio_oferta ?? null,
    descripcion: datos.descripcion ?? null,
    fechaCreacion: ahoraIso(),
  });
  const id = rs.lastInsertRowid;
  if (id == null) return undefined;
  return obtenerOfertaPorId(Number(id));
}

/** Por id, sin chequear pertenencia. */
export async function obtenerOfertaPorId(idOferta: number): Promise<OfertaDB | undefined> {
  const sql = `${SELECT_OFERTA} WHERE o.id_oferta = @idOferta LIMIT 1`;
  return getOne<OfertaDB>(sql, { idOferta });
}

/** Del producto, con filtros. */
export async function obtenerOfertasPorProducto(
  idProductoLista: number,
  filtros: FiltrosOferta = {}
): Promise<OfertaDB[]> {
  const f = whereFiltros(filtros);
  const sql = `
    ${SELECT_OFERTA}
    WHERE o.id_producto_lista = @idProductoLista ${f.sql}
    ORDER BY o.fecha_fin ASC, o.id_oferta ASC
  `;
  return getAll<OfertaDB>(sql, { idProductoLista, ...f.params });
}

/** De la lista (JOIN producto), con filtros. */
export async function obtenerOfertasPorLista(
  idLista: number,
  filtros: FiltrosOferta = {}
): Promise<OfertaDB[]> {
  const f = whereFiltros(filtros);
  const sql = `
    ${SELECT_OFERTA}
    INNER JOIN producto_lista pl ON pl.id_producto_lista = o.id_producto_lista
    WHERE pl.id_lista = @idLista ${f.sql}
    ORDER BY o.fecha_fin ASC, o.id_oferta ASC
  `;
  return getAll<OfertaDB>(sql, { idLista, ...f.params });
}

/** UPDATE parcial. */
export async function actualizarOferta(
  idOferta: number,
  datos: Partial<{
    nombre_comercio: string;
    ubicacion: string;
    localidad: string;
    provincia: string;
    latitud: number | null;
    longitud: number | null;
    fecha_inicio: string;
    fecha_fin: string;
    porcentaje_descuento: number | null;
    precio_original: number | null;
    precio_oferta: number | null;
    descripcion: string;
  }>
): Promise<OfertaDB | undefined> {
  const sets: string[] = [];
  const params: Record<string, unknown> = { idOferta };
  const texto = (k: string, v: string) => {
    sets.push(`${k} = @${k}`);
    params[k] = v.trim() === "" ? null : v.trim();
  };
  if (datos.nombre_comercio !== undefined) {
    sets.push("nombre_comercio = @nombre_comercio");
    params.nombre_comercio = datos.nombre_comercio.trim();
  }
  if (datos.ubicacion !== undefined) texto("ubicacion", datos.ubicacion);
  if (datos.localidad !== undefined) texto("localidad", datos.localidad);
  if (datos.provincia !== undefined) texto("provincia", datos.provincia);
  if (datos.latitud !== undefined) {
    sets.push("latitud = @latitud");
    params.latitud = datos.latitud;
  }
  if (datos.longitud !== undefined) {
    sets.push("longitud = @longitud");
    params.longitud = datos.longitud;
  }
  if (datos.fecha_inicio !== undefined) {
    sets.push("fecha_inicio = @fecha_inicio");
    params.fecha_inicio = datos.fecha_inicio.trim();
  }
  if (datos.fecha_fin !== undefined) {
    sets.push("fecha_fin = @fecha_fin");
    params.fecha_fin = datos.fecha_fin.trim();
  }
  if (datos.porcentaje_descuento !== undefined) {
    sets.push("porcentaje_descuento = @porcentaje_descuento");
    params.porcentaje_descuento = datos.porcentaje_descuento;
  }
  if (datos.precio_original !== undefined) {
    sets.push("precio_original = @precio_original");
    params.precio_original = datos.precio_original;
  }
  if (datos.precio_oferta !== undefined) {
    sets.push("precio_oferta = @precio_oferta");
    params.precio_oferta = datos.precio_oferta;
  }
  if (datos.descripcion !== undefined) texto("descripcion", datos.descripcion);
  if (sets.length === 0) return obtenerOfertaPorId(idOferta);
  const sql = `UPDATE oferta SET ${sets.join(", ")} WHERE id_oferta = @idOferta`;
  await run(sql, params);
  return obtenerOfertaPorId(idOferta);
}

/** DELETE. */
export async function eliminarOferta(idOferta: number): Promise<boolean> {
  const sql = `DELETE FROM oferta WHERE id_oferta = @idOferta`;
  const rs = await run(sql, { idOferta });
  return filasAfectadas(rs) > 0;
}

/** Oferta + grupo via producto->lista (reutiliza el item). */
export async function obtenerOfertaConContexto(
  idUsuario: number,
  idOferta: number
): Promise<{
  existe: boolean;
  pertenece: boolean;
  esAdminGrupo: boolean;
  rolGrupo: "administrador" | "miembro" | null;
  idGrupo: number | null;
  idLista: number | null;
  idProductoLista: number | null;
  oferta: OfertaDB | null;
}> {
  const vacio = {
    existe: false,
    pertenece: false,
    esAdminGrupo: false,
    rolGrupo: null,
    idGrupo: null,
    idLista: null,
    idProductoLista: null,
    oferta: null,
  } as const;

  const oferta = await obtenerOfertaPorId(idOferta);
  if (!oferta) return { ...vacio };

  const ctx = await obtenerItemConContexto(oferta.id_producto_lista);
  if (!ctx.item || ctx.idGrupo == null) return { ...vacio };

  const rol = await obtenerRolEnGrupo(idUsuario, ctx.idGrupo);
  if (!rol) {
    return {
      ...vacio,
      existe: true,
      idGrupo: ctx.idGrupo,
      idLista: ctx.idLista,
      idProductoLista: oferta.id_producto_lista,
      oferta,
    };
  }

  return {
    existe: true,
    pertenece: true,
    esAdminGrupo: rol === "administrador",
    rolGrupo: rol,
    idGrupo: ctx.idGrupo,
    idLista: ctx.idLista,
    idProductoLista: oferta.id_producto_lista,
    oferta,
  };
}

/** Existe el producto + pertenencia al grupo. */
export async function obtenerRolSobreProducto(
  idUsuario: number,
  idProductoLista: number
): Promise<{
  existeProducto: boolean;
  pertenece: boolean;
  idGrupo: number | null;
}> {
  const ctx = await obtenerItemConContexto(idProductoLista);
  if (!ctx.item || ctx.idGrupo == null) {
    return { existeProducto: false, pertenece: false, idGrupo: null };
  }
  const rol = await obtenerRolEnGrupo(idUsuario, ctx.idGrupo);
  if (!rol) return { existeProducto: true, pertenece: false, idGrupo: ctx.idGrupo };
  return { existeProducto: true, pertenece: true, idGrupo: ctx.idGrupo };
}
