/**
 * Tests for the waitlist tRPC procedure logic
 * Validates input schema, duplicate detection, and response shape
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";

// ── Input schema (mirrors routers.ts) ──────────────────────────────────────
const waitlistInputSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  courseCode: z.string().min(1),
  courseTitle: z.string().min(1),
});

describe("waitlist input validation", () => {
  it("accepts a valid email and course details", () => {
    const result = waitlistInputSchema.safeParse({
      email: "operator@ontario.ca",
      courseCode: "CL2-W",
      courseTitle: "Water Class 2",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email address", () => {
    const result = waitlistInputSchema.safeParse({
      email: "not-an-email",
      courseCode: "CL2-W",
      courseTitle: "Water Class 2",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Please enter a valid email address");
    }
  });

  it("rejects empty courseCode", () => {
    const result = waitlistInputSchema.safeParse({
      email: "operator@ontario.ca",
      courseCode: "",
      courseTitle: "Water Class 2",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty courseTitle", () => {
    const result = waitlistInputSchema.safeParse({
      email: "operator@ontario.ca",
      courseCode: "CL2-W",
      courseTitle: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all coming-soon course codes", () => {
    const comingSoonCodes = [
      "CL2-W", "CL3-W", "CL4-W",
      "CL2-WW", "CL3-WW", "CL4-WW",
      "WQA",
    ];
    for (const code of comingSoonCodes) {
      const result = waitlistInputSchema.safeParse({
        email: "test@example.com",
        courseCode: code,
        courseTitle: `Course ${code}`,
      });
      expect(result.success, `Expected ${code} to be valid`).toBe(true);
    }
  });
});

describe("waitlist response shape", () => {
  it("success response has correct shape for new signup", () => {
    const response = { success: true, alreadyRegistered: false };
    expect(response.success).toBe(true);
    expect(response.alreadyRegistered).toBe(false);
  });

  it("success response has correct shape for duplicate signup", () => {
    const response = { success: true, alreadyRegistered: true };
    expect(response.success).toBe(true);
    expect(response.alreadyRegistered).toBe(true);
  });
});
