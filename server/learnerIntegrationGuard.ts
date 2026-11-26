/**
 * Test infrastructure only. Learner integration suites create results, attempts,
 * and analytics events, so they may run only against the pinned disposable CI
 * MySQL service. Never accept a deployment selector or an inherited URL.
 */
export function assertLearnerIntegrationDatabaseTarget(
  rawUrl: string | undefined,
  env: NodeJS.ProcessEnv = process.env
): URL {
  if (!rawUrl)
    throw new Error("Explicit learner integration database URL is required");

  const url = new URL(rawUrl);
  const isPinnedCiTarget =
    env.CI === "1" &&
    env.LEARNER_INTEGRATION_TEST_DB === "1" &&
    url.protocol === "mysql:" &&
    url.hostname === "127.0.0.1" &&
    url.port === "3306" &&
    url.pathname === "/echelon_ci" &&
    url.username === "root" &&
    url.password === "root" &&
    !url.search &&
    !url.hash;

  if (
    !isPinnedCiTarget ||
    env.DATABASE_CUTOVER_USE_EXTERNAL_TARGET === "true" ||
    Boolean(env.EXTERNAL_DATABASE_URL)
  ) {
    throw new Error(
      "Learner integration tests require the pinned disposable CI database"
    );
  }

  return url;
}
