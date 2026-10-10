// Historial en memoria de requests (anillo de las ultimas 200).
// Lo llena requestLogger y lo expone GET /logs.

export interface EntradaLog {
  fecha: string;
  metodo: string;
  ruta: string;
  status: number;
  ms: number;
  idUsuario: number | null;
}

const MAXIMO = 200;
const historial: EntradaLog[] = [];

/** Guarda una entrada (descarta las mas viejas pasado el maximo). */
export function registrarLog(entrada: EntradaLog): void {
  historial.push(entrada);
  if (historial.length > MAXIMO) {
    historial.splice(0, historial.length - MAXIMO);
  }
}

/** Ultimas N entradas (las mas recientes primero). */
export function obtenerLogs(limite = 50): { logs: EntradaLog[]; total: number } {
  const n = Math.min(Math.max(limite, 1), MAXIMO);
  return { logs: historial.slice(-n).reverse(), total: historial.length };
}
