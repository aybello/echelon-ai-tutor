import mysql from "mysql2/promise";
import {
  buildExpectedSchemaContract,
  diffSchemaContracts,
  fetchActualSchemaContract,
} from "./migrationSafety.ts";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required for read-only schema verification.");
  process.exit(1);
}

const strict = process.argv.includes("--strict");
const connection = await mysql.createConnection(databaseUrl);

try {
  const expected = buildExpectedSchemaContract();
  const actual = await fetchActualSchemaContract(connection);
  const diff = diffSchemaContracts(expected, actual);

  for (const warning of diff.warnings) console.warn(`WARNING: ${warning}`);
  for (const error of diff.errors) console.error(`ERROR: ${error}`);

  if (diff.errors.length > 0 || (strict && diff.warnings.length > 0)) {
    console.error(
      `Schema verification failed with ${diff.errors.length} error(s) and ${diff.warnings.length} warning(s).`
    );
    process.exitCode = 1;
  } else {
    console.log(
      `Schema verification passed for ${expected.tables.length} application tables` +
        (diff.warnings.length > 0
          ? ` with ${diff.warnings.length} non-blocking warning(s).`
          : ".")
    );
  }
} finally {
  await connection.end();
}
