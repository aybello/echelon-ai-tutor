import { createHash } from "node:crypto";

const IDENTIFIER = /^[A-Za-z0-9_]+$/;

export function assertIdentifier(value, label = "identifier") {
  if (!IDENTIFIER.test(value)) {
    throw new Error(`${label} must contain only letters, numbers, and underscores.`);
  }
  return value;
}

export function quoteIdentifier(value, label) {
  return `\`${assertIdentifier(value, label)}\``;
}

export function parseMySqlUrl(connectionString, { caCertificate = null, requireTls = false } = {}) {
  const url = new URL(connectionString);
  if (url.protocol !== "mysql:") {
    throw new Error("Database URL must use the mysql: protocol.");
  }

  const sslMode = url.searchParams.get("ssl-mode") ?? url.searchParams.get("ssl");
  const tlsRequested = ["REQUIRED", "required", "true", "1"].includes(sslMode ?? "");
  if (requireTls && !tlsRequested) {
    throw new Error("The external database URL must require TLS.");
  }
  if (requireTls && !caCertificate?.includes("BEGIN CERTIFICATE")) {
    throw new Error("A PEM CA certificate is required for external database TLS verification.");
  }

  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    ssl: tlsRequested
      ? caCertificate
        ? { ca: caCertificate, rejectUnauthorized: true }
        : { rejectUnauthorized: false }
      : undefined,
  };
}

export function mysqlClientDefaults(connectionString, { caPath = null, requireTls = false } = {}) {
  const url = new URL(connectionString);
  if (url.protocol !== "mysql:") throw new Error("Database URL must use mysql:.");
  const sslMode = url.searchParams.get("ssl-mode") ?? url.searchParams.get("ssl");
  const tlsRequested = ["REQUIRED", "required", "true", "1"].includes(sslMode ?? "");
  if (requireTls && !tlsRequested) throw new Error("External database client must require TLS.");
  if (requireTls && !caPath) throw new Error("External database client requires a CA certificate path.");

  const lines = [
    "[client]",
    `host=${url.hostname}`,
    `port=${Number(url.port || 3306)}`,
    `user=${decodeURIComponent(url.username)}`,
    `password=${decodeURIComponent(url.password)}`,
    `database=${decodeURIComponent(url.pathname.replace(/^\//, ""))}`,
    "protocol=tcp",
  ];

  if (tlsRequested) {
    lines.push(`ssl-mode=${caPath ? "VERIFY_CA" : "REQUIRED"}`);
    if (caPath) lines.push(`ssl-ca=${caPath}`);
  }

  return `${lines.join("\n")}\n`;
}

export function canonicalizeValue(value) {
  if (value === null) return null;
  if (Buffer.isBuffer(value)) return { type: "buffer", value: value.toString("base64") };
  if (value instanceof Date) return { type: "date", value: value.toISOString() };
  if (typeof value === "bigint") return { type: "bigint", value: value.toString() };
  if (Array.isArray(value)) return value.map(canonicalizeValue);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalizeValue(nested)])
    );
  }
  return value;
}

export function digestRows(rows) {
  const digest = createHash("sha256");
  for (const row of rows) {
    const canonical = canonicalizeValue(row);
    digest.update(JSON.stringify(canonical));
    digest.update("\n");
  }
  return digest.digest("hex");
}

export function sortedTableNames(tableNames) {
  return [...tableNames].map(name => assertIdentifier(name, "table name")).sort();
}

export function allColumnsOrder(columns) {
  const clean = columns.map(column => assertIdentifier(column, "column name"));
  if (clean.length === 0) throw new Error("A table must have at least one column.");
  return clean.map(column => `\`${column}\``).join(", ");
}
