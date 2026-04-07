/**
 * Module Overview content for OIT Water quiz pages.
 * Each entry provides a concise study note shown above the question card
 * when a specific module is selected.
 */

export interface ModuleOverview {
  title: string;
  intro: string;
  keyPoints: { heading: string; body: string }[];
  tableHeadings?: string[];
  tableRows?: string[][];
  examTips: string[];
  formulaHint?: string;
}

// ─── Class 1 Wastewater Module Overviews ────────────────────────────────────
export const CLASS1_WASTEWATER_OVERVIEWS: Record<string, ModuleOverview> = {
  "Wastewater Characteristics & Preliminary Treatment": {
    title: "Wastewater Characteristics & Preliminary Treatment",
    intro:
      "Before wastewater can be treated, it must be characterized and prepared. Preliminary treatment removes large solids and grit that would damage downstream equipment. Understanding what's in wastewater — and why — is the foundation of the Class 1 Wastewater exam.",
    keyPoints: [
      {
        heading: "Wastewater Composition",
        body: "Municipal wastewater is approximately 99.9% water and 0.1% dissolved and suspended solids. Key pollutants include BOD (organic matter), TSS (suspended solids), nutrients (nitrogen and phosphorus), pathogens, and oil/grease. Characterizing influent is essential for sizing treatment processes and meeting effluent limits.",
      },
      {
        heading: "Screening",
        body: "Bar screens and fine screens remove large debris (rags, plastics, sticks) that would clog pumps and damage equipment. Screenings are collected and disposed of as solid waste. Screen opening size determines what is removed — coarse screens (>6 mm) for large debris, fine screens (<3 mm) for smaller particles.",
      },
      {
        heading: "Grit Removal",
        body: "Grit (sand, gravel, eggshells, coffee grounds) is removed in grit chambers before primary treatment. Grit is abrasive and causes wear on pumps, pipes, and digesters. Grit chambers are designed to settle grit while keeping organic solids in suspension. Velocity control is critical — too fast and grit doesn't settle; too slow and organics settle with it.",
      },
      {
        heading: "Flow Measurement & Equalization",
        body: "Flow measurement (using Parshall flumes, weirs, or magnetic flowmeters) is required for process control and regulatory reporting. Flow equalization basins dampen peak flows, protecting downstream processes from hydraulic overload. Diurnal flow patterns (morning and evening peaks) are typical for municipal systems.",
      },
    ],
    tableHeadings: ["Parameter", "Typical Range", "Significance"],
    tableRows: [
      ["BOD₅", "150–300 mg/L", "Oxygen demand from organic matter"],
      ["TSS", "150–350 mg/L", "Suspended solids load"],
      ["Total Nitrogen", "25–60 mg/L", "Nutrient — causes eutrophication"],
      ["Total Phosphorus", "4–12 mg/L", "Nutrient — algae growth driver"],
      ["pH", "6.5–8.0", "Affects biological treatment"],
    ],
    examTips: [
      "Grit removal must occur before primary sedimentation to protect equipment",
      "Screenings and grit are classified as solid waste — not biosolids",
      "Flow equalization reduces peak loads on primary and secondary treatment",
      "Know the difference between coarse and fine screening and their applications",
    ],
  },

  "Primary Treatment": {
    title: "Primary Treatment",
    intro:
      "Primary treatment uses gravity sedimentation to remove settleable solids and floating material from wastewater. It is a physical process — no chemicals or biology involved. Primary clarifiers typically remove 50–70% of TSS and 25–40% of BOD, reducing the load on secondary treatment.",
    keyPoints: [
      {
        heading: "Primary Sedimentation",
        body: "Wastewater flows slowly through a primary clarifier, allowing heavy solids to settle to the bottom as primary sludge and light material (grease, scum) to float to the surface. Sludge is collected by scrapers and pumped to solids handling. Scum is skimmed off the surface. Overflow rate (surface loading rate) is the key design parameter.",
      },
      {
        heading: "Overflow Rate",
        body: "Surface overflow rate (SOR) = Flow / Surface Area (m³/m²/day). A lower SOR allows smaller, lighter particles to settle. Typical primary clarifier SOR is 30–50 m³/m²/day. If flow increases (e.g. wet weather), SOR rises and treatment efficiency drops — particles are carried over to secondary treatment.",
      },
      {
        heading: "Primary Sludge",
        body: "Primary sludge is the settled solids from the primary clarifier. It is typically 3–8% solids and has a strong odour due to anaerobic decomposition. Primary sludge is pumped to digesters or thickeners for further processing. Sludge pumping rate must be balanced — too slow causes septic conditions; too fast dilutes the sludge.",
      },
      {
        heading: "Weir Loading",
        body: "Effluent weirs at the outlet of the clarifier must be level to ensure uniform flow distribution. Weir loading rate = Flow / Total weir length (m³/m/day). High weir loading causes turbulence that can resuspend settled solids. Weirs must be inspected and levelled regularly.",
      },
    ],
    tableHeadings: ["Parameter", "Typical Removal", "Design Range"],
    tableRows: [
      ["TSS", "50–70%", "SOR: 30–50 m³/m²/day"],
      ["BOD₅", "25–40%", "HRT: 1.5–2.5 hours"],
      ["Grease/Scum", "~65%", "Skimmer required"],
      ["Pathogens", "Minimal", "Not a primary goal"],
    ],
    examTips: [
      "Primary treatment is physical only — no chemicals or biology",
      "Higher overflow rate = lower removal efficiency",
      "Primary sludge is volatile and odorous — handle carefully",
      "Weir levelling is critical for uniform clarifier performance",
    ],
    formulaHint: "SOR (m³/m²/day) = Flow (m³/day) ÷ Surface Area (m²)",
  },

  "Secondary Treatment": {
    title: "Secondary Treatment",
    intro:
      "Secondary treatment uses biological processes to remove dissolved and colloidal organic matter that primary treatment cannot remove. The activated sludge process is the most common method in Ontario. Microorganisms consume organic matter, and the resulting biomass is settled in secondary clarifiers. Secondary treatment typically achieves 85–95% BOD and TSS removal.",
    keyPoints: [
      {
        heading: "Activated Sludge Process",
        body: "Wastewater and return activated sludge (RAS) are mixed in an aeration basin. Microorganisms (primarily bacteria) consume organic matter using oxygen supplied by aeration. The mixed liquor (wastewater + biomass) flows to a secondary clarifier where the biomass settles. Settled sludge is either returned (RAS) or wasted (WAS) to control the biomass population.",
      },
      {
        heading: "Key Operating Parameters",
        body: "MLSS (Mixed Liquor Suspended Solids) is the concentration of biomass in the aeration basin, typically 2,000–4,000 mg/L. SRT (Sludge Retention Time) or sludge age controls the type of organisms present — longer SRT favours nitrifiers. F/M ratio (Food to Microorganism) controls the metabolic state of the biomass — lower F/M means more stable, well-settling sludge.",
      },
      {
        heading: "Return Activated Sludge (RAS)",
        body: "RAS recycles settled biomass from the secondary clarifier back to the aeration basin to maintain the MLSS. RAS rate is typically 50–100% of influent flow. Too little RAS causes MLSS to drop and treatment efficiency to decline. Too much RAS can hydraulically overload the aeration basin.",
      },
      {
        heading: "Waste Activated Sludge (WAS)",
        body: "WAS removes excess biomass from the system to control SRT and MLSS. If WAS rate is too low, MLSS increases, sludge becomes old and bulky, and settling deteriorates. If WAS rate is too high, MLSS drops and treatment efficiency declines. WAS is sent to solids handling (thickening, digestion).",
      },
    ],
    tableHeadings: ["Parameter", "Typical Range", "Effect if Too High / Too Low"],
    tableRows: [
      ["MLSS", "2,000–4,000 mg/L", "Too high: poor settling / Too low: poor treatment"],
      ["SRT (sludge age)", "5–15 days", "Too high: bulking / Too low: washout"],
      ["F/M ratio", "0.05–0.5 kg BOD/kg MLSS/day", "Too high: dispersed growth / Too low: over-oxidation"],
      ["RAS rate", "50–100% of Q", "Too low: MLSS drops / Too high: dilutes aeration basin"],
      ["DO in aeration", "1.5–3.0 mg/L", "Too low: poor treatment / Too high: energy waste"],
    ],
    examTips: [
      "RAS recycles biomass; WAS removes excess biomass — know the difference",
      "Low DO in the aeration basin is the most common cause of poor BOD removal",
      "Sludge bulking (high SVI) causes poor settling in the secondary clarifier",
      "SRT controls nitrification — longer SRT is needed for nitrifiers to establish",
    ],
    formulaHint: "SRT (days) = Total biomass in system (kg) ÷ WAS rate (kg/day)",
  },

  "Biological Nutrient Removal": {
    title: "Biological Nutrient Removal",
    intro:
      "Nutrients — nitrogen and phosphorus — cause eutrophication in receiving waters. Ontario's effluent limits increasingly require nutrient removal. Biological nutrient removal (BNR) uses controlled aerobic, anoxic, and anaerobic zones to encourage specific microbial populations to remove nitrogen and phosphorus from wastewater.",
    keyPoints: [
      {
        heading: "Nitrogen Removal",
        body: "Nitrogen removal requires two steps: nitrification (aerobic) converts ammonia (NH₄⁺) to nitrate (NO₃⁻) via nitrifying bacteria (Nitrosomonas, Nitrobacter). Denitrification (anoxic — no dissolved oxygen, but nitrate present) converts nitrate to nitrogen gas (N₂) which escapes to the atmosphere. A carbon source (BOD) is required for denitrification.",
      },
      {
        heading: "Phosphorus Removal",
        body: "Biological phosphorus removal (Bio-P) uses enhanced biological phosphorus removal (EBPR). Phosphorus-accumulating organisms (PAOs) release phosphorus in an anaerobic zone, then take up excess phosphorus in an aerobic zone. The phosphorus-rich WAS is removed from the system, taking the phosphorus with it. Chemical precipitation (alum or ferric chloride) can supplement or replace biological P removal.",
      },
      {
        heading: "BNR Process Configurations",
        body: "Common BNR configurations include A²/O (anaerobic-anoxic-oxic) for combined N and P removal, MLE (Modified Ludzack-Ettinger) for nitrogen removal only, and Bardenpho (4 or 5 stage) for enhanced nitrogen removal. Each configuration uses different zone sequences to optimize the conditions for nitrifiers, denitrifiers, and PAOs.",
      },
      {
        heading: "Operational Challenges",
        body: "BNR systems are sensitive to changes in influent quality, temperature, and SRT. Cold temperatures slow nitrification — longer SRT is needed in winter. Insufficient carbon (BOD) limits denitrification. Dissolved oxygen carryover into anoxic zones inhibits denitrification. Maintaining the correct zone volumes and recycle rates is critical.",
      },
    ],
    tableHeadings: ["Zone", "Condition", "Process", "Removes"],
    tableRows: [
      ["Anaerobic", "No O₂, no NO₃", "P release by PAOs", "Sets up P removal"],
      ["Anoxic", "No O₂, NO₃ present", "Denitrification", "Nitrogen (as N₂ gas)"],
      ["Aerobic", "DO present", "Nitrification + P uptake", "Ammonia → Nitrate; P uptake"],
    ],
    examTips: [
      "Nitrification requires aerobic conditions; denitrification requires anoxic conditions",
      "Cold temperatures slow nitrification — increase SRT in winter",
      "DO carryover into anoxic zones inhibits denitrification",
      "Bio-P requires a true anaerobic zone (no O₂ AND no nitrate)",
    ],
    formulaHint: "Nitrification: NH₄⁺ → NO₂⁻ → NO₃⁻ (aerobic) | Denitrification: NO₃⁻ → N₂ (anoxic)",
  },

  "Tertiary Treatment & Filtration": {
    title: "Tertiary Treatment & Filtration",
    intro:
      "Tertiary treatment polishes secondary effluent to meet stringent effluent limits for TSS, nutrients, or specific contaminants. Filtration is the most common tertiary process in Ontario wastewater plants, removing residual suspended solids before disinfection.",
    keyPoints: [
      {
        heading: "Tertiary Filtration",
        body: "Granular media filters (sand, anthracite, or dual-media) remove residual TSS from secondary effluent. Filters operate in downflow mode — water passes through the media bed, trapping particles. As solids accumulate, headloss increases until the filter must be backwashed. Effluent turbidity from tertiary filters should be <2 NTU.",
      },
      {
        heading: "Backwashing",
        body: "Backwashing reverses flow through the filter bed to expand and clean the media. Air scour is often used before water backwash to break up compacted solids. Backwash water (high in TSS) is returned to the head of the plant. Filters must be returned to service gradually after backwashing to avoid turbidity breakthrough.",
      },
      {
        heading: "Chemical Phosphorus Removal",
        body: "Alum (aluminum sulfate) or ferric chloride is added to precipitate phosphorus as aluminum or iron phosphate. The precipitate is removed in clarifiers or filters. Chemical P removal is reliable and can achieve effluent TP <0.1 mg/L. Sludge production increases significantly with chemical addition.",
      },
      {
        heading: "Membrane Bioreactors (MBR)",
        body: "MBRs combine activated sludge with membrane filtration (microfiltration or ultrafiltration). The membrane replaces the secondary clarifier, producing very high quality effluent (TSS <1 mg/L, turbidity <0.2 NTU). MBRs operate at higher MLSS (8,000–15,000 mg/L) and have a smaller footprint than conventional systems. Membrane fouling is the main operational challenge.",
      },
    ],
    tableHeadings: ["Process", "Removes", "Typical Effluent Quality"],
    tableRows: [
      ["Granular media filtration", "Residual TSS", "TSS <10 mg/L, turbidity <2 NTU"],
      ["Chemical P precipitation", "Phosphorus", "TP <0.1–1.0 mg/L"],
      ["MBR", "TSS, pathogens", "TSS <1 mg/L, turbidity <0.2 NTU"],
      ["UV disinfection", "Pathogens", "No residual"],
    ],
    examTips: [
      "Backwash water must be returned to the head of the plant — not discharged",
      "Turbidity breakthrough after backwashing is a common operational issue",
      "Chemical P removal increases sludge production significantly",
      "MBR membranes require regular cleaning to prevent irreversible fouling",
    ],
  },

  "Disinfection": {
    title: "Disinfection (Wastewater)",
    intro:
      "Wastewater disinfection destroys pathogens before the treated effluent is discharged to a receiving water body. Unlike drinking water, wastewater disinfection does not require a residual in the distribution system — the goal is to meet effluent limits for E. coli or total coliforms at the point of discharge.",
    keyPoints: [
      {
        heading: "Chlorination",
        body: "Chlorine (sodium hypochlorite or chlorine gas) is the most common wastewater disinfectant. Chlorine reacts with ammonia in the effluent to form chloramines, which are less effective than free chlorine. Breakpoint chlorination adds enough chlorine to destroy all chloramines and achieve free chlorine residual. Dechlorination (with sodium bisulfite or sulfur dioxide) is required before discharge to protect aquatic life.",
      },
      {
        heading: "UV Disinfection",
        body: "UV light inactivates pathogens by damaging their DNA. UV is effective, produces no disinfection byproducts, and requires no dechlorination. However, UV provides no residual and requires low turbidity (<2 NTU) for effective penetration. UV dose is measured in mJ/cm². Lamp fouling reduces UV intensity — lamps must be cleaned regularly.",
      },
      {
        heading: "Ontario Effluent Limits",
        body: "Ontario's Environmental Compliance Approvals (ECAs) set site-specific effluent limits. Common limits include E. coli ≤200 CFU/100 mL (monthly geometric mean) and ≤400 CFU/100 mL (single sample). Some ECAs require lower limits for sensitive receiving waters. Compliance is measured at the final effluent sampling point.",
      },
      {
        heading: "Chlorine Demand vs. Chlorine Dose",
        body: "Chlorine demand is the amount of chlorine consumed by reactions with organic matter, ammonia, and other substances in the effluent. Chlorine dose = Chlorine demand + Chlorine residual. Wastewater with high ammonia has a high chlorine demand because of chloramine formation. Breakpoint chlorination must overcome the chloramine hump before free chlorine residual appears.",
      },
    ],
    tableHeadings: ["Method", "Residual?", "Byproducts", "Key Limitation"],
    tableRows: [
      ["Chlorination", "Yes", "THMs, HAAs, chloramines", "Dechlorination required; toxic to fish"],
      ["UV", "No", "None", "Requires low turbidity; no residual"],
      ["Ozone", "No", "Bromate (if bromide present)", "Expensive; no residual"],
    ],
    examTips: [
      "Dechlorination is required after chlorination before discharge to protect fish",
      "UV requires turbidity <2 NTU for effective disinfection",
      "E. coli limit is typically 200 CFU/100 mL (monthly geometric mean) in Ontario",
      "Breakpoint chlorination destroys chloramines — the dose must exceed the chloramine hump",
    ],
    formulaHint: "Chlorine Dose = Chlorine Demand + Desired Residual",
  },

  "Solids Handling & Biosolids": {
    title: "Solids Handling & Biosolids",
    intro:
      "Solids handling is one of the most complex and costly aspects of wastewater treatment. Primary and secondary sludge must be thickened, stabilized, and dewatered before it can be beneficially used or disposed of. In Ontario, treated biosolids can be land-applied under O. Reg. 267/03.",
    keyPoints: [
      {
        heading: "Thickening",
        body: "Thickening increases the solids concentration of sludge before digestion, reducing the volume that must be processed. Gravity thickeners work for primary sludge (settles well). Dissolved air flotation (DAF) thickeners are used for secondary (activated) sludge, which is light and doesn't settle easily. Typical thickened sludge is 4–8% solids.",
      },
      {
        heading: "Anaerobic Digestion",
        body: "Anaerobic digestion stabilizes sludge by breaking down volatile solids in the absence of oxygen. The process occurs in four stages: hydrolysis, acidogenesis, acetogenesis, and methanogenesis. Biogas (60–70% methane) is produced and can be used for heat or electricity. Digestion reduces volatile solids by 40–60% and destroys pathogens. Optimal temperature is 35–37°C (mesophilic) or 55°C (thermophilic).",
      },
      {
        heading: "Dewatering",
        body: "Dewatering removes water from digested sludge to produce a cake suitable for land application or disposal. Common methods include belt filter presses, centrifuges, and screw presses. Polymer conditioning is required to improve dewatering performance. Dewatered biosolids are typically 18–30% solids (70–82% moisture).",
      },
      {
        heading: "Biosolids Classification (O. Reg. 267/03)",
        body: "Class A biosolids have low pathogen levels and can be applied to any land use, including home gardens. Class B biosolids have higher pathogen levels and are restricted to agricultural land with setback requirements. Classification is based on pathogen reduction (fecal coliform limits) and vector attraction reduction (volatile solids reduction or pH adjustment).",
      },
    ],
    tableHeadings: ["Process", "Purpose", "Typical Result"],
    tableRows: [
      ["Gravity thickening", "Concentrate primary sludge", "3–8% solids"],
      ["DAF thickening", "Concentrate secondary sludge", "4–6% solids"],
      ["Anaerobic digestion", "Stabilize, reduce volume, produce biogas", "40–60% VS reduction"],
      ["Belt filter press", "Dewater digested sludge", "18–25% solids cake"],
      ["Centrifuge", "Dewater digested sludge", "22–30% solids cake"],
    ],
    examTips: [
      "DAF is used for secondary sludge — it floats, not settles",
      "Anaerobic digestion produces methane — a combustible gas requiring safety precautions",
      "Class A biosolids have fewer restrictions than Class B",
      "Polymer addition is required before mechanical dewatering",
    ],
    formulaHint: "Volatile Solids Reduction (%) = (VS in − VS out) / VS in × 100",
  },

  "Regulations, Safety & Operations": {
    title: "Regulations, Safety & Operations",
    intro:
      "Ontario wastewater operators must comply with the Environmental Protection Act, Ontario Water Resources Act, and their facility's Environmental Compliance Approval (ECA). Safety in wastewater plants involves unique hazards including toxic gases, confined spaces, and biological exposure. Operational records and reporting are legal requirements.",
    keyPoints: [
      {
        heading: "Environmental Compliance Approval (ECA)",
        body: "Every wastewater treatment plant in Ontario operates under an ECA issued by the Ministry of the Environment, Conservation and Parks (MECP). The ECA sets effluent limits, monitoring requirements, and operational conditions specific to the facility. Operators must be familiar with their ECA and ensure all conditions are met. Exceedances must be reported to the MECP.",
      },
      {
        heading: "Spills and Adverse Events",
        body: "Any spill or bypass that may impair water quality must be reported to the MECP Spills Action Centre (SAC) immediately (1-800-268-6060). Bypasses — where untreated or partially treated wastewater is discharged without full treatment — are only permitted in emergency situations and must be reported. Operators must document all spills and corrective actions taken.",
      },
      {
        heading: "Confined Space Safety",
        body: "Wastewater plants have numerous confined spaces — wet wells, digesters, valve chambers, manholes. Entry requires a permit, atmospheric testing (oxygen, H₂S, methane, CO), continuous monitoring, and a trained attendant outside. H₂S (hydrogen sulfide) is the primary toxic gas hazard in wastewater — it is heavier than air, smells like rotten eggs at low concentrations, and causes olfactory fatigue (you stop smelling it before it kills you).",
      },
      {
        heading: "Operator Licensing",
        body: "Ontario wastewater operators are licensed under O. Reg. 129/04. The licence class (1–4) must match or exceed the classification of the facility being operated. Class 1 operators can operate Class 1 and OIT-level facilities. Operators must maintain their licence through continuing education and renewal. The Overall Responsible Operator (ORO) is legally responsible for the plant's compliance.",
      },
    ],
    tableHeadings: ["Regulation", "Key Requirement"],
    tableRows: [
      ["Ontario Water Resources Act", "Prohibits discharge of pollutants to water"],
      ["Environmental Protection Act", "Governs spills, waste disposal, ECA requirements"],
      ["O. Reg. 129/04", "Operator licensing — classes and responsibilities"],
      ["O. Reg. 267/03", "Biosolids land application standards"],
      ["ECA (site-specific)", "Effluent limits, monitoring, reporting for each plant"],
    ],
    examTips: [
      "H₂S causes olfactory fatigue — you cannot rely on smell to detect dangerous levels",
      "Spills must be reported to the MECP Spills Action Centre immediately",
      "The ORO is legally responsible for the plant's compliance with its ECA",
      "Confined space entry always requires atmospheric testing — even for short entries",
    ],
  },
};

