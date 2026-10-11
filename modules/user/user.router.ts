// Rutas /auth (montado en index.ts). Solo registro y login son publicas.
import { Router } from "express";
import { validate } from "../../shared/middlewares/validate";
import {
  registrarUsuarioSchema,
  loginSchema,
  actualizarPerfilBodySchema,
  cambiarContrasenaBodySchema,
} from "./user.scheme";
import {
  registrar,
  login,
  logout,
  quienSoy,
  actualizarPerfil,
  cambiarContrasena,
} from "./user.controller";

// Router del dominio (el auth global va antes).
const router = Router();

router.post(
// Alta publica (alias /register debajo).
  "/registrar",
  validate({ body: registrarUsuarioSchema.shape.body }),
  registrar
);

router.post(
  "/register",
  validate({ body: registrarUsuarioSchema.shape.body }),
  registrar
);

router.post(
// Login publico.
  "/login",
  validate({ body: loginSchema.shape.body }),
  login
);

// Sesion: requieren cookie (protegidas).
router.post("/logout", logout);
router.get("/yo", quienSoy);
router.put("/yo", validate({ body: actualizarPerfilBodySchema }), actualizarPerfil);
router.patch(
  "/contrasena",
  validate({ body: cambiarContrasenaBodySchema }),
  cambiarContrasena
);

export default router;
