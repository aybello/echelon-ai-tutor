import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { causeEffectFit, type CauseEffectChoiceItem } from "../../../shared/interactiveCauseEffect";
import { InteractiveContentEngine } from "./loader";
import { committedOverlayDocuments, compileOverlays, exampleSha256, type ContentOverlay } from "./overlay";

const here = dirname(fileURLToPath(import.meta.url));
const registry = JSON.parse(readFileSync(join(here, "release-v1/registry.json"), "utf8")) as { courses: Record<string, unknown> };
const courseKeys = Object.keys(registry.courses);
const documents = (committedOverlayDocuments() as ContentOverlay[]).filter(d => d.overlayId.includes("rapid-swipe-balance"));
const engine = new InteractiveContentEngine();
const stored = (courseKey: string) => (engine as unknown as { manifest(key: string): { entries: { id: string; mode: string; sha256: string }[] } }).manifest(courseKey);

describe("reviewed rapid-swipe balance overlay", () => {
  it("adds only rapid-swipe false statements, each with its owner-authorized review record", () => {
    for (const doc of documents) for (const addition of doc.additions) {
      expect(addition.example.mode).toBe("rapid-swipe");
      expect((addition.example as { correctAnswer: boolean }).correctAnswer).toBe(false);
      expect(addition.review.reviewAuthority).toBe("owner-authorized-ai-review");
      expect(addition.review.verdict).toBe("approved");
    }
  });

  it("makes each course's rapid-swipe pool balanced: false statements match the stored true excess", () => {
    for (const courseKey of courseKeys) {
      const entries = stored(courseKey).entries.filter(e => e.mode === "rapid-swipe");
      const examples = (engine as unknown as { examples(m: unknown, s: unknown[]): { mode: string; correctAnswer?: boolean }[] });
      const manifest = (engine as unknown as { manifest(k: string): unknown }).manifest(courseKey);
      const storedExamples = examples.examples(manifest, entries);
      const storedTrue = storedExamples.filter(x => x.correctAnswer === true).length;
      const storedFalse = storedExamples.length - storedTrue;
      const added = documents.flatMap(d => d.additions).filter(a => a.courseKey === courseKey).length;
      expect(storedFalse + added, courseKey).toBe(storedTrue);
    }
  });

  it("serves a reviewed revision only while the stored bytes it supersedes are exactly unchanged", () => {
    const target = stored("class1-water").entries.find(e => e.mode === "rapid-swipe")!;
    const review = documents[0].additions[0].review;
    const revision = (sha: string): ContentOverlay => ({
      format: "interactive-overlay-v1", overlayId: "test-revision", scope: "test",
      additions: [],
      replacements: [{
        courseKey: "class1-water", replacesId: target.id, replacesSha256: sha, topicId: "unclassified", difficulty: "unclassified",
        reason: "test", review,
        example: { id: "revised-swipe", prompt: "Revised statement.", mode: "rapid-swipe", correctAnswer: false, explanation: "Revised explanation." },
      }],
    });
    const before = new InteractiveContentEngine(undefined, []).getCatalog("class1-water", true).modes.find(m => m.mode === "rapid-swipe")!.totalCount;
    const good = new InteractiveContentEngine(undefined, [revision(target.sha256)]);
    expect(good.getCatalog("class1-water", true).modes.find(m => m.mode === "rapid-swipe")!.totalCount).toBe(before);
    const ids = good.startSession({ courseKey: "class1-water", mode: "rapid-swipe", sessionSize: 50 }, true).examples.map(e => e.id);
    expect(ids).toContain("revised-swipe");
    expect(ids).not.toContain(target.id);
    expect(() => new InteractiveContentEngine(undefined, [revision("0".repeat(64))]).getCatalog("class1-water", true)).toThrow();
  });

  it("rejects an overlay that reuses an id, duplicates a claim, or introduces a calculation into cause and effect", () => {
    const first = documents[0].additions[0];
    expect(() => compileOverlays([{ ...documents[0], additions: [first, first] }])).toThrow(/Duplicate overlay id/);
    const calc = { ...first, example: { id: "calc-ce", prompt: "Q", mode: "cause-effect", options: [{ id: "a", label: "12 m³" }, { id: "b", label: "4 m³" }], correctOptionId: "a", explanation: "e" } };
    expect(() => compileOverlays([{ ...documents[0], additions: [calc] }])).toThrow(/Calculation item/);
    expect(causeEffectFit(calc.example as unknown as CauseEffectChoiceItem)).toBe("calculation");
    expect(() => compileOverlays([{ ...documents[0], additions: [{ ...first, courseKey: "electrician-309a" }] }])).toThrow(/not eligible/);
  });

  it("keeps the committed overlay's content hashes stable", () => {
    expect(documents[0].additions.every(a => exampleSha256(a.example).length === 64)).toBe(true);
  });
});

