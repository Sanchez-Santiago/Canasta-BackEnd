/**
 * Fuente VTEX (Carrefour, Dia, Jumbo, MasOnline).
 *
 * Usa la API publica de busqueda del propio sitio por HTTP, lo que da precios
 * exactos (lista vs oferta) sin depender de selectores HTML. Ademas extrae:
 * EAN, marca, categorias, imagen, stock, cuotas, reintegro, promociones con
 * nombre y precio por unidad.
 */

import type { OfertaFuente, ResultadoFuente } from "./tipos";
import { FuenteBase, pedirJson } from "./base";
import { acortar, calcDescuento } from "./texto";
import { categoriaNoConsumible, precioPorUnidad, unidadCorta } from "./unidad";

export type VtexConfig = {
  nombre: string;
  /** Host raiz, sin barra final (ej. https://www.carrefour.com.ar). */
  host: string;
  /** Cantidad maxima de productos a traer. */
  limite?: number;
};

type VtexInstallment = {
  NumberOfInstallments?: number;
  InterestRate?: number | null;
  Name?: string;
};

type VtexCommertialOffer = {
  Price?: number;
  ListPrice?: number;
  PriceWithoutDiscount?: number;
  AvailableQuantity?: number;
  IsAvailable?: boolean;
  PriceValidUntil?: string;
  RewardValue?: number;
  DiscountHighLight?: unknown[];
  /** Teaser crudo (con claves `<Name>k__BackingField`). */
  Teasers?: Array<Record<string, unknown>>;
  /** Teaser ya "limpio". */
  PromotionTeasers?: Array<{
    Name?: string;
    Effects?: { Parameters?: Array<{ Name?: string; Value?: string }> };
  }>;
  Installments?: VtexInstallment[];
};

type VtexProducto = {
  productId?: string;
  productName?: string;
  link?: string;
  brand?: string;
  productReference?: string;
  categories?: string[];
  /** Campo custom de Dia: precio por unidad (ej. ["13277.78"]). */
  PrecioPorUnd?: string[];
  /** Campo custom de Dia: unidad de medida (ej. ["1 Kg"]). */
  UnidaddeMedida?: string[];
  items?: Array<{
    ean?: string | null;
    measurementUnit?: string;
    unitMultiplier?: number;
    images?: Array<{ imageUrl?: string }>;
    sellers?: Array<{
      sellerName?: string;
      commertialOffer?: VtexCommertialOffer;
    }>;
  }>;
};

export class FuenteVtex extends FuenteBase {
  readonly nombre: string;

  constructor(private cfg: VtexConfig) {
    super();
    this.nombre = cfg.nombre;
  }

  async buscar(query: string): Promise<ResultadoFuente> {
    return this.conAvisos(async () => {
      const limite = this.cfg.limite ?? 24;
      const url =
        `${this.cfg.host}/api/catalog_system/pub/products/search/` +
        `?ft=${encodeURIComponent(query)}&_from=0&_to=${limite - 1}`;

      const data = await pedirJson<unknown>(url);
      if (data === null) {
        return { ofertas: [], errores: [`${this.nombre}: sin respuesta`] };
      }
      const lista = Array.isArray(data) ? (data as VtexProducto[]) : [];
      const ofertas = lista
        .map((p) => this.mapear(p))
        .filter((o): o is OfertaFuente => o !== null);
      return { ofertas };
    });
  }

