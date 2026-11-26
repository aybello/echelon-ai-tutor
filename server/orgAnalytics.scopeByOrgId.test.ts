/**
 * Tests for Phase 8 — manager analytics scoped by orgId/organizationMemberId.
 * Verifies that attempt queries use eq(questionAttempts.orgId, orgId) instead of
 * inArray(questionAttempts.studentEmail, memberEmails) to prevent cross-org leakage.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ORG_ROUTER_PATH = resolve(__dirname, "routers/orgRouter.ts");
const orgRouterSource = readFileSync(ORG_ROUTER_PATH, "utf-8");

describe("orgRouter — Phase 8 orgId scoping", () => {
  it("does not use inArray(questionAttempts.studentEmail, memberEmails) in any analytics query", () => {
    // After Phase 8, all analytics queries must scope by orgId, not email list
    expect(orgRouterSource).not.toContain(
      "inArray(questionAttempts.studentEmail, memberEmails)"
    );
  });

  it("does not use inArray(questionAttempts.studentEmail, allEmails) in any analytics query", () => {
    expect(orgRouterSource).not.toContain(
      "inArray(questionAttempts.studentEmail, allEmails)"
    );
  });

  it("uses eq(questionAttempts.orgId, orgId) for attempt scoping", () => {
    expect(orgRouterSource).toContain("eq(questionAttempts.orgId, orgId)");
  });

  it("does not use inArray(examDates.email, memberEmails) in any analytics query", () => {
    expect(orgRouterSource).not.toContain(
      "inArray(examDates.email, memberEmails)"
    );
  });

  it("does not use inArray(examResults.studentEmail, allEmails) in any analytics query", () => {
    expect(orgRouterSource).not.toContain(
      "inArray(examResults.studentEmail, allEmails)"
    );
  });

  it("scopes activation and diagnostic outcomes by server-resolved orgId", () => {
    expect(orgRouterSource).toContain("eq(learnerOnboarding.orgId, orgId)");
    expect(orgRouterSource).toContain("eq(diagnosticSessions.orgId, orgId)");
  });
});
