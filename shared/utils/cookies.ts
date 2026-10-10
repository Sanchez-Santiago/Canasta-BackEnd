// Cookie httpOnly auth_token (SameSite=Lax, Secure solo en prod).
import type { CookieOptions, Response } from "express";
import { env } from "../../config/env";

const COOKIE_NAME = "auth_token";

// Opciones comunes de la cookie segun entorno.
function getCookieOptions(): CookieOptions {
  const isProd = env.NODE_ENV === "production";
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeMs,
  };
}

/** Guarda el JWT (login/registro). */
export function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, getCookieOptions());
}

/** Borra la cookie (logout). */
export function clearAuthCookie(res: Response): void {
  const opts: CookieOptions = {
    ...getCookieOptions(),
    maxAge: 0,
  };
  res.clearCookie(COOKIE_NAME, opts);
}

// Nombre unico de la cookie de sesion.
export const AUTH_COOKIE_NAME = COOKIE_NAME;
