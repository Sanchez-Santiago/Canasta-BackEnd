// Acceso a SQLite: run/getOne/getAll + filas afectadas.
// libSQL expone rowsAffected (no changes como better-sqlite3).
import type { ResultSet } from "@libsql/client";
import { getDb } from "../config/database";

// Params con nombre (@x) o posicionales.
export type SqlParams = Record<string, unknown> | unknown[];

/** Ejecuta INSERT/UPDATE/DELETE. */
export async function run(
  sql: string,
  params?: SqlParams
): Promise<ResultSet> {
  const db = getDb();
  const args = Array.isArray(params)
    ? params
    : (params as Record<string, unknown>);
  return db.execute({ sql, args });
}

/** Una fila o undefined. */
export async function getOne<T>(
  sql: string,
  params?: SqlParams
): Promise<T | undefined> {
  const db = getDb();
  const args = Array.isArray(params)
    ? params
    : (params as Record<string, unknown>);
  const rs = await db.execute({ sql, args });
  const row = rs.rows[0];
  return row as T | undefined;
}

/** Todas las filas. */
export async function getAll<T>(
  sql: string,
  params?: SqlParams
): Promise<T[]> {
  const db = getDb();
  const args = Array.isArray(params)
    ? params
    : (params as Record<string, unknown>);
  const rs = await db.execute({ sql, args });
  return rs.rows as T[];
}

/** Filas tocadas por DELETE/UPDATE (0 si no borro nada). */
export function filasAfectadas(rs: ResultSet): number {
  return Number(rs.rowsAffected ?? 0);
}
