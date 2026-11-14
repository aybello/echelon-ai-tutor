// Builds an unreviewed game-content draft from authoring tables.
//
//   env -i PATH="$PATH" HOME=/tmp NODE_ENV=test node --require ./scripts/test-safety.cjs --import tsx \
//     scripts/game-authoring/build.ts <course-data-file> <output-overlay.json> <overlayId> [--check]
//
// Each table row is one concept. The builder turns rows into playable activities
// for the six modes, then rejects the batch if it is not safe to publish:
// schema errors, duplicates of stored or new items, an answer given away by
// option length or absolute wording, unbalanced true/false, or a calculation in
// Cause and Effect. A draft is not evidence of owner-authorized AI review and
// this command must not publish one until a trusted receipt gate exists.
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { InteractiveContentEngine } from "../../server/interactiveContent/engine/loader";
import { compileOverlays, committedOverlayDocuments, type ContentOverlay } from "../../server/interactiveContent/engine/overlay";
import { toCauseEffectEffects, causeEffectFit, type CauseEffectChoiceItem } from "../../shared/interactiveCauseEffect";

export type Level = "e" | "m" | "h";
export type CourseData = {
  courseKey: string;
  /** [level, statement, isTrue, explanation] */
  facts: [Level, string, boolean, string][];
  /** Six matching pairs per board. */
  boards: { d: Level; prompt: string; pairs: [string, string][] }[];
  /** Members share the rule; intruders clearly do not. */
  oddSets: { d: Level; rule: string; members: string[]; intruders: string[]; why: string; max?: number }[];
  /** Required-order process steps; every pair becomes a before/after question. */
  sequences: { d: Level; process: string; steps: string[]; why: string; max?: number }[];
  /** [level, scenario, affected parameter, direction, explanation] */
  relations: [Level, string, string, "increase" | "decrease" | "unchanged", string][];
  flaws: { d: Level; prompt: string; flawed: string; goods: string[]; explanation: string }[];
};

