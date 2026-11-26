/** Display permutation only. Stored answers and API submissions remain canonical.
 * Stable across rerenders, reloads, and revisiting an in-progress exam.
 * The answer key is deliberately not an input to the permutation.
 */
const BANKS = new Set(['class1-water', 'class1-wastewater', 'class1-water-dist', 'class1-wastewater-coll']);
export function class1OptionOrder(bank: string | undefined, id: unknown, count: number): number[] {
  const canonical = bank === 'class1-ww' ? 'class1-wastewater' : bank;
  const order = Array.from({ length: count }, (_, index) => index);
  if (!canonical || !BANKS.has(canonical) || !Number.isSafeInteger(id) || Number(id) < 1 || count !== 4) return order;
  let state = 2166136261;
  for (const ch of `class1-display-v1:${canonical}:${id}`) state = Math.imul(state ^ ch.charCodeAt(0), 16777619) >>> 0;
  const random = () => { state = (state + 0x6D2B79F5) >>> 0; let t = state; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  return order;
}
export function class1DisplayLetter(bank: string | undefined, id: unknown, count: number, canonicalIndex: number): string {
  const index = class1OptionOrder(bank, id, count).indexOf(canonicalIndex);
  return index < 0 ? '?' : String.fromCharCode(65 + index);
}
