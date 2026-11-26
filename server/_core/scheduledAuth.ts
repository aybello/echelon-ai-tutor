/**
 * Authorization decisions for the /api/scheduled/* endpoints.
 *
 * Extracted from the Express middleware so the rules can be tested directly.
 * These endpoints force database reconnects and trigger ingestion of external
 * job feeds, so an unauthenticated caller must never reach them outside local
 * development.
 */

/** True when the caller presented the configured shared secret. */
export function scheduledSecretMatches(
  cronSecret: string,
  headerSecret: string | string[] | undefined,
): boolean {
  if (!cronSecret) return false;
  if (typeof headerSecret !== "string") return false;
  return headerSecret === cronSecret;
}

/**
 * True only when an unauthenticated scheduled request may proceed: local
 * development with no secret configured.
 *
 * Deliberately an allow-list on "development" rather than a check for "not
 * production". NODE_ENV is routinely unset or spelled differently ("prod",
 * "Production", "staging", "test"), and each of those must fail closed —
 * otherwise a deployment that simply forgets CRON_SECRET silently publishes
 * these endpoints to the internet.
 */
export function allowsUnauthenticatedScheduledRequest(
  cronSecret: string,
  nodeEnv: string | undefined,
): boolean {
  if (cronSecret) return false;
  return nodeEnv === "development";
}
