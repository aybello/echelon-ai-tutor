/**
 * scripts/audit-answer-length-bias.ts
 *
 * Read-only audit of "length tell" bias across every question bank in the DB.
 *
 * A length tell exists when the correct option is conspicuously longer than
 * every distractor, letting a candidate beat the bank by picking the wordiest
 * option. See server/answerLengthBias.ts for the detection rules.
 *
 * Usage:
 *   pnpm audit:answer-bias                      # report every bank
 *   pnpm audit:answer-bias -- --bank class1-water
 *   pnpm audit:answer-bias -- --json worklist.json
 *   pnpm audit:answer-bias -- --strict          # exit 1 if any bank fails
 *
 * This script never writes to the database.
 */

import mysql from "mysql2/promise";
import { writeFileSync } from "node:fs";
import {
  summariseAnswerLengthBias,
  formatBankVerdict,
  targetDistractorLength,
  CHANCE_LONGEST_RATE,
  BANK_LONGEST_RATE_THRESHOLD,
  type BiasCheckQuestion,
} from "../server/answerLengthBias.ts";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required for the read-only answer-bias audit.");
  process.exit(1);
}

function flagValue(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const bankFilter = flagValue("bank");
const jsonPath = flagValue("json");
const strict = process.argv.includes("--strict");
const showOffenders = Number(flagValue("show") ?? 5);

interface QuestionRow {
  questionNum: number;
  module: string | null;
  question: string;
  options: string;
  correctIndex: number;
}

const connection = await mysql.createConnection(databaseUrl);

try {
  const [bankRows] = await connection.query<any[]>(
    bankFilter
      ? "SELECT DISTINCT bankKey FROM questions WHERE bankKey = ? ORDER BY bankKey"
      : "SELECT DISTINCT bankKey FROM questions ORDER BY bankKey",
    bankFilter ? [bankFilter] : [],
  );

  if (bankRows.length === 0) {
    console.error(bankFilter ? `No bank found matching "${bankFilter}".` : "No question banks found.");
    process.exit(1);
  }

  const report: Record<string, unknown> = {};
  let failingBanks = 0;
  let totalQuestions = 0;
  let totalTells = 0;
  let totalSkipped = 0;

  console.log(
    `Answer-length bias audit — chance baseline ${Math.round(CHANCE_LONGEST_RATE * 100)}%, ` +
      `bank fails above ${Math.round(BANK_LONGEST_RATE_THRESHOLD * 100)}%\n`,
  );

  for (const { bankKey } of bankRows) {
    const [rows] = await connection.query<any[]>(
      "SELECT questionNum, module, question, options, correctIndex FROM questions WHERE bankKey = ? ORDER BY questionNum",
      [bankKey],
    );

    const questions: BiasCheckQuestion[] = [];
    const skipped: number[] = [];

    for (const row of rows as QuestionRow[]) {
      try {
        const options = JSON.parse(row.options);
        if (!Array.isArray(options) || options.length < 2) {
          skipped.push(row.questionNum);
          continue;
        }
        questions.push({
          questionNum: row.questionNum,
          module: row.module,
          question: row.question,
          options: options.map((option: unknown) => String(option)),
          correctIndex: row.correctIndex,
        });
      } catch {
        skipped.push(row.questionNum);
      }
    }

    const summary = summariseAnswerLengthBias(questions);
    totalQuestions += summary.total;
    totalTells += summary.tellCount;
    totalSkipped += skipped.length;
    if (summary.failsThreshold) failingBanks += 1;

    console.log(formatBankVerdict(bankKey, summary));
    if (skipped.length > 0) {
      console.log(`     ${skipped.length} row(s) skipped: options were not a valid JSON array`);
    }

    for (const offender of summary.offenders.slice(0, showOffenders)) {
      const band = targetDistractorLength(offender.correctLength);
      console.log(
        `     q${offender.questionNum} [${offender.module ?? "no module"}] ` +
          `correct ${offender.correctLength} chars vs longest distractor ${offender.longestDistractorLength} ` +
          `(+${offender.charAdvantage}) → rewrite distractors to ${band.min}-${band.max} chars`,
      );
    }
    if (summary.offenders.length > showOffenders) {
      console.log(`     ...and ${summary.offenders.length - showOffenders} more`);
    }

    report[bankKey] = {
      total: summary.total,
      longestCorrect: summary.longestCorrect,
      longestCorrectRate: Number(summary.longestCorrectRate.toFixed(4)),
      tellCount: summary.tellCount,
      tellRate: Number(summary.tellRate.toFixed(4)),
      positionCounts: summary.positionCounts,
      failsThreshold: summary.failsThreshold,
      skippedQuestionNums: skipped,
      offenders: summary.offenders.map(offender => ({
        questionNum: offender.questionNum,
        module: offender.module,
        correctLength: offender.correctLength,
        longestDistractorLength: offender.longestDistractorLength,
        charAdvantage: offender.charAdvantage,
        targetDistractorLength: targetDistractorLength(offender.correctLength),
      })),
    };
  }

  console.log(
    `\n${bankRows.length} bank(s) | ${totalQuestions} questions | ` +
      `${totalTells} exploitable length tells | ${failingBanks} bank(s) above threshold` +
      (totalSkipped > 0 ? ` | ${totalSkipped} unparsable row(s)` : ""),
  );

  if (jsonPath) {
    writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
    console.log(`Remediation worklist written to ${jsonPath}`);
  }

  if (strict && failingBanks > 0) {
    console.error(`\n${failingBanks} bank(s) exceed the acceptable longest-correct rate.`);
    process.exit(1);
  }
} finally {
  await connection.end();
}
