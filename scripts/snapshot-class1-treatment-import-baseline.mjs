import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { createBaseline, loadClass1NetworksPackage, readClass1NetworksProductionSnapshot } from "./lib/class1TreatmentImporter.mjs";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for a production rollback baseline.");
const outputDirectory = process.env.CLASS1_TREATMENT_IMPORT_RELEASE_DIR ?? "/home/ubuntu/class1_treatment_import_release";
const packageInfo = loadClass1NetworksPackage();
const database = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await database.beginTransaction();
  const snapshot = await readClass1NetworksProductionSnapshot({ connection: database });
  const baseline = createBaseline({ checksum: packageInfo.checksum, ...snapshot });
  fs.mkdirSync(outputDirectory, { recursive: true });
  const outputPath = path.join(outputDirectory, "class1-treatment-import-baseline.json");
  fs.writeFileSync(outputPath, `${JSON.stringify(baseline, null, 2)}\n`);
  console.log(JSON.stringify({ outputPath, baselineChecksum: baseline.baselineChecksum, packageChecksum: baseline.packageChecksum, expectedBankCounts: baseline.expectedBankCounts, visibleCounts: baseline.visibleCounts, attemptCountTotal: Object.values(baseline.attemptsByQuestionId).reduce((sum, count) => sum + count, 0) }, null, 2));
} finally {
  await database.rollback();
  await database.end();
}
