import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('No DATABASE_URL found');
  process.exit(1);
}

const conn = await createConnection(url);

try {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS \`flashcard_progress\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`email\` varchar(320) NOT NULL,
      \`examType\` varchar(64) NOT NULL,
      \`knownIds\` text NOT NULL,
      \`totalCards\` int NOT NULL DEFAULT 0,
      \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    )
  `);
  console.log('✅ flashcard_progress table created (or already exists)');

  const [rows] = await conn.query('SHOW TABLES LIKE "flashcard_progress"');
  console.log('Table exists in DB:', rows.length > 0 ? 'YES' : 'NO');
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await conn.end();
}
