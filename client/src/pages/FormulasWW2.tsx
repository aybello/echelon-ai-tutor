// Class 2 Wastewater Treatment — Formula Sheet
// Covers: Activated Sludge, BNR, Biosolids, Collection Systems, Lab, Safety
// Design: Teal/green brand, mirrors Formulas.tsx structure

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
    id: "activated-sludge",
    label: "Activated Sludge Process",
    icon: "🔬",
    color: "#0F766E",
    bg: "#F0FDFA",
    formulas: [
      {
        name: "Sludge Volume Index (SVI)",
        formula: "SVI = (SV₃₀ × 1000) ÷ MLSS",
        units: "mL/g",
        variables: [
          { sym: "SVI", desc: "Sludge Volume Index (mL/g)" },
          { sym: "SV₃₀", desc: "Settled sludge volume after 30 min (mL/L)" },
          { sym: "MLSS", desc: "Mixed Liquor Suspended Solids (mg/L)" },
        ],
        example: {
          problem: "SV₃₀ = 280 mL/L and MLSS = 2,800 mg/L. What is the SVI?",
          solution: "SVI = (280 × 1000) ÷ 2,800 = 100 mL/g",
          answer: "100 mL/g",
        },
        tip: "Good settling: SVI 80–150 mL/g. Bulking sludge: SVI > 200 mL/g. Pin floc (poor settling): SVI < 50 mL/g. SVI > 150 requires investigation.",
      },
      {
        name: "Solids Retention Time (SRT / MCRT)",
        formula: "SRT = (V × MLSS) ÷ (Qw × WAS + Qe × TSS_e)",
        units: "days",
        variables: [
          { sym: "V", desc: "Aeration basin volume (m³)" },
          { sym: "MLSS", desc: "Mixed liquor suspended solids (mg/L)" },
          { sym: "Qw", desc: "Waste sludge flow rate (m³/d)" },
          { sym: "WAS", desc: "Waste activated sludge concentration (mg/L)" },
          { sym: "Qe", desc: "Effluent flow rate (m³/d)" },
          { sym: "TSS_e", desc: "Effluent TSS (mg/L)" },
        ],
        example: {
          problem: "V = 6,000 m³, MLSS = 3,200 mg/L, Qw = 120 m³/d, WAS = 8,500 mg/L, Qe = 12,000 m³/d, TSS_e = 18 mg/L. What is SRT?",
          solution: "Numerator = 6,000 × 3,200 = 19,200,000\nDenominator = (120 × 8,500) + (12,000 × 18) = 1,020,000 + 216,000 = 1,236,000\nSRT = 19,200,000 ÷ 1,236,000 = 15.5 days",
          answer: "15.5 days",
        },
        tip: "Nitrification requires SRT > 10 days (at 20°C). Denitrification: SRT 10–20 days. Short SRT = young sludge, washout risk. Long SRT = stable nitrification, more biosolids.",
      },
      {
        name: "Food-to-Microorganism Ratio (F:M)",
        formula: "F:M = (BOD_in × Q) ÷ (V × MLVSS)",
        units: "kg BOD / kg MLVSS · d",
        variables: [
          { sym: "BOD_in", desc: "Influent BOD (mg/L = g/m³)" },
          { sym: "Q", desc: "Flow rate (m³/d)" },
          { sym: "V", desc: "Aeration basin volume (m³)" },
          { sym: "MLVSS", desc: "Mixed liquor volatile suspended solids (mg/L)" },
        ],
        example: {
          problem: "BOD_in = 220 mg/L, Q = 12,000 m³/d, V = 5,000 m³, MLVSS = 2,400 mg/L. What is F:M?",
          solution: "F:M = (220 × 12,000) ÷ (5,000 × 2,400)\n= 2,640,000 ÷ 12,000,000 = 0.22 kg BOD/kg MLVSS·d",
          answer: "0.22 kg BOD/kg MLVSS·d",
        },
        tip: "Conventional AS: F:M 0.2–0.5. Extended aeration: 0.05–0.15. High F:M = dispersed growth, poor settling. Low F:M = over-aeration, pin floc.",
      },
      {
        name: "Mixed Liquor Suspended Solids (MLSS)",
        formula: "MLSS = (SRT × BOD_in × Q × Y) ÷ (V × (1 + kd × SRT))",
        units: "mg/L",
        variables: [
          { sym: "Y", desc: "Yield coefficient (kg VSS/kg BOD), typically 0.4–0.8" },
          { sym: "kd", desc: "Endogenous decay coefficient (d⁻¹), typically 0.04–0.08" },
          { sym: "SRT", desc: "Solids retention time (days)" },
          { sym: "BOD_in", desc: "Influent BOD (mg/L)" },
          { sym: "Q", desc: "Flow rate (m³/d)" },
          { sym: "V", desc: "Aeration basin volume (m³)" },
        ],
        example: {
          problem: "SRT = 15 d, BOD_in = 200 mg/L, Q = 10,000 m³/d, V = 5,000 m³, Y = 0.6, kd = 0.06. What is MLVSS?",
          solution: "Numerator = 15 × 200 × 10,000 × 0.6 = 18,000,000\nDenominator = 5,000 × (1 + 0.06 × 15) = 5,000 × 1.9 = 9,500\nMLVSS = 18,000,000 ÷ 9,500 = 1,895 mg/L",
          answer: "~1,895 mg/L MLVSS",
        },
        tip: "MLSS = MLVSS ÷ VSS fraction (typically 0.75–0.85). Target MLSS for conventional AS: 2,000–4,000 mg/L.",
      },
      {
        name: "Volumetric Oxygen Demand",
        formula: "O₂ demand = Q × (BOD_in − BOD_out) × 1.5 ÷ 1000",
        units: "kg O₂/d",
        variables: [
          { sym: "Q", desc: "Flow rate (m³/d)" },
          { sym: "BOD_in", desc: "Influent BOD (mg/L)" },
          { sym: "BOD_out", desc: "Effluent BOD (mg/L)" },
          { sym: "1.5", desc: "Oxygen-to-BOD ratio factor (includes nitrification demand)" },
        ],
        example: {
          problem: "Q = 10,000 m³/d, BOD_in = 200 mg/L, BOD_out = 10 mg/L. What is the O₂ demand?",
          solution: "O₂ demand = 10,000 × (200 − 10) × 1.5 ÷ 1000\n= 10,000 × 190 × 1.5 ÷ 1000 = 2,850 kg O₂/d",
          answer: "2,850 kg O₂/d",
        },
        tip: "Actual O₂ transfer rate (AOTR) must exceed demand. Add nitrification demand: 4.57 kg O₂/kg NH₄-N oxidized.",
      },
      {
        name: "Return Activated Sludge (RAS) Rate",
        formula: "RAS ratio = SV₃₀ ÷ (1000 − SV₃₀)",
        units: "dimensionless (expressed as % of influent flow)",
        variables: [
          { sym: "SV₃₀", desc: "Settled sludge volume after 30 min (mL/L)" },
        ],
        example: {
          problem: "SV₃₀ = 250 mL/L. What is the required RAS ratio?",
          solution: "RAS ratio = 250 ÷ (1000 − 250) = 250 ÷ 750 = 0.33 (33%)",
          answer: "33% of influent flow",
        },
        tip: "Typical RAS: 25–100% of influent flow. Higher SVI requires higher RAS to maintain MLSS. RAS > 100% is unusual and may indicate bulking.",
      },
    ],
  },
  {
    id: "nutrient-removal",
    label: "Nutrient Removal (BNR)",
    icon: "🌿",
    color: "#15803D",
    bg: "#F0FDF4",
    formulas: [
      {
        name: "Nitrification Rate (Nitrifier Growth)",
        formula: "μ_n = μ_max × NH₄ ÷ (Ks + NH₄) × (DO ÷ (Ko + DO))",
        units: "d⁻¹",
        variables: [
          { sym: "μ_max", desc: "Maximum nitrifier growth rate (~0.75 d⁻¹ at 20°C)" },
          { sym: "Ks", desc: "Half-saturation constant for NH₄ (~0.5–1.0 mg/L)" },
          { sym: "Ko", desc: "Half-saturation constant for DO (~0.5 mg/L)" },
          { sym: "NH₄", desc: "Ammonia concentration (mg/L)" },
          { sym: "DO", desc: "Dissolved oxygen concentration (mg/L)" },
        ],
        example: {
          problem: "Why must DO be maintained ≥ 2 mg/L in the aerobic zone for nitrification?",
          solution: "At DO = 2 mg/L and Ko = 0.5: DO/(Ko+DO) = 2/2.5 = 0.80\nAt DO = 0.5 mg/L: DO/(Ko+DO) = 0.5/1.0 = 0.50\nLow DO cuts nitrifier growth rate by 50%, causing incomplete nitrification.",
          answer: "DO < 0.5 mg/L inhibits nitrification by >50%",
        },
        tip: "Nitrification is temperature-sensitive: rate halves for every 10°C drop. Minimum SRT for nitrification at 10°C ≈ 20 days; at 20°C ≈ 10 days.",
      },
      {
        name: "Oxygen Demand for Nitrification",
        formula: "O₂ (nitrification) = 4.57 × ΔNH₄",
        units: "kg O₂/kg NH₄-N oxidized",
        variables: [
          { sym: "4.57", desc: "Stoichiometric O₂ demand (kg O₂/kg NH₄-N)" },
          { sym: "ΔNH₄", desc: "Ammonia removed (mg/L or kg/d)" },
        ],
        example: {
          problem: "A plant removes 30 mg/L of NH₄-N at a flow of 10,000 m³/d. What is the nitrification O₂ demand?",
          solution: "Mass NH₄-N removed = 30 × 10,000 ÷ 1000 = 300 kg/d\nO₂ demand = 4.57 × 300 = 1,371 kg O₂/d",
          answer: "1,371 kg O₂/d",
        },
        tip: "Total O₂ demand = carbonaceous demand + nitrification demand. Nitrification can add 30–50% to total O₂ demand.",
      },
      {
        name: "Denitrification — NO₃ Removal",
        formula: "NO₃ removed = (Q_r × NO₃_r) ÷ (Q_in + Q_r)",
        units: "mg/L",
        variables: [
          { sym: "Q_r", desc: "Internal recycle flow rate (m³/d)" },
          { sym: "NO₃_r", desc: "Nitrate in recycle stream (mg/L)" },
          { sym: "Q_in", desc: "Influent flow rate (m³/d)" },
        ],
        example: {
          problem: "In a Modified Ludzack-Ettinger (MLE) process: Q_in = 10,000 m³/d, Q_r = 30,000 m³/d (3× recycle), NO₃ in aerobic effluent = 20 mg/L. What is the effluent NO₃?",
          solution: "Recycle ratio r = Q_r/Q_in = 3\nEffluent NO₃ ≈ NO₃_aerobic ÷ (r + 1) = 20 ÷ (3 + 1) = 5 mg/L",
          answer: "~5 mg/L NO₃-N in effluent",
        },
        tip: "Higher recycle ratio = lower effluent NO₃, but more pumping energy. Typical recycle: 2–4× influent flow. Carbon (BOD) is required for denitrification.",
      },
      {
        name: "Phosphorus Removal — Chemical Precipitation",
        formula: "Alum dose = 9.6 × TP_removed",
        units: "mg alum / mg P removed",
        variables: [
          { sym: "9.6", desc: "Molar ratio: Al₂(SO₄)₃·18H₂O to P (approximate)" },
          { sym: "TP_removed", desc: "Total phosphorus to be removed (mg/L)" },
        ],
        example: {
          problem: "Influent TP = 8 mg/L, effluent target = 1 mg/L. What alum dose is needed?",
          solution: "TP to remove = 8 − 1 = 7 mg/L\nAlum dose = 9.6 × 7 = 67.2 mg/L",
          answer: "~67 mg/L alum",
        },
        tip: "Ferric chloride: ~5.2 mg FeCl₃ per mg P. Biological P removal (EBPR) requires anaerobic zone before aerobic zone and adequate VFAs.",
      },
      {
        name: "Total Kjeldahl Nitrogen (TKN)",
        formula: "TKN = Organic-N + NH₄-N",
        units: "mg/L as N",
        variables: [
          { sym: "TKN", desc: "Total Kjeldahl Nitrogen (mg/L)" },
          { sym: "Organic-N", desc: "Organic nitrogen (mg/L)" },
          { sym: "NH₄-N", desc: "Ammonia nitrogen (mg/L)" },
        ],
        example: {
          problem: "Effluent TN = TKN + NO₃-N + NO₂-N. If TKN = 5 mg/L, NO₃-N = 8 mg/L, NO₂-N = 0.2 mg/L, what is TN?",
          solution: "TN = 5 + 8 + 0.2 = 13.2 mg/L",
          answer: "13.2 mg/L TN",
        },
        tip: "Ontario effluent limits for TN and TP vary by plant class. Class 4 plants typically must meet TN ≤ 15 mg/L and TP ≤ 1 mg/L.",
      },
    ],
  },
  {
    id: "biosolids",
    label: "Biosolids & Sludge",
    icon: "🪣",
    color: "#92400E",
    bg: "#FFF7ED",
    formulas: [
      {
        name: "Sludge Production Rate",
        formula: "P_x = Y_obs × Q × (BOD_in − BOD_out) ÷ 1000",
        units: "kg VSS/d",
        variables: [
          { sym: "Y_obs", desc: "Observed yield (kg VSS/kg BOD), typically 0.3–0.6" },
          { sym: "Q", desc: "Flow rate (m³/d)" },
          { sym: "BOD_in", desc: "Influent BOD (mg/L)" },
          { sym: "BOD_out", desc: "Effluent BOD (mg/L)" },
        ],
        example: {
          problem: "Y_obs = 0.5, Q = 10,000 m³/d, BOD_in = 200 mg/L, BOD_out = 10 mg/L. What is sludge production?",
          solution: "P_x = 0.5 × 10,000 × (200 − 10) ÷ 1000\n= 0.5 × 10,000 × 190 ÷ 1000 = 950 kg VSS/d",
          answer: "950 kg VSS/d",
        },
        tip: "Total sludge (TSS) = VSS ÷ VSS fraction (~0.75–0.85). Longer SRT = lower Y_obs due to endogenous respiration.",
      },
      {
        name: "Waste Sludge Flow Rate (Qw)",
        formula: "Qw = (V × MLSS) ÷ (SRT × WAS_conc)",
        units: "m³/d",
        variables: [
          { sym: "V", desc: "Aeration basin volume (m³)" },
          { sym: "MLSS", desc: "Mixed liquor suspended solids (mg/L)" },
          { sym: "SRT", desc: "Target solids retention time (days)" },
          { sym: "WAS_conc", desc: "WAS concentration (mg/L, from secondary clarifier underflow)" },
        ],
        example: {
          problem: "V = 5,000 m³, MLSS = 3,000 mg/L, SRT = 15 d, WAS = 8,000 mg/L. What is Qw?",
          solution: "Qw = (5,000 × 3,000) ÷ (15 × 8,000)\n= 15,000,000 ÷ 120,000 = 125 m³/d",
          answer: "125 m³/d",
        },
        tip: "Wasting rate controls SRT. Increase Qw to decrease SRT (younger sludge). Decrease Qw to increase SRT (older sludge, better nitrification).",
      },
      {
        name: "Solids Loading to Digester",
        formula: "Solids load = Q_sludge × C_sludge ÷ 1000",
        units: "kg TS/d",
        variables: [
          { sym: "Q_sludge", desc: "Sludge flow to digester (m³/d)" },
          { sym: "C_sludge", desc: "Sludge total solids concentration (mg/L or g/m³)" },
        ],
        example: {
          problem: "Q_sludge = 50 m³/d, C_sludge = 40,000 mg/L (4% TS). What is the solids loading?",
          solution: "Solids load = 50 × 40,000 ÷ 1000 = 2,000 kg TS/d",
          answer: "2,000 kg TS/d",
        },
        tip: "Primary sludge: 3–8% TS. WAS (thickened): 2–4% TS. Digested biosolids: 2–5% TS. Dewatered cake: 15–30% TS.",
      },
      {
        name: "Volatile Solids Reduction (VSR) — Digestion",
        formula: "VSR = (VS_in − VS_out) ÷ VS_in × 100",
        units: "%",
        variables: [
          { sym: "VS_in", desc: "Volatile solids entering digester (kg/d)" },
          { sym: "VS_out", desc: "Volatile solids leaving digester (kg/d)" },
        ],
        example: {
          problem: "VS_in = 1,000 kg/d, VS_out = 380 kg/d. What is the VSR?",
          solution: "VSR = (1,000 − 380) ÷ 1,000 × 100 = 62%",
          answer: "62% VSR",
        },
        tip: "Ontario Reg. 267/03: Class B biosolids require ≥ 38% VSR. Class A requires pathogen reduction to below detection. Typical mesophilic digestion: 40–60% VSR.",
      },
      {
        name: "Biogas Production (Anaerobic Digestion)",
        formula: "Biogas = 0.75 × VS_destroyed",
        units: "m³ biogas / kg VS destroyed",
        variables: [
          { sym: "0.75", desc: "Approximate biogas yield (m³/kg VS destroyed)" },
          { sym: "VS_destroyed", desc: "Volatile solids destroyed (kg/d)" },
        ],
        example: {
          problem: "VS_destroyed = 600 kg/d. What is the daily biogas production?",
          solution: "Biogas = 0.75 × 600 = 450 m³/d\nMethane (65%): 450 × 0.65 = 292.5 m³/d",
          answer: "450 m³/d biogas (292.5 m³/d CH₄)",
        },
        tip: "Biogas is ~65% CH₄, 35% CO₂. Energy value of methane: ~35.8 MJ/m³. Used for heating digesters and/or generating electricity via CHP.",
      },
      {
        name: "Digester Hydraulic Retention Time",
        formula: "HRT = V_digester ÷ Q_feed",
        units: "days",
        variables: [
          { sym: "V_digester", desc: "Digester volume (m³)" },
          { sym: "Q_feed", desc: "Daily sludge feed rate (m³/d)" },
        ],
        example: {
          problem: "Digester volume = 1,500 m³, daily feed = 60 m³/d. What is the HRT?",
          solution: "HRT = 1,500 ÷ 60 = 25 days",
          answer: "25 days",
        },
        tip: "Mesophilic digestion (35°C): minimum HRT 15–20 days. Thermophilic (55°C): 10–15 days. Longer HRT = more VS destruction and biogas.",
      },
    ],
  },
  {
    id: "primary-treatment",
    label: "Primary & Secondary Treatment",
    icon: "🌊",
    color: "#0369A1",
    bg: "#F0F9FF",
    formulas: [
      {
        name: "Hydraulic Detention Time (HDT)",
        formula: "HDT = V ÷ Q",
        units: "hours (convert Q to m³/h)",
        variables: [
          { sym: "V", desc: "Basin volume (m³)" },
          { sym: "Q", desc: "Flow rate (m³/h)" },
        ],
        example: {
          problem: "Primary clarifier volume = 1,200 m³, flow = 400 m³/h. What is the HDT?",
          solution: "HDT = 1,200 ÷ 400 = 3 hours",
          answer: "3 hours",
        },
        tip: "Typical primary clarifier HDT: 1.5–2.5 hours. Secondary clarifier HDT: 1.5–2.5 hours. Short HDT = poor settling; long HDT = septic conditions.",
      },
      {
        name: "Surface Overflow Rate (SOR)",
        formula: "SOR = Q ÷ A",
        units: "m³/m²·d  (m/d)",
        variables: [
          { sym: "Q", desc: "Flow rate (m³/d)" },
          { sym: "A", desc: "Surface area of clarifier (m²)" },
        ],
        example: {
          problem: "Flow = 8,000 m³/d, circular clarifier diameter = 20 m. What is the SOR?",
          solution: "A = π × (10)² = 314.2 m²\nSOR = 8,000 ÷ 314.2 = 25.5 m/d",
          answer: "25.5 m/d",
        },
        tip: "Primary clarifier SOR: 24–48 m/d (peak ≤ 60 m/d). Secondary clarifier SOR: 16–32 m/d. Higher SOR = shorter detention, poorer settling.",
      },
      {
        name: "Weir Overflow Rate (WOR)",
        formula: "WOR = Q ÷ L_weir",
        units: "m³/m·d",
        variables: [
          { sym: "Q", desc: "Flow rate (m³/d)" },
          { sym: "L_weir", desc: "Total weir length (m)" },
        ],
        example: {
          problem: "Q = 8,000 m³/d, circular clarifier diameter = 20 m (one peripheral weir). What is the WOR?",
          solution: "L_weir = π × 20 = 62.8 m\nWOR = 8,000 ÷ 62.8 = 127.4 m³/m·d",
          answer: "127 m³/m·d",
        },
        tip: "Typical WOR: ≤ 125–250 m³/m·d. High WOR causes turbulence at the weir, dragging solids into the effluent. Inboard weirs reduce WOR.",
      },
      {
        name: "Secondary Clarifier Solids Loading Rate",
        formula: "SLR = (Q + Q_r) × MLSS ÷ A",
        units: "kg TSS/m²·d",
        variables: [
          { sym: "Q", desc: "Influent flow (m³/d)" },
          { sym: "Q_r", desc: "Return activated sludge flow (m³/d)" },
          { sym: "MLSS", desc: "Mixed liquor suspended solids (g/m³ = mg/L)" },
          { sym: "A", desc: "Clarifier surface area (m²)" },
        ],
        example: {
          problem: "Q = 10,000 m³/d, Q_r = 5,000 m³/d, MLSS = 3,000 mg/L, A = 500 m². What is the SLR?",
          solution: "SLR = (10,000 + 5,000) × 3,000 ÷ (500 × 1,000)\n= 45,000,000 ÷ 500,000 = 90 kg/m²·d",
          answer: "90 kg TSS/m²·d",
        },
        tip: "Typical SLR: ≤ 100–150 kg/m²·d (average), ≤ 200 kg/m²·d (peak). Exceeding SLR causes sludge blanket rise and solids carryover in effluent.",
      },
      {
        name: "BOD Removal Efficiency",
        formula: "E = (BOD_in − BOD_out) ÷ BOD_in × 100",
        units: "%",
        variables: [
          { sym: "BOD_in", desc: "Influent BOD (mg/L)" },
          { sym: "BOD_out", desc: "Effluent BOD (mg/L)" },
        ],
        example: {
          problem: "Influent BOD = 220 mg/L, effluent BOD = 15 mg/L. What is removal efficiency?",
          solution: "E = (220 − 15) ÷ 220 × 100 = 93.2%",
          answer: "93.2%",
        },
        tip: "Ontario Class 2 WW effluent limits (O. Reg. 347): BOD₅ ≤ 25 mg/L, TSS ≤ 25 mg/L. Class 3: BOD₅ ≤ 15 mg/L, TSS ≤ 15 mg/L.",
      },
      {
        name: "Effluent Limits Reference (O. Reg. 347)",
        formula: "Class 2: BOD ≤ 25 mg/L, TSS ≤ 25 mg/L | Class 3: BOD ≤ 15 mg/L, TSS ≤ 15 mg/L",
        units: "mg/L",
        variables: [
          { sym: "Class 2", desc: "BOD₅ ≤ 25 mg/L, TSS ≤ 25 mg/L, Cl₂ residual ≤ 0.02 mg/L" },
          { sym: "Class 3", desc: "BOD₅ ≤ 15 mg/L, TSS ≤ 15 mg/L, E. coli ≤ 200 CFU/100 mL" },
          { sym: "Class 4", desc: "BOD₅ ≤ 10 mg/L, TSS ≤ 10 mg/L, TN ≤ 15 mg/L, TP ≤ 1 mg/L" },
        ],
        example: {
          problem: "A Class 2 plant reports effluent BOD = 28 mg/L. Is this a compliance issue?",
          solution: "Yes. Class 2 limit is BOD₅ ≤ 25 mg/L.\n28 mg/L exceeds the limit by 3 mg/L.\nOperator must investigate cause and take corrective action.",
          answer: "Non-compliant — exceeds 25 mg/L limit",
        },
        tip: "Limits are monthly averages. Single-sample exceedances trigger investigation. Adverse conditions must be reported to the Director within 1 hour.",
      },
    ],
  },
  {
    id: "disinfection",
    label: "Disinfection",
    icon: "🧪",
    color: "#0F766E",
    bg: "#F0FDFA",
    formulas: [
      {
        name: "Chlorine Dose",
        formula: "Dose = Demand + Residual",
        units: "mg/L",
        variables: [
          { sym: "Dose", desc: "Total chlorine applied (mg/L)" },
          { sym: "Demand", desc: "Chlorine consumed by organic matter, ammonia, etc. (mg/L)" },
          { sym: "Residual", desc: "Chlorine remaining after demand is satisfied (mg/L)" },
        ],
        example: {
          problem: "Chlorine demand = 4.5 mg/L, target residual = 0.5 mg/L. What dose is required?",
          solution: "Dose = 4.5 + 0.5 = 5.0 mg/L",
          answer: "5.0 mg/L",
        },
        tip: "Ontario effluent limit: total residual chlorine ≤ 0.02 mg/L (to protect receiving water). Dechlorination with sodium bisulfite or sodium thiosulfate is common.",
      },
      {
        name: "Chlorine Feed Rate",
        formula: "Feed rate = Q × Dose ÷ 1000",
        units: "kg/d",
        variables: [
          { sym: "Q", desc: "Flow rate (m³/d)" },
          { sym: "Dose", desc: "Chlorine dose (mg/L = g/m³)" },
        ],
        example: {
          problem: "Q = 12,000 m³/d, chlorine dose = 5 mg/L. What is the daily chlorine feed rate?",
          solution: "Feed rate = 12,000 × 5 ÷ 1000 = 60 kg/d",
          answer: "60 kg/d",
        },
        tip: "For liquid sodium hypochlorite (12.5% available Cl₂): volume = kg Cl₂ ÷ (density × concentration). Always verify with calibration.",
      },
      {
        name: "CT Value (Disinfection Efficacy)",
        formula: "CT = C × t",
        units: "mg/L·min",
        variables: [
          { sym: "C", desc: "Disinfectant residual concentration (mg/L)" },
          { sym: "t", desc: "Contact time (minutes)" },
        ],
        example: {
          problem: "Chlorine residual = 0.5 mg/L, contact time = 30 minutes. What is the CT value?",
          solution: "CT = 0.5 × 30 = 15 mg/L·min",
          answer: "15 mg/L·min",
        },
        tip: "Higher CT = more disinfection. Effective CT for 3-log Giardia inactivation at 10°C with free chlorine: ~165 mg/L·min. UV disinfection uses dose (mJ/cm²) instead of CT.",
      },
      {
        name: "UV Dose (Disinfection)",
        formula: "UV Dose = Irradiance × Exposure Time",
        units: "mJ/cm²",
        variables: [
          { sym: "Irradiance", desc: "UV intensity at the target point (mW/cm²)" },
          { sym: "Exposure Time", desc: "Time water is exposed to UV (seconds)" },
        ],
        example: {
          problem: "UV irradiance = 10 mW/cm², exposure time = 4 seconds. What is the UV dose?",
          solution: "UV Dose = 10 × 4 = 40 mJ/cm²",
          answer: "40 mJ/cm²",
        },
        tip: "Ontario requires UV dose ≥ 40 mJ/cm² for 3-log E. coli inactivation. UV effectiveness depends on UVT (UV transmittance) of the effluent — lower UVT = lower dose delivered.",
      },
    ],
  },
  {
    id: "collection",
    label: "Collection Systems",
    icon: "🌊",
    color: "#1E3A5F",
    bg: "#EFF6FF",
    formulas: [
      {
        name: "Manning's Equation (Gravity Sewer)",
        formula: "Q = (1/n) × A × R^(2/3) × S^(1/2)",
        units: "m³/s",
        variables: [
          { sym: "n", desc: "Manning's roughness coefficient (PVC: 0.009–0.011, concrete: 0.012–0.015)" },
          { sym: "A", desc: "Cross-sectional area of flow (m²)" },
          { sym: "R", desc: "Hydraulic radius = A/P (m), where P = wetted perimeter" },
          { sym: "S", desc: "Slope of hydraulic grade line (m/m)" },
        ],
        example: {
          problem: "A 300 mm PVC pipe (n = 0.010) flows full at slope S = 0.005. What is Q?",
          solution: "A = π × (0.15)² = 0.0707 m²\nP = π × 0.30 = 0.942 m\nR = 0.0707 ÷ 0.942 = 0.075 m\nQ = (1/0.010) × 0.0707 × (0.075)^(2/3) × (0.005)^(1/2)\n= 100 × 0.0707 × 0.179 × 0.0707 = 0.0895 m³/s = 89.5 L/s",
          answer: "89.5 L/s",
        },
        tip: "Minimum self-cleaning velocity: 0.6 m/s (2 ft/s). Maximum velocity to prevent scour: 3.0 m/s. Design pipes to flow at 50–75% full.",
      },
      {
        name: "Hazen-Williams (Pressure Main)",
        formula: "V = 0.8492 × C × R^0.63 × S^0.54",
        units: "m/s",
        variables: [
          { sym: "C", desc: "Hazen-Williams C-factor (PVC: 150, new cast iron: 130, old CI: 80–100)" },
          { sym: "R", desc: "Hydraulic radius (m)" },
          { sym: "S", desc: "Hydraulic slope (m/m)" },
        ],
        example: {
          problem: "What does a higher C-factor indicate?",
          solution: "A higher C-factor means a smoother pipe with less friction loss.\nPVC (C=150) has much less head loss than old tuberculated cast iron (C=80).",
          answer: "Higher C = smoother pipe = less friction loss",
        },
        tip: "For force mains, use Hazen-Williams or Darcy-Weisbach. Head loss increases significantly as pipes age and C-factor drops.",
      },
      {
        name: "Inflow & Infiltration (I/I) Rate",
        formula: "I/I = (Q_wet − Q_dry) ÷ L_sewer",
        units: "L/s·km  or  m³/d·km",
        variables: [
          { sym: "Q_wet", desc: "Wet-weather peak flow (L/s)" },
          { sym: "Q_dry", desc: "Dry-weather average flow (L/s)" },
          { sym: "L_sewer", desc: "Length of sewer being analyzed (km)" },
        ],
        example: {
          problem: "Q_wet = 450 L/s, Q_dry = 150 L/s, sewer length = 5 km. What is the I/I rate?",
          solution: "I/I = (450 − 150) ÷ 5 = 300 ÷ 5 = 60 L/s·km",
          answer: "60 L/s·km",
        },
        tip: "Ontario benchmark: I/I > 0.28 L/s·km (1 gpd/inch-diameter/mile) is considered excessive. High I/I overloads treatment plants and causes SSOs.",
      },
      {
        name: "Peaking Factor",
        formula: "PF = Q_peak ÷ Q_average",
        units: "dimensionless",
        variables: [
          { sym: "Q_peak", desc: "Peak flow rate (L/s or m³/d)" },
          { sym: "Q_average", desc: "Average daily flow rate (L/s or m³/d)" },
        ],
        example: {
          problem: "Average daily flow = 5,000 m³/d, peak hourly flow = 15,000 m³/d. What is the peaking factor?",
          solution: "PF = 15,000 ÷ 5,000 = 3.0",
          answer: "Peaking factor = 3.0",
        },
        tip: "Typical peaking factors: residential 2.5–4.0, commercial 2.0–3.0. Higher PF for smaller systems. Design sewers and treatment for peak flow.",
      },
      {
        name: "Lift Station Wet Well Volume",
        formula: "V_ww = Q_avg × t_cycle ÷ 4",
        units: "m³",
        variables: [
          { sym: "Q_avg", desc: "Average inflow rate (m³/min)" },
          { sym: "t_cycle", desc: "Desired pump cycle time (min)" },
        ],
        example: {
          problem: "Average inflow = 0.5 m³/min, desired cycle time = 20 min. What is the minimum wet well volume?",
          solution: "V_ww = 0.5 × 20 ÷ 4 = 2.5 m³",
          answer: "2.5 m³ minimum active storage",
        },
        tip: "Minimum cycle time prevents motor overheating (typically 6–10 starts/hour max). Larger wet well = fewer starts but more septicity risk.",
      },
      {
        name: "Force Main Velocity",
        formula: "V = Q ÷ A",
        units: "m/s",
        variables: [
          { sym: "Q", desc: "Pump flow rate (m³/s)" },
          { sym: "A", desc: "Pipe cross-sectional area = π × (D/2)² (m²)" },
        ],
        example: {
          problem: "Pump delivers 50 L/s through a 200 mm force main. What is the velocity?",
          solution: "Q = 0.050 m³/s\nA = π × (0.10)² = 0.03142 m²\nV = 0.050 ÷ 0.03142 = 1.59 m/s",
          answer: "1.59 m/s",
        },
        tip: "Minimum force main velocity: 0.6–0.9 m/s to prevent solids settling. Maximum: 2.5–3.0 m/s to prevent scour and water hammer.",
      },
    ],
  },
  {
    id: "laboratory",
    label: "Laboratory Analysis",
    icon: "🧪",
    color: "#7C3AED",
    bg: "#F5F3FF",
    formulas: [
      {
        name: "BOD₅ Calculation",
        formula: "BOD₅ = (DO_initial − DO_final) × dilution factor",
        units: "mg/L",
        variables: [
          { sym: "DO_initial", desc: "Initial dissolved oxygen of diluted sample (mg/L)" },
          { sym: "DO_final", desc: "Final DO after 5-day incubation at 20°C (mg/L)" },
          { sym: "Dilution factor", desc: "Total volume ÷ sample volume" },
        ],
        example: {
          problem: "10 mL sample in 300 mL bottle. DO_initial = 8.5 mg/L, DO_final = 4.2 mg/L. What is BOD₅?",
          solution: "Dilution factor = 300 ÷ 10 = 30\nBOD₅ = (8.5 − 4.2) × 30 = 4.3 × 30 = 129 mg/L",
          answer: "129 mg/L BOD₅",
        },
        tip: "Valid BOD test: DO depletion ≥ 2 mg/L and final DO ≥ 1 mg/L. Seed correction needed if using seeded dilution water.",
      },
      {
        name: "Total Suspended Solids (TSS)",
        formula: "TSS = (W_filter+dry − W_filter) ÷ V_sample × 1000",
        units: "mg/L",
        variables: [
          { sym: "W_filter+dry", desc: "Weight of filter + dried residue (g)" },
          { sym: "W_filter", desc: "Weight of pre-dried filter (g)" },
          { sym: "V_sample", desc: "Volume of sample filtered (mL)" },
        ],
        example: {
          problem: "Filter weight = 0.1523 g. After filtering 100 mL and drying: 0.1589 g. What is TSS?",
          solution: "TSS = (0.1589 − 0.1523) ÷ 100 × 1000\n= 0.0066 ÷ 100 × 1000 = 66 mg/L",
          answer: "66 mg/L TSS",
        },
        tip: "Dry at 103–105°C. VSS = TSS − FSS (fixed suspended solids, ignited at 550°C). VSS/TSS ratio indicates organic fraction of sludge.",
      },
      {
        name: "Settleable Solids (Imhoff Cone)",
        formula: "SS = volume settled after 1 hour",
        units: "mL/L",
        variables: [
          { sym: "SS", desc: "Settleable solids (mL/L)" },
        ],
        example: {
          problem: "After 1 hour in an Imhoff cone, 12 mL of solids settled from a 1 L sample. What is the settleable solids value?",
          solution: "SS = 12 mL/L",
          answer: "12 mL/L",
        },
        tip: "Primary clarifier effluent target: < 1 mL/L settleable solids. Used as a quick operational test. Imhoff cone volume = 1 L.",
      },
      {
        name: "Dissolved Oxygen — Winkler Titration",
        formula: "DO = V_thiosulfate × N_thiosulfate × 8000 ÷ V_sample",
        units: "mg/L",
        variables: [
          { sym: "V_thiosulfate", desc: "Volume of sodium thiosulfate titrant used (mL)" },
          { sym: "N_thiosulfate", desc: "Normality of thiosulfate (typically 0.025 N)" },
          { sym: "8000", desc: "Equivalent weight of O₂ × 1000 (mg/meq × mL/L)" },
          { sym: "V_sample", desc: "Volume of sample titrated (mL)" },
        ],
        example: {
          problem: "5.6 mL of 0.025 N thiosulfate used to titrate 200 mL sample. What is the DO?",
          solution: "DO = 5.6 × 0.025 × 8000 ÷ 200 = 1120 ÷ 200 = 5.6 mg/L",
          answer: "5.6 mg/L DO",
        },
        tip: "Winkler method is the reference method for DO. Azide modification used for samples with nitrite. Membrane electrode method is faster for routine monitoring.",
      },
      {
        name: "Turbidity — Nephelometric (NTU)",
        formula: "Turbidity (NTU) = I_scattered ÷ I_incident × calibration factor",
        units: "NTU",
        variables: [
          { sym: "NTU", desc: "Nephelometric Turbidity Units" },
        ],
        example: {
          problem: "What is the Ontario effluent turbidity limit for filtered water?",
          solution: "O. Reg. 170/03: Filtered water turbidity ≤ 1 NTU at all times, ≤ 0.3 NTU in 95% of samples.",
          answer: "≤ 1 NTU (max), ≤ 0.3 NTU (95th percentile)",
        },
        tip: "Turbidity is a surrogate for pathogen removal. High turbidity interferes with disinfection. Wastewater effluent turbidity limits vary by plant class.",
      },
    ],
  },
  {
    id: "safety",
    label: "Safety & Confined Space",
    icon: "🦺",
    color: "#B91C1C",
    bg: "#FEF2F2",
    formulas: [
      {
        name: "Hydrogen Sulfide (H₂S) — Key Thresholds",
        formula: "H₂S: TLV-TWA = 1 ppm | STEL = 5 ppm | IDLH = 50 ppm",
        units: "ppm (parts per million by volume)",
        variables: [
          { sym: "TLV-TWA", desc: "Threshold Limit Value — Time-Weighted Average (8-hour workday)" },
          { sym: "STEL", desc: "Short-Term Exposure Limit (15-minute maximum)" },
          { sym: "IDLH", desc: "Immediately Dangerous to Life or Health" },
        ],
        example: {
          problem: "An operator detects 10 ppm H₂S in a manhole. What action is required?",
          solution: "10 ppm exceeds the STEL (5 ppm) and approaches dangerous levels.\nImmediate action: do not enter, ventilate, re-test, use SCBA if entry required.\nAt 50 ppm (IDLH): immediately evacuate, no entry without full SCBA.",
          answer: "Do not enter; ventilate and re-test before entry",
        },
        tip: "H₂S is heavier than air (sinks to low points). Olfactory fatigue at ~100 ppm — you lose the ability to smell it. Always use gas detector, never rely on smell.",
      },
      {
        name: "Chlorine Gas — Key Thresholds",
        formula: "Cl₂: TLV-C = 0.5 ppm | IDLH = 10 ppm",
        units: "ppm",
        variables: [
          { sym: "TLV-C", desc: "Ceiling value — must not be exceeded at any time" },
          { sym: "IDLH", desc: "Immediately Dangerous to Life or Health" },
        ],
        example: {
          problem: "A chlorine leak is detected at 2 ppm in the chlorine room. What is the appropriate response?",
          solution: "2 ppm exceeds the TLV-C (0.5 ppm ceiling).\nImmediate evacuation required. Do not re-enter without SCBA.\nActivate emergency response plan, notify supervisor, call emergency services if needed.",
          answer: "Evacuate immediately; use SCBA for re-entry",
        },
        tip: "Chlorine is heavier than air. Emergency kit (chlorine B-kit for 68 kg cylinders, C-kit for 907 kg ton containers) must be available. Annual emergency drills required.",
      },
      {
        name: "Confined Space Atmospheric Testing Order",
        formula: "Test sequence: O₂ → Flammable gases → Toxic gases (H₂S, CO)",
        units: "N/A — procedural",
        variables: [
          { sym: "O₂ safe range", desc: "19.5% – 23.5% by volume" },
          { sym: "LEL threshold", desc: "< 10% of Lower Explosive Limit before entry" },
          { sym: "H₂S action level", desc: "< 1 ppm (TLV-TWA) for entry without SCBA" },
        ],
        example: {
          problem: "O₂ reading = 18.0% in a manhole. What does this indicate and what action is required?",
          solution: "18.0% O₂ is below the safe minimum of 19.5% — oxygen-deficient atmosphere.\nDo not enter. Ventilate with forced-air blower until O₂ ≥ 19.5%.\nRe-test before entry. Entry requires continuous monitoring.",
          answer: "Oxygen-deficient — do not enter; ventilate and re-test",
        },
        tip: "O₂ > 23.5% is oxygen-enriched (fire hazard). Always test in the order O₂ → flammable → toxic. Test at top, middle, and bottom of space.",
      },
      {
        name: "LOTO — Lockout/Tagout Energy Verification",
        formula: "Zero-energy state: V = 0, P = 0, T = ambient, springs released",
        units: "N/A — procedural",
        variables: [
          { sym: "V", desc: "Voltage (electrical energy = 0)" },
          { sym: "P", desc: "Pressure (pneumatic/hydraulic = 0)" },
          { sym: "T", desc: "Temperature (thermal energy = ambient)" },
        ],
        example: {
          problem: "Before entering a pump wet well for maintenance, what LOTO steps are required?",
          solution: "1. Notify affected workers\n2. Identify all energy sources (electrical, mechanical, hydraulic)\n3. Shut down equipment using normal stop procedure\n4. Isolate all energy sources (open disconnect, close valves)\n5. Apply personal lock(s) to each isolation point\n6. Release/restrain stored energy (bleed pressure, block gravity)\n7. Verify zero energy state (try to start, test voltage)",
          answer: "7-step LOTO procedure; verify zero energy before entry",
        },
        tip: "Each worker must apply their own personal lock. Group lockout box used when multiple workers are involved. Never remove another worker's lock.",
      },
    ],
  },
];

