// Respuestas JSON uniformes { ok:true, data }.
import type { Response } from "express";

/** 200 (u otro status) con data. */
export function ok<T>(res: Response, data: T, status = 200): Response {
  return res.status(status).json({ ok: true, data });
}

/** 201 para altas. */
export function creado<T>(res: Response, data: T): Response {
  return ok(res, data, 201);
}
