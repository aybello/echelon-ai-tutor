import { createHash } from "node:crypto";

export const OIT_REPORTED_ITEM_REPAIR_VERSION = "2026-09-21-v2";

const VISIBLE_STATUSES = new Set(["approved", "unreviewed"]);
const REPAIR_FIELDS = [
  "question",
  "options",
  "correctIndex",
  "explanation",
  "sourceTitle",
  "sourceReference",
  "sourceUrl",
];

function contentSnapshot(value) {
  return {
    question: value.question,
    options: typeof value.options === "string" ? JSON.parse(value.options) : value.options,
    correctIndex: Number(value.correctIndex),
    explanation: value.explanation,
    sourceTitle: value.sourceTitle ?? null,
    sourceReference: value.sourceReference ?? null,
    sourceUrl: value.sourceUrl ?? null,
  };
}

export function hashReportedItemContent(value) {
  return createHash("sha256")
    .update(JSON.stringify(contentSnapshot(value)))
    .digest("hex");
}

const canonicalOitReportedItemRepairs = [
  {
    bankKey: "oit",
    questionNum: 6,
    expectedId: 35031,
    expected: {
      question: "A chlorine gas cylinder at a water treatment plant shows frost forming on the outside of the valve. What does this indicate and what should the operator do?",
      options: [
        "The cylinder is full — no action needed",
        "The cylinder is cold from storage — warm it with an open flame to restore flow",
        "The cylinder is leaking and the operator should immediately evacuate and notify the supervisor",
        "Frost is normal condensation — continue operations",
      ],
      correctIndex: 2,
      explanation: "Frost forming on a chlorine cylinder valve indicates a leak — chlorine gas escaping causes rapid evaporative cooling. The operator must evacuate the area, don appropriate PPE (SCBA), and follow emergency procedures. Never apply heat to a leaking chlorine cylinder.",
      sourceTitle: null,
      sourceReference: null,
      sourceUrl: null,
    },
    previousContents: [{
      question: "A chlorine gas cylinder at a water treatment plant shows frost forming around the valve during operation. What is the safest interpretation and immediate action?",
      options: [
        "The cylinder is full — no action needed",
        "The cylinder is cold from storage — warm it with an open flame to restore flow",
        "Frost can result from rapid gas withdrawal/evaporative cooling or a leak. Treat it as a potential release: leave the area, notify the supervisor, and have trained personnel follow the site chlorine emergency procedure.",
        "Frost is normal condensation — continue operations",
      ],
      correctIndex: 2,
      explanation: "Frost alone does not prove that a chlorine cylinder is leaking. High gaseous withdrawal from liquefied chlorine can cause evaporative cooling and lower vapour pressure; excessive or prolonged withdrawal can produce frost. Because a leak is still possible, do not use an open flame or continue without assessment. Leave the area and notify the supervisor in accordance with the facility emergency procedure. Only trained, authorized responders using the required respiratory protection should enter a potentially chlorine-contaminated area to assess or control a release.",
      sourceTitle: null,
      sourceReference: null,
      sourceUrl: null,
    }],
    replacement: {
      question: "While checking chlorine feed equipment, an operator notices frost near a cylinder valve and the room's chlorine detector alarms. The operator is not trained for leak response. What should the operator do first?",
      options: [
        "Check the detector with a portable meter beside the cylinder, then notify the supervisor if the readings agree.",
        "Close the cylinder valve before leaving the room, then notify the supervisor that the suspected leak has been isolated.",
        "Leave the affected area using the site's emergency procedure, then notify the supervisor and keep others out.",
        "Switch to the standby cylinder before leaving the room, then notify the supervisor that chlorine dosing can continue.",
      ],
      correctIndex: 2,
      explanation: "The chlorine alarm indicates a possible release. An operator who is not trained for leak response should leave the affected area, report the hazard and prevent others from entering, following the site's emergency procedure. Checking a second detector delays leaving; closing a valve or changing cylinders requires approaching potentially leaking equipment. Leak control belongs to trained, authorized responders with appropriate protection. The decision is based on the alarm and the operator's training, not on diagnosing the cause of frost.",
      sourceTitle: "CCOHS: Chlorine",
      sourceReference: "Incidental release measures; handling and storage practices (reviewed 2026-09-21)",
      sourceUrl: "https://www.ccohs.ca/oshanswers/chemicals/chem_profiles/chlorine.html",
    },
  },
  {
    bankKey: "oit",
    questionNum: 14,
    expectedId: 35039,
    expected: {
      question: "What happens to the chlorine demand when the turbidity of the source water increases?",
      options: [
        "Chlorine demand decreases",
        "Chlorine demand becomes zero",
        "Chlorine demand remains the same",
        "Chlorine demand increases",
      ],
      correctIndex: 3,
      explanation: "Increased turbidity often indicates higher levels of organic and inorganic matter, which react with chlorine, thereby increasing the chlorine demand.",
      sourceTitle: null,
      sourceReference: null,
      sourceUrl: null,
    },
    replacement: {
      question: "When an increase in source-water turbidity reflects an increase in chlorine-reactive dissolved or suspended impurities, what generally happens to chlorine demand?",
      options: [
        "Chlorine demand decreases",
        "Chlorine demand becomes zero",
        "Chlorine demand remains the same",
        "Chlorine demand increases",
      ],
      correctIndex: 3,
      explanation: "Chlorine demand is the chlorine consumed by reactions with impurities in water. Organic matter and certain minerals can react with chlorine. Therefore, when higher turbidity reflects more chlorine-reactive impurities, chlorine demand generally increases. Turbidity alone does not determine chlorine demand because its meaning depends on the particles causing it.",
      sourceTitle: null,
      sourceReference: null,
      sourceUrl: null,
    },
  },
  {
    bankKey: "oit",
    questionNum: 21,
    expectedId: 35046,
    expected: {
      question: "According to O. Reg. 170/03, what is the minimum free chlorine residual required at the entry to the distribution system for drinking water?",
      options: ["0.20 mg/L", "0.10 mg/L", "0.05 mg/L", "0.50 mg/L"],
      correctIndex: 2,
      explanation: "O. Reg. 170/03 requires a minimum free chlorine residual of 0.05 mg/L at the entry to the distribution system. Note: 0.20 mg/L is a common best-practice target but is NOT the regulatory minimum. The regulation states that a free chlorine residual below 0.05 mg/L constitutes an adverse water quality incident that must be reported.",
      sourceTitle: null,
      sourceReference: null,
      sourceUrl: null,
    },
    replacement: {
      question: "For an Ontario drinking-water system that uses chlorination, not chloramination, and is required to provide secondary disinfection, what minimum free chlorine residual must be maintained at all times and at all locations within the distribution system?",
      options: ["0.20 mg/L", "0.10 mg/L", "0.05 mg/L", "0.50 mg/L"],
      correctIndex: 2,
      explanation: "O. Reg. 170/03 requires a free chlorine residual of at least 0.05 mg/L at all times and at all locations within the distribution system for systems that provide chlorination and not chloramination. The Ministry procedure states the same operational minimum at pH 8.5 or lower. The regulation separately requires secondary-disinfection equipment to be designed to be capable of achieving 0.20 mg/L free chlorine at all distribution-system locations; the procedure also identifies 0.20 mg/L as the recommended optimum target. Therefore, 0.05 mg/L is the correct answer to this revised operational-maintenance question.",
      sourceTitle: null,
      sourceReference: null,
      sourceUrl: null,
    },
  },
  {
    bankKey: "oit",
    questionNum: 62,
    expectedId: 35087,
    expected: {
      question: "Which unit is typically used to express pressure in Ontario water systems?",
      options: [
        "Kilopascals (kPa)",
        "Meters of water column (m H2O)",
        "Pounds per square inch (psi)",
        "Pascals (Pa)",
      ],
      correctIndex: 0,
      explanation: "In Ontario water systems, pressure is expressed in kilopascals (kPa). This is the standard metric unit used in Canadian water system operations and regulatory documents. While PSI is still commonly used in practice (especially with older equipment), kPa is the official unit. Meters of water column (m H2O) is used for head calculations, not pressure measurements.",
      sourceTitle: null,
      sourceReference: null,
      sourceUrl: null,
    },
    replacement: {
      question: "Which primary metric unit is used to state water-system pressure requirements in Ontario government drinking-water design criteria?",
      options: [
        "Kilopascals (kPa)",
        "Meters of water column (m H2O)",
        "Pounds per square inch (psi)",
        "Pascals (Pa)",
      ],
      correctIndex: 0,
      explanation: "Ontario government drinking-water design criteria state water-system pressure requirements in kilopascals (kPa), often with pounds per square inch (psi) shown as an equivalent. This question asks for the primary metric unit used in those criteria. Meters of water column is commonly used to express head, and pascals are impractically small for typical system-pressure values.",
      sourceTitle: "Ontario Ministry of the Environment Safe Drinking Water Branch — Watermain Design Criteria for Future Alterations Authorized Under a Drinking Water Works Permit",
      sourceReference: "Section 1.1 states the minimum watermain pressure as 140 kPa at ground level. Ontario drinking-water design guidance commonly provides psi as an equivalent, so the stem is limited to the primary metric unit.",
      sourceUrl: "https://www.ontario.ca/page/watermain-design-criteria-future-alterations-authorized-under-drinking-water-works-permit",
    },
  },
];

