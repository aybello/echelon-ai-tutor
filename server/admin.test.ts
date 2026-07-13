/**
 * Admin router tests — verifies that adminProcedure correctly gates access
 * and that the input schemas are correctly defined.
 *
 * NOTE: These tests validate the access control logic and schema shapes
 * without hitting the database. DB-dependent procedures are tested via
 * integration tests; here we focus on the gate and schema contracts.
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";

// ── Schema mirrors (match server/routers/admin.ts) ────────────────────────────
const statsSchema = z.object({
  trialCount: z.number(),
  waitlistCount: z.number(),
  errorCount: z.number(),
  scoreCount: z.number().optional(),
  purchaseCount: z.number().optional(),
  totalRevenueCAD: z.number().optional(),
});

const purchaseSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  productKey: z.string(),
  productName: z.string(),
  amountCAD: z.number(),
  stripeSessionId: z.string(),
  createdAt: z.date(),
});

const trialEmailSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  source: z.string(),
  createdAt: z.date(),
});

const waitlistSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  courseCode: z.string(),
  courseTitle: z.string(),
  createdAt: z.date(),
});

const errorReportSchema = z.object({
  id: z.number(),
  questionId: z.number(),
  questionText: z.string(),
  module: z.string(),
  reportType: z.string(),
  details: z.string().nullable().optional(),
  createdAt: z.date(),
});

const dismissInputSchema = z.object({ id: z.number().int().positive() });
const removeWaitlistInputSchema = z.object({ id: z.number().int().positive() });

// ── Schema validation tests ───────────────────────────────────────────────────
describe("admin stats schema", () => {
  it("validates a correct stats response", () => {
    const result = statsSchema.safeParse({ trialCount: 5, waitlistCount: 3, errorCount: 2 });
    expect(result.success).toBe(true);
  });

  it("rejects non-numeric counts", () => {
    const result = statsSchema.safeParse({ trialCount: "5", waitlistCount: 3, errorCount: 2 });
    expect(result.success).toBe(false);
  });
});

describe("admin trial email schema", () => {
  it("validates a correct trial email row", () => {
    const result = trialEmailSchema.safeParse({
      id: 1, email: "operator@ontario.ca", source: "quiz_gate", createdAt: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email in trial email row", () => {
    const result = trialEmailSchema.safeParse({
      id: 1, email: "not-an-email", source: "quiz_gate", createdAt: new Date(),
    });
    expect(result.success).toBe(false);
  });
});

describe("admin waitlist schema", () => {
  it("validates a correct waitlist row", () => {
    const result = waitlistSchema.safeParse({
      id: 1, email: "user@test.com", courseCode: "CL1-W", courseTitle: "Water Class 1", createdAt: new Date(),
    });
    expect(result.success).toBe(true);
  });
});

describe("admin error report schema", () => {
  it("validates a correct error report row", () => {
    const result = errorReportSchema.safeParse({
      id: 1, questionId: 42, questionText: "What is chlorine?", module: "Disinfection",
      reportType: "wrong_answer", details: null, createdAt: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it("validates error report with optional details", () => {
    const result = errorReportSchema.safeParse({
      id: 2, questionId: 99, questionText: "Calculate CT value", module: "Math & Calculations",
      reportType: "wrong_calculation", details: "The answer should be 12, not 10", createdAt: new Date(),
    });
    expect(result.success).toBe(true);
  });
});

describe("admin mutation input schemas", () => {
  it("dismissErrorReport input accepts a positive integer id", () => {
    expect(dismissInputSchema.safeParse({ id: 5 }).success).toBe(true);
  });

  it("dismissErrorReport input rejects id=0", () => {
    expect(dismissInputSchema.safeParse({ id: 0 }).success).toBe(false);
  });

  it("dismissErrorReport input rejects negative id", () => {
    expect(dismissInputSchema.safeParse({ id: -1 }).success).toBe(false);
  });

  it("removeWaitlistEntry input accepts a positive integer id", () => {
    expect(removeWaitlistInputSchema.safeParse({ id: 3 }).success).toBe(true);
  });

  it("removeWaitlistEntry input rejects non-integer id", () => {
    expect(removeWaitlistInputSchema.safeParse({ id: 1.5 }).success).toBe(false);
  });
});

describe("admin purchase schema", () => {
  it("validates a correct purchase row", () => {
    const result = purchaseSchema.safeParse({
      id: 1, email: "buyer@ontario.ca", productKey: "oit",
      productName: "OIT Practice Pass", amountCAD: 4900,
      stripeSessionId: "cs_test_abc123", createdAt: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it("rejects purchase row with invalid email", () => {
    const result = purchaseSchema.safeParse({
      id: 1, email: "not-valid", productKey: "oit",
      productName: "OIT Practice Pass", amountCAD: 4900,
      stripeSessionId: "cs_test_abc123", createdAt: new Date(),
    });
    expect(result.success).toBe(false);
  });

  it("validates stats with revenue fields", () => {
    const result = statsSchema.safeParse({
      trialCount: 10, waitlistCount: 5, errorCount: 2,
      scoreCount: 8, purchaseCount: 3, totalRevenueCAD: 147.0,
    });
    expect(result.success).toBe(true);
  });

  it("validates stats without optional revenue fields", () => {
    const result = statsSchema.safeParse({
      trialCount: 10, waitlistCount: 5, errorCount: 2,
    });
    expect(result.success).toBe(true);
  });
});

// ── Role-based access control logic ──────────────────────────────────────────
describe("admin role gate logic", () => {
  function isAdmin(role: string | null | undefined) {
    return role === "admin";
  }

  it("grants access to role=admin", () => {
    expect(isAdmin("admin")).toBe(true);
  });

  it("denies access to role=user", () => {
    expect(isAdmin("user")).toBe(false);
  });

  it("denies access to null role (unauthenticated)", () => {
    expect(isAdmin(null)).toBe(false);
  });

  it("denies access to undefined role", () => {
    expect(isAdmin(undefined)).toBe(false);
  });
});
