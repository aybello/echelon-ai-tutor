import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { bankKeys, normalise, validateBank } from "./class1Networks.mjs";

export const CLASS1_NETWORKS_BASELINE_COUNTS = Object.freeze({
  [bankKeys.distribution]: 716,
  [bankKeys.collection]: 724,
});

export const CLASS1_NETWORKS_RANGE = Object.freeze({ start: 2001, end: 2250 });

export const QUESTION_FIELDS = Object.freeze([
  "id", "bankKey", "questionNum", "module", "difficulty", "question", "options", "correctIndex",
  "explanation", "steps", "tip", "isCalc", "topic", "cognitiveLevel", "sourceTitle",
  "sourceReference", "sourceUrl", "blueprintObjective", "reviewStatus",
]);

export const METADATA_FIELDS = Object.freeze([
  "bankKey", "modules", "moduleTargets", "formulaLinks", "totalQuestions", "contentVersion",
  "blueprintVersion", "minCalcPerMock", "recallTargetPct",
]);

const packageNames = Object.freeze({
  [bankKeys.distribution]: "distribution",
  [bankKeys.collection]: "collection",
});

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function stable(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(stable);
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

export function digest(value) {
  return sha256(JSON.stringify(stable(value)));
}

function safeTableName(value) {
  if (!/^[A-Za-z0-9_]+$/.test(value)) throw new Error(`Unsafe table name: ${value}`);
  return `\`${value}\``;
}

function storedOptions(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") throw new Error("Stored options must be a JSON string or an array.");
  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed)) throw new Error("Stored options must decode to an array.");
  return parsed;
}

export function canonicalQuestion(row) {
  return {
    id: Number(row.id), bankKey: row.bankKey, questionNum: Number(row.questionNum), module: row.module,
    difficulty: row.difficulty ?? null, question: row.question, options: storedOptions(row.options),
    correctIndex: Number(row.correctIndex), explanation: row.explanation, steps: row.steps ?? null,
    tip: row.tip ?? null, isCalc: row.isCalc, topic: row.topic ?? null,
    cognitiveLevel: row.cognitiveLevel ?? null, sourceTitle: row.sourceTitle ?? null,
    sourceReference: row.sourceReference ?? null, sourceUrl: row.sourceUrl ?? null,
    blueprintObjective: row.blueprintObjective ?? null, reviewStatus: row.reviewStatus,
  };
}

export function canonicalMetadata(row) {
  return Object.fromEntries(METADATA_FIELDS.map((field) => [field, row[field] ?? null]));
}

function sortedQuestions(rows) {
  return rows.map(canonicalQuestion).sort((a, b) => a.bankKey.localeCompare(b.bankKey) || a.questionNum - b.questionNum || a.id - b.id);
}

function sortedMetadata(rows) {
  return rows.map(canonicalMetadata).sort((a, b) => a.bankKey.localeCompare(b.bankKey));
}

export function payloadChecksum(manifestBytes, payloads) {
  return createHash("sha256")
    .update(manifestBytes)
    .update(payloads.map((payload) => payload.bytes).reduce((all, bytes) => Buffer.concat([all, bytes]), Buffer.alloc(0)))
    .digest("hex");
}

