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

// ─── Class 4 Water Module Overviews ─────────────────────────────────────────
export const CLASS4_WATER_OVERVIEWS: Record<string, ModuleOverview> = {
  "Treatment Process": {
    title: "Treatment Process",
    intro:
      "Class 4 Water operators hold the highest certification level and are responsible for the overall operation, optimization, and compliance of large or complex water treatment facilities. This includes multi-barrier treatment systems, advanced disinfection (UV, ozone, chloramination), membrane filtration, and regulatory reporting under O. Reg. 170/03 (Safe Drinking Water Act). Class 4 operators must understand CT calculations, log inactivation requirements, and multi-barrier risk management.",
    keyPoints: [
      {
        heading: "Multi-Barrier Treatment and Log Inactivation",
        body: "Ontario's multi-barrier approach requires that treatment achieve specified log removal/inactivation of Giardia, Cryptosporidium, and viruses. Under O. Reg. 170/03 and the associated Procedure for Disinfection of Drinking Water in Ontario: Giardia — 3 log removal/inactivation; Cryptosporidium — 2 log removal/inactivation (or more based on source water monitoring); Viruses — 4 log removal/inactivation. Physical removal (coagulation/flocculation/sedimentation/filtration) provides credit toward log removal. Disinfection provides the remaining inactivation credit. CT (concentration x time) is used to calculate inactivation credit.",
      },
      {
        heading: "CT Calculations and Disinfection Credit",
        body: "CT = Disinfectant Residual (mg/L) x Contact Time (minutes). CT tables (from Health Canada or USEPA) give the CT required for a specific log inactivation at a given temperature and pH. T10 (the time for 10% of the water to pass through the contact basin) is used instead of theoretical HRT to account for short-circuiting. T10 = Baffling Factor x HRT. Baffling factors: unbaffled = 0.1, poor = 0.3, average = 0.5, superior = 0.7, perfect = 1.0. CT achieved must equal or exceed CT required for each pathogen.",
      },
      {
        heading: "Advanced Disinfection: UV and Ozone",
        body: "UV disinfection: inactivates Giardia and Cryptosporidium at low doses (40 mJ/cm2 for 3-log Giardia; 10 mJ/cm2 for 2-log Cryptosporidium). UV dose = UV intensity (mW/cm2) x exposure time (s). UV transmittance (UVT) must be monitored — low UVT reduces effective dose. Validated UV reactors use RED (Reduction Equivalent Dose) from manufacturer testing. Ozone: powerful oxidant and disinfectant; effective against Cryptosporidium (CT = 0.5 mg·min/L for 2-log at 25 degrees C). Ozone also oxidizes taste/odour compounds (MIB, geosmin), iron, manganese, and some micropollutants. Ozone requires off-gas destruction and careful monitoring of bromate formation (DBP).",
      },
      {
        heading: "Membrane Filtration",
        body: "Membrane filtration types: microfiltration (MF, 0.1-0.2 um), ultrafiltration (UF, 0.01-0.05 um), nanofiltration (NF), reverse osmosis (RO). MF/UF provide absolute physical barrier against Cryptosporidium and Giardia — 3-log credit if integrity is maintained. Integrity testing: pressure decay test (PDT) or direct integrity test (DIT) — performed daily or per manufacturer/regulatory requirements. Turbidity of individual membrane module filtrate monitored continuously. NF/RO remove dissolved solids, nitrates, hardness, and some micropollutants — concentrate (reject) must be managed.",
      },
      {
        heading: "Chloramination",
        body: "Chloramination (combined chlorine) is used as a secondary disinfectant to reduce trihalomethane (THM) and haloacetic acid (HAA) formation in distribution systems. Chloramine formation: Cl2 + NH3 → monochloramine (NH2Cl). Cl2:NH3-N ratio must be maintained at < 5:1 (mass ratio) to prevent dichloramine and trichloramine formation (taste/odour). Chloramine residual decays more slowly than free chlorine — better for long distribution systems. Nitrification risk: ammonia released from chloramine decay supports Nitrosomonas growth — monitor nitrite in distribution system. Breakpoint chlorination may be needed to restore free chlorine residual.",
      },
    ],
    tableHeadings: ["Pathogen", "Log Removal Required (Ontario)", "Primary Credit Source"],
    tableRows: [
      ["Giardia", "3 log", "Filtration (2 log) + CT disinfection (1 log)"],
      ["Cryptosporidium", "2 log (minimum)", "Filtration (2 log) or UV"],
      ["Viruses", "4 log", "Filtration (2 log) + CT disinfection (2 log)"],
    ],
    examTips: [
      "CT = Residual (mg/L) x T10 (min) — always use T10, not theoretical HRT",
      "T10 = Baffling Factor x HRT — know baffling factor values (unbaffled = 0.1, perfect = 1.0)",
      "UV provides Cryptosporidium credit that chlorine does not — key advantage of UV",
      "Cl2:NH3-N ratio must be < 5:1 for monochloramine; > 5:1 causes taste/odour from dichloramine",
      "Membrane integrity testing (PDT) must be performed regularly — failure = loss of log removal credit",
      "Ozone forms bromate from bromide — monitor bromate as a DBP",
    ],
    formulaHint:
      "CT (mg·min/L) = Disinfectant Residual (mg/L) x T10 (min)\nT10 (min) = Baffling Factor x HRT (min)\nHRT (min) = Volume (L) / Flow (L/min)\nLog Inactivation = CT_achieved / CT_required_per_log",
  },
  "Equipment O&M": {
    title: "Equipment O&M",
    intro:
      "Class 4 Water operators are responsible for the maintenance management of all plant equipment, including high-service pumps, chemical feed systems, SCADA/instrumentation, and emergency power systems. At this level, operators develop and oversee maintenance programs, evaluate equipment performance, and manage capital replacement planning.",
    keyPoints: [
      {
        heading: "Pump Condition Monitoring and Performance Testing",
        body: "Performance testing compares actual pump output (flow, head, power) to the original pump curve. Efficiency = Water Power / Shaft Power x 100%. Declining efficiency indicates impeller wear, increased internal recirculation, or seal deterioration. Vibration analysis: ISO 10816 velocity limits (typically < 4.5 mm/s RMS for large pumps). Bearing temperature: < 70 degrees C above ambient. Oil analysis identifies bearing wear metals (Fe, Cu, Al) before failure. Thermographic imaging detects hot spots in motor windings, switchgear, and bearings.",
      },
      {
        heading: "Chemical Feed System Maintenance",
        body: "Chemical feed systems include metering pumps (peristaltic, diaphragm), solution tanks, day tanks, and injection points. Peristaltic pumps: check tubing for wear and cracking — replace per manufacturer schedule. Diaphragm pumps: check diaphragm, valves, and calibration. Calibration: measure actual output volume over a timed period and compare to set point. Chemical compatibility: verify all wetted materials are compatible with the chemical being fed (e.g., sodium hypochlorite attacks brass and some elastomers). Secondary containment must be sized for 110% of the largest tank volume.",
      },
      {
        heading: "SCADA and Instrumentation",
        body: "SCADA (Supervisory Control and Data Acquisition) systems monitor and control plant operations remotely. Key components: PLCs (Programmable Logic Controllers), HMI (Human-Machine Interface), communication networks, field instruments. Cybersecurity: SCADA systems must be protected from unauthorized access — network segmentation, strong passwords, patch management. Instrument calibration: all process instruments (flow, pressure, level, turbidity, chlorine residual, pH) must be calibrated on a defined schedule and records maintained. Alarm management: critical alarms (low chlorine residual, high turbidity, pump failure) must trigger immediate operator response.",
      },
      {
        heading: "Emergency Power Systems",
        body: "Emergency generators must be capable of powering all critical plant systems (high-service pumps, chemical feed, SCADA, lighting). Generator testing: monthly no-load test; annual load test under full plant load. Transfer switch: automatic transfer switch (ATS) transfers load to generator within seconds of power failure. Fuel supply: minimum 72-hour fuel supply required for critical facilities. Battery backup (UPS): provides power during generator start-up delay for critical instruments and controls. Emergency response plan must include power failure scenarios and manual operating procedures.",
      },
    ],
    tableHeadings: ["Equipment", "Key Maintenance Indicator", "Action Threshold"],
    tableRows: [
      ["High-service pump", "Vibration velocity (mm/s RMS)", "> 4.5 mm/s: investigate and schedule repair"],
      ["Pump bearing", "Temperature rise above ambient", "> 70 degrees C rise: shut down and inspect"],
      ["Chemical metering pump", "Calibration accuracy", "> 5% deviation: recalibrate"],
      ["Emergency generator", "Load test result", "Fails to start or sustain load: immediate repair"],
      ["SCADA instrument", "Calibration drift", "Outside acceptable range: recalibrate or replace"],
    ],
    examTips: [
      "Pump efficiency = Water Power / Shaft Power x 100% — declining efficiency indicates wear",
      "Vibration at 1x = imbalance; 2x = misalignment; high frequency = bearing defects",
      "Chemical secondary containment must hold 110% of the largest tank volume",
      "Generator must be load-tested annually — monthly no-load test is not sufficient",
      "SCADA cybersecurity: network segmentation and access controls are regulatory expectations",
      "Peristaltic pump tubing must be replaced on schedule — failure causes loss of chemical feed",
    ],
    formulaHint:
      "Pump Efficiency (%) = (Q m3/s x H m x 9810 N/m3) / (Shaft Power W) x 100\nCalibration: Actual Output (mL) / Set Output (mL) x 100% — target 95-105%",
  },
  "Hydraulics": {
    title: "Hydraulics",
    intro:
      "Class 4 Water operators must apply advanced hydraulic principles to manage distribution system pressures, model flow networks, size pumping systems, and ensure adequate fire flow and minimum pressure throughout the service area. Understanding the Hardy-Cross method, energy grade lines, and hydraulic transients is essential at this certification level.",
    keyPoints: [
      {
        heading: "Distribution System Hydraulics",
        body: "Minimum pressure in distribution system: 275 kPa (40 psi) under normal conditions; 140 kPa (20 psi) during fire flow. Maximum pressure: typically < 690 kPa (100 psi) to prevent main breaks and customer complaints. Pressure zones: large systems use pressure reducing valves (PRVs) and booster stations to maintain pressure in different elevation zones. Hazen-Williams equation: V = 0.8492 x C x R^0.63 x S^0.54, where C is roughness coefficient (new cast iron = 130, old tuberculated = 60-80, PVC = 150). Darcy-Weisbach is more accurate for all flow conditions.",
      },
      {
        heading: "Water Hammer and Hydraulic Transients",
        body: "Water hammer occurs when flow velocity changes rapidly (pump start/stop, valve closure). Pressure surge = rho x a x delta_V, where a is wave speed (~1,200 m/s for water in steel pipe). Surge pressure can exceed 10x normal operating pressure — can cause main breaks and fitting failures. Mitigation: slow-closing valves (> 10 seconds), surge tanks, air release/vacuum break valves, pump control valves. Pump start-up: open discharge valve slowly; pump shut-down: close discharge valve before stopping pump (for large pumps).",
      },
      {
        heading: "Pipe Network Analysis",
        body: "Hardy-Cross method: iterative method for solving pipe network flows and head losses. Each loop must satisfy: (1) continuity — flow into each junction equals flow out; (2) energy — head loss around each loop sums to zero. Flow correction: delta_Q = -sum(h_L) / (n x sum(h_L/Q)), where n = 1.85 for Hazen-Williams. Modern practice uses computer hydraulic models (WaterGEMS, EPANET) for network analysis. Models must be calibrated against field measurements (pressure, flow) to be reliable.",
      },
      {
        heading: "Pumping System Design and Energy",
        body: "System curve: H = static head + friction losses (increases with Q^2). Pump curve: H decreases as Q increases. Operating point: intersection of pump and system curves. Parallel pumps: same head, flows add — used to increase flow capacity. Series pumps: same flow, heads add — used to overcome high static head. Specific speed (Ns) classifies pump type: low Ns (< 1000) = radial flow (high head, low flow); high Ns (> 10000) = axial flow (low head, high flow). VFD energy savings: P proportional to N^3 — reducing speed to 80% saves ~50% energy.",
      },
    ],
    tableHeadings: ["Parameter", "Minimum/Maximum", "Regulatory Reference"],
    tableRows: [
      ["Distribution pressure (normal)", "275 kPa (40 psi) minimum", "Ontario Drinking Water Standards"],
      ["Distribution pressure (fire flow)", "140 kPa (20 psi) minimum", "Ontario Fire Code / NFPA 291"],
      ["Maximum distribution pressure", "< 690 kPa (100 psi) typical", "Design standard"],
      ["Hazen-Williams C (new PVC)", "150", "AWWA M23"],
      ["Hazen-Williams C (old cast iron)", "60-80", "AWWA M23"],
    ],
    examTips: [
      "Minimum pressure: 275 kPa normal; 140 kPa during fire flow — know both values",
      "Water hammer mitigation: slow-closing valves, surge tanks, air release valves",
      "Parallel pumps: flows add at same head; Series pumps: heads add at same flow",
      "VFD: power proportional to speed cubed — 80% speed = ~51% of full power",
      "Hardy-Cross: iterate until head loss around each loop sums to zero",
      "Hazen-Williams C decreases with age/tuberculation — affects head loss calculations",
    ],
    formulaHint:
      "Hazen-Williams: V (m/s) = 0.8492 x C x R^0.63 x S^0.54\nWater Hammer Surge: delta_P = rho x a x delta_V\nParallel pumps: Q_total = Q1 + Q2 (at same head)\nSeries pumps: H_total = H1 + H2 (at same flow)",
  },
  "Regulations & Management": {
    title: "Regulations & Management",
    intro:
      "Class 4 Water operators must have comprehensive knowledge of Ontario's drinking water regulatory framework, including the Safe Drinking Water Act (SDWA), O. Reg. 170/03, the Drinking Water Quality Standards (O. Reg. 169/03), and the Procedure for Disinfection of Drinking Water in Ontario. At this level, operators are also responsible for management systems, quality management, and regulatory reporting.",
    keyPoints: [
      {
        heading: "Safe Drinking Water Act and O. Reg. 170/03",
        body: "The Safe Drinking Water Act (SDWA, 2002) is Ontario's primary drinking water legislation. O. Reg. 170/03 (Drinking Water Systems) sets out operational requirements: sampling frequencies, adverse result reporting, notification requirements, and record-keeping. Key requirements: continuous monitoring of turbidity and disinfectant residual; daily sampling for microbiological parameters; immediate reporting of adverse results to the Medical Officer of Health and the MECP. Licence and permit to take water (PTTW) must be maintained. Annual summary report must be prepared and made available to the public.",
      },
      {
        heading: "Adverse Results and Notification",
        body: "Adverse result: any test result that exceeds a standard in O. Reg. 169/03, or any result that indicates a potential health risk. Notification chain: (1) Immediately notify the Medical Officer of Health (MOH) and the MECP; (2) Issue a Boil Water Advisory (BWA) or Do Not Use Advisory if required; (3) Notify the public. Turbidity adverse result: > 1 NTU for filtered systems triggers immediate investigation and potential BWA. E. coli detection: immediate BWA, resample, investigate source. Total coliform detection: investigate, resample within 24 hours.",
      },
      {
        heading: "Drinking Water Quality Management Standard (DWQMS)",
        body: "DWQMS is Ontario's quality management system for municipal drinking water. Based on ISO 9001 principles. Key elements: Operational Plan (documents all aspects of system operation), risk assessment, management review, internal audits, corrective actions. Accreditation: third-party auditors verify compliance with DWQMS. Owners (municipalities) must have an accredited Operating Authority. The Operational Plan must be reviewed and updated annually. Continuous improvement is a core requirement.",
      },
      {
        heading: "Source Water Protection",
        body: "Clean Water Act (2006) established Source Protection Plans (SPPs) for all Ontario watersheds. Significant threats to drinking water sources must be identified and managed. Wellhead Protection Areas (WHPAs) and Intake Protection Zones (IPZs) define areas where activities are regulated. Operators must know the threats in their source protection area and the policies that apply. Vulnerable areas: karst aquifers, shallow unconfined aquifers, surface water intakes near agricultural land. Source-to-tap approach: protection at the source reduces treatment burden.",
      },
    ],
    tableHeadings: ["Trigger", "Required Action", "Timeline"],
    tableRows: [
      ["E. coli detection", "Notify MOH and MECP, issue BWA, resample", "Immediately"],
      ["Total coliform detection", "Investigate, resample", "Within 24 hours"],
      ["Turbidity > 1 NTU (filtered)", "Investigate, consider BWA", "Immediately"],
      ["Chlorine residual below minimum", "Investigate, notify MECP if not restored", "Immediately"],
      ["Annual summary report", "Prepare and make available to public", "By February 28 each year"],
    ],
    examTips: [
      "E. coli = immediate BWA, notify MOH and MECP immediately — no waiting for confirmation",
      "Total coliform = investigate and resample within 24 hours (not automatic BWA)",
      "Turbidity > 1 NTU for filtered systems = adverse result requiring immediate action",
      "DWQMS Operational Plan must be reviewed and updated annually",
      "Annual summary report must be made available to the public by February 28",
      "Source Protection Plans (SPPs) under the Clean Water Act regulate activities near intakes and wells",
    ],
    formulaHint:
      "No primary calculation formulas — this module is regulatory. Know the notification timelines, adverse result thresholds (O. Reg. 169/03), and DWQMS requirements.",
  },
  "Water Quality": {
    title: "Water Quality",
    intro:
      "Class 4 Water operators must understand advanced water quality parameters, disinfection by-product (DBP) formation and control, corrosion control, and emerging contaminants. Managing DBP formation while maintaining adequate disinfection is one of the most challenging aspects of Class 4 water treatment.",
    keyPoints: [
      {
        heading: "Disinfection By-Products (DBPs)",
        body: "DBPs form when disinfectants react with natural organic matter (NOM) in source water. Trihalomethanes (THMs): chloroform, bromodichloromethane, dibromochloromethane, bromoform — formed by chlorination of NOM. Ontario MAC: 100 ug/L total THMs. Haloacetic acids (HAAs): formed by chlorination of NOM — Ontario MAC: 80 ug/L. DBP control strategies: (1) reduce NOM before disinfection (enhanced coagulation, GAC); (2) use alternative disinfectants (chloramines, UV, ozone); (3) optimize chlorine dose and contact time. Bromide in source water increases brominated DBP formation.",
      },
      {
        heading: "Corrosion Control",
        body: "Corrosion in distribution systems causes lead and copper leaching, red water (iron), and pipe deterioration. Langelier Saturation Index (LSI): LSI = pH - pHs, where pHs is the saturation pH for calcium carbonate. LSI > 0: water is scale-forming (protective CaCO3 layer). LSI < 0: water is corrosive. Corrosion control: adjust pH (target 7.5-8.5), add phosphate inhibitor, maintain calcium hardness. Lead and copper rule (Ontario): if > 10% of samples exceed lead MAC (10 ug/L) or copper MAC (1 mg/L), corrosion control treatment required.",
      },
      {
        heading: "Emerging Contaminants",
        body: "Emerging contaminants include pharmaceuticals and personal care products (PPCPs), per- and polyfluoroalkyl substances (PFAS), microplastics, and cyanotoxins. PFAS: highly persistent, bioaccumulative — Ontario has established interim MACs for PFOA and PFOS. Cyanotoxins (from harmful algal blooms, HABs): microcystin-LR MAC = 1.5 ug/L. Monitoring and treatment: ozone + GAC is effective for many emerging contaminants. Early warning monitoring at intake is critical for HAB events.",
      },
      {
        heading: "Taste and Odour Control",
        body: "Common taste and odour compounds: 2-methylisoborneol (MIB) and geosmin — produced by cyanobacteria and actinomycetes. Threshold odour concentration: MIB and geosmin detectable at 5-10 ng/L. Treatment: powdered activated carbon (PAC) — effective for MIB and geosmin; ozone oxidizes both compounds. Chlorine does not effectively remove MIB or geosmin. Monitoring: threshold odour number (TON) test; GC-MS for specific compounds. Seasonal occurrence: late summer/fall algal blooms are peak risk period.",
      },
    ],
    tableHeadings: ["Parameter", "Ontario MAC", "Treatment Strategy"],
    tableRows: [
      ["Total THMs", "100 ug/L", "Enhanced coagulation, chloramination, GAC"],
      ["Haloacetic acids (HAAs)", "80 ug/L", "Enhanced coagulation, chloramination, GAC"],
      ["Lead", "10 ug/L", "pH adjustment, phosphate inhibitor, pipe replacement"],
      ["Copper", "1 mg/L", "pH adjustment, corrosion inhibitor"],
      ["Microcystin-LR", "1.5 ug/L", "Ozone, PAC, GAC, monitoring at intake"],
      ["PFOA/PFOS", "Interim MACs (check current Ontario standards)", "GAC, nanofiltration, reverse osmosis"],
    ],
    examTips: [
      "THM MAC = 100 ug/L; HAA MAC = 80 ug/L — both are running annual averages",
      "LSI > 0 = scale-forming (protective); LSI < 0 = corrosive — target slightly positive LSI",
      "MIB and geosmin: chlorine does NOT remove them — use PAC or ozone",
      "Lead MAC = 10 ug/L; if > 10% of samples exceed, corrosion control treatment required",
      "PFAS are highly persistent — GAC and nanofiltration/RO are primary treatment options",
      "Cyanotoxin risk peaks in late summer — monitor intake turbidity, algae counts, and microcystin",
    ],
    formulaHint:
      "LSI = pH_measured - pH_saturation\npH_saturation = pK2 - pKs + p[Ca2+] + p[alkalinity]\nTHM formation increases with: higher NOM, higher chlorine dose, longer contact time, higher temperature, higher pH",
  },
  "Math & Calculations": {
    title: "Math & Calculations",
    intro:
      "Class 4 Water operators must perform complex calculations involving CT compliance, chemical dosing, flow rates, pump performance, and hydraulic analysis. Accuracy is critical — errors in CT calculations or chemical dosing can result in regulatory non-compliance or public health risks.",
    keyPoints: [
      {
        heading: "CT Compliance Calculations",
        body: "CT_required is obtained from regulatory tables (based on temperature, pH, and target log inactivation). CT_achieved = Residual (mg/L) x T10 (min). T10 = Baffling Factor x HRT. HRT = Volume / Flow. Log inactivation achieved = CT_achieved / CT_per_log. Multiple disinfection stages: sum CT contributions from each stage. Example: if CT_required for 3-log Giardia at 10 degrees C and pH 7 = 165 mg·min/L, and CT_achieved = 180 mg·min/L, the system is compliant with 0.33 log of additional capacity.",
      },
      {
        heading: "Chemical Feed Calculations",
        body: "Chemical dose (mg/L) = mass of chemical applied / volume of water treated. Feed rate (kg/day) = Dose (mg/L) x Flow (m3/day) x 0.001. For solutions: Feed rate (L/day) = [Dose (mg/L) x Flow (m3/day)] / [Solution concentration (mg/L)]. Chlorine demand = Applied dose - Residual. Chlorine dose for CT: must achieve required residual at the end of the contact zone. Alum dose for coagulation: jar test determines optimal dose — typically 10-50 mg/L. Lime softening: calculate hardness removal using stoichiometry (CaCO3 precipitation).",
      },
      {
        heading: "Flow and Volume Calculations",
        body: "Flow rate: Q = A x V (pipe flow); Q = Cd x A x sqrt(2gH) (orifice/weir). Weir flow: Q = 1.84 x L x H^1.5 (rectangular weir, SI units). Unit conversions: 1 m3 = 1000 L; 1 MLD = 1,000,000 L/day = 11.57 L/s. Detention time: HRT = V / Q. Surface overflow rate (SOR): SOR = Q / A (m3/m2/day). Filter loading rate: Q / filter area (m3/m2/h or m/h). Typical filter loading: 5-12 m/h for rapid sand filters.",
      },
      {
        heading: "Pump and Energy Calculations",
        body: "Water power (kW) = Q (m3/s) x H (m) x rho (kg/m3) x g (9.81 m/s2) / 1000. Shaft power = Water power / Pump efficiency. Motor power = Shaft power / Motor efficiency. Wire-to-water efficiency = Water power / Motor input power. Energy cost = Power (kW) x Time (h) x Rate ($/kWh). Affinity laws: Q2/Q1 = N2/N1; H2/H1 = (N2/N1)^2; P2/P1 = (N2/N1)^3. Specific speed: Ns = N x Q^0.5 / H^0.75 (rpm, m3/s, m).",
      },
    ],
    tableHeadings: ["Calculation Type", "Key Formula", "Units"],
    tableRows: [
      ["CT achieved", "CT = Residual x T10", "mg·min/L"],
      ["T10", "T10 = Baffling Factor x HRT", "minutes"],
      ["Chemical feed rate", "Feed (kg/day) = Dose (mg/L) x Q (m3/day) x 0.001", "kg/day"],
      ["Water power", "P = Q x H x 9810 / 1000", "kW (Q in m3/s, H in m)"],
      ["Rectangular weir flow", "Q = 1.84 x L x H^1.5", "m3/s (L and H in metres)"],
      ["Filter loading rate", "Rate = Q / A", "m/h or m3/m2/h"],
    ],
    examTips: [
      "Always use T10 (not HRT) in CT calculations — T10 = Baffling Factor x HRT",
      "Chemical feed rate: Dose (mg/L) x Flow (m3/d) x 0.001 = kg/day",
      "Water power formula: Q (m3/s) x H (m) x 9810 / 1000 = kW",
      "Affinity laws: power proportional to speed cubed — halving speed = 1/8 power",
      "Rectangular weir: Q = 1.84 x L x H^1.5 (SI units)",
      "Filter loading rate: typically 5-12 m/h for rapid sand; > 15 m/h may cause turbidity breakthrough",
    ],
    formulaHint:
      "CT = Residual (mg/L) x T10 (min)\nT10 = Baffling Factor x HRT\nFeed Rate (kg/d) = Dose (mg/L) x Q (m3/d) x 0.001\nWater Power (kW) = Q (m3/s) x H (m) x 9810 / 1000\nWeir: Q = 1.84 x L x H^1.5",
  },
  "Source Water Protection": {
    title: "Source Water Protection",
    intro:
      "Class 4 Water operators must understand source water characterization, vulnerability assessment, and the regulatory framework for source protection in Ontario. The Clean Water Act (2006) and associated Source Protection Plans (SPPs) require operators to identify and manage threats to drinking water sources.",
    keyPoints: [
      {
        heading: "Source Water Characterization",
        body: "Surface water sources: susceptible to seasonal variation, runoff events, and upstream land use activities. Key parameters: turbidity, colour, TOC (total organic carbon), temperature, algae counts, E. coli, and specific contaminants (nitrates, pesticides). Groundwater sources: generally more stable but vulnerable to contamination from surface infiltration, septic systems, and industrial activities. Aquifer vulnerability: depends on depth to water table, soil permeability, and presence of fractures or karst features. Source water monitoring program must be documented in the Operational Plan.",
      },
      {
        heading: "Intake Protection Zones (IPZs)",
        body: "IPZs are defined areas around surface water intakes where activities are regulated to protect the drinking water source. IPZ-1: area immediately around the intake (highest protection). IPZ-2: area from which water could reach the intake within 2 hours. IPZ-3: area contributing to the intake during a significant storm event. Regulated activities within IPZs: fuel storage, pesticide application, sewage disposal, road salt application. Operators must know the significant threats in their IPZ and the applicable policies.",
      },
      {
        heading: "Wellhead Protection Areas (WHPAs)",
        body: "WHPAs are defined around groundwater wells based on time-of-travel zones: WHPA-A (0-2 year travel time), WHPA-B (2-5 years), WHPA-C (5-25 years), WHPA-D (25-100 years). Higher protection in WHPA-A and WHPA-B. Regulated activities: fuel storage, waste disposal, pesticide application, road salt. Vulnerability scoring: WHPA vulnerability is rated 1-10 based on aquifer characteristics — higher score = more vulnerable = stricter policies.",
      },
      {
        heading: "Harmful Algal Blooms (HABs)",
        body: "HABs (cyanobacterial blooms) produce cyanotoxins (microcystins, anatoxins, cylindrospermopsin) that can cause serious health effects. HAB risk factors: warm temperatures, high nutrients (phosphorus, nitrogen), low flow, and stable water column. Monitoring: visual inspection, algae cell counts, cyanotoxin testing (ELISA or LC-MS). Response: if microcystin > 1.5 ug/L, issue advisory and increase treatment. Treatment: conventional treatment removes intact cells; ozone and GAC remove dissolved toxins. Avoid using copper sulfate to kill algae — cell lysis releases intracellular toxins.",
      },
    ],
    tableHeadings: ["Zone", "Definition", "Protection Level"],
    tableRows: [
      ["IPZ-1", "Immediately around surface water intake", "Highest — most activities prohibited"],
      ["IPZ-2", "2-hour travel time to intake", "High — significant threats regulated"],
      ["IPZ-3", "Significant storm event contribution area", "Moderate — key threats regulated"],
      ["WHPA-A", "0-2 year groundwater travel time", "Highest — most activities prohibited"],
      ["WHPA-B", "2-5 year groundwater travel time", "High — significant threats regulated"],
    ],
    examTips: [
      "IPZ-2 = 2-hour travel time to intake; WHPA-A = 0-2 year groundwater travel time",
      "HAB response: if microcystin > 1.5 ug/L, issue advisory — do NOT use copper sulfate (releases toxins)",
      "Source water monitoring must be documented in the Operational Plan (DWQMS requirement)",
      "Groundwater vulnerability: karst and fractured rock aquifers are most vulnerable",
      "Clean Water Act (2006) established Source Protection Plans — know the key zones and threats",
      "TOC monitoring at intake is a leading indicator of DBP formation potential",
    ],
    formulaHint:
      "No primary calculation formulas — this module is regulatory and conceptual. Know the zone definitions, threat categories, and HAB response protocols.",
  },
  "Plant Management": {
    title: "Plant Management",
    intro:
      "Class 4 Water operators are responsible for overall plant management, including staff supervision, budget management, capital planning, regulatory compliance, and continuous improvement. The Drinking Water Quality Management Standard (DWQMS) requires a documented management system with regular management reviews and internal audits.",
    keyPoints: [
      {
        heading: "DWQMS Operational Plan",
        body: "The Operational Plan is the core document of the DWQMS management system. It must describe: the drinking water system (infrastructure, processes, service area); the quality management policy; risk assessment (threats, likelihood, consequences, controls); operational procedures; monitoring and measurement; emergency response; training requirements; and document control. The Operational Plan must be reviewed and updated at least annually. All staff must be trained on the Operational Plan. Third-party accreditation audits verify compliance.",
      },
      {
        heading: "Risk Assessment and Management",
        body: "Risk assessment identifies hazards and threats to drinking water quality from source to tap. Risk = Likelihood x Consequence. High-risk items require priority control measures and monitoring. Critical control points (CCPs): key process steps where failure would directly impact water quality (e.g., disinfection, filtration). Corrective action procedures must be documented for each CCP. Management of change: any significant change to the system (new chemical, process modification, infrastructure change) must be assessed for risk before implementation.",
      },
      {
        heading: "Staff Management and Training",
        body: "Class 4 operators may supervise all lower-class operators. All staff performing regulated duties must hold the appropriate certification. Training records must be maintained. Succession planning: ensure coverage for all critical roles during vacations, illness, and turnover. Performance management: regular performance reviews, documented training needs, and professional development plans. Operators must accumulate Professional Development Hours (PDHs) to maintain certification. Safety training: WHMIS, confined space, lockout/tagout, first aid must be current for all relevant staff.",
      },
      {
        heading: "Capital Planning and Asset Management",
        body: "Asset management: inventory all infrastructure assets (pipes, pumps, tanks, instruments), assess condition, and plan for rehabilitation or replacement. Lifecycle costing: consider capital cost, operating cost, and end-of-life replacement cost when evaluating equipment options. Capital budget: prioritize replacements based on criticality (impact on service if failed), condition, and remaining useful life. Infrastructure Ontario and MECP provide guidance on asset management for water systems. Annual infrastructure reports may be required under municipal or provincial requirements.",
      },
    ],
    tableHeadings: ["DWQMS Element", "Key Requirement", "Frequency"],
    tableRows: [
      ["Operational Plan review", "Review and update all elements", "At least annually"],
      ["Management review", "Senior management reviews system performance", "At least annually"],
      ["Internal audit", "Audit all elements of the management system", "At least annually"],
      ["Risk assessment", "Review and update risk assessment", "When significant changes occur or annually"],
      ["Third-party accreditation audit", "External auditor verifies DWQMS compliance", "Per accreditation cycle"],
    ],
    examTips: [
      "Operational Plan must be reviewed and updated at least annually — DWQMS requirement",
      "Risk = Likelihood x Consequence — high-risk items require priority controls",
      "Management of change: assess risk before implementing any significant system change",
      "All staff performing regulated duties must hold appropriate certification",
      "PDHs are required to maintain operator certification — track and document",
      "Asset management: condition + criticality + remaining useful life = replacement priority",
    ],
    formulaHint:
      "Risk Score = Likelihood (1-5) x Consequence (1-5)\nAsset Priority = f(Criticality, Condition, Remaining Useful Life)\nNo primary calculation formulas — this module is management and regulatory.",
  },
  "Emergency Response": {
    title: "Emergency Response",
    intro:
      "Class 4 Water operators must develop, maintain, and execute emergency response plans (ERPs) for a wide range of scenarios including source water contamination events, infrastructure failures, power outages, and natural disasters. Under O. Reg. 170/03 and the DWQMS, a documented ERP is mandatory.",
    keyPoints: [
      {
        heading: "Emergency Response Plan Requirements",
        body: "The ERP must address: source water contamination (spills, HABs, extreme turbidity events); treatment failures (loss of disinfection, filter breakthrough, chemical feed failure); distribution system failures (main breaks, pressure loss, backflow events); power outages; and natural disasters (floods, ice storms). The ERP must include: emergency contacts (MOH, MECP, municipal officials, utilities); notification procedures; response procedures for each scenario; resource requirements (equipment, chemicals, staff); and communication protocols (public notification, media). The ERP must be tested through tabletop exercises or drills at least annually.",
      },
      {
        heading: "Boil Water Advisory (BWA) Protocols",
        body: "A BWA is issued when there is a risk that drinking water may be unsafe to consume without boiling. Triggers: E. coli detection, loss of disinfection, turbidity exceedance, distribution system contamination, or significant pressure loss. Issuing a BWA: notify MOH and MECP immediately; issue public notification (media, social media, door-to-door if needed). Maintaining a BWA: continue monitoring; identify and correct the root cause. Lifting a BWA: requires two consecutive satisfactory microbiological samples (minimum 24 hours apart), restoration of normal treatment and pressure, and approval from MOH.",
      },
      {
        heading: "Source Water Contamination Response",
        body: "Spill response: activate ERP, notify MECP Spills Action Centre (1-800-268-6060), assess impact on intake, consider switching to backup source or shutting down intake. Extreme turbidity events (spring runoff, storm events): increase coagulant dose, reduce filter loading rate, increase monitoring frequency, consider activating emergency storage. HAB events: increase monitoring (algae counts, microcystin), consider PAC addition, notify MOH if microcystin approaches MAC. Drought: reduced flow concentrates contaminants — increase monitoring and adjust treatment.",
      },
      {
        heading: "Infrastructure Failure Response",
        body: "Loss of disinfection: immediately notify MECP and MOH; issue BWA if residual cannot be restored within a defined time; investigate cause (chemical feed failure, pump failure, power outage); restore disinfection before lifting BWA. Main break: isolate section, maintain minimum pressure in remainder of system, flush and resample before returning to service. Backflow event: investigate source of contamination, issue BWA if contamination confirmed, flush and resample. Power outage: transfer to emergency generator, verify all critical systems are operating, document duration and any impacts on treatment.",
      },
    ],
    tableHeadings: ["Emergency Scenario", "Immediate Action", "Notification Required"],
    tableRows: [
      ["E. coli detection", "Issue BWA, investigate source", "MOH and MECP immediately"],
      ["Loss of disinfection", "Issue BWA if not restored promptly, investigate", "MECP immediately"],
      ["Extreme turbidity event", "Increase coagulant, reduce filter loading, monitor", "MECP if adverse result"],
      ["Source water spill", "Assess intake impact, consider shutdown", "MECP Spills Action Centre immediately"],
      ["HAB event (microcystin > 1.5 ug/L)", "Issue advisory, add PAC, increase monitoring", "MOH and MECP"],
    ],
    examTips: [
      "BWA triggers: E. coli, loss of disinfection, turbidity exceedance, significant pressure loss",
      "Lifting a BWA requires two consecutive satisfactory microbiological samples (minimum 24 hours apart)",
      "Spill reporting: call MECP Spills Action Centre (1-800-268-6060) immediately",
      "ERP must be tested through exercises or drills at least annually — DWQMS requirement",
      "HAB response: do NOT use copper sulfate — use PAC or ozone; notify MOH if microcystin > 1.5 ug/L",
      "Loss of disinfection: issue BWA if residual cannot be restored — do not delay notification",
    ],
    formulaHint:
      "No primary calculation formulas — this module is procedural. Know the notification timelines, BWA triggers and lifting criteria, and ERP testing requirements.",
  },
  "Advanced Treatment": {
    title: "Advanced Treatment",
    intro:
      "Class 4 Water operators must understand and operate advanced treatment processes including granular activated carbon (GAC), ion exchange, advanced oxidation processes (AOPs), biological filtration, and membrane systems. These processes are increasingly required to address emerging contaminants, DBP precursors, and stringent effluent quality requirements.",
    keyPoints: [
      {
        heading: "Granular Activated Carbon (GAC)",
        body: "GAC adsorbs dissolved organic compounds including DBP precursors (NOM), taste and odour compounds (MIB, geosmin), pesticides, and some micropollutants (PFAS). Empty bed contact time (EBCT): the time water spends in contact with GAC — typically 10-20 minutes. Longer EBCT = greater removal. GAC exhaustion: capacity decreases over time as adsorption sites fill — monitored by TOC breakthrough or taste/odour complaints. Reactivation: exhausted GAC is thermally reactivated (900 degrees C) to restore adsorption capacity. Biological GAC (BAC): after ozonation, GAC supports biological activity that degrades NOM — extends GAC life.",
      },
      {
        heading: "Advanced Oxidation Processes (AOPs)",
        body: "AOPs generate hydroxyl radicals (OH•) — the most powerful oxidant used in water treatment. Common AOPs: UV/H2O2, ozone/H2O2, ozone/UV. Hydroxyl radicals react non-selectively with most organic compounds — effective for micropollutants, pharmaceuticals, and PFAS (some). UV/H2O2: UV photolysis of H2O2 generates OH•. H2O2 residual must be quenched before distribution (by GAC or sodium thiosulfate). Ozone/H2O2: more efficient OH• generation than ozone alone. AOPs are energy-intensive — optimize dose to minimize cost while achieving treatment objectives.",
      },
      {
        heading: "Ion Exchange",
        body: "Ion exchange resins remove specific ions from water by exchanging them with ions on the resin. Cation exchange: removes hardness (Ca2+, Mg2+), heavy metals, and radionuclides. Anion exchange: removes nitrate, arsenic, perchlorate, and PFAS (PFOA, PFOS). Strong acid cation (SAC) resin: used for water softening — regenerated with NaCl or HCl. Strong base anion (SBA) resin: used for nitrate and PFAS removal — regenerated with NaCl or NaOH. Regeneration produces concentrated brine waste that must be managed. Single-use (non-regenerable) resins are used for PFAS removal to avoid regeneration waste issues.",
      },
      {
        heading: "Biological Filtration",
        body: "Biological filtration uses microorganisms attached to filter media to biodegrade dissolved organic matter, ammonia, and manganese. Biologically active filters (BAFs): typically operated after ozonation (ozone increases biodegradability of NOM). Nitrification in filters: Nitrosomonas oxidize ammonia to nitrate — requires DO > 2 mg/L and SRT > 10 days. Manganese removal: biological oxidation of Mn2+ to MnO2 — requires pH > 7.5 and DO. Biological filters must not be disinfected — chlorine kills the biofilm. Backwash with unchlorinated water or air scour only.",
      },
    ],
    tableHeadings: ["Process", "Target Contaminants", "Key Design Parameter"],
    tableRows: [
      ["GAC adsorption", "NOM, DBP precursors, MIB/geosmin, micropollutants", "EBCT: 10-20 minutes"],
      ["UV/H2O2 AOP", "Micropollutants, pharmaceuticals, some PFAS", "UV dose + H2O2 dose"],
      ["Ozone", "Taste/odour, Cryptosporidium, colour, iron/Mn", "CT (mg·min/L) and bromate control"],
      ["Cation exchange (softening)", "Hardness (Ca2+, Mg2+)", "Service flow rate, regeneration frequency"],
      ["Anion exchange", "Nitrate, PFAS, arsenic", "Service flow rate, regenerant waste management"],
      ["Biological filtration (BAF)", "NOM, ammonia, manganese", "EBCT, DO, backwash protocol"],
    ],
    examTips: [
      "GAC EBCT: 10-20 minutes typical — longer EBCT = greater removal",
      "Biological filters must NOT be chlorinated — chlorine kills the biofilm",
      "UV/H2O2 AOP: H2O2 residual must be quenched before distribution (GAC or sodium thiosulfate)",
      "Ion exchange for PFAS: single-use resins avoid regeneration waste problems",
      "Ozone + GAC = BAC (biologically active carbon) — ozone increases NOM biodegradability",
      "Biological Mn removal requires pH > 7.5 and DO — do not disinfect biological filters",
    ],
    formulaHint:
      "EBCT (min) = GAC Volume (m3) / Flow Rate (m3/min)\nGAC Throughput (bed volumes) = Total Volume Treated / GAC Volume\nUV Dose (mJ/cm2) = UV Intensity (mW/cm2) x Exposure Time (s)",
  },
  "Lab Analysis": {
    title: "Lab Analysis",
    intro:
      "Class 4 Water operators must oversee laboratory operations, ensure quality assurance and quality control (QA/QC), interpret complex analytical results, and ensure compliance with Ontario's sampling and testing requirements under O. Reg. 170/03. At this level, operators must understand method detection limits, chain of custody, and the significance of analytical results.",
    keyPoints: [
      {
        heading: "Regulatory Sampling Requirements",
        body: "O. Reg. 170/03 specifies minimum sampling frequencies for all parameters. Microbiological sampling: daily for large systems; weekly for small systems. Turbidity: continuous monitoring for filtered systems. Chlorine residual: continuous at treatment and at distribution system sampling points. THMs and HAAs: quarterly sampling at distribution system locations. Lead and copper: sampling at customer taps (first-draw samples after 6-hour stagnation). All samples must be collected, preserved, and transported per standard methods. Chain of custody must be maintained from collection to analysis.",
      },
      {
        heading: "QA/QC in the Laboratory",
        body: "Quality assurance (QA): system-level activities to ensure accuracy (method validation, staff training, instrument maintenance). Quality control (QC): sample-level activities to detect errors (blanks, duplicates, spikes, standards). Method blanks: detect contamination in reagents or equipment. Field blanks: detect contamination during sampling. Duplicate samples: assess precision (reproducibility). Matrix spikes: assess accuracy (recovery) in the sample matrix. Control charts: track instrument performance over time — identify drift and out-of-control conditions. Accredited laboratories must meet ISO/IEC 17025 requirements.",
      },
      {
        heading: "Turbidity and Particle Counting",
        body: "Turbidity: measured in NTU (nephelometric turbidity units) using a nephelometer. Regulatory limits: < 1 NTU for filtered systems (adverse result if exceeded); < 0.3 NTU target for individual filters. Particle counting: counts particles by size (typically 2-10 um range for Cryptosporidium surrogate). Particle counts provide earlier warning of filter breakthrough than turbidity. Filter ripening: turbidity and particle counts are elevated immediately after backwash — ripening period typically 15-30 minutes. Filter-to-waste during ripening prevents elevated turbidity from entering the distribution system.",
      },
      {
        heading: "Microbiological Testing",
        body: "Total coliform and E. coli: membrane filtration (MF) or presence-absence (P-A) methods. Heterotrophic plate count (HPC): indicates overall bacterial activity in distribution system — elevated HPC may indicate biofilm growth or stagnation. Cryptosporidium and Giardia: Method 1623 (immunofluorescence assay) — expensive and time-consuming; used for source water monitoring. Legionella: culture or PCR — monitoring required for cooling towers and hot water systems. All microbiological samples must be analyzed within holding time (E. coli: 6 hours; total coliform: 24 hours).",
      },
    ],
    tableHeadings: ["Test", "Regulatory Requirement", "Action Level"],
    tableRows: [
      ["E. coli", "Daily sampling (large systems)", "Any detection = adverse result, BWA"],
      ["Total coliform", "Daily sampling (large systems)", "Detection = investigate, resample within 24 h"],
      ["Turbidity (filtered)", "Continuous monitoring", "> 1 NTU = adverse result"],
      ["Chlorine residual", "Continuous at plant; regular in distribution", "Below minimum = investigate immediately"],
      ["THMs", "Quarterly (distribution system)", "> 100 ug/L running annual average = adverse result"],
      ["Lead (first-draw)", "Per lead and copper sampling plan", "> 10 ug/L in > 10% of samples = corrosion control required"],
    ],
    examTips: [
      "E. coli holding time: 6 hours; total coliform: 24 hours — exceed holding time = invalid sample",
      "Turbidity > 1 NTU for filtered systems = adverse result — notify MECP and MOH",
      "Particle counting provides earlier warning of filter breakthrough than turbidity",
      "Matrix spikes assess accuracy (recovery); duplicates assess precision (reproducibility)",
      "THM MAC = 100 ug/L as running annual average — quarterly samples averaged over 4 quarters",
      "Lead sampling: first-draw after 6-hour stagnation — specific protocol required",
    ],
    formulaHint:
      "Running Annual Average (THMs) = Sum of 4 quarterly results / 4\nPercent Recovery (spike) = (Spiked result - Unspiked result) / Spike added x 100%\nRPD (duplicates) = |Result1 - Result2| / Average x 100%",
  },
  "Safety": {
    title: "Safety",
    intro:
      "Class 4 Water operators are responsible for workplace safety at a senior level, including developing safety programs, conducting hazard assessments, overseeing confined space entry programs, and ensuring compliance with the Occupational Health and Safety Act (OHSA) and its regulations. At this level, operators may serve as the designated safety officer or supervisor.",
    keyPoints: [
      {
        heading: "OHSA Supervisor Responsibilities",
        body: "Under OHSA, supervisors must: ensure workers use required protective equipment; advise workers of known hazards; take every precaution reasonable in the circumstances for the protection of workers; and not direct workers to perform work in contravention of OHSA. Supervisors can be held personally liable for OHSA violations. Due diligence: supervisors must demonstrate they took all reasonable precautions to prevent workplace injuries. Incident reporting: critical injuries must be reported to MECP and MOH (for water quality incidents) and to the Ministry of Labour (for workplace injuries).",
      },
      {
        heading: "Confined Space Program Management",
        body: "Under O. Reg. 632/05 (Confined Spaces), employers must develop a written confined space program. Program elements: identification of all confined spaces; hazard assessment for each space; written entry procedures; atmospheric testing requirements; rescue plan (non-entry rescue preferred); training for all entrants, attendants, and rescue team members. Entry permit: must be completed before each entry — includes space identification, hazards, atmospheric test results, PPE required, rescue plan, and signatures. Atmospheric testing order: (1) O2 (19.5-23.0%); (2) combustible gases (< 10% LEL); (3) toxic gases (H2S < 10 ppm, CO < 25 ppm).",
      },
      {
        heading: "Lockout/Tagout (LOTO) Program",
        body: "Lockout/tagout (LOTO) prevents the unexpected energization of equipment during maintenance. O. Reg. 851 (Industrial Establishments) requires written LOTO procedures for all equipment. LOTO steps: (1) notify affected workers; (2) identify all energy sources (electrical, pneumatic, hydraulic, gravity, thermal); (3) shut down equipment; (4) isolate all energy sources; (5) apply personal locks; (6) release stored energy (bleed lines, block gravity loads); (7) verify zero energy state before work begins. Each worker must apply their own lock — never share locks. Tagout only (no lock) is only permitted when lockout is not physically possible.",
      },
      {
        heading: "Chemical Safety and Emergency Response",
        body: "Water treatment chemicals: chlorine gas (highly toxic, TLV-C = 1 ppm), sodium hypochlorite (corrosive, generates chlorine gas if acidified), ammonia (toxic, flammable), alum (corrosive), fluoride compounds (toxic). Chlorine gas emergency: evacuate, call 911, use SCBA for rescue — do NOT enter without SCBA. Secondary containment: all chemical storage areas must have containment for 110% of largest tank. SDS must be accessible in the workplace. Emergency shower and eyewash: within 10 seconds of chemical handling areas. Annual emergency response drills must include chemical spill scenarios.",
      },
    ],
    tableHeadings: ["Hazard", "Regulatory Reference", "Key Requirement"],
    tableRows: [
      ["Confined space entry", "O. Reg. 632/05", "Written program, entry permit, rescue team"],
      ["Lockout/tagout", "O. Reg. 851", "Written procedures, personal locks, verify zero energy"],
      ["Chlorine gas", "OHSA / WHMIS 2015", "SCBA required for entry, TLV-C = 1 ppm"],
      ["Chemical storage", "OHSA / Fire Code", "Secondary containment 110% of largest tank"],
      ["Critical injury", "OHSA Section 51", "Report to Ministry of Labour immediately"],
    ],
    examTips: [
      "Supervisors are personally liable under OHSA — due diligence is the defence",
      "LOTO: each worker applies their own lock — never share locks",
      "Confined space atmospheric testing order: O2 first, then LEL, then toxic gases (H2S, CO)",
      "Chlorine gas TLV-C = 1 ppm — SCBA required for any entry into chlorine gas atmosphere",
      "Secondary containment must hold 110% of the largest tank volume",
      "Critical injury reporting: notify Ministry of Labour immediately (OHSA Section 51)",
    ],
    formulaHint:
      "No primary calculation formulas — this module is regulatory and procedural. Know the OHSA requirements, confined space testing order, LOTO steps, and chemical safety thresholds.",
  },
};

