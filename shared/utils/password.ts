// Bcrypt: hash al registrar, compare al loguear.
import bcrypt from "bcryptjs";

const ROUNDS = 10;

/** Hash con 10 rounds. */
export async function hashContrasena(contrasena: string): Promise<string> {
  return bcrypt.hash(contrasena, ROUNDS);
}

/** true si la contrasena coincide con el hash. */
export async function compararContrasena(
  contrasena: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(contrasena, hash);
}
