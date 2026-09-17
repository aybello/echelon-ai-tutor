#!/usr/bin/env node
/**
 * Controlled free-beta release of the existing, source-governed 309A bank.
 *
 * This release uses the already imported 500-question certification bank. It
 * does not make 309A purchasable or Team-assignable. The public practice,
 * flashcards, and mock paths continue to be free beta surfaces only.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { gzipSync, gunzipSync } from "node:zlib";
import mysql from "mysql2/promise";
import { root, validateQuestionBank } from "../lib/309a-question-bank.mjs";

/** Mirrors the stable 309A program identity without requiring a TypeScript loader. */
export const ELECTRICIAN_309A_PROGRAM_KEY = "construction-electrician-309a-on";
export const ELECTRICIAN_309A_BLUEPRINT_VERSION = "red-seal-construction-electrician-current-previous-rsos-2026-08-15";
export const BANK_KEY = "electrician-309a";
export const VERSION_KEY = "309a-current-rsos-v3";
export const RELEASE_KEY = "309a-free-beta-2026-09-17";
export const REVIEWER_IDENTITY = `owner-authorized-release:${RELEASE_KEY}`;
export const EXPECTED_ITEM_COUNT = 500;
const REPOSITORY_ROOT = resolve(import.meta.dirname, "../..");
const CUSTOMER_TABLES = Object.freeze([
  "users", "purchases", "subscriptions", "organizations", "organization_members", "team_flex_orders",
  "team_flex_order_items", "team_flex_licences", "team_flex_extensions", "question_attempts", "exam_results",
  "student_profiles", "trigger_logs", "ai_chat_sessions", "bookmarks", "waitlist", "trial_emails",
]);

