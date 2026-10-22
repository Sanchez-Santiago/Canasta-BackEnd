// Log de requests con Pino. Guarda en el historial para GET /logs.
// Va antes del auth para ver los 401.
import type { Request, Response, NextFunction } from "express";
import { registrarLog } from "../logs";
import { ahoraIso } from "../utils/dates";
import { logger } from "../logger";

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
    const fecha = ahoraIso();

    registrarLog({
      fecha,
      metodo: req.method,
      ruta: req.path,
      status: res.statusCode,
      ms,
      idUsuario,
    });

    if (process.env.NODE_ENV === "development") {
      const color = colorStatus(res.statusCode);
      const reset = "\x1b[0m";
      const quien = idUsuario != null ? ` [usuario:${idUsuario}]` : "";
      console.log(
        `[${fecha}] ${req.method} ${req.path} -> ${color}${res.statusCode}${reset} (${ms}ms)${quien}`
      );
      return;
    }

    logger.info(
      {
        http: {
          method: req.method,
          path: req.path,
          status: res.statusCode,
          durationMs: ms,
        },
        userId: idUsuario,
      },
      `${req.method} ${req.path} -> ${res.statusCode} (${ms}ms)`
    );
  });
  next();
}
