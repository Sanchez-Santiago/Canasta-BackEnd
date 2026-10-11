// HTTP de auth: delega al service y maneja cookie + AuthError.
import type { Request, Response } from "express";
import {
  registrarUsuario,
  loginUsuario,
  obtenerUsuarioAutenticado,
  actualizarPerfilService,
  cambiarContrasenaService,
  AuthError,
} from "./user.service";
import { setAuthCookie, clearAuthCookie } from "../../shared/utils/cookies";
import { asyncHandler } from "../../shared/middlewares/asyncHandler";
import { creado, ok } from "../../shared/utils/http";

/** POST /auth/registrar -> 201 + cookie. */
export const registrar = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req;

  try {
    const resultado = await registrarUsuario(body);
    setAuthCookie(res, resultado.token);
    return creado(res, { usuario: resultado.usuario, token: resultado.token });
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.status).json({
        ok: false,
        error: err.message,
        ...(err.detalles !== undefined ? err.detalles : {}),
      });
    }
    throw err;
  }
});

/** POST /auth/login -> 200 + cookie. */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req;

  try {
    const resultado = await loginUsuario(body);
    setAuthCookie(res, resultado.token);
    return ok(res, { usuario: resultado.usuario, token: resultado.token });
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.status).json({
        ok: false,
        error: err.message,
        ...(err.detalles !== undefined ? err.detalles : {}),
      });
    }
    throw err;
  }
});

/** POST /auth/logout: limpia la cookie. */
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  clearAuthCookie(res);
  return res.status(200).json({ ok: true, mensaje: "Sesión cerrada" });
});

/** GET /auth/yo: usuario de la cookie. */
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

/** PUT /auth/yo: edita el propio perfil. */
export const actualizarPerfil = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ ok: false, error: "No autorizado" });
  }

  try {
    const resultado = await actualizarPerfilService(req.user.idUsuario, req.body);
    return ok(res, resultado);
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.status).json({
        ok: false,
        error: err.message,
        ...(err.detalles !== undefined ? err.detalles : {}),
      });
    }
    throw err;
  }
});

/** PATCH /auth/contrasena: cambia la propia clave. */
export const cambiarContrasena = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ ok: false, error: "No autorizado" });
  }

  try {
    const resultado = await cambiarContrasenaService(req.user.idUsuario, req.body);
    return ok(res, resultado);
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.status).json({
        ok: false,
        error: err.message,
        ...(err.detalles !== undefined ? err.detalles : {}),
      });
    }
    throw err;
  }
});