function repairKey(repair) {
  return `${repair.bankKey}:${repair.questionNum}`;
}

function freezeContentSnapshot(content) {
  return Object.freeze({
    question: content.question,
    options: Object.freeze([...content.options]),
    correctIndex: Number(content.correctIndex),
    explanation: content.explanation,
    sourceTitle: content.sourceTitle ?? null,
    sourceReference: content.sourceReference ?? null,
    sourceUrl: content.sourceUrl ?? null,
  });
}

function freezeRepairSnapshot(repair) {
  return Object.freeze({
    bankKey: repair.bankKey,
    questionNum: Number(repair.questionNum),
    expectedId: Number(repair.expectedId),
    expected: freezeContentSnapshot(repair.expected),
    replacement: freezeContentSnapshot(repair.replacement),
    previousContents: Object.freeze((repair.previousContents ?? []).map(freezeContentSnapshot)),
  });
}

export const reportedOitItemRepairs = Object.freeze(
  canonicalOitReportedItemRepairs.map(freezeRepairSnapshot),
);

function freezeMetadataSnapshot(metadata) {
  return Object.freeze({
    bankKey: metadata.bankKey,
    totalQuestions: Number(metadata.totalQuestions),
    contentVersion: Number(metadata.contentVersion),
  });
}

function stablePlanHash(rows, changes, metadataBefore, repairs) {
  const normalizedRows = [...rows]
    .map(row => ({
      id: Number(row.id),
      bankKey: row.bankKey,
      questionNum: Number(row.questionNum),
      reviewStatus: row.reviewStatus,
      contentHash: hashReportedItemContent(row),
    }))
    .sort((left, right) => repairKey(left).localeCompare(repairKey(right)));
  return createHash("sha256")
    .update(JSON.stringify({
      version: OIT_REPORTED_ITEM_REPAIR_VERSION,
      metadataBefore: metadataBefore ? {
        bankKey: metadataBefore.bankKey,
        totalQuestions: Number(metadataBefore.totalQuestions),
        contentVersion: Number(metadataBefore.contentVersion),
      } : null,
      normalizedRows,
      changes: changes.map(change => repairKey(change)).sort(),
      approvedRepairs: [...repairs]
        .map(repair => ({
          bankKey: repair.bankKey,
          questionNum: Number(repair.questionNum),
          expectedId: Number(repair.expectedId),
          expectedContentHash: hashReportedItemContent(repair.expected),
          previousContentHashes: (repair.previousContents ?? []).map(hashReportedItemContent),
          replacementContentHash: hashReportedItemContent(repair.replacement),
          expectedCorrectIndex: Number(repair.expected.correctIndex),
          replacementCorrectIndex: Number(repair.replacement.correctIndex),
        }))
        .sort((left, right) => repairKey(left).localeCompare(repairKey(right))),
    }))
    .digest("hex");
}

