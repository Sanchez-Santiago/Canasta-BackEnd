/**
 * Fuente Promofy.
 *
 * En vez de raspar el DOM, lee el JSON que el propio sitio embebe en el HTML
 * (flight de RSC). Da datos exactos: titulo, precio, precio original, comercio,
 * link, vigencia (created_at / expires_at), imagen, categoria, tipo de promo y
 * reintegro. Solo necesita el HTML, no un navegador.
 */

import type { OfertaFuente, ResultadoFuente } from "./tipos";
import { FuenteBase, pedirHtml } from "./base";
import { acortar, calcDescuento } from "./texto";
import { categoriaNoConsumible, precioPorUnidad } from "./unidad";

type PromofyItem = {
  id?: string;
  title?: string;
  description?: string;
  price?: number | null;
  original_price?: number | null;
  link?: string;
  image_url?: string;
  store?: string;
  category_id?: number;
  type?: string;
  discount_type?: string;
  discount_value?: number;
  created_at?: string;
  expires_at?: string;
  status?: string;
};

/** Taxonomia de categorias de Promofy (viene embebida en su payload). */
const CATEGORIAS_PROMOFY: Record<number, string> = {
  1: "Belleza",
  2: "Gastronomía",
  3: "Deportes",
  4: "Salud",
  5: "Electrónica",
  6: "Gaming",
  7: "Hogar",
  8: "Ropa",
  9: "Viajes",
  10: "Otros",
  12: "Promociones Aéreas",
};

export type PromofyConfig = {
  nombre?: string;
  base?: string;
  /** Cantidad maxima de ofertas a traer. */
  limite?: number;
};

export class FuentePromofy extends FuenteBase {
  readonly nombre: string;
  private base: string;
  private limite: number;

  constructor(cfg: PromofyConfig = {}) {
    super();
    this.nombre = cfg.nombre ?? "Promofy";
    this.base = cfg.base ?? "https://www.promofy.com.ar";
    this.limite = cfg.limite ?? 30;
  }

  async buscar(query: string): Promise<ResultadoFuente> {
    return this.conAvisos(async () => {
      const url = `${this.base}/search?q=${encodeURIComponent(query)}`;
      const html = await pedirHtml(url);
      if (!html) return { ofertas: [], errores: [`${this.nombre}: sin respuesta`] };

      const payload = this.payloadFlight(html);
      if (!payload) {
        return { ofertas: [], errores: [`${this.nombre}: sin datos embebidos`] };
      }
      const ofertas = this.extraerItems(payload)
        .map((i) => this.mapear(i))
        .filter((o): o is OfertaFuente => o !== null)
        .slice(0, this.limite);
      return { ofertas };
    });
  }

  /** Une los chunks `self.__next_f.push([1,"..."])` en un solo texto. */
  private payloadFlight(html: string): string | null {
    const re = /self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g;
    const partes: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      try {
        partes.push(JSON.parse(m[1] ?? '""') as string);
      } catch {
        /* chunk ilegible: se ignora */
      }
    }
    return partes.length ? partes.join("") : null;
  }

  /** Extrae cada objeto de oferta (brace-matching desde `{"id":"<uuid>","title":`). */
  private extraerItems(payload: string): PromofyItem[] {
    const re = /\{"id":"[0-9a-f-]{36}","title":/g;
    const out: PromofyItem[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(payload)) !== null) {
      const end = this.finObjeto(payload, m.index);
      if (end < 0) continue;
      try {
        out.push(JSON.parse(payload.slice(m.index, end)) as PromofyItem);
      } catch {
        /* objeto ilegible: se ignora */
      }
    }
    return out;
  }

  /** Indice justo despues de la llave que cierra el objeto, respetando strings. */
  private finObjeto(s: string, start: number): number {
    let depth = 0;
    let inStr = false;
    let esc = false;
    for (let j = start; j < s.length; j++) {
      const ch = s[j];
      if (inStr) {
        if (esc) esc = false;
        else if (ch === "\\") esc = true;
        else if (ch === '"') inStr = false;
      } else if (ch === '"') {
        inStr = true;
      } else if (ch === "{") {
        depth++;
      } else if (ch === "}") {
        depth--;
        if (depth === 0) return j + 1;
      }
    }
    return -1;
  }

  private mapear(i: PromofyItem): OfertaFuente | null {
    const producto = acortar(i.title ?? "");
    if (producto.length < 3) return null;

    const precioLista = i.original_price ?? null;
    const precioOferta = i.price ?? null;

    let descuento =
      i.discount_type === "percent" && i.discount_value ? i.discount_value : null;
    const calc = calcDescuento(precioLista, precioOferta);
    if (calc !== null) descuento = calc;

    // Sin precio ni descuento no aporta nada.
    if (precioOferta === null && descuento === null) return null;

    const esPromocion = i.type === "promotion";
    const cat = i.category_id ? CATEGORIAS_PROMOFY[i.category_id] : null;
    const unidad = categoriaNoConsumible(cat)
      ? null
      : precioPorUnidad(precioOferta, producto);

    return {
      mercado: this.nombre,
      comercio: i.store ?? null,
      producto,
      url: i.link ?? this.base,
      precioListaPesos: precioLista,
      precioOfertaPesos: precioOferta,
      descuentoPorc: descuento,
      ubicacion: null,
      localidad: null,
      provincia: null,
      detalle: i.description ? acortar(i.description, 180) : null,
      fechaInicio: i.created_at ?? null,
      fechaFin: i.expires_at ?? null,
      ean: null,
      marca: null,
      categoria: cat,
      categoriaRuta: null,
      imagenUrl: i.image_url ?? null,
      precioUnidad: unidad?.valor ?? null,
      unidadMedida: unidad?.unidad ?? null,
      stock: null,
      cuotas: null,
      reintegro:
        esPromocion && i.discount_type === "percent" && i.discount_value
          ? `${i.discount_value}%`
          : null,
      promos: null,
      tipoPromo: esPromocion ? "promocion" : i.type === "online" ? "producto" : null,
      productoId: i.id ?? null,
      fecha: this.ahoraISO(),
      disponible: (i.status ?? "active") === "active",
    };
  }
}
