import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the invokeLLM helper so tests don't make real API calls
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content:
            "Great question! Chlorine residual is the amount of free chlorine remaining in the water after the contact time has elapsed.",
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

describe("tutor.chat", () => {
  it("returns a reply from the LLM for a valid message array", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tutor.chat({
      messages: [
        { role: "system", content: "You are an expert water treatment tutor." },
        { role: "user", content: "What is chlorine residual?" },
      ],
    });

    expect(result).toHaveProperty("reply");
    expect(typeof result.reply).toBe("string");
    expect(result.reply.length).toBeGreaterThan(0);
  });

  it("accepts a conversation with multiple turns", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tutor.chat({
      messages: [
        { role: "system", content: "You are an expert water treatment tutor." },
        { role: "user", content: "What is CT value?" },
        { role: "assistant", content: "CT is the product of concentration and time." },
        { role: "user", content: "Can you give me an example calculation?" },
      ],
    });

    expect(result).toHaveProperty("reply");
    expect(typeof result.reply).toBe("string");
  });

  it("returns a fallback message when LLM throws an error", async () => {
    const { invokeLLM } = await import("./_core/llm");
    vi.mocked(invokeLLM).mockRejectedValueOnce(new Error("API timeout"));

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tutor.chat({
      messages: [
        { role: "user", content: "What is turbidity?" },
      ],
    });

    expect(result).toHaveProperty("reply");
    expect(result.reply).toContain("Connection issue");
  });
});
