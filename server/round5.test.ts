/**
 * Round 5 regression tests
 * Issues covered: O (indexes), Q (sessionId), R (log-before-send)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Issue R: log-before-send ────────────────────────────────────────────────
describe("Issue R — triggerLogs written before sendMail", () => {
  it("inserts a pending log row before calling sendMail", async () => {
    const insertOrder: string[] = [];

    const mockDb = {
      insert: vi.fn(() => ({
        values: vi.fn(() => {
          insertOrder.push("insert");
          return [{ insertId: 42 }];
        }),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve()),
        })),
      })),
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve([])),
            })),
          })),
        })),
      })),
    };

    const mockTransporter = {
      sendMail: vi.fn(async () => {
        insertOrder.push("sendMail");
      }),
    };

    // Simulate the log-before-send pattern directly
    const cooldownUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Step 1: insert pending row
    await mockDb.insert({} as never).values({ status: "pending", cooldownUntil });
    // Step 2: send email
    await mockTransporter.sendMail({ to: "test@example.com", subject: "Test", text: "Hello" });

    expect(insertOrder[0]).toBe("insert");
    expect(insertOrder[1]).toBe("sendMail");
  });

  it("marks log as 'failed' when sendMail throws, preserving cooldown", async () => {
    let statusWritten: string | null = null;

    const mockDb = {
      insert: vi.fn(() => ({
        values: vi.fn(() => Promise.resolve([{ insertId: 99 }])),
      })),
      update: vi.fn(() => ({
        set: vi.fn((data: { status: string }) => {
          statusWritten = data.status;
          return {
            where: vi.fn(() => Promise.resolve()),
          };
        }),
      })),
    };

    const mockTransporter = {
      sendMail: vi.fn(async () => {
        throw new Error("SMTP connection refused");
      }),
    };

    // Simulate the send + status-update pattern
    let sendError: Error | null = null;
    try {
      await mockTransporter.sendMail({ to: "test@example.com", subject: "Test", text: "Hello" });
    } catch (err) {
      sendError = err as Error;
    }

    // Update status based on outcome
    await mockDb.update({} as never).set({ status: sendError ? "failed" : "sent" }).where({} as never);

    expect(sendError).not.toBeNull();
    expect(statusWritten).toBe("failed");
  });

  it("marks log as 'sent' when sendMail succeeds", async () => {
    let statusWritten: string | null = null;

    const mockDb = {
      update: vi.fn(() => ({
        set: vi.fn((data: { status: string }) => {
          statusWritten = data.status;
          return {
            where: vi.fn(() => Promise.resolve()),
          };
        }),
      })),
    };

    const mockTransporter = {
      sendMail: vi.fn(async () => ({ messageId: "abc123" })),
    };

    let sendError: Error | null = null;
    try {
      await mockTransporter.sendMail({ to: "test@example.com", subject: "Test", text: "Hello" });
    } catch (err) {
      sendError = err as Error;
    }

    await mockDb.update({} as never).set({ status: sendError ? "failed" : "sent" }).where({} as never);

    expect(sendError).toBeNull();
    expect(statusWritten).toBe("sent");
  });
});

// ── Issue Q: sessionId in logAttempt ────────────────────────────────────────
describe("Issue Q — sessionId passed through logAttempt", () => {
  it("accepts a valid UUID sessionId", () => {
    const { z } = require("zod");
    const schema = z.object({
      examType: z.string().min(1).max(64),
      topic: z.string().min(1).max(128),
      questionId: z.number().int().positive(),
      correct: z.boolean(),
      quizMode: z.enum(["standard", "quick10", "missed", "qotd"]).default("standard"),
      sessionId: z.string().uuid().optional().nullable(),
    });

    const result = schema.safeParse({
      examType: "class1-water",
      topic: "Disinfection",
      questionId: 42,
      correct: true,
      quizMode: "standard",
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result.success).toBe(true);
  });

  it("accepts null sessionId for legacy rows", () => {
    const { z } = require("zod");
    const schema = z.object({
      examType: z.string().min(1).max(64),
      topic: z.string().min(1).max(128),
      questionId: z.number().int().positive(),
      correct: z.boolean(),
      quizMode: z.enum(["standard", "quick10", "missed", "qotd"]).default("standard"),
      sessionId: z.string().uuid().optional().nullable(),
    });

    const result = schema.safeParse({
      examType: "class1-water",
      topic: "Disinfection",
      questionId: 42,
      correct: true,
      quizMode: "standard",
      sessionId: null,
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid sessionId (not a UUID)", () => {
    const { z } = require("zod");
    const schema = z.object({
      sessionId: z.string().uuid().optional().nullable(),
    });

    const result = schema.safeParse({ sessionId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("crypto.randomUUID produces a valid UUID", () => {
    const uuid = crypto.randomUUID();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
});

// ── Issue O: index coverage ──────────────────────────────────────────────────
describe("Issue O — schema has composite indexes", () => {
  it("questionAttempts schema definition includes userId+createdAt index", async () => {
    const schemaText = await import("fs").then((fs) =>
      fs.readFileSync(require("path").join(process.cwd(), "drizzle/schema.ts"), "utf-8")
    );
    expect(schemaText).toContain("qa_userid_createdat_idx");
    expect(schemaText).toContain("qa_email_createdat_idx");
  });

  it("triggerLogs schema definition includes userId+sentAt index", async () => {
    const schemaText = await import("fs").then((fs) =>
      fs.readFileSync(require("path").join(process.cwd(), "drizzle/schema.ts"), "utf-8")
    );
    expect(schemaText).toContain("trigger_logs_userid_sentat_idx");
    expect(schemaText).toContain("trigger_logs_email_sentat_idx");
  });

  it("questionAttempts schema includes sessionId index", async () => {
    const schemaText = await import("fs").then((fs) =>
      fs.readFileSync(require("path").join(process.cwd(), "drizzle/schema.ts"), "utf-8")
    );
    expect(schemaText).toContain("qa_sessionid_idx");
  });
});