// ─── OIT Water Module Overviews ───────────────────────────────────────────────
export const OIT_WATER_OVERVIEWS: Record<string, ModuleOverview> = {
  "Disinfection": {
    title: "Disinfection",
    intro:
      "Disinfection is the process of destroying or inactivating harmful microorganisms in drinking water. It is the last barrier before water reaches consumers and is one of the most heavily tested topics on the OIT exam.",
    keyPoints: [
      {
        heading: "CT Values",
        body: "CT = Concentration (mg/L) × Contact Time (minutes). The CT value tells you whether you've achieved enough disinfection credit to inactivate a target organism (e.g. Giardia, Cryptosporidium). Colder water requires a higher CT because disinfection reactions slow down at lower temperatures.",
      },
      {
        heading: "Types of Disinfectants",
        body: "Chlorine (Cl₂) is the most common disinfectant in Ontario. Chloramines provide a longer-lasting residual in distribution systems but are slower-acting. UV is effective but provides no residual. Ozone is powerful but expensive and leaves no residual.",
      },
      {
        heading: "Free vs. Combined Chlorine",
        body: "Free chlorine (HOCl and OCl⁻) is the active disinfectant. Combined chlorine (chloramines) forms when free chlorine reacts with ammonia. The sum of free and combined chlorine is total chlorine. Free chlorine is a stronger disinfectant than combined chlorine.",
      },
      {
        heading: "Ontario Regulatory Requirements",
        body: "O. Reg. 170/03 requires a minimum free chlorine residual of 0.05 mg/L at the point of entry to the distribution system. Turbidity must be below 1 NTU before disinfection for effective treatment.",
      },
    ],
    tableHeadings: ["Disinfectant", "Residual?", "Key Use", "Main Limitation"],
    tableRows: [
      ["Chlorine (Cl₂)", "Yes", "Primary disinfection", "Forms DBPs with organics"],
      ["Chloramines", "Yes (longer)", "Distribution residual", "Slower-acting, nitrification risk"],
      ["UV", "No", "Small systems", "Cannot maintain residual"],
      ["Ozone", "No", "Pre-treatment", "Expensive, no residual"],
    ],
    examTips: [
      "CT calculations where temperature changes — you need a higher CT in winter",
      "The difference between free chlorine and combined chlorine (chloramines)",
      "Why UV cannot be used as the sole disinfectant in a distribution system",
      "O. Reg. 170/03 minimum residual: 0.05 mg/L free chlorine at point of entry",
    ],
    formulaHint: "CT = C × T (concentration in mg/L × contact time in minutes)",
  },

  "Chemical Feed & Storage": {
    title: "Chemical Feed & Storage",
    intro:
      "Chemical feed involves adding treatment chemicals to water at precise doses to achieve a desired outcome — coagulation, pH adjustment, disinfection, or corrosion control. Safe storage and handling of these chemicals is equally important and frequently tested.",
    keyPoints: [
      {
        heading: "Dose Calculations",
        body: "Dose (mg/L) × Flow (L/s) × 86,400 s/day = mass of chemical needed per day (mg/day). Convert to kg/day by dividing by 1,000,000. Always check the purity (%) of the chemical being used — if alum is 48% pure, you need to feed more to achieve the target dose.",
      },
      {
        heading: "Common Treatment Chemicals",
        body: "Alum (aluminum sulfate) is the most common coagulant. Lime (Ca(OH)₂) raises pH and softens water. Sodium hypochlorite (bleach) is a liquid chlorine source. Fluoride (sodium fluorosilicate or fluorosilicic acid) is added for dental health at 0.7 mg/L in Ontario.",
      },
      {
        heading: "Chemical Feed Equipment",
        body: "Dry feeders handle solid chemicals like alum or lime. Liquid metering pumps handle solutions like sodium hypochlorite. Calibration is critical — feeders must be checked regularly to ensure accurate dosing.",
      },
      {
        heading: "Storage & Safety",
        body: "Chemicals must be stored in compatible containers and separated from incompatible materials (e.g. chlorine and ammonia must never be stored together). Secondary containment (a berm or tray) is required to catch spills. WHMIS training is mandatory for all chemical handlers.",
      },
    ],
    tableHeadings: ["Chemical", "Purpose", "Typical Dose", "Key Hazard"],
    tableRows: [
      ["Alum", "Coagulation", "5–50 mg/L", "Lowers pH, corrosive"],
      ["Lime", "pH adjustment / softening", "Varies", "Caustic, dust hazard"],
      ["Sodium hypochlorite", "Disinfection", "1–5 mg/L as Cl₂", "Oxidizer, degrades over time"],
      ["Fluorosilicic acid", "Fluoridation", "Target 0.7 mg/L F⁻", "Corrosive acid"],
    ],
    examTips: [
      "Always account for chemical purity in dose calculations",
      "Know the difference between dry and liquid feeders and when each is used",
      "Secondary containment is required for all chemical storage areas",
      "Sodium hypochlorite degrades over time — check concentration before use",
    ],
    formulaHint: "Mass feed rate (kg/day) = Dose (mg/L) × Flow (m³/day) ÷ 1,000",
  },

  "Hydraulics": {
    title: "Hydraulics",
    intro:
      "Hydraulics is the study of water in motion. For the OIT exam, you need to understand flow, pressure, pipe friction, and the basic principles that govern how water moves through a treatment plant and distribution system.",
    keyPoints: [
      {
        heading: "Flow and Velocity",
        body: "Flow (Q) = Velocity (V) × Cross-sectional Area (A). Flow is typically measured in L/s or m³/s. When a pipe narrows, velocity increases to maintain the same flow rate (continuity equation). This is why pressure drops in a constriction.",
      },
      {
        heading: "Pressure and Head",
        body: "Pressure is force per unit area (kPa). Head is pressure expressed as a height of water (metres). 1 metre of head ≈ 9.81 kPa. Elevation head, velocity head, and pressure head together make up total head (Bernoulli's principle).",
      },
      {
        heading: "Head Loss",
        body: "Head loss is the energy lost due to friction as water flows through pipes and fittings. It increases with flow velocity, pipe length, and pipe roughness, and decreases with larger pipe diameter. The Hazen-Williams equation is used to calculate head loss in distribution systems.",
      },
      {
        heading: "Hydraulic Grade Line (HGL)",
        body: "The HGL shows the pressure head along a pipeline. If the HGL drops below the pipe elevation, negative pressure (vacuum) occurs, which can cause pipe collapse or contamination. Maintaining positive pressure throughout the distribution system is a regulatory requirement.",
      },
    ],
    tableHeadings: ["Concept", "Formula", "Units"],
    tableRows: [
      ["Flow rate", "Q = V × A", "m³/s or L/s"],
      ["Velocity", "V = Q / A", "m/s"],
      ["Pressure to head", "h = P / (ρg)", "metres"],
      ["Head to pressure", "P = ρgh", "kPa"],
    ],
    examTips: [
      "Flow rate stays constant in a closed pipe — velocity changes with diameter",
      "Larger diameter pipes have less head loss for the same flow rate",
      "Negative pressure in a distribution main is a serious contamination risk",
      "Know the difference between static pressure (no flow) and dynamic pressure (flow)",
    ],
    formulaHint: "Q = V × A | P (kPa) = head (m) × 9.81",
  },

  "Math & Calculations": {
    title: "Math & Calculations",
    intro:
      "The math section of the OIT exam tests your ability to apply formulas to real treatment scenarios. Questions typically involve unit conversions, dose calculations, flow rates, volumes, and detention times. A systematic approach — write the formula, substitute values, check units — will get you through most questions.",
    keyPoints: [
      {
        heading: "Unit Conversions",
        body: "The most common source of errors is unit mismatch. Key conversions: 1 m³ = 1,000 L; 1 mg/L = 1 g/m³; 1 day = 86,400 seconds; 1 MLD (megalitres/day) = 1,000 m³/day = 11.57 L/s. Always write out units and cancel them as you work through the problem.",
      },
      {
        heading: "Detention Time",
        body: "Detention Time (HRT) = Volume / Flow Rate. This tells you how long water spends in a tank or basin. Longer detention time means more contact time for treatment processes like sedimentation or disinfection. Units must match — if volume is in m³ and flow is in m³/day, HRT is in days.",
      },
      {
        heading: "Dose and Mass Calculations",
        body: "Mass (kg/day) = Dose (mg/L) × Flow (m³/day) ÷ 1,000. This formula is used for chemical feed, chlorine demand, and fluoride addition. Remember to account for chemical purity when calculating how much product to add.",
      },
      {
        heading: "Percent Removal",
        body: "% Removal = (Influent − Effluent) / Influent × 100. Used to evaluate treatment efficiency for turbidity, BOD, or contaminant removal. A plant removing turbidity from 10 NTU to 0.5 NTU achieves 95% removal.",
      },
    ],
    tableHeadings: ["Formula", "Variables", "Common Use"],
    tableRows: [
      ["HRT = V / Q", "V = volume (m³), Q = flow (m³/day)", "Sedimentation, contact time"],
      ["Mass = Dose × Q / 1000", "Dose (mg/L), Q (m³/day)", "Chemical feed rates"],
      ["% Removal = (In−Out)/In × 100", "Influent and effluent values", "Treatment efficiency"],
      ["Q = V × A", "V = velocity (m/s), A = area (m²)", "Pipe flow calculations"],
    ],
    examTips: [
      "Always write out units — cancel them to verify your answer makes sense",
      "Convert all units to the same system before calculating",
      "Detention time questions often have a unit trap (e.g. flow in L/s, volume in m³)",
      "For chemical feed, remember to divide by purity if the chemical isn't 100% pure",
    ],
    formulaHint: "HRT (days) = Volume (m³) ÷ Flow (m³/day)",
  },

  "Ontario Regulations": {
    title: "Ontario Regulations",
    intro:
      "Ontario's drinking water regulations set out the legal requirements for water treatment, monitoring, and reporting. The OIT exam tests your knowledge of the key regulations that govern day-to-day plant operations.",
    keyPoints: [
      {
        heading: "O. Reg. 170/03 — Drinking Water Systems",
        body: "This is the primary regulation for municipal drinking water systems in Ontario. It sets out sampling frequencies, treatment requirements, and reporting obligations. Operators must be familiar with Schedule 23 (large municipal residential systems) and the minimum treatment requirements for surface water and groundwater sources.",
      },
      {
        heading: "Safe Drinking Water Act (SDWA)",
        body: "The SDWA is the overarching legislation. It establishes the legal framework for drinking water protection in Ontario, including the requirement for licensed operators, approved equipment, and the duty to report adverse water quality incidents (AWQI) within 24 hours.",
      },
      {
        heading: "Ontario Drinking Water Quality Standards",
        body: "O. Reg. 169/03 sets the maximum allowable concentrations (MACs) for microbiological, chemical, and radiological parameters. Key values: E. coli = 0 CFU/100 mL; total coliforms = 0 CFU/100 mL; turbidity ≤ 1 NTU; free chlorine residual ≥ 0.05 mg/L at point of entry.",
      },
      {
        heading: "Adverse Water Quality Incidents (AWQI)",
        body: "An AWQI must be reported to the local Medical Officer of Health and the Ministry within 24 hours of discovery. Common triggers include E. coli detection, total coliform exceedances, turbidity spikes above 1 NTU, or loss of disinfection residual. Operators must also notify the public if there is a health risk.",
      },
    ],
    tableHeadings: ["Regulation", "Key Requirement"],
    tableRows: [
      ["O. Reg. 170/03", "Treatment, sampling, and reporting for municipal systems"],
      ["O. Reg. 169/03", "Maximum allowable concentrations (MACs) for all parameters"],
      ["Safe Drinking Water Act", "Operator licensing, AWQI reporting, legal framework"],
      ["O. Reg. 128/04", "Licensing of operators — classes and responsibilities"],
    ],
    examTips: [
      "AWQI must be reported within 24 hours — this is a common exam question",
      "E. coli = 0 CFU/100 mL is an absolute standard — any detection is an AWQI",
      "Know the difference between O. Reg. 170/03 (operations) and O. Reg. 169/03 (standards)",
      "Turbidity > 1 NTU at point of entry triggers an AWQI",
    ],
  },

  "Pumping Systems": {
    title: "Pumping Systems",
    intro:
      "Pumps move water through treatment plants and distribution systems. The OIT exam tests your understanding of pump types, pump curves, cavitation, and basic troubleshooting. Understanding how pumps interact with the system they're pumping into is essential.",
    keyPoints: [
      {
        heading: "Centrifugal Pumps",
        body: "Centrifugal pumps are the most common type in water treatment. They use a rotating impeller to add energy to the water. Flow rate increases as head (back-pressure) decreases. The operating point is where the pump curve intersects the system curve.",
      },
      {
        heading: "Pump Curves",
        body: "A pump curve shows the relationship between flow rate (Q) and total dynamic head (TDH) for a specific pump. As flow increases, TDH decreases. The best efficiency point (BEP) is the optimal operating condition. Operating far from BEP causes wear and energy waste.",
      },
      {
        heading: "Cavitation",
        body: "Cavitation occurs when the pressure at the pump inlet drops below the vapour pressure of water, causing water to vaporize and form bubbles. These bubbles collapse violently, damaging the impeller. Signs include noise (like gravel in the pump), vibration, and reduced flow. Causes: high suction lift, high water temperature, clogged suction screen.",
      },
      {
        heading: "Series vs. Parallel Pumps",
        body: "Pumps in series add their heads together — used when you need to overcome high static head (e.g. pumping to a high elevation). Pumps in parallel add their flows together — used when you need more flow at the same head. Parallel pumping is more common in distribution systems.",
      },
    ],
    tableHeadings: ["Configuration", "Effect on Head", "Effect on Flow", "Use Case"],
    tableRows: [
      ["Single pump", "Baseline", "Baseline", "Normal operation"],
      ["Series (2 pumps)", "Doubles", "Same", "High elevation pumping"],
      ["Parallel (2 pumps)", "Same", "Doubles", "High demand periods"],
    ],
    examTips: [
      "Cavitation is caused by low inlet pressure — not high pressure",
      "Pumps in series increase head; pumps in parallel increase flow",
      "The operating point is where the pump curve meets the system curve",
      "NPSH (Net Positive Suction Head) must be positive to prevent cavitation",
    ],
    formulaHint: "Power (kW) = Q (m³/s) × TDH (m) × ρg / efficiency",
  },

  "Water Treatment": {
    title: "Water Treatment",
    intro:
      "Water treatment is the sequence of processes used to make raw water safe to drink. The conventional treatment train — coagulation, flocculation, sedimentation, filtration, disinfection — is the backbone of most Ontario surface water plants and the most tested topic on the OIT exam.",
    keyPoints: [
      {
        heading: "Coagulation",
        body: "Coagulation is the addition of a chemical coagulant (usually alum) to destabilize the negative charge on suspended particles. This allows particles to come together. Rapid mixing is required immediately after coagulant addition to ensure contact with all particles. pH affects coagulation efficiency — alum works best between pH 6.5 and 7.5.",
      },
      {
        heading: "Flocculation",
        body: "Flocculation is the gentle mixing that follows coagulation, allowing destabilized particles to collide and form larger aggregates called floc. Too much mixing breaks up the floc; too little doesn't form it. Flocculation basins are designed with tapered mixing — faster at the inlet, slower at the outlet.",
      },
      {
        heading: "Sedimentation",
        body: "Sedimentation allows floc to settle out of suspension by gravity. The key parameter is overflow rate (surface loading rate) = flow / surface area. Lower overflow rates allow smaller particles to settle. Sludge accumulates at the bottom and must be removed regularly.",
      },
      {
        heading: "Filtration",
        body: "Filtration removes remaining suspended particles through a bed of granular media (sand, anthracite, or multi-media). Filters must be backwashed regularly to remove accumulated solids. Turbidity of filtered water must be ≤ 0.3 NTU in 95% of measurements and never exceed 1 NTU (O. Reg. 170/03).",
      },
    ],
    tableHeadings: ["Process", "Purpose", "Key Parameter"],
    tableRows: [
      ["Coagulation", "Destabilize particles", "Coagulant dose, pH, rapid mix"],
      ["Flocculation", "Form settleable floc", "Gentle mixing, G value"],
      ["Sedimentation", "Remove floc by gravity", "Overflow rate (m³/m²/day)"],
      ["Filtration", "Remove remaining particles", "Turbidity ≤ 0.3 NTU (95%)"],
      ["Disinfection", "Inactivate pathogens", "CT value, residual"],
    ],
    examTips: [
      "Coagulation requires rapid mixing; flocculation requires gentle mixing",
      "Alum lowers pH — lime or soda ash may be needed to adjust",
      "Filter turbidity must be ≤ 0.3 NTU in 95% of readings (not just average)",
      "Sludge from sedimentation must be disposed of properly — it cannot be discharged to a watercourse",
    ],
  },

  "Wastewater Treatment": {
    title: "Wastewater Treatment",
    intro:
      "Wastewater treatment removes contaminants from sewage before it is discharged to the environment. The OIT exam covers the basic treatment stages and the key parameters used to measure treatment performance.",
    keyPoints: [
      {
        heading: "Primary Treatment",
        body: "Primary treatment uses physical processes — screening, grit removal, and primary sedimentation — to remove large solids and settleable material. It typically removes 25–35% of BOD and 50–70% of suspended solids. Primary sludge is collected from the bottom of primary clarifiers.",
      },
      {
        heading: "Secondary Treatment",
        body: "Secondary treatment uses biological processes to remove dissolved organic matter. The activated sludge process is most common — microorganisms consume organic matter in an aeration basin, then the mixed liquor is settled in a secondary clarifier. The return activated sludge (RAS) recycles microorganisms back to the aeration basin.",
      },
      {
        heading: "Key Parameters",
        body: "BOD (Biochemical Oxygen Demand) measures the oxygen required by microorganisms to break down organic matter — lower effluent BOD means better treatment. TSS (Total Suspended Solids) measures the solid particles in the water. MLSS (Mixed Liquor Suspended Solids) is the concentration of microorganisms in the aeration basin, typically 2,000–4,000 mg/L.",
      },
      {
        heading: "Sludge Management",
        body: "Sludge from primary and secondary treatment must be thickened, digested, and dewatered before disposal. Anaerobic digestion breaks down organic matter in the absence of oxygen, producing biogas (methane) that can be used for energy. Dewatered biosolids can be land-applied if they meet regulatory standards.",
      },
    ],
    tableHeadings: ["Stage", "Process", "Removes"],
    tableRows: [
      ["Preliminary", "Screening, grit removal", "Large solids, grit"],
      ["Primary", "Sedimentation", "25–35% BOD, 50–70% TSS"],
      ["Secondary", "Activated sludge / biofilm", "85–95% BOD, 85–95% TSS"],
      ["Tertiary", "Filtration, disinfection", "Nutrients, pathogens"],
    ],
    examTips: [
      "BOD removal efficiency is the primary measure of secondary treatment performance",
      "RAS recycles microorganisms; WAS (waste activated sludge) removes excess biomass",
      "MLSS too low = poor treatment; MLSS too high = poor settling",
      "Anaerobic digestion produces methane — a combustible gas requiring safety precautions",
    ],
  },

  "Water Quality & Sampling": {
    title: "Water Quality & Sampling",
    intro:
      "Water quality monitoring ensures that treated water meets regulatory standards before it reaches consumers. The OIT exam tests your knowledge of sampling procedures, key parameters, and how to interpret results.",
    keyPoints: [
      {
        heading: "Key Water Quality Parameters",
        body: "Turbidity (NTU) measures water clarity — a surrogate for particle and pathogen removal. pH affects coagulation, disinfection efficiency, and corrosion. Chlorine residual must be maintained throughout the distribution system. Temperature affects disinfection (CT values) and chemical reaction rates.",
      },
      {
        heading: "Microbiological Sampling",
        body: "Total coliforms and E. coli are the primary indicators of microbiological contamination. Samples must be collected in sterile bottles with sodium thiosulfate to neutralize chlorine residual. Samples must be kept cold (1–10°C) and analyzed within 24 hours. Any detection of E. coli is an AWQI.",
      },
      {
        heading: "Sampling Locations",
        body: "O. Reg. 170/03 specifies the minimum number and location of samples based on system size and source type. Distribution system samples must be collected at representative locations — not just near the plant. Dead-end mains and areas with long residence times are priority sampling locations.",
      },
      {
        heading: "Chain of Custody",
        body: "Chain of custody (COC) documentation tracks samples from collection to analysis. It records who collected the sample, when, where, and how it was handled. COC is required for regulatory compliance and ensures results are legally defensible.",
      },
    ],
    tableHeadings: ["Parameter", "Standard / Limit", "Significance"],
    tableRows: [
      ["E. coli", "0 CFU/100 mL", "Fecal contamination indicator"],
      ["Total coliforms", "0 CFU/100 mL", "General contamination indicator"],
      ["Turbidity (treated)", "≤ 1 NTU at POE", "Particle and pathogen removal"],
      ["Free chlorine residual", "≥ 0.05 mg/L at POE", "Disinfection maintained"],
      ["pH", "6.5–8.5 (guideline)", "Corrosion and disinfection"],
    ],
    examTips: [
      "Samples for microbiology must be in sterile bottles with sodium thiosulfate",
      "E. coli = 0 CFU/100 mL — any detection triggers an AWQI",
      "Samples must be kept at 1–10°C and analyzed within 24 hours",
      "Distribution samples should target dead ends and areas with long residence times",
    ],
  },

  "Health & Safety": {
    title: "Health & Safety",
    intro:
      "Health and safety in water treatment protects operators from chemical hazards, confined space risks, electrical hazards, and physical dangers. The OIT exam tests your knowledge of WHMIS, confined space entry, lockout/tagout, and emergency procedures.",
    keyPoints: [
      {
        heading: "WHMIS 2015",
        body: "WHMIS (Workplace Hazardous Materials Information System) requires that all hazardous products be labelled and accompanied by a Safety Data Sheet (SDS). The SDS provides information on hazards, safe handling, storage, and emergency procedures. Operators must be trained on WHMIS before handling any hazardous chemical.",
      },
      {
        heading: "Confined Space Entry",
        body: "A confined space is a space large enough to enter, not designed for continuous occupancy, and with limited entry/exit. Water treatment plants have many confined spaces — wet wells, valve chambers, digesters. Entry requires a permit, atmospheric testing (oxygen, flammable gas, toxic gas), continuous monitoring, and a trained attendant outside.",
      },
      {
        heading: "Lockout/Tagout (LOTO)",
        body: "LOTO procedures prevent equipment from being accidentally energized while it is being serviced. All energy sources (electrical, hydraulic, pneumatic, gravity) must be isolated and locked before work begins. Each worker applies their own lock — the equipment cannot be started until all locks are removed.",
      },
      {
        heading: "Chemical Safety",
        body: "Chlorine gas is extremely hazardous — a leak requires immediate evacuation and use of SCBA (self-contained breathing apparatus). Chlorine and ammonia must never be stored together (they form toxic chloramine gas). Acids and bases must be stored separately. Spill response procedures must be posted and practiced.",
      },
    ],
    tableHeadings: ["Hazard", "Key Control", "Regulatory Reference"],
    tableRows: [
      ["Chemical exposure", "SDS, PPE, WHMIS training", "WHMIS 2015 / OHSA"],
      ["Confined space", "Permit, atmospheric testing, attendant", "O. Reg. 632/05"],
      ["Electrical hazard", "Lockout/Tagout", "O. Reg. 851 (Industrial)"],
      ["Chlorine gas leak", "SCBA, evacuation, emergency plan", "WHMIS / OHSA"],
    ],
    examTips: [
      "Confined space entry always requires atmospheric testing before entry",
      "Each worker applies their own lock in LOTO — never share a lock",
      "Chlorine gas is heavier than air — it accumulates at floor level",
      "SDS must be accessible to all workers who handle the chemical",
    ],
  },
};

