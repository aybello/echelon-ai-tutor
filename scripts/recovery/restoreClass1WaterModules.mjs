#!/usr/bin/env node
/**
 * Owner-authorized restoration of the Class 1 Water learner module menu.
 *
 * This release only reclassifies the existing learner-visible questions by
 * `module` and corrects the matching metadata menu, count, and cache version.
 * It never changes question wording, options, answers, explanations, review
 * status, learner records, entitlements, or commercial data.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import mysql from "mysql2/promise";
import {
  CLASS1_WATER_BANK,
  digest,
  isClass1WaterModuleRestored,
  planClass1WaterModuleRestoration,
} from "../lib/class1WaterModuleRestoration.mjs";
import { authoritativeProductionConnectionOptions } from "./releaseClass3ApprovedCandidates.mjs";

const RELEASE_KEY = "class1-water-module-restoration-2026-09-24";
const PRIVATE_ROOT = "/home/ubuntu/private/echelon-authoritative-recovery/class1-water-authoritative-module-restoration-2026-09-24";
const DEFAULT_CLASSIFICATION_PATH = `${PRIVATE_ROOT}/class1-water-module-classification.json`;
const mode = process.argv[2] ?? "plan";

if (!new Set(["plan", "apply"]).has(mode) || process.argv.length !== 3) {
  throw new Error("Usage: node scripts/recovery/restoreClass1WaterModules.mjs [plan|apply]");
}
function fail(message) {
  throw new Error(`Class 1 Water module restoration blocked: ${message}`);
}

function canonicalRow(row) {
  const result = {};
  for (const key of Object.keys(row).sort()) {
    const value = row[key];
    result[key] = value instanceof Date ? value.toISOString() : value;
  }
  if (typeof result.options === "string") {
    try { result.options = JSON.parse(result.options); }
    catch { fail(`Question ${row.questionNum} has malformed options.`); }
  }
  return result;
}

function sourceHash(row) {
  return createHash("sha256").update(JSON.stringify(canonicalRow(row))).digest("hex");
}

function preservedRowHash(row) {
  const value = canonicalRow(row);
  delete value.module;
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function liveFingerprint(rows, metadata) {
  return digest({
    questions: rows.map((row) => ({
      id: Number(row.id),
      questionNum: Number(row.questionNum),
      module: row.module,
      reviewStatus: row.reviewStatus,
      contentHash: sourceHash(row),
    })),
    metadata: {
      bankKey: metadata.bankKey,
      modules: metadata.modules,
      totalQuestions: Number(metadata.totalQuestions),
      contentVersion: Number(metadata.contentVersion ?? 1),
    },
  });
}

function planDigest(plan, targetFingerprint, classificationDigest) {
  return digest({
    releaseKey: RELEASE_KEY,
    targetFingerprint,
    classificationDigest,
    scopeDigest: plan.scopeDigest,
    modules: plan.modules,
    counts: plan.counts,
    metadata: plan.metadata,
  });
}

async function readClassifications() {
  const filePath = process.env.CLASS1_WATER_MODULE_CLASSIFICATIONS ?? DEFAULT_CLASSIFICATION_PATH;
  let raw;
  try { raw = await readFile(resolve(filePath), "utf8"); }
  catch (error) { fail(`Unable to read classification package ${filePath}: ${error instanceof Error ? error.message : String(error)}`); }
  let parsed;
  try { parsed = JSON.parse(raw); }
  catch { fail("Classification package is not valid JSON."); }
  if (!Array.isArray(parsed?.classifications)) fail("Classification package is missing classifications.");
  return { filePath: resolve(filePath), classifications: parsed.classifications, classificationDigest: createHash("sha256").update(raw).digest("hex") };
}

async function readLiveState(connection, lock) {
  const suffix = lock ? " FOR UPDATE" : "";
  const [rows] = await connection.execute(
    `SELECT * FROM \`questions\` WHERE \`bankKey\`=? ORDER BY \`questionNum\`${suffix}`,
    [CLASS1_WATER_BANK],
  );
  const [metadataRows] = await connection.execute(
    `SELECT * FROM \`question_bank_meta\` WHERE \`bankKey\`=?${suffix}`,
    [CLASS1_WATER_BANK],
  );
  if (metadataRows.length !== 1) fail(`Expected one Class 1 Water metadata row, found ${metadataRows.length}.`);
  return { rows, metadata: metadataRows[0] };
}

async function persistEvidence(name, value) {
  await mkdir(PRIVATE_ROOT, { recursive: true });
  const path = `${PRIVATE_ROOT}/${name}`;
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
  return path;
}

async function run() {
  const { filePath, classifications, classificationDigest } = await readClassifications();
  const connection = await mysql.createConnection(authoritativeProductionConnectionOptions());
  let committed = false;
  let commitAttempted = false;
  try {
    // TiDB does not implement MySQL's SET TRANSACTION READ ONLY. A regular
    // transaction is used for the plan path and always rolled back without
    // issuing any mutating statement.
    await connection.beginTransaction();

    const { rows, metadata } = await readLiveState(connection, mode === "apply");
    const plan = planClass1WaterModuleRestoration({ rows, metadata: [metadata], classifications });
    if (!plan.ready) fail(plan.errors.join(" "));
    if (mode === "apply" && isClass1WaterModuleRestored(plan)) {
      fail("Class 1 Water module restoration is already applied. A duplicate release is not permitted.");
    }

    const targetFingerprint = liveFingerprint(rows, metadata);
    const exactPlanDigest = planDigest(plan, targetFingerprint, classificationDigest);
    const summary = {
      releaseKey: RELEASE_KEY,
      mode,
      classificationPath: filePath,
      classificationDigest,
      targetFingerprint,
      planDigest: exactPlanDigest,
      questionCount: plan.questionCount,
      questionChanges: plan.questionChanges.length,
      modules: plan.modules,
      counts: plan.counts,
      lowConfidence: plan.lowConfidence,
      metadata: plan.metadata,
    };
    console.log(JSON.stringify(summary, null, 2));

    if (mode === "plan") {
      await connection.rollback();
      await persistEvidence("class1-water-module-restoration-plan.json", {
        capturedAtUtc: new Date().toISOString(),
        ...summary,
      });
      return;
    }

    if (process.env.CONFIRM_CLASS1_WATER_MODULE_RESTORATION !== exactPlanDigest) {
      fail("CONFIRM_CLASS1_WATER_MODULE_RESTORATION does not match the exact live plan digest.");
    }

    const beforeEvidencePath = await persistEvidence("class1-water-module-restoration-before.json", {
      capturedAtUtc: new Date().toISOString(),
      releaseKey: RELEASE_KEY,
      targetFingerprint,
      planDigest: exactPlanDigest,
      metadata: canonicalRow(metadata),
      questions: rows.map(canonicalRow),
    });

    for (const change of plan.questionChanges) {
      const before = rows.find((row) => Number(row.id) === change.id);
      if (!before) fail(`Missing locked question ${change.questionNum}.`);
      const [snapshot] = await connection.execute(
        "INSERT INTO `question_content_snapshots` (`releaseKey`,`bankKey`,`questionId`,`questionNum`,`sourceContentVersion`,`contentHash`,`payload`) VALUES (?,?,?,?,?,?,?)",
        [RELEASE_KEY, CLASS1_WATER_BANK, before.id, before.questionNum, Number(metadata.contentVersion ?? 1), sourceHash(before), JSON.stringify(canonicalRow(before))],
      );
      if (snapshot.affectedRows !== 1) fail(`Before-image capture failed for question ${before.questionNum}.`);
      const [update] = await connection.execute(
        "UPDATE `questions` SET `module`=? WHERE `id`=? AND `bankKey`=? AND `questionNum`=? AND `module`=? AND `reviewStatus`=?",
        [change.afterModule, before.id, CLASS1_WATER_BANK, before.questionNum, change.beforeModule, before.reviewStatus],
      );
      if (update.affectedRows !== 1) fail(`Module update failed for question ${before.questionNum}.`);
    }

    const [metadataUpdate] = await connection.execute(
      "UPDATE `question_bank_meta` SET `modules`=?, `totalQuestions`=?, `contentVersion`=`contentVersion`+1 WHERE `bankKey`=? AND `modules`=? AND `totalQuestions`=? AND `contentVersion`=?",
      [JSON.stringify(plan.modules), plan.metadata.afterTotalQuestions, CLASS1_WATER_BANK, metadata.modules, Number(metadata.totalQuestions), Number(metadata.contentVersion ?? 1)],
    );
    if (metadataUpdate.affectedRows !== 1) fail("Class 1 Water metadata update did not affect exactly one row.");

    const { rows: postRows, metadata: postMetadata } = await readLiveState(connection, true);
    const postPlan = planClass1WaterModuleRestoration({ rows: postRows, metadata: [postMetadata], classifications });
    if (!postPlan.ready) fail(`Post-write plan validation failed: ${postPlan.errors.join(" ")}`);
    if (JSON.stringify(postPlan.modules) !== JSON.stringify(plan.modules)) fail("Post-write module menu mismatch.");
    if (Number(postMetadata.totalQuestions) !== plan.metadata.afterTotalQuestions) fail("Post-write question count metadata mismatch.");
    if (Number(postMetadata.contentVersion) !== plan.metadata.afterContentVersion) fail("Post-write content version mismatch.");

    const beforeById = new Map(rows.map((row) => [Number(row.id), row]));
    for (const postRow of postRows) {
      const before = beforeById.get(Number(postRow.id));
      if (!before) fail(`Post-write question ${postRow.questionNum} was not present before release.`);
      if (preservedRowHash(postRow) !== preservedRowHash(before)) fail(`Unexpected non-module mutation for question ${postRow.questionNum}.`);
    }
    const [snapshotCountRows] = await connection.execute(
      "SELECT COUNT(*) AS count FROM `question_content_snapshots` WHERE `releaseKey`=? AND `bankKey`=?",
      [RELEASE_KEY, CLASS1_WATER_BANK],
    );
    if (Number(snapshotCountRows[0]?.count) !== plan.questionChanges.length) fail("Before-image snapshot count mismatch.");

    commitAttempted = true;
    await connection.commit();
    committed = true;
    const resultPath = await persistEvidence("class1-water-module-restoration-apply.json", {
      capturedAtUtc: new Date().toISOString(),
      beforeEvidencePath,
      ...summary,
      applied: true,
      postMetadata: canonicalRow(postMetadata),
      snapshotCount: Number(snapshotCountRows[0]?.count),
    });
    console.log(JSON.stringify({ applied: true, resultPath, ...summary }, null, 2));
  } catch (error) {
    if (!commitAttempted) await connection.rollback();
    if (commitAttempted && !committed) {
      throw new Error(`Commit outcome is uncertain. Do not retry this release. Run read-only reconciliation before another write. Original error: ${error instanceof Error ? error.message : String(error)}`);
    }
    throw error;
  } finally {
    await connection.end();
  }
}

await run();
