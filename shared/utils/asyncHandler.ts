import type { Request, Response, NextFunction } from "express";

type AsyncHandler<T = any> = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<T>;

export function asyncHandler(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
