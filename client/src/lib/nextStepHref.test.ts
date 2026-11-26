import { describe, expect, it } from "vitest";
import { chooseQuick10Course, isQuick10Eligible, legacyQuick10Redirect, nextStepHref, quick10Href } from "./nextStepHref";

const water = { courseKey: "class1-water", quizPath: "/class1-water", mockExamPath: "/class1-water-mock" };

describe("nextStepHref", () => {
  it("sends each suggestion straight to its activity", () => {
    expect(nextStepHref({ type: "quick-10" }, water)).toBe("/quick-10?course=class1-water");
    expect(nextStepHref({ type: "question-of-the-day" }, water)).toBe("/quick-10?course=class1-water&questions=1");
    expect(nextStepHref({ type: "missed-questions" }, water)).toBe("/class1-water?mode=missed");
    expect(nextStepHref({ type: "mock-exam" }, water)).toBe("/class1-water-mock");
  });

  it("opens practice on the weakest topic, with the topic name safely encoded", () => {
    expect(nextStepHref({ type: "topic-practice", module: "Storage" }, water)).toBe("/class1-water?module=Storage");
    expect(nextStepHref({ type: "topic-practice", module: "Pumps & Motors / Drives" }, water)).toBe("/class1-water?module=Pumps%20%26%20Motors%20%2F%20Drives");
  });

  it("keeps the US study context for a US learner and leaves Ontario links alone", () => {
    const us = { courseKey: "us-class1-water", quizPath: "/us-class1-water", mockExamPath: "/us-class1-water-mock" };
    const withContext = nextStepHref({ type: "quick-10" }, us, "?country=US");
    expect(withContext).toContain("country=US");
    expect(withContext).toContain("course=us-class1-water");
    expect(nextStepHref({ type: "quick-10" }, water, "?country=US")).toBe("/quick-10?course=class1-water");
  });
});

describe("quick10Href", () => {
  it("carries the course and, optionally, a one-question limit", () => {
    expect(quick10Href("oit")).toBe("/quick-10?course=oit");
    expect(quick10Href("oit", "", 1)).toBe("/quick-10?course=oit&questions=1");
  });
});

describe("legacyQuick10Redirect", () => {
  it("sends an old ?mode=quick10 link to the Quick 10 screen for that course", () => {
    expect(legacyQuick10Redirect("quick10", "class1-water")).toBe("/quick-10?course=class1-water");
  });
  it("leaves other modes, unknown courses and 309A alone", () => {
    expect(legacyQuick10Redirect("missed", "class1-water")).toBeNull();
    expect(legacyQuick10Redirect(null, "class1-water")).toBeNull();
    expect(legacyQuick10Redirect("quick10", "no-such-course")).toBeNull();
    expect(legacyQuick10Redirect("quick10", "electrician-309a")).toBeNull();
    expect(legacyQuick10Redirect("quick10", undefined)).toBeNull();
  });
});

describe("Quick 10 CTA eligibility", () => {
  it("does not let selected 309A override an eligible fallback", () => {
    expect(chooseQuick10Course(["electrician-309a", "class1-water"], ["class1-water"])).toBe("class1-water");
    expect(chooseQuick10Course(["electrician-309a"], ["class1-water"])).toBe("class1-water");
    expect(chooseQuick10Course(["electrician-309a"], [])).toBeNull();
    expect(isQuick10Eligible("electrician-309a")).toBe(false);
    expect(isQuick10Eligible("no-such-course")).toBe(false);
  });
});
