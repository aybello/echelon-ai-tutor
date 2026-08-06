/**
 * fix-wpi-coll-blueprint-weights.mjs
 *
 * Updates question_bank_meta blueprint weights (moduleTargets and modules)
 * for all 4 WPI wastewater-coll banks to match the actual module names
 * found in the questions table.
 *
 * Run once: node scripts/fix-wpi-coll-blueprint-weights.mjs
 */
import mysql from "mysql2/promise";

const BANK_FIXES = {
  "wpi-class1-wastewater-coll": {
    modules: [
      "Equipment Operation & Maintenance",
      "Collection System Components",
      "Math & Calculations",
      "Safety & Regulations",
      "Collection System Maintenance",
      "Environmental & Public Health",
    ],
    moduleTargets: {
      "Equipment Operation & Maintenance": 27,
      "Collection System Components": 25,
      "Math & Calculations": 25,
      "Safety & Regulations": 10,
      "Collection System Maintenance": 7,
      "Environmental & Public Health": 6,
    },
  },
  "wpi-class2-wastewater-coll": {
    modules: [
      "Advanced Collection System Design",
      "Hydraulics & Flow Analysis",
      "Lift Station Operations",
      "Water Quality & Environmental",
      "System Design & Engineering",
      "Collection System Maintenance",
      "Safety & Confined Space",
      "Regulations & Compliance",
      "System Maintenance & Rehabilitation",
      "Intermediate Lift Station Operations",
      "Regulatory Compliance & Reporting",
    ],
    moduleTargets: {
      "Advanced Collection System Design": 19,
      "Hydraulics & Flow Analysis": 15,
      "Lift Station Operations": 9,
      "Water Quality & Environmental": 8,
      "System Design & Engineering": 8,
      "Collection System Maintenance": 8,
      "Safety & Confined Space": 8,
      "Regulations & Compliance": 7,
      "System Maintenance & Rehabilitation": 6,
      "Intermediate Lift Station Operations": 6,
      "Regulatory Compliance & Reporting": 6,
    },
  },
  "wpi-class3-wastewater-coll": {
    modules: [
      "Advanced Collection System Design",
      "Hydraulics & Flow Analysis",
      "Lift Station Operations",
      "Leadership, Safety & Regulatory Management",
      "Water Quality & Environmental",
      "Safety & Confined Space",
      "System Design & Engineering",
      "Collection System Maintenance",
      "Regulations & Compliance",
      "System Hydraulic Modelling",
      "Complex System Operations & SCADA",
      "Advanced Pump Station Engineering",
      "Advanced Maintenance Management",
    ],
    moduleTargets: {
      "Advanced Collection System Design": 13,
      "Hydraulics & Flow Analysis": 9,
      "Lift Station Operations": 9,
      "Leadership, Safety & Regulatory Management": 9,
      "Water Quality & Environmental": 8,
      "Safety & Confined Space": 8,
      "System Design & Engineering": 8,
      "Collection System Maintenance": 8,
      "Regulations & Compliance": 7,
      "System Hydraulic Modelling": 6,
      "Complex System Operations & SCADA": 6,
      "Advanced Pump Station Engineering": 6,
      "Advanced Maintenance Management": 3,
    },
  },
  "wpi-class4-wastewater-coll": {
    modules: [
      "Advanced Collection System Design",
      "Hydraulics & Flow Analysis",
      "Lift Station Operations",
      "Emerging Technologies & Innovation",
      "Water Quality & Environmental",
      "Collection System Maintenance",
      "Safety & Confined Space",
      "System Design & Engineering",
      "Regulations & Compliance",
      "Utility Management & Leadership",
      "System Planning & Capital Improvement",
      "Advanced Engineering & Design",
      "Advanced Regulatory & Environmental Management",
    ],
    moduleTargets: {
      "Advanced Collection System Design": 13,
      "Hydraulics & Flow Analysis": 9,
      "Lift Station Operations": 9,
      "Emerging Technologies & Innovation": 9,
      "Water Quality & Environmental": 8,
      "Collection System Maintenance": 8,
      "Safety & Confined Space": 8,
      "System Design & Engineering": 8,
      "Regulations & Compliance": 7,
      "Utility Management & Leadership": 6,
      "System Planning & Capital Improvement": 6,
      "Advanced Engineering & Design": 6,
      "Advanced Regulatory & Environmental Management": 3,
    },
  },
};

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  for (const [bankKey, fix] of Object.entries(BANK_FIXES)) {
    const modulesJson = JSON.stringify(fix.modules);
    const targetsJson = JSON.stringify(fix.moduleTargets);

    const [result] = await conn.execute(
      `UPDATE question_bank_meta SET modules = ?, moduleTargets = ? WHERE bankKey = ?`,
      [modulesJson, targetsJson, bankKey],
    );

    const affected = result.affectedRows;
    if (affected === 0) {
      console.warn(`  [WARN] No row found for bankKey: ${bankKey}`);
    } else {
      console.log(`  [OK] Updated ${bankKey} — ${fix.modules.length} modules, weights sum to ${Object.values(fix.moduleTargets).reduce((a, b) => a + b, 0)}%`);
    }
  }

  await conn.end();
  console.log("\nDone. All 4 WPI wastewater-coll banks updated.");
}

main().catch((e) => {
  console.error("Migration failed:", e.message);
  process.exit(1);
});
