import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import mysql from "mysql2/promise";
import { activeScriptConnection } from "./lib/activeScriptConnection.mjs";

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, value = "true"] = arg.replace(/^--/, "").split("=");
  return [key, value];
}));
const apply = args.get("apply") === "true";
const packagePath = args.get("package");
const reportPath = args.get("report");
if (!packagePath || !reportPath) throw new Error("Usage: node scripts/release-worked-steps.mjs --package=/absolute/package.json --report=/absolute/report.json [--apply]");

const pkg = JSON.parse(await readFile(resolve(packagePath), "utf8"));
const allowedBanks = new Set(["oit-ww", "class3-water-dist"]);
if (pkg.length !== 271) throw new Error(`Expected 271 reviewed rows, found ${pkg.length}`);
const byId = new Map();
for (const row of pkg) {
  if (!Number.isInteger(row.id) || !allowedBanks.has(row.bankKey)) throw new Error(`Invalid row identity: ${row.id} ${row.bankKey}`);
  if (byId.has(row.id)) throw new Error(`Duplicate row id: ${row.id}`);
  if (!Array.isArray(row.steps) || row.steps.length < 2 || row.steps.length > 7) throw new Error(`Invalid steps for ${row.id}`);
  if (row.steps.some((step) => !step?.l || !step?.c || /[—–]/.test(`${step.l} ${step.c}`))) throw new Error(`Invalid step content for ${row.id}`);
  byId.set(row.id, row);
}

const digest = (rows) => createHash("sha256").update(JSON.stringify(rows)).digest("hex");
const target = activeScriptConnection(process.env);
const connection = await mysql.createConnection(target.options);
let open = false;
try {
  await connection.beginTransaction(); open = true;
  const ids = [...byId.keys()];
  const placeholders = ids.map(() => "?").join(",");
  const [before] = await connection.execute(
    `SELECT id, bankKey, questionNum, steps FROM questions WHERE id IN (${placeholders}) ORDER BY id FOR UPDATE`, ids,
  );
  if (before.length !== pkg.length) throw new Error(`Expected ${pkg.length} target rows, found ${before.length}`);
  const wrongBank = before.find((row) => !allowedBanks.has(row.bankKey) || row.bankKey !== byId.get(row.id).bankKey);
  if (wrongBank) throw new Error(`Bank identity mismatch for ${wrongBank.id}`);
  const nonEmpty = before.filter((row) => row.steps !== null && row.steps !== "");
  if (nonEmpty.length) throw new Error(`Refusing to overwrite ${nonEmpty.length} non-empty steps fields`);

  const beforeDigest = digest(before);
  if (!apply) {
    await connection.rollback(); open = false;
    const report = { mode: "preflight", target: target.description, rows: before.length, emptySteps: before.length, beforeDigest, transaction: "rolled_back" };
    await mkdir(dirname(resolve(reportPath)), { recursive: true });
    await writeFile(resolve(reportPath), `${JSON.stringify(report, null, 2)}\n`, { flag: "wx", mode: 0o600 });
    console.log(JSON.stringify(report, null, 2)); process.exit(0);
  }

  for (const row of pkg) {
    const steps = JSON.stringify(row.steps);
    const [result] = await connection.execute(
      "UPDATE questions SET steps = ? WHERE id = ? AND bankKey = ? AND (steps IS NULL OR steps = '')",
      [steps, row.id, row.bankKey],
    );
    if (result.affectedRows !== 1) throw new Error(`Row ${row.id} was not updated exactly once`);
  }

  const [after] = await connection.execute(
    `SELECT id, bankKey, questionNum, steps FROM questions WHERE id IN (${placeholders}) ORDER BY id`, ids,
  );
  const invalid = after.filter((row) => {
    try { const steps = JSON.parse(row.steps); return !Array.isArray(steps) || steps.length < 2; } catch { return true; }
  });
  if (invalid.length) throw new Error(`Post-update validation failed for ${invalid.length} rows`);
  const afterDigest = digest(after);
  await connection.commit(); open = false;
  const report = { mode: "applied", target: target.description, rows: after.length, beforeDigest, afterDigest, banks: { "oit-ww": pkg.filter((x) => x.bankKey === "oit-ww").length, "class3-water-dist": pkg.filter((x) => x.bankKey === "class3-water-dist").length }, transaction: "committed", appliedAt: new Date().toISOString() };
  await mkdir(dirname(resolve(reportPath)), { recursive: true });
  await writeFile(resolve(reportPath), `${JSON.stringify(report, null, 2)}\n`, { flag: "wx", mode: 0o600 });
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  if (open) await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
