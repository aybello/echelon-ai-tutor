import mysql from 'mysql2/promise';
import fs from 'fs';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const journal = JSON.parse(fs.readFileSync('drizzle/meta/_journal.json', 'utf8'));
  const allTags = journal.entries.map(e => e.tag);
  
  const [rows] = await conn.execute('SELECT hash FROM __drizzle_migrations');
  const applied = new Set(rows.map(r => r.hash));
  
  const missing = allTags.filter(tag => !applied.has(tag));
  console.log('Missing migration tags:', missing);
  
  for (const tag of missing) {
    await conn.execute('INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)', [tag, Date.now()]);
    console.log('Inserted:', tag);
  }
  
  console.log('Done!');
} catch(e) {
  console.error('Error:', e.message);
} finally {
  await conn.end();
}
