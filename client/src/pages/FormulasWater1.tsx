// Class 1 Water Treatment — Formula Sheet
// Covers: Water Sources & Quality, Coagulation/Flocculation, Sedimentation, Filtration,
//         Disinfection, Chemical Feed & Dosing, Iron & Manganese Removal, Water Quality & Regulations
// Design: Blue brand, mirrors FormulasWW1.tsx structure

import { useState } from "react";
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import SiteNav from "@/components/SiteNav";

// ── TYPES ────────────────────────────────────────────────────────────────────
interface Formula {
  name: string;
  formula: string;
  units?: string;
  variables?: { sym: string; desc: string }[];
  example?: { problem: string; solution: string; answer: string };
  tip?: string;
}
interface FormulaCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
  formulas: Formula[];
}

// ── FORMULA DATA ─────────────────────────────────────────────────────────────
const CATEGORIES: FormulaCategory[] = [
  {
    id: "water-sources-quality",
    label: "Water Sources & Quality",
    icon: "🌊",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    formulas: [
      {
        name: "Turbidity Removal Efficiency",
        formula: "E (%) = [(Turb_in − Turb_out) ÷ Turb_in] × 100",
        units: "%",
        variables: [
          { sym: "E", desc: "Removal efficiency (%)" },
          { sym: "Turb_in", desc: "Influent turbidity (NTU)" },
          { sym: "Turb_out", desc: "Effluent turbidity (NTU)" },
        ],
        example: {
          problem: "Influent turbidity = 40 NTU, effluent = 0.1 NTU. What is the removal efficiency?",
          solution: "E = [(40 − 0.1) ÷ 40] × 100 = (39.9 ÷ 40) × 100",
          answer: "99.75%",
        },
        tip: "Ontario Regulation 170/03 requires treated water turbidity ≤ 1 NTU at all times and ≤ 0.3 NTU in 95% of samples per month.",
      },
      {
        name: "Flow Rate Conversion",
        formula: "Q (m³/d) = Q (L/s) × 86.4",
        units: "m³/d",
        variables: [
          { sym: "Q", desc: "Flow rate" },
          { sym: "86.4", desc: "Conversion factor (86,400 s/d ÷ 1,000 L/m³)" },
        ],
        example: {
          problem: "A plant treats 25 L/s. What is the daily flow in m³/d?",
          solution: "Q = 25 × 86.4",
          answer: "2,160 m³/d",
        },
        tip: "Common conversions: 1 L/s = 86.4 m³/d; 1 m³/d = 0.01157 L/s; 1 MGD = 3,785 m³/d.",
      },
      {
        name: "Hydraulic Detention Time",
        formula: "HDT (h) = Volume (m³) ÷ Flow (m³/h)",
        units: "hours",
        variables: [
          { sym: "HDT", desc: "Hydraulic detention time (hours)" },
          { sym: "Volume", desc: "Tank or basin volume (m³)" },
          { sym: "Flow", desc: "Flow rate through the basin (m³/h)" },
        ],
        example: {
          problem: "A sedimentation basin holds 1,200 m³. Flow = 300 m³/h. What is the HDT?",
          solution: "HDT = 1,200 ÷ 300",
          answer: "4 hours",
        },
        tip: "Typical HDT for sedimentation basins: 2–8 hours. Flocculation basins: 20–60 minutes.",
      },
      {
        name: "Population Equivalent",
        formula: "PE = BOD Load (kg/d) ÷ 0.054",
        units: "PE",
        variables: [
          { sym: "PE", desc: "Population equivalent" },
          { sym: "BOD Load", desc: "Total BOD load (kg/d)" },
          { sym: "0.054", desc: "Per capita BOD generation (54 g/person/day)" },
        ],
        example: {
          problem: "A plant receives a BOD load of 540 kg/d. What is the PE?",
          solution: "PE = 540 ÷ 0.054",
          answer: "10,000 PE",
        },
        tip: "Ontario uses 54 g BOD/person/day as the design standard for population equivalent calculations.",
      },
    ],
  },
  {
    id: "coagulation-flocculation",
    label: "Coagulation & Flocculation",
    icon: "⚗️",
    color: "#A16207",
    bg: "#FEFCE8",
    formulas: [
      {
        name: "Coagulant Dose (mg/L to kg/d)",
        formula: "Feed Rate (kg/d) = Dose (mg/L) × Flow (m³/d) × 10⁻³",
        units: "kg/d",
        variables: [
          { sym: "Dose", desc: "Target coagulant dose (mg/L)" },
          { sym: "Flow", desc: "Plant flow rate (m³/d)" },
          { sym: "10⁻³", desc: "Unit conversion factor" },
        ],
        example: {
          problem: "Alum dose = 15 mg/L, flow = 4,000 m³/d. What is the alum feed rate?",
          solution: "Feed Rate = 15 × 4,000 × 0.001",
          answer: "60 kg/d",
        },
        tip: "Typical alum doses for drinking water: 5–50 mg/L depending on raw water turbidity and NOM.",
      },
      {
        name: "Velocity Gradient (G value)",
        formula: "G (s⁻¹) = √(P ÷ (μ × V))",
        units: "s⁻¹",
        variables: [
          { sym: "G", desc: "Velocity gradient (s⁻¹)" },
          { sym: "P", desc: "Power input to the basin (W)" },
          { sym: "μ", desc: "Dynamic viscosity of water (N·s/m²) — 0.001 at 20°C" },
          { sym: "V", desc: "Basin volume (m³)" },
        ],
        example: {
          problem: "Power = 500 W, μ = 0.001 N·s/m², V = 50 m³. What is G?",
          solution: "G = √(500 ÷ (0.001 × 50)) = √(500 ÷ 0.05) = √10,000",
          answer: "100 s⁻¹",
        },
        tip: "Rapid mix (coagulation): G = 300–1,000 s⁻¹. Flocculation: G = 10–100 s⁻¹. Gt (camp number) for flocculation: 10⁴–10⁵.",
      },
      {
        name: "Camp Number (Gt)",
        formula: "Gt = G (s⁻¹) × t (s)",
        units: "dimensionless",
        variables: [
          { sym: "G", desc: "Velocity gradient (s⁻¹)" },
          { sym: "t", desc: "Detention time in flocculation basin (s)" },
        ],
        example: {
          problem: "G = 40 s⁻¹, flocculation HDT = 30 min. What is Gt?",
          solution: "Gt = 40 × (30 × 60) = 40 × 1,800",
          answer: "72,000",
        },
        tip: "Optimal Gt for flocculation: 10,000–100,000. Values below 10,000 indicate under-mixing; above 100,000 indicates floc breakup.",
      },
      {
        name: "Alum Dose → Alkalinity Consumed",
        formula: "Alk Consumed (mg/L as CaCO₃) = Alum Dose (mg/L) × 0.50",
        units: "mg/L as CaCO₃",
        variables: [
          { sym: "Alum Dose", desc: "Alum (Al₂(SO₄)₃·18H₂O) dose (mg/L)" },
          { sym: "0.50", desc: "Alkalinity consumption factor (1 mg/L alum consumes ~0.50 mg/L alkalinity as CaCO₃)" },
        ],
        example: {
          problem: "Alum dose = 20 mg/L. How much alkalinity is consumed?",
          solution: "Alk Consumed = 20 × 0.50",
          answer: "10 mg/L as CaCO₃",
        },
        tip: "If raw water alkalinity is low (< 50 mg/L as CaCO₃), add lime or soda ash to maintain pH 6.5–7.5 for effective coagulation.",
      },
    ],
  },
  {
    id: "sedimentation",
    label: "Sedimentation",
    icon: "🪨",
    color: "#15803D",
    bg: "#F0FDF4",
    formulas: [
      {
        name: "Surface Overflow Rate (SOR)",
        formula: "SOR (m³/m²·d) = Flow (m³/d) ÷ Surface Area (m²)",
        units: "m³/m²·d",
        variables: [
          { sym: "SOR", desc: "Surface overflow rate (m³/m²·d)" },
          { sym: "Flow", desc: "Plant flow rate (m³/d)" },
          { sym: "Surface Area", desc: "Clarifier plan area (m²)" },
        ],
        example: {
          problem: "Flow = 6,000 m³/d, clarifier area = 120 m². What is the SOR?",
          solution: "SOR = 6,000 ÷ 120",
          answer: "50 m³/m²·d",
        },
        tip: "Typical SOR for conventional clarifiers: 20–60 m³/m²·d. Lower SOR = better solids removal.",
      },
      {
        name: "Weir Overflow Rate (WOR)",
        formula: "WOR (m³/m·d) = Flow (m³/d) ÷ Weir Length (m)",
        units: "m³/m·d",
        variables: [
          { sym: "WOR", desc: "Weir overflow rate (m³/m·d)" },
          { sym: "Flow", desc: "Plant flow rate (m³/d)" },
          { sym: "Weir Length", desc: "Total effluent weir length (m)" },
        ],
        example: {
          problem: "Flow = 6,000 m³/d, weir length = 40 m. What is the WOR?",
          solution: "WOR = 6,000 ÷ 40",
          answer: "150 m³/m·d",
        },
        tip: "Typical WOR: 125–250 m³/m·d. Exceeding 250 m³/m·d can cause turbulence and carry-over of settled floc.",
      },
      {
        name: "Sludge Volume",
        formula: "Sludge Vol (m³/d) = [Flow (m³/d) × (TSS_in − TSS_out) × 10⁻³] ÷ Sludge Conc (kg/m³)",
        units: "m³/d",
        variables: [
          { sym: "TSS_in", desc: "Influent TSS (mg/L)" },
          { sym: "TSS_out", desc: "Effluent TSS (mg/L)" },
          { sym: "Sludge Conc", desc: "Sludge concentration (kg/m³, typically 10–50 kg/m³)" },
        ],
        example: {
          problem: "Flow = 5,000 m³/d, TSS_in = 80 mg/L, TSS_out = 5 mg/L, sludge = 20 kg/m³.",
          solution: "Sludge Vol = [5,000 × (80−5) × 0.001] ÷ 20 = [5,000 × 0.075] ÷ 20 = 375 ÷ 20",
          answer: "18.75 m³/d",
        },
        tip: "Primary sludge is typically 2–6% solids (20–60 kg/m³). Thickened sludge: 4–10% solids.",
      },
    ],
  },
  {
    id: "filtration",
    label: "Filtration",
    icon: "🔬",
    color: "#6D28D9",
    bg: "#F5F3FF",
    formulas: [
      {
        name: "Filtration Rate",
        formula: "Filtration Rate (m³/m²·h) = Flow (m³/h) ÷ Filter Area (m²)",
        units: "m³/m²·h",
        variables: [
          { sym: "Flow", desc: "Flow through the filter (m³/h)" },
          { sym: "Filter Area", desc: "Total active filter surface area (m²)" },
        ],
        example: {
          problem: "Flow = 500 m³/h, 4 filters each 25 m². What is the filtration rate?",
          solution: "Filtration Rate = 500 ÷ (4 × 25) = 500 ÷ 100",
          answer: "5 m³/m²·h",
        },
        tip: "Typical filtration rates: 5–15 m³/m²·h for rapid sand filters. Ontario Reg. 170/03 limits: ≤ 15 m/h for dual-media, ≤ 12 m/h for sand-only.",
      },
      {
        name: "Filter Run Volume",
        formula: "Run Volume (m³) = Filtration Rate (m³/m²·h) × Filter Area (m²) × Run Time (h)",
        units: "m³",
        variables: [
          { sym: "Filtration Rate", desc: "Hydraulic loading rate (m³/m²·h)" },
          { sym: "Filter Area", desc: "Filter surface area (m²)" },
          { sym: "Run Time", desc: "Time between backwashes (h)" },
        ],
        example: {
          problem: "Rate = 8 m³/m²·h, area = 30 m², run time = 24 h. What is the run volume?",
          solution: "Run Volume = 8 × 30 × 24",
          answer: "5,760 m³",
        },
        tip: "Typical filter run times: 24–72 hours. Shorter runs indicate high turbidity or biological growth.",
      },
      {
        name: "Backwash Rate",
        formula: "Backwash Rate (m³/m²·h) = Backwash Flow (m³/h) ÷ Filter Area (m²)",
        units: "m³/m²·h",
        variables: [
          { sym: "Backwash Flow", desc: "Backwash pump flow rate (m³/h)" },
          { sym: "Filter Area", desc: "Filter surface area (m²)" },
        ],
        example: {
          problem: "Backwash flow = 600 m³/h, filter area = 30 m². What is the backwash rate?",
          solution: "Backwash Rate = 600 ÷ 30",
          answer: "20 m³/m²·h",
        },
        tip: "Typical backwash rates: 36–60 m³/m²·h (10–17 m/h). Backwash should expand the bed 20–30% to release trapped solids.",
      },
      {
        name: "Filter Bed Expansion",
        formula: "Expansion (%) = [(Expanded Depth − Original Depth) ÷ Original Depth] × 100",
        units: "%",
        variables: [
          { sym: "Expanded Depth", desc: "Filter media depth during backwash (m)" },
          { sym: "Original Depth", desc: "Filter media depth at rest (m)" },
        ],
        example: {
          problem: "Original depth = 0.75 m, expanded depth = 0.97 m. What is the expansion?",
          solution: "Expansion = [(0.97 − 0.75) ÷ 0.75] × 100 = (0.22 ÷ 0.75) × 100",
          answer: "29.3%",
        },
        tip: "Target bed expansion: 20–30%. Less than 20% may not adequately clean the media; more than 40% may wash media out of the filter.",
      },
    ],
  },
  {
    id: "disinfection",
    label: "Disinfection & CT Values",
    icon: "🧪",
    color: "#0F766E",
    bg: "#F0FDFA",
    formulas: [
      {
        name: "CT Value",
        formula: "CT (mg·min/L) = C (mg/L) × T (min)",
        units: "mg·min/L",
        variables: [
          { sym: "C", desc: "Residual disinfectant concentration (mg/L)" },
          { sym: "T", desc: "Contact time (min) — T₁₀ for design (time for 10% of water to pass through)" },
        ],
        example: {
          problem: "Chlorine residual = 0.8 mg/L, T₁₀ = 25 min. What is the CT?",
          solution: "CT = 0.8 × 25",
          answer: "20 mg·min/L",
        },
        tip: "Ontario Reg. 170/03 requires CT ≥ 6 mg·min/L for Giardia inactivation (2-log) at 15°C, pH 7. Required CT increases at lower temperatures.",
      },
      {
        name: "Chlorine Dose",
        formula: "Dose (mg/L) = Demand (mg/L) + Residual (mg/L)",
        units: "mg/L",
        variables: [
          { sym: "Dose", desc: "Total chlorine applied (mg/L)" },
          { sym: "Demand", desc: "Chlorine consumed by organic matter, ammonia, etc. (mg/L)" },
          { sym: "Residual", desc: "Free chlorine remaining after contact time (mg/L)" },
        ],
        example: {
          problem: "Chlorine demand = 1.5 mg/L, target residual = 0.5 mg/L. What dose is needed?",
          solution: "Dose = 1.5 + 0.5",
          answer: "2.0 mg/L",
        },
        tip: "Ontario requires a minimum free chlorine residual of 0.2 mg/L throughout the distribution system at all times.",
      },
      {
        name: "Chlorine Feed Rate",
        formula: "Feed Rate (kg/d) = Dose (mg/L) × Flow (m³/d) × 10⁻³",
        units: "kg/d",
        variables: [
          { sym: "Dose", desc: "Chlorine dose (mg/L)" },
          { sym: "Flow", desc: "Plant flow rate (m³/d)" },
        ],
        example: {
          problem: "Dose = 2.0 mg/L, flow = 3,500 m³/d. What is the chlorine feed rate?",
          solution: "Feed Rate = 2.0 × 3,500 × 0.001",
          answer: "7.0 kg/d",
        },
        tip: "For gas chlorine: 1 kg/d = 1,000 g/d. For sodium hypochlorite (12.5% solution): divide kg/d by 0.125 to get L/d.",
      },
      {
        name: "Log Inactivation",
        formula: "Log Inactivation = log₁₀(N₀ ÷ N)",
        units: "log units",
        variables: [
          { sym: "N₀", desc: "Initial pathogen concentration" },
          { sym: "N", desc: "Final pathogen concentration after treatment" },
        ],
        example: {
          problem: "Initial Giardia cysts = 1,000/L, after treatment = 1/L. What is the log inactivation?",
          solution: "Log Inactivation = log₁₀(1,000 ÷ 1) = log₁₀(1,000)",
          answer: "3-log (99.9% removal)",
        },
        tip: "Ontario requires 3-log (99.9%) removal/inactivation of Giardia and 4-log (99.99%) for viruses through combined filtration and disinfection.",
      },
    ],
  },
  {
    id: "chemical-feed-dosing",
    label: "Chemical Feed & Dosing",
    icon: "💊",
    color: "#C2410C",
    bg: "#FFF7ED",
    formulas: [
      {
        name: "Chemical Feed Rate (Solution)",
        formula: "Feed Rate (L/d) = [Dose (mg/L) × Flow (m³/d)] ÷ [Conc (%) × 10,000]",
        units: "L/d",
        variables: [
          { sym: "Dose", desc: "Target chemical dose (mg/L)" },
          { sym: "Flow", desc: "Plant flow rate (m³/d)" },
          { sym: "Conc (%)", desc: "Chemical solution concentration (%, e.g. 12.5 for 12.5%)" },
          { sym: "10,000", desc: "Conversion factor (% × 10,000 = mg/L)" },
        ],
        example: {
          problem: "Dose = 3 mg/L fluoride, flow = 2,000 m³/d, solution = 25% (250,000 mg/L). Feed rate?",
          solution: "Feed Rate = (3 × 2,000) ÷ (25 × 10,000) = 6,000 ÷ 250,000",
          answer: "0.024 m³/d = 24 L/d",
        },
        tip: "Always verify solution density when converting between volume and mass for concentrated chemicals like sodium hypochlorite (SG ≈ 1.17).",
      },
      {
        name: "Fluoride Dose Calculation",
        formula: "Volume (L) = [Target F (mg/L) × Vol Treated (L)] ÷ Stock Conc (mg/L)",
        units: "L",
        variables: [
          { sym: "Target F", desc: "Target fluoride concentration (mg/L) — Ontario: 0.7 mg/L" },
          { sym: "Vol Treated", desc: "Volume of water to be treated (L)" },
          { sym: "Stock Conc", desc: "Fluoride stock solution concentration (mg/L)" },
        ],
        example: {
          problem: "Target = 0.7 mg/L F, treat 1,000,000 L/d, stock = 18,000 mg/L. Volume needed?",
          solution: "Volume = (0.7 × 1,000,000) ÷ 18,000 = 700,000 ÷ 18,000",
          answer: "38.9 L/d",
        },
        tip: "Ontario's optimal fluoride level is 0.7 mg/L (Health Canada, 2010). Maximum acceptable concentration (MAC) is 1.5 mg/L.",
      },
      {
        name: "Lime Dose for pH Adjustment",
        formula: "Lime Dose (mg/L) = [Target Alk − Current Alk] × 0.74",
        units: "mg/L as Ca(OH)₂",
        variables: [
          { sym: "Target Alk", desc: "Target alkalinity (mg/L as CaCO₃)" },
          { sym: "Current Alk", desc: "Current alkalinity (mg/L as CaCO₃)" },
          { sym: "0.74", desc: "Ratio of Ca(OH)₂ to CaCO₃ molecular weights (74/100)" },
        ],
        example: {
          problem: "Current alkalinity = 30 mg/L, target = 80 mg/L. What lime dose is needed?",
          solution: "Lime Dose = (80 − 30) × 0.74 = 50 × 0.74",
          answer: "37 mg/L Ca(OH)₂",
        },
        tip: "Lime (Ca(OH)₂) raises both pH and alkalinity. Soda ash (Na₂CO₃) raises alkalinity with less pH increase. Use soda ash when pH is already adequate.",
      },
    ],
  },
  {
    id: "iron-manganese",
    label: "Iron & Manganese Removal",
    icon: "🔩",
    color: "#B91C1C",
    bg: "#FEF2F2",
    formulas: [
      {
        name: "Oxidant Demand for Iron",
        formula: "Cl₂ Required (mg/L) = Fe²⁺ (mg/L) × 0.64",
        units: "mg/L Cl₂",
        variables: [
          { sym: "Fe²⁺", desc: "Dissolved iron concentration (mg/L)" },
          { sym: "0.64", desc: "Stoichiometric ratio (0.64 mg Cl₂ per mg Fe²⁺)" },
        ],
        example: {
          problem: "Raw water iron = 3.0 mg/L. How much chlorine is needed to oxidize it?",
          solution: "Cl₂ Required = 3.0 × 0.64",
          answer: "1.92 mg/L Cl₂",
        },
        tip: "Ontario MAC for iron: 0.3 mg/L (aesthetic). Oxidized iron precipitates as Fe(OH)₃ and is removed by sedimentation and filtration.",
      },
      {
        name: "Oxidant Demand for Manganese",
        formula: "Cl₂ Required (mg/L) = Mn²⁺ (mg/L) × 1.29",
        units: "mg/L Cl₂",
        variables: [
          { sym: "Mn²⁺", desc: "Dissolved manganese concentration (mg/L)" },
          { sym: "1.29", desc: "Stoichiometric ratio (1.29 mg Cl₂ per mg Mn²⁺)" },
        ],
        example: {
          problem: "Raw water manganese = 0.5 mg/L. How much chlorine is needed?",
          solution: "Cl₂ Required = 0.5 × 1.29",
          answer: "0.645 mg/L Cl₂",
        },
        tip: "Ontario MAC for manganese: 0.05 mg/L (health-based, 2019). Mn oxidation requires pH > 8.0 with chlorine; KMnO₄ is more effective at lower pH.",
      },
      {
        name: "KMnO₄ Dose for Manganese",
        formula: "KMnO₄ (mg/L) = Mn²⁺ (mg/L) × 1.92",
        units: "mg/L KMnO₄",
        variables: [
          { sym: "Mn²⁺", desc: "Dissolved manganese (mg/L)" },
          { sym: "1.92", desc: "Stoichiometric ratio (1.92 mg KMnO₄ per mg Mn²⁺)" },
        ],
        example: {
          problem: "Manganese = 0.4 mg/L. What KMnO₄ dose is needed?",
          solution: "KMnO₄ = 0.4 × 1.92",
          answer: "0.768 mg/L",
        },
        tip: "KMnO₄ is a strong oxidant — overdosing causes pink water (MAC = 0.05 mg/L KMnO₄ in finished water). Always jar test before full-scale application.",
      },
    ],
  },
  {
    id: "water-quality-regulations",
    label: "Water Quality & Regulations",
    icon: "📋",
    color: "#166534",
    bg: "#F0FDF4",
    formulas: [
      {
        name: "Langelier Saturation Index (LSI)",
        formula: "LSI = pH − pHs",
        units: "dimensionless",
        variables: [
          { sym: "pH", desc: "Actual measured pH of the water" },
          { sym: "pHs", desc: "pH at which water is saturated with CaCO₃ (calculated from temp, TDS, Ca²⁺, alkalinity)" },
        ],
        example: {
          problem: "Measured pH = 7.8, pHs = 7.5. What is the LSI?",
          solution: "LSI = 7.8 − 7.5",
          answer: "LSI = +0.3 (slightly scale-forming)",
        },
        tip: "LSI > 0: scale-forming (protective CaCO₃ coating). LSI < 0: corrosive. LSI = 0: balanced. Target LSI: 0 to +0.5 for distribution system corrosion control.",
      },
      {
        name: "Hardness (as CaCO₃)",
        formula: "Hardness (mg/L as CaCO₃) = [Ca²⁺ (mg/L) ÷ 40.1] × 100 + [Mg²⁺ (mg/L) ÷ 24.3] × 100",
        units: "mg/L as CaCO₃",
        variables: [
          { sym: "Ca²⁺", desc: "Calcium concentration (mg/L)" },
          { sym: "Mg²⁺", desc: "Magnesium concentration (mg/L)" },
          { sym: "40.1 / 24.3", desc: "Atomic masses of Ca and Mg (g/mol)" },
        ],
        example: {
          problem: "Ca²⁺ = 80 mg/L, Mg²⁺ = 12 mg/L. What is the total hardness?",
          solution: "Hardness = (80/40.1 × 100) + (12/24.3 × 100) = 199.5 + 49.4",
          answer: "248.9 mg/L as CaCO₃",
        },
        tip: "Hardness classification: 0–60 soft, 61–120 moderately hard, 121–180 hard, >180 very hard (mg/L as CaCO₃). Ontario has no MAC for hardness.",
      },
      {
        name: "Alkalinity (as CaCO₃)",
        formula: "Alkalinity (mg/L as CaCO₃) = Titrant Vol (mL) × N × 50,000 ÷ Sample Vol (mL)",
        units: "mg/L as CaCO₃",
        variables: [
          { sym: "Titrant Vol", desc: "Volume of H₂SO₄ used in titration (mL)" },
          { sym: "N", desc: "Normality of H₂SO₄ titrant (e.g. 0.02 N)" },
          { sym: "50,000", desc: "Equivalent weight of CaCO₃ × 1,000" },
          { sym: "Sample Vol", desc: "Volume of water sample (mL)" },
        ],
        example: {
          problem: "Titrant = 8.5 mL of 0.02 N H₂SO₄, sample = 100 mL. What is the alkalinity?",
          solution: "Alkalinity = 8.5 × 0.02 × 50,000 ÷ 100 = 8,500 ÷ 100",
          answer: "85 mg/L as CaCO₃",
        },
        tip: "Minimum alkalinity for corrosion control: 30–50 mg/L as CaCO₃. Alkalinity also buffers pH during chlorination and coagulation.",
      },
      {
        name: "SUVA (Specific UV Absorbance)",
        formula: "SUVA (L/mg·m) = UV₂₅₄ (cm⁻¹) × 100 ÷ DOC (mg/L)",
        units: "L/mg·m",
        variables: [
          { sym: "UV₂₅₄", desc: "UV absorbance at 254 nm (cm⁻¹)" },
          { sym: "DOC", desc: "Dissolved organic carbon (mg/L)" },
          { sym: "100", desc: "Converts cm⁻¹ to m⁻¹" },
        ],
        example: {
          problem: "UV₂₅₄ = 0.15 cm⁻¹, DOC = 5.0 mg/L. What is the SUVA?",
          solution: "SUVA = 0.15 × 100 ÷ 5.0 = 15 ÷ 5.0",
          answer: "3.0 L/mg·m",
        },
        tip: "SUVA > 4: high NOM, hydrophobic — responds well to coagulation. SUVA < 2: low NOM, hydrophilic — coagulation less effective. SUVA used to predict DBP formation potential.",
      },
    ],
  },
];

