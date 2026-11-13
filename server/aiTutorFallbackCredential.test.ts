import { describe, expect, it } from "vitest";

/**
 * Live credential check for the AI Tutor fallback provider.
 *
 * This runs a single minimal request against the real provider so a wrong or
 * expired key is caught here rather than by a paying learner. It is skipped
 * automatically when no key is configured, so CI and local runs without the
 * secret stay green.
 */
const hasKey =
  typeof process.env.ANTHROPIC_API_KEY === "string" &&
  process.env.ANTHROPIC_API_KEY.trim().length > 0 &&
  process.env.ANTHROPIC_API_KEY !== "dummy";

describe.runIf(hasKey)("AI Tutor fallback credential", () => {
  it("authenticates against the live fallback provider", async () => {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 16,
        messages: [{ role: "user", content: "Reply with the word ready." }],
      }),
    });

    expect(response.status, "fallback provider rejected the configured credential").toBe(200);

    const payload = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = (payload.content ?? [])
      .filter(block => block.type === "text")
      .map(block => block.text ?? "")
      .join("")
      .trim();

    expect(text.length).toBeGreaterThan(0);
  }, 60_000);
});
