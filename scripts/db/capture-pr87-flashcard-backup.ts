import { createHash } from "node:crypto";
import { closeSync, fsyncSync, mkdirSync, openSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import mysql, { type RowDataPacket } from "mysql2/promise";
import { storagePut } from "../../server/storage";

const targetTag = "0064_flashcard_progress_operations";
const outputDirectory = "/home/ubuntu/pr87-migration-backups";

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function writePrivateJson(path: string, value: unknown): Buffer {
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
  const descriptor = openSync(path, "wx", 0o600);
  try {
    writeFileSync(descriptor, bytes);
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
  return bytes;
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required for a production backup snapshot.");

mkdirSync(outputDirectory, { recursive: true, mode: 0o700 });
const connection = await mysql.createConnection(databaseUrl);

try {
  const [databaseRows] = await connection.query<RowDataPacket[]>("SELECT DATABASE() AS databaseName");
  const databaseName = String(databaseRows[0]?.databaseName ?? "");
  if (!databaseName) throw new Error("Unable to identify the connected database.");

  const [ledger] = await connection.query<RowDataPacket[]>(
    "SELECT version, tag, checksum, status, startedAt, appliedAt, executionMs, errorMessage FROM echelon_schema_migrations ORDER BY version",
  );
  const migration = ledger.find(row => String(row.tag) === targetTag);
  if (migration) throw new Error(`${targetTag} is already present in the migration ledger with status ${migration.status}.`);

  const [newTableRows] = await connection.execute<RowDataPacket[]>(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_name IN ('flashcard_progress_state', 'flashcard_progress_operations') ORDER BY table_name",
    [databaseName],
  );
  if (newTableRows.length > 0) {
    throw new Error(`Refusing snapshot: target tables already exist (${newTableRows.map(row => row.table_name).join(", ")}).`);
  }

  const [legacyDdlRows] = await connection.query<RowDataPacket[]>("SHOW CREATE TABLE flashcard_progress");
  const [legacyRows] = await connection.query<RowDataPacket[]>(
    "SELECT id, email, examType, knownIds, totalCards, updatedAt FROM flashcard_progress ORDER BY id",
  );
  const [ledgerDdlRows] = await connection.query<RowDataPacket[]>("SHOW CREATE TABLE echelon_schema_migrations");

  const snapshot = {
    schemaVersion: 1,
    capturedAtUtc: new Date().toISOString(),
    purpose: "Private rollback evidence before additive migration 0064_flashcard_progress_operations.",
    databaseName,
    targetTag,
    affectedObjects: ["flashcard_progress_state", "flashcard_progress_operations", "echelon_schema_migrations"],
    rollbackNote: "Migration 0064 only creates empty additive tables. The legacy flashcard_progress table is captured unchanged; if no post-cutover writes must be retained, rollback removes only the two new tables and the 0064 ledger entry. Once new receipt-backed progress exists, pause writes and forward-fix instead of deleting that history.",
    migrationLedger: ledger,
    legacyFlashcardProgressDdl: legacyDdlRows[0],
    migrationLedgerDdl: ledgerDdlRows[0],
    legacyFlashcardProgressRows: legacyRows,
    legacyFlashcardProgressRowCount: legacyRows.length,
  };

  const timestamp = snapshot.capturedAtUtc.replace(/[:.]/g, "-");
  const snapshotPath = join(outputDirectory, `flashcard-0064-${timestamp}.json`);
  const bytes = writePrivateJson(snapshotPath, snapshot);
  const snapshotChecksum = sha256(bytes);
  if (sha256(readFileSync(snapshotPath)) !== snapshotChecksum) {
    throw new Error("Snapshot checksum verification failed after local write.");
  }

  const storageKey = `release-backups/pr87/flashcard-0064/${snapshotChecksum}.json`;
  const stored = await storagePut(storageKey, bytes, "application/json");
  const receipt = {
    schemaVersion: 1,
    capturedAtUtc: snapshot.capturedAtUtc,
    purpose: snapshot.purpose,
    targetTag,
    snapshotChecksum,
    storageKey: stored.key,
    legacyFlashcardProgressRowCount: legacyRows.length,
    verifiedLocalChecksum: true,
    targetTablesAbsentBeforeMigration: true,
  };
  const receiptPath = join(outputDirectory, `flashcard-0064-${timestamp}.receipt.json`);
  writePrivateJson(receiptPath, receipt);
  console.log(JSON.stringify(receipt, null, 2));
} finally {
  await connection.end();
}
