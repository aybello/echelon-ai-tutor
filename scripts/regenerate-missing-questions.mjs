/**
 * regenerate-missing-questions.mjs
 *
 * For rows where `question` is empty (not fixable from git source),
 * uses the LLM to reconstruct the question text from the options and explanation.
 *
 * Run: node scripts/regenerate-missing-questions.mjs
 */
import { createConnection } from "mysql2/promise";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL;
const FORGE_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!DATABASE_URL || !FORGE_URL || !FORGE_KEY) {
  console.error("Missing DATABASE_URL, BUILT_IN_FORGE_API_URL, or BUILT_IN_FORGE_API_KEY");
  process.exit(1);
}

async function callLLM(prompt) {
  const res = await fetch(`${FORGE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FORGE_KEY}`,
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      messages: [
        {
          role: "system",
          content:
            "You are a water/wastewater operator exam question writer. " +
            "Given the answer options and explanation for a multiple-choice question, " +
            "reconstruct the original question text. " +
            "Return ONLY the question text, no extra commentary, no quotes.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 200,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM error ${res.status}: ${text.substring(0, 200)}`);
  }
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

async function main() {
  const conn = await createConnection(DATABASE_URL);
  console.log("Connected to DB\n");

  const [rows] = await conn.execute(
    `SELECT id, bankKey, questionNum, module, options, correctIndex, explanation
     FROM questions
     WHERE question = '' OR question IS NULL
     ORDER BY bankKey, questionNum`
  );

  console.log(`Found ${rows.length} rows to regenerate\n`);

  let fixed = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const opts = JSON.parse(row.options);
    const correct = opts[row.correctIndex];

    const prompt =
      `Module: ${row.module}\n` +
      `Options:\n` +
      opts.map((o, idx) => `  ${idx === row.correctIndex ? "✓" : " "} ${o}`).join("\n") +
      `\nCorrect answer: ${correct}\n` +
      `Explanation: ${row.explanation}\n\n` +
      `Write the question text that these options and explanation are answering:`;

    try {
      const questionText = await callLLM(prompt);
      await conn.execute("UPDATE questions SET question = ? WHERE id = ?", [
        questionText,
        row.id,
      ]);
      fixed++;
      if (i % 10 === 0) {
        console.log(`  [${i + 1}/${rows.length}] ${row.bankKey} Q${row.questionNum}: ${questionText.substring(0, 60)}...`);
      }
    } catch (err) {
      console.error(`  ERROR row id=${row.id}: ${err.message}`);
      errors++;
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 100));
  }

  await conn.end();
  console.log(`\n=== Done ===`);
  console.log(`Fixed: ${fixed}, Errors: ${errors}`);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
