import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { buildItems } from "/home/user/echelon-ai-tutor/scripts/game-authoring/build";
const S = "/tmp/claude-0/-home-user-echelon-ai-tutor/0e6dc4c6-dfed-5d26-9c2a-f17854a01d3e/scratchpad";
const SNAP = `${S}/mainsnap/server/interactiveContent`;
const dir = "/home/user/echelon-ai-tutor/scripts/game-authoring/data";
const norm = (ex: any) => { const m = ex.mode; const lab = new Map((ex.options ?? []).filter((o: any) => typeof o === "object").map((o: any) => [o.id, o.label])); let b: any;
  if (m === "rapid-swipe") b = [ex.prompt, !!ex.correctAnswer]; else if (m === "speed-match") b = [ex.prompt, ex.pairs.map((p: any) => p.left + "=>" + p.right).sort()];
  else if (m === "before-after") b = [ex.prompt, (ex.options ?? []).map(String).sort(), String(ex.correctAnswer)]; else b = [ex.prompt, [...lab.values()].sort(), lab.get(ex.correctOptionId)]; return m + JSON.stringify(b); };
const LIST = JSON.parse(readFileSync("/home/user/echelon-ai-tutor/docs/spot-check/live-items-to-replace-20261115.json", "utf8")).items; const gone = new Set(LIST.map((i: any) => i.itemId));
const excl = new Set<string>(); const c = (x: any) => typeof x === "string" ? excl.add(x) : Array.isArray(x) ? x.forEach(c) : x && typeof x === "object" ? Object.values(x).forEach(c) : 0;
c(JSON.parse(readFileSync(`${SNAP}/engine/releaseExclusions.json`, "utf8")));
const have = new Map<string, Set<string>>(); const prompts = new Map<string, Set<string>>();
const add = (course: string, ex: any) => { (have.get(course) ?? have.set(course, new Set()).get(course)!).add(norm(ex)); (prompts.get(course) ?? prompts.set(course, new Set()).get(course)!).add(ex.prompt.trim().toLowerCase()); };
for (const f of readdirSync(`${SNAP}/overlay`)) for (const a of JSON.parse(readFileSync(`${SNAP}/overlay/${f}`, "utf8")).additions ?? []) if (!excl.has(a.example.id) && !gone.has(a.example.id)) add(a.courseKey, a.example);
for (const f of readdirSync(`${SNAP}/release-2026-11-12/packages`)) { const d = JSON.parse(readFileSync(`${SNAP}/release-2026-11-12/packages/${f}`, "utf8")); for (const e of (d.examples ?? d.items ?? [])) { const ex = e.example ?? e; if (!excl.has(ex.id) && !gone.has(ex.id)) add(f.replace(".json", ""), ex); } }
const tables: any[] = []; for (const f of readdirSync(dir).filter(f => f.endsWith(".ts"))) { const d = (await import(pathToFileURL(`${dir}/${f}`).href)).default; tables.push({ f, d }); for (const it of buildItems(d, "q").items) add(d.courseKey, it.example); }
const BAD = /\b(alberta|british columbia|saskatchewan|manitoba|wpi|abc|western|ontario|oit|mecp|o\. reg|class [1-4]|us epa|osha)\b/i;
const jobs = [
  { target: "class1-water", source: "wpi-class1-water", sec: "boards", want: 26, out: "class1-water-r4" },
  { target: "class1-wastewater-coll", source: "wpi-class1-water-coll", sec: "facts", want: 9, out: "class1-wastewater-coll-r4a", extra: "boards", wantExtra: 8 },
  { target: "class1-water-dist", source: "wpi-class1-water-dist", sec: "sequences", want: 5, out: "class1-water-dist-r4" },
];
for (const j of jobs) {
  const data: any = { courseKey: j.target, facts: [], boards: [], oddSets: [], sequences: [], relations: [], flaws: [] };
  const taken = new Set<string>(); const targetHave = have.get(j.target)!; const targetPrompts = prompts.get(j.target)!;
  const secs = [{ sec: j.sec, want: j.want }, ...(j.extra ? [{ sec: j.extra, want: j.wantExtra }] : [])];
  for (const { sec, want } of secs) { let got = 0;
    for (const { d } of tables.filter(t => t.d.courseKey === j.source)) for (const r of d[sec] ?? []) {
      if (got >= want) break; const txt = JSON.stringify(r); if (BAD.test(txt) || taken.has(txt)) continue;
      const probe: any = { courseKey: j.target, facts: [], boards: [], oddSets: [], sequences: [], relations: [], flaws: [] }; probe[sec] = [r];
      let items: any[]; try { items = buildItems(probe, "q").items; } catch { continue; } if (!items.length) continue;
      if (items.some((it: any) => targetHave.has(norm(it.example)) || targetPrompts.has(it.example.prompt.trim().toLowerCase()))) continue;
      taken.add(txt); data[sec].push(r); got++; for (const it of items) { targetHave.add(norm(it.example)); targetPrompts.add(it.example.prompt.trim().toLowerCase()); } }
    console.log(j.target, sec, "picked", got, "of", want); }
  const body = `// Top-up written after the full review of 2026-11-15/16 removed or replaced rows. Generic operator knowledge in metric units, taken from the matching western Class 1 table.\n// Draft only. Not registered.\nimport type { CourseData } from "../build";\nconst data: CourseData = ${JSON.stringify(data, null, 2)};\nexport default data;\n`;
  writeFileSync(`${dir}/${j.out}.ts`, body);
}
