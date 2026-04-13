/**
 * repair-wpi-question-text.mjs
 *
 * Fixes the 5 WPI banks that were seeded with empty `question` fields.
 * Root cause: the original seeder defaulted to `question` as the text field,
 * but WPI TypeScript files used `text` instead.
 *
 * This script:
 *   1. Reads the archived TS source from git (commit before deletion)
 *   2. Extracts the `text` field for each question by ID
 *   3. Updates the `question` column in the DB for rows where question = ''
 *
 * Run: node scripts/repair-wpi-question-text.mjs
 */
import { execSync } from "child_process";
import { createConnection } from "mysql2/promise";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

// The git commit just BEFORE the TS files were deleted
const SOURCE_COMMIT = "22bd0be~1";

// Map of bankKey -> { gitFile, exportName }
const BANKS_TO_FIX = [
  {
    bankKey: "wpi-class4-water",
    gitFile: "client/src/lib/wpiClass4WaterQuestions.ts",
    exportName: "wpiClass4WaterQuestions",
  },
  {
    bankKey: "wpi-class1-wastewater",
    gitFile: "client/src/lib/wpiClass1WastewaterQuestions.ts",
    exportName: "WPI_CLASS1_WASTEWATER_QUESTIONS",
  },
  {
    bankKey: "wpi-class2-wastewater",
    gitFile: "client/src/lib/wpiClass2WastewaterQuestions.ts",
    exportName: "WPI_CLASS2_WASTEWATER_QUESTIONS",
  },
  {
    bankKey: "wpi-class3-wastewater",
    gitFile: "client/src/lib/wpiClass3WastewaterQuestions.ts",
    exportName: "wpiClass3WastewaterQuestions",
  },
  {
    bankKey: "wpi-class4-wastewater",
    gitFile: "client/src/lib/wpiClass4WastewaterQuestions.ts",
    exportName: "wpiClass4WastewaterQuestions",
  },
];

/**
 * Extract question text from a TypeScript source string.
 * Returns a Map<id, text>.
 *
 * We parse the raw TS source with a simple regex approach:
 *   - Find each object block starting with `id: <N>,`
 *   - Extract the `text:` field from that block
 */
function extractQuestionTexts(source) {
  const map = new Map();

  // Match each question object: { id: N, ... text: "...", ... }
  // We look for `id:` followed eventually by `text:` within the same object
  const idRegex = /\bid:\s*(\d+),/g;
  let match;
  while ((match = idRegex.exec(source)) !== null) {
    const id = parseInt(match[1]);
    const startPos = match.index;

    // Find the `text:` field after this id
    // Look within the next 2000 chars to stay within the same object
    const chunk = source.slice(startPos, startPos + 2000);

    // Match: text: "..." or text: `...` or text: '...'
    const textMatch = chunk.match(/\btext:\s*["'`]([\s\S]*?)["'`]\s*,/);
    if (textMatch) {
      // Unescape common escape sequences
      const text = textMatch[1]
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\");
      map.set(id, text);
    }
  }
  return map;
}

async function main() {
  const conn = await createConnection(DATABASE_URL);
  console.log("Connected to DB\n");

  let totalFixed = 0;
  let totalErrors = 0;

  for (const bank of BANKS_TO_FIX) {
    console.log(`\n=== Fixing bank: ${bank.bankKey} ===`);

    // 1. Get the TS source from git
    let source;
    try {
      source = execSync(`git show ${SOURCE_COMMIT}:${bank.gitFile}`, {
        cwd: path.join(__dirname, ".."),
        encoding: "utf8",
        maxBuffer: 50 * 1024 * 1024,
      });
    } catch (err) {
      console.error(`  ERROR: Could not read ${bank.gitFile} from git: ${err.message}`);
      totalErrors++;
      continue;
    }

    // 2. Extract id -> text map
    const textMap = extractQuestionTexts(source);
    console.log(`  Extracted ${textMap.size} question texts from git source`);

    if (textMap.size === 0) {
      console.error(`  ERROR: No question texts extracted — check regex`);
      totalErrors++;
      continue;
    }

    // 3. Get all rows with empty question for this bank
    const [rows] = await conn.execute(
      "SELECT id, questionNum FROM questions WHERE bankKey = ? AND (question = '' OR question IS NULL)",
      [bank.bankKey]
    );

    console.log(`  Found ${rows.length} rows with empty question text`);

    // 4. Update each row
    let fixed = 0;
    let missing = 0;
    for (const row of rows) {
      const text = textMap.get(row.questionNum);
      if (!text) {
        console.warn(`  WARN: No text found for questionNum=${row.questionNum} in git source`);
        missing++;
        continue;
      }
      await conn.execute(
        "UPDATE questions SET question = ? WHERE id = ?",
        [text, row.id]
      );
      fixed++;
    }

    console.log(`  Fixed: ${fixed}, Missing in source: ${missing}`);
    totalFixed += fixed;
  }

  await conn.end();

  console.log(`\n=== Repair complete ===`);
  console.log(`Total rows fixed: ${totalFixed}`);
  console.log(`Banks with errors: ${totalErrors}`);

  if (totalErrors > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
