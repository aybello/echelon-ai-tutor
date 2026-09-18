import type { PoolOptions } from "mysql2";

function normalizePem(value: string): string {
  return value.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trimEnd() + "\n";
}

function tlsRequested(connectionString: string): boolean {
  const url = new URL(connectionString);
  const mode = url.searchParams.get("ssl-mode") ?? url.searchParams.get("ssl");
  return ["REQUIRED", "required", "VERIFY_CA", "verify_ca", "true", "1"].includes(mode ?? "");
}

/**
 * Produces mysql2 pool options without passing provider URL-only settings such
 * as `ssl-mode` directly to mysql2. New external production connections must
 * provide an explicit CA and opt into DATABASE_REQUIRE_TLS=true.
 */
export function databasePoolOptions(
  connectionString: string,
  options: {
    caCertificate?: string;
    requireTls?: boolean;
    connectionLimit?: number;
    connectTimeout?: number;
  } = {}
): PoolOptions {
  const requireTls = options.requireTls ?? false;
  const requestedTls = tlsRequested(connectionString);

  if (requireTls && !requestedTls) {
    throw new Error("DATABASE_URL must request TLS when DATABASE_REQUIRE_TLS=true.");
  }
  if (requireTls && !options.caCertificate) {
    throw new Error("DATABASE_SSL_CA is required when DATABASE_REQUIRE_TLS=true.");
  }

  if (!requireTls) {
    return {
      uri: connectionString,
      connectionLimit: options.connectionLimit ?? 5,
      waitForConnections: true,
      queueLimit: 0,
      connectTimeout: options.connectTimeout ?? 15_000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10_000,
    };
  }

  const url = new URL(connectionString);
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    ssl: {
      ca: normalizePem(options.caCertificate!),
      rejectUnauthorized: true,
    },
    connectionLimit: options.connectionLimit ?? 5,
    waitForConnections: true,
    queueLimit: 0,
    connectTimeout: options.connectTimeout ?? 15_000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,
  };
}
