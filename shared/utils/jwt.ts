// JWT de sesion: payload minimo { idUsuario }.
import jwt, { type SignOptions, type Secret } from "jsonwebtoken";
import { env } from "../../config/env";

// Lo unico que guarda el token.
export interface JwtPayload {
  idUsuario: number;
}

/** Firma con expiracion de JWT_EXPIRES_IN. */
export function firmarJwt(payload: JwtPayload): string {
  const secret: Secret = env.JWT_SECRET;
  const expiresIn = env.JWT_EXPIRES_IN as SignOptions["expiresIn"];
  return jwt.sign(payload, secret, { expiresIn });
}

/** Verifica firma/expiracion y valida el payload. */
export function verificarJwt(token: string): JwtPayload {
  const secret: Secret = env.JWT_SECRET;
  const decoded = jwt.verify(token, secret) as unknown;
  const p = decoded as Partial<JwtPayload>;

  if (
    typeof p.idUsuario !== "number" ||
    !Number.isInteger(p.idUsuario) ||
    p.idUsuario <= 0
  ) {
    throw new Error("Payload JWT inválido");
  }

  return { idUsuario: p.idUsuario };
}
