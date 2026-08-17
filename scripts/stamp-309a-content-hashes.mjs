import { readFileSync, writeFileSync } from "node:fs";
import { loadQuestionBatches, questionContentHash } from "./lib/309a-question-bank.mjs";

for (const batch of loadQuestionBatches()) {
  const document = JSON.parse(readFileSync(batch.path, "utf8"));
  document.questions = document.questions.map((question) => ({
    ...question,
    contentHash: questionContentHash({
      ...(document.questionDefaults ?? {}),
      ...question,
    }),
  }));
  writeFileSync(batch.path, `${JSON.stringify(document, null, 2)}\n`);
  console.log(`Stamped ${document.questions.length} content hashes in ${batch.file}.`);
}
