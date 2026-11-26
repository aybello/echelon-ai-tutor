import { readFile, writeFile } from "node:fs/promises";
import { analyseQuestion, targetDistractorLength } from "../server/answerLengthBias.ts";

const apiKey = process.env.ANTHROPIC_API_KEY;
const openAiApiKey = process.env.OPENAI_CUSTOM_API_KEY;
const useOpenAi = process.argv.includes("--provider=openai");
if (useOpenAi && !openAiApiKey) throw new Error("OPENAI_CUSTOM_API_KEY is required for the GPT fallback.");
if (!useOpenAi && !apiKey) throw new Error("ANTHROPIC_API_KEY is required.");
const candidatePath = "/home/ubuntu/echelon-ai-tutor/docs/oit-wastewater-source-repair-candidates-2026-08-30.json";
const outputPath = "/tmp/oit-wastewater-source-repair-rebalanced-candidates.json";
const allCandidates = JSON.parse(await readFile(candidatePath, "utf8"));
const excludedArgument = process.argv.find(argument => argument.startsWith("--exclude-question-nums="));
const excludedQuestionNumbers = new Set(
  (excludedArgument?.slice("--exclude-question-nums=".length) || "")
    .split(",")
    .map(value => Number.parseInt(value, 10))
    .filter(Number.isInteger),
);
const candidates = allCandidates.filter(candidate => !excludedQuestionNumbers.has(candidate.questionNum));
if (candidates.length === 0) throw new Error("No candidates remain after exclusions.");
const batchSizeArgument = process.argv.find(argument => argument.startsWith("--batch-size="));
const batchSize = Number.parseInt(batchSizeArgument?.slice("--batch-size=".length) || "3", 10);
if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 3) throw new Error("--batch-size must be an integer from 1 to 3.");

function parseJsonObject(text) {
  const normalized = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
  const start = normalized.indexOf("{");
  const end = normalized.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Response did not contain a complete JSON object.");
  const candidate = normalized.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch (originalError) {
    for (const suffix of ["]}", "}"] ) {
      try {
        return JSON.parse(`${candidate}${suffix}`);
      } catch {
        // Try the next tightly bounded closure recovery.
      }
    }
    throw originalError;
  }
}

