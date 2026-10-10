// Envuelve handlers async: los rechazos van al middleware de error.
import type { Request, Response, NextFunction } from "express";

// Firma de handler async.
type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

/** Adapta un handler async a Express. */
export function asyncHandler(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
