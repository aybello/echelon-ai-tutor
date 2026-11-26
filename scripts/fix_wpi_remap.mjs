import { createConnection } from "mysql2/promise";
const db = await createConnection(process.env.DATABASE_URL);

async function remap(bankKey, mappings) {
  for (const [oldModule, newModule] of mappings) {
    const [result] = await db.query(
      "UPDATE questions SET module = ? WHERE bankKey = ? AND module = ?",
      [newModule, bankKey, oldModule]
    );
    if (result.affectedRows > 0) {
      console.log(`  ${bankKey}: "${oldModule}" → "${newModule}" (${result.affectedRows} rows)`);
    }
  }
}

// ── Fix Water Treatment Class IV ──────────────────────────────────────────────
// Problem: "Regulatory Compliance & Reporting" and "Plant Management & Leadership"
// were mapped to Security/Safety but they belong to Equipment O&M and Treatment Process
// We need to look at what's actually in Security/Safety now and re-split it
// The issue: we can't un-merge already-merged rows without topic-level info
// Best approach: check what topics are in Security/Safety for Class IV and re-split by topic

// For Class III Water: no Lab Analysis or Source Water modules exist
// This means those questions were already folded into Treatment Process in the original bank
// We need to accept this and note it — the content simply wasn't tagged with those modules

// For Wastewater Treatment: Lab Analysis module exists in Class I but not II/III/IV
// Check what happened to lab analysis questions in those classes

const [labCheck] = await db.query(`
  SELECT bankKey, module, COUNT(*) as q 
  FROM questions 
  WHERE bankKey LIKE 'wpi-class%-wastewater' 
  AND bankKey NOT LIKE '%-coll'
  AND (question LIKE '%laborator%' OR question LIKE '%turbidity%' OR question LIKE '%pH%' OR question LIKE '%sample%' OR question LIKE '%test%' OR question LIKE '%analys%')
  GROUP BY bankKey, module
  ORDER BY bankKey, q DESC
  LIMIT 30
`);
console.log("Lab-related questions in wastewater treatment banks:");
console.table(labCheck);

// Check Water Treatment Class III/IV for lab-related content
const [labCheckWT] = await db.query(`
  SELECT bankKey, module, COUNT(*) as q 
  FROM questions 
  WHERE bankKey LIKE 'wpi-class%-water' 
  AND bankKey NOT LIKE '%-dist'
  AND bankKey NOT LIKE '%-coll'
  AND (question LIKE '%laborator%' OR question LIKE '%turbidity%' OR question LIKE '%pH%' OR question LIKE '%sample%' OR question LIKE '%analys%')
  GROUP BY bankKey, module
  ORDER BY bankKey, q DESC
  LIMIT 30
`);
console.log("\nLab-related questions in water treatment banks:");
console.table(labCheckWT);

await db.end();
