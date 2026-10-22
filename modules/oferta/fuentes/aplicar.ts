/**
 * Motor de filtrado y orden (copiado de Canasta-Scraper/src/filters/apply.ts).
 *
 * Reglas del filtro estricto (default):
 *  1. el token aparece como palabra completa;
 *  2. al menos una aparicion NO esta precedida por conector/negador
 *     ("Leche Infantil Sabor Leche" se queda; "Crema de leche" no);
 *  3. si el nombre no lo trae, se rescata si la categoria empieza con el token.
 *
 * Ademas aplica stock, frase exacta, precios, mercado, categoria y orden.
 * Todo en memoria: el endpoint de busqueda no toca la DB.
 */

import type { OfertaFuente } from "./tipos";
import type { Filtros, OrdenarPor } from "./filtros";
import { categoriaNoConsumible } from "./unidad";

const norm = (s?: string | null): string =>
  (s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

/** Palabras que no aportan al match ("dulce de leche" -> dulce, leche). */
const STOPWORDS = new Set([
  "de", "del", "la", "el", "los", "las", "con", "sin", "y", "en", "al", "a",
  "para", "por", "mas", "menos", "sabor", "aroma", "tipo", "estilo",
]);

/**
 * Conectores que convierten al termino buscado en un complemento:
 * "crema DE leche", "gaseosa SIN azucar", "chocolate CON leche".
 */
const CONECTORES = new Set([
  "de", "del", "con", "sin", "menos", "en", "al", "a", "para", "por",
  "sabor", "aroma", "tipo", "estilo",
]);

/** Señales de que el producto esta atenuado aunque mencione el termino. */
const NEGATIVO_LEVE = /\b(light|lite|diet|cero|zero|sugar\s*free)\b/;

/**
 * Calificativos que convierten el termino en OTRO producto (no una variante
 * legitima del mismo). "leche CHOCOLATADA" no es leche; "leche descremada" SI
 * es leche (es un subtipo). Se comparan por RAIZ para tolerar los errores de
 * tipeo de los propios sitios ("Chocolotada", "Saborisada").
 */
const VARIANTES = [
  "chocolat",
  "chocolot", // "Chocolotada": error de tipeo real de Jumbo
  "saboriz",
  "aromatiz",
  "rellen",
  "bañad",
  "glasead",
];

/** true si la palabra arranca con alguna raiz de variante. */
const esVariante = (palabra: string): boolean =>
  palabra.length > 0 && VARIANTES.some((r) => palabra.startsWith(r));

export type ResultadoFiltro = {
  /** Ofertas que pasaron todos los filtros (sin recortar por `limite`). */
  ofertas: OfertaFuente[];
  /** Cuantas se descartaron por no tener stock. */
  agotadas: number;
  /** Cuantas se descartaron por ser "parecidos" (negadas/derivadas/otro tipo). */
  parecidos: number;
};

/** Tokens significativos de una busqueda. */
export function tokensDe(query: string): string[] {
  return norm(query)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0 && !STOPWORDS.has(t));
}

const escapar = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Posiciones donde `palabra` aparece como palabra completa. */
function posicionesPalabra(texto: string, palabra: string): number[] {
  if (!palabra) return [];
  const re = new RegExp(`(^|[^a-z0-9])${escapar(palabra)}(?=[^a-z0-9]|$)`, "g");
  const out: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto)) !== null) {
    out.push(m.index + (m[1]?.length ?? 0));
    re.lastIndex = Math.max(m.index + m[0].length, re.lastIndex);
  }
  return out;
}

const tienePalabra = (texto: string, palabra: string): boolean =>
  posicionesPalabra(texto, palabra).length > 0;

/** Palabra inmediatamente anterior a una posicion. */
const palabraAnterior = (texto: string, pos: number): string =>
  texto.slice(0, pos).trim().split(/\s+/).pop() ?? "";

/**
 * Palabra inmediatamente posterior al token que empieza en `pos`.
 * Se salta los separadores ("Leche, Chocolatada" -> "chocolatada").
 */
