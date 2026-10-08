import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The AI Tutor went down in production because it depended on a single
 * upstream provider. When that provider answered "usage exhausted", every
 * tutor reply failed for paying learners and the only public symptom was a
 * generic 503. These tests lock in the fallback behaviour so a single
 * provider outage can never take the learner-facing tutor offline again.
 */

const ORIGINAL_ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const ORIGINAL_FORGE_KEY = process.env.BUILT_IN_FORGE_API_KEY;
const ORIGINAL_FORGE_URL = process.env.BUILT_IN_FORGE_API_URL;

/**
 * serviceFetch streams the response body, so these mocks must be real
 * Response objects rather than plain literals.
 */
const jsonResponse = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const forgeExhausted = (): Response =>
  jsonResponse({ code: 9, message: "your account has hit a usage exhausted" }, 412);

function anthropicOk(text: string): Response {
  return jsonResponse({
    id: "msg_test",
    model: "claude-opus-4-5-20251101",
    content: [{ type: "text", text }],
    stop_reason: "end_turn",
    usage: { input_tokens: 11, output_tokens: 22 },
  }, 200);
}

function forgeOk(text: string): Response {
  return jsonResponse({
    id: "forge_test",
    created: 1,
    model: "claude-opus-4-7",
    choices: [{ index: 0, message: { role: "assistant", content: text }, finish_reason: "stop" }],
  }, 200);
}

function urlOf(input: unknown): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return String(input);
}

describe("AI Tutor provider resilience", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.BUILT_IN_FORGE_API_KEY = "forge-test-key";
    process.env.BUILT_IN_FORGE_API_URL = "https://forge.example.test";
    process.env.ANTHROPIC_API_KEY = "anthropic-test-key";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (ORIGINAL_ANTHROPIC_KEY === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = ORIGINAL_ANTHROPIC_KEY;
    if (ORIGINAL_FORGE_KEY === undefined) delete process.env.BUILT_IN_FORGE_API_KEY;
    else process.env.BUILT_IN_FORGE_API_KEY = ORIGINAL_FORGE_KEY;
    if (ORIGINAL_FORGE_URL === undefined) delete process.env.BUILT_IN_FORGE_API_URL;
    else process.env.BUILT_IN_FORGE_API_URL = ORIGINAL_FORGE_URL;
  });

  it("keeps serving learners when the primary provider reports usage exhausted", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: unknown) => {
      const url = urlOf(input);
      calls.push(url);
      if (url.includes("forge")) return forgeExhausted();
      return anthropicOk("CT equals residual times effective contact time.");
    }));

    const { invokeLLM } = await import("./_core/llm");
    const result = await invokeLLM({
      messages: [
        { role: "system", content: "You are a water operator tutor." },
        { role: "user", content: "What is CT?" },
      ],
      maxTokens: 300,
    });

    expect(calls.some(url => url.includes("forge"))).toBe(true);
    expect(calls.some(url => url.includes("api.anthropic.com"))).toBe(true);
    expect(result.choices[0].message.content).toContain("effective contact time");
    expect(result.choices[0].finish_reason).toBe("end_turn");
  });

  it("returns the primary provider result without calling the fallback when healthy", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: unknown) => {
      const url = urlOf(input);
      calls.push(url);
      if (url.includes("forge")) return forgeOk("Primary answer.");
      throw new Error("Fallback must not be called while the primary provider is healthy");
    }));

    const { invokeLLM } = await import("./_core/llm");
    const result = await invokeLLM({
      messages: [{ role: "user", content: "What is CT?" }],
      maxTokens: 120,
    });

    expect(result.choices[0].message.content).toBe("Primary answer.");
    expect(calls.some(url => url.includes("api.anthropic.com"))).toBe(false);
  });

  it("sends the system prompt as a separate field and keeps the learner turns in order", async () => {
    let captured: Record<string, unknown> = {};
    vi.stubGlobal("fetch", vi.fn(async (input: unknown, init?: RequestInit) => {
      const url = urlOf(input);
      if (url.includes("forge")) return forgeExhausted();
      captured = JSON.parse(String(init?.body ?? "{}"));
      return anthropicOk("ok");
    }));

    const { invokeLLM } = await import("./_core/llm");
    await invokeLLM({
      messages: [
        { role: "system", content: "Grounding rules." },
        { role: "user", content: "First question" },
        { role: "assistant", content: "First answer" },
        { role: "user", content: "Second question" },
      ],
      maxTokens: 200,
    });

    expect(captured.system).toBe("Grounding rules.");
    expect(captured.messages).toEqual([
      { role: "user", content: "First question" },
      { role: "assistant", content: "First answer" },
      { role: "user", content: "Second question" },
    ]);
    expect(captured.max_tokens).toBe(200);
  });

  it("does not silently reroute tool calls or structured JSON to the fallback", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: unknown) => {
      calls.push(urlOf(input));
      return forgeExhausted();
    }));

    const { invokeLLM } = await import("./_core/llm");

    await expect(invokeLLM({
      messages: [{ role: "user", content: "extract" }],
      responseFormat: {
        type: "json_schema",
        json_schema: { name: "x", schema: { type: "object" } },
      },
    })).rejects.toThrow();

    expect(calls.some(url => url.includes("api.anthropic.com"))).toBe(false);
  });

  it("fails loudly instead of hanging when no provider is configured", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.BUILT_IN_FORGE_API_KEY;
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("No network call should be attempted without a provider");
    }));

    const { invokeLLM } = await import("./_core/llm");
    await expect(invokeLLM({
      messages: [{ role: "user", content: "hello" }],
    })).rejects.toThrow(/BUILT_IN_FORGE_API_KEY/);
  });

  it("uses the fallback directly when the primary provider has no key at all", async () => {
    delete process.env.BUILT_IN_FORGE_API_KEY;
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: unknown) => {
      calls.push(urlOf(input));
      return anthropicOk("Fallback answer.");
    }));

    const { invokeLLM } = await import("./_core/llm");
    const result = await invokeLLM({
      messages: [{ role: "user", content: "What is CT?" }],
    });

    expect(result.choices[0].message.content).toBe("Fallback answer.");
    expect(calls.every(url => url.includes("api.anthropic.com"))).toBe(true);
  });

  it("does not treat a learner closing the panel as a provider outage", async () => {
    const controller = new AbortController();
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: unknown) => {
      calls.push(urlOf(input));
      controller.abort();
      throw new Error("aborted");
    }));

    const { invokeLLM } = await import("./_core/llm");
    await expect(invokeLLM({
      messages: [{ role: "user", content: "What is CT?" }],
      signal: controller.signal,
    })).rejects.toThrow();

    expect(calls.some(url => url.includes("api.anthropic.com"))).toBe(false);
  });
});