export function loadClass1NetworksPackage(repoRoot = path.resolve(import.meta.dirname, "../..")) {
  const contentRoot = path.join(repoRoot, "content", "class1-networks");
  const manifestPath = path.join(contentRoot, "manifest.json");
  const manifestBytes = fs.readFileSync(manifestPath);
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  if (manifest.status !== "validated-local-candidate-not-imported") {
    throw new Error(`Unexpected Class 1 package status: ${manifest.status}.`);
  }
  if (manifest.releaseMode !== "additive-exact-batch-after-full-live-bank-reconciliation") {
    throw new Error("Class 1 package release mode is not the governed additive-import mode.");
  }
  if (manifest.numberRange?.start !== CLASS1_NETWORKS_RANGE.start || manifest.numberRange?.end !== CLASS1_NETWORKS_RANGE.end) {
    throw new Error("Class 1 package number range is not the approved 2001–2250 range.");
  }
  if (!Array.isArray(manifest.banks) || manifest.banks.length !== 2) throw new Error("Class 1 package must contain exactly two bank manifests.");

  const seenBanks = new Set();
  const payloads = manifest.banks.map((entry) => {
    const name = packageNames[entry.bankKey];
    if (!name || seenBanks.has(entry.bankKey)) throw new Error(`Invalid or duplicate package bank: ${entry.bankKey}.`);
    seenBanks.add(entry.bankKey);
    if (entry.count !== 250 || entry.calculations !== 50) throw new Error(`Unexpected allocation for ${entry.bankKey}.`);
    const filePath = path.join(contentRoot, entry.file);
    const bytes = fs.readFileSync(filePath);
    if (sha256(bytes) !== entry.sha256) throw new Error(`Payload checksum mismatch for ${entry.bankKey}.`);
    const questions = JSON.parse(bytes.toString("utf8"));
    const validation = validateBank(name, questions);
    if (!validation.valid) throw new Error(`Package validation failed for ${entry.bankKey}: ${validation.errors.join("; ")}`);
    return { ...entry, name, bytes, questions };
  });

  if (seenBanks.size !== Object.keys(CLASS1_NETWORKS_BASELINE_COUNTS).length) throw new Error("Class 1 package banks do not match the approved target banks.");
  return { manifest, manifestBytes, payloads, checksum: payloadChecksum(manifestBytes, payloads) };
}

export function sameCandidateContent(stored, candidate) {
  const row = canonicalQuestion(stored);
  return row.bankKey === candidate.bankKey
    && row.questionNum === Number(candidate.questionNum)
    && row.module === candidate.module
    && row.difficulty === (candidate.difficulty ?? null)
    && row.question === candidate.question
    && JSON.stringify(row.options) === JSON.stringify(candidate.options)
    && row.correctIndex === Number(candidate.correctIndex)
    && row.explanation === candidate.explanation
    && row.steps === (candidate.steps ?? null)
    && row.tip === (candidate.tip ?? null)
    && row.isCalc === candidate.isCalc
    && row.topic === (candidate.topic ?? null)
    && row.cognitiveLevel === (candidate.cognitiveLevel ?? null)
    && row.sourceTitle === (candidate.sourceTitle ?? null)
    && row.sourceReference === (candidate.sourceReference ?? null)
    && row.sourceUrl === (candidate.sourceUrl ?? null)
    && row.blueprintObjective === (candidate.blueprintObjective ?? null);
}