export function planReportedOitItemRepair(rows, metadataBefore, repairs = reportedOitItemRepairs) {
  const errors = [];
  const rowsByKey = new Map();
  for (const row of rows) {
    const key = repairKey(row);
    if (rowsByKey.has(key)) errors.push(`${key}: duplicate database row`);
    rowsByKey.set(key, row);
  }

  const changes = [];
  const unchanged = [];
  for (const repair of repairs) {
    const key = repairKey(repair);
    const row = rowsByKey.get(key);
    if (!row) {
      errors.push(`${key}: missing database row`);
      continue;
    }
    if (Number(row.id) !== repair.expectedId) {
      errors.push(`${key}: database row identity changed from the reviewed baseline`);
      continue;
    }
    if (!VISIBLE_STATUSES.has(row.reviewStatus)) {
      errors.push(`${key}: unsafe review status ${row.reviewStatus ?? "unknown"}`);
      continue;
    }
    let actualHash;
    try {
      actualHash = hashReportedItemContent(row);
    } catch {
      errors.push(`${key}: invalid stored options JSON`);
      continue;
    }
    const expectedHash = hashReportedItemContent(repair.expected);
    const replacementHash = hashReportedItemContent(repair.replacement);
    if (actualHash === replacementHash) {
      unchanged.push({ bankKey: repair.bankKey, questionNum: repair.questionNum });
      continue;
    }
    const previousHashes = (repair.previousContents ?? []).map(hashReportedItemContent);
    if (actualHash !== expectedHash && !previousHashes.includes(actualHash)) {
      errors.push(`${key}: content drifted from the reviewed baseline`);
      continue;
    }
    changes.push({ ...repair, expectedHash: actualHash, replacementHash });
  }

  for (const row of rowsByKey.values()) {
    if (!repairs.some(repair => repairKey(repair) === repairKey(row))) {
      errors.push(`${repairKey(row)}: unexpected database row`);
    }
  }

  return {
    ready: errors.length === 0,
    errors,
    changes,
    unchanged,
    planHash: stablePlanHash(rows, changes, metadataBefore, repairs),
  };
}

