// Echelon Process v2 — Wastewater Treatment Process Data
// Design: Professional SaaS — Clean Dark-Accent (Sora, blue/teal brand)
// Ontario wastewater treatment — Class I–IV systems per O. Reg. 129/04

export interface WastewaterStep {
  id: string;
  num: number;
  label: string;
  icon: string;
  color: string;
  bg: string;
  shortDesc: string;
  fullDesc: string;
  equipment: string;
  regulation: string;
  keyPoints: string[];
  waterQuality: Record<string, string>;
}

export const WW_STEPS: WastewaterStep[] = [
  {
    id: "screening",
    num: 1,
    label: "Screening & Grit Removal",
    icon: "🔩",
    color: "#7C3AED",
    bg: "#EDE9FE",
    shortDesc: "Solids and grit removed",
    fullDesc:
      "Raw wastewater (sewage) enters the plant through the headworks. Coarse bar screens remove large solids — rags, wipes, plastics — that would damage downstream equipment. Fine screens follow, then grit chambers slow the flow so sand, gravel, and coffee grounds settle out by gravity.",
    equipment: "Bar Screens, Fine Screens, Grit Chamber",
    regulation:
      "O. Reg. 129/04 governs sewage works classification and operator licensing. Headworks design, operation and waste disposal must follow the facility’s Environmental Compliance Approval (ECA), applicable waste requirements and operating procedures.",
    keyPoints: [
      "Bar screens: openings 6–150 mm; protect pumps and pipes",
      "Fine screens: 1–6 mm; remove smaller fibrous material",
      "Grit chambers sized for 2–5 min detention time at peak flow",
      "Grit removal prevents abrasion of pumps and accumulation in clarifiers",
    ],
    waterQuality: {
      BOD: "200–300 mg/L",
      TSS: "200–350 mg/L",
      Odour: "Strong H₂S",
      Appearance: "Dark grey/brown",
    },
  },
  {
    id: "primary",
    num: 2,
    label: "Primary Clarification",
    icon: "⬇️",
    color: "#B45309",
    bg: "#FEF3C7",
    shortDesc: "Settleable solids removed",
    fullDesc:
      "Screened wastewater flows slowly through large primary clarifiers (sedimentation tanks). Reduced velocity allows 50–70% of suspended solids and 25–40% of BOD to settle as primary sludge. Floating scum (grease, oils) is skimmed from the surface. Primary effluent flows to biological treatment.",
    equipment: "Primary Clarifier / Sedimentation Tank",
    regulation:
      "Primary clarifier performance depends on design, loading and wastewater characteristics. O. Reg. 129/04 does not prescribe a universal primary TSS removal percentage or a “Schedule 22” clarifier standard. Use the facility ECA and approved design criteria.",
    keyPoints: [
      "Detention time: 1.5–2.5 hours at average flow",
      "Surface overflow rate (SOR): 24–48 m³/m²/day",
      "Removes 50–70% TSS and 25–40% BOD",
      "Primary sludge pumped to sludge handling; scum to grease trap",
    ],
    waterQuality: {
      BOD: "120–200 mg/L",
      TSS: "80–150 mg/L",
      Odour: "Moderate",
      Appearance: "Cloudy grey",
    },
  },
  {
    id: "biological",
    num: 3,
    label: "Biological Treatment",
    icon: "🦠",
    color: "#059669",
    bg: "#D1FAE5",
    shortDesc: "Bacteria consume organics",
    fullDesc:
      "Microorganisms (bacteria) consume dissolved organic matter (BOD) in the wastewater. In activated sludge systems, air is continuously blown into aeration tanks to keep aerobic bacteria alive and mixed with the wastewater. The bacteria convert dissolved organics into new cell mass (biomass) and CO₂.",
    equipment: "Aeration Tank / Activated Sludge System",
    regulation:
      "The facility ECA sets applicable effluent limits, objectives and monitoring requirements, together with other applicable legislation. A plant’s Class I–IV classification does not by itself determine a BOD or TSS discharge limit.",
    keyPoints: [
      "Mixed Liquor Suspended Solids (MLSS): 2,000–4,000 mg/L",
      "Dissolved oxygen (DO) maintained at 1.5–2.5 mg/L",
      "Sludge Retention Time (SRT): 5–15 days for BOD removal",
      "Nitrification requires sufficient SRT for the temperature, oxygen and loading conditions",
    ],
    waterQuality: {
      BOD: "10–25 mg/L",
      TSS: "Still high (biomass)",
      DO: "1.5–2.5 mg/L",
      Appearance: "Brown frothy",
    },
  },
  {
    id: "secondary",
    num: 4,
    label: "Secondary Clarification",
    icon: "🌀",
    color: "#0369A1",
    bg: "#E0F2FE",
    shortDesc: "Biomass separated from effluent",
    fullDesc:
      "Mixed liquor from the aeration tank flows to secondary clarifiers (final clarifiers). Biological floc (biomass) settles under gravity. Clarified effluent overflows the weirs. Settled sludge (Return Activated Sludge — RAS) is pumped back to the aeration tank to maintain the microbial population; excess (Waste Activated Sludge — WAS) is removed for sludge processing.",
    equipment: "Secondary Clarifier / Final Clarifier",
    regulation:
      "Check the facility ECA for final effluent limits and monitoring requirements. Set sludge blanket checks using the operating procedures and process risk; O. Reg. 129/04 does not impose continuous blanket measurement on every clarifier.",
    keyPoints: [
      "Return Activated Sludge (RAS): 50–100% of influent flow",
      "Waste Activated Sludge (WAS) controls MLSS in aeration tank",
      "Sludge Volume Index (SVI) measures settleability — target <150 mL/g",
      "Effluent compliance: use the limits and averaging periods in the facility ECA",
    ],
    waterQuality: {
      BOD: "10–25 mg/L",
      TSS: "10–25 mg/L",
      DO: "Low",
      Appearance: "Slightly cloudy",
    },
  },
  {
    id: "nutrient",
    num: 5,
    label: "Nutrient Removal",
    icon: "⚗️",
    color: "#BE185D",
    bg: "#FCE7F3",
    shortDesc: "Nitrogen & phosphorus removed",
    fullDesc:
      "Nitrogen and phosphorus in effluent cause eutrophication (algal blooms) in receiving water bodies. Biological Nutrient Removal (BNR) uses alternating aerobic/anoxic/anaerobic zones to encourage specific bacteria to remove nitrogen (nitrification/denitrification) and phosphorus (Enhanced Biological Phosphorus Removal — EBPR). Chemical phosphorus removal uses alum or ferric chloride.",
    equipment: "BNR System / Chemical Phosphorus Removal",
    regulation:
      "Nutrient limits and monitoring requirements depend on the facility ECA and receiving environment. Do not substitute illustrative phosphorus or nitrogen concentrations for the limits, averaging periods and sampling requirements in that approval.",
    keyPoints: [
      "Nitrification: NH₄⁺ → NO₂⁻ → NO₃⁻ (aerobic, requires long SRT)",
      "Denitrification: NO₃⁻ → N₂ gas (anoxic, needs carbon source)",
      "EBPR: polyphosphate-accumulating organisms (PAOs) store phosphorus",
      "Chemical P removal: alum or FeCl₃ precipitates phosphate",
    ],
    waterQuality: {
      BOD: "<10 mg/L",
      "Total N": "5–15 mg/L",
      "Total P": "0.1–1.0 mg/L",
      Appearance: "Clear",
    },
  },
  {
    id: "disinfection",
    num: 6,
    label: "Disinfection",
    icon: "☀️",
    color: "#D97706",
    bg: "#FEF9C3",
    shortDesc: "Pathogens inactivated",
    fullDesc:
      "Treated effluent is disinfected before discharge to the receiving water body. UV disinfection is one treatment option — UV light damages pathogen DNA without adding chemicals. Chlorination followed by dechlorination is also used. The goal is to achieve the required log reduction of E. coli and other indicator organisms.",
    equipment: "UV Disinfection System / Chlorine Contact Chamber",
    regulation:
      "The facility ECA and applicable legislation determine disinfection performance, sampling and residual requirements. Select UV operating conditions from the validated system design and effluent characteristics; there is no universal 25 mJ/cm² minimum in O. Reg. 129/04.",
    keyPoints: [
      "UV dose: follow the validated system design and facility requirements",
      "UV transmittance (UVT) of effluent affects UV dose delivery",
      "Chlorination: validate contact time and residual control; meet applicable discharge requirements",
      "E. coli is the primary indicator organism for wastewater disinfection",
    ],
    waterQuality: {
      BOD: "<10 mg/L",
      TSS: "<10 mg/L",
      "E. coli": "≤200 CFU/100mL",
      Appearance: "Clear",
    },
  },
  {
    id: "sludge",
    num: 7,
    label: "Sludge Processing",
    icon: "♻️",
    color: "#374151",
    bg: "#F3F4F6",
    shortDesc: "Biosolids stabilised & reused",
    fullDesc:
      "Primary and secondary sludge are thickened, stabilised (digested), and dewatered to produce biosolids. Anaerobic digestion breaks down organic matter, produces biogas (methane) for energy recovery, and reduces pathogens. Dewatered biosolids (cake) can be land-applied as fertiliser if they meet Ontario's biosolids quality standards.",
    equipment: "Thickener, Anaerobic Digester, Belt Press / Centrifuge",
    regulation:
      "Ontario agricultural land application of sewage biosolids is governed by the Nutrient Management Act and O. Reg. 267/03 requirements for non-agricultural source materials (NASM), including applicable quality, planning and site restrictions. Digestion alone does not authorize land application.",
    keyPoints: [
      "Gravity thickening increases sludge solids from 0.5% to 3–6%",
      "Anaerobic digestion: 35°C mesophilic, 20–30 day SRT",
      "Biogas is ~65% methane — used for heat and power generation",
      "Dewatered cake: 15–25% dry solids; land-applied or landfilled",
    ],
    waterQuality: {
      "Solids Content": "15–25% DS",
      Pathogens: "Reduced",
      "Biogas Yield": "0.3–0.5 m³/kg VS",
      Appearance: "Dark brown cake",
    },
  },
];

