import { afterEach, describe, expect, it, vi } from "vitest";
import { assertLearnerIntegrationDatabaseTarget } from "./learnerIntegrationGuard";

const disposableCi = "mysql://root:root@127.0.0.1:3306/echelon_ci";

function enabledEnv(): NodeJS.ProcessEnv {
  return {
    CI: "1",
    LEARNER_INTEGRATION_TEST_DB: "1",
    DATABASE_CUTOVER_USE_EXTERNAL_TARGET: "",
    EXTERNAL_DATABASE_URL: "",
  };
}

afterEach(() => vi.unstubAllEnvs());

describe("learner integration database isolation", () => {
  it("permits only the explicit pinned CI database", () => {
    expect(
      assertLearnerIntegrationDatabaseTarget(disposableCi, enabledEnv())
        .pathname
    ).toBe("/echelon_ci");
  });

  it.each([
    undefined,
    "mysql://root:root@db.example.test:3306/echelon_ci",
    "mysql://root:root@localhost:3306/echelon_ci",
    "mysql://root:root@127.0.0.1:3311/echelon_ci",
    "mysql://app:root@127.0.0.1:3306/echelon_ci",
    "mysql://root:wrong@127.0.0.1:3306/echelon_ci",
    "mysql://root:root@127.0.0.1:3306/echelon_production",
    "mysql://root:root@127.0.0.1:3306/echelon_ci?ssl=true",
    "https://root:root@127.0.0.1:3306/echelon_ci",
  ])("rejects non-disposable target %s", target => {
    expect(() =>
      assertLearnerIntegrationDatabaseTarget(target, enabledEnv())
    ).toThrow();
  });

  it.each([
    ["CI", ""],
    ["LEARNER_INTEGRATION_TEST_DB", ""],
    ["DATABASE_CUTOVER_USE_EXTERNAL_TARGET", "true"],
    ["EXTERNAL_DATABASE_URL", "mysql://deployment.invalid/live"],
  ])("rejects unsafe or missing selector %s", (key, value) => {
    const env = enabledEnv();
    env[key] = value;
    expect(() =>
      assertLearnerIntegrationDatabaseTarget(disposableCi, env)
    ).toThrow();
  });
});
