function sameStoredContent(row, question) {
  const storedOptions = typeof row.options === "string" ? JSON.parse(row.options) : row.options;
  return row.module === question.module
    && row.difficulty === question.difficulty
    && row.question === question.question
    && JSON.stringify(storedOptions) === JSON.stringify(question.options)
    && Number(row.correctIndex) === question.correctIndex
    && row.explanation === question.explanation
    && (row.steps ?? null) === (question.steps ?? null)
    && (row.tip ?? null) === (question.tip ?? null)
    && row.isCalc === question.isCalc
    && (row.topic ?? null) === (question.topic ?? null)
    && (row.cognitiveLevel ?? null) === (question.cognitiveLevel ?? null)
    && (row.sourceTitle ?? null) === (question.sourceTitle ?? null)
    && (row.sourceReference ?? null) === (question.sourceReference ?? null)
    && (row.sourceUrl ?? null) === (question.sourceUrl ?? null)
    && (row.blueprintObjective ?? null) === (question.blueprintObjective ?? null);
}

function safeTableName(value) {
  if (!/^[A-Za-z0-9_]+$/.test(value)) throw new Error(`Unsafe table name: ${value}`);
  return `\`${value}\``;
}

export async function importOitPayloads({
  connection,
  payloads,
  log = console.log,
  questionsTable = "questions",
  metaTable = "question_bank_meta",
}) {
  const questionsTableSql = safeTableName(questionsTable);
  const metaTableSql = safeTableName(metaTable);
  const totals = { inserted: 0, movedToReview: 0, identical: 0, verified: 0, banks: {} };

  try {
    await connection.beginTransaction();

    for (const payload of payloads) {
      const [metaRows] = await connection.execute(
        `SELECT bankKey FROM ${metaTableSql} WHERE bankKey = ? FOR UPDATE`,
        [payload.bankKey],
      );
      if (metaRows.length !== 1) throw new Error(`Missing question_bank_meta row for ${payload.bankKey}.`);

      const [existingRows] = await connection.execute(
        `SELECT bankKey, questionNum, module, difficulty, question, options, correctIndex,
                explanation, steps, tip, isCalc, topic, cognitiveLevel, sourceTitle,
                sourceReference, sourceUrl, blueprintObjective, reviewStatus
         FROM ${questionsTableSql}
         WHERE bankKey = ? AND questionNum BETWEEN 1001 AND 1500
         FOR UPDATE`,
        [payload.bankKey],
      );
      const existingByNumber = new Map(existingRows.map(row => [Number(row.questionNum), row]));
      let insertedForBank = 0;
      let movedToReviewForBank = 0;

      for (const question of payload.questions) {
        const existing = existingByNumber.get(question.questionNum);
        if (existing) {
          if (!sameStoredContent(existing, question)) {
            throw new Error(
              `Immutable OIT content conflict at ${payload.bankKey}#${question.questionNum}. `
              + "Choose a new additive question-number range instead of overwriting deployed content.",
            );
          }
          if (existing.reviewStatus === "unreviewed") {
            await connection.execute(
              `UPDATE ${questionsTableSql}
               SET reviewStatus = 'in_review', reviewedBy = NULL, reviewedAt = NULL
               WHERE bankKey = ? AND questionNum = ?`,
              [question.bankKey, question.questionNum],
            );
            movedToReviewForBank += 1;
          }
          continue;
        }

        await connection.execute(
          `INSERT INTO ${questionsTableSql}
            (bankKey, questionNum, module, difficulty, question, options, correctIndex,
             explanation, steps, tip, isCalc, topic, cognitiveLevel, sourceTitle,
             sourceReference, sourceUrl, blueprintObjective, reviewStatus)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_review')`,
          [
            question.bankKey,
            question.questionNum,
            question.module,
            question.difficulty,
            question.question,
            JSON.stringify(question.options),
            question.correctIndex,
            question.explanation,
            question.steps ?? null,
            question.tip ?? null,
            question.isCalc,
            question.topic,
            question.cognitiveLevel,
            question.sourceTitle,
            question.sourceReference,
            question.sourceUrl,
            question.blueprintObjective,
          ],
        );
        insertedForBank += 1;
      }

      if (insertedForBank > 0 || movedToReviewForBank > 0) {
        await connection.execute(
          `UPDATE ${metaTableSql}
           SET totalQuestions = (
                 SELECT COUNT(*) FROM ${questionsTableSql}
                 WHERE bankKey = ? AND reviewStatus NOT IN ('in_review', 'rejected')
               ),
               contentVersion = contentVersion + 1
           WHERE bankKey = ?`,
          [payload.bankKey, payload.bankKey],
        );
      }

      const identicalForBank = payload.questions.length - insertedForBank - movedToReviewForBank;
      const bankResult = {
        inserted: insertedForBank,
        movedToReview: movedToReviewForBank,
        identical: identicalForBank,
        verified: payload.questions.length,
      };
      totals.banks[payload.bankKey] = bankResult;
      totals.inserted += bankResult.inserted;
      totals.movedToReview += bankResult.movedToReview;
      totals.identical += bankResult.identical;
      totals.verified += bankResult.verified;
      log(`${payload.bankKey}: ${insertedForBank} inserted in review, ${movedToReviewForBank} legacy rows moved to review, ${identicalForBank} already identical, ${payload.questions.length} verified.`);
    }

    await connection.commit();
    return totals;
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}
