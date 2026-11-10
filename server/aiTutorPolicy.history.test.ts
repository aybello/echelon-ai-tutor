import { describe, expect, it } from "vitest";
import {
  AI_TUTOR_MAX_ASSISTANT_MESSAGE_CHARS,
  AI_TUTOR_MAX_CONVERSATION_CHARS,
  AI_TUTOR_MAX_HISTORY_MESSAGES,
  AI_TUTOR_MAX_OUTPUT_TOKENS,
  AI_TUTOR_MAX_USER_MESSAGE_CHARS,
  boundTutorHistory,
} from "./_core/aiTutorPolicy";

describe("tutor history bounds", () => {
  it("lets a completed assistant answer round-trip even though learner messages stay short", () => {
    // ~4 characters per token is the conservative planning figure; a full
    // 4,096-token worked solution must fit inside the assistant cap.
    expect(AI_TUTOR_MAX_ASSISTANT_MESSAGE_CHARS).toBeGreaterThanOrEqual(AI_TUTOR_MAX_OUTPUT_TOKENS * 3.5);
    expect(AI_TUTOR_MAX_USER_MESSAGE_CHARS).toBe(2_000);
    expect(AI_TUTOR_MAX_ASSISTANT_MESSAGE_CHARS).toBeGreaterThan(AI_TUTOR_MAX_USER_MESSAGE_CHARS);
  });

  it("always keeps the latest message and trims the oldest turns first", () => {
    const longAnswer = "x".repeat(AI_TUTOR_MAX_CONVERSATION_CHARS - 20);
    const history = [
      { role: "user" as const, content: "first question, long enough to overflow" },
      { role: "assistant" as const, content: longAnswer },
      { role: "user" as const, content: "clarify step 3" },
    ];
    const bounded = boundTutorHistory(history);
    expect(bounded.at(-1)).toEqual(history[2]);
    expect(bounded).toEqual([history[1], history[2]]);
  });

  it("caps the number of turns at the policy limit", () => {
    const history = Array.from({ length: 30 }, (_, i) => ({
      role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
      content: `turn ${i}`,
    }));
    const bounded = boundTutorHistory(history);
    expect(bounded).toHaveLength(AI_TUTOR_MAX_HISTORY_MESSAGES);
    expect(bounded.at(-1)?.content).toBe("turn 29");
  });

  it("keeps a single oversized latest message rather than returning nothing", () => {
    const only = [{ role: "user" as const, content: "y".repeat(AI_TUTOR_MAX_CONVERSATION_CHARS + 10) }];
    expect(boundTutorHistory(only)).toEqual(only);
  });
});
