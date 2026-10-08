import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The AI Tutor outage was discovered through a customer review rather than an
 * alert. These tests lock in the probe behaviour that turns a silent tutor
 * failure into an owner alert.
 */

const ORIGINAL_ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const ORIGINAL_FORGE_KEY = process.env.BUILT_IN_FORGE_API_KEY;
const ORIGINAL_FORGE_URL = process.env.BUILT_IN_FORGE_API_URL;

const jsonResponse = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const forgeOk = (model: string) =>
  jsonResponse({
    id: "forge_probe",
    created: 1,
    model,
    choices: [{ index: 0, message: { role: "assistant", content: "ready" }, finish_reason: "stop" }],
  }, 200);

const anthropicOk = () =>
  jsonResponse({
    id: "msg_probe",
    model: "claude-opus-4-5-20251101",
    content: [{ type: "text", text: "ready" }],
    stop_reason: "end_turn",
  }, 200);

const forgeExhausted = () =>
  jsonResponse({ code: 9, message: "your account has hit a usage exhausted" }, 412);

function urlOf(input: unknown): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return String(input);
}

describe("AI Tutor health probe", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.BUILT_IN_FORGE_API_KEY = "forge-test-key";
    process.env.BUILT_IN_FORGE_API_URL = "https://forge.example.test";
    process.env.ANTHROPIC_API_KEY = "anthropic-test-key";
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    if (ORIGINAL_ANTHROPIC_KEY === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = ORIGINAL_ANTHROPIC_KEY;
    if (ORIGINAL_FORGE_KEY === undefined) delete process.env.BUILT_IN_FORGE_API_KEY;
    else process.env.BUILT_IN_FORGE_API_KEY = ORIGINAL_FORGE_KEY;
    if (ORIGINAL_FORGE_URL === undefined) delete process.env.BUILT_IN_FORGE_API_URL;
    else process.env.BUILT_IN_FORGE_API_URL = ORIGINAL_FORGE_URL;
  });

  it("reports healthy when the primary provider answers", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => forgeOk("claude-opus-4-7")));
    const { checkTutorHealth } = await import("./tutorHealth");
    const result = await checkTutorHealth();

    expect(result.ok).toBe(true);
    expect(result.usedFallback).toBe(false);
    expect(result.error).toBeNull();
  });

  it("flags that the backup provider is carrying the tutor", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: unknown) =>
      urlOf(input).includes("forge") ? forgeExhausted() : anthropicOk()
    ));
    const { checkTutorHealth } = await import("./tutorHealth");
    const result = await checkTutorHealth();

    // Learners are still served, but this must not be reported as fully healthy.
    expect(result.ok).toBe(true);
    expect(result.usedFallback).toBe(true);
  });

  it("reports an outage when every provider fails", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    vi.stubGlobal("fetch", vi.fn(async () => forgeExhausted()));
    const { checkTutorHealth } = await import("./tutorHealth");
    const result = await checkTutorHealth();

    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("treats an empty answer as a failure rather than a healthy tutor", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      jsonResponse({
        id: "forge_probe",
        created: 1,
        model: "claude-opus-4-7",
        choices: [{ index: 0, message: { role: "assistant", content: "   " }, finish_reason: "stop" }],
      }, 200)
    ));
    const { checkTutorHealth } = await import("./tutorHealth");
    const result = await checkTutorHealth();

    expect(result.ok).toBe(false);
  });
});
