// JWT en cookie auth_token o header Bearer: protege todo.
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

/** Extrae el token: cookie primero, si no hay usa Authorization Bearer. */
function extraerToken(req: Request): string | null {
  const cookie = req.cookies?.[AUTH_COOKIE_NAME];
  if (cookie && typeof cookie === "string" && cookie !== "") return cookie;
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    const token = header.slice("Bearer ".length).trim();
    if (token !== "") return token;
  }
  return null;
}

/** Verifica cookie o Bearer y setea req.user; 401 si falta o es invalido. */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (esRutaPublicaAuth(req)) {
    return next();
  }

  const token = extraerToken(req);

  if (!token) {
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
