#!/usr/bin/env node
/**
 * Owner-authorized publication of 118 pinned Class 3 Water Distribution original-bank repairs.
 * Plans by default. Apply changes only those rows and one metadata version, leaving the 250
 * approved additions intact and all 821 questions learner-visible.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  BANK as CLASS3_BANK,
  CORRECTED_LEGACY_FIXES,
  TARGETS,
  fingerprint,
  optionsOf,
} from "./class3WaterDistributionRepair.mjs";
import {
  authoritativeProductionConnectionOptions,
  beginReadOnlyTransaction,
  APPROVED_AT,
  REVIEWER,
  verifyWriteAssumptions,
} from "./releaseClass3ApprovedCandidates.mjs";
import {
  HIDDEN_LEARNER_REVIEW_STATUSES,
  isLearnerVisibleReviewStatus,
} from "../../shared/questionVisibility.mjs";

export const BANK = CLASS3_BANK;
export const RELEASE = "class3-original-repairs-2026-09-22";
export const ORIGINAL_COUNT = 571;
export const CANDIDATE_START = 2001;
export const CANDIDATE_END = 2250;
export const CANDIDATE_COUNT = 250;
export const STORED_COUNT = ORIGINAL_COUNT + CANDIDATE_COUNT;
export const REPAIR_COUNT = TARGETS.length;
export const LEARNER_VISIBLE_REPAIR_STATUS = "unreviewed";
export const BACKUP_EVIDENCE_MAX_AGE_MS = 60 * 60 * 1000;
export const HISTORIC_REPAIR_RELEASE = "class3-water-dist-repair-2026-09-22";
export const HISTORIC_REPAIR_MANIFEST_SHA256 = "c183d01e88104beda637c1c347765ebc13fb272acc952ff486244b16d13f3a84";

const QUESTION_FIELDS = [
  "bankKey", "questionNum", "module", "difficulty", "question", "options", "correctIndex",
  "explanation", "steps", "tip", "isCalc", "topic", "cognitiveLevel", "sourceTitle",
  "sourceReference", "sourceUrl", "blueprintObjective", "reviewStatus", "reviewedBy", "reviewedAt",
];
const sha256 = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const normalizedStem = value => value.normalize("NFKC").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const REPAIRED_SOURCE_PATH = new URL("../../content/class3-water-dist/repaired-116-2026-09-22.json", import.meta.url);
const CANDIDATE_SOURCE_PATH = new URL("../../content/class3-water-dist/candidate-250-2026-09-22.json", import.meta.url);

function fail(message) {
  throw new Error(`Class 3 original-repair release blocked: ${message}`);
}

function iso(value) {
  return value instanceof Date ? value.toISOString() : value ?? null;
}

export function questionPayload(row) {
  if (!row) return null;
  const payload = {};
  for (const field of QUESTION_FIELDS) payload[field] = field === "options" ? optionsOf(row) : iso(row[field]);
  return payload;
}

export function fullRowPayload(row) {
  if (!row) return null;
  const payload = {};
  for (const field of Object.keys(row).sort()) payload[field] = field === "options" ? optionsOf(row) : iso(row[field]);
  return payload;
}

function snapshotPayload(row) {
  return { id: Number(row.id), content: fullRowPayload(row) };
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalize(value[key])]));
  return value;
}

function canonicalHash(value) {
  return sha256(canonicalize(value));
}

function nonNegativeSafeInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) fail(`${label} must be a non-negative safe integer`);
  return number;
}

function validTimestamp(value, now, label) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
  ) {
    fail(`${label} must be an ISO-8601 time with timezone`);
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || parsed > now || now - parsed > BACKUP_EVIDENCE_MAX_AGE_MS) {
    fail(`${label} is future-dated or older than one hour`);
  }
  return new Date(parsed).toISOString();
}

export function parsePreflightEvidence(raw, planDigest, targetFingerprint, now = Date.now()) {
  if (!raw?.trim()) fail("fresh target-bound live preflight evidence is required");
  let evidence;
  try { evidence = JSON.parse(raw); } catch { fail("preflight evidence must be JSON"); }
  if (evidence?.release !== RELEASE || evidence?.planDigest !== planDigest || evidence?.targetFingerprint !== targetFingerprint) {
    fail("preflight evidence is not bound to this exact production plan and target");
  }
  return { plannedAt: validTimestamp(evidence.plannedAt, now, "preflight evidence timestamp") };
}

export function parseBackupEvidence(raw, planDigest, targetFingerprint, now = Date.now()) {
  if (!raw?.trim()) fail("current scoped recovery evidence is required");
  let evidence;
  try { evidence = JSON.parse(raw); } catch { fail("recovery evidence must be JSON"); }
  if (evidence?.release !== RELEASE || evidence?.planDigest !== planDigest || evidence?.targetFingerprint !== targetFingerprint) {
    fail("recovery evidence is not bound to this exact production plan and target");
  }
  if (typeof evidence.backupId !== "string" || !evidence.backupId.trim()) fail("recovery evidence is missing its verified backup identifier");
  return {
    backupId: evidence.backupId.trim(),
    backedUpAt: validTimestamp(evidence.backedUpAt, now, "recovery evidence timestamp"),
  };
}

export async function targetFingerprintFor(connection) {
  const [rows] = await connection.execute("SELECT DATABASE() AS databaseName, @@server_uuid AS serverUuid");
  const identity = rows[0];
  if (!identity?.databaseName || !identity?.serverUuid) fail("database identity is unavailable for a target-bound plan");
  return sha256({ databaseName: identity.databaseName, serverUuid: identity.serverUuid, release: RELEASE });
}

function assertHistoricManifest(manifest) {
  if (
    !manifest || manifest.release !== HISTORIC_REPAIR_RELEASE || manifest.bankKey !== BANK ||
    manifest.trustedDigest !== HISTORIC_REPAIR_MANIFEST_SHA256 ||
    !Array.isArray(manifest.targets) || manifest.targets.length !== REPAIR_COUNT
  ) {
    fail("historic repair manifest is invalid");
  }
  const numbers = manifest.targets.map(item => Number(item.questionNum));
  if (new Set(numbers).size !== REPAIR_COUNT || JSON.stringify([...numbers].sort((a, b) => a - b)) !== JSON.stringify(TARGETS)) {
    fail("historic repair manifest target set is invalid");
  }
  return manifest;
}

export function readTrustedHistoricManifest(path) {
  const raw = readFileSync(path, "utf8");
  if (createHash("sha256").update(raw).digest("hex") !== HISTORIC_REPAIR_MANIFEST_SHA256) {
    fail("historic repair manifest digest does not match the reviewed immutable artifact");
  }
  return { ...JSON.parse(raw), trustedDigest: HISTORIC_REPAIR_MANIFEST_SHA256 };
}

function readApprovedCandidatePayloads() {
  const candidates = JSON.parse(readFileSync(CANDIDATE_SOURCE_PATH, "utf8"));
  if (!Array.isArray(candidates) || candidates.length !== CANDIDATE_COUNT) fail("approved candidate source is invalid");
  const byNumber = new Map(candidates.map(candidate => [Number(candidate.questionNum), {
    ...candidate,
    options: optionsOf(candidate),
    reviewStatus: "approved",
    reviewedBy: REVIEWER,
    reviewedAt: APPROVED_AT,
  }]));
  if (byNumber.size !== CANDIDATE_COUNT || [...byNumber.keys()].some(number => number < CANDIDATE_START || number > CANDIDATE_END)) {
    fail("approved candidate source target set is invalid");
  }
  return byNumber;
}

function assertLiveShape(rows, metadata) {
  if (!Array.isArray(rows) || rows.length !== STORED_COUNT) fail(`expected ${STORED_COUNT} stored Class 3 rows`);
  if (!metadata || metadata.bankKey !== BANK || Number(metadata.totalQuestions) !== STORED_COUNT) {
    fail(`Class 3 metadata must remain at ${STORED_COUNT} stored questions before this release`);
  }
  nonNegativeSafeInteger(metadata.contentVersion, "Class 3 metadata contentVersion");
  const byNumber = new Map();
  const ids = new Set();
  for (const row of rows) {
    const number = Number(row.questionNum);
    if (row.bankKey !== BANK || !Number.isInteger(number) || byNumber.has(number)) fail("duplicate or invalid Class 3 question number");
    if (!Number.isSafeInteger(Number(row.id)) || Number(row.id) <= 0 || ids.has(Number(row.id))) fail("duplicate or invalid Class 3 question id");
    if (typeof row.reviewStatus !== "string") fail(`Class 3 question ${number} has no review status`);
    byNumber.set(number, row);
    ids.add(Number(row.id));
  }
  for (let number = 1; number <= ORIGINAL_COUNT; number += 1) if (!byNumber.has(number)) fail(`missing original Class 3 question ${number}`);
  for (let number = CANDIDATE_START; number <= CANDIDATE_END; number += 1) if (!byNumber.has(number)) fail(`missing published Class 3 candidate ${number}`);
  const allowedNumbers = new Set([
    ...Array.from({ length: ORIGINAL_COUNT }, (_, index) => index + 1),
    ...Array.from({ length: CANDIDATE_COUNT }, (_, index) => CANDIDATE_START + index),
  ]);
  if ([...byNumber.keys()].some(number => !allowedNumbers.has(number))) fail("unexpected Class 3 question number is present");
  const visible = rows.filter(row => isLearnerVisibleReviewStatus(row.reviewStatus)).length;
  if (visible !== STORED_COUNT) fail(`expected ${STORED_COUNT} learner-visible questions before this release, found ${visible}`);
  const candidates = rows.filter(row => Number(row.questionNum) >= CANDIDATE_START && Number(row.questionNum) <= CANDIDATE_END);
  if (candidates.length !== CANDIDATE_COUNT || candidates.some(row => row.reviewStatus !== "approved")) {
    fail("the already-approved candidate range is not intact");
  }
  const approvedCandidates = readApprovedCandidatePayloads();
  for (const candidate of candidates) {
    const expected = approvedCandidates.get(Number(candidate.questionNum));
    if (!expected || canonicalHash(questionPayload(candidate)) !== canonicalHash(questionPayload(expected))) {
      fail(`published candidate ${candidate.questionNum} differs from its approved release payload`);
    }
  }
  return byNumber;
}

export function buildBaselineManifest(rows, metadata, targetFingerprint, historicManifest) {
  const byNumber = assertLiveShape(rows, metadata);
  assertHistoricManifest(historicManifest);
  const targets = TARGETS.map(questionNum => {
    const row = byNumber.get(questionNum);
    const historical = historicManifest.targets.find(item => Number(item.questionNum) === questionNum);
    if (!row || !historical || Number(row.id) !== Number(historical.id) || fingerprint(row) !== historical.fingerprint) {
      fail(`live original question ${questionNum} differs from the pinned historical repair baseline`);
    }
    return { questionNum, id: Number(row.id), payloadHash: sha256(fullRowPayload(row)) };
  });
  return {
    release: RELEASE,
    bankKey: BANK,
    targetFingerprint,
    storedCount: STORED_COUNT,
    contentVersion: nonNegativeSafeInteger(metadata.contentVersion, "Class 3 metadata contentVersion"),
    targets,
  };
}

function assertBaselineManifest(baselineManifest, rows, metadata, targetFingerprint) {
  if (
    !baselineManifest || baselineManifest.release !== RELEASE || baselineManifest.bankKey !== BANK ||
    baselineManifest.targetFingerprint !== targetFingerprint || Number(baselineManifest.storedCount) !== STORED_COUNT ||
    nonNegativeSafeInteger(baselineManifest.contentVersion, "baseline manifest contentVersion") !== Number(metadata.contentVersion) ||
    !Array.isArray(baselineManifest.targets) || baselineManifest.targets.length !== REPAIR_COUNT
  ) {
    fail("full before-image baseline manifest is invalid or does not match this live plan");
  }
  const baselineByNumber = new Map(baselineManifest.targets.map(item => [Number(item.questionNum), item]));
  if (baselineByNumber.size !== REPAIR_COUNT || JSON.stringify([...baselineByNumber.keys()].sort((a, b) => a - b)) !== JSON.stringify(TARGETS)) {
    fail("full before-image baseline manifest target set is invalid");
  }
  const byNumber = new Map(rows.map(row => [Number(row.questionNum), row]));
  for (const questionNum of TARGETS) {
    const row = byNumber.get(questionNum);
    const pinned = baselineByNumber.get(questionNum);
    if (!row || !pinned || Number(pinned.id) !== Number(row.id) || pinned.payloadHash !== sha256(fullRowPayload(row))) {
      fail(`live original question ${questionNum} differs from the full before-image baseline manifest`);
    }
  }
  return baselineByNumber;
}

function validateReplacement(item, existingStems) {
  const options = optionsOf(item);
  const stem = normalizedStem(item.question);
  if (!stem || existingStems.has(stem)) fail(`replacement question ${item.questionNum} duplicates an unchanged stem`);
  if (item.reviewStatus !== "in_review") fail(`replacement question ${item.questionNum} is not the checked-in repair payload`);
  if (options.length !== 4 || new Set(options.map(option => option.trim().toLowerCase())).size !== 4 || options[item.correctIndex] === undefined) {
    fail(`replacement question ${item.questionNum} has invalid answer choices or key`);
  }
  if (!item.explanation?.trim() || !item.sourceTitle?.trim() || !item.sourceReference?.trim() || !item.sourceUrl?.startsWith("https://") || !item.blueprintObjective?.trim()) {
    fail(`replacement question ${item.questionNum} is missing content evidence`);
  }
  existingStems.add(stem);
}

function readReplacements() {
  const replacements = JSON.parse(readFileSync(REPAIRED_SOURCE_PATH, "utf8"));
  if (!Array.isArray(replacements) || replacements.length !== REPAIR_COUNT - Object.keys(CORRECTED_LEGACY_FIXES).length) {
    fail("repair source does not cover exactly 116 original rows");
  }
  const byNumber = new Map(replacements.map(item => [Number(item.questionNum), structuredClone(item)]));
  if (byNumber.size !== replacements.length) fail("repair source has duplicate question numbers");
  return byNumber;
}

function correctedPayload(existing, fix) {
  const next = { ...existing, options: optionsOf(existing) };
  if (fix.correctIndex !== undefined) next.correctIndex = fix.correctIndex;
  if (fix.question) next.question = fix.question;
  if (fix.answer) next.options[Number(existing.correctIndex)] = fix.answer;
  next.explanation = fix.explanation;
  next.steps = null;
  next.cognitiveLevel = "application";
  next.sourceTitle = "Independent arithmetic check; WPI 2025 Class III topic map";
  next.sourceReference = "Numerical derivation shown in the revised explanation; jurisdictional review pending.";
  next.sourceUrl = "https://gowpi.org/wp-content/uploads/2026/04/WaterDistribution-%E2%80%93-Class-3_mh-fin.pdf";
  next.blueprintObjective = "Distribution system calculation and operational analysis";
  return next;
}

export function buildPlan(rows, metadata, targetFingerprint, historicManifest, baselineManifest) {
  if (!targetFingerprint?.trim()) fail("target fingerprint is required for a live plan");
  const byNumber = assertLiveShape(rows, metadata);
  if (Number(metadata.contentVersion) >= Number.MAX_SAFE_INTEGER) fail("Class 3 metadata contentVersion cannot be safely incremented");
  const fullBaselineByNumber = assertBaselineManifest(baselineManifest, rows, metadata, targetFingerprint);
  const expectedBaseline = buildBaselineManifest(rows, metadata, targetFingerprint, historicManifest);
  for (const target of expectedBaseline.targets) {
    const fullBaseline = fullBaselineByNumber.get(target.questionNum);
    if (!fullBaseline || fullBaseline.id !== target.id || fullBaseline.payloadHash !== target.payloadHash) fail(`full baseline conflict at question ${target.questionNum}`);
  }
  const originalStems = new Set(
    rows
      .filter(row => Number(row.questionNum) >= 1 && Number(row.questionNum) <= ORIGINAL_COUNT && !TARGETS.includes(Number(row.questionNum)))
      .map(row => normalizedStem(row.question)),
  );
  const replacementsByNumber = readReplacements();
  const changes = [];
  for (const questionNum of TARGETS) {
    const before = byNumber.get(questionNum);
    let after;
    if (Object.hasOwn(CORRECTED_LEGACY_FIXES, questionNum)) {
      after = correctedPayload(before, CORRECTED_LEGACY_FIXES[questionNum]);
    } else {
      const replacement = replacementsByNumber.get(questionNum);
      if (!replacement) fail(`replacement source is missing question ${questionNum}`);
      validateReplacement(replacement, originalStems);
      after = { ...replacement, id: before.id, bankKey: before.bankKey, questionNum: before.questionNum };
    }
    after.reviewStatus = LEARNER_VISIBLE_REPAIR_STATUS;
    after.reviewedBy = null;
    after.reviewedAt = null;
    changes.push({ before, after });
  }
  const baseline = rows.map(snapshotPayload).sort((left, right) => left.id - right.id);
  const planDigest = sha256({
    release: RELEASE,
    targetFingerprint,
    baseline: {
      metadata: { bankKey: metadata.bankKey, totalQuestions: Number(metadata.totalQuestions), contentVersion: Number(metadata.contentVersion) },
      rows: baseline,
    },
    fullTargetBaseline: baselineManifest.targets,
    repairs: changes.map(change => ({ before: snapshotPayload(change.before), after: questionPayload(change.after) })),
  });
  return {
    changes,
    baseline,
    planDigest,
    targetFingerprint,
    storedCount: STORED_COUNT,
    learnerVisibleCount: STORED_COUNT,
    expectedContentVersion: Number(metadata.contentVersion) + 1,
  };
}

export function assertUnchangedRowsPreserved(postRows, baseline, targetIdentities) {
  const baselineById = new Map(baseline.map(row => [row.id, row]));
  const targetKeys = new Set(targetIdentities.map(target => `${Number(target.id)}:${Number(target.questionNum)}`));
  if (postRows.length !== STORED_COUNT) fail("post-write stored inventory changed");
  for (const row of postRows) {
    if (targetKeys.has(`${Number(row.id)}:${Number(row.questionNum)}`)) continue;
    const expected = baselineById.get(Number(row.id));
    if (!expected || JSON.stringify(snapshotPayload(row)) !== JSON.stringify(expected)) {
      fail(`post-write preservation mismatch at non-target question ${row.questionNum}`);
    }
  }
}

export function assertSnapshots(snapshots, changes, sourceContentVersion) {
  if (snapshots.length !== REPAIR_COUNT) fail("post-write before-image count does not equal 118");
  const expectedById = new Map(changes.map(({ before }) => [Number(before.id), before]));
  const seen = new Set();
  for (const snapshot of snapshots) {
    const before = expectedById.get(Number(snapshot.questionId));
    if (!before || seen.has(Number(snapshot.questionId))) fail("post-write before-image target set is invalid");
    seen.add(Number(snapshot.questionId));
    let payload;
    try {
      payload = typeof snapshot.payload === "string" || Buffer.isBuffer(snapshot.payload)
        ? JSON.parse(Buffer.isBuffer(snapshot.payload) ? snapshot.payload.toString("utf8") : snapshot.payload)
        : snapshot.payload;
    } catch {
      fail(`post-write before-image payload is not valid JSON at question ${before.questionNum}`);
    }
    if (
      Number(snapshot.questionNum) !== Number(before.questionNum) ||
      Number(snapshot.sourceContentVersion) !== Number(sourceContentVersion) ||
      snapshot.contentHash !== sha256(fullRowPayload(before)) ||
      canonicalHash(payload) !== canonicalHash(fullRowPayload(before))
    ) fail(`post-write before-image mismatch at question ${before.questionNum}`);
  }
}

export async function readLiveState(connection, lockForApply) {
  const lock = lockForApply ? " FOR UPDATE" : "";
  const [rows] = await connection.execute(`SELECT * FROM \`questions\` WHERE \`bankKey\`=? ORDER BY \`questionNum\`${lock}`, [BANK]);
  const [metadataRows] = await connection.execute(`SELECT * FROM \`question_bank_meta\` WHERE \`bankKey\`=?${lock}`, [BANK]);
  if (metadataRows.length !== 1) fail("expected exactly one Class 3 metadata row");
  return { rows, metadata: metadataRows[0] };
}

function updateValues(after) {
  return [
    after.module, after.difficulty, after.question, JSON.stringify(optionsOf(after)), after.correctIndex,
    after.explanation, after.steps, after.tip, after.isCalc, after.topic, after.cognitiveLevel,
    after.sourceTitle, after.sourceReference, after.sourceUrl, after.blueprintObjective,
    after.reviewStatus,
  ];
}

async function run() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const historicManifestPath = args[args.indexOf("--historic-manifest") + 1];
  const baselineManifestPath = args[args.indexOf("--baseline-manifest") + 1];
  if (!historicManifestPath || historicManifestPath.startsWith("--")) fail("pass --historic-manifest path");
  if (!baselineManifestPath || baselineManifestPath.startsWith("--")) fail("pass --baseline-manifest path");
  const historicManifest = readTrustedHistoricManifest(historicManifestPath);
  const baselineManifest = JSON.parse(readFileSync(baselineManifestPath, "utf8"));
  const mysql = await import("mysql2/promise");
  const connection = await mysql.createConnection(authoritativeProductionConnectionOptions());
  let commitAttempted = false;
  let committed = false;
  let primaryError = null;
  try {
    if (apply) await connection.beginTransaction();
    else await beginReadOnlyTransaction(connection);
    if (apply) await verifyWriteAssumptions(connection);
    const targetFingerprint = await targetFingerprintFor(connection);
    const { rows, metadata } = await readLiveState(connection, apply);
    const plan = buildPlan(rows, metadata, targetFingerprint, historicManifest, baselineManifest);
    console.log(JSON.stringify({
      mode: apply ? "apply-requested" : "live-plan",
      repairs: plan.changes.length,
      storedQuestions: plan.storedCount,
      learnerVisibleQuestions: plan.learnerVisibleCount,
      expectedContentVersion: plan.expectedContentVersion,
      targetFingerprint: plan.targetFingerprint,
      planDigest: plan.planDigest,
    }, null, 2));
    if (!apply) {
      await connection.rollback();
      return;
    }
    if (process.env.CONFIRM_CLASS3_ORIGINAL_REPAIR_RELEASE !== plan.planDigest) fail("confirmation digest does not match this exact live plan");
    parsePreflightEvidence(process.env.CLASS3_ORIGINAL_REPAIR_PREFLIGHT, plan.planDigest, plan.targetFingerprint);
    parseBackupEvidence(process.env.CLASS3_ORIGINAL_REPAIR_BACKUP_EVIDENCE, plan.planDigest, plan.targetFingerprint);

    for (const { before, after } of plan.changes) {
      const beforeImage = fullRowPayload(before);
      const [snapshot] = await connection.execute(
        "INSERT INTO `question_content_snapshots` (`releaseKey`,`bankKey`,`questionId`,`questionNum`,`sourceContentVersion`,`contentHash`,`payload`) VALUES (?,?,?,?,?,?,?)",
        [RELEASE, BANK, before.id, before.questionNum, Number(metadata.contentVersion), sha256(beforeImage), JSON.stringify(beforeImage)],
      );
      if (snapshot.affectedRows !== 1) fail(`before-image capture failed for question ${before.questionNum}`);
      const [result] = await connection.execute(
        "UPDATE `questions` SET `module`=?,`difficulty`=?,`question`=?,`options`=?,`correctIndex`=?,`explanation`=?,`steps`=?,`tip`=?,`isCalc`=?,`topic`=?,`cognitiveLevel`=?,`sourceTitle`=?,`sourceReference`=?,`sourceUrl`=?,`blueprintObjective`=?,`reviewStatus`=?,`reviewedBy`=NULL,`reviewedAt`=NULL WHERE `id`=? AND `bankKey`=? AND `questionNum`=?",
        [...updateValues(after), before.id, BANK, before.questionNum],
      );
      if (result.affectedRows !== 1) fail(`update failed for question ${before.questionNum}`);
    }
    const [metadataUpdate] = await connection.execute(
      "UPDATE `question_bank_meta` SET `contentVersion`=`contentVersion`+1 WHERE `bankKey`=? AND `totalQuestions`=? AND `contentVersion`=?",
      [BANK, STORED_COUNT, Number(metadata.contentVersion)],
    );
    if (metadataUpdate.affectedRows !== 1) fail("Class 3 metadata version update did not affect exactly one row");

    const [postRows] = await connection.execute("SELECT * FROM `questions` WHERE `bankKey`=? ORDER BY `questionNum` FOR UPDATE", [BANK]);
    const [postMetadataRows] = await connection.execute("SELECT * FROM `question_bank_meta` WHERE `bankKey`=? FOR UPDATE", [BANK]);
    if (postMetadataRows.length !== 1 || Number(postMetadataRows[0].totalQuestions) !== STORED_COUNT || Number(postMetadataRows[0].contentVersion) !== plan.expectedContentVersion) {
      fail("post-write Class 3 metadata verification failed");
    }
    assertLiveShape(postRows, postMetadataRows[0]);
    const postByNumber = new Map(postRows.map(row => [Number(row.questionNum), row]));
    for (const { before, after } of plan.changes) {
      const post = postByNumber.get(Number(after.questionNum));
      if (!post || Number(post.id) !== Number(before.id) || JSON.stringify(questionPayload(post)) !== JSON.stringify(questionPayload(after))) {
        fail(`post-write repair mismatch for question ${after.questionNum}`);
      }
    }
    assertUnchangedRowsPreserved(postRows, plan.baseline, plan.changes.map(change => change.before));
    const [snapshotRows] = await connection.execute(
      "SELECT `questionId`,`questionNum`,`sourceContentVersion`,`contentHash`,`payload` FROM `question_content_snapshots` WHERE `releaseKey`=? AND `bankKey`=? ORDER BY `questionNum` FOR UPDATE",
      [RELEASE, BANK],
    );
    assertSnapshots(snapshotRows, plan.changes, metadata.contentVersion);
    const [visibleRows] = await connection.execute(
      `SELECT COUNT(*) AS count FROM \`questions\` WHERE \`bankKey\`=? AND \`reviewStatus\` NOT IN (${HIDDEN_LEARNER_REVIEW_STATUSES.map(() => "?").join(",")})`,
      [BANK, ...HIDDEN_LEARNER_REVIEW_STATUSES],
    );
    if (Number(visibleRows[0]?.count) !== STORED_COUNT) fail("post-write learner-visible inventory does not equal 821");
    commitAttempted = true;
    await connection.commit();
    committed = true;
    console.log("Committed 118 Class 3 original-question repairs. Learner-visible inventory remains 821.");
  } catch (error) {
    if (!commitAttempted) await connection.rollback();
    if (commitAttempted && !committed) {
      primaryError = new Error(`Class 3 original-repair commit outcome is uncertain. Do not retry. Run read-only reconciliation before any further write. Original error: ${error instanceof Error ? error.message : String(error)}`);
      throw primaryError;
    }
    primaryError = error;
    throw error;
  } finally {
    try {
      await connection.end();
    } catch (error) {
      if (primaryError) console.error("Database connection also failed to close after the primary release error. Preserve the primary error and reconcile read-only.");
      else if (!committed) throw error;
      else console.error("Database connection closed with an error after a confirmed commit. Reconcile read-only before another release.");
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await run();