// ─── Class 1 Water Module Overviews ─────────────────────────────────────────
export const CLASS1_WATER_OVERVIEWS: Record<string, ModuleOverview> = {
  "Water Sources & Quality": {
    title: "Water Sources & Quality",
    intro:
      "Understanding where drinking water comes from and what's in it is the starting point for all water treatment. The Class 1 Water exam tests your knowledge of surface water vs. groundwater characteristics, how source water quality affects treatment decisions, and Ontario's regulatory framework for source protection.",
    keyPoints: [
      {
        heading: "Surface Water vs. Groundwater",
        body: "Surface water (lakes, rivers) has variable quality — susceptible to turbidity, algae, runoff, and seasonal changes. Groundwater is generally more stable but may have elevated hardness, iron, manganese, or naturally occurring contaminants. The treatment approach must match the source type.",
      },
      {
        heading: "Key Water Quality Parameters",
        body: "Turbidity (NTU) measures suspended particles — high turbidity shields pathogens from disinfection. Colour (TCU) indicates dissolved organics. pH affects coagulation efficiency and disinfection. Temperature affects reaction rates — cold water requires more coagulant and longer contact times for disinfection.",
      },
      {
        heading: "Source Protection (Ontario)",
        body: "Ontario's Clean Water Act (2006) requires Source Protection Plans for all municipal drinking water systems. Significant drinking water threats (e.g., fuel storage, agriculture) in vulnerable areas must be managed. Operators must understand their intake's vulnerability and the threats identified in their Source Protection Plan.",
      },
      {
        heading: "Drinking Water Standards",
        body: "Ontario Drinking Water Quality Standards (O. Reg. 169/03) set maximum acceptable concentrations (MACs) for chemical parameters and health-based standards for microbiological parameters. The Ontario Drinking Water Surveillance Program (ODWSP) monitors raw and treated water quality across the province.",
      },
    ],
    tableHeadings: ["Parameter", "Surface Water Typical Range", "Concern"],
    tableRows: [
      ["Turbidity", "1–100+ NTU (variable)", "Pathogen shielding, filter performance"],
      ["Colour", "5–50+ TCU", "DBP precursors (THMs, HAAs)"],
      ["pH", "6.5–8.5", "Coagulation efficiency, corrosion"],
      ["Temperature", "0–25°C (seasonal)", "Disinfection CT, coagulant dose"],
    ],
    examTips: [
      "High turbidity reduces disinfection effectiveness — always treat turbidity before disinfecting",
      "O. Reg. 169/03 sets the Ontario drinking water standards — know the MAC for nitrate (10 mg/L as N)",
      "The 4-3-2-1 rule: 4 log Giardia, 3 log Cryptosporidium, 2 log virus inactivation required",
      "Source protection plans are legally binding in Ontario under the Clean Water Act",
    ],
  },

  "Coagulation & Flocculation": {
    title: "Coagulation & Flocculation",
    intro:
      "Coagulation and flocculation are the first treatment steps for surface water systems. They destabilize and aggregate suspended particles so they can be removed by sedimentation and filtration. This is one of the most heavily tested topics on the Class 1 Water exam — especially coagulant chemistry, jar testing, and pH control.",
    keyPoints: [
      {
        heading: "Coagulation",
        body: "Coagulation neutralizes the negative charge on suspended particles (colloids), allowing them to come together. Common coagulants: alum (aluminum sulfate) — optimal pH 6.0–7.5; ferric sulfate/ferric chloride — optimal pH 4.5–8.5 (wider range). Rapid mixing disperses the coagulant quickly — typically 1–3 minutes at high velocity (G = 300–1000 s⁻¹).",
      },
      {
        heading: "Flocculation",
        body: "Flocculation gently agitates the water to encourage particle collisions and growth of floc. Slow mixing (G = 10–75 s⁻¹) for 20–40 minutes. Over-mixing breaks apart floc. The velocity gradient (G) and detention time (Gt value) are used to optimize flocculation performance.",
      },
      {
        heading: "Jar Testing",
        body: "Jar testing simulates the coagulation/flocculation/sedimentation process at bench scale to determine optimal coagulant dose and pH. Operators adjust coagulant dose, pH, and mixing conditions to find the combination that produces the best settled water turbidity. Results guide full-scale plant operation.",
      },
      {
        heading: "pH and Alkalinity",
        body: "Alum consumes alkalinity and lowers pH. If natural alkalinity is insufficient, lime or soda ash is added to maintain the optimal pH range. Low alkalinity = poor coagulation. Monitoring pH and alkalinity before and after coagulant addition is essential for process control.",
      },
    ],
    formulaHint: "Alum dose (mg/L) × 0.45 = alkalinity consumed (mg/L as CaCO₃)",
    tableHeadings: ["Coagulant", "Optimal pH", "Notes"],
    tableRows: [
      ["Alum (Al₂(SO₄)₃)", "6.0–7.5", "Most common, consumes alkalinity"],
      ["Ferric sulfate", "4.5–8.5", "Wider pH range, darker floc"],
      ["Ferric chloride", "4.5–8.5", "Similar to ferric sulfate"],
      ["Polyaluminum chloride (PACl)", "5.5–8.0", "Less pH-sensitive, less sludge"],
    ],
    examTips: [
      "Alum works best at pH 6.0–7.5 — if pH is outside this range, coagulation will be poor",
      "Jar testing is the standard method to determine optimal coagulant dose",
      "Rapid mix disperses coagulant; slow mix (flocculation) builds floc — don't confuse the two",
      "Zeta potential measures the charge on particles — near zero = good coagulation",
    ],
  },

  "Sedimentation": {
    title: "Sedimentation",
    intro:
      "Sedimentation (clarification) removes floc particles from water by gravity settling after coagulation and flocculation. Understanding settling theory, overflow rate, and sludge management is essential for Class 1 Water operators.",
    keyPoints: [
      {
        heading: "Settling Theory",
        body: "Particles settle at a rate determined by Stokes' Law — larger, denser particles settle faster. The overflow rate (surface loading rate) is the key design parameter: flow rate divided by surface area (m³/m²·day or gpd/ft²). Particles with a settling velocity greater than the overflow rate will be removed.",
      },
      {
        heading: "Types of Clarifiers",
        body: "Conventional rectangular or circular clarifiers have four zones: inlet, settling, sludge, and outlet. Tube settlers and lamella plates increase effective settling area without enlarging the tank footprint — they are common in upgrades to increase capacity. Upflow clarifiers (solids contact units) combine coagulation, flocculation, and sedimentation in one unit.",
      },
      {
        heading: "Overflow Rate & Detention Time",
        body: "Typical overflow rate: 20–40 m³/m²·day for conventional clarifiers. Typical detention time: 2–4 hours. High flow events (storms) increase overflow rate and reduce detention time — this is when settled water turbidity typically rises. Operators must respond by increasing coagulant dose or reducing flow.",
      },
      {
        heading: "Sludge Management",
        body: "Settled sludge accumulates at the bottom and must be removed regularly. Sludge blanket level monitoring prevents carry-over of solids into the filter. Sludge is typically thickened and sent to lagoons or dewatered for disposal. Alum sludge is not classified as hazardous in Ontario but must be managed per local regulations.",
      },
    ],
    formulaHint: "Overflow Rate = Flow (m³/day) ÷ Surface Area (m²)",
    tableHeadings: ["Parameter", "Typical Value", "Impact if Exceeded"],
    tableRows: [
      ["Overflow rate", "20–40 m³/m²·day", "Poor settling, turbidity breakthrough"],
      ["Detention time", "2–4 hours", "Insufficient settling"],
      ["Sludge blanket", "Below weir by ≥1 m", "Solids carryover to filters"],
    ],
    examTips: [
      "Overflow rate is the most important design parameter for sedimentation — know how to calculate it",
      "High turbidity in settled water = too high overflow rate, poor coagulation, or rising sludge blanket",
      "Weir loading rate (flow per unit length of weir) affects outlet zone performance",
      "Short-circuiting reduces effective detention time — baffles help prevent it",
    ],
  },

  "Filtration": {
    title: "Filtration",
    intro:
      "Filtration is the final physical treatment step before disinfection. Filters remove residual floc, turbidity, and pathogens (especially Cryptosporidium, which is resistant to chlorine). Proper filter operation and backwashing are critical for producing safe drinking water and meeting Ontario's turbidity requirements.",
    keyPoints: [
      {
        heading: "Rapid Sand Filtration",
        body: "Rapid sand filters use a bed of sand (and often anthracite) to physically strain and adsorb particles. Typical filtration rate: 5–15 m/h. As the filter loads with solids, headloss increases. Filters are taken offline for backwashing when headloss reaches the terminal value or filtered water turbidity rises above 0.1 NTU.",
      },
      {
        heading: "Filter Media",
        body: "Dual-media filters (anthracite over sand) allow deeper penetration of solids and longer filter runs than single-media sand filters. Anthracite (lighter, coarser) sits on top; sand (denser, finer) on the bottom. GAC (granular activated carbon) may replace anthracite for taste/odour and DBP precursor removal.",
      },
      {
        heading: "Backwashing",
        body: "Backwashing reverses flow through the filter to expand the media bed and flush out accumulated solids. Backwash rate must be sufficient to expand the bed (30–50% expansion) but not wash out media. Air scour before backwash improves cleaning efficiency. Backwash water is collected and typically recycled to the head of the plant.",
      },
      {
        heading: "Filter-to-Waste & Ripening",
        body: "After backwashing, filters go through a ripening period where turbidity is elevated. Filter-to-waste (bypassing the clearwell) is used during ripening to prevent unfiltered water from entering the distribution system. O. Reg. 170/03 requires filtered water turbidity ≤ 0.3 NTU (95th percentile) and never exceeding 1.0 NTU.",
      },
    ],
    formulaHint: "Filtration Rate = Flow (m³/h) ÷ Filter Area (m²)",
    tableHeadings: ["Parameter", "Typical Value / Limit", "Regulatory Reference"],
    tableRows: [
      ["Filtered water turbidity", "≤0.3 NTU (95th %ile)", "O. Reg. 170/03"],
      ["Maximum filtered turbidity", "≤1.0 NTU at all times", "O. Reg. 170/03"],
      ["Filtration rate", "5–15 m/h", "Design standard"],
      ["Backwash bed expansion", "30–50%", "Operational guideline"],
    ],
    examTips: [
      "Filtered water turbidity must be ≤0.3 NTU (95th percentile) and never >1.0 NTU per O. Reg. 170/03",
      "Cryptosporidium is resistant to chlorine — filtration is the primary removal mechanism",
      "Filter-to-waste prevents post-backwash turbidity spikes from entering the clearwell",
      "Headloss increase = filter loading up; sudden turbidity increase = filter breakthrough",
    ],
  },

  "Disinfection": {
    title: "Disinfection",
    intro:
      "Disinfection is the last barrier before water enters the distribution system. It inactivates pathogens that have passed through all previous treatment steps. CT values, residual requirements, and disinfection by-product (DBP) formation are the core concepts tested on the Class 1 Water exam.",
    keyPoints: [
      {
        heading: "CT Values",
        body: "CT = Concentration (mg/L) × Contact Time (minutes). A higher CT means more disinfection credit. Temperature and pH affect CT requirements — colder water and higher pH require a higher CT to achieve the same inactivation. CT tables (from Health Canada / USEPA) specify the CT needed for 3-log Giardia and 4-log virus inactivation.",
      },
      {
        heading: "Chlorine Chemistry",
        body: "When chlorine is added to water, it forms hypochlorous acid (HOCl) and hypochlorite ion (OCl⁻). HOCl is the more effective disinfectant — it dominates at pH <7.5. At higher pH, OCl⁻ dominates and disinfection efficiency drops. This is why pH control matters for disinfection performance.",
      },
      {
        heading: "Disinfection By-Products (DBPs)",
        body: "Chlorine reacts with natural organic matter (NOM) to form trihalomethanes (THMs) and haloacetic acids (HAAs). Ontario MAC for THMs: 0.1 mg/L (100 µg/L); HAAs: 0.08 mg/L (80 µg/L). DBP formation increases with higher chlorine dose, higher NOM, higher temperature, and longer contact time. Removing NOM before disinfection (coagulation, filtration) reduces DBP formation.",
      },
      {
        heading: "Residual Requirements (Ontario)",
        body: "O. Reg. 170/03 requires a minimum free chlorine residual of 0.05 mg/L at the point of entry to the distribution system and throughout the system. Operators must monitor and log residuals. A detectable residual at the far ends of the system confirms ongoing protection against recontamination.",
      },
    ],
    formulaHint: "CT = C (mg/L) × T (minutes) | Chlorine Dose = Demand + Residual",
    tableHeadings: ["Disinfectant", "Primary Use", "Key Advantage", "Key Limitation"],
    tableRows: [
      ["Free chlorine", "Primary disinfection + residual", "Low cost, well understood", "DBP formation, pH-sensitive"],
      ["Chloramines", "Distribution system residual", "Less DBPs, stable residual", "Weaker disinfectant, nitrification risk"],
      ["UV", "Cryptosporidium inactivation", "No DBPs, effective vs. Crypto", "No residual"],
      ["Ozone", "Taste/odour, pre-disinfection", "Strong oxidant, no chlorine DBPs", "No residual, expensive"],
    ],
    examTips: [
      "CT requirement increases as temperature decreases — always check the temperature when calculating CT",
      "HOCl is more effective than OCl⁻ — lower pH favours HOCl (better disinfection)",
      "Ontario MAC: THMs = 0.1 mg/L, HAAs = 0.08 mg/L",
      "Minimum free chlorine residual at point of entry: 0.05 mg/L (O. Reg. 170/03)",
    ],
  },

  "Chemical Feed & Dosing": {
    title: "Chemical Feed & Dosing",
    intro:
      "Accurate chemical dosing is fundamental to water treatment. Operators must be able to calculate chemical doses, understand feed system types, and troubleshoot dosing problems. This module is heavily calculation-focused on the Class 1 Water exam.",
    keyPoints: [
      {
        heading: "Dose Calculations",
        body: "Chemical dose (mg/L) × flow rate (L/s or MLD) = mass feed rate (mg/s or kg/day). Always convert units carefully. For liquid chemicals, convert from mg/L to mL/min using the chemical's concentration and density. For dry chemicals, account for purity (e.g., 98% alum means 98 g of active ingredient per 100 g of product).",
      },
      {
        heading: "Chemical Feed Systems",
        body: "Dry feeders (volumetric or gravimetric) are used for powdered or granular chemicals (alum, lime, soda ash). Liquid chemical metering pumps (diaphragm, peristaltic) are used for solutions (sodium hypochlorite, ferric chloride). Gravimetric feeders are more accurate than volumetric. Pump calibration must be verified regularly.",
      },
      {
        heading: "Chemical Storage & Safety",
        body: "Chemicals must be stored per WHMIS requirements with SDS accessible. Incompatible chemicals (acids/bases, oxidizers/reducers) must be stored separately. Secondary containment (berms, drip trays) is required for liquid chemicals. Chlorine gas cylinders require leak detectors and emergency scrubbers.",
      },
      {
        heading: "Fluoridation",
        body: "Many Ontario systems add fluoride to drinking water at a target of 0.7 mg/L (Health Canada guideline). Common fluoride chemicals: hydrofluosilicic acid (liquid), sodium silicofluoride (dry), sodium fluoride (dry). Fluoride dosing must be carefully controlled — the MAC is 1.5 mg/L.",
      },
    ],
    formulaHint: "Feed Rate (kg/day) = Dose (mg/L) × Flow (ML/day) × 1 kg/1,000,000 mg × 1,000,000 L/ML",
    tableHeadings: ["Chemical", "Purpose", "Typical Form"],
    tableRows: [
      ["Alum", "Coagulation", "Liquid or dry"],
      ["Sodium hypochlorite", "Disinfection", "Liquid (10–15%)"],
      ["Lime / soda ash", "pH adjustment, softening", "Dry"],
      ["Hydrofluosilicic acid", "Fluoridation", "Liquid"],
      ["Sodium bisulfite", "Dechlorination", "Dry or liquid"],
    ],
    examTips: [
      "Always check chemical purity when calculating dose — 98% alum ≠ 100% active ingredient",
      "Feed rate (kg/day) = dose (mg/L) × flow (ML/day) — memorize this formula",
      "Fluoride target: 0.7 mg/L; MAC: 1.5 mg/L per O. Reg. 169/03",
      "Pump calibration: collect output over a timed period and compare to setpoint",
    ],
  },

  "Iron & Manganese Removal": {
    title: "Iron & Manganese Removal",
    intro:
      "Iron and manganese are naturally occurring in groundwater and some surface waters. They cause aesthetic problems (staining, taste, odour) and can exceed Ontario's aesthetic objectives. Removal typically involves oxidation followed by filtration. This is a common topic in Class 1 Water exams for systems drawing from groundwater.",
    keyPoints: [
      {
        heading: "Why Iron & Manganese Are Problematic",
        body: "Iron (Fe²⁺) and manganese (Mn²⁺) are soluble in reduced (low-oxygen) groundwater. When exposed to air or oxidants, they oxidize to insoluble Fe³⁺ and MnO₂, forming reddish-brown (iron) or black (manganese) precipitates. These cause staining of laundry and fixtures, bitter/metallic taste, and can support bacterial growth (iron bacteria).",
      },
      {
        heading: "Oxidation Methods",
        body: "Aeration (cascade, spray, packed tower) is the simplest method — introduces oxygen to oxidize iron. Chlorine, potassium permanganate (KMnO₄), and ozone are chemical oxidants used when aeration alone is insufficient (especially for manganese, which oxidizes more slowly). Manganese requires a higher oxidation potential than iron.",
      },
      {
        heading: "Filtration",
        body: "After oxidation, precipitated iron and manganese are removed by filtration. Greensand filters (coated with MnO₂) catalyze manganese oxidation and removal. Birm media works similarly. Filters must be backwashed regularly to remove accumulated precipitates. KMnO₄ regeneration of greensand is required periodically.",
      },
      {
        heading: "Ontario Aesthetic Objectives",
        body: "Ontario Drinking Water Quality Standards (O. Reg. 169/03) set aesthetic objectives (not MACs) for iron and manganese: Iron AO = 0.3 mg/L; Manganese AO = 0.05 mg/L. Exceedances cause customer complaints but are not health-based limits. However, manganese has a health-based MAC of 0.12 mg/L for infants.",
      },
    ],
    tableHeadings: ["Parameter", "Aesthetic Objective", "Health MAC"],
    tableRows: [
      ["Iron (Fe)", "0.3 mg/L", "None (aesthetic only)"],
      ["Manganese (Mn)", "0.05 mg/L", "0.12 mg/L (infants)"],
    ],
    examTips: [
      "Iron oxidizes faster than manganese — manganese may require chemical oxidants (KMnO₄, chlorine)",
      "Greensand filters catalyze manganese removal — they must be regenerated with KMnO₄",
      "Iron AO = 0.3 mg/L; Manganese AO = 0.05 mg/L (O. Reg. 169/03)",
      "Iron bacteria (Gallionella, Leptothrix) thrive in iron-rich water — can cause biofouling in distribution",
    ],
  },

  "Water Quality & Regulations": {
    title: "Water Quality & Regulations",
    intro:
      "Ontario has one of the most comprehensive drinking water regulatory frameworks in the world, built largely in response to the Walkerton tragedy (2000). Class 1 Water operators must know the key regulations, reporting requirements, and adverse water quality incident (AWQI) response procedures.",
    keyPoints: [
      {
        heading: "Key Ontario Regulations",
        body: "O. Reg. 170/03 (Drinking Water Systems) — operational requirements, sampling, reporting, and corrective action for municipal residential systems. O. Reg. 169/03 — Ontario Drinking Water Quality Standards (MACs, AOs, operational technology objectives). Safe Drinking Water Act (2002) — the overarching legislation. The Drinking Water Quality Management Standard (DWQMS) — requires a Quality Management System for licensed operators.",
      },
      {
        heading: "Adverse Water Quality Incidents (AWQIs)",
        body: "An AWQI is any result that exceeds an Ontario standard or indicates a potential health risk. Operators must notify the local Medical Officer of Health (MOH) and the Ministry of the Environment within specific timeframes. E. coli or total coliform in treated water = immediate notification. Exceedance of a chemical MAC = notification within 24 hours.",
      },
      {
        heading: "Sampling Requirements",
        body: "O. Reg. 170/03 specifies minimum sampling frequencies for microbiological and chemical parameters based on system size and type. Distribution system sampling must be at representative locations. Results must be reported to the owner and posted publicly. Operators must maintain records for a minimum of 5 years.",
      },
      {
        heading: "Operator Licensing",
        body: "Ontario requires all drinking water system operators to hold a valid licence issued by the MECP. Licence class (1–4) must match or exceed the system's classification. Operators must complete continuing education (30 hours per 3-year cycle) to maintain their licence. The owner is responsible for ensuring all operators are licensed.",
      },
    ],
    tableHeadings: ["Regulation", "Key Requirement"],
    tableRows: [
      ["O. Reg. 170/03", "Operational standards, sampling, reporting, AWQIs"],
      ["O. Reg. 169/03", "Drinking water quality standards (MACs, AOs)"],
      ["Safe Drinking Water Act", "Overarching legislation, licensing, enforcement"],
      ["DWQMS", "Quality Management System for licensed systems"],
    ],
    examTips: [
      "E. coli in treated water = immediate notification to MOH and MECP — no delay",
      "AWQI reporting timelines: microbiological = immediate; chemical MAC = within 24 hours",
      "Operator licence class must match or exceed the system classification",
      "Records must be kept for a minimum of 5 years under O. Reg. 170/03",
    ],
  },
};

