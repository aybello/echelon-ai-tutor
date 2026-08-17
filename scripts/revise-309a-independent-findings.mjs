import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const provider = process.env.QUESTION_REVIEW_PROVIDER ?? "anthropic";
const apiKey = provider === "perplexity" ? process.env.SONAR_API_KEY : process.env.ANTHROPIC_API_KEY;
const model = process.env.QUESTION_REVIEW_MODEL ?? (provider === "perplexity" ? "sonar-pro" : "claude-opus-5");
const report = JSON.parse(readFileSync(resolve(root, "reports/309a-independent-quality-review.json"), "utf8"));
const diagramCatalogue = JSON.parse(readFileSync(resolve(root, "content/309a/309a-diagrams.json"), "utf8"));
const diagramById = new Map(diagramCatalogue.diagrams.map((diagram) => [diagram.id, diagram.altText]));
const files = ["batch-b.json", "batch-c.json", "batch-d.json", "batch-e.json"];
const questionChunkSize = 1;
const concurrentChunkLimit = 1;
const selectedCategories = new Set((process.env.REPAIR_CATEGORIES ?? "").split(",").map((value) => value.trim()).filter(Boolean));
const skippedQuestionNumbers = new Set((process.env.REPAIR_SKIP_IDS ?? "").split(",").map((value) => Number(value.trim())).filter(Number.isInteger));

if (!apiKey) throw new Error(`${provider === "perplexity" ? "SONAR_API_KEY" : "ANTHROPIC_API_KEY"} is required for the independent-review repair pass.`);

const documents = new Map(files.map((file) => {
  const path = resolve(root, "content/309a/questions", file);
  return [file, { path, document: JSON.parse(readFileSync(path, "utf8")) }];
}));
const findings = report.chunks
  .flatMap((chunk) => chunk.items)
  .filter((item) => item.verdict === "needs_revision")
  .filter((item) => selectedCategories.size === 0 || item.issues.some((issue) => selectedCategories.has(issue.category)))
  .filter((item) => !skippedQuestionNumbers.has(item.bankItemNumber));
const records = findings.map((finding) => {
  const found = [...documents.entries()]
    .map(([file, value]) => ({ file, ...value, question: value.document.questions.find((item) => item.bankItemNumber === finding.bankItemNumber) }))
    .find((candidate) => candidate.question);
  if (!found) throw new Error(`Could not locate question ${finding.bankItemNumber}.`);
  return { ...found, finding };
});

function stripFence(value) {
  return value.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
}

function validateRevision(original, revision) {
  if (typeof revision.question !== "string" || revision.question.length < 30) throw new Error("Revised stem is too short.");
  if (!Array.isArray(revision.options) || revision.options.length !== 4 || new Set(revision.options).size !== 4) throw new Error("Revised options are invalid.");
  if (revision.correctIndex !== original.correctIndex) throw new Error("Revision changed the governed correct-answer position.");
  if (typeof revision.explanation !== "string" || revision.explanation.length < 60) throw new Error("Revised explanation is too short.");
  const text = `${revision.question} ${revision.options.join(" ")} ${revision.explanation}`;
  if (/all of the above|none of the above|\bCEC\s+(?:rule|table)|\bRule\s+\d|\bTable\s+\d/i.test(text)) {
    throw new Error("Revision introduced prohibited answer or citation content.");
  }
  const correctLength = revision.options[revision.correctIndex].length;
  const distractorAverage = revision.options.filter((_, index) => index !== revision.correctIndex).reduce((sum, option) => sum + option.length, 0) / 3;
  if (correctLength / distractorAverage > 2.25) throw new Error("Revision retains a correct-answer length cue.");
}

function compactRecord(record) {
  const { question, finding } = record;
  return {
    original: {
      bankItemNumber: question.bankItemNumber,
      topic: question.topic,
      taskCode: question.taskCode,
      subtaskCode: question.subtaskCode,
      questionType: question.questionType,
      cognitiveLevel: question.cognitiveLevel,
      isCalc: question.isCalc,
      question: question.question,
      options: question.options,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
      diagramId: question.diagramId,
      diagramDescription: question.diagramId ? diagramById.get(question.diagramId) : null,
    },
    findings: finding.issues,
  };
}

