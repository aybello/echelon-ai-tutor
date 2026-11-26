import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
type Choice = {
  id: string;
  prompt: string;
  mode: string;
  options: { id: string; label: string }[];
  correctOptionId: string;
  explanation: string;
};
type Replacement = {
  courseKey: string;
  replacesId: string;
  example: Choice;
  review: { verdict: string; reviewer: string; reviewAuthority: string; reviewedAt: string; notes: string };
};
const load = (file: string) => JSON.parse(readFileSync(file, "utf8"));
const revisions = ["2026-11-14-option-length-class2-ww.json", "2026-11-14-option-length-batch-2.json"]
  .flatMap(file => (load(join(here, "../overlay", file)) as { replacements: Replacement[] }).replacements);
const revision = (id: string) => {
  const matches = revisions.filter(r => r.example.id === id);
  expect(matches).toHaveLength(1);
  return matches[0];
};
const original = (r: Replacement) => {
  const pkg = load(join(here, "../release-2026-11-12/packages", `${r.courseKey}.json`)) as { examples: Choice[] };
  const matches = pkg.examples.filter(e => e.id === r.replacesId);
  expect(matches).toHaveLength(1);
  return matches[0];
};
const keyed = (e: Choice) => {
  const matches = e.options.filter(o => o.id === e.correctOptionId);
  expect(matches).toHaveLength(1);
  return matches[0].label;
};

describe("option-length revision semantics", () => {
  it("keys filtration, not fill, as the term outside the stated SBR cycle", () => {
    const r = revision("class2-ww-032-r1");
    const before = original(r);
    expect(r.example.correctOptionId).toBe(before.correctOptionId);
    expect(r.example.correctOptionId).toBe("option-1");
    expect(keyed(r.example)).toBe("Filtration");
    expect(r.example.options.find(o => o.id === "option-3")?.label).toBe("Fill with influent");
    expect(r.example.explanation).toBe(before.explanation);
    expect(r.example.explanation).toMatch(/Filtration is not one of the five listed batch phases/i);
  });

  it("keys the universal filtration claim rather than a potentially true chemical-removal claim", () => {
    const r = revision("class1-water-068-r1");
    const before = original(r);
    expect(r.example.prompt).toBe(before.prompt);
    expect(r.example.correctOptionId).toBe(before.correctOptionId);
    expect(r.example.correctOptionId).toBe("option-3");
    expect(keyed(r.example)).toBe("Every filter removes every dissolved chemical");
    expect(keyed(r.example)).toMatch(/\bevery filter\b.*\bevery dissolved chemical\b/i);
    expect(r.example.explanation).toBe(before.explanation);
    expect(r.example.explanation).toMatch(/depends on contaminant and filter technology/i);
    expect(keyed(r.example).length).toBeLessThan(Math.max(...r.example.options.map(o => o.label.length)));
  });

  it("keeps insulation resistance aligned with the CCTV explanation", () => {
    const r = revision("class1-wastewater-coll-040-r1");
    const before = original(r);
    expect(r.example.correctOptionId).toBe(before.correctOptionId);
    expect(keyed(r.example)).toBe("Motor insulation resistance");
    expect(r.example.explanation).toBe(before.explanation);
    expect(r.example.explanation).toMatch(/not test motor insulation/i);
  });

  it("explains the wet-well choices without incorrectly including the keyed tree option", () => {
    const r = revision("class1-wastewater-coll-045-r1");
    expect(r.example.correctOptionId).toBe(original(r).correctOptionId);
    expect(keyed(r.example)).toBe("Street tree species");
    expect(r.example.explanation).toMatch(/liquid level, pump status and alarm condition/i);
    expect(r.example.explanation).toMatch(/street tree species does not/i);
    expect(r.example.explanation).not.toMatch(/first three/i);
  });

  it("retains the historical review attribution and identifies the later real Sol review without rewriting the historical reviewer", () => {
    for (const id of ["class2-ww-032-r1", "class1-water-068-r1", "class1-wastewater-coll-040-r1", "class1-wastewater-coll-045-r1"]) {
      const { review } = revision(id);
      expect(review.verdict, id).toBe("approved");
      expect(review.reviewer, id).toBe("claude-sonnet-5-5");
      expect(review.reviewAuthority, id).toBe("owner-authorized-ai-review");
      expect(review.reviewedAt, id).toBe("2026-11-14T00:00:00Z");
      expect(review.notes, id).toMatch(/original owner-authorized AI review predates the subsequent correction/i);
      expect(review.notes, id).toMatch(/real gpt-6.1-sol review returning issues: \[\]/i);
      expect(review.notes, id).toMatch(/no human technical review/i);
    }
  });
  it("preserves the sample-holding and positive-blank learning targets without length cues", () => {
    const holding = revision("class2-ww-057-r1").example;
    expect(keyed(holding)).toBe("The result may no longer represent conditions at collection");
    const blank = revision("class2-ww-068-r1").example;
    expect(keyed(blank)).toBe("Ignore the positive result and release the affected data");
    expect(blank.explanation).toMatch(/contamination or an analytical artifact/i);
    for (const e of [holding, blank]) {
      expect(keyed(e).length).toBeLessThan(Math.max(...e.options.map(o => o.label.length)));
    }
  });

  it("distinguishes a fixed-time composite from flow proportional sampling", () => {
    const e = revision("class2-ww-077-r1").example;
    expect(keyed(e)).toBe("Take equal aliquots at fixed intervals as flow varies");
    expect(e.explanation).toMatch(/time composite, not necessarily flow proportional/i);
    expect(keyed(e).length).toBeLessThan(Math.max(...e.options.map(o => o.label.length)));
  });

  it("does not promise a slower stop eliminates force-main surges", () => {
    const overlay = load(join(here, "../overlay/2026-11-14-rapid-swipe-balance.json"));
    const matches = overlay.additions.filter((a: { example: Choice }) => a.example.id === "rsb-class3-wastewater-coll-002");
    expect(matches).toHaveLength(1);
    const e = matches[0].example;
    expect(e.correctAnswer).toBe(false);
    expect(e.prompt).toMatch(/longer pump-stop time is sufficient.*without considering check-valve closure/i);
    expect(e.explanation).toMatch(/system-specific engineering assessment/i);
    expect(e.explanation).toMatch(/do not change settings/i);
  });

  it("retains cross-connection protection despite positive public-supply pressure", () => {
    const overlay = load(join(here, "../overlay/2026-11-14-rapid-swipe-balance.json"));
    const matches = overlay.additions.filter((a: { example: Choice }) => a.example.id === "rsb-class3-water-dist-006");
    expect(matches).toHaveLength(1);
    const e = matches[0].example;
    expect(e.correctAnswer).toBe(false);
    expect(e.prompt).toMatch(/positive public-supply pressure.*eliminates the need for cross-connection protection/i);
    expect(e.explanation).toMatch(/backsiphonage/i);
    expect(e.explanation).toMatch(/customer-side pressure exceeding supply pressure.*backpressure/i);
    expect(e.explanation).toMatch(/maintain required cross-connection protection/i);
  });

});
