import { Router } from "express";
import { validate } from "../../shared/middlewares/validate";
import {
  registrarUsuarioSchema,
  loginSchema,
} from "./user.scheme";
import {
  registrar,
  login,
  logout,
  quienSoy,
} from "./user.controller";

const router = Router();

router.post(
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
  "/login",
  validate({ body: loginSchema.shape.body }),
  login
);

router.post("/logout", logout);
router.get("/yo", quienSoy);

export default router;