async function reviseChunk(chunk) {
  const instruction = [
    "You are revising original Ontario 309A practice questions after independent quality review.",
    "Return strict JSON only: {\"items\":[{\"bankItemNumber\":number,\"question\":string,\"options\":[string,string,string,string],\"correctIndex\":number,\"explanation\":string}]}.",
    "Do not return steps, tips, diagram fields, findings, source metadata, reasoning, Markdown, or any other keys.",
    "Return exactly one revised item for every supplied original item, in any order. Keep each correctIndex exactly unchanged and preserve the intended technically correct principle.",
    "Correct every reported issue. Use specific, realistic electrical-trades work contexts. Distractors must be plausible but wrong, comparable in length to the correct choice, and never reckless, absurd, self-defeating, or obviously incomplete.",
    "For calculation items, preserve the stated numerical givens, correct answer value, and existing worked steps; correct only the stem wording, distractors, and explanation so calculations and stated distractor rationale are accurate.",
    "For an item with diagramId, make the diagram essential by asking about a specific component, path, or relationship in the supplied diagram description. Do not merely say 'refer to the diagram.'",
    "Align the learning task with the supplied topic. Explanations must be learner-focused and never mention review, repair, audits, templates, or question writing.",
    "Do not use Canadian Electrical Code rule/table numbers, all-of-the-above, or none-of-the-above.",
  ].join("\n");
  const expected = new Map(chunk.map((record) => [record.question.bankItemNumber, record]));
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const request = provider === "perplexity"
        ? {
            url: "https://api.perplexity.ai/chat/completions",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: {
              model,
              max_tokens: 1800,
              messages: [
                { role: "system", content: instruction },
                { role: "user", content: JSON.stringify({ items: chunk.map(compactRecord) }) },
              ],
            },
          }
        : {
            url: "https://api.anthropic.com/v1/messages",
            headers: {
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
              "Content-Type": "application/json",
            },
            body: {
              model,
              max_tokens: 8000,
              system: instruction,
              messages: [{ role: "user", content: JSON.stringify({ items: chunk.map(compactRecord) }) }],
            },
          };
      const response = await fetch(request.url, {
        method: "POST",
        headers: request.headers,
        body: JSON.stringify(request.body),
        signal: AbortSignal.timeout(240_000),
      });
      if (!response.ok) throw new Error(`${provider} HTTP ${response.status}: ${await response.text()}`);
      const payload = await response.json();
      const text = provider === "perplexity"
        ? payload.choices?.[0]?.message?.content ?? ""
        : payload.content?.find((block) => block.type === "text")?.text ?? "";
      const parsed = JSON.parse(stripFence(text));
      if (!Array.isArray(parsed.items) || parsed.items.length !== chunk.length) throw new Error("Revision response is incomplete.");
      const revisions = new Map();
      for (const revision of parsed.items) {
        const record = expected.get(revision.bankItemNumber);
        if (!record || revisions.has(revision.bankItemNumber)) throw new Error("Revision response contains an invalid or duplicate bank item number.");
        validateRevision(record.question, revision);
        revisions.set(revision.bankItemNumber, revision);
      }
      return revisions;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 2_000));
    }
  }
  throw lastError;
}

const chunks = Array.from({ length: Math.ceil(records.length / questionChunkSize) }, (_, index) =>
  records.slice(index * questionChunkSize, (index + 1) * questionChunkSize),
);
const repairLog = [];
let completed = 0;
for (let start = 0; start < chunks.length; start += concurrentChunkLimit) {
  const group = chunks.slice(start, start + concurrentChunkLimit);
  console.log(`Starting repair for question ${group.flatMap((chunk) => chunk.map((record) => record.question.bankItemNumber)).join(", ")}.`);
  const results = await Promise.all(group.map(reviseChunk));
  for (const revisions of results) {
    for (const [bankItemNumber, revision] of revisions) {
      const record = records.find((candidate) => candidate.question.bankItemNumber === bankItemNumber);
      record.question.question = revision.question;
      record.question.options = revision.options;
      record.question.correctIndex = revision.correctIndex;
      record.question.explanation = revision.explanation;
      repairLog.push({ bankItemNumber, status: "revised" });
      completed += 1;
    }
  }
  for (const { path, document } of documents.values()) writeFileSync(path, `${JSON.stringify(document, null, 2)}\n`);
  console.log(`Revised ${completed}/${records.length} independently flagged questions.`);
}

writeFileSync(resolve(root, "reports/309a-independent-repair-log.json"), `${JSON.stringify(repairLog, null, 2)}\n`);
console.log(`Independent-review repair completed: ${completed} questions revised.`);
