import { createRequire } from "node:module";
import { drizzle } from "drizzle-orm/mysql-proxy";
import { drizzle as mysqlDrizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2/promise";
import { getTableConfig } from "drizzle-orm/mysql-core";
import { is, Table } from "drizzle-orm";
import * as schema from "../../drizzle/schema";

/** Real-router coverage uses MySQL only when the safe runner explicitly selects
 * this worker's disposable database. Never accept inherited production selectors. */
export async function createIsolatedAuditDatabase() {
  if (!process.env.DATABASE_URL) return createAuditSqlDatabase();
  const url = new URL(process.env.DATABASE_URL);
  if (process.env.AUDIT_INTEGRATION_TEST_DB !== "1" || url.protocol !== "mysql:" ||
      url.hostname !== "127.0.0.1" || url.port !== "3311" || url.pathname !== "/echelon_audit_teams" ||
      url.username !== "root" || url.password || url.search || url.hash) {
    throw new Error("Teams audit tests require the assigned disposable loopback database and safe runner.");
  }
  const pool = createPool({ host: "127.0.0.1", port: 3311, user: "root", database: "echelon_audit_teams", timezone: "Z" });
  const db = mysqlDrizzle(pool, { schema, mode: "default" });
  console.info("[Teams audit] MySQL mode: assigned synthetic database only");
  return { db, close: () => pool.end() };
}

/** Test-only SQL execution, not a scripted result queue. It creates the proposed
 * schema entirely in RAM; no MySQL database or migration is modified. */
export function createAuditSqlDatabase() {
  const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite") as typeof import("node:sqlite");
  const sqlite = new DatabaseSync(":memory:");
  const defaults = new Map<string, Map<string, string>>();
  for (const table of Object.values(schema)) {
    if (!is(table, Table)) continue;
    const config = getTableConfig(table as any);
    const defs = new Map<string, string>();
    const columns = config.columns.map(column => {
      const name = column.name;
      const integer = /int|bool/i.test(column.getSQLType());
      let defaultSql = "NULL";
      if (typeof column.default === "string") defaultSql = `'${column.default.replaceAll("'", "''")}'`;
      else if (typeof column.default === "number") defaultSql = String(column.default);
      else if (typeof column.default === "boolean") defaultSql = column.default ? "1" : "0";
      else if (column.default) defaultSql = "CURRENT_TIMESTAMP";
      defs.set(name, defaultSql);
      return `\`${name}\` ${integer ? "INTEGER" : "TEXT"}${column.primary ? " PRIMARY KEY" : ""}${(column as any).autoIncrement ? " AUTOINCREMENT" : ""} DEFAULT ${defaultSql}`;
    });
    defaults.set(config.name, defs);
    sqlite.exec(`CREATE TABLE \`${config.name}\` (${columns.join(", ")})`);
    for (const index of config.indexes) {
      const c = index.config;
      if (c.unique && c.columns.every((col: any) => col.name)) sqlite.exec(`CREATE UNIQUE INDEX \`${c.name}\` ON \`${config.name}\` (${c.columns.map((col: any) => `\`${col.name}\``).join(", ")})`);
    }
    for (const column of config.columns.filter(column => column.isUnique)) sqlite.exec(`CREATE UNIQUE INDEX \`${config.name}_${column.name}_unique\` ON \`${config.name}\` (\`${column.name}\`)`);
  }
  const db = drizzle(async (query, params, method) => {
    params = params.map(value => typeof value === "boolean" ? Number(value) : value);
    let sql = query.replace(/RAND\(\)/gi, "RANDOM()");
    const insert = sql.match(/^insert into `([^`]+)` \(([^)]+)\) values /i);
    if (insert) {
      const columns = [...insert[2].matchAll(/`([^`]+)`/g)].map(match => match[1]);
      const start = insert[0].length;
      const valuesEnd = sql.indexOf(" on duplicate key update");
      const values = sql.slice(start, valuesEnd < 0 ? undefined : valuesEnd);
      let index = 0;
      const rewritten = values.replace(/\?|default/gi, token => {
        const column = columns[index++ % columns.length];
        return token === "?" ? token : defaults.get(insert[1])!.get(column)!;
      });
      sql = sql.slice(0, start) + rewritten + (valuesEnd < 0 ? "" : sql.slice(valuesEnd).replace(" on duplicate key update ", " ON CONFLICT DO UPDATE SET "));
    }
    if (method === "all") {
      // Unique test aliases preserve duplicate names in joined table projections.
      const from = sql.indexOf(" from ");
      const projection = sql.slice(7, from);
      let depth = 0, start = 0;
      const parts: string[] = [];
      for (let i = 0; i < projection.length; i++) {
        if (projection[i] === "(") depth++;
        if (projection[i] === ")") depth--;
        if (projection[i] === "," && depth === 0) { parts.push(projection.slice(start, i)); start = i + 1; }
      }
      parts.push(projection.slice(start));
      sql = "select " + parts.map((part, i) => part.replace(/ as `[^`]+`$/i, "") + ` AS audit_${i}`).join(",") + sql.slice(from);
      return { rows: sqlite.prepare(sql).all(...params as any[]).map(row => Object.values(row)) };
    }
    const statement = sqlite.prepare(sql);
    const result = statement.run(...params as any[]);
    return { rows: [{ insertId: Number(result.lastInsertRowid), affectedRows: Number(result.changes) }] };
  }, { schema });
  (db as any).transaction = async (fn: any) => { sqlite.exec("BEGIN"); try { const result = await fn(db); sqlite.exec("COMMIT"); return result; } catch (error) { sqlite.exec("ROLLBACK"); throw error; } };
  return { db, close: () => sqlite.close() };
}
