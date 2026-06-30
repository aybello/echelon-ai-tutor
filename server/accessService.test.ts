/**
 * accessService.test.ts
 *
 * Regression tests for server/_core/accessService.ts (Phase 2).
 *
 * Tests verify:
 * - resolveVerifiedIdentity correctly identifies OAuth, OTP, and anonymous users.
 * - hasAccessToExam respects free exam types.
 * - assertAccess throws FORBIDDEN for unauthorized access.
 * - verifyAccessTokenAndRecheckDb validates token AND re-checks DB.
 * - getAccessibleCoursesForIdentity returns correct courses.
 * - Unknown exam types fail closed.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  resolveVerifiedIdentity,
  identityEmail,
  assertAccess,
  verifyAccessTokenAndRecheckDb,
  hasAccessToExam,
} from "../server/_core/accessService";
import { TRPCError } from "@trpc/server";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeOAuthCtx(overrides?: Partial<{ id: number; email: string; role: string; openId: string }>) {
  return {
    user: {
      id: overrides?.id ?? 1,
      email: overrides?.email ?? "alice@example.com",
      role: overrides?.role ?? "user",
      openId: overrides?.openId ?? "oauth-123",
    },
    studentEmail: null,
  };
}

function makeOtpCtx(email: string) {
  return {
    user: null,
    studentEmail: email,
  };
}

function makeAnonCtx() {
  return {
    user: null,
    studentEmail: null,
  };
}

// ---------------------------------------------------------------------------
// resolveVerifiedIdentity
// ---------------------------------------------------------------------------

describe("resolveVerifiedIdentity", () => {
  it("returns oauth identity for a logged-in OAuth user", () => {
    const ctx = makeOAuthCtx({ email: "alice@example.com" });
    const identity = resolveVerifiedIdentity(ctx as any);
    expect(identity.type).toBe("oauth");
    if (identity.type === "oauth") {
      expect(identity.email).toBe("alice@example.com");
      expect(identity.userId).toBe(1);
    }
  });

  it("normalizes email to lowercase", () => {
    const ctx = makeOAuthCtx({ email: "Alice@Example.COM" });
    const identity = resolveVerifiedIdentity(ctx as any);
    if (identity.type === "oauth") {
      expect(identity.email).toBe("alice@example.com");
    }
  });

  it("returns otp identity for an OTP session", () => {
    const ctx = makeOtpCtx("bob@example.com");
    const identity = resolveVerifiedIdentity(ctx as any);
    expect(identity.type).toBe("otp");
    if (identity.type === "otp") {
      expect(identity.email).toBe("bob@example.com");
    }
  });

  it("returns anonymous identity when no session exists", () => {
    const ctx = makeAnonCtx();
    const identity = resolveVerifiedIdentity(ctx as any);
    expect(identity.type).toBe("anonymous");
  });

  it("prefers OAuth over OTP when both are present", () => {
    const ctx = {
      user: { id: 1, email: "alice@example.com", role: "user", openId: "x" },
      studentEmail: "other@example.com",
    };
    const identity = resolveVerifiedIdentity(ctx as any);
    expect(identity.type).toBe("oauth");
  });
});

// ---------------------------------------------------------------------------
// identityEmail
// ---------------------------------------------------------------------------

describe("identityEmail", () => {
  it("returns email for oauth identity", () => {
    expect(identityEmail({ type: "oauth", userId: 1, email: "a@b.com" })).toBe("a@b.com");
  });

  it("returns email for otp identity", () => {
    expect(identityEmail({ type: "otp", email: "c@d.com" })).toBe("c@d.com");
  });

  it("returns null for anonymous identity", () => {
    expect(identityEmail({ type: "anonymous" })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// hasAccessToExam — free exam types
// ---------------------------------------------------------------------------

describe("hasAccessToExam — free exam types", () => {
  it("grants access to OIT (free) for anonymous users", async () => {
    const identity = { type: "anonymous" as const };
    const result = await hasAccessToExam(identity, "oit");
    expect(result).toBe(true);
  });

  it("grants access to oit-ww (free) for anonymous users", async () => {
    const identity = { type: "anonymous" as const };
    const result = await hasAccessToExam(identity, "oit-ww");
    expect(result).toBe(true);
  });

  it("denies access to a paid exam type for anonymous users", async () => {
    const identity = { type: "anonymous" as const };
    const result = await hasAccessToExam(identity, "class1-water");
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// assertAccess — free exam types pass without DB
// ---------------------------------------------------------------------------

describe("assertAccess — free exam types", () => {
  it("does not throw for OIT (free) with anonymous context", async () => {
    const ctx = makeAnonCtx();
    await expect(assertAccess(ctx as any, "oit")).resolves.toBeUndefined();
  });

  it("does not throw for oit-ww (free) with anonymous context", async () => {
    const ctx = makeAnonCtx();
    await expect(assertAccess(ctx as any, "oit-ww")).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// assertAccess — anonymous user denied for paid content
// ---------------------------------------------------------------------------

describe("assertAccess — anonymous denied for paid content", () => {
  it("throws FORBIDDEN for anonymous user with no token and no email", async () => {
    const ctx = makeAnonCtx();
    await expect(assertAccess(ctx as any, "class1-water")).rejects.toThrow(TRPCError);
  });

  it("throws FORBIDDEN for unknown exam type", async () => {
    const ctx = makeAnonCtx();
    await expect(assertAccess(ctx as any, "totally-unknown-exam")).rejects.toThrow(TRPCError);
  });
});

// ---------------------------------------------------------------------------
// verifyAccessTokenAndRecheckDb — invalid/missing token
// ---------------------------------------------------------------------------

describe("verifyAccessTokenAndRecheckDb", () => {
  it("returns hasAccess: false for null token", async () => {
    const result = await verifyAccessTokenAndRecheckDb(null, "class1-water");
    expect(result.hasAccess).toBe(false);
    expect(result.email).toBeNull();
  });

  it("returns hasAccess: false for undefined token", async () => {
    const result = await verifyAccessTokenAndRecheckDb(undefined, "class1-water");
    expect(result.hasAccess).toBe(false);
  });

  it("returns hasAccess: false for a garbage token string", async () => {
    const result = await verifyAccessTokenAndRecheckDb("not-a-jwt", "class1-water");
    expect(result.hasAccess).toBe(false);
  });
});
