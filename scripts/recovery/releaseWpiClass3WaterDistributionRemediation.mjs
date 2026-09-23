#!/usr/bin/env node
/**
 * Owner-authorized release for the GPT-6 Sol-reviewed WPI Class III Water
 * Distribution repair package. Plans are read-only by default. Apply mode
 * requires fresh, target-bound preflight and recovery evidence.
 */
import { createHash, createHmac } from "node:crypto";
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import {
  authoritativeProductionConnectionOptions,
  beginReadOnlyTransaction,
  verifyWriteAssumptions,
} from "./releaseClass3ApprovedCandidates.mjs";
import { HIDDEN_LEARNER_REVIEW_STATUSES, isLearnerVisibleReviewStatus } from "../../shared/questionVisibility.mjs";

export const BANK = "wpi-class3-water-dist";
export const RELEASE = "wpi-class3-water-dist-gpt6-remediation-2026-09-23";
export const STORED_COUNT = 611;
export const REPAIR_COUNT = 209;
export const PRE_RELEASE_METADATA_TOTAL = 590;
export const LEARNER_VISIBLE_REPAIR_STATUS = "unreviewed";
export const BACKUP_EVIDENCE_MAX_AGE_MS = 60 * 60 * 1000;
export const EVIDENCE_ROOT = process.env.WPI_CLASS3_WATER_DIST_EVIDENCE_ROOT ?? (process.env.VITEST ? `${tmpdir()}/echelon-wpi-class3-release-evidence` : "/home/ubuntu/private/echelon-authoritative-recovery");
export const EVIDENCE_KEY_FILE_ENV = "WPI_CLASS3_WATER_DIST_EVIDENCE_KEY_FILE";
export const PACKAGE_SHA256 = "9a2d964640267794aca108ed1e6f45bea93d643800f6ecbefc5dde2cd932e0fb";
const PACKAGE_PATH = new URL("../../content/wpi-class3-water-dist/repaired-critical-high-209-2026-09-23.json", import.meta.url);
const QUESTION_FIELDS = [
  "bankKey", "questionNum", "module", "difficulty", "question", "options", "correctIndex",
  "explanation", "steps", "tip", "isCalc", "topic", "cognitiveLevel", "sourceTitle",
  "sourceReference", "sourceUrl", "blueprintObjective", "reviewStatus", "reviewedBy", "reviewedAt",
];
const TARGET_MUTABLE_FIELDS = new Set([
  "module", "difficulty", "question", "options", "correctIndex", "explanation", "steps", "tip", "isCalc", "topic", "cognitiveLevel",
  "sourceTitle", "sourceReference", "sourceUrl", "blueprintObjective", "reviewStatus", "reviewedBy", "reviewedAt",
]);
const sha256 = value => createHash("sha256").update(typeof value === "string" || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest("hex");
const normalisedStem = value => String(value ?? "").normalize("NFKC").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const iso = value => value instanceof Date ? value.toISOString() : value ?? null;

function fail(message) { throw new Error(`WPI Class III Water Distribution remediation release blocked: ${message}`); }
function parseOptions(value) {
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch { fail("question options are not valid JSON"); }
  }
  return Array.isArray(value) ? [...value] : value;
}
function databaseValue(value) { return value === null || value === undefined ? null : (Array.isArray(value) || typeof value === "object" ? JSON.stringify(value) : value); }
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalize(value[key])]));
  return value;
}
function canonicalHash(value) { return sha256(canonicalize(value)); }
export function evidenceSignature(evidence, key) {
  const unsigned = { ...evidence };
  delete unsigned.signature;
  return createHmac("sha256", key).update(JSON.stringify(canonicalize(unsigned))).digest("hex");
}
function nonNegativeSafeInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) fail(`${label} must be a non-negative safe integer`);
  return number;
}
function validTimestamp(value, now, label) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) fail(`${label} must be an ISO-8601 time with timezone`);
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || parsed > now || now - parsed > BACKUP_EVIDENCE_MAX_AGE_MS) fail(`${label} is future-dated or older than one hour`);
  return new Date(parsed).toISOString();
}
export function questionPayload(row) {
  if (!row) return null;
  const payload = {};
  for (const field of QUESTION_FIELDS) payload[field] = field === "options" ? parseOptions(row.options) : iso(row[field]);
  return payload;
}
export function fullRowPayload(row) {
  if (!row) return null;
  return Object.fromEntries(Object.keys(row).sort().map(field => [field, iso(row[field])]));
}
function snapshotPayload(row) { return { id: Number(row.id), rawHash: typeof row.__rawHash === "string" ? row.__rawHash : canonicalHash(fullRowPayload(row)), content: fullRowPayload(row) }; }