function palabraSiguiente(texto: string, pos: number, token: string): string {
  const resto = texto.slice(pos + token.length).trim();
  const m = resto.match(/^[^a-z0-9]*([a-z0-9]+)/);
  return m?.[1] ?? "";
}

/** La frase completa aparece contigua y como palabras completas. */
function frasePresente(texto: string, frase: string): boolean {
  const tokens = frase.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const re = new RegExp(
    `(^|[^a-z0-9])${tokens.map(escapar).join("\\s+")}(?=[^a-z0-9]|$)`
  );
  return re.test(texto);
}

/** La categoria empieza con el termino ("Leches infantiles" para "leche"). */
const categoriaEmpiezaCon = (categoria: string, token: string): boolean =>
  categoria.startsWith(token);

/**
 * ¿El producto es del tipo buscado? Reglas (todas sobre el nombre):
 *  1. el token aparece como palabra completa;
 *  2. al menos una aparicion NO esta precedida por conector/negador
 *     ("Leche Infantil Sabor Leche" se queda; "Crema de leche" no);
 *  3. ninguna aparicion limpia es una variante de otro producto
 *     ("Leche Chocolatada" no es leche);
 *  4. si el nombre no lo trae, se rescata si la categoria empieza con el token.
 */
function esDelTipo(
  o: OfertaFuente,
  tokens: string[],
  aplicarReglas: boolean
): boolean {
  if (tokens.length === 0) return true;

  const nombre = norm(o.producto);
  const categoria = norm(o.categoria);

  // En categorias no consumibles (hogar, electro, ...) el termino tiene que ser
  // el "head" del nombre: una cafetera "... Leche 15bar" no es leche.
  if (categoriaNoConsumible(o.categoria, o.categoriaRuta)) {
    const inicio = norm(o.producto).split(/\s+/).slice(0, 3).join(" ");
    if (!tokens.some((t) => tienePalabra(inicio, t))) return false;
  }

  for (const token of tokens) {
    const posiciones = posicionesPalabra(nombre, token);

    if (posiciones.length === 0) {
      if (categoriaEmpiezaCon(categoria, token)) continue;
      return false;
    }

    if (aplicarReglas) {
      // Una aparicion "limpia" ni viene precedida por conector/negador
      // ("crema de leche") ni es la cabeza de una variante ("leche chocolatada").
      const limpia = posiciones.some((pos) => {
        const antes = palabraAnterior(nombre, pos);
        if (CONECTORES.has(antes)) return false;
        if (esVariante(antes)) return false;
        if (esVariante(palabraSiguiente(nombre, pos, token))) return false;
        return true;
      });
      if (!limpia) return false;
    }
  }
  return true;
}

/**
 * Filtra y ordena (sin recortar): se usa para calcular la comparativa por EAN
 * sobre el universo completo (no solo lo que se muestra por pantalla).
 *
 * @param query termino buscado; alimenta el filtro estricto, `exacto` y el
 *   scoring de relevancia.
 */
