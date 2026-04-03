// Class 1 Wastewater Treatment — Formula Sheet
// Covers: Wastewater Characteristics, Primary/Secondary Treatment, Disinfection, Solids, Collection Systems
// Design: Teal/blue brand, mirrors FormulasWW2.tsx structure

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
    id: "wastewater-characteristics",
    label: "Wastewater Characteristics",
    icon: "🌊",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    formulas: [
      {
        name: "BOD Removal Efficiency",
        formula: "E (%) = [(BOD_in − BOD_out) ÷ BOD_in] × 100",
        units: "%",
        variables: [
          { sym: "E", desc: "Removal efficiency (%)" },
          { sym: "BOD_in", desc: "Influent BOD concentration (mg/L)" },
          { sym: "BOD_out", desc: "Effluent BOD concentration (mg/L)" },
        ],
        example: {
          problem: "Influent BOD = 220 mg/L, effluent BOD = 22 mg/L. What is the removal efficiency?",
          solution: "E = [(220 − 22) ÷ 220] × 100 = (198 ÷ 220) × 100",
          answer: "90%",
        },
        tip: "Secondary treatment typically achieves 85–95% BOD removal. Primary treatment alone achieves 25–40%.",
      },
      {
        name: "Suspended Solids Removal",
        formula: "SS Removal (%) = [(SS_in − SS_out) ÷ SS_in] × 100",
        units: "%",
        variables: [
          { sym: "SS_in", desc: "Influent suspended solids (mg/L)" },
          { sym: "SS_out", desc: "Effluent suspended solids (mg/L)" },
        ],
        example: {
          problem: "Influent SS = 240 mg/L, effluent SS = 18 mg/L. What is the SS removal?",
          solution: "SS Removal = [(240 − 18) ÷ 240] × 100 = (222 ÷ 240) × 100",
          answer: "92.5%",
        },
        tip: "Ontario effluent limits under O. Reg. 347 typically require ≤ 25 mg/L TSS and ≤ 25 mg/L CBOD₅.",
      },
      {
        name: "Per Capita BOD Loading",
        formula: "BOD Load (kg/d) = Flow (m³/d) × BOD (mg/L) × 10⁻³",
        units: "kg/d",
        variables: [
          { sym: "Flow", desc: "Daily flow rate (m³/d)" },
          { sym: "BOD", desc: "BOD concentration (mg/L)" },
          { sym: "10⁻³", desc: "Unit conversion factor (mg/L × m³/d → kg/d)" },
        ],
        example: {
          problem: "Flow = 5,000 m³/d, BOD = 200 mg/L. What is the BOD load?",
          solution: "BOD Load = 5,000 × 200 × 0.001",
          answer: "1,000 kg/d",
        },
        tip: "Typical domestic wastewater: 200–300 mg/L BOD. Per capita load ≈ 54 g BOD/person/day.",
      },
      {
        name: "Population Equivalent (PE)",
        formula: "PE = BOD Load (kg/d) ÷ 0.054",
        units: "persons",
        variables: [
          { sym: "PE", desc: "Population equivalent (persons)" },
          { sym: "BOD Load", desc: "Total BOD load (kg/d)" },
          { sym: "0.054", desc: "Per capita BOD load (54 g/person/day = 0.054 kg/person/day)" },
        ],
        example: {
          problem: "A plant receives a BOD load of 540 kg/d. What is the PE?",
          solution: "PE = 540 ÷ 0.054",
          answer: "10,000 persons",
        },
        tip: "PE is used to size treatment plants and compare industrial to domestic loads.",
      },
    ],
  },
  {
    id: "primary-treatment",
    label: "Primary Treatment",
    icon: "🪣",
    color: "#15803D",
    bg: "#F0FDF4",
    formulas: [
      {
        name: "Hydraulic Detention Time (HDT)",
        formula: "HDT = V ÷ Q",
        units: "hours or days",
        variables: [
          { sym: "HDT", desc: "Hydraulic detention time" },
          { sym: "V", desc: "Tank volume (m³ or L)" },
          { sym: "Q", desc: "Flow rate (m³/h or L/h)" },
        ],
        example: {
          problem: "Primary clarifier volume = 1,200 m³, flow = 300 m³/h. What is the HDT?",
          solution: "HDT = 1,200 ÷ 300",
          answer: "4 hours",
        },
        tip: "Typical primary clarifier HDT: 1.5–2.5 hours. Secondary clarifier HDT: 2–4 hours.",
      },
      {
        name: "Surface Overflow Rate (SOR)",
        formula: "SOR = Q ÷ A",
        units: "m³/m²·d  or  m/d",
        variables: [
          { sym: "SOR", desc: "Surface overflow rate (m³/m²·d)" },
          { sym: "Q", desc: "Flow rate (m³/d)" },
          { sym: "A", desc: "Surface area of clarifier (m²)" },
        ],
        example: {
          problem: "Flow = 4,800 m³/d, clarifier diameter = 20 m. What is the SOR?",
          solution: "A = π × (10)² = 314.2 m²; SOR = 4,800 ÷ 314.2",
          answer: "15.3 m³/m²·d",
        },
        tip: "Primary clarifier SOR: 24–48 m³/m²·d. Secondary clarifier SOR: 16–32 m³/m²·d.",
      },
      {
        name: "Weir Overflow Rate (WOR)",
        formula: "WOR = Q ÷ L_weir",
        units: "m³/m·d",
        variables: [
          { sym: "WOR", desc: "Weir overflow rate (m³/m·d)" },
          { sym: "Q", desc: "Flow rate (m³/d)" },
          { sym: "L_weir", desc: "Total weir length (m)" },
        ],
        example: {
          problem: "Flow = 4,800 m³/d, circular clarifier diameter = 20 m. What is the WOR?",
          solution: "Weir length = π × 20 = 62.8 m; WOR = 4,800 ÷ 62.8",
          answer: "76.4 m³/m·d",
        },
        tip: "Typical WOR limit: < 125 m³/m·d for primary, < 186 m³/m·d for secondary.",
      },
      {
        name: "Sludge Volume (Primary)",
        formula: "Sludge Volume (m³/d) = [Q × SS_removed (mg/L)] ÷ [ρ_sludge × %solids × 10⁶]",
        units: "m³/d",
        variables: [
          { sym: "Q", desc: "Flow rate (m³/d)" },
          { sym: "SS_removed", desc: "Suspended solids removed (mg/L)" },
          { sym: "ρ_sludge", desc: "Sludge density (≈ 1,000 kg/m³ for dilute sludge)" },
          { sym: "%solids", desc: "Sludge solids content (decimal, e.g. 0.04 for 4%)" },
        ],
        example: {
          problem: "Q = 5,000 m³/d, SS removed = 150 mg/L, sludge is 4% solids. What volume of sludge is produced?",
          solution: "Sludge = (5,000 × 150) ÷ (1,000 × 0.04 × 10⁶) = 750,000 ÷ 40,000,000",
          answer: "18.75 m³/d",
        },
        tip: "Primary sludge is typically 3–8% solids. Raw primary sludge has high putrescibility — pump frequently.",
      },
    ],
  },
  {
    id: "secondary-treatment",
    label: "Secondary Treatment",
    icon: "🦠",
    color: "#6D28D9",
    bg: "#F5F3FF",
    formulas: [
      {
        name: "Food-to-Microorganism Ratio (F/M)",
        formula: "F/M = (Q × BOD_in) ÷ (V × MLVSS)",
        units: "kg BOD/kg MLVSS·d",
        variables: [
          { sym: "Q", desc: "Flow rate (m³/d)" },
          { sym: "BOD_in", desc: "Influent BOD (mg/L)" },
          { sym: "V", desc: "Aeration basin volume (m³)" },
          { sym: "MLVSS", desc: "Mixed Liquor Volatile Suspended Solids (mg/L)" },
        ],
        example: {
          problem: "Q = 3,000 m³/d, BOD_in = 200 mg/L, V = 1,500 m³, MLVSS = 2,000 mg/L. What is F/M?",
          solution: "F/M = (3,000 × 200) ÷ (1,500 × 2,000) = 600,000 ÷ 3,000,000",
          answer: "0.2 kg BOD/kg MLVSS·d",
        },
        tip: "Conventional activated sludge F/M: 0.2–0.4. Extended aeration: 0.05–0.15. High F/M → filamentous bulking risk.",
      },
      {
        name: "Sludge Volume Index (SVI)",
        formula: "SVI = (SV₃₀ × 1,000) ÷ MLSS",
        units: "mL/g",
        variables: [
          { sym: "SV₃₀", desc: "Settled sludge volume after 30 min (mL/L)" },
          { sym: "MLSS", desc: "Mixed Liquor Suspended Solids (mg/L)" },
        ],
        example: {
          problem: "SV₃₀ = 320 mL/L, MLSS = 2,500 mg/L. What is the SVI?",
          solution: "SVI = (320 × 1,000) ÷ 2,500 = 320,000 ÷ 2,500",
          answer: "128 mL/g",
        },
        tip: "Good settling: SVI 80–150 mL/g. Bulking: SVI > 200 mL/g. Pin floc: SVI < 50 mL/g.",
      },
      {
        name: "Hydraulic Retention Time (HRT)",
        formula: "HRT = V ÷ Q",
        units: "hours",
        variables: [
          { sym: "V", desc: "Aeration basin volume (m³)" },
          { sym: "Q", desc: "Influent flow rate (m³/h)" },
        ],
        example: {
          problem: "Aeration basin = 2,400 m³, flow = 200 m³/h. What is the HRT?",
          solution: "HRT = 2,400 ÷ 200",
          answer: "12 hours",
        },
        tip: "Conventional activated sludge HRT: 4–8 hours. Extended aeration: 18–36 hours.",
      },
      {
        name: "Return Activated Sludge (RAS) Rate",
        formula: "RAS (%) = [SV₃₀ ÷ (1,000 − SV₃₀)] × 100",
        units: "%",
        variables: [
          { sym: "SV₃₀", desc: "Settled sludge volume after 30 min (mL/L)" },
        ],
        example: {
          problem: "SV₃₀ = 250 mL/L. What RAS rate is required?",
          solution: "RAS = [250 ÷ (1,000 − 250)] × 100 = (250 ÷ 750) × 100",
          answer: "33%",
        },
        tip: "Typical RAS rate: 25–75% of influent flow. Higher SVI requires higher RAS to maintain MLSS.",
      },
      {
        name: "Oxygen Demand (Theoretical)",
        formula: "O₂ Required (kg/d) = BOD Load removed (kg/d) × 1.5",
        units: "kg O₂/d",
        variables: [
          { sym: "BOD Load removed", desc: "BOD removed per day (kg/d)" },
          { sym: "1.5", desc: "Approximate O₂:BOD ratio for carbonaceous oxidation" },
        ],
        example: {
          problem: "BOD removed = 800 kg/d. Estimate oxygen demand.",
          solution: "O₂ = 800 × 1.5",
          answer: "1,200 kg O₂/d",
        },
        tip: "Actual O₂ demand depends on MLSS, temperature, and nitrification. Nitrification adds ~4.6 kg O₂/kg NH₃-N.",
      },
    ],
  },
  {
    id: "disinfection",
    label: "Disinfection",
    icon: "🧪",
    color: "#C2410C",
    bg: "#FFF7ED",
    formulas: [
      {
        name: "Chlorine Dose",
        formula: "Dose (mg/L) = Demand (mg/L) + Residual (mg/L)",
        units: "mg/L",
        variables: [
          { sym: "Dose", desc: "Total chlorine applied (mg/L)" },
          { sym: "Demand", desc: "Chlorine consumed by organics/ammonia (mg/L)" },
          { sym: "Residual", desc: "Remaining chlorine after contact time (mg/L)" },
        ],
        example: {
          problem: "Chlorine demand = 3.5 mg/L, required residual = 0.5 mg/L. What dose is needed?",
          solution: "Dose = 3.5 + 0.5",
          answer: "4.0 mg/L",
        },
        tip: "Ontario O. Reg. 170/03 requires minimum 0.2 mg/L free chlorine residual in distribution. Wastewater effluent residual requirements vary by MOECP permit.",
      },
      {
        name: "CT Value",
        formula: "CT = C × t",
        units: "mg·min/L",
        variables: [
          { sym: "C", desc: "Disinfectant residual concentration (mg/L)" },
          { sym: "t", desc: "Contact time (minutes)" },
        ],
        example: {
          problem: "Chlorine residual = 1.0 mg/L, contact time = 30 minutes. What is the CT?",
          solution: "CT = 1.0 × 30",
          answer: "30 mg·min/L",
        },
        tip: "CT values are used to verify inactivation of Giardia and Cryptosporidium. Higher CT = more effective disinfection.",
      },
      {
        name: "Chlorine Feed Rate",
        formula: "Feed Rate (kg/d) = Dose (mg/L) × Flow (m³/d) × 10⁻³",
        units: "kg/d",
        variables: [
          { sym: "Dose", desc: "Chlorine dose (mg/L)" },
          { sym: "Flow", desc: "Flow rate (m³/d)" },
        ],
        example: {
          problem: "Dose = 5 mg/L, flow = 6,000 m³/d. What is the daily chlorine feed rate?",
          solution: "Feed Rate = 5 × 6,000 × 0.001",
          answer: "30 kg/d",
        },
        tip: "Convert to cylinder usage: 1 kg Cl₂ = 1 kg from 100% gas cylinders. For 12.5% sodium hypochlorite: 1 kg Cl₂ ≈ 8 L solution.",
      },
    ],
  },
  {
    id: "solids-handling",
    label: "Solids Handling & Biosolids",
    icon: "♻️",
    color: "#B91C1C",
    bg: "#FEF2F2",
    formulas: [
      {
        name: "Sludge Mass Balance",
        formula: "Sludge Produced (kg/d) = Q × (SS_in − SS_out) × 10⁻³",
        units: "kg/d",
        variables: [
          { sym: "Q", desc: "Flow rate (m³/d)" },
          { sym: "SS_in", desc: "Influent suspended solids (mg/L)" },
          { sym: "SS_out", desc: "Effluent suspended solids (mg/L)" },
        ],
        example: {
          problem: "Q = 4,000 m³/d, SS_in = 220 mg/L, SS_out = 20 mg/L. How much sludge is produced?",
          solution: "Sludge = 4,000 × (220 − 20) × 0.001 = 4,000 × 200 × 0.001",
          answer: "800 kg/d",
        },
        tip: "Net sludge production in activated sludge: typically 0.3–0.8 kg VSS/kg BOD removed, depending on SRT.",
      },
      {
        name: "Volatile Solids Reduction (Digestion)",
        formula: "VS Reduction (%) = [(VS_in − VS_out) ÷ VS_in] × 100",
        units: "%",
        variables: [
          { sym: "VS_in", desc: "Volatile solids fed to digester (kg/d)" },
          { sym: "VS_out", desc: "Volatile solids leaving digester (kg/d)" },
        ],
        example: {
          problem: "VS fed = 500 kg/d, VS out = 200 kg/d. What is the VS reduction?",
          solution: "VS Reduction = [(500 − 200) ÷ 500] × 100 = (300 ÷ 500) × 100",
          answer: "60%",
        },
        tip: "Ontario Reg. 267/03 (Biosolids) requires ≥ 38% VS reduction for Class B biosolids, ≥ 38% for Class A (with pathogen reduction).",
      },
      {
        name: "Sludge Thickening — Solids Loading Rate",
        formula: "Solids Loading (kg/m²·d) = Sludge Mass (kg/d) ÷ Thickener Area (m²)",
        units: "kg/m²·d",
        variables: [
          { sym: "Sludge Mass", desc: "Total solids applied (kg/d)" },
          { sym: "Thickener Area", desc: "Surface area of gravity thickener (m²)" },
        ],
        example: {
          problem: "Sludge = 1,200 kg/d, thickener diameter = 10 m. What is the solids loading rate?",
          solution: "A = π × 5² = 78.5 m²; Loading = 1,200 ÷ 78.5",
          answer: "15.3 kg/m²·d",
        },
        tip: "Gravity thickener design loading: 25–80 kg/m²·d for primary sludge; 20–40 kg/m²·d for WAS.",
      },
    ],
  },
  {
    id: "collection-systems",
    label: "Collection Systems & Hydraulics",
    icon: "🔧",
    color: "#0F766E",
    bg: "#F0FDFA",
    formulas: [
      {
        name: "Manning's Equation (Pipe Flow)",
        formula: "Q = (1/n) × A × R^(2/3) × S^(1/2)",
        units: "m³/s",
        variables: [
          { sym: "Q", desc: "Flow rate (m³/s)" },
          { sym: "n", desc: "Manning's roughness coefficient (0.013 for concrete)" },
          { sym: "A", desc: "Cross-sectional area of flow (m²)" },
          { sym: "R", desc: "Hydraulic radius = A ÷ wetted perimeter (m)" },
          { sym: "S", desc: "Slope of pipe (m/m)" },
        ],
        example: {
          problem: "A 600 mm concrete pipe (n = 0.013) flows full at S = 0.002. What is the flow?",
          solution: "A = π(0.3)² = 0.283 m²; R = 0.3/2 = 0.15 m; Q = (1/0.013) × 0.283 × 0.15^(2/3) × 0.002^(1/2) ≈ 0.283 m³/s",
          answer: "≈ 0.28 m³/s (280 L/s)",
        },
        tip: "For sewer design, minimum velocity = 0.6 m/s (self-cleaning). Maximum velocity = 3 m/s (erosion limit).",
      },
      {
        name: "Pump Head (Total Dynamic Head)",
        formula: "TDH = Static Head + Friction Head + Minor Losses",
        units: "m",
        variables: [
          { sym: "Static Head", desc: "Elevation difference between suction and discharge (m)" },
          { sym: "Friction Head", desc: "Head loss due to pipe friction (m)" },
          { sym: "Minor Losses", desc: "Head loss from fittings, valves, bends (m)" },
        ],
        example: {
          problem: "Static head = 12 m, friction losses = 3.5 m, minor losses = 0.5 m. What is TDH?",
          solution: "TDH = 12 + 3.5 + 0.5",
          answer: "16 m",
        },
        tip: "Pump must be selected to deliver required flow at the calculated TDH. Check pump curve for operating point.",
      },
      {
        name: "Pump Power",
        formula: "Power (kW) = (Q × ρ × g × TDH) ÷ (η × 1000)",
        units: "kW",
        variables: [
          { sym: "Q", desc: "Flow rate (m³/s)" },
          { sym: "ρ", desc: "Fluid density (1,000 kg/m³ for water)" },
          { sym: "g", desc: "Gravitational acceleration (9.81 m/s²)" },
          { sym: "TDH", desc: "Total dynamic head (m)" },
          { sym: "η", desc: "Pump efficiency (decimal, e.g. 0.75 for 75%)" },
        ],
        example: {
          problem: "Q = 0.05 m³/s, TDH = 20 m, efficiency = 75%. What is the pump power?",
          solution: "Power = (0.05 × 1,000 × 9.81 × 20) ÷ (0.75 × 1,000) = 9,810 ÷ 750",
          answer: "13.1 kW",
        },
        tip: "Motor nameplate power should exceed calculated power by 10–20% safety factor.",
      },
      {
        name: "Wet Well Volume (Pump Cycling)",
        formula: "V = (Q_in × T_on) or V ≥ (Q_pump − Q_in) × T_off",
        units: "m³",
        variables: [
          { sym: "Q_in", desc: "Inflow rate (m³/min)" },
          { sym: "Q_pump", desc: "Pump capacity (m³/min)" },
          { sym: "T_on", desc: "Pump run time (min)" },
          { sym: "T_off", desc: "Pump off time (min)" },
        ],
        example: {
          problem: "Inflow = 2 m³/min, pump capacity = 6 m³/min. What minimum wet well volume allows 5-min off time?",
          solution: "V = (6 − 2) × 5 = 4 × 5",
          answer: "20 m³",
        },
        tip: "Minimum cycle time protects pump motors. Typical minimum off time: 5–10 minutes for submersible pumps.",
      },
    ],
  },
  {
    id: "regulations-safety",
    label: "Regulations & Safety",
    icon: "📋",
    color: "#166534",
    bg: "#F0FDF4",
    formulas: [
      {
        name: "Confined Space Atmospheric Testing",
        formula: "Safe Entry: O₂ = 19.5–23%, LEL < 10%, H₂S < 10 ppm, CO < 25 ppm",
        variables: [
          { sym: "O₂", desc: "Oxygen content (19.5–23% is safe range)" },
          { sym: "LEL", desc: "Lower Explosive Limit (< 10% of LEL required)" },
          { sym: "H₂S", desc: "Hydrogen sulphide (< 10 ppm for entry)" },
          { sym: "CO", desc: "Carbon monoxide (< 25 ppm TWA)" },
        ],
        tip: "Ontario O. Reg. 632/05 (Confined Spaces) requires atmospheric testing before and during entry. Continuous monitoring required when hazards exist.",
      },
      {
        name: "Effluent Limits (O. Reg. 347 — Municipal)",
        formula: "CBOD₅ ≤ 25 mg/L | TSS ≤ 25 mg/L | pH 6.0–9.5",
        tip: "These are minimum secondary treatment standards. Individual Environmental Compliance Approvals (ECAs) may be more stringent. Phosphorus limits (e.g. 1.0 mg/L TP) apply to many Ontario plants.",
      },
      {
        name: "Biosolids Classification (O. Reg. 267/03)",
        formula: "Class B: ≥ 38% VS reduction OR fecal coliform < 2×10⁶ MPN/g TS\nClass A: ≥ 38% VS reduction AND fecal coliform < 1,000 MPN/g TS",
        tip: "Class A biosolids can be applied to agricultural land without site restrictions. Class B requires 30-day buffer from application to harvest for food crops.",
      },
      {
        name: "Chlorination Safety — TLV/TWA",
        formula: "Cl₂: TLV-TWA = 0.5 ppm | IDLH = 10 ppm\nH₂S: TLV-TWA = 1 ppm | IDLH = 50 ppm",
        variables: [
          { sym: "TLV-TWA", desc: "Threshold Limit Value — Time Weighted Average (8-hr day)" },
          { sym: "IDLH", desc: "Immediately Dangerous to Life or Health" },
        ],
        tip: "WHMIS 2015 requires SDS for all hazardous chemicals. Chlorine gas detectors must be installed in chlorination rooms. Self-contained breathing apparatus (SCBA) required for Cl₂ IDLH response.",
      },
    ],
  },
];

