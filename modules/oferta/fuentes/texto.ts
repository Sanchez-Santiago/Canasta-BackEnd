/** Utilidades de limpieza y parseo de texto/precios (formato argentino). */

/** Colapsa espacios (incluye NBSP) y recorta. */
export function limpiarTexto(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
}

/** Recorta un titulo a un largo razonable. */
export function acortar(s: string, max = 120): string {
  const t = limpiarTexto(s);
  return t.length > max ? t.slice(0, max - 1).trimEnd() + "\u2026" : t;
}

/**
 * Calcula el % de descuento a partir de lista y oferta.
 * Devuelve null si no hay descuento real.
 */
export function calcDescuento(
  lista?: number | null,
  oferta?: number | null
): number | null {
  if (lista && oferta && lista > 0 && oferta > 0 && oferta < lista) {
    return Math.round(((lista - oferta) / lista) * 1000) / 10;
  }
  return null;
}