export function planClass1NetworksImport({ payloads, rows, metadata, expectedCounts = CLASS1_NETWORKS_BASELINE_COUNTS }) {
  const errors = [];
  const banks = [];
  const expectedKeys = Object.keys(expectedCounts).sort();
  const targetKeys = payloads.map((payload) => payload.bankKey).sort();
  if (JSON.stringify(expectedKeys) !== JSON.stringify(targetKeys)) errors.push("Target bank set does not match the approved baseline.");

  for (const payload of payloads) {
    const expectedBaselineCount = expectedCounts[payload.bankKey];
    const bankRows = rows.filter((row) => row.bankKey === payload.bankKey);
    const bankMetadata = metadata.filter((row) => row.bankKey === payload.bankKey);
    const rowByNumber = new Map();
    for (const row of bankRows) {
      const number = Number(row.questionNum);
      if (rowByNumber.has(number)) errors.push(`${payload.bankKey}#${number}: duplicate production question number.`);
      rowByNumber.set(number, row);
    }
    if (bankMetadata.length !== 1) errors.push(`${payload.bankKey}: expected one metadata row, found ${bankMetadata.length}.`);
    if (bankMetadata.length === 1 && Number(bankMetadata[0].totalQuestions) !== expectedBaselineCount) {
      errors.push(`${payload.bankKey}: metadata totalQuestions drift (expected ${expectedBaselineCount}, found ${bankMetadata[0].totalQuestions}).`);
    }

    const candidateRows = payload.questions.map((candidate) => ({ candidate, stored: rowByNumber.get(Number(candidate.questionNum)) ?? null }));
    const present = candidateRows.filter((entry) => entry.stored);
    const missing = candidateRows.filter((entry) => !entry.stored);
    const candidateNumbers = new Set(payload.questions.map((question) => Number(question.questionNum)));
    const unexpectedInRange = bankRows.filter((row) => {
      const number = Number(row.questionNum);
      return number >= CLASS1_NETWORKS_RANGE.start && number <= CLASS1_NETWORKS_RANGE.end && !candidateNumbers.has(number);
    });
    if (unexpectedInRange.length) errors.push(`${payload.bankKey}: unexpected production questions occupy the approved additive range.`);

    for (const entry of present) {
      try {
        if (!sameCandidateContent(entry.stored, entry.candidate)) errors.push(`${payload.bankKey}#${entry.candidate.questionNum}: immutable content conflict.`);
      } catch {
        errors.push(`${payload.bankKey}#${entry.candidate.questionNum}: malformed stored options or metadata.`);
      }
    }
    for (const candidate of payload.questions) {
      const candidateStem = normalise(candidate.question);
      const duplicate = bankRows.find((row) => Number(row.questionNum) !== Number(candidate.questionNum) && normalise(row.question) === candidateStem);
      if (duplicate) errors.push(`${payload.bankKey}#${candidate.questionNum}: duplicate stem with deployed #${duplicate.questionNum}.`);
    }

    let state = "blocked";
    if (present.length === 0) {
      if (bankRows.length !== expectedBaselineCount) errors.push(`${payload.bankKey}: production inventory drift (expected ${expectedBaselineCount}, found ${bankRows.length}).`);
      else state = "ready";
    } else if (missing.length) {
      errors.push(`${payload.bankKey}: partial additive batch is not permitted.`);
    } else if (bankRows.length !== expectedBaselineCount + payload.questions.length) {
      errors.push(`${payload.bankKey}: post-import inventory is inconsistent (expected ${expectedBaselineCount + payload.questions.length}, found ${bankRows.length}).`);
    } else {
      const statuses = new Set(present.map((entry) => entry.stored.reviewStatus));
      if (statuses.size !== 1) errors.push(`${payload.bankKey}: candidate rows have mixed review statuses.`);
      else if (statuses.has("in_review")) state = "already_staged";
      else if (["unreviewed", "approved"].includes([...statuses][0])) state = "already_visible";
      else errors.push(`${payload.bankKey}: candidate rows have prohibited status ${[...statuses][0]}.`);
    }

    banks.push({
      bankKey: payload.bankKey, baselineCount: expectedBaselineCount, currentCount: bankRows.length,
      candidateCount: payload.questions.length, presentCount: present.length, missingCount: missing.length,
      state, expectedStagedCount: expectedBaselineCount + payload.questions.length,
    });
  }

  const states = new Set(banks.map((bank) => bank.state));
  const state = errors.length ? "blocked" : states.size === 1 ? [...states][0] : "blocked";
  return { ready: errors.length === 0 && state === "ready", state, errors, banks };
}

function attemptSnapshot(rows) {
  return Object.fromEntries(rows.map((row) => [String(row.questionId), Number(row.attemptCount)]).sort(([a], [b]) => Number(a) - Number(b)));
}

export function createBaseline({ checksum, rows, metadata, attemptRows, capturedAtUtc = new Date().toISOString() }) {
  const questions = sortedQuestions(rows);
  const questionBankMeta = sortedMetadata(metadata);
  const attemptsByQuestionId = attemptSnapshot(attemptRows);
  const expectedBankCounts = Object.fromEntries(Object.entries(CLASS1_NETWORKS_BASELINE_COUNTS));
  const visibleCounts = Object.fromEntries(Object.keys(expectedBankCounts).map((bankKey) => [
    bankKey, questions.filter((row) => row.bankKey === bankKey && ["unreviewed", "approved"].includes(row.reviewStatus)).length,
  ]));
  const payload = {
    schemaVersion: 1,
    capturedAtUtc,
    purpose: "Pre-import full-bank rollback snapshot for the Class 1 Distribution and Collection additive release.",
    packageChecksum: checksum,
    expectedBankCounts,
    visibleCounts,
    questions,
    questionSnapshotChecksum: digest(questions),
    questionBankMeta,
    metadataSnapshotChecksum: digest(questionBankMeta),
    attemptsByQuestionId,
    attemptSnapshotChecksum: digest(attemptsByQuestionId),
  };
  return { ...payload, baselineChecksum: digest(payload) };
}

