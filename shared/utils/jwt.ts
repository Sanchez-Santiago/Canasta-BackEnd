import jwt, { type SignOptions, type Secret } from "jsonwebtoken";
import { env } from "../../config/env";

export interface JwtPayload {
  idUsuario: number;
}

export function firmarJwt(payload: JwtPayload): string {
  const secret: Secret = env.JWT_SECRET;
  const expiresIn = env.JWT_EXPIRES_IN as SignOptions["expiresIn"];
  return jwt.sign(payload, secret, { expiresIn });
}

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
