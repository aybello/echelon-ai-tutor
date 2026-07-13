/**
 * update-module-targets.mjs
 * 
 * Updates question_bank_meta.moduleTargets for all 32 banks with official
 * WPI/ABC exam blueprint content area weights extracted from the NTK PDFs.
 * 
 * Sources:
 * - Water Treatment C1-C4: wt_c1-4_blueprint.pdf
 * - Water Distribution C1-C4: wd_c1-4_blueprint.pdf
 * - Collection C1-C4: coll_c1-4_blueprint.pdf
 * - Wastewater Treatment C1-C4: wwt_c1-4_blueprint.pdf
 * 
 * For WPI banks: module names match actual DB module labels
 * For Ontario banks: WPI content area names used (displayed in UI; sampling falls back to random)
 */

import mysql from 'mysql2/promise';

// ============================================================
// OFFICIAL WPI BLUEPRINT CONTENT AREA WEIGHTS
// ============================================================

// --- WATER TREATMENT (WT) ---
// DB module labels for wpi-class1-water: Treatment Process, Equipment O&M, Laboratory Analysis, Source Water, Safety & Admin
const WT_C1 = {
  "Treatment Process":    31,
  "Laboratory Analysis":  16,
  "Equipment O&M":        26,
  "Source Water":         15,
  "Safety & Admin":       12,
};
const WT_C2 = {
  "Treatment Process":    32,
  "Laboratory Analysis":  16,
  "Equipment O&M":        24,
  "Source Water":         15,
  "Safety & Admin":       13,
};
const WT_C3 = {
  "Treatment Process":    33,
  "Laboratory Analysis":  16,
  "Equipment O&M":        23,
  "Source Water":         15,
  "Safety & Admin":       13,
};
const WT_C4 = {
  "Treatment Process":    35,
  "Laboratory Analysis":  17,
  "Equipment O&M":        20,
  "Source Water":         14,
  "Safety & Admin":       14,
};

// --- WATER DISTRIBUTION (WD) ---
// DB module labels for wpi-class1-water-dist: Distribution System Components, Equipment Installation O&M & Repair,
//   Water Quality Monitoring & Lab, Security Safety Admin & Public Interactions
// Note: WD has 4 content areas
const WD_C1 = {
  "Distribution System Components":                35,
  "Equipment Installation, O&M & Repair":          30,
  "Water Quality Monitoring & Lab":                15,
  "Security, Safety, Admin & Public Interactions": 20,
};
const WD_C2 = {
  "Distribution System Components":                32,
  "Equipment Installation, O&M & Repair":          28,
  "Water Quality Monitoring & Lab":                20,
  "Security, Safety, Admin & Public Interactions": 20,
};
const WD_C3 = {
  "Distribution System Components":                23,
  "Equipment Installation, O&M & Repair":          25,
  "Water Quality Monitoring & Lab":                25,
  "Security, Safety, Admin & Public Interactions": 27,
};
const WD_C4 = {
  "Distribution System Components":                23,
  "Equipment Installation, O&M & Repair":          21,
  "Water Quality Monitoring & Lab":                30,
  "Security, Safety, Admin & Public Interactions": 26,
};

// --- COLLECTION (COLL) ---
// DB module labels for wpi-class1-wastewater-coll: Equipment Operation & Maintenance, Collection System Components,
//   Math & Calculations, Safety & Regulations, Collection System Maintenance, Environmental & Public Health
// Blueprint has 5 content areas:
const COLL_C1 = {
  "Equipment Operation & Maintenance":             27,
  "Collection System Components":                  27,
  "Lift Station Operation and Maintenance":        18,
  "Collection System Monitoring & Evaluation":     14,
  "Safety & Regulations":                          14,
};
const COLL_C2 = {
  "Equipment Operation & Maintenance":             25,
  "Collection System Components":                  25,
  "Lift Station Operation and Maintenance":        18,
  "Collection System Monitoring & Evaluation":     16,
  "Safety & Regulations":                          16,
};
const COLL_C3 = {
  "Equipment Operation & Maintenance":             23,
  "Collection System Components":                  24,
  "Lift Station Operation and Maintenance":        18,
  "Collection System Monitoring & Evaluation":     18,
  "Safety & Regulations":                          17,
};
const COLL_C4 = {
  "Equipment Operation & Maintenance":             23,
  "Collection System Components":                  23,
  "Lift Station Operation and Maintenance":        16,
  "Collection System Monitoring & Evaluation":     20,
  "Safety & Regulations":                          18,
};