export function validateBaseline({ baseline, checksum, rows, metadata, attemptRows }) {
  if (!baseline || baseline.schemaVersion !== 1) throw new Error("Invalid Class 1 import baseline schema.");
  if (baseline.packageChecksum !== checksum) throw new Error("Baseline package checksum does not match the exact import package.");
  if (JSON.stringify(baseline.expectedBankCounts) !== JSON.stringify(CLASS1_NETWORKS_BASELINE_COUNTS)) throw new Error("Baseline target counts are not the approved production baseline.");
  const currentQuestions = sortedQuestions(rows);
  const currentMetadata = sortedMetadata(metadata);
  const currentAttempts = attemptSnapshot(attemptRows);
  if (digest(currentQuestions) !== baseline.questionSnapshotChecksum) throw new Error("Production question baseline drift detected after snapshot.");
  if (digest(currentMetadata) !== baseline.metadataSnapshotChecksum) throw new Error("Production metadata baseline drift detected after snapshot.");
  if (digest(currentAttempts) !== baseline.attemptSnapshotChecksum) throw new Error("Learner-attempt aggregate drift detected after snapshot.");
}

function questionSelect(fields, tableSql, suffix = "") {
  return `SELECT ${fields.map((field) => `\`${field}\``).join(", ")} FROM ${tableSql} WHERE \`bankKey\` IN (?, ?) ORDER BY \`bankKey\`, \`questionNum\`${suffix}`;
}

async function readAttemptRows(connection, questionRows, attemptsTableSql) {
  const ids = questionRows.map((row) => Number(row.id));
  if (!ids.length) return [];
  const placeholders = ids.map(() => "?").join(", ");
  const [rows] = await connection.execute(
    `SELECT \`questionId\`, COUNT(*) AS \`attemptCount\` FROM ${attemptsTableSql} WHERE \`questionId\` IN (${placeholders}) GROUP BY \`questionId\` ORDER BY \`questionId\``,
    ids,
  );
  const byId = new Map(rows.map((row) => [Number(row.questionId), Number(row.attemptCount)]));
  return ids.map((questionId) => ({ questionId, attemptCount: byId.get(questionId) ?? 0 }));
}

export async function readClass1NetworksProductionSnapshot({ connection, questionsTable = "questions", metaTable = "question_bank_meta", attemptsTable = "question_attempts", lock = false }) {
  const questionsTableSql = safeTableName(questionsTable);
  const metaTableSql = safeTableName(metaTable);
  const attemptsTableSql = safeTableName(attemptsTable);
  const suffix = lock ? " FOR UPDATE" : "";
  const [rows] = await connection.execute(questionSelect(QUESTION_FIELDS, questionsTableSql, suffix), Object.keys(CLASS1_NETWORKS_BASELINE_COUNTS));
  const [metadata] = await connection.execute(
    `SELECT ${METADATA_FIELDS.map((field) => `\`${field}\``).join(", ")} FROM ${metaTableSql} WHERE \`bankKey\` IN (?, ?) ORDER BY \`bankKey\`${suffix}`,
    Object.keys(CLASS1_NETWORKS_BASELINE_COUNTS),
  );
  const attemptRows = await readAttemptRows(connection, rows, attemptsTableSql);
  return { rows, metadata, attemptRows };
}