const LEVEL = { e: "easy", m: "medium", h: "hard" } as const;
const ABSOLUTE = /\b(always|never|automatically|guarantee[sd]?|cannot|must|completely|entirely|any|solely|only|all|every|none|nothing)\b/i;
const norm = (s: string) => s.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const words = (s: string) => new Set(norm(s).split(" ").filter(w => w.length > 2));
const jaccard = (a: string, b: string) => { const x = words(a), y = words(b); let i = 0; for (const w of x) if (y.has(w)) i++; return i / Math.max(1, x.size + y.size - i); };
// Deterministic pseudo-random so the same tables always build the same bytes.
function rng(seed: string) { let s = createHash("sha256").update(seed).digest().readUInt32LE(0); return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), s | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function shuffled<T>(items: readonly T[], seed: string): T[] { const r = rng(seed), a = [...items]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const notLongest = (labels: string[], correct: number) => { const l = labels.map(x => x.length); return !(l[correct] === Math.max(...l) && new Set(l).size > 1); };

export function buildItems(data: CourseData, tag = "") {
  const { courseKey } = data; const errors: string[] = []; let n = 0;
  const out: { difficulty: string; example: Record<string, unknown> }[] = [];
  const add = (d: Level, example: Record<string, unknown>, mode: string) => { out.push({ difficulty: LEVEL[d], example: { id: `og-${courseKey}-${tag}${mode}-${String(++n).padStart(4, "0")}`, ...example, mode } }); };
  // Rapid swipe
  for (const [d, statement, truth, explanation] of data.facts) {
    if (ABSOLUTE.test(statement)) errors.push(`fact uses absolute wording: ${statement}`);
    add(d, { prompt: statement, correctAnswer: truth, explanation }, "rapid-swipe");
  }
  // Speed match
  for (const board of data.boards) {
    if (board.pairs.length !== 6) errors.push(`board needs six pairs: ${board.prompt}`);
    add(board.d, { prompt: board.prompt, pairs: board.pairs.map(([left, right], i) => ({ id: `p${i + 1}`, left, right })) }, "speed-match");
  }
  // Odd one out
  for (const set of data.oddSets) {
    const combos: string[][] = []; const m = set.members;
    for (let a = 0; a < m.length; a++) for (let b = a + 1; b < m.length; b++) for (let c = b + 1; c < m.length; c++) combos.push([m[a], m[b], m[c]]);
    const pick = shuffled(combos, `odd:${set.rule}`); let made = 0; let intruder = 0;
    for (const trio of pick) {
      if (made >= (set.max ?? 6)) break;
      const odd = set.intruders[intruder % set.intruders.length];
      let labels = shuffled([...trio, odd], `odd:${set.rule}:${made}`); const ci = labels.indexOf(odd);
      if (!notLongest(labels, ci)) continue;
      intruder++; made++;
      add(set.d, { prompt: `Which is not ${set.rule}?`, options: labels.map((label, i) => ({ id: `option-${i + 1}`, label })), correctOptionId: `option-${ci + 1}`, explanation: set.why.replace("{odd}", odd) }, "odd-one-out");
    }
    if (made < Math.min(3, set.max ?? 6)) errors.push(`odd set made too few items (${made}): ${set.rule}`);
  }
  // Before/after
  for (const seq of data.sequences) {
    const pairs: [string, string][] = []; for (let i = 0; i < seq.steps.length; i++) for (let j = i + 1; j < seq.steps.length; j++) pairs.push([seq.steps[i], seq.steps[j]]);
    shuffled(pairs, `seq:${seq.process}`).slice(0, seq.max ?? 8).forEach(([early, late], k) => {
      const askEarly = k % 2 === 0; const answer = askEarly ? early : late;
      const options = shuffled([early, late], `seqopt:${seq.process}:${k}`);
      add(seq.d, { prompt: `In ${seq.process}, which step comes ${askEarly ? "earlier" : "later"}?`, options, correctAnswer: answer, explanation: `${seq.why} ${early} comes before ${late}.` }, "before-after");
    });
  }
  // Cause and effect (directional choices; the engine presents them with direction controls)
  const dirLabel = { increase: "It increases", decrease: "It decreases", unchanged: "It stays the same" } as const;
  for (const [d, scenario, parameter, direction, explanation] of data.relations) {
    const labels = [dirLabel.increase, dirLabel.decrease, dirLabel.unchanged]; const ci = labels.indexOf(dirLabel[direction]);
    add(d, { prompt: `${scenario} What happens to ${parameter}?`, options: labels.map((label, i) => ({ id: `option-${i + 1}`, label })), correctOptionId: `option-${ci + 1}`, explanation }, "cause-effect");
  }
  // Tap the flaw
  for (const flaw of data.flaws) {
    let placed = false;
    for (let attempt = 0; attempt < 24 && !placed; attempt++) {
      const goods = shuffled(flaw.goods, `flaw:${flaw.prompt}:${attempt}`).slice(0, 2); const labels = shuffled([flaw.flawed, ...goods], `flawopt:${flaw.prompt}:${attempt}`);
      const ci = labels.indexOf(flaw.flawed); if (!notLongest(labels, ci)) continue;
      add(flaw.d, { prompt: flaw.prompt, options: labels.map((label, i) => ({ id: `option-${i + 1}`, label })), correctOptionId: `option-${ci + 1}`, explanation: flaw.explanation }, "tap-the-flaw"); placed = true;
    }
    if (!placed) errors.push(`flaw cannot avoid the longest-answer tell: ${flaw.prompt}`);
    for (const label of [flaw.flawed, ...flaw.goods]) if (ABSOLUTE.test(label)) errors.push(`flaw option uses absolute wording: ${label}`);
  }
  return { items: out, errors };
}

export function buildOverlay(data: CourseData, overlayId: string) {
  const { items, errors } = buildItems(data, `${overlayId.replace(/^og-[a-z0-9-]*?-(\d+)$/, "b$1")}-`);
  const doc = { format: "interactive-overlay-v1", overlayId, scope: `Unreviewed draft game activities for ${data.courseKey}: ${items.length} items from authoring tables.`,
    additions: items.map(i => ({ courseKey: data.courseKey, topicId: "unclassified", difficulty: i.difficulty, example: i.example })), replacements: [] };
  return { doc, errors: [...errors, "Publication disabled: generated content has no verified, payload-bound AI review receipts"] };
}

export function validate(doc: ContentOverlay, existing: { prompt: string; key: string }[]) {
  const errors: string[] = [];
  try { compileOverlays([...committedOverlayDocuments().filter((d): d is ContentOverlay => (d as ContentOverlay).overlayId !== doc.overlayId), doc]); } catch (e) { errors.push(`schema: ${(e as Error).message}`); }
  const seen = new Map<string, string>();
  const bank = existing.map(e => ({ ...e, norm: norm(e.prompt) }));
  let longest = 0, options = 0; const swipe = { t: 0, f: 0 }; const dirs = { increase: 0, decrease: 0, unchanged: 0 };
  for (const { example: ex, courseKey } of doc.additions as { example: any; courseKey: string }[]) {
    const key = norm(`${ex.prompt} ${JSON.stringify(ex.options ?? ex.pairs ?? ex.correctAnswer)}`);
    if (seen.has(key)) errors.push(`duplicate within batch: ${ex.prompt}`); seen.set(key, ex.id);
    for (const e of bank) { if (e.norm === norm(ex.prompt) && e.key === norm(JSON.stringify(ex.options ?? ex.pairs ?? ex.correctAnswer))) errors.push(`duplicate of stored item: ${ex.prompt}`); else if (ex.mode === "rapid-swipe" && jaccard(e.prompt, ex.prompt) >= 0.8) errors.push(`near-duplicate of stored statement: ${ex.prompt} ~ ${e.prompt}`); }
    if (ex.mode === "rapid-swipe") ex.correctAnswer ? swipe.t++ : swipe.f++;
    if (ex.options && ex.correctOptionId && ex.mode !== "before-after") { options++; const l = ex.options.map((o: any) => o.label.length); const c = ex.options.find((o: any) => o.id === ex.correctOptionId).label.length; if (c === Math.max(...l) && new Set(l).size > 1) longest++; }
    if (ex.mode === "cause-effect") { if (causeEffectFit(ex as CauseEffectChoiceItem) === "calculation") errors.push(`calculation in cause-effect: ${ex.prompt}`); const t = toCauseEffectEffects(ex as CauseEffectChoiceItem); if (!t) errors.push(`cause-effect not directional: ${ex.prompt}`); else dirs[t.effects[0].direction as keyof typeof dirs]++; }
    void courseKey;
  }
  const total = swipe.t + swipe.f;
  if (total >= 10 && Math.abs(swipe.t - swipe.f) > Math.max(2, total * 0.1)) errors.push(`rapid-swipe unbalanced: ${swipe.t} true / ${swipe.f} false`);
  if (options >= 20 && longest / options > 0.3) errors.push(`correct option is longest in ${(100 * longest / options).toFixed(0)}% of option items`);
  return { errors, stats: { swipe, dirs, longest, options } };
}

async function main() {
  const [dataFile, outFile, overlayId, ...flags] = process.argv.slice(2);
  const data = (await import(pathToFileURL(resolve(dataFile)).href)).default as CourseData;
  const { doc, errors: buildErrors } = buildOverlay(data, overlayId);
  // Everything already playable in this course, for duplicate screening.
  const engine = new InteractiveContentEngine(undefined, [...committedOverlayDocuments().filter(d => (d as ContentOverlay).overlayId !== overlayId)]) as any;
  const manifest = engine.manifest(data.courseKey); const stored: any[] = [];
  for (let i = 0; i < manifest.entries.length; i += 50) stored.push(...engine.examples(manifest, manifest.entries.slice(i, i + 50)));
  for (const d of committedOverlayDocuments() as ContentOverlay[]) if (d.overlayId !== overlayId) for (const a of d.additions) if (a.courseKey === data.courseKey) stored.push(a.example);
  const existing = stored.map(e => ({ prompt: e.prompt, key: norm(JSON.stringify(e.options ?? e.pairs ?? e.correctAnswer)) }));
  const { errors, stats } = validate(doc as unknown as ContentOverlay, existing);
  const all = [...buildErrors, ...errors];
  const byMode: Record<string, number> = {}; for (const a of doc.additions) byMode[(a.example as any).mode] = (byMode[(a.example as any).mode] ?? 0) + 1;
  console.log(`${data.courseKey}: ${doc.additions.length} items`, JSON.stringify(byMode), JSON.stringify(stats));
  if (all.length) { for (const e of all.slice(0, 40)) console.log("ERROR", e); console.log(`${all.length} problem(s)`); process.exit(1); }
  if (!flags.includes("--check")) { writeFileSync(outFile, `${JSON.stringify(doc, null, 1)}\n`); console.log("wrote", outFile); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
