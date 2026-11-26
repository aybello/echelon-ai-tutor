import { readFile, writeFile } from "node:fs/promises";
import { analyseQuestion } from "../server/answerLengthBias.ts";

const candidatePath = "/home/ubuntu/echelon-ai-tutor/docs/oit-wastewater-source-repair-candidates-2026-08-30.json";
const outputPath = "/home/ubuntu/echelon-ai-tutor/docs/oit-wastewater-source-repair-gpt-independent-review-2026-08-30.json";
const sourcePath = "/home/ubuntu/echelon-ai-tutor/docs/oit-wastewater-source-repair-batch-2026-08-30.md";
const candidates = JSON.parse(await readFile(candidatePath, "utf8"));
const sources = await readFile(sourcePath, "utf8");

if (!Array.isArray(candidates) || candidates.length === 0 || candidates.length > 25) {
  throw new Error("Expected a non-empty controlled candidate set of at most 25 questions.");
}
const structuralFailures = candidates
  .map(candidate => {
    const check = analyseQuestion({ questionNum: candidate.questionNum, options: candidate.options, correctIndex: candidate.correctIndex });
    return check.hasLengthTell
      ? { questionNum: candidate.questionNum, correctLength: check.correctLength, longestDistractorLength: check.longestDistractorLength }
      : null;
  })
  .filter(Boolean);
if (structuralFailures.length > 0) throw new Error(`Structural answer-length checks failed: ${JSON.stringify(structuralFailures)}`);

const response = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.OPENAI_CUSTOM_API_KEY}`, "content-type": "application/json" },
  signal: AbortSignal.timeout(240_000),
  body: JSON.stringify({
    model: "gpt-5.6-sol",
    max_completion_tokens: 20000,
    reasoning_effort: "medium",
    messages: [
      {
        role: "system",
        content: "You are an independent senior Ontario wastewater operator-certification reviewer. You did not draft these candidates. Review every item independently and protect learners from inaccurate Ontario regulatory claims, unsafe operational advice, misleading distractors, untraceable sources, and ambiguous answer keys. Return JSON only.",
      },
      {
        role: "user",
        content: `Assess every proposed question against the source record. Approve only if: the source supports the stated claim and jurisdiction; exactly one option is defensibly correct; all distractors are clearly wrong yet plausible; no option normalizes unsafe operation, delayed reporting, omitted isolation, or another harmful action; and all source fields are traceable. Reject or hold any U.S.-specific term presented as Ontario law, unsupported numeric claim, source mismatch, or operational ambiguity.

Return exactly this JSON object with one decision for every supplied question number:
{"reviews":[{"questionNum":123,"approved":true,"severity":"none|minor|major|critical","reasons":["..."],"requiredChanges":["..."]}]}

SOURCE RECORD:
${sources}

CANDIDATES:
${JSON.stringify(candidates)}`,
      },
    ],
  }),
});
if (!response.ok) throw new Error(`Independent GPT review failed: ${response.status} ${await response.text()}`);
const payload = await response.json();
const content = payload.choices?.[0]?.message?.content;
const text = typeof content === "string" ? content : Array.isArray(content) ? content.map(part => part?.text || "").join("") : "";
if (!text) throw new Error(`Independent GPT reviewer returned no text content (finish reason: ${payload.choices?.[0]?.finish_reason || "unknown"})`);
const normalized = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
const review = JSON.parse(normalized);
const candidateQuestionNumbers = new Set(candidates.map(candidate => candidate.questionNum));
const reviewQuestionNumbers = new Set(review.reviews?.map(decision => decision.questionNum));
if (
  !Array.isArray(review.reviews)
  || reviewQuestionNumbers.size !== candidateQuestionNumbers.size
  || [...candidateQuestionNumbers].some(questionNum => !reviewQuestionNumbers.has(questionNum))
  || review.reviews.some(decision => typeof decision.approved !== "boolean" || typeof decision.severity !== "string")
) throw new Error("Independent GPT review did not return one valid decision for every controlled candidate.");
await writeFile(outputPath, `${JSON.stringify(review, null, 2)}\n`);
console.log(JSON.stringify(review, null, 2));
