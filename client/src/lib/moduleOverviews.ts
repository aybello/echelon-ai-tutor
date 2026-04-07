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
