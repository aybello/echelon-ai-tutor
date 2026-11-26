#!/usr/bin/env node
// Exam bank gap-to-1000 additive release tooling.
//
// This is a self-contained sibling of scripts/exam-bank-expansion-release.mjs.
// It serves only the content/exam-bank-gap-1000 package. It does not import
// from, modify, or reuse the approval artifacts of the earlier package: no
// release-exclusions.json is read, the release key is derived from this
// package alone, and an apply run is confirmed only against this package's
// own packageSha256 and target digest.
//
// Package facts this loader binds to, all read from the package itself:
//   - MANIFEST.json lists exactly 26 banks whose requested counts sum to
//     exactly 5,442 (manifest.totalRequested must agree).
//   - Each bank folder (named by the manifest courseKey) holds additions.json
//     whose item count must equal that bank's requested count.
//   - Every item already carries its canonical bank key, which is the
//     manifest itemBankKey for its bank. Alias forms such as
//     wpi-class1-water-coll in place of wpi-class1-wastewater-coll fail.
//   - Per-bank review receipts live at receipts/<courseKey>.receipt.json and
//     bind every item by itemId, questionNum and payloadSha256.
//   - A per-item payload hash is the SHA-256 of the canonical JSON form of
//     the item (sorted keys, no spaces), matching the digest() semantics of
//     the earlier release script.
//   - A per-bank package hash is the SHA-256 of the concatenation of the
//     per-item payload hash hex strings, ordered by questionNum ascending,
//     matching tools/receipts.py in the package.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_PACKAGE_ROOT = resolve(ROOT, "content/exam-bank-gap-1000");
const RELEASE_KEY_PREFIX = "exam-bank-gap-1000-2026-11-23";
const EXPECTED_BANK_COUNT = 26;
const EXPECTED_TOTAL_REQUESTED = 5442;
const QUESTION_FIELDS = ["bankKey", "questionNum", "module", "difficulty", "question", "options", "correctIndex", "explanation", "steps", "tip", "isCalc", "topic", "cognitiveLevel", "sourceTitle", "sourceReference", "sourceUrl", "blueprintObjective"];
const verifiedPackages = new WeakMap();

function fail(message) { throw new Error(`Exam-bank gap-1000 release blocked: ${message}`); }
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
function identityDetails(item) { return { bankKey: item.bankKey, questionNum: item.questionNum, itemId: itemIdentity(item) }; }
function blueprintDetails(meta) { return Object.fromEntries(Object.entries(meta).filter(([key]) => !["totalQuestions", "contentVersion"].includes(key))); }
function readJson(path) { return JSON.parse(readFileSync(path, "utf8")); }

export function resolvePackageRoot(explicitRoot) {
  if (explicitRoot) return resolve(explicitRoot);
  if (process.env.GAP1000_PACKAGE_ROOT) return resolve(process.env.GAP1000_PACKAGE_ROOT);
  return DEFAULT_PACKAGE_ROOT;
}

// Per-bank package hash, exactly as the package receipts were generated:
// SHA-256 over the concatenated per-item payload hash hex strings, with the
// items ordered by questionNum ascending.
export function bankPackageHash(items) {
  const ordered = [...items].sort((a, b) => a.questionNum - b.questionNum);
  return createHash("sha256").update(ordered.map(item => payloadHash(item)).join("")).digest("hex");
}

function packageStateHash(pkg) {
  return digest({ manifest: pkg.manifest, manifestSha256: pkg.manifestSha256, candidates: pkg.candidates, perBank: pkg.perBank, bankPackageSha256: pkg.bankPackageSha256, reviewEvidence: pkg.reviewEvidence, receiptVerification: pkg.receiptVerification, packageSha256: pkg.packageSha256, releaseKey: pkg.releaseKey });
}

