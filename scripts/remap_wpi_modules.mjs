/**
 * remap_wpi_modules.mjs
 *
 * Remaps all WPI question bank module names to align with the official
 * WPI 2025 Need-to-Know (NTK) content areas.
 *
 * Official NTK content areas by stream:
 *
 * WATER TREATMENT (5 areas):
 *   Treatment Process | Laboratory Analysis | Equipment Operation & Maintenance
 *   Source Water Characteristics | Security, Safety & Administrative Procedures
 *
 * WATER DISTRIBUTION (4 areas):
 *   Distribution System Components | Equipment Installation, O&M & Repair
 *   Water Quality Monitoring & Laboratory Analysis | Security, Safety, Admin & Public Interactions
 *
 * WASTEWATER TREATMENT (4 areas):
 *   Treatment Process | Equipment Evaluation, Maintenance & Operation
 *   Laboratory Analysis | Security, Safety & Administrative Procedures
 *
 * WASTEWATER COLLECTION (5 areas):
 *   Equipment Operation, Evaluation & Maintenance | Collection System O&M & Restoration
 *   Lift Station Operation & Maintenance | Collection System Monitoring, Evaluation & Adjustment
 *   Security, Safety & Administrative Procedures
 */

import { createConnection } from "mysql2/promise";
const db = await createConnection(process.env.DATABASE_URL);

// Helper: run a batch of UPDATE statements
async function remap(bankKey, mappings) {
  let updated = 0;
  for (const [oldModule, newModule] of mappings) {
    const [result] = await db.query(
      "UPDATE questions SET module = ? WHERE bankKey = ? AND module = ?",
      [newModule, bankKey, oldModule]
    );
    if (result.affectedRows > 0) {
      console.log(`  ${bankKey}: "${oldModule}" → "${newModule}" (${result.affectedRows} rows)`);
      updated += result.affectedRows;
    }
  }
  return updated;
}

// ── WATER TREATMENT ───────────────────────────────────────────────────────────
// NTK areas: Treatment Process | Laboratory Analysis | Equipment O&M
//            Source Water Characteristics | Security, Safety & Admin

console.log("\n=== Water Treatment ===");

// Class I — current: Chemical Feed, Disinfection, Equipment O&M, Hydraulics,
//            Laboratory Analysis, Safety & Admin, Source Water, Treatment Process, Water Quality
await remap("wpi-class1-water", [
  ["Chemical Feed",       "Treatment Process"],
  ["Disinfection",        "Treatment Process"],
  ["Hydraulics",          "Treatment Process"],
  ["Water Quality",       "Laboratory Analysis"],
  ["Source Water",        "Source Water Characteristics"],
  ["Safety & Admin",      "Security, Safety & Administrative Procedures"],
  // Equipment O&M and Laboratory Analysis already match — no remap needed
  ["Treatment Process",   "Treatment Process"], // already correct
]);

// Class II — current: Advanced Laboratory & Monitoring, Advanced Treatment Processes,
//  Chemical Treatment, Coagulation, Corrosion Control, Disinfection, Distribution,
//  Filtration, Hydraulics, Management/Regulations/Safety, Regulations, Sedimentation,
//  Sludge Management, Source Water & Environmental, System Design & Engineering
await remap("wpi-class2-water", [
  ["Advanced Treatment Processes",      "Treatment Process"],
  ["Chemical Treatment",                "Treatment Process"],
  ["Coagulation",                       "Treatment Process"],
  ["Disinfection",                      "Treatment Process"],
  ["Filtration",                        "Treatment Process"],
  ["Sedimentation",                     "Treatment Process"],
  ["Hydraulics",                        "Treatment Process"],
  ["Corrosion Control",                 "Treatment Process"],
  ["Distribution",                      "Equipment Operation & Maintenance"],
  ["Sludge Management",                 "Equipment Operation & Maintenance"],
  ["System Design & Engineering",       "Equipment Operation & Maintenance"],
  ["Advanced Laboratory & Monitoring",  "Laboratory Analysis"],
  ["Source Water & Environmental",      "Source Water Characteristics"],
  ["Management, Regulations & Safety",  "Security, Safety & Administrative Procedures"],
  ["Regulations",                       "Security, Safety & Administrative Procedures"],
]);

