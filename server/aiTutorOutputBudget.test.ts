import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AI_TUTOR_MAX_OUTPUT_TOKENS, isTruncatedTutorCompletion } from "./_core/aiTutorPolicy";

const repoRoot = join(__dirname, "..");
const routers = readFileSync(join(repoRoot, "server/routers.ts"), "utf8");

/**
 * The AI Tutor used to send maxTokens 1536. Measured on 2026-10-16 against real
 * questions from the live bank, a multi-step dosing solution needs roughly 800
 * to 1,250 output tokens, and a hard one exceeded 1,536 on every model tested.
 * The provider returned a length-capped answer that stopped mid-sentence, and
 * nothing read finish_reason, so a half-finished worked example was handed to
 * the learner as if it were the complete method.
 */
describe("AI Tutor output budget", () => {
  it("gives a worked calculation room to finish", () => {
    // 1536 was measured to truncate real questions. Anything at or below that
    // reintroduces the defect.
    expect(AI_TUTOR_MAX_OUTPUT_TOKENS).toBeGreaterThan(1536);
    // boundedOutputTokens caps requests at 8192, so a larger value would be
    // silently clamped and the constant would stop describing real behaviour.
    expect(AI_TUTOR_MAX_OUTPUT_TOKENS).toBeLessThanOrEqual(8192);
  });

  it("does not hardcode a raw token budget at the tutor call site", () => {
    const tutorCall = routers.slice(
      routers.indexOf("const systemPrompt = buildTutorSystemPrompt(")
    );
    expect(tutorCall).toContain("maxTokens: AI_TUTOR_MAX_OUTPUT_TOKENS");
    expect(tutorCall).not.toContain("maxTokens: 1536");
  });

  it("rejects a reply that was cut off instead of returning half a solution", () => {
    const tutorCall = routers.slice(
      routers.indexOf("const systemPrompt = buildTutorSystemPrompt(")
    );
    const guardIndex = tutorCall.indexOf("isTruncatedTutorCompletion");
    const returnIndex = tutorCall.indexOf("return { reply }");
    expect(guardIndex).toBeGreaterThan(-1);
    // The guard has to run before the reply is handed back, otherwise a
    // truncated explanation still reaches the learner.
    expect(guardIndex).toBeLessThan(returnIndex);
  });
});

describe("isTruncatedTutorCompletion", () => {
  it("detects the provider labels that mean the output budget ran out", () => {
    expect(isTruncatedTutorCompletion("length")).toBe(true);
    expect(isTruncatedTutorCompletion("max_tokens")).toBe(true);
    expect(isTruncatedTutorCompletion("MAX_TOKENS")).toBe(true);
    expect(isTruncatedTutorCompletion(" length ")).toBe(true);
  });

  it("treats a completed answer as complete", () => {
    expect(isTruncatedTutorCompletion("stop")).toBe(false);
    expect(isTruncatedTutorCompletion("end_turn")).toBe(false);
    expect(isTruncatedTutorCompletion("tool_calls")).toBe(false);
  });

  it("never discards a good answer because of an unknown label", () => {
    // A new provider label must not be guessed at. Failing open here would
    // reject valid explanations and break the tutor for every learner.
    expect(isTruncatedTutorCompletion(null)).toBe(false);
    expect(isTruncatedTutorCompletion(undefined)).toBe(false);
    expect(isTruncatedTutorCompletion("some_future_reason")).toBe(false);
  });
});