export const WW_LABEL_INFO: Record<string, string> = {
  // Screening & Grit
  influent:    "Raw sewage arrives from the collection system. Flow rates vary dramatically — peak wet-weather flow can be 3–5× average dry-weather flow. Operators must manage this variability to protect downstream processes.",
  barscreen:   "Coarse bar screens (6–150 mm openings) remove rags, wipes, plastics, and other large solids. Mechanically cleaned screens rake solids off the bars continuously. Screenings are washed, compacted, and sent to landfill.",
  finescreen:  "Fine screens (1–6 mm) remove smaller fibrous material that passed the bar screen. Rotary drum or step screens are common. Protects pumps and prevents fibres from wrapping around mechanical equipment.",
  gritchamber: "Grit chambers are designed to settle dense inorganic particles (sand, gravel, eggshells) while keeping lighter organic solids in suspension. Aerated grit chambers use air to create a spiral flow pattern. Grit is washed and sent to landfill.",
  gritpump:    "Grit slurry is pumped from the chamber to a grit classifier/washer. The grit classifier separates grit from organic material, returning organics to the process and sending clean grit to a dumpster for disposal.",
  // Primary Clarifier
  inlet3:      "Screened and degritted wastewater enters the primary clarifier through a centre feed pipe or inlet baffle. Even distribution prevents short-circuiting and turbulence that would disturb settled sludge.",
  scum:        "Floating material (grease, oils, fats, plastics) is skimmed from the surface by a rotating scum skimmer. Scum is collected in a scum pit and pumped to the sludge handling system or grease trap.",
  scraper2:    "A slow-rotating mechanical scraper operated at its manufacturer-specified speed continuously moves settled primary sludge along the tank floor toward the sludge hopper. Primary sludge is dense, odorous, and contains 2–6% solids.",
  hopper2:     "Primary sludge accumulates here and is periodically pumped to the sludge thickening/digestion system. Pumping frequency is controlled to maintain consistent sludge quality and prevent septic conditions.",
  weir2:       "Primary effluent overflows these weirs into a collection launder. The weir loading rate affects effluent quality — overloaded weirs cause turbulence that carries solids over. Evaluate removal using measured influent and effluent TSS and the facility design criteria.",
  // Aeration Tank
  return:      "Return Activated Sludge (RAS) from the secondary clarifier is pumped back here to maintain the active microbial population (MLSS) in the aeration tank. RAS rate is typically 50–100% of influent flow.",
  aerator:     "Diffused air aerators (fine bubble or coarse bubble) provide oxygen to the aerobic bacteria and keep the mixed liquor in suspension. Fine bubble diffusers are more energy-efficient (higher oxygen transfer efficiency).",
  mlss:        "Mixed Liquor Suspended Solids (MLSS) measures total suspended solids in mixed liquor, including biomass and inert solids — typically 2,000–4,000 mg/L. MLSS is controlled by adjusting the Waste Activated Sludge (WAS) pumping rate.",
  blower:      "Blowers supply compressed air to the diffusers. Dissolved oxygen (DO) control systems automatically adjust blower output to maintain target DO of 1.5–2.5 mg/L. Energy-efficient variable-speed drives are standard practice.",
  do_sensor:   "Continuous DO monitoring is essential. Too low (<0.5 mg/L) causes filamentous bulking and poor settling. Too high (>4 mg/L) wastes energy. DO probes must be calibrated regularly and kept clean.",
  // Secondary Clarifier
  ras:         "Return Activated Sludge (RAS) is pumped from the sludge hopper back to the aeration tank inlet. RAS maintains the active microbial population. RAS concentration is typically 6,000–10,000 mg/L.",
  was:         "Waste Activated Sludge (WAS) is removed to control the MLSS concentration in the aeration tank. WAS rate determines the Sludge Retention Time (SRT). Increasing WAS reduces SRT and MLSS.",
  blanket:     "Monitor sludge blanket depth at the frequency established in the facility procedures. If the blanket rises too high, solids will carry over the effluent weir and violate TSS limits. Blanket depth is controlled by adjusting RAS and WAS rates.",
  effweir:     "Clarified secondary effluent overflows these weirs. Effluent quality here determines whether the plant meets its BOD and TSS permit limits. Use the facility ECA limits, sampling locations and averaging periods.",
  // Nutrient Removal
  anoxic:      "In the anoxic zone, dissolved oxygen is absent but nitrate (NO₃⁻) is present. Denitrifying bacteria use nitrate as an electron acceptor to oxidise organic carbon, converting nitrate to nitrogen gas (N₂) which escapes to the atmosphere.",
  aerobic:     "In the aerobic zone, nitrifying bacteria (Nitrosomonas, Nitrobacter) convert ammonia (NH₄⁺) to nitrite (NO₂⁻) then nitrate (NO₃⁻). This requires sufficient oxygen, alkalinity and sludge retention time for the operating temperature and loading.",
  anaerobic:   "In the anaerobic zone (no oxygen, no nitrate), Polyphosphate-Accumulating Organisms (PAOs) release stored phosphorus and take up volatile fatty acids (VFAs). This 'primes' them to take up large amounts of phosphorus in the aerobic zone.",
  chemfeed:    "Alum (aluminum sulphate) or ferric chloride is added to precipitate soluble phosphate as aluminum phosphate or ferric phosphate. Chemical P removal is reliable and can achieve very low effluent TP (<0.1 mg/L).",
  // Disinfection
  uvbank:      "UV lamp banks irradiate the effluent with ultraviolet light at 254 nm wavelength. UV light damages pathogen DNA, preventing reproduction. No chemical residual is produced — UV is ideal for discharge to sensitive receiving waters.",
  uvmonitor:   "UV intensity sensors measure intensity; dose assessment also depends on flow, UV transmittance and the validated system model. If UV transmittance (UVT) drops (due to turbidity or colour) or a lamp fails, the system alarms and operators must take corrective action.",
  chlorine2:   "Where chlorination is used, sodium hypochlorite is injected into the effluent contact chamber. Dechlorination with sodium bisulphite or sodium sulphite may be needed to meet residual limits and protect aquatic life.",
  ecoli:       "E. coli monitoring is required at the effluent discharge point. Samples are collected and analysed to verify compliance with permit limits. Use the organism, numerical limit, averaging period and sampling frequency specified for the facility.",
  // Sludge
  thickener:   "Gravity thickeners or dissolved air flotation (DAF) thickeners increase sludge solids concentration from 0.5–1% to 3–6% before digestion. Thickening reduces the volume of sludge to be digested, saving energy and digester capacity.",
  digester:    "Anaerobic digesters operate at 35°C (mesophilic) or 55°C (thermophilic). Bacteria break down organic matter over 20–30 days, producing biogas (60–70% methane) and stabilised biosolids. Mixing prevents stratification.",
  biogas:      "Biogas (methane + CO₂) is captured and used to heat the digesters and generate electricity via combined heat and power (CHP) units. A large plant can generate enough biogas to meet 30–50% of its energy needs.",
  dewatering:  "Belt filter presses, centrifuges, or screw presses remove water from digested sludge, producing a 'cake' with 15–25% dry solids. Polymer conditioning is added before dewatering to improve solids capture.",
  biosolids:   "Dewatered biosolids (cake) are tested for metals, pathogens, and nutrients. Agricultural application must meet applicable NASM quality, planning and site requirements; a treatment label alone does not authorize application.",
};

// Legal scope references; process ranges above are illustrative, not permit limits.
export const WW_GUIDANCE_REVIEWED = "2026-09-13";
export const WW_GUIDANCE_SOURCES = [
  { label: "Operator licensing and classification — O. Reg. 129/04", url: "https://www.ontario.ca/laws/regulation/040129" },
  { label: "Ontario design guidelines for sewage works", url: "https://www.ontario.ca/document/design-guidelines-sewage-works" },
  { label: "Nutrient management and NASM — O. Reg. 267/03", url: "https://www.ontario.ca/laws/regulation/030267" },
];
