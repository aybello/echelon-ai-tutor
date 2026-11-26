import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { causeEffectFit, type CauseEffectChoiceItem } from "../../../shared/interactiveCauseEffect";
import { InteractiveContentEngine } from "./loader";
import { committedModeFitExclusions, computeModeFitExclusions, isExcludedFromMode } from "./modeFit";

const here = dirname(fileURLToPath(import.meta.url));
const courseKeys = Object.keys((JSON.parse(readFileSync(join(here, "release-v1/registry.json"), "utf8")) as { courses: Record<string, unknown> }).courses);
const engine = new InteractiveContentEngine(undefined, []);

describe("published Cause and Effect mode fit", () => {
  it("keeps the committed exclusion list identical to the mode-fit rule over the stored bank", () => {
    expect(computeModeFitExclusions(engine, courseKeys)).toEqual(committedModeFitExclusions());
  });

  it("applies only to cause-effect and only to listed items", () => {
    const [courseKey, ids] = Object.entries(committedModeFitExclusions().courses)[0];
    expect(isExcludedFromMode(courseKey, "cause-effect", ids[0])).toBe(true);
    expect(isExcludedFromMode(courseKey, "odd-one-out", ids[0])).toBe(false);
    expect(isExcludedFromMode("not-a-course", "cause-effect", ids[0])).toBe(false);
    expect(isExcludedFromMode(courseKey, "cause-effect", "not-an-item")).toBe(false);
  });

  it("withholds calculation items from catalogs and sessions and delivers direction controls", () => {
    let directional = 0;
    for (const courseKey of courseKeys) {
      const excluded = new Set(committedModeFitExclusions().courses[courseKey] ?? []);
      const stored = (engine as unknown as { manifest(key: string): { entries: { id: string; mode: string }[] } }).manifest(courseKey).entries.filter(entry => entry.mode === "cause-effect");
      const catalog = engine.getCatalog(courseKey, true).modes.find(mode => mode.mode === "cause-effect")!;
      expect(catalog.totalCount).toBe(stored.length - excluded.size);
      // Every course keeps a usable Cause and Effect pool after exclusion.
      expect(catalog.totalCount).toBeGreaterThanOrEqual(5);
      const session = engine.startSession({ courseKey, mode: "cause-effect", sessionSize: 50 }, true);
      expect(session.totalAvailableCount).toBe(catalog.totalCount);
      expect(session.examples).toHaveLength(Math.min(50, catalog.totalCount));
      for (const example of session.examples) {
        expect(excluded.has(example.id)).toBe(false);
        if ("effects" in example) {
          directional++;
          expect(example.effects).toHaveLength(1);
          expect(["increase", "decrease", "unchanged"]).toContain(example.effects[0].direction);
          expect("options" in example).toBe(false);
        } else {
          // A remaining choice item is a qualitative consequence, never a calculation or a missed direction.
          expect(causeEffectFit(example as CauseEffectChoiceItem)).toBe("choice");
        }
      }
      // Other modes are untouched.
      const other = engine.getCatalog(courseKey, true).modes.find(mode => mode.mode === "tap-the-flaw")!;
      expect(other.totalCount).toBe((engine as unknown as { manifest(key: string): { entries: { mode: string }[] } }).manifest(courseKey).entries.filter(entry => entry.mode === "tap-the-flaw").length);
    }
    expect(directional).toBeGreaterThan(0);
  });
});
