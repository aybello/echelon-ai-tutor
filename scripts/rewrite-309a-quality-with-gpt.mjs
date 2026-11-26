import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const batches = (process.env.QUESTION_REWRITE_BATCHES || "c,d,e").split(",").map((value) => value.trim()).filter(Boolean);
const chunkSize = 1;
const model = process.env.ANTHROPIC_309A_REWRITE_MODEL || "claude-sonnet-5";
const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) throw new Error("ANTHROPIC_API_KEY is required");

const sourceFacts = `
Ontario 309A current-exam authoring constraints:
- The current Red Seal Construction Electrician examination remains based on the previous Red Seal Occupational Standard.
- Use the official Major Work Activity and task/subtask allocation as the curriculum map, but do not copy source text.
- Create original instructional questions; do not reproduce official sample questions.
- Do not cite, quote, or invent Canadian Electrical Code rule numbers. Do not make rule-number-specific claims.
- Safe work decisions should emphasize isolation, verification, qualified work, approved drawings, manufacturer instructions, and escalation where appropriate.
`;

function contentHash(question) {
  const content = JSON.stringify({
    question: question.question,
    options: question.options,
    correctIndex: question.correctIndex,
    explanation: question.explanation,
    steps: question.steps,
    tip: question.tip,
    diagramId: question.diagramId,
    diagramAlt: question.diagramAlt,
  });
  return createHash("sha256").update(content).digest("hex");
}

function validateRewrite(original, rewrite) {
  if (!rewrite || typeof rewrite !== "object") throw new Error(`Missing rewrite for ${original.bankItemNumber}`);
  if (typeof rewrite.question !== "string" || rewrite.question.length < 55) {
    throw new Error(`Question ${original.bankItemNumber} needs a substantive scenario`);
  }
  if (!Array.isArray(rewrite.options) || rewrite.options.length !== 4 || new Set(rewrite.options).size !== 4) {
    throw new Error(`Question ${original.bankItemNumber} needs four distinct options`);
  }
  if (!Number.isInteger(rewrite.correctIndex) || rewrite.correctIndex < 0 || rewrite.correctIndex > 3) {
    throw new Error(`Question ${original.bankItemNumber} has invalid correctIndex`);
  }
  if (typeof rewrite.explanation !== "string" || rewrite.explanation.length < 130) {
    throw new Error(`Question ${original.bankItemNumber} needs a specific explanation`);
  }
  if (rewrite.steps !== null && (!Array.isArray(rewrite.steps) || rewrite.steps.length === 0)) {
    throw new Error(`Question ${original.bankItemNumber} has invalid steps`);
  }
  const prohibited = /\b(CEC|Canadian Electrical Code)\s*(rule|section)?\s*\d/i;
  if (prohibited.test(`${rewrite.question}\n${rewrite.explanation}\n${rewrite.options.join("\n")}`)) {
    throw new Error(`Question ${original.bankItemNumber} introduces an unlicensed code reference`);
  }
}

