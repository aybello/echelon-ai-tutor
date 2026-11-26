import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  root,
  validateQuestionBank,
} from "./lib/309a-question-bank.mjs";

const apply = process.argv.includes("--apply");
const batchArgumentIndex = process.argv.indexOf("--batch");
const batchFilter = batchArgumentIndex >= 0
  ? process.argv[batchArgumentIndex + 1]?.toUpperCase()
  : null;
const allocationPath = resolve(root, "content/309a/309a-allocation.json");
const sourceManifestPath = resolve(root, "content/309a/current-exam-source-manifest.json");
const allocationBytes = readFileSync(allocationPath);
const sourceManifestBytes = readFileSync(sourceManifestPath);
const allocation = JSON.parse(allocationBytes);
const sourceManifest = JSON.parse(sourceManifestBytes);
const validation = validateQuestionBank({ batchFilter });

if (validation.errors.length > 0) {
  throw new Error(`Import blocked by validation:\n${validation.errors.map((error) => `- ${error}`).join("\n")}`);
}

const manifestChecksum = createHash("sha256")
  .update(allocationBytes)
  .update(sourceManifestBytes)
  .update(validation.questions.map((question) => question.contentHash).sort().join(""))
  .digest("hex");
const sourceManifestChecksum = createHash("sha256")
  .update(sourceManifestBytes)
  .digest("hex");
const allocationChecksum = createHash("sha256")
  .update(allocationBytes)
  .digest("hex");
const taskCount = new Set(validation.questions.map((question) => question.taskCode)).size;

console.log(
  `309A import plan ${manifestChecksum.slice(0, 12)}: ${validation.questions.length} ` +
  `draft questions across ${taskCount} tasks${batchFilter ? ` in batch ${batchFilter}` : ""}.`,
);

if (!apply) {
  console.log("Dry run complete. Database was not contacted; pass --apply with the explicit confirmation token to import.");
  process.exit(0);
}

