import { afterEach, describe, expect, it, vi } from "vitest";
import { assertAuditIntegrationDatabaseTarget } from "./auditIntegrationGuard";

const ciUrl = "mysql://root:root@127.0.0.1:3306/echelon_ci";
const funnelUrl = "mysql://root@127.0.0.1:3311/echelon_audit_funnel";
const assigned = (url: URL) => url.hostname === "127.0.0.1" && url.port === "3311"
  && url.pathname === "/echelon_audit_funnel" && url.username === "root" && !url.password;

afterEach(() => vi.unstubAllEnvs());

describe("audit integration target isolation", () => {
  function enable() {
    vi.stubEnv("AUDIT_INTEGRATION_TEST_DB", "1");
    vi.stubEnv("CI", "1");
    vi.stubEnv("DATABASE_CUTOVER_USE_EXTERNAL_TARGET", "");
    vi.stubEnv("EXTERNAL_DATABASE_URL", "");
  }
  it("permits the exact assigned sandbox and explicit synthetic CI service only", () => {
    enable();
    expect(assertAuditIntegrationDatabaseTarget(funnelUrl, assigned).pathname).toBe("/echelon_audit_funnel");
    expect(assertAuditIntegrationDatabaseTarget(ciUrl, assigned).pathname).toBe("/echelon_ci");
    expect(assertAuditIntegrationDatabaseTarget(ciUrl.replace("127.0.0.1", "localhost"), assigned).hostname).toBe("localhost");
  });
  it.each(["", "true", "0"])("refuses CI database unless CI is exactly 1 (%s)", ci => {
    enable(); vi.stubEnv("CI", ci);
    expect(() => assertAuditIntegrationDatabaseTarget(ciUrl, assigned)).toThrow();
    expect(() => assertAuditIntegrationDatabaseTarget(funnelUrl, assigned)).not.toThrow();
  });
  it("requires an explicit integration gate and database URL", () => {
    enable();
    expect(() => assertAuditIntegrationDatabaseTarget(undefined, assigned)).toThrow();
    vi.stubEnv("AUDIT_INTEGRATION_TEST_DB", "");
    expect(() => assertAuditIntegrationDatabaseTarget(funnelUrl, assigned)).toThrow();
    expect(() => assertAuditIntegrationDatabaseTarget(ciUrl, assigned)).toThrow();
  });
  it.each([
    "mysql://root:root@db.example.test:3306/echelon_ci",
    "mysql://root:root@127.0.0.1:3311/echelon_ci",
    "mysql://root:root@127.0.0.1/echelon_ci",
    "mysql://app:root@127.0.0.1:3306/echelon_ci",
    "mysql://root:other@127.0.0.1:3306/echelon_ci",
    "mysql://root@127.0.0.1:3306/echelon_ci",
    "mysql://root:root@127.0.0.1:3306/echelon_production",
    "mysql://root@127.0.0.1:3311/echelon_audit_other",
    "mysql://root:root@127.0.0.1:3306/echelon_ci?ssl=true",
    "mysql://root@127.0.0.1:3311/echelon_audit_funnel#target",
    "https://root:root@127.0.0.1:3306/echelon_ci",
  ])("rejects unassigned or altered selectors: %s", target => {
    enable();
    expect(() => assertAuditIntegrationDatabaseTarget(target, assigned)).toThrow();
  });
  it.each(["DATABASE_CUTOVER_USE_EXTERNAL_TARGET", "EXTERNAL_DATABASE_URL"])("rejects inherited deployment selector %s", selector => {
    enable(); vi.stubEnv(selector, selector === "EXTERNAL_DATABASE_URL" ? "mysql://deployment.invalid/live" : "true");
    expect(() => assertAuditIntegrationDatabaseTarget(ciUrl, assigned)).toThrow();
    expect(() => assertAuditIntegrationDatabaseTarget(funnelUrl, assigned)).toThrow();
  });
});
