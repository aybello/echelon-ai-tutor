import mysql from "mysql2/promise";
import { afterAll, describe, expect, it } from "vitest";

const externalDatabaseUrl = process.env.EXTERNAL_DATABASE_URL;
const externalDatabaseCa = process.env.EXTERNAL_DATABASE_CA;
const suite = externalDatabaseUrl && externalDatabaseCa ? describe : describe.skip;

function normalizePem(value: string): string {
  return value.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trimEnd() + "\n";
}

function secureMySqlConfig(
  connectionString: string,
  caCertificate: string
): mysql.ConnectionOptions {
  const url = new URL(connectionString);
  const sslModeParameter = url.searchParams.get("ssl-mode");
  const sslParameter = url.searchParams.get("ssl");
  if (sslModeParameter && sslParameter) {
    throw new Error("EXTERNAL_DATABASE_URL must use only one TLS parameter");
  }
  const sslMode = sslModeParameter ?? sslParameter;
  const ca = normalizePem(caCertificate);

  const scalarTlsMode = ["REQUIRED", "VERIFY_CA", "VERIFY_IDENTITY", "TRUE", "1"].includes((sslMode ?? "").toUpperCase());
  let strictJsonTls = false;
  if (!scalarTlsMode && sslMode) {
    try {
      strictJsonTls = JSON.parse(sslMode)?.rejectUnauthorized === true;
    } catch {
      strictJsonTls = false;
    }
  }
  if (!scalarTlsMode && !strictJsonTls) {
    throw new Error("EXTERNAL_DATABASE_URL must require TLS");
  }
  if (!ca.includes("BEGIN CERTIFICATE")) {
    throw new Error("EXTERNAL_DATABASE_CA must be a PEM certificate");
  }

  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    ssl: { ca, rejectUnauthorized: true },
  };
}

suite("external Echelon database connection", () => {
  let connection: mysql.Connection | null = null;

  afterAll(async () => {
    await connection?.end();
  });

  it("connects through certificate-verified TLS to a MySQL-compatible target", async () => {
    connection = await mysql.createConnection(
      secureMySqlConfig(externalDatabaseUrl!, externalDatabaseCa!)
    );
    const [pingRows] = await connection.query("SELECT 1 AS healthy");
    const [databaseRows] = await connection.query("SELECT DATABASE() AS databaseName");
    expect(pingRows).toEqual([{ healthy: 1 }]);
    expect(databaseRows).toHaveLength(1);
  });
});
