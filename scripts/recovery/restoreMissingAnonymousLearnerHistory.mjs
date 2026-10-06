#!/usr/bin/env node
/**
 * One-time recovery for anonymous learner history missed by the original
 * authoritative cutover reconciliation.
 *
 * Scope is deliberately narrow: only source attempts and learning sessions
 * with no user, organization, or organization-member relationship, and only
 * where the exact immutable record ID or session key is absent from the live
 * authoritative candidate. It never creates users, organizations, purchases,
 * subscriptions, entitlements, or email.
 *
 * Usage:
 *   node scripts/recovery/restoreMissingAnonymousLearnerHistory.mjs plan --report /private/report.json
 *   ANONYMOUS_HISTORY_RESTORE_APPROVED=<plan digest> \
 *     node scripts/recovery/restoreMissingAnonymousLearnerHistory.mjs apply --plan /private/plan.json --report /private/report.json
 */
import { createHash, randomBytes } from "node:crypto";
import { lstat, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import mysql from "mysql2/promise";
import { parseMySqlUrl, quoteIdentifier } from "../lib/externalDatabaseMigration.mjs";

const REPO_ROOT = "/home/ubuntu/echelon-ai-tutor";
const PRIVATE_ROOT = "/home/ubuntu/private/echelon-authoritative-recovery";
const CA_PATH = "/home/ubuntu/private/echelon-external-db/digitalocean-ca.crt";
const SOURCE_METADATA_PATH = "/home/ubuntu/private/echelon-external-db/final-cutover-target.json";
const TARGET_METADATA_PATH = `${PRIVATE_ROOT}/candidate-target.json`;
const LOCK_NAME = "echelon:anonymous-learner-history-recovery:v1";
const TABLES = ["question_attempts", "learning_activity_sessions"];

function fail(message) {
  throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function safeIdentifier(value, label) {
  if (!/^[A-Za-z0-9_]+$/.test(value ?? "")) fail(`Unsafe ${label}.`);
  return value;
}

function q(value, label) {
  return quoteIdentifier(safeIdentifier(value, label), label);
}

function fingerprint(value) {
  return sha256(String(value)).slice(0, 16);
}

function stableJson(value) {
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Buffer.isBuffer(value)) return JSON.stringify({ bufferSha256: sha256(value) });
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function parseArgs(argv) {
  const [mode, ...rest] = argv;
  if (!new Set(["plan", "apply"]).has(mode)) fail("Choose plan or apply mode.");
  const args = { mode, plan: null, report: null };
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (token === "--plan") args.plan = rest[++index];
    else if (token === "--report") args.report = rest[++index];
    else fail(`Unknown argument: ${token}`);
  }
  if (!args.report) fail("A private --report path is required.");
  if (mode === "apply" && !args.plan) fail("Apply mode requires the exact prior --plan file.");
  return args;
}

function assertOutsideRepository(pathname, label) {
  const absolute = resolve(pathname);
  if (absolute === REPO_ROOT || absolute.startsWith(`${REPO_ROOT}/`)) fail(`${label} must remain outside the repository.`);
  return absolute;
}

async function writePrivate(pathname, value, { overwrite = false } = {}) {
  const absolute = assertOutsideRepository(pathname, "Recovery report");
  await mkdir(dirname(absolute), { recursive: true, mode: 0o700 });
  try {
    const existing = await lstat(absolute);
    if (existing.isSymbolicLink()) fail("Recovery report destination cannot be a symbolic link.");
    if (!overwrite) fail("Recovery report destination already exists.");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const temporary = resolve(dirname(absolute), `.${basename(absolute)}.${process.pid}.${randomBytes(8).toString("hex")}.tmp`);
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600, flag: "wx" });
  await rename(temporary, absolute);
  return absolute;
}

async function loadMetadata(pathname) {
  const metadata = JSON.parse(await readFile(pathname, "utf8"));
  const url = new URL(metadata.externalDatabaseUrl);
  return {
    metadata,
    databaseName: safeIdentifier(metadata.databaseName ?? decodeURIComponent(url.pathname.slice(1)), "database name"),
    serverFingerprint: fingerprint(`${url.protocol}//${url.hostname}:${url.port || "3306"}`),
  };
}

async function openConnection(metadata, caCertificate) {
  return mysql.createConnection(parseMySqlUrl(metadata.externalDatabaseUrl, { caCertificate, requireTls: true }));
}