// --- WASTEWATER TREATMENT (WWT) ---
// DB module labels for wpi-class1-wastewater: Primary & Secondary Treatment, Safety Regulations & Admin,
//   Wastewater Collection Systems, Laboratory & Monitoring, Solids Handling & Biosolids
// Blueprint has 4 content areas:
const WWT_C1 = {
  "Equipment Evaluation, Maintenance & Operation": 39,
  "Treatment Process Evaluation & Adjustment":     38,
  "Laboratory Analysis":                           10,
  "Safety & Admin":                                13,
};
const WWT_C2 = {
  "Equipment Evaluation, Maintenance & Operation": 37,
  "Treatment Process Evaluation & Adjustment":     40,
  "Laboratory Analysis":                           10,
  "Safety & Admin":                                13,
};
const WWT_C3 = {
  "Equipment Evaluation, Maintenance & Operation": 30,
  "Treatment Process Evaluation & Adjustment":     40,
  "Laboratory Analysis":                           15,
  "Safety & Admin":                                15,
};
const WWT_C4 = {
  "Equipment Evaluation, Maintenance & Operation": 28,
  "Treatment Process Evaluation & Adjustment":     42,
  "Laboratory Analysis":                           15,
  "Safety & Admin":                                15,
};

// ============================================================
// BANK → MODULE_TARGETS MAPPING
// ============================================================
// For WPI banks: use module names that match DB module labels
// For Ontario banks: use official WPI content area names (displayed in UI)
// Note: Ontario banks have single-module questions, so sampling falls back to random
//       but the official blueprint breakdown is shown in the UI

const BANK_TARGETS = {
  // ---- Ontario Water Treatment ----
  "class1-water": WT_C1,
  "class2-water": WT_C2,
  "class3-water": WT_C3,
  "class4-water": WT_C4,

  // ---- Ontario Wastewater Treatment ----
  "class1-wastewater": WWT_C1,
  "class2-wastewater": WWT_C2,
  "class3-wastewater": WWT_C3,
  "class4-wastewater": WWT_C4,

  // ---- Ontario Water Distribution ----
  "class1-water-dist": WD_C1,
  "class2-water-dist": WD_C2,
  "class3-water-dist": WD_C3,
  "class4-water-dist": WD_C4,

  // ---- Ontario Wastewater Collection ----
  "class1-wastewater-coll": COLL_C1,
  "class2-wastewater-coll": COLL_C2,
  "class3-wastewater-coll": COLL_C3,
  "class4-wastewater-coll": COLL_C4,

  // ---- WPI Water Treatment ----
  // DB modules: Treatment Process, Equipment O&M, Laboratory Analysis, Source Water, Safety & Admin
  "wpi-class1-water": WT_C1,
  "wpi-class2-water": WT_C2,
  "wpi-class3-water": WT_C3,
  "wpi-class4-water": WT_C4,

  // ---- WPI Wastewater Treatment ----
  // DB modules: Primary & Secondary Treatment, Safety Regulations & Admin, etc.
  // Use WWT blueprint content areas (displayed in UI; DB modules don't match exactly)
  "wpi-class1-wastewater": WWT_C1,
  "wpi-class2-wastewater": WWT_C2,
  "wpi-class3-wastewater": WWT_C3,
  "wpi-class4-wastewater": WWT_C4,

  // ---- WPI Water Distribution ----
  // DB modules: Distribution System Components, Equipment Installation O&M & Repair,
  //   Water Quality Monitoring & Lab, Security Safety Admin & Public Interactions
  "wpi-class1-water-dist": WD_C1,
  "wpi-class2-water-dist": WD_C2,
  "wpi-class3-water-dist": WD_C3,
  "wpi-class4-water-dist": WD_C4,

  // ---- WPI Wastewater Collection ----
  // DB modules: Equipment Operation & Maintenance, Collection System Components, etc.
  "wpi-class1-wastewater-coll": COLL_C1,
  "wpi-class2-wastewater-coll": COLL_C2,
  "wpi-class3-wastewater-coll": COLL_C3,
  "wpi-class4-wastewater-coll": COLL_C4,
};

// ============================================================
// MAIN
// ============================================================

const conn = await mysql.createConnection(process.env.DATABASE_URL);

let updated = 0;
let skipped = 0;

for (const [bankKey, targets] of Object.entries(BANK_TARGETS)) {
  const total = Object.values(targets).reduce((a, b) => a + b, 0);
  if (total !== 100) {
    console.error(`❌ ${bankKey}: targets sum to ${total}, not 100!`);
    process.exit(1);
  }

  const [rows] = await conn.execute(
    'SELECT id FROM question_bank_meta WHERE bankKey = ?',
    [bankKey]
  );

  if (rows.length === 0) {
    console.log(`⚠️  ${bankKey}: not found in question_bank_meta, skipping`);
    skipped++;
    continue;
  }

  await conn.execute(
    'UPDATE question_bank_meta SET moduleTargets = ? WHERE bankKey = ?',
    [JSON.stringify(targets), bankKey]
  );

  console.log(`✅ ${bankKey}: updated (${Object.keys(targets).length} content areas, sum=${total})`);
  updated++;
}

await conn.end();
console.log(`\nDone: ${updated} updated, ${skipped} skipped`);
