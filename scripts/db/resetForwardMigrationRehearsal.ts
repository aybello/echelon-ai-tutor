import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql, { type Connection, type RowDataPacket } from "mysql2/promise";
import {
  loadManifest,
  resolveRepoPath,
  splitMigrationStatements,
} from "./migrationSafety.ts";

export const ALLOWED_DISPOSABLE_DATABASES = new Set([
  "echelon_upgrade_ci",
  "echelon_standalone_ci",
  "echelon_local_upgrade",
  "echelon_local_standalone",
]);

const POST_BASELINE_BASELINE_TABLE_INDEXES: ReadonlyArray<{
  table: string;
  index: string;
}> = [
  { table: "exam_dates", index: "exam_dates_email_product_unique" },
  { table: "stripe_event_log", index: "stripe_event_log_status_idx" },
  { table: "team_flex_orders", index: "team_flex_orders_org_status_idx" },
];

const ANALYTICS_ANONYMOUS_TIME_INDEX = {
  table: "product_analytics_events",
  index: "analytics_anonymous_time_idx",
} as const;

export function assertDisposableResetTarget(databaseUrl: string): void {
  if (process.env.REHEARSAL_RESET_APPROVED !== "RESET_DISPOSABLE_REHEARSAL") {
    throw new Error(
      "REHEARSAL_RESET_APPROVED=RESET_DISPOSABLE_REHEARSAL is required for a disposable reset."
    );
  }
  const url = new URL(databaseUrl);
  if (!new Set(["127.0.0.1", "localhost", "::1"]).has(url.hostname)) {
    throw new Error("Disposable reset requires a loopback MySQL host.");
  }
  const databaseName = url.pathname.replace(/^\//, "").split("/")[0] ?? "";
  if (!ALLOWED_DISPOSABLE_DATABASES.has(databaseName)) {
    throw new Error(
      `Refusing reset outside an approved disposable rehearsal database: ${databaseName || "(none)"}.`
    );
  }
}

async function currentDatabase(connection: Connection): Promise<string> {
  const [rows] = await connection.query<RowDataPacket[]>(
    "SELECT DATABASE() AS databaseName"
  );
  const databaseName = String(rows[0]?.databaseName ?? "");
  if (!ALLOWED_DISPOSABLE_DATABASES.has(databaseName)) {
    throw new Error(
      `Refusing reset outside an approved disposable rehearsal database: ${databaseName || "(none)"}.`
    );
  }
  return databaseName;
}

async function indexExists(
  connection: Connection,
  table: string,
  index: string
): Promise<boolean> {
  const [rows] = await connection.query<RowDataPacket[]>(
    `
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = ?
        AND index_name = ?
      LIMIT 1
    `,
    [table, index]
  );
  return rows.length > 0;
}

async function columnExists(
  connection: Connection,
  table: string,
  column: string
): Promise<boolean> {
  const [rows] = await connection.query<RowDataPacket[]>(
    `
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = ?
        AND column_name = ?
      LIMIT 1
    `,
    [table, column]
  );
  return rows.length > 0;
}

export async function postBaselineTables(): Promise<string[]> {
  const manifest = await loadManifest();
  const tables = new Set<string>();
  for (const migration of manifest.migrations) {
    if (migration.version <= manifest.baseline.version) continue;
    const sql = await readFile(resolveRepoPath(migration.file), "utf8");
    for (const table of createdTablesFromMigrationSql(sql)) tables.add(table);
  }
  return [...tables].sort();
}

export function createdTablesFromMigrationSql(sql: string): string[] {
  const tables = new Set<string>();
  for (const statement of splitMigrationStatements(sql)) {
    const match =
      /^(?:(?:\s+)|(?:--(?=[\s\x00-\x1f]|$)[^\n]*(?:\n|$))|(?:#[^\n]*(?:\n|$))|(?:\/\*[\s\S]*?\*\/))*CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+`?([a-z0-9_]+)`?/i.exec(
        statement
      );
    if (match?.[1]) tables.add(match[1]);
  }
  return [...tables].sort();
}

async function run(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");
  assertDisposableResetTarget(databaseUrl);
  const connection = await mysql.createConnection(databaseUrl);
  try {
    await currentDatabase(connection);

    // The source is a fresh export of current schema.ts. These are the two
    // known non-additive transitions that must be returned to baseline 52.
    await connection.query(
      "ALTER TABLE job_postings MODIFY COLUMN sourceType enum('rss','scraper') NOT NULL DEFAULT 'rss'"
    );
    await connection.query(
      "ALTER TABLE team_flex_extensions MODIFY COLUMN purchaserUserId int NOT NULL"
    );

    for (const { table, index } of POST_BASELINE_BASELINE_TABLE_INDEXES) {
      if (await indexExists(connection, table, index)) {
        await connection.query(`DROP INDEX \`${index}\` ON \`${table}\``);
      }
    }

    const tables = await postBaselineTables();
    await connection.query("SET FOREIGN_KEY_CHECKS=0");
    try {
      if (tables.length > 0) {
        await connection.query(
          `DROP TABLE IF EXISTS ${tables.map(table => `\`${table}\``).join(", ")}`
        );
      }
    } finally {
      await connection.query("SET FOREIGN_KEY_CHECKS=1");
    }

    if (
      await indexExists(
        connection,
        ANALYTICS_ANONYMOUS_TIME_INDEX.table,
        ANALYTICS_ANONYMOUS_TIME_INDEX.index
      )
    ) {
      await connection.query(
        `DROP INDEX \`${ANALYTICS_ANONYMOUS_TIME_INDEX.index}\` ON \`${ANALYTICS_ANONYMOUS_TIME_INDEX.table}\``
      );
    }
    if (await columnExists(connection, "product_analytics_events", "anonymousHash")) {
      await connection.query(
        "ALTER TABLE product_analytics_events DROP COLUMN anonymousHash"
      );
    }
  } finally {
    await connection.end();
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  run().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