function quoteIdentifier(identifier) { return `\`${String(identifier).replace(/`/g, "``")}\``; }
export async function attachRawRowHashes(connection, rows, lockForApply) {
  const [columns] = await connection.execute("SELECT `COLUMN_NAME` AS columnName FROM `information_schema`.`COLUMNS` WHERE `TABLE_SCHEMA`=DATABASE() AND `TABLE_NAME`='questions' ORDER BY `ORDINAL_POSITION`");
  const columnNames = columns.map(column => String(column.columnName));
  if (!columnNames.includes("id") || !columnNames.includes("questionNum") || !columnNames.includes("bankKey")) fail("questions table columns cannot support raw preservation verification");
  const rawComponents = columnNames.map(column => {
    const quoted = quoteIdentifier(column);
    return `IF(${quoted} IS NULL,'N',CONCAT('V',LENGTH(CAST(${quoted} AS BINARY)),':',HEX(CAST(${quoted} AS BINARY))))`;
  });
  const lock = lockForApply ? " FOR UPDATE" : "";
  const [hashRows] = await connection.execute(`SELECT \`id\`,\`questionNum\`,SHA2(CONCAT_WS('|',${rawComponents.join(",")}),256) AS \`rawHash\` FROM \`questions\` WHERE \`bankKey\`=? ORDER BY \`questionNum\`${lock}`, [BANK]);
  const hashById = new Map(hashRows.map(row => [Number(row.id), String(row.rawHash)]));
  if (hashById.size !== rows.length) fail("raw preservation hashes do not cover the complete WPI question bank");
  for (const row of rows) {
    const rawHash = hashById.get(Number(row.id));
    if (!rawHash || rawHash.length !== 64) fail(`raw preservation hash is missing for WPI question ${row.questionNum}`);
    Object.defineProperty(row, "__rawHash", { value: rawHash, enumerable: false });
  }
}

function readPrivateEvidence(path, label) {
  if (typeof path !== "string" || !path.trim()) fail(`${label} file path is required`);
  let resolved;
  try { resolved = realpathSync(path); } catch { fail(`${label} file is unavailable`); }
  if (resolved !== EVIDENCE_ROOT && !resolved.startsWith(`${EVIDENCE_ROOT}/`)) fail(`${label} file must remain in the private recovery evidence folder`);
  const stat = statSync(resolved);
  if (!stat.isFile() || stat.size < 2 || stat.size > 10 * 1024 * 1024 || (stat.mode & 0o077) !== 0) fail(`${label} file has an invalid type, size, or permission mode`);
  return readFileSync(resolved, "utf8");
}

function readEvidenceKey(path) {
  const key = readPrivateEvidence(path, "evidence signing key").trim();
  if (key.length < 32) fail("evidence signing key is unavailable or too short");
  return key;
}

function uncertainOutcomePath(targetFingerprint) {
  return `${EVIDENCE_ROOT}/wpi-class3-water-dist-remediation/release/uncertain/${targetFingerprint}.json`;
}
function committedOutcomePath(targetFingerprint) {
  return `${EVIDENCE_ROOT}/wpi-class3-water-dist-remediation/release/committed/${targetFingerprint}.json`;
}

function assertNoUncertainOutcome(targetFingerprint) {
  if (existsSync(uncertainOutcomePath(targetFingerprint))) fail("a prior commit outcome is uncertain for this production target; run the dedicated read-only reconciliation before any retry");
}
function assertReleaseNotApplied(targetFingerprint) {
  if (existsSync(committedOutcomePath(targetFingerprint))) fail("this exact WPI remediation release is already committed for this production target");
}
function durableWriteJSON(path, value) {
  const directory = path.slice(0, path.lastIndexOf("/"));
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const tempPath = `${path}.tmp-${process.pid}`;
  writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  const fileDescriptor = openSync(tempPath, "r");
  try { fsyncSync(fileDescriptor); } finally { closeSync(fileDescriptor); }
  renameSync(tempPath, path);
  const directoryDescriptor = openSync(directory, "r");
  try { fsyncSync(directoryDescriptor); } finally { closeSync(directoryDescriptor); }
}
function recordUncertainOutcome(plan, sourceContentVersion) {
  const path = uncertainOutcomePath(plan.targetFingerprint);
  durableWriteJSON(path, { release: RELEASE, bankKey: BANK, planDigest: plan.planDigest, targetFingerprint: plan.targetFingerprint, recordedAt: new Date().toISOString(), sourceContentVersion: Number(sourceContentVersion), sourceMetadataTotalQuestions: Number(plan.sourceMetadataTotalQuestions), expectedContentVersion: Number(plan.expectedContentVersion), expectedMetadataTotalQuestions: Number(plan.expectedMetadataTotalQuestions), baseline: plan.baseline });
  return path;
}
function recordCommittedOutcome(plan, sourceContentVersion) {
  const path = committedOutcomePath(plan.targetFingerprint);
  durableWriteJSON(path, { release: RELEASE, bankKey: BANK, planDigest: plan.planDigest, targetFingerprint: plan.targetFingerprint, committedAt: new Date().toISOString(), sourceContentVersion: Number(sourceContentVersion), sourceMetadataTotalQuestions: Number(plan.sourceMetadataTotalQuestions), expectedContentVersion: Number(plan.expectedContentVersion), expectedMetadataTotalQuestions: Number(plan.expectedMetadataTotalQuestions), repairCount: REPAIR_COUNT, packageSha256: PACKAGE_SHA256 });
  return path;
}

