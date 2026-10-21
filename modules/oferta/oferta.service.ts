// Reglas de negocio del catalogo de ofertas.
// La busqueda trabaja EN VIVO (fuentes) y NO toca la base de datos.
import {
  crearOferta,
  obtenerOfertaPorId,
  actualizarOferta,
  eliminarOferta,
  listarOfertas,
  listarOfertasDeProducto,
  eliminarOfertasDeProducto,
  eliminarOfertasVencidas,
} from "./oferta.model";
import {
  aOfertaRespuesta,
  type CrearOfertaBody,
  type ActualizarOfertaBody,
  type ListarOfertasQuery,
  type BuscarOfertasQuery,
  type OfertaRespuesta,
} from "./oferta.scheme";
import { buscarEnVivo, type ResultadoBusqueda } from "./fuentes/orquestador";
import type { Filtros, OrdenarPor } from "./fuentes/filtros";
import { agruparPorEan, type GrupoEan } from "./fuentes/ean";
import { obtenerItemConContexto, obtenerRolEnGrupo } from "../productoLista/productoLista.model";

/** Error con status para responder desde el controller. */
export class OfertaError extends Error {
  status: number;
  constructor(mensaje: string, status = 400) {
    super(mensaje);
    this.name = "OfertaError";
    this.status = status;
  }
}

/** 1..4 -> orden del catalogo. */
function ordenDesdeOpcion(n?: string): OrdenarPor | undefined {
  switch (n) {
    case "1":
      return "descuento_desc";
    case "2":
      return "precio_asc";
    case "3":
      return "precio_desc";
    case "4":
      return "relevancia";
    default:
      return "relevancia";
  }
}

/** Query del buscador -> filtros del motor. */
export function filtrosDesdeBusqueda(q: BuscarOfertasQuery): Filtros {
  return {
    limite: q.limite,
    minDescuento: q.min_desc,
    minPrecioPesos: q.min_precio,
    maxPrecioPesos: q.max_precio,
    localidad: q.localidad,
    provincia: q.provincia,
    mercados: q.mercados
      ? q.mercados.split(",").map((m) => m.trim()).filter(Boolean)
      : undefined,
    categoria: q.categoria,
    exacto: q.exacto,
    parecidos: q.parecidos,
    agotados: q.agotados,
    soloOfertas: q.solo_ofertas,
    ordenar: ordenDesdeOpcion(q.orden),
  };
}

/** Alta. */
export async function crearOfertaService(
  datos: CrearOfertaBody
): Promise<{ oferta: OfertaRespuesta }> {
  const creada = await crearOferta(datos);
  if (!creada) throw new OfertaError("No se pudo crear la oferta", 500);
  return { oferta: aOfertaRespuesta(creada) };
}

/** Listado con filtros (DB). */
export async function listarOfertasService(
  filtros: ListarOfertasQuery
): Promise<{ ofertas: OfertaRespuesta[]; total: number }> {
  const { ofertas, total } = await listarOfertas(filtros);
  return { ofertas: ofertas.map(aOfertaRespuesta), total };
}

/** Detalle. */
export async function obtenerOfertaService(
  idOferta: number
): Promise<{ oferta: OfertaRespuesta }> {
  const o = await obtenerOfertaPorId(idOferta);
  if (!o) throw new OfertaError("Oferta no encontrada", 404);
  return { oferta: aOfertaRespuesta(o) };
}

/** Edicion: valida fin > inicio contra la fila actual. */
export async function actualizarOfertaService(
  idOferta: number,
  datos: ActualizarOfertaBody
): Promise<{ oferta: OfertaRespuesta }> {
  const actual = await obtenerOfertaPorId(idOferta);
  if (!actual) throw new OfertaError("Oferta no encontrada", 404);

  const inicio = datos.fecha_inicio ?? actual.fecha_inicio;
  const fin = datos.fecha_fin ?? actual.fecha_fin;
  if (inicio && fin && new Date(fin) <= new Date(inicio)) {
    throw new OfertaError("La fecha de fin debe ser posterior a la de inicio", 400);
  }

  const act = await actualizarOferta(idOferta, datos);
  if (!act) throw new OfertaError("No se pudo actualizar la oferta", 500);
  return { oferta: aOfertaRespuesta(act) };
}

/** ERRORES de permiso del borrado manual. */
function mensajeSinPermiso(): string {
  return "No tienes permisos para eliminar esta oferta";
}

/**
 * Baja manual. Reglas:
 * - Oferta del catalogo global (id_producto_lista NULL): solo el sistema la borra.
 * - Oferta de un producto: admin del grupo, creador de la lista o del producto.
 */
