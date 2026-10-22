/**
 * Comparador por codigo de barras (EAN).
 *
 * Agrupa las ofertas que comparten EAN y aparecen en 2+ cadenas distintas,
 * para mostrar cual es el mas barato y cuanto se ahorra. Solo aplica a fuentes
 * que exponen EAN (las VTEX); Promofy no lo trae.
 */

import type { OfertaFuente } from "./tipos";

export type OfertaComparada = {
  mercado: string;
  comercio: string | null;
  precio: number;
  url: string;
};

export type GrupoEan = {
  ean: string;
  producto: string;
  ofertas: OfertaComparada[];
  /** % que cuesta de mas la oferta mas cara respecto de la mas barata. */
  diferenciaPct: number;
};

/**
 * Agrupa por EAN las ofertas con precio presentes en >= `minMercados` cadenas.
 * De cada cadena toma la oferta mas barata. Ordena por diferencia descendente.
 */
export function agruparPorEan(
  ofertas: OfertaFuente[],
  minMercados = 2
): GrupoEan[] {
  const mapa = new Map<string, OfertaFuente[]>();
  for (const o of ofertas) {
    const ean = (o.ean ?? "").trim();
    if (!ean || !(o.precioOfertaPesos && o.precioOfertaPesos > 0)) continue;
    const arr = mapa.get(ean);
    if (arr) arr.push(o);
    else mapa.set(ean, [o]);
  }

  const grupos: GrupoEan[] = [];
  for (const [ean, arr] of mapa) {
    const porMercado = new Map<string, OfertaFuente>();
    for (const o of [...arr].sort(
      (a, b) =>
        (a.precioOfertaPesos ?? Infinity) - (b.precioOfertaPesos ?? Infinity)
    )) {
      if (!porMercado.has(o.mercado)) porMercado.set(o.mercado, o);
    }
    if (porMercado.size < minMercados) continue;

    const lista = [...porMercado.values()].sort(
      (a, b) =>
        (a.precioOfertaPesos ?? Infinity) - (b.precioOfertaPesos ?? Infinity)
    );
    const primero = lista[0];
    const ultimo = lista[lista.length - 1];
    const barato = (primero?.precioOfertaPesos ?? 0) as number;
    const caro = (ultimo?.precioOfertaPesos ?? 0) as number;
    const diferenciaPct =
      caro > barato ? Math.round(((caro - barato) / barato) * 1000) / 10 : 0;

    grupos.push({
      ean,
      producto: primero?.producto ?? "",
      ofertas: lista.map((o) => ({
        mercado: o.mercado,
        comercio: o.comercio ?? null,
        precio: o.precioOfertaPesos as number,
        url: o.url,
      })),
      diferenciaPct,
    });
  }

  return grupos.sort((a, b) => b.diferenciaPct - a.diferenciaPct);
}