// ── FORMULA CARD ─────────────────────────────────────────────────────────────
function FormulaCard({ formula, color, bg }: { formula: Formula; color: string; bg: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      border: "1px solid #E5E7EB",
      overflow: "hidden",
      transition: "box-shadow 0.2s",
      boxShadow: expanded ? "0 4px 20px rgba(0,0,0,0.08)" : "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: "16px 20px",
          cursor: "pointer",
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
          background: expanded ? bg : "#fff",
          transition: "background 0.2s",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>
            {formula.name}
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
            fontSize: 13,
            fontWeight: 700,
            color: color,
            background: `${color}12`,
            padding: "6px 12px",
            borderRadius: 8,
            display: "inline-block",
            letterSpacing: "0.02em",
          }}>
            {formula.formula}
          </div>
          {formula.units && (
            <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 4, fontWeight: 600 }}>
              Units: {formula.units}
            </div>
          )}
        </div>
        <div style={{
          fontSize: 11,
          color: expanded ? color : "#94A3B8",
          fontWeight: 700,
          flexShrink: 0,
          marginTop: 2,
          transition: "color 0.15s",
        }}>
          {expanded ? "▲ Less" : "▼ More"}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: "0 20px 20px" }}>
          {/* Variables */}
          {formula.variables && formula.variables.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.1em", marginBottom: 8 }}>
                VARIABLES
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {formula.variables.map((v, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                    <span style={{
                      fontFamily: "monospace",
                      fontSize: 12,
                      fontWeight: 800,
                      color: color,
                      minWidth: 80,
                      flexShrink: 0,
                    }}>{v.sym}</span>
                    <span style={{ fontSize: 11, color: "#374151" }}>{v.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Worked example */}
          {formula.example && (
            <div style={{
              background: "#F8FAFC",
              borderRadius: 10,
              padding: "14px 16px",
              marginBottom: 12,
              border: "1px solid #E5E7EB",
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.1em", marginBottom: 8 }}>
                WORKED EXAMPLE
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#0F172A", marginBottom: 10, lineHeight: 1.5 }}>
                {formula.example.problem}
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: "#374151",
                background: "#fff",
                borderRadius: 8,
                padding: "10px 12px",
                marginBottom: 10,
                border: "1px solid #E5E7EB",
                whiteSpace: "pre-line",
                lineHeight: 1.7,
              }}>
                {formula.example.solution}
              </div>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: `${color}15`,
                color: color,
                padding: "5px 12px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 800,
              }}>
                ✓ Answer: {formula.example.answer}
              </div>
            </div>
          )}

          {/* Tip */}
          {formula.tip && (
            <div style={{
              background: "#F0FDFA",
              borderRadius: 8,
              padding: "10px 14px",
              borderLeft: "3px solid #0F766E",
              fontSize: 11,
              color: "#134E4A",
              lineHeight: 1.6,
            }}>
              <span style={{ fontWeight: 700, color: "#0F766E" }}>💡 Exam Tip: </span>
              {formula.tip}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function FormulasWW2() {
  usePageMeta({
    title: "Class 2 Wastewater Formula Sheet",
    description: "Complete Class 2 Wastewater Treatment formula sheet: activated sludge, SRT, SVI, F:M ratio, BNR, biosolids, collection systems, and safety thresholds for Ontario operator exams.",
    path: "/formulas-ww2",
    keywords: "Class 2 wastewater formulas, SRT, SVI, F:M ratio, MLSS, BNR, biosolids, Manning's equation, Ontario operator exam",
  });
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = CATEGORIES.map(cat => ({
    ...cat,
    formulas: cat.formulas.filter(f => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        f.formula.toLowerCase().includes(q) ||
        (f.tip?.toLowerCase().includes(q) ?? false) ||
        (f.example?.problem.toLowerCase().includes(q) ?? false)
      );
    }),
  })).filter(cat => {
    if (activeCategory && cat.id !== activeCategory) return false;
    return cat.formulas.length > 0;
  });

  const totalFormulas = CATEGORIES.reduce((sum, c) => sum + c.formulas.length, 0);

  const BRAND = "#0F766E";

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Sora', 'Inter', sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .cat-chip:hover { opacity: 0.85; transform: translateY(-1px); }
        .search-input:focus { outline: none; border-color: #0F766E !important; box-shadow: 0 0 0 3px rgba(15,118,110,0.15); }
        @media (max-width: 640px) {
          .formulas-content { padding: 16px 14px 60px !important; }
        }
      `}</style>

      <SiteNav currentPath="/formulas-ww2" />

      {/* HERO */}
      <div style={{
        background: `linear-gradient(135deg, #0F766E 0%, #065F46 60%, #134E4A 100%)`,
        padding: "72px 24px 48px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "6px 16px", marginBottom: 20 }}>
            <span style={{ fontSize: 16 }}>♻️</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "0.08em" }}>CLASS 2 WASTEWATER TREATMENT</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: "#fff", margin: "0 0 12px", lineHeight: 1.2 }}>
            Formula Sheet
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.85)", margin: "0 0 24px", lineHeight: 1.6 }}>
            {totalFormulas} formulas across 6 modules — activated sludge, BNR, biosolids, collection systems, lab analysis, and safety. Each with worked examples and exam tips.
          </p>
          <div className="formulas-hero-btns" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/class2-ww">
              <span style={{ background: "#fff", color: BRAND, padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", textDecoration: "none" }}>
                ← Practice Quiz
              </span>
            </Link>
            <Link href="/class2-ww-mock">
              <span style={{ background: "rgba(255,255,255,0.15)", color: "#fff", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", textDecoration: "none", border: "1px solid rgba(255,255,255,0.3)" }}>
                Mock Exam →
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* QUICK REFERENCE STRIP */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "16px 24px", overflowX: "auto" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.1em", marginBottom: 10 }}>
            QUICK REFERENCE
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              { label: "SVI", f: "SV₃₀ × 1000 ÷ MLSS", unit: "mL/g", color: BRAND },
              { label: "SRT", f: "V × MLSS ÷ (Qw × WAS + Qe × TSS_e)", unit: "days", color: BRAND },
              { label: "F:M", f: "BOD × Q ÷ (V × MLVSS)", unit: "kg/kg·d", color: "#15803D" },
              { label: "RAS ratio", f: "SV₃₀ ÷ (1000 − SV₃₀)", unit: "%", color: BRAND },
              { label: "O₂ (nitrif.)", f: "4.57 × ΔNH₄", unit: "kg/kg N", color: "#15803D" },
              { label: "VSR", f: "(VS_in − VS_out) ÷ VS_in × 100", unit: "%", color: "#92400E" },
              { label: "Manning's Q", f: "(1/n) × A × R^(2/3) × S^(1/2)", unit: "m³/s", color: "#1E3A5F" },
              { label: "BOD₅", f: "(DO_i − DO_f) × dilution", unit: "mg/L", color: "#7C3AED" },
              { label: "H₂S IDLH", f: "50 ppm", unit: "", color: "#B91C1C" },
              { label: "Cl₂ TLV-C", f: "0.5 ppm", unit: "", color: "#B91C1C" },
            ].map((item, i) => (
              <div key={i} style={{
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                padding: "8px 12px",
                minWidth: 140,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: item.color, marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontFamily: "monospace", fontSize: 11, color: "#334155", lineHeight: 1.4 }}>{item.f}</div>
                {item.unit && <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 2 }}>{item.unit}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="formulas-content" style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 80px" }}>
        {/* Search + filter */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <input
            className="search-input"
            type="text"
            placeholder="Search formulas..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              flex: 1, minWidth: 200, padding: "10px 14px", borderRadius: 8,
              border: "1.5px solid #E2E8F0", fontSize: 13, fontFamily: "inherit",
              background: "#fff", color: "#0F172A",
            }}
          />
          <button
            onClick={() => { setSearchQuery(""); setActiveCategory(null); }}
            style={{
              padding: "10px 16px", borderRadius: 8, border: "1.5px solid #E2E8F0",
              background: "#fff", color: "#64748B", fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Clear
          </button>
        </div>

        {/* Category chips */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          <button
            className="cat-chip"
            onClick={() => setActiveCategory(null)}
            style={{
              padding: "7px 14px", borderRadius: 20, border: "1.5px solid",
              borderColor: activeCategory === null ? BRAND : "#E2E8F0",
              background: activeCategory === null ? BRAND : "#fff",
              color: activeCategory === null ? "#fff" : "#64748B",
              fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            All ({totalFormulas})
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className="cat-chip"
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              style={{
                padding: "7px 14px", borderRadius: 20, border: "1.5px solid",
                borderColor: activeCategory === cat.id ? cat.color : "#E2E8F0",
                background: activeCategory === cat.id ? cat.color : "#fff",
                color: activeCategory === cat.id ? "#fff" : "#64748B",
                fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              {cat.icon} {cat.label} ({cat.formulas.length})
            </button>
          ))}
        </div>

        {/* Formula sections */}
        {filteredCategories.map(cat => (
          <div key={cat.id} id={cat.id} style={{ marginBottom: 36, scrollMarginTop: 80, animation: "fadeUp 0.3s ease both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: cat.bg, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, border: `1px solid ${cat.color}30`,
              }}>
                {cat.icon}
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: 0 }}>{cat.label}</h2>
                <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>{cat.formulas.length} formulas</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {cat.formulas.map((formula, i) => (
                <FormulaCard key={i} formula={formula} color={cat.color} bg={cat.bg} />
              ))}
            </div>
          </div>
        ))}

        {filteredCategories.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94A3B8" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>No formulas match "{searchQuery}"</div>
            <button onClick={() => setSearchQuery("")} style={{ marginTop: 12, padding: "8px 16px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
              Clear search
            </button>
          </div>
        )}

        {/* Footer nav */}
        <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 24, marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/class2-ww">
            <span style={{ padding: "10px 18px", borderRadius: 8, background: BRAND, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", textDecoration: "none" }}>
              ♻️ Practice Quiz
            </span>
          </Link>
          <Link href="/class2-ww-mock">
            <span style={{ padding: "10px 18px", borderRadius: 8, background: "#F0FDFA", color: BRAND, fontSize: 13, fontWeight: 700, cursor: "pointer", textDecoration: "none", border: `1px solid ${BRAND}30` }}>
              📋 Mock Exam
            </span>
          </Link>
          <Link href="/formulas">
            <span style={{ padding: "10px 18px", borderRadius: 8, background: "#F8FAFC", color: "#475569", fontSize: 13, fontWeight: 700, cursor: "pointer", textDecoration: "none", border: "1px solid #E2E8F0" }}>
              📐 General Formula Sheet
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