function clearUncertainOutcome(targetFingerprint) {
  const path = uncertainOutcomePath(targetFingerprint);
  if (existsSync(path)) rmSync(path, { force: true });
}

export function parsePreflightEvidence(raw, planDigest, targetFingerprint, evidenceKey, now = Date.now()) {
  if (!raw?.trim()) fail("fresh target-bound live preflight evidence is required");
  let evidence;
  try { evidence = JSON.parse(raw); } catch { fail("preflight evidence must be JSON"); }
  if (evidence?.release !== RELEASE || evidence?.planDigest !== planDigest || evidence?.targetFingerprint !== targetFingerprint || typeof evidence.signature !== "string" || evidence.signature.length !== 64 || evidence.signature !== evidenceSignature(evidence, evidenceKey)) fail("preflight evidence is not integrity-protected and bound to this exact production plan and target");
  if (Number(evidence.storedCount) !== STORED_COUNT || Number(evidence.repairCount) !== REPAIR_COUNT || evidence.packageSha256 !== PACKAGE_SHA256) fail("preflight evidence does not prove the expected bank inventory, repair scope, and package");
  return { plannedAt: validTimestamp(evidence.plannedAt, now, "preflight evidence timestamp") };
}
export function parseBackupEvidence(raw, planDigest, targetFingerprint, baseline, evidenceKey, now = Date.now()) {
  if (!raw?.trim()) fail("current scoped recovery evidence is required");
  let evidence;
  try { evidence = JSON.parse(raw); } catch { fail("recovery evidence must be JSON"); }
  if (evidence?.release !== RELEASE || evidence?.planDigest !== planDigest || evidence?.targetFingerprint !== targetFingerprint || typeof evidence.signature !== "string" || evidence.signature.length !== 64 || evidence.signature !== evidenceSignature(evidence, evidenceKey)) fail("recovery evidence is not integrity-protected and bound to this exact production plan and target");
  if (typeof evidence.backupId !== "string" || !evidence.backupId.trim() || typeof evidence.backupArtifactPath !== "string" || typeof evidence.backupArtifactSha256 !== "string" || evidence.backupArtifactSha256.length !== 64 || Number(evidence.storedCount) !== STORED_COUNT || Number(evidence.repairCount) !== REPAIR_COUNT || evidence.packageSha256 !== PACKAGE_SHA256 || !Array.isArray(evidence.baseline) || canonicalHash(evidence.baseline) !== canonicalHash(baseline)) fail("recovery evidence does not contain a complete target-bound before-image set");
  const artifactRaw = readPrivateEvidence(evidence.backupArtifactPath, "recovery artifact");
  let artifact;
  try { artifact = JSON.parse(artifactRaw); } catch { fail("recovery artifact must be JSON"); }
  if (sha256(artifactRaw) !== evidence.backupArtifactSha256 || artifact?.release !== RELEASE || artifact?.bankKey !== BANK || artifact?.planDigest !== planDigest || artifact?.targetFingerprint !== targetFingerprint || artifact?.backupId !== evidence.backupId || !Array.isArray(artifact.baseline) || canonicalHash(artifact.baseline) !== canonicalHash(baseline)) fail("recovery artifact is unavailable, incomplete, or does not match the exact before-image set");
  return { backupId: evidence.backupId.trim(), backedUpAt: validTimestamp(evidence.backedUpAt, now, "recovery evidence timestamp") };
}
export async function targetFingerprintFor(connection) {
  const [rows] = await connection.execute("SELECT DATABASE() AS databaseName, @@server_uuid AS serverUuid");
  const identity = rows[0];
  if (!identity?.databaseName || !identity?.serverUuid) fail("database identity is unavailable for a target-bound plan");
  return sha256({ databaseName: identity.databaseName, serverUuid: identity.serverUuid, release: RELEASE });
}
export function readTrustedRepairs() {
  const raw = readFileSync(PACKAGE_PATH, "utf8");
  if (sha256(raw) !== PACKAGE_SHA256) fail("reviewed repair package digest does not match the controlled artifact");
  const packageData = JSON.parse(raw);
  if (packageData?.release !== RELEASE || packageData.bankKey !== BANK || packageData.model !== "gpt-6-sol" || !packageData.sourcePack || !Array.isArray(packageData.revisions) || packageData.revisions.length !== REPAIR_COUNT) fail("reviewed repair package identity is invalid");
  const sourceKeys = new Set(Object.keys(packageData.sourcePack));
  const repairs = new Map();
  for (const repair of packageData.revisions) {
    const number = Number(repair.questionNum);
    if (!Number.isInteger(number) || number < 1 || number > STORED_COUNT || repairs.has(number)) fail("repair package has invalid or duplicate question numbers");
    if (repair.bankKey !== BANK || repair.reviewStatus !== "in_review" || repair.reviewedBy !== null || repair.reviewedAt !== null || !sourceKeys.has(repair.sourceKey)) fail(`repair question ${number} has invalid governance or source fields`);
    const source = packageData.sourcePack[repair.sourceKey];
    const options = parseOptions(repair.options);
    if (!repair.question?.trim() || !repair.explanation?.trim() || !repair.sourceReference?.trim() || !repair.blueprintObjective?.trim() || repair.sourceTitle !== source.title || repair.sourceUrl !== source.url || options.length !== 4 || new Set(options.map(option => String(option).trim().toLowerCase())).size !== 4 || !Number.isInteger(repair.correctIndex) || repair.correctIndex < 0 || repair.correctIndex > 3) fail(`repair question ${number} has invalid educational content`);
    if (repair.isCalc === "yes" && (!Array.isArray(repair.steps) || repair.steps.length < 2)) fail(`calculation repair question ${number} lacks checked steps`);
    if (repair.isCalc === "no" && repair.steps !== null) fail(`non-calculation repair question ${number} has unexpected steps`);
    repairs.set(number, { ...repair, options });
  }
  if (repairs.size !== REPAIR_COUNT) fail("repair package count is invalid");
  return repairs;
}
export function assertLiveShape(rows, metadata) {
  if (!Array.isArray(rows) || rows.length !== STORED_COUNT) fail(`expected ${STORED_COUNT} stored WPI Class III Distribution rows`);
  if (!metadata || metadata.bankKey !== BANK || ![PRE_RELEASE_METADATA_TOTAL, STORED_COUNT].includes(Number(metadata.totalQuestions))) fail(`WPI Class III Distribution metadata must be the verified pre-release ${PRE_RELEASE_METADATA_TOTAL} or corrected ${STORED_COUNT} count`);
  nonNegativeSafeInteger(metadata.contentVersion, "metadata contentVersion");
  const byNumber = new Map();
  const ids = new Set();
  for (const row of rows) {
    const number = Number(row.questionNum);
    if (row.bankKey !== BANK || !Number.isInteger(number) || number < 1 || number > STORED_COUNT || byNumber.has(number)) fail("duplicate or invalid WPI question number");
    if (!Number.isSafeInteger(Number(row.id)) || Number(row.id) <= 0 || ids.has(Number(row.id))) fail("duplicate or invalid WPI question id");
    if (typeof row.reviewStatus !== "string" || !isLearnerVisibleReviewStatus(row.reviewStatus)) fail(`WPI question ${number} is not learner-visible before remediation`);
    byNumber.set(number, row); ids.add(Number(row.id));
  }
  for (let number = 1; number <= STORED_COUNT; number += 1) if (!byNumber.has(number)) fail(`missing WPI question ${number}`);
  return byNumber;
}
export function buildBaselineManifest(rows, metadata, targetFingerprint) {
  const byNumber = assertLiveShape(rows, metadata);
  const repairs = readTrustedRepairs();
  const targets = [...repairs.keys()].sort((left, right) => left - right).map(questionNum => {
    const row = byNumber.get(questionNum);
    return { questionNum, id: Number(row.id), rawHash: snapshotPayload(row).rawHash };
  });
  return { release: RELEASE, bankKey: BANK, targetFingerprint, storedCount: STORED_COUNT, metadataTotalQuestions: Number(metadata.totalQuestions), contentVersion: nonNegativeSafeInteger(metadata.contentVersion, "metadata contentVersion"), packageSha256: PACKAGE_SHA256, targets };
}
function assertBaselineManifest(manifest, rows, metadata, targetFingerprint, repairs) {
  if (!manifest || manifest.release !== RELEASE || manifest.bankKey !== BANK || manifest.targetFingerprint !== targetFingerprint || Number(manifest.storedCount) !== STORED_COUNT || Number(manifest.metadataTotalQuestions) !== Number(metadata.totalQuestions) || nonNegativeSafeInteger(manifest.contentVersion, "baseline contentVersion") !== Number(metadata.contentVersion) || manifest.packageSha256 !== PACKAGE_SHA256 || !Array.isArray(manifest.targets) || manifest.targets.length !== repairs.size) fail("full before-image baseline manifest is invalid or does not match this live plan");
  const byNumber = new Map(manifest.targets.map(target => [Number(target.questionNum), target]));
  const liveByNumber = new Map(rows.map(row => [Number(row.questionNum), row]));
  for (const number of repairs.keys()) {
    const target = byNumber.get(number); const row = liveByNumber.get(number);
    if (!row || !target || Number(target.id) !== Number(row.id) || target.rawHash !== snapshotPayload(row).rawHash) fail(`live WPI question ${number} differs from its exact before-image baseline`);
  }
}
function validateReplacement(repair, existingStems) {
  const stem = normalisedStem(repair.question);
  if (!stem || existingStems.has(stem)) fail(`replacement question ${repair.questionNum} duplicates an unchanged stem`);
  existingStems.add(stem);
}
export function buildPlan(rows, metadata, targetFingerprint, baselineManifest) {
  if (!targetFingerprint?.trim()) fail("target fingerprint is required for a live plan");
  const byNumber = assertLiveShape(rows, metadata);
  if (Number(metadata.contentVersion) >= Number.MAX_SAFE_INTEGER) fail("metadata contentVersion cannot be safely incremented");
  const repairs = readTrustedRepairs();
  assertBaselineManifest(baselineManifest, rows, metadata, targetFingerprint, repairs);
  const existingStems = new Set(rows.filter(row => !repairs.has(Number(row.questionNum))).map(row => normalisedStem(row.question)));
  const changes = [];
  for (const [number, repair] of [...repairs.entries()].sort((left, right) => left[0] - right[0])) {
    const before = byNumber.get(number); validateReplacement(repair, existingStems);
    const after = { ...repair, id: before.id, bankKey: before.bankKey, questionNum: before.questionNum, reviewStatus: LEARNER_VISIBLE_REPAIR_STATUS, reviewedBy: null, reviewedAt: null };
    changes.push({ before, after });
  }
  const baseline = rows.map(snapshotPayload).sort((left, right) => left.id - right.id);
  const planDigest = sha256({ release: RELEASE, targetFingerprint, baseline: { metadata: { bankKey: metadata.bankKey, totalQuestions: Number(metadata.totalQuestions), contentVersion: Number(metadata.contentVersion) }, rows: baseline }, fullTargetBaseline: baselineManifest.targets, packageSha256: PACKAGE_SHA256, repairs: changes.map(change => ({ before: snapshotPayload(change.before), after: questionPayload(change.after) })) });
  return { changes, baseline, planDigest, targetFingerprint, storedCount: STORED_COUNT, learnerVisibleCount: STORED_COUNT, sourceMetadataTotalQuestions: Number(metadata.totalQuestions), expectedMetadataTotalQuestions: STORED_COUNT, expectedContentVersion: Number(metadata.contentVersion) + 1 };
}
export function assertUnchangedRowsPreserved(postRows, baseline, targetIdentities) {
  const baselineById = new Map(baseline.map(row => [row.id, row]));
  const targetKeys = new Set(targetIdentities.map(target => `${Number(target.id)}:${Number(target.questionNum)}`));
  if (postRows.length !== STORED_COUNT) fail("post-write stored inventory changed");
  for (const row of postRows) {
    if (targetKeys.has(`${Number(row.id)}:${Number(row.questionNum)}`)) continue;
    const expected = baselineById.get(Number(row.id));
    if (!expected || snapshotPayload(row).rawHash !== expected.rawHash) fail(`post-write preservation mismatch at non-target question ${row.questionNum}`);
  }
}
export function assertCompleteBaselinePreserved(rows, baseline) {
  if (rows.length !== STORED_COUNT || baseline.length !== STORED_COUNT) fail("complete baseline preservation check has an invalid inventory");
  const baselineById = new Map(baseline.map(row => [Number(row.id), row]));
  for (const row of rows) {
    const expected = baselineById.get(Number(row.id));
    if (!expected || snapshotPayload(row).rawHash !== expected.rawHash) fail(`complete baseline preservation mismatch at WPI question ${row.questionNum}`);
  }
}
export function assertTargetNoncontentFieldsPreserved(postRows, changes) {
  const postById = new Map(postRows.map(row => [Number(row.id), row]));
  for (const { before } of changes) {
    const post = postById.get(Number(before.id));
    if (!post) fail(`post-write target row is missing for WPI question ${before.questionNum}`);
    const beforePayload = fullRowPayload(before);
    const postPayload = fullRowPayload(post);
    for (const [field, beforeValue] of Object.entries(beforePayload)) {
      if (TARGET_MUTABLE_FIELDS.has(field)) continue;
      if (canonicalHash(postPayload[field]) !== canonicalHash(beforeValue)) fail(`post-write preservation mismatch at immutable field ${field} for WPI question ${before.questionNum}`);
    }
  }
}
export function assertSnapshots(snapshots, changes, sourceContentVersion) {
  if (snapshots.length !== changes.length) fail(`post-write before-image count does not equal ${changes.length}`);
  const expectedById = new Map(changes.map(({ before }) => [Number(before.id), before])); const seen = new Set();
  for (const snapshot of snapshots) {
    const before = expectedById.get(Number(snapshot.questionId));
    if (!before || seen.has(Number(snapshot.questionId))) fail("post-write before-image target set is invalid");
    seen.add(Number(snapshot.questionId));
    let payload;
    try { payload = typeof snapshot.payload === "string" || Buffer.isBuffer(snapshot.payload) ? JSON.parse(Buffer.isBuffer(snapshot.payload) ? snapshot.payload.toString("utf8") : snapshot.payload) : snapshot.payload; } catch { fail(`before-image payload is not valid JSON at WPI question ${before.questionNum}`); }
    if (Number(snapshot.questionNum) !== Number(before.questionNum) || Number(snapshot.sourceContentVersion) !== Number(sourceContentVersion) || snapshot.contentHash !== sha256(fullRowPayload(before)) || canonicalHash(payload) !== canonicalHash(fullRowPayload(before))) fail(`post-write before-image mismatch at WPI question ${before.questionNum}`);
  }
}

