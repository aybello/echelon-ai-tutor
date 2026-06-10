import { readFileSync, writeFileSync } from "fs";

const files = [
  "client/src/pages/Admin.tsx",
];

const replacements = [
  // Backgrounds
  [/#0F172A/g, "#FFFFFF"],
  [/#1E293B/g, "#F8FAFC"],
  [/#334155/g, "#E2E8F0"],
  [/rgba\(255,255,255,0\.06\)/g, "rgba(0,0,0,0.07)"],
  [/rgba\(255,255,255,0\.04\)/g, "rgba(0,0,0,0.04)"],
  [/rgba\(255,255,255,0\.03\)/g, "rgba(0,0,0,0.03)"],
  [/rgba\(255,255,255,0\.08\)/g, "rgba(0,0,0,0.06)"],
  // Text colors (light-on-dark → dark-on-light)
  [/color: "#F1F5F9"/g, 'color: "#1E293B"'],
  [/color: "#E2E8F0"/g, 'color: "#334155"'],
  [/color: "#CBD5E1"/g, 'color: "#64748B"'],
  [/color: "#94A3B8"/g, 'color: "#64748B"'],
  // Active tab
  [/"rgba\(255,255,255,0\.06\)" : "#1E293B"/g, '"#EFF6FF" : "#FFFFFF"'],
  [/"#334155" : "transparent"/g, '"#FFFFFF" : "transparent"'],
];

for (const file of files) {
  let content = readFileSync(file, "utf8");
  for (const [from, to] of replacements) {
    content = content.replace(from, to);
  }
  writeFileSync(file, content, "utf8");
  console.log(`✅ Fixed: ${file}`);
}
