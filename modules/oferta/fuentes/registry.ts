/**
 * Registro de fuentes activas (mismo criterio que Canasta-Scraper).
 *
 * Rinden:
 *   - VTEX (API JSON): Carrefour, Dia, Jumbo, MasOnline -> precios exactos.
 *   - Promofy (HTML con JSON embebido): ofertas multi-comercio.
 *
 * Probadas y descartadas en la fase de viabilidad (no aportan precio por
 * producto): Tiendeo, Ofertero, Ahorron, Convi, Kimbino, Coto.
 */

import type { FuenteOferta } from "./tipos";
import { FuenteVtex } from "./vtex";
import { FuentePromofy } from "./promofy";

/** Config de los sitios VTEX utilizables. */
const SITIOS_VTEX = [
  { nombre: "Carrefour", host: "https://www.carrefour.com.ar" },
  { nombre: "Dia", host: "https://www.dia.com.ar" },
  { nombre: "Jumbo", host: "https://www.jumbo.com.ar" },
  { nombre: "MasOnline", host: "https://www.masonline.com.ar" },
] as const;

/** Limite de productos por fuente (VTEX devuelve de a tandas). */
const LIMITE_FUENTE = 24;

/** Crea las fuentes activas. */
export function crearFuentes(): FuenteOferta[] {
  return [
    ...SITIOS_VTEX.map(
      (s) => new FuenteVtex({ nombre: s.nombre, host: s.host, limite: LIMITE_FUENTE })
    ),
    new FuentePromofy({ limite: LIMITE_FUENTE }),
  ];
}

/** Nombres de las fuentes que se pueden pedir por query (`?mercados=`). */
export const NOMBRES_FUENTES = [
  ...SITIOS_VTEX.map((s) => s.nombre),
  "Promofy",
] as const;
