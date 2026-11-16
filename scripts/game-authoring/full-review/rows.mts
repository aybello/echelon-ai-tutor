import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
const S = "/tmp/claude-0/-home-user-echelon-ai-tutor/0e6dc4c6-dfed-5d26-9c2a-f17854a01d3e/scratchpad";
const dir = "/home/user/echelon-ai-tutor/scripts/game-authoring/data";
const rows = new Map<string, any>();
for (const f of readdirSync(dir).filter(f => f.endsWith(".ts")).sort()) {
  const data = (await import(pathToFileURL(`${dir}/${f}`).href)).default;
  for (const sec of ["facts", "boards", "oddSets", "sequences", "relations", "flaws"]) for (const r of data[sec] ?? []) {
    const k = sec + JSON.stringify(r); const e = rows.get(k);
    if (e) { e.files.push(f); continue; }
    rows.set(k, { sec, row: r, files: [f], course: data.courseKey });
  }
}
const all = [...rows.values()];
const by: Record<string, number> = {}; for (const r of all) by[r.sec] = (by[r.sec] ?? 0) + 1;
// non-table items: base packages and overlay-only
const extra: any[] = [];
for (const l of readFileSync(`${S}/all-unique.jsonl`, "utf8").trim().split("\n")) { const v = JSON.parse(l); if (!v.srcs[0].startsWith("table:")) extra.push({ sec: "item", row: v.ex, files: v.srcs.slice(0, 6), course: v.courses.slice(0, 6).join(",") }); }
// group by course family so a reviewer sees one topic area at a time
const fam = (c: string) => c.replace(/^wpi-/, "").replace(/^class\d-/, "").replace(/^s-/, "");
const units = [...all, ...extra].sort((a, b) => (fam(a.course) + a.sec).localeCompare(fam(b.course) + b.sec));
units.forEach((u, i) => u.uid = `U${String(i).padStart(5, "0")}`);
mkdirSync(`${S}/review/in`, { recursive: true });
const CH = 300; let n = 0;
for (let i = 0; i < units.length; i += CH) { writeFileSync(`${S}/review/in/chunk-${String(n).padStart(3, "0")}.jsonl`, units.slice(i, i + CH).map(u => JSON.stringify(u)).join("\n") + "\n"); n++; }
writeFileSync(`${S}/review/units.jsonl`, units.map(u => JSON.stringify(u)).join("\n") + "\n");
console.log({ tableRows: all.length, by, extra: extra.length, total: units.length, chunks: n });