async function columns(connection, databaseName, tableName) {
  const [rows] = await connection.execute(
    `SELECT column_name AS name, column_type AS type, is_nullable AS nullable, column_default AS defaultValue, extra
       FROM information_schema.columns
      WHERE table_schema=? AND table_name=?
      ORDER BY ordinal_position`,
    [databaseName, tableName],
  );
  const values = rows.map(row => ({
    name: safeIdentifier(row.name, "column name"),
    type: String(row.type),
    nullable: String(row.nullable),
    defaultValue: row.defaultValue === undefined ? null : row.defaultValue,
    extra: String(row.extra ?? ""),
  }));
  if (!values.length) fail(`The ${tableName} table is unavailable.`);
  return values;
}

async function sharedColumns(connection, sourceDatabase, targetDatabase, tableName) {
  const [source, target] = await Promise.all([
    columns(connection, sourceDatabase, tableName),
    columns(connection, targetDatabase, tableName),
  ]);
  const sourceByName = new Map(source.map(column => [column.name, column]));
  const sameSchema = source.length === target.length && target.every(column => {
    const sourceColumn = sourceByName.get(column.name);
    return sourceColumn && stableJson(sourceColumn) === stableJson(column);
  });
  if (!sameSchema) fail(`The ${tableName} schemas do not match. Refusing restoration.`);
  // Column order differs in historical question_attempts migrations. Select by
  // name from the source but insert in the current target's declared order.
  return target.map(column => column.name);
}

async function recoveryRows(connection, sourceDatabase, targetDatabase, tableName, columnsForTable) {
  const selectColumns = columnsForTable.map(column => `s.${q(column, "column")}`).join(", ");
  const sourceTable = `${q(sourceDatabase, "source database")}.${q(tableName, "table")}`;
  const targetTable = `${q(targetDatabase, "target database")}.${q(tableName, "table")}`;
  const key = tableName === "question_attempts" ? "id" : "sessionKey";
  const additionalScope = tableName === "learning_activity_sessions" ? "AND s.teamFlexLicenceId IS NULL" : "";
  const comparisonColumns = tableName === "learning_activity_sessions"
    ? columnsForTable.filter(column => column !== "id")
    : columnsForTable;
  const contentDiffers = comparisonColumns
    .map(column => `NOT(s.${q(column, "column")} <=> t.${q(column, "column")})`)
    .join(" OR ");
  const [rows] = await connection.query(`
    SELECT ${selectColumns}
      FROM ${sourceTable} s
 LEFT JOIN ${targetTable} t ON t.${q(key, "key")} = s.${q(key, "key")}
     WHERE (t.${q(key, "key")} IS NULL OR ${contentDiffers})
       AND s.userId IS NULL
       AND s.orgId IS NULL
       AND s.organizationMemberId IS NULL
       ${additionalScope}
     ORDER BY s.${q(key, "key")}
  `);
  return rows;
}

function recordDigest(rowsByTable) {
  return sha256(stableJson(rowsByTable));
}

function planDigest(plan) {
  const stable = { ...plan };
  delete stable.generatedAtUtc;
  return sha256(stableJson(stable));
}

async function getLock(connection) {
  const [[row]] = await connection.execute("SELECT GET_LOCK(?, 20) AS acquired", [LOCK_NAME]);
  if (Number(row.acquired) !== 1) fail("Learner history recovery lock is unavailable.");
}

async function releaseLock(connection) {
  await connection.execute("SELECT RELEASE_LOCK(?)", [LOCK_NAME]).catch(() => {});
}

async function buildPlan(connection, sourceDatabase, targetDatabase, { includeRows = false } = {}) {
  const columnsByTable = {};
  const rowsByTable = {};
  for (const tableName of TABLES) {
    columnsByTable[tableName] = await sharedColumns(connection, sourceDatabase, targetDatabase, tableName);
    rowsByTable[tableName] = await recoveryRows(connection, sourceDatabase, targetDatabase, tableName, columnsByTable[tableName]);
  }
  const plan = {
    format: "echelon-anonymous-learner-history-recovery-v1",
    generatedAtUtc: new Date().toISOString(),
    sourceDatabaseFingerprint: fingerprint(sourceDatabase),
    targetDatabaseFingerprint: fingerprint(targetDatabase),
    scope: "source rows with no user, organization, or organization-member relationship and no live immutable key match",
    tables: Object.fromEntries(TABLES.map(tableName => [tableName, {
      key: tableName === "question_attempts" ? "id" : "sessionKey",
      count: rowsByTable[tableName].length,
      columns: columnsByTable[tableName],
    }])) ,
    rowsDigest: recordDigest(rowsByTable),
  };
  return includeRows ? { plan, rowsByTable } : plan;
}