// ── REGULATORY LIMITS ─────────────────────────────────────────────────────────
const REGULATORY_LIMITS = [
  { parameter: "Turbidity (treated)", limit: "≤ 1 NTU (all times); ≤ 0.3 NTU (95% of samples/month)", regulation: "O. Reg. 170/03" },
  { parameter: "Free Chlorine Residual", limit: "≥ 0.2 mg/L in distribution system", regulation: "O. Reg. 170/03" },
  { parameter: "Fluoride", limit: "Optimal: 0.7 mg/L; MAC: 1.5 mg/L", regulation: "Health Canada / O. Reg. 169/03" },
  { parameter: "Iron (aesthetic)", limit: "≤ 0.3 mg/L", regulation: "O. Reg. 169/03" },
  { parameter: "Manganese (health)", limit: "≤ 0.05 mg/L", regulation: "O. Reg. 169/03" },
  { parameter: "Nitrate", limit: "≤ 10 mg/L as N", regulation: "O. Reg. 169/03" },
  { parameter: "pH (distribution)", limit: "6.5–8.5 (aesthetic)", regulation: "O. Reg. 169/03" },
  { parameter: "Total Trihalomethanes (TTHMs)", limit: "≤ 0.10 mg/L", regulation: "O. Reg. 169/03" },
  { parameter: "Haloacetic Acids (HAAs)", limit: "≤ 0.08 mg/L", regulation: "O. Reg. 169/03" },
  { parameter: "E. coli", limit: "Not detected in any 100 mL sample", regulation: "O. Reg. 170/03" },
  { parameter: "Total Coliforms", limit: "Not detected in ≥ 90% of samples/month", regulation: "O. Reg. 170/03" },
  { parameter: "Giardia (log removal)", limit: "≥ 3-log (99.9%) removal/inactivation", regulation: "O. Reg. 170/03" },
  { parameter: "Viruses (log removal)", limit: "≥ 4-log (99.99%) removal/inactivation", regulation: "O. Reg. 170/03" },
];

