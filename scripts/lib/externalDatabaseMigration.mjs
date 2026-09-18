import { createHash } from "node:crypto";

const IDENTIFIER = /^[A-Za-z0-9_]+$/;
const TLS_MODES = new Set(["REQUIRED", "VERIFY_CA", "VERIFY_IDENTITY", "true", "1"]);

export function assertIdentifier(value, label = "identifier") {
  if (!IDENTIFIER.test(value)) {
    throw new Error(`${label} must contain only letters, numbers, and underscores.`);
  }
  return value;
}

export function quoteIdentifier(value, label) {
  return `\`${assertIdentifier(value, label)}\``;
}

export function normalizePem(value) {
  return value.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trimEnd() + "\n";
}

function redactedUrlError() {
  return new Error("Database URL is invalid. Check the secret value without logging it.");
}

function parseUrl(connectionString) {
  try {
    const url = new URL(connectionString);
    if (url.protocol !== "mysql:") {
      throw new Error("Database URL must use the mysql: protocol.");
    }
    if (!url.hostname || !url.username || !url.pathname || url.pathname === "/") {
      throw new Error("Database URL must contain a host, user, and database name.");
    }
    return url;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Database URL must")) throw error;
    throw redactedUrlError();
  }
}

function tlsFromUrl(url) {
  const sslMode = url.searchParams.get("ssl-mode");
  const ssl = url.searchParams.get("ssl");
  if (sslMode && ssl) {
    throw new Error("Database URL must use only one TLS parameter: ssl-mode or ssl.");
  }
  if (sslMode) {
    const mode = sslMode.toUpperCase();
    if (!TLS_MODES.has(mode)) throw new Error("Database URL has an unsupported ssl-mode.");
    return true;
  }
  if (!ssl) return false;
  if (TLS_MODES.has(ssl.toUpperCase())) return true;
  try {
    const parsed = JSON.parse(ssl);
    if (parsed && typeof parsed === "object" && parsed.rejectUnauthorized === true) return true;
  } catch {
    // The common platform URL encodes JSON in `ssl`; malformed values fail closed below.
  }
  throw new Error("Database URL has an unsupported ssl value.");
}

/**
 * Builds a strict mysql2 connection configuration. All production migration
 * connections are certificate-verified TLS connections. System trust roots are
 * used only when a provider does not supply a private CA; an explicit CA is
 * normalized and pinned when supplied.
 */
export function parseMySqlUrl(connectionString, { caCertificate = null, requireTls = true } = {}) {
  const url = parseUrl(connectionString);
  const tlsRequested = tlsFromUrl(url);
  if (requireTls && !tlsRequested) {
    throw new Error("Database URL must require TLS.");
  }
  if (caCertificate && !caCertificate.includes("BEGIN CERTIFICATE")) {
    throw new Error("A PEM CA certificate is required for database TLS verification.");
  }

  const config = {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    charset: "utf8mb4",
    timezone: "Z",
    dateStrings: true,
    supportBigNumbers: true,
    bigNumberStrings: true,
    decimalNumbers: false,
  };

  if (!tlsRequested) return config;
  return {
    ...config,
    ssl: {
      ...(caCertificate ? { ca: normalizePem(caCertificate) } : {}),
      rejectUnauthorized: true,
    },
  };
}

export function mysqlClientDefaults(connectionString, { caPath = null, requireTls = true } = {}) {
  const url = parseUrl(connectionString);
  const tlsRequested = tlsFromUrl(url);
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
    lines.push(`ssl-mode=${caPath ? "VERIFY_CA" : "VERIFY_IDENTITY"}`);
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

export function updateRowsDigest(digest, rows) {
  for (const row of rows) {
    digest.update(JSON.stringify(canonicalizeValue(row)));
    digest.update("\n");
  }
  return digest;
}

export function digestRows(rows) {
  return updateRowsDigest(createHash("sha256"), rows).digest("hex");
}

export function sortedTableNames(tableNames) {
  return [...tableNames].map(name => assertIdentifier(name, "table name")).sort();
}

export function allColumnsOrder(columns) {
  const clean = columns.map(column => assertIdentifier(column, "column name"));
  if (clean.length === 0) throw new Error("A table must have at least one column.");
  return clean.map(column => `\`${column}\``).join(", ");
}