// ─── Class 2 Water Module Overviews ─────────────────────────────────────────
export const CLASS2_WATER_OVERVIEWS: Record<string, ModuleOverview> = {
  "Treatment Process": {
    title: "Treatment Process",
    intro:
      "Class 2 Water treatment requires a deeper understanding of the full treatment train — from source water intake through to distribution. At this level, operators are expected to understand process interactions, optimize treatment for varying source water conditions, and troubleshoot performance issues. Spellman's Handbook identifies coagulation, filtration, and disinfection as the three most critical unit processes for surface water treatment.",
    keyPoints: [
      {
        heading: "Coagulation & Flocculation",
        body: "Alum (aluminum sulfate) is the most common coagulant in Ontario, working optimally at pH 6.0–7.5. Ferric coagulants (ferric sulfate, ferric chloride) work over a wider pH range (4.5–8.5). Coagulant dose is determined by jar testing. Rapid mix disperses coagulant (G = 300–1000 s⁻¹, 1–3 min); slow mix builds floc (G = 10–75 s⁻¹, 20–40 min). Polymer aids can improve floc strength and settling.",
      },
      {
        heading: "Sedimentation",
        body: "Primary clarifiers and settling basins remove coagulated floc before filtration. Key design parameters: surface overflow rate (SOR) = 20–40 m³/m²/day for conventional clarifiers; hydraulic retention time (HRT) = 2–4 hours. Tube settlers and plate settlers increase effective settling area and allow higher SOR. Sludge blanket clarifiers (upflow) are common in Ontario surface water plants.",
      },
      {
        heading: "Filtration",
        body: "Rapid sand filtration removes residual turbidity after sedimentation. Dual-media filters (anthracite over sand) provide deeper particle penetration and longer filter runs. Filter run length depends on headloss buildup and turbidity breakthrough. Backwashing at 15–25% bed expansion cleans the media. Filter-to-waste (ripening period) prevents turbidity breakthrough after backwashing. Effluent turbidity must be ≤0.3 NTU (95th percentile) under O. Reg. 170/03.",
      },
      {
        heading: "Softening",
        body: "Lime softening removes hardness (calcium and magnesium) by raising pH to precipitate CaCO₃ and Mg(OH)₂. Excess lime process raises pH to 10.5–11 to remove both Ca and Mg. Recarbonation (CO₂ addition) stabilizes the water after softening. Ion exchange softening uses sodium-form resin to exchange Ca²⁺ and Mg²⁺ for Na⁺ — common in small systems.",
      },
    ],
    tableHeadings: ["Process", "Purpose", "Key Parameter"],
    tableRows: [
      ["Coagulation", "Destabilize colloids", "Coagulant dose, pH 6.0–7.5 (alum)"],
      ["Flocculation", "Build settleable floc", "G = 10–75 s⁻¹, 20–40 min"],
      ["Sedimentation", "Remove floc", "SOR 20–40 m³/m²/day, HRT 2–4 hr"],
      ["Filtration", "Remove residual turbidity", "Effluent ≤0.3 NTU (O. Reg. 170/03)"],
      ["Softening", "Remove hardness", "Lime dose, pH 10.5–11 (excess lime)"],
    ],
    examTips: [
      "Jar testing determines optimal coagulant dose — run it when source water quality changes",
      "Filter turbidity must be ≤0.3 NTU (95th percentile) under Ontario regulations",
      "Excess lime softening raises pH to 10.5–11 to remove both calcium and magnesium",
      "Backwash at 15–25% bed expansion — too little doesn't clean, too much loses media",
    ],
    formulaHint: "SOR (m³/m²/day) = Flow (m³/day) ÷ Surface Area (m²) | HRT (hr) = Volume (m³) ÷ Flow (m³/hr)",
  },

  "Source Water Characteristics": {
    title: "Source Water Characteristics",
    intro:
      "Class 2 operators must understand how source water quality varies seasonally and how those variations drive treatment decisions. Surface water quality is highly dynamic — spring runoff, algal blooms, and storm events can dramatically change turbidity, colour, taste, and odour. Groundwater is more stable but may require treatment for hardness, iron, manganese, or naturally occurring contaminants.",
    keyPoints: [
      {
        heading: "Surface Water Variability",
        body: "Turbidity spikes during spring runoff and storm events — operators must increase coagulant dose and monitor filter performance closely. Algal blooms (summer/fall) produce taste and odour compounds (geosmin, MIB) and can release cyanotoxins. Temperature drops in winter slow coagulation and disinfection reactions — adjust doses accordingly. Seasonal stratification in reservoirs can cause anoxic bottom water with elevated iron, manganese, and H₂S.",
      },
      {
        heading: "Groundwater Characteristics",
        body: "Groundwater is generally low in turbidity and microbiological contamination but may require treatment for: iron (>0.3 mg/L causes staining), manganese (>0.05 mg/L causes black deposits), hardness (>200 mg/L as CaCO₃ causes scale), nitrate (>10 mg/L as N is a health concern), and naturally occurring radionuclides (radon, radium). Under-the-influence-of-surface-water (GUDI) wells require surface water treatment standards.",
      },
      {
        heading: "Taste & Odour",
        body: "Geosmin and 2-methylisoborneol (MIB) are the most common taste and odour compounds, produced by cyanobacteria and actinomycetes. Both are detectable at very low concentrations (5–10 ng/L). Activated carbon (PAC or GAC) is the most effective treatment. Chlorine can worsen taste and odour by reacting with precursors. Ozone is effective but expensive.",
      },
      {
        heading: "Source Protection (Ontario)",
        body: "Ontario's Clean Water Act (2006) requires Source Protection Plans identifying significant drinking water threats in vulnerable areas. Operators must know their intake's vulnerability and the threats in their Source Protection Plan. Intake protection zones (IPZs) restrict activities near surface water intakes. Wellhead protection areas (WHPAs) restrict land use near groundwater wells.",
      },
    ],
    tableHeadings: ["Parameter", "Concern Level", "Treatment Response"],
    tableRows: [
      ["Turbidity >1 NTU (filtered)", "Regulatory exceedance", "Increase coagulant, check filters"],
      ["Iron >0.3 mg/L", "Aesthetic (staining)", "Oxidation + filtration"],
      ["Manganese >0.05 mg/L", "Aesthetic + health", "Oxidation at pH >8.5 + filtration"],
      ["Nitrate >10 mg/L as N", "Health (blue baby)", "Ion exchange or RO"],
      ["Geosmin/MIB", "Taste & odour", "PAC addition, ozone"],
    ],
    examTips: [
      "GUDI wells must meet surface water treatment requirements — same as lakes and rivers",
      "Manganese oxidizes more slowly than iron — requires higher pH (>8.5) or strong oxidant",
      "Geosmin and MIB are best treated with powdered activated carbon (PAC)",
      "Spring runoff = highest turbidity risk — increase monitoring frequency and coagulant dose",
    ],
  },

  "Chemical Feed": {
    title: "Chemical Feed",
    intro:
      "Chemical feed systems deliver treatment chemicals at precise, controlled rates. Class 2 operators must understand chemical properties, dosing calculations, feed system types, and safety requirements. Errors in chemical dosing can cause treatment failures, regulatory exceedances, or safety incidents. Spellman emphasizes that chemical feed accuracy is fundamental to all treatment processes.",
    keyPoints: [
      {
        heading: "Chemical Feed Systems",
        body: "Dry feeders (volumetric or gravimetric) are used for powdered chemicals (alum, lime, PAC). Solution feeders (metering pumps) are used for liquid chemicals (sodium hypochlorite, ferric chloride, polymer). Gravimetric feeders are more accurate than volumetric feeders. Chemical feed rate must be proportional to flow — use flow-paced or flow-proportional control.",
      },
      {
        heading: "Dosing Calculations",
        body: "Chemical dose (mg/L) × Flow (L/s) × 86,400 s/day ÷ 1,000,000 = kg/day. For liquid chemicals: Feed rate (mL/min) = [Dose (mg/L) × Flow (L/min)] ÷ [Chemical concentration (mg/mL)]. Always verify units — mixing metric and imperial is a common exam trap. Calibrate chemical feed pumps regularly using a graduated cylinder and stopwatch.",
      },
      {
        heading: "Key Chemicals in Water Treatment",
        body: "Coagulants (alum, ferric chloride, PACl) — destabilize particles. Disinfectants (chlorine, sodium hypochlorite, chloramine, UV) — inactivate pathogens. pH adjustment (lime, soda ash, CO₂, sulfuric acid) — optimize coagulation and corrosion control. Fluoride (sodium fluorosilicate, hydrofluosilicic acid) — dental health. Corrosion inhibitors (orthophosphate, zinc orthophosphate) — reduce lead and copper leaching.",
      },
      {
        heading: "Chemical Safety",
        body: "Chlorine gas is toxic — requires gas detection, emergency response plan, and SCBA. Sodium hypochlorite degrades over time (loses strength) and reacts with acids to release chlorine gas. Alum and ferric chloride are acidic — corrosive to skin and equipment. Lime is caustic — dust inhalation hazard. All chemicals require SDS (Safety Data Sheets), proper PPE, and secondary containment.",
      },
    ],
    tableHeadings: ["Chemical", "Purpose", "Key Safety Concern"],
    tableRows: [
      ["Alum", "Coagulation", "Acidic, corrosive to skin"],
      ["Sodium hypochlorite", "Disinfection", "Degrades, reacts with acids → Cl₂ gas"],
      ["Chlorine gas", "Disinfection", "Highly toxic — SCBA required for leaks"],
      ["Lime (Ca(OH)₂)", "pH adjustment, softening", "Dust inhalation, caustic"],
      ["Hydrofluosilicic acid", "Fluoridation", "Highly corrosive — full PPE required"],
    ],
    examTips: [
      "Chemical dose (mg/L) × flow rate = mass feed rate — always check units",
      "Sodium hypochlorite loses strength over time — test concentration before use",
      "Never mix chlorine with ammonia or acids — toxic gas is produced",
      "Gravimetric feeders are more accurate than volumetric feeders for dry chemicals",
    ],
    formulaHint: "Feed rate (kg/day) = Dose (mg/L) × Flow (m³/day) ÷ 1,000",
  },

  "Disinfection": {
    title: "Disinfection",
    intro:
      "Disinfection at the Class 2 level requires mastery of CT calculations, disinfection byproduct (DBP) management, and the regulatory framework under O. Reg. 170/03. Class 2 systems are typically larger and more complex than Class 1, with multiple disinfection barriers and stricter monitoring requirements. CT values, log inactivation credits, and DBP formation are the most heavily tested topics.",
    keyPoints: [
      {
        heading: "CT Values and Log Inactivation",
        body: "CT (mg·min/L) = Residual concentration (mg/L) × Contact time (min). Ontario requires 4-log Giardia, 3-log Cryptosporidium, and 2-log virus inactivation. CT tables (from Health Canada and USEPA) give the CT required for each log of inactivation at a given temperature and pH. Cold water requires higher CT — at 1°C, the CT for 3-log Giardia inactivation with free chlorine is approximately 165 mg·min/L; at 25°C it is approximately 11 mg·min/L.",
      },
      {
        heading: "Disinfection Byproducts (DBPs)",
        body: "Chlorine reacts with natural organic matter (NOM) to form trihalomethanes (THMs) and haloacetic acids (HAAs). Ontario MAC: total THMs ≤100 µg/L; HAA5 ≤80 µg/L. DBP formation increases with higher chlorine dose, higher NOM, higher temperature, longer contact time, and higher pH. Control strategies: reduce NOM before chlorination (coagulation, GAC), use alternative disinfectants (UV, ozone), minimize chlorine dose.",
      },
      {
        heading: "Chloramination",
        body: "Chloramines (combined chlorine) are formed by adding ammonia to chlorinated water. Chloramines produce fewer THMs and HAAs than free chlorine and provide a more stable residual in distribution. However, chloramines are weaker disinfectants (higher CT required), can cause nitrification in distribution, and are toxic to fish and dialysis patients. Breakpoint chlorination must be achieved before ammonia addition.",
      },
      {
        heading: "UV Disinfection",
        body: "UV light (254 nm) inactivates pathogens by damaging DNA — effective against Cryptosporidium and Giardia (which are resistant to chlorine). UV provides no residual — chlorine must be added after UV for distribution system protection. UV dose is measured in mJ/cm². Lamp fouling reduces UV intensity — lamps must be cleaned and replaced on schedule. Turbidity must be low (<1 NTU) for effective UV penetration.",
      },
    ],
    tableHeadings: ["Disinfectant", "Effective Against", "Key Limitation"],
    tableRows: [
      ["Free chlorine", "Bacteria, viruses", "Ineffective against Crypto; forms THMs/HAAs"],
      ["Chloramines", "Bacteria (distribution)", "Weak disinfectant; nitrification risk"],
      ["UV", "Bacteria, viruses, Giardia, Crypto", "No residual; requires low turbidity"],
      ["Ozone", "All pathogens including Crypto", "No residual; expensive; bromate formation"],
    ],
    examTips: [
      "CT increases as temperature decreases — always use the coldest water temperature for CT calculations",
      "THMs and HAAs form when chlorine reacts with NOM — reduce NOM before chlorinating",
      "UV is the best option for Cryptosporidium inactivation — chlorine has very limited effect",
      "Chloramines provide a stable distribution residual but require higher CT than free chlorine",
    ],
    formulaHint: "CT (mg·min/L) = Residual (mg/L) × T₁₀ (min) | T₁₀ = theoretical contact time × baffling factor",
  },

  "Laboratory Analysis": {
    title: "Laboratory Analysis",
    intro:
      "Class 2 operators must understand laboratory procedures, quality assurance/quality control (QA/QC), and the interpretation of analytical results. Sampling frequency, sample preservation, holding times, and chain of custody are all regulated under O. Reg. 170/03. Laboratory errors can lead to regulatory violations or missed treatment problems.",
    keyPoints: [
      {
        heading: "Microbiological Testing",
        body: "E. coli is the primary indicator of fecal contamination in drinking water. Total coliforms indicate general sanitary quality. Under O. Reg. 170/03, treated water must have zero E. coli and zero total coliforms in 100 mL. Adverse results trigger immediate notification to the Medical Officer of Health (MOH) and MECP. Membrane filtration and presence/absence (P/A) tests are the standard methods.",
      },
      {
        heading: "Physical & Chemical Parameters",
        body: "Turbidity is measured continuously at filter effluent and distribution entry points. Chlorine residual (free and total) is measured at the point of entry and throughout distribution. pH, temperature, and conductivity are measured online. Hardness, alkalinity, iron, manganese, fluoride, and nitrate are measured periodically. All measurements must be recorded and retained for at least 5 years.",
      },
      {
        heading: "QA/QC Requirements",
        body: "Quality control includes: field blanks (detect contamination), duplicate samples (assess precision), matrix spikes (assess accuracy), and certified reference materials. Calibration of instruments must be documented. Chain of custody forms track samples from collection to analysis. Accredited laboratories must be used for regulatory samples under O. Reg. 170/03.",
      },
      {
        heading: "Adverse Water Quality Incidents (AWQIs)",
        body: "An AWQI is triggered when a sample result exceeds a standard or indicates a potential health risk. Microbiological AWQIs (E. coli detected) require immediate notification to MOH and MECP. Chemical AWQIs (MAC exceedance) require notification within 24 hours. Operators must investigate the cause, take corrective action, and document everything. Boil water advisories may be issued by the MOH.",
      },
    ],
    tableHeadings: ["Parameter", "Regulatory Limit", "Frequency"],
    tableRows: [
      ["E. coli", "0 per 100 mL", "As per O. Reg. 170/03 schedule"],
      ["Total coliforms", "0 per 100 mL", "As per O. Reg. 170/03 schedule"],
      ["Turbidity (filtered)", "≤0.3 NTU (95th %ile)", "Continuous"],
      ["Free chlorine residual", "≥0.05 mg/L (POE)", "Continuous / daily"],
      ["THMs", "≤100 µg/L", "Quarterly (large systems)"],
    ],
    examTips: [
      "E. coli in treated water = immediate notification to MOH and MECP — no delay",
      "Chemical MAC exceedances require notification within 24 hours",
      "Accredited labs must be used for regulatory samples — in-house results are not acceptable for compliance",
      "Chain of custody must be maintained from sample collection to lab analysis",
    ],
  },

  "Hydraulics": {
    title: "Hydraulics",
    intro:
      "Hydraulics at the Class 2 level covers pipe flow, pump systems, distribution system design, and pressure management. Operators must understand how to calculate flow rates, head losses, and pump performance, and how to maintain adequate pressure throughout the distribution system. Hydraulic modelling is increasingly used for system planning.",
    keyPoints: [
      {
        heading: "Pipe Flow and Head Loss",
        body: "Head loss in pipes is caused by friction (Darcy-Weisbach or Hazen-Williams equations) and minor losses (fittings, valves, meters). The Hazen-Williams equation is most commonly used in water distribution: V = 0.8492 × C × R^0.63 × S^0.54. The C-factor reflects pipe roughness — new PVC: C = 150; old cast iron: C = 80–100. Head loss increases with flow rate, pipe length, and decreasing pipe diameter.",
      },
      {
        heading: "Pump Systems",
        body: "Centrifugal pumps are the most common type in water systems. The pump curve shows the relationship between flow rate and head — as flow increases, head decreases. The system curve shows the head required at each flow rate. The operating point is where the pump curve intersects the system curve. Pumps in series add head; pumps in parallel add flow. NPSH (Net Positive Suction Head) must be adequate to prevent cavitation.",
      },
      {
        heading: "Distribution System Pressure",
        body: "Ontario requires a minimum residual pressure of 140 kPa (20 psi) at all service connections under normal operating conditions. Fire flow requirements may demand 275 kPa (40 psi) or higher. Pressure reducing valves (PRVs) protect low-elevation areas from excessive pressure. Elevated storage (water towers) provides pressure and emergency supply. Pressure zones are used in hilly terrain.",
      },
      {
        heading: "Water Hammer",
        body: "Water hammer occurs when flow is suddenly stopped (valve closure, pump shutdown), creating a pressure wave that travels through the pipe. Pressure surges can damage pipes, valves, and meters. Prevention: slow valve closure, surge tanks, air release valves, and pump control valves. Water hammer is most severe in long, large-diameter pipes with high velocities.",
      },
    ],
    tableHeadings: ["Parameter", "Typical Value", "Notes"],
    tableRows: [
      ["Min. distribution pressure", "140 kPa (20 psi)", "Ontario requirement"],
      ["Hazen-Williams C (new PVC)", "150", "Higher C = less friction"],
      ["Hazen-Williams C (old cast iron)", "80–100", "Tuberculation reduces C"],
      ["Typical distribution velocity", "0.6–1.5 m/s", "Higher = more head loss"],
    ],
    examTips: [
      "Minimum distribution pressure in Ontario is 140 kPa (20 psi) at service connections",
      "Pumps in series add head; pumps in parallel add flow — know which to use when",
      "Higher C-factor = smoother pipe = less head loss",
      "Cavitation occurs when suction pressure drops below vapour pressure — NPSH must be adequate",
    ],
    formulaHint: "Q = A × V | Head loss (Hazen-Williams): hf = 10.67 × L × Q^1.852 / (C^1.852 × D^4.87)",
  },

  "Equipment Operation & Maintenance": {
    title: "Equipment Operation & Maintenance",
    intro:
      "Class 2 operators are responsible for the operation and maintenance of all major equipment in the treatment plant and distribution system. Preventive maintenance programs, equipment records, and troubleshooting skills are essential. Equipment failures can cause treatment disruptions, regulatory violations, and safety incidents.",
    keyPoints: [
      {
        heading: "Pumps and Motors",
        body: "Centrifugal pumps require regular inspection of seals, bearings, impellers, and shaft alignment. Vibration, unusual noise, and excessive heat are early warning signs of bearing failure. Motor insulation resistance (megger test) should be checked annually. Variable frequency drives (VFDs) reduce energy consumption and water hammer by allowing gradual speed changes. Pump efficiency decreases as impellers wear.",
      },
      {
        heading: "Chemical Feed Equipment",
        body: "Metering pumps must be calibrated regularly — use a graduated cylinder and stopwatch. Check valves prevent backflow of chemicals into water lines. Injection points must be downstream of check valves. Dry feeders require regular cleaning to prevent bridging and caking. Chemical storage areas require secondary containment, ventilation, and spill response equipment.",
      },
      {
        heading: "Instrumentation & Control",
        body: "Online instruments (turbidimeters, chlorine analyzers, pH meters, flow meters) require regular calibration and maintenance. Turbidimeters must be calibrated with formazin or StablCal standards. Chlorine analyzers (amperometric or colorimetric) must be calibrated against grab sample results. SCADA systems allow remote monitoring and control — alarms must be responded to promptly.",
      },
      {
        heading: "Preventive Maintenance",
        body: "A preventive maintenance (PM) program schedules routine inspections, lubrication, calibration, and parts replacement before failures occur. PM records document all maintenance activities and are required by regulators. Equipment manuals (O&M manuals) specify manufacturer maintenance requirements. Critical spare parts (seals, bearings, impellers) should be kept on hand to minimize downtime.",
      },
    ],
    tableHeadings: ["Equipment", "Key Maintenance Task", "Frequency"],
    tableRows: [
      ["Centrifugal pumps", "Bearing inspection, seal check", "Monthly / annually"],
      ["Metering pumps", "Calibration, check valve inspection", "Monthly"],
      ["Turbidimeters", "Calibration with formazin standard", "Weekly / per manufacturer"],
      ["Chlorine analyzers", "Calibration against grab sample", "Daily / weekly"],
      ["Filters", "Backwash, media inspection", "Per headloss / turbidity"],
    ],
    examTips: [
      "Calibrate metering pumps with a graduated cylinder and stopwatch — not just the dial setting",
      "Vibration and unusual noise from a pump = bearing failure — investigate immediately",
      "SCADA alarms must be responded to — ignoring alarms is a regulatory violation",
      "Preventive maintenance records are required by regulators — document everything",
    ],
  },

  "Water Quality": {
    title: "Water Quality",
    intro:
      "Water quality management at the Class 2 level encompasses source-to-tap monitoring, regulatory compliance, corrosion control, and consumer complaint investigation. Ontario's Drinking Water Quality Standards (O. Reg. 169/03) set the legal limits, while O. Reg. 170/03 sets the monitoring and reporting requirements. Understanding the relationship between treatment and water quality is central to the Class 2 exam.",
    keyPoints: [
      {
        heading: "Regulatory Standards",
        body: "O. Reg. 169/03 sets maximum acceptable concentrations (MACs) for health-based parameters and aesthetic objectives (AOs) for taste, odour, and appearance. Key MACs: nitrate 10 mg/L as N, nitrite 1 mg/L as N, total THMs 100 µg/L, HAA5 80 µg/L, lead 0.01 mg/L, arsenic 0.01 mg/L. Key AOs: turbidity <1 NTU (treated), colour <15 TCU, iron <0.3 mg/L, manganese <0.05 mg/L.",
      },
      {
        heading: "Corrosion Control",
        body: "Corrosive water leaches lead and copper from pipes and fixtures. The Langelier Saturation Index (LSI) indicates whether water is corrosive (negative LSI) or scale-forming (positive LSI). Corrosion control strategies: adjust pH (target 7.5–8.5), add orthophosphate (forms protective coating on pipes), add silicate. Lead service lines are a major concern in older Ontario communities — corrosion control is critical.",
      },
      {
        heading: "Nitrification in Distribution",
        body: "Chloraminated systems are susceptible to nitrification — bacteria oxidize ammonia to nitrite and nitrate, consuming chloramine residual. Signs: declining chloramine residual, rising nitrite, rising HPC counts. Control: maintain adequate chloramine residual (>0.5 mg/L), flush dead ends, reduce water age, break-point chlorinate periodically.",
      },
      {
        heading: "Consumer Complaints",
        body: "Common complaints: taste and odour (chlorine, earthy/musty from geosmin/MIB), colour (iron, manganese, corrosion), turbidity (main breaks, construction), pressure (leaks, demand changes). Each complaint must be investigated, documented, and responded to. Consumer complaints are often the first indicator of a distribution system problem.",
      },
    ],
    tableHeadings: ["Parameter", "MAC / AO", "Health / Aesthetic Concern"],
    tableRows: [
      ["Nitrate", "10 mg/L as N (MAC)", "Methemoglobinemia (blue baby)"],
      ["Total THMs", "100 µg/L (MAC)", "Cancer risk (long-term)"],
      ["Lead", "0.01 mg/L (MAC)", "Neurotoxin — especially children"],
      ["Iron", "0.3 mg/L (AO)", "Staining, taste"],
      ["Manganese", "0.05 mg/L (AO)", "Black deposits, taste"],
    ],
    examTips: [
      "Negative LSI = corrosive water — add lime or orthophosphate to raise LSI toward zero",
      "Nitrification in distribution = declining chloramine residual + rising nitrite",
      "Lead leaches from pipes and solder — corrosion control is the primary mitigation",
      "Consumer taste/odour complaints in summer often indicate geosmin/MIB from algal blooms",
    ],
    formulaHint: "LSI = pH − pHs | pHs = (pK2 − pKs) + pCa + pAlk",
  },

  "Security, Safety & Administrative": {
    title: "Security, Safety & Administrative",
    intro:
      "Class 2 operators have greater administrative and security responsibilities than Class 1. This includes emergency response planning, security vulnerability assessments, operator licensing requirements, and record-keeping obligations under O. Reg. 170/03. The Overall Responsible Operator (ORO) is legally accountable for the system's compliance.",
    keyPoints: [
      {
        heading: "Operator Licensing",
        body: "Ontario water operators are licensed under O. Reg. 128/04. Licence classes (1–4) correspond to system classifications. The ORO must hold a licence equal to or higher than the system classification. Operators must complete continuing education and renew their licence every three years. Failure to maintain a valid licence can result in fines and prosecution.",
      },
      {
        heading: "Emergency Response Planning",
        body: "Every licensed drinking water system must have an Emergency Response Plan (ERP) under O. Reg. 170/03. The ERP must address loss of power, source water contamination, treatment failure, main breaks, and natural disasters. Plans must be tested and updated regularly. The ORO is responsible for ensuring the ERP is current and staff are trained.",
      },
      {
        heading: "Security",
        body: "Water system security includes physical security (fencing, locks, cameras), cyber security (SCADA access controls), and personnel security (background checks). Suspicious activity must be reported to police and the MECP. Security vulnerability assessments identify risks and mitigation measures. Post-9/11 security requirements have significantly increased for large systems.",
      },
      {
        heading: "Record-Keeping",
        body: "O. Reg. 170/03 requires operators to maintain records of all sampling results, operational data, maintenance activities, and adverse events for at least 5 years. Annual reports must be submitted to the MECP and made available to the public. The Drinking Water Quality Management Standard (DWQMS) requires a quality management system for large municipal systems.",
      },
    ],
    tableHeadings: ["Regulation", "Key Requirement"],
    tableRows: [
      ["O. Reg. 128/04", "Operator licensing — classes, renewal, ORO responsibilities"],
      ["O. Reg. 170/03", "Sampling, monitoring, reporting, record-keeping"],
      ["O. Reg. 169/03", "Drinking water quality standards (MACs and AOs)"],
      ["Safe Drinking Water Act", "Overall framework for drinking water protection in Ontario"],
      ["DWQMS", "Quality management system for large municipal systems"],
    ],
    examTips: [
      "The ORO is legally responsible for the system's compliance — this is a Class 2 exam favourite",
      "Emergency Response Plans must be tested and updated regularly — not just written and filed",
      "Records must be kept for 5 years under O. Reg. 170/03",
      "DWQMS is required for large municipal drinking water systems — Class 2 operators must know it",
    ],
  },
};

