/**
 * scripts/fix-answer-length-bias.ts
 *
 * Repairs "length tell" bias by rewriting distractors so they no longer stand
 * apart from the correct option. See server/answerLengthBias.ts for detection.
 *
 * Safety rules this script enforces:
 *   - The correct option text is never modified. Trimming a correct answer
 *     risks removing the qualifying detail that makes it correct, so only the
 *     three distractors are rewritten.
 *   - correctIndex never moves, so answer-position balance is unchanged.
 *   - Every rewrite is re-measured; if it still carries a length tell, or the
 *     correct option changed, the rewrite is rejected and the row is skipped.
 *   - Written rows are reset to reviewStatus='in_review' so they re-enter the
 *     governance queue. A machine rewrite is a draft, not an approval.
 *   - questionBankMeta.contentVersion is bumped so client caches invalidate.
 *
 * Dry run by default. Nothing is written without --execute.
 *
 * Usage:
 *   pnpm fix:answer-bias -- --bank class1-water            # preview
 *   pnpm fix:answer-bias -- --bank class1-water --execute
 *   pnpm fix:answer-bias -- --bank class1-water --limit 25 --execute
 */

import mysql from "mysql2/promise";
import {
  analyseQuestion,
  summariseAnswerLengthBias,
  targetDistractorLength,
  type BiasCheckQuestion,
} from "../server/answerLengthBias.ts";
import { closeDatabaseConnection } from "../server/connectionCleanup.ts";

const databaseUrl = process.env.DATABASE_URL;
const apiKey = process.env.ANTHROPIC_API_KEY;
const model = process.env.ANTHROPIC_REWRITE_MODEL || "claude-sonnet-5";
const semanticReviewApiKey = process.env.OPENAI_CUSTOM_API_KEY || process.env.OPENAI_API_KEY;
const semanticReviewModel = process.env.OPENAI_REVIEW_MODEL || "gpt-5.6-sol";

if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

function flagValue(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const bankFilter = flagValue("bank");
const limit = Number(flagValue("limit") ?? 25);
const execute = process.argv.includes("--execute");

if (execute && !apiKey) {
  console.error("ANTHROPIC_API_KEY is required to generate rewrites.");
  process.exit(1);
}
if (execute && !semanticReviewApiKey) {
  console.error("OPENAI_CUSTOM_API_KEY or OPENAI_API_KEY is required to quality-review rewrites.");
  process.exit(1);
}
if (!bankFilter) {
  console.error("--bank <bankKey> is required so a run is always scoped to one bank.");
  process.exit(1);
}

interface Rewrite {
  distractors: string[];
}

interface SemanticReview {
  approved: boolean;
  severity: "none" | "minor" | "major" | "critical";
  reasons: string[];
}

async function executeWrite(sql: string, values: any[]): Promise<void> {
  const writeConnection = await mysql.createConnection(databaseUrl!);
  try {
    await writeConnection.execute(sql, values);
  } finally {
    await closeDatabaseConnection(writeConnection);
  }
}

function buildPrompt(
  question: { question: string; correct: string; distractors: string[]; module: string | null },
  band: { min: number; max: number },
  retryReason?: string,
): string {
  return `You are an expert Ontario water and wastewater operator certification item writer.

A multiple-choice question has a flaw: its correct answer is far more detailed than its distractors, so a candidate can pick the right answer purely by choosing the longest option. Rewrite ONLY the three distractors so they match the correct answer in length, specificity and tone.

HARD RULES:
- Do NOT change the correct answer. Do not restate or paraphrase it.
- Each distractor must be clearly WRONG to a knowledgeable operator, but plausible to someone who has not studied. Use real misconceptions, adjacent processes, or the right idea applied to the wrong stage.
- Each distractor must be between ${band.min} and ${band.max} characters.
- At least one distractor must be as long as or longer than the correct answer, while remaining clearly wrong.
- Distractors must be distinct from each other and from the correct answer.
- Do not invent regulation numbers, code citations, or specific numeric limits.
- Do not use "all of the above", "none of the above", or absolute words like always/never.
- State an incorrect explanation, mechanism, priority, or consequence; do NOT tell an operator to skip, ignore, or omit any inspection, isolation, lockout, alarm response, or required maintenance action.
- A distractor may state a realistic technical misconception, but it must not read as a recommended operating or maintenance instruction.

${retryReason ? `PREVIOUS DRAFT REJECTED: ${retryReason}. Produce a fresh JSON object that corrects this issue.\n` : ""}

MODULE: ${question.module ?? "unspecified"}
QUESTION: ${question.question}
CORRECT ANSWER (do not change, do not reuse): ${question.correct}
CURRENT WEAK DISTRACTORS: ${JSON.stringify(question.distractors)}

Return valid JSON only, no Markdown fences:
{"distractors":["...","...","..."]}`;
}

async function requestRewrite(prompt: string): Promise<Rewrite> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey as string,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(75_000),
        body: JSON.stringify({
          model,
          max_tokens: 2048,
          thinking: { type: "adaptive" },
          output_config: { effort: "low" },
          system:
            "You are an expert water and wastewater operator certification item writer. Return valid JSON only, without Markdown fences.",
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!response.ok) {
        throw new Error(`Anthropic request failed: ${response.status} ${await response.text()}`);
      }
      const payload = await response.json();
      const text = payload.content?.find((block: any) => block.type === "text")?.text;
      if (!text) throw new Error("Anthropic returned no content");
      const normalized = text
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/, "");
      try {
        return JSON.parse(normalized) as Rewrite;
      } catch {
        const start = normalized.indexOf("{");
        const end = normalized.lastIndexOf("}");
        if (start >= 0 && end > start) {
          return JSON.parse(normalized.slice(start, end + 1)) as Rewrite;
        }
        throw new Error("Anthropic response did not contain a JSON rewrite object");
      }
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt * 2000));
    }
  }
  throw lastError;
}

