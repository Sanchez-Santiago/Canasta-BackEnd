import { createClient, type Client } from "@libsql/client";
import { env } from "./env";

let client: Client | null = null;

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

export function closeDb(): void {
  if (client) {
    client.close();
    client = null;
  }
}