// ─── Class 2 Wastewater Module Overviews ─────────────────────────────────────
export const CLASS2_WASTEWATER_OVERVIEWS: Record<string, ModuleOverview> = {
  "Treatment Process": {
    title: "Treatment Process",
    intro:
      "Class 2 Wastewater treatment requires mastery of the full treatment train from preliminary through to advanced treatment. At this level, operators must understand process interactions, optimize activated sludge performance, and manage nutrient removal systems. Spellman's Handbook identifies activated sludge control and secondary clarifier performance as the most critical operational skills for Class 2 wastewater operators.",
    keyPoints: [
      {
        heading: "Activated Sludge Process Control",
        body: "The activated sludge process is controlled primarily through Sludge Retention Time (SRT) and the F/M ratio. SRT (sludge age) = Total biomass in system (kg) ÷ WAS rate (kg/day). Typical SRT: 5–15 days for conventional AS; 15–30 days for nitrification. MLSS target: 2,000–4,000 mg/L. SVI (Sludge Volume Index) measures settleability — target <150 mL/g; >200 indicates bulking. RAS rate: 50–100% of influent flow.",
      },
      {
        heading: "Secondary Clarifier Performance",
        body: "The secondary clarifier separates biomass from treated effluent. Key parameters: surface overflow rate (SOR) = 16–32 m³/m²/day; solids loading rate = 3–6 kg TSS/m²/hr; hydraulic retention time = 1.5–2.5 hr. High SOR or solids loading causes biomass carryover. Sludge blanket depth must be monitored — too deep causes anaerobic conditions and rising sludge. RAS pumping rate controls blanket depth.",
      },
      {
        heading: "Biological Nutrient Removal (BNR)",
        body: "BNR systems remove nitrogen and phosphorus using controlled aerobic, anoxic, and anaerobic zones. Nitrification (aerobic): NH₄⁺ → NO₃⁻ by Nitrosomonas and Nitrobacter. Denitrification (anoxic): NO₃⁻ → N₂ gas using BOD as carbon source. Bio-P (anaerobic then aerobic): PAOs release P in anaerobic zone, take up excess P in aerobic zone. Temperature is critical — nitrification slows significantly below 10°C.",
      },
      {
        heading: "Troubleshooting Activated Sludge",
        body: "Sludge bulking (high SVI): caused by filamentous organisms (low DO, low F/M, nutrient deficiency) — treat with chlorination of RAS, improve DO, adjust F/M. Rising sludge: denitrification in clarifier releasing N₂ bubbles — reduce sludge blanket depth, increase WAS. Foaming: caused by Nocardia or Microthrix — reduce SRT, add antifoam. Pin floc: very small, light floc that won't settle — increase SRT.",
      },
    ],
    tableHeadings: ["Parameter", "Typical Range", "Problem if Outside Range"],
    tableRows: [
      ["MLSS", "2,000–4,000 mg/L", "Too low: poor treatment / Too high: poor settling"],
      ["SRT", "5–15 days (conventional)", "Too low: washout / Too high: bulking"],
      ["SVI", "<150 mL/g (target)", ">200: bulking; poor settling"],
      ["DO in aeration", "1.5–3.0 mg/L", "Too low: filamentous bulking"],
      ["RAS rate", "50–100% of Q", "Too low: MLSS drops / Too high: dilution"],
    ],
    examTips: [
      "SVI >200 mL/g = sludge bulking — investigate DO, F/M, and filamentous organisms",
      "Rising sludge in clarifier = denitrification — reduce sludge blanket, increase WAS",
      "Nitrification requires SRT >10 days and DO >2 mg/L — cold temperatures require longer SRT",
      "Bio-P requires a true anaerobic zone (no O₂ AND no nitrate)",
    ],
    formulaHint: "SRT (days) = MLSS (mg/L) × Aeration volume (m³) ÷ [WAS (m³/day) × WAS TSS (mg/L)]",
  },

  "Collection Systems": {
    title: "Collection Systems",
    intro:
      "The wastewater collection system collects and conveys sewage from homes and businesses to the treatment plant. Class 2 operators must understand gravity sewer design, lift station operation, infiltration/inflow (I/I) management, and confined space safety. Collection system failures can cause sewage overflows, environmental damage, and regulatory violations.",
    keyPoints: [
      {
        heading: "Gravity Sewers",
        body: "Gravity sewers rely on slope to maintain self-cleaning velocity (minimum 0.6 m/s, or 2 ft/s) to prevent solids deposition. Manning's equation calculates flow velocity: V = (1/n) × R^(2/3) × S^(1/2). Common pipe materials: PVC, vitrified clay, concrete, ductile iron. Manholes provide access for inspection and maintenance. CCTV inspection identifies cracks, root intrusion, and offsets.",
      },
      {
        heading: "Lift Stations",
        body: "Lift stations (pump stations) are required where gravity flow is not possible. Wet well design must provide adequate detention time (5–30 min) and prevent septicity. Pumps are typically submersible or dry-pit centrifugal. Redundancy (at least 2 pumps) is required. Overflow prevention: high-level alarms, emergency generators, and bypass pumping capability. Lift stations require regular inspection of pumps, valves, floats, and controls.",
      },
      {
        heading: "Infiltration & Inflow (I/I)",
        body: "Infiltration: groundwater entering through cracks and joints in pipes and manholes. Inflow: surface water entering through manhole covers, catch basin connections, and foundation drains. I/I increases plant flow during wet weather, causing hydraulic overloading and treatment bypasses. Smoke testing, dye testing, and CCTV inspection identify I/I sources. Rehabilitation (pipe lining, manhole sealing) reduces I/I.",
      },
      {
        heading: "Sanitary Sewer Overflows (SSOs)",
        body: "An SSO occurs when sewage overflows from the collection system before reaching the treatment plant. SSOs are a regulatory violation and must be reported to the MECP immediately. Causes: blockages, pipe failures, pump station failures, and I/I during wet weather. Prevention: regular CCTV inspection, root cutting, grease trap enforcement, and lift station redundancy.",
      },
    ],
    tableHeadings: ["Parameter", "Typical Value", "Notes"],
    tableRows: [
      ["Min. self-cleaning velocity", "0.6 m/s (2 ft/s)", "Prevents solids deposition"],
      ["Lift station wet well HRT", "5–30 min", "Longer = septicity risk"],
      ["Pump redundancy", "N+1 (minimum 2 pumps)", "Required for reliability"],
      ["CCTV inspection frequency", "Per O&M program", "Identifies defects before failure"],
    ],
    examTips: [
      "Minimum self-cleaning velocity in sewers is 0.6 m/s (2 ft/s) — below this, solids deposit",
      "SSOs must be reported to the MECP immediately — they are a regulatory violation",
      "I/I increases during wet weather — monitor flow rates and compare to dry weather baseline",
      "Lift stations require N+1 pump redundancy and emergency power",
    ],
    formulaHint: "Manning's equation: V = (1/n) × R^(2/3) × S^(1/2) | n = 0.013 for concrete, 0.011 for PVC",
  },

  "Disinfection": {
    title: "Disinfection (Wastewater)",
    intro:
      "Wastewater disinfection at the Class 2 level requires understanding of both chlorination and UV systems, effluent quality requirements, and dechlorination. Ontario's Environmental Compliance Approvals (ECAs) set site-specific effluent limits for E. coli. The interaction between effluent quality (TSS, turbidity, ammonia) and disinfection effectiveness is a key Class 2 topic.",
    keyPoints: [
      {
        heading: "Chlorination",
        body: "Chlorine (sodium hypochlorite or chlorine gas) reacts with ammonia in secondary effluent to form chloramines. Breakpoint chlorination destroys all chloramines and achieves free chlorine residual — requires a chlorine:ammonia ratio of approximately 7.6:1 by weight. Contact time must be sufficient to meet effluent E. coli limits. Dechlorination with sodium bisulfite or sulfur dioxide is required before discharge to protect aquatic life.",
      },
      {
        heading: "UV Disinfection",
        body: "UV is the preferred disinfection method for wastewater in Ontario because it produces no disinfection byproducts and requires no dechlorination. UV dose (mJ/cm²) must be sufficient to achieve the required E. coli reduction. Effluent TSS must be <20 mg/L and turbidity <5 NTU for effective UV penetration. Lamp fouling (biofilm, mineral deposits) reduces UV intensity — clean lamps regularly and monitor UV intensity sensors.",
      },
      {
        heading: "Effluent Quality and Disinfection",
        body: "High TSS and turbidity shield pathogens from UV and chlorine. Secondary effluent with TSS >30 mg/L will have poor disinfection performance. Ammonia in the effluent increases chlorine demand (chloramine formation). Tertiary filtration before disinfection improves performance and reduces chemical/energy costs. The relationship between effluent quality and disinfection effectiveness is a key Class 2 exam topic.",
      },
      {
        heading: "Ontario Effluent Limits",
        body: "Common Ontario ECA effluent limits: E. coli ≤200 CFU/100 mL (monthly geometric mean); ≤400 CFU/100 mL (single sample). Some ECAs require ≤10 CFU/100 mL for sensitive receiving waters (beaches, shellfish areas). BOD₅ ≤25 mg/L and TSS ≤25 mg/L are typical secondary treatment limits. Ammonia limits vary by receiving water sensitivity.",
      },
    ],
    tableHeadings: ["Method", "Residual?", "Byproducts", "Key Advantage"],
    tableRows: [
      ["Chlorination", "Yes", "THMs, chloramines", "Reliable, residual in effluent"],
      ["UV", "No", "None", "No byproducts, no dechlorination"],
      ["Ozone", "No", "Bromate (if bromide present)", "Effective against all pathogens"],
    ],
    examTips: [
      "Dechlorination is required after chlorination before discharge — protects fish",
      "UV requires TSS <20 mg/L and turbidity <5 NTU for effective penetration",
      "E. coli limit is typically 200 CFU/100 mL (monthly geometric mean) in Ontario ECAs",
      "Breakpoint chlorination requires approximately 7.6 parts chlorine per part ammonia-N",
    ],
    formulaHint: "Chlorine Dose = Chlorine Demand + Desired Residual | Breakpoint ratio ≈ 7.6:1 (Cl₂:NH₃-N by weight)",
  },

  "Equipment O&M": {
    title: "Equipment Operation & Maintenance",
    intro:
      "Class 2 wastewater operators are responsible for the operation and maintenance of complex treatment equipment including aeration systems, secondary clarifiers, sludge handling equipment, and instrumentation. Preventive maintenance programs reduce unplanned downtime and regulatory violations. Equipment records are required by regulators.",
    keyPoints: [
      {
        heading: "Aeration Systems",
        body: "Diffused aeration (fine bubble or coarse bubble diffusers) and mechanical aeration (surface aerators, submerged turbines) supply oxygen to the activated sludge process. Fine bubble diffusers have higher oxygen transfer efficiency (OTE) but foul more easily. Blowers (centrifugal or positive displacement) supply air to diffused aeration systems. Dissolved oxygen (DO) must be maintained at 1.5–3.0 mg/L in the aeration basin. Aeration energy is typically 50–70% of total plant energy consumption.",
      },
      {
        heading: "Pumps and Sludge Handling",
        body: "RAS and WAS pumps control biomass levels in the activated sludge process. Sludge pumps (progressive cavity, centrifugal, or plunger) handle thickened and digested sludge. Pump wear increases with solids content — inspect impellers and seals regularly. Clogging from rags and debris is common — install screens upstream of sludge pumps. Pump calibration is required to ensure accurate sludge wasting rates.",
      },
      {
        heading: "Instrumentation",
        body: "Online instruments include DO meters, turbidimeters, flow meters, pH meters, and online nutrient analyzers. DO meters must be calibrated daily — membrane fouling causes low readings. Flow meters (magnetic, ultrasonic, Parshall flume) must be calibrated annually. SCADA systems monitor and control all major processes — alarms must be responded to promptly. Instrument calibration records are required by regulators.",
      },
      {
        heading: "Digester Maintenance",
        body: "Anaerobic digesters require monitoring of pH (6.8–7.4), volatile acids (VA), alkalinity (VA:alkalinity ratio <0.3), temperature (35°C ± 1°C), and biogas production. Digester upsets (low pH, high VA) indicate overloading — reduce feed rate. Biogas systems (storage, flares, engines) require regular inspection for leaks and safety. Digester mixing (gas recirculation or mechanical) must be maintained to prevent stratification.",
      },
    ],
    tableHeadings: ["Equipment", "Key Maintenance Task", "Frequency"],
    tableRows: [
      ["Aeration diffusers", "Inspection, cleaning, replacement", "Annual / per fouling"],
      ["DO meters", "Membrane replacement, calibration", "Daily calibration"],
      ["RAS/WAS pumps", "Impeller inspection, seal check", "Monthly"],
      ["Digesters", "pH, VA, temperature monitoring", "Daily"],
      ["Blowers", "Filter cleaning, bearing inspection", "Monthly"],
    ],
    examTips: [
      "Fine bubble diffusers have higher OTE than coarse bubble but foul more easily",
      "DO meters must be calibrated daily — membrane fouling causes falsely low readings",
      "Digester VA:alkalinity ratio >0.3 = digester stress — reduce feed rate immediately",
      "Aeration energy is 50–70% of total plant energy — optimize DO setpoint to save energy",
    ],
  },

  "Hydraulics": {
    title: "Hydraulics",
    intro:
      "Hydraulics in wastewater treatment covers flow measurement, pipe and channel flow, pump systems, and hydraulic loading of treatment units. Class 2 operators must calculate flows, loading rates, and detention times, and understand how hydraulic conditions affect treatment performance. Wet weather hydraulics is particularly important for collection system management.",
    keyPoints: [
      {
        heading: "Flow Measurement",
        body: "Parshall flumes and weirs measure open channel flow in wastewater plants. Magnetic flow meters measure flow in pressurized pipes. Flow measurement is required for process control, regulatory reporting, and billing. Calibrate flow meters annually. Diurnal flow patterns (morning and evening peaks) are typical — peak flow is typically 2–3× average daily flow. Wet weather peak flows can be 5–10× dry weather flow.",
      },
      {
        heading: "Hydraulic Loading of Treatment Units",
        body: "Hydraulic loading rates determine treatment efficiency. Primary clarifier: SOR = 30–50 m³/m²/day, HRT = 1–3 hr. Secondary clarifier: SOR = 16–32 m³/m²/day, HRT = 1.5–2.5 hr. Aeration basin: HRT = 4–8 hr (conventional AS). Digester: SRT = 15–30 days. Exceeding design hydraulic loading causes reduced treatment efficiency and potential regulatory violations.",
      },
      {
        heading: "Pump Systems",
        body: "Lift stations and recirculation pumps must be sized for peak flow conditions. The pump curve and system curve determine the operating point. Pumps in parallel add flow capacity — used to handle peak flows. Variable frequency drives (VFDs) allow flow-proportional pumping, reducing energy consumption and wet well level fluctuations. NPSH must be adequate to prevent cavitation in suction lift applications.",
      },
      {
        heading: "Wet Weather Management",
        body: "Wet weather events increase flows through I/I, potentially causing hydraulic overloading of the treatment plant. Flow equalization basins store peak flows and release them at a controlled rate. Bypasses (diverting flow around treatment units) are only permitted in emergencies and must be reported to the MECP. Operators must have wet weather operating procedures and monitor flows closely during storm events.",
      },
    ],
    tableHeadings: ["Process Unit", "Typical HRT", "Typical SOR"],
    tableRows: [
      ["Primary clarifier", "1–3 hr", "30–50 m³/m²/day"],
      ["Secondary clarifier", "1.5–2.5 hr", "16–32 m³/m²/day"],
      ["Aeration basin (conv. AS)", "4–8 hr", "N/A"],
      ["Anaerobic digester", "15–30 days SRT", "N/A"],
    ],
    examTips: [
      "Peak flow is typically 2–3× average daily flow — size pumps and units for peak conditions",
      "Bypasses must be reported to the MECP — they are not a routine operating option",
      "Flow equalization reduces peak loads on treatment units — improves performance and compliance",
      "Exceeding design SOR on clarifiers causes solids carryover to effluent",
    ],
    formulaHint: "HRT (hr) = Volume (m³) ÷ Flow (m³/hr) | SOR (m³/m²/day) = Flow (m³/day) ÷ Surface Area (m²)",
  },

  "Laboratory": {
    title: "Laboratory Analysis",
    intro:
      "Class 2 wastewater operators must understand laboratory procedures for process control and regulatory compliance. Key tests include BOD₅, TSS, VSS, SVI, DO, pH, ammonia, and E. coli. Proper sampling, preservation, and QA/QC are required. Results are used to optimize treatment and demonstrate compliance with ECA effluent limits.",
    keyPoints: [
      {
        heading: "Process Control Tests",
        body: "BOD₅ (5-day biochemical oxygen demand) measures the organic load in influent and effluent — typical secondary effluent: <25 mg/L. TSS (total suspended solids) measures suspended matter — typical secondary effluent: <25 mg/L. VSS (volatile suspended solids) = organic fraction of TSS — used to estimate biomass concentration. SVI (Sludge Volume Index) = (settled sludge volume mL/L ÷ MLSS mg/L) × 1000 — measures settleability.",
      },
      {
        heading: "Microbiological Testing",
        body: "E. coli is the primary effluent compliance parameter. Membrane filtration is the standard method. Samples must be collected in sterile containers, kept at 4°C, and analyzed within 6 hours (24 hours for some methods). Adverse results (exceedance of ECA limit) must be reported to the MECP. Fecal coliform testing may be specified in older ECAs.",
      },
      {
        heading: "Nutrient Analysis",
        body: "Ammonia-nitrogen (NH₃-N) is measured in influent and effluent to assess nitrification performance. Nitrate-nitrogen (NO₃-N) and nitrite-nitrogen (NO₂-N) are measured to assess denitrification. Total phosphorus (TP) is measured to assess chemical and biological P removal. Total Kjeldahl Nitrogen (TKN) = organic N + ammonia-N — measures total reduced nitrogen.",
      },
      {
        heading: "QA/QC",
        body: "Quality control includes: field blanks, duplicate samples, matrix spikes, and calibration checks. Calibrate instruments before each use. Chain of custody forms must accompany all regulatory samples. Accredited laboratories must be used for ECA compliance samples. All results must be recorded and retained for at least 5 years.",
      },
    ],
    tableHeadings: ["Test", "Purpose", "Typical Effluent Limit"],
    tableRows: [
      ["BOD₅", "Organic load", "≤25 mg/L (secondary treatment)"],
      ["TSS", "Suspended solids", "≤25 mg/L (secondary treatment)"],
      ["E. coli", "Pathogen indicator", "≤200 CFU/100 mL (monthly geomean)"],
      ["NH₃-N", "Nitrification performance", "Varies by ECA"],
      ["SVI", "Sludge settleability", "<150 mL/g (target)"],
    ],
    examTips: [
      "SVI = (settled sludge volume mL/L ÷ MLSS mg/L) × 1000 — SVI >200 = bulking",
      "E. coli samples must be analyzed within 6 hours — holding time is critical",
      "BOD₅ and TSS ≤25 mg/L are typical secondary treatment effluent limits in Ontario",
      "Accredited labs must be used for ECA compliance samples — in-house results are not sufficient",
    ],
    formulaHint: "SVI (mL/g) = [Settled sludge volume (mL/L) ÷ MLSS (mg/L)] × 1,000",
  },

  "Laboratory Analysis": {
    title: "Laboratory Analysis",
    intro:
      "Class 2 wastewater operators must understand laboratory procedures for process control and regulatory compliance. Key tests include BOD₅, TSS, VSS, SVI, DO, pH, ammonia, and E. coli. Proper sampling, preservation, and QA/QC are required. Results are used to optimize treatment and demonstrate compliance with ECA effluent limits.",
    keyPoints: [
      {
        heading: "Process Control Tests",
        body: "BOD₅ (5-day biochemical oxygen demand) measures the organic load in influent and effluent — typical secondary effluent: <25 mg/L. TSS (total suspended solids) measures suspended matter — typical secondary effluent: <25 mg/L. VSS (volatile suspended solids) = organic fraction of TSS — used to estimate biomass concentration. SVI (Sludge Volume Index) = (settled sludge volume mL/L ÷ MLSS mg/L) × 1000 — measures settleability.",
      },
      {
        heading: "Microbiological Testing",
        body: "E. coli is the primary effluent compliance parameter. Membrane filtration is the standard method. Samples must be collected in sterile containers, kept at 4°C, and analyzed within 6 hours (24 hours for some methods). Adverse results (exceedance of ECA limit) must be reported to the MECP. Fecal coliform testing may be specified in older ECAs.",
      },
      {
        heading: "Nutrient Analysis",
        body: "Ammonia-nitrogen (NH₃-N) is measured in influent and effluent to assess nitrification performance. Nitrate-nitrogen (NO₃-N) and nitrite-nitrogen (NO₂-N) are measured to assess denitrification. Total phosphorus (TP) is measured to assess chemical and biological P removal. Total Kjeldahl Nitrogen (TKN) = organic N + ammonia-N — measures total reduced nitrogen.",
      },
      {
        heading: "QA/QC",
        body: "Quality control includes: field blanks, duplicate samples, matrix spikes, and calibration checks. Calibrate instruments before each use. Chain of custody forms must accompany all regulatory samples. Accredited laboratories must be used for ECA compliance samples. All results must be recorded and retained for at least 5 years.",
      },
    ],
    tableHeadings: ["Test", "Purpose", "Typical Effluent Limit"],
    tableRows: [
      ["BOD₅", "Organic load", "≤25 mg/L (secondary treatment)"],
      ["TSS", "Suspended solids", "≤25 mg/L (secondary treatment)"],
      ["E. coli", "Pathogen indicator", "≤200 CFU/100 mL (monthly geomean)"],
      ["NH₃-N", "Nitrification performance", "Varies by ECA"],
      ["SVI", "Sludge settleability", "<150 mL/g (target)"],
    ],
    examTips: [
      "SVI = (settled sludge volume mL/L ÷ MLSS mg/L) × 1000 — SVI >200 = bulking",
      "E. coli samples must be analyzed within 6 hours — holding time is critical",
      "BOD₅ and TSS ≤25 mg/L are typical secondary treatment effluent limits in Ontario",
      "Accredited labs must be used for ECA compliance samples — in-house results are not sufficient",
    ],
    formulaHint: "SVI (mL/g) = [Settled sludge volume (mL/L) ÷ MLSS (mg/L)] × 1,000",
  },

  "Safety & Administration": {
    title: "Safety & Administration",
    intro:
      "Class 2 wastewater operators have significant administrative and safety responsibilities. This includes operator licensing, emergency response planning, confined space entry, WHMIS, and record-keeping under O. Reg. 129/04 and the Environmental Protection Act. The Overall Responsible Operator (ORO) is legally accountable for the plant's compliance.",
    keyPoints: [
      {
        heading: "Operator Licensing",
        body: "Ontario wastewater operators are licensed under O. Reg. 129/04. Licence classes (1–4) correspond to facility classifications. The ORO must hold a licence equal to or higher than the facility classification. Operators must complete continuing education and renew their licence every three years. The ORO is legally responsible for the plant's compliance with its ECA.",
      },
      {
        heading: "Confined Space Safety",
        body: "Wastewater plants have numerous confined spaces — wet wells, digesters, manholes, valve chambers. Entry requires: a written permit, atmospheric testing (O₂, H₂S, CH₄, CO), continuous monitoring, trained attendant outside, and rescue plan. H₂S is the primary toxic gas hazard — heavier than air, causes olfactory fatigue at dangerous concentrations. Methane (CH₄) from digesters is explosive — eliminate ignition sources.",
      },
      {
        heading: "Emergency Response",
        body: "Every wastewater facility must have an Emergency Response Plan (ERP) addressing power failure, pump station failure, treatment upset, spills, and natural disasters. Spills or bypasses that may impair water quality must be reported to the MECP Spills Action Centre (1-800-268-6060) immediately. Operators must document all spills and corrective actions. ERPs must be tested and updated regularly.",
      },
      {
        heading: "Record-Keeping",
        body: "O. Reg. 129/04 and ECA conditions require operators to maintain records of all sampling results, operational data, maintenance activities, and adverse events. Records must be retained for at least 5 years. Annual reports must be submitted to the MECP. WHMIS 2015 requires SDS for all hazardous materials — operators must know the hazards of all chemicals used at the plant.",
      },
    ],
    tableHeadings: ["Regulation", "Key Requirement"],
    tableRows: [
      ["O. Reg. 129/04", "Operator licensing — classes, renewal, ORO responsibilities"],
      ["Environmental Protection Act", "Governs spills, waste disposal, ECA requirements"],
      ["O. Reg. 267/03", "Biosolids land application standards"],
      ["WHMIS 2015", "Hazardous materials — SDS, labelling, training"],
      ["ECA (site-specific)", "Effluent limits, monitoring, reporting for each plant"],
    ],
    examTips: [
      "H₂S causes olfactory fatigue — you cannot rely on smell to detect dangerous levels",
      "Spills must be reported to the MECP Spills Action Centre immediately (1-800-268-6060)",
      "The ORO is legally responsible for the plant's compliance with its ECA",
      "Confined space entry always requires atmospheric testing — even for short entries",
    ],
  },

  "Sludge Management": {
    title: "Sludge Management",
    intro:
      "Sludge management is one of the most complex and costly aspects of wastewater treatment. Class 2 operators must understand thickening, anaerobic digestion, dewatering, and biosolids land application under O. Reg. 267/03. Spellman identifies digester control and biosolids quality as the most critical sludge management skills.",
    keyPoints: [
      {
        heading: "Thickening",
        body: "Gravity thickeners are effective for primary sludge — achieve 8–10% solids from primary underflow. Dissolved air flotation (DAF) thickeners are used for waste activated sludge (WAS) — achieve 3–5% solids with polymer addition, 2–4% without. Rotary drum thickeners and gravity belt thickeners are also common. Thickening reduces digester volume requirements and improves digestion efficiency.",
      },
      {
        heading: "Anaerobic Digestion",
        body: "Anaerobic digestion stabilizes sludge by breaking down volatile solids (VS) in the absence of oxygen. Four stages: hydrolysis → acidogenesis → acetogenesis → methanogenesis. Biogas is 60–70% methane (CH₄) and 30–40% CO₂. Mesophilic digestion: 35–37°C, SRT 15–30 days, 40–60% VS reduction. Thermophilic digestion: 55°C, SRT 10–15 days, higher VS reduction but less stable. Key control parameters: pH (6.8–7.4), volatile acids (VA), alkalinity (VA:Alk ratio <0.3).",
      },
      {
        heading: "Dewatering",
        body: "Dewatering removes water from digested sludge to produce a cake for land application or disposal. Belt filter presses: 18–25% solids cake. Centrifuges: 22–30% solids cake. Screw presses: 20–28% solids cake. Polymer conditioning is required to improve dewatering performance — dose must be optimized (too little = poor dewatering; too much = sticky cake). Centrate/filtrate from dewatering is high in ammonia and must be returned to the plant headworks.",
      },
      {
        heading: "Biosolids Land Application (O. Reg. 267/03)",
        body: "Class A biosolids: low pathogen levels (fecal coliform <1,000 MPN/g TS or equivalent), can be applied to any land use. Class B biosolids: higher pathogen levels (fecal coliform <2,000,000 MPN/g TS), restricted to agricultural land with setback requirements (30–300 m from water bodies, wells, residences). Vector attraction reduction (VAR) is required — achieved by VS reduction (>38%), pH adjustment, or drying. Application rates are based on agronomic nitrogen loading.",
      },
    ],
    tableHeadings: ["Process", "Typical Result", "Key Parameter"],
    tableRows: [
      ["Gravity thickening (primary)", "8–10% solids", "Blanket depth, SRT"],
      ["DAF thickening (WAS)", "3–5% solids (with polymer)", "Air:solids ratio, polymer dose"],
      ["Anaerobic digestion", "40–60% VS reduction", "pH 6.8–7.4, VA:Alk <0.3"],
      ["Belt filter press", "18–25% solids cake", "Polymer dose, belt tension"],
      ["Centrifuge", "22–30% solids cake", "Polymer dose, bowl speed"],
    ],
    examTips: [
      "VA:alkalinity ratio >0.3 = digester stress — reduce feed rate and investigate",
      "Class A biosolids have fewer land application restrictions than Class B",
      "DAF thickening is used for WAS (it floats) — gravity thickening is for primary sludge",
      "Centrate from dewatering is high in ammonia — must be returned to plant headworks",
    ],
    formulaHint: "VS Reduction (%) = (VS in − VS out) ÷ VS in × 100 | VA:Alk ratio = Volatile Acids (mg/L) ÷ Alkalinity (mg/L as CaCO₃)",
  },
};

