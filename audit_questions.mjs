import { createPool } from "mysql2/promise";
import { config } from "dotenv";
config();

const pool = createPool(process.env.DATABASE_URL);

// Find all questions with hallucination markers in their explanations
const badPhrases = [
  "does not match",
  "cannot be derived",
  "work backwards",
  "it is most likely",
  "there is a fundamental issue",
  "the question is flawed",
  "discrepancy",
  "not derivable",
  "we will assume",
  "we must assume",
  "if we must force",
  "let's assume the question intended",
  "this is still not",
  "the only way to get",
  "coming soon",
  "placeholder",
  "TODO",
];

const conditions = badPhrases.map(() => "explanation LIKE ?").join(" OR ");
const params = badPhrases.map(p => `%${p}%`);

const [rows] = await pool.query(
  `SELECT id, bankKey, questionNum, module, question, correctIndex, explanation, isCalc 
   FROM questions 
   WHERE (${conditions})
   ORDER BY bankKey, questionNum`,
  params
);

console.log(`Found ${rows.length} questions with potentially bad explanations:\n`);

for (const row of rows) {
  console.log(`---`);
  console.log(`ID: ${row.id} | Bank: ${row.bankKey} | Q#: ${row.questionNum} | isCalc: ${row.isCalc}`);
  console.log(`Module: ${row.module}`);
  console.log(`Question: ${row.question.substring(0, 120)}...`);
  console.log(`Explanation (first 200 chars): ${row.explanation.substring(0, 200)}...`);
  console.log();
}

await pool.end();
