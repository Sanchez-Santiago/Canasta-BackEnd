// JWT en cookie auth_token: protege todo.
// Publicas: GET /, POST /auth/registrar|register|login.
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

/** Rutas que no piden sesion. */
function esRutaPublicaAuth(req: Request): boolean {
  const path = req.path.replace(/\/+$/, "") || "/";

  if (req.method === "GET" && (path === "" || path === "/")) {
    return true;
  }

  if (req.method !== "POST") return false;

  if (path === "/auth/registrar" || path === "/auth/register") {
    return true;
  }
  if (path === "/auth/login") {
    return true;
  }
  return false;
}

/** Verifica la cookie y setea req.user; 401 si falta o es invalida. */
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