function fail(message) { throw new Error(`309A beta release blocked: ${message}`); }
function assert(condition, message) { if (!condition) fail(message); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function canonical(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(canonical);
  if (typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
export function digest(value) { return sha256(JSON.stringify(canonical(value))); }
function safeTableName(name) {
  assert(/^[A-Za-z_][A-Za-z0-9_]*$/.test(name), "unsafe table name");
  return `\`${name}\``;
}
function assertPrivateArtifactPath(pathname, label) {
  const repositoryPrefix = `${REPOSITORY_ROOT}/`;
  assert(pathname !== REPOSITORY_ROOT && !pathname.startsWith(repositoryPrefix), `${label} must remain outside the repository`);
}
function readJson(path, label) {
  try { return JSON.parse(readFileSync(path, "utf8")); }
  catch (error) { fail(`${label} cannot be read: ${error instanceof Error ? error.message : String(error)}`); }
}

export function loadExpectedPackage() {
  const allocationPath = resolve(root, "content/309a/309a-allocation.json");
  const sourceManifestPath = resolve(root, "content/309a/current-exam-source-manifest.json");
  const allocationBytes = readFileSync(allocationPath);
  const sourceManifestBytes = readFileSync(sourceManifestPath);
  const allocation = JSON.parse(allocationBytes);
  const sourceManifest = JSON.parse(sourceManifestBytes);
  const validation = validateQuestionBank({ batchFilter: null });
  assert(validation.errors.length === 0, `source package validation failed: ${validation.errors.join("; ")}`);
  assert(validation.questions.length === EXPECTED_ITEM_COUNT, `source package has ${validation.questions.length} questions; expected ${EXPECTED_ITEM_COUNT}`);
  const expectedByNumber = new Map(validation.questions.map((question) => [Number(question.bankItemNumber), question.contentHash]));
  assert(expectedByNumber.size === EXPECTED_ITEM_COUNT, "source package item identities are not unique");
  return {
    allocation,
    sourceManifest,
    expectedByNumber,
    allocationChecksum: sha256(allocationBytes),
    sourceManifestChecksum: sha256(sourceManifestBytes),
    manifestChecksum: sha256(Buffer.concat([
      allocationBytes,
      sourceManifestBytes,
      Buffer.from(validation.questions.map((question) => question.contentHash).sort().join("")),
    ])),
  };
}

export function buildReleasePlan(state, expected) {
  assert(state.bank, "certification bank version is missing");
  const bank = state.bank;
  assert(bank.programKey === ELECTRICIAN_309A_PROGRAM_KEY, "bank belongs to a different program");
  assert(bank.bankKey === BANK_KEY && bank.versionKey === VERSION_KEY, "bank identity is not the expected 309A bank version");
  assert(bank.blueprintVersion === ELECTRICIAN_309A_BLUEPRINT_VERSION, "bank uses an unexpected blueprint version");
  assert(Number(bank.itemTarget) === EXPECTED_ITEM_COUNT, "bank item target is not 500");
  assert(bank.allocationChecksum === expected.allocationChecksum, "stored allocation checksum does not match the governed source package");
  assert(bank.sourceManifestChecksum === expected.sourceManifestChecksum, "stored source manifest checksum does not match the governed source package");
  assert(Number(bank.commercialEligibility) === 0 && Number(bank.teamEligibility) === 0, "309A must remain non-commercial and non-Team-assignable");
  assert(Array.isArray(state.questions) && state.questions.length === EXPECTED_ITEM_COUNT, "bank must contain exactly 500 stored certification questions");
  const currentByNumber = new Map(state.questions.map((row) => [Number(row.bankItemNumber), row]));
  assert(currentByNumber.size === EXPECTED_ITEM_COUNT, "stored 309A item identities are not unique");
  for (const [itemNumber, hash] of expected.expectedByNumber) {
    const current = currentByNumber.get(itemNumber);
    assert(current && current.contentHash === hash, `stored item ${itemNumber} does not match the governed source package`);
  }
  assert(state.questions.every((row) => row.sourceKey && row.rightsBasis === "public_official_reference"), "every 309A item must retain a public official source");
  const expectedSources = new Set(expected.sourceManifest.sources.map((source) => source.id));
  assert(state.questions.every((row) => expectedSources.has(row.sourceKey)), "stored 309A content references an unknown source");
  const allDraft = state.questions.every((row) => row.contentStatus === "draft" && Number(row.publicEligibility) === 0);
  const allBeta = state.questions.every((row) => row.contentStatus === "beta_approved" && Number(row.publicEligibility) === 1);
  const betaBank = bank.releaseChannel === "beta" && Number(bank.active) === 1;
  if (allBeta && betaBank) {
    return {
      status: "already_released",
      confirmationDigest: digest({ releaseKey: RELEASE_KEY, manifestChecksum: expected.manifestChecksum, current: state.questions.map((row) => [row.bankItemNumber, row.contentHash]).sort((a, b) => a[0] - b[0]) }),
    };
  }
  assert(bank.releaseChannel === "internal" && Number(bank.active) === 0, "bank is neither untouched internal nor the exact completed beta release");
  assert(allDraft, "all 309A items must remain in untouched draft state before beta release");
  assert(Number(state.existingReleaseReviewCount) === 0, "beta-release review records already exist; reconcile before release");
  return {
    status: "ready",
    confirmationDigest: digest({
      releaseKey: RELEASE_KEY,
      manifestChecksum: expected.manifestChecksum,
      allocationChecksum: expected.allocationChecksum,
      sourceManifestChecksum: expected.sourceManifestChecksum,
      itemHashes: state.questions.map((row) => [row.bankItemNumber, row.contentHash]).sort((a, b) => a[0] - b[0]),
    }),
  };
}

async function verifyRequiredTables(connection) {
  const names = ["certification_bank_versions", "certification_questions", "certification_content_reviews", "certification_sources", ...CUSTOMER_TABLES];
  const [rows] = await connection.execute(
    `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (${names.map(() => "?").join(",")})`,
    names,
  );
  const present = new Set(rows.map((row) => row.TABLE_NAME));
  for (const name of names) assert(present.has(name), `required table ${name} is missing`);
}
async function customerTableCounts(connection) {
  const counts = {};
  for (const table of CUSTOMER_TABLES) {
    const [rows] = await connection.execute(`SELECT COUNT(*) AS count FROM ${safeTableName(table)}`);
    counts[table] = Number(rows[0]?.count ?? 0);
  }
  return counts;
}
async function readLockedState(connection) {
  const [banks] = await connection.execute(
    "SELECT * FROM `certification_bank_versions` WHERE `programKey`=? AND `bankKey`=? AND `versionKey`=? FOR UPDATE",
    [ELECTRICIAN_309A_PROGRAM_KEY, BANK_KEY, VERSION_KEY],
  );
  assert(banks.length <= 1, "multiple bank-version records exist");
  const bank = banks[0] ?? null;
  const [questions] = bank
    ? await connection.execute(
      `SELECT q.id, q.bankItemNumber, q.contentHash, q.contentStatus, q.publicEligibility, q.authorIdentity, s.sourceKey, s.rightsBasis
       FROM certification_questions q INNER JOIN certification_sources s ON s.id=q.sourceId
       WHERE q.bankVersionId=? ORDER BY q.bankItemNumber FOR UPDATE`,
      [bank.id],
    )
    : [[]];
  const [reviews] = bank
    ? await connection.execute(
      "SELECT COUNT(*) AS count FROM `certification_content_reviews` WHERE `bankVersionId`=? AND `reviewType`='beta_release' FOR UPDATE",
      [bank.id],
    )
    : [[{ count: 0 }]];
  return { bank, questions, existingReleaseReviewCount: Number(reviews[0]?.count ?? 0) };
}
function snapshotForBackup(state) {
  return {
    releaseKey: RELEASE_KEY,
    bank: state.bank ? {
      id: state.bank.id,
      releaseChannel: state.bank.releaseChannel,
      active: state.bank.active,
      commercialEligibility: state.bank.commercialEligibility,
      teamEligibility: state.bank.teamEligibility,
    } : null,
    questions: state.questions.map((row) => ({
      id: row.id,
      bankItemNumber: row.bankItemNumber,
      contentHash: row.contentHash,
      contentStatus: row.contentStatus,
      publicEligibility: row.publicEligibility,
    })),
    betaReleaseReviewCount: state.existingReleaseReviewCount,
  };
}
function encryptBackup(snapshot, key) {
  assert(Buffer.isBuffer(key) && key.length === 32, "backup key must be 32 bytes");
  const plaintext = gzipSync(Buffer.from(JSON.stringify(snapshot)));
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return { encrypted: Buffer.concat([Buffer.from("ECL3"), iv, cipher.getAuthTag(), ciphertext]), compressedPlaintextSha256: sha256(plaintext) };
}
function decryptBackup(encrypted, key) {
  assert(Buffer.isBuffer(key) && key.length === 32, "backup key must be 32 bytes");
  assert(encrypted.subarray(0, 4).toString("utf8") === "ECL3", "invalid beta release backup header");
  const decipher = createDecipheriv("aes-256-gcm", key, encrypted.subarray(4, 16));
  decipher.setAuthTag(encrypted.subarray(16, 32));
  return JSON.parse(gunzipSync(Buffer.concat([decipher.update(encrypted.subarray(32)), decipher.final()])).toString("utf8"));
}
function writePrivate(pathname, data) {
  mkdirSync(dirname(pathname), { recursive: true, mode: 0o700 });
  writeFileSync(pathname, data, { mode: 0o600 });
}
function createVerifiedBackup(state, reportPath, key) {
  const snapshot = snapshotForBackup(state);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const path = resolve(dirname(reportPath), "backups", `pre-309a-beta-release-${stamp}.json.gz.enc`);
  const { encrypted, compressedPlaintextSha256 } = encryptBackup(snapshot, key);
  writePrivate(path, encrypted);
  assert(digest(decryptBackup(readFileSync(path), key)) === digest(snapshot), "encrypted 309A backup restore rehearsal failed");
  return {
    encryptedPath: path,
    encryptedSha256: sha256(encrypted),
    compressedPlaintextSha256,
    keyFingerprint: sha256(key).slice(0, 16),
    keyStorage: "operator-controlled private escrow",
    restoreRehearsal: "passed",
  };
}
async function applyPlan(connection, state) {
  const [questions] = await connection.execute(
    "UPDATE `certification_questions` SET `contentStatus`='beta_approved', `publicEligibility`=TRUE WHERE `bankVersionId`=? AND `contentStatus`='draft' AND `publicEligibility`=FALSE",
    [state.bank.id],
  );
  assert(Number(questions.affectedRows) === EXPECTED_ITEM_COUNT, `question promotion affected ${questions.affectedRows}; expected ${EXPECTED_ITEM_COUNT}`);
  const [bank] = await connection.execute(
    "UPDATE `certification_bank_versions` SET `releaseChannel`='beta', `active`=TRUE, `publishedAt`=CURRENT_TIMESTAMP WHERE `id`=? AND `releaseChannel`='internal' AND `active`=FALSE AND `commercialEligibility`=FALSE AND `teamEligibility`=FALSE",
    [state.bank.id],
  );
  assert(Number(bank.affectedRows) === 1, "bank beta activation did not affect exactly one record");
  for (const question of state.questions) {
    await connection.execute(
      `INSERT INTO certification_content_reviews
       (bankVersionId, contentKind, contentId, authorIdentity, reviewerIdentity, reviewType, decision, notes)
       VALUES (?, 'question', ?, ?, ?, 'beta_release', 'approved', ?)`,
      [state.bank.id, question.id, question.authorIdentity, REVIEWER_IDENTITY, "Owner-authorized free-beta release. Commercial and Team eligibility remain false."],
    );
  }
}
async function verifyReleasedState(connection, expected, customerCountsBefore) {
  const state = await readLockedState(connection);
  const plan = buildReleasePlan(state, expected);
  assert(plan.status === "already_released", "post-release state is not the exact free beta release");
  const customerCountsAfter = await customerTableCounts(connection);
  assert(digest(customerCountsAfter) === digest(customerCountsBefore), "a protected customer table changed during 309A beta release");
  return { state, customerCountsAfter };
}
function parseArgs(argv) {
  const [mode, ...rest] = argv;
  assert(mode === "preflight" || mode === "apply", "usage requires preflight or apply mode");
  const args = { mode, report: null };
  for (let index = 0; index < rest.length; index += 1) {
    if (rest[index] === "--report") args.report = rest[++index];
    else fail(`unknown argument ${rest[index]}`);
  }
  assert(args.report, "a private --report path is required");
  return args;
}
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const reportPath = resolve(args.report);
  assertPrivateArtifactPath(reportPath, "release report");
  assert(process.env.DATABASE_URL, "DATABASE_URL is required");
  const expected = loadExpectedPackage();
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const report = {
    generatedAtUtc: new Date().toISOString(),
    mode: args.mode,
    releaseKey: RELEASE_KEY,
    scope: {
      programKey: ELECTRICIAN_309A_PROGRAM_KEY,
      bankKey: BANK_KEY,
      versionKey: VERSION_KEY,
      questionCount: EXPECTED_ITEM_COUNT,
      commercialEligibility: false,
      teamEligibility: false,
      productType: "free beta",
      sourceManifestChecksum: expected.sourceManifestChecksum,
      allocationChecksum: expected.allocationChecksum,
      manifestChecksum: expected.manifestChecksum,
    },
  };
  try {
    await connection.beginTransaction();
    await verifyRequiredTables(connection);
    const customerCountsBefore = await customerTableCounts(connection);
    const state = await readLockedState(connection);
    const plan = buildReleasePlan(state, expected);
    report.preflight = { status: plan.status, confirmationDigest: plan.confirmationDigest, protectedCustomerTableCounts: customerCountsBefore };
    if (args.mode === "preflight" || plan.status === "already_released") {
      await connection.rollback();
      writePrivate(reportPath, `${JSON.stringify(report, null, 2)}\n`);
      console.log(JSON.stringify({ mode: args.mode, status: plan.status, report: reportPath, questionCount: EXPECTED_ITEM_COUNT, confirmationDigest: plan.confirmationDigest }));
      return;
    }
    assert(process.env.CONFIRM_309A_BETA_RELEASE === plan.confirmationDigest, "missing exact CONFIRM_309A_BETA_RELEASE confirmation digest");
    assert(/^[0-9a-fA-F]{64}$/.test(process.env.BETA_309A_RELEASE_BACKUP_KEY_HEX ?? ""), "BETA_309A_RELEASE_BACKUP_KEY_HEX must be a 32-byte hexadecimal key from private escrow");
    const key = Buffer.from(process.env.BETA_309A_RELEASE_BACKUP_KEY_HEX, "hex");
    report.backup = createVerifiedBackup(state, reportPath, key);
    await applyPlan(connection, state);
    const verification = await verifyReleasedState(connection, expected, customerCountsBefore);
    await connection.commit();
    report.transaction = {
      status: "committed",
      questionsPromoted: EXPECTED_ITEM_COUNT,
      betaReviewsInserted: EXPECTED_ITEM_COUNT,
      customerCountsUnchanged: digest(verification.customerCountsAfter) === digest(customerCountsBefore),
    };
    writePrivate(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify({ mode: "apply", status: "released", report: reportPath, questionCount: EXPECTED_ITEM_COUNT, confirmationDigest: plan.confirmationDigest }));
  } catch (error) {
    try { await connection.rollback(); } catch {}
    throw error;
  } finally {
    await connection.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
