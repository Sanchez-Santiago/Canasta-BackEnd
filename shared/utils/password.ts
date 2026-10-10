// Bcrypt: hash al registrar, compare al loguear.
// Fortaleza: puntaje 0-5 y recomendaciones para altas.
import bcrypt from "bcryptjs";

const ROUNDS = 10;
const MINIMO_FUERTE = 3;

/** Claves comunes que se rechazan directo. */
const CLAVES_COMUNES = [
  "123456",
  "12345678",
  "password",
  "qwerty",
  "abc123",
  "111111",
  "123123",
  "contrasena",
];

export interface FortalezaClave {
  puntaje: number;
  fuerte: boolean;
  recomendaciones: string[];
}

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

/**
 * Puntaje 0-5: +1 largo>=8, +1 minus+mayus, +1 digito, +1 simbolo, +1 largo>=12.
 * Fuerte si llega a 3 y no es comun.
 */
export function evaluarFortaleza(contrasena: string): FortalezaClave {
  const recomendaciones: string[] = [];
  let puntaje = 0;

  if (CLAVES_COMUNES.includes(contrasena.toLowerCase())) {
    return {
      puntaje: 0,
      fuerte: false,
      recomendaciones: ["Elegí una clave que no sea tan predecible"],
    };
  }

  if (contrasena.length >= 8) {
    puntaje += 1;
  } else {
    recomendaciones.push("Usá al menos 8 caracteres");
  }

  if (/[a-z]/.test(contrasena) && /[A-Z]/.test(contrasena)) {
    puntaje += 1;
  } else {
    recomendaciones.push("Combiná minúsculas y mayúsculas");
  }

  if (/\d/.test(contrasena)) {
    puntaje += 1;
  } else {
    recomendaciones.push("Agregá al menos un número");
  }

  if (/[^a-zA-Z0-9]/.test(contrasena)) {
    puntaje += 1;
  } else {
    recomendaciones.push("Sumá un símbolo (ej. ! _ - #)");
  }

  if (contrasena.length >= 12) puntaje += 1;

  return { puntaje, fuerte: puntaje >= MINIMO_FUERTE, recomendaciones };
}
