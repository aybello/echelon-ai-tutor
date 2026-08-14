import mysql from "mysql2/promise";

const REQUIRED_COLUMNS = [
  "sourceTitle",
  "sourceReference",
  "sourceUrl",
  "blueprintObjective",
  "reviewStatus",
  "reviewedBy",
  "reviewedAt",
];

const REQUIRED_INDEXES = [
  "question_review_status_idx",
  "question_bank_review_status_idx",
];

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for the question-governance schema check.");
}

const connection = await mysql.createConnection(databaseUrl);

try {
  const [columnRows] = await connection.execute(
    `SELECT COLUMN_NAME
       FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'questions'
        AND COLUMN_NAME IN (${REQUIRED_COLUMNS.map(() => "?").join(", ")})`,
    REQUIRED_COLUMNS,
  );
  const presentColumns = new Set(columnRows.map((row) => row.COLUMN_NAME));
  const missingColumns = REQUIRED_COLUMNS.filter((name) => !presentColumns.has(name));

  const [indexRows] = await connection.execute(
    `SELECT DISTINCT INDEX_NAME
       FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'questions'
        AND INDEX_NAME IN (${REQUIRED_INDEXES.map(() => "?").join(", ")})`,
    REQUIRED_INDEXES,
  );
  const presentIndexes = new Set(indexRows.map((row) => row.INDEX_NAME));
  const missingIndexes = REQUIRED_INDEXES.filter((name) => !presentIndexes.has(name));

  if (missingColumns.length || missingIndexes.length) {
    throw new Error([
      "Question-governance migration 0053 is not fully applied.",
      missingColumns.length ? `Missing columns: ${missingColumns.join(", ")}.` : "",
      missingIndexes.length ? `Missing indexes: ${missingIndexes.join(", ")}.` : "",
    ].filter(Boolean).join(" "));
  }

  console.log("Question-governance schema verified: migration 0053 is present.");
} finally {
  await connection.end();
}
