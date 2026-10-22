/**
 * Filtros y orden aplicables al resultado de la busqueda en vivo.
 * (Copiado de Canasta-Scraper: el endpoint de busqueda reusa las mismas reglas.)
 */

export type OrdenarPor =
  | "descuento_desc" // mayor % de descuento primero
  | "precio_asc" // mas barato primero
  | "precio_desc" // mas caro primero
  | "relevancia"; // mejor combinacion producto + precio (default)

export interface Filtros {
  /** Descuento minimo (%). */
  minDescuento?: number;
  /** Precio de oferta minimo (pesos). */
  minPrecioPesos?: number;
  /** Precio de oferta maximo (pesos). */
  maxPrecioPesos?: number;
  /** Texto que debe aparecer en localidad/ubicacion (parcial, sin mayusculas). */
  localidad?: string;
  /** Texto que debe aparecer en provincia (parcial). */
  provincia?: string;
  /** Limitar a estos mercados (nombres). */
  mercados?: string[];
  /** Texto que debe aparecer en la categoria/ruta (parcial, sin acentos). */
  categoria?: string;
  /** El termino de busqueda debe aparecer en el nombre del producto. */
  exacto?: boolean;
  /** Incluir "parecidos" (negados/derivados): desactiva el filtro estricto. */
  parecidos?: boolean;
  /** Incluir productos sin stock. */
  agotados?: boolean;
  /** Solo ofertas con descuento. */
  soloOfertas?: boolean;
  /** Orden. */
  ordenar?: OrdenarPor;
  /** Cantidad maxima de resultados. */
  limite?: number;
}
