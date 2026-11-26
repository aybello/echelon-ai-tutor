import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createConnection } from "mysql2/promise";
import {
  WPI_CLASS4_NEW_RANGE,
  WPI_CLASS4_WASTEWATER_BANK,
  hashWpiNewQuestionRows,
  hashWpiQuestionRows,
  planWpiClass4Release,
  projectWpiQuestion,
} from "./lib/wpiClass4Release.mjs";

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, value = "true"] = arg.replace(/^--/, "").split("=");
  return [key, value];
}));
const apply = args.get("apply") === "true";
const candidateRoot = args.get("candidate-root");
const releaseKey = args.get("release-key");
const reportPath = args.get("report");

if (!candidateRoot || !releaseKey || !reportPath) {
  throw new Error("Usage: node scripts/release-wpi-class4-wastewater.mjs --candidate-root=/absolute/path --release-key=unique-release-key --report=/absolute/new-report.json [--apply]");
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is unavailable.");

const Q_FIELDS = "id, bankKey, questionNum, module, difficulty, question, options, correctIndex, explanation, steps, tip, isCalc, topic, cognitiveLevel, sourceTitle, sourceReference, sourceUrl, blueprintObjective, reviewStatus";
const MUTABLE_FIELDS = ["module", "difficulty", "question", "options", "correctIndex", "explanation", "steps", "tip", "isCalc", "topic", "cognitiveLevel", "sourceTitle", "sourceReference", "sourceUrl", "blueprintObjective", "reviewStatus"];
const INSERT_FIELDS = ["bankKey", "questionNum", ...MUTABLE_FIELDS];
const READ_METADATA = "bankKey, modules, moduleTargets, formulaLinks, totalQuestions, contentVersion, blueprintVersion, minCalcPerMock, recallTargetPct";
const readJson = (path) => readFile(path, "utf8").then(JSON.parse);
const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const readAttemptAggregate = async (connection) => {
  const [rows] = await connection.execute(
    "SELECT questionId, correct, selectedIndex, COUNT(*) AS count FROM question_attempts WHERE bankKey = ? GROUP BY questionId, correct, selectedIndex ORDER BY questionId, correct, selectedIndex",
    [WPI_CLASS4_WASTEWATER_BANK],
  );
  return rows;
};

const root = resolve(candidateRoot);
const [manifest, candidateExisting, candidateNew] = await Promise.all([
  readJson(resolve(root, "release-manifest.json")),
  readJson(resolve(root, "existing-questions.json")),
  readJson(resolve(root, "new-questions.json")),
]);
if (manifest.targetBankKey !== WPI_CLASS4_WASTEWATER_BANK) throw new Error("Candidate manifest targets a different bank.");
if (candidateExisting.length !== 657 || candidateNew.length !== 250) throw new Error("Candidate inventory is incomplete.");
if (hashWpiQuestionRows(candidateExisting) !== manifest.existingRowsSha256) throw new Error("Existing candidate checksum mismatch.");
if (hashWpiNewQuestionRows(candidateNew) !== manifest.newRowsSha256) throw new Error("New candidate checksum mismatch.");

const connection = await createConnection(process.env.DATABASE_URL);
let open = false;
try {
  await connection.beginTransaction();
  open = true;
  const [currentRows] = await connection.execute(
    `SELECT ${Q_FIELDS} FROM questions WHERE bankKey = ? ORDER BY questionNum, id FOR UPDATE`,
    [WPI_CLASS4_WASTEWATER_BANK],
  );
  const [metadataRows] = await connection.execute(
    `SELECT ${READ_METADATA} FROM question_bank_meta WHERE bankKey = ? FOR UPDATE`,
    [WPI_CLASS4_WASTEWATER_BANK],
  );
  const metadata = metadataRows.length === 1 ? metadataRows[0] : null;
  const plan = planWpiClass4Release({
    currentRows,
    currentMetadata: metadata,
    candidateExisting,
    candidateNew,
    expectedBaselineRowsSha256: manifest.sourcePackageBaselineRowsSha256,
  });
  if (!plan.ready) throw new Error(`WPI release preflight blocked: ${plan.errors.join("; ")}`);
  const attemptAggregateBefore = await readAttemptAggregate(connection);
  const snapshotBefore = await connection.execute(
    "SELECT COUNT(*) AS count FROM question_content_snapshots WHERE releaseKey = ? FOR UPDATE",
    [releaseKey],
  );
  if (Number(snapshotBefore[0][0]?.count) !== 0) throw new Error(`Release key already has immutable snapshots: ${releaseKey}`);

  if (!apply) {
    await connection.rollback();
    open = false;
    const report = { mode: "preflight", releaseKey, bankKey: WPI_CLASS4_WASTEWATER_BANK, plan, attemptedAt: new Date().toISOString(), transaction: "rolled_back" };
    await mkdir(dirname(resolve(reportPath)), { recursive: true });
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: "wx", mode: 0o600 });
    process.stdout.write(`${JSON.stringify({ mode: report.mode, reportPath: resolve(reportPath), plan }, null, 2)}\n`);
    process.exit(0);
  }

  const snapshotSql = "INSERT INTO question_content_snapshots (releaseKey, bankKey, questionId, questionNum, sourceContentVersion, contentHash, payload) VALUES (?, ?, ?, ?, ?, ?, ?)";
  for (const row of currentRows) {
    const snapshot = projectWpiQuestion(row);
    await connection.execute(snapshotSql, [releaseKey, WPI_CLASS4_WASTEWATER_BANK, snapshot.id, snapshot.questionNum, metadata.contentVersion, hashWpiQuestionRows([snapshot]), JSON.stringify(snapshot)]);
  }
  const updateSql = `UPDATE questions SET ${MUTABLE_FIELDS.map((field) => `\`${field}\` = ?`).join(", ")} WHERE id = ? AND bankKey = ? AND questionNum = ?`;
  for (const row of candidateExisting) {
    const values = [...MUTABLE_FIELDS.map((field) => row[field] ?? null), row.id, WPI_CLASS4_WASTEWATER_BANK, row.questionNum];
    const [updated] = await connection.execute(updateSql, values);
    if (updated.affectedRows !== 1) throw new Error(`Existing row was not updated exactly once: ${row.id}`);
  }
  const placeholders = INSERT_FIELDS.map(() => "?").join(", ");
  const insertSql = `INSERT INTO questions (${INSERT_FIELDS.map((field) => `\`${field}\``).join(", ")}) VALUES (${placeholders})`;
  for (const row of candidateNew) {
    await connection.execute(insertSql, INSERT_FIELDS.map((field) => row[field] ?? null));
  }
  const [staged] = await connection.execute(
    "SELECT COUNT(*) AS count FROM questions WHERE bankKey = ? AND questionNum BETWEEN ? AND ? AND reviewStatus = 'in_review'",
    [WPI_CLASS4_WASTEWATER_BANK, WPI_CLASS4_NEW_RANGE.start, WPI_CLASS4_NEW_RANGE.end],
  );
  if (Number(staged[0]?.count) !== candidateNew.length) throw new Error("New rows failed the in_review staging verification.");
  const [promoted] = await connection.execute(
    "UPDATE questions SET reviewStatus = 'approved' WHERE bankKey = ? AND questionNum BETWEEN ? AND ? AND reviewStatus = 'in_review'",
    [WPI_CLASS4_WASTEWATER_BANK, WPI_CLASS4_NEW_RANGE.start, WPI_CLASS4_NEW_RANGE.end],
  );
  if (promoted.affectedRows !== candidateNew.length) throw new Error("New rows failed exact approved promotion.");
  const [metadataUpdate] = await connection.execute(
    "UPDATE question_bank_meta SET totalQuestions = ?, contentVersion = contentVersion + 1 WHERE bankKey = ? AND contentVersion = ?",
    [plan.intendedVisibleCount, WPI_CLASS4_WASTEWATER_BANK, metadata.contentVersion],
  );
  if (metadataUpdate.affectedRows !== 1) throw new Error("Question-bank metadata changed concurrently.");

  const [afterRows] = await connection.execute(
    `SELECT ${Q_FIELDS} FROM questions WHERE bankKey = ? ORDER BY questionNum, id FOR UPDATE`,
    [WPI_CLASS4_WASTEWATER_BANK],
  );
  const afterExisting = afterRows.filter((row) => Number(row.questionNum) < WPI_CLASS4_NEW_RANGE.start);
  const afterNew = afterRows.filter((row) => Number(row.questionNum) >= WPI_CLASS4_NEW_RANGE.start && Number(row.questionNum) <= WPI_CLASS4_NEW_RANGE.end);
  const [afterMetadataRows] = await connection.execute(`SELECT ${READ_METADATA} FROM question_bank_meta WHERE bankKey = ? FOR UPDATE`, [WPI_CLASS4_WASTEWATER_BANK]);
  const [snapshotRows] = await connection.execute("SELECT payload FROM question_content_snapshots WHERE releaseKey = ? ORDER BY questionNum, questionId", [releaseKey]);
  const attemptAggregateAfter = await readAttemptAggregate(connection);
  const afterMetadata = afterMetadataRows[0];
  const finalInvariantErrors = [];
  if (afterRows.length !== plan.intendedVisibleCount) finalInvariantErrors.push(`Expected ${plan.intendedVisibleCount} total rows; found ${afterRows.length}.`);
  if (hashWpiQuestionRows(afterExisting) !== manifest.existingRowsSha256) finalInvariantErrors.push("Existing content checksum mismatch after update.");
  if (hashWpiNewQuestionRows(afterNew) !== manifest.promotedNewRowsSha256) finalInvariantErrors.push("New promoted content checksum mismatch after update.");
  if (snapshotRows.length !== currentRows.length) finalInvariantErrors.push("Before-image snapshot count mismatch.");
  if (hashWpiQuestionRows(snapshotRows.map((row) => JSON.parse(row.payload))) !== manifest.sourcePackageBaselineRowsSha256) finalInvariantErrors.push("Before-image snapshot checksum mismatch.");
  if (Number(afterMetadata.totalQuestions) !== plan.intendedVisibleCount || Number(afterMetadata.contentVersion) !== Number(metadata.contentVersion) + 1) finalInvariantErrors.push("Metadata did not reconcile to released inventory/version.");
  if (digest(attemptAggregateBefore) !== digest(attemptAggregateAfter)) finalInvariantErrors.push("Learner-attempt aggregates changed during release.");
  const [visibleRows] = await connection.execute("SELECT COUNT(*) AS count FROM questions WHERE bankKey = ? AND reviewStatus IN ('unreviewed', 'approved')", [WPI_CLASS4_WASTEWATER_BANK]);
  if (Number(visibleRows[0]?.count) !== plan.intendedVisibleCount) finalInvariantErrors.push("Learner-visible count does not equal released inventory.");
  if (finalInvariantErrors.length) throw new Error(`Post-release invariant failure: ${finalInvariantErrors.join("; ")}`);

  await connection.commit();
  open = false;
  const report = {
    mode: "applied",
    releaseKey,
    bankKey: WPI_CLASS4_WASTEWATER_BANK,
    appliedAt: new Date().toISOString(),
    plan,
    snapshot: { rowCount: snapshotRows.length, beforeRowsSha256: manifest.sourcePackageBaselineRowsSha256 },
    release: { existingRowsSha256: manifest.existingRowsSha256, promotedNewRowsSha256: manifest.promotedNewRowsSha256, addedRows: afterNew.length, totalRows: afterRows.length, learnerVisibleRows: Number(visibleRows[0]?.count) },
    metadata: { before: { totalQuestions: Number(metadata.totalQuestions), contentVersion: Number(metadata.contentVersion) }, after: { totalQuestions: Number(afterMetadata.totalQuestions), contentVersion: Number(afterMetadata.contentVersion) } },
    attemptAggregateSha256: digest(attemptAggregateBefore),
    transaction: "committed",
  };
  await mkdir(dirname(resolve(reportPath)), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: "wx", mode: 0o600 });
  process.stdout.write(`${JSON.stringify({ mode: report.mode, reportPath: resolve(reportPath), release: report.release, metadata: report.metadata }, null, 2)}\n`);
} catch (error) {
  if (open) await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
