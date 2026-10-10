// Fila del GROUP BY (tipo, total, cantidad).
export interface TotalesFila {
  tipo: "ingreso" | "gasto";
  total: number;
  cantidad: number;
}

// Resumen en centavos y pesos.
export interface ResumenFinanzas {
  total_ingresos_centavos: number;
  total_ingresos_pesos: number;
  total_gastos_centavos: number;
  total_gastos_pesos: number;
  balance_centavos: number;
  balance_pesos: number;
  cantidad_movimientos: number;
}

// Centavos a pesos con 2 decimales.
export function aPesos(centavos: number): number {
  return Number((centavos / 100).toFixed(2));
}

/** Suma por tipo y calcula el balance. */
export function construirResumen(filas: TotalesFila[]): ResumenFinanzas {
  let ingresos = 0;
  let gastos = 0;
  let cantidad = 0;

  for (const f of filas) {
    const total = Number(f.total ?? 0);
    const cant = Number(f.cantidad ?? 0);
    cantidad += cant;
    if (f.tipo === "ingreso") ingresos += total;
    else if (f.tipo === "gasto") gastos += total;
  }

  const balance = ingresos - gastos;

  return {
    total_ingresos_centavos: ingresos,
    total_ingresos_pesos: aPesos(ingresos),
    total_gastos_centavos: gastos,
    total_gastos_pesos: aPesos(gastos),
    balance_centavos: balance,
    balance_pesos: aPesos(balance),
    cantidad_movimientos: cantidad,
  };
}
