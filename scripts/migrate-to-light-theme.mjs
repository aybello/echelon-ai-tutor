/**
 * migrate-to-light-theme.mjs
 * Replaces hardcoded dark inline style values with light equivalents across all TSX/TS files.
 * Safe to run multiple times (idempotent after first run).
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const ROOT = new URL("../client/src", import.meta.url).pathname;

// ── Replacement map ───────────────────────────────────────────────────────────
// Each entry: [regex, replacement]
// Order matters — more specific patterns first.
const REPLACEMENTS = [
  // ── Page / section backgrounds ─────────────────────────────────────────────
  // Full-page dark bg → white
  [/"#0F172A"/g,                                    '"#FFFFFF"'],
  // Card / panel dark bg → light grey
  [/"#1E293B"/g,                                    '"#F8FAFC"'],
  // Slightly lighter dark → near-white
  [/"#0D1B2A"/g,                                    '"#F1F5F9"'],
  [/"#111827"/g,                                    '"#F9FAFB"'],

  // ── Dark gradient backgrounds → light gradient ─────────────────────────────
  [/linear-gradient\(135deg,\s*#0F172A[^"')]+\)/g,
    "linear-gradient(135deg, #EFF6FF 0%, #E0F2FE 100%)"],

  // ── Text colors ────────────────────────────────────────────────────────────
  // White / near-white text → dark navy (main body text)
  [/"#F1F5F9"/g,                                    '"#1E293B"'],
  [/"#F8FAFC"/g,                                    '"#1E293B"'],
  [/"#E2E8F0"/g,                                    '"#CBD5E1"'],
  // Muted light text → muted dark
  [/"#94A3B8"/g,                                    '"#64748B"'],
  [/"#CBD5E1"/g,                                    '"#94A3B8"'],
  [/"#64748B"/g,                                    '"#475569"'],
  [/"#475569"/g,                                    '"#334155"'],
  // Slate-400 → slate-500
  [/"#A0AEC0"/g,                                    '"#64748B"'],

  // ── Borders ────────────────────────────────────────────────────────────────
  // White-alpha borders → light grey borders
  [/rgba\(255,\s*255,\s*255,\s*0\.06\)/g,           "rgba(0,0,0,0.07)"],
  [/rgba\(255,\s*255,\s*255,\s*0\.08\)/g,           "rgba(0,0,0,0.08)"],
  [/rgba\(255,\s*255,\s*255,\s*0\.1\)/g,            "rgba(0,0,0,0.09)"],
  [/rgba\(255,\s*255,\s*255,\s*0\.12\)/g,           "rgba(0,0,0,0.10)"],
  [/rgba\(255,\s*255,\s*255,\s*0\.15\)/g,           "rgba(0,0,0,0.12)"],
  [/rgba\(255,\s*255,\s*255,\s*0\.2\)/g,            "rgba(0,0,0,0.14)"],
  [/rgba\(255,\s*255,\s*255,\s*0\.04\)/g,           "rgba(0,0,0,0.04)"],

  // ── Hover / active row backgrounds ─────────────────────────────────────────
  [/rgba\(255,\s*255,\s*255,\s*0\.04\)/g,           "rgba(0,0,0,0.03)"],

  // ── "#334155" (slate-700 used as dark card bg) → light ────────────────────
  [/"#334155"/g,                                    '"#E2E8F0"'],

  // ── "#1D4ED8" stays (primary blue — already correct) ──────────────────────
  // ── "#0F766E" stays (teal — already correct) ──────────────────────────────
];

// Files to skip (don't touch question banks or test files)
const SKIP_DIRS = ["questions", "node_modules", "dist", ".git"];
const SKIP_FILES = [".test.ts", ".test.tsx", "schema.ts"];

let totalFiles = 0;
let changedFiles = 0;

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (!SKIP_DIRS.some(s => entry.includes(s))) walk(full);
    } else if ([".tsx", ".ts"].includes(extname(entry))) {
      if (SKIP_FILES.some(s => entry.endsWith(s))) continue;
      processFile(full);
    }
  }
}

function processFile(path) {
  totalFiles++;
  let src = readFileSync(path, "utf8");
  let modified = src;
  for (const [pattern, replacement] of REPLACEMENTS) {
    modified = modified.replace(pattern, replacement);
  }
  if (modified !== src) {
    writeFileSync(path, modified, "utf8");
    changedFiles++;
    console.log(`  ✓ ${path.replace(ROOT + "/", "")}`);
  }
}

console.log("🎨 Migrating to light theme...\n");
walk(ROOT);
console.log(`\nDone. Modified ${changedFiles} / ${totalFiles} files.`);
