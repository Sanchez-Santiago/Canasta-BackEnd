/**
 * Tipos de las fuentes de scraping (copiado de Canasta-Scraper).
 *
 * Nombres de campos en camelCase porque vienen del scraper; el mapeo a las
 * columnas snake_case de la tabla `oferta` lo hace `oferta.mapeo.ts`.
 */

/** Una oferta cruda, tal como la devuelve una fuente. */
export type OfertaFuente = {
  /** Nombre del mercado/cadena (ej. "Carrefour"). */
  mercado: string;
  /** Nombre del comercio/seller, si difiere del mercado. */
  comercio?: string | null;
  /** Nombre del producto. */
  producto: string;

  /** Precio de lista en pesos (sin descuento). */
  precioListaPesos?: number | null;
  /** Precio de oferta en pesos. */
  precioOfertaPesos?: number | null;
  /** % de descuento calculado. */
  descuentoPorc?: number | null;
  /** URL de la ficha del producto. */
  url: string;

  /** Ubicacion textual (sucursal, direccion). */
  ubicacion?: string | null;
  /** Ciudad / localidad. */
  localidad?: string | null;
  /** Provincia. */
  provincia?: string | null;

  /** Inicio de la vigencia (ISO). */
  fechaInicio?: string | null;
  /** Fin de la vigencia (ISO). */
  fechaFin?: string | null;

  /** Codigo de barras (EAN), si la fuente lo informa. */
  ean?: string | null;
  /** Marca del producto. */
  marca?: string | null;
  /** Categoria (hoja). */
  categoria?: string | null;
  /** Ruta de categorias (raiz a hoja). */
  categoriaRuta?: string[] | null;
  /** URL de la imagen. */
  imagenUrl?: string | null;

  /** Precio por unidad de medida (pesos por kg o por litro). */
  precioUnidad?: number | null;
  /** Unidad del precio por unidad: "kg" | "L". */
  unidadMedida?: string | null;

  /** Stock, si la fuente lo informa. */
  stock?: number | null;
  /** Cuotas detectadas (ej. "3 cuotas sin interes"). */
  cuotas?: string[] | null;
  /** Reintegro / cashback textual. */
  reintegro?: string | null;
  /** Promociones con nombre. */
  promos?: string[] | null;
  /** Tipo de promo: "promocion" | "producto". */
  tipoPromo?: string | null;
  /** ID del producto en la tienda. */
  productoId?: string | null;

  /** Texto crudo / descripcion corta. */
  detalle?: string | null;
  /** Fecha de extraccion (ISO 8601). */
  fecha: string;
  /** Si sigue vigente / disponible. */
  disponible?: boolean;
};

/** Resultado de una fuente individual. */
export type ResultadoFuente = {
  ofertas: OfertaFuente[];
  errores?: string[];
};

/** Contrato de una fuente de scraping. */
export interface FuenteOferta {
  /** Nombre del mercado (clave para agrupar y para la columna `fuente`). */
  readonly nombre: string;
  /** Busca ofertas por termino libre. */
  buscar(query: string): Promise<ResultadoFuente>;
}
