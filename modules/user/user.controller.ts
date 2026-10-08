import type { Request, Response } from "express";
import {
  registrarUsuario,
  loginUsuario,
  obtenerUsuarioAutenticado,
  AuthError,
} from "./user.service";
import { setAuthCookie, clearAuthCookie } from "../../shared/utils/cookies";
import { asyncHandler } from "../../shared/middlewares/asyncHandler";
import { creado, ok } from "../../shared/utils/http";

export const registrar = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req;

  try {
    const resultado = await registrarUsuario(body);
    setAuthCookie(res, resultado.token);
    return creado(res, { usuario: resultado.usuario });
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.status).json({ ok: false, error: err.message });
    }
    throw err;
  }
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req;

  try {
    const resultado = await loginUsuario(body);
    setAuthCookie(res, resultado.token);
    return ok(res, { usuario: resultado.usuario });
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.status).json({ ok: false, error: err.message });
    }
    throw err;
  }
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  clearAuthCookie(res);
  return res.status(200).json({ ok: true, mensaje: "Sesión cerrada" });
});

export const quienSoy = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ ok: false, error: "No autorizado" });
  }

  const usuario = await obtenerUsuarioAutenticado(req.user.idUsuario);

  if (!usuario) {
    return res.status(401).json({ ok: false, error: "Usuario no encontrado" });
  }

  return ok(res, { usuario });
});
