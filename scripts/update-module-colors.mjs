/**
 * update-module-colors.mjs
 * 
 * Updates MODULE_COLORS in all Ontario and WPI mock exam pages to match
 * the new WPI content area names set in question_bank_meta.moduleTargets.
 * 
 * New content area names:
 * - Water Treatment: "Treatment Process", "Laboratory Analysis", "Equipment O&M", "Source Water", "Safety & Admin"
 * - Wastewater Treatment: "Equipment Evaluation, Maintenance & Operation", "Treatment Process Evaluation & Adjustment", "Laboratory Analysis", "Safety & Admin"
 * - Water Distribution: "Distribution System Components", "Equipment Installation, O&M & Repair", "Water Quality Monitoring & Lab", "Security, Safety, Admin & Public Interactions"
 * - Wastewater Collection: "Equipment Operation & Maintenance", "Collection System Components", "Lift Station Operation and Maintenance", "Collection System Monitoring & Evaluation", "Safety & Regulations"
 */

import fs from 'fs';
import path from 'path';

const PAGES_DIR = '/home/ubuntu/echelon-ai-tutor/client/src/pages';

// ============================================================
// STANDARD MODULE_COLORS BLOCKS
// ============================================================

const WATER_TREATMENT_COLORS = `const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Treatment Process":    { bg: "#DBEAFE", color: "#1D4ED8" },
  "Laboratory Analysis":  { bg: "#EDE9FE", color: "#6D28D9" },
  "Equipment O&M":        { bg: "#DCFCE7", color: "#15803D" },
  "Source Water":         { bg: "#CCFBF1", color: "#0F766E" },
  "Safety & Admin":       { bg: "#FFEDD5", color: "#C2410C" },
};`;

const WASTEWATER_TREATMENT_COLORS = `const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Equipment Evaluation, Maintenance & Operation": { bg: "#DBEAFE", color: "#1D4ED8" },
  "Treatment Process Evaluation & Adjustment":     { bg: "#DCFCE7", color: "#15803D" },
  "Laboratory Analysis":                           { bg: "#EDE9FE", color: "#6D28D9" },
  "Safety & Admin":                                { bg: "#FEE2E2", color: "#B91C1C" },
};`;

const WATER_DIST_COLORS = `const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Distribution System Components":                { bg: "#DBEAFE", color: "#1D4ED8" },
  "Equipment Installation, O&M & Repair":          { bg: "#DCFCE7", color: "#15803D" },
  "Water Quality Monitoring & Lab":                { bg: "#EDE9FE", color: "#6D28D9" },
  "Security, Safety, Admin & Public Interactions": { bg: "#FFEDD5", color: "#C2410C" },
};`;

const WASTEWATER_COLL_COLORS = `const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Equipment Operation & Maintenance":         { bg: "#DBEAFE", color: "#1D4ED8" },
  "Collection System Components":              { bg: "#DCFCE7", color: "#15803D" },
  "Lift Station Operation and Maintenance":    { bg: "#EDE9FE", color: "#6D28D9" },
  "Collection System Monitoring & Evaluation": { bg: "#CCFBF1", color: "#0F766E" },
  "Safety & Regulations":                      { bg: "#FEE2E2", color: "#B91C1C" },
};`;

// ============================================================
// FILE → COLORS MAPPING
// ============================================================

const FILE_COLORS = {
  // Ontario Water Treatment (Class1 already fixed)
  'Class2WaterMockExam.tsx':  WATER_TREATMENT_COLORS,
  'Class3WaterMockExam.tsx':  WATER_TREATMENT_COLORS,
  'Class4WaterMockExam.tsx':  WATER_TREATMENT_COLORS,

  // Ontario Wastewater Treatment
  'Class1WastewaterMockExam.tsx': WASTEWATER_TREATMENT_COLORS,
  'Class2WastewaterMockExam.tsx': WASTEWATER_TREATMENT_COLORS,
  'Class3WastewaterMockExam.tsx': WASTEWATER_TREATMENT_COLORS,
  'Class4WastewaterMockExam.tsx': WASTEWATER_TREATMENT_COLORS,

  // Ontario Water Distribution
  'Class1WaterDistMockExam.tsx':  WATER_DIST_COLORS,
  'Class2WaterDistMockExam.tsx':  WATER_DIST_COLORS,
  'Class3WaterDistMockExam.tsx':  WATER_DIST_COLORS,
  'Class4WaterDistMockExam.tsx':  WATER_DIST_COLORS,

  // Ontario Wastewater Collection
  'Class1WastewaterCollMockExam.tsx': WASTEWATER_COLL_COLORS,
  'Class2WastewaterCollMockExam.tsx': WASTEWATER_COLL_COLORS,
  'Class3WastewaterCollMockExam.tsx': WASTEWATER_COLL_COLORS,
  'Class4WastewaterCollMockExam.tsx': WASTEWATER_COLL_COLORS,

  // WPI Water Treatment (already has correct colors but let's standardize)
  'WpiClass1WaterMockExam.tsx': WATER_TREATMENT_COLORS,
  'WpiClass2WaterMockExam.tsx': WATER_TREATMENT_COLORS,
  'WpiClass3WaterMockExam.tsx': WATER_TREATMENT_COLORS,
  'WpiClass4WaterMockExam.tsx': WATER_TREATMENT_COLORS,

  // WPI Wastewater Treatment
  'WpiClass1WastewaterMockExam.tsx': WASTEWATER_TREATMENT_COLORS,
  'WpiClass2WastewaterMockExam.tsx': WASTEWATER_TREATMENT_COLORS,
  'WpiClass3WastewaterMockExam.tsx': WASTEWATER_TREATMENT_COLORS,
  'WpiClass4WastewaterMockExam.tsx': WASTEWATER_TREATMENT_COLORS,

  // WPI Water Distribution
  'WpiClass1WaterDistMockExam.tsx': WATER_DIST_COLORS,
  'WpiClass2WaterDistMockExam.tsx': WATER_DIST_COLORS,
  'WpiClass3WaterDistMockExam.tsx': WATER_DIST_COLORS,
  'WpiClass4WaterDistMockExam.tsx': WATER_DIST_COLORS,

  // WPI Wastewater Collection
  'WpiClass1WaterCollMockExam.tsx': WASTEWATER_COLL_COLORS,
  'WpiClass2WaterCollMockExam.tsx': WASTEWATER_COLL_COLORS,
  'WpiClass3WaterCollMockExam.tsx': WASTEWATER_COLL_COLORS,
  'WpiClass4WaterCollMockExam.tsx': WASTEWATER_COLL_COLORS,
};

// ============================================================
// MAIN
// ============================================================

let updated = 0;
let skipped = 0;

for (const [filename, newColors] of Object.entries(FILE_COLORS)) {
  const filePath = path.join(PAGES_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${filename}: not found, skipping`);
    skipped++;
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Match the MODULE_COLORS block: from "const MODULE_COLORS" to the closing "};"
  // This regex matches the entire block including multi-line content
  const colorBlockRegex = /const MODULE_COLORS: Record<string, \{ bg: string; color: string \}> = \{[\s\S]*?\};/;
  
  if (!colorBlockRegex.test(content)) {
    console.log(`⚠️  ${filename}: MODULE_COLORS block not found, skipping`);
    skipped++;
    continue;
  }

  const newContent = content.replace(colorBlockRegex, newColors);
  
  if (newContent === content) {
    console.log(`✓  ${filename}: already up to date`);
    continue;
  }

  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`✅ ${filename}: updated`);
  updated++;
}

console.log(`\nDone: ${updated} updated, ${skipped} skipped`);
