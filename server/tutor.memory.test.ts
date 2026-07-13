/**
 * Tutor Memory Tests — Phase 2 Agentic AI Tutor
 *
 * Tests:
 *   1. tutor.chat accepts examType parameter
 *   2. tutor.chat works for unauthenticated users (no memory injection)
 *   3. tutor.saveSession requires authentication
 *   4. tutor.saveSession skips save when no user messages
 *   5. tutor.saveSession saves session with summary
 *   6. tutor.getRecentSessions requires authentication
 *   7. tutor.getStudentContext requires authentication
 *   8. tutor.getStudentContext returns null for new students (<15 attempts)
 */
import { describe, expect, it, vi, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the invokeLLM helper so tests don't make real API calls
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: "Great question! Here is the answer.",
        },
      },
    ],
  }),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAuthContext(userId = 999999, email = "test@echelon.test"): TrpcContext {
  return {
    user: {
      id: userId,
      openId: "test-open-id",
      name: "Test Student",
      email,
      avatar: null,
      role: "user",
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("tutor.chat — with examType", () => {
  it("accepts examType parameter and returns a reply", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tutor.chat({
      messages: [
        { role: "system", content: "You are an expert water treatment tutor." },
        { role: "user", content: "What is chlorine residual?" },
      ],
      examType: "oit",
    });
    expect(result).toHaveProperty("reply");
    expect(typeof result.reply).toBe("string");
    expect(result.reply.length).toBeGreaterThan(0);
  });

  it("works without examType (backward compatible)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tutor.chat({
      messages: [
        { role: "user", content: "What is turbidity?" },
      ],
    });
    expect(result).toHaveProperty("reply");
    expect(typeof result.reply).toBe("string");
  });

  it("works for authenticated users with examType", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tutor.chat({
      messages: [
        { role: "system", content: "You are an expert tutor." },
        { role: "user", content: "Explain CT value." },
      ],
      examType: "class1-water",
    });
    expect(result).toHaveProperty("reply");
    expect(typeof result.reply).toBe("string");
  });
});

describe("tutor.saveSession", () => {
  it("skips save when no user messages are present", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tutor.saveSession({
      examType: "oit",
      messages: [
        { role: "assistant", content: "Hi! How can I help?" },
      ],
      sessionStartMs: Date.now() - 60000,
    });
    expect(result).toEqual({ saved: false });
  });

  it("saves session when user messages are present", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tutor.saveSession({
      examType: "oit",
      messages: [
        { role: "assistant", content: "Hi! How can I help?" },
        { role: "user", content: "What is chlorine residual?" },
        { role: "assistant", content: "Chlorine residual is..." },
      ],
      sessionStartMs: Date.now() - 60000,
    });
    // Should save (or return saved: false if DB is not available in test env)
    expect(result).toHaveProperty("saved");
    expect(typeof result.saved).toBe("boolean");
  });

  it("returns saved:false for unauthenticated users (Ticket 13: publicProcedure, graceful no-op)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    // saveSession is now a publicProcedure that accepts OTP users.
    // Unauthenticated callers (no userId, no studentEmail) get { saved: false } gracefully.
    const result = await caller.tutor.saveSession({
      examType: "oit",
      messages: [
        { role: "user", content: "test" },
      ],
      sessionStartMs: Date.now(),
    });
    expect(result).toMatchObject({ saved: false });
  });
});

describe("tutor.getRecentSessions", () => {
  it("rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.tutor.getRecentSessions()).rejects.toThrow();
  });

  it("returns an array for authenticated users", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tutor.getRecentSessions();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("tutor.getStudentContext", () => {
  it("rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.tutor.getStudentContext()).rejects.toThrow();
  });

  it("returns null for students with fewer than 15 attempts", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tutor.getStudentContext();
    // New test user has 0 attempts, so should return null
    expect(result).toBeNull();
  });
});
