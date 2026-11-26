import { normalise } from "./class1Networks.mjs";
import {
  CLASS1_NETWORKS_BASELINE_COUNTS,
  CLASS1_NETWORKS_RANGE,
  digest,
  readClass1NetworksProductionSnapshot,
  sameCandidateContent,
} from "./class1NetworksImporter.mjs";

const learnerVisibleStatuses = new Set(["unreviewed", "approved"]);

/**
 * Inspect both complete target banks and determine whether the exact staged
 * candidate package may be promoted. This is deliberately read-only.
 */
export function planClass1NetworksRelease({ payloads, rows, metadata }) {
  const errors = [];
  const banks = [];
  const expectedKeys = Object.keys(CLASS1_NETWORKS_BASELINE_COUNTS).sort();
  const payloadKeys = payloads.map((payload) => payload.bankKey).sort();
  if (JSON.stringify(payloadKeys) !== JSON.stringify(expectedKeys)) {
    errors.push("Target bank set does not match the approved Class 1 package.");
  }

  for (const payload of payloads) {
    const bankRows = rows.filter((row) => row.bankKey === payload.bankKey);
    const metaRows = metadata.filter((row) => row.bankKey === payload.bankKey);
    const expectedStoredCount = CLASS1_NETWORKS_BASELINE_COUNTS[payload.bankKey] + payload.questions.length;
    const visibleBefore = bankRows.filter((row) => learnerVisibleStatuses.has(row.reviewStatus)).length;
    const candidateByNumber = new Map(payload.questions.map((question) => [Number(question.questionNum), question]));
    const storedByNumber = new Map();

    for (const row of bankRows) {
      const number = Number(row.questionNum);
      if (storedByNumber.has(number)) errors.push(`${payload.bankKey}#${number}: duplicate production question number.`);
      storedByNumber.set(number, row);
    }
    if (bankRows.length !== expectedStoredCount) {
      errors.push(`${payload.bankKey}: stored inventory mismatch (expected ${expectedStoredCount}, found ${bankRows.length}).`);
    }
    if (metaRows.length !== 1) {
      errors.push(`${payload.bankKey}: expected one question-bank metadata row, found ${metaRows.length}.`);
    } else if (Number(metaRows[0].totalQuestions) !== visibleBefore) {
      errors.push(`${payload.bankKey}: learner-visible metadata drift (expected ${visibleBefore}, found ${metaRows[0].totalQuestions}).`);
    }

    let stagedCount = 0;
    let visibleCount = 0;
    for (const question of payload.questions) {
      const label = `${payload.bankKey}#${question.questionNum}`;
      const stored = storedByNumber.get(Number(question.questionNum));
      if (!stored) {
        errors.push(`${label}: staged candidate is missing.`);
        continue;
      }
      try {
        if (!sameCandidateContent(stored, question)) {
          errors.push(`${label}: immutable staged-content conflict.`);
          continue;
        }
      } catch {
        errors.push(`${label}: malformed stored options or metadata.`);
        continue;
      }
      if (stored.reviewStatus === "in_review") stagedCount += 1;
      else if (learnerVisibleStatuses.has(stored.reviewStatus)) visibleCount += 1;
      else errors.push(`${label}: prohibited staged status ${stored.reviewStatus ?? "unknown"}.`);
      const duplicate = bankRows.find((other) =>
        Number(other.questionNum) !== Number(question.questionNum)
        && other.reviewStatus !== "rejected"
        && normalise(other.question) === normalise(question.question),
      );
      if (duplicate) errors.push(`${label}: duplicate stem with deployed #${duplicate.questionNum}.`);
    }

    const unexpectedRangeRows = bankRows.filter((row) => {
      const number = Number(row.questionNum);
      return number >= CLASS1_NETWORKS_RANGE.start
        && number <= CLASS1_NETWORKS_RANGE.end
        && !candidateByNumber.has(number);
    });
    if (unexpectedRangeRows.length) errors.push(`${payload.bankKey}: unexpected question occupies the governed candidate range.`);

    const state = stagedCount === payload.questions.length
      ? "ready"
      : visibleCount === payload.questions.length
        ? "already_visible"
        : "blocked";
    if (stagedCount && visibleCount) errors.push(`${payload.bankKey}: candidate rows have mixed visibility states.`);
    banks.push({
      bankKey: payload.bankKey,
      storedCount: bankRows.length,
      candidateCount: payload.questions.length,
      visibleBefore,
      stagedCount,
      matchingVisible: visibleCount,
      expectedVisibleAfter: visibleBefore + stagedCount,
      state,
      metadataContentVersion: metaRows.length === 1 ? Number(metaRows[0].contentVersion) : null,
    });
  }

  const states = new Set(banks.map((bank) => bank.state));
  const state = errors.length ? "blocked" : states.size === 1 ? [...states][0] : "blocked";
  return {
    ready: errors.length === 0 && state === "ready",
    state,
    errors,
    banks,
    changes: banks.flatMap((bank) => bank.state === "ready"
      ? payloads.find((payload) => payload.bankKey === bank.bankKey).questions.map((question) => ({ bankKey: bank.bankKey, questionNum: question.questionNum }))
      : []),
  };
}

