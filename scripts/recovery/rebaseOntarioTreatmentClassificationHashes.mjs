#!/usr/bin/env node
/**
 * One-time compatibility rebase for the private GPT-6 Astra classification
 * package. It changes no database data. It proves each existing classification
 * still matches the live classifier input, then records the current compact
 * classifier-input fingerprint used by the guarded release planner.
 */
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import mysql from "mysql2/promise";
import {
  ONTARIO_TREATMENT_BANK_KEYS,
  preservedRowHash,
} from "../lib/ontarioTreatmentModuleRestoration.mjs";
import { authoritativeProductionConnectionOptions } from "./releaseClass3ApprovedCandidates.mjs";

const RELEASE_KEY = "ontario-treatment-module-restoration-2026-09-24";
const MODEL = "gpt-6-astra";
const PRIVATE_ROOT = "/home/ubuntu/private/echelon-authoritative-recovery/ontario-treatment-module-restoration-2026-09-24";
const PACKAGE_PATH = `${PRIVATE_ROOT}/ontario-treatment-module-classification.json`;
const BACKUP_PATH = `${PRIVATE_ROOT}/ontario-treatment-module-classification-before-hash-rebase.json`;

function fail(message) {
  throw new Error(`Ontario treatment classification hash rebase blocked: ${message}`);
}

function legacyHash(row) {
  const result = {};
  for (const key of Object.keys(row).sort()) {
    const value = row[key];
    result[key] = value instanceof Date ? value.toISOString() : value;
  }
  if (typeof result.options === "string") {
    try { result.options = JSON.parse(result.options); }
    catch { fail(`Question ${row.questionNum} has malformed options.`); }
  }
  delete result.module;
  return createHash("sha256").update(JSON.stringify(result)).digest("hex");
}

async function assertAuthoritativeTarget(connection) {
  const [identityRows] = await connection.execute("SELECT DATABASE() AS databaseName");
  const connectedDatabase = String(identityRows[0]?.databaseName ?? "");
  if (!connectedDatabase || connectedDatabase !== process.env.DATABASE_CUTOVER_TARGET_DATABASE) {
    fail("Connected database does not match the configured authoritative external cutover target.");
  }
}

async function readRows(connection, bankKey) {
  const [rows] = await connection.execute(
    `SELECT id, bankKey, questionNum, module, question, options, correctIndex, explanation, difficulty, isCalc, cognitiveLevel, steps, reviewStatus
       FROM \`questions\`
      WHERE \`bankKey\`=? AND COALESCE(\`reviewStatus\`, 'approved') NOT IN ('in_review','rejected')
      ORDER BY \`questionNum\``,
    [bankKey],
  );
  return rows;
}

async function run() {
  await mkdir(PRIVATE_ROOT, { recursive: true });
  const raw = await readFile(PACKAGE_PATH, "utf8");
  const packageData = JSON.parse(raw);
  if (packageData?.releaseKey !== RELEASE_KEY || packageData?.model !== MODEL || !packageData?.banks) {
    fail("Classification package has an unexpected release key, model, or bank payload.");
  }
  const connection = await mysql.createConnection(authoritativeProductionConnectionOptions());
  try {
    await assertAuthoritativeTarget(connection);
    const evidence = [];
    for (const bankKey of ONTARIO_TREATMENT_BANK_KEYS) {
      const bank = packageData.banks[bankKey];
      if (!bank || bank.status !== "complete" || !Array.isArray(bank.classifications)) fail(`Package is incomplete for ${bankKey}.`);
      const rows = await readRows(connection, bankKey);
      const rowsByQuestionNum = new Map(rows.map((row) => [Number(row.questionNum), row]));
      if (bank.classifications.length !== rows.length) fail(`${bankKey} package count differs from live learner-visible count.`);
      for (const classification of bank.classifications) {
        const row = rowsByQuestionNum.get(Number(classification.questionNum));
        if (!row) fail(`${bankKey} classification ${classification.questionNum} has no live learner-visible question.`);
        if (classification.sourceHash !== legacyHash(row)) {
          fail(`${bankKey} question ${classification.questionNum} changed after GPT-6 Astra classification.`);
        }
        classification.sourceHash = preservedRowHash(row);
      }
      evidence.push({ bankKey, questionCount: rows.length });
    }
    await copyFile(PACKAGE_PATH, BACKUP_PATH);
    packageData.hashContract = "classifier-input-v2";
    packageData.hashRebasedAtUtc = new Date().toISOString();
    const rendered = `${JSON.stringify(packageData, null, 2)}\n`;
    await writeFile(PACKAGE_PATH, rendered);
    const packageDigest = createHash("sha256").update(rendered).digest("hex");
    const evidencePath = `${PRIVATE_ROOT}/ontario-treatment-classification-hash-rebase.json`;
    await writeFile(evidencePath, `${JSON.stringify({
      rebasedAtUtc: new Date().toISOString(),
      releaseKey: RELEASE_KEY,
      model: MODEL,
      packageDigest,
      evidence,
    }, null, 2)}\n`);
    console.log(JSON.stringify({ rebased: true, packageDigest, evidencePath, banks: evidence }, null, 2));
  } finally {
    await connection.end();
  }
}

await run();