// Class III — current: Advanced Treatment & Disinfection, Chemical Treatment, Coagulation,
//  Corrosion Control, Disinfection, Distribution System Management, Filtration,
//  Filtration & Membrane Systems, Hydraulics, Process Control & Optimization,
//  Regulations, Regulatory Compliance & QMS, Sedimentation
await remap("wpi-class3-water", [
  ["Advanced Treatment & Disinfection",  "Treatment Process"],
  ["Chemical Treatment",                 "Treatment Process"],
  ["Coagulation",                        "Treatment Process"],
  ["Disinfection",                       "Treatment Process"],
  ["Filtration",                         "Treatment Process"],
  ["Filtration & Membrane Systems",      "Treatment Process"],
  ["Sedimentation",                      "Treatment Process"],
  ["Hydraulics",                         "Treatment Process"],
  ["Corrosion Control",                  "Treatment Process"],
  ["Process Control & Optimization",     "Treatment Process"],
  ["Distribution System Management",     "Equipment Operation & Maintenance"],
  ["Regulations",                        "Security, Safety & Administrative Procedures"],
  ["Regulatory Compliance & QMS",        "Security, Safety & Administrative Procedures"],
  // Source Water Characteristics — Class III has no explicit source water module; none to remap
]);

// Class IV — current: Advanced Process Control, Advanced Water Quality, Chemical Treatment,
//  Coagulation, Corrosion Control, Disinfection, Emergency Response & Contingency Planning,
//  Filtration, Hydraulics, Operations, Plant Management & Leadership, Regulations,
//  Regulatory Compliance & Reporting, Sedimentation, Sludge Management,
//  Source Water Protection
await remap("wpi-class4-water", [
  ["Advanced Process Control",                 "Treatment Process"],
  ["Chemical Treatment",                       "Treatment Process"],
  ["Coagulation",                              "Treatment Process"],
  ["Disinfection",                             "Treatment Process"],
  ["Filtration",                               "Treatment Process"],
  ["Sedimentation",                            "Treatment Process"],
  ["Hydraulics",                               "Treatment Process"],
  ["Corrosion Control",                        "Treatment Process"],
  ["Operations",                               "Treatment Process"],
  ["Advanced Water Quality",                   "Laboratory Analysis"],
  ["Sludge Management",                        "Equipment Operation & Maintenance"],
  ["Source Water Protection",                  "Source Water Characteristics"],
  ["Emergency Response & Contingency Planning","Security, Safety & Administrative Procedures"],
  ["Plant Management & Leadership",            "Security, Safety & Administrative Procedures"],
  ["Regulations",                              "Security, Safety & Administrative Procedures"],
  ["Regulatory Compliance & Reporting",        "Security, Safety & Administrative Procedures"],
]);

// ── WATER DISTRIBUTION ────────────────────────────────────────────────────────
// NTK areas: Distribution System Components | Equipment Installation, O&M & Repair
//            Water Quality Monitoring & Laboratory Analysis
//            Security, Safety, Admin & Public Interactions
// Note: Our 8 modules map to 4 NTK areas — consolidate sub-topics

console.log("\n=== Water Distribution ===");

// All 4 classes have the same 8 module names — consolidate to 4 NTK areas
for (const cls of ["wpi-class1-water-dist","wpi-class2-water-dist","wpi-class3-water-dist","wpi-class4-water-dist"]) {
  await remap(cls, [
    // Distribution System Components stays as-is (already matches NTK)
    // Equipment Installation, O&M & Repair stays as-is
    // Water Quality Monitoring & Lab → rename to match NTK exactly
    ["Water Quality Monitoring & Lab",              "Water Quality Monitoring & Laboratory Analysis"],
    // Security, Safety, Admin & Public Interactions stays as-is
    // Sub-topics to fold into Distribution System Components:
    ["Hydraulics & Pressure Management",            "Distribution System Components"],
    ["Cross-Connection Control & Backflow",         "Distribution System Components"],
    // Sub-topics to fold into Equipment Installation, O&M & Repair:
    ["Disinfection & Water Treatment",              "Equipment Installation, O&M & Repair"],
    // Sub-topics to fold into Security, Safety, Admin & Public Interactions:
    ["Regulations & Compliance",                    "Security, Safety, Admin & Public Interactions"],
  ]);
}

// ── WASTEWATER TREATMENT ──────────────────────────────────────────────────────
// NTK areas: Treatment Process | Equipment Evaluation, Maintenance & Operation
//            Laboratory Analysis | Security, Safety & Administrative Procedures

console.log("\n=== Wastewater Treatment ===");

