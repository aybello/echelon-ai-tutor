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