function parseJsonObject<T>(text: string): T {
  const normalized = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "");
  try {
    return JSON.parse(normalized) as T;
  } catch {
    const start = normalized.indexOf("{");
    const end = normalized.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(normalized.slice(start, end + 1)) as T;
    throw new Error("model response did not contain a JSON object");
  }
}

async function reviewRewriteSemantics(input: {
  question: string;
  correct: string;
  distractors: string[];
  module: string | null;
}): Promise<SemanticReview> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${semanticReviewApiKey as string}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(75_000),
    body: JSON.stringify({
      model: semanticReviewModel,
      max_completion_tokens: 1200,
      messages: [
        {
          role: "system",
          content:
            "You are a senior Ontario water and wastewater operator certification item reviewer. Return only JSON: {\"approved\":boolean,\"severity\":\"none|minor|major|critical\",\"reasons\":[string]}. Approve only if every distractor is clearly wrong yet technically plausible, does not normalize or instruct an unsafe practice, does not make another answer defensible, and preserves a single best answer. Do not reject a distractor merely because it states an inaccurate mechanism or consequence: that is permissible when it is clearly identifiable as a wrong test answer. Reject it when it directs an operator to omit or bypass a safety-critical action, presents a harmful practice as recommended, or creates technical ambiguity.",
        },
        { role: "user", content: JSON.stringify(input) },
      ],
    }),
  });
  if (!response.ok) throw new Error(`semantic review failed: ${response.status} ${await response.text()}`);
  const payload = await response.json();
  const text = payload.choices?.[0]?.message?.content;
  if (!text) throw new Error("semantic reviewer returned no content");
  return parseJsonObject<SemanticReview>(text);
}

/**
 * Reject any rewrite that fails a structural or bias check. Semantic
 * correctness is NOT verifiable here — that is what the review queue is for.
 */
function validateRewrite(
  original: { questionNum: number; options: string[]; correctIndex: number },
  rewrite: Rewrite,
  band: { min: number; max: number },
): string[] {
  const problems: string[] = [];
  if (!rewrite || !Array.isArray(rewrite.distractors) || rewrite.distractors.length !== 3) {
    return [`expected exactly 3 distractors`];
  }
  const correct = original.options[original.correctIndex].trim();
  const minimumAcceptableLength = Math.max(1, Math.round(band.min * 0.9));
  for (const distractor of rewrite.distractors) {
    if (typeof distractor !== "string" || distractor.trim().length === 0) {
      problems.push("empty distractor");
      continue;
    }
    const length = distractor.trim().length;
    if (length < minimumAcceptableLength || length > band.max) {
      problems.push(`distractor length ${length} outside ${minimumAcceptableLength}-${band.max}`);
    }
    if (distractor.trim().toLowerCase() === correct.toLowerCase()) {
      problems.push("distractor duplicates the correct answer");
    }
  }
  if (new Set(rewrite.distractors.map(d => d.trim().toLowerCase())).size !== 3) {
    problems.push("distractors are not distinct");
  }
  return problems;
}

/** Rebuild the option list, keeping the correct option at its original index. */
function rebuildOptions(
  original: { options: string[]; correctIndex: number },
  distractors: string[],
): string[] {
  const queue = [...distractors];
  return original.options.map((option, index) =>
    index === original.correctIndex ? option : (queue.shift() as string),
  );
}

const connection = await mysql.createConnection(databaseUrl);

