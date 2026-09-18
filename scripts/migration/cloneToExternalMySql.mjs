#!/usr/bin/env node
/**
 * One-time, guarded clone from the current Echelon production database to an
 * Echelon-owned external MySQL database. It never changes the source database
 * and refuses to write unless the target database is empty.
 *
 * Commands:
 *   node scripts/migration/cloneToExternalMySql.mjs preflight --report /private/report.json
 *   EXTERNAL_DATABASE_MIGRATION_APPROVED=CLONE_CURRENT_ECHELON_PRODUCTION \
 *     node scripts/migration/cloneToExternalMySql.mjs apply --report /private/report.json
 *   node scripts/migration/cloneToExternalMySql.mjs verify --report /private/report.json
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import {
  allColumnsOrder,
  digestRows,
  parseMySqlUrl,
  quoteIdentifier,
  sortedTableNames,
} from "../lib/externalDatabaseMigration.mjs";

const APPROVAL_TOKEN = "CLONE_CURRENT_ECHELON_PRODUCTION";
const BATCH_SIZE = 250;
const REPO_ROOT = path.resolve(new URL("../..", import.meta.url).pathname);

function usage() {
  console.error("Usage: cloneToExternalMySql.mjs <preflight|apply|verify> --report /absolute/private/report.json");
  process.exit(1);
}

function parseArgs(argv) {
  const [command, ...remaining] = argv;
  const reportIndex = remaining.indexOf("--report");
  const reportPath = reportIndex >= 0 ? remaining[reportIndex + 1] : null;
  if (!command || !["preflight", "apply", "verify"].includes(command) || !reportPath) usage();
  if (!path.isAbsolute(reportPath) || reportPath.includes(`${path.sep}echelon-ai-tutor${path.sep}`)) {
    throw new Error("Report path must be an absolute path outside the repository.");
  }
  return { command, reportPath };
}

function normalizePem(value) {
  return value.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trimEnd() + "\n";
}

function requireConfig() {
  const sourceUrl = process.env.DATABASE_URL;
  const targetUrl = process.env.EXTERNAL_DATABASE_URL;
  const targetCa = process.env.EXTERNAL_DATABASE_CA;
  if (!sourceUrl) throw new Error("DATABASE_URL is required for the source database.");
  if (!targetUrl) throw new Error("EXTERNAL_DATABASE_URL is required for the external target.");
  if (!targetCa) throw new Error("EXTERNAL_DATABASE_CA is required for certificate-verified target TLS.");
  return { sourceUrl, targetUrl, targetCa: normalizePem(targetCa) };
}

async function listTables(connection) {
  const [rows] = await connection.query(
    `SELECT table_name AS tableName
     FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'
     ORDER BY table_name`
  );
  return sortedTableNames(rows.map(row => String(row.tableName)));
}

async function tableColumns(connection, tableName) {
  const [rows] = await connection.query(`SHOW COLUMNS FROM ${quoteIdentifier(tableName, "table name")}`);
  return rows.map(row => String(row.Field));
}

async function primaryColumns(connection, tableName, allColumns) {
  const [rows] = await connection.query(
    `SHOW KEYS FROM ${quoteIdentifier(tableName, "table name")} WHERE Key_name = 'PRIMARY'`
  );
  const primary = rows
    .sort((left, right) => Number(left.Seq_in_index) - Number(right.Seq_in_index))
    .map(row => String(row.Column_name));
  return primary.length > 0 ? primary : allColumns;
}

async function tableDigest(connection, tableName) {
  const columns = await tableColumns(connection, tableName);
  const orderColumns = await primaryColumns(connection, tableName, columns);
  const [rows] = await connection.query(
    `SELECT ${allColumnsOrder(columns)}
     FROM ${quoteIdentifier(tableName, "table name")}
     ORDER BY ${allColumnsOrder(orderColumns)}`
  );
  return { rowCount: rows.length, sha256: digestRows(rows), columns };
}

async function databaseInventory(connection, tableNames = null) {
  const tables = tableNames ?? await listTables(connection);
  const inventories = {};
  for (const tableName of tables) inventories[tableName] = await tableDigest(connection, tableName);
  return {
    tableCount: tables.length,
    tables: inventories,
    aggregateSha256: createHash("sha256")
      .update(JSON.stringify(inventories))
      .digest("hex"),
  };
}

async function targetIsEmpty(connection) {
  const tableNames = await listTables(connection);
  if (tableNames.length > 0) {
    throw new Error(`External target is not empty. It already has ${tableNames.length} table(s) and will not be modified.`);
  }
}

function normalizeCreateTable(createStatement) {
  return createStatement
    .replace(/\s*\/\*T!\[clustered_index\]\s+CLUSTERED\s*\*\//g, "")
    .replace(/\s*\/\*T!\[clustered_index\]\s+NONCLUSTERED\s*\*\//g, "");
}

async function createTargetSchema(source, target, tableNames) {
  for (const tableName of tableNames) {
    const [rows] = await source.query(`SHOW CREATE TABLE ${quoteIdentifier(tableName, "table name")}`);
    const statement = rows[0]?.["Create Table"];
    if (typeof statement !== "string" || !statement.startsWith("CREATE TABLE")) {
      throw new Error(`Could not obtain CREATE TABLE statement for ${tableName}.`);
    }
    await target.query(normalizeCreateTable(statement));
  }
}

async function copyTable(source, target, tableName) {
  const columns = await tableColumns(source, tableName);
  const columnList = allColumnsOrder(columns);
  const [rows] = await source.query(`SELECT ${columnList} FROM ${quoteIdentifier(tableName, "table name")}`);
  for (let offset = 0; offset < rows.length; offset += BATCH_SIZE) {
    const chunk = rows.slice(offset, offset + BATCH_SIZE).map(row => columns.map(column => row[column]));
    const placeholders = chunk.map(() => `(${columns.map(() => "?").join(", ")})`).join(", ");
    await target.query(
      `INSERT INTO ${quoteIdentifier(tableName, "table name")} (${columnList}) VALUES ${placeholders}`,
      chunk.flat()
    );
  }
}

async function copyData(source, target, tableNames) {
  for (const tableName of tableNames) await copyTable(source, target, tableName);
}

async function createConnections() {
  const { sourceUrl, targetUrl, targetCa } = requireConfig();
  const source = await mysql.createConnection(sourceUrl);
  const target = await mysql.createConnection(
    parseMySqlUrl(targetUrl, { caCertificate: targetCa, requireTls: true })
  );
  return { source, target };
}

async function consistentSourceInventory(source) {
  // TiDB's START TRANSACTION already provides snapshot isolation. Its
  // READ ONLY modifier is intentionally unsupported, so do not enable its
  // no-op compatibility mode. This script issues no source writes.
  await source.query("START TRANSACTION");
  try {
    return await databaseInventory(source);
  } finally {
    await source.query("ROLLBACK");
  }
}

async function writeReport(reportPath, report) {
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
}

async function readReport(reportPath) {
  return JSON.parse(await readFile(reportPath, "utf8"));
}

async function main() {
  const { command, reportPath } = parseArgs(process.argv.slice(2));
  const { source, target } = await createConnections();
  try {
    if (command === "preflight") {
      await targetIsEmpty(target);
      const sourceInventory = await consistentSourceInventory(source);
      const report = {
        formatVersion: 1,
        command: "preflight",
        createdAt: new Date().toISOString(),
        source: sourceInventory,
        target: { tableCount: 0 },
        approvalToken: APPROVAL_TOKEN,
      };
      await writeReport(reportPath, report);
      console.log(JSON.stringify({ ok: true, tableCount: sourceInventory.tableCount, aggregateSha256: sourceInventory.aggregateSha256 }));
      return;
    }

    const report = await readReport(reportPath);
    if (report?.formatVersion !== 1 || report?.approvalToken !== APPROVAL_TOKEN) {
      throw new Error("The supplied preflight report is invalid.");
    }

    if (command === "apply") {
      if (process.env.EXTERNAL_DATABASE_MIGRATION_APPROVED !== APPROVAL_TOKEN) {
        throw new Error(`Refusing external database write. Set EXTERNAL_DATABASE_MIGRATION_APPROVED=${APPROVAL_TOKEN}.`);
      }
      await targetIsEmpty(target);
      // See consistentSourceInventory: a plain TiDB transaction is a
      // consistent snapshot, while READ ONLY is a rejected no-op modifier.
      await source.query("START TRANSACTION");
      let sourceInventory;
      try {
        sourceInventory = await databaseInventory(source);
        if (sourceInventory.aggregateSha256 !== report.source.aggregateSha256) {
          throw new Error("Source changed after preflight. Generate a new preflight before copying data.");
        }
        const tableNames = Object.keys(sourceInventory.tables).sort();
        await createTargetSchema(source, target, tableNames);
        await copyData(source, target, tableNames);
      } finally {
        await source.query("ROLLBACK");
      }
      const targetInventory = await databaseInventory(target);
      if (targetInventory.aggregateSha256 !== sourceInventory.aggregateSha256) {
        throw new Error("External database clone verification failed. The target differs from the source snapshot.");
      }
      const applied = {
        ...report,
        command: "applied",
        appliedAt: new Date().toISOString(),
        source: sourceInventory,
        target: targetInventory,
      };
      await writeReport(reportPath, applied);
      console.log(JSON.stringify({ ok: true, tableCount: targetInventory.tableCount, aggregateSha256: targetInventory.aggregateSha256 }));
      return;
    }

    const targetInventory = await databaseInventory(target);
    const expected = report.target?.aggregateSha256 ?? report.source?.aggregateSha256;
    if (targetInventory.aggregateSha256 !== expected) {
      throw new Error("External database verification failed. The target differs from the recorded source snapshot.");
    }
    console.log(JSON.stringify({ ok: true, tableCount: targetInventory.tableCount, aggregateSha256: targetInventory.aggregateSha256 }));
  } finally {
    await source.end();
    await target.end();
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
