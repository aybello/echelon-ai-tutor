import { validateQuestionBank } from "./lib/309a-question-bank.mjs";

const batchArgumentIndex = process.argv.indexOf("--batch");
const batchFilter = batchArgumentIndex >= 0
  ? process.argv[batchArgumentIndex + 1]?.toUpperCase()
  : null;
const full = process.argv.includes("--full");
const result = validateQuestionBank({ batchFilter, full });

if (result.errors.length > 0) {
  console.error(`309A question bank validation failed with ${result.errors.length} error(s):`);
  for (const error of result.errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `309A ${batchFilter ? `batch ${batchFilter}` : full ? "full question bank" : "checked-in batches"} valid: ` +
  `${result.questions.length} questions, ${result.calculationCount} calculations, ` +
  `${result.diagramCount} diagram-backed items; answer positions ${result.answerCounts.join("/")}.`,
);