if (process.env.CONFIRM_309A_IMPORT !== manifestChecksum) {
  throw new Error(
    `Apply blocked. Set CONFIRM_309A_IMPORT=${manifestChecksum} to confirm this exact validated payload.`,
  );
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for --apply.");

const mysql = await import("mysql2/promise");
const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  await connection.beginTransaction();
  const [bankResult] = await connection.execute(
    `INSERT INTO certification_bank_versions
      (programKey, bankKey, versionKey, blueprintVersion, releaseChannel, itemTarget, active,
       allocationChecksum, sourceManifestChecksum, commercialEligibility, teamEligibility)
     VALUES (?, ?, ?, ?, 'internal', ?, false, ?, ?, false, false)
     ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
    [allocation.programKey, allocation.bankKey, allocation.bankVersionKey, allocation.blueprintVersion, allocation.bankTarget, allocationChecksum, sourceManifestChecksum],
  );
  const bankVersionId = bankResult.insertId;
  const [bankRows] = await connection.execute(
    `SELECT blueprintVersion, allocationChecksum, sourceManifestChecksum, releaseChannel
     FROM certification_bank_versions WHERE id = ? FOR UPDATE`,
    [bankVersionId],
  );
  const bankRow = bankRows[0];
  if (
    bankRow.blueprintVersion !== allocation.blueprintVersion ||
    bankRow.allocationChecksum !== allocationChecksum ||
    bankRow.sourceManifestChecksum !== sourceManifestChecksum ||
    bankRow.releaseChannel !== "internal"
  ) {
    throw new Error(
      `Bank version ${allocation.bankVersionKey} is immutable or no longer internal; create a new version key for this payload.`,
    );
  }

  const sourceIds = new Map();
  for (const source of sourceManifest.sources) {
    const [sourceResult] = await connection.execute(
      `INSERT INTO certification_sources
        (sourceKey, publisher, title, stableUrl, editionVersion, retrievedAt, sha256,
         rightsBasis, permittedUsage, verifiedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
      [
        source.id,
        source.publisher,
        source.title,
        source.url,
        allocation.blueprintVersion,
        `${sourceManifest.retrievedAt} 00:00:00`,
        source.sha256,
        source.rightsBasis,
        source.permittedUsage,
        `${source.verifiedAt} 00:00:00`,
      ],
    );
    const [sourceRows] = await connection.execute(
      `SELECT publisher, title, stableUrl, sha256, rightsBasis, permittedUsage
       FROM certification_sources WHERE id = ? FOR UPDATE`,
      [sourceResult.insertId],
    );
    const storedSource = sourceRows[0];
    if (
      storedSource.publisher !== source.publisher ||
      storedSource.title !== source.title ||
      storedSource.stableUrl !== source.url ||
      storedSource.sha256 !== source.sha256 ||
      storedSource.rightsBasis !== source.rightsBasis ||
      storedSource.permittedUsage !== source.permittedUsage
    ) {
      throw new Error(
        `Source version ${source.id}/${source.sha256.slice(0, 12)} conflicts with its immutable stored metadata.`,
      );
    }
    sourceIds.set(source.id, sourceResult.insertId);
  }

  const taskIds = new Map();
  for (const mwa of allocation.majorWorkActivities) {
    for (const task of mwa.tasks) {
      const [taskResult] = await connection.execute(
        `INSERT INTO certification_blueprint_tasks
          (bankVersionId, mwaCode, taskCode, title, officialTarget, bankTarget, sourceId, sourceReference)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           id = LAST_INSERT_ID(id), title = VALUES(title), officialTarget = VALUES(officialTarget),
           bankTarget = VALUES(bankTarget), sourceId = VALUES(sourceId), sourceReference = VALUES(sourceReference)`,
        [
          bankVersionId,
          mwa.code,
          task.code,
          task.title,
          (task.bankTarget / 5).toFixed(2),
          task.bankTarget,
          sourceIds.get("red-seal-current-exam-weightings"),
          `MWA ${mwa.code}, Task ${task.code}`,
        ],
      );
      taskIds.set(task.code, taskResult.insertId);
    }
  }

  const [importResult] = await connection.execute(
    `INSERT INTO certification_import_runs
      (bankVersionId, manifestChecksum, dryRun, importerIdentity, status)
     VALUES (?, ?, false, ?, 'validated')
     ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), status = 'validated', errorMessage = NULL`,
    [bankVersionId, manifestChecksum, process.env.IMPORTER_IDENTITY ?? "OpenAI Codex"],
  );
  const importRunId = importResult.insertId;
  let insertedCount = 0;

  for (const question of validation.questions) {
    const [existingRows] = await connection.execute(
      `SELECT contentHash FROM certification_questions WHERE bankVersionId = ? AND bankItemNumber = ? FOR UPDATE`,
      [bankVersionId, question.bankItemNumber],
    );
    if (existingRows.length > 0) {
      if (existingRows[0].contentHash !== question.contentHash) {
        throw new Error(
          `Immutable item conflict at bank item ${question.bankItemNumber}; retire/version the existing item instead of overwriting it.`,
        );
      }
      continue;
    }

    await connection.execute(
      `INSERT INTO certification_questions
        (bankVersionId, bankItemNumber, taskId, module, taskCode, subtaskCode, topic,
         difficulty, questionType, cognitiveLevel, question, options, correctIndex,
         explanation, steps, tip, isCalc, diagramId, diagramAlt, sourceId,
         sourceReference, blueprintObjective, authorIdentity, origin, contentHash,
         contentStatus, publicEligibility)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', false)`,
      [
        bankVersionId,
        question.bankItemNumber,
        taskIds.get(question.taskCode),
        question.module,
        question.taskCode,
        question.subtaskCode,
        question.topic,
        question.difficulty,
        question.questionType,
        question.cognitiveLevel,
        question.question,
        JSON.stringify(question.options),
        question.correctIndex,
        question.explanation,
        question.steps === null ? null : JSON.stringify(question.steps),
        question.tip,
        question.isCalc,
        question.diagramId,
        question.diagramAlt,
        sourceIds.get(question.sourceId),
        question.sourceReference,
        question.blueprintObjective,
        question.authorIdentity,
        question.origin,
        question.contentHash,
      ],
    );
    insertedCount += 1;
  }

  await connection.execute(
    `UPDATE certification_import_runs
     SET status = 'completed', insertedCount = ?, updatedCount = 0, rejectedCount = 0,
         completedAt = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [insertedCount, importRunId],
  );
  await connection.commit();
  console.log(`Imported ${insertedCount} new questions into internal bank version ${bankVersionId}.`);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