// Class I — current: Activated Sludge, Biosolids, Disinfection, Hydraulics,
//  Laboratory & Monitoring, Nutrient Removal, Operations, Primary & Secondary Treatment,
//  Primary Treatment, Regulations, Safety/Regulations/Admin, Secondary Treatment,
//  Sludge Treatment, Solids Handling & Biosolids, Wastewater Collection Systems
await remap("wpi-class1-wastewater", [
  ["Activated Sludge",              "Treatment Process"],
  ["Disinfection",                  "Treatment Process"],
  ["Hydraulics",                    "Treatment Process"],
  ["Nutrient Removal",              "Treatment Process"],
  ["Operations",                    "Treatment Process"],
  ["Primary & Secondary Treatment", "Treatment Process"],
  ["Primary Treatment",             "Treatment Process"],
  ["Secondary Treatment",           "Treatment Process"],
  ["Biosolids",                     "Equipment Evaluation, Maintenance & Operation"],
  ["Sludge Treatment",              "Equipment Evaluation, Maintenance & Operation"],
  ["Solids Handling & Biosolids",   "Equipment Evaluation, Maintenance & Operation"],
  ["Wastewater Collection Systems", "Equipment Evaluation, Maintenance & Operation"],
  ["Laboratory & Monitoring",       "Laboratory Analysis"],
  ["Regulations",                   "Security, Safety & Administrative Procedures"],
  ["Safety, Regulations & Admin",   "Security, Safety & Administrative Procedures"],
]);

// Class II — current: Activated Sludge, Advanced Treatment, Advanced Treatment & Effluent Quality,
//  Biosolids Management, Disinfection, Hydraulics, Nutrient Removal, Operations, Process Control,
//  Regulations, Safety & Regulations, Safety/Regulations/Administration, Secondary Treatment,
//  Secondary Treatment Processes, Sludge Treatment
await remap("wpi-class2-wastewater", [
  ["Activated Sludge",                      "Treatment Process"],
  ["Advanced Treatment",                    "Treatment Process"],
  ["Advanced Treatment & Effluent Quality", "Treatment Process"],
  ["Disinfection",                          "Treatment Process"],
  ["Hydraulics",                            "Treatment Process"],
  ["Nutrient Removal",                      "Treatment Process"],
  ["Operations",                            "Treatment Process"],
  ["Process Control",                       "Treatment Process"],
  ["Secondary Treatment",                   "Treatment Process"],
  ["Secondary Treatment Processes",         "Treatment Process"],
  ["Biosolids Management",                  "Equipment Evaluation, Maintenance & Operation"],
  ["Sludge Treatment",                      "Equipment Evaluation, Maintenance & Operation"],
  ["Regulations",                           "Security, Safety & Administrative Procedures"],
  ["Safety & Regulations",                  "Security, Safety & Administrative Procedures"],
  ["Safety, Regulations & Administration",  "Security, Safety & Administrative Procedures"],
]);

// Class III — current: Activated Sludge, Advanced Biological Treatment, Advanced Biosolids Management,
//  Advanced Process Control & Troubleshooting, Biological Nutrient Removal, Biosolids, Disinfection,
//  Health/Safety/Environmental Management, Hydraulics, Industrial Pretreatment & Toxicity,
//  Membrane Bioreactors & Advanced Processes, Nutrient Removal, Operations, Primary Treatment,
//  Regulations, Regulatory Compliance & Reporting, Secondary Treatment, Sludge Treatment
await remap("wpi-class3-wastewater", [
  ["Activated Sludge",                          "Treatment Process"],
  ["Advanced Biological Treatment",             "Treatment Process"],
  ["Advanced Process Control & Troubleshooting","Treatment Process"],
  ["Biological Nutrient Removal",               "Treatment Process"],
  ["Disinfection",                              "Treatment Process"],
  ["Hydraulics",                                "Treatment Process"],
  ["Industrial Pretreatment & Toxicity",        "Treatment Process"],
  ["Membrane Bioreactors & Advanced Processes", "Treatment Process"],
  ["Nutrient Removal",                          "Treatment Process"],
  ["Operations",                                "Treatment Process"],
  ["Primary Treatment",                         "Treatment Process"],
  ["Secondary Treatment",                       "Treatment Process"],
  ["Advanced Biosolids Management",             "Equipment Evaluation, Maintenance & Operation"],
  ["Biosolids",                                 "Equipment Evaluation, Maintenance & Operation"],
  ["Sludge Treatment",                          "Equipment Evaluation, Maintenance & Operation"],
  ["Health, Safety & Environmental Management", "Security, Safety & Administrative Procedures"],
  ["Regulations",                               "Security, Safety & Administrative Procedures"],
  ["Regulatory Compliance & Reporting",         "Security, Safety & Administrative Procedures"],
]);