async function rewriteBatch(batch) {
  const items = batch.map(candidate => {
    const correct = candidate.options[candidate.correctIndex];
    const band = targetDistractorLength(correct.length);
    return {
      questionNum: candidate.questionNum,
      question: candidate.question,
      correct,
      currentDistractors: candidate.options.filter((_, index) => index !== candidate.correctIndex),
      minChars: Math.max(20, Math.round(band.min * 0.9)),
      maxChars: band.max,
    };
  });
  let retryFeedback = "";

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const prompt = `You are repairing length cues in multiple-choice questions for Ontario wastewater operator training. Rewrite only the three distractors for every item below. Do not change the stem, correct answer, answer position, explanation, jurisdiction, or sources.

Each distractor must be clearly wrong yet plausible. It may state a technical misconception but must never instruct or normalize ignoring a spill, alarm, inspection, isolation, lockout, safety control, or required maintenance. Do not invent thresholds, regulations, precise operating values, or facility-specific procedures. Do not use all/none of the above. Every distractor must be distinct.

For each item, keep every distractor within its stated character band. At least one distractor must have a character count equal to or greater than the correct answer; do not return a shorter substitute for that required long distractor. Return exactly one JSON object: {"rewrites":[{"questionNum":123,"distractors":["...","...","..."]}]} with one record for every supplied item.

${retryFeedback ? `The last draft failed these non-negotiable structural checks. Correct them exactly in this new draft: ${retryFeedback}` : ""}

ITEMS:
${JSON.stringify(items)}`;
    try {
      const response = await fetch(useOpenAi ? "https://api.openai.com/v1/chat/completions" : "https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: useOpenAi
          ? { Authorization: `Bearer ${openAiApiKey}`, "content-type": "application/json" }
          : { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        signal: AbortSignal.timeout(150_000),
        body: JSON.stringify(useOpenAi
          ? {
              model: "gpt-5.6-sol",
              max_completion_tokens: 6000,
              reasoning_effort: "low",
              messages: [
                { role: "system", content: "Return only complete JSON without Markdown fences." },
                { role: "user", content: prompt },
              ],
            }
          : {
              model: "claude-sonnet-5",
              max_tokens: 6000,
              thinking: { type: "adaptive" },
              output_config: { effort: "low" },
              system: "Return only complete JSON without Markdown fences.",
              messages: [{ role: "user", content: prompt }],
            }),
      });
      if (!response.ok) throw new Error(`External rewrite failed: ${response.status} ${await response.text()}`);
      const payload = await response.json();
      const text = useOpenAi
        ? payload.choices?.[0]?.message?.content
        : payload.content?.find(block => block.type === "text")?.text;
      if (!text) throw new Error("External rewrite model returned no text");
      const result = parseJsonObject(text);
      if (!Array.isArray(result.rewrites) || result.rewrites.length !== batch.length) {
        throw new Error(`Expected ${batch.length} rewrites, received ${result.rewrites?.length ?? 0}`);
      }
      const expected = batch.map(candidate => candidate.questionNum).sort((a, b) => a - b);
      const actual = result.rewrites.map(rewrite => rewrite.questionNum).sort((a, b) => a - b);
      if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error("Rewrite question numbers do not match the requested batch.");
      const inputsByQuestion = new Map(items.map(item => [item.questionNum, item]));
      const invalid = result.rewrites.flatMap(rewrite => {
        const item = inputsByQuestion.get(rewrite.questionNum);
        const distractors = rewrite.distractors;
        const problems = [];
        if (!Array.isArray(distractors) || distractors.length !== 3) {
          problems.push("expected exactly three distractors");
        } else {
          if (distractors.some(distractor => typeof distractor !== "string" || distractor.trim().length < item.minChars || distractor.trim().length > item.maxChars)) {
            problems.push(`each distractor must be ${item.minChars}-${item.maxChars} characters`);
          }
          if (distractors.every(distractor => distractor.trim().length < item.correct.length)) {
            problems.push("at least one distractor must be at least as long as the correct answer");
          }
          if (new Set(distractors.map(distractor => distractor.trim().toLowerCase())).size !== 3) {
            problems.push("distractors must be distinct");
          }
          if (distractors.some(distractor => distractor.trim().toLowerCase() === item.correct.trim().toLowerCase())) {
            problems.push("distractor duplicates the correct answer");
          }
        }
        return problems.length > 0 ? [{ questionNum: rewrite.questionNum, problems }] : [];
      });
      if (invalid.length > 0) {
        retryFeedback = JSON.stringify(invalid);
        throw new Error(`Structural rewrite validation failed: ${retryFeedback}`);
      }
      return result.rewrites;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt * 2000));
    }
  }
  throw lastError;
}

const rewritten = [];
for (let index = 0; index < candidates.length; index += batchSize) {
  rewritten.push(...await rewriteBatch(candidates.slice(index, index + batchSize)));
}
const rewritesByQuestion = new Map(rewritten.map(rewrite => [rewrite.questionNum, rewrite.distractors]));
const merged = allCandidates.map(candidate => {
  const distractors = rewritesByQuestion.get(candidate.questionNum);
  if (!distractors) return candidate;
  if (!Array.isArray(distractors) || distractors.length !== 3) throw new Error(`Missing three distractors for q${candidate.questionNum}`);
  const queue = [...distractors];
  return {
    ...candidate,
    options: candidate.options.map((option, index) => index === candidate.correctIndex ? option : queue.shift()),
  };
});
const failures = merged
  .map(candidate => {
    const result = analyseQuestion({ questionNum: candidate.questionNum, options: candidate.options, correctIndex: candidate.correctIndex });
    return result.hasLengthTell ? { questionNum: candidate.questionNum, correctLength: result.correctLength, longestDistractorLength: result.longestDistractorLength } : null;
  })
  .filter(Boolean);
if (failures.length > 0) throw new Error(`Rebalanced options still have answer-length tells: ${JSON.stringify(failures)}`);
await writeFile(outputPath, `${JSON.stringify(merged, null, 2)}\n`);
console.log(`Generated structurally balanced distractors for ${merged.length} OIT Wastewater candidates.`);
