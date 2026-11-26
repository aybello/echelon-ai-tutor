#!/usr/bin/env node
/**
 * Owner-authorized publication of the validated 212-question Class 3 Water
 * Distribution remediation package. The command plans by default. --apply
 * updates only the pinned original-question rows after a fresh, target-bound
 * preflight and scoped recovery snapshot have been verified.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  APPROVED_AT,
  authoritativeProductionConnectionOptions,
  beginReadOnlyTransaction,
  REVIEWER,
  verifyWriteAssumptions,
} from "./releaseClass3ApprovedCandidates.mjs";
import { HIDDEN_LEARNER_REVIEW_STATUSES, isLearnerVisibleReviewStatus } from "../../shared/questionVisibility.mjs";

export const BANK = "class3-water-dist";
export const RELEASE = "class3-gpt-remediation-2026-09-23";
export const ORIGINAL_COUNT = 571;
export const CANDIDATE_START = 2001;
export const CANDIDATE_END = 2250;
export const CANDIDATE_COUNT = 250;
export const STORED_COUNT = ORIGINAL_COUNT + CANDIDATE_COUNT;
export const REPAIR_COUNT = 212;
export const LEARNER_VISIBLE_REPAIR_STATUS = "unreviewed";
export const BACKUP_EVIDENCE_MAX_AGE_MS = 60 * 60 * 1000;
export const REMEDIATION_SOURCE_SHA256 = "64bec4caee4f352dd2b2ee602f566e7b9e3da3951267075a605c3627f9202401";
export const SOURCE_PACK_SHA256 = "02b789dc07e950b3860d2f0cf3053e962fd07d4bc88a05c339e1832298265fed";

const REPAIRED_SOURCE_PATH = new URL("../../content/class3-water-dist/repaired-212-2026-09-23.json", import.meta.url);
const SOURCE_PACK_PATH = new URL("../../content/class3-water-dist/original-453-remediation-source-pack-2026-09-23.json", import.meta.url);
const CANDIDATE_SOURCE_PATH = new URL("../../content/class3-water-dist/candidate-250-2026-09-22.json", import.meta.url);
const QUESTION_FIELDS = [
  "bankKey", "questionNum", "module", "difficulty", "question", "options", "correctIndex",
  "explanation", "steps", "tip", "isCalc", "topic", "cognitiveLevel", "sourceTitle",
  "sourceReference", "sourceUrl", "blueprintObjective", "reviewStatus", "reviewedBy", "reviewedAt",
];
const sha256 = value => createHash("sha256").update(typeof value === "string" || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest("hex");
const normalizedStem = value => String(value ?? "").normalize("NFKC").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const iso = value => value instanceof Date ? value.toISOString() : value ?? null;

function fail(message) {
  throw new Error(`Class 3 GPT remediation release blocked: ${message}`);
}

function parseOptions(value) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      fail("question options are not valid JSON");
    }
  }
  return Array.isArray(value) ? [...value] : value;
}

function databaseValue(value) {
  if (value === null || value === undefined) return null;
  return Array.isArray(value) || typeof value === "object" ? JSON.stringify(value) : value;
}

export function questionPayload(row) {
  if (!row) return null;
  const payload = {};
  for (const field of QUESTION_FIELDS) payload[field] = field === "options" ? parseOptions(row.options) : iso(row[field]);
  return payload;
}

export function fullRowPayload(row) {
  if (!row) return null;
  const payload = {};
  for (const field of Object.keys(row).sort()) payload[field] = field === "options" ? parseOptions(row.options) : iso(row[field]);
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
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    fail(`${label} must be an ISO-8601 time with timezone`);
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || parsed > now || now - parsed > BACKUP_EVIDENCE_MAX_AGE_MS) fail(`${label} is future-dated or older than one hour`);
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

function readSourcePack() {
  const raw = readFileSync(SOURCE_PACK_PATH, "utf8");
  if (sha256(raw) !== SOURCE_PACK_SHA256) fail("controlled source pack digest does not match the reviewed artifact");
  const pack = JSON.parse(raw);
  if (pack?.bankKey !== BANK || !Array.isArray(pack.sources)) fail("controlled source pack is invalid");
  const entries = pack.sources.filter(source => source.key !== "WPI_CLASS3_TOPIC_MAP");
  const sourceByTitleUrl = new Map(entries.map(source => [`${source.title}\u0000${source.url}`, source]));
  if (sourceByTitleUrl.size !== entries.length || sourceByTitleUrl.size < 8) fail("controlled source pack has invalid source mappings");
  return { pack, sourceByTitleUrl };
}

export function readTrustedRepairs() {
  const raw = readFileSync(REPAIRED_SOURCE_PATH, "utf8");
  if (sha256(raw) !== REMEDIATION_SOURCE_SHA256) fail("remediation package digest does not match the validated artifact");
  const repairs = JSON.parse(raw);
  if (!Array.isArray(repairs) || repairs.length !== REPAIR_COUNT) fail(`remediation package must contain exactly ${REPAIR_COUNT} items`);
  const { sourceByTitleUrl } = readSourcePack();
  const byNumber = new Map();
  for (const repair of repairs) {
    const number = Number(repair.questionNum);
    if (!Number.isInteger(number) || number < 1 || number > ORIGINAL_COUNT || byNumber.has(number)) fail("remediation package has invalid or duplicate original question numbers");
    const source = sourceByTitleUrl.get(`${repair.sourceTitle}\u0000${repair.sourceUrl}`);
    if (!source) fail(`remediation question ${number} is not mapped to a controlled source`);
    if (repair.bankKey !== BANK || repair.reviewStatus !== "in_review" || repair.reviewedBy !== null || repair.reviewedAt !== null) fail(`remediation question ${number} has invalid governance fields`);
    const options = parseOptions(repair.options);
    if (!repair.question?.trim() || !repair.explanation?.trim() || !repair.sourceReference?.trim() || !repair.blueprintObjective?.trim() || options.length !== 4 || new Set(options.map(option => String(option).trim().toLowerCase())).size !== 4 || !Number.isInteger(repair.correctIndex) || repair.correctIndex < 0 || repair.correctIndex > 3) {
      fail(`remediation question ${number} has invalid educational content`);
    }
    if (repair.isCalc === "yes" && (!Array.isArray(repair.steps) || repair.steps.length < 2)) fail(`calculation remediation question ${number} lacks checked steps`);
    if (repair.isCalc === "no" && repair.steps !== null) fail(`non-calculation remediation question ${number} has unexpected steps`);
    const combined = `${repair.question}\n${options.join("\n")}\n${repair.explanation}`;
    if (/O\.\s*Reg\.\s*170\/03/i.test(combined)) fail(`remediation question ${number} contains an unsupported O. Reg. 170/03 reference`);
    byNumber.set(number, { ...repair, options });
  }
  if (byNumber.size !== REPAIR_COUNT) fail("remediation package target count is invalid");
  return byNumber;
}

function readApprovedCandidatePayloads() {
  const candidates = JSON.parse(readFileSync(CANDIDATE_SOURCE_PATH, "utf8"));
  if (!Array.isArray(candidates) || candidates.length !== CANDIDATE_COUNT) fail("approved candidate source is invalid");
  const byNumber = new Map(candidates.map(candidate => [Number(candidate.questionNum), {
    ...candidate,
    options: parseOptions(candidate.options),
    reviewStatus: "approved",
    reviewedBy: REVIEWER,
    reviewedAt: APPROVED_AT,
  }]));
  if (byNumber.size !== CANDIDATE_COUNT || [...byNumber.keys()].some(number => number < CANDIDATE_START || number > CANDIDATE_END)) fail("approved candidate target set is invalid");
  return byNumber;
}

export function assertLiveShape(rows, metadata) {
  if (!Array.isArray(rows) || rows.length !== STORED_COUNT) fail(`expected ${STORED_COUNT} stored Class 3 rows`);
  if (!metadata || metadata.bankKey !== BANK || Number(metadata.totalQuestions) !== STORED_COUNT) fail(`Class 3 metadata must remain at ${STORED_COUNT} stored questions before this release`);
  nonNegativeSafeInteger(metadata.contentVersion, "Class 3 metadata contentVersion");
  const byNumber = new Map();
  const ids = new Set();
  for (const row of rows) {
    const number = Number(row.questionNum);
    if (row.bankKey !== BANK || !Number.isInteger(number) || byNumber.has(number)) fail("duplicate or invalid Class 3 question number");
    if (!Number.isSafeInteger(Number(row.id)) || Number(row.id) <= 0 || ids.has(Number(row.id))) fail("duplicate or invalid Class 3 question id");
    if (typeof row.reviewStatus !== "string" || !isLearnerVisibleReviewStatus(row.reviewStatus)) fail(`Class 3 question ${number} is not learner-visible before remediation`);
    byNumber.set(number, row);
    ids.add(Number(row.id));
  }
  for (let number = 1; number <= ORIGINAL_COUNT; number += 1) if (!byNumber.has(number)) fail(`missing original Class 3 question ${number}`);
  for (let number = CANDIDATE_START; number <= CANDIDATE_END; number += 1) if (!byNumber.has(number)) fail(`missing published Class 3 candidate ${number}`);
  const allowedNumbers = new Set([...Array.from({ length: ORIGINAL_COUNT }, (_, index) => index + 1), ...Array.from({ length: CANDIDATE_COUNT }, (_, index) => CANDIDATE_START + index)]);
  if ([...byNumber.keys()].some(number => !allowedNumbers.has(number))) fail("unexpected Class 3 question number is present");
  const candidates = rows.filter(row => Number(row.questionNum) >= CANDIDATE_START && Number(row.questionNum) <= CANDIDATE_END);
  if (candidates.length !== CANDIDATE_COUNT || candidates.some(row => row.reviewStatus !== "approved")) fail("the published candidate range is not intact");
  const approvedCandidates = readApprovedCandidatePayloads();
  for (const candidate of candidates) {
    const expected = approvedCandidates.get(Number(candidate.questionNum));
    if (!expected || canonicalHash(questionPayload(candidate)) !== canonicalHash(questionPayload(expected))) fail(`published candidate ${candidate.questionNum} differs from its approved release payload`);
  }
  return byNumber;
}

export function buildBaselineManifest(rows, metadata, targetFingerprint) {
  const byNumber = assertLiveShape(rows, metadata);
  const repairs = readTrustedRepairs();
  const targets = [...repairs.keys()].sort((left, right) => left - right).map(questionNum => {
    const row = byNumber.get(questionNum);
    if (!row) fail(`missing remediation target ${questionNum}`);
    return { questionNum, id: Number(row.id), payloadHash: sha256(fullRowPayload(row)) };
  });
  return {
    release: RELEASE,
    bankKey: BANK,
    targetFingerprint,
    storedCount: STORED_COUNT,
    contentVersion: nonNegativeSafeInteger(metadata.contentVersion, "Class 3 metadata contentVersion"),
    remediationSourceSha256: REMEDIATION_SOURCE_SHA256,
    sourcePackSha256: SOURCE_PACK_SHA256,
    targets,
  };
}

function assertBaselineManifest(manifest, rows, metadata, targetFingerprint, repairs) {
  if (!manifest || manifest.release !== RELEASE || manifest.bankKey !== BANK || manifest.targetFingerprint !== targetFingerprint || Number(manifest.storedCount) !== STORED_COUNT || nonNegativeSafeInteger(manifest.contentVersion, "baseline manifest contentVersion") !== Number(metadata.contentVersion) || manifest.remediationSourceSha256 !== REMEDIATION_SOURCE_SHA256 || manifest.sourcePackSha256 !== SOURCE_PACK_SHA256 || !Array.isArray(manifest.targets) || manifest.targets.length !== repairs.size) {
    fail("full before-image baseline manifest is invalid or does not match this live plan");
  }
  const byNumber = new Map(manifest.targets.map(target => [Number(target.questionNum), target]));
  if (byNumber.size !== repairs.size || [...repairs.keys()].some(number => !byNumber.has(number))) fail("baseline manifest target set is invalid");
  const rowsByNumber = new Map(rows.map(row => [Number(row.questionNum), row]));
  for (const [number] of repairs) {
    const row = rowsByNumber.get(number);
    const baseline = byNumber.get(number);
    if (!row || !baseline || Number(baseline.id) !== Number(row.id) || baseline.payloadHash !== sha256(fullRowPayload(row))) fail(`live original question ${number} differs from its full before-image baseline`);
  }
}

function validateReplacement(item, existingStems) {
  const stem = normalizedStem(item.question);
  if (!stem || existingStems.has(stem)) fail(`replacement question ${item.questionNum} duplicates an unchanged stem`);
  existingStems.add(stem);
}

export function buildPlan(rows, metadata, targetFingerprint, baselineManifest) {
  if (!targetFingerprint?.trim()) fail("target fingerprint is required for a live plan");
  const byNumber = assertLiveShape(rows, metadata);
  if (Number(metadata.contentVersion) >= Number.MAX_SAFE_INTEGER) fail("Class 3 metadata contentVersion cannot be safely incremented");
  const repairs = readTrustedRepairs();
  assertBaselineManifest(baselineManifest, rows, metadata, targetFingerprint, repairs);
  const existingStems = new Set(rows.filter(row => Number(row.questionNum) >= 1 && Number(row.questionNum) <= ORIGINAL_COUNT && !repairs.has(Number(row.questionNum))).map(row => normalizedStem(row.question)));
  const changes = [];
  for (const [questionNum, repair] of [...repairs.entries()].sort((left, right) => left[0] - right[0])) {
    const before = byNumber.get(questionNum);
    validateReplacement(repair, existingStems);
    const after = {
      ...repair,
      id: before.id,
      bankKey: before.bankKey,
      questionNum: before.questionNum,
      reviewStatus: LEARNER_VISIBLE_REPAIR_STATUS,
      reviewedBy: null,
      reviewedAt: null,
    };
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
    remediationSourceSha256: REMEDIATION_SOURCE_SHA256,
    sourcePackSha256: SOURCE_PACK_SHA256,
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
    if (!expected || canonicalHash(snapshotPayload(row)) !== canonicalHash(expected)) fail(`post-write preservation mismatch at non-target question ${row.questionNum}`);
  }
}

export function assertSnapshots(snapshots, changes, sourceContentVersion) {
  if (snapshots.length !== changes.length) fail(`post-write before-image count does not equal ${changes.length}`);
  const expectedById = new Map(changes.map(({ before }) => [Number(before.id), before]));
  const seen = new Set();
  for (const snapshot of snapshots) {
    const before = expectedById.get(Number(snapshot.questionId));
    if (!before || seen.has(Number(snapshot.questionId))) fail("post-write before-image target set is invalid");
    seen.add(Number(snapshot.questionId));
    let payload;
    try {
      payload = typeof snapshot.payload === "string" || Buffer.isBuffer(snapshot.payload) ? JSON.parse(Buffer.isBuffer(snapshot.payload) ? snapshot.payload.toString("utf8") : snapshot.payload) : snapshot.payload;
    } catch {
      fail(`post-write before-image payload is not valid JSON at question ${before.questionNum}`);
    }
    if (Number(snapshot.questionNum) !== Number(before.questionNum) || Number(snapshot.sourceContentVersion) !== Number(sourceContentVersion) || snapshot.contentHash !== sha256(fullRowPayload(before)) || canonicalHash(payload) !== canonicalHash(fullRowPayload(before))) {
      fail(`post-write before-image mismatch at question ${before.questionNum}`);
    }
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
    after.module, after.difficulty, after.question, JSON.stringify(parseOptions(after.options)), after.correctIndex,
    after.explanation, databaseValue(after.steps), after.tip, after.isCalc, after.topic, after.cognitiveLevel,
    after.sourceTitle, after.sourceReference, after.sourceUrl, after.blueprintObjective, after.reviewStatus,
  ];
}

async function run() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const baselineIndex = args.indexOf("--baseline-manifest");
  const baselinePath = baselineIndex === -1 ? null : args[baselineIndex + 1];
  if (!baselinePath || baselinePath.startsWith("--")) fail("pass --baseline-manifest path");
  const baselineManifest = JSON.parse(readFileSync(baselinePath, "utf8"));
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
    const plan = buildPlan(rows, metadata, targetFingerprint, baselineManifest);
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
    if (process.env.CONFIRM_CLASS3_GPT_REMEDIATION_RELEASE !== plan.planDigest) fail("confirmation digest does not match this exact live plan");
    parsePreflightEvidence(process.env.CLASS3_GPT_REMEDIATION_PREFLIGHT, plan.planDigest, plan.targetFingerprint);
    parseBackupEvidence(process.env.CLASS3_GPT_REMEDIATION_BACKUP_EVIDENCE, plan.planDigest, plan.targetFingerprint);

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
    if (postMetadataRows.length !== 1 || Number(postMetadataRows[0].totalQuestions) !== STORED_COUNT || Number(postMetadataRows[0].contentVersion) !== plan.expectedContentVersion) fail("post-write Class 3 metadata verification failed");
    assertLiveShape(postRows, postMetadataRows[0]);
    const postByNumber = new Map(postRows.map(row => [Number(row.questionNum), row]));
    for (const { before, after } of plan.changes) {
      const post = postByNumber.get(Number(after.questionNum));
      if (!post || Number(post.id) !== Number(before.id) || canonicalHash(questionPayload(post)) !== canonicalHash(questionPayload(after))) fail(`post-write remediation mismatch for question ${after.questionNum}`);
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
    console.log(`Committed ${REPAIR_COUNT} Class 3 GPT remediation repairs. Learner-visible inventory remains ${STORED_COUNT}.`);
  } catch (error) {
    if (!commitAttempted) await connection.rollback();
    if (commitAttempted && !committed) {
      primaryError = new Error(`Class 3 GPT remediation commit outcome is uncertain. Do not retry. Run read-only reconciliation before any further write. Original error: ${error instanceof Error ? error.message : String(error)}`);
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
