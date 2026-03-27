// ECHELON AI TUTOR — Formula Sheet
// Ontario Water & Wastewater Operator Exam Reference
// Design: Professional SaaS — Clean Dark-Accent (Sora, blue/teal brand)

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
    id: "flow",
    label: "Flow & Volume",
    icon: "💧",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    formulas: [
      {
        name: "Flow Rate (Q)",
        formula: "Q = A × V",
        units: "m³/s  or  L/s",
        variables: [
          { sym: "Q", desc: "Flow rate (m³/s or L/s)" },
          { sym: "A", desc: "Cross-sectional area (m²)" },
          { sym: "V", desc: "Velocity (m/s)" },
        ],
        example: {
          problem: "A pipe has a diameter of 0.3 m and water velocity of 1.5 m/s. What is the flow rate?",
          solution: "A = π × r² = π × (0.15)² = 0.0707 m²\nQ = 0.0707 × 1.5 = 0.106 m³/s = 106 L/s",
          answer: "106 L/s",
        },
        tip: "Remember: 1 m³/s = 1,000 L/s = 86,400 m³/day",
      },
      {
        name: "Hydraulic Loading Rate (HLR)",
        formula: "HLR = Q ÷ A",
        units: "m³/m²·d  or  m/d",
        variables: [
          { sym: "HLR", desc: "Hydraulic loading rate (m/d)" },
          { sym: "Q", desc: "Flow rate (m³/d)" },
          { sym: "A", desc: "Surface area (m²)" },
        ],
        example: {
          problem: "A clarifier has a surface area of 500 m² and receives 10,000 m³/d. What is the HLR?",
          solution: "HLR = 10,000 ÷ 500 = 20 m³/m²·d",
          answer: "20 m/d",
        },
        tip: "HLR is also called surface overflow rate (SOR). Typical clarifier HLR: 15–40 m/d.",
      },
      {
        name: "Volume of a Cylinder",
        formula: "V = π × r² × h",
        units: "m³  or  L",
        variables: [
          { sym: "V", desc: "Volume (m³)" },
          { sym: "r", desc: "Radius (m)" },
          { sym: "h", desc: "Height or depth (m)" },
        ],
        example: {
          problem: "A circular clarifier is 20 m in diameter and 3.5 m deep. What is its volume?",
          solution: "r = 10 m\nV = π × 10² × 3.5 = 3.14159 × 100 × 3.5 = 1,099.6 m³",
          answer: "1,099.6 m³ ≈ 1,099,600 L",
        },
        tip: "1 m³ = 1,000 L. Always convert diameter to radius before calculating.",
      },
      {
        name: "Detention Time (HRT)",
        formula: "HRT = V ÷ Q",
        units: "hours  or  days",
        variables: [
          { sym: "HRT", desc: "Hydraulic retention time (h or d)" },
          { sym: "V", desc: "Volume of basin (m³ or L)" },
          { sym: "Q", desc: "Flow rate (m³/h or L/h)" },
        ],
        example: {
          problem: "A sedimentation basin holds 2,400 m³ and receives 600 m³/h. What is the HRT?",
          solution: "HRT = 2,400 ÷ 600 = 4 hours",
          answer: "4 hours",
        },
        tip: "Units must match: if V is in m³ and Q is in m³/d, HRT is in days. Typical sedimentation HRT: 2–8 hours.",
      },
      {
        name: "Weir Overflow Rate (WOR)",
        formula: "WOR = Q ÷ L",
        units: "m³/m·d",
        variables: [
          { sym: "WOR", desc: "Weir overflow rate (m³/m·d)" },
          { sym: "Q", desc: "Flow rate (m³/d)" },
          { sym: "L", desc: "Total weir length (m)" },
        ],
        example: {
          problem: "A clarifier has a 62.8 m weir length and flow of 10,000 m³/d. What is the WOR?",
          solution: "WOR = 10,000 ÷ 62.8 = 159 m³/m·d",
          answer: "159 m³/m·d",
        },
        tip: "Typical WOR for clarifiers: 125–250 m³/m·d. Lower WOR = better solids capture.",
      },
    ],
  },
  {
    id: "disinfection",
    label: "Disinfection & CT",
    icon: "🧪",
    color: "#0F766E",
    bg: "#F0FDFA",
    formulas: [
      {
        name: "CT Value",
        formula: "CT = C × T",
        units: "mg·min/L",
        variables: [
          { sym: "CT", desc: "CT value (mg·min/L)" },
          { sym: "C", desc: "Residual disinfectant concentration (mg/L)" },
          { sym: "T", desc: "Contact time (min)" },
        ],
        example: {
          problem: "A clearwell has a chlorine residual of 0.8 mg/L and a T10 contact time of 45 minutes. What is the CT?",
          solution: "CT = 0.8 × 45 = 36 mg·min/L",
          answer: "36 mg·min/L",
        },
        tip: "Ontario requires CT ≥ 6 mg·min/L for Giardia inactivation at 15°C. Use T10 (time for 10% of water to pass through), not theoretical HRT.",
      },
      {
        name: "Chlorine Dose",
        formula: "Dose = Demand + Residual",
        units: "mg/L",
        variables: [
          { sym: "Dose", desc: "Total chlorine applied (mg/L)" },
          { sym: "Demand", desc: "Chlorine consumed by reactions (mg/L)" },
          { sym: "Residual", desc: "Remaining free chlorine (mg/L)" },
        ],
        example: {
          problem: "Water has a chlorine demand of 1.5 mg/L and a target residual of 0.5 mg/L. What dose is needed?",
          solution: "Dose = 1.5 + 0.5 = 2.0 mg/L",
          answer: "2.0 mg/L",
        },
        tip: "Ontario Drinking Water Standards require a minimum free chlorine residual of 0.05 mg/L at the point of consumption.",
      },
      {
        name: "Chemical Feed Rate",
        formula: "Feed Rate = Q × C ÷ P",
        units: "kg/d  or  L/d",
        variables: [
          { sym: "Q", desc: "Flow rate (m³/d or ML/d)" },
          { sym: "C", desc: "Target dose (mg/L = g/m³)" },
          { sym: "P", desc: "Chemical purity (decimal, e.g. 0.65 for 65%)" },
        ],
        example: {
          problem: "A plant treats 15,000 m³/d and needs 2.0 mg/L chlorine. Sodium hypochlorite is 12% available chlorine. What is the feed rate?",
          solution: "Feed Rate = (15,000 × 2.0) ÷ (0.12 × 1,000)\n= 30,000 ÷ 120 = 250 L/d",
          answer: "250 L/d",
        },
        tip: "For liquid chemicals: multiply by density if converting to volume. For dry chemicals: Feed Rate (kg/d) = Q (m³/d) × Dose (g/m³) ÷ Purity (%) ÷ 1000.",
      },
      {
        name: "Log Inactivation",
        formula: "Log Inactivation = log₁₀(N₀ / N)",
        units: "log units",
        variables: [
          { sym: "N₀", desc: "Initial pathogen concentration" },
          { sym: "N", desc: "Final pathogen concentration after treatment" },
        ],
        example: {
          problem: "If initial Giardia cysts = 100 and after treatment = 0.01, what is the log inactivation?",
          solution: "Log = log₁₀(100 / 0.01) = log₁₀(10,000) = 4.0",
          answer: "4.0 log inactivation",
        },
        tip: "Ontario requires 3-log Giardia and 4-log virus removal/inactivation. 3-log = 99.9% removal; 4-log = 99.99% removal.",
      },
    ],
  },
  {
    id: "dosing",
    label: "Chemical Dosing",
    icon: "⚗️",
    color: "#7C3AED",
    bg: "#FAF5FF",
    formulas: [
      {
        name: "Alum Dose (Coagulation)",
        formula: "Alum (kg/d) = Q (m³/d) × Dose (g/m³) ÷ 1000",
        units: "kg/d",
        variables: [
          { sym: "Q", desc: "Flow rate (m³/d)" },
          { sym: "Dose", desc: "Alum dose (mg/L = g/m³)" },
        ],
        example: {
          problem: "A plant treats 20,000 m³/d with an alum dose of 30 mg/L. How much alum is needed per day?",
          solution: "Alum = 20,000 × 30 ÷ 1000 = 600 kg/d",
          answer: "600 kg/d",
        },
        tip: "Typical alum dose: 10–50 mg/L depending on raw water turbidity. Jar testing determines optimal dose.",
      },
      {
        name: "Lime Softening Dose",
        formula: "Lime (kg/d) = Q × [CO₂ + HCO₃ + Mg²⁺] × 0.74 ÷ 1000",
        units: "kg/d",
        variables: [
          { sym: "Q", desc: "Flow rate (m³/d)" },
          { sym: "0.74", desc: "Ratio of CaO to CaCO₃ molecular weights (56/74)" },
        ],
        example: {
          problem: "A plant treats 10,000 m³/d. Bicarbonate alkalinity = 200 mg/L as CaCO₃. What is the lime dose?",
          solution: "Lime = 10,000 × 200 × 0.74 ÷ 1000 = 1,480 kg/d",
          answer: "1,480 kg/d",
        },
        tip: "Add excess lime (10–20%) to account for reaction inefficiencies. Recarbonation with CO₂ is needed to stabilize pH after softening.",
      },
      {
        name: "Fluoride Dose",
        formula: "Feed (L/d) = Q × Target ÷ (Strength × 1000)",
        units: "L/d",
        variables: [
          { sym: "Q", desc: "Flow rate (m³/d)" },
          { sym: "Target", desc: "Target fluoride level (mg/L)" },
          { sym: "Strength", desc: "Fluoride solution concentration (g/L)" },
        ],
        example: {
          problem: "A plant treats 5,000 m³/d. Target fluoride = 0.7 mg/L. Fluorosilicic acid solution = 20 g/L. What is the feed rate?",
          solution: "Feed = 5,000 × 0.7 ÷ (20 × 1000) × 1,000,000\n= 3,500,000 ÷ 20,000 = 175 L/d",
          answer: "175 L/d",
        },
        tip: "Health Canada guideline: 0.7 mg/L fluoride. Ontario follows this guideline. Fluorosilicic acid (H₂SiF₆) is the most common fluoridation chemical.",
      },
      {
        name: "Polymer Dose",
        formula: "Polymer (kg/d) = Q × Dose ÷ 1000",
        units: "kg/d",
        variables: [
          { sym: "Q", desc: "Flow rate (m³/d)" },
          { sym: "Dose", desc: "Polymer dose (mg/L = g/m³)" },
        ],
        example: {
          problem: "A plant uses 0.5 mg/L polymer at a flow of 8,000 m³/d. How much polymer is used per day?",
          solution: "Polymer = 8,000 × 0.5 ÷ 1000 = 4 kg/d",
          answer: "4 kg/d",
        },
        tip: "Cationic polymers are used as primary coagulants; anionic/non-ionic polymers as filter aids. Typical dose: 0.1–2 mg/L.",
      },
    ],
  },
  {
    id: "hydraulics",
    label: "Hydraulics & Head",
    icon: "⚙️",
    color: "#B45309",
    bg: "#FFFBEB",
    formulas: [
      {
        name: "Bernoulli's Equation (Simplified)",
        formula: "P₁/ρg + V₁²/2g + z₁ = P₂/ρg + V₂²/2g + z₂",
        units: "metres of head",
        variables: [
          { sym: "P/ρg", desc: "Pressure head (m)" },
          { sym: "V²/2g", desc: "Velocity head (m)" },
          { sym: "z", desc: "Elevation head (m)" },
        ],
        tip: "Total head is conserved in ideal flow. In real systems, subtract head loss (hL) from the right side.",
      },
      {
        name: "Darcy-Weisbach Head Loss",
        formula: "hL = f × (L/D) × (V²/2g)",
        units: "metres of head",
        variables: [
          { sym: "hL", desc: "Head loss due to friction (m)" },
          { sym: "f", desc: "Darcy friction factor (dimensionless)" },
          { sym: "L", desc: "Pipe length (m)" },
          { sym: "D", desc: "Pipe diameter (m)" },
          { sym: "V", desc: "Flow velocity (m/s)" },
          { sym: "g", desc: "Gravitational acceleration (9.81 m/s²)" },
        ],
        example: {
          problem: "A 200 m pipe (D = 0.3 m, f = 0.02) carries water at 1.5 m/s. What is the head loss?",
          solution: "hL = 0.02 × (200/0.3) × (1.5²/(2×9.81))\n= 0.02 × 666.7 × 0.1147 = 1.53 m",
          answer: "1.53 m",
        },
        tip: "For exam purposes, the Hazen-Williams formula is more common: V = 0.8492 × C × R^0.63 × S^0.54",
      },
      {
        name: "Total Dynamic Head (TDH)",
        formula: "TDH = Static Head + Friction Losses + Minor Losses",
        units: "metres",
        variables: [
          { sym: "Static Head", desc: "Elevation difference between suction and discharge (m)" },
          { sym: "Friction Losses", desc: "Pipe friction head loss (m)" },
          { sym: "Minor Losses", desc: "Fittings, valves, bends (m)" },
        ],
        example: {
          problem: "A pump lifts water 15 m (static head), with 3 m friction loss and 0.5 m minor losses. What is TDH?",
          solution: "TDH = 15 + 3 + 0.5 = 18.5 m",
          answer: "18.5 m",
        },
        tip: "Pump must be selected to overcome TDH at the required flow rate. Always add 10–15% safety margin to TDH.",
      },
      {
        name: "Pump Power",
        formula: "P = ρ × g × Q × H ÷ η",
        units: "Watts  or  kW",
        variables: [
          { sym: "P", desc: "Power (W or kW)" },
          { sym: "ρ", desc: "Density of water (1000 kg/m³)" },
          { sym: "g", desc: "9.81 m/s²" },
          { sym: "Q", desc: "Flow rate (m³/s)" },
          { sym: "H", desc: "Total dynamic head (m)" },
          { sym: "η", desc: "Pump efficiency (decimal, e.g. 0.75)" },
        ],
        example: {
          problem: "A pump delivers 0.05 m³/s against 20 m TDH at 75% efficiency. What is the power draw?",
          solution: "P = 1000 × 9.81 × 0.05 × 20 ÷ 0.75\n= 9,810 ÷ 0.75 = 13,080 W = 13.1 kW",
          answer: "13.1 kW",
        },
        tip: "Water power (WHP) = ρgQH. Shaft power = WHP ÷ η. Motor power = Shaft power ÷ motor efficiency.",
      },
      {
        name: "Net Positive Suction Head (NPSH)",
        formula: "NPSHa = Ha + Hs − Hvp − Hf",
        units: "metres",
        variables: [
          { sym: "Ha", desc: "Atmospheric pressure head (≈10.3 m at sea level)" },
          { sym: "Hs", desc: "Suction head (positive if above pump, negative if below)" },
          { sym: "Hvp", desc: "Vapour pressure head at water temperature" },
          { sym: "Hf", desc: "Friction losses in suction line" },
        ],
        tip: "NPSHa must exceed NPSHr (required) by at least 0.5–1.0 m to prevent cavitation. Cavitation causes noise, vibration, and impeller damage.",
      },
    ],
  },
  {
    id: "wastewater",
    label: "Wastewater Treatment",
    icon: "♻️",
    color: "#059669",
    bg: "#ECFDF5",
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
          problem: "SV₃₀ = 250 mL/L and MLSS = 2,500 mg/L. What is the SVI?",
          solution: "SVI = (250 × 1000) ÷ 2,500 = 100 mL/g",
          answer: "100 mL/g",
        },
        tip: "Good settling: SVI 80–150 mL/g. Bulking sludge: SVI > 200 mL/g. Poor settling: SVI < 50 mL/g (pin floc).",
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
          problem: "V = 5,000 m³, MLSS = 3,000 mg/L, Qw = 100 m³/d, WAS = 8,000 mg/L, Qe = 10,000 m³/d, TSS_e = 20 mg/L. What is SRT?",
          solution: "Numerator = 5,000 × 3,000 = 15,000,000\nDenominator = (100 × 8,000) + (10,000 × 20) = 800,000 + 200,000 = 1,000,000\nSRT = 15,000,000 ÷ 1,000,000 = 15 days",
          answer: "15 days",
        },
        tip: "Typical SRT for nitrification: 10–20 days. Short SRT = young sludge, high F:M. Long SRT = old sludge, low F:M, better nitrification.",
      },
      {
        name: "Food-to-Microorganism Ratio (F:M)",
        formula: "F:M = BOD_in × Q ÷ (V × MLVSS)",
        units: "kg BOD / kg MLVSS · d",
        variables: [
          { sym: "BOD_in", desc: "Influent BOD (mg/L)" },
          { sym: "Q", desc: "Flow rate (m³/d)" },
          { sym: "V", desc: "Aeration basin volume (m³)" },
          { sym: "MLVSS", desc: "Mixed liquor volatile suspended solids (mg/L)" },
        ],
        example: {
          problem: "BOD_in = 200 mg/L, Q = 10,000 m³/d, V = 4,000 m³, MLVSS = 2,000 mg/L. What is F:M?",
          solution: "F:M = (200 × 10,000) ÷ (4,000 × 2,000)\n= 2,000,000 ÷ 8,000,000 = 0.25 kg BOD/kg MLVSS·d",
          answer: "0.25 kg BOD/kg MLVSS·d",
        },
        tip: "Conventional activated sludge F:M: 0.2–0.5. Extended aeration: 0.05–0.15. High F:M = dispersed growth, poor settling.",
      },
      {
        name: "BOD Removal Efficiency",
        formula: "E = (BOD_in − BOD_out) ÷ BOD_in × 100",
        units: "%",
        variables: [
          { sym: "E", desc: "Removal efficiency (%)" },
          { sym: "BOD_in", desc: "Influent BOD (mg/L)" },
          { sym: "BOD_out", desc: "Effluent BOD (mg/L)" },
        ],
        example: {
          problem: "Influent BOD = 220 mg/L, effluent BOD = 15 mg/L. What is the removal efficiency?",
          solution: "E = (220 − 15) ÷ 220 × 100 = 205 ÷ 220 × 100 = 93.2%",
          answer: "93.2%",
        },
        tip: "Ontario effluent limit (Class 4 plant): BOD ≤ 10 mg/L, TSS ≤ 10 mg/L. Secondary treatment typically achieves 85–95% BOD removal.",
      },
      {
        name: "Organic Loading Rate (OLR)",
        formula: "OLR = Q × BOD ÷ V",
        units: "kg BOD/m³·d",
        variables: [
          { sym: "Q", desc: "Flow rate (m³/d)" },
          { sym: "BOD", desc: "Influent BOD (g/m³ = mg/L)" },
          { sym: "V", desc: "Reactor volume (m³)" },
        ],
        example: {
          problem: "Q = 5,000 m³/d, BOD = 250 mg/L, V = 2,500 m³. What is the OLR?",
          solution: "OLR = 5,000 × 250 ÷ (2,500 × 1000) = 1,250,000 ÷ 2,500,000 = 0.5 kg BOD/m³·d",
          answer: "0.5 kg BOD/m³·d",
        },
        tip: "Typical OLR for activated sludge: 0.3–0.8 kg BOD/m³·d. Exceeding design OLR causes process upset.",
      },
    ],
  },
  {
    id: "math",
    label: "Math & Conversions",
    icon: "📐",
    color: "#C2410C",
    bg: "#FFF7ED",
    formulas: [
      {
        name: "Concentration (C = m/V)",
        formula: "C = m ÷ V",
        units: "mg/L  or  g/m³",
        variables: [
          { sym: "C", desc: "Concentration (mg/L)" },
          { sym: "m", desc: "Mass of solute (mg or g)" },
          { sym: "V", desc: "Volume of solution (L or m³)" },
        ],
        example: {
          problem: "5 g of alum is dissolved in 200 L of water. What is the concentration?",
          solution: "C = 5,000 mg ÷ 200 L = 25 mg/L",
          answer: "25 mg/L",
        },
        tip: "1 mg/L = 1 g/m³ = 1 ppm (in water). This is the most fundamental water chemistry relationship.",
      },
      {
        name: "Percent Solution",
        formula: "% = (mass of solute ÷ mass of solution) × 100",
        units: "%",
        variables: [
          { sym: "mass of solute", desc: "Mass of chemical (g or kg)" },
          { sym: "mass of solution", desc: "Total mass including water (g or kg)" },
        ],
        example: {
          problem: "How many kg of NaOCl are in 100 L of 12.5% sodium hypochlorite solution? (density ≈ 1.2 kg/L)",
          solution: "Mass of solution = 100 × 1.2 = 120 kg\nMass of NaOCl = 120 × 0.125 = 15 kg",
          answer: "15 kg NaOCl",
        },
        tip: "For liquid chemicals, always account for density when converting between volume and mass.",
      },
      {
        name: "Unit Conversions — Flow",
        formula: "1 m³/s = 1,000 L/s = 86,400 m³/d = 86.4 ML/d",
        tip: "1 MGD (US) ≈ 3,785 m³/d. Ontario typically uses m³/d or ML/d for plant flows.",
      },
      {
        name: "Unit Conversions — Pressure",
        formula: "1 kPa = 0.102 m H₂O  |  1 m H₂O = 9.81 kPa  |  1 bar = 100 kPa",
        tip: "Atmospheric pressure ≈ 101.3 kPa = 10.33 m H₂O. Used for NPSH and pump head calculations.",
      },
      {
        name: "Area of a Circle",
        formula: "A = π × r²  =  π × D² ÷ 4",
        units: "m²",
        variables: [
          { sym: "A", desc: "Area (m²)" },
          { sym: "r", desc: "Radius (m)" },
          { sym: "D", desc: "Diameter (m)" },
        ],
        example: {
          problem: "What is the area of a 600 mm diameter pipe?",
          solution: "D = 0.6 m\nA = π × (0.6)² ÷ 4 = 3.14159 × 0.36 ÷ 4 = 0.2827 m²",
          answer: "0.2827 m²",
        },
        tip: "π ≈ 3.14159. For exam calculations, π ≈ 3.14 is acceptable.",
      },
      {
        name: "Specific Gravity",
        formula: "SG = ρ_substance ÷ ρ_water",
        units: "dimensionless",
        variables: [
          { sym: "SG", desc: "Specific gravity (dimensionless)" },
          { sym: "ρ_substance", desc: "Density of substance (kg/m³)" },
          { sym: "ρ_water", desc: "Density of water (1000 kg/m³ at 4°C)" },
        ],
        example: {
          problem: "Ferric sulphate solution has a density of 1,450 kg/m³. What is its specific gravity?",
          solution: "SG = 1,450 ÷ 1,000 = 1.45",
          answer: "SG = 1.45",
        },
        tip: "SG > 1 = denser than water. Chemical solutions typically have SG of 1.1–1.8. Used to convert between volume and mass.",
      },
    ],
  },
  {
    id: "regulations",
    label: "Ontario Regulations",
    icon: "📋",
    color: "#6D28D9",
    bg: "#EDE9FE",
    formulas: [
      {
        name: "O. Reg. 170/03 — Drinking Water Systems",
        formula: "Key Parameters: Turbidity ≤ 1 NTU (treated), Chlorine residual ≥ 0.05 mg/L, E. coli = 0 CFU/100 mL",
        tip: "O. Reg. 170/03 governs municipal residential drinking water systems. Requires continuous turbidity monitoring, regular bacteriological sampling, and operator certification.",
      },
      {
        name: "O. Reg. 128/04 — Certification of Drinking Water System Operators",
        formula: "Classes: OIT → Class 1 → Class 2 → Class 3 → Class 4 (based on system complexity)",
        tip: "Operators must hold a certificate at or above the class of the system they operate. Certificates expire every 3 years and require continuing education (PDUs).",
      },
      {
        name: "O. Reg. 129/04 — Certification of Wastewater System Operators",
        formula: "Classes: OIT → Class 1 → Class 2 → Class 3 → Class 4 (based on system complexity)",
        tip: "Parallel to O. Reg. 128/04 but for wastewater. Class is determined by population served and treatment processes present.",
      },
      {
        name: "Ontario Drinking Water Standards — Key Limits",
        formula: "Turbidity: ≤ 1 NTU | Chlorine: 0.05–4.0 mg/L | Fluoride: ≤ 1.5 mg/L | Nitrate: ≤ 10 mg/L | Lead: ≤ 0.01 mg/L",
        tip: "Maximum Allowable Concentrations (MACs) are health-based limits. Aesthetic Objectives (AOs) are for taste/odour/appearance. Know both for the exam.",
      },
      {
        name: "Adverse Water Quality Incident (AWQI) Reporting",
        formula: "Report within 24 hours to: MOE Spills Action Centre (1-800-268-6060) + local Medical Officer of Health",
        tip: "AWQIs include: E. coli detection, turbidity exceedance, loss of disinfection, or any result exceeding an MAC. Document everything — who, what, when, corrective action.",
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
        <div style={{ padding: "0 20px 20px", animation: "fadeDown 0.2s ease both" }}>
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
                      minWidth: 60,
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
              background: "#EFF6FF",
              borderRadius: 8,
              padding: "10px 14px",
              borderLeft: "3px solid #3B82F6",
              fontSize: 11,
              color: "#1E3A5F",
              lineHeight: 1.6,
            }}>
              <span style={{ fontWeight: 700, color: "#1D4ED8" }}>💡 Exam Tip: </span>
              {formula.tip}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function Formulas() {
  usePageMeta({
    title: "Ontario Operator Exam Formula Sheet",
    description: "33 Ontario water and wastewater operator exam formulas with worked examples and exam tips. CT values, SVI, chlorine dose, flow calculations, and more.",
    path: "/formulas",
  });
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandAll, setExpandAll] = useState(false);

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

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Sora', sans-serif" }}>
      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        .cat-chip:hover { opacity: 0.85; transform: translateY(-1px); }
        .search-input:focus { outline: none; border-color: #3B82F6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
      `}</style>

      <SiteNav currentPath="/formulas" />

      {/* ── HERO BANNER ── */}
      <div style={{
        background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 60%, #0E7490 100%)",
        padding: "40px 24px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.1)", borderRadius: 20,
            padding: "5px 14px", marginBottom: 16,
            border: "1px solid rgba(255,255,255,0.15)",
          }}>
            <span style={{ fontSize: 12 }}>📐</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
              Ontario Water & Wastewater Operator Exam Reference
            </span>
          </div>
          <h1 style={{
            fontSize: "clamp(22px, 4vw, 36px)",
            fontWeight: 800, color: "#FFFFFF",
            letterSpacing: "-0.02em", margin: "0 0 12px 0",
          }}>
            Formula Sheet
          </h1>
          <p style={{
            fontSize: 14, color: "rgba(255,255,255,0.7)",
            lineHeight: 1.7, margin: "0 0 24px",
          }}>
            All the formulas you need for the OIT, Class 1–4, and WQA exams — with worked examples and exam tips.
            Click any formula to expand the full solution.
          </p>

          {/* Search */}
          <div style={{ position: "relative", maxWidth: 480, margin: "0 auto" }}>
            <span style={{
              position: "absolute", left: 14, top: "50%",
              transform: "translateY(-50%)", fontSize: 14, pointerEvents: "none",
            }}>🔍</span>
            <input
              className="search-input"
              type="text"
              placeholder="Search formulas, e.g. 'CT value', 'SVI', 'flow rate'…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px 12px 40px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                fontSize: 13,
                fontFamily: "inherit",
                backdropFilter: "blur(8px)",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── CATEGORY FILTER ── */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #E5E7EB",
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        overflowX: "auto",
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", flexShrink: 0 }}>
          CATEGORY:
        </span>
        <button
          className="cat-chip"
          onClick={() => setActiveCategory(null)}
          style={{
            padding: "6px 14px", borderRadius: 20,
            border: `1.5px solid ${!activeCategory ? "#1D4ED8" : "#E5E7EB"}`,
            background: !activeCategory ? "#EFF6FF" : "transparent",
            color: !activeCategory ? "#1D4ED8" : "#64748B",
            fontSize: 11, fontWeight: 700, cursor: "pointer",
            fontFamily: "inherit", transition: "all 0.15s", flexShrink: 0,
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
              padding: "6px 14px", borderRadius: 20,
              border: `1.5px solid ${activeCategory === cat.id ? cat.color : "#E5E7EB"}`,
              background: activeCategory === cat.id ? cat.bg : "transparent",
              color: activeCategory === cat.id ? cat.color : "#64748B",
              fontSize: 11, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit", transition: "all 0.15s", flexShrink: 0,
              display: "flex", alignItems: "center", gap: 5,
            }}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
            <span style={{
              background: activeCategory === cat.id ? cat.color : "#E5E7EB",
              color: activeCategory === cat.id ? "#fff" : "#64748B",
              borderRadius: 10, padding: "1px 6px",
              fontSize: 9, fontWeight: 800,
            }}>{cat.formulas.length}</span>
          </button>
        ))}

        <div style={{ marginLeft: "auto", flexShrink: 0 }}>
          <button
            onClick={() => setExpandAll(!expandAll)}
            style={{
              padding: "6px 14px", borderRadius: 20,
              border: "1px solid #E5E7EB", background: "transparent",
              color: "#64748B", fontSize: 10, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {expandAll ? "▲ Collapse All" : "▼ Expand All"}
          </button>
        </div>
      </div>

      {/* ── FORMULA CONTENT ── */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 24px 80px" }}>
        {filteredCategories.length === 0 ? (
          <div style={{
            background: "#fff", borderRadius: 16, padding: "48px",
            textAlign: "center", border: "1px solid #E5E7EB",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>
              No formulas found
            </div>
            <div style={{ fontSize: 12, color: "#94A3B8" }}>
              Try a different search term or clear the filter
            </div>
            <button
              onClick={() => { setSearchQuery(""); setActiveCategory(null); }}
              style={{
                marginTop: 16, padding: "8px 20px", borderRadius: 8,
                border: "1px solid #1D4ED8", background: "#EFF6FF",
                color: "#1D4ED8", fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Clear Search
            </button>
          </div>
        ) : (
          filteredCategories.map(cat => (
            <div key={cat.id} style={{ marginBottom: 36, animation: "fadeUp 0.3s ease both" }}>
              {/* Category header */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                marginBottom: 14,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: cat.bg, border: `2px solid ${cat.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>{cat.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>{cat.label}</div>
                  <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600 }}>
                    {cat.formulas.length} formula{cat.formulas.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <div style={{ flex: 1, height: 1, background: "#E5E7EB", marginLeft: 8 }} />
              </div>

              {/* Formula cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {cat.formulas.map((f, i) => (
                  <FormulaCardWrapper
                    key={i}
                    formula={f}
                    color={cat.color}
                    bg={cat.bg}
                    forceExpand={expandAll}
                  />
                ))}
              </div>
            </div>
          ))
        )}

        {/* Quick reference cheat sheet */}
        {!searchQuery && !activeCategory && (
          <div style={{
            background: "linear-gradient(135deg, #0F172A, #1E3A5F)",
            borderRadius: 20, padding: "28px 28px",
            marginTop: 8,
          }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
              📌 Quick Reference — Most Common Exam Formulas
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 20 }}>
              Memorize these first — they appear on almost every Ontario operator exam
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
              {[
                { label: "CT Value", f: "CT = C × T", unit: "mg·min/L", color: "#0F766E" },
                { label: "Chlorine Dose", f: "Dose = Demand + Residual", unit: "mg/L", color: "#1D4ED8" },
                { label: "Flow Rate", f: "Q = A × V", unit: "m³/s", color: "#1D4ED8" },
                { label: "Detention Time", f: "HRT = V ÷ Q", unit: "hours", color: "#1D4ED8" },
                { label: "SVI", f: "SVI = (SV₃₀ × 1000) ÷ MLSS", unit: "mL/g", color: "#059669" },
                { label: "F:M Ratio", f: "F:M = BOD × Q ÷ (V × MLVSS)", unit: "kg/kg·d", color: "#059669" },
                { label: "Chemical Feed", f: "Feed = Q × Dose ÷ Purity", unit: "kg/d", color: "#7C3AED" },
                { label: "BOD Removal", f: "E = (BOD_in − BOD_out) ÷ BOD_in × 100", unit: "%", color: "#059669" },
                { label: "Pump Power", f: "P = ρgQH ÷ η", unit: "kW", color: "#B45309" },
                { label: "TDH", f: "TDH = Static + Friction + Minor", unit: "m", color: "#B45309" },
              ].map((item, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 10, padding: "12px 14px",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 4, letterSpacing: "0.08em" }}>
                    {item.label.toUpperCase()}
                  </div>
                  <div style={{
                    fontFamily: "monospace", fontSize: 12,
                    fontWeight: 700, color: item.color, marginBottom: 3,
                  }}>
                    {item.f}
                  </div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>Units: {item.unit}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrapper to support forceExpand
function FormulaCardWrapper({
  formula, color, bg, forceExpand,
}: {
  formula: Formula; color: string; bg: string; forceExpand: boolean;
}) {
  const [localExpand, setLocalExpand] = useState(false);
  const isExpanded = forceExpand || localExpand;

  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      border: "1px solid #E5E7EB",
      overflow: "hidden",
      transition: "box-shadow 0.2s",
      boxShadow: isExpanded ? "0 4px 20px rgba(0,0,0,0.08)" : "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      {/* Header */}
      <div
        onClick={() => setLocalExpand(!localExpand)}
        style={{
          padding: "16px 20px",
          cursor: "pointer",
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
          background: isExpanded ? bg : "#fff",
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
          color: isExpanded ? color : "#94A3B8",
          fontWeight: 700,
          flexShrink: 0,
          marginTop: 2,
          transition: "color 0.15s",
        }}>
          {isExpanded ? "▲ Less" : "▼ More"}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div style={{ padding: "0 20px 20px", animation: "fadeDown 0.2s ease both" }}>
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
                      minWidth: 60,
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
              background: "#EFF6FF",
              borderRadius: 8,
              padding: "10px 14px",
              borderLeft: "3px solid #3B82F6",
              fontSize: 11,
              color: "#1E3A5F",
              lineHeight: 1.6,
            }}>
              <span style={{ fontWeight: 700, color: "#1D4ED8" }}>💡 Exam Tip: </span>
              {formula.tip}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