/**
 * Applies only the reviewed four-row content repair under row locks. A backup
 * callback is required before any write. This never changes answer positions,
 * review status, question count, schema, or delivery code.
 */
export async function applyReportedOitItemRepair(connection, {
  apply = false,
  backup,
  expectedPlanHash,
} = {}) {
  const repairSnapshot = reportedOitItemRepairs;
  const placeholders = repairSnapshot.map(() => "?").join(", ");
  const questionNumbers = repairSnapshot.map(repair => repair.questionNum);
  await connection.beginTransaction();
  try {
    const [metadataRows] = await connection.execute(
      `SELECT bankKey, totalQuestions, contentVersion
       FROM question_bank_meta
       WHERE bankKey = 'oit'${apply ? " FOR UPDATE" : ""}`,
    );
    if (metadataRows.length !== 1 || !Number.isInteger(Number(metadataRows[0].contentVersion))) {
      throw new Error("Missing or invalid OIT question-bank metadata during content repair.");
    }
    const metadataBefore = freezeMetadataSnapshot(metadataRows[0]);
    const [rows] = await connection.execute(
      `SELECT id, bankKey, questionNum, question, options, correctIndex, explanation,
              sourceTitle, sourceReference, sourceUrl, reviewStatus
       FROM questions
       WHERE bankKey = 'oit' AND questionNum IN (${placeholders})
       ORDER BY questionNum${apply ? " FOR UPDATE" : ""}`,
      questionNumbers,
    );
    const plan = planReportedOitItemRepair(rows, metadataBefore, repairSnapshot);
    if (!apply) {
      await connection.rollback();
      return plan;
    }
    if (!plan.ready) {
      throw new Error(`Reported OIT content repair blocked: ${plan.errors.join("; ")}`);
    }
    if (apply && expectedPlanHash !== plan.planHash) {
      throw new Error("Apply blocked because the exact reviewed plan hash no longer matches the locked database state.");
    }
    if (plan.changes.length === 0) {
      await connection.rollback();
      return { ...plan, applied: false, alreadyApplied: true };
    }
    if (typeof backup !== "function") {
      throw new Error("Reported OIT content repair requires a durable pre-update backup callback.");
    }

    await backup({
      repairVersion: OIT_REPORTED_ITEM_REPAIR_VERSION,
      planHash: plan.planHash,
      rows: rows.map(row => ({ ...row })),
      metadataBefore: { ...metadataBefore },
    });

    const [metadataAfterBackupRows] = await connection.execute(
      "SELECT bankKey, totalQuestions, contentVersion FROM question_bank_meta WHERE bankKey = 'oit' FOR UPDATE",
    );
    if (metadataAfterBackupRows.length !== 1) {
      throw new Error("OIT question-bank metadata changed during backup.");
    }
    const metadataAfterBackup = freezeMetadataSnapshot(metadataAfterBackupRows[0]);
    const [rowsAfterBackup] = await connection.execute(
      `SELECT id, bankKey, questionNum, question, options, correctIndex, explanation,
              sourceTitle, sourceReference, sourceUrl, reviewStatus
       FROM questions
       WHERE bankKey = 'oit' AND questionNum IN (${placeholders})
       ORDER BY questionNum FOR UPDATE`,
      questionNumbers,
    );
    const postBackupPlan = planReportedOitItemRepair(rowsAfterBackup, metadataAfterBackup, repairSnapshot);
    if (!postBackupPlan.ready || postBackupPlan.planHash !== expectedPlanHash) {
      throw new Error("OIT repair state changed during backup; no content was updated.");
    }

    for (const change of postBackupPlan.changes) {
      const replacement = change.replacement;
      const [result] = await connection.execute(
        `UPDATE questions
         SET question = ?, options = ?, correctIndex = ?, explanation = ?,
             sourceTitle = ?, sourceReference = ?, sourceUrl = ?
         WHERE id = ? AND bankKey = ? AND questionNum = ?
           AND reviewStatus IN ('approved', 'unreviewed')`,
        [
          replacement.question,
          JSON.stringify(replacement.options),
          replacement.correctIndex,
          replacement.explanation,
          replacement.sourceTitle,
          replacement.sourceReference,
          replacement.sourceUrl,
          change.expectedId,
          change.bankKey,
          change.questionNum,
        ],
      );
      if (result.affectedRows !== 1) {
        throw new Error(`Concurrent or unsafe content repair: ${repairKey(change)}`);
      }
    }

    const [updatedRows] = await connection.execute(
      `SELECT id, bankKey, questionNum, question, options, correctIndex, explanation,
              sourceTitle, sourceReference, sourceUrl, reviewStatus
       FROM questions
       WHERE bankKey = 'oit' AND questionNum IN (${placeholders})
       ORDER BY questionNum FOR UPDATE`,
      questionNumbers,
    );
    const postApplyPlan = planReportedOitItemRepair(updatedRows, metadataBefore, repairSnapshot);
    if (!postApplyPlan.ready || postApplyPlan.changes.length !== 0) {
      throw new Error(`Post-update verification failed: ${postApplyPlan.errors.join("; ") || "unexpected remaining changes"}`);
    }

    const expectedContentVersion = Number(metadataBefore.contentVersion) + 1;
    const [metadataUpdate] = await connection.execute(
      `UPDATE question_bank_meta
       SET contentVersion = ?
       WHERE bankKey = 'oit' AND contentVersion = ?`,
      [expectedContentVersion, Number(metadataBefore.contentVersion)],
    );
    if (metadataUpdate.affectedRows !== 1) {
      throw new Error("Concurrent or unsafe OIT content-version update.");
    }
    const [metadataAfterRows] = await connection.execute(
      "SELECT bankKey, totalQuestions, contentVersion FROM question_bank_meta WHERE bankKey = 'oit' FOR UPDATE",
    );
    if (
      metadataAfterRows.length !== 1 ||
      metadataAfterRows[0].bankKey !== metadataBefore.bankKey ||
      Number(metadataAfterRows[0].totalQuestions) !== Number(metadataBefore.totalQuestions) ||
      Number(metadataAfterRows[0].contentVersion) !== expectedContentVersion
    ) {
      throw new Error("Post-update OIT content-version verification failed.");
    }
    const finalPlan = planReportedOitItemRepair(updatedRows, metadataAfterRows[0], repairSnapshot);
    if (!finalPlan.ready || finalPlan.changes.length !== 0) {
      throw new Error(`Final content repair verification failed: ${finalPlan.errors.join("; ") || "unexpected remaining changes"}`);
    }
    await connection.commit();
    return { ...plan, applied: true, postApplyPlanHash: finalPlan.planHash };
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

export { REPAIR_FIELDS, contentSnapshot };
