import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import {
  schemaContractChecksum,
  stableContractJson,
  fetchActualSchemaContract,
} from "./migrationSafety.ts";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required for read-only schema contract export.");
  process.exit(1);
}

const outputFlagIndex = process.argv.indexOf("--out");
const outputPath =
  outputFlagIndex >= 0 ? process.argv[outputFlagIndex + 1] : undefined;

if (!outputPath) {
  console.error("Usage: pnpm tsx scripts/db/exportProductionContract.ts --out <path>");
  process.exit(1);
}

const connection = await mysql.createConnection(databaseUrl);

try {
  // fetchActualSchemaContract queries information_schema only; it never reads
  // application rows or customer content.
  const contract = await fetchActualSchemaContract(connection);
  await mkdir(path.dirname(path.resolve(outputPath)), { recursive: true });
  await writeFile(outputPath, stableContractJson(contract), "utf8");
  console.log(
    `Exported metadata-only schema contract for ${contract.tables.length} tables.\n` +
      `SHA-256: ${schemaContractChecksum(contract)}\n` +
      `Path: ${path.resolve(outputPath)}`
  );
} finally {
  await connection.end();
}