export function reconcileUncertainOutcome(outcome, rows, metadata, snapshots, targetFingerprint) {
  if (!outcome || outcome.release !== RELEASE || outcome.bankKey !== BANK || outcome.targetFingerprint !== targetFingerprint || !Array.isArray(outcome.baseline) || !Number.isSafeInteger(Number(outcome.sourceContentVersion)) || !Number.isSafeInteger(Number(outcome.expectedContentVersion)) || !Number.isSafeInteger(Number(outcome.sourceMetadataTotalQuestions)) || !Number.isSafeInteger(Number(outcome.expectedMetadataTotalQuestions))) fail("uncertain-outcome record is invalid for this production target");
  const repairs = readTrustedRepairs();
  const byNumber = new Map(rows.map(row => [Number(row.questionNum), row]));
  const baselineById = new Map(outcome.baseline.map(snapshot => [Number(snapshot.id), snapshot]));
  const changes = [];
  let applied = true;
  let unchanged = true;
  for (const [number, repair] of repairs) {
    const row = byNumber.get(number);
    const baseline = row && baselineById.get(Number(row.id));
    const before = baseline?.content;
    const expectedAfter = row && { ...repair, id: row.id, bankKey: row.bankKey, questionNum: row.questionNum, reviewStatus: LEARNER_VISIBLE_REPAIR_STATUS, reviewedBy: null, reviewedAt: null };
    if (!row || !baseline || !expectedAfter || canonicalHash(questionPayload(row)) !== canonicalHash(questionPayload(expectedAfter))) applied = false;
    if (!row || !baseline || canonicalHash(snapshotPayload(row)) !== canonicalHash(baseline)) unchanged = false;
    if (row && before && expectedAfter) changes.push({ before, after: expectedAfter });
  }
  if (applied && changes.length === repairs.size && Number(metadata.contentVersion) === Number(outcome.expectedContentVersion) && Number(metadata.totalQuestions) === Number(outcome.expectedMetadataTotalQuestions)) {
    assertUnchangedRowsPreserved(rows, outcome.baseline, changes.map(change => change.before));
    assertTargetNoncontentFieldsPreserved(rows, changes);
    assertSnapshots(snapshots, changes, outcome.sourceContentVersion);
    return "committed";
  }
  if (unchanged && Number(metadata.contentVersion) === Number(outcome.sourceContentVersion) && Number(metadata.totalQuestions) === Number(outcome.sourceMetadataTotalQuestions)) {
    if (snapshots.length !== 0) fail("uncertain-outcome reconciliation found release snapshots without a committed write");
    assertCompleteBaselinePreserved(rows, outcome.baseline);
    return "not_committed";
  }
  fail("uncertain-outcome reconciliation found a partial or inconsistent write; keep the retry gate closed and investigate manually");
}

