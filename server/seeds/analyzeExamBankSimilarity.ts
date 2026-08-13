import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { inArray } from "drizzle-orm";
import { questions } from "../../drizzle/schema";
import { getDb } from "../db";
import { examBankGapQuestions } from "./examBankGapQuestions";

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "can", "does", "for", "from", "how", "in", "is", "it", "of", "on", "or", "the", "to", "what", "when", "which", "with", "would",
]);

function tokenSet(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter(token => token.length > 2 && !STOP_WORDS.has(token)),
  );
}

function jaccard(left: Set<string>, right: Set<string>) {
  const leftTokens = Array.from(left);
  const intersection = leftTokens.filter(token => right.has(token)).length;
  const union = new Set(leftTokens.concat(Array.from(right))).size;
  return union === 0 ? 0 : intersection / union;
}

async function main() {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_URL is required for the similarity audit");
  const existing = await db
    .select({ bankKey: questions.bankKey, questionNum: questions.questionNum, question: questions.question })
    .from(questions)
    .where(inArray(questions.bankKey, ["class1-wastewater-coll", "class1-water-dist"]));

  const starts = { "class1-wastewater-coll": 575, "class1-water-dist": 568 } as const;
  const preExpansion = existing.filter(row => row.questionNum < starts[row.bankKey as keyof typeof starts]);
  const candidateMatches = examBankGapQuestions.flatMap(candidate => {
    const candidateTokens = tokenSet(candidate.question);
    const matches = preExpansion
      .filter(existingRow => existingRow.bankKey === candidate.bankKey)
      .map(existingRow => ({
        bankKey: candidate.bankKey,
        newQuestionNum: candidate.questionNum,
        newQuestion: candidate.question,
        existingQuestionNum: existingRow.questionNum,
        existingQuestion: existingRow.question,
        similarity: Number(jaccard(candidateTokens, tokenSet(existingRow.question)).toFixed(3)),
      }))
      .filter(match => match.similarity >= 0.5)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);
    return matches;
  });

  const output = { candidates: candidateMatches, candidateCount: candidateMatches.length };
  await writeFile(
    resolve(process.cwd(), ".exam-bank-quality-audit", "similarity-report.json"),
    JSON.stringify(output, null, 2),
  );
  console.log(JSON.stringify({ candidateCount: candidateMatches.length }, null, 2));
}

void main();