export async function stageClass1NetworksPackage({ connection, payloads, checksum, baseline, questionsTable = "questions", metaTable = "question_bank_meta", attemptsTable = "question_attempts", log = console.log }) {
  const questionsTableSql = safeTableName(questionsTable);
  const metaTableSql = safeTableName(metaTable);
  try {
    await connection.beginTransaction();
    const snapshot = await readClass1NetworksProductionSnapshot({ connection, questionsTable, metaTable, attemptsTable, lock: true });
    validateBaseline({ baseline, checksum, ...snapshot });
    const plan = planClass1NetworksImport({ payloads, rows: snapshot.rows, metadata: snapshot.metadata });
    if (!plan.ready) throw new Error(`Class 1 additive import blocked: ${plan.errors.join("; ") || plan.state}`);

    for (const payload of payloads) {
      for (const question of payload.questions) {
        await connection.execute(
          `INSERT INTO ${questionsTableSql}
            (\`bankKey\`, \`questionNum\`, \`module\`, \`difficulty\`, \`question\`, \`options\`, \`correctIndex\`,
             \`explanation\`, \`steps\`, \`tip\`, \`isCalc\`, \`topic\`, \`cognitiveLevel\`, \`sourceTitle\`,
             \`sourceReference\`, \`sourceUrl\`, \`blueprintObjective\`, \`reviewStatus\`)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_review')`,
          [question.bankKey, question.questionNum, question.module, question.difficulty, question.question,
            JSON.stringify(question.options), question.correctIndex, question.explanation, question.steps ?? null,
            question.tip ?? null, question.isCalc, question.topic, question.cognitiveLevel, question.sourceTitle,
            question.sourceReference, question.sourceUrl, question.blueprintObjective],
        );
      }
    }

    for (const row of snapshot.metadata) {
      const [updated] = await connection.execute(
        `UPDATE ${metaTableSql} SET \`totalQuestions\` = ?, \`contentVersion\` = \`contentVersion\` + 1
         WHERE \`bankKey\` = ? AND \`totalQuestions\` = ? AND \`contentVersion\` = ?`,
        [Number(row.totalQuestions), row.bankKey, Number(row.totalQuestions), Number(row.contentVersion)],
      );
      if (updated.affectedRows !== 1) throw new Error(`Concurrent metadata update for ${row.bankKey}.`);
    }

    const postSnapshot = await readClass1NetworksProductionSnapshot({ connection, questionsTable, metaTable, attemptsTable, lock: true });
    const postBanks = [];
    for (const payload of payloads) {
      const rows = postSnapshot.rows.filter((row) => row.bankKey === payload.bankKey);
      const stagedRows = rows.filter((row) => Number(row.questionNum) >= CLASS1_NETWORKS_RANGE.start && Number(row.questionNum) <= CLASS1_NETWORKS_RANGE.end);
      if (rows.length !== CLASS1_NETWORKS_BASELINE_COUNTS[payload.bankKey] + payload.questions.length) {
        throw new Error(`Post-insert inventory mismatch for ${payload.bankKey}.`);
      }
      if (stagedRows.length !== payload.questions.length || stagedRows.some((row) => row.reviewStatus !== "in_review")) {
        throw new Error(`Post-insert review-only staging mismatch for ${payload.bankKey}.`);
      }
      for (const candidate of payload.questions) {
        const stored = stagedRows.find((row) => Number(row.questionNum) === Number(candidate.questionNum));
        if (!stored || !sameCandidateContent(stored, candidate)) {
          throw new Error(`Post-insert stored-content mismatch for ${payload.bankKey}#${candidate.questionNum}.`);
        }
      }
      const visible = rows.filter((row) => ["unreviewed", "approved"].includes(row.reviewStatus)).length;
      if (visible !== baseline.visibleCounts[payload.bankKey]) throw new Error(`Learner-visible count changed during staging for ${payload.bankKey}.`);
      postBanks.push({ bankKey: payload.bankKey, storedCount: rows.length, stagedCount: stagedRows.length, visibleCount: visible });
    }
    const baselineQuestionIds = new Set(Object.keys(baseline.attemptsByQuestionId));
    const existingAttemptRows = postSnapshot.attemptRows.filter((row) => baselineQuestionIds.has(String(row.questionId)));
    if (digest(attemptSnapshot(existingAttemptRows)) !== baseline.attemptSnapshotChecksum) {
      throw new Error("Learner-attempt aggregate changed during staging.");
    }
    await connection.commit();
    const result = { applied: true, mode: "review_only_staging", checksum, baselineChecksum: baseline.baselineChecksum, before: plan, after: { banks: postBanks } };
    log(`Class 1 additive staging complete: ${payloads.reduce((total, payload) => total + payload.questions.length, 0)} questions stored in review only.`);
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}
