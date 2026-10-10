// Log por consola de cada request: fecha, metodo, ruta, status con color,
// duracion e id de usuario si hay sesion. Va antes del auth para ver los 401.
import type { Request, Response, NextFunction } from "express";
import { registrarLog } from "../logs";
import { ahoraIso } from "../utils/dates";

function colorStatus(status: number): string {
  if (status >= 500) return "\x1b[31m";
  if (status >= 400) return "\x1b[33m";
  return "\x1b[32m";
}

/** Loguea al terminar la respuesta y guarda en el historial. */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const inicio = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - inicio;
    const idUsuario = req.user?.idUsuario ?? null;
    registrarLog({
      fecha: ahoraIso(),
      metodo: req.method,
      ruta: req.path,
      status: res.statusCode,
      ms,
      idUsuario,
    });
    const color = colorStatus(res.statusCode);
    const reset = "\x1b[0m";
    const quien = idUsuario != null ? ` [usuario:${idUsuario}]` : "";
    console.log(
      `[${ahoraIso()}] ${req.method} ${req.path} -> ${color}${res.statusCode}${reset} (${ms}ms)${quien}`
    );
  });
  next();
}