async function readOnlyPlan(connection, sourceDatabase, targetDatabase) {
  await connection.query("SET SESSION TRANSACTION READ ONLY");
  await connection.beginTransaction();
  try {
    const plan = await buildPlan(connection, sourceDatabase, targetDatabase);
    await connection.commit();
    return plan;
  } catch (error) {
    await connection.rollback().catch(() => {});
    throw error;
  }
}

async function assertNoTargetTriggers(connection, targetDatabase) {
  const [rows] = await connection.execute(
    `SELECT trigger_name AS triggerName
       FROM information_schema.triggers
      WHERE trigger_schema=? AND event_object_table IN (?, ?)
      LIMIT 1`,
    [targetDatabase, ...TABLES],
  );
  if (rows.length) fail("Refusing recovery: target learner-history tables have database triggers outside the approved write scope.");
}

async function insertRows(connection, targetDatabase, tableName, columnsForTable, rows) {
  if (!rows.length) return 0;
  const targetTable = `${q(targetDatabase, "target database")}.${q(tableName, "table")}`;
  // Historical activity IDs can collide with IDs allocated by the recovered
  // database. The immutable sessionKey is the learner-history identity, so
  // preserve it and always let the live target allocate its numeric surrogate.
  const insertColumns = tableName === "learning_activity_sessions"
    ? columnsForTable.filter(column => column !== "id")
    : columnsForTable;
  const fieldList = insertColumns.map(column => q(column, "column")).join(", ");
  const placeholderList = insertColumns.map(() => "?").join(", ");
  const updates = insertColumns
    .filter(column => column !== (tableName === "question_attempts" ? "id" : "sessionKey"))
    .map(column => `${q(column, "column")} = VALUES(${q(column, "column")})`)
    .join(", ");
  const sql = `INSERT INTO ${targetTable} (${fieldList}) VALUES (${placeholderList}) ON DUPLICATE KEY UPDATE ${updates}`;
  let inserted = 0;
  for (const row of rows) {
    const values = insertColumns.map(column => row[column]);
    const [result] = await connection.execute(sql, values);
    if (![1, 2].includes(Number(result.affectedRows))) fail(`Unexpected write result for ${tableName}.`);
    inserted += 1;
  }
  return inserted;
}

function contentColumns(tableName, columnsForTable) {
  return tableName === "learning_activity_sessions"
    ? columnsForTable.filter(column => column !== "id")
    : columnsForTable;
}

function contentDigest(tableName, columnsForTable, rows) {
  const key = tableName === "question_attempts" ? "id" : "sessionKey";
  const fields = contentColumns(tableName, columnsForTable);
  const canonical = rows.map(row => Object.fromEntries(fields.map(field => [field, row[field]])))
    .sort((left, right) => String(left[key]).localeCompare(String(right[key])));
  return sha256(stableJson(canonical));
}

async function targetContentDigest(connection, targetDatabase, tableName, columnsForTable, sourceRows) {
  if (!sourceRows.length) return contentDigest(tableName, columnsForTable, []);
  const key = tableName === "question_attempts" ? "id" : "sessionKey";
  const fields = contentColumns(tableName, columnsForTable);
  const placeholders = sourceRows.map(() => "?").join(", ");
  const fieldList = fields.map(column => q(column, "column")).join(", ");
  const [rows] = await connection.execute(
    `SELECT ${fieldList} FROM ${q(targetDatabase, "target database")}.${q(tableName, "table")}
      WHERE ${q(key, "key")} IN (${placeholders}) ORDER BY ${q(key, "key")}`,
    sourceRows.map(row => row[key]),
  );
  if (rows.length !== sourceRows.length) fail(`Post-insert ${tableName} count does not match the approved source rows.`);
  return contentDigest(tableName, columnsForTable, rows);
}

