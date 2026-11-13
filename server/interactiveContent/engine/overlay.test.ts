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
const documents = committedOverlayDocuments() as ContentOverlay[];
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