export async function eliminarOfertaService(
  idUsuario: number,
  idOferta: number
): Promise<{ eliminado: boolean }> {
  const oferta = await obtenerOfertaPorId(idOferta);
  if (!oferta) throw new OfertaError("Oferta no encontrada", 404);

  if (oferta.id_producto_lista == null) {
    throw new OfertaError(
      "Solo el sistema puede eliminar ofertas del catálogo global",
      403
    );
  }

  const ctx = await obtenerItemConContexto(oferta.id_producto_lista);
  if (!ctx.item || !ctx.idGrupo) {
    throw new OfertaError("Oferta no encontrada", 404);
  }
  const rol = await obtenerRolEnGrupo(idUsuario, ctx.idGrupo);
  if (!rol) throw new OfertaError("No perteneces al grupo de esta lista", 403);

  const esAdmin = rol === "administrador";
  const esCreadorLista = ctx.idUsuarioCreadorLista === idUsuario;
  const esCreadorProducto = ctx.item.id_usuario_creador === idUsuario;
  if (!esAdmin && !esCreadorLista && !esCreadorProducto) {
    throw new OfertaError(mensajeSinPermiso(), 403);
  }

  const ok = await eliminarOferta(idOferta);
  if (!ok) throw new OfertaError("Oferta no encontrada", 404);
  return { eliminado: true };
}

/** Ofertas guardadas de un producto (chequea pertenencia al grupo). */
export async function listarOfertasDeProductoService(
  idUsuario: number,
  idProductoLista: number
): Promise<{ ofertas: OfertaRespuesta[]; total: number }> {
  const ctx = await obtenerItemConContexto(idProductoLista);
  if (!ctx.item || !ctx.idGrupo) {
    throw new OfertaError("Producto no encontrado", 404);
  }
  const rol = await obtenerRolEnGrupo(idUsuario, ctx.idGrupo);
  if (!rol) throw new OfertaError("No perteneces al grupo de esta lista", 403);

  const ofertas = await listarOfertasDeProducto(idProductoLista);
  return { ofertas: ofertas.map(aOfertaRespuesta), total: ofertas.length };
}

/** Resultado de sincronizar (buscar + guardar) las ofertas de un producto. */
export type ResultadoSincronizacion = {
  id_producto_lista: number;
  guardadas: number;
  eliminadas_previas: number;
  brutas: number;
  errores: string[];
  queryUsada: string;
  ampliada: boolean;
  ms: number;
};

/**
 * Busca en vivo por el nombre del producto y GUARDA todas las ofertas que
 * pasan el filtro, ligadas al producto (`id_producto_lista`).
 *
 * Reemplaza las ofertas previas del producto para no acumular duplicados:
 * se borran las anteriores y se insertan las nuevas.
 *
 * @param termino override opcional del termino de busqueda (por defecto: nombre).
 */
export async function sincronizarOfertasDeProducto(
  idProductoLista: number,
  termino?: string
): Promise<ResultadoSincronizacion> {
  const ctx = await obtenerItemConContexto(idProductoLista);
  if (!ctx.item) throw new OfertaError("Producto no encontrado", 404);

  const q = (termino ?? ctx.item.nombre).trim();
  const r = await buscarEnVivo(q, {});

  // Si el producto tiene codigo/EAN, prioriza las ofertas que coincidan.
  const codigo = (ctx.item.codigo_producto ?? "").trim();
  const candidatas = codigo
    ? [
        ...r.ofertas.filter((o) => (o.ean ?? "").trim() === codigo),
        ...r.ofertas.filter((o) => (o.ean ?? "").trim() !== codigo),
      ]
    : r.ofertas;

  const eliminadasPrevias = await eliminarOfertasDeProducto(idProductoLista);

  let guardadas = 0;
  const errores = [...r.errores];
  for (const o of candidatas) {
    try {
      await crearOferta(fuenteACuerpo(o, idProductoLista));
      guardadas++;
    } catch (err) {
      // Una oferta invalida no debe frenar al resto.
      errores.push(`guardado: ${String((err as Error).message).slice(0, 80)}`);
    }
  }

  return {
    id_producto_lista: idProductoLista,
    guardadas,
    eliminadas_previas: eliminadasPrevias,
    brutas: r.brutas,
    errores,
    queryUsada: r.queryUsada,
    ampliada: r.ampliada,
    ms: r.ms,
  };
}

/** Elimina las ofertas vencidas (uso manual o del barrido al arrancar). */
export async function eliminarVencidasService(): Promise<{ eliminadas: number }> {
  const ahora = new Date().toISOString();
  const eliminadas = await eliminarOfertasVencidas(ahora);
  return { eliminadas };
}