// Class IV — current: Activated Sludge, Advanced Nutrient Removal & Resource Recovery,
//  Advanced Process Control & Optimization, Biosolids, Disinfection, Emergency Response & Resilience,
//  Emerging Technologies & Innovation, Health/Safety/Environmental Stewardship, Hydraulics,
//  Nutrient Removal, Operations, Plant Management/Asset Management/Leadership, Primary Treatment,
//  Regulations, Regulatory Compliance/Reporting/Environmental Management, Secondary Treatment, Sludge Treatment
await remap("wpi-class4-wastewater", [
  ["Activated Sludge",                                          "Treatment Process"],
  ["Advanced Nutrient Removal & Resource Recovery",             "Treatment Process"],
  ["Advanced Process Control & Optimization",                   "Treatment Process"],
  ["Disinfection",                                              "Treatment Process"],
  ["Emerging Technologies & Innovation",                        "Treatment Process"],
  ["Hydraulics",                                                "Treatment Process"],
  ["Nutrient Removal",                                          "Treatment Process"],
  ["Operations",                                                "Treatment Process"],
  ["Primary Treatment",                                         "Treatment Process"],
  ["Secondary Treatment",                                       "Treatment Process"],
  ["Biosolids",                                                 "Equipment Evaluation, Maintenance & Operation"],
  ["Emergency Response & Resilience Planning",                  "Equipment Evaluation, Maintenance & Operation"],
  ["Sludge Treatment",                                          "Equipment Evaluation, Maintenance & Operation"],
  ["Health, Safety & Environmental Stewardship",                "Security, Safety & Administrative Procedures"],
  ["Plant Management, Asset Management & Leadership",           "Security, Safety & Administrative Procedures"],
  ["Regulations",                                               "Security, Safety & Administrative Procedures"],
  ["Regulatory Compliance, Reporting & Environmental Management","Security, Safety & Administrative Procedures"],
]);

// ── WASTEWATER COLLECTION ─────────────────────────────────────────────────────
// NTK areas: Equipment Operation, Evaluation & Maintenance
//            Collection System O&M & Restoration
//            Lift Station Operation & Maintenance
//            Collection System Monitoring, Evaluation & Adjustment
//            Security, Safety & Administrative Procedures

console.log("\n=== Wastewater Collection ===");

// Class I — current: Collection System Components, Collection System Maintenance,
//  Environmental & Public Health, Equipment Operation & Maintenance,
//  Math & Calculations, Safety & Regulations
await remap("wpi-class1-wastewater-coll", [
  ["Equipment Operation & Maintenance",  "Equipment Operation, Evaluation & Maintenance"],
  ["Collection System Components",       "Collection System O&M & Restoration"],
  ["Collection System Maintenance",      "Collection System O&M & Restoration"],
  ["Math & Calculations",                "Collection System Monitoring, Evaluation & Adjustment"],
  ["Environmental & Public Health",      "Collection System Monitoring, Evaluation & Adjustment"],
  ["Safety & Regulations",               "Security, Safety & Administrative Procedures"],
]);

// Class II — current: Advanced Collection System Design, Collection System Maintenance,
//  Hydraulics & Flow Analysis, Intermediate Lift Station Operations, Lift Station Operations,
//  Regulations & Compliance, Regulatory Compliance & Reporting, Safety & Confined Space,
//  System Design & Engineering, System Maintenance & Rehabilitation, Water Quality & Environmental
await remap("wpi-class2-wastewater-coll", [
  ["Advanced Collection System Design",     "Collection System O&M & Restoration"],
  ["Collection System Maintenance",         "Collection System O&M & Restoration"],
  ["System Design & Engineering",           "Collection System O&M & Restoration"],
  ["System Maintenance & Rehabilitation",   "Collection System O&M & Restoration"],
  ["Intermediate Lift Station Operations",  "Lift Station Operation & Maintenance"],
  ["Lift Station Operations",               "Lift Station Operation & Maintenance"],
  ["Hydraulics & Flow Analysis",            "Collection System Monitoring, Evaluation & Adjustment"],
  ["Water Quality & Environmental",         "Collection System Monitoring, Evaluation & Adjustment"],
  ["Regulations & Compliance",              "Security, Safety & Administrative Procedures"],
  ["Regulatory Compliance & Reporting",     "Security, Safety & Administrative Procedures"],
  ["Safety & Confined Space",               "Security, Safety & Administrative Procedures"],
]);