function verifyIndependentReceipts(packageRoot) {
  const verifier = resolve(packageRoot, "tools/verify_receipts.py");
  if (!existsSync(verifier)) fail("independent receipt verifier is missing");
  const result = spawnSync("python3", ["-B", verifier], {
    cwd: packageRoot,
    env: { ...process.env, GAP_DEDUP_BANKS_DIR: resolve(ROOT, "content"), GAP_DEDUP_NOV22_DIR: resolve(ROOT, "content/exam-bank-expansion") },
    encoding: "utf8", timeout: 300_000, maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error || result.status !== 0 || !String(result.stdout).includes(`VERDICT: PASS (all ${EXPECTED_BANK_COUNT} bank receipts verified)`)) {
    fail(`independent receipt verification failed: ${(result.error?.message || result.stderr || result.stdout || `exit ${result.status}`).slice(-6000)}`);
  }
  return { checker: "verify_receipts.py", checkerSha256: createHash("sha256").update(readFileSync(verifier)).digest("hex"), banksVerified: EXPECTED_BANK_COUNT };
}

export function loadGapPackage(explicitRoot) {
  const packageRoot = resolvePackageRoot(explicitRoot);
  const manifestPath = resolve(packageRoot, "MANIFEST.json");
  if (!existsSync(manifestPath)) fail(`manifest not found at ${manifestPath}`);
  const manifestBytes = readFileSync(manifestPath);
  const manifest = JSON.parse(manifestBytes);
  if (!Array.isArray(manifest.banks)) fail("manifest has no banks list");
  if (manifest.banks.length !== EXPECTED_BANK_COUNT) fail(`expected ${EXPECTED_BANK_COUNT} banks in manifest, found ${manifest.banks.length}`);
  if (Number(manifest.totalRequested) !== EXPECTED_TOTAL_REQUESTED) fail(`manifest totalRequested is ${manifest.totalRequested}, expected ${EXPECTED_TOTAL_REQUESTED}`);
  const requestedSum = manifest.banks.reduce((sum, bank) => sum + Number(bank.requested ?? 0), 0);
  if (requestedSum !== Number(manifest.totalRequested)) fail(`manifest requested counts sum to ${requestedSum}, manifest totalRequested is ${manifest.totalRequested}`);

  const entries = [];
  const candidates = [];
  const banks = new Map();
  const perBank = {};
  const bankPackageSha256 = {};
  const reviewEvidence = {};
  const receiptHashes = {};
  const seenNumbers = new Set();
  const seenHashes = new Set();

  for (const bank of manifest.banks) {
    const courseKey = bank.courseKey;
    const itemBankKey = bank.itemBankKey;
    const requested = Number(bank.requested);
    if (typeof courseKey !== "string" || !/^[a-z0-9-]+$/.test(courseKey) || typeof itemBankKey !== "string" || !/^[a-z0-9-]+$/.test(itemBankKey)) fail("every manifest bank needs safe courseKey and itemBankKey identifiers");
    if (!Number.isInteger(requested) || requested <= 0) fail(`${courseKey} has an invalid requested count ${bank.requested}`);
    if (/309a/i.test(courseKey) || /309a/i.test(itemBankKey)) fail(`Ontario 309A bank found in manifest: ${courseKey}/${itemBankKey}`);
    if (banks.has(itemBankKey)) fail(`duplicate manifest item bank key ${itemBankKey}`);

    const additionsPath = resolve(packageRoot, courseKey, "additions.json");
    if (!existsSync(additionsPath)) fail(`additions file not found for ${courseKey}`);
    const items = readJson(additionsPath);
    if (!Array.isArray(items)) fail(`${courseKey} additions file is not an array`);
    if (items.length !== requested) fail(`${courseKey} has ${items.length} items, manifest requested ${requested}`);

    const receiptPath = resolve(packageRoot, "receipts", `${courseKey}.receipt.json`);
    if (!existsSync(receiptPath)) fail(`missing review receipt for ${courseKey}`);
    const receipt = readJson(receiptPath);
    receiptHashes[courseKey] = digest(receipt);
    if (receipt.courseKey !== courseKey) fail(`receipt courseKey mismatch for ${courseKey}`);
    if (receipt.itemBankKey !== itemBankKey) fail(`receipt itemBankKey mismatch for ${courseKey}: ${receipt.itemBankKey} versus manifest ${itemBankKey}`);
    if (!Array.isArray(receipt.items) || receipt.items.length !== requested) fail(`receipt item count mismatch for ${courseKey}`);
    if (!receipt.counts || Number(receipt.counts.requested) !== requested) fail(`receipt requested count mismatch for ${courseKey}`);
    if (Number(receipt.counts.accepted) !== requested) fail(`receipt accepted count mismatch for ${courseKey}`);
    if (!Array.isArray(receipt.counts.withheld) || receipt.counts.withheld.length !== 0) fail(`receipt for ${courseKey} must record an empty withheld list`);
    if (!receipt.reviewer || !receipt.model || !receipt.reviewDateUtc || !receipt.sourceBranch || !receipt.baseCommit) fail(`missing review provenance for ${courseKey}`);
    if (!receipt.checks || typeof receipt.checks !== "object" || !receipt.bindings || typeof receipt.bindings !== "object") fail(`missing structured review evidence for ${courseKey}`);
    reviewEvidence[itemBankKey] = {
      receiptSha256: digest(receipt),
      sourceReview: { reviewer: receipt.reviewer, model: receipt.model, reviewedAt: receipt.reviewDateUtc, sourceBranch: receipt.sourceBranch, baseCommit: receipt.baseCommit },
      checks: receipt.checks, bindings: receipt.bindings, counts: receipt.counts,
    };

    const receiptByItemId = new Map();
    const receiptByNumber = new Map();
    for (const record of receipt.items) {
      if (receiptByItemId.has(record.itemId) || receiptByNumber.has(record.questionNum)) fail(`duplicate receipt record in ${courseKey}`);
      receiptByItemId.set(record.itemId, record);
      receiptByNumber.set(record.questionNum, record);
    }

    const stems = new Set();
    for (const item of items) {
      if (!item || typeof item !== "object") fail(`${courseKey} contains a non-object item`);
      if (/309a/i.test(String(item.bankKey ?? ""))) fail(`Ontario 309A item found: ${item.bankKey}`);
      if (!Number.isInteger(item.questionNum)) fail(`${courseKey} item ${itemIdentity(item)} needs an integer questionNum`);
      if (item.bankKey !== itemBankKey) fail(`${courseKey} item ${itemIdentity(item)} carries bankKey ${item.bankKey}, expected canonical ${itemBankKey}`);
      // Items arrive pre-mapped to their canonical bank key. Anything that
      // would need a mapping is a load-time failure, never a fix-up here.
      const numberKey = `${item.bankKey}|${item.questionNum}`;
      if (seenNumbers.has(numberKey)) fail(`duplicate package bank/question number ${numberKey}`);
      seenNumbers.add(numberKey);
      const hash = payloadHash(item);
      if (seenHashes.has(hash)) fail(`duplicate package payload hash ${hash}`);
      seenHashes.add(hash);
      const stemKey = normalizeStem(item.question);
      if (stems.has(stemKey)) fail(`duplicate question stem within bank ${item.bankKey}: questionNum ${item.questionNum}`);
      stems.add(stemKey);

      const recordById = receiptByItemId.get(itemIdentity(item));
      const recordByNumber = receiptByNumber.get(item.questionNum);
      if (!recordById || recordById !== recordByNumber) fail(`item ${itemIdentity(item)} in ${courseKey} has no matching receipt record`);
      if (recordById.bankKey !== item.bankKey || recordById.questionNum !== item.questionNum) fail(`receipt identity mismatch for ${courseKey} item ${itemIdentity(item)}`);
      if (recordById.payloadSha256 !== hash) fail(`receipt payload hash mismatch for ${courseKey} item ${itemIdentity(item)}`);
    }
    const recomputedBankHash = bankPackageHash(items);
    if (recomputedBankHash !== receipt.packageSha256) fail(`receipt package hash mismatch for ${courseKey}: recomputed ${recomputedBankHash}, receipt ${receipt.packageSha256}`);
    bankPackageSha256[itemBankKey] = recomputedBankHash;

    banks.set(itemBankKey, items);
    perBank[itemBankKey] = items.length;
    entries.push(...items);
    candidates.push(...items);
  }

  if (entries.length !== EXPECTED_TOTAL_REQUESTED) fail(`expected ${EXPECTED_TOTAL_REQUESTED} staged items, found ${entries.length}`);
  if (banks.size !== EXPECTED_BANK_COUNT) fail(`expected ${EXPECTED_BANK_COUNT} bank keys, found ${banks.size}`);

  const manifestSha256 = createHash("sha256").update(manifestBytes).digest("hex");
  const itemBindings = candidates
    .map(item => ({ bankKey: item.bankKey, questionNum: item.questionNum, payloadSha256: payloadHash(item) }))
    .sort((a, b) => a.bankKey.localeCompare(b.bankKey) || a.questionNum - b.questionNum);
  // No DB helper is imported and no connection is opened until this gate passes.
  const receiptVerification = verifyIndependentReceipts(packageRoot);
  // Refuse a receipt/payload change during verification rather than approving a
  // mixture of the pre-verification in-memory package and post-verification files.
  if (createHash("sha256").update(readFileSync(manifestPath)).digest("hex") !== manifestSha256) fail("manifest changed during independent receipt verification");
  for (const bank of manifest.banks) {
    if (digest(readJson(resolve(packageRoot, bank.courseKey, "additions.json"))) !== digest(banks.get(bank.itemBankKey)) || digest(readJson(resolve(packageRoot, "receipts", `${bank.courseKey}.receipt.json`))) !== receiptHashes[bank.courseKey]) fail(`package changed during independent receipt verification: ${bank.courseKey}`);
  }
  const packageSha256 = digest({ manifestSha256, items: itemBindings, reviewEvidence, receiptVerification });
  const pkg = {
    manifest,
    manifestSha256,
    entries,
    candidates,
    banks,
    perBank,
    bankPackageSha256,
    reviewEvidence,
    receiptVerification,
    packageSha256,
    releaseKey: `${RELEASE_KEY_PREFIX}-${packageSha256.slice(0, 12)}`,
    packageRoot,
  };
  verifiedPackages.set(pkg, packageStateHash(pkg));
  return pkg;
}

function rowFor(item) {
  return [item.bankKey, item.questionNum, item.module, item.difficulty ?? null, item.question, JSON.stringify(item.options), item.correctIndex, item.explanation, item.steps ?? null, item.tip ?? null, item.isCalc ?? "no", item.topic ?? null, item.cognitiveLevel ?? null, item.sourceTitle ?? null, item.sourceReference ?? null, item.sourceUrl ?? null, item.blueprintObjective ?? null];
}
function rowMatchesItem(row, item) {
  const storedOptions = typeof row.options === "string" ? JSON.parse(row.options) : row.options;
  return QUESTION_FIELDS.every(field => field === "options" ? JSON.stringify(storedOptions) === JSON.stringify(item.options) : String(row[field] ?? null) === String(item[field] ?? null));
}

export function planAgainstRowsGap(pkg, existingRows) {
  const byNumber = new Map();
  const nonRejectedStems = new Set();
  let existingDuplicateStems = 0;
  for (const row of existingRows) {
    const key = `${row.bankKey}|${row.questionNum}`;
    if (byNumber.has(key)) fail(`live bank has duplicate question number ${key}`);
    byNumber.set(key, row);
    const stem = `${row.bankKey}|${normalizeStem(row.question)}`;
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

function receiptPayloadFor(pkg, item, reviewer, now) {
  const evidence = pkg.reviewEvidence[item.bankKey];
  return {
    kind: "exam-bank-gap-1000-additive-insert",
    itemKey: `${item.bankKey}|${item.questionNum}`,
    itemId: itemIdentity(item),
    sourceIdentity: identityDetails(item),
    mappedIdentity: identityDetails(item),
    packageSha256: pkg.packageSha256,
    bankPackageSha256: pkg.bankPackageSha256[item.bankKey],
    releaseKey: pkg.releaseKey,
    originalPayloadSha256: payloadHash(item),
    mappedPayloadSha256: payloadHash(item),
    mapping: null,
    reviewer,
    reviewedAt: now.toISOString(),
    sourceReview: evidence.sourceReview,
    reviewReceiptSha256: evidence.receiptSha256,
    reviewBindings: evidence.bindings,
    builderChecks: evidence.checks,
    receiptVerification: pkg.receiptVerification,
    item,
  };
}

async function verifyReceiptRowsGap(connection, pkg, idsByKey) {
  for (const item of pkg.candidates) {
    const id = idsByKey.get(`${item.bankKey}|${item.questionNum}`);
    const [rows] = await connection.execute("SELECT * FROM questions WHERE id = ?", [id]);
    if (rows.length !== 1 || !rowMatchesItem(rows[0], item) || rows[0].reviewStatus !== "approved") fail(`post-insert row mismatch ${item.bankKey}#${item.questionNum}`);
    const [receipts] = await connection.execute("SELECT bankKey, questionNum, sourceContentVersion, contentHash, payload FROM question_content_snapshots WHERE releaseKey = ? AND questionId = ?", [pkg.releaseKey, id]);
    if (receipts.length !== 1) fail(`missing receipt ${item.bankKey}#${item.questionNum}`);
    const payload = JSON.parse(receipts[0].payload);
    const storedReviewedAt = rows[0].reviewedAt ? new Date(rows[0].reviewedAt).toISOString() : null;
    if (digest(payload.sourceIdentity) !== digest(identityDetails(item)) || digest(payload.mappedIdentity) !== digest(identityDetails(item))) fail(`receipt source or mapped identity mismatch ${item.bankKey}#${item.questionNum}`);
    const evidence = pkg.reviewEvidence[item.bankKey];
    if (digest(payload.sourceReview) !== digest(evidence.sourceReview) || payload.reviewReceiptSha256 !== evidence.receiptSha256 || digest(payload.reviewBindings) !== digest(evidence.bindings) || digest(payload.builderChecks) !== digest(evidence.checks) || digest(payload.receiptVerification) !== digest(pkg.receiptVerification)) fail(`receipt review evidence mismatch ${item.bankKey}#${item.questionNum}`);
    if (rows[0].reviewedBy !== payload.reviewer || storedReviewedAt !== payload.reviewedAt || receipts[0].bankKey !== item.bankKey || receipts[0].questionNum !== item.questionNum || Number(receipts[0].sourceContentVersion) !== 0 || receipts[0].contentHash !== payloadHash(item) || payload.kind !== "exam-bank-gap-1000-additive-insert" || payload.releaseKey !== pkg.releaseKey || payload.originalPayloadSha256 !== payloadHash(item) || payload.mappedPayloadSha256 !== payloadHash(item) || payload.packageSha256 !== pkg.packageSha256 || payload.bankPackageSha256 !== pkg.bankPackageSha256[item.bankKey] || payload.itemKey !== `${item.bankKey}|${item.questionNum}` || payload.itemId !== itemIdentity(item) || !payload.item || payloadHash(payload.item) !== payloadHash(item) || JSON.stringify(payload.mapping ?? null) !== JSON.stringify(null)) fail(`receipt hash, attribution, or mapping mismatch ${item.bankKey}#${item.questionNum}`);
  }
}

function visibleCounts(rows) {
  const counts = new Map();
  for (const row of rows) if (["approved", "unreviewed"].includes(row.reviewStatus)) counts.set(row.bankKey, (counts.get(row.bankKey) ?? 0) + 1);
  return counts;
}

function verifyBankTotals(pkg, rows, metadata, { pending = false } = {}) {
  const counts = visibleCounts(rows);
  for (const bank of pkg.manifest.banks) {
    const current = counts.get(bank.itemBankKey) ?? 0;
    const projected = current + (pending ? pkg.perBank[bank.itemBankKey] : 0);
    if (projected < 1000) fail(`bank ${bank.itemBankKey} would have ${projected} usable questions, below 1000`);
    if (!pending && Number(metadata.find(meta => meta.bankKey === bank.itemBankKey)?.totalQuestions) !== current) fail(`metadata usable count mismatch ${bank.itemBankKey}`);
  }
}

export async function applyGapPackage(connection, pkg, { reviewer, now = new Date() } = {}) {
  if (!verifiedPackages.has(pkg) || verifiedPackages.get(pkg) !== packageStateHash(pkg)) fail("apply requires an unchanged independently verified package from loadGapPackage");
  if (!reviewer || typeof reviewer !== "string" || !reviewer.trim() || reviewer.length > 320 || reviewer.startsWith("--")) fail("a valid reviewer identity must be supplied at apply time");
  const bankKeys = [...new Set(pkg.candidates.map(item => item.bankKey))].sort();
  if (bankKeys.length !== EXPECTED_BANK_COUNT) fail(`expected ${EXPECTED_BANK_COUNT} target banks, found ${bankKeys.length}`);
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
      if (receipts.length !== pkg.candidates.length) fail("partial prior gap-1000 receipt exists; reconcile before retry");
      const ids = new Map(receipts.map(receipt => [JSON.parse(receipt.payload).itemKey, receipt.questionId]));
      await verifyReceiptRowsGap(connection, pkg, ids);
      verifyBankTotals(pkg, existing, metadata);
      await connection.rollback();
      return { alreadyApplied: true, inserted: 0, packageSha256: pkg.packageSha256, releaseKey: pkg.releaseKey };
    }
    planAgainstRowsGap(pkg, existing);
    verifyBankTotals(pkg, existing, metadata, { pending: true });
    const idsByKey = new Map();
    const columns = "bankKey, questionNum, module, difficulty, question, options, correctIndex, explanation, steps, tip, isCalc, topic, cognitiveLevel, sourceTitle, sourceReference, sourceUrl, blueprintObjective, reviewStatus, reviewedBy, reviewedAt";
    for (const item of pkg.candidates) {
      const [result] = await connection.execute(`INSERT INTO questions (${columns}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?)`, [...rowFor(item), reviewer, now]);
      if (result.affectedRows !== 1 || !result.insertId) fail(`insert failed ${item.bankKey}#${item.questionNum}`);
      const itemKey = `${item.bankKey}|${item.questionNum}`;
      idsByKey.set(itemKey, result.insertId);
      const receiptPayload = receiptPayloadFor(pkg, item, reviewer, now);
      await connection.execute("INSERT INTO question_content_snapshots (releaseKey, bankKey, questionId, questionNum, sourceContentVersion, contentHash, payload) VALUES (?, ?, ?, ?, ?, ?, ?)", [pkg.releaseKey, item.bankKey, result.insertId, item.questionNum, 0, payloadHash(item), JSON.stringify(receiptPayload)]);
    }
    for (const bankKey of bankKeys) {
      const [countRows] = await connection.execute("SELECT COUNT(*) AS n FROM questions WHERE bankKey = ? AND reviewStatus IN ('approved','unreviewed')", [bankKey]);
      await connection.execute("UPDATE question_bank_meta SET totalQuestions = ?, contentVersion = contentVersion + 1 WHERE bankKey = ?", [Number(countRows[0].n), bankKey]);
    }
    await verifyReceiptRowsGap(connection, pkg, idsByKey);
    const [afterRows] = await connection.execute(`SELECT * FROM questions WHERE bankKey IN (${bankKeys.map(() => "?").join(",")}) FOR UPDATE`, bankKeys);
    const afterById = new Map(afterRows.map(row => [row.id, row]));
    if (afterRows.length !== existing.length + pkg.candidates.length || existing.some(row => digest(row) !== digest(afterById.get(row.id)))) fail("existing target-bank content changed or insertion count mismatch");
    const [afterMetadata] = await connection.execute(`SELECT * FROM question_bank_meta WHERE bankKey IN (${bankKeys.map(() => "?").join(",")}) FOR UPDATE`, bankKeys);
    for (const before of metadata) {
      const after = afterMetadata.find(row => row.bankKey === before.bankKey);
      const visibleCount = afterRows.filter(row => row.bankKey === before.bankKey && ["approved", "unreviewed"].includes(row.reviewStatus)).length;
      if (!after || digest(blueprintDetails(before)) !== digest(blueprintDetails(after)) || Number(after.contentVersion) !== Number(before.contentVersion) + 1 || Number(after.totalQuestions) !== visibleCount) fail(`metadata preservation or count mismatch ${before.bankKey}`);
    }
    verifyBankTotals(pkg, afterRows, afterMetadata);
    if (await visibleOutside(connection, bankKeys) !== outsideBefore) fail("outside-bank inventory changed");
    await connection.commit(); committed = true;
    return { alreadyApplied: false, inserted: pkg.candidates.length, packageSha256: pkg.packageSha256, releaseKey: pkg.releaseKey, reviewer };
  } catch (error) { if (!committed) await connection.rollback(); throw error; }
}

function argValue(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

export function gapTargetOptions(target) {
  if (!target.external || !target.options || typeof target.options !== "object" || target.options.ssl?.rejectUnauthorized !== true || !target.options.ssl.ca) fail("authoritative external production target with trusted TLS is required");
  // mysql2 3.24.4 otherwise installs a no-op checkServerIdentity even with
  // rejectUnauthorized=true: CA verification alone does not bind the host.
  return { ...target.options, ssl: { ...target.options.ssl, verifyIdentity: true } };
}

async function main() {
  const pkg = loadGapPackage();
  const apply = process.argv.includes("--apply");
  const usingDefaultRoot = !process.env.GAP1000_PACKAGE_ROOT;
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", packageRoot: usingDefaultRoot ? "content/exam-bank-gap-1000" : pkg.packageRoot, staged: pkg.entries.length, candidates: pkg.candidates.length, withheld: 0, banks: pkg.banks.size, perBank: pkg.perBank, packageSha256: pkg.packageSha256, releaseKey: pkg.releaseKey }, null, 2));
  if (!apply) { console.log("Dry run only. No database connection or writes performed."); return; }
  if (process.env.CONFIRM_GAP1000_IMPORT !== pkg.packageSha256) fail(`set CONFIRM_GAP1000_IMPORT=${pkg.packageSha256} to confirm this exact package`);
  const reviewer = argValue("--reviewer") ?? process.env.GAP1000_REVIEWER;
  if (!reviewer) fail("set GAP1000_REVIEWER or pass --reviewer with the reviewer identity for this apply run");
  const { activeScriptConnection } = await import("./lib/activeScriptConnection.mjs");
  const target = activeScriptConnection();
  const options = gapTargetOptions(target);
  const targetSha256 = digest({ host: options.host, port: options.port, database: options.database });
  if (process.env.CONFIRM_GAP1000_TARGET !== targetSha256) fail(`set CONFIRM_GAP1000_TARGET=${targetSha256} to confirm the live target`);
  const mysql = await import("mysql2/promise");
  const db = await mysql.createConnection(options);
  try { console.log(JSON.stringify(await applyGapPackage(db, pkg, { reviewer }), null, 2)); } finally { await db.end(); }
}
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) main().catch(error => { console.error(error.message); process.exitCode = 1; });