export function filtrarYOrdenar(
  ofertas: OfertaFuente[],
  filtros: Filtros,
  query = ""
): ResultadoFiltro {
  const termino = norm(query);
  const tokens = tokensDe(query);
  // Si la propia busqueda trae un conector ("dulce de leche", "coca sin azucar")
  // no aplicamos la regla de derivados/negados: seria autoexcluyente.
  const palabrasQuery = norm(query).split(/[^a-z0-9]+/).filter(Boolean);
  const aplicarReglas = !palabrasQuery.some((t) => CONECTORES.has(t));

  const agotadas = ofertas.filter((o) => o.disponible === false).length;

  let out = filtros.agotados
    ? [...ofertas]
    : ofertas.filter((o) => o.disponible !== false);

  let parecidos = 0;

  // Modo estricto (default): el producto tiene que ser del tipo buscado.
  if (!filtros.parecidos && tokens.length > 0) {
    const antes = out.length;
    out = out.filter((o) => esDelTipo(o, tokens, aplicarReglas));
    parecidos += antes - out.length;
  }

  if (filtros.exacto && termino) {
    const antes = out.length;
    out = out.filter((o) => frasePresente(norm(o.producto), termino));
    parecidos += antes - out.length;
  }

  if (filtros.soloOfertas) {
    out = out.filter((o) => (o.descuentoPorc ?? 0) > 0);
  }
  if (filtros.minDescuento !== undefined && filtros.minDescuento > 0) {
    const min = filtros.minDescuento;
    out = out.filter((o) => (o.descuentoPorc ?? -1) >= min);
  }
  if (filtros.minPrecioPesos !== undefined && filtros.minPrecioPesos >= 0) {
    const min = filtros.minPrecioPesos;
    out = out.filter((o) => (o.precioOfertaPesos ?? -1) >= min);
  }
  if (filtros.maxPrecioPesos !== undefined && filtros.maxPrecioPesos >= 0) {
    const max = filtros.maxPrecioPesos;
    out = out.filter((o) => (o.precioOfertaPesos ?? Infinity) <= max);
  }
  if (filtros.localidad) {
    const l = norm(filtros.localidad);
    out = out.filter((o) => norm(`${o.localidad} ${o.ubicacion}`).includes(l));
  }
  if (filtros.provincia) {
    const p = norm(filtros.provincia);
    out = out.filter((o) => norm(o.provincia).includes(p));
  }
  if (filtros.mercados && filtros.mercados.length > 0) {
    const set = new Set(filtros.mercados.map(norm));
    out = out.filter((o) => set.has(norm(o.mercado)));
  }
  if (filtros.categoria) {
    const c = norm(filtros.categoria);
    out = out.filter((o) =>
      norm(`${o.categoria} ${(o.categoriaRuta ?? []).join(" ")}`).includes(c)
    );
  }

  out = [...out].sort((a, b) =>
    comparar(a, b, filtros.ordenar ?? "relevancia", tokens)
  );
  return { ofertas: out, agotadas, parecidos };
}

/**
 * Puntaje de relevancia: premia que el termino aparezca de verdad en el
 * producto y en su categoria, y castiga los que lo mencionan negado
 * ("mermelada sin azucar" no es azucar).
 */
function puntajeRelevancia(o: OfertaFuente, tokens: string[]): number {
  const nombre = norm(o.producto);
  const cat = norm(`${o.categoria} ${(o.categoriaRuta ?? []).join(" ")}`);

  let pts = 0;
  if (tokens.length > 0) {
    if (tokens.every((t) => tienePalabra(nombre, t))) pts += 20;
    if (posicionesPalabra(nombre, tokens[0] ?? "").includes(0)) pts += 10;
    if (tokens.some((t) => tienePalabra(cat, t))) pts += 15;
    if (tokens.some((t) => nombre.includes(`sin ${t}`) || nombre.includes(`menos ${t}`))) {
      pts -= 40;
    }
    if (NEGATIVO_LEVE.test(nombre)) pts -= 15;
  }
  if (o.descuentoPorc) pts += Math.min(15, o.descuentoPorc / 3);
  if (o.precioOfertaPesos) pts += 10;
  if (o.comercio) pts += 5;
  return pts;
}

function comparar(
  a: OfertaFuente,
  b: OfertaFuente,
  ord: OrdenarPor,
  tokens: string[]
): number {
  switch (ord) {
    case "precio_asc":
      return (a.precioOfertaPesos ?? Infinity) - (b.precioOfertaPesos ?? Infinity);
    case "precio_desc":
      return (b.precioOfertaPesos ?? -1) - (a.precioOfertaPesos ?? -1);
    case "relevancia": {
      const r = puntajeRelevancia(b, tokens) - puntajeRelevancia(a, tokens);
      if (Math.abs(r) > 1e-9) return r;
      return (a.precioOfertaPesos ?? Infinity) - (b.precioOfertaPesos ?? Infinity);
    }
    case "descuento_desc":
    default: {
      const d = (b.descuentoPorc ?? -1) - (a.descuentoPorc ?? -1);
      if (d !== 0) return d;
      return (a.precioOfertaPesos ?? Infinity) - (b.precioOfertaPesos ?? Infinity);
    }
  }
}