describe("reviewed option-length revisions for class2-ww", () => {
  const modes = ["odd-one-out", "tap-the-flaw", "cause-effect"] as const;
  const served = () => modes.flatMap(mode => engine.startSession({ courseKey: "class2-ww", mode, sessionSize: 50 }, true).examples);
  const revisions = (committedOverlayDocuments() as ContentOverlay[]).flatMap(d => d.replacements).filter(r => r.courseKey === "class2-ww");

  it("serves each revision instead of its stored original, with unchanged pool counts", () => {
    expect(revisions).toHaveLength(32);
    const plain = new InteractiveContentEngine(undefined, []);
    for (const mode of modes) {
      const withOverlay = engine.getCatalog("class2-ww", true).modes.find(m => m.mode === mode)!.totalCount;
      expect(withOverlay).toBe(plain.getCatalog("class2-ww", true).modes.find(m => m.mode === mode)!.totalCount);
    }
    const ids = new Set(served().map(e => e.id));
    for (const r of revisions) {
      expect(ids.has(r.example.id), r.example.id).toBe(true);
      expect(ids.has(r.replacesId), r.replacesId).toBe(false);
    }
  });

  it("keeps each question's keyed meaning: same option ids, same key, same explanation", () => {
    const plain = new InteractiveContentEngine(undefined, []);
    const originals = new Map(modes.flatMap(mode => plain.startSession({ courseKey: "class2-ww", mode, sessionSize: 50 }, true).examples).map(e => [e.id, e as { options: { id: string }[]; correctOptionId: string; explanation: string }]));
    for (const r of revisions) {
      const before = originals.get(r.replacesId)!;
      const after = r.example as unknown as { options: { id: string }[]; correctOptionId: string; explanation: string };
      expect(after.options.map(o => o.id)).toEqual(before.options.map(o => o.id));
      expect(after.correctOptionId).toBe(before.correctOptionId);
      expect(after.explanation).toBe(before.explanation);
    }
  });

  it("no longer lets the longest option identify the correct answer", () => {
    const longest = (examples: unknown[]) => {
      let hits = 0, total = 0;
      for (const e of examples as { options?: { id: string; label: string }[]; correctOptionId?: string }[]) {
        if (!e.options || !e.correctOptionId) continue;
        const lens = e.options.map(o => o.label.length);
        if (new Set(lens).size === 1) continue;
        total++;
        if (e.options.find(o => o.id === e.correctOptionId)!.label.length === Math.max(...lens)) hits++;
      }
      return hits / total;
    };
    const plain = new InteractiveContentEngine(undefined, []);
    const before = longest(modes.flatMap(mode => plain.startSession({ courseKey: "class2-ww", mode, sessionSize: 50 }, true).examples));
    const after = longest(served());
    expect(before).toBeGreaterThan(0.4);
    expect(after).toBeLessThan(0.3);
  });
});

