import type { PoolOptions } from "mysql2";

const TLS_MODES = new Set(["REQUIRED", "VERIFY_CA", "VERIFY_IDENTITY", "TRUE", "1"]);
const LOCAL_DATABASE_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export function normalizePem(value: string): string {
  return value.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trimEnd() + "\n";
}

function safeUrl(connectionString: string): URL {
  try {
    const url = new URL(connectionString);
    if (url.protocol !== "mysql:" || !url.hostname || !url.username || !url.pathname || url.pathname === "/") {
      throw new Error("invalid");
    }
    return url;
  } catch {
    throw new Error("DATABASE_URL is invalid. Check the protected secret value.");
  }
}

function tlsRequested(url: URL): boolean {
  const sslMode = url.searchParams.get("ssl-mode");
  const ssl = url.searchParams.get("ssl");
  if (sslMode && ssl) throw new Error("DATABASE_URL must use only one TLS parameter.");
  if (sslMode) {
    if (!TLS_MODES.has(sslMode.toUpperCase())) throw new Error("DATABASE_URL has an unsupported ssl-mode.");
    return true;
  }
  if (!ssl) return false;
  if (TLS_MODES.has(ssl.toUpperCase())) return true;
  try {
    const parsed = JSON.parse(ssl);
    if (parsed && typeof parsed === "object" && parsed.rejectUnauthorized === true) return true;
  } catch {
    // Fail closed below.
  }
  throw new Error("DATABASE_URL has an unsupported ssl value.");
}

/**
 * Produces certificate-verified mysql2 pool options. Remote hosts are never
 * allowed to use a URI passthrough because mysql2 does not understand provider
 * URL parameters such as ssl-mode. DATABASE_REQUIRE_TLS=true additionally
 * requires an explicit private CA for the business-owned production database.
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
  const url = safeUrl(connectionString);
  const queryKeys = [...url.searchParams.keys()];
  if (queryKeys.some(key => key !== "ssl" && key !== "ssl-mode")) {
    throw new Error("DATABASE_URL contains unsupported query parameters.");
  }

  const requestedTls = tlsRequested(url);
  const remoteHost = !LOCAL_DATABASE_HOSTS.has(url.hostname.toLowerCase());
  const requireTls = options.requireTls === true;
  if ((remoteHost || requireTls) && !requestedTls) {
    throw new Error("DATABASE_URL must request TLS for a remote database.");
  }
  if (requireTls && !options.caCertificate) {
    throw new Error("DATABASE_SSL_CA is required when DATABASE_REQUIRE_TLS=true.");
  }
  if (options.caCertificate && !options.caCertificate.includes("BEGIN CERTIFICATE")) {
    throw new Error("DATABASE_SSL_CA must contain a PEM certificate.");
  }

  const poolOptions: PoolOptions = {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    charset: "utf8mb4",
    timezone: "Z",
    connectionLimit: options.connectionLimit ?? 5,
    waitForConnections: true,
    queueLimit: 0,
    connectTimeout: options.connectTimeout ?? 15_000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,
  };

  if (requestedTls) {
    poolOptions.ssl = {
      ...(options.caCertificate ? { ca: normalizePem(options.caCertificate) } : {}),
      rejectUnauthorized: true,
    };
  }
  return poolOptions;
}
