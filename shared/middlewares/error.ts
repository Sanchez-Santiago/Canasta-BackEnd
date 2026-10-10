// Traduce errores a JSON { ok:false, error }. Solo loguea 5xx.
import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

/** ZodError -> 400 con detalles; resto segun status. */
export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      ok: false,
      error: "Datos inválidos",
      detalles: err.issues.map((i) => ({
        path: i.path,
        message: i.message,
      })),
    });
    return;
  }

  const status = (err as any)?.status ?? 500;
  const mensaje =
    status >= 500
      ? "Error interno del servidor"
      : (err as any)?.message ?? "Error inesperado";

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    ok: false,
    error: mensaje,
  });
}