const BRAND = "#0369A1";

export default function FormulasWW1() {
  usePageMeta({
    title: "Class 1 Wastewater Formula Sheet — Ontario Operator Exam",
    description: "Complete formula reference for the Ontario Class 1 Wastewater Treatment operator exam. Covers BOD removal, SVI, F/M ratio, clarifier design, disinfection, solids handling, and collection system hydraulics.",
    path: "/formulas-ww1",
    keywords: "Class 1 wastewater formulas, BOD removal, SVI, F/M ratio, Manning equation, Ontario operator exam, OWWCO",
  });

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = CATEGORIES.map((cat) => ({
    ...cat,
    formulas: cat.formulas.filter((f) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        f.formula.toLowerCase().includes(q) ||
        (f.tip ?? "").toLowerCase().includes(q)
      );
    }),
  })).filter((cat) => {
    if (activeCategory && cat.id !== activeCategory) return false;
    return cat.formulas.length > 0;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Sora', sans-serif" }}>
      <SiteNav currentPath="/formulas-ww1" />

      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${BRAND} 0%, #0E7490 100%)`, padding: "36px 24px 28px", color: "#fff" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <Link href="/class1-ww" style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
            ← Back to Class 1 WW Practice
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
            <span style={{ fontSize: 36 }}>📐</span>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Class 1 Wastewater Formula Sheet</h1>
              <p style={{ margin: 0, fontSize: 14, opacity: 0.85 }}>Ontario Operator Exam Reference — 7 Categories · 25+ Formulas</p>
            </div>
          </div>
          {/* Search */}
          <input
            type="text"
            placeholder="Search formulas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", maxWidth: 480, padding: "10px 16px", borderRadius: 10, border: "none", fontSize: 14, outline: "none", marginTop: 8, boxSizing: "border-box" }}
          />
        </div>
      </div>

      {/* Category filter chips */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "12px 20px", overflowX: "auto" }}>
        <div style={{ display: "flex", gap: 8, maxWidth: 800, margin: "0 auto", flexWrap: "wrap" }}>
          <button
            onClick={() => setActiveCategory(null)}
            style={{ padding: "5px 14px", borderRadius: 20, border: "1.5px solid " + (activeCategory === null ? BRAND : "#E2E8F0"), background: activeCategory === null ? "#EFF6FF" : "#F8FAFC", color: activeCategory === null ? BRAND : "#64748B", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              style={{ padding: "5px 14px", borderRadius: 20, border: "1.5px solid " + (activeCategory === cat.id ? cat.color : "#E2E8F0"), background: activeCategory === cat.id ? cat.bg : "#F8FAFC", color: activeCategory === cat.id ? cat.color : "#64748B", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Formula cards */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "28px 16px 60px" }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94A3B8" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 16, fontWeight: 600 }}>No formulas found for "{search}"</p>
          </div>
        )}
        {filtered.map((cat) => (
          <div key={cat.id} id={cat.id} style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 22 }}>{cat.icon}</span>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: cat.color }}>{cat.label}</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {cat.formulas.map((f) => (
                <div key={f.name} style={{ background: "#fff", borderRadius: 14, border: `1.5px solid ${cat.color}22`, padding: "20px 20px 16px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>{f.name}</div>
                  <div style={{ background: cat.bg, borderRadius: 8, padding: "10px 14px", fontFamily: "monospace", fontSize: 14, color: cat.color, fontWeight: 700, marginBottom: f.variables || f.example || f.tip ? 12 : 0 }}>
                    {f.formula}
                  </div>
                  {f.units && (
                    <div style={{ fontSize: 12, color: "#64748B", marginBottom: 8 }}>Units: <strong>{f.units}</strong></div>
                  )}
                  {f.variables && f.variables.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      {f.variables.map((v) => (
                        <div key={v.sym} style={{ display: "flex", gap: 8, fontSize: 13, color: "#475569", marginBottom: 3 }}>
                          <span style={{ fontWeight: 700, color: cat.color, minWidth: 60 }}>{v.sym}</span>
                          <span>{v.desc}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {f.example && (
                    <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "10px 14px", marginBottom: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", marginBottom: 4 }}>WORKED EXAMPLE</div>
                      <div style={{ fontSize: 13, color: "#1E293B", marginBottom: 4 }}>{f.example.problem}</div>
                      <div style={{ fontSize: 13, color: "#475569", marginBottom: 4 }}>{f.example.solution}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#059669" }}>Answer: {f.example.answer}</div>
                    </div>
                  )}
                  {f.tip && (
                    <div style={{ display: "flex", gap: 8, background: "#FFFBEB", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#92400E" }}>
                      <span>💡</span>
                      <span>{f.tip}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Footer nav */}
        <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/class1-ww" style={{ textDecoration: "none" }}>
            <span style={{ background: "#EFF6FF", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, color: BRAND, cursor: "pointer" }}>← Class 1 WW Practice</span>
          </Link>
          <Link href="/class1-ww-mock" style={{ textDecoration: "none" }}>
            <span style={{ background: "#F0FDF4", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, color: "#15803D", cursor: "pointer" }}>📋 Mock Exam →</span>
          </Link>
          <Link href="/formulas-ww2" style={{ textDecoration: "none" }}>
            <span style={{ background: "#F8FAFC", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, color: "#64748B", cursor: "pointer" }}>Class 2 WW Formulas →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
