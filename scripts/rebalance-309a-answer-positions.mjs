import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const files = ["batch-a.json", "batch-b.json", "batch-c.json", "batch-d.json", "batch-e.json"];
const documents = files.map((file) => {
  const path = resolve(root, "content/309a/questions", file);
  return { file, path, document: JSON.parse(readFileSync(path, "utf8")) };
});
const questions = documents.flatMap(({ document, file }) =>
  document.questions.map((question) => ({ question, file })),
);
const targetPerPosition = questions.length / 4;

if (!Number.isInteger(targetPerPosition)) {
  throw new Error("A balanced four-choice answer distribution requires a question count divisible by four.");
}

const counts = [0, 0, 0, 0];
for (const { question } of questions) counts[question.correctIndex] += 1;

function moveCorrectOption(question, targetIndex) {
  const [correctOption] = question.options.splice(question.correctIndex, 1);
  question.options.splice(targetIndex, 0, correctOption);
  question.correctIndex = targetIndex;
}

for (const targetIndex of [3, 2, 1, 0]) {
  while (counts[targetIndex] < targetPerPosition) {
    const sourceIndex = [0, 1, 2, 3]
      .filter((index) => counts[index] > targetPerPosition)
      .sort((left, right) => counts[right] - counts[left])[0];
    if (sourceIndex === undefined) {
      throw new Error(`Could not find an overrepresented answer position for target ${targetIndex}.`);
    }
    const candidate = questions.find(
      ({ question, file }) => file >= "batch-d.json" && question.correctIndex === sourceIndex && question.isCalc === "no",
    ) ?? questions.find(({ question }) => question.correctIndex === sourceIndex);
    if (!candidate) {
      throw new Error(`Could not find a safe question to move from position ${sourceIndex}.`);
    }
    moveCorrectOption(candidate.question, targetIndex);
    counts[sourceIndex] -= 1;
    counts[targetIndex] += 1;
  }
}

for (const { path, document } of documents) {
  writeFileSync(path, `${JSON.stringify(document, null, 2)}\n`);
}

console.log(`Balanced answer positions: ${counts.join("/")}.`);
