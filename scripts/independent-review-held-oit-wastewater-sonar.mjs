import { readFile, writeFile } from "node:fs/promises";
import { analyseQuestion } from "../server/answerLengthBias.ts";

const apiKey = process.env.SONAR_API_KEY;
if (!apiKey) throw new Error("SONAR_API_KEY is required");
const candidatePath = "/home/ubuntu/echelon-ai-tutor/docs/oit-wastewater-source-repair-candidates-2026-08-30.json";
const outputPath = "/home/ubuntu/echelon-ai-tutor/docs/oit-wastewater-held-repairs-sonar-independent-review-2026-08-30.json";
const selectedQuestionNumbers = new Set([426, 436, 437, 496, 521, 536, 540]);
const candidates = JSON.parse(await readFile(candidatePath, "utf8")).filter(candidate => selectedQuestionNumbers.has(candidate.questionNum));
const sources = await readFile("/home/ubuntu/echelon-ai-tutor/docs/oit-wastewater-source-repair-batch-2026-08-30.md", "utf8");

if (candidates.length !== selectedQuestionNumbers.size) throw new Error("Expected exactly seven held OIT Wastewater candidates.");
const structuralFailures = candidates
  .map(candidate => {
    const result = analyseQuestion({ questionNum: candidate.questionNum, options: candidate.options, correctIndex: candidate.correctIndex });
    return result.hasLengthTell ? { questionNum: candidate.questionNum, correctLength: result.correctLength, longestDistractorLength: result.longestDistractorLength } : null;
  })
  .filter(Boolean);
if (structuralFailures.length > 0) throw new Error(`Structural answer-length checks failed: ${JSON.stringify(structuralFailures)}`);

const response = await fetch("https://api.perplexity.ai/chat/completions", {
  method: "POST",
  headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
  signal: AbortSignal.timeout(240_000),
  body: JSON.stringify({
    model: "sonar-pro",
    max_tokens: 7000,
    messages: [
      {
        role: "system",
        content: "You are an independent senior Ontario wastewater operator-certification reviewer. You did not draft the candidates. Return only JSON and do not include Markdown.",
      },
      {
        role: "user",
        content: `Independently review every candidate against the source record. Approve only when the stated claim is traceable to the cited source; the jurisdiction and regulatory scope are accurate; exactly one option is correct; and distractors remain plausible without normalizing unsafe operation, missed maintenance, or omitted required actions. Reject a candidate if it overstates a non-regulatory source, makes an unsupported universal claim, or has a source-to-claim mismatch.

Return exactly this JSON object with one review for every candidate:
{"reviews":[{"questionNum":426,"approved":true,"severity":"none|minor|major|critical","reasons":["..."],"requiredChanges":["..."]}]}

SOURCE RECORD:
${sources}

CANDIDATES:
${JSON.stringify(candidates)}`,
      },
    ],
  }),
});
if (!response.ok) throw new Error(`Independent Sonar review failed: ${response.status} ${await response.text()}`);
const payload = await response.json();
const text = payload.choices?.[0]?.message?.content?.trim();
if (!text) throw new Error("Independent Sonar reviewer returned no text content.");
const start = text.indexOf("{");
const end = text.lastIndexOf("}");
if (start < 0 || end <= start) throw new Error("Independent Sonar reviewer returned no complete JSON object.");
const review = JSON.parse(text.slice(start, end + 1));
const returned = new Set(review.reviews?.map(item => item.questionNum));
if (
  !Array.isArray(review.reviews)
  || returned.size !== selectedQuestionNumbers.size
  || [...selectedQuestionNumbers].some(questionNum => !returned.has(questionNum))
  || review.reviews.some(item => typeof item.approved !== "boolean" || typeof item.severity !== "string")
) throw new Error("Independent Sonar review did not return one valid decision for every held candidate.");
await writeFile(outputPath, `${JSON.stringify(review, null, 2)}\n`);
console.log(JSON.stringify(review, null, 2));
