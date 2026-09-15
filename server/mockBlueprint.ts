/** WPI standardized 2025 Class IV wastewater outline. Confirm adoption with the certifying authority. */
export const WPI_CLASS4_BANK = "wpi-class4-wastewater";
export const WPI_CLASS4_BLUEPRINT_VERSION = 2025;
export const WPI_CLASS4_BLUEPRINT = [
  { module: "Equipment Evaluation, Maintenance & Operation", total: 28, recall: 6, calculations: 7 },
  { module: "Treatment Process Evaluation & Adjustment", total: 42, recall: 7, calculations: 4 },
  { module: "Laboratory Analysis", total: 15, recall: 7, calculations: 0 },
  { module: "Security, Safety & Administrative Procedures", total: 15, recall: 5, calculations: 5 },
] as const;
export const WPI_CLASS4_SOURCE = "https://gowpi.org/wp-content/uploads/2026/04/WastewaterTreatment-%E2%80%93-Class-4_mh-fin.pdf";
/** Collection is a separate exam. This profile is enabled only by reviewed bank metadata. */
export const WPI_COLLECTION_BANK = "wpi-class4-wastewater-coll";
export const WPI_COLLECTION_BLUEPRINT_VERSION = 2025;
export const WPI_COLLECTION_BLUEPRINT = [
  { module: "Equipment Operation, Evaluation & Maintenance", total: 23, recall: 5, calculations: 3 },
  { module: "Collection System O&M & Restoration", total: 23, recall: 4, calculations: 5 },
  { module: "Lift Station Operation & Maintenance", total: 16, recall: 3, calculations: 1 },
  { module: "Collection System Monitoring, Evaluation & Adjustment", total: 20, recall: 5, calculations: 0 },
  { module: "Security, Safety & Administrative Procedures", total: 18, recall: 3, calculations: 7 },
] as const;
export const WPI_COLLECTION_SOURCE = "https://gowpi.org/wp-content/uploads/2026/04/Collection-%E2%80%93-Class-4_final.pdf";
export function mockBlueprintForBank(bankKey: string, version: number): readonly BlueprintArea[] | null {
  if (bankKey === WPI_CLASS4_BANK && version === WPI_CLASS4_BLUEPRINT_VERSION) return WPI_CLASS4_BLUEPRINT;
  if (bankKey === WPI_COLLECTION_BANK && version === WPI_COLLECTION_BLUEPRINT_VERSION) return WPI_COLLECTION_BLUEPRINT;
  return null;
}
const aliases: Record<string, string> = {
    "Treatment Process": WPI_CLASS4_BLUEPRINT[1].module,
    "Equipment Operation & Maintenance": WPI_CLASS4_BLUEPRINT[0].module,
    "Safety & Admin": WPI_CLASS4_BLUEPRINT[3].module,
};
export function wpiClass4StoredModuleNames(module: string): string[] {
  const canonical = normalizeWpiClass4Module(module);
  return [canonical, ...Object.keys(aliases).filter(key => aliases[key] === canonical)];
}
export function normalizeWpiClass4Module(module: string): string {
  return Object.hasOwn(aliases, module) ? aliases[module] : module;
}
export type BlueprintArea = { module: string; total: number; recall: number; calculations: number };
export type ClassifiedQuestion = { id: number; module: string; isCalc?: boolean; cognitiveLevel?: string | null };
function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
/** Satisfies the joint topic/cognitive/calculation quotas, not three independent samples. */
export function selectBlueprintQuestions<T extends ClassifiedQuestion>(pool: T[], outline: readonly BlueprintArea[], count: number, random = Math.random): T[] {
  if (!Number.isInteger(count) || count < 1 || outline.reduce((n, a) => n + a.total, 0) !== count ||
    new Set(outline.map(a => a.module)).size !== outline.length || outline.some(a =>
      ![a.total, a.recall, a.calculations].every(n => Number.isInteger(n) && n >= 0) || a.recall > a.total || a.calculations > a.total)) {
    throw new Error("Invalid mock blueprint");
  }
  const ids = new Set<number>();
  for (const q of pool) {
    if (!Number.isInteger(q.id) || ids.has(q.id)) throw new Error("Duplicate or invalid mock question identity");
    ids.add(q.id);
  }
  const selected: T[] = [];
  for (const area of outline) {
    const candidates = pool.filter(q => q.module === area.module);
    const bucket = (level: string, calc: boolean) => shuffle(candidates.filter(q => q.cognitiveLevel === level && q.isCalc === calc), random);
    const rc = bucket("recall", true), rn = bucket("recall", false);
    const ac = bucket("application", true), an = bucket("application", false);
    const app = area.total - area.recall;
    // x = recall calculations. These bounds solve all four bucket capacities together.
    const lo = Math.max(0, area.calculations - app, area.recall - rn.length, area.calculations - ac.length);
    const hi = Math.min(area.recall, area.calculations, rc.length, an.length - app + area.calculations);
    if (lo > hi) throw new Error(`Insufficient classified questions for ${area.module}`);
    const x = lo + Math.floor(random() * (hi - lo + 1));
    selected.push(...rc.slice(0, x), ...rn.slice(0, area.recall - x),
      ...ac.slice(0, area.calculations - x), ...an.slice(0, app - area.calculations + x));
  }
  return shuffle(selected, random);
}