// ─── Class 4 Wastewater Module Overviews ─────────────────────────────────────
export const CLASS4_WASTEWATER_OVERVIEWS: Record<string, ModuleOverview> = {
  "Treatment Process Monitoring": {
    title: "Treatment Process Monitoring",
    intro:
      "Class 4 Wastewater operators hold the highest certification level and are responsible for the overall operation, optimization, and regulatory compliance of large or complex wastewater treatment facilities. This includes advanced secondary treatment (activated sludge, MBR), tertiary treatment (filtration, UV disinfection), nutrient removal (BNR), and biosolids management. Class 4 operators must understand process control theory, effluent quality standards, and the regulatory framework under Ontario's Environmental Compliance Approvals (ECAs).",
    keyPoints: [
      {
        heading: "Activated Sludge Process Control",
        body: "The activated sludge process uses a mixed culture of microorganisms to biologically oxidize dissolved and suspended organic matter. Key process control parameters: mixed liquor suspended solids (MLSS) — typically 2,000-4,000 mg/L for conventional activated sludge; sludge retention time (SRT, also called mean cell residence time or MCRT) — typically 5-15 days for BOD removal, 10-20 days for nitrification; food-to-microorganism ratio (F/M) — typically 0.2-0.5 kg BOD/kg MLVSS/day. SRT = Mass of MLSS in aeration basin / Mass of MLSS wasted per day. Increasing SRT: improves nitrification, reduces sludge production, but increases aeration basin volume requirement.",
      },
      {
        heading: "Biological Nutrient Removal (BNR)",
        body: "BNR removes nitrogen and phosphorus biologically to meet stringent effluent limits. Biological nitrogen removal: nitrification (aerobic) + denitrification (anoxic). Nitrification: NH4+ → NO2- → NO3- (Nitrosomonas and Nitroba cter). Denitrification: NO3- → N2 (heterotrophic bacteria using carbon source). BNR configurations: Modified Ludzack-Ettinger (MLE) — anoxic zone before aerobic zone; Bardenpho (4 or 5 stage) — multiple anoxic/aerobic zones for enhanced N and P removal. Biological phosphorus removal (EBPR): anaerobic zone before aerobic zone — polyphosphate-accumulating organisms (PAOs) release P anaerobically and uptake P aerobically. Volatile fatty acids (VFAs) are required for EBPR — low VFA in influent may require supplemental carbon (acetate, methanol).",
      },
      {
        heading: "Membrane Bioreactor (MBR)",
        body: "MBR combines activated sludge with membrane filtration (MF or UF) for solids separation. Advantages: very high effluent quality (turbidity < 0.2 NTU, no Cryptosporidium/Giardia), smaller footprint, higher MLSS (8,000-15,000 mg/L), longer SRT. Membrane fouling: the primary operational challenge — caused by colloidal and soluble organic matter, scaling, and biofilm. Fouling control: coarse bubble aeration (scouring), regular chemical cleaning (citric acid for scaling, sodium hypochlorite for biofouling). Transmembrane pressure (TMP): monitored continuously — rising TMP indicates fouling. Maintenance cleaning: weekly; recovery cleaning: monthly or when TMP exceeds threshold.",
      },
      {
        heading: "Tertiary Treatment and Effluent Polishing",
        body: "Tertiary treatment removes residual suspended solids, nutrients, and pathogens after secondary treatment. Tertiary filtration: granular media filters or cloth disk filters — reduces TSS to < 5 mg/L. UV disinfection: provides pathogen inactivation without chemical residual — required for effluents discharged to sensitive receiving waters. UV dose: typically 40-100 mJ/cm2 for wastewater (higher than drinking water due to turbidity). Effluent limits (Ontario ECA): BOD5 < 25 mg/L; TSS < 25 mg/L; Total N < 10-15 mg/L (nutrient-sensitive areas); Total P < 0.5-1.0 mg/L (nutrient-sensitive areas). Phosphorus polishing: chemical precipitation with alum or ferric chloride after biological treatment.",
      },
    ],
    tableHeadings: ["Parameter", "Typical Range", "Significance"],
    tableRows: [
      ["MLSS", "2,000-4,000 mg/L (conventional)", "Too low = poor settling; too high = oxygen demand exceeds aeration capacity"],
      ["SRT (BOD removal)", "5-15 days", "Short SRT = young sludge, poor settling; long SRT = good nitrification"],
      ["SRT (nitrification)", "10-20 days (temperature dependent)", "Must exceed minimum SRT for Nitrosomonas growth"],
      ["F/M ratio", "0.2-0.5 kg BOD/kg MLVSS/day", "High F/M = young sludge, bulking risk; low F/M = old sludge, pinpoint floc"],
      ["MBR MLSS", "8,000-15,000 mg/L", "Higher MLSS possible due to membrane separation"],
    ],
    examTips: [
      "SRT = MLSS in basin (kg) / Wasting rate (kg/day) — the primary lever for process control",
      "Nitrification requires SRT > minimum (temperature-dependent) — cold temperatures require longer SRT",
      "EBPR requires anaerobic zone before aerobic zone and adequate VFAs",
      "MBR: rising TMP = fouling — schedule maintenance cleaning; do not wait for TMP to spike",
      "Tertiary UV dose for wastewater is higher than drinking water (40-100 mJ/cm2 vs 10-40 mJ/cm2)",
      "Effluent BOD5 and TSS limits: 25 mg/L each — know these standard ECA limits",
    ],
    formulaHint:
      "SRT (days) = MLSS in basin (kg) / Wasting rate (kg/day)\nF/M = BOD load (kg/day) / MLVSS in basin (kg)\nWasting rate (kg/day) = Waste flow (m3/day) x WAS concentration (mg/L) x 0.001",
  },
  "Laboratory Analysis & Interpretation": {
    title: "Laboratory Analysis & Interpretation",
    intro:
      "Class 4 Wastewater operators must oversee laboratory operations, ensure QA/QC, interpret complex analytical results, and ensure compliance with Ontario's sampling requirements under Environmental Compliance Approvals (ECAs). At this level, operators must understand method detection limits, chain of custody, statistical process control, and the significance of analytical results for process optimization and regulatory compliance.",
    keyPoints: [
      {
        heading: "Effluent Compliance Monitoring",
        body: "ECA effluent limits are typically expressed as: maximum concentration (e.g., BOD5 < 25 mg/L); loading limits (e.g., total phosphorus < X kg/day); and geometric mean for microbiological parameters (e.g., E. coli < 200 CFU/100 mL geometric mean). Sampling requirements: composite samples for BOD5, TSS, nutrients (24-hour flow-proportional composite preferred); grab samples for pH, dissolved oxygen, temperature, and microbiological parameters. Chain of custody: must be maintained from sample collection to analysis — any break in chain of custody invalidates the sample. Holding times: BOD5 = 48 hours (refrigerated); TSS = 7 days; ammonia = 28 days (acidified); total phosphorus = 28 days (acidified).",
      },
      {
        heading: "Settleability and Sludge Quality Tests",
        body: "Sludge volume index (SVI): SVI = (30-minute settled volume, mL/L) / MLSS (g/L) x 1000. Good settling: SVI < 120 mL/g. Bulking sludge: SVI > 150 mL/g — caused by filamentous organisms (Thiothrix, Type 021N, Microthrix). Foaming: caused by Microthrix parvicella or Nocardia — associated with high SRT and lipid-rich wastewater. Microscopic examination: identifies filamentous organisms, protozoa (indicator of process health), and floc structure. Diluted sludge volume index (DSVI): used when MLSS > 3,500 mg/L to avoid hindered settling effects on SVI measurement.",
      },
      {
        heading: "Nutrient Analysis",
        body: "Total Kjeldahl nitrogen (TKN): measures organic nitrogen + ammonia nitrogen — indicates nitrogen load to biological process. Ammonia (NH4-N): substrate for nitrification — monitor in aeration basin and effluent. Nitrate (NO3-N) and nitrite (NO2-N): products of nitrification; nitrate is substrate for denitrification. Total nitrogen (TN) = TKN + NO3-N + NO2-N. Total phosphorus (TP): measured by persulfate digestion + colorimetric analysis. Ortho-phosphate (PO4-P): soluble reactive phosphorus — indicates biological P removal performance. Alkalinity: consumed during nitrification (7.14 g alkalinity per g NH4-N oxidized) — monitor to prevent pH drop.",
      },
      {
        heading: "Biosolids Quality Testing",
        body: "Biosolids quality must meet Ontario Regulation 267/03 (Nutrient Management Act) or O. Reg. 170/09 for land application. Required analyses: total solids, volatile solids, pH, total metals (As, Cd, Co, Cr, Cu, Hg, Mo, Ni, Pb, Se, Zn), pathogens (fecal coliforms or Salmonella), and nutrients (N, P, K). Class A biosolids: fecal coliforms < 1,000 MPN/g TS (dry weight); Salmonella < 3 MPN/4g TS. Class B biosolids: fecal coliforms < 2,000,000 MPN/g TS. Vector attraction reduction: volatile solids reduction > 38%, or specific oxygen uptake rate (SOUR) < 1.5 mg O2/h/g TS.",
      },
    ],
    tableHeadings: ["Test", "Method", "Regulatory Significance"],
    tableRows: [
      ["BOD5", "Standard Methods 5210B", "Primary effluent compliance parameter"],
      ["TSS", "Standard Methods 2540D", "Primary effluent compliance parameter"],
      ["Total phosphorus", "Persulfate digestion + colorimetry", "Nutrient-sensitive receiving waters"],
      ["E. coli (effluent)", "Membrane filtration or Colilert", "Geometric mean < 200 CFU/100 mL"],
      ["SVI", "Settleability test (30 min)", "Process control — identifies bulking"],
      ["Fecal coliforms (biosolids)", "MPN or membrane filtration", "Class A or B biosolids classification"],
    ],
    examTips: [
      "SVI = (Settled volume mL/L) / MLSS (g/L) x 1000 — good settling < 120 mL/g",
      "SVI > 150 = bulking — identify filamentous organism by microscopy",
      "BOD5 holding time = 48 hours refrigerated — exceed = invalid sample",
      "Nitrification consumes alkalinity: 7.14 g alkalinity per g NH4-N oxidized",
      "Class A biosolids: fecal coliforms < 1,000 MPN/g TS (dry weight)",
      "TN = TKN + NO3-N + NO2-N — know the components of total nitrogen",
    ],
    formulaHint:
      "SVI (mL/g) = Settled Volume (mL/L) / MLSS (g/L) x 1000\nAlkalinity consumed (mg/L) = NH4-N removed (mg/L) x 7.14\nTN (mg/L) = TKN + NO3-N + NO2-N",
  },
  "Equipment Operation & Maintenance": {
    title: "Equipment Operation & Maintenance",
    intro:
      "Class 4 Wastewater operators are responsible for the maintenance management of all plant equipment, including large centrifugal and submersible pumps, blowers, dewatering equipment, UV systems, and SCADA/instrumentation. At this level, operators develop and oversee preventive and predictive maintenance programs, evaluate equipment performance, and manage capital replacement planning.",
    keyPoints: [
      {
        heading: "Blower and Aeration System Management",
        body: "Aeration provides oxygen for biological treatment and mixing. Blower types: centrifugal (high flow, moderate pressure), positive displacement (lower flow, high pressure), turbo blowers (high efficiency, variable speed). Dissolved oxygen (DO) control: target 1.5-3.0 mg/L in aeration basin — too low causes poor nitrification and bulking; too high wastes energy. DO probes: calibrate regularly; membrane fouling reduces accuracy. Aeration efficiency: standard oxygen transfer efficiency (SOTE) — typically 10-25% for fine bubble diffusers. Energy: aeration accounts for 50-70% of plant energy consumption — VFD-controlled blowers with DO feedback control significantly reduce energy use.",
      },
      {
        heading: "Dewatering Equipment",
        body: "Dewatering reduces biosolids volume for disposal or land application. Common equipment: belt filter press (BFP), centrifuge, screw press. Belt filter press: polymer conditioning → gravity drainage → pressure rollers. Cake solids: 18-25% TS. Centrifuge: polymer conditioning → centrifugal separation. Cake solids: 20-30% TS. Polymer selection and dose: jar test or pilot testing — optimize for cake solids and centrate/filtrate quality. Polymer dose: typically 5-15 kg/tonne TS (dry weight). Centrate/filtrate quality: high ammonia and phosphorus — return to headworks; may require side-stream treatment for nutrient-sensitive plants.",
      },
      {
        heading: "UV Disinfection System Maintenance",
        body: "UV disinfection systems require regular maintenance to maintain effective dose delivery. Lamp aging: UV output decreases over time — lamps must be replaced when output falls below 70-80% of initial output (typically 8,000-12,000 hours). Sleeve fouling: quartz sleeves accumulate scale and biofilm — reduces UV transmittance. Cleaning: automatic mechanical wipers (continuous or periodic) plus periodic chemical cleaning (citric acid for calcium scale; sodium hypochlorite for biofilm). UV transmittance (UVT) monitoring: online UVT sensor monitors water quality — low UVT reduces effective dose. Validation: UV reactors must be validated per USEPA or NWRI guidelines to confirm dose delivery.",
      },
      {
        heading: "SCADA and Process Automation",
        body: "SCADA systems at Class 4 facilities typically include: PLCs for local control, HMI for operator interface, historian for data logging, and remote access for off-site monitoring. Process automation: automatic DO control (blower speed), automatic RAS/WAS control (SRT management), automatic chemical feed (polymer, coagulant, disinfectant). Alarm management: critical alarms (high effluent TSS, low DO, pump failure, UV system failure) must trigger immediate operator response. Cybersecurity: SCADA systems must be protected — network segmentation, access controls, regular patching. Data management: process data must be retained for regulatory reporting and process optimization.",
      },
    ],
    tableHeadings: ["Equipment", "Key Performance Indicator", "Action Threshold"],
    tableRows: [
      ["Aeration blower", "DO in aeration basin (mg/L)", "< 1.0 mg/L: increase aeration; > 3.0 mg/L: reduce (energy waste)"],
      ["Belt filter press", "Cake solids (%TS)", "< 18% TS: adjust polymer dose or belt speed"],
      ["Centrifuge", "Cake solids (%TS) and centrate TSS", "High centrate TSS: adjust polymer dose or bowl speed"],
      ["UV lamp", "UV output (% of initial)", "< 70-80%: replace lamp"],
      ["UV sleeve", "TMP across sleeve or UVT", "Declining UVT: schedule cleaning"],
    ],
    examTips: [
      "DO target in aeration basin: 1.5-3.0 mg/L — too low causes poor nitrification and bulking",
      "Aeration accounts for 50-70% of plant energy — VFD + DO control = major energy savings",
      "UV lamp replacement: when output falls below 70-80% of initial (typically 8,000-12,000 hours)",
      "Belt filter press cake solids: 18-25% TS; centrifuge: 20-30% TS",
      "Polymer dose: typically 5-15 kg/tonne TS — optimize by jar test",
      "Centrate/filtrate: high ammonia and phosphorus — return to headworks carefully",
    ],
    formulaHint:
      "DO deficit = DO_saturation - DO_actual\nPolymer dose (kg/day) = Dose (kg/tonne TS) x Sludge flow (m3/day) x TS concentration (g/L) / 1000\nSludge production (kg TS/day) = Flow (m3/day) x TSS removed (mg/L) x 0.001",
  },
  "Activated Sludge": {
    title: "Activated Sludge",
    intro:
      "The activated sludge process is the most widely used biological wastewater treatment technology. Class 4 operators must understand the microbiology, process control, troubleshooting, and optimization of activated sludge systems, including conventional, extended aeration, step-feed, and sequencing batch reactor (SBR) configurations.",
    keyPoints: [
      {
        heading: "Process Microbiology and Kinetics",
        body: "Activated sludge relies on a diverse community of heterotrophic bacteria to oxidize BOD, autotrophic nitrifiers (Nitrosomonas, Nitrobacter) for nitrification, and facultative bacteria for denitrification. Monod kinetics describe microbial growth: mu = mu_max x S / (Ks + S), where mu is specific growth rate, S is substrate concentration, and Ks is the half-saturation constant. At low substrate concentrations (S << Ks), growth is first-order in S. At high substrate concentrations (S >> Ks), growth approaches mu_max. Yield coefficient (Y): mass of VSS produced per mass of BOD removed — typically 0.4-0.8 g VSS/g BOD. Endogenous decay (b): loss of active biomass — typically 0.05-0.15 day-1.",
      },
      {
        heading: "Process Control and SRT Management",
        body: "SRT is the primary control variable for activated sludge. Increasing SRT: improves nitrification, reduces sludge production, increases MLSS, improves effluent quality. Decreasing SRT: increases sludge production, reduces MLSS, may impair nitrification. Minimum SRT for nitrification: temperature-dependent — approximately 3-5 days at 20 degrees C, 8-12 days at 10 degrees C. Safety factor: operate at 2-3x minimum SRT to provide buffer against upsets. Wasting: waste activated sludge (WAS) from return activated sludge (RAS) line or directly from aeration basin (hydraulic wasting). Constant SRT control: waste a fixed mass of MLSS per day regardless of MLSS concentration.",
      },
      {
        heading: "Bulking and Foaming Troubleshooting",
        body: "Filamentous bulking: excessive growth of filamentous organisms causes poor settling (SVI > 150 mL/g). Common filaments and causes: Thiothrix/Type 021N — low DO or high sulfide; Microthrix parvicella — low temperature, high lipids, long SRT; Type 0041/0675 — low F/M, long SRT; Sphaerotilus natans — low DO, high BOD load. Control: selector (anoxic or anaerobic contact zone before aeration), reduce SRT, increase DO, chlorinate RAS (emergency measure). Viscous bulking (non-filamentous): caused by excessive EPS production — associated with high carbohydrate wastewater. Foaming: Microthrix parvicella or Nocardia — spray water on foam, reduce SRT, chlorinate foam.",
      },
      {
        heading: "Sequencing Batch Reactor (SBR)",
        body: "SBR operates in batch mode: Fill → React → Settle → Decant → Idle. Advantages: single basin performs all functions, flexible for nutrient removal, good settling (no return sludge pumping). Disadvantages: requires equalization for continuous flow, complex control, decanter design critical. SBR process control: react phase duration controls treatment; settle phase duration controls effluent quality; decant volume controls HRT. Nutrient removal in SBR: anoxic fill (denitrification), aerobic react (nitrification), anaerobic phase (EBPR). SBR is well-suited for small to medium plants and intermittent flows.",
      },
    ],
    tableHeadings: ["Filamentous Organism", "Cause", "Control Strategy"],
    tableRows: [
      ["Thiothrix / Type 021N", "Low DO, high sulfide, high BOD/N ratio", "Increase DO, add nitrogen, aerobic selector"],
      ["Microthrix parvicella", "Low temperature, high lipids, long SRT", "Reduce SRT, chlorinate RAS, reduce lipid load"],
      ["Type 0041 / 0675", "Low F/M, long SRT, nutrient deficiency", "Reduce SRT, add nutrients"],
      ["Sphaerotilus natans", "Low DO, high soluble BOD", "Increase DO, reduce BOD load"],
      ["Nocardia / Microthrix (foaming)", "Long SRT, hydrophobic organisms", "Reduce SRT, spray water, chlorinate foam"],
    ],
    examTips: [
      "Minimum SRT for nitrification at 10 degrees C: 8-12 days — cold weather requires longer SRT",
      "SVI > 150 = bulking — identify filament by microscopy to determine cause",
      "Thiothrix = low DO; Microthrix = low temperature + high lipids; Type 0041 = low F/M",
      "Selector (anoxic contact zone) is the preferred long-term bulking control strategy",
      "SBR phases: Fill → React → Settle → Decant → Idle — know the sequence",
      "Y (yield) = 0.4-0.8 g VSS/g BOD; b (decay) = 0.05-0.15 day-1 — used in sludge production calculations",
    ],
    formulaHint:
      "SRT (days) = MLVSS in basin (kg) / Net VSS wasted per day (kg/day)\nNet sludge production = Y x BOD removed - b x MLVSS x Volume\nMinimum SRT (nitrification) = 1 / (mu_max_nitrifier - b_nitrifier)",
  },
  "Advanced Treatment Process Monitoring": {
    title: "Advanced Treatment Process Monitoring",
    intro:
      "Advanced treatment processes at Class 4 facilities include biological nutrient removal (BNR), chemical phosphorus removal, tertiary filtration, UV disinfection, and emerging technologies such as membrane bioreactors (MBR) and anaerobic digestion with biogas recovery. Monitoring and optimization of these processes requires a deep understanding of process chemistry, microbiology, and instrumentation.",
    keyPoints: [
      {
        heading: "Biological Nitrogen Removal Monitoring",
        body: "Nitrification monitoring: ammonia in aeration basin effluent (target < 1-2 mg/L NH4-N for full nitrification); nitrate in aeration basin effluent; alkalinity (must remain > 50 mg/L as CaCO3 to prevent pH drop). Denitrification monitoring: nitrate in anoxic zone effluent; internal recycle ratio (typically 2-4x influent flow for MLE process); carbon source availability (BOD:TN ratio > 4:1 for complete denitrification). Nitrous oxide (N2O): a potent greenhouse gas produced during incomplete nitrification/denitrification — minimize by maintaining adequate DO in aerobic zones and adequate carbon in anoxic zones.",
      },
      {
        heading: "Biological Phosphorus Removal (EBPR) Monitoring",
        body: "EBPR monitoring: ortho-phosphate in anaerobic zone (should increase as PAOs release P); ortho-phosphate in aerobic zone (should decrease as PAOs uptake P); VFA in anaerobic zone (> 25-50 mg/L as acetate required for good EBPR). Signs of EBPR failure: rising effluent TP, decreasing ortho-P release in anaerobic zone, declining P content in biosolids. Causes of EBPR failure: insufficient VFAs, nitrate in anaerobic zone (competes with PAOs), high SRT (reduces P content in sludge), temperature < 10 degrees C. Chemical backup: ferric chloride or alum addition to polish effluent TP when EBPR is insufficient.",
      },
      {
        heading: "Anaerobic Digestion Monitoring",
        body: "Anaerobic digestion stabilizes biosolids and produces biogas (60-70% methane). Key monitoring parameters: volatile solids reduction (VSR) — target > 40% for Class B biosolids; biogas production (0.5-1.0 m3/kg VS destroyed); methane content (60-70%); pH (6.8-7.4); alkalinity (> 1,500 mg/L as CaCO3); volatile fatty acids (VFA) — VFA:alkalinity ratio < 0.3 indicates stable digestion. Digester upset: high VFA, low pH, low biogas production, high H2S. Recovery: reduce feed rate, add alkalinity (lime, sodium bicarbonate), increase HRT. Biogas utilization: combined heat and power (CHP) — generates electricity and heat for plant use.",
      },
      {
        heading: "Tertiary Filtration and UV Monitoring",
        body: "Tertiary filtration: effluent TSS target < 5 mg/L; turbidity < 2 NTU before UV. Filter backwash: triggered by head loss (> 2-3 m) or turbidity breakthrough. Backwash sequence: air scour → water backwash → rinse. UV disinfection: online UVT monitoring; UV intensity sensors in each reactor; dose pacing based on flow and UVT. Effluent E. coli: geometric mean < 200 CFU/100 mL (Ontario ECA typical limit). UV system alarms: low UV intensity, lamp failure, sleeve fouling, low UVT. Effluent compliance: continuous monitoring of key parameters with data logged to SCADA for regulatory reporting.",
      },
    ],
    tableHeadings: ["Process", "Key Monitoring Parameter", "Target/Threshold"],
    tableRows: [
      ["Nitrification", "Effluent NH4-N", "< 1-2 mg/L for full nitrification"],
      ["Denitrification", "Effluent NO3-N", "< 3-5 mg/L for enhanced N removal"],
      ["EBPR", "Effluent ortho-phosphate", "< 0.5 mg/L (with chemical polishing)"],
      ["Anaerobic digestion", "VFA:Alkalinity ratio", "< 0.3 for stable digestion"],
      ["Tertiary filtration", "Effluent turbidity", "< 2 NTU before UV"],
      ["UV disinfection", "Effluent E. coli", "Geometric mean < 200 CFU/100 mL"],
    ],
    examTips: [
      "Nitrification alkalinity consumption: 7.14 g alkalinity per g NH4-N — monitor to prevent pH drop",
      "EBPR requires VFA > 25-50 mg/L in anaerobic zone — low VFA = EBPR failure",
      "Nitrate in anaerobic zone inhibits EBPR — control internal recycle to prevent NO3 carryover",
      "Anaerobic digestion upset: high VFA, low pH — reduce feed, add alkalinity",
      "VFA:Alkalinity < 0.3 = stable digestion; > 0.4 = potential upset",
      "UV effluent E. coli: geometric mean < 200 CFU/100 mL — geometric mean, not arithmetic",
    ],
    formulaHint:
      "Alkalinity consumed (mg/L as CaCO3) = NH4-N oxidized (mg/L) x 7.14\nVFA:Alkalinity ratio = VFA (mg/L as acetate) / Alkalinity (mg/L as CaCO3)\nVSR (%) = (VS in - VS out) / VS in x 100",
  },
  "Nutrient Removal": {
    title: "Nutrient Removal",
    intro:
      "Nutrient removal (nitrogen and phosphorus) is required at Class 4 facilities discharging to nutrient-sensitive receiving waters such as the Great Lakes. Ontario's Nutrient Management Act and ECA conditions set stringent effluent limits. Class 4 operators must understand both biological and chemical nutrient removal processes, their interactions, and optimization strategies.",
    keyPoints: [
      {
        heading: "Nitrogen Removal Chemistry and Stoichiometry",
        body: "Nitrification (two-step): (1) Nitrosomonas: NH4+ + 1.5 O2 → NO2- + H2O + 2H+ (consumes 3.43 g O2/g NH4-N); (2) Nitrobacter: NO2- + 0.5 O2 → NO3- (consumes 1.14 g O2/g NO2-N). Total oxygen demand for nitrification: 4.57 g O2/g NH4-N oxidized. Alkalinity consumed: 7.14 g CaCO3/g NH4-N. Denitrification: NO3- + carbon source → N2 + CO2 + H2O. Oxygen recovered: 2.86 g O2/g NO3-N (reduces aeration demand). Carbon requirement: 4-6 g BOD/g NO3-N for complete denitrification. Effluent TN target: < 10 mg/L (nutrient-sensitive areas); < 15 mg/L (standard).",
      },
      {
        heading: "Phosphorus Removal",
        body: "Biological phosphorus removal (EBPR): PAOs accumulate polyphosphate in aerobic conditions after being stressed in anaerobic conditions. P content of PAO sludge: 5-8% TP/TS (vs. 1-2% for non-PAO sludge). Chemical phosphorus removal: alum (Al2(SO4)3) or ferric chloride (FeCl3) precipitate phosphate as AlPO4 or FePO4. Alum dose: 1 mole Al per mole P (theoretical); in practice, 1.5-3 moles Al/mole P due to competing reactions. Ferric chloride dose: 1 mole Fe per mole P (theoretical); in practice, 1.5-2.5 moles Fe/mole P. Chemical addition point: pre-precipitation (primary clarifier), co-precipitation (aeration basin), post-precipitation (tertiary). Effluent TP target: < 0.5-1.0 mg/L (nutrient-sensitive areas).",
      },
      {
        heading: "BNR Process Configurations",
        body: "Modified Ludzack-Ettinger (MLE): anoxic zone (denitrification) followed by aerobic zone (nitrification). Internal recycle (IR) from aerobic to anoxic zone. IR ratio: 2-4x influent flow. Effluent TN: 8-12 mg/L typical. 4-stage Bardenpho: anoxic → aerobic → anoxic → aerobic. Achieves TN < 5 mg/L. 5-stage Bardenpho: adds anaerobic zone for EBPR. University of Cape Town (UCT): anaerobic → anoxic → aerobic with separate recycles to prevent nitrate from entering anaerobic zone — better EBPR performance. Johannesburg (JHB) process: anoxic zone before anaerobic zone to strip nitrate from RAS before it enters anaerobic zone.",
      },
      {
        heading: "Side-Stream Nutrient Treatment",
        body: "Centrate and filtrate from dewatering operations are high in ammonia (500-1,500 mg/L) and phosphorus (50-200 mg/L) — returning to headworks increases nutrient load by 15-30%. Side-stream treatment options: struvite (magnesium ammonium phosphate, MgNH4PO4) precipitation — recovers P and N as slow-release fertilizer; SHARON/ANAMMOX — partial nitritation to nitrite followed by anaerobic ammonia oxidation to N2 — very low energy and no carbon required; steam stripping — removes ammonia by heating and air stripping. Struvite formation: Mg2+ + NH4+ + PO43- → MgNH4PO4·6H2O. Struvite control in pipes: add MgCl2 or reduce pH.",
      },
    ],
    tableHeadings: ["BNR Configuration", "Typical Effluent TN", "Typical Effluent TP"],
    tableRows: [
      ["MLE (Modified Ludzack-Ettinger)", "8-12 mg/L", "No biological P removal"],
      ["4-stage Bardenpho", "< 5 mg/L", "No biological P removal"],
      ["5-stage Bardenpho", "< 5 mg/L", "< 1 mg/L (with EBPR)"],
      ["UCT process", "8-12 mg/L", "< 1 mg/L (better EBPR than MLE)"],
      ["Chemical P removal (post-precipitation)", "N/A", "< 0.5 mg/L"],
    ],
    examTips: [
      "Nitrification oxygen demand: 4.57 g O2/g NH4-N; alkalinity consumed: 7.14 g CaCO3/g NH4-N",
      "Denitrification oxygen credit: 2.86 g O2/g NO3-N — reduces aeration energy demand",
      "MLE: IR ratio 2-4x influent flow; higher IR = lower effluent TN but more energy",
      "EBPR requires no nitrate in anaerobic zone — UCT and JHB processes address this",
      "Struvite = MgNH4PO4 — forms in pipes when Mg, NH4, and PO4 are present at high pH",
      "Side-stream treatment (ANAMMOX) can handle 15-30% of plant nitrogen load at very low energy",
    ],
    formulaHint:
      "O2 for nitrification = NH4-N removed (mg/L) x 4.57\nAlkalinity consumed = NH4-N removed (mg/L) x 7.14\nAlum dose (mg/L) = P to remove (mg/L) x 9.6 (for 1:1 molar ratio, MW Al = 27, P = 31)\nStruvite: Mg2+ + NH4+ + PO43- → MgNH4PO4·6H2O",
  },
  "Secondary Treatment": {
    title: "Secondary Treatment",
    intro:
      "Secondary treatment removes dissolved and colloidal organic matter (BOD) and suspended solids through biological processes. Class 4 operators must understand the full range of secondary treatment technologies including activated sludge variants, trickling filters, rotating biological contactors (RBCs), and moving bed biofilm reactors (MBBR), as well as secondary clarifier design and operation.",
    keyPoints: [
      {
        heading: "Secondary Clarifier Operation",
        body: "Secondary clarifiers (final clarifiers) separate biological solids from treated effluent. Key design parameters: surface overflow rate (SOR) — typically 15-25 m3/m2/day for conventional activated sludge; solids loading rate (SLR) — typically 100-150 kg TSS/m2/day. Sludge blanket: monitor depth — should be < 1/3 of clarifier depth. Return activated sludge (RAS): recycles settled sludge to aeration basin — maintains MLSS. RAS rate: typically 50-100% of influent flow. Waste activated sludge (WAS): removes excess sludge to maintain target SRT. Rising sludge: caused by denitrification in clarifier (N2 gas lifts sludge) — reduce SRT or increase RAS rate.",
      },
      {
        heading: "Trickling Filters and RBCs",
        body: "Trickling filters: wastewater is distributed over a bed of media (rock or plastic) where a biofilm grows. BOD removal: 60-85% for single-pass; > 90% for recirculation. Recirculation ratio: 1-4x influent flow — dilutes influent, improves distribution, prevents drying. Ponding: caused by excessive biofilm growth or media clogging — increase recirculation, reduce hydraulic loading. Rotating biological contactors (RBCs): discs rotate through wastewater and air — biofilm grows on disc surface. RBC staging: 3-4 stages for BOD removal; 4-6 stages for nitrification. RBC failure modes: excessive biofilm weight (structural failure), bearing failure, media cracking.",
      },
      {
        heading: "Moving Bed Biofilm Reactor (MBBR)",
        body: "MBBR uses plastic carriers (media) that move freely in the aeration basin — biofilm grows on carrier surface. Advantages: compact (high surface area per volume), no sludge recycle required (biofilm is self-regulating), easy to retrofit existing basins. Media fill fraction: typically 30-70% of basin volume. Carrier surface area: 200-1,200 m2/m3 depending on carrier type. BOD removal rate: 5-15 g BOD/m2/day (carrier surface area). MBBR + activated sludge = IFAS (integrated fixed-film activated sludge) — combines biofilm and suspended growth for enhanced capacity. Effluent quality: MBBR alone produces effluent with TSS 50-100 mg/L — requires clarification.",
      },
      {
        heading: "Lagoon Systems",
        body: "Lagoons (stabilization ponds) use natural processes (sunlight, wind, algae, bacteria) for treatment. Types: aerobic (shallow, < 0.5 m, algae-based); facultative (1-2 m, aerobic surface + anaerobic bottom); anaerobic (> 2 m, high BOD loads). HRT: aerobic = 3-30 days; facultative = 5-30 days; anaerobic = 5-50 days. Advantages: low cost, low energy, simple operation. Disadvantages: large land area, seasonal performance variation, algae in effluent. Odour control: maintain aerobic conditions in surface layer; avoid overloading anaerobic lagoons. Effluent quality: BOD 20-50 mg/L; TSS 20-60 mg/L (including algae).",
      },
    ],
    tableHeadings: ["Process", "BOD Removal", "Key Advantage"],
    tableRows: [
      ["Conventional activated sludge", "85-95%", "Flexible, well-understood, good control"],
      ["Extended aeration", "90-98%", "Low sludge production, simple operation"],
      ["Trickling filter (recirculation)", "> 90%", "Low energy, simple, no sludge recycle"],
      ["RBC", "85-95%", "Low energy, compact, staged treatment"],
      ["MBBR", "80-95%", "Compact, easy retrofit, no sludge recycle"],
      ["Facultative lagoon", "70-90%", "Very low cost, minimal operation"],
    ],
    examTips: [
      "Secondary clarifier SOR: 15-25 m3/m2/day; SLR: 100-150 kg TSS/m2/day",
      "Rising sludge in clarifier = denitrification (N2 gas) — reduce SRT or increase RAS",
      "Trickling filter ponding = biofilm overgrowth — increase recirculation or reduce loading",
      "MBBR media fill fraction: 30-70% of basin volume — do not overfill (restricts mixing)",
      "RAS rate: 50-100% of influent flow — adjust to maintain target MLSS and sludge blanket depth",
      "Lagoon effluent TSS includes algae — may need polishing for sensitive receiving waters",
    ],
    formulaHint:
      "SOR (m3/m2/day) = Flow (m3/day) / Clarifier area (m2)\nSLR (kg TSS/m2/day) = [Flow (m3/day) x MLSS (mg/L) x 0.001] / Clarifier area (m2)\nRAS ratio = RAS flow / Influent flow",
  },
  "Sludge Treatment": {
    title: "Sludge Treatment",
    intro:
      "Sludge (biosolids) treatment and management is a major operational and regulatory challenge at Class 4 wastewater facilities. Class 4 operators must understand the full biosolids treatment train: thickening, stabilization (anaerobic digestion, aerobic digestion, lime stabilization), dewatering, and final disposal or beneficial use under Ontario Regulation 267/03.",
    keyPoints: [
      {
        heading: "Sludge Thickening",
        body: "Thickening increases sludge solids concentration before stabilization to reduce digester volume and heating requirements. Gravity thickening: primary sludge thickens readily to 4-8% TS; secondary sludge thickens poorly (1-3% TS) due to biological floc. Dissolved air flotation (DAF) thickening: effective for secondary sludge — air bubbles attach to solids and float them to surface. Cake solids: 3-6% TS. Gravity belt thickener (GBT): polymer conditioning + gravity drainage on moving belt — 4-8% TS. Rotary drum thickener (RDT): polymer conditioning + drum rotation — 4-8% TS. Thickening reduces volume by 3-5x — significant reduction in digester and dewatering equipment size.",
      },
      {
        heading: "Anaerobic Digestion",
        body: "Anaerobic digestion stabilizes sludge, reduces pathogens, and produces biogas. Four stages: hydrolysis → acidogenesis → acetogenesis → methanogenesis. Rate-limiting step: hydrolysis (for complex substrates) or methanogenesis (for simple substrates). Mesophilic digestion: 35-37 degrees C, HRT 20-30 days. Thermophilic digestion: 50-55 degrees C, HRT 10-15 days — faster, better pathogen reduction, but less stable. Volatile solids reduction (VSR): 40-60% typical. Biogas production: 0.5-1.0 m3/kg VS destroyed; 60-70% methane. Specific energy: 1 m3 methane = 35.8 MJ = 9.95 kWh. Digester heating: biogas used to heat digester and plant — energy self-sufficiency possible at large plants.",
      },
      {
        heading: "Aerobic Digestion",
        body: "Aerobic digestion stabilizes sludge by extended aeration — microorganisms oxidize their own cell mass (endogenous respiration). Conventional aerobic digestion: 15-30 days HRT at 20 degrees C; VSR 35-45%. Autothermal thermophilic aerobic digestion (ATAD): insulated reactor, no external heating — temperature rises to 55-65 degrees C due to exothermic oxidation. ATAD achieves Class A biosolids (pathogen reduction). Aerobic digestion produces no biogas — energy-intensive (aeration required). Suitable for small plants where anaerobic digestion is not economical. Effluent (supernatant/reject water): high in ammonia — return to headworks carefully.",
      },
      {
        heading: "Biosolids Land Application",
        body: "Ontario Regulation 267/03 (Nutrient Management Act) regulates biosolids land application. Categories: Class A (exceptional quality) — unrestricted use; Class B — restricted use (setbacks, site restrictions, injection or incorporation required). Class A requirements: fecal coliforms < 1,000 MPN/g TS; Salmonella < 3 MPN/4g TS; vector attraction reduction. Class B requirements: fecal coliforms < 2,000,000 MPN/g TS; site restrictions apply. Nutrient management plan (NMP): required for all land application sites — documents agronomic rates, setbacks, and record-keeping. Metals limits: must not exceed cumulative loading limits for As, Cd, Co, Cr, Cu, Hg, Mo, Ni, Pb, Se, Zn.",
      },
    ],
    tableHeadings: ["Process", "VSR", "Biogas", "Class A/B"],
    tableRows: [
      ["Mesophilic anaerobic digestion", "40-60%", "0.5-1.0 m3/kg VS", "Class B (with time/temp)"],
      ["Thermophilic anaerobic digestion", "45-65%", "0.5-1.0 m3/kg VS", "Class A (if criteria met)"],
      ["Conventional aerobic digestion", "35-45%", "None", "Class B"],
      ["ATAD (autothermal thermophilic)", "35-45%", "None", "Class A"],
      ["Lime stabilization", "Minimal VS reduction", "None", "Class B (pH > 12 for 2 h)"],
    ],
    examTips: [
      "Anaerobic digestion: mesophilic = 35-37 degrees C, 20-30 days HRT; thermophilic = 50-55 degrees C, 10-15 days",
      "Biogas: 60-70% methane; 0.5-1.0 m3/kg VS destroyed",
      "VFA:Alkalinity > 0.4 = digester upset risk — reduce feed, add alkalinity",
      "Class A biosolids: fecal coliforms < 1,000 MPN/g TS (dry weight)",
      "Class B biosolids: fecal coliforms < 2,000,000 MPN/g TS — site restrictions apply",
      "ATAD achieves Class A without external heating — temperature rises due to exothermic oxidation",
    ],
    formulaHint:
      "VSR (%) = (VS in - VS out) / VS in x 100\nBiogas production = 0.5-1.0 m3/kg VS destroyed\nHRT (days) = Digester volume (m3) / Feed rate (m3/day)\nSludge volume reduction = (1 - TS_in/TS_out) x 100%",
  },
  "Biosolids Management & Regulations": {
    title: "Biosolids Management & Regulations",
    intro:
      "Class 4 Wastewater operators must have comprehensive knowledge of Ontario's biosolids regulatory framework, including the Nutrient Management Act (NMA), O. Reg. 267/03, the Environmental Compliance Approval (ECA) process, and the requirements for biosolids quality, land application, and alternative disposal pathways.",
    keyPoints: [
      {
        heading: "Ontario Regulatory Framework for Biosolids",
        body: "Ontario Regulation 267/03 (under the Nutrient Management Act, 2002) is the primary regulation governing biosolids land application. Key requirements: biosolids must meet quality standards (metals, pathogens, vector attraction reduction) for the applicable category; land application must follow a Nutrient Management Plan (NMP) or Strategy; setbacks from water bodies, wells, and residences must be maintained; records must be kept for all applications. Environmental Compliance Approval (ECA): required for biosolids storage, treatment, and land application facilities. Ministry of the Environment, Conservation and Parks (MECP) issues ECAs and conducts inspections.",
      },
      {
        heading: "Biosolids Quality Categories",
        body: "Category 1 (exceptional quality, similar to US Class A): meets the most stringent pathogen and metals standards — can be used without site restrictions. Category 2 (similar to US Class B): meets less stringent standards — site restrictions, setbacks, and application timing restrictions apply. Category 3: lower quality — more restrictive application conditions. Metals limits: cumulative loading limits (kg/ha) for As, Cd, Co, Cr, Cu, Hg, Mo, Ni, Pb, Se, Zn — must not be exceeded over the life of the site. Annual loading limits also apply. Pathogen reduction: time-temperature requirements for thermophilic digestion; fecal coliform and Salmonella limits.",
      },
      {
        heading: "Nutrient Management Planning",
        body: "A Nutrient Management Plan (NMP) is required for all biosolids land application. NMP elements: site description and map; soil test results; crop nutrient requirements; application rates (agronomic rates based on crop N requirement); setbacks (from water bodies, wells, tile drains, residences); application timing (not on frozen or saturated ground); record-keeping requirements. Agronomic rate: the application rate that provides the crop's nutrient requirement without excess — prevents nutrient runoff and groundwater contamination. Phosphorus saturation: soils with high P saturation have increased P loss risk — may require reduced application rates.",
      },
      {
        heading: "Alternative Biosolids Management",
        body: "When land application is not feasible (high metals, insufficient land, public opposition), alternative management options include: incineration — reduces volume by 90%, destroys pathogens and organics, produces ash (must be managed as waste); co-composting with yard waste or wood chips — produces Class A compost product; co-digestion with food waste or fats/oils/grease (FOG) — increases biogas production; landfill disposal — last resort, regulated under O. Reg. 232/98; thermal hydrolysis (e.g., Cambi THP) — pre-treatment before anaerobic digestion to improve VSR and biogas production. Energy recovery: biogas from anaerobic digestion used for CHP — can offset 30-50% of plant energy use.",
      },
    ],
    tableHeadings: ["Biosolids Category", "Fecal Coliform Limit", "Application Restrictions"],
    tableRows: [
      ["Category 1 (exceptional quality)", "< 1,000 MPN/g TS", "None — unrestricted use"],
      ["Category 2", "< 2,000,000 MPN/g TS", "Site restrictions, setbacks, timing restrictions"],
      ["Category 3", "Higher limits", "Most restrictive conditions"],
    ],
    examTips: [
      "O. Reg. 267/03 governs biosolids land application in Ontario — know the key requirements",
      "Category 1 biosolids: fecal coliforms < 1,000 MPN/g TS — unrestricted use",
      "Category 2 biosolids: fecal coliforms < 2,000,000 MPN/g TS — site restrictions apply",
      "NMP must be based on agronomic rates — do not over-apply (nutrient runoff risk)",
      "Metals cumulative loading limits apply over the life of the site — track carefully",
      "Thermal hydrolysis (Cambi THP) improves VSR and biogas production before anaerobic digestion",
    ],
    formulaHint:
      "Agronomic rate (kg/ha) = Crop N requirement (kg/ha) / Biosolids N availability (fraction) / Biosolids N content (kg/tonne)\nAnnual metals loading (kg/ha) = Application rate (tonne/ha) x Metal concentration (mg/kg) / 1,000,000",
  },
  "Plant Management, Safety & Administration": {
    title: "Plant Management, Safety & Administration",
    intro:
      "Class 4 Wastewater operators are responsible for overall plant management, regulatory compliance, staff supervision, budget management, and safety program oversight. This includes the Environmental Compliance Approval (ECA), annual reporting requirements, and compliance with the Occupational Health and Safety Act (OHSA) and its regulations.",
    keyPoints: [
      {
        heading: "Environmental Compliance Approval (ECA)",
        body: "The ECA is issued by the MECP and sets out the conditions under which a wastewater treatment plant may operate. ECA conditions include: effluent limits (BOD5, TSS, TP, TN, E. coli, pH); monitoring and reporting requirements; operational requirements (minimum staffing, process controls); emergency response requirements; and record-keeping requirements. Operators must understand all ECA conditions and ensure the plant operates in compliance. Non-compliance: must be reported to the MECP in accordance with the ECA conditions — typically within 24 hours for acute exceedances. Annual report: submitted to MECP summarizing plant performance, compliance, and any incidents.",
      },
      {
        heading: "Regulatory Reporting",
        body: "Annual performance report: submitted to MECP by March 31 each year — summarizes effluent quality, compliance with ECA limits, biosolids production and management, and any incidents or non-compliance events. Discharge monitoring report (DMR): monthly or quarterly submission of effluent quality data. Spill reporting: any spill of sewage or chemicals must be reported to the MECP Spills Action Centre (1-800-268-6060) immediately. Biosolids application records: must be maintained for all land application events — site, date, volume, analysis results, and weather conditions. Records retention: typically 5-7 years for all operational and compliance records.",
      },
      {
        heading: "Confined Space and Safety Programs",
        body: "Wastewater treatment plants have numerous confined spaces: digesters, wet wells, manholes, clarifiers, and chemical storage tanks. O. Reg. 632/05 (Confined Spaces) requires a written confined space program with entry permits, atmospheric testing, and rescue procedures. Hydrogen sulfide (H2S): the primary toxic hazard in wastewater confined spaces — TLV-TWA = 1 ppm; TLV-C = 5 ppm; IDLH = 100 ppm. Methane (CH4): explosive hazard in digesters and wet wells — LEL = 5%, UEL = 15%. Atmospheric testing order: O2 (19.5-23.0%) → combustible gases (< 10% LEL) → H2S (< 10 ppm) → CO (< 25 ppm). Non-entry rescue is preferred — tripod and retrieval system.",
      },
      {
        heading: "Asset Management and Capital Planning",
        body: "Asset management at Class 4 facilities involves managing complex infrastructure with significant capital value. Key elements: asset inventory (all equipment, structures, and infrastructure); condition assessment (regular inspection and rating); criticality assessment (impact of failure on service and compliance); lifecycle cost analysis (capital, operating, and end-of-life costs); capital replacement plan (prioritized list of replacements with cost estimates and timelines). Ontario's Asset Management Planning for Municipal Infrastructure (O. Reg. 588/17) requires municipalities to develop and maintain asset management plans. Infrastructure Ontario provides guidance and funding programs for water and wastewater infrastructure renewal.",
      },
    ],
    tableHeadings: ["Regulatory Requirement", "Deadline/Frequency", "Regulatory Reference"],
    tableRows: [
      ["Annual performance report", "By March 31 each year", "ECA conditions / MECP"],
      ["Spill reporting", "Immediately", "MECP Spills Action Centre (1-800-268-6060)"],
      ["Non-compliance reporting", "Within 24 hours (acute)", "ECA conditions"],
      ["Biosolids application records", "Maintained for 5-7 years", "O. Reg. 267/03"],
      ["Asset management plan", "Per O. Reg. 588/17 schedule", "O. Reg. 588/17"],
    ],
    examTips: [
      "ECA annual performance report due March 31 — includes compliance summary and incidents",
      "Spill reporting: call MECP Spills Action Centre (1-800-268-6060) immediately",
      "H2S in wastewater confined spaces: TLV-TWA = 1 ppm; IDLH = 100 ppm",
      "Confined space atmospheric testing order: O2 → LEL → H2S → CO",
      "Non-entry rescue is preferred for confined spaces — tripod and retrieval system",
      "O. Reg. 588/17 requires municipalities to develop and maintain asset management plans",
    ],
    formulaHint:
      "No primary calculation formulas — this module is regulatory and management-focused. Know the ECA requirements, reporting timelines, H2S thresholds, and confined space protocols.",
  },
};