try {
  const [rows] = await connection.query<any[]>(
    "SELECT questionNum, module, question, options, correctIndex FROM questions WHERE bankKey = ? ORDER BY questionNum",
    [bankFilter],
  );
  if (rows.length === 0) {
    console.error(`No questions found for bank "${bankFilter}".`);
    process.exit(1);
  }

  const parsed: BiasCheckQuestion[] = [];
  const byNum = new Map<number, { question: string; options: string[]; correctIndex: number; module: string | null }>();
  for (const row of rows) {
    try {
      const options = JSON.parse(row.options);
      if (!Array.isArray(options) || options.length < 2) continue;
      const record = {
        question: row.question as string,
        options: options.map((o: unknown) => String(o)),
        correctIndex: row.correctIndex as number,
        module: (row.module ?? null) as string | null,
      };
      byNum.set(row.questionNum, record);
      parsed.push({ questionNum: row.questionNum, module: record.module, options: record.options, correctIndex: record.correctIndex });
    } catch {
      /* unparsable row — reported by the audit script */
    }
  }

  const before = summariseAnswerLengthBias(parsed);
  console.log(
    `${bankFilter}: ${before.total} questions, ${before.tellCount} with an exploitable length tell ` +
      `(longest-correct ${Math.round(before.longestCorrectRate * 100)}%)`,
  );
  const worklist = before.offenders.slice(0, limit);
  console.log(`${execute ? "REWRITING" : "DRY RUN — previewing"} ${worklist.length} question(s)\n`);

  let fixed = 0;
  let skipped = 0;

  for (const offender of worklist) {
    const record = byNum.get(offender.questionNum)!;
    const band = targetDistractorLength(offender.correctLength);
    const correct = record.options[record.correctIndex];
    const distractors = record.options.filter((_, i) => i !== record.correctIndex);

    if (!execute) {
      console.log(
        `q${offender.questionNum}: correct ${offender.correctLength} chars vs longest distractor ` +
          `${offender.longestDistractorLength} (+${offender.charAdvantage}) → target ${band.min}-${band.max}`,
      );
      continue;
    }

    let rewritten = false;
    let rejectionReason = "";
    for (let generationAttempt = 1; generationAttempt <= 3 && !rewritten; generationAttempt += 1) {
      try {
        const rewrite = await requestRewrite(
          buildPrompt(
            { question: record.question, correct, distractors, module: record.module },
            band,
            rejectionReason || undefined,
          ),
        );
        const problems = validateRewrite({ questionNum: offender.questionNum, ...record }, rewrite, band);
        if (problems.length > 0) {
          rejectionReason = problems.join("; ");
          continue;
        }

        const newOptions = rebuildOptions(record, rewrite.distractors);
        if (newOptions[record.correctIndex] !== correct) {
          rejectionReason = "the correct option was altered";
          continue;
        }

        const recheck = analyseQuestion({
          questionNum: offender.questionNum,
          options: newOptions,
          correctIndex: record.correctIndex,
        });
        if (recheck.hasLengthTell) {
          rejectionReason =
            `the correct option is still conspicuously longer (${recheck.correctLength} versus ` +
            `${recheck.longestDistractorLength} characters for the longest distractor)`;
          continue;
        }

        const semanticReview = await reviewRewriteSemantics({
          question: record.question,
          correct,
          distractors: rewrite.distractors,
          module: record.module,
        });
        if (!semanticReview.approved || semanticReview.severity !== "none") {
          rejectionReason = `semantic review ${semanticReview.severity}: ${semanticReview.reasons.join("; ")}`;
          continue;
        }

        await executeWrite(
          "UPDATE questions SET options = ?, reviewStatus = 'in_review', reviewedBy = NULL, reviewedAt = NULL WHERE bankKey = ? AND questionNum = ?",
          [JSON.stringify(newOptions), bankFilter, offender.questionNum],
        );
        console.log(`q${offender.questionNum}: rewritten (+${offender.charAdvantage} → +${recheck.charAdvantage})`);
        fixed += 1;
        rewritten = true;
      } catch (error) {
        rejectionReason = (error as Error).message;
      }
    }

    if (!rewritten) {
      console.log(`q${offender.questionNum}: SKIPPED after 3 attempts — ${rejectionReason}`);
      skipped += 1;
    }
  }

  if (execute && fixed > 0) {
    await executeWrite(
      "UPDATE question_bank_meta SET contentVersion = contentVersion + 1 WHERE bankKey = ?",
      [bankFilter],
    );
    console.log(`\n${fixed} rewritten, ${skipped} skipped. contentVersion bumped for ${bankFilter}.`);
    console.log("All rewritten questions are reviewStatus='in_review' and need approval before learners see them.");
  } else if (execute) {
    console.log(`\n0 rewritten, ${skipped} skipped. No changes written.`);
  } else {
    console.log(`\nDry run complete. Re-run with --execute to apply.`);
  }
} finally {
  const closeResult = await closeDatabaseConnection(connection);
  if (closeResult === "forced") {
    console.warn("Database connection exceeded the 5-second close window and was force-closed.");
  }
}
