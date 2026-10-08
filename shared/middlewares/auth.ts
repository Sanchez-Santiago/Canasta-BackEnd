import type { Request, Response, NextFunction } from "express";
import { AUTH_COOKIE_NAME } from "../utils/cookies";
import { verificarJwt } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: { idUsuario: number };
    }
  }
}

function esRutaPublicaAuth(req: Request): boolean {
  if (req.method !== "POST") return false;
  const path = req.path.replace(/\/+$/, "");

  if (path === "/auth/registrar" || path === "/auth/register") {
    return true;
  }
  if (path === "/auth/login") {
    return true;
  }
  return false;
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (esRutaPublicaAuth(req)) {
    return next();
  }

  const token = req.cookies?.[AUTH_COOKIE_NAME];

  if (!token || typeof token !== "string") {
    res.status(401).json({ ok: false, error: "No autorizado" });
    return;
  }

  try {
    const payload = verificarJwt(token);
    req.user = { idUsuario: payload.idUsuario };
    next();
  } catch {
    res.status(401).json({ ok: false, error: "Token inválido o expirado" });
  }
}
