import { causeEffectFit, toCauseEffectEffects, type CauseEffectChoiceItem } from "../../../shared/interactiveCauseEffect";
import type { InteractiveDrillExample, InteractiveSessionExample } from "../../../shared/interactiveSessions";
import committed from "./modeFitExclusions.json";

/**
 * Reversible mode-fit control for the published Cause and Effect bank.
 *
 * `modeFitExclusions.json` lists stored cause-effect items that are calculation
 * practice (every option is a computed quantity). They stay in their release
 * packages, unedited, and are withheld from Cause and Effect catalogs and
 * sessions. Removing an ID from the list restores the item. The list is derived
 * from `causeEffectFit`; a test fails when the two disagree, so the list cannot
 * drift from the rule or hide an unrelated item.
 */
export type ModeFitExclusions = { version: 1; mode: "cause-effect"; reason: "calculation-not-cause-effect"; courses: Record<string, string[]> };

const exclusions = committed as ModeFitExclusions;
const excluded = new Map(Object.entries(exclusions.courses).map(([courseKey, ids]) => [courseKey, new Set(ids)]));

export const committedModeFitExclusions = (): ModeFitExclusions => exclusions;

/** True when a stored item is withheld from its mode for this course. */
export function isExcludedFromMode(courseKey: string, mode: string, id: string): boolean {
  return mode === exclusions.mode && excluded.get(courseKey)?.has(id) === true;
}

/** IDs of stored cause-effect items that are calculation practice, in stored order. */
export function calculationCauseEffectIds(examples: readonly InteractiveDrillExample[]): string[] {
  return examples.filter(example => example.mode === "cause-effect" && causeEffectFit(example as CauseEffectChoiceItem) === "calculation").map(example => example.id);
}

/**
 * Deliver a cleanly directional stored choice item with direction controls.
 * The keyed answer and explanation are unchanged; other items pass through.
 */
export function presentCauseEffect(example: InteractiveDrillExample): InteractiveSessionExample {
  if (example.mode !== "cause-effect") return example;
  return toCauseEffectEffects(example as CauseEffectChoiceItem) ?? example;
}

type EngineView = {
  manifest(courseKey: string): { entries: { id: string; mode: string }[] } | null;
  examples(manifest: unknown, entries: unknown[]): InteractiveDrillExample[];
};

/** Recompute the exclusion list from the stored bank. Used by the generator and its sync test. */
export function computeModeFitExclusions(engine: unknown, courseKeys: readonly string[]): ModeFitExclusions {
  const view = engine as EngineView;
  const courses: Record<string, string[]> = {};
  for (const courseKey of [...courseKeys].sort()) {
    const manifest = view.manifest(courseKey);
    if (!manifest) continue;
    const entries = manifest.entries.filter(entry => entry.mode === "cause-effect");
    // Read in bounded groups; each stored example is hash-checked by the engine.
    const ids: string[] = [];
    for (let start = 0; start < entries.length; start += 50) ids.push(...calculationCauseEffectIds(view.examples(manifest, entries.slice(start, start + 50))));
    if (ids.length) courses[courseKey] = ids.sort();
  }
  return { version: 1, mode: "cause-effect", reason: "calculation-not-cause-effect", courses };
}
