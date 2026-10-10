// Total estimado = SUM(cantidad x precio unitario).
// En centavos y pesos; ignora items sin precio.
import type { ProductoListaDB } from "../productoLista/productoLista.scheme";

// Resultado del calculo.
export interface TotalEstimado {
  total_estimado_centavos: number;
  total_estimado_pesos: number;
  cantidad_items_con_precio: number;
  cantidad_items_total: number;
}

/** Suma round(precio x cantidad) de items con precio. */
export function calcularTotalEstimado(items: ProductoListaDB[]): TotalEstimado {
  let totalCentavos = 0;
  let conPrecio = 0;
  const totalItems = items.length;

  for (const it of items) {
    if (it.precio_estimado_unitario != null) {
      const precio = it.precio_estimado_unitario;
      if (precio >= 0 && it.cantidad > 0) {
        totalCentavos += Math.round(precio * it.cantidad);
        conPrecio += 1;
      }
    }
  }

  const totalPesos = Number((totalCentavos / 100).toFixed(2));

  return {
    total_estimado_centavos: totalCentavos,
    total_estimado_pesos: totalPesos,
    cantidad_items_con_precio: conPrecio,
    cantidad_items_total: totalItems,
  };
}
