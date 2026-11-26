import mysql from "mysql2/promise";
import { activeDatabaseSettings } from "../../server/db";
import { databasePoolOptions } from "../../server/_core/databaseTls";
import { verifyIndividualPaymentSchema } from "../../server/stripe/paymentSchemaReadiness";

if (!process.argv.includes("--active")) {
  console.error("Refusing database access. Run with --active for a read-only individual-payment schema preflight.");
  process.exit(1);
}

const settings = activeDatabaseSettings();
if (!settings.connectionString) {
  console.error("No active database is configured for payment schema preflight.");
  process.exit(1);
}

const connection = await mysql.createConnection(databasePoolOptions(settings.connectionString, {
  requireTls: settings.requireTls,
  caCertificate: settings.caCertificate,
}));

try {
  await connection.query("SET TRANSACTION READ ONLY");
  await connection.beginTransaction();
  await verifyIndividualPaymentSchema(statement => connection.query(statement));
  await connection.rollback();
  console.log(`Individual payment schema preflight passed for ${settings.label}.`);
} finally {
  await connection.end();
}
