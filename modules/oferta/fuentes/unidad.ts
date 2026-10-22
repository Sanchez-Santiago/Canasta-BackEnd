/**
 * Precio por unidad de medida.
 *
 * Solo Dia expone el dato estructurado (`PrecioPorUnd` / `UnidaddeMedida`).
 * Para el resto se infiere peso/volumen del nombre del producto ("1 L",
 * "500 Grs", "1,5 L", "900ml"). Es heuristico: si no se entiende, devuelve null.
 */

export type UnidadBase = "kg" | "L";

export type Contenido = {
  /** Cantidad expresada en la unidad base (kg o litros). */
  cantidad: number;
  /** Unidad base. */
  unidad: UnidadBase;
};

/** Peso/volumen en el nombre: numero + unidad. Acepta "1,5" y "1.5". */
const RE_CONTENIDO =
  /(\d+(?:[.,]\d+)?)\s*(kilogramos?|kilos?|kgs?|kg|gramos?|grs?|gr|g|litros?|lts?|lt|l|mililitros?|mls?|ml|cc)\b/i;

/** Normaliza a numero (acepta "1,5" y "1.5"). */
function num(s: string): number {
  return Number(s.replace(",", "."));
}

/**
 * Busca un peso/volumen en el texto y lo normaliza a kg o litros.
 * Devuelve null si no hay medida reconocible.
 */
export function parsearContenido(texto: string): Contenido | null {
  const m = texto.match(RE_CONTENIDO);
  if (!m) return null;
  const valor = num(m[1] ?? "");
  if (!Number.isFinite(valor) || valor <= 0) return null;

  const u = (m[2] ?? "").toLowerCase();
  if (/^(kilogramos?|kilos?|kgs?|kg)$/.test(u)) return { cantidad: valor, unidad: "kg" };
  if (/^(gramos?|grs?|gr|g)$/.test(u)) return { cantidad: valor / 1000, unidad: "kg" };
  if (/^(litros?|lts?|lt|l)$/.test(u)) return { cantidad: valor, unidad: "L" };
  return { cantidad: valor / 1000, unidad: "L" }; // ml / cc
}

/**
 * Categorias que claramente no son consumo masivo (electrodomesticos, ropa,
 * tecnologia, ...). Ahi un "$/kg" o "$/L" no tiene sentido: el "1,5 L" de una
 * cafetera es su deposito, no el producto a comparar.
 */
const NO_CONSUMIBLE = [
  "hogar",
  "bazar",
  "electro",
  "electronica",
  "tecnologia",
  "informatica",
  "ropa",
  "calzado",
  "deporte",
  "juguete",
  "herramienta",
  "mueble",
  "moviliario",
  "mobiliario",
  "jardin",
];

/** Quita acentos y baja a minusculas. */
export function sinAcentos(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * true si la categoria parece ser bien no consumible, en cuyo caso no se
 * calcula precio por unidad aunque el nombre contenga un peso/volumen.
 */
export function categoriaNoConsumible(
  ...metadatos: Array<string | string[] | null | undefined>
): boolean {
  const texto = metadatos
    .flatMap((m) => (Array.isArray(m) ? m : m ? [m] : []))
    .join(" ");
  const n = sinAcentos(texto);
  return NO_CONSUMIBLE.some((p) => n.includes(p));
}

/** Mapea una etiqueta cruda de unidad ("1 Kg", "1 LT", "100 GR") a "kg" | "L". */
export function unidadCorta(raw?: string | null): UnidadBase | null {
  if (!raw) return null;
  const u = raw.toLowerCase();
  if (/kilo|kg|\bgr|gramo/.test(u)) return "kg";
  if (/litro|lt|\bl\b|ml|cc/.test(u)) return "L";
  return null;
}

/**
 * Precio por unidad base a partir del precio y el nombre del producto.
 * Devuelve null si no se pudo inferir el contenido.
 */
export function precioPorUnidad(
  precio: number | null | undefined,
  texto: string
): { valor: number; unidad: UnidadBase } | null {
  if (precio === null || precio === undefined || !(precio > 0)) return null;
  const c = parsearContenido(texto);
  if (!c || c.cantidad <= 0) return null;
  return { valor: precio / c.cantidad, unidad: c.unidad };
}