/** Barrido silencioso al arrancar el server (no lanza si algo falla). */
export async function barrerOfertasVencidas(): Promise<number> {
  try {
    const { eliminadas } = await eliminarVencidasService();
    return eliminadas;
  } catch {
    return 0;
  }
}

/** Busqueda en vivo (no persiste nada). */
export type RespuestaBusqueda = {
  ofertas: OfertaRespuesta[];
  comparativa: GrupoEan[];
  brutas: number;
  fuentes: string[];
  errores: string[];
  ms: number;
  agotadas: number;
  parecidos: number;
  avisoLocalidad: boolean;
  queryUsada: string;
  ampliada: boolean;
};

/** Mapea una oferta cruda de fuente al shape de la tabla (aun sin id). */
function fuenteARespuesta(
  o: ResultadoBusqueda["ofertas"][number],
  idProductoLista: number | null = null
): OfertaRespuesta {
  const ahora = new Date().toISOString();
  return {
    id: 0,
    fuente: o.mercado,
    comercio: o.comercio ?? null,
    producto: o.producto,
    url: o.url,
    producto_id: o.productoId ?? null,
    precio_lista_pesos: o.precioListaPesos ?? null,
    precio_oferta_pesos: o.precioOfertaPesos ?? null,
    descuento_porc: o.descuentoPorc ?? null,
    ean: o.ean ?? null,
    marca: o.marca ?? null,
    categoria: o.categoria ?? null,
    categoria_ruta: o.categoriaRuta ?? null,
    detalle: o.detalle ?? null,
    precio_unidad: o.precioUnidad ?? null,
    unidad_medida: o.unidadMedida ?? null,
    imagen_url: o.imagenUrl ?? null,
    stock: o.stock ?? null,
    disponible: o.disponible !== false,
    ubicacion: o.ubicacion ?? null,
    localidad: o.localidad ?? null,
    provincia: o.provincia ?? null,
    fecha_inicio: o.fechaInicio ?? null,
    fecha_fin: o.fechaFin ?? null,
    cuotas: o.cuotas ?? null,
    reintegro: o.reintegro ?? null,
    promos: o.promos ?? null,
    tipo_promo: o.tipoPromo ?? null,
    fecha_captura: o.fecha ?? ahora,
    creado_en: ahora,
    actualizado_en: ahora,
    id_producto_lista: idProductoLista,
  };
}

/** Oferta cruda de fuente -> cuerpo de alta (sin `id`). */
function fuenteACuerpo(
  o: ResultadoBusqueda["ofertas"][number],
  idProductoLista: number
): CrearOfertaBody {
  const r = fuenteARespuesta(o, idProductoLista);
  return {
    fuente: r.fuente,
    comercio: r.comercio,
    producto: r.producto,
    url: r.url,
    producto_id: r.producto_id,
    precio_lista_pesos: r.precio_lista_pesos,
    precio_oferta_pesos: r.precio_oferta_pesos,
    descuento_porc: r.descuento_porc,
    ean: r.ean,
    marca: r.marca,
    categoria: r.categoria,
    categoria_ruta: r.categoria_ruta,
    detalle: r.detalle,
    precio_unidad: r.precio_unidad,
    unidad_medida: r.unidad_medida as "kg" | "L" | null,
    imagen_url: r.imagen_url,
    stock: r.stock,
    disponible: r.disponible,
    ubicacion: r.ubicacion,
    localidad: r.localidad,
    provincia: r.provincia,
    fecha_inicio: r.fecha_inicio,
    fecha_fin: r.fecha_fin,
    cuotas: r.cuotas,
    reintegro: r.reintegro,
    promos: r.promos,
    tipo_promo: r.tipo_promo,
    fecha_captura: r.fecha_captura,
    id_producto_lista: idProductoLista,
  } as CrearOfertaBody;
}

/**
 * Busca ofertas EN VIVO por termino libre. No guarda nada.
 * Descarta las ofertas con `fecha_fin` ya vencida.
 */
export async function buscarOfertasService(
  q: BuscarOfertasQuery
): Promise<RespuestaBusqueda> {
  const filtros = filtrosDesdeBusqueda(q);
  const r = await buscarEnVivo(q.producto, filtros);

  return {
    ofertas: r.ofertas.map(fuenteARespuesta),
    comparativa: r.comparativa ?? agruparPorEan(r.ofertas),
    brutas: r.brutas,
    fuentes: r.fuentes,
    errores: r.errores,
    ms: r.ms,
    agotadas: r.agotadas,
    parecidos: r.parecidos,
    avisoLocalidad: r.avisoLocalidad,
    queryUsada: r.queryUsada,
    ampliada: r.ampliada,
  };
}
