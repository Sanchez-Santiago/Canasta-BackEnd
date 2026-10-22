/**
 * Orquestador de la busqueda EN VIVO: corre todas las fuentes en paralelo,
 * filtra vencidas, aplica filtros y devuelve el resultado.
 *
 * NO toca la base de datos: es solo lectura de las webs.
 */

import type { OfertaFuente, ResultadoFuente } from "./tipos";
import type { Filtros } from "./filtros";
import { filtrarYOrdenar, tokensDe } from "./aplicar";
import { agruparPorEan, type GrupoEan } from "./ean";
import { crearFuentes } from "./registry";

/** Limite duro por fuente: si una web se cuelga, no frena al resto. */
const TIMEOUT_FUENTE_MS = 30_000;

function conTimeout(
  p: Promise<ResultadoFuente>,
  nombre: string
): Promise<ResultadoFuente> {
  return Promise.race([
    p,
    new Promise<ResultadoFuente>((resolve) =>
      setTimeout(
        () => resolve({ ofertas: [], errores: [`${nombre}: timeout`] }),
        TIMEOUT_FUENTE_MS
      )
    ),
  ]);
}

export type ResultadoBusqueda = {
  ofertas: OfertaFuente[];
  /** Comparativa por EAN calculada sobre el universo (antes del limite). */
  comparativa: GrupoEan[];
  brutas: number;
  fuentes: string[];
  errores: string[];
  ms: number;
  /** Descartadas por no tener stock (informativo, aunque se incluyan). */
  agotadas: number;
  /** Descartadas por ser "parecidos" (negadas/derivadas) o por `exacto`. */
  parecidos: number;
  /** Se ignoro el filtro de localidad porque ninguna fuente lo informa. */
  avisoLocalidad: boolean;
  /** Termino realmente usado (puede diferir si hubo fallback). */
  queryUsada: string;
  /** Termino original de la busqueda. */
  queryOriginal: string;
  /** La busqueda original no dio resultados y se amplio a la palabra principal. */
  ampliada: boolean;
};

/** Una oferta vencida: tiene `fechaFin` y ya paso (comparado por dia). */
function estaVencida(o: OfertaFuente, ahora = new Date()): boolean {
  if (!o.fechaFin) return false;
  const t = new Date(o.fechaFin).getTime();
  if (Number.isNaN(t)) return false;
  // Fin de vigencia: se considera valida durante todo el dia de `fechaFin`.
  return t < ahora.getTime();
}

/**
 * Corre las fuentes pedidas (o todas) y devuelve el resultado filtrado.
 *
 * @param fuentes nombres a usar; si se omite, corre todas.
 */
export async function buscarEnVivo(
  query: string,
  filtros: Filtros = {},
  fuentes?: string[]
): Promise<ResultadoBusqueda> {
  const t0 = Date.now();
  const todasFuentes = crearFuentes();
  const activas = fuentes?.length
    ? todasFuentes.filter((s) =>
        fuentes.some((f) => s.nombre.toLowerCase().includes(f.trim().toLowerCase()))
      )
    : todasFuentes;

  const resultados = await Promise.allSettled(
    activas.map((s) => conTimeout(s.buscar(query), s.nombre))
  );

  const ahora = new Date();
  const todas: OfertaFuente[] = [];
  const errores: string[] = [];
  let vencidas = 0;
  for (const r of resultados) {
    if (r.status === "fulfilled") {
      if (r.value.errores) errores.push(...r.value.errores);
      for (const o of r.value.ofertas) {
        // Requisito: si la oferta tiene fecha de fin ya pasada, se ignora.
        if (estaVencida(o, ahora)) {
          vencidas++;
          continue;
        }
        todas.push(o);
      }
    } else {
      const msg = String(r.reason?.message ?? r.reason);
      errores.push(msg.split("\n")[0]?.slice(0, 80) ?? "error");
    }
  }

  // Las fuentes son tiendas online sin sucursal: si nadie informa localidad,
  // el filtro devolveria 0 resultados siempre. Se ignora y se avisa.
  const filtrosEfectivos: Filtros = { ...filtros };
  let avisoLocalidad = false;
  if (filtrosEfectivos.localidad || filtrosEfectivos.provincia) {
    const hayDatos = todas.some(
      (o) => o.localidad || o.ubicacion || o.provincia
    );
    if (!hayDatos) {
      delete filtrosEfectivos.localidad;
      delete filtrosEfectivos.provincia;
      avisoLocalidad = true;
    }
  }

  let filtro = filtrarYOrdenar(todas, filtrosEfectivos, query);
  let queryUsada = query;
  let ampliada = false;

  // Fallback: "azucar blanca" sin resultados -> probar con "azucar".
  if (filtro.ofertas.length === 0) {
    const tokens = tokensDe(query);
    if (tokens.length > 1) {
      const principal = tokens[0];
      const alt = principal
        ? filtrarYOrdenar(todas, filtrosEfectivos, principal)
        : null;
      if (alt && alt.ofertas.length > 0) {
        filtro = alt;
        queryUsada = principal as string;
        ampliada = true;
      }
    }
  }

  const comparativa = agruparPorEan(filtro.ofertas);
  const limite = filtros.limite ?? 10;
  return {
    ofertas: limite > 0 ? filtro.ofertas.slice(0, limite) : filtro.ofertas,
    comparativa,
    brutas: todas.length,
    fuentes: activas.map((s) => s.nombre),
    errores: vencidas ? [...errores, `${vencidas} oferta(s) vencida(s) ignorada(s)`] : errores,
    ms: Date.now() - t0,
    agotadas: filtro.agotadas,
    parecidos: filtro.parecidos,
    avisoLocalidad,
    queryUsada,
    queryOriginal: query,
    ampliada,
  };
}