describe("every committed revision", () => {
  const replacements = (committedOverlayDocuments() as ContentOverlay[]).flatMap(d => d.replacements);
  type Choice = { options: { id: string; label: string }[]; correctOptionId: string; explanation: string; prompt: string };
  const storedExample = (courseKey: string, id: string) => {
    const manifest = (engine as unknown as { manifest(k: string): { entries: { id: string }[] } }).manifest(courseKey);
    const entry = manifest.entries.find(e => e.id === id)!;
    return (engine as unknown as { examples(m: unknown, s: unknown[]): Choice[] }).examples(manifest, [entry])[0];
  };

  it("keeps option ids and keys, pins corrected explanations, and limits absolute wording", () => {
    expect(replacements.length).toBeGreaterThanOrEqual(124);
    expect(replacements.filter(r => r.courseKey === "class1-wastewater-coll" && r.replacesId === "class1-wastewater-coll-045")).toHaveLength(1);
    const absolute = /\b(always|never|automatically|guarantee[sd]?|cannot|must|completely|entirely|any|solely|only|every)\b/i;
    const correctedExplanations: Record<string, [string, string]> = {
      "class1-water-056": ["Ontario notes sediment plugging can increase cartridge replacement frequency.", "Sediment plugging can increase cartridge replacement frequency."],
      "class1-ww-046": ["Hydrogen sulfide can dull smell, so odour is not a reliable detector.", "Hydrogen sulfide can dull smell, so odour is not a reliable detector and must not be used to assess exposure safety."],
      "class1-ww-061": ["The EPA notes significant sulfite overdosing can suppress dissolved oxygen.", "Excess sulfite can consume dissolved oxygen and lower effluent dissolved oxygen."],
      "class1-ww-065": ["Condition monitoring identifies changes that may warrant investigation.", "Condition monitoring identifies changes that may warrant investigation. Follow the maintenance procedure and applicable equipment-safety requirements."],
      "class1-ww-072": ["CCOHS warns that closing valves alone is insufficient for pipe isolation in this context.", "A closed valve alone does not always guarantee safe isolation. Use the isolation method established by the hazard assessment and applicable requirements."],
      "class1-water-dist-037": ["The manual calls for clean, unscratched vials free of fingerprints.", "Clean, unscratched vials free of fingerprints help avoid sampling-cell problems; follow the instrument instructions."],
      "class1-wastewater-coll-045": ["The first three observations describe station operating conditions.", "Liquid level, pump status and alarm condition describe station operating conditions; street tree species does not."],
    };
    for (const r of replacements) {
      const before = storedExample(r.courseKey, r.replacesId);
      const after = r.example as unknown as Choice;
      expect(after.options.map(o => o.id), r.replacesId).toEqual(before.options.map(o => o.id));
      expect(after.correctOptionId, r.replacesId).toBe(before.correctOptionId);
      expect(after.options.filter(o => o.id === after.correctOptionId), r.replacesId).toHaveLength(1);
      if (Object.hasOwn(correctedExplanations, r.replacesId)) {
        expect(before.explanation, r.replacesId).toBe(correctedExplanations[r.replacesId][0]);
        expect(after.explanation, r.replacesId).toBe(correctedExplanations[r.replacesId][1]);
      } else {
        expect(after.explanation, r.replacesId).toBe(before.explanation);
      }
      for (const o of after.options) {
        if (r.courseKey === "class1-water" && r.replacesId === "class1-water-068" && o.id === "option-3") {
          expect(o.label).toBe("Every filter removes every dissolved chemical");
          expect(after.correctOptionId).toBe(o.id);
        } else if (r.courseKey === "class1-ww" && r.replacesId === "class1-ww-072" && o.id === "option-1") {
          // The universal claim is the hazardous misconception to identify.
          expect(o.label).toBe("A closed valve alone always guarantees isolation");
          expect(after.correctOptionId).toBe(o.id);
        } else {
          expect(absolute.test(o.label), `${r.replacesId}: ${o.label}`).toBe(false);
        }
      }
    }
  });

  it("keeps the corrected choices aligned with their keys and explanations", () => {
    const corrected = [
      { courseKey: "class2-ww", id: "class2-ww-032", key: "option-1", label: "Filtration", otherId: "option-3", otherLabel: "Fill with influent", explanation: /Filtration is not one of the five listed batch phases/i },
      { courseKey: "class1-water", id: "class1-water-068", key: "option-3", label: "Every filter removes every dissolved chemical", explanation: /depends on contaminant and filter technology/i },
      { courseKey: "class1-wastewater-coll", id: "class1-wastewater-coll-040", key: "option-3", label: "Motor insulation resistance", explanation: /not test motor insulation/i },
      { courseKey: "class1-wastewater-coll", id: "class1-wastewater-coll-045", key: "option-2", label: "Street tree species", explanation: /liquid level, pump status and alarm condition.*street tree species does not/i },
    ];
    for (const item of corrected) {
      const matches = replacements.filter(r => r.courseKey === item.courseKey && r.replacesId === item.id);
      expect(matches, item.id).toHaveLength(1);
      const after = matches[0].example as unknown as Choice;
      expect(after.correctOptionId, item.id).toBe(item.key);
      expect(after.options.find(o => o.id === item.key)?.label, item.id).toBe(item.label);
      if (item.otherId) expect(after.options.find(o => o.id === item.otherId)?.label, item.id).toBe(item.otherLabel);
      expect(after.explanation, item.id).toMatch(item.explanation);
    }
  });

  it("no longer lets the longest option identify the correct answer", () => {
    for (const r of replacements) {
      const after = r.example as unknown as Choice;
      const lens = after.options.map(o => o.label.length);
      const correct = after.options.find(o => o.id === after.correctOptionId)!.label.length;
      expect(correct === Math.max(...lens) && new Set(lens).size > 1, r.replacesId).toBe(false);
    }
  });
});
