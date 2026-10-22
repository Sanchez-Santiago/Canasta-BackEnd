// Acceso a SQLite: run/getOne/getAll + filas afectadas.
// libSQL expone rowsAffected (no changes como better-sqlite3).
import type { InArgs, InStatement, ResultSet } from "@libsql/client";
import { getDb } from "../config/database";

// Params con nombre (@x) o posicionales.
export type SqlParams = Record<string, unknown> | unknown[];

/** Ejecuta INSERT/UPDATE/DELETE. */
export async function run(
  sql: string,
  params?: SqlParams
): Promise<ResultSet> {
  const db = getDb();
  if (params === undefined || params === null) {
    return db.execute(sql);
  }
  if (Array.isArray(params)) {
    return db.execute({ sql, args: params as InArgs } as InStatement);
  }
  return db.execute({ sql, args: params as Record<string, unknown> } as InStatement);
}

/** Una fila o undefined. */
export async function getOne<T>(
  sql: string,
  params?: SqlParams
): Promise<T | undefined> {
  const db = getDb();
  if (params === undefined || params === null) {
    const rs = await db.execute(sql);
    const row = rs.rows[0];
    return row as T | undefined;
  }
  if (Array.isArray(params)) {
    const rs = await db.execute({ sql, args: params as InArgs } as InStatement);
    const row = rs.rows[0];
    return row as T | undefined;
  }
  const rs = await db.execute({ sql, args: params as Record<string, unknown> } as InStatement);
  const row = rs.rows[0];
  return row as T | undefined;
}

/** Todas las filas. */
export async function getAll<T>(
  sql: string,
  params?: SqlParams
): Promise<T[]> {
  const db = getDb();
  if (params === undefined || params === null) {
    const rs = await db.execute(sql);
    return rs.rows as T[];
  }
  if (Array.isArray(params)) {
    const rs = await db.execute({ sql, args: params as InArgs } as InStatement);
    return rs.rows as T[];
  }
  const rs = await db.execute({ sql, args: params as Record<string, unknown> } as InStatement);
  return rs.rows as T[];
}

/** Filas tocadas por DELETE/UPDATE (0 si no borro nada). */
export function filasAfectadas(rs: ResultSet): number {
  return Number(rs.rowsAffected ?? 0);
}
