/**
 * backfill-difficulty.mjs
 * Classifies WPI questions with NULL difficulty into easy/medium/hard
 * using the built-in LLM API in batches of 20 questions per call.
 */
import mysql from "mysql2/promise";

const LLM_URL = process.env.BUILT_IN_FORGE_API_URL;
const LLM_KEY = process.env.BUILT_IN_FORGE_API_KEY;
const BATCH_SIZE = 20;
const CONCURRENCY = 5; // parallel LLM calls

async function invokeLLM(messages, responseFormat) {
  const res = await fetch(`${LLM_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LLM_KEY}`,
    },
    body: JSON.stringify({
      messages,
      response_format: responseFormat,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function classifyBatch(batch) {
  const questionsText = batch
    .map(
      (q, i) =>
        `[${i}] id=${q.id} | isCalc=${q.isCalc} | module=${q.module}\nQ: ${q.question}\nOptions: ${q.options}\nExplanation: ${(q.explanation || "").substring(0, 200)}`
    )
    .join("\n\n");

  const systemPrompt = `You are an expert water/wastewater operator exam question classifier.

Classify each question's difficulty as exactly one of: "easy", "medium", or "hard".

Classification rules:
- "easy": Simple definition recall, basic terminology, straightforward factual questions. The answer is directly stated in standard study materials.
- "medium": Applied knowledge requiring understanding of processes, regulations, or procedures. May require connecting two concepts or understanding cause-and-effect relationships.
- "hard": Multi-step calculations, complex scenario analysis, questions requiring synthesis of multiple concepts, or questions about edge cases and exceptions. Any question marked isCalc=yes that involves actual computation is at minimum "medium", and complex calculations are "hard".

Additional guidance:
- Questions about safety procedures that are common knowledge in the field → easy
- Questions about specific regulation numbers or thresholds → medium
- Questions requiring formula application or unit conversion → hard
- Questions about troubleshooting complex systems → hard

Return a JSON array with exactly ${batch.length} objects, one per question in order.`;

  const response = await invokeLLM(
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Classify these ${batch.length} questions:\n\n${questionsText}`,
      },
    ],
    {
      type: "json_schema",
      json_schema: {
        name: "difficulty_classification",
        strict: true,
        schema: {
          type: "object",
          properties: {
            classifications: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "integer", description: "Question database ID" },
                  difficulty: {
                    type: "string",
                    enum: ["easy", "medium", "hard"],
                    description: "Difficulty classification",
                  },
                },
                required: ["id", "difficulty"],
                additionalProperties: false,
              },
            },
          },
          required: ["classifications"],
          additionalProperties: false,
        },
      },
    }
  );

  const content = response.choices[0].message.content;
  const parsed = JSON.parse(content);
  return parsed.classifications;
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // Fetch all questions with NULL difficulty
  const [rows] = await conn.execute(
    "SELECT id, bankKey, questionNum, question, options, explanation, isCalc, module FROM questions WHERE difficulty IS NULL ORDER BY bankKey, questionNum"
  );

  console.log(`Found ${rows.length} questions with NULL difficulty`);

  // Split into batches
  const batches = [];
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    batches.push(rows.slice(i, i + BATCH_SIZE));
  }
  console.log(`Split into ${batches.length} batches of up to ${BATCH_SIZE}`);

  let updated = 0;
  let errors = 0;
  const stats = { easy: 0, medium: 0, hard: 0 };

  // Process batches with concurrency
  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const chunk = batches.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      chunk.map((batch) => classifyBatch(batch))
    );

    for (let j = 0; j < results.length; j++) {
      const batchIdx = i + j;
      const batch = chunk[j];
      const result = results[j];

      if (result.status === "rejected") {
        console.error(`Batch ${batchIdx} failed:`, result.reason?.message);
        errors += batch.length;
        continue;
      }

      const classifications = result.value;

      // Update each question
      for (const cls of classifications) {
        if (!["easy", "medium", "hard"].includes(cls.difficulty)) {
          console.warn(`Invalid difficulty "${cls.difficulty}" for id=${cls.id}, defaulting to medium`);
          cls.difficulty = "medium";
        }
        try {
          await conn.execute(
            "UPDATE questions SET difficulty = ? WHERE id = ? AND difficulty IS NULL",
            [cls.difficulty, cls.id]
          );
          stats[cls.difficulty]++;
          updated++;
        } catch (err) {
          console.error(`Failed to update id=${cls.id}:`, err.message);
          errors++;
        }
      }
    }

    const progress = Math.min(i + CONCURRENCY, batches.length);
    console.log(
      `Progress: ${progress}/${batches.length} batches (${updated} updated, ${errors} errors) | easy=${stats.easy} med=${stats.medium} hard=${stats.hard}`
    );
  }

  console.log(`\nDone! Updated: ${updated}, Errors: ${errors}`);
  console.log(`Distribution: easy=${stats.easy}, medium=${stats.medium}, hard=${stats.hard}`);

  // Verify no NULLs remain
  const [remaining] = await conn.execute(
    "SELECT COUNT(*) as cnt FROM questions WHERE difficulty IS NULL"
  );
  console.log(`Remaining NULL difficulty: ${remaining[0].cnt}`);

  await conn.end();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
