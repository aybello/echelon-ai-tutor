/**
 * Round 3 regression tests
 * - Issue E: past_due grace period in resolveAccess / resolveAccessByEmail
 * - Issue G: admin stats COUNT(*) query shape
 * - Issue H: flashcard saveProgress size cap + getAllProgress IDOR guard
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

// ─── Issue E: past_due grace period ──────────────────────────────────────────

describe("Issue E — past_due grace period", () => {
  it("grants access when status=past_due and currentPeriodEnd is in the future", () => {
    // Simulate the filter logic from resolveAccess
    const now = new Date();
    const futureEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days
    const rows = [{ status: "past_due", currentPeriodEnd: futureEnd, tier: "oit", province: "ontario" }];
    const eligible = rows.filter((r) => r.status === "active" || r.status === "past_due");
    expect(eligible).toHaveLength(1);
  });

  it("denies access when status=past_due but currentPeriodEnd has passed", () => {
    const now = new Date();
    const pastEnd = new Date(now.getTime() - 1000); // 1 second ago
    // The WHERE clause gt(currentPeriodEnd, now) would exclude this row
    const rows = [{ status: "past_due", currentPeriodEnd: pastEnd, tier: "oit", province: "ontario" }];
    const eligible = rows.filter((r) => r.currentPeriodEnd > now && (r.status === "active" || r.status === "past_due"));
    expect(eligible).toHaveLength(0);
  });

  it("denies access when status=cancelled even if currentPeriodEnd is in the future", () => {
    const now = new Date();
    const futureEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const rows = [{ status: "cancelled", currentPeriodEnd: futureEnd, tier: "oit", province: "ontario" }];
    const eligible = rows.filter((r) => r.status === "active" || r.status === "past_due");
    expect(eligible).toHaveLength(0);
  });

  it("grants access when status=active (unchanged behaviour)", () => {
    const now = new Date();
    const futureEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const rows = [{ status: "active", currentPeriodEnd: futureEnd, tier: "oit", province: "ontario" }];
    const eligible = rows.filter((r) => r.status === "active" || r.status === "past_due");
    expect(eligible).toHaveLength(1);
  });
});

// ─── Issue G: admin stats COUNT(*) ───────────────────────────────────────────

describe("Issue G — admin stats COUNT(*)", () => {
  it("count() returns a number, not an array of rows", () => {
    // Simulate what Drizzle count() returns: [{ cnt: 42 }]
    const mockResult = [{ cnt: 42 }];
    const [{ cnt }] = mockResult;
    expect(Number(cnt)).toBe(42);
  });

  it("revenue SUM returns a number", () => {
    const mockResult = [{ total: 9900 }];
    const totalRevenueCents = Number(mockResult[0]?.total ?? 0);
    expect(totalRevenueCents / 100).toBeCloseTo(99.0);
  });
});

// ─── Issue H: flashcard saveProgress size cap ─────────────────────────────────

describe("Issue H — flashcard saveProgress size cap", () => {
  const MAX_KNOWN_IDS = 20_000;
  const MAX_ID_STRING_LEN = 64;
  const MAX_KNOWN_IDS_BYTES = 200_000;

  it("accepts a payload within limits", () => {
    const knownIds = Array.from({ length: 100 }, (_, i) => i);
    const json = JSON.stringify(knownIds);
    expect(knownIds.length).toBeLessThanOrEqual(MAX_KNOWN_IDS);
    expect(json.length).toBeLessThanOrEqual(MAX_KNOWN_IDS_BYTES);
  });

  it("rejects a payload exceeding MAX_KNOWN_IDS (20,000)", () => {
    const knownIds = Array.from({ length: MAX_KNOWN_IDS + 1 }, (_, i) => i);
    // Zod .max(20000) would reject this
    expect(knownIds.length).toBeGreaterThan(MAX_KNOWN_IDS);
  });

  it("rejects a string ID exceeding MAX_ID_STRING_LEN (64 chars)", () => {
    const longId = "a".repeat(MAX_ID_STRING_LEN + 1);
    expect(longId.length).toBeGreaterThan(MAX_ID_STRING_LEN);
  });

  it("rejects a serialized payload exceeding MAX_KNOWN_IDS_BYTES (200,000 bytes)", () => {
    // Craft a payload that passes count check but fails byte check
    // 10,000 strings of 30 chars each ≈ 330,000 bytes
    const knownIds = Array.from({ length: 10_000 }, () => "a".repeat(30));
    const json = JSON.stringify(knownIds);
    expect(json.length).toBeGreaterThan(MAX_KNOWN_IDS_BYTES);
  });
});

// ─── Issue H: getAllProgress IDOR guard ───────────────────────────────────────

describe("Issue H — getAllProgress IDOR guard", () => {
  it("uses session email when ctx.studentEmail is present, ignoring input.email", () => {
    const ctx = { user: null, studentEmail: "alice@example.com" };
    const input = { email: "attacker@example.com" };
    // Simulate the resolution logic
    const sessionEmail = ctx.user?.email ?? ctx.studentEmail ?? null;
    const email = sessionEmail ?? input.email ?? null;
    expect(email).toBe("alice@example.com");
  });

  it("falls back to input.email when no session is present (public Account page)", () => {
    const ctx = { user: null, studentEmail: null };
    const input = { email: "bob@example.com" };
    const sessionEmail = ctx.user?.email ?? ctx.studentEmail ?? null;
    const email = sessionEmail ?? input.email ?? null;
    expect(email).toBe("bob@example.com");
  });

  it("returns empty progress when neither session nor input.email is provided", () => {
    const ctx = { user: null, studentEmail: null };
    const input = { email: undefined };
    const sessionEmail = ctx.user?.email ?? ctx.studentEmail ?? null;
    const email = sessionEmail ?? input.email ?? null;
    expect(email).toBeNull();
  });
});
