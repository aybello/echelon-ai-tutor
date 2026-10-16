import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import {
  AI_TUTOR_MAX_OUTPUT_TOKENS,
  isTruncatedTutorCompletion,
} from "./_core/aiTutorPolicy";

const mocks = vi.hoisted(() => ({
  invokeLLM: vi.fn(),
  getDb: vi.fn(),
  resolveAccessForRequest: vi.fn(),
  enforceAiTutorDailyQuota: vi.fn(),
  trackEvent: vi.fn(),
}));
vi.mock("./_core/llm", () => ({ invokeLLM: mocks.invokeLLM }));
vi.mock("./db", () => ({ getDb: mocks.getDb }));
vi.mock("./analytics", () => ({
  hashAnalyticsEmail: (email: string) => `hash:${email}`,
  hashAnalyticsAnonymousId: (id: string) => `anonymous-hash:${id}`,
  trackEvent: mocks.trackEvent,
}));
vi.mock("./_core/accessService", async () => {
  const actual = await vi.importActual<typeof import("./_core/accessService")>("./_core/accessService");
  return { ...actual, resolveAccessForRequest: mocks.resolveAccessForRequest };
});
vi.mock("./_core/aiTutorPolicy", async () => {
  const actual = await vi.importActual<typeof import("./_core/aiTutorPolicy")>("./_core/aiTutorPolicy");
  return { ...actual, enforceAiTutorDailyQuota: mocks.enforceAiTutorDailyQuota };
});
import { appRouter } from "./routers";

/**
 * The AI Tutor used to send maxTokens 1536. Measured on 2026-10-16 against real
 * questions from the live bank, a complete multi-step dosing solution runs
 * roughly 800 to 1,250 output tokens, and a hard one exceeded 1,536 on every
 * model tested. The provider returned finish_reason "length" with an answer
 * that stopped mid-sentence, and nothing read finish_reason, so half a worked
 * example reached the learner looking complete.
 *
 * These tests exercise the real procedure through a mocked provider rather
 * than reading source text, so they fail if the behaviour regresses no matter
 * how the code is written.
 */

const canonicalQuestion = {
  id: 9_002,
  questionNum: 42,
  module: "Math & Calculations",
  topic: "Chlorine dosing",
  question: "What chlorine dose is required?",
  options: JSON.stringify(["12 mg/L", "8 mg/L", "4 mg/L", "2 mg/L"]),
  correctIndex: 0,
  explanation: "Dose equals demand plus residual.",
  steps: null,
  tip: "Separate demand from residual.",
  isCalc: "yes",
};

function queryChain(rows: unknown[]) {
  return {
    from: vi.fn(() => ({
      where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(rows) })),
    })),
  };
}

function createPaidContext(): TrpcContext {
  return {
    user: {
      id: 7,
      openId: "test-open-id",
      name: "Test Operator",
      email: "operator@example.com",
      loginMethod: "test",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      phone: null,
      province: "on",
    },
    studentEmail: null,
    req: { protocol: "https", headers: {}, ip: "192.0.2.10", get: vi.fn(() => "test-agent") } as unknown as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

/** A provider reply that was cut off because the output budget ran out. */
const truncated = {
  choices: [{
    message: { content: "1. Identify the formula\n   Dose = demand + residual\n2. Walk through Steps 2-5 and t" },
    finish_reason: "length",
  }],
};

/** A provider reply that finished on its own. */
const complete = {
  choices: [{
    message: { content: "Dose = demand + residual = 10 + 2 = 12 mg/L. Check: 12 - 10 = 2 mg/L residual." },
    finish_reason: "stop",
  }],
};

function arrangeDatabase() {
  const select = vi.fn()
    .mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([canonicalQuestion]) })),
      })),
    })
    .mockReturnValueOnce(queryChain([]));
  mocks.getDb.mockResolvedValue({ select });
}

const ask = () => appRouter.createCaller(createPaidContext()).tutor.chat({
  examType: "class1-water",
  questionNum: 42,
  messages: [{ role: "user", content: "Work through the chlorine dose." }],
  patternMode: false,
  recentPerformance: [],
});

