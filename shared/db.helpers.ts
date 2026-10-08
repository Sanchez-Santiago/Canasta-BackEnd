import type { ResultSet } from "@libsql/client";
import { getDb } from "../config/database";

export type SqlParams = Record<string, unknown> | unknown[];

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