// ─── Class 3 Water Treatment ──────────────────────────────────────────────────
export const CLASS3_WATER_OVERVIEWS: Record<string, ModuleOverview> = {
  "Treatment Process": {
    title: "Treatment Process",
    intro:
      "Class 3 Water Treatment covers advanced treatment processes beyond conventional coagulation/filtration — including membrane filtration, ozone disinfection, UV disinfection, lime softening, and advanced process control. At this level, operators are expected to understand not just how processes work, but how to optimize them, troubleshoot failures, and make process control decisions based on data.",
    keyPoints: [
      {
        heading: "Membrane Filtration",
        body: "Membrane systems (MF, UF, NF, RO) remove contaminants by physical size exclusion. Microfiltration (MF) and ultrafiltration (UF) remove turbidity, bacteria, Giardia, and viruses. Nanofiltration (NF) removes hardness and colour. Reverse osmosis (RO) removes TDS, nitrates, arsenic, and fluoride. Key operating parameter is transmembrane pressure (TMP) — rising TMP indicates fouling. Integrity is verified by pressure decay testing (PDT).",
      },
      {
        heading: "Ozone Disinfection",
        body: "Ozone (O₃) is a powerful oxidant used for disinfection, colour removal, and taste/odour control. It is generated on-site by corona discharge from oxygen or air. Ozone provides no residual in the distribution system — chlorination must follow. CT values for ozone are much lower than for chlorine for equivalent Giardia/Crypto inactivation. Off-gas must be destroyed (catalytic or thermal destruction) as ozone is toxic above 0.1 ppm.",
      },
      {
        heading: "UV Disinfection",
        body: "UV disinfection inactivates pathogens by damaging their DNA — effective against Giardia and Cryptosporidium at low doses (5–10 mJ/cm²). UV provides no residual and must be followed by chlorination. UV dose = intensity (mW/cm²) × exposure time (s). UV transmittance (UVT) of the water affects dose delivery — low UVT (high colour/turbidity) reduces effective dose. Lamp sleeves must be cleaned regularly to maintain output.",
      },
      {
        heading: "Lime Softening",
        body: "Lime softening removes hardness (Ca²⁺, Mg²⁺) by raising pH to precipitate CaCO₃ and Mg(OH)₂. Single-stage lime softening removes calcium at pH ~9.5. Excess lime process raises pH >11 to also remove magnesium. Recarbonation (CO₂ addition) is required after softening to lower pH before distribution. The Langelier Saturation Index (LSI) measures water's tendency to deposit or dissolve CaCO₃: LSI = pH − pHs; positive = scale-forming, negative = corrosive.",
      },
    ],
    tableHeadings: ["Process", "Target Removal", "Key Control Parameter"],
    tableRows: [
      ["Microfiltration (MF)", "Turbidity, bacteria, Giardia", "TMP (transmembrane pressure)"],
      ["Ultrafiltration (UF)", "Viruses, NOM, turbidity", "TMP, flux rate"],
      ["Nanofiltration (NF)", "Hardness, colour, some DBPs", "Recovery rate, pressure"],
      ["Reverse Osmosis (RO)", "TDS, nitrates, arsenic, fluoride", "Recovery, reject rate"],
      ["Ozone (O₃)", "Colour, taste/odour, Crypto", "CT value, ozone dose (mg/L)"],
      ["UV", "Giardia, Crypto, bacteria", "UV dose (mJ/cm²), UVT"],
    ],
    examTips: [
      "RO reject (concentrate) must be disposed of — it cannot be discharged untreated to surface water",
      "UV does NOT provide a residual — always followed by chlorination for distribution system protection",
      "Ozone CT values are much lower than chlorine CT values for the same log inactivation",
      "LSI > 0 = scale-forming (good for pipe protection); LSI < 0 = corrosive (bad for distribution system)",
      "Membrane integrity testing (pressure decay test) is required to verify no breach in the membrane barrier",
      "SCADA alarms must be responded to within regulatory timeframes — know the difference between advisory and critical alarms",
    ],
    formulaHint:
      "LSI = pH − pHs | UV Dose (mJ/cm²) = Intensity (mW/cm²) × Exposure Time (s) | TMP = (Feed pressure + Concentrate pressure) ÷ 2 − Permeate pressure",
  },

  "Laboratory Analysis": {
    title: "Laboratory Analysis",
    intro:
      "At Class 3 level, laboratory analysis expands beyond routine testing to include advanced analytical methods, QA/QC program management, method detection limits, and interpretation of complex water quality data. Operators must understand the regulatory basis for each test, the acceptable methods, and how to respond to out-of-specification results.",
    keyPoints: [
      {
        heading: "Total Organic Carbon (TOC) and DBPs",
        body: "TOC is an indicator of natural organic matter (NOM) — high TOC increases disinfection byproduct (DBP) formation potential. THMs (trihalomethanes) and HAAs (haloacetic acids) are the primary regulated DBPs formed when chlorine reacts with NOM. Under O. Reg. 170/03, THM MAC is 100 µg/L and HAA MAC is 80 µg/L. TOC monitoring is required for GUDI systems and systems with high NOM.",
      },
      {
        heading: "QA/QC Program Management",
        body: "A QA/QC program ensures data quality through method blanks (detect contamination), duplicates (measure precision), matrix spikes (measure accuracy/recovery), and calibration standards. Spike recovery should be 70–130%. Duplicate RPD (relative percent difference) should be <20%. Results outside these ranges indicate a problem with the method, sample, or instrument.",
      },
      {
        heading: "Advanced Analytical Methods",
        body: "Gas chromatography (GC) with electron capture detection (ECD) or mass spectrometry (MS) is used for THMs, HAAs, and pesticides. Inductively coupled plasma (ICP) is used for metals (lead, arsenic, copper). Ion chromatography (IC) is used for anions (nitrate, fluoride, sulphate). Operators must understand method detection limits (MDL) and reporting requirements.",
      },
      {
        heading: "Langelier Saturation Index (LSI)",
        body: "The LSI quantifies water's tendency to deposit or dissolve CaCO₃. Required inputs: pH, temperature, TDS, calcium hardness, and total alkalinity. LSI = pH − pHs, where pHs is the saturation pH calculated from correction factors. Positive LSI = scale-forming (protective for pipes); negative LSI = corrosive (dissolves pipe material, may leach lead/copper). Target LSI is slightly positive (+0.1 to +0.3) for distribution system protection.",
      },
    ],
    tableHeadings: ["Parameter", "Method/Instrument", "Regulatory Limit (O. Reg. 170/03)"],
    tableRows: [
      ["Turbidity (filtered)", "Turbidimeter (NTU)", "≤0.3 NTU (95%), never >1.0 NTU"],
      ["Free chlorine residual", "DPD colorimetry / amperometric", "≥0.05 mg/L at POE"],
      ["THMs (trihalomethanes)", "GC-MS or GC-ECD", "≤100 µg/L (MAC)"],
      ["HAAs (haloacetic acids)", "GC-ECD", "≤80 µg/L (MAC)"],
      ["Total coliform / E. coli", "Membrane filtration / Colilert", "0 CFU/100 mL"],
      ["TOC", "Combustion/UV oxidation", "Site-specific (GUDI trigger)"],
    ],
    examTips: [
      "A matrix spike recovery outside 70–130% indicates a matrix interference — the method may not be suitable for that sample",
      "THMs are measured at the point of maximum residence time in the distribution system — not at the treatment plant",
      "Jar test results are not directly transferable to full scale — use as a guide and monitor full-scale results",
      "Method detection limit (MDL) is the lowest concentration that can be reliably detected; results below MDL are reported as <MDL",
      "Duplicate sample RPD >20% indicates poor precision — investigate and re-sample",
    ],
    formulaHint:
      "RPD = |Sample1 − Sample2| ÷ ((Sample1 + Sample2) ÷ 2) × 100 | Spike Recovery (%) = (Spiked result − Unspiked result) ÷ Spike added × 100 | LSI = pH − pHs",
  },

  "Equipment O&M": {
    title: "Equipment O&M",
    intro:
      "Class 3 equipment operation and maintenance covers advanced mechanical systems including high-service pumps, variable frequency drives (VFDs), membrane systems, ozone generators, UV reactors, chemical feed systems, and SCADA/instrumentation. At this level, operators are expected to perform preventive maintenance planning, troubleshoot complex equipment failures, and interpret equipment performance data.",
    keyPoints: [
      {
        heading: "Variable Frequency Drives (VFDs)",
        body: "VFDs control pump speed by varying motor frequency (Hz), allowing precise flow control and significant energy savings. The pump affinity laws govern the relationship between speed and performance: flow is proportional to speed (Q ∝ N), head is proportional to speed squared (H ∝ N²), and power is proportional to speed cubed (P ∝ N³). This means reducing speed by 20% reduces power consumption by nearly 50%. VFDs also reduce water hammer and mechanical wear.",
      },
      {
        heading: "Membrane System Maintenance",
        body: "Membrane systems require periodic clean-in-place (CIP) procedures using acid (citric, hydrochloric), caustic (NaOH), or oxidant (sodium hypochlorite) solutions to remove fouling. Integrity is verified by pressure decay testing (PDT) — pressurize with air, isolate, monitor pressure drop; excessive drop indicates a breach. Membranes are replaced when TMP exceeds operating limits or when integrity cannot be restored.",
      },
      {
        heading: "Ozone and UV System Maintenance",
        body: "Ozone generators use corona discharge and require dry feed gas (dew point < −60°C) to prevent nitric acid formation. Electrodes degrade over time and must be replaced. UV reactors require regular lamp sleeve cleaning (calcium carbonate deposits reduce UV transmittance) and lamp replacement when output falls below the validated threshold. UV intensity sensors must be calibrated.",
      },
      {
        heading: "Preventive Maintenance Programs",
        body: "PM programs are based on manufacturer recommendations, operating hours, and regulatory requirements. All maintenance must be documented in logbooks or CMMS (computerized maintenance management system). Critical equipment (high-service pumps, chemical feed systems) requires redundancy — always maintain a spare. Vibration analysis, thermography, and oil sampling are condition monitoring tools used at Class 3 level.",
      },
    ],
    tableHeadings: ["Equipment", "Key Maintenance Task", "Failure Indicator"],
    tableRows: [
      ["Centrifugal pump", "Bearing lubrication, seal inspection", "Vibration, seal leakage, reduced flow"],
      ["VFD", "Cooling fan, capacitor check", "Overtemperature alarm, harmonic distortion"],
      ["Membrane system", "CIP cleaning, integrity test", "Rising TMP, declining flux, failed PDT"],
      ["Ozone generator", "Feed gas dew point, electrode check", "Reduced O₃ output, arc discharge"],
      ["UV reactor", "Lamp/sleeve cleaning, intensity check", "Low UV intensity alarm, lamp failure"],
      ["Turbidimeter", "Calibration, bubble check", "Drift, erratic readings"],
    ],
    examTips: [
      "Pump affinity laws: if speed doubles, flow doubles, head quadruples, and power increases 8×",
      "VFDs should not be used with motors not rated for inverter duty — can damage motor insulation",
      "Pressure decay test (PDT): pressurize membrane with air, isolate, monitor pressure drop — excessive drop = breach",
      "Ozone off-gas destruction is mandatory — ozone is toxic at >0.1 ppm in air (OSHA/ACGIH limit)",
      "UV lamp output is rated in mW/cm² — always verify against the validated dose-response curve for your system",
    ],
    formulaHint:
      "Affinity Laws: Q₂/Q₁ = N₂/N₁ | H₂/H₁ = (N₂/N₁)² | P₂/P₁ = (N₂/N₁)³ | where Q = flow, H = head, P = power, N = speed (rpm)",
  },

  "Source Water Characteristics": {
    title: "Source Water Characteristics",
    intro:
      "At Class 3 level, source water assessment goes beyond basic quality monitoring to include watershed management, source water protection plans, GUDI assessment, and the impact of source water variability on treatment performance. Operators must understand how seasonal and event-driven changes in source water quality affect treatment and what adaptive responses are required.",
    keyPoints: [
      {
        heading: "GUDI and Source Water Protection",
        body: "Groundwater Under Direct Influence of surface water (GUDI) is groundwater that shows rapid response to surface water conditions (turbidity, microbiology, TOC). GUDI systems must meet surface water treatment standards under O. Reg. 170/03. Source Water Protection Plans (SWPPs) are required under the Clean Water Act (2006) and identify threats to municipal drinking water sources within designated vulnerable areas.",
      },
      {
        heading: "Algal Blooms and Cyanotoxins",
        body: "Cyanobacteria (blue-green algae) produce taste/odour compounds (geosmin, MIB) and cyanotoxins (microcystin, anatoxin). Microcystin MAC is 1.5 µg/L under Health Canada guidelines. Treatment options include powdered activated carbon (PAC) for taste/odour, ozone for oxidation, and enhanced coagulation. Algal bloom monitoring requires cell counts and toxin testing. Operators must have a response plan for bloom events.",
      },
      {
        heading: "Seasonal Source Water Variability",
        body: "Thermal stratification in reservoirs creates a warm epilimnion and cold hypolimnion. Turnover events (spring and fall) mix the water column, releasing iron, manganese, and H₂S from the hypolimnion. Storm events cause rapid turbidity spikes that require immediate coagulant dose adjustments. Snowmelt runoff carries agricultural chemicals and pathogens. Operators must anticipate seasonal changes and have pre-planned responses.",
      },
      {
        heading: "Natural Organic Matter (NOM)",
        body: "NOM (humic and fulvic acids from decomposing vegetation) affects treatment in multiple ways: it reacts with chlorine to form DBPs, it causes colour and taste/odour, it fouls membranes, and it competes with coagulants. NOM concentration varies seasonally — highest in fall (leaf decomposition) and after storm events. Enhanced coagulation (lower pH, higher coagulant dose) is used to maximize NOM removal.",
      },
    ],
    tableHeadings: ["Source Water Issue", "Treatment Response", "Monitoring Trigger"],
    tableRows: [
      ["High turbidity (storm event)", "Increase coagulant dose, reduce flow", "Raw turbidity >10 NTU"],
      ["Algal bloom (taste/odour)", "Activated carbon (PAC or GAC)", "Geosmin/MIB >10 ng/L"],
      ["Cyanotoxin (microcystin)", "PAC, ozone, or enhanced coagulation", "Microcystin >1.5 µg/L (MAC)"],
      ["High NOM (colour)", "Enhanced coagulation, lower pH", "TOC >4 mg/L, colour >15 TCU"],
      ["Iron/Manganese release", "Oxidation (Cl₂, KMnO₄), filtration", "Fe >0.3 mg/L, Mn >0.05 mg/L"],
      ["GUDI trigger", "Surface water treatment protocol", "Turbidity, coliform, TOC spikes"],
    ],
    examTips: [
      "GUDI determination requires a hydrogeological assessment — operators cannot make this determination themselves",
      "Microcystin MAC is 1.5 µg/L (total) under Health Canada guidelines — Ontario follows this",
      "Geosmin and MIB are not health hazards but cause consumer complaints at extremely low concentrations (ng/L range)",
      "Reservoir turnover (fall and spring) is a predictable source water quality event — operators should have a response plan",
      "Source water protection plans are legally binding — operators must be aware of designated vulnerable areas and threats",
    ],
    formulaHint:
      "No single formula — source water assessment relies on trend analysis, comparison to baseline, and regulatory thresholds. Know the Ontario MAC values for key parameters.",
  },

  "Security, Safety & Admin": {
    title: "Security, Safety & Admin",
    intro:
      "At Class 3 level, security, safety, and administrative responsibilities expand to include emergency response planning, security vulnerability assessments, confined space rescue coordination, WHMIS 2015 program management, and regulatory reporting under O. Reg. 170/03. Operators at this level may be responsible for supervising other operators and ensuring compliance across the entire system.",
    keyPoints: [
      {
        heading: "Emergency Response Plans (ERPs)",
        body: "ERPs are required under O. Reg. 170/03 and must address loss of power, source water contamination, treatment failure, distribution system emergencies, and chemical spills. ERPs must be reviewed annually, tested through exercises, and updated when contacts or procedures change. All staff must be trained on the ERP. The plan must include notification procedures for the Medical Officer of Health (MOH) and MECP.",
      },
      {
        heading: "Adverse Water Quality (AWQ) Reporting",
        body: "Any result exceeding a MAC or indicator parameter trigger requires immediate notification to the local Medical Officer of Health and MECP under O. Reg. 170/03. Microbiological AWQ (any E. coli or total coliform) must be reported within 24 hours. The MOH decides whether to issue a boil water advisory — the operator provides the data and supports the decision but does not issue the advisory.",
      },
      {
        heading: "Confined Space Safety",
        body: "Class 3 operators may coordinate confined space rescue operations. Atmospheric testing is required before entry in this order: O₂ first (19.5–23.0% acceptable), then LEL (lower explosive limit, <10% acceptable), then toxic gases (H₂S <10 ppm, CO <35 ppm). A rescue team must be in place before entry — rescue from outside is preferred. Entry permits must be completed and signed.",
      },
      {
        heading: "Operator Certification and Supervision",
        body: "Class 3 operators must hold a valid Class 3 certificate and are responsible for supervising lower-class operators. Operators must ensure that staff performing duties hold the appropriate certification level. Continuing education requirements apply — operators must maintain their certification through approved training. Operators are personally responsible for their actions and cannot be directed to violate regulations.",
      },
    ],
    tableHeadings: ["Regulatory Requirement", "Trigger / Frequency", "Action Required"],
    tableRows: [
      ["AWQ report to MOH/MECP", "Any MAC exceedance", "Immediate notification, boil water advisory consideration"],
      ["Microbiological AWQ", "Any E. coli or total coliform", "Notify MOH/MECP within 24 hours"],
      ["Annual summary report", "Annually (Jan 31)", "Submit to MECP and make available to public"],
      ["Confined space entry", "Before each entry", "Atmospheric test, rescue team standby, permit"],
      ["WHMIS training", "Before handling hazardous products", "Review SDS, use proper PPE"],
      ["Emergency Response Plan", "Review annually", "Update contacts, procedures, and resources"],
    ],
    examTips: [
      "AWQ notification to MOH must be immediate — do not wait for confirmation of the result before notifying",
      "A boil water advisory is issued by the Medical Officer of Health, not the operator",
      "Confined space atmospheric testing order: O₂ first, then LEL, then toxic gases (H₂S, CO)",
      "WHMIS 2015 replaced WHMIS 1988 — SDS replaced MSDS; GHS pictograms replaced WHMIS symbols",
      "Class 3 operators are responsible for ensuring that operators under their supervision hold the appropriate certification",
    ],
    formulaHint:
      "No calculation formulas — this module is regulatory and procedural. Know the notification timelines, reporting requirements, and O. Reg. 170/03 Schedule thresholds.",
  },
};

