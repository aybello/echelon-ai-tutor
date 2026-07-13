import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS \`exam_dates\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`email\` varchar(320) NOT NULL,
      \`productKey\` varchar(64) NOT NULL,
      \`examDate\` timestamp NOT NULL,
      \`remindersSent\` text NOT NULL,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`exam_dates_id\` PRIMARY KEY(\`id\`)
    )
  `);
  console.log("✅ exam_dates table created (or already exists)");

  // Also mark the migration as applied so drizzle doesn't try to re-run it
  await connection.execute(`
    INSERT IGNORE INTO \`__drizzle_migrations\` (hash, created_at)
    VALUES ('0014_adorable_thundra', ${Date.now()})
  `).catch(() => {
    // table might not exist or different name, that's fine
  });
} catch (err) {
  console.error("❌ Error:", err.message);
} finally {
  await connection.end();
}
