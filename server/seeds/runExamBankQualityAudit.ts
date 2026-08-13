import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

type AuditIssue = {
  questionNum: number;
  severity: "blocker" | "major" | "minor";
  category: "factual" | "answer_key" | "ambiguity" | "calculation" | "scope" | "distractor" | "explanation";
  finding: string;
  recommendedFix: string;
};

type AuditResponse = {
  approved: boolean;
  summary: string;
  issues: AuditIssue[];
};

const reviewFiles = [
  "01_collection_science.json",
  "02_collection_equipment.json",
  "03_collection_processes.json",
  "04_distribution_general_a.json",
  "05_distribution_general_b.json",
  "06_distribution_administration.json",
];

const auditInstructions = `You are an independent, exacting QA reviewer for Canadian Class 1 water and wastewater operator certification practice questions. Review EVERY supplied record. These are original study questions, not real certification-exam items.

Flag only materially credible issues. A blocker means the correct answer is wrong, unsafe, or the calculation is incorrect. A major issue means ambiguity, an unsupported claim, an answer-key problem, or content that materially exceeds or misses Class 1 scope. A minor issue means a weak but repairable distractor or explanation. Do not flag a question simply because the wording could be different.

Check: factual correctness; unit/math correctness; whether the keyed option clearly answers the question; exactly one best answer; practical safety; plausible distractors; explanations that accurately teach the concept; and suitability for Ontario/WPI Class 1 Collection or Distribution operators.

Return ONLY valid JSON with this exact shape:
{
  "approved": true,
  "summary": "...",
  "issues": [
    {
      "questionNum": 575,
      "severity": "blocker|major|minor",
      "category": "factual|answer_key|ambiguity|calculation|scope|distractor|explanation",
      "finding": "...",
      "recommendedFix": "..."
    }
  ]
}
If there are no material issues, return an empty issues array.`;

async function callAudit(batchName: string) {
  const root = resolve(process.cwd(), ".exam-bank-quality-audit");
  const batch = await readFile(resolve(root, batchName), "utf8");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_CUSTOM_API_KEY ?? ""}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.6-sol",
      messages: [
        { role: "system", content: auditInstructions },
        { role: "user", content: `Review batch ${batchName}:\n${batch}` },
      ],
      response_format: { type: "json_object" },
    }),
  });

  const raw = await response.text();
  if (!response.ok) throw new Error(`${batchName}: ${response.status} ${raw}`);
  const payload = JSON.parse(raw) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${batchName}: audit returned no content`);
  const audit = JSON.parse(content) as AuditResponse;
  await writeFile(resolve(root, `${batchName.replace(/\.json$/, "")}.audit.json`), JSON.stringify(audit, null, 2));
  return { batchName, approved: audit.approved, issueCount: audit.issues.length };
}

async function main() {
  if (!process.env.OPENAI_CUSTOM_API_KEY) throw new Error("OPENAI_CUSTOM_API_KEY is not configured");
  const root = resolve(process.cwd(), ".exam-bank-quality-audit");
  await mkdir(root, { recursive: true });
  const requestedFile = process.argv[2];
  const filesToReview = requestedFile ? [requestedFile] : reviewFiles;
  if (requestedFile && !reviewFiles.includes(requestedFile)) {
    throw new Error(`Unknown review batch: ${requestedFile}`);
  }
  const results = [];
  for (const reviewFile of filesToReview) results.push(await callAudit(reviewFile));
  console.log(JSON.stringify(results, null, 2));
}

void main();