// ─── Water Quality Analyst (WQA) Module Overviews ────────────────────────────
export const WQA_OVERVIEWS: Record<string, ModuleOverview> = {
  "Bacteriological Testing": {
    title: "Bacteriological Testing",
    intro:
      "Bacteriological testing is the cornerstone of drinking water quality assurance. Water Quality Analysts must be proficient in standard methods for detecting indicator organisms (total coliform, E. coli, fecal coliform) and other pathogens, while maintaining rigorous QA/QC to ensure results are defensible for regulatory compliance under O. Reg. 170/03.",
    keyPoints: [
      {
        heading: "Indicator Organisms and Their Significance",
        body: "Total coliform: a group of gram-negative, facultatively anaerobic rod-shaped bacteria that ferment lactose — includes Escherichia, Klebsiella, Citrobacter, and Enterobacter. Total coliform is an indicator of treatment effectiveness and distribution system integrity, not necessarily of fecal contamination. E. coli: a subset of total coliform that is specific to fecal contamination — its presence in drinking water indicates a potential health risk and requires immediate action. Fecal coliform: a broader group that includes E. coli and other thermotolerant coliforms — less specific than E. coli. Heterotrophic plate count (HPC): measures total culturable bacteria — elevated HPC (> 500 CFU/mL) may indicate biofilm growth, stagnation, or inadequate disinfection.",
      },
      {
        heading: "Membrane Filtration (MF) Method",
        body: "The membrane filtration method (Standard Methods 9222) is the most common method for total coliform and E. coli in drinking water. Procedure: filter a known volume of sample through a 0.45 um membrane; place membrane on selective/differential media; incubate at 35 degrees C (total coliform) or 44.5 degrees C (fecal coliform/E. coli); count colonies. Media: m-Endo agar (total coliform — metallic sheen colonies); m-FC agar (fecal coliform — blue colonies at 44.5 degrees C); MI agar or Chromocult (E. coli — fluorescent or coloured colonies). Minimum sample volume: 100 mL for drinking water. Holding time: 6 hours (refrigerated, dark). Filtration must be performed within 6 hours of collection.",
      },
      {
        heading: "Presence-Absence (P-A) and Colilert Methods",
        body: "Presence-Absence (P-A) test (Standard Methods 9221E): 100 mL sample added to P-A broth; incubated at 35 degrees C for 48 hours; yellow = total coliform positive; fluorescence under UV = E. coli positive. Colilert (IDEXX): enzyme-based method using ONPG (beta-galactosidase for total coliform) and MUG (beta-glucuronidase for E. coli). Colilert-18: 18-hour incubation at 35 degrees C. Quanti-Tray/2000: quantitative MPN method using Colilert — 97 large wells + 48 small wells for MPN calculation. Colilert is approved under O. Reg. 170/03 for drinking water monitoring.",
      },
      {
        heading: "QA/QC for Bacteriological Testing",
        body: "Positive controls: known positive organism (e.g., E. coli ATCC 25922) — verify media and method performance. Negative controls: sterile water blank — detect contamination. Field blanks: sterile water processed in the field — detect sampling contamination. Duplicates: split sample analyzed in parallel — assess precision. Sterility checks: media sterility verified before use. Autoclave verification: biological indicators (Geobacillus stearothermophilus spores) verify sterilization. Chain of custody: sample ID, collection time, collector, preservation, and analysis time must be documented. Holding time violations: any sample analyzed outside holding time must be flagged and may not be used for regulatory compliance.",
      },
    ],
    tableHeadings: ["Organism", "Method", "Incubation", "Positive Result"],
    tableRows: [
      ["Total coliform", "MF on m-Endo agar", "35 degrees C, 24 h", "Metallic sheen colonies"],
      ["Fecal coliform", "MF on m-FC agar", "44.5 degrees C, 24 h", "Blue colonies"],
      ["E. coli (Colilert)", "Colilert/Quanti-Tray", "35 degrees C, 18-24 h", "Yellow + fluorescence under UV"],
      ["E. coli (MI agar)", "MF on MI agar", "35 degrees C, 24 h", "Blue/indigo colonies"],
      ["HPC", "Spread plate or pour plate", "35 degrees C, 48 h", "Count all colonies"],
    ],
    examTips: [
      "E. coli = fecal contamination indicator — any detection in drinking water = immediate action",
      "Total coliform holding time: 6 hours (refrigerated, dark) — exceed = invalid sample",
      "Colilert: yellow = total coliform; yellow + fluorescence under UV = E. coli",
      "MF method: 0.45 um membrane; m-Endo for total coliform (metallic sheen); m-FC for fecal coliform (blue)",
      "Positive control verifies media performance; negative control detects contamination",
      "HPC > 500 CFU/mL in distribution system may indicate biofilm or stagnation",
    ],
    formulaHint:
      "MPN (most probable number): use MPN tables based on number of positive tubes in multiple tube fermentation\nColilert Quanti-Tray MPN: read from IDEXX MPN table based on large and small well positives",
  },
  "Chemical Testing": {
    title: "Chemical Testing",
    intro:
      "Chemical testing encompasses the analysis of inorganic and organic parameters in drinking water and source water. Water Quality Analysts must understand analytical methods, instrument operation, calibration, QA/QC, and the regulatory significance of results under Ontario's Drinking Water Quality Standards (O. Reg. 169/03).",
    keyPoints: [
      {
        heading: "Inorganic Parameters",
        body: "Key inorganic parameters in drinking water: nitrate (MAC 10 mg/L as N), nitrite (MAC 1 mg/L as N), fluoride (MAC 1.5 mg/L), arsenic (MAC 0.010 mg/L), lead (MAC 0.010 mg/L), copper (MAC 1.0 mg/L), iron (AO 0.3 mg/L), manganese (MAC 0.12 mg/L), sodium (AO 200 mg/L), hardness (AO 80-100 mg/L as CaCO3 for corrosion control). Methods: ion chromatography (IC) for anions (nitrate, nitrite, fluoride, sulfate, chloride); ICP-MS or ICP-OES for metals (lead, arsenic, copper, iron, manganese); colorimetry for nitrate, nitrite, ammonia, phosphate. Sample preservation: metals — acidified to pH < 2 with HNO3, 6-month holding time; nitrate/nitrite — refrigerate, 48-hour holding time.",
      },
      {
        heading: "Organic Parameters and DBPs",
        body: "Trihalomethanes (THMs): chloroform, bromodichloromethane, dibromochloromethane, bromoform. Method: GC-ECD or GC-MS (purge-and-trap or liquid-liquid extraction). MAC: 100 ug/L total THMs (running annual average). Haloacetic acids (HAAs): monochloroacetic acid, dichloroacetic acid, trichloroacetic acid, monobromoacetic acid, dibromoacetic acid. Method: GC-ECD after liquid-liquid extraction and methylation. MAC: 80 ug/L total HAAs. Total organic carbon (TOC): measures all organic carbon in water — indicator of NOM and DBP precursor potential. Method: high-temperature combustion or UV/persulfate oxidation with infrared CO2 detection. Dissolved organic carbon (DOC): TOC of filtered (0.45 um) sample.",
      },
      {
        heading: "Instrument Calibration and Maintenance",
        body: "Calibration: all instruments must be calibrated before each use or per manufacturer/method requirements. Calibration curve: minimum 5 standards spanning the expected sample range, including a blank. R2 value: calibration curve linearity — must be > 0.995 for most methods. Calibration verification: check standard (mid-range) analyzed every 10-20 samples — must be within 10% of true value. Instrument maintenance: regular cleaning, lamp replacement (spectrophotometers), column replacement (GC, IC), detector maintenance. Spectrophotometer: wavelength calibration, stray light check, absorbance linearity verification. ICP-MS: daily tuning, internal standard monitoring, interference check solutions.",
      },
      {
        heading: "Method Detection Limit (MDL) and Reporting",
        body: "Method detection limit (MDL): the minimum concentration that can be detected with 99% confidence — determined by analyzing 7 replicates of a low-concentration standard and calculating MDL = t(n-1, 0.99) x standard deviation. Practical quantitation limit (PQL): typically 5-10x MDL — the concentration above which results can be reported with confidence. Reporting: results below MDL reported as < MDL (non-detect); results between MDL and PQL reported with qualifier. Significant figures: report results to the appropriate number of significant figures based on the method and instrument precision. Units: mg/L for most parameters; ug/L for trace metals and organics; ng/L for ultra-trace compounds.",
      },
    ],
    tableHeadings: ["Parameter", "Ontario MAC/AO", "Analytical Method"],
    tableRows: [
      ["Nitrate", "10 mg/L as N (MAC)", "Ion chromatography or colorimetry"],
      ["Lead", "0.010 mg/L (MAC)", "ICP-MS or graphite furnace AAS"],
      ["Arsenic", "0.010 mg/L (MAC)", "ICP-MS or hydride generation AAS"],
      ["Total THMs", "100 ug/L (MAC, running annual avg)", "GC-ECD or GC-MS"],
      ["Total HAAs", "80 ug/L (MAC, running annual avg)", "GC-ECD after extraction/methylation"],
      ["Fluoride", "1.5 mg/L (MAC)", "Ion-selective electrode or IC"],
    ],
    examTips: [
      "THM MAC = 100 ug/L; HAA MAC = 80 ug/L — both are running annual averages",
      "Lead MAC = 0.010 mg/L (10 ug/L) — first-draw samples after 6-hour stagnation",
      "Calibration curve R2 must be > 0.995 for most methods",
      "MDL = t(6, 0.99) x SD of 7 replicates — know the concept, not just the formula",
      "Metals preservation: acidify to pH < 2 with HNO3; 6-month holding time",
      "TOC = indicator of NOM and DBP precursor potential — monitor at intake",
    ],
    formulaHint:
      "MDL = t(n-1, 0.99) x SD (of 7 replicates of low-concentration standard)\nCalibration: y = mx + b; R2 must be > 0.995\nPercent recovery = (Measured concentration / True concentration) x 100%",
  },
  "Disinfection": {
    title: "Disinfection",
    intro:
      "Disinfection is the most critical step in drinking water treatment for protecting public health. Water Quality Analysts must understand the chemistry and kinetics of disinfection, CT calculations, disinfection by-product (DBP) formation, and the regulatory requirements under Ontario's Procedure for Disinfection of Drinking Water.",
    keyPoints: [
      {
        heading: "Disinfectant Chemistry",
        body: "Chlorine chemistry: Cl2 + H2O → HOCl + HCl. HOCl (hypochlorous acid) is the active disinfectant — 80-90x more effective than OCl- (hypochlorite ion). pH effect: at pH 7.5, approximately 50% HOCl / 50% OCl-; at pH 6, approximately 95% HOCl; at pH 8.5, approximately 10% HOCl. Free chlorine = HOCl + OCl-. Combined chlorine = chloramines (NH2Cl, NHCl2, NCl3). Chloramine formation: Cl2 + NH3 → NH2Cl (monochloramine) — requires Cl2:NH3-N mass ratio < 5:1. Chlorine demand = applied dose - residual. Chlorine decay: first-order decay in distribution system — affected by temperature, pH, NOM, and pipe material.",
      },
      {
        heading: "CT Calculations",
        body: "CT = Disinfectant Residual (mg/L) x Contact Time (minutes). T10 is used instead of theoretical HRT to account for short-circuiting: T10 = Baffling Factor x HRT. Baffling factors: unbaffled = 0.1, poor = 0.3, average = 0.5, superior = 0.7, perfect = 1.0. CT tables (Health Canada / USEPA) give CT required for specific log inactivation at given temperature and pH. Log inactivation achieved = CT_achieved / CT_per_log. Ontario requirements: Giardia — 3 log removal/inactivation; Cryptosporidium — 2 log (UV preferred); Viruses — 4 log. Chlorine is effective against Giardia and viruses but NOT Cryptosporidium at practical doses — UV or ozone required for Crypto.",
      },
      {
        heading: "Disinfection By-Products (DBPs)",
        body: "DBPs form when disinfectants react with natural organic matter (NOM). THM formation factors: higher NOM (TOC), higher chlorine dose, longer contact time, higher temperature, higher pH, presence of bromide. HAA formation: similar factors but HAAs are favoured at lower pH relative to THMs. DBP control: enhanced coagulation (reduces NOM before chlorination), chloramination (reduces THM/HAA formation in distribution system), GAC (removes NOM and DBP precursors), point-of-disinfection optimization (chlorinate after filtration, not before). Bromate: formed when ozone reacts with bromide — MAC 0.010 mg/L. Chlorite and chlorate: formed from chlorine dioxide — MAC 1.0 mg/L each.",
      },
      {
        heading: "Residual Monitoring and Compliance",
        body: "Continuous chlorine residual monitoring: required at the treatment plant and at distribution system sampling points under O. Reg. 170/03. Minimum residual in distribution system: 0.05 mg/L free chlorine (or equivalent combined chlorine). Maximum residual: 4.0 mg/L free chlorine (AO). Chlorine residual analyzers: amperometric (most accurate), colorimetric (DPD method — field use). DPD method: N,N-diethyl-p-phenylenediamine — DPD No. 1 for free chlorine; DPD No. 3 for total chlorine. Amperometric titration: most accurate method for free and combined chlorine — used for calibration of online analyzers.",
      },
    ],
    tableHeadings: ["Disinfectant", "Effective Against", "Key Limitation"],
    tableRows: [
      ["Free chlorine (HOCl)", "Bacteria, viruses, Giardia", "Ineffective against Cryptosporidium at practical doses"],
      ["Chloramines", "Bacteria (distribution residual)", "Poor disinfection power; nitrification risk"],
      ["UV (254 nm)", "Giardia, Cryptosporidium, bacteria", "No residual; turbidity reduces effectiveness"],
      ["Ozone", "All pathogens including Crypto", "Bromate formation; no residual"],
      ["Chlorine dioxide", "Bacteria, viruses, Giardia", "Chlorite/chlorate DBPs; limited use"],
    ],
    examTips: [
      "HOCl is 80-90x more effective than OCl- — pH control is critical for disinfection efficiency",
      "CT = Residual x T10 — always use T10, not HRT",
      "Chlorine does NOT inactivate Cryptosporidium at practical doses — UV or ozone required",
      "THM formation increases with: higher NOM, higher Cl2 dose, higher temperature, higher pH",
      "DPD No. 1 = free chlorine; DPD No. 3 = total chlorine",
      "Minimum distribution residual: 0.05 mg/L free chlorine — below this requires investigation",
    ],
    formulaHint:
      "CT (mg·min/L) = Residual (mg/L) x T10 (min)\nT10 = Baffling Factor x HRT\nChlorine demand = Applied dose - Residual\nHOCl fraction: at pH 7.5 ≈ 50%; at pH 6 ≈ 95%; at pH 8.5 ≈ 10%",
  },
  "Laboratory & Sampling": {
    title: "Laboratory & Sampling",
    intro:
      "Proper sampling and laboratory practices are fundamental to producing accurate, defensible analytical results. Water Quality Analysts must understand sampling protocols, sample preservation, chain of custody, laboratory safety, and QA/QC requirements for all types of water quality samples.",
    keyPoints: [
      {
        heading: "Sampling Protocols",
        body: "Representative sampling: the sample must accurately represent the water being tested — consider flow, stratification, and mixing. Grab samples: collected at a single point in time — appropriate for parameters that change rapidly (pH, DO, chlorine residual, temperature, microbiological). Composite samples: multiple grab samples combined over time or flow — appropriate for parameters that are relatively stable (BOD, TSS, nutrients). Flow-proportional composite: sample volume proportional to flow rate — most representative for variable flow conditions. Sample containers: specific containers required for each parameter (glass for organics, plastic for metals, sterile bottles for microbiological). Headspace: minimize for volatile parameters (THMs, VOCs); fill to top for microbiological samples.",
      },
      {
        heading: "Sample Preservation and Holding Times",
        body: "Preservation prevents chemical and biological changes between collection and analysis. Temperature: most samples refrigerated at 4 degrees C. Chemical preservation: acid (HNO3 or H2SO4) for metals and nutrients; sodium thiosulfate for chlorine residual quenching in microbiological samples; ascorbic acid for chlorine quenching in THM samples. Key holding times: microbiological (E. coli, total coliform) = 6 hours; BOD5 = 48 hours; TSS = 7 days; nitrate = 48 hours (refrigerated); metals = 6 months (acidified); THMs = 14 days (refrigerated, ascorbic acid); chlorine residual = analyze immediately. Samples outside holding time must be flagged and may not be used for regulatory compliance.",
      },
      {
        heading: "Chain of Custody (COC)",
        body: "Chain of custody documents the possession and handling of samples from collection to analysis. COC form must include: sample ID, collection location, date and time of collection, collector's name, preservation, parameters requested, and signatures at each transfer. Custody seals: tamper-evident seals on sample containers and coolers. Laboratory receipt: sample condition, temperature, and integrity checked on arrival. Any deviation from COC requirements must be documented and may invalidate the sample for regulatory purposes. Electronic COC (eCOC) systems are increasingly used for efficiency and traceability.",
      },
      {
        heading: "Laboratory Safety",
        body: "WHMIS 2015 (GHS): all hazardous chemicals must have Safety Data Sheets (SDS) accessible in the laboratory. Personal protective equipment (PPE): lab coat, safety glasses, chemical-resistant gloves for all chemical handling; face shield for corrosive chemicals; fume hood for volatile chemicals. Chemical storage: acids and bases stored separately; flammables in approved flammable storage cabinet; oxidizers stored away from organics. Waste disposal: chemical waste must be segregated and disposed of per MECP regulations — never pour chemicals down the drain without authorization. Emergency equipment: eyewash and safety shower within 10 seconds of chemical handling areas; fire extinguisher accessible.",
      },
    ],
    tableHeadings: ["Parameter", "Container", "Preservation", "Holding Time"],
    tableRows: [
      ["E. coli / total coliform", "Sterile plastic, 100 mL", "Na2S2O3 (dechlorination)", "6 hours (refrigerated)"],
      ["BOD5", "Glass, 300 mL", "Refrigerate at 4 degrees C", "48 hours"],
      ["Metals (dissolved)", "Plastic, 500 mL", "Acidify to pH < 2 (HNO3)", "6 months"],
      ["THMs", "Glass, 40 mL (no headspace)", "Ascorbic acid + refrigerate", "14 days"],
      ["Nitrate", "Plastic, 100 mL", "Refrigerate at 4 degrees C", "48 hours"],
      ["Chlorine residual", "Any", "Analyze immediately", "Immediately"],
    ],
    examTips: [
      "Microbiological samples: 6-hour holding time — most critical holding time to remember",
      "Metals: acidify to pH < 2 with HNO3; 6-month holding time",
      "THM samples: glass vials, no headspace, ascorbic acid to quench chlorine, 14-day holding time",
      "Grab samples for rapidly changing parameters (pH, DO, Cl2, microbiological)",
      "Composite samples for BOD, TSS, nutrients — flow-proportional is most representative",
      "Chain of custody must be unbroken from collection to analysis — any break = potential invalidation",
    ],
    formulaHint:
      "No primary calculation formulas — this module is procedural. Know the holding times, preservation methods, and COC requirements for each parameter type.",
  },
  "Math": {
    title: "Math",
    intro:
      "Water Quality Analysts must perform a range of calculations for data analysis, QA/QC, dilutions, concentration conversions, and statistical analysis. Accuracy in calculations is essential for regulatory compliance and process optimization.",
    keyPoints: [
      {
        heading: "Concentration Calculations and Dilutions",
        body: "Concentration units: mg/L = ppm (parts per million) for most water quality parameters; ug/L = ppb (parts per billion) for trace contaminants; ng/L = ppt (parts per trillion) for ultra-trace. Unit conversions: 1 mg/L = 1 g/m3 = 1 ppm (for water); 1 ug/L = 0.001 mg/L = 1 ppb. Dilution: C1V1 = C2V2 — used to prepare standards and dilute concentrated samples. Dilution factor (DF): DF = final volume / initial volume. Percent recovery: (measured concentration / true concentration) x 100% — target 80-120% for most methods. Relative percent difference (RPD): |C1 - C2| / average x 100% — measures precision of duplicates; target < 20% for most methods.",
      },
      {
        heading: "Statistical Analysis",
        body: "Mean (arithmetic average): sum of values / number of values. Geometric mean: nth root of the product of n values — used for E. coli and fecal coliform compliance (geometric mean < 200 CFU/100 mL). Standard deviation (SD): measure of variability — SD = sqrt[sum(xi - mean)^2 / (n-1)]. Coefficient of variation (CV): SD / mean x 100% — measure of relative variability. Control charts: plot results over time with warning limits (mean ± 2SD) and action limits (mean ± 3SD). Out-of-control: result outside action limits or 2 consecutive results outside warning limits — investigate and take corrective action. t-test: compare two means; F-test: compare two variances.",
      },
      {
        heading: "Flow and Volume Calculations",
        body: "Flow rate: Q = A x V (pipe flow); Q = Cd x A x sqrt(2gH) (orifice). Unit conversions: 1 m3/s = 1,000 L/s = 86,400 m3/day; 1 MLD = 1,000,000 L/day = 11.57 L/s. Mass loading: Load (kg/day) = Concentration (mg/L) x Flow (m3/day) x 0.001. Detention time: HRT = Volume / Flow. Filter loading rate: Q / filter area (m/h). Surface overflow rate: Q / clarifier area (m3/m2/day). Weir overflow rate: Q / weir length (m3/m/day). Chemical feed rate: Feed (kg/day) = Dose (mg/L) x Flow (m3/day) x 0.001.",
      },
      {
        heading: "Calibration and QC Calculations",
        body: "Calibration curve: y = mx + b (linear regression). R2 (coefficient of determination): measures linearity — must be > 0.995 for most methods. Slope and intercept: used to calculate concentration from instrument response. Calibration verification: check standard result must be within 10% of true value. MDL calculation: MDL = t(6, 0.99) x SD (of 7 replicates) — t value for 6 degrees of freedom at 99% confidence = 3.143. Blank correction: subtract blank response from sample response before calculating concentration. Matrix spike recovery: (spiked result - unspiked result) / spike added x 100% — target 80-120%.",
      },
    ],
    tableHeadings: ["Calculation", "Formula", "Acceptable Range"],
    tableRows: [
      ["Percent recovery (spike)", "(Measured - Unspiked) / Spike x 100%", "80-120%"],
      ["RPD (duplicates)", "|C1 - C2| / Average x 100%", "< 20% (most methods)"],
      ["Calibration linearity", "R2 of calibration curve", "> 0.995"],
      ["Calibration verification", "Check standard result vs. true value", "Within 10%"],
      ["Geometric mean (E. coli)", "nth root of product of n values", "< 200 CFU/100 mL"],
    ],
    examTips: [
      "C1V1 = C2V2 — the fundamental dilution formula; use for standards and sample dilutions",
      "Geometric mean for E. coli compliance — not arithmetic mean",
      "RPD < 20% for duplicates; percent recovery 80-120% for spikes",
      "R2 > 0.995 for calibration curve linearity",
      "Mass loading: Concentration (mg/L) x Flow (m3/day) x 0.001 = kg/day",
      "MDL = 3.143 x SD of 7 replicates (t value for 6 df at 99% confidence)",
    ],
    formulaHint:
      "C1V1 = C2V2 (dilution)\nLoad (kg/day) = Conc (mg/L) x Q (m3/day) x 0.001\nGeometric mean = (C1 x C2 x ... x Cn)^(1/n)\nMDL = 3.143 x SD (7 replicates)\nRPD = |C1 - C2| / [(C1+C2)/2] x 100%",
  },
  "Quality Assurance & Quality Control": {
    title: "Quality Assurance & Quality Control",
    intro:
      "Quality assurance (QA) and quality control (QC) are the systems and procedures that ensure analytical results are accurate, precise, and defensible. Water Quality Analysts must implement and document QA/QC for every analysis to meet ISO/IEC 17025 accreditation requirements and regulatory obligations.",
    keyPoints: [
      {
        heading: "QA vs. QC",
        body: "Quality assurance (QA): the overall system of planned activities designed to ensure that the laboratory produces reliable data. QA includes: method validation, staff training, equipment maintenance, proficiency testing, and management review. Quality control (QC): the specific measures applied to each batch of samples to detect and correct errors. QC includes: blanks, duplicates, spikes, standards, and control charts. QA is proactive (prevents errors); QC is reactive (detects errors). Both are required for ISO/IEC 17025 accreditation.",
      },
      {
        heading: "QC Samples",
        body: "Method blank: reagent water processed through the entire analytical method — detects contamination from reagents, glassware, or equipment. Field blank: reagent water taken to the field and processed like a sample — detects contamination during sampling and transport. Trip blank: reagent water that travels with samples but is not opened in the field — detects contamination from sample containers or transport. Equipment blank: reagent water used to rinse sampling equipment — detects cross-contamination between samples. Laboratory duplicate: split sample analyzed in parallel — measures precision (reproducibility). Matrix spike: known amount of analyte added to a sample — measures accuracy (recovery) in the sample matrix. Surrogate spike: known amount of a non-native compound added to organic samples — monitors extraction efficiency.",
      },
      {
        heading: "Control Charts",
        body: "Control charts track instrument and method performance over time. Types: Shewhart X-bar chart (mean), R chart (range), and S chart (standard deviation). Control limits: warning limits = mean ± 2SD; action limits = mean ± 3SD. Out-of-control rules (Nelson/Western Electric): 1 point outside action limits; 2 of 3 consecutive points outside warning limits; 4 of 5 consecutive points beyond 1SD; 8 consecutive points on one side of the mean. Out-of-control action: stop analysis, investigate cause, take corrective action, re-analyze affected samples. Control charts must be maintained for all QC samples (check standards, blanks, spikes).",
      },
      {
        heading: "Proficiency Testing and Accreditation",
        body: "Proficiency testing (PT): external evaluation of laboratory performance by analyzing blind samples from a PT provider. PT results: z-score = (laboratory result - assigned value) / standard deviation for proficiency. |z| < 2 = satisfactory; 2 < |z| < 3 = questionable; |z| > 3 = unsatisfactory. ISO/IEC 17025: the international standard for laboratory competence — required for accreditation in Ontario. CALA (Canadian Association for Laboratory Accreditation): accredits laboratories for specific methods and parameters. Accreditation scope: laboratories must only report results for parameters within their accreditation scope. Annual assessments: ISO/IEC 17025 requires regular internal audits and management reviews.",
      },
    ],
    tableHeadings: ["QC Sample", "Purpose", "Acceptable Criteria"],
    tableRows: [
      ["Method blank", "Detect reagent/equipment contamination", "< MDL"],
      ["Field blank", "Detect field contamination", "< MDL"],
      ["Laboratory duplicate", "Measure precision (reproducibility)", "RPD < 20% (most methods)"],
      ["Matrix spike", "Measure accuracy (recovery)", "80-120% recovery"],
      ["Check standard (CCV)", "Verify calibration stability", "Within 10% of true value"],
      ["Proficiency test (PT)", "External performance verification", "z-score |z| < 2"],
    ],
    examTips: [
      "Method blank = reagent contamination; field blank = sampling contamination; trip blank = transport contamination",
      "Duplicate RPD < 20%; spike recovery 80-120% — know both acceptance criteria",
      "Control chart action limit = mean ± 3SD; warning limit = mean ± 2SD",
      "z-score for PT: |z| < 2 = satisfactory; |z| > 3 = unsatisfactory",
      "ISO/IEC 17025 = accreditation standard for laboratories — required in Ontario",
      "Out-of-control: stop analysis, investigate, take corrective action before reporting results",
    ],
    formulaHint:
      "z-score = (Lab result - Assigned value) / SD for proficiency\nRPD = |C1 - C2| / [(C1+C2)/2] x 100%\nSpike recovery = (Spiked - Unspiked) / Spike added x 100%\nControl limits: UCL = mean + 3SD; LCL = mean - 3SD",
  },
  "Regulation": {
    title: "Regulation",
    intro:
      "Water Quality Analysts must have a thorough understanding of Ontario's drinking water regulatory framework, including the Safe Drinking Water Act (SDWA), O. Reg. 169/03 (Drinking Water Quality Standards), O. Reg. 170/03 (Drinking Water Systems), and the roles of the Ministry of the Environment, Conservation and Parks (MECP) and local Medical Officers of Health (MOH).",
    keyPoints: [
      {
        heading: "Ontario Drinking Water Quality Standards (O. Reg. 169/03)",
        body: "O. Reg. 169/03 establishes maximum acceptable concentrations (MACs) and aesthetic objectives (AOs) for drinking water parameters. MAC: a health-based limit — drinking water must not exceed the MAC. AO: a guideline based on aesthetic considerations (taste, odour, colour) — not a health-based limit but should be met where possible. Interim MACs (IMACs): provisional limits for parameters under review. Key MACs: E. coli = 0 CFU/100 mL; total coliform = 0 CFU/100 mL; turbidity = 1 NTU (filtered systems); total THMs = 100 ug/L; HAAs = 80 ug/L; nitrate = 10 mg/L as N; lead = 0.010 mg/L; arsenic = 0.010 mg/L.",
      },
      {
        heading: "O. Reg. 170/03 Operational Requirements",
        body: "O. Reg. 170/03 sets out operational requirements for municipal drinking water systems. Key requirements: minimum sampling frequencies for all parameters; continuous monitoring of turbidity and chlorine residual; adverse result reporting to MOH and MECP; public notification requirements; record-keeping (minimum 5 years for most records); annual summary report (by February 28). Adverse result: any result exceeding a MAC or indicating a health risk. Notification timeline: E. coli or total coliform detection — notify MOH and MECP immediately; turbidity > 1 NTU — notify MECP immediately; any adverse result — notify within 24 hours if not already done.",
      },
      {
        heading: "Roles and Responsibilities",
        body: "MECP (Ministry of the Environment, Conservation and Parks): issues ECAs, sets standards, conducts inspections, receives adverse result reports, and enforces the SDWA. Medical Officer of Health (MOH): public health authority — notified of adverse results; issues Boil Water Advisories (BWAs) and Do Not Use Advisories; advises the public on health risks. Owner: the municipality or entity that owns the water system — responsible for overall compliance. Operating authority: the entity that operates the system — responsible for day-to-day compliance. Certified operator: must hold the appropriate class of certification for the system being operated. Water Quality Analyst: certified under O. Reg. 128/04 — responsible for sampling and analysis.",
      },
      {
        heading: "Drinking Water Quality Management Standard (DWQMS)",
        body: "DWQMS is Ontario's quality management system for municipal drinking water. Required elements: Operational Plan (documents all aspects of system operation); risk assessment; management review; internal audits; corrective actions; training records. Accreditation: third-party auditors verify compliance. Operating authorities must be accredited under DWQMS. The Operational Plan must be reviewed annually. Continuous improvement is a core requirement. DWQMS is based on ISO 9001 principles but is specific to drinking water.",
      },
    ],
    tableHeadings: ["Parameter", "MAC/AO", "Adverse Result Action"],
    tableRows: [
      ["E. coli", "0 CFU/100 mL (MAC)", "Notify MOH and MECP immediately; issue BWA"],
      ["Total coliform", "0 CFU/100 mL (MAC)", "Investigate, resample within 24 hours"],
      ["Turbidity (filtered)", "1 NTU (MAC)", "Notify MECP immediately; consider BWA"],
      ["Total THMs", "100 ug/L (MAC, running annual avg)", "Notify MECP; investigate source"],
      ["Nitrate", "10 mg/L as N (MAC)", "Notify MOH and MECP; issue advisory if needed"],
      ["Lead", "0.010 mg/L (MAC)", "Corrosion control required if > 10% of samples exceed"],
    ],
    examTips: [
      "E. coli MAC = 0 CFU/100 mL — any detection requires immediate notification of MOH and MECP",
      "Total coliform MAC = 0 CFU/100 mL — detection requires investigation and resampling within 24 h",
      "Turbidity MAC for filtered systems = 1 NTU — adverse result requires immediate MECP notification",
      "Annual summary report due February 28 — must be made available to the public",
      "DWQMS Operational Plan must be reviewed annually",
      "Water Quality Analyst certification: O. Reg. 128/04 — separate from operator certification",
    ],
    formulaHint:
      "No primary calculation formulas — this module is regulatory. Know the MACs, adverse result thresholds, notification timelines, and DWQMS requirements.",
  },
  "Safety": {
    title: "Safety",
    intro:
      "Laboratory safety is a critical responsibility for Water Quality Analysts. Working with hazardous chemicals, biological samples, and laboratory equipment requires knowledge of WHMIS 2015, proper PPE selection, chemical handling and storage, emergency procedures, and the Occupational Health and Safety Act (OHSA).",
    keyPoints: [
      {
        heading: "WHMIS 2015 (GHS)",
        body: "WHMIS 2015 aligns with the Globally Harmonized System (GHS) for classification and labelling of chemicals. Hazard classes: physical hazards (flammable, explosive, oxidizing, compressed gas, corrosive to metals); health hazards (acute toxicity, skin/eye corrosion, respiratory sensitization, carcinogenicity, reproductive toxicity); environmental hazards. Labels: must include product identifier, hazard pictograms, signal word (Danger or Warning), hazard statements, precautionary statements, and supplier information. Safety Data Sheets (SDS): 16-section format — Section 2 (hazard identification), Section 8 (exposure controls/PPE), Section 13 (disposal). SDS must be accessible to all workers in the workplace.",
      },
      {
        heading: "Chemical Hazards in Water Quality Laboratories",
        body: "Common laboratory hazards: concentrated acids (H2SO4, HNO3, HCl) — corrosive, oxidizing; concentrated bases (NaOH, KOH) — corrosive; organic solvents (methylene chloride, hexane, acetone) — flammable, toxic, carcinogenic; mercury compounds (mercuric sulfate in COD reagents) — highly toxic, bioaccumulative; sodium azide (preservative in some reagents) — toxic, explosive when dry; chlorine gas — toxic, generated when hypochlorite contacts acid. PPE selection: chemical-resistant gloves (nitrile for most organics; neoprene or butyl for concentrated acids/bases); safety glasses or goggles; lab coat; face shield for splash hazards; fume hood for volatile chemicals.",
      },
      {
        heading: "Emergency Procedures",
        body: "Chemical spill: evacuate area if large spill; contain small spills with absorbent material; neutralize acids with sodium bicarbonate, bases with citric acid; dispose of waste per MECP regulations. Chemical splash to eyes: immediately flush with water for 15 minutes at eyewash station — do not rub eyes; seek medical attention. Chemical splash to skin: remove contaminated clothing; flush with water for 15 minutes; seek medical attention for corrosive chemicals. Fire: use appropriate extinguisher (Class A for ordinary combustibles; Class B for flammable liquids; Class C for electrical fires); evacuate if fire is not immediately controllable. First aid: know the location of first aid kit, eyewash, safety shower, and fire extinguisher.",
      },
      {
        heading: "Biological Safety",
        body: "Water quality laboratories handle samples that may contain pathogens (E. coli, Salmonella, Cryptosporidium, Giardia, Legionella). Biosafety level 2 (BSL-2): appropriate for most water quality samples — standard microbiological practices, lab coats, gloves, eye protection, biological safety cabinet for aerosol-generating procedures. Sharps safety: use puncture-resistant containers for needles and broken glass — never recap needles. Autoclave: used to sterilize biological waste before disposal — verify sterilization with biological indicators. Biohazard waste: must be segregated, autoclaved, and disposed of per MECP and Public Health regulations. Hand washing: wash hands after removing gloves and before leaving the laboratory.",
      },
    ],
    tableHeadings: ["Hazard", "PPE Required", "Emergency Response"],
    tableRows: [
      ["Concentrated acid (H2SO4, HNO3)", "Nitrile gloves, goggles, lab coat, face shield", "Flush 15 min water; neutralize with NaHCO3"],
      ["Concentrated base (NaOH)", "Nitrile gloves, goggles, lab coat", "Flush 15 min water; neutralize with citric acid"],
      ["Organic solvents (flammable)", "Nitrile gloves, safety glasses, fume hood", "Evacuate; use Class B extinguisher"],
      ["Mercury compounds", "Nitrile gloves, goggles, fume hood", "Specialized mercury spill kit; notify supervisor"],
      ["Biological samples (pathogens)", "Gloves, lab coat, eye protection", "Autoclave spills; wash hands; report exposure"],
    ],
    examTips: [
      "WHMIS 2015 = GHS alignment — 16-section SDS; hazard pictograms on labels",
      "Eye splash: flush 15 minutes at eyewash — do not rub eyes",
      "Sodium azide: toxic and explosive when dry — handle carefully, never acidify",
      "BSL-2 for water quality samples — standard practices plus biological safety cabinet for aerosols",
      "Autoclave verification: biological indicators (Geobacillus stearothermophilus spores)",
      "Class A fire extinguisher: ordinary combustibles; Class B: flammable liquids; Class C: electrical",
    ],
    formulaHint:
      "No primary calculation formulas — this module is procedural. Know the WHMIS 2015 requirements, PPE selection, emergency procedures, and biosafety practices.",
  },
  "Science": {
    title: "Science",
    intro:
      "Water Quality Analysts must understand the fundamental chemistry and microbiology underlying water quality analysis. This includes inorganic chemistry (pH, alkalinity, hardness, oxidation-reduction), organic chemistry (NOM, DBP precursors), and microbiology (pathogen characteristics, indicator organisms, treatment mechanisms).",
    keyPoints: [
      {
        heading: "pH, Alkalinity, and Hardness",
        body: "pH: measure of hydrogen ion activity — pH = -log[H+]. pH scale: 0-14; neutral = 7; acidic < 7; basic > 7. Buffer capacity: resistance to pH change — provided by carbonate/bicarbonate system in natural waters. Alkalinity: measure of water's capacity to neutralize acids — primarily due to bicarbonate (HCO3-), carbonate (CO32-), and hydroxide (OH-). Alkalinity (mg/L as CaCO3) = [HCO3-] x 50/61 + [CO32-] x 50/30 + [OH-] x 50/17. Hardness: caused by dissolved calcium and magnesium — total hardness (mg/L as CaCO3) = [Ca2+] x 2.5 + [Mg2+] x 4.1. Temporary hardness: due to bicarbonates — removed by boiling. Permanent hardness: due to sulfates and chlorides — requires chemical or ion exchange treatment.",
      },
      {
        heading: "Oxidation-Reduction (Redox) Chemistry",
        body: "Oxidation: loss of electrons (increase in oxidation state). Reduction: gain of electrons (decrease in oxidation state). Oxidizing agents: accept electrons — chlorine, ozone, permanganate, dissolved oxygen. Reducing agents: donate electrons — organic matter, Fe2+, Mn2+, H2S, NH3. Oxidation-reduction potential (ORP): measured in millivolts — positive ORP = oxidizing conditions; negative ORP = reducing conditions. Iron chemistry: Fe2+ (ferrous, soluble) → Fe3+ (ferric, insoluble) in the presence of oxygen. Manganese chemistry: Mn2+ (soluble) → MnO2 (insoluble) — requires higher ORP than iron. Sulfide chemistry: SO42- → H2S (reducing conditions) — causes odour and corrosion.",
      },
      {
        heading: "Natural Organic Matter (NOM)",
        body: "NOM is a complex mixture of organic compounds derived from decomposition of plant and animal material. Components: humic acids (large, aromatic, hydrophobic — major DBP precursor), fulvic acids (smaller, more hydrophilic), hydrophilic acids, and proteins. NOM measurement: TOC (total organic carbon), DOC (dissolved organic carbon), UV254 absorbance (indicator of aromatic NOM), SUVA (specific UV absorbance = UV254/DOC — indicator of humic content and DBP formation potential). SUVA > 4 L/mg/m: high humic content, high DBP formation potential — enhanced coagulation recommended. NOM removal: coagulation/flocculation (charge neutralization and sweep floc), GAC adsorption, nanofiltration.",
      },
      {
        heading: "Microbiology of Water Treatment",
        body: "Pathogens of concern in drinking water: bacteria (E. coli O157:H7, Salmonella, Campylobacter, Legionella), viruses (norovirus, rotavirus, hepatitis A, adenovirus), protozoa (Cryptosporidium parvum, Giardia lamblia). Cryptosporidium and Giardia: form oocysts/cysts that are resistant to chlorine — physical removal (filtration) and UV are primary control measures. Virus removal: requires high CT with chlorine or UV — viruses are smaller than bacteria and protozoa. Biofilm in distribution systems: attached microbial communities on pipe surfaces — source of coliform regrowth, taste/odour, and corrosion. Nitrification: Nitrosomonas and Nitrobacter oxidize ammonia released from chloramine decay — produces nitrite and nitrate in distribution system.",
      },
    ],
    tableHeadings: ["Parameter", "Formula/Relationship", "Significance"],
    tableRows: [
      ["pH", "pH = -log[H+]", "Controls disinfection efficiency, corrosion, precipitation"],
      ["Alkalinity", "Primarily HCO3- (bicarbonate)", "Buffer capacity; consumed by nitrification (7.14 g/g NH4-N)"],
      ["Total hardness", "[Ca2+] x 2.5 + [Mg2+] x 4.1 (as CaCO3)", "Scaling potential; corrosion control"],
      ["SUVA", "UV254 / DOC (L/mg/m)", "> 4 = high humic NOM, high DBP formation potential"],
      ["ORP", "Measured in mV", "Positive = oxidizing; negative = reducing conditions"],
    ],
    examTips: [
      "pH = -log[H+]; lower pH = more acidic = more HOCl (better disinfection)",
      "Alkalinity consumed by nitrification: 7.14 g CaCO3 per g NH4-N oxidized",
      "SUVA > 4 = high humic NOM = high DBP formation potential — enhanced coagulation recommended",
      "Cryptosporidium oocysts are chlorine-resistant — UV or ozone required for inactivation",
      "Biofilm in distribution systems: source of coliform regrowth and taste/odour",
      "Fe2+ (ferrous) is soluble; Fe3+ (ferric) is insoluble — oxidation required for iron removal",
    ],
    formulaHint:
      "pH = -log[H+]\nTotal hardness (mg/L as CaCO3) = [Ca2+] x 2.5 + [Mg2+] x 4.1\nSUVA (L/mg/m) = UV254 absorbance (m-1) / DOC (mg/L)\nAlkalinity consumed = NH4-N removed x 7.14",
  },
  "Water Characteristics": {
    title: "Water Characteristics",
    intro:
      "Understanding the physical, chemical, and biological characteristics of source water and treated water is fundamental to water quality analysis. Water Quality Analysts must be able to interpret water quality data, identify trends, and recognize conditions that may affect treatment performance or public health.",
    keyPoints: [
      {
        heading: "Physical Characteristics",
        body: "Turbidity: measure of water clarity — caused by suspended particles (clay, silt, algae, organic matter). Measured in NTU (nephelometric turbidity units). High turbidity: reduces disinfection effectiveness (particles shield pathogens from UV and chlorine); indicator of treatment problems; aesthetic concern. Temperature: affects disinfection kinetics (lower temperature = slower CT reactions), biological activity, dissolved oxygen, and chemical reaction rates. Colour: true colour (after filtration) vs. apparent colour (including suspended matter). True colour caused by dissolved NOM (humic/fulvic acids) — measured in TCU (true colour units). Taste and odour: caused by MIB, geosmin (algae), H2S (anaerobic conditions), chlorine compounds, and industrial contaminants.",
      },
      {
        heading: "Chemical Characteristics",
        body: "Dissolved oxygen (DO): indicator of aerobic conditions — DO < 4 mg/L may indicate organic pollution or algal respiration at night. DO saturation decreases with increasing temperature and altitude. Biochemical oxygen demand (BOD5): measure of biodegradable organic matter — 5-day test at 20 degrees C. Chemical oxygen demand (COD): measure of total oxidizable organic matter — faster than BOD5. BOD:COD ratio: high ratio (> 0.5) indicates readily biodegradable organic matter; low ratio (< 0.3) indicates refractory organics. Nutrients: nitrogen (TKN, NH4-N, NO3-N, NO2-N) and phosphorus (TP, ortho-P) — indicators of agricultural runoff, sewage contamination, and eutrophication potential.",
      },
      {
        heading: "Seasonal Variation in Source Water",
        body: "Spring runoff: high turbidity, high TOC, high coliform counts — peak treatment challenge. Summer: algal blooms (HABs), taste/odour (MIB, geosmin), elevated temperature, low DO at depth. Fall turnover: destratification of lakes — cold, oxygen-depleted bottom water mixes with surface water — may cause taste/odour, elevated iron/manganese, and elevated TOC. Winter: low temperature reduces disinfection efficiency and biological treatment rates — increase CT by increasing chlorine dose or contact time. Ice cover: reduces reaeration — may cause low DO in shallow lakes. Operators must anticipate seasonal changes and adjust treatment accordingly.",
      },
      {
        heading: "Groundwater Characteristics",
        body: "Groundwater is generally more stable than surface water but may have specific chemical characteristics depending on the aquifer geology. Hard water: high calcium and magnesium from limestone aquifers — scaling in pipes and water heaters. Iron and manganese: common in anaerobic groundwater — Fe2+ and Mn2+ are soluble; oxidation and filtration required for removal. Nitrates: from agricultural activities, septic systems — elevated in shallow, unconfined aquifers. Arsenic: naturally occurring in some aquifers — requires treatment (coagulation, adsorption, ion exchange). Radon: naturally occurring radioactive gas — dissolved in groundwater from uranium-bearing rock. Hardness, iron, and manganese are the most common groundwater treatment challenges in Ontario.",
      },
    ],
    tableHeadings: ["Parameter", "Typical Range (Drinking Water)", "Treatment Implication"],
    tableRows: [
      ["Turbidity", "< 1 NTU (treated)", "High turbidity shields pathogens; impairs UV disinfection"],
      ["Temperature", "4-25 degrees C (source water)", "Low temp reduces CT efficiency; affects biological treatment"],
      ["BOD5", "< 2 mg/L (treated)", "High BOD = high chlorine demand; potential for regrowth"],
      ["Dissolved oxygen", "> 6 mg/L (source water)", "Low DO = anaerobic conditions; iron/Mn/H2S release"],
      ["Iron (dissolved)", "< 0.3 mg/L (AO)", "Oxidation and filtration required; stains plumbing"],
      ["Manganese", "< 0.12 mg/L (MAC)", "Oxidation and filtration required; black deposits in pipes"],
    ],
    examTips: [
      "Turbidity > 1 NTU for filtered systems = adverse result — also impairs UV disinfection",
      "Spring runoff = highest turbidity and coliform risk — peak treatment challenge",
      "Fall turnover: cold, O2-depleted bottom water mixes with surface — taste/odour, Fe/Mn spike",
      "Low temperature reduces CT efficiency — increase chlorine dose or contact time in winter",
      "Groundwater: iron and manganese are most common treatment challenges in Ontario",
      "BOD:COD ratio > 0.5 = readily biodegradable; < 0.3 = refractory organics",
    ],
    formulaHint:
      "DO saturation decreases with temperature: at 20 degrees C = 9.1 mg/L; at 10 degrees C = 11.3 mg/L; at 0 degrees C = 14.6 mg/L\nBOD:COD ratio = BOD5 / COD\nCT required increases as temperature decreases — use CT tables at the appropriate temperature",
  },
};

