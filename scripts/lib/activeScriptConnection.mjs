/**
 * Resolve the database connection the running Echelon application actually
 * reads.
 *
 * The application selects its database in `server/db.ts`. When
 * DATABASE_CUTOVER_USE_EXTERNAL_TARGET is "true" it reads the external
 * authoritative database, not DATABASE_URL. A content script that connects to
 * DATABASE_URL in that state writes to a database no learner ever sees, and the
 * write looks successful. This helper removes that failure mode by resolving
 * the same target the application resolves, and failing closed when the
 * external configuration is incomplete rather than silently falling back.
 *
 * TLS is always verified against the supplied CA. There is no insecure path.
 */

export function activeScriptConnection(env = process.env) {
  if (env.DATABASE_CUTOVER_USE_EXTERNAL_TARGET !== "true") {
    if (!env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required when the external target is not selected.");
    }
    return { options: env.DATABASE_URL, description: "managed platform database", external: false };
  }

  if (!env.EXTERNAL_DATABASE_URL || !env.EXTERNAL_DATABASE_CA || !env.DATABASE_CUTOVER_TARGET_DATABASE) {
    throw new Error("Authoritative external database configuration is incomplete.");
  }
  if (!/^[A-Za-z0-9_]+$/.test(env.DATABASE_CUTOVER_TARGET_DATABASE)) {
    throw new Error("Authoritative target database name is invalid.");
  }

  let url;
  try {
    url = new URL(env.EXTERNAL_DATABASE_URL);
  } catch {
    throw new Error("Authoritative external database URL is invalid.");
  }
  if (url.protocol !== "mysql:" || !url.hostname || !url.username) {
    throw new Error("Authoritative external database URL is incomplete.");
  }
  if (!url.searchParams.get("ssl-mode") && !url.searchParams.get("ssl")) {
    throw new Error("Authoritative external database TLS is not explicitly enabled.");
  }

  const ca = env.EXTERNAL_DATABASE_CA.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trimEnd() + "\n";
  if (!ca.includes("BEGIN CERTIFICATE")) {
    throw new Error("Authoritative external database CA certificate is invalid.");
  }

  return {
    options: {
      host: url.hostname,
      port: Number(url.port || 3306),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: env.DATABASE_CUTOVER_TARGET_DATABASE,
      charset: "utf8mb4",
      timezone: "Z",
      connectTimeout: 15_000,
      ssl: { ca, rejectUnauthorized: true },
    },
    description: `authoritative external database ${url.hostname}`,
    external: true,
  };
}
