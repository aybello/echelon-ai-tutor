import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { Request, Response } from "express";
import { ENV } from "./env";
import {
  ASSESSMENT_ONLY_COOKIE,
  assertLearnerStateAllowed,
  issueAssessmentOnlySession,
  readAssessmentOnlySession,
} from "./assessmentOnlySession";

const secret = "assessment-only-test-secret";

type CookieRequest = Request & { cookies?: Record<string, string> };
function response() {
  return { cookie: vi.fn() } as unknown as Response;
}
function request(token?: string): CookieRequest {
  return { cookies: token ? { [ASSESSMENT_ONLY_COOKIE]: token } : {} } as CookieRequest;
}

describe("assessment-only session boundary", () => {
  beforeEach(() => { ENV.cookieSecret = secret; });
  afterEach(() => { vi.restoreAllMocks(); });

  it("issues a signed, short-lived cookie bound to assignment, email and course", async () => {
    const res = response();
    const claims = await issueAssessmentOnlySession(res, {
      assignmentId: "11111111-1111-4111-8111-111111111111",
      candidateEmail: " Candidate@Example.TEST ",
      courseKey: "oit",
      ttlMs: 60_000,
    });
    const token = vi.mocked(res.cookie).mock.calls[0][1] as string;
    expect(claims).toMatchObject({
      typ: "assessment-only",
      assignmentId: "11111111-1111-4111-8111-111111111111",
      candidateEmail: "candidate@example.test",
      courseKey: "oit",
    });
    expect(await readAssessmentOnlySession(request(token))).toMatchObject(claims);
    expect(vi.mocked(res.cookie).mock.calls[0][0]).toBe(ASSESSMENT_ONLY_COOKIE);
    expect((vi.mocked(res.cookie).mock.calls[0] as unknown as [string, string, Record<string, unknown>])[2]).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
  });

  it("rejects tampering, wrong cookie purpose, and expiry", async () => {
    const res = response();
    await issueAssessmentOnlySession(res, {
      assignmentId: "22222222-2222-4222-8222-222222222222",
      candidateEmail: "candidate@example.test",
      courseKey: "oit",
      ttlMs: 1,
    });
    const token = vi.mocked(res.cookie).mock.calls[0][1] as string;
    await new Promise(resolve => setTimeout(resolve, 5));
    expect(await readAssessmentOnlySession(request(token))).toBeNull();
    expect(await readAssessmentOnlySession(request(`${token}tampered`))).toBeNull();
    expect(await readAssessmentOnlySession(request("not-a-session"))).toBeNull();
  });

  it("denies learner state only when the server-recognized capability is present", () => {
    expect(() => assertLearnerStateAllowed({ assessmentOnlySession: null })).not.toThrow();
    expect(() => assertLearnerStateAllowed({})).not.toThrow();
    expect(() => assertLearnerStateAllowed({ assessmentOnlySession: {
      typ: "assessment-only",
      assignmentId: "33333333-3333-4333-8333-333333333333",
      candidateEmail: "candidate@example.test",
      courseKey: "oit",
      exp: Date.now() + 60_000,
    } })).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }));
  });
});
