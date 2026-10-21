// Tabla oferta (catalogo scrapeado): CRUD + listado con filtros.
// `id_producto_lista` NULL = oferta del catalogo global (buscador);
// con valor = guardada desde un producto, de ahi salen grupo/admin/creador.
import { run, getOne, getAll, filasAfectadas } from "../../shared/db.helpers";
import { ahoraIso } from "../../shared/utils/dates";
import type {
  CrearOfertaBody,
  ActualizarOfertaBody,
  ListarOfertasQuery,
  OfertaDB,
} from "./oferta.scheme";
import { serializarListaJson } from "./oferta.scheme";

/** Columnas comunes (evita repetir el SELECT). */
const SELECT_OFERTA = `
  SELECT id, fuente, comercio, producto, url, producto_id,
         precio_lista_pesos, precio_oferta_pesos, descuento_porc,
         ean, marca, categoria, categoria_ruta, detalle,
         precio_unidad, unidad_medida, imagen_url, stock, disponible,
         ubicacion, localidad, provincia,
         fecha_inicio, fecha_fin,
         cuotas, reintegro, promos, tipo_promo,
         fecha_captura, creado_en, actualizado_en, id_producto_lista
  FROM oferta
`;

/** Contexto de ubicación (una cadena vacía se guarda como NULL). */
function nuloSiVacio(v?: string | null): string | null {
  if (v === undefined || v === null) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

/** Alta: devuelve la fila creada. */
export async function crearOferta(
  datos: CrearOfertaBody
): Promise<OfertaDB | undefined> {
  const sql = `
    INSERT INTO oferta (
      fuente, comercio, producto, url, producto_id,
      precio_lista_pesos, precio_oferta_pesos, descuento_porc,
      ean, marca, categoria, categoria_ruta, detalle,
      precio_unidad, unidad_medida, imagen_url, stock, disponible,
      ubicacion, localidad, provincia,
      fecha_inicio, fecha_fin,
      cuotas, reintegro, promos, tipo_promo,
      fecha_captura, creado_en, actualizado_en, id_producto_lista
    )
    VALUES (
      @fuente, @comercio, @producto, @url, @productoId,
      @precioLista, @precioOferta, @descuento,
      @ean, @marca, @categoria, @categoriaRuta, @detalle,
      @precioUnidad, @unidadMedida, @imagenUrl, @stock, @disponible,
      @ubicacion, @localidad, @provincia,
      @fechaInicio, @fechaFin,
      @cuotas, @reintegro, @promos, @tipoPromo,
      @fechaCaptura, @ahora, @ahora, @idProductoLista
    )
  `;
  const ahora = ahoraIso();
  const rs = await run(sql, {
    fuente: datos.fuente,
    comercio: nuloSiVacio(datos.comercio),
    producto: datos.producto,
    url: datos.url,
    productoId: nuloSiVacio(datos.producto_id),
    precioLista: datos.precio_lista_pesos ?? null,
    precioOferta: datos.precio_oferta_pesos ?? null,
    descuento: datos.descuento_porc ?? null,
    ean: nuloSiVacio(datos.ean),
    marca: nuloSiVacio(datos.marca),
    categoria: nuloSiVacio(datos.categoria),
    categoriaRuta: serializarListaJson(datos.categoria_ruta),
    detalle: nuloSiVacio(datos.detalle),
    precioUnidad: datos.precio_unidad ?? null,
    unidadMedida: datos.unidad_medida ?? null,
    imagenUrl: nuloSiVacio(datos.imagen_url),
    stock: datos.stock ?? null,
    disponible: datos.disponible === false ? 0 : 1,
    ubicacion: nuloSiVacio(datos.ubicacion),
    localidad: nuloSiVacio(datos.localidad),
    provincia: nuloSiVacio(datos.provincia),
    fechaInicio: datos.fecha_inicio ?? null,
    fechaFin: datos.fecha_fin ?? null,
    cuotas: serializarListaJson(datos.cuotas),
    reintegro: nuloSiVacio(datos.reintegro),
    promos: serializarListaJson(datos.promos),
    tipoPromo: nuloSiVacio(datos.tipo_promo),
    fechaCaptura: datos.fecha_captura ?? ahora,
    idProductoLista: datos.id_producto_lista ?? null,
    ahora,
  });
  const id = rs.lastInsertRowid;
  if (id == null) return undefined;
  return obtenerOfertaPorId(Number(id));
}

/** Por id. */
export async function obtenerOfertaPorId(
  idOferta: number
): Promise<OfertaDB | undefined> {
  return getOne<OfertaDB>(
    `${SELECT_OFERTA} WHERE id = @idOferta LIMIT 1`,
    { idOferta }
  );
}

/** Columnas actualizables y su valor normalizado. */
const CAMPOS_TEXTO = [
  "comercio",
  "producto",
  "url",
  "producto_id",
  "ean",
  "marca",
  "categoria",
  "detalle",
  "unidad_medida",
  "imagen_url",
  "ubicacion",
  "localidad",
  "provincia",
  "fecha_inicio",
  "fecha_fin",
  "reintegro",
  "tipo_promo",
  "fecha_captura",
] as const;

const CAMPOS_NUMERO = [
  "precio_lista_pesos",
  "precio_oferta_pesos",
  "descuento_porc",
  "precio_unidad",
  "stock",
] as const;

/** UPDATE parcial; devuelve la fila actualizada. */
export async function actualizarOferta(
  idOferta: number,
  datos: ActualizarOfertaBody
): Promise<OfertaDB | undefined> {
  const sets: string[] = [];
  const params: Record<string, unknown> = { idOferta };

  if (datos.fuente !== undefined) {
    sets.push("fuente = @fuente");
    params.fuente = datos.fuente;
  }
  for (const k of CAMPOS_TEXTO) {
    const v = (datos as Record<string, unknown>)[k];
    if (v === undefined) continue;
    sets.push(`${k} = @${k}`);
    // producto/url no se vacian a NULL: son obligatorios.
    params[k] =
      k === "producto" || k === "url" ? v : nuloSiVacio(v as string | null);
  }
  for (const k of CAMPOS_NUMERO) {
    const v = (datos as Record<string, unknown>)[k];
    if (v === undefined) continue;
    sets.push(`${k} = @${k}`);
    params[k] = v;
  }
  if (datos.categoria_ruta !== undefined) {
    sets.push("categoria_ruta = @categoria_ruta");
    params.categoria_ruta = serializarListaJson(datos.categoria_ruta);
  }
  if (datos.cuotas !== undefined) {
    sets.push("cuotas = @cuotas");
    params.cuotas = serializarListaJson(datos.cuotas);
  }
  if (datos.promos !== undefined) {
    sets.push("promos = @promos");
    params.promos = serializarListaJson(datos.promos);
  }
  if (datos.disponible !== undefined) {
    sets.push("disponible = @disponible");
    params.disponible = datos.disponible ? 1 : 0;
  }
  if (datos.id_producto_lista !== undefined) {
    sets.push("id_producto_lista = @idProductoLista");
    params.idProductoLista = datos.id_producto_lista ?? null;
  }

  if (sets.length === 0) return obtenerOfertaPorId(idOferta);

  sets.push("actualizado_en = @ahora");
  params.ahora = ahoraIso();

  const sql = `UPDATE oferta SET ${sets.join(", ")} WHERE id = @idOferta`;
  await run(sql, params);
  return obtenerOfertaPorId(idOferta);
}

/** DELETE. */
export async function eliminarOferta(idOferta: number): Promise<boolean> {
  const rs = await run(`DELETE FROM oferta WHERE id = @idOferta`, { idOferta });
  return filasAfectadas(rs) > 0;
}

/** WHERE dinamico del listado + params. */
function whereListado(f: ListarOfertasQuery): {
  sql: string;
  params: Record<string, unknown>;
} {
  const conds: string[] = [];
  const params: Record<string, unknown> = {};
  if (f.fuente) {
    conds.push("fuente = @fuente");
    params.fuente = f.fuente;
  }
  if (f.comercio) {
    conds.push("comercio LIKE @comercio");
    params.comercio = `%${f.comercio}%`;
  }
  if (f.ean) {
    conds.push("ean = @ean");
    params.ean = f.ean;
  }
  if (f.marca) {
    conds.push("marca LIKE @marca");
    params.marca = `%${f.marca}%`;
  }
  if (f.categoria) {
    conds.push("(categoria LIKE @categoria OR categoria_ruta LIKE @categoria)");
    params.categoria = `%${f.categoria}%`;
  }
  if (f.producto) {
    conds.push("producto LIKE @producto");
    params.producto = `%${f.producto}%`;
  }
  if (f.localidad) {
    conds.push("localidad = @localidad");
    params.localidad = f.localidad;
  }
  if (f.provincia) {
    conds.push("provincia = @provincia");
    params.provincia = f.provincia;
  }
  if (f.disponible === "true") conds.push("disponible = 1");
  if (f.disponible === "false") conds.push("disponible = 0");
  if (f.vigentes === "true") {
    // Vigente = sin fecha de fin, o con fin que todavia no paso.
    conds.push("(fecha_fin IS NULL OR fecha_fin >= @ahora)");
    params.ahora = ahoraIso();
  }
  return { sql: conds.length ? `WHERE ${conds.join(" AND ")}` : "", params };
}

/** Listado con filtros y paginacion. */
export async function listarOfertas(
  filtros: ListarOfertasQuery
): Promise<{ ofertas: OfertaDB[]; total: number }> {
  const w = whereListado(filtros);
  const limite = filtros.limite ?? 50;
  const offset = filtros.offset ?? 0;

  const total = await getOne<{ c: number }>(
    `SELECT COUNT(*) AS c FROM oferta ${w.sql}`,
    w.params
  );

  const sql = `
    ${SELECT_OFERTA}
    ${w.sql}
    ORDER BY fecha_fin IS NULL, fecha_fin ASC, id ASC
    LIMIT @limite OFFSET @offset
  `;
  const ofertas = await getAll<OfertaDB>(sql, { ...w.params, limite, offset });
  return { ofertas, total: Number(total?.c ?? 0) };
}

/** Ofertas guardadas de un producto de lista (con su contexto de permisos). */
export async function listarOfertasDeProducto(
  idProductoLista: number
): Promise<OfertaDB[]> {
  return getAll<OfertaDB>(
    `${SELECT_OFERTA} WHERE id_producto_lista = @idProductoLista ORDER BY precio_oferta_pesos IS NULL, precio_oferta_pesos ASC, id ASC`,
    { idProductoLista }
  );
}

/** Borra las ofertas de un producto (antes de re-guardar una busqueda nueva). */
export async function eliminarOfertasDeProducto(
  idProductoLista: number
): Promise<number> {
  const rs = await run(
    `DELETE FROM oferta WHERE id_producto_lista = @idProductoLista`,
    { idProductoLista }
  );
  return filasAfectadas(rs);
}

/**
 * Borra todas las ofertas cuya `fecha_fin` ya paso (`ahora` en ISO).
 * Solo toca filas con fecha_fin no nula y anterior a `ahora`.
 */
export async function eliminarOfertasVencidas(ahora: string): Promise<number> {
  const rs = await run(
    `DELETE FROM oferta WHERE fecha_fin IS NOT NULL AND fecha_fin < @ahora`,
    { ahora }
  );
  return filasAfectadas(rs);
}