// ── RENDER ────────────────────────────────────────────────────────────────────
export default function FormulasWater1() {
  usePageMeta({
    title: "Class 1 Water Treatment Formula Sheet — Ontario Operator Exam",
    description: "Complete formula reference for the Ontario Class 1 Water Treatment operator exam. Covers coagulation, sedimentation, filtration, disinfection, CT values, chemical dosing, iron/manganese removal, and water quality regulations.",
    path: "/formulas-water1",
  });

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = CATEGORIES.map(cat => ({
    ...cat,
    formulas: cat.formulas.filter(f => {
      const q = search.toLowerCase();
      if (!q) return true;
      return (
        f.name.toLowerCase().includes(q) ||
        f.formula.toLowerCase().includes(q) ||
        (f.tip ?? "").toLowerCase().includes(q)
      );
    }),
  })).filter(cat =>
    (!activeCategory || cat.id === activeCategory) && cat.formulas.length > 0
  );

  const totalFormulas = CATEGORIES.reduce((sum, c) => sum + c.formulas.length, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter', 'Sora', sans-serif" }}>      <style>{`
        @media (max-width: 640px) {
          .formulas-content { padding: 16px 14px 60px !important; }
          .formulas-hero { padding: 32px 16px 28px !important; }
          .formulas-hero-btns { flex-direction: column !important; align-items: stretch !important; }
          .formulas-hero-btns a, .formulas-hero-btns button { width: 100% !important; box-sizing: border-box; }
          .formulas-nav-btns { flex-wrap: wrap !important; }
          .formulas-nav-btns a, .formulas-nav-btns button { flex: 1 1 auto !important; }
          .formulas-quick-ref { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      <SiteNav currentPath="/formulas-water1" />

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1D4ED8 0%, #0369A1 60%, #0F766E 100%)",
        padding: "48px 24px 40px",
        color: "#fff",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <Link href="/class1-water">
              <span style={{
                background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 20, padding: "4px 14px", fontSize: 13, cursor: "pointer", color: "#fff",
              }}>← Class 1 Water Practice</span>
            </Link>
            <Link href="/class1-water-mock">
              <span style={{
                background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 20, padding: "4px 14px", fontSize: 13, cursor: "pointer", color: "#fff",
              }}>📋 Mock Exam →</span>
            </Link>
          </div>
          <h1 style={{ fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
            📐 Class 1 Water Treatment
          </h1>
          <p style={{ fontSize: 16, opacity: 0.85, marginTop: 8, marginBottom: 0 }}>
            Formula Sheet — {totalFormulas} formulas across {CATEGORIES.length} categories
          </p>
          <p style={{ fontSize: 13, opacity: 0.65, marginTop: 4, marginBottom: 0 }}>
            O. Reg. 170/03 · O. Reg. 169/03 · OWWCO Class 1 Water Treatment Exam
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px 64px" }}>

        {/* Search */}
        <input
          type="text"
          placeholder="Search formulas, variables, or topics…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%", padding: "12px 16px", borderRadius: 10,
            border: "1.5px solid #E2E8F0", fontSize: 15, outline: "none",
            boxSizing: "border-box", marginBottom: 20,
            fontFamily: "inherit", background: "#fff",
          }}
        />

        {/* Category filter chips */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
          <button
            onClick={() => setActiveCategory(null)}
            style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer",
              border: "1.5px solid " + (activeCategory === null ? "#1D4ED8" : "#E2E8F0"),
              background: activeCategory === null ? "#EFF6FF" : "#fff",
              color: activeCategory === null ? "#1D4ED8" : "#64748B",
              fontWeight: activeCategory === null ? 700 : 400,
            }}
          >All</button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer",
                border: "1.5px solid " + (activeCategory === cat.id ? cat.color : "#E2E8F0"),
                background: activeCategory === cat.id ? cat.bg : "#fff",
                color: activeCategory === cat.id ? cat.color : "#64748B",
                fontWeight: activeCategory === cat.id ? 700 : 400,
              }}
            >{cat.icon} {cat.label}</button>
          ))}
        </div>

        {/* Formula categories */}
        {filtered.map(cat => (
          <div key={cat.id} id={cat.id} style={{ marginBottom: 40, scrollMarginTop: 80 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
              paddingBottom: 10, borderBottom: `2px solid ${cat.color}22`,
            }}>
              <span style={{ fontSize: 22 }}>{cat.icon}</span>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: cat.color }}>{cat.label}</h2>
              <span style={{
                marginLeft: "auto", fontSize: 12, color: cat.color,
                background: cat.bg, padding: "2px 10px", borderRadius: 12,
                border: `1px solid ${cat.color}33`,
              }}>{cat.formulas.length} formula{cat.formulas.length !== 1 ? "s" : ""}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {cat.formulas.map((f, i) => (
                <div key={i} style={{
                  background: "#fff", borderRadius: 12, padding: "20px 24px",
                  border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#1E293B", marginBottom: 10 }}>
                    {f.name}
                  </div>
                  <div style={{
                    background: cat.bg, border: `1px solid ${cat.color}33`,
                    borderRadius: 8, padding: "10px 14px", marginBottom: 12,
                    fontFamily: "monospace", fontSize: 15, color: cat.color, fontWeight: 600,
                    wordBreak: "break-word",
                  }}>
                    {f.formula}
                    {f.units && <span style={{ fontSize: 12, opacity: 0.7, marginLeft: 8 }}>({f.units})</span>}
                  </div>

                  {f.variables && f.variables.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      {f.variables.map((v, vi) => (
                        <div key={vi} style={{ fontSize: 13, color: "#475569", marginBottom: 3 }}>
                          <span style={{ fontWeight: 600, color: "#1E293B", fontFamily: "monospace" }}>{v.sym}</span>
                          {" — "}{v.desc}
                        </div>
                      ))}
                    </div>
                  )}

                  {f.example && (
                    <div style={{
                      background: "#F8FAFC", borderRadius: 8, padding: "12px 14px",
                      marginBottom: 10, border: "1px solid #E2E8F0",
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Worked Example
                      </div>
                      <div style={{ fontSize: 13, color: "#334155", marginBottom: 4 }}>{f.example.problem}</div>
                      <div style={{ fontSize: 13, color: "#475569", marginBottom: 4, fontFamily: "monospace" }}>{f.example.solution}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#15803D" }}>✓ {f.example.answer}</div>
                    </div>
                  )}

                  {f.tip && (
                    <div style={{
                      fontSize: 13, color: "#0369A1", background: "#F0F9FF",
                      borderRadius: 6, padding: "8px 12px", borderLeft: "3px solid #0369A1",
                    }}>
                      💡 <strong>Exam tip:</strong> {f.tip}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Regulatory Limits Table */}
        {(!activeCategory || activeCategory === "water-quality-regulations") && !search && (
          <div style={{ marginTop: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#166534", marginBottom: 16 }}>
              📋 Ontario Drinking Water Regulatory Limits
            </h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 12, overflow: "hidden", border: "1px solid #E2E8F0" }}>
                <thead>
                  <tr style={{ background: "#F0FDF4" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#166534", borderBottom: "1px solid #E2E8F0" }}>Parameter</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#166534", borderBottom: "1px solid #E2E8F0" }}>Limit / Target</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#166534", borderBottom: "1px solid #E2E8F0" }}>Regulation</th>
                  </tr>
                </thead>
                <tbody>
                  {REGULATORY_LIMITS.map((row, i) => (
                    <tr key={i} style={{ borderBottom: i < REGULATORY_LIMITS.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                      <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, color: "#1E293B" }}>{row.parameter}</td>
                      <td style={{ padding: "10px 16px", fontSize: 13, color: "#334155" }}>{row.limit}</td>
                      <td style={{ padding: "10px 16px", fontSize: 12, color: "#64748B", fontFamily: "monospace" }}>{row.regulation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94A3B8" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 16 }}>No formulas match your search. Try a different keyword.</div>
          </div>
        )}
      </div>
    </div>
  );
}