export async function readLiveState(connection, lockForApply) {
  const lock = lockForApply ? " FOR UPDATE" : "";
  const [rows] = await connection.execute(`SELECT * FROM \`questions\` WHERE \`bankKey\`=? ORDER BY \`questionNum\`${lock}`, [BANK]);
  const [metadataRows] = await connection.execute(`SELECT * FROM \`question_bank_meta\` WHERE \`bankKey\`=?${lock}`, [BANK]);
  if (metadataRows.length !== 1) fail("expected exactly one WPI Class III Distribution metadata row");
  return { rows, metadata: metadataRows[0] };
}
function updateValues(after) {
  return [after.module, after.difficulty, after.question, JSON.stringify(parseOptions(after.options)), after.correctIndex, after.explanation, databaseValue(after.steps), after.tip, after.isCalc, after.topic, after.cognitiveLevel, after.sourceTitle, after.sourceReference, after.sourceUrl, after.blueprintObjective, after.reviewStatus];
}
async function run() {
  const args = process.argv.slice(2); const apply = args.includes("--apply"); const reconcile = args.includes("--reconcile-uncertain"); const index = args.indexOf("--baseline-manifest"); const baselinePath = index === -1 ? null : args[index + 1];
  if (apply && reconcile) fail("choose either --apply or --reconcile-uncertain, not both");
  if (!baselinePath || baselinePath.startsWith("--")) fail("pass --baseline-manifest path");
  const baselineManifest = JSON.parse(readFileSync(baselinePath, "utf8"));
  const mysql = await import("mysql2/promise"); const connection = await mysql.createConnection(authoritativeProductionConnectionOptions());
  let commitAttempted = false; let committed = false; let primaryError = null; let plan = null;
  try {
    if (apply) await connection.beginTransaction(); else await beginReadOnlyTransaction(connection);
    if (apply) await verifyWriteAssumptions(connection);
    const targetFingerprint = await targetFingerprintFor(connection);
    const { rows, metadata } = await readLiveState(connection, apply);
    await attachRawRowHashes(connection, rows, apply);
    if (reconcile) {
      const outcome = JSON.parse(readPrivateEvidence(uncertainOutcomePath(targetFingerprint), "uncertain-outcome record"));
      const [snapshotRows] = await connection.execute("SELECT `questionId`,`questionNum`,`sourceContentVersion`,`contentHash`,`payload` FROM `question_content_snapshots` WHERE `releaseKey`=? AND `bankKey`=? ORDER BY `questionNum`", [RELEASE, BANK]);
      const result = reconcileUncertainOutcome(outcome, rows, metadata, snapshotRows, targetFingerprint);
      if (result === "committed") recordCommittedOutcome(outcome, outcome.sourceContentVersion);
      clearUncertainOutcome(targetFingerprint);
      await connection.rollback();
      console.log(`Read-only reconciliation found the prior WPI Class III remediation ${result.replace("_", " ")}; the retry gate is cleared.`);
      return;
    }
    if (apply) {
      assertNoUncertainOutcome(targetFingerprint);
      assertReleaseNotApplied(targetFingerprint);
      const [releaseSnapshots] = await connection.execute("SELECT COUNT(*) AS count FROM `question_content_snapshots` WHERE `releaseKey`=? AND `bankKey`=? FOR UPDATE", [RELEASE, BANK]);
      if (Number(releaseSnapshots[0]?.count) !== 0) fail("this WPI remediation release already has persisted before-images and cannot be applied again");
    }
    plan = buildPlan(rows, metadata, targetFingerprint, baselineManifest);
    console.log(JSON.stringify({ mode: apply ? "apply-requested" : "live-plan", repairs: plan.changes.length, storedQuestions: plan.storedCount, learnerVisibleQuestions: plan.learnerVisibleCount, expectedContentVersion: plan.expectedContentVersion, targetFingerprint: plan.targetFingerprint, planDigest: plan.planDigest }, null, 2));
    if (!apply) { await connection.rollback(); return; }
    if (process.env.CONFIRM_WPI_CLASS3_WATER_DIST_REMEDIATION !== plan.planDigest) fail("confirmation digest does not match this exact live plan");
    const evidenceKey = readEvidenceKey(process.env[EVIDENCE_KEY_FILE_ENV]);
    parsePreflightEvidence(readPrivateEvidence(process.env.WPI_CLASS3_WATER_DIST_REMEDIATION_PREFLIGHT_FILE, "preflight evidence"), plan.planDigest, plan.targetFingerprint, evidenceKey);
    parseBackupEvidence(readPrivateEvidence(process.env.WPI_CLASS3_WATER_DIST_REMEDIATION_BACKUP_FILE, "recovery evidence"), plan.planDigest, plan.targetFingerprint, plan.baseline, evidenceKey);
    for (const { before, after } of plan.changes) {
      const beforeImage = fullRowPayload(before);
      const [snapshot] = await connection.execute("INSERT INTO `question_content_snapshots` (`releaseKey`,`bankKey`,`questionId`,`questionNum`,`sourceContentVersion`,`contentHash`,`payload`) VALUES (?,?,?,?,?,?,?)", [RELEASE, BANK, before.id, before.questionNum, Number(metadata.contentVersion), sha256(beforeImage), JSON.stringify(beforeImage)]);
      if (snapshot.affectedRows !== 1) fail(`before-image capture failed for WPI question ${before.questionNum}`);
      const [result] = await connection.execute("UPDATE `questions` SET `module`=?,`difficulty`=?,`question`=?,`options`=?,`correctIndex`=?,`explanation`=?,`steps`=?,`tip`=?,`isCalc`=?,`topic`=?,`cognitiveLevel`=?,`sourceTitle`=?,`sourceReference`=?,`sourceUrl`=?,`blueprintObjective`=?,`reviewStatus`=?,`reviewedBy`=NULL,`reviewedAt`=NULL WHERE `id`=? AND `bankKey`=? AND `questionNum`=?", [...updateValues(after), before.id, BANK, before.questionNum]);
      if (result.affectedRows !== 1) fail(`update failed for WPI question ${before.questionNum}`);
    }
    const [metadataUpdate] = await connection.execute("UPDATE `question_bank_meta` SET `totalQuestions`=?,`contentVersion`=`contentVersion`+1 WHERE `bankKey`=? AND `totalQuestions`=? AND `contentVersion`=?", [STORED_COUNT, BANK, Number(metadata.totalQuestions), Number(metadata.contentVersion)]);
    if (metadataUpdate.affectedRows !== 1) fail("WPI metadata correction and version update did not affect exactly one row");
    const [postRows] = await connection.execute("SELECT * FROM `questions` WHERE `bankKey`=? ORDER BY `questionNum` FOR UPDATE", [BANK]);
    await attachRawRowHashes(connection, postRows, true);
    const [postMetadataRows] = await connection.execute("SELECT * FROM `question_bank_meta` WHERE `bankKey`=? FOR UPDATE", [BANK]);
    if (postMetadataRows.length !== 1 || Number(postMetadataRows[0].totalQuestions) !== STORED_COUNT || Number(postMetadataRows[0].contentVersion) !== plan.expectedContentVersion) fail("post-write WPI metadata verification failed");
    assertLiveShape(postRows, postMetadataRows[0]); const postByNumber = new Map(postRows.map(row => [Number(row.questionNum), row]));
    for (const { before, after } of plan.changes) { const post = postByNumber.get(Number(after.questionNum)); if (!post || Number(post.id) !== Number(before.id) || canonicalHash(questionPayload(post)) !== canonicalHash(questionPayload(after))) fail(`post-write repair mismatch for WPI question ${after.questionNum}`); }
    assertUnchangedRowsPreserved(postRows, plan.baseline, plan.changes.map(change => change.before));
    assertTargetNoncontentFieldsPreserved(postRows, plan.changes);
    const [snapshotRows] = await connection.execute("SELECT `questionId`,`questionNum`,`sourceContentVersion`,`contentHash`,`payload` FROM `question_content_snapshots` WHERE `releaseKey`=? AND `bankKey`=? ORDER BY `questionNum` FOR UPDATE", [RELEASE, BANK]);
    assertSnapshots(snapshotRows, plan.changes, metadata.contentVersion);
    const [visibleRows] = await connection.execute(`SELECT COUNT(*) AS count FROM \`questions\` WHERE \`bankKey\`=? AND \`reviewStatus\` NOT IN (${HIDDEN_LEARNER_REVIEW_STATUSES.map(() => "?").join(",")})`, [BANK, ...HIDDEN_LEARNER_REVIEW_STATUSES]);
    if (Number(visibleRows[0]?.count) !== STORED_COUNT) fail(`post-write learner-visible inventory does not equal ${STORED_COUNT}`);
    recordUncertainOutcome(plan, metadata.contentVersion);
    commitAttempted = true; await connection.commit(); committed = true;
    recordCommittedOutcome(plan, metadata.contentVersion);
    clearUncertainOutcome(plan.targetFingerprint);
    console.log(`Committed ${REPAIR_COUNT} WPI Class III Water Distribution repairs. Learner-visible inventory remains ${STORED_COUNT}.`);
  } catch (error) {
    if (!commitAttempted) await connection.rollback();
    if (commitAttempted && !committed) { primaryError = new Error(`WPI Class III Water Distribution remediation commit outcome is uncertain. Do not retry. Run read-only reconciliation before any further write. Retry gate: ${uncertainOutcomePath(plan.targetFingerprint)}. Original error: ${error instanceof Error ? error.message : String(error)}`); throw primaryError; }
    primaryError = error; throw error;
  } finally {
    try { await connection.end(); } catch (error) { if (primaryError) console.error("Database connection also failed to close after the primary release error. Preserve the primary error and reconcile read-only."); else if (!committed) throw error; else console.error("Database connection closed with an error after a confirmed commit. Reconcile read-only before another release."); }
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await run();
