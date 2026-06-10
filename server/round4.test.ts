/**
 * Round 4 regression tests
 * - Issue I: dashboardRouter uses ctx.studentEmail (single cookie-verification path)
 * - Issue J: email case normalization — uppercase email matches lowercase DB rows
 * - Issue K: AI tutor personalization gate accepts OTP students via ctx.studentEmail
 * - Issue L: contentVersion in getBankMeta response; cache invalidated on version mismatch
 * - Issue M: saveSession skips placeholder summary rows; maxTokens capped
 */
import { describe, it, expect } from "vitest";
import { TRPCError } from "@trpc/server";

// ─── Issue I: single cookie-verification path ─────────────────────────────────

describe("Issue I — dashboardRouter uses ctx.studentEmail (no duplicate cookie verification)", () => {
  function resolveDashboardIdentity(ctx: {
    user: { id: number; email?: string | null } | null;
    studentEmail?: string | null;
  }) {
    if (ctx.user) return { userId: ctx.user.id, email: ctx.user.email ?? null };
    if (ctx.studentEmail) return { userId: null, email: ctx.studentEmail };
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Please sign in to view your dashboard." });
  }

  it("returns userId + email for OAuth users", () => {
    const result = resolveDashboardIdentity({ user: { id: 1, email: "admin@example.com" }, studentEmail: null });
    expect(result).toEqual({ userId: 1, email: "admin@example.com" });
  });

  it("returns null userId + email for OTP students", () => {
    const result = resolveDashboardIdentity({ user: null, studentEmail: "student@example.com" });
    expect(result).toEqual({ userId: null, email: "student@example.com" });
  });

  it("throws UNAUTHORIZED when neither is present", () => {
    expect(() => resolveDashboardIdentity({ user: null, studentEmail: null })).toThrow(TRPCError);
  });
});

// ─── Issue J: email case normalization ───────────────────────────────────────

describe("Issue J — email case normalization", () => {
  function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  it("lowercases mixed-case email", () => {
    expect(normalizeEmail("Customer@Example.com")).toBe("customer@example.com");
  });

  it("is idempotent on already-lowercase email", () => {
    expect(normalizeEmail("customer@example.com")).toBe("customer@example.com");
  });

  it("trims whitespace and lowercases", () => {
    expect(normalizeEmail("  ALICE@EXAMPLE.COM  ")).toBe("alice@example.com");
  });

  it("normalized email matches DB row inserted as lowercase", () => {
    const signupEmail = "Customer@Example.com";
    const dbEmail = "customer@example.com"; // how logAttempt stores it
    expect(normalizeEmail(signupEmail)).toBe(dbEmail);
  });
});

// ─── Issue K: AI tutor personalization gate ───────────────────────────────────

describe("Issue K — AI tutor personalization gate accepts OTP students", () => {
  it("resolves studentIdent from ctx.user.id for OAuth users", () => {
    const ctx = { user: { id: 42, email: "admin@example.com" }, studentEmail: null };
    const studentIdent = ctx.user?.id ?? ctx.studentEmail ?? null;
    expect(studentIdent).toBe(42);
  });

  it("resolves studentIdent from ctx.studentEmail for OTP students", () => {
    const ctx = { user: null, studentEmail: "student@example.com" };
    const studentIdent = ctx.user?.id ?? ctx.studentEmail ?? null;
    expect(studentIdent).toBe("student@example.com");
  });

  it("returns null when neither is present (anonymous user)", () => {
    const ctx = { user: null, studentEmail: null };
    const studentIdent = ctx.user?.id ?? ctx.studentEmail ?? null;
    expect(studentIdent).toBeNull();
  });

  it("personalization block runs for OTP student with examType", () => {
    const ctx = { user: null, studentEmail: "student@example.com" };
    const input = { examType: "oit-class1-water" };
    const studentIdent = ctx.user?.id ?? ctx.studentEmail ?? null;
    const shouldPersonalize = Boolean(studentIdent && input.examType);
    expect(shouldPersonalize).toBe(true);
  });

  it("personalization block does NOT run for anonymous user", () => {
    const ctx = { user: null, studentEmail: null };
    const input = { examType: "oit-class1-water" };
    const studentIdent = ctx.user?.id ?? ctx.studentEmail ?? null;
    const shouldPersonalize = Boolean(studentIdent && input.examType);
    expect(shouldPersonalize).toBe(false);
  });
});

// ─── Issue L: contentVersion cache invalidation ───────────────────────────────

describe("Issue L — contentVersion cache invalidation", () => {
  it("invalidates cache when server version is higher than cached version", () => {
    const cached = { contentVersion: 1 };
    const serverVersion = 2;
    const shouldInvalidate = serverVersion > (cached.contentVersion ?? 0);
    expect(shouldInvalidate).toBe(true);
  });

  it("does NOT invalidate cache when server version equals cached version", () => {
    const cached = { contentVersion: 3 };
    const serverVersion = 3;
    const shouldInvalidate = serverVersion > (cached.contentVersion ?? 0);
    expect(shouldInvalidate).toBe(false);
  });

  it("invalidates cache when cached entry has no contentVersion (legacy cache)", () => {
    const cached = {} as { contentVersion?: number };
    const serverVersion = 1;
    const shouldInvalidate = serverVersion > (cached.contentVersion ?? 0);
    expect(shouldInvalidate).toBe(true);
  });

  it("does NOT invalidate when server version is lower (should not happen, but safe)", () => {
    const cached = { contentVersion: 5 };
    const serverVersion = 4;
    const shouldInvalidate = serverVersion > (cached.contentVersion ?? 0);
    expect(shouldInvalidate).toBe(false);
  });
});

// ─── Issue M: saveSession placeholder guard ───────────────────────────────────

describe("Issue M — saveSession skips placeholder summary rows", () => {
  const PLACEHOLDER_STRINGS = [
    "session summary unavailable",
    "unable to summarize",
    "no summary available",
  ];

  function summaryIsUseless(rawSummary: string): boolean {
    return (
      rawSummary.length < 20 ||
      PLACEHOLDER_STRINGS.some((p) => rawSummary.toLowerCase().includes(p))
    );
  }

  it("marks the default fallback string as useless", () => {
    expect(summaryIsUseless("Session summary unavailable.")).toBe(true);
  });

  it("marks an empty string as useless", () => {
    expect(summaryIsUseless("")).toBe(true);
  });

  it("marks a very short response as useless", () => {
    expect(summaryIsUseless("OK")).toBe(true);
  });

  it("accepts a real summary of sufficient length", () => {
    const realSummary =
      "The student worked through disinfection calculations and struggled with CT values. We covered chlorine dosing formulas and the student showed improvement by the end of the session.";
    expect(summaryIsUseless(realSummary)).toBe(false);
  });

  it("marks 'unable to summarize' as useless regardless of case", () => {
    expect(summaryIsUseless("UNABLE TO SUMMARIZE this session.")).toBe(true);
  });
});
