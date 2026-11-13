import { describe, expect, it } from "vitest";
import { buildAuthoritativeOfferFeatures } from "./courseOfferFeatures";

describe("authoritative course offer features", () => {
  it("replaces a stale page-level question claim with live bank metadata", () => {
    expect(buildAuthoritativeOfferFeatures({
      courseLabel: "Class 1 Wastewater Treatment",
      totalQuestions: 815,
      suppliedFeatures: [
        "400+ Class 1 Wastewater questions — unlimited attempts",
        "Timed mock exam (100 questions, 2 hrs)",
        "AI Tutor explanations on every question",
      ],
    })).toEqual([
      "815 Class 1 Wastewater Treatment questions — unlimited attempts",
      "Timed mock exam (100 questions, 2 hrs)",
      "AI Tutor explanations on every question",
    ]);
  });

  it("does not invent a count while bank metadata is unavailable", () => {
    expect(buildAuthoritativeOfferFeatures({
      courseLabel: "Class 1 Wastewater Treatment",
      totalQuestions: 0,
    })[0]).toBe("Full Class 1 Wastewater Treatment question bank — unlimited attempts");
  });

  it("retains default offer details when they no longer include a static count", () => {
    expect(buildAuthoritativeOfferFeatures({
      courseLabel: "Class 1 Wastewater Treatment",
      totalQuestions: 815,
      suppliedFeatures: [
        "Timed mock exam (100 questions, 2 hrs)",
        "WW1 formula sheet",
        "AI Tutor explanations on every question",
      ],
    })).toEqual([
      "815 Class 1 Wastewater Treatment questions — unlimited attempts",
      "Timed mock exam (100 questions, 2 hrs)",
      "WW1 formula sheet",
      "AI Tutor explanations on every question",
    ]);
  });

  it("replaces legacy hyphenated question-count copy", () => {
    expect(buildAuthoritativeOfferFeatures({
      courseLabel: "WQA",
      totalQuestions: 512,
      suppliedFeatures: [
        "475-question WQA bank — unlimited attempts",
        "Timed WQA mock exam",
      ],
    })).toEqual([
      "512 WQA questions — unlimited attempts",
      "Timed WQA mock exam",
    ]);
  });
});