// ─── Class 3 Wastewater Module Overviews ────────────────────────────────────
export const CLASS3_WASTEWATER_OVERVIEWS: Record<string, ModuleOverview> = {
  "Treatment Process Monitoring": {
    title: "Treatment Process Monitoring",
    intro:
      "Class 3 Wastewater operators are responsible for advanced process control of activated sludge systems, biological nutrient removal (BNR), secondary clarification, and overall plant performance. At this level, operators must interpret process data, diagnose problems, and make process adjustments to maintain effluent quality within regulatory limits under O. Reg. 419/04 and the facility's Environmental Compliance Approval (ECA).",
    keyPoints: [
      {
        heading: "Activated Sludge Process Control",
        body: "The activated sludge process depends on maintaining the correct balance of food (BOD), microorganisms (MLSS/MLVSS), and oxygen (DO). Key control parameters: F:M ratio (target 0.2-0.4 kg BOD/kg MLVSS/day for conventional AS), SRT/MCRT (5-15 days conventional; >10 days for nitrification), MLSS (2,000-4,000 mg/L), DO (1.5-3.0 mg/L in aeration basin). Waste Activated Sludge (WAS) rate is the primary control variable — increasing WAS reduces SRT and MLSS, decreasing WAS increases them.",
      },
      {
        heading: "Sludge Volume Index (SVI) and Settleability",
        body: "SVI = (settled sludge volume mL/L after 30 min x 1000) divided by MLSS (mg/L). Target SVI < 150 mL/g. SVI 150-200: marginal settling. SVI > 200: bulking sludge. Bulking is caused by filamentous organisms (Thiothrix, Type 021N, Microthrix parvicella) due to low DO, low F:M, nutrient deficiency, or low pH. Corrective actions: increase DO, adjust F:M by increasing WAS, add nutrients, chlorinate RAS (short-term). Pin floc (SVI < 50): very short SRT, poor settling — increase SRT.",
      },
      {
        heading: "Nitrification and Denitrification",
        body: "Nitrification: NH4+ converted to NO2- then NO3- (aerobic, by Nitrosomonas and Nitrobacter). Requires DO > 2 mg/L, SRT > 10 days, temperature > 10 degrees C, alkalinity (7.14 mg CaCO3 per mg NH4+ oxidized). Denitrification: NO3- converted to N2 gas (anoxic, requires carbon source). In BNR systems, internal recycle (IMLR) returns nitrate-rich mixed liquor from aerobic to anoxic zone. Temperature correction: nitrification rate decreases significantly below 15 degrees C — increase SRT in winter.",
      },
      {
        heading: "Biological Phosphorus Removal (Bio-P)",
        body: "Bio-P relies on Polyphosphate Accumulating Organisms (PAOs) that release phosphorus in an anaerobic zone and take up excess phosphorus in the aerobic zone. Key requirement: a true anaerobic zone (no dissolved oxygen AND no nitrate). Volatile fatty acids (VFAs) in the anaerobic zone drive PAO activity — if VFAs are low, Bio-P performance drops. Supplemental chemical precipitation (alum or ferric chloride) is used as a backup or polishing step. Effluent TP target is typically < 1 mg/L under ECA.",
      },
      {
        heading: "Secondary Clarifier Performance",
        body: "Secondary clarifiers separate the mixed liquor into clarified effluent and thickened return activated sludge (RAS). Key parameters: surface overflow rate (SOR) 16-32 m3/m2/day, solids loading rate (SLR) < 6 kg TSS/m2/h. High SOR or SLR causes biomass carryover in effluent. Sludge blanket depth should be < 1 m to prevent anaerobic conditions and rising sludge (denitrification in clarifier). RAS rate (50-100% of influent flow) controls blanket depth. Rising sludge = denitrification in clarifier — reduce blanket depth, increase WAS.",
      },
    ],
    tableHeadings: ["Parameter", "Target Range", "Problem if Outside Range"],
    tableRows: [
      ["MLSS", "2,000-4,000 mg/L", "Too low: poor treatment / Too high: poor settling"],
      ["SRT (conventional AS)", "5-15 days", "< 5 days: washout / > 15 days: bulking risk"],
      ["SRT (nitrification)", "> 10 days", "< 10 days: nitrification failure"],
      ["F:M ratio", "0.2-0.4 kg BOD/kg MLVSS/day", "< 0.1: filamentous bulking / > 0.5: poor effluent"],
      ["DO in aeration basin", "1.5-3.0 mg/L", "< 1.0: filamentous bulking / > 3.0: energy waste"],
      ["SVI", "< 150 mL/g", "> 200: bulking; poor settling"],
      ["RAS rate", "50-100% of Q", "Too low: MLSS drops / Too high: dilution"],
    ],
    examTips: [
      "SVI > 200 mL/g = sludge bulking — investigate DO, F:M ratio, and filamentous organisms",
      "Rising sludge in secondary clarifier = denitrification — reduce sludge blanket depth, increase WAS",
      "Nitrification requires SRT > 10 days, DO > 2 mg/L, and adequate alkalinity",
      "Bio-P requires a true anaerobic zone — no O2 AND no nitrate",
      "WAS rate is the primary process control variable — it controls SRT, MLSS, and F:M",
      "Dark brown stable foam = Nocardia or Microthrix — reduce SRT, avoid recycling foam",
    ],
    formulaHint:
      "SRT (days) = (Aeration Volume m3 x MLSS mg/L) / [(WAS flow m3/d x WAS TSS mg/L) + (Effluent flow m3/d x Effluent TSS mg/L)]\nF:M = (Influent BOD mg/L x Flow m3/d) / (Aeration Volume m3 x MLVSS mg/L)\nSVI (mL/g) = (Settled Volume mL/L x 1000) / MLSS mg/L",
  },
  "Laboratory Analysis": {
    title: "Laboratory Analysis",
    intro:
      "Class 3 Wastewater operators must perform and interpret laboratory analyses to monitor treatment performance, meet regulatory reporting requirements, and make process control decisions. Key tests include BOD5, COD, TSS, VSS, ammonia, nitrate, phosphorus, DO, pH, alkalinity, and settleability tests. Results must be recorded accurately and compared to Environmental Compliance Approval (ECA) limits.",
    keyPoints: [
      {
        heading: "BOD5 Test",
        body: "BOD5 measures the oxygen consumed by microorganisms in decomposing organic matter over 5 days at 20 degrees C. Procedure: dilute sample, measure initial DO, incubate 5 days at 20 degrees C in the dark, measure final DO. BOD5 = (Initial DO minus Final DO) x Dilution Factor. Seed correction is required if the sample lacks sufficient microorganisms (e.g., disinfected effluent). Nitrification inhibitor (TCMP or allylthiourea) is added if nitrogenous BOD (nBOD) must be excluded. Typical secondary effluent BOD5 target: < 20 mg/L (or per ECA).",
      },
      {
        heading: "TSS and VSS",
        body: "Total Suspended Solids (TSS): filter sample through 1.2 um glass fibre filter, dry at 105 degrees C, weigh. TSS (mg/L) = (mass retained on filter mg x 1000) / sample volume mL. Volatile Suspended Solids (VSS): ignite dried filter at 550 degrees C; mass lost = VSS (organic fraction). VSS/TSS ratio indicates the organic content of sludge — typically 0.7-0.8 for activated sludge. MLVSS is used in F:M calculations. Effluent TSS target: typically < 25 mg/L (or per ECA).",
      },
      {
        heading: "Nitrogen and Phosphorus Analysis",
        body: "Ammonia (NH3-N): measured by colorimetric method (indophenol blue) or ion-selective electrode. Elevated effluent ammonia indicates nitrification failure. Nitrate (NO3-N): measured by cadmium reduction or ion chromatography. Total Kjeldahl Nitrogen (TKN) = organic N + ammonia N. Total Phosphorus (TP): persulfate digestion followed by colorimetric measurement. Orthophosphate (soluble reactive P) measured directly. Effluent TP target: typically < 1 mg/L under nutrient management requirements.",
      },
      {
        heading: "Settleability and Process Control Tests",
        body: "30-minute Settleability Test (SSV30): fill 1-L graduated cylinder with mixed liquor, record settled volume after 30 minutes. Used to calculate SVI. Zone Settling Rate (ZSR): measures the settling velocity of the sludge blanket — used to size clarifiers and set RAS rates. Oxygen Uptake Rate (OUR): measures the rate at which microorganisms consume oxygen — indicates biomass activity. Specific OUR (SOUR) = OUR / MLVSS. High SOUR indicates active, healthy biomass; low SOUR may indicate toxicity or starvation.",
      },
    ],
    tableHeadings: ["Test", "Method / Principle", "Typical Effluent Target"],
    tableRows: [
      ["BOD5", "5-day incubation at 20 degrees C, DO difference x dilution", "< 20 mg/L (or per ECA)"],
      ["TSS", "Filtration (1.2 um), dry at 105 degrees C, gravimetric", "< 25 mg/L (or per ECA)"],
      ["VSS", "Ignite TSS filter at 550 degrees C, mass loss = VSS", "VSS/TSS ratio 0.7-0.8 for AS"],
      ["Ammonia (NH3-N)", "Colorimetric (indophenol) or ISE", "< 2 mg/L (nitrifying plants)"],
      ["Total Phosphorus", "Persulfate digestion + colorimetric", "< 1 mg/L (BNR plants)"],
      ["DO", "Membrane electrode or optical probe", "1.5-3.0 mg/L in aeration basin"],
      ["pH", "pH meter with temperature compensation", "6.5-8.5 for AS process"],
    ],
    examTips: [
      "BOD5 = (Initial DO minus Final DO) x Dilution Factor — always apply dilution factor",
      "TSS filter is dried at 105 degrees C; VSS ignition is at 550 degrees C — do not confuse temperatures",
      "SVI = (SSV30 mL/L x 1000) / MLSS mg/L — target < 150 mL/g",
      "Nitrification inhibitor prevents nBOD from being measured in carbonaceous BOD tests",
      "SOUR (specific oxygen uptake rate) indicates biomass activity — low SOUR may indicate toxicity",
      "All lab results must be recorded and retained per applicable regulation reporting requirements",
    ],
    formulaHint:
      "BOD5 (mg/L) = (DO_initial minus DO_final) x Dilution Factor\nTSS (mg/L) = (Filter mass after drying mg minus Filter tare mass mg) x 1000 / Sample volume mL\nSVI (mL/g) = SSV30 (mL/L) x 1000 / MLSS (mg/L)",
  },
  "Equipment Operation": {
    title: "Equipment Operation",
    intro:
      "Class 3 Wastewater operators must operate and troubleshoot all major equipment at a wastewater treatment plant, including centrifugal pumps, blowers, aerators, clarifiers, thickeners, digesters, and instrumentation. Understanding pump affinity laws, NPSH, and VFD operation is essential for both the exam and day-to-day plant management.",
    keyPoints: [
      {
        heading: "Centrifugal Pump Operation and Affinity Laws",
        body: "Centrifugal pumps are the most common type in wastewater treatment. The pump curve shows the relationship between flow (Q) and head (H) — as flow increases, head decreases. The system curve shows the static head plus friction losses at various flows. The operating point is where the pump curve intersects the system curve. Affinity Laws: Q2/Q1 = N2/N1 (flow proportional to speed); H2/H1 = (N2/N1)^2 (head proportional to speed squared); P2/P1 = (N2/N1)^3 (power proportional to speed cubed). VFDs reduce speed to match flow demand, saving significant energy.",
      },
      {
        heading: "Net Positive Suction Head (NPSH) and Cavitation",
        body: "NPSH Available (NPSHa) must exceed NPSH Required (NPSHr) to prevent cavitation. Cavitation occurs when liquid pressure drops below vapour pressure, forming and collapsing vapour bubbles — symptoms: crackling/rattling noise, vibration, reduced flow and head, pitting of impeller. Causes of low NPSHa: high suction lift, high liquid temperature, long suction pipe, partially closed suction valve. Corrective actions: lower pump, increase suction pipe diameter, reduce suction lift, cool liquid.",
      },
      {
        heading: "Blowers and Aeration Systems",
        body: "Blowers supply air to the aeration basin for activated sludge. Types: rotary lobe (positive displacement) and centrifugal (turbo). Rotary lobe blowers provide constant flow at variable pressure — used for smaller plants. Centrifugal blowers are more efficient at larger flows. Dissolved oxygen (DO) control: adjust blower output or diffuser air flow to maintain 1.5-3.0 mg/L. Fine bubble diffusers are more efficient than coarse bubble (higher oxygen transfer efficiency, OTE). Diffuser fouling reduces OTE — regular cleaning required.",
      },
      {
        heading: "Lift Station Operation",
        body: "Lift stations pump wastewater from low points to higher elevations. Wet well design: adequate volume to prevent short cycling (minimum 5-30 min HRT). Pump control: float switches, ultrasonic level sensors, or pressure transducers. Redundancy: minimum 2 pumps (N+1). Emergency overflow prevention: high-level alarms, emergency generators, bypass pumping. Common problems: pump failure (impeller wear, air binding), check valve failure (backflow), clogged suction screen, wet well septicity (H2S generation). Wet well ventilation is required to control H2S and prevent explosive atmospheres.",
      },
    ],
    tableHeadings: ["Affinity Law", "Formula", "Application"],
    tableRows: [
      ["Flow vs. Speed", "Q2 = Q1 x (N2/N1)", "Predict new flow when speed changes"],
      ["Head vs. Speed", "H2 = H1 x (N2/N1)^2", "Predict new head when speed changes"],
      ["Power vs. Speed", "P2 = P1 x (N2/N1)^3", "Predict energy savings with VFD"],
      ["Specific Speed", "Ns = N x Q^0.5 / H^0.75", "Classify pump type"],
    ],
    examTips: [
      "Affinity Laws: flow proportional to speed, head proportional to speed squared, power proportional to speed cubed",
      "Cavitation symptoms: crackling noise, vibration, reduced flow, pitting — caused by insufficient NPSHa",
      "VFDs reduce speed to match demand — power savings are cubic (halving speed = 1/8 power)",
      "Fine bubble diffusers have higher OTE than coarse bubble — preferred for energy efficiency",
      "Wet well H2S: ventilate wet well, monitor H2S levels, use PPE before entry",
      "Rising wet well level with pump running: check impeller wear, air binding, check valve, suction screen",
    ],
    formulaHint:
      "Q2 = Q1 x (N2/N1)  |  H2 = H1 x (N2/N1)^2  |  P2 = P1 x (N2/N1)^3\nNPSHa = (Atmospheric pressure minus Vapour pressure minus Suction lift minus Friction losses) in metres",
  },
  "Equipment Evaluation & Maintenance": {
    title: "Equipment Evaluation & Maintenance",
    intro:
      "Class 3 Wastewater operators must evaluate equipment condition, plan preventive maintenance, and diagnose equipment failures. A proactive maintenance program reduces unplanned downtime, extends equipment life, and ensures regulatory compliance. Key areas include pump condition assessment, vibration analysis, bearing maintenance, and instrumentation calibration.",
    keyPoints: [
      {
        heading: "Preventive Maintenance Programs",
        body: "A preventive maintenance (PM) program schedules inspections and maintenance tasks based on manufacturer recommendations, operating hours, or calendar intervals. PM tasks for pumps: lubrication (check oil level, grease bearings per schedule), seal inspection (mechanical seals or packing glands), vibration measurement, temperature monitoring (bearings less than 70 degrees C above ambient), alignment check. PM records must be maintained for regulatory compliance and warranty purposes. Predictive maintenance uses condition monitoring (vibration, thermography, oil analysis) to identify developing problems before failure.",
      },
      {
        heading: "Vibration Analysis",
        body: "Vibration analysis identifies developing mechanical problems in rotating equipment. Measured parameters: vibration velocity (mm/s RMS) or acceleration (g). ISO 10816 provides vibration severity guidelines. Common causes of excessive vibration: imbalance (1x running speed frequency), misalignment (1x and 2x frequency), bearing defects (high-frequency components), cavitation (random broadband), resonance. Vibration trending over time identifies deteriorating conditions. Corrective actions: dynamic balancing, shaft alignment (laser alignment preferred), bearing replacement.",
      },
      {
        heading: "Pump Condition Assessment",
        body: "Pump performance testing compares actual flow and head to the original pump curve. Reduced flow at normal head: worn impeller, air binding, partially closed valve. Reduced head at normal flow: worn impeller, excessive wear ring clearance. Impeller inspection: look for erosion, corrosion, pitting (cavitation), and wear ring clearance (should be less than 0.5 mm). Mechanical seal inspection: check for leakage (small drip acceptable for packing; no leakage for mechanical seals), heat, and seal face condition. Pump efficiency = (Water power output) / (Shaft power input) x 100%.",
      },
      {
        heading: "Instrumentation Calibration",
        body: "Accurate instrumentation is essential for process control and regulatory reporting. Flow meters: verify with portable ultrasonic meter or weir/flume measurement. DO probes: 2-point calibration (air-saturated water and zero DO). pH meters: 2-point calibration with pH 4 and pH 7 buffers (or pH 7 and pH 10 for alkaline samples). Turbidity meters: calibrate with formazin or AMCO-AEPA standards. Calibration records must be maintained. Out-of-calibration instruments must be taken out of service or results flagged until recalibrated.",
      },
    ],
    tableHeadings: ["Equipment", "Key Maintenance Task", "Warning Sign"],
    tableRows: [
      ["Centrifugal pump", "Lubrication, seal inspection, vibration check", "Excessive vibration, bearing temperature > 70 degrees C above ambient"],
      ["Blower (rotary lobe)", "Oil change, belt tension, inlet filter", "High discharge temperature, unusual noise"],
      ["Mechanical seal", "Inspect for leakage, heat, seal face wear", "Continuous leakage (more than a drip)"],
      ["DO probe", "Membrane/electrolyte replacement, calibration", "Drift, slow response, readings inconsistent with process"],
      ["Flow meter (magnetic)", "Electrode cleaning, zero check", "Erratic readings, zero offset"],
      ["UV disinfection lamp", "Sleeve cleaning, lamp output measurement", "UVT drop, lamp hours exceeding rated life"],
    ],
    examTips: [
      "Bearing temperature limit: typically less than 70 degrees C above ambient (or per manufacturer spec)",
      "Vibration at 1x running speed = imbalance; at 2x = misalignment; high frequency = bearing defects",
      "Pump efficiency decreases with worn impeller — compare actual curve to original pump curve",
      "DO probe calibration: 2-point (air-saturated and zero); pH meter: 2-point with appropriate buffers",
      "Mechanical seal should have no continuous leakage; packing gland allows a small drip",
      "Calibration records are a regulatory requirement — maintain and retain per O&M manual",
    ],
    formulaHint:
      "Pump Efficiency (%) = (Water Power kW / Shaft Power kW) x 100\nWater Power (kW) = Q (m3/s) x H (m) x density (kg/m3) x g (9.81 m/s2) / 1000\nBearing Temperature Rise = Measured temperature minus Ambient temperature (limit: approximately 70 degrees C rise)",
  },
  "Security, Safety & Admin": {
    title: "Security, Safety & Admin",
    intro:
      "Class 3 Wastewater operators carry expanded responsibilities for workplace safety, regulatory compliance, emergency response, and administrative oversight. At this level, operators may supervise other staff, coordinate emergency responses, and ensure the facility meets all requirements under the Ontario Water Resources Act (OWRA), O. Reg. 129/04 (Wastewater Systems Effluent), the Occupational Health and Safety Act (OHSA), and the facility's Environmental Compliance Approval (ECA).",
    keyPoints: [
      {
        heading: "Confined Space Safety",
        body: "Confined space entry at wastewater plants is a high-risk activity due to H2S, methane, CO2, and oxygen deficiency. Atmospheric testing order before entry: (1) Oxygen — acceptable range 19.5-23.0%; (2) Combustible gases — acceptable less than 10% LEL; (3) Toxic gases — H2S less than 10 ppm, CO less than 25 ppm. A written entry permit must be completed before each entry. Non-entry rescue is preferred — a rescue team must be in place before entry begins. Attendant must remain outside and maintain communication with entrant. OHSA Confined Spaces Regulation (O. Reg. 632/05) governs confined space work in Ontario.",
      },
      {
        heading: "Emergency Response and Spill Reporting",
        body: "Class 3 operators must know the facility's Emergency Response Plan (ERP) and be able to coordinate emergency responses. Spill reporting: any discharge of a pollutant to the natural environment that is not authorized by the ECA must be reported to the MECP Spills Action Centre (1-800-268-6060) immediately. Wastewater bypasses must be reported to MECP and the local municipality. Adverse results (effluent exceeding ECA limits) must be reported per the ECA conditions — typically within 24 hours. Operators must maintain records of all spills, bypasses, and adverse results.",
      },
      {
        heading: "Operator Certification and Supervision",
        body: "Under O. Reg. 129/04, wastewater systems must be operated by certified operators. Class 3 operators may supervise Class 1 and Class 2 operators. The Overall Responsible Operator (ORO) is accountable for the overall operation of the facility. Operators must ensure that staff performing duties hold the appropriate certification. Continuing education is required to maintain certification — operators must accumulate Professional Development Hours (PDHs). Operators are personally responsible for their professional actions and cannot be directed to violate regulations.",
      },
      {
        heading: "WHMIS 2015 and Chemical Safety",
        body: "WHMIS 2015 (aligned with GHS) replaced WHMIS 1988. Safety Data Sheets (SDS) replaced Material Safety Data Sheets (MSDS). GHS pictograms replaced WHMIS symbols. Chemicals at wastewater plants: sodium hypochlorite (disinfection), sodium bisulfite (dechlorination), alum/ferric chloride (chemical P removal), polymer (sludge conditioning), methanol (denitrification carbon source). All staff must be trained on WHMIS 2015 before handling hazardous products. SDS must be accessible in the workplace. PPE selection must be based on SDS hazard information.",
      },
    ],
    tableHeadings: ["Regulatory Requirement", "Trigger / Frequency", "Action Required"],
    tableRows: [
      ["Spill report to MECP", "Any unauthorized discharge", "Call Spills Action Centre immediately (1-800-268-6060)"],
      ["Adverse result report", "Effluent exceeds ECA limit", "Report per ECA conditions (typically 24 hours)"],
      ["Bypass report", "Any wastewater bypass", "Report to MECP and municipality immediately"],
      ["Confined space entry permit", "Before each entry", "Atmospheric test, rescue team, written permit"],
      ["WHMIS training", "Before handling hazardous products", "Review SDS, use appropriate PPE"],
      ["Operator certification", "Ongoing", "Maintain PDHs, renew certificate before expiry"],
    ],
    examTips: [
      "Confined space atmospheric testing order: O2 first, then combustible gases (LEL), then toxic gases (H2S, CO)",
      "H2S acceptable limit before confined space entry: less than 10 ppm",
      "Spill reporting: call MECP Spills Action Centre immediately — do not wait to assess severity",
      "WHMIS 2015: SDS replaced MSDS; GHS pictograms replaced WHMIS symbols",
      "Non-entry rescue is preferred for confined spaces — rescue team must be in place before entry",
      "ORO (Overall Responsible Operator) is accountable for overall facility operation under O. Reg. 129/04",
    ],
    formulaHint:
      "No calculation formulas — this module is regulatory and procedural. Know the notification timelines, confined space testing order, and key Ontario regulations (OWRA, O. Reg. 129/04, OHSA, O. Reg. 632/05).",
  },
};