describe("AI Tutor truncated explanations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveAccessForRequest.mockResolvedValue(true);
    mocks.enforceAiTutorDailyQuota.mockResolvedValue(undefined);
    arrangeDatabase();
  });

  it("requests a budget large enough for a full worked calculation", async () => {
    mocks.invokeLLM.mockResolvedValue(complete);
    await ask();
    const sent = mocks.invokeLLM.mock.calls[0][0].maxTokens;
    expect(sent).toBe(AI_TUTOR_MAX_OUTPUT_TOKENS);
    // 1536 was measured to truncate real questions from the live bank.
    expect(sent).toBeGreaterThan(1536);
  });

  it("never hands the learner an explanation that was cut off mid-step", async () => {
    // Both the first attempt and the recovery attempt overflow.
    mocks.invokeLLM.mockResolvedValue(truncated);
    await expect(ask()).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    // The half-finished text must never be returned as a usable answer.
    expect(mocks.trackEvent).not.toHaveBeenCalled();
  });

  it("recovers by asking for the same solution more compactly before giving up", async () => {
    mocks.invokeLLM
      .mockResolvedValueOnce(truncated)
      .mockResolvedValueOnce(complete);
    const result = await ask();
    expect(result.reply).toContain("12 mg/L");
    expect(mocks.invokeLLM).toHaveBeenCalledTimes(2);
    // The retry must change the request, otherwise it just hits the same wall.
    const retryPrompt = mocks.invokeLLM.mock.calls[1][0].messages[0].content;
    expect(retryPrompt).toContain("LENGTH CONSTRAINT FOR THIS REPLY");
    // Compactness must not be bought by dropping calculation steps.
    expect(retryPrompt).toContain("Do not skip a calculation step");
  });

  it("retries exactly once so a learner is not left waiting on a loop", async () => {
    mocks.invokeLLM.mockResolvedValue(truncated);
    await expect(ask()).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(mocks.invokeLLM).toHaveBeenCalledTimes(2);
  });

  it("returns a complete explanation untouched", async () => {
    mocks.invokeLLM.mockResolvedValue(complete);
    const result = await ask();
    expect(result.reply).toContain("12 mg/L");
    expect(mocks.invokeLLM).toHaveBeenCalledTimes(1);
    expect(mocks.trackEvent).toHaveBeenCalled();
  });

  it("does not charge the learner for an explanation they never received", async () => {
    mocks.invokeLLM.mockResolvedValue(truncated);
    await expect(ask()).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    // Daily quota and the free preview limit both count ai_tutor_message
    // events, so not recording one is what keeps the failed attempt free.
    expect(mocks.trackEvent).not.toHaveBeenCalled();
  });
});

describe("isTruncatedTutorCompletion", () => {
  it("detects the provider labels that mean the output budget ran out", () => {
    expect(isTruncatedTutorCompletion("length")).toBe(true);
    expect(isTruncatedTutorCompletion("max_tokens")).toBe(true);
    expect(isTruncatedTutorCompletion("max_token")).toBe(true);
    expect(isTruncatedTutorCompletion("MAX_TOKENS")).toBe(true);
    expect(isTruncatedTutorCompletion(" length ")).toBe(true);
  });

  it("treats a completed answer as complete", () => {
    expect(isTruncatedTutorCompletion("stop")).toBe(false);
    expect(isTruncatedTutorCompletion("end_turn")).toBe(false);
    expect(isTruncatedTutorCompletion("tool_calls")).toBe(false);
  });

  it("never discards a good answer because of an unknown label", () => {
    // Failing open on an unrecognized label would reject valid explanations
    // and break the tutor for every learner.
    expect(isTruncatedTutorCompletion(null)).toBe(false);
    expect(isTruncatedTutorCompletion(undefined)).toBe(false);
    expect(isTruncatedTutorCompletion("some_future_reason")).toBe(false);
  });
});

describe("AI Tutor output budget constant", () => {
  it("stays within the upstream clamp so the constant describes real behaviour", () => {
    // boundedOutputTokens caps requests at 8192; a larger value would be
    // silently clamped.
    expect(AI_TUTOR_MAX_OUTPUT_TOKENS).toBeLessThanOrEqual(8192);
    // Measured ceiling for a complete worked solution was ~1,250 tokens.
    // Require real headroom above that, not one token above the old cap.
    expect(AI_TUTOR_MAX_OUTPUT_TOKENS).toBeGreaterThanOrEqual(2500);
  });
});
