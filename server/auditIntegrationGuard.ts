/** Test infrastructure only: never select a deployment database from inherited configuration. */
export function assertAuditIntegrationDatabaseTarget(
  rawUrl: string | undefined,
  isAssignedSandboxTarget: (url: URL) => boolean,
): URL {
  if (!rawUrl) throw new Error("Explicit disposable audit database URL is required");
  const url = new URL(rawUrl);
  const isSyntheticCiTarget = process.env.CI === "1"
    && ["127.0.0.1", "localhost"].includes(url.hostname)
    && url.port === "3306"
    && url.pathname === "/echelon_ci"
    && url.username === "root"
    && url.password === "root";
  if (process.env.AUDIT_INTEGRATION_TEST_DB !== "1"
    || url.protocol !== "mysql:"
    || !["127.0.0.1", "localhost"].includes(url.hostname)
    || url.search || url.hash
    || process.env.DATABASE_CUTOVER_USE_EXTERNAL_TARGET === "true"
    || process.env.EXTERNAL_DATABASE_URL
    || (!isSyntheticCiTarget && !isAssignedSandboxTarget(url))) {
    throw new Error("Only the assigned disposable loopback audit database or pinned synthetic CI database is allowed");
  }
  return url;
}