// ─── WPI Class 1 Water Treatment — Module Overviews ────────────────────────
// Aligned with WPI Need-to-Know Criteria (Class I Water Treatment)
// Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), MWWA (MB)

export const WPI_CLASS1_WATER_OVERVIEWS: Record<string, ModuleOverview> = {
  "Treatment Process": {
    title: "Treatment Process",
    intro:
      "The Treatment Process module covers the fundamental unit operations used in a Class I water treatment plant: coagulation, flocculation, sedimentation, filtration, and disinfection. At this level, operators must understand the purpose of each process, the key control parameters, and how to recognize and respond to process upsets. WPI Class I exams place heavy emphasis on filter loading rates, CT calculations, and chemical dosing.",
    keyPoints: [
      {
        heading: "Coagulation & Flocculation",
        body: "Coagulation destabilizes colloidal particles by neutralizing their negative surface charge. Common coagulants include alum (Al₂(SO₄)₃·18H₂O) and ferric chloride (FeCl₃). Optimal coagulation occurs at a specific pH — alum works best at pH 6.5–7.5; ferric coagulants work over a wider range (pH 5–9). Jar testing is used to determine the optimal coagulant dose. Flocculation follows coagulation — gentle mixing (G value 10–75 s⁻¹) allows microflocs to collide and grow into settleable floc. Rapid mixing (G > 300 s⁻¹) disperses the coagulant; slow mixing builds floc.",
      },
      {
        heading: "Sedimentation",
        body: "Sedimentation (clarification) removes floc by gravity settling. The key design parameter is surface overflow rate (SOR), also called surface loading rate: SOR = Flow (m³/d) ÷ Surface Area (m²). Typical SOR for conventional clarifiers is 20–40 m³/m²/d. Weir overflow rate (WOR) = Flow ÷ Weir Length; typical WOR < 250 m³/m/d. Tube settlers and lamella plates increase effective settling area. Sludge blanket level must be monitored — if it rises too high, carryover occurs.",
      },
      {
        heading: "Filtration",
        body: "Rapid sand filtration removes residual floc and turbidity. Filter loading rate = Flow ÷ Filter Area; typical range 5–15 m³/m²/h (120–360 m³/m²/d). Headloss across the filter increases as it loads — backwash is triggered by headloss (typically 2–3 m), turbidity breakthrough, or time. Backwash rate must be sufficient to expand the bed 20–30% (typically 36–60 m³/m²/h). Dual-media filters (anthracite over sand) allow deeper penetration of solids and longer filter runs. Filter-to-waste (filter ripening) is used after backwash to prevent turbidity spikes.",
      },
      {
        heading: "Disinfection & CT Concept",
        body: "Disinfection inactivates pathogens using chlorine, chloramine, chlorine dioxide, ozone, or UV. The CT concept (CT = Concentration × Time) quantifies disinfection effectiveness. CT values are published by regulators for specific log inactivation of Giardia and Cryptosporidium at given temperatures and pH. Chlorine CT increases with higher pH and lower temperature. Free chlorine is more effective than combined chlorine (chloramines) for Giardia inactivation. Chloramines are used for distribution system residual to minimize DBP formation. The 4-log virus inactivation requirement is typically met at the treatment plant.",
      },
      {
        heading: "Chemical Feed & Dosing",
        body: "Chemical feed rate (kg/d) = Flow (m³/d) × Dose (mg/L) × 0.001. For liquid chemicals: Feed Rate (L/d) = [Flow (m³/d) × Dose (mg/L)] ÷ [Concentration (mg/L)]. Chlorine demand = chlorine applied − chlorine residual. Chlorine dose must satisfy demand plus maintain the required residual. Breakpoint chlorination destroys chloramines — the breakpoint occurs at approximately a 7.6:1 Cl₂:NH₃-N mass ratio. After the breakpoint, free chlorine residual forms.",
      },
    ],
    tableHeadings: ["Process", "Key Parameter", "Typical Range"],
    tableRows: [
      ["Coagulation (Alum)", "Optimal pH", "6.5 – 7.5"],
      ["Flocculation", "Velocity gradient (G)", "10 – 75 s⁻¹"],
      ["Sedimentation", "Surface overflow rate", "20 – 40 m³/m²/d"],
      ["Rapid sand filtration", "Loading rate", "5 – 15 m³/m²/h"],
      ["Filtration backwash", "Backwash rate", "36 – 60 m³/m²/h"],
      ["Chlorine residual (distribution)", "Free Cl₂ minimum", "≥ 0.2 mg/L (typical)"],
    ],
    examTips: [
      "Filter loading rate formula: Flow ÷ Filter Area — watch units (m³/d vs m³/h vs m³/m²/h)",
      "CT = Concentration (mg/L) × Contact Time (min) — higher CT = more inactivation",
      "Alum coagulation lowers pH — lime or soda ash may be needed to correct pH",
      "Breakpoint chlorination: the breakpoint is at ~7.6:1 Cl₂:NH₃-N ratio by mass",
      "Jar test determines optimal coagulant dose and pH — always performed before changing coagulant",
      "Surface overflow rate (SOR) is the primary design parameter for clarifiers — not depth",
      "Filter-to-waste prevents turbidity spikes from reaching the distribution system after backwash",
    ],
    formulaHint:
      "Filter Loading Rate = Flow ÷ Filter Area | SOR = Flow ÷ Clarifier Area | CT = C × T | Chemical Feed (kg/d) = Flow (m³/d) × Dose (mg/L) × 0.001",
  },

  "Equipment O&M": {
    title: "Equipment O&M",
    intro:
      "The Equipment O&M module covers the operation, maintenance, and troubleshooting of the mechanical and electrical equipment found in a Class I water treatment plant. This includes pumps, motors, chemical feed systems, instrumentation, and control systems. Operators must be able to identify common failure modes, perform routine maintenance, and understand the importance of preventive maintenance programs.",
    keyPoints: [
      {
        heading: "Pumps — Types and Operation",
        body: "Centrifugal pumps are the most common type in water treatment — they move water using a rotating impeller. Key parameters: flow rate (Q), total dynamic head (TDH), and efficiency. TDH = static head + friction losses + minor losses. Pump curves show the relationship between flow and head — the operating point is where the pump curve intersects the system curve. Cavitation occurs when suction pressure drops below vapour pressure — symptoms include noise, vibration, and impeller damage. Net positive suction head available (NPSHa) must exceed NPSHr to prevent cavitation.",
      },
      {
        heading: "Chemical Feed Systems",
        body: "Chemical feed systems include dry feeders (for powdered chemicals like lime) and liquid metering pumps (diaphragm or peristaltic). Calibration of chemical feed pumps is critical — calibration is performed by measuring actual output over a timed period and comparing to the set point. Chemical storage areas require secondary containment (100% of largest container volume). Safety data sheets (SDS) must be accessible for all chemicals. Chlorine gas systems require leak detection, scrubbers, and self-contained breathing apparatus (SCBA) nearby.",
      },
      {
        heading: "Instrumentation & Control",
        body: "Key instruments in a water plant include: turbidimeters (continuous monitoring of filter effluent), chlorine analyzers (amperometric or colorimetric), pH meters, flow meters (magnetic, Venturi, ultrasonic), and level sensors. Instruments require regular calibration against known standards. SCADA (Supervisory Control and Data Acquisition) systems allow remote monitoring and control. Alarms must be responded to promptly — operators must know which alarms are critical vs. advisory.",
      },
      {
        heading: "Preventive Maintenance",
        body: "A preventive maintenance (PM) program schedules routine inspections, lubrication, adjustments, and part replacements before failures occur. Maintenance records must be kept for all equipment. Packing glands on pumps require regular adjustment and replacement — excessive leakage wastes water; too tight causes overheating. Mechanical seals are preferred over packing for cleaner operation. Bearings require proper lubrication — over-lubrication is as harmful as under-lubrication. V-belt drives require proper tension — check with a tension gauge.",
      },
      {
        heading: "Electrical Safety",
        body: "Lockout/tagout (LOTO) procedures must be followed before working on any electrical equipment. All electrical work must comply with the applicable electrical code. Ground fault circuit interrupters (GFCIs) are required in wet areas. Motor overload protection prevents damage from excessive current draw. Variable frequency drives (VFDs) allow speed control of pump motors — they reduce energy consumption and water hammer. Three-phase power requires proper phase rotation for correct pump rotation.",
      },
    ],
    tableHeadings: ["Equipment", "Common Problem", "Likely Cause"],
    tableRows: [
      ["Centrifugal pump", "Cavitation (noise/vibration)", "Insufficient NPSHa, high suction lift"],
      ["Centrifugal pump", "Low flow/pressure", "Worn impeller, air in suction, closed valve"],
      ["Chemical metering pump", "Incorrect dose", "Needs recalibration, worn diaphragm"],
      ["Turbidimeter", "Erratic readings", "Dirty flow cell, air bubbles, needs calibration"],
      ["Chlorine analyzer", "Drift", "Reagent depletion, membrane fouling"],
      ["Motor", "Overheating", "Overload, poor ventilation, bearing failure"],
    ],
    examTips: [
      "NPSHa must always be greater than NPSHr to prevent cavitation",
      "Calibrate chemical feed pumps by measuring actual output — not just reading the dial",
      "LOTO must be completed before any maintenance on energized equipment",
      "Pump operating point = intersection of pump curve and system curve",
      "VFDs reduce energy use and eliminate water hammer — know their advantages",
      "Secondary containment for chemical storage = 100% of the largest container volume",
    ],
    formulaHint:
      "TDH = Static Head + Friction Losses | NPSHa = Atmospheric Pressure − Vapour Pressure − Friction Losses − Static Lift | Pump Power (kW) = (Q × TDH × ρg) ÷ Efficiency",
  },

  "Laboratory Analysis": {
    title: "Laboratory Analysis",
    intro:
      "The Laboratory Analysis module covers the routine and regulatory testing performed at a Class I water treatment plant. Operators must understand the purpose of each test, the correct sampling procedures, acceptable methods, and how to interpret results in the context of regulatory requirements. WPI Class I exams focus on microbiological testing, physical/chemical parameters, and QA/QC fundamentals.",
    keyPoints: [
      {
        heading: "Microbiological Testing",
        body: "Total coliform and E. coli are the primary indicators of microbiological water quality. The membrane filtration (MF) method and the presence-absence (P-A) test are common methods. Samples must be collected in sterile bottles with sodium thiosulfate (to neutralize residual chlorine). Samples must be kept at 4°C and analyzed within 6 hours for P-A tests or 24 hours for MF. A positive total coliform result triggers immediate repeat sampling and investigation. E. coli presence indicates fecal contamination — immediate notification of the regulatory authority is required.",
      },
      {
        heading: "Physical & Chemical Parameters",
        body: "Turbidity is measured in NTU (nephelometric turbidity units) using a nephelometer or turbidimeter. Filtered water turbidity must typically be ≤ 1 NTU (≤ 0.3 NTU for individual filters in some jurisdictions). pH is measured electrochemically using a pH meter with a glass electrode — calibrate with two buffer solutions bracketing the expected range. Chlorine residual is measured using the DPD colorimetric method or amperometric titration. Free chlorine is measured first; total chlorine includes combined chlorine (chloramines).",
      },
      {
        heading: "Sampling Procedures",
        body: "Representative sampling is critical — flush the tap for 2–3 minutes before collecting a sample (unless sampling for lead, which requires a first-draw sample). Avoid sampling from hose bibs or outdoor taps. Label all samples with date, time, location, and collector's name. Chain of custody documentation must accompany samples sent to an external laboratory. Composite samples are collected over time for average concentration; grab samples represent a single point in time.",
      },
      {
        heading: "QA/QC Fundamentals",
        body: "Quality assurance (QA) is the overall program; quality control (QC) is the specific procedures. Key QC measures: field blanks (detect contamination during sampling), duplicate samples (measure precision), and calibration checks. Precision is the reproducibility of results; accuracy is how close results are to the true value. Method detection limit (MDL) is the lowest concentration that can be reliably detected. Results below the MDL are reported as '<MDL' — they cannot be used quantitatively.",
      },
      {
        heading: "Regulatory Testing Requirements",
        body: "WPI-aligned regulations require minimum testing frequencies based on system size and source type. Microbiological samples are collected at a minimum frequency per population served. Turbidity monitoring is continuous for filtered systems. Chemical parameters (nitrate, fluoride, etc.) are tested on a scheduled basis. Operators must maintain records of all test results for a minimum period (typically 5–10 years). Results exceeding maximum acceptable concentrations (MACs) must be reported to the regulatory authority within specified timeframes.",
      },
    ],
    tableHeadings: ["Parameter", "Method", "Typical Limit"],
    tableRows: [
      ["Total coliform", "Membrane filtration / P-A test", "Absent in 100 mL (treated)"],
      ["E. coli", "Membrane filtration / P-A test", "Absent in 100 mL"],
      ["Turbidity (filtered)", "Nephelometry", "≤ 1 NTU (≤ 0.3 NTU individual filters)"],
      ["Free chlorine residual", "DPD colorimetric / amperometric", "≥ 0.2 mg/L (distribution)"],
      ["pH", "Electrometric (pH meter)", "6.5 – 8.5 (aesthetic)"],
      ["Nitrate", "Ion chromatography / colorimetric", "≤ 10 mg/L as N (MAC)"],
    ],
    examTips: [
      "Sodium thiosulfate in sample bottles neutralizes chlorine — critical for microbiological samples",
      "E. coli positive = fecal contamination — immediate regulatory notification required",
      "Turbidity samples for individual filters must be taken within 15 minutes of backwash completion",
      "DPD method: DPD #1 = free chlorine; DPD #3 = total chlorine; difference = combined chlorine",
      "Flush tap 2–3 minutes before sampling (except first-draw lead samples)",
      "MDL = minimum detectable concentration — results below MDL are reported as '<MDL'",
    ],
    formulaHint:
      "Free Cl₂ = DPD #1 reading | Combined Cl₂ = Total Cl₂ − Free Cl₂ | Chlorine Demand = Dose Applied − Residual Remaining",
  },

  "Source Water": {
    title: "Source Water",
    intro:
      "The Source Water module covers the characteristics of raw water sources (surface water and groundwater), the factors that affect source water quality, and the strategies used to protect and manage source water. At Class I level, operators must understand how source water quality affects treatment requirements and how to recognize and respond to changes in raw water quality.",
    keyPoints: [
      {
        heading: "Surface Water vs. Groundwater",
        body: "Surface water (rivers, lakes, reservoirs) is more susceptible to contamination from runoff, seasonal variation, and biological activity. It typically requires more treatment than groundwater. Groundwater is generally more stable in quality but may have elevated hardness, iron, manganese, or naturally occurring contaminants (arsenic, radon). Groundwater under the direct influence of surface water (GUDI) must be treated as surface water — indicators include rapid changes in turbidity, temperature, or coliform counts after rainfall events.",
      },
      {
        heading: "Raw Water Quality Parameters",
        body: "Key raw water parameters include: turbidity (measure of suspended solids), colour (true colour from dissolved organics, apparent colour from turbidity), pH, alkalinity (buffering capacity), hardness (Ca²⁺ and Mg²⁺), temperature (affects treatment efficiency and disinfection), and total organic carbon (TOC — precursor to disinfection byproducts). Seasonal variations are common — spring runoff increases turbidity and TOC; summer algal blooms cause taste/odour problems and can produce cyanotoxins.",
      },
      {
        heading: "Source Water Protection",
        body: "Source water protection (SWP) programs identify and manage threats to drinking water sources. Wellhead protection areas (WHPAs) are defined zones around groundwater wells where land use is restricted. Intake protection zones (IPZs) are defined around surface water intakes. Threats include agricultural runoff, septic systems, fuel storage, road salt, and industrial discharges. Operators must report any observed threats to the source water to the appropriate authority.",
      },
      {
        heading: "Algae & Taste/Odour",
        body: "Algal blooms in source water reservoirs can cause taste and odour problems, elevated TOC, and in the case of cyanobacteria (blue-green algae), can produce cyanotoxins (e.g., microcystin). Geosmin and 2-methylisoborneol (MIB) are the most common taste/odour compounds — produced by actinomycetes and cyanobacteria. Activated carbon (PAC or GAC) is the primary treatment for taste/odour. Operators should monitor algae counts and have an algal bloom response plan.",
      },
      {
        heading: "Watershed Management",
        body: "A watershed is the land area that drains to a water body. Operators should understand the activities in their watershed that could affect source water quality. Monitoring programs should include upstream sampling points to provide early warning of contamination events. Contingency plans must be in place for source water quality emergencies (spills, algal blooms, flooding). Communication with upstream land users, municipalities, and regulatory authorities is essential.",
      },
    ],
    tableHeadings: ["Source Type", "Typical Characteristics", "Primary Treatment Concerns"],
    tableRows: [
      ["Surface water (river)", "Variable turbidity, seasonal TOC", "Coagulation, filtration, DBP control"],
      ["Surface water (reservoir)", "Algae, stratification, taste/odour", "Algae management, taste/odour control"],
      ["Groundwater (confined)", "Stable, low turbidity, possible hardness/iron", "Softening, iron/manganese removal"],
      ["GUDI", "Responds to surface events", "Must treat as surface water"],
      ["Shallow groundwater", "Susceptible to agricultural runoff", "Nitrate, pesticide monitoring"],
    ],
    examTips: [
      "GUDI must be treated as surface water — key indicators are rapid turbidity/temperature changes after rain",
      "Geosmin and MIB cause earthy/musty taste and odour — treat with activated carbon (PAC)",
      "Spring runoff = high turbidity + high TOC — increase coagulant dose and monitor filter performance",
      "Alkalinity provides buffering capacity — low alkalinity water is more difficult to coagulate",
      "Cyanobacteria (blue-green algae) can produce toxins — do not use PAC alone; consult health authority",
      "Wellhead protection area (WHPA) restricts land use to protect groundwater quality",
    ],
    formulaHint:
      "Hardness (mg/L as CaCO₃) = [Ca²⁺ (mg/L) ÷ 40.1 + Mg²⁺ (mg/L) ÷ 24.3] × 50 | Alkalinity (mg/L as CaCO₃) = Titrant Volume (mL) × Normality × 50,000 ÷ Sample Volume (mL)",
  },

  "Safety & Admin": {
    title: "Safety & Admin",
    intro:
      "The Safety & Admin module covers the occupational health and safety requirements, regulatory compliance, record-keeping, and administrative responsibilities of a Class I water treatment operator. Operators must understand their legal obligations, the hazards present in a water treatment plant, and the emergency response procedures required by regulation.",
    keyPoints: [
      {
        heading: "Hazardous Materials & WHMIS",
        body: "The Workplace Hazardous Materials Information System (WHMIS) requires that all hazardous products be labelled and accompanied by a Safety Data Sheet (SDS). SDS documents contain 16 sections covering physical/chemical properties, health hazards, first aid, PPE requirements, and spill response. Operators must be trained on the hazards of all chemicals used in the plant. Common hazardous chemicals include chlorine gas, sodium hypochlorite, alum, ferric chloride, and caustic soda (NaOH). Chlorine gas is a severe respiratory hazard — SCBA required for any chlorine gas leak response.",
      },
      {
        heading: "Personal Protective Equipment (PPE)",
        body: "PPE selection must be based on the hazard. For chemical handling: chemical-resistant gloves, apron, face shield, and safety glasses. For confined space entry: supplied-air respirator or SCBA, safety harness, and retrieval line. For electrical work: insulated gloves and tools, arc flash protection. Hearing protection is required in areas with noise levels above 85 dB(A). PPE must be inspected before each use and replaced when damaged. Operators must be trained in the proper donning, doffing, and maintenance of PPE.",
      },
      {
        heading: "Confined Space Entry",
        body: "A confined space is a space large enough to enter and perform work, not designed for continuous occupancy, and with limited means of entry/exit. A permit-required confined space has actual or potential hazards (atmospheric, engulfment, entrapment). Entry requires: atmospheric testing (oxygen 19.5–23.5%, combustible gas <10% LEL, toxic gas below TLV), a written entry permit, an attendant outside the space, and rescue equipment. Never enter a confined space without testing the atmosphere — oxygen-deficient atmospheres are immediately dangerous to life and health (IDLH).",
      },
      {
        heading: "Record-Keeping & Reporting",
        body: "Operators must maintain accurate records of all operational data, test results, maintenance activities, and chemical usage. Log books must be completed at each shift. Regulatory reports must be submitted on schedule — typically monthly or quarterly. Adverse water quality events (positive E. coli, turbidity exceedances, loss of residual) must be reported to the regulatory authority within specified timeframes (often within 24 hours). Records must be retained for a minimum period (typically 5–10 years depending on the jurisdiction).",
      },
      {
        heading: "Emergency Response",
        body: "Every water system must have an Emergency Response Plan (ERP) that addresses loss of power, source water contamination, treatment failure, distribution system breaks, and natural disasters. Operators must know how to issue a Boil Water Advisory (BWA) — when to issue, how to notify the public, and when it can be lifted. Backup power (generators) must be tested regularly. Communication protocols must be established with the regulatory authority, public health unit, and media. Operators must participate in regular emergency drills.",
      },
    ],
    tableHeadings: ["Hazard", "Required PPE / Procedure", "Key Regulation"],
    tableRows: [
      ["Chlorine gas leak", "SCBA, evacuate area, notify supervisor", "WHMIS, OH&S Act"],
      ["Confined space entry", "Atmospheric test, permit, attendant, SCBA", "OH&S Confined Space Regs"],
      ["Chemical spill", "Appropriate PPE, contain, report, clean up per SDS", "WHMIS, environmental regs"],
      ["Electrical work", "LOTO, insulated PPE, arc flash protection", "Electrical Safety Code"],
      ["Positive E. coli result", "Repeat sample, notify authority, investigate", "Drinking Water Regulations"],
      ["Turbidity exceedance", "Notify authority within required timeframe, investigate", "Drinking Water Regulations"],
    ],
    examTips: [
      "WHMIS SDS has 16 sections — Section 8 = PPE; Section 6 = Accidental Release; Section 4 = First Aid",
      "Confined space atmosphere: O₂ 19.5–23.5%, combustible gas <10% LEL, toxic gas below TLV",
      "Boil Water Advisory: issued when E. coli detected, turbidity uncontrolled, or loss of disinfection",
      "LOTO must be completed before any maintenance on energized or pressurized equipment",
      "Chlorine gas is heavier than air — it collects in low-lying areas and confined spaces",
      "Adverse events must be reported to the regulatory authority — know the timeframes in your jurisdiction",
    ],
    formulaHint:
      "No primary formulas — focus on regulatory thresholds, reporting timeframes, and PPE selection criteria for each hazard type.",
  },
};
