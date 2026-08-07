import { createConnection } from "mysql2/promise";
const db = await createConnection(process.env.DATABASE_URL);
for (const bank of ['wpi-class1-water','wpi-class2-water','wpi-class3-water','wpi-class4-water']) {
  const [rows] = await db.query("SELECT DISTINCT module FROM questions WHERE bankKey = ? ORDER BY module", [bank]);
  console.log(`\n${bank}:`);
  rows.forEach(r => console.log(`  "${r.module}"`));
}
await db.end();
