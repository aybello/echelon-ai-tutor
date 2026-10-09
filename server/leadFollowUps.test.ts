import { describe, expect, it } from "vitest";
import { dueStage, resolveLeadCourse } from "./jobs/leadFollowUps";
import { buildLeadFollowUpCopy } from "./leadFollowUpEmail";

/**
 * The lead follow-up sequence sends exactly two emails after capture: a study
 * nudge at day 3 and a final offer at day 10. These tests pin the scheduling
 * boundaries, the permanent silence after stage 2, the opt-out guarantee and
 * the copy promises made in each stage.
 */

const DAY = 24 * 60 * 60 * 1000;

function leadAgedDays(days: number, overrides?: Partial<Parameters<typeof dueStage>[0]>) {
  const now = new Date("2026-10-08T12:00:00Z");
  return {
    followUpStage: 0,
    optOut: false,
    createdAt: new Date(now.getTime() - days * DAY),
    now,
    ...overrides,
  };
}

describe("lead follow-up scheduling", () => {
  it("sends nothing in the first three days after capture", () => {
    expect(dueStage(leadAgedDays(0))).toBeNull();
    expect(dueStage(leadAgedDays(1))).toBeNull();
    expect(dueStage(leadAgedDays(2.9))).toBeNull();
  });

  it("sends the stage 1 nudge once the lead is three days old", () => {
    expect(dueStage(leadAgedDays(3))).toBe(1);
    expect(dueStage(leadAgedDays(5))).toBe(1);
    expect(dueStage(leadAgedDays(9.9))).toBe(1);
  });

  it("holds stage 2 until day ten even if stage 1 already went out", () => {
    expect(dueStage(leadAgedDays(5, { followUpStage: 1 }))).toBeNull();
    expect(dueStage(leadAgedDays(10, { followUpStage: 1 }))).toBe(2);
  });

  it("goes permanently silent after stage 2", () => {
    expect(dueStage(leadAgedDays(15, { followUpStage: 2 }))).toBeNull();
    expect(dueStage(leadAgedDays(40, { followUpStage: 2 }))).toBeNull();
  });

  it("never emails an opted-out lead at any stage", () => {
    expect(dueStage(leadAgedDays(3, { optOut: true }))).toBeNull();
    expect(dueStage(leadAgedDays(10, { followUpStage: 1, optOut: true }))).toBeNull();
  });

  it("never starts the sequence for a cold lead older than 45 days", () => {
    expect(dueStage(leadAgedDays(46))).toBeNull();
    expect(dueStage(leadAgedDays(46, { followUpStage: 1 }))).toBeNull();
  });
});

describe("lead follow-up copy", () => {
  it("stage 1 nudges the learner back without a hard sell", () => {
    const copy = buildLeadFollowUpCopy({ stage: 1, courseLabel: "OIT Certification" });
    expect(copy.subject).toContain("OIT Certification");
    const body = copy.paragraphs.join(" ");
    expect(body).toContain("free preview");
    // Stage 1 is a study nudge; it must not quote a price.
    expect(body).not.toMatch(/CA\$/);
  });

  it("stage 2 makes one clear offer and promises it is the last email", () => {
    const copy = buildLeadFollowUpCopy({
      stage: 2,
      courseLabel: "Class 1 Water Treatment",
      priceLabel: "CA$149",
    });
    const body = copy.paragraphs.join(" ");
    expect(body).toContain("CA$149");
    expect(body).toContain("12 months");
    expect(body).toContain("will not email you about this again");
  });

  it("stage 2 copy stays honest when no price is resolvable", () => {
    const copy = buildLeadFollowUpCopy({ stage: 2, courseLabel: "your course" });
    expect(copy.paragraphs.join(" ")).not.toMatch(/CA\$/);
  });

  it("neither stage uses em dashes", () => {
    for (const stage of [1, 2] as const) {
      const copy = buildLeadFollowUpCopy({ stage, courseLabel: "Class 1 Water", priceLabel: "CA$149" });
      expect(copy.subject).not.toContain("\u2014");
      expect(copy.paragraphs.join(" ")).not.toContain("\u2014");
    }
  });
});

describe("lead course resolution", () => {
  it("resolves a real product key to its course label, link and price", () => {
    const resolved = resolveLeadCourse("oit");
    expect(resolved.courseLabel.toLowerCase()).toContain("oit");
    expect(resolved.courseUrl).toContain("/pricing?course=oit");
    expect(resolved.priceLabel).toMatch(/^CA\$/);
  });

  it("falls back to the plain pricing page for unknown sources", () => {
    const resolved = resolveLeadCourse("paywall_browse");
    expect(resolved.courseUrl).toBe("https://echeloninstitute.ca/pricing");
    expect(resolved.priceLabel).toBeUndefined();
    // The label must stay generic rather than inventing a course name.
    expect(resolved.courseLabel).toBe("your operator exam");
  });
});
