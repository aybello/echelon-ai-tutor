// The exam outlines below determine topic coverage only. They are not answer evidence.
export const BLUEPRINTS = Object.freeze({
  "class2-water": {
    title: "WPI Water Treatment Operator Class II Need-to-Know (2025)",
    url: "https://gowpi.org/wp-content/uploads/2026/04/Water-Treatment-Class-2_mh-fin.pdf",
    areas: { "Treatment Process": 80, "Laboratory Analysis": 40, "Equipment O&M": 60, "Source Water": 35, "Safety & Admin": 35 },
  },
  "class2-water-dist": {
    title: "OWWCO Ontario Water Distribution Operator Need-to-Know (Class II)",
    url: "https://owwco.ca/wp-content/uploads/2023/11/Need-to-Know_Water-Distribution_English.pdf",
    areas: { General: 65, "Support Systems": 30, Processes: 140, Administration: 15 },
  },
  "class2-wastewater": {
    title: "WPI Wastewater Treatment Operator Class II Need-to-Know (topic map)",
    url: "https://gowpi.org/services/2025-need-to-know-criteria/",
    areas: { "Equipment Evaluation, Maintenance & Operation": 90, "Treatment Process Evaluation & Adjustment": 100, "Laboratory Analysis": 25, "Safety & Admin": 35 },
  },
  "class2-wastewater-coll": {
    title: "WPI Wastewater Collection Operator Class II Need-to-Know (topic map)",
    url: "https://gowpi.org/services/2025-need-to-know-criteria/",
    areas: { "Equipment Operation & Maintenance": 65, "Collection System Components": 65, "Lift Station Operation and Maintenance": 45, "Collection System Monitoring & Evaluation": 40, "Safety & Regulations": 35 },
  },
});

// Answer-support catalog: each family also carries a specific section/claim note.
export const SOURCES = Object.freeze({
  WT_PROCESS: { title: "Ontario Design Guidelines for Drinking-Water Systems — Treatment and Chemical Application", url: "https://www.ontario.ca/document/design-guidelines-drinking-water-systems/treatment-and-chemical-application" },
  WT_SOURCE: { title: "Ontario Design Guidelines for Drinking-Water Systems — General Design and Source Development", url: "https://www.ontario.ca/document/design-guidelines-drinking-water-systems/general-design-consideration-and-source-development" },
  WT_STORAGE: { title: "Ontario Design Guidelines for Drinking-Water Systems — Pumping and Treated Water Storage", url: "https://www.ontario.ca/document/design-guidelines-drinking-water-systems/pumping-facilities-and-treated-water-storage" },
  WT_CONTROLS: { title: "Ontario Design Guidelines for Drinking-Water Systems — Instrumentation and Control", url: "https://www.ontario.ca/document/design-guidelines-drinking-water-systems/instrumentation-control-and-distribution-systems" },
  WT_REG: { title: "Ontario Regulation 170/03 — Drinking-Water Systems", url: "https://www.ontario.ca/laws/regulation/030170" },
  WD_MAIN: { title: "Ontario Design Guidelines for Drinking-Water Systems — Distribution Systems", url: "https://www.ontario.ca/document/design-guidelines-drinking-water-systems/instrumentation-control-and-distribution-systems" },
  WD_STORAGE: { title: "Ontario Design Guidelines for Drinking-Water Systems — Pumping and Treated Water Storage", url: "https://www.ontario.ca/document/design-guidelines-drinking-water-systems/pumping-facilities-and-treated-water-storage" },
  WD_DISINFECT: { title: "Ontario 2020 Watermain Disinfection Procedure", url: "https://www.ontario.ca/page/water-main-disinfection-procedure" },
  WD_HYDRAULICS: { title: "US EPA EPANET — Distribution Network Hydraulic Analysis", url: "https://www.epa.gov/water-research/epanet" },
  WD_PRESSURE: { title: "US EPA Drinking Water Distribution System Tools and Resources", url: "https://www.epa.gov/dwreginfo/drinking-water-distribution-system-tools-and-resources" },
  WW_PRIMARY: { title: "Ontario Design Guidelines for Sewage Works — Preliminary Treatment and Primary Sedimentation", url: "https://www.ontario.ca/document/design-guidelines-sewage-works/preliminary-treatment-and-primary-sedimentation" },
  WW_BIO: { title: "Ontario Design Guidelines for Sewage Works — Biological Treatment and Secondary Sedimentation", url: "https://www.ontario.ca/document/design-guidelines-sewage-works/biological-treatment-and-secondary-sedimentation" },
  WW_DISINFECT: { title: "Ontario Design Guidelines for Sewage Works — Disinfection and Supplemental Treatment", url: "https://www.ontario.ca/document/design-guidelines-sewage-works/disinfection-and-supplement-treatment-processes" },
  WW_SOLIDS: { title: "Ontario Design Guidelines for Sewage Works — Sludge Thickening and Dewatering", url: "https://www.ontario.ca/document/design-guidelines-sewage-works/sludge-thickening-and-dewatering" },
  WW_STABILIZE: { title: "Ontario Design Guidelines for Sewage Works — Sludge Stabilization", url: "https://www.ontario.ca/document/design-guidelines-sewage-works/sludge-stabilization" },
  WW_CONTROLS: { title: "Ontario Design Guidelines for Sewage Works — Instrumentation and Control", url: "https://www.ontario.ca/document/design-guidelines-sewage-works/instrumentation-and-control" },
  WW_PUMPS: { title: "Ontario Design Guidelines for Sewage Works — Sewage Pumping Stations", url: "https://www.ontario.ca/document/design-guidelines-sewage-works/sewage-pumping-stations" },
  WC_SEWERS: { title: "Ontario Design Guidelines for Sewage Works — Design of Sewers and Rehabilitation", url: "https://www.ontario.ca/book/export/html/59954" },
  WC_PUMPS: { title: "Ontario Design Guidelines for Sewage Works — Sewage Pumping Stations and Forcemains", url: "https://www.ontario.ca/document/design-guidelines-sewage-works/sewage-pumping-stations" },
  WC_IANDI: { title: "Ontario Design Guidelines for Sewage Works — Combined Sewer Overflow and I/I", url: "https://www.ontario.ca/document/design-guidelines-sewage-works/control-and-treatment-combined-sewer-overflows" },
  WC_SAFETY: { title: "Ontario Regulation 632/05 — Confined Spaces", url: "https://www.ontario.ca/laws/regulation/050632" },
  WC_FIELD_SAFETY: { title: "Ontario Occupational Health and Safety Act — General Duties", url: "https://www.ontario.ca/laws/statute/90o01" },
  OHS_LOCKOUT: { title: "Ontario Regulation 851 — Industrial Establishments", url: "https://www.ontario.ca/laws/regulation/900851" },
});
