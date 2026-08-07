import { createConnection } from "mysql2/promise";
const db = await createConnection(process.env.DATABASE_URL);

// Total per bank
const [banks] = await db.query(
  "SELECT bankKey, COUNT(*) as total, COUNT(DISTINCT module) as modules FROM questions WHERE bankKey LIKE 'wpi-%' GROUP BY bankKey ORDER BY bankKey"
);
console.log('=== WPI Question Banks ===');
console.table(banks);

// Module breakdown for thin banks (< 100 questions)
const thin = banks.filter(b => b.total < 100);
if (thin.length > 0) {
  console.log('\n=== Thin banks (< 100 questions) ===');
  for (const b of thin) {
    const [mods] = await db.query(
      "SELECT module, COUNT(*) as q FROM questions WHERE bankKey = ? GROUP BY module ORDER BY module",
      [b.bankKey]
    );
    console.log(`\n${b.bankKey} (${b.total} total):`);
    console.table(mods);
  }
}

await db.end();
