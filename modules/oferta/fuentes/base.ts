/**
 * Base de las fuentes: HTTP con `fetch` nativo (sin Playwright).
 *
 * VTEX y Promofy devuelven JSON por HTTP, asi que no hace falta navegador:
 * el backend solo necesita red. Eso evita Chromium (~300 MB) en el servidor.
 */

import type { FuenteOferta, ResultadoFuente } from "./tipos";

export const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/** Timeout por request (ms). */
export const TIMEOUT_MS = 25_000;

/** Error legible de una respuesta/`fetch` fallido. */
export function mensajeError(e: unknown): string {
  const msg = (e as Error)?.message || "error";
  return msg.split("\n")[0]?.slice(0, 80) ?? "error";
}

/** GET con UA de navegador y timeout; devuelve null si falla. */
export async function pedirJson<T>(url: string): Promise<T | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: ctrl.signal,
    });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** GET que devuelve texto (para el HTML de Promofy). */
export async function pedirHtml(url: string): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "es-AR,es;q=0.9",
      },
      signal: ctrl.signal,
    });
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Clase base: aporta el envoltorio de errores y el ISO de extraccion. */
export abstract class FuenteBase implements FuenteOferta {
  abstract readonly nombre: string;
  abstract buscar(query: string): Promise<ResultadoFuente>;

  /** Fecha de extraccion actual (ISO 8601). */
  protected ahoraISO(): string {
    return new Date().toISOString();
  }

  /** Ejecuta el scraping capturando el error como aviso, sin romper al resto. */
  protected async conAvisos(fn: () => Promise<ResultadoFuente>): Promise<ResultadoFuente> {
    try {
      return await fn();
    } catch (e) {
      return { ofertas: [], errores: [`${this.nombre}: ${mensajeError(e)}`] };
    }
  }
}