  private mapear(p: VtexProducto): OfertaFuente | null {
    if (!p?.productName) return null;
    const item = p.items?.[0];
    const seller = item?.sellers?.[0];
    const offer = seller?.commertialOffer;
    if (!offer) return null;

    const precio = offer.Price ?? null;
    const precioLista = this.calcularLista(precio, offer);
    const stock =
      typeof offer.AvailableQuantity === "number" ? offer.AvailableQuantity : null;

    const ruta = (p.categories?.[0] ?? "")
      .split("/")
      .map((s) => s.trim())
      .filter(Boolean);
    const { precioUnidad, unidadMedida } = categoriaNoConsumible(ruta)
      ? { precioUnidad: null, unidadMedida: null }
      : this.calcularPrecioUnidad(precio, p.productName, p);

    return {
      mercado: this.nombre,
      comercio: seller?.sellerName ?? this.nombre,
      producto: acortar(p.productName),
      url: p.link ?? this.cfg.host,
      precioListaPesos: precioLista ?? precio,
      precioOfertaPesos: precio,
      descuentoPorc: calcDescuento(precioLista, precio),
      ubicacion: null,
      localidad: null,
      provincia: null,
      fechaInicio: null,
      fechaFin: this.fechaFinValida(offer.PriceValidUntil),
      ean: item?.ean ?? null,
      marca: p.brand ?? null,
      categoria: ruta.length ? ruta[ruta.length - 1] : null,
      categoriaRuta: ruta.length ? ruta : null,
      imagenUrl: item?.images?.[0]?.imageUrl ?? null,
      precioUnidad,
      unidadMedida,
      stock,
      cuotas: this.extraerCuotas(offer),
      reintegro: this.extraerReintegro(offer),
      promos: this.extraerPromos(offer),
      tipoPromo: null,
      productoId: p.productId ?? null,
      detalle: null,
      fecha: this.ahoraISO(),
      disponible: offer.IsAvailable ?? (stock === null ? true : stock > 0),
    };
  }

  /**
   * Algunos sitios (Jumbo) devuelven ListPrice corrupto: aceptar el candidato
   * solo si es mayor al precio y dentro de un rango creible (< 3x).
   */
  private calcularLista(
    precio: number | null,
    offer: VtexCommertialOffer
  ): number | null {
    if (!precio) return null;
    const candidatos = [offer.PriceWithoutDiscount, offer.ListPrice].filter(
      (v): v is number => typeof v === "number" && v > 0
    );
    for (const c of candidatos) {
      if (c > precio && c <= precio * 3) return c;
    }
    return null;
  }

  /** Precio por unidad: dato estructurado (Dia) o inferido del nombre. */
  private calcularPrecioUnidad(
    precio: number | null,
    nombre: string,
    p: VtexProducto
  ): { precioUnidad: number | null; unidadMedida: string | null } {
    const ppuRaw = p.PrecioPorUnd?.[0];
    const uRaw = p.UnidaddeMedida?.[0];
    if (ppuRaw) {
      const v = Number(String(ppuRaw).replace(",", "."));
      const u = unidadCorta(uRaw);
      if (Number.isFinite(v) && v > 0 && u) return { precioUnidad: v, unidadMedida: u };
    }
    const calc = precioPorUnidad(precio, nombre);
    return calc
      ? { precioUnidad: calc.valor, unidadMedida: calc.unidad }
      : { precioUnidad: null, unidadMedida: null };
  }

  private extraerCuotas(offer: VtexCommertialOffer): string[] | null {
    const out = new Set<string>();
    for (const c of offer.Installments ?? []) {
      const n = c.NumberOfInstallments ?? 0;
      if (n <= 1) continue;
      const sinInteres = (c.InterestRate ?? 1) === 0;
      out.add(`${n} cuotas${sinInteres ? " sin interés" : ""}`);
    }
    return out.size ? [...out].slice(0, 4) : null;
  }

  private extraerReintegro(offer: VtexCommertialOffer): string | null {
    const rv = offer.RewardValue;
    return typeof rv === "number" && rv > 0 ? `$${Math.round(rv)}` : null;
  }

  /** Nombres de promociones (teasers). PromotionTeasers es el formato limpio. */
  private extraerPromos(offer: VtexCommertialOffer): string[] | null {
    const out = new Set<string>();
    for (const t of offer.PromotionTeasers ?? []) {
      if (t?.Name) out.add(t.Name);
    }
    for (const t of offer.Teasers ?? []) {
      const n = t["<Name>k__BackingField"];
      if (typeof n === "string" && n) out.add(n);
    }
    return out.size ? [...out].slice(0, 4) : null;
  }

  /**
   * VTEX suele devolver un `PriceValidUntil` por defecto (1 anio adelante) o
   * centinelas (2050-01-01). Solo lo usamos si parece una promo real (<= 180 dias).
   */
  private fechaFinValida(pvu?: string): string | null {
    if (!pvu) return null;
    const t = new Date(pvu).getTime();
    if (Number.isNaN(t)) return null;
    const dias = (t - Date.now()) / 86_400_000;
    return dias > 0 && dias <= 180 ? pvu : null;
  }
}
