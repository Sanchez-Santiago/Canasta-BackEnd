// Variables de entorno validadas con Zod.
// Falla al arrancar si falta algo requerido.
import "dotenv/config";
import { z } from "zod";

// Esquema de validacion (tipos y rangos).
const envSchema = z.object({
  PORT: z
    .string()
    .default("3000")
    .transform((v) => Number(v))
    .refine(
      (n) => Number.isInteger(n) && n > 0,
      "PORT debe ser un entero positivo"
    ),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  JWT_SECRET: z
    .string()
    .min(10, "JWT_SECRET debe tener al menos 10 caracteres"),
  JWT_EXPIRES_IN: z
    .string()
    .min(1, "JWT_EXPIRES_IN es requerido (ej. 7d, 1h, 3600s)"),
  TURSO_DATABASE_URL: z
    .string()
    .min(1, "TURSO_DATABASE_URL es requerido (libsql://... o file:...)"),
  TURSO_AUTH_TOKEN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errors = parsed.error.issues
    .map((i) => `${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`Error validando variables de entorno:\n${errors}`);
}

/** Variables ya validadas: importar desde aqui. */
export const env = parsed.data;
