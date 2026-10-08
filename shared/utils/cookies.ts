import type { CookieOptions, Response } from "express";
import { env } from "../../config/env";

const COOKIE_NAME = "auth_token";

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

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, getCookieOptions());
}

export function clearAuthCookie(res: Response): void {
  const opts: CookieOptions = {
    ...getCookieOptions(),
    maxAge: 0,
  };
  res.clearCookie(COOKIE_NAME, opts);
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
