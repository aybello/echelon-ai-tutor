import { readFile, writeFile } from "node:fs/promises";
import { analyseQuestion } from "../server/answerLengthBias.ts";

const candidatePath = process.env.CANDIDATE_PATH || "/home/ubuntu/echelon-ai-tutor/docs/oit-water-source-repair-candidates-2026-08-30.json";
const outputPath = process.env.REVIEW_OUTPUT_PATH || "/home/ubuntu/echelon-ai-tutor/docs/oit-water-source-repair-gpt-independent-review-2026-08-30.json";
const candidates = JSON.parse(await readFile(candidatePath, "utf8"));
const sources = await readFile("/home/ubuntu/echelon-ai-tutor/docs/oit-water-source-repair-batch-2026-08-30.md", "utf8");

const structuralFailures = candidates
  .map(candidate => {
    const check = analyseQuestion({
      questionNum: candidate.questionNum,
      options: candidate.options,
      correctIndex: candidate.correctIndex,
    });
    return check.hasLengthTell
      ? { questionNum: candidate.questionNum, correctLength: check.correctLength, longestDistractorLength: check.longestDistractorLength }
      : null;
  })
  .filter(Boolean);
if (structuralFailures.length > 0) {
  throw new Error(`Structural answer-length checks failed: ${JSON.stringify(structuralFailures)}`);
}

const response = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.OPENAI_CUSTOM_API_KEY}`,
    "content-type": "application/json",
  },
  signal: AbortSignal.timeout(180000),
  body: JSON.stringify({
    model: "gpt-5.6-sol",
    max_completion_tokens: 18000,
    reasoning_effort: "medium",
    messages: [
      {
        role: "system",
        content:
          "You are an independent senior Ontario water and wastewater operator certification reviewer. Review every candidate independently. Protect learners from inaccurate regulatory claims, unsafe operating advice, misleading distractors, untraceable sources, and ambiguous answer keys. You did not draft these items. Return JSON only.",
      },
      {
        role: "user",
        content: `Assess each proposed item against the source record. Approve an item only when: the source supports the stated claim; regulatory scope is accurate; exactly one option is defensibly correct; all distractors are clearly wrong yet plausible; and no option normalizes unsafe operation, delayed reporting, omitted isolation, or other harmful action. A source title and URL must be traceable, even for non-regulatory operating-principle questions.

Return exactly this JSON object, with one decision for each supplied question number:
{"reviews":[{"questionNum":104,"approved":true,"severity":"none|minor|major|critical","reasons":["..."],"requiredChanges":["..."]}]}

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
const text = typeof content === "string"
  ? content
  : Array.isArray(content)
    ? content.map(part => part?.text || "").join("")
    : "";
if (!text) {
  await writeFile("/tmp/oit-water-source-repair-gpt-empty-response.json", `${JSON.stringify(payload, null, 2)}\n`);
  throw new Error(`Independent GPT reviewer returned no text content (finish reason: ${payload.choices?.[0]?.finish_reason || "unknown"})`);
}
const normalized = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
const review = JSON.parse(normalized);
const candidateQuestionNumbers = new Set(candidates.map(candidate => candidate.questionNum));
const reviewQuestionNumbers = new Set(review.reviews?.map(decision => decision.questionNum));
if (
  !Array.isArray(review.reviews)
  || reviewQuestionNumbers.size !== candidateQuestionNumbers.size
  || [...candidateQuestionNumbers].some(questionNum => !reviewQuestionNumbers.has(questionNum))
  || review.reviews.some(decision => typeof decision.approved !== "boolean" || typeof decision.severity !== "string")
) {
  throw new Error("Independent GPT review did not return one valid decision for every controlled candidate.");
}
await writeFile(outputPath, `${JSON.stringify(review, null, 2)}\n`);
console.log(JSON.stringify(review, null, 2));
