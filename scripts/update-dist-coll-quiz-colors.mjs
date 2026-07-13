/**
 * update-dist-coll-quiz-colors.mjs
 *
 * Updates MODULE_COLORS and MODULE_ICONS in all Ontario water distribution
 * and wastewater collection quiz pages to match the new official module names.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const PAGES_DIR = resolve("/home/ubuntu/echelon-ai-tutor/client/src/pages");

// ─── WATER DISTRIBUTION ──────────────────────────────────────────────────────

const WD_COLORS = `const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "General":          { bg: "#FEF9C3", color: "#A16207" },
  "Support Systems":  { bg: "#DBEAFE", color: "#1D4ED8" },
  "Processes":        { bg: "#DCFCE7", color: "#15803D" },
  "Administration":   { bg: "#EDE9FE", color: "#6D28D9" },
};`;

const WD_ICONS = `const MODULE_ICONS: Record<string, string> = {
  "General":          "📐",
  "Support Systems":  "⚙️",
  "Processes":        "🚰",
  "Administration":   "📋",
};`;

// ─── WASTEWATER COLLECTION ────────────────────────────────────────────────────

const WWC_COLORS = `const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Operate Equipment":                              { bg: "#DBEAFE", color: "#1D4ED8" },
  "Evaluate & Maintain Equipment":                  { bg: "#FEF9C3", color: "#A16207" },
  "Maintain & Restore Collection System":           { bg: "#DCFCE7", color: "#15803D" },
  "Maintain Lift Stations":                         { bg: "#FFEDD5", color: "#C2410C" },
  "Monitor, Evaluate & Adjust Collection System":   { bg: "#CCFBF1", color: "#0F766E" },
  "Security, Safety & Administrative Procedures":   { bg: "#EDE9FE", color: "#6D28D9" },
};`;

const WWC_ICONS = `const MODULE_ICONS: Record<string, string> = {
  "Operate Equipment":                              "🔧",
  "Evaluate & Maintain Equipment":                  "🔩",
  "Maintain & Restore Collection System":           "🔗",
  "Maintain Lift Stations":                         "⬆️",
  "Monitor, Evaluate & Adjust Collection System":   "📊",
  "Security, Safety & Administrative Procedures":   "🦺",
};`;

// ─── FILE LIST ────────────────────────────────────────────────────────────────

const FILES = [
  { file: "Class1WaterDistQuiz.tsx",      colors: WD_COLORS,  icons: WD_ICONS  },
  { file: "Class2WaterDistQuiz.tsx",      colors: WD_COLORS,  icons: WD_ICONS  },
  { file: "Class3WaterDistQuiz.tsx",      colors: WD_COLORS,  icons: WD_ICONS  },
  { file: "Class4WaterDistQuiz.tsx",      colors: WD_COLORS,  icons: WD_ICONS  },
  { file: "Class1WastewaterCollQuiz.tsx", colors: WWC_COLORS, icons: WWC_ICONS },
  { file: "Class2WastewaterCollQuiz.tsx", colors: WWC_COLORS, icons: WWC_ICONS },
  { file: "Class3WastewaterCollQuiz.tsx", colors: WWC_COLORS, icons: WWC_ICONS },
  { file: "Class4WastewaterCollQuiz.tsx", colors: WWC_COLORS, icons: WWC_ICONS },
];

for (const { file, colors, icons } of FILES) {
  const path = resolve(PAGES_DIR, file);
  let content = readFileSync(path, "utf8");

  // Replace MODULE_COLORS block
  content = content.replace(
    /const MODULE_COLORS: Record<string, \{ bg: string; color: string \}> = \{[\s\S]*?\};/,
    colors
  );

  // Replace MODULE_ICONS block
  content = content.replace(
    /const MODULE_ICONS: Record<string, string> = \{[\s\S]*?\};/,
    icons
  );

  writeFileSync(path, content, "utf8");
  console.log(`✅ Updated ${file}`);
}

console.log("\nAll quiz pages updated!");
