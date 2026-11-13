import { readFile, writeFile } from "node:fs/promises";
import { analyseQuestion, targetDistractorLength } from "../server/answerLengthBias.ts";

const inputPath = "/home/ubuntu/echelon-ai-tutor/docs/oit-water-source-repair-candidates-2026-08-30.json";
const outputPath = "/tmp/oit-water-source-repair-rebalanced-candidates.json";
const targets = new Set([405, 528, 532]);
const candidates = JSON.parse(await readFile(inputPath, "utf8"));

async function generateDistractors(candidate, feedback = "") {
  const correct = candidate.options[candidate.correctIndex];
  const distractors = candidate.options.filter((_, index) => index !== candidate.correctIndex);
  const band = targetDistractorLength(correct.length);
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    signal: AbortSignal.timeout(90000),
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 2500,
      thinking: { type: "adaptive" },
      output_config: { effort: "low" },
      system: "You write safe, accurate Ontario water and wastewater operator-certification questions. Return JSON only.",
      messages: [{
        role: "user",
        content: `Rewrite ONLY the three wrong answer options for this approved source-backed multiple-choice question. Preserve the question, correct option, correct index, explanation, and source unchanged. Return exactly {"distractors":["...","...","..."]} in the original non-correct-option order.

Hard requirements:
- Every distractor must be clearly wrong yet plausible to an inexperienced candidate.
- Do not give an unsafe operating instruction, advise delaying a required response, or introduce a different defensible answer.
- Do not use absolute words such as always or never.
- Each distractor must be ${band.min}-${band.max} characters, and at least one must be at least ${correct.length} characters.
- Do not repeat, paraphrase, or partly make the correct answer true.
${feedback ? `Previous output failed: ${feedback}` : ""}

QUESTION: ${candidate.question}
CORRECT OPTION (do not change): ${correct}
CURRENT DISTRACTORS: ${JSON.stringify(distractors)}`,
      }],
    }),
  });
  if (!response.ok) throw new Error(`Claude request failed: ${response.status} ${await response.text()}`);
  const payload = await response.json();
  const text = payload.content?.find(block => block.type === "text")?.text;
  if (!text) throw new Error("Claude returned no textual distractor response");
  const normalized = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(normalized);
  } catch {
    const start = normalized.indexOf("{");
    const arrayEnd = normalized.lastIndexOf("]");
    if (start >= 0 && arrayEnd > start) {
      return JSON.parse(`${normalized.slice(start, arrayEnd + 1)}}`);
    }
    throw new Error("Claude distractor response did not contain a complete JSON object");
  }
}

for (const candidate of candidates.filter(item => targets.has(item.questionNum))) {
  let feedback = "";
  let accepted = false;
  for (let attempt = 1; attempt <= 3 && !accepted; attempt += 1) {
    const proposal = await generateDistractors(candidate, feedback);
    if (!Array.isArray(proposal.distractors) || proposal.distractors.length !== 3) {
      feedback = "Return exactly three distractors.";
      continue;
    }
    const proposalOptions = [];
    let cursor = 0;
    for (let index = 0; index < candidate.options.length; index += 1) {
      proposalOptions.push(index === candidate.correctIndex ? candidate.options[index] : proposal.distractors[cursor++]);
    }
    const quality = analyseQuestion({
      questionNum: candidate.questionNum,
      options: proposalOptions,
      correctIndex: candidate.correctIndex,
    });
    const validLengths = proposal.distractors.every(option => {
      const band = targetDistractorLength(candidate.options[candidate.correctIndex].length);
      return typeof option === "string" && option.trim().length >= band.min && option.trim().length <= band.max;
    });
    if (!validLengths || quality.hasLengthTell) {
      feedback = `A structural length check failed. Correct length ${quality.correctLength}; longest distractor ${quality.longestDistractorLength}.`;
      continue;
    }
    candidate.options = proposalOptions.map(option => option.trim());
    accepted = true;
  }
  if (!accepted) throw new Error(`Could not structurally rebalance q${candidate.questionNum} in three attempts.`);
}

await writeFile(outputPath, `${JSON.stringify(candidates, null, 2)}\n`);
console.log(`Wrote rebalanced candidates to ${outputPath}`);
