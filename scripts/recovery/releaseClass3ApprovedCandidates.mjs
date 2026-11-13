#!/usr/bin/env node
/**
 * Owner-authorized publication of the 250 Class 3 Water Distribution candidates.
 * Plans by default. It changes only the new candidate rows and Class 3 metadata.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { buildCandidateQuestions } from "../../content/class3-water-dist/new-questions-2026-09-22.mjs";

export const BANK = "class3-water-dist";
export const RELEASE = "class3-approved-candidates-2026-09-22";
export const REVIEWER = "owner-approval:class3-water-distribution-candidates";
export const APPROVED_AT = new Date("2026-09-22T20:32:07-04:00").toISOString();
export const BASELINE_STORED_COUNT = 571;
export const FINAL_STORED_COUNT = 821;
export const CANDIDATE_START = 2001;
export const CANDIDATE_END = 2250;
export const CANDIDATE_COUNT = 250;
export const BACKUP_EVIDENCE_MAX_AGE_MS = 60 * 60 * 1000;

const QUESTION_FIELDS = [
  "bankKey", "questionNum", "module", "difficulty", "question", "options", "correctIndex",
  "explanation", "steps", "tip", "isCalc", "topic", "cognitiveLevel", "sourceTitle",
  "sourceReference", "sourceUrl", "blueprintObjective", "reviewStatus", "reviewedBy", "reviewedAt",
];
const VALID_REVIEW_STATUSES = new Set(["unreviewed", "in_review", "approved", "rejected"]);
const TLS_MODES = new Set(["required", "verify_ca", "verify_identity", "true", "1"]);
const sha256 = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const iso = value => value instanceof Date ? value.toISOString() : value ?? null;

function fail(message) {
  throw new Error(`Class 3 approved-candidate release blocked: ${message}`);
}

function normalisedStem(value) {
  return value.normalize("NFKC").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function validIsoTimestamp(value, now, label) {
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

export function questionPayload(row) {
  if (!row) return null;
  const payload = {};
  for (const field of QUESTION_FIELDS) {
    if (field === "options") {
      const options = typeof row.options === "string" ? JSON.parse(row.options) : row.options;
      payload.options = Array.isArray(options) ? [...options] : options;
    } else {
      payload[field] = iso(row[field]);
    }
  }
  return payload;
}

function baselineRowPayload(row) {
  return { id: Number(row.id), content: questionPayload(row) };
}

function candidateNumbers() {
  return Array.from({ length: CANDIDATE_COUNT }, (_, index) => CANDIDATE_START + index);
}

export function publishedCandidatePayload(candidate) {
  return {
    ...candidate,
    options: [...candidate.options],
    reviewStatus: "approved",
    reviewedBy: REVIEWER,
    reviewedAt: APPROVED_AT,
  };
}

export function validateCandidatePackage(candidates) {
  if (!Array.isArray(candidates) || candidates.length !== CANDIDATE_COUNT) {
    fail(`expected ${CANDIDATE_COUNT} candidate questions`);
  }
  const expectedNumbers = candidateNumbers();
  const seenNumbers = new Set();
  const seenStems = new Set();
  for (const candidate of candidates) {
    const number = Number(candidate.questionNum);
    if (!Number.isInteger(number) || number < CANDIDATE_START || number > CANDIDATE_END || seenNumbers.has(number)) {
      fail(`candidate question number ${candidate.questionNum} is invalid or duplicated`);
    }
    seenNumbers.add(number);
    if (candidate.bankKey !== BANK || candidate.reviewStatus !== "in_review") {
      fail(`candidate ${number} is not the exact held Class 3 package`);
    }
    if (!Array.isArray(candidate.options) || candidate.options.length !== 4) fail(`candidate ${number} does not have four answer choices`);
    const normalizedOptions = candidate.options.map(option => option.trim().toLowerCase());
    if (new Set(normalizedOptions).size !== 4 || candidate.options[candidate.correctIndex] === undefined) {
      fail(`candidate ${number} has invalid answer choices or key`);
    }
    if (!candidate.question?.trim() || !candidate.explanation?.trim() || !candidate.sourceTitle?.trim() || !candidate.sourceReference?.trim() || !candidate.sourceUrl?.startsWith("https://")) {
      fail(`candidate ${number} is missing required content evidence`);
    }
    const stem = normalisedStem(candidate.question);
    if (!stem || seenStems.has(stem)) fail(`candidate ${number} has a duplicate or invalid stem`);
    seenStems.add(stem);
  }
  for (const expectedNumber of expectedNumbers) if (!seenNumbers.has(expectedNumber)) fail(`candidate ${expectedNumber} is missing`);
}

export function buildPlan(live, metadata, targetFingerprint) {
  const candidates = buildCandidateQuestions();
  validateCandidatePackage(candidates);
  if (!Array.isArray(live)) fail("live Class 3 state is unavailable");
  if (!targetFingerprint?.trim()) fail("target fingerprint is required for a live plan");
  if (!metadata || metadata.bankKey !== BANK || Number(metadata.totalQuestions) !== BASELINE_STORED_COUNT) {
    fail(`Class 3 metadata must remain at ${BASELINE_STORED_COUNT} stored questions before this release`);
  }

  const currentNumbers = new Set();
  const currentStems = new Set();
  for (const row of live) {
    if (row.bankKey !== BANK) fail("foreign question row included in Class 3 plan");
    const number = Number(row.questionNum);
    if (!Number.isInteger(Number(row.id)) || Number(row.id) <= 0 || !Number.isInteger(number) || currentNumbers.has(number)) {
      fail("duplicate or invalid Class 3 question id or number in live state");
    }
    if (!VALID_REVIEW_STATUSES.has(row.reviewStatus)) fail(`Class 3 question ${number} has an invalid or null review status`);
    currentNumbers.add(number);
    const stem = normalisedStem(row.question);
    if (!stem || currentStems.has(stem)) fail(`Class 3 question ${number} has a duplicate or invalid live stem`);
    currentStems.add(stem);
  }
  if (live.length !== BASELINE_STORED_COUNT || currentNumbers.size !== BASELINE_STORED_COUNT) {
    fail(`expected exactly ${BASELINE_STORED_COUNT} existing Class 3 rows`);
  }
  for (let number = 1; number <= BASELINE_STORED_COUNT; number += 1) if (!currentNumbers.has(number)) fail(`missing existing Class 3 question ${number}`);
  const learnerVisibleCount = live.filter(row => !["in_review", "rejected"].includes(row.reviewStatus)).length;
  if (learnerVisibleCount !== BASELINE_STORED_COUNT) {
    fail(`expected ${BASELINE_STORED_COUNT} learner-visible baseline questions, found ${learnerVisibleCount}`);
  }
  for (const candidate of candidates) {
    if (currentNumbers.has(candidate.questionNum)) fail(`candidate number ${candidate.questionNum} is already occupied in production`);
    if (currentStems.has(normalisedStem(candidate.question))) fail(`candidate ${candidate.questionNum} duplicates an existing Class 3 stem`);
  }

  const additions = candidates.map(publishedCandidatePayload);
  const baseline = live.map(baselineRowPayload).sort((left, right) => left.id - right.id);
  const planDigest = sha256({
    release: RELEASE,
    targetFingerprint,
    baseline: {
      metadata: {
        bankKey: metadata.bankKey,
        totalQuestions: Number(metadata.totalQuestions),
        contentVersion: Number(metadata.contentVersion),
      },
      rows: baseline,
    },
    additions: additions.map(questionPayload),
  });
  return {
    additions,
    baseline,
    planDigest,
    targetFingerprint,
    baselineStoredCount: BASELINE_STORED_COUNT,
    baselineVisibleCount: learnerVisibleCount,
    finalStoredCount: FINAL_STORED_COUNT,
    finalVisibleCount: FINAL_STORED_COUNT,
    expectedContentVersion: Number(metadata.contentVersion) + 1,
  };
}

export function parsePreflightEvidence(raw, planDigest, targetFingerprint, now = Date.now()) {
  if (!raw?.trim()) fail("fresh target-bound live preflight evidence is required");
  let evidence;
  try { evidence = JSON.parse(raw); } catch { fail("preflight evidence must be JSON"); }
  if (evidence?.release !== RELEASE || evidence?.planDigest !== planDigest || evidence?.targetFingerprint !== targetFingerprint) {
    fail("preflight evidence is not bound to this exact production plan and target");
  }
  return { plannedAt: validIsoTimestamp(evidence.plannedAt, now, "preflight evidence timestamp") };
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
    backedUpAt: validIsoTimestamp(evidence.backedUpAt, now, "recovery evidence timestamp"),
  };
}

export function authoritativeProductionConnectionOptions(env = process.env) {
  if (env.DATABASE_CUTOVER_USE_EXTERNAL_TARGET !== "true") {
    fail("the authoritative external target must be explicitly selected");
  }
  if (!env.EXTERNAL_DATABASE_URL || !env.EXTERNAL_DATABASE_CA || !env.DATABASE_CUTOVER_TARGET_DATABASE) {
    fail("authoritative external database configuration is incomplete");
  }
  if (!/^[A-Za-z0-9_]+$/.test(env.DATABASE_CUTOVER_TARGET_DATABASE)) {
    fail("authoritative target database name is invalid");
  }
  let url;
  try {
    url = new URL(env.EXTERNAL_DATABASE_URL);
  } catch {
    fail("authoritative external database URL is invalid");
  }
  if (url.protocol !== "mysql:" || !url.hostname || !url.username) fail("authoritative external database URL is incomplete");
  const sslMode = url.searchParams.get("ssl-mode") ?? url.searchParams.get("ssl");
  if (!sslMode || !TLS_MODES.has(sslMode.toLowerCase())) fail("authoritative external database TLS is not explicitly enabled");
  const ca = env.EXTERNAL_DATABASE_CA.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trimEnd() + "\n";
  if (!ca.includes("BEGIN CERTIFICATE")) fail("authoritative external database CA certificate is invalid");
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: env.DATABASE_CUTOVER_TARGET_DATABASE,
    charset: "utf8mb4",
    timezone: "Z",
    connectTimeout: 15_000,
    ssl: { ca, rejectUnauthorized: true },
  };
}

export async function targetFingerprintFor(connection) {
  const [rows] = await connection.execute("SELECT DATABASE() AS databaseName, @@server_uuid AS serverUuid");
  const identity = rows[0];
  if (!identity?.databaseName || !identity?.serverUuid) fail("database identity is unavailable for a target-bound plan");
  return sha256({ databaseName: identity.databaseName, serverUuid: identity.serverUuid, release: RELEASE });
}

export async function verifyWriteAssumptions(connection) {
  const [tableRows] = await connection.execute("SHOW TABLE STATUS WHERE `Name` IN ('questions', 'question_bank_meta')");
  const engineByTable = new Map(tableRows.map(row => [row.Name, row.Engine]));
  for (const table of ["questions", "question_bank_meta"]) {
    if (engineByTable.get(table) !== "InnoDB") fail(`${table} table must use InnoDB for transactional publication`);
  }
  const [indexRows] = await connection.execute("SHOW INDEX FROM `questions`");
  const uniqueColumns = indexRows
    .filter(row => row.Key_name === "bank_question_idx" && Number(row.Non_unique) === 0)
    .sort((left, right) => Number(left.Seq_in_index) - Number(right.Seq_in_index))
    .map(row => row.Column_name);
  if (JSON.stringify(uniqueColumns) !== JSON.stringify(["bankKey", "questionNum"])) {
    fail("questions table is missing the required unique bank_question_idx index");
  }
  const [metadataIndexRows] = await connection.execute("SHOW INDEX FROM `question_bank_meta`");
  const metadataUniqueIndexes = new Map();
  for (const row of metadataIndexRows.filter(row => Number(row.Non_unique) === 0)) {
    const columns = metadataUniqueIndexes.get(row.Key_name) ?? [];
    columns.push({ sequence: Number(row.Seq_in_index), column: row.Column_name });
    metadataUniqueIndexes.set(row.Key_name, columns);
  }
  const hasUniqueMetadataBankKey = [...metadataUniqueIndexes.values()].some(columns =>
    JSON.stringify(columns.sort((left, right) => left.sequence - right.sequence).map(item => item.column)) === JSON.stringify(["bankKey"]),
  );
  if (!hasUniqueMetadataBankKey) fail("question_bank_meta is missing a unique bankKey index");
  const [isolationRows] = await connection.execute("SELECT @@transaction_isolation AS isolationLevel");
  const isolation = String(isolationRows[0]?.isolationLevel ?? "").toUpperCase();
  if (!["REPEATABLE-READ", "SERIALIZABLE"].includes(isolation)) {
    fail(`transaction isolation ${isolation || "unknown"} cannot protect the candidate insertion range`);
  }
}

export async function readLiveState(connection, lockForApply) {
  const lock = lockForApply ? " FOR UPDATE" : "";
  const [rows] = await connection.execute(`SELECT * FROM \`questions\` WHERE \`bankKey\`=? ORDER BY \`questionNum\`${lock}`, [BANK]);
  const [candidateRange] = await connection.execute(
    `SELECT \`id\`,\`questionNum\` FROM \`questions\` WHERE \`bankKey\`=? AND \`questionNum\` BETWEEN ? AND ?${lock}`,
    [BANK, CANDIDATE_START, CANDIDATE_END],
  );
  if (candidateRange.length !== 0) fail("candidate number range is already occupied");
  const [metadataRows] = await connection.execute(`SELECT * FROM \`question_bank_meta\` WHERE \`bankKey\`=?${lock}`, [BANK]);
  if (metadataRows.length !== 1) fail("expected exactly one Class 3 metadata row");
  return { rows, metadata: metadataRows[0] };
}

export function assertBaselinePreserved(postRows, baseline) {
  const baselineById = new Map(baseline.map(row => [row.id, row]));
  const postBaseline = postRows.filter(row => Number(row.questionNum) >= 1 && Number(row.questionNum) <= BASELINE_STORED_COUNT);
  if (postBaseline.length !== BASELINE_STORED_COUNT) fail("post-write baseline row count changed");
  for (const row of postBaseline) {
    const expected = baselineById.get(Number(row.id));
    if (!expected || JSON.stringify(baselineRowPayload(row)) !== JSON.stringify(expected)) {
      fail(`post-write baseline preservation mismatch for question ${row.questionNum}`);
    }
  }
}

export async function beginReadOnlyTransaction(connection) {
  await connection.query("SET TRANSACTION READ ONLY");
  await connection.beginTransaction();
}

function approvalValue(field, value) {
  if (field === "options") return JSON.stringify(value);
  if (field === "reviewedAt") return new Date(value);
  return value ?? null;
}

async function run() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const manifestIndex = args.indexOf("--manifest");
  if (manifestIndex !== -1) {
    const fixture = JSON.parse(readFileSync(args[manifestIndex + 1], "utf8"));
    const plan = buildPlan(fixture.rows, fixture.metadata, fixture.targetFingerprint ?? "fixture-target");
    console.log(JSON.stringify({ mode: "offline-plan", additions: plan.additions.length, planDigest: plan.planDigest }, null, 2));
    return;
  }
  const mysql = await import("mysql2/promise");
  const connection = await mysql.createConnection(authoritativeProductionConnectionOptions());
  let commitAttempted = false;
  let committed = false;
  try {
    if (apply) await connection.beginTransaction();
    else await beginReadOnlyTransaction(connection);
    if (apply) await verifyWriteAssumptions(connection);
    const targetFingerprint = await targetFingerprintFor(connection);
    const { rows, metadata } = await readLiveState(connection, apply);
    const plan = buildPlan(rows, metadata, targetFingerprint);
    console.log(JSON.stringify({
      mode: apply ? "apply-requested" : "live-plan",
      additions: plan.additions.length,
      baselineStoredCount: plan.baselineStoredCount,
      baselineVisibleCount: plan.baselineVisibleCount,
      finalStoredCount: plan.finalStoredCount,
      finalVisibleCount: plan.finalVisibleCount,
      expectedContentVersion: plan.expectedContentVersion,
      targetFingerprint: plan.targetFingerprint,
      planDigest: plan.planDigest,
    }, null, 2));
    if (!apply) {
      await connection.rollback();
      return;
    }

    if (process.env.CONFIRM_CLASS3_APPROVED_CANDIDATE_RELEASE !== plan.planDigest) fail("confirmation digest does not match this exact live plan");
    parsePreflightEvidence(process.env.CLASS3_CANDIDATE_RELEASE_PREFLIGHT, plan.planDigest, plan.targetFingerprint);
    parseBackupEvidence(process.env.CLASS3_CANDIDATE_RELEASE_BACKUP_EVIDENCE, plan.planDigest, plan.targetFingerprint);

    const sql = `INSERT INTO \`questions\` (${QUESTION_FIELDS.map(field => `\`${field}\``).join(",")}) VALUES (${QUESTION_FIELDS.map(() => "?").join(",")})`;
    for (const addition of plan.additions) {
      const values = QUESTION_FIELDS.map(field => approvalValue(field, addition[field]));
      const [result] = await connection.execute(sql, values);
      if (result.affectedRows !== 1) fail(`insert failed for candidate ${addition.questionNum}`);
    }
    const [metadataUpdate] = await connection.execute(
      "UPDATE `question_bank_meta` SET `totalQuestions`=?, `contentVersion`=`contentVersion`+1 WHERE `bankKey`=? AND `totalQuestions`=? AND `contentVersion`=?",
      [FINAL_STORED_COUNT, BANK, BASELINE_STORED_COUNT, Number(metadata.contentVersion)],
    );
    if (metadataUpdate.affectedRows !== 1) fail("Class 3 metadata update did not affect exactly one row");

    const [postRows] = await connection.execute("SELECT * FROM `questions` WHERE `bankKey`=? ORDER BY `questionNum`", [BANK]);
    const [postMetadataRows] = await connection.execute("SELECT * FROM `question_bank_meta` WHERE `bankKey`=?", [BANK]);
    if (postRows.length !== FINAL_STORED_COUNT || postMetadataRows.length !== 1 || Number(postMetadataRows[0].totalQuestions) !== FINAL_STORED_COUNT) {
      fail("post-write stored inventory does not equal 821");
    }
    if (Number(postMetadataRows[0].contentVersion) !== plan.expectedContentVersion) fail("post-write Class 3 metadata version did not increment exactly once");
    const [visibleRows] = await connection.execute(
      "SELECT COUNT(*) AS count FROM `questions` WHERE `bankKey`=? AND `reviewStatus` NOT IN ('in_review','rejected')",
      [BANK],
    );
    if (Number(visibleRows[0]?.count) !== FINAL_STORED_COUNT) fail("post-write learner-visible inventory does not equal 821 under the learner SQL predicate");
    const postByNumber = new Map(postRows.map(row => [Number(row.questionNum), row]));
    for (const expected of plan.additions) {
      if (JSON.stringify(questionPayload(postByNumber.get(expected.questionNum))) !== JSON.stringify(questionPayload(expected))) {
        fail(`post-write content mismatch for candidate ${expected.questionNum}`);
      }
    }
    assertBaselinePreserved(postRows, plan.baseline);
    commitAttempted = true;
    await connection.commit();
    committed = true;
    console.log("Committed 250 approved Class 3 candidates. Stored and learner-visible inventory is now 821.");
  } catch (error) {
    if (!commitAttempted) await connection.rollback();
    if (commitAttempted && !committed) {
      throw new Error(`Class 3 candidate release commit outcome is uncertain. Do not retry. Run a read-only reconciliation before any further write. Original error: ${error instanceof Error ? error.message : String(error)}`);
    }
    throw error;
  } finally {
    await connection.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await run();
