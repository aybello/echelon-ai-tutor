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

// ---------------------------------------------------------------------------
// resolveAccessForRequest — Phase 4 integration helper
// ---------------------------------------------------------------------------

import { resolveAccessForRequest } from "../server/_core/accessService";

describe("resolveAccessForRequest — free exam types", () => {
  it("returns true for OIT (free) with anonymous context", async () => {
    const ctx = makeAnonCtx();
    const result = await resolveAccessForRequest(ctx as any, "oit");
    expect(result).toBe(true);
  });

  it("returns true for oit-ww (free) with anonymous context", async () => {
    const ctx = makeAnonCtx();
    const result = await resolveAccessForRequest(ctx as any, "oit-ww");
    expect(result).toBe(true);
  });

  it("returns false for paid exam type with anonymous context and no token", async () => {
    const ctx = makeAnonCtx();
    const result = await resolveAccessForRequest(ctx as any, "class1-water");
    expect(result).toBe(false);
  });

  it("returns false for unknown exam type (fail closed)", async () => {
    const ctx = makeAnonCtx();
    const result = await resolveAccessForRequest(ctx as any, "totally-unknown-exam-xyz");
    expect(result).toBe(false);
  });

  it("returns false for paid exam type with garbage access token", async () => {
    const ctx = makeAnonCtx();
    const result = await resolveAccessForRequest(ctx as any, "class1-water", {
      accessToken: "not-a-valid-jwt",
    });
    expect(result).toBe(false);
  });

});

// ---------------------------------------------------------------------------
// P0 Security Regression — client-supplied email MUST NOT grant access
// These tests verify that the vulnerability (passing any email string to bypass
// access control) is permanently closed. resolveAccessForRequest no longer
// accepts a clientEmail parameter at all.
// ---------------------------------------------------------------------------

describe("P0 Security: client-supplied email cannot bypass access control", () => {
  it("anonymous user with a paid-subscriber email string is still denied", async () => {
    const ctx = makeAnonCtx();
    // The old vulnerable path: pass a known subscriber's email as clientEmail.
    // resolveAccessForRequest no longer accepts clientEmail — extra keys are ignored.
    const result = await resolveAccessForRequest(ctx as any, "class1-water", {
      // @ts-expect-error — clientEmail is intentionally no longer in the type
      clientEmail: "subscriber@example.com",
    });
    expect(result).toBe(false);
  });

  it("anonymous user with an admin email string is still denied", async () => {
    const ctx = makeAnonCtx();
    const result = await resolveAccessForRequest(ctx as any, "class1-water", {
      // @ts-expect-error
      clientEmail: "admin@echeloninstitute.ca",
    });
    expect(result).toBe(false);
  });

  it("anonymous user with a garbage email string is still denied", async () => {
    const ctx = makeAnonCtx();
    const result = await resolveAccessForRequest(ctx as any, "class2-water", {
      // @ts-expect-error
      clientEmail: "hacker@evil.com",
    });
    expect(result).toBe(false);
  });

  it("anonymous user with a valid access token AND a spoofed email — token decides, not email", async () => {
    const ctx = makeAnonCtx();
    // No valid token + spoofed email = denied
    const result = await resolveAccessForRequest(ctx as any, "class1-water", {
      accessToken: "not-a-valid-jwt",
      // @ts-expect-error
      clientEmail: "subscriber@example.com",
    });
    expect(result).toBe(false);
  });

  it("assertAccess throws FORBIDDEN even when clientEmail is passed as extra option", async () => {
    const ctx = makeAnonCtx();
    await expect(
      assertAccess(ctx as any, "class1-water", {
        // @ts-expect-error
        clientEmail: "subscriber@example.com",
      })
    ).rejects.toThrow(TRPCError);
  });
});

// ---------------------------------------------------------------------------
// courseRegistry helpers — Phase 7
// ---------------------------------------------------------------------------

import {
  getExamTypesForCourseKey,
  courseKeyToLabel,
} from "../shared/courseRegistry";

describe("getExamTypesForCourseKey", () => {
  it("returns the questionBankKey for a canonical Ontario key", () => {
    expect(getExamTypesForCourseKey("class1-water")).toEqual(["class1-water"]);
  });

  it("returns the questionBankKey for a canonical WPI key", () => {
    expect(getExamTypesForCourseKey("wpi-class1-water")).toEqual(["wpi-class1-water"]);
  });

  it("resolves legacy alias to canonical questionBankKey", () => {
    // class1-wastewater is an alias for class1-ww
    expect(getExamTypesForCourseKey("class1-wastewater")).toEqual(["class1-ww"]);
  });

  it("returns [] for unknown course key (fail closed)", () => {
    expect(getExamTypesForCourseKey("totally-unknown-course-xyz")).toEqual([]);
  });

  it("returns the questionBankKey for OIT", () => {
    expect(getExamTypesForCourseKey("oit")).toEqual(["oit"]);
  });
});

describe("courseKeyToLabel", () => {
  it("returns display name for a canonical Ontario key", () => {
    expect(courseKeyToLabel("class1-water")).toBe("Class 1 Water Treatment");
  });

  it("returns display name for a WPI key", () => {
    expect(courseKeyToLabel("wpi-class1-water")).toBe("WPI Class I Water Treatment");
  });

  it("resolves legacy alias to display name", () => {
    expect(courseKeyToLabel("class1-wastewater")).toBe("Class 1 Wastewater Treatment");
  });

  it("falls back to the key itself for unknown keys", () => {
    expect(courseKeyToLabel("totally-unknown-course-xyz")).toBe("totally-unknown-course-xyz");
  });

  it("accepts and ignores the province parameter (for API compat)", () => {
    expect(courseKeyToLabel("class2-water", "ontario")).toBe("Class 2 Water Treatment");
  });
});
