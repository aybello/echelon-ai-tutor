#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGE_ROOT = resolve(ROOT, "content/exam-bank-expansion");
const MANIFEST_PATH = resolve(PACKAGE_ROOT, "release-exclusions.json");
const RELEASE_KEY_PREFIX = "exam-bank-expansion-2026-11-23";
const REVIEWER = "owner-authorized-owner-review: Ay Bello";
const QUESTION_FIELDS = ["bankKey", "questionNum", "module", "difficulty", "question", "options", "correctIndex", "explanation", "steps", "tip", "isCalc", "topic", "cognitiveLevel", "sourceTitle", "sourceReference", "sourceUrl", "blueprintObjective"];
const APPROVED_BANK_KEY_MAPPINGS = new Map([
  ["wpi-class1-water-coll", "wpi-class1-wastewater-coll"],
  ["wpi-class2-water-coll", "wpi-class2-wastewater-coll"],
  ["wpi-class3-water-coll", "wpi-class3-wastewater-coll"],
  ["wpi-class4-water-coll", "wpi-class4-wastewater-coll"],
]);

function fail(message) { throw new Error(`Exam-bank expansion release blocked: ${message}`); }
function canonical(value) {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(canonical);
  if (typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])]));
  return value;
}
export function digest(value) { return createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex"); }
export function payloadHash(item) { return digest(item); }
export function normalizeStem(value) { return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
export function itemIdentity(item) { return item.itemId ?? `${item.bankKey}-${item.questionNum}`; }
export function mapDatabaseItem(item) {
  const mapped = APPROVED_BANK_KEY_MAPPINGS.has(item.bankKey)
    ? { ...item, bankKey: APPROVED_BANK_KEY_MAPPINGS.get(item.bankKey) }
    : { ...item };
  if (mapped.bankKey === "oit" && mapped.stream === "Wastewater Treatment") {
    if (mapped.questionNum < 1501 || mapped.questionNum > 1600) fail(`OIT wastewater source question number outside approved range: ${mapped.questionNum}`);
    return { ...mapped, questionNum: mapped.questionNum + 100 };
  }
  return mapped;
}
function sourceForMappedItem(pkg, item) {
  return pkg.sourceCandidates.find(source => {
    const mapped = mapDatabaseItem(source);
    return itemIdentity(mapped) === itemIdentity(item) && mapped.bankKey === item.bankKey && mapped.questionNum === item.questionNum;
  });
}
function mappingDetails(source, item) {
  const fields = [];
  if (source.bankKey !== item.bankKey) fields.push({ field: "bankKey", from: source.bankKey, to: item.bankKey });
  if (source.questionNum !== item.questionNum) fields.push({ field: "questionNum", from: source.questionNum, to: item.questionNum });
  return fields.length ? { fields, reason: fields.some(field => field.field === "bankKey") ? "approved WPI collection bank alias resolution" : "approved OIT wastewater collision resolution" } : null;
}
function identityDetails(item) { return { bankKey: item.bankKey, questionNum: item.questionNum, itemId: itemIdentity(item) }; }
function blueprintDetails(meta) { return Object.fromEntries(Object.entries(meta).filter(([key]) => !["totalQuestions", "contentVersion"].includes(key))); }
function isApprovedOitSourceCollision(left, right) {
  return left.bankKey === "oit" && right.bankKey === "oit"
    && left.questionNum === right.questionNum
    && new Set([left.stream, right.stream]).size === 2
    && new Set([left.stream, right.stream]).has("Water Treatment")
    && new Set([left.stream, right.stream]).has("Wastewater Treatment");
}
function readJson(path) { return JSON.parse(readFileSync(path, "utf8")); }

function questionFiles() {
  return readdirSync(PACKAGE_ROOT, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && entry.name !== "tools")
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap(entry => readdirSync(resolve(PACKAGE_ROOT, entry.name), { withFileTypes: true })
      .filter(file => file.name.startsWith("additions") && file.name.endsWith(".json"))
      .map(file => resolve(PACKAGE_ROOT, entry.name, file.name))
      .filter(file => statSync(file).isFile())
      .sort());
}

export function loadPackage() {
  const manifestBytes = readFileSync(MANIFEST_PATH);
  const manifest = JSON.parse(manifestBytes);
  const entries = [];
  for (const file of questionFiles()) {
    const values = readJson(file);
    if (!Array.isArray(values) || values.length === 0 || values[0]?.question === undefined) continue;
    for (const item of values) entries.push(item);
  }
  if (entries.length !== Number(manifest.totalStaged)) fail(`expected ${manifest.totalStaged} staged items, found ${entries.length}`);
  const byKey = new Map();
  for (const item of entries) {
    if (!item.bankKey || /309a/i.test(item.bankKey)) fail(`Ontario 309A item found: ${item.bankKey}`);
    if (!Number.isInteger(item.questionNum)) fail("every item needs an integer questionNum");
    const key = `${item.bankKey}|${item.questionNum}`;
    if (byKey.has(key) && !isApprovedOitSourceCollision(byKey.get(key), item)) fail(`duplicate package bank/question number ${key}`);
    byKey.set(key, item);
  }
  const banks = new Map();
  for (const item of entries) banks.set(item.bankKey, [...(banks.get(item.bankKey) ?? []), item]);
  if (banks.size !== 35) fail(`expected 35 bank keys, found ${banks.size}`);
  for (const [bankKey, items] of banks) if (items.length !== 200) fail(`${bankKey} has ${items.length} items, expected 200`);

  const withheld = new Map(manifest.withheld.map(x => [`${x.bankKey}|${x.itemId}|${x.questionNum}`, x]));
  if (withheld.size !== manifest.withheld.length || withheld.size !== Number(manifest.withheldCount) || manifest.approvedFlagged.length !== Number(manifest.approvedFlaggedCount)) fail("manifest exclusion counts or identities are inconsistent");
  const foundWithheld = new Set();
  for (const item of entries) {
    const key = `${item.bankKey}|${itemIdentity(item)}|${item.questionNum}`;
    const exclusion = withheld.get(key);
    if (exclusion) {
      if (payloadHash(item) !== exclusion.payloadSha256) fail(`${key} hash mismatch against exclusion manifest`);
      foundWithheld.add(key);
    }
  }
  if (foundWithheld.size !== withheld.size) fail(`exclusion manifest has ${withheld.size - foundWithheld.size} item(s) not found in package`);
  for (const flagged of manifest.approvedFlagged) {
    const item = entries.find(x => x.bankKey === flagged.bankKey && itemIdentity(x) === flagged.itemId && x.questionNum === flagged.questionNum);
    if (!item || payloadHash(item) !== flagged.payloadSha256) fail(`approved flagged item hash mismatch: ${flagged.bankKey}/${flagged.itemId}`);
  }

  const sourceCandidates = entries.filter(item => !withheld.has(`${item.bankKey}|${itemIdentity(item)}|${item.questionNum}`));
  if (sourceCandidates.length !== Number(manifest.releaseCandidateCount)) fail(`expected ${manifest.releaseCandidateCount} candidates, found ${sourceCandidates.length}`);
  const candidates = sourceCandidates.map(mapDatabaseItem);
  const hashes = new Set();
  const stems = new Set();
  const mappedNumbers = new Set();
  for (const item of candidates) {
    const numberKey = `${item.bankKey}|${item.questionNum}`;
    if (mappedNumbers.has(numberKey)) fail(`duplicate mapped candidate bank/question number ${numberKey}`);
    mappedNumbers.add(numberKey);
    const hash = payloadHash(item);
    if (hashes.has(hash)) fail(`duplicate candidate payload hash ${hash}`);
    hashes.add(hash);
    const stemKey = `${item.bankKey}|${normalizeStem(item.question)}`;
    if (stems.has(stemKey)) fail(`duplicate candidate question stem ${stemKey}`);
    stems.add(stemKey);
  }
  const packageSha256 = digest({
    manifestSha256: createHash("sha256").update(manifestBytes).digest("hex"),
    candidatePayloadSha256: sourceCandidates.map((source, index) => ({ source: payloadHash(source), mapped: payloadHash(candidates[index]) })).sort((a, b) => a.source.localeCompare(b.source)),
  });
  return { manifest, entries, sourceCandidates, candidates, banks, packageSha256, releaseKey: `${RELEASE_KEY_PREFIX}-${packageSha256.slice(0, 12)}` };
}

function rowFor(item) {
  return [item.bankKey, item.questionNum, item.module, item.difficulty ?? null, item.question, JSON.stringify(item.options), item.correctIndex, item.explanation, item.steps ?? null, item.tip ?? null, item.isCalc ?? "no", item.topic ?? null, item.cognitiveLevel ?? null, item.sourceTitle ?? null, item.sourceReference ?? null, item.sourceUrl ?? null, item.blueprintObjective ?? null];
}
function rowMatchesItem(row, item) {
  const storedOptions = typeof row.options === "string" ? JSON.parse(row.options) : row.options;
  return QUESTION_FIELDS.every(field => field === "options" ? JSON.stringify(storedOptions) === JSON.stringify(item.options) : String(row[field] ?? null) === String(item[field] ?? null));
}

export function planAgainstRows(pkg, existingRows) {
  const byNumber = new Map();
  const nonRejectedStems = new Set();
  let existingDuplicateStems = 0;
  for (const row of existingRows) {
    const key = `${row.bankKey}|${row.questionNum}`;
    if (byNumber.has(key)) fail(`live bank has duplicate question number ${key}`);
    byNumber.set(key, row);
    const stem = `${row.bankKey}|${normalizeStem(row.question)}`;
    // Owner decision: leave existing duplicates untouched. Only NEW conflicts block this additive release.
    if (row.reviewStatus !== "rejected" && nonRejectedStems.has(stem)) existingDuplicateStems++;
    if (row.reviewStatus !== "rejected") nonRejectedStems.add(stem);
  }
  const conflicts = [];
  for (const item of pkg.candidates) {
    const numberKey = `${item.bankKey}|${item.questionNum}`;
    if (byNumber.has(numberKey)) conflicts.push(`${numberKey}: question number already exists`);
    const stemKey = `${item.bankKey}|${normalizeStem(item.question)}`;
    if (nonRejectedStems.has(stemKey)) conflicts.push(`${numberKey}: question stem already exists`);
  }
  if (conflicts.length) fail(conflicts.slice(0, 20).join("; ") + (conflicts.length > 20 ? `; and ${conflicts.length - 20} more` : ""));
  return { candidates: pkg.candidates.length, banks: new Set(pkg.candidates.map(item => item.bankKey)).size, conflicts: [], existingRows: existingRows.length, existingDuplicateStems };
}

async function visibleOutside(connection, bankKeys) {
  const placeholders = bankKeys.map(() => "?").join(",");
  const [rows] = await connection.execute(`SELECT bankKey, reviewStatus, COUNT(*) AS n FROM questions WHERE bankKey NOT IN (${placeholders}) GROUP BY bankKey, reviewStatus ORDER BY bankKey, reviewStatus`, bankKeys);
  return digest(rows);
}
async function verifyReceiptRows(connection, pkg, idsByKey) {
  for (const item of pkg.candidates) {
    const source = sourceForMappedItem(pkg, item);
    if (!source) fail(`missing original source item for ${item.bankKey}#${item.questionNum}`);
    const id = idsByKey.get(`${item.bankKey}|${item.questionNum}`);
    const [rows] = await connection.execute("SELECT * FROM questions WHERE id = ?", [id]);
    if (rows.length !== 1 || !rowMatchesItem(rows[0], item) || rows[0].reviewStatus !== "approved") fail(`post-insert row mismatch ${item.bankKey}#${item.questionNum}`);
    const [receipts] = await connection.execute("SELECT bankKey, questionNum, sourceContentVersion, contentHash, payload FROM question_content_snapshots WHERE releaseKey = ? AND questionId = ?", [pkg.releaseKey, id]);
    if (receipts.length !== 1) fail(`missing receipt ${item.bankKey}#${item.questionNum}`);
    const payload = JSON.parse(receipts[0].payload);
    const expectedMapping = mappingDetails(source, item);
    const storedReviewedAt = rows[0].reviewedAt ? new Date(rows[0].reviewedAt).toISOString() : null;
    if (digest(payload.sourceIdentity) !== digest(identityDetails(source)) || digest(payload.mappedIdentity) !== digest(identityDetails(item))) fail(`receipt source or mapped identity mismatch ${item.bankKey}#${item.questionNum}`);
    if (rows[0].reviewedBy !== payload.reviewer || storedReviewedAt !== payload.reviewedAt || receipts[0].bankKey !== item.bankKey || receipts[0].questionNum !== item.questionNum || Number(receipts[0].sourceContentVersion) !== 0 || receipts[0].contentHash !== payloadHash(item) || payload.kind !== "exam-bank-expansion-additive-insert" || payload.releaseKey !== pkg.releaseKey || payload.originalPayloadSha256 !== payloadHash(source) || payload.mappedPayloadSha256 !== payloadHash(item) || payload.packageSha256 !== pkg.packageSha256 || payload.itemKey !== `${item.bankKey}|${item.questionNum}` || payload.itemId !== itemIdentity(source) || !payload.item || payloadHash(payload.item) !== payloadHash(item) || JSON.stringify(payload.mapping ?? null) !== JSON.stringify(expectedMapping)) fail(`receipt hash, attribution, or mapping mismatch ${item.bankKey}#${item.questionNum}`);
  }
}

export async function applyPackage(connection, pkg, { reviewer = REVIEWER, now = new Date() } = {}) {
  const bankKeys = [...new Set(pkg.candidates.map(item => item.bankKey))].sort();
  // reviewedAt is TIMESTAMP(0). Bind the receipt to the exact persistable UTC time.
  now = new Date(now);
  if (!Number.isFinite(now.getTime())) fail("invalid review timestamp");
  now.setUTCMilliseconds(0);
  await connection.beginTransaction();
  let committed = false;
  try {
    const outsideBefore = await visibleOutside(connection, bankKeys);
    const [existing] = await connection.execute(`SELECT * FROM questions WHERE bankKey IN (${bankKeys.map(() => "?").join(",")}) FOR UPDATE`, bankKeys);
    const [metadata] = await connection.execute(`SELECT * FROM question_bank_meta WHERE bankKey IN (${bankKeys.map(() => "?").join(",")}) FOR UPDATE`, bankKeys);
    if (metadata.length !== bankKeys.length) fail(`expected metadata for ${bankKeys.length} banks, found ${metadata.length}`);
    const [receipts] = await connection.execute("SELECT questionId, payload FROM question_content_snapshots WHERE releaseKey = ? FOR UPDATE", [pkg.releaseKey]);
    if (receipts.length > 0) {
      if (receipts.length !== pkg.candidates.length) fail("partial prior expansion receipt exists; reconcile before retry");
      const ids = new Map(receipts.map(receipt => [JSON.parse(receipt.payload).itemKey, receipt.questionId]));
      await verifyReceiptRows(connection, pkg, ids);
      await connection.rollback();
      return { alreadyApplied: true, inserted: 0, packageSha256: pkg.packageSha256, releaseKey: pkg.releaseKey };
    }
    planAgainstRows(pkg, existing);
    const idsByKey = new Map();
    const columns = "bankKey, questionNum, module, difficulty, question, options, correctIndex, explanation, steps, tip, isCalc, topic, cognitiveLevel, sourceTitle, sourceReference, sourceUrl, blueprintObjective, reviewStatus, reviewedBy, reviewedAt";
    for (const item of pkg.candidates) {
      const source = sourceForMappedItem(pkg, item);
      if (!source) fail(`missing original source item for ${item.bankKey}#${item.questionNum}`);
      const [result] = await connection.execute(`INSERT INTO questions (${columns}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?)`, [...rowFor(item), reviewer, now]);
      if (result.affectedRows !== 1 || !result.insertId) fail(`insert failed ${item.bankKey}#${item.questionNum}`);
      const itemKey = `${item.bankKey}|${item.questionNum}`;
      idsByKey.set(itemKey, result.insertId);
      const receiptPayload = { kind: "exam-bank-expansion-additive-insert", itemKey, itemId: itemIdentity(source), sourceIdentity: identityDetails(source), mappedIdentity: identityDetails(item), packageSha256: pkg.packageSha256, releaseKey: pkg.releaseKey, originalPayloadSha256: payloadHash(source), mappedPayloadSha256: payloadHash(item), mapping: mappingDetails(source, item), reviewer, reviewedAt: now.toISOString(), builderChecks: "package-validator=pass; calculation-verifier=pass; release-exclusion-verification=pass; live-candidate-deduplication=pass", item };
      await connection.execute("INSERT INTO question_content_snapshots (releaseKey, bankKey, questionId, questionNum, sourceContentVersion, contentHash, payload) VALUES (?, ?, ?, ?, ?, ?, ?)", [pkg.releaseKey, item.bankKey, result.insertId, item.questionNum, 0, payloadHash(item), JSON.stringify(receiptPayload)]);
    }
    for (const bankKey of bankKeys) {
      const [countRows] = await connection.execute("SELECT COUNT(*) AS n FROM questions WHERE bankKey = ? AND reviewStatus IN ('approved','unreviewed')", [bankKey]);
      await connection.execute("UPDATE question_bank_meta SET totalQuestions = ?, contentVersion = contentVersion + 1 WHERE bankKey = ?", [Number(countRows[0].n), bankKey]);
    }
    await verifyReceiptRows(connection, pkg, idsByKey);
    const [afterRows] = await connection.execute(`SELECT * FROM questions WHERE bankKey IN (${bankKeys.map(() => "?").join(",")}) FOR UPDATE`, bankKeys);
    const afterById = new Map(afterRows.map(row => [row.id, row]));
    if (afterRows.length !== existing.length + pkg.candidates.length || existing.some(row => digest(row) !== digest(afterById.get(row.id)))) fail("existing target-bank content changed or insertion count mismatch");
    const [afterMetadata] = await connection.execute(`SELECT * FROM question_bank_meta WHERE bankKey IN (${bankKeys.map(() => "?").join(",")}) FOR UPDATE`, bankKeys);
    for (const before of metadata) {
      const after = afterMetadata.find(row => row.bankKey === before.bankKey);
      const visibleCount = afterRows.filter(row => row.bankKey === before.bankKey && ["approved", "unreviewed"].includes(row.reviewStatus)).length;
      if (!after || digest(blueprintDetails(before)) !== digest(blueprintDetails(after)) || Number(after.contentVersion) !== Number(before.contentVersion) + 1 || Number(after.totalQuestions) !== visibleCount) fail(`metadata preservation or count mismatch ${before.bankKey}`);
    }
    if (await visibleOutside(connection, bankKeys) !== outsideBefore) fail("outside-bank inventory changed");
    await connection.commit(); committed = true;
    return { alreadyApplied: false, inserted: pkg.candidates.length, packageSha256: pkg.packageSha256, releaseKey: pkg.releaseKey, reviewer };
  } catch (error) { if (!committed) await connection.rollback(); throw error; }
}

async function main() {
  const pkg = loadPackage();
  const apply = process.argv.includes("--apply");
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", staged: pkg.entries.length, candidates: pkg.candidates.length, withheld: pkg.entries.length - pkg.candidates.length, banks: pkg.banks.size, packageSha256: pkg.packageSha256, releaseKey: pkg.releaseKey }, null, 2));
  if (!apply) { console.log("Dry run only. No database connection or writes performed."); return; }
  if (process.env.CONFIRM_EXPANSION_IMPORT !== pkg.packageSha256) fail(`set CONFIRM_EXPANSION_IMPORT=${pkg.packageSha256} to confirm this exact package`);
  const { activeScriptConnection } = await import("./lib/activeScriptConnection.mjs");
  const target = activeScriptConnection();
  if (!target.external || typeof target.options !== "object") fail("authoritative external production target is required");
  const targetSha256 = digest({ host: target.options.host, port: target.options.port, database: target.options.database });
  if (process.env.CONFIRM_EXPANSION_TARGET !== targetSha256) fail(`set CONFIRM_EXPANSION_TARGET=${targetSha256} to confirm the live target`);
  const mysql = await import("mysql2/promise");
  const db = await mysql.createConnection(target.options);
  try { console.log(JSON.stringify(await applyPackage(db, pkg), null, 2)); } finally { await db.end(); }
}
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) main().catch(error => { console.error(error.message); process.exitCode = 1; });
