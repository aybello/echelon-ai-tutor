#!/usr/bin/env node
/**
 * Owner-authorized restoration of detailed Ontario Water Treatment and
 * Wastewater Treatment module navigation across the seven existing banks.
 *
 * The release changes only `questions.module`, `question_bank_meta.modules`,
 * `question_bank_meta.totalQuestions`, and `question_bank_meta.contentVersion`.
 * It never changes question content, governance status, learners, access,
 * payments, prices, entitlements, schema, routing, or infrastructure.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import mysql from "mysql2/promise";
import {
  digest,
  isOntarioTreatmentModuleRestored,
  ONTARIO_TREATMENT_BANK_KEYS,
  planOntarioTreatmentModuleRestoration,
  preservedRowHash,
} from "../lib/ontarioTreatmentModuleRestoration.mjs";
import { authoritativeProductionConnectionOptions } from "./releaseClass3ApprovedCandidates.mjs";

const RELEASE_KEY = "ontario-treatment-module-restoration-2026-09-24";
const CLASSIFIER_MODEL = "gpt-6-astra";
const PRIVATE_ROOT = "/home/ubuntu/private/echelon-authoritative-recovery/ontario-treatment-module-restoration-2026-09-24";
const DEFAULT_CLASSIFICATION_PATH = `${PRIVATE_ROOT}/ontario-treatment-module-classification.json`;
const mode = process.argv[2] ?? "plan";

if (!new Set(["plan", "apply"]).has(mode) || process.argv.length !== 3) {
  throw new Error("Usage: node scripts/recovery/restoreOntarioTreatmentModules.mjs [plan|apply]");
}

function fail(message) {
  throw new Error(`Ontario treatment module restoration blocked: ${message}`);
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

function liveFingerprint(states) {
  return digest(states.map(({ bankKey, rows, metadata }) => ({
    bankKey,
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
  })));
}

async function assertAuthoritativeTarget(connection) {
  const [identityRows] = await connection.execute("SELECT DATABASE() AS databaseName");
  const connectedDatabase = String(identityRows[0]?.databaseName ?? "");
  if (!connectedDatabase || connectedDatabase !== process.env.DATABASE_CUTOVER_TARGET_DATABASE) {
    fail("Connected database does not match the configured authoritative external cutover target.");
  }
}

async function readClassifications() {
  const filePath = process.env.ONTARIO_TREATMENT_MODULE_CLASSIFICATIONS ?? DEFAULT_CLASSIFICATION_PATH;
  let raw;
  try { raw = await readFile(resolve(filePath), "utf8"); }
  catch (error) { fail(`Unable to read classification package ${filePath}: ${error instanceof Error ? error.message : String(error)}`); }
  let parsed;
  try { parsed = JSON.parse(raw); }
  catch { fail("Classification package is not valid JSON."); }
  if (parsed?.releaseKey !== RELEASE_KEY || parsed?.model !== CLASSIFIER_MODEL || !parsed?.banks || typeof parsed.banks !== "object") {
    fail("Classification package has an unexpected release key, model, or bank payload.");
  }
  const unexpectedBanks = Object.keys(parsed.banks).filter((bankKey) => !ONTARIO_TREATMENT_BANK_KEYS.includes(bankKey));
  if (unexpectedBanks.length) fail(`Classification package has unsupported banks: ${unexpectedBanks.join(", ")}.`);
  for (const bankKey of ONTARIO_TREATMENT_BANK_KEYS) {
    const bank = parsed.banks[bankKey];
    if (!bank || bank.status !== "complete" || !Array.isArray(bank.classifications)) {
      fail(`Classification package is incomplete for ${bankKey}.`);
    }
  }
  return {
    filePath: resolve(filePath),
    classificationsByBank: Object.fromEntries(ONTARIO_TREATMENT_BANK_KEYS.map((bankKey) => [bankKey, parsed.banks[bankKey].classifications])),
    classificationDigest: createHash("sha256").update(raw).digest("hex"),
  };
}

async function readLiveState(connection, bankKey, lock) {
  const suffix = lock ? " FOR UPDATE" : "";
  const [rows] = await connection.execute(
    `SELECT * FROM \`questions\` WHERE \`bankKey\`=? AND COALESCE(\`reviewStatus\`, 'approved') NOT IN ('in_review','rejected') ORDER BY \`questionNum\`${suffix}`,
    [bankKey],
  );
  const [metadataRows] = await connection.execute(
    `SELECT * FROM \`question_bank_meta\` WHERE \`bankKey\`=?${suffix}`,
    [bankKey],
  );
  if (metadataRows.length !== 1) fail(`Expected one ${bankKey} metadata row, found ${metadataRows.length}.`);
  return { bankKey, rows, metadata: metadataRows[0] };
}

async function readAllLiveStates(connection, lock) {
  const states = [];
  for (const bankKey of ONTARIO_TREATMENT_BANK_KEYS) states.push(await readLiveState(connection, bankKey, lock));
  return states;
}

function buildPlans(states, classificationsByBank) {
  const plans = states.map((state) => planOntarioTreatmentModuleRestoration({
    bankKey: state.bankKey,
    rows: state.rows,
    metadata: [state.metadata],
    classifications: classificationsByBank[state.bankKey],
  }));
  const errors = plans.flatMap((plan) => plan.ready ? [] : plan.errors.map((error) => `${plan.bankKey}: ${error}`));
  if (errors.length) fail(errors.join(" "));
  return plans;
}

function planDigest(plans, targetFingerprint, classificationDigest) {
  return digest({
    releaseKey: RELEASE_KEY,
    targetFingerprint,
    classificationDigest,
    plans: plans.map((plan) => ({
      bankKey: plan.bankKey,
      scopeDigest: plan.scopeDigest,
      modules: plan.modules,
      counts: plan.counts,
      metadata: plan.metadata,
    })),
  });
}

async function persistEvidence(name, value) {
  await mkdir(PRIVATE_ROOT, { recursive: true });
  const path = `${PRIVATE_ROOT}/${name}`;
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
  return path;
}

async function run() {
  const { filePath, classificationsByBank, classificationDigest } = await readClassifications();
  const connection = await mysql.createConnection(authoritativeProductionConnectionOptions());
  let committed = false;
  let commitAttempted = false;
  try {
    await assertAuthoritativeTarget(connection);
    await connection.beginTransaction();
    const states = await readAllLiveStates(connection, mode === "apply");
    const plans = buildPlans(states, classificationsByBank);
    if (mode === "apply" && plans.some(isOntarioTreatmentModuleRestored)) {
      fail("At least one target bank is already restored. A partial or duplicate multi-bank release is not permitted.");
    }
    const targetFingerprint = liveFingerprint(states);
    const exactPlanDigest = planDigest(plans, targetFingerprint, classificationDigest);
    const summary = {
      releaseKey: RELEASE_KEY,
      model: CLASSIFIER_MODEL,
      mode,
      classificationPath: filePath,
      classificationDigest,
      targetFingerprint,
      planDigest: exactPlanDigest,
      totalQuestionCount: plans.reduce((total, plan) => total + plan.questionCount, 0),
      totalQuestionChanges: plans.reduce((total, plan) => total + plan.questionChanges.length, 0),
      banks: plans.map((plan) => ({
        bankKey: plan.bankKey,
        questionCount: plan.questionCount,
        questionChanges: plan.questionChanges.length,
        modules: plan.modules,
        counts: plan.counts,
        lowConfidenceCount: plan.lowConfidence.length,
        metadata: plan.metadata,
      })),
    };
    console.log(JSON.stringify(summary, null, 2));

    if (mode === "plan") {
      await connection.rollback();
      await persistEvidence("ontario-treatment-module-restoration-plan.json", {
        capturedAtUtc: new Date().toISOString(),
        ...summary,
      });
      return;
    }

    if (process.env.CONFIRM_ONTARIO_TREATMENT_MODULE_RESTORATION !== exactPlanDigest) {
      fail("CONFIRM_ONTARIO_TREATMENT_MODULE_RESTORATION does not match the exact live plan digest.");
    }

    const beforeEvidencePath = await persistEvidence("ontario-treatment-module-restoration-before.json", {
      capturedAtUtc: new Date().toISOString(),
      releaseKey: RELEASE_KEY,
      targetFingerprint,
      planDigest: exactPlanDigest,
      states: states.map(({ bankKey, metadata, rows }) => ({
        bankKey,
        metadata: canonicalRow(metadata),
        questions: rows.map(canonicalRow),
      })),
    });

    for (const plan of plans) {
      const state = states.find((candidate) => candidate.bankKey === plan.bankKey);
      if (!state) fail(`Missing locked state for ${plan.bankKey}.`);
      for (const change of plan.questionChanges) {
        const before = state.rows.find((row) => Number(row.id) === change.id);
        if (!before) fail(`Missing locked question ${plan.bankKey}/${change.questionNum}.`);
        const [snapshot] = await connection.execute(
          "INSERT INTO `question_content_snapshots` (`releaseKey`,`bankKey`,`questionId`,`questionNum`,`sourceContentVersion`,`contentHash`,`payload`) VALUES (?,?,?,?,?,?,?)",
          [RELEASE_KEY, plan.bankKey, before.id, before.questionNum, Number(state.metadata.contentVersion ?? 1), sourceHash(before), JSON.stringify(canonicalRow(before))],
        );
        if (snapshot.affectedRows !== 1) fail(`Before-image capture failed for ${plan.bankKey}/${change.questionNum}.`);
        const [update] = await connection.execute(
          "UPDATE `questions` SET `module`=? WHERE `id`=? AND `bankKey`=? AND `questionNum`=? AND `module`=? AND `reviewStatus`=?",
          [change.afterModule, before.id, plan.bankKey, before.questionNum, change.beforeModule, before.reviewStatus],
        );
        if (update.affectedRows !== 1) fail(`Module update failed for ${plan.bankKey}/${change.questionNum}.`);
      }
      const [metadataUpdate] = await connection.execute(
        "UPDATE `question_bank_meta` SET `modules`=?, `totalQuestions`=?, `contentVersion`=`contentVersion`+1 WHERE `bankKey`=? AND `modules`=? AND `totalQuestions`=? AND `contentVersion`=?",
        [JSON.stringify(plan.modules), plan.metadata.afterTotalQuestions, plan.bankKey, state.metadata.modules, Number(state.metadata.totalQuestions), Number(state.metadata.contentVersion ?? 1)],
      );
      if (metadataUpdate.affectedRows !== 1) fail(`${plan.bankKey} metadata update did not affect exactly one row.`);
    }

    const postStates = await readAllLiveStates(connection, true);
    const postPlans = buildPlans(postStates, classificationsByBank);
    const expectedSnapshotCount = plans.reduce((total, plan) => total + plan.questionChanges.length, 0);
    for (const postPlan of postPlans) {
      const priorPlan = plans.find((plan) => plan.bankKey === postPlan.bankKey);
      if (!priorPlan) fail(`Missing pre-write plan for ${postPlan.bankKey}.`);
      if (!isOntarioTreatmentModuleRestored(postPlan)) fail(`${postPlan.bankKey} did not reach a completed restoration state.`);
      if (JSON.stringify(postPlan.modules) !== JSON.stringify(priorPlan.modules)) fail(`${postPlan.bankKey} post-write module menu mismatch.`);
      if (postPlan.metadata.beforeContentVersion !== priorPlan.metadata.afterContentVersion) fail(`${postPlan.bankKey} post-write content version mismatch.`);
    }
    const beforeById = new Map(states.flatMap(({ rows }) => rows.map((row) => [Number(row.id), row])));
    for (const { rows } of postStates) {
      for (const postRow of rows) {
        const before = beforeById.get(Number(postRow.id));
        if (!before) fail(`Post-write question ${postRow.questionNum} was not present before release.`);
        if (preservedRowHash(postRow) !== preservedRowHash(before)) fail(`Unexpected non-module mutation for question ${postRow.bankKey}/${postRow.questionNum}.`);
      }
    }
    const [snapshotCountRows] = await connection.execute(
      "SELECT COUNT(*) AS count FROM `question_content_snapshots` WHERE `releaseKey`=?",
      [RELEASE_KEY],
    );
    if (Number(snapshotCountRows[0]?.count) !== expectedSnapshotCount) fail("Before-image snapshot count mismatch.");

    commitAttempted = true;
    await connection.commit();
    committed = true;
    const resultPath = await persistEvidence("ontario-treatment-module-restoration-apply.json", {
      capturedAtUtc: new Date().toISOString(),
      beforeEvidencePath,
      ...summary,
      applied: true,
      snapshotCount: expectedSnapshotCount,
      postMetadata: postStates.map(({ bankKey, metadata }) => ({ bankKey, metadata: canonicalRow(metadata) })),
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
