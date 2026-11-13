#!/usr/bin/env node
/**
 * Set moduleTargets on the two US Class I bank metadata rows so the mock exam
 * start screen shows the real blueprint distribution instead of "0 Topics".
 *
 * Source of truth is server/usMockBlueprint.ts, which was verified satisfiable
 * against the live visible question rows. This script writes only the
 * moduleTargets column on exactly those two bank rows. It touches no question,
 * no answer key, no Canadian bank and no learner record.
 *
 * Usage:
 *   node scripts/set-us-bank-module-targets.mjs check
 *   CONFIRM_US_BANK_TARGETS=<checksum> node scripts/set-us-bank-module-targets.mjs apply
 */
import crypto from "node:crypto";
import mysql from "mysql2/promise";
import { activeScriptConnection } from "./lib/activeScriptConnection.mjs";

// Mirrors server/usMockBlueprint.ts exactly. Kept literal so a drift is visible.
const TARGETS = {
  "us-class1-water": {
    "Treatment processes": 31,
    Laboratory: 16,
    Equipment: 26,
    "Source water": 15,
    "Safety/security/administration": 12,
  },
  "us-class1-water-dist": {
    "Distribution components": 35,
    "Equipment/field work": 30,
    "Water quality/laboratory": 15,
    "Safety/security/administration/public interactions": 20,
  },
};

const checksum = crypto
  .createHash("sha256")
  .update(JSON.stringify(TARGETS))
  .digest("hex");

const mode = process.argv[2] ?? "check";

for (const [bank, t] of Object.entries(TARGETS)) {
  const sum = Object.values(t).reduce((a, b) => a + b, 0);
  if (sum !== 100) {
    console.error(`REFUSED: ${bank} targets sum to ${sum}, expected 100.`);
    process.exit(1);
  }
}
console.log(`Checksum: ${checksum}`);

if (mode === "check") {
  for (const [bank, t] of Object.entries(TARGETS)) {
    console.log(`${bank}: ${Object.keys(t).length} modules, 100 questions`);
  }
  process.exit(0);
}

if (mode !== "apply") {
  console.error("Mode must be check or apply.");
  process.exit(1);
}
if (process.env.CONFIRM_US_BANK_TARGETS !== checksum) {
  console.error("REFUSED: CONFIRM_US_BANK_TARGETS does not match the checksum above.");
  process.exit(1);
}

const target = activeScriptConnection();
console.log(`Connecting to ${target.description}`);
const conn = await mysql.createConnection(target.options);
try {
  for (const [bank, t] of Object.entries(TARGETS)) {
    const [rows] = await conn.execute(
      "SELECT bankKey, modules, moduleTargets FROM question_bank_meta WHERE bankKey = ?",
      [bank],
    );
    if (rows.length !== 1) {
      throw new Error(`REFUSED: expected exactly one metadata row for ${bank}, found ${rows.length}.`);
    }
    // Every target module must exist in the bank's recorded module list.
    const known = JSON.parse(rows[0].modules ?? "[]");
    for (const m of Object.keys(t)) {
      if (!known.includes(m)) {
        throw new Error(`REFUSED: ${bank} has no module named "${m}".`);
      }
    }
    const [res] = await conn.execute(
      "UPDATE question_bank_meta SET moduleTargets = ? WHERE bankKey = ? AND moduleTargets IS NULL",
      [JSON.stringify(t), bank],
    );
    console.log(`${bank}: ${res.affectedRows} row(s) updated`);
  }
  const [after] = await conn.execute(
    "SELECT bankKey, moduleTargets FROM question_bank_meta WHERE bankKey IN (?, ?)",
    Object.keys(TARGETS),
  );
  for (const r of after) {
    console.log(`verify ${r.bankKey}: ${r.moduleTargets}`);
  }
} finally {
  await conn.end();
}