/**
 * Lock both full target banks and promote only exact, independently reviewed
 * staged records. The same call is safe to use for a read-only preflight.
 */
export async function releaseClass1NetworksPackage({
  connection,
  payloads,
  checksum,
  apply = false,
  questionsTable = "questions",
  metaTable = "question_bank_meta",
  attemptsTable = "question_attempts",
  log = console.log,
}) {
  await connection.beginTransaction();
  try {
    const before = await readClass1NetworksProductionSnapshot({
      connection, questionsTable, metaTable, attemptsTable, lock: apply,
    });
    const plan = planClass1NetworksRelease({ payloads, rows: before.rows, metadata: before.metadata });
    if (!apply) {
      await connection.rollback();
      return { ...plan, mode: "read_only_promotion_preflight", checksum };
    }
    if (!plan.ready) throw new Error(`Class 1 learner-visible promotion blocked: ${plan.errors.join("; ") || plan.state}`);

    const questionTableSql = `\`${questionsTable}\``;
    const metaTableSql = `\`${metaTable}\``;
    for (const change of plan.changes) {
      const [updated] = await connection.execute(
        `UPDATE ${questionTableSql} SET \`reviewStatus\` = 'unreviewed'
         WHERE \`bankKey\` = ? AND \`questionNum\` = ? AND \`reviewStatus\` = 'in_review'`,
        [change.bankKey, change.questionNum],
      );
      if (updated.affectedRows !== 1) throw new Error(`Concurrent or duplicate staged-row promotion: ${change.bankKey}#${change.questionNum}.`);
    }
    for (const bank of plan.banks) {
      const [updated] = await connection.execute(
        `UPDATE ${metaTableSql} SET \`totalQuestions\` = ?, \`contentVersion\` = \`contentVersion\` + 1
         WHERE \`bankKey\` = ? AND \`totalQuestions\` = ? AND \`contentVersion\` = ?`,
        [bank.expectedVisibleAfter, bank.bankKey, bank.visibleBefore, bank.metadataContentVersion],
      );
      if (updated.affectedRows !== 1) throw new Error(`Concurrent question-bank metadata update: ${bank.bankKey}.`);
    }

    const after = await readClass1NetworksProductionSnapshot({
      connection, questionsTable, metaTable, attemptsTable, lock: true,
    });
    if (digest(before.attemptRows) !== digest(after.attemptRows)) {
      throw new Error("Learner-attempt aggregate changed during staged-question promotion.");
    }
    const afterPlan = planClass1NetworksRelease({ payloads, rows: after.rows, metadata: after.metadata });
    if (afterPlan.errors.length || afterPlan.state !== "already_visible") {
      throw new Error(`Post-promotion reconciliation failed: ${afterPlan.errors.join("; ") || afterPlan.state}`);
    }
    await connection.commit();
    const result = {
      applied: true,
      mode: "learner_visible_promotion",
      checksum,
      before: plan,
      after: afterPlan,
    };
    log(`Class 1 learner-visible promotion complete: ${plan.changes.length} staged candidates are now available to learners.`);
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}
