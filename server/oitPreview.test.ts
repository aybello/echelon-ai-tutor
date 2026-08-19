import { describe, expect, it } from "vitest";
import { OIT_PREVIEW_LIMITS, previewLimitForRequest } from "./routers/quizRouter";

describe("server-owned OIT preview pools", () => {
  it("keeps the promised free limits separate by learning surface", () => {
    expect(OIT_PREVIEW_LIMITS).toEqual({ practice: 15, flashcards: 50, mock: 30 });
    expect(previewLimitForRequest({ bankKey: "oit", previewSurface: "practice" })).toBe(15);
    expect(previewLimitForRequest({ bankKey: "oit", previewSurface: "flashcards" })).toBe(50);
    expect(previewLimitForRequest({ bankKey: "oit", previewSurface: "mock" })).toBe(30);
    expect(previewLimitForRequest({ bankKey: "oit-ww", previewSurface: "flashcards" })).toBe(50);
  });

  it("does not widen previews for paid course banks", () => {
    expect(previewLimitForRequest({ bankKey: "class1-water", previewSurface: "flashcards" })).toBe(15);
  });
});
