import bcrypt from "bcryptjs";

const ROUNDS = 10;

export async function hashContrasena(contrasena: string): Promise<string> {
  return bcrypt.hash(contrasena, ROUNDS);
}

export async function compararContrasena(
  contrasena: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(contrasena, hash);
}
