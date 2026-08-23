import { describe, expect, it } from "vitest";
import {
  OIT_PREVIEW_CALC_MINIMUMS,
  OIT_PREVIEW_LIMITS,
  buildPreviewSample,
  previewRowsForBank,
  previewLimitForRequest,
} from "./routers/quizRouter";

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

  it("guarantees representative calculations in OIT practice and mock previews", () => {
    const rows = Array.from({ length: 60 }, (_, index) => ({
      id: index + 1,
      module: `Module ${(index % 11) + 1}`,
      isCalc: index >= 50 ? "yes" : "no",
    }));

    const practice = buildPreviewSample(
      rows,
      OIT_PREVIEW_LIMITS.practice,
      "practice",
      OIT_PREVIEW_CALC_MINIMUMS.practice,
    );
    const mock = buildPreviewSample(
      rows,
      OIT_PREVIEW_LIMITS.mock,
      "mock",
      OIT_PREVIEW_CALC_MINIMUMS.mock,
    );

    expect(practice).toHaveLength(15);
    expect(practice.filter(row => row.isCalc === "yes")).toHaveLength(2);
    expect(new Set(practice.map(row => row.module)).size).toBeGreaterThanOrEqual(10);
    expect(mock).toHaveLength(30);
    expect(mock.filter(row => row.isCalc === "yes")).toHaveLength(4);
    expect(new Set(mock.map(row => row.module)).size).toBe(11);
  });

  it("keeps all free flashcards conceptual and does not invent missing calculations", () => {
    const rows = Array.from({ length: 60 }, (_, index) => ({
      id: index + 1,
      module: `Module ${(index % 6) + 1}`,
      isCalc: index % 5 === 0 ? "yes" : "no",
    }));
    const flashcards = buildPreviewSample(rows, 50, "flashcards", 0);
    const scarceCalculations = buildPreviewSample(
      rows.filter((_, index) => index < 10),
      10,
      "practice",
      5,
    );

    expect(flashcards.every(row => row.isCalc !== "yes")).toBe(true);
    expect(flashcards).toHaveLength(48);
    expect(scarceCalculations.filter(row => row.isCalc === "yes")).toHaveLength(2);
  });

  it("keeps wastewater modules out of the explicitly labelled Water OIT preview", () => {
    const rows = [
      { module: "Water Treatment", isCalc: "no" },
      { module: "Hydraulics", isCalc: "yes" },
      { module: "Wastewater Treatment", isCalc: "no" },
      { module: "Wastewater Collection Systems", isCalc: "no" },
    ];

    expect(previewRowsForBank(rows, "oit").map(row => row.module)).toEqual([
      "Water Treatment",
      "Hydraulics",
    ]);
    expect(previewRowsForBank(rows, "oit-ww")).toEqual(rows);
  });
});
