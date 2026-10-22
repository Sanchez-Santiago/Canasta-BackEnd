// SQLite via Turso (libSQL): un unico cliente compartido.
// Activa FK; al arrancar se valida con SELECT 1.
import { createClient, type Client } from "@libsql/client";
import { env } from "./env";

let client: Client | null = null;

/** Devuelve el cliente (lo crea una sola vez). */
export function getDb(): Client {
  if (client) return client;

  client = createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN || undefined,
  });

  client
    .execute("PRAGMA foreign_keys = ON")
    .catch(() => {});

  return client;
}