// Class III — current: Advanced Collection System Design, Advanced Maintenance Management,
//  Advanced Pump Station Engineering, Collection System Maintenance, Complex System Operations & SCADA,
//  Hydraulics & Flow Analysis, Leadership/Safety/Regulatory Management, Lift Station Operations,
//  Regulations & Compliance, Safety & Confined Space, System Design & Engineering,
//  System Hydraulic Modelling, Water Quality & Environmental
await remap("wpi-class3-wastewater-coll", [
  ["Advanced Collection System Design",       "Collection System O&M & Restoration"],
  ["Collection System Maintenance",           "Collection System O&M & Restoration"],
  ["System Design & Engineering",             "Collection System O&M & Restoration"],
  ["Advanced Maintenance Management",         "Equipment Operation, Evaluation & Maintenance"],
  ["Advanced Pump Station Engineering",       "Equipment Operation, Evaluation & Maintenance"],
  ["Complex System Operations & SCADA",       "Equipment Operation, Evaluation & Maintenance"],
  ["Lift Station Operations",                 "Lift Station Operation & Maintenance"],
  ["Hydraulics & Flow Analysis",              "Collection System Monitoring, Evaluation & Adjustment"],
  ["System Hydraulic Modelling",              "Collection System Monitoring, Evaluation & Adjustment"],
  ["Water Quality & Environmental",           "Collection System Monitoring, Evaluation & Adjustment"],
  ["Leadership, Safety & Regulatory Management","Security, Safety & Administrative Procedures"],
  ["Regulations & Compliance",                "Security, Safety & Administrative Procedures"],
  ["Safety & Confined Space",                 "Security, Safety & Administrative Procedures"],
]);

// Class IV — current: Advanced Collection System Design, Advanced Engineering & Design,
//  Advanced Regulatory & Environmental Management, Collection System Maintenance,
//  Emerging Technologies & Innovation, Hydraulics & Flow Analysis, Lift Station Operations,
//  Regulations & Compliance, Safety & Confined Space, System Design & Engineering,
//  System Planning & Capital Improvement, Utility Management & Leadership, Water Quality & Environmental
await remap("wpi-class4-wastewater-coll", [
  ["Advanced Collection System Design",           "Collection System O&M & Restoration"],
  ["Advanced Engineering & Design",               "Collection System O&M & Restoration"],
  ["Collection System Maintenance",               "Collection System O&M & Restoration"],
  ["System Design & Engineering",                 "Collection System O&M & Restoration"],
  ["System Planning & Capital Improvement",       "Collection System O&M & Restoration"],
  ["Emerging Technologies & Innovation",          "Equipment Operation, Evaluation & Maintenance"],
  ["Lift Station Operations",                     "Lift Station Operation & Maintenance"],
  ["Hydraulics & Flow Analysis",                  "Collection System Monitoring, Evaluation & Adjustment"],
  ["Water Quality & Environmental",               "Collection System Monitoring, Evaluation & Adjustment"],
  ["Advanced Regulatory & Environmental Management","Security, Safety & Administrative Procedures"],
  ["Regulations & Compliance",                    "Security, Safety & Administrative Procedures"],
  ["Safety & Confined Space",                     "Security, Safety & Administrative Procedures"],
  ["Utility Management & Leadership",             "Security, Safety & Administrative Procedures"],
]);

// ── Verification ─────────────────────────────────────────────────────────────
console.log("\n=== Final module counts per bank ===");
const allBanks = [
  'wpi-class1-water', 'wpi-class2-water', 'wpi-class3-water', 'wpi-class4-water',
  'wpi-class1-wastewater', 'wpi-class2-wastewater', 'wpi-class3-wastewater', 'wpi-class4-wastewater',
  'wpi-class1-water-dist', 'wpi-class2-water-dist', 'wpi-class3-water-dist', 'wpi-class4-water-dist',
  'wpi-class1-wastewater-coll', 'wpi-class2-wastewater-coll', 'wpi-class3-wastewater-coll', 'wpi-class4-wastewater-coll'
];
for (const bank of allBanks) {
  const [rows] = await db.query(
    "SELECT module, COUNT(*) as q FROM questions WHERE bankKey = ? GROUP BY module ORDER BY q DESC",
    [bank]
  );
  const total = rows.reduce((s, r) => s + Number(r.q), 0);
  const summary = rows.map(r => `${r.module}:${r.q}(${Math.round(Number(r.q)/total*100)}%)`).join(' | ');
  console.log(`${bank} [${total}]: ${summary}`);
}

await db.end();
console.log("\nDone.");
