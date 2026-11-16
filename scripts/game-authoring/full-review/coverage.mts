import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { buildItems } from "/home/user/echelon-ai-tutor/scripts/game-authoring/build";
const S = "/tmp/claude-0/-home-user-echelon-ai-tutor/0e6dc4c6-dfed-5d26-9c2a-f17854a01d3e/scratchpad";
const SNAP = `${S}/mainsnap/server/interactiveContent`;
const dir = "/home/user/echelon-ai-tutor/scripts/game-authoring/data";
const norm = (ex: any) => {
  const m = ex.mode; const lab = new Map((ex.options ?? []).filter((o: any) => typeof o === "object").map((o: any) => [o.id, o.label]));
  let body: any;
  if (m === "rapid-swipe") body = [ex.prompt, !!ex.correctAnswer];
  else if (m === "speed-match") body = [ex.prompt, ex.pairs.map((p: any) => p.left + "=>" + p.right).sort()];
  else if (m === "before-after") body = [ex.prompt, (ex.options ?? []).map(String).sort(), String(ex.correctAnswer)];
  else body = [ex.prompt, [...lab.values()].sort(), lab.get(ex.correctOptionId)];
  return m + JSON.stringify(body);
};
const A = new Set<string>(); const AH = new Set<string>();
const dirH = "/home/user/echelon-ai-tutor/scripts/game-authoring/data_head";
for (const f of readdirSync(dirH).filter(f => f.endsWith(".ts"))) { const d = (await import(pathToFileURL(`${dirH}/${f}`).href)).default; for (const it of buildItems(d, "q").items) AH.add(norm(it.example)); }
for (const f of readdirSync(dir).filter(f => f.endsWith(".ts"))) { const d = (await import(pathToFileURL(`${dir}/${f}`).href)).default; for (const it of buildItems(d, "q").items) A.add(norm(it.example)); }
const excl = new Set<string>(); const c = (x: any) => typeof x === "string" ? excl.add(x) : Array.isArray(x) ? x.forEach(c) : x && typeof x === "object" ? Object.values(x).forEach(c) : 0;
c(JSON.parse(readFileSync(`${SNAP}/engine/releaseExclusions.json`, "utf8")));
const live: any[] = [];
for (const f of readdirSync(`${SNAP}/overlay`).sort()) for (const a of JSON.parse(readFileSync(`${SNAP}/overlay/${f}`, "utf8")).additions ?? []) if (!excl.has(a.example.id)) live.push({ id: a.example.id, course: a.courseKey, src: "overlay:" + f, ex: a.example });
for (const f of readdirSync(`${SNAP}/release-2026-11-12/packages`)) { const d = JSON.parse(readFileSync(`${SNAP}/release-2026-11-12/packages/${f}`, "utf8")); for (const e of (d.examples ?? d.items ?? [])) { const ex = e.example ?? e; if (!excl.has(ex.id)) live.push({ id: ex.id, course: f.replace(".json", ""), src: "base:" + f, ex }); } }
const reviewedExtra = new Set<string>();
for (const l of readFileSync(`${S}/review/units.jsonl`, "utf8").trim().split("\n")) { const u = JSON.parse(l); if (u.sec === "item") reviewedExtra.add(norm(u.row)); }
const never = live.filter(l => !A.has(norm(l.ex)) && !AH.has(norm(l.ex)));
const unrev = never.filter(l => !reviewedExtra.has(norm(l.ex)));
const changed = live.filter(l => !A.has(norm(l.ex)) && AH.has(norm(l.ex)));
console.log({ neverInTables: never.length, neverReviewedByUnitSet: unrev.length, changedByReview: changed.length });
writeFileSync(`${S}/review/unreviewed-live.json`, JSON.stringify(unrev.map(l => ({ id: l.id, course: l.course, src: l.src, ex: l.ex }))));
writeFileSync(`${S}/review/changed-live.json`, JSON.stringify(changed.map(l => ({ itemId: l.id, courseKey: l.course, overlay: l.src }))));

// ---- items fixed by reviewers that come from no table (base bank / overlay-only)
const units = new Map<string, any>(); for (const l of readFileSync(`${S}/review/units.jsonl`, "utf8").trim().split("\n")) { const u = JSON.parse(l); units.set(u.uid, u); }
const fixed = JSON.parse(readFileSync(`${S}/review/base-items.json`, "utf8"));
const byKey = new Map<string, any[]>(); for (const l of live) { const k = norm(l.ex); (byKey.get(k) ?? byKey.set(k, []).get(k)!).push(l); }
const baseFix: any[] = []; const replacements: any[] = []; const seenU = new Set<string>();
for (const f of fixed) { if (seenU.has(f.uid)) continue; seenU.add(f.uid); const u = units.get(f.uid); if (!u) continue; const k = norm(u.row);
  const hits = byKey.get(k) ?? [];
  for (const h of hits) baseFix.push({ itemId: h.id, courseKey: h.course, overlay: h.src, issue: `[${f.verdict}] ${f.note}` });
  replacements.push({ uid: f.uid, verdict: f.verdict, note: f.note, replaces: hits.map(h => ({ itemId: h.id, courseKey: h.course })), fix: f.fix }); }
writeFileSync(`${S}/review/base-fix-ids.json`, JSON.stringify(baseFix));
writeFileSync(`${S}/review/replacement-items.json`, JSON.stringify(replacements));
console.log({ baseFixUnits: seenU.size, baseFixLiveIds: baseFix.length, withFix: replacements.filter(r => r.fix).length, noLiveMatch: replacements.filter(r => !r.replaces.length).length });

const notInTables = live.filter(l => !A.has(norm(l.ex)));
const uniq = new Map<string, any[]>(); for (const l of notInTables) { const k = norm(l.ex); (uniq.get(k) ?? uniq.set(k, []).get(k)!).push(l); }
writeFileSync(`${S}/review/nontable-live.json`, JSON.stringify([...uniq.entries()].map(([k, v]) => ({ k, ex: v[0].ex, ids: v.map(x => ({ id: x.id, course: x.course, src: x.src })) }))));
console.log({ live: live.length, liveNotInTables: notInTables.length, uniqueNotInTables: uniq.size });