async function rewriteChunk(items) {
  const editable = items.map((item) => ({
    bankItemNumber: item.bankItemNumber,
    module: item.module,
    taskCode: item.taskCode,
    subtaskCode: item.subtaskCode,
    topic: item.topic,
    difficulty: item.difficulty,
    questionType: item.questionType,
    cognitiveLevel: item.cognitiveLevel,
    isCalc: item.isCalc,
    blueprintObjective: item.blueprintObjective,
    diagramId: item.diagramId,
    diagramAlt: item.diagramAlt,
    currentQuestion: item.question,
    currentOptions: item.options,
    currentCorrectIndex: item.correctIndex,
    currentExplanation: item.explanation,
    currentSteps: item.steps,
    currentTip: item.tip,
  }));

  const prompt = `${sourceFacts}
You are revising a bank of original Echelon Institute 309A practice questions that already maps to the correct official blueprint task. Return a rewritten learning-quality version for every item.

Every question must have a genuinely distinct setting, decision, symptom, evidence set, or calculation—not generic variations of "during an installation" or "during a planned upgrade". Avoid repetitive opening phrases across the group. Keep questions under 95 words, each option under 32 words, and explanations between 110 and 180 words. Distractors must be plausible and distinct. Explanations must name why the correct action fits the supplied evidence and why the tempting wrong approach fails. Preserve question type, difficulty, isCalc, task/subtask, and diagram linkage. Do not add content outside the supplied blueprint objective.

Return JSON only in this shape: {"rewrites":[{"bankItemNumber":number,"question":string,"options":[string,string,string,string],"correctIndex":0,"explanation":string,"steps":null|[{"label":string,"content":string}],"tip":null|string,"diagramAlt":null|string}]}

Items:
${JSON.stringify(editable)}`;

  let payload;
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(75_000),
        body: JSON.stringify({
          model,
          max_tokens: 5000,
          system: "You are an expert Canadian electrical-trades educator. Return valid JSON only, without Markdown fences.",
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!response.ok) throw new Error(`Anthropic request failed: ${response.status} ${await response.text()}`);
      payload = await response.json();
      break;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 2_000));
    }
  }
  if (!payload) throw lastError;
  const content = payload.content?.find((block) => block.type === "text")?.text;
  if (!content) throw new Error("Anthropic returned no rewrite content");
  const normalizedContent = content.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
  let parsed;
  try {
    parsed = JSON.parse(normalizedContent);
  } catch (error) {
    if (normalizedContent.startsWith('{"rewrites":') && normalizedContent.endsWith('}]')) {
      parsed = JSON.parse(`${normalizedContent}}`);
    } else {
      throw error;
    }
  }
  if (!Array.isArray(parsed.rewrites) || parsed.rewrites.length !== items.length) {
    throw new Error(`Expected ${items.length} rewrites, received ${parsed.rewrites?.length ?? 0}`);
  }
  return parsed.rewrites;
}

for (const batch of batches) {
  const file = resolve(root, "content", "309a", "questions", `batch-${batch}.json`);
  const bank = JSON.parse(readFileSync(file, "utf8"));
  const items = Array.isArray(bank) ? bank : bank.questions;
  if (!Array.isArray(items)) throw new Error(`Unexpected bank shape in ${file}`);

  const rewrites = new Map();
  for (let start = 0; start < items.length; start += chunkSize) {
    const chunk = items.slice(start, start + chunkSize);
    process.stdout.write(`Rewriting batch ${batch.toUpperCase()} items ${start + 1}-${start + chunk.length} of ${items.length}\n`);
    let response;
    let lastValidationError;
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      response = await rewriteChunk(chunk);
      try {
        response.forEach((rewrite, index) => validateRewrite(chunk[index], rewrite));
        lastValidationError = undefined;
        break;
      } catch (error) {
        lastValidationError = error;
        response = undefined;
        if (attempt < 4) {
          process.stdout.write(`Retrying batch ${batch.toUpperCase()} item ${start + 1} after validation: ${error.message}\n`);
          await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 2_000));
        }
      }
    }
    if (!response) throw lastValidationError;
    for (const rewrite of response) rewrites.set(rewrite.bankItemNumber, rewrite);
  }

  const revised = items.map((original) => {
    const rewrite = rewrites.get(original.bankItemNumber);
    validateRewrite(original, rewrite);
    const next = {
      ...original,
      question: rewrite.question.trim(),
      options: rewrite.options.map((option) => option.trim()),
      correctIndex: rewrite.correctIndex,
      explanation: rewrite.explanation.trim(),
      steps: rewrite.steps ?? null,
      tip: rewrite.tip?.trim() || null,
      diagramAlt: rewrite.diagramAlt?.trim() || original.diagramAlt || null,
    };
    next.contentHash = contentHash(next);
    return next;
  });

  const rendered = Array.isArray(bank) ? revised : { ...bank, questions: revised };
  writeFileSync(file, `${JSON.stringify(rendered, null, 2)}\n`);
}

console.log(`Rewrote ${batches.join(", ").toUpperCase()} batches using ${model}.`);