async function run(args) {
  const [source, target, caCertificate] = await Promise.all([
    loadMetadata(SOURCE_METADATA_PATH),
    loadMetadata(TARGET_METADATA_PATH),
    readFile(CA_PATH, "utf8"),
  ]);
  if (source.serverFingerprint !== target.serverFingerprint) {
    fail("Refusing recovery: the frozen source and live target are not on the verified same database server.");
  }
  if (source.databaseName === target.databaseName) {
    fail("Refusing recovery: the frozen source and live target must be distinct databases.");
  }
  if (!process.env.DATABASE_CUTOVER_TARGET_DATABASE || process.env.DATABASE_CUTOVER_TARGET_DATABASE !== target.databaseName) {
    fail("Refusing recovery: target metadata does not match the configured authoritative application database.");
  }
  const connection = await openConnection(target.metadata, caCertificate);
  try {
    await assertNoTargetTriggers(connection, target.databaseName);
    if (args.mode === "plan") {
      const plan = await readOnlyPlan(connection, source.databaseName, target.databaseName);
      const result = { plan, planDigest: planDigest(plan), noWrites: true };
      const reportPath = await writePrivate(args.report, result);
      console.log(JSON.stringify({ mode: "plan", noWrites: true, counts: Object.fromEntries(TABLES.map(table => [table, plan.tables[table].count])), planDigest: result.planDigest, report: reportPath }));
      return;
    }

    const supplied = JSON.parse(await readFile(assertOutsideRepository(args.plan, "Recovery plan"), "utf8"));
    if (!supplied.plan || !/^[a-f0-9]{64}$/.test(supplied.planDigest ?? "")) fail("The supplied recovery plan is invalid.");
    if (planDigest(supplied.plan) !== supplied.planDigest) fail("The supplied recovery plan digest is invalid.");
    if (process.env.ANONYMOUS_HISTORY_RESTORE_APPROVED !== supplied.planDigest) fail("Apply requires the exact current recovery plan digest.");

    await getLock(connection);
    let committed = false;
    const intentPath = `${assertOutsideRepository(args.report, "Recovery report")}.intent`;
    try {
      await connection.beginTransaction();
      await assertNoTargetTriggers(connection, target.databaseName);
      const currentSnapshot = await buildPlan(connection, source.databaseName, target.databaseName, { includeRows: true });
      const { plan: current, rowsByTable } = currentSnapshot;
      const currentDigest = planDigest(current);
      if (
        currentDigest !== supplied.planDigest
        || current.rowsDigest !== supplied.plan.rowsDigest
        || supplied.plan.sourceDatabaseFingerprint !== fingerprint(source.databaseName)
        || supplied.plan.targetDatabaseFingerprint !== fingerprint(target.databaseName)
      ) {
        fail("Source or target state changed after preflight. Generate and review a new recovery plan before apply.");
      }
      await writePrivate(intentPath, {
        state: "pending_commit",
        createdAtUtc: new Date().toISOString(),
        planDigest: supplied.planDigest,
        rowsDigest: current.rowsDigest,
        intendedCounts: Object.fromEntries(TABLES.map(table => [table, current.tables[table].count])),
      });
      const inserted = {};
      for (const tableName of TABLES) inserted[tableName] = await insertRows(connection, target.databaseName, tableName, current.tables[tableName].columns, rowsByTable[tableName]);
      for (const tableName of TABLES) {
        if (inserted[tableName] !== current.tables[tableName].count) {
          fail(`Inserted ${tableName} count does not match the approved recovery plan.`);
        }
        const sourceDigest = contentDigest(tableName, current.tables[tableName].columns, rowsByTable[tableName]);
        const targetDigest = await targetContentDigest(connection, target.databaseName, tableName, current.tables[tableName].columns, rowsByTable[tableName]);
        if (sourceDigest !== targetDigest) fail(`Restored ${tableName} content does not match the approved source rows.`);
      }
      const after = await buildPlan(connection, source.databaseName, target.databaseName);
      if (after.tables.question_attempts.count !== 0 || after.tables.learning_activity_sessions.count !== 0) {
        fail("Post-insert verification found unrecovered anonymous learner history.");
      }
      await connection.commit();
      committed = true;
      const result = {
        mode: "applied",
        appliedAtUtc: new Date().toISOString(),
        sourceDatabaseFingerprint: fingerprint(source.databaseName),
        targetDatabaseFingerprint: fingerprint(target.databaseName),
        planDigest: supplied.planDigest,
        rowsDigest: current.rowsDigest,
        inserted,
        postApplyMissing: Object.fromEntries(TABLES.map(table => [table, after.tables[table].count])),
        writeScope: TABLES,
        storedContentVerified: true,
        noEmailSent: true,
      };
      await writePrivate(intentPath, { state: "committed", ...result }, { overwrite: true });
      const reportPath = await writePrivate(args.report, result);
      await rm(intentPath, { force: true });
      console.log(JSON.stringify({ ...result, report: reportPath }));
    } catch (error) {
      if (!committed) await connection.rollback().catch(() => {});
      throw error;
    } finally {
      await releaseLock(connection);
    }
  } finally {
    await connection.end();
  }
}

run(parseArgs(process.argv.slice(2))).catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
