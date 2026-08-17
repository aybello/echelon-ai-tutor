import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputDirectory = resolve(root, "reports");
const outputPath = resolve(outputDirectory, "309a-independent-quality-review.json");
const apiKey = process.env.ANTHROPIC_API_KEY;
const model = process.env.QUESTION_REVIEW_MODEL ?? "claude-opus-5";
const files = ["batch-b.json", "batch-c.json", "batch-d.json", "batch-e.json"];
const chunkSize = 10;

if (!apiKey) throw new Error("ANTHROPIC_API_KEY is required for independent review.");

const questions = files.flatMap((file) => {
  const document = JSON.parse(readFileSync(resolve(root, "content/309a/questions", file), "utf8"));
  return document.questions.map((question) => ({
    bankItemNumber: question.bankItemNumber,
    taskCode: question.taskCode,
    topic: question.topic,
    diagramId: question.diagramId,
    question: question.question,
    options: question.options,
    correctIndex: question.correctIndex,
    explanation: question.explanation,
  }));
});

function stripFence(value) {
  return value.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
}

async function reviewChunk(records, chunkNumber, totalChunks) {
  const instruction = [
    "You are an independent senior Canadian electrical-trades assessment reviewer.",
    "Review every supplied Ontario 309A practice question independently. Do not invent CEC rule numbers or citations.",
    "Approve a question only if its intended answer is technically defensible at the stated level, all distractors are plausible but wrong, the scenario is specific and non-template-like, and the explanation is accurate, learner-focused, and contains no repair or audit narration.",
    "If diagramId is present, the stem must meaningfully direct the learner to the diagram. Flag only substantive issues; do not flag style preferences.",
    "Return strict JSON only with this shape: {\"items\":[{\"bankItemNumber\":number,\"verdict\":\"pass\"|\"needs_revision\",\"issues\":[{\"category\":\"technical_accuracy\"|\"ambiguity\"|\"distractor_quality\"|\"repetition\"|\"diagram_use\"|\"explanation\",\"detail\":\"maximum 25 words\"}]}],\"chunkSummary\":\"maximum 40 words\"}. Use an empty issues array for a pass.",
    `This is chunk ${chunkNumber} of ${totalChunks}.`,
  ].join("\n");

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
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          system: instruction,
          messages: [
            { role: "user", content: JSON.stringify({ questions: records }) },
          ],
        }),
        signal: AbortSignal.timeout(180_000),
      });
      if (!response.ok) throw new Error(`Anthropic HTTP ${response.status}: ${await response.text()}`);
      const payload = await response.json();
      const text = payload.content?.find((block) => block.type === "text")?.text ?? "";
      const parsed = JSON.parse(stripFence(text));
      if (!Array.isArray(parsed.items) || parsed.items.length !== records.length) {
        throw new Error("Reviewer returned an incomplete item set.");
      }
      const expected = new Set(records.map((record) => record.bankItemNumber));
      for (const item of parsed.items) {
        if (!expected.has(item.bankItemNumber) || !["pass", "needs_revision"].includes(item.verdict)) {
          throw new Error("Reviewer returned an invalid item identifier or verdict.");
        }
      }
      return parsed;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 2_000));
    }
  }
  throw lastError;
}

mkdirSync(outputDirectory, { recursive: true });
const chunks = Array.from({ length: Math.ceil(questions.length / chunkSize) }, (_, index) =>
  questions.slice(index * chunkSize, (index + 1) * chunkSize),
);
const report = {
  reviewedAt: new Date().toISOString(),
  model,
  scope: "All rewritten Ontario 309A questions in batches B through E",
  questionCount: questions.length,
  chunks: [],
};

for (let index = 0; index < chunks.length; index += 1) {
  const reviewed = await reviewChunk(chunks[index], index + 1, chunks.length);
  report.chunks.push(reviewed);
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`Reviewed quality chunk ${index + 1}/${chunks.length}.\n`);
}

const items = report.chunks.flatMap((chunk) => chunk.items);
const flagged = items.filter((item) => item.verdict === "needs_revision");
writeFileSync(outputPath, `${JSON.stringify({ ...report, flaggedCount: flagged.length, flaggedItems: flagged }, null, 2)}\n`);
console.log(`Independent review completed: ${questions.length} questions reviewed, ${flagged.length} substantive findings.`);
