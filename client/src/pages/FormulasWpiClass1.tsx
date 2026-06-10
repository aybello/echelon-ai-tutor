// WPI Class I Water Treatment — Formula Sheet
// Covers: CT Values & Disinfection, Chlorine Dosage & Demand, Flow Rate & Hydraulics,
//         Turbidity & Filtration, Chemical Feed & Dosing, Sedimentation, Pumping
// Aligned with WPI Need-to-Know Criteria (BC/AB/SK/MB)
// Design: Teal/blue brand, mirrors FormulasWater1.tsx structure

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
    id: "ct-disinfection",
    label: "CT Values & Disinfection",
    icon: "🦠",
    color: "#0E7490",
    bg: "#ECFEFF",
    formulas: [
      {
        name: "CT Value",
        formula: "CT = C × T",
        units: "mg·min/L",
        variables: [
          { sym: "CT", desc: "Disinfection credit (mg·min/L)" },
          { sym: "C", desc: "Residual disinfectant concentration at outlet (mg/L)" },
          { sym: "T", desc: "Contact time — T₁₀ (minutes)" },
        ],
        example: {
          problem: "Cl₂ residual at outlet = 0.8 mg/L, T₁₀ = 25 min. What is the CT?",
          solution: "CT = 0.8 × 25",
          answer: "20 mg·min/L",
        },
        tip: "T₁₀ is the time it takes 10% of the water to pass through the contact basin (conservative estimate). Use T₁₀ = baffling factor × HRT.",
      },
      {
        name: "CT Required vs. CT Achieved",
        formula: "CT_achieved ≥ CT_required",
        variables: [
          { sym: "CT_required", desc: "From WPI/Health Canada tables based on pH, temp, and log inactivation target" },
          { sym: "CT_achieved", desc: "C × T₁₀ calculated from plant measurements" },
        ],
        tip: "For Giardia: 3-log inactivation required. For viruses: 4-log. CT_required increases at lower temperatures and higher pH.",
      },
      {
        name: "Log Inactivation",
        formula: "Log inactivation = log₁₀(N₀ / N)",
        variables: [
          { sym: "N₀", desc: "Initial pathogen concentration" },
          { sym: "N", desc: "Final pathogen concentration after treatment" },
        ],
        example: {
          problem: "Influent has 10,000 Giardia cysts/L; effluent has 10. What is the log inactivation?",
          solution: "log₁₀(10,000 ÷ 10) = log₁₀(1,000)",
          answer: "3-log inactivation",
        },
        tip: "3-log = 99.9% removal; 4-log = 99.99% removal; 6-log = 99.9999% removal.",
      },
      {
        name: "Baffling Factor (BF)",
        formula: "T₁₀ = BF × HRT",
        variables: [
          { sym: "T₁₀", desc: "10th percentile contact time (min)" },
          { sym: "BF", desc: "Baffling factor (0.1 to 1.0 depending on basin design)" },
          { sym: "HRT", desc: "Hydraulic Retention Time (min)" },
        ],
        tip: "Typical BF values: Unbaffled = 0.1, Poor = 0.3, Average = 0.5, Superior = 0.7, Perfect plug flow = 1.0.",
      },
      {
        name: "Chlorine Demand",
        formula: "Cl₂ Demand = Cl₂ Applied − Cl₂ Residual",
        units: "mg/L",
        variables: [
          { sym: "Cl₂ Applied", desc: "Chlorine dose added to water (mg/L)" },
          { sym: "Cl₂ Residual", desc: "Free chlorine remaining after contact time (mg/L)" },
        ],
        example: {
          problem: "Cl₂ dose = 2.5 mg/L; residual after 30 min = 0.6 mg/L. What is the demand?",
          solution: "Demand = 2.5 − 0.6",
          answer: "1.9 mg/L",
        },
        tip: "Chlorine demand is consumed by organics, ammonia, iron, manganese, and microorganisms.",
      },
      {
        name: "Breakpoint Chlorination",
        formula: "Breakpoint dose ≈ 7.6 × NH₃-N concentration",
        units: "mg/L Cl₂",
        variables: [
          { sym: "NH₃-N", desc: "Ammonia-nitrogen concentration (mg/L)" },
        ],
        example: {
          problem: "Source water has 0.5 mg/L NH₃-N. Estimate the breakpoint chlorine dose.",
          solution: "Dose ≈ 7.6 × 0.5",
          answer: "≈ 3.8 mg/L Cl₂",
        },
        tip: "Breakpoint chlorination destroys chloramines and provides free chlorine residual. Add 20–25% extra beyond breakpoint for residual.",
      },
    ],
  },
  {
    id: "flow-hydraulics",
    label: "Flow Rate & Hydraulics",
    icon: "💧",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    formulas: [
      {
        name: "Flow Rate (Q)",
        formula: "Q = A × V",
        units: "m³/s or L/s",
        variables: [
          { sym: "Q", desc: "Flow rate (m³/s)" },
          { sym: "A", desc: "Cross-sectional area of flow (m²)" },
          { sym: "V", desc: "Velocity of flow (m/s)" },
        ],
        example: {
          problem: "A pipe has a diameter of 0.3 m and water velocity of 1.2 m/s. What is Q?",
          solution: "A = π × (0.15)² = 0.0707 m²; Q = 0.0707 × 1.2",
          answer: "0.0849 m³/s = 84.9 L/s",
        },
      },
      {
        name: "Flow Rate Unit Conversions",
        formula: "Q (m³/d) = Q (L/s) × 86.4",
        units: "m³/d",
        variables: [
          { sym: "86.4", desc: "Conversion factor (86,400 s/d ÷ 1,000 L/m³)" },
        ],
        tip: "Key conversions: 1 L/s = 86.4 m³/d | 1 m³/s = 86,400 m³/d | 1 MLD = 11.574 L/s | 1 MGD = 3,785 m³/d",
      },
      {
        name: "Hydraulic Retention Time (HRT)",
        formula: "HRT (h) = Volume (m³) ÷ Flow Rate (m³/h)",
        units: "hours",
        variables: [
          { sym: "HRT", desc: "Hydraulic retention time (hours)" },
          { sym: "Volume", desc: "Basin or tank volume (m³)" },
          { sym: "Flow Rate", desc: "Volumetric flow through the basin (m³/h)" },
        ],
        example: {
          problem: "Clearwell volume = 2,400 m³; plant flow = 400 m³/h. What is the HRT?",
          solution: "HRT = 2,400 ÷ 400",
          answer: "6 hours",
        },
      },
      {
        name: "Surface Overflow Rate (SOR)",
        formula: "SOR = Q ÷ A_surface",
        units: "m³/(m²·d) or m/d",
        variables: [
          { sym: "Q", desc: "Flow rate (m³/d)" },
          { sym: "A_surface", desc: "Surface area of sedimentation basin (m²)" },
        ],
        example: {
          problem: "Flow = 5,000 m³/d; basin surface area = 250 m². What is the SOR?",
          solution: "SOR = 5,000 ÷ 250",
          answer: "20 m³/(m²·d) = 20 m/d",
        },
        tip: "Typical SOR for conventional sedimentation: 20–40 m/d. Lower SOR = better settling.",
      },
      {
        name: "Weir Overflow Rate (WOR)",
        formula: "WOR = Q ÷ Weir Length",
        units: "m³/(m·d)",
        variables: [
          { sym: "Q", desc: "Flow rate (m³/d)" },
          { sym: "Weir Length", desc: "Total length of effluent weir (m)" },
        ],
        tip: "Typical WOR for sedimentation basins: < 250 m³/(m·d). High WOR causes turbulence and carryover of floc.",
      },
      {
        name: "Pipe Velocity",
        formula: "V = Q ÷ A",
        units: "m/s",
        variables: [
          { sym: "V", desc: "Velocity (m/s)" },
          { sym: "Q", desc: "Flow rate (m³/s)" },
          { sym: "A", desc: "Pipe cross-sectional area = π × r² (m²)" },
        ],
        tip: "Recommended distribution pipe velocity: 0.6–1.5 m/s. Above 3 m/s causes erosion; below 0.3 m/s causes sediment deposition.",
      },
    ],
  },
  {
    id: "turbidity-filtration",
    label: "Turbidity & Filtration",
    icon: "🔬",
    color: "#7C3AED",
    bg: "#F5F3FF",
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
          problem: "Raw water turbidity = 60 NTU; filtered effluent = 0.15 NTU. What is removal efficiency?",
          solution: "E = [(60 − 0.15) ÷ 60] × 100 = (59.85 ÷ 60) × 100",
          answer: "99.75%",
        },
        tip: "WPI/Health Canada target: ≤ 0.3 NTU in 95% of monthly samples; never exceed 1 NTU.",
      },
      {
        name: "Filtration Rate",
        formula: "Filtration Rate = Q ÷ A_filter",
        units: "m³/(m²·h) or m/h",
        variables: [
          { sym: "Q", desc: "Flow through filter (m³/h)" },
          { sym: "A_filter", desc: "Filter surface area (m²)" },
        ],
        example: {
          problem: "A filter bed is 6 m × 4 m. Flow = 120 m³/h. What is the filtration rate?",
          solution: "A = 24 m²; Rate = 120 ÷ 24",
          answer: "5 m/h",
        },
        tip: "Typical rapid sand filter rate: 5–15 m/h. Slow sand filter: 0.1–0.4 m/h.",
      },
      {
        name: "Filter Run Volume",
        formula: "Run Volume = Filtration Rate × Filter Area × Run Time",
        units: "m³",
        variables: [
          { sym: "Filtration Rate", desc: "m/h" },
          { sym: "Filter Area", desc: "m²" },
          { sym: "Run Time", desc: "Hours between backwashes" },
        ],
      },
      {
        name: "Backwash Rate",
        formula: "Backwash Rate = Q_backwash ÷ A_filter",
        units: "m/h",
        variables: [
          { sym: "Q_backwash", desc: "Backwash flow rate (m³/h)" },
          { sym: "A_filter", desc: "Filter surface area (m²)" },
        ],
        tip: "Typical backwash rate for rapid sand filters: 30–60 m/h. Backwash until effluent turbidity < 5 NTU.",
      },
      {
        name: "Langelier Saturation Index (LSI)",
        formula: "LSI = pH_actual − pH_s",
        variables: [
          { sym: "pH_actual", desc: "Measured pH of water" },
          { sym: "pH_s", desc: "Saturation pH (calculated from Ca²⁺, alkalinity, TDS, temperature)" },
        ],
        tip: "LSI > 0: scale-forming (corrosive to pipes). LSI < 0: corrosive (leaches metals). LSI = 0: balanced. Target: −0.5 to +0.5.",
      },
    ],
  },
  {
    id: "chemical-dosing",
    label: "Chemical Feed & Dosing",
    icon: "⚗️",
    color: "#059669",
    bg: "#ECFDF5",
    formulas: [
      {
        name: "Chemical Dose (mass/day)",
        formula: "Mass (kg/d) = Dose (mg/L) × Flow (m³/d) ÷ 1,000",
        units: "kg/d",
        variables: [
          { sym: "Dose", desc: "Target chemical concentration (mg/L)" },
          { sym: "Flow", desc: "Plant flow rate (m³/d)" },
          { sym: "1,000", desc: "Conversion: 1 kg = 1,000 g; 1 m³ = 1,000 L → mg/L × m³/d = g/d ÷ 1,000 = kg/d" },
        ],
        example: {
          problem: "Plant flow = 3,000 m³/d; target chlorine dose = 2.0 mg/L. How much Cl₂ per day?",
          solution: "Mass = 2.0 × 3,000 ÷ 1,000",
          answer: "6 kg/d",
        },
      },
      {
        name: "Chemical Feed Rate (solution)",
        formula: "Feed Rate (L/h) = [Dose (mg/L) × Q (L/h)] ÷ [Solution Strength (mg/L)]",
        units: "L/h",
        variables: [
          { sym: "Dose", desc: "Target dose in the treated water (mg/L)" },
          { sym: "Q", desc: "Plant flow rate (L/h)" },
          { sym: "Solution Strength", desc: "Concentration of the chemical solution being fed (mg/L)" },
        ],
        example: {
          problem: "Target alum dose = 30 mg/L; plant flow = 200,000 L/h; alum solution = 100,000 mg/L (10%). What is the feed rate?",
          solution: "Feed Rate = (30 × 200,000) ÷ 100,000",
          answer: "60 L/h",
        },
      },
      {
        name: "Percent Solution Concentration",
        formula: "% = (Mass of solute ÷ Mass of solution) × 100",
        units: "%",
        variables: [
          { sym: "Mass of solute", desc: "Mass of chemical dissolved (g or kg)" },
          { sym: "Mass of solution", desc: "Total mass of solution (g or kg)" },
        ],
        example: {
          problem: "Dissolve 5 kg of NaOCl in 95 kg of water. What is the % solution?",
          solution: "% = (5 ÷ 100) × 100",
          answer: "5%",
        },
        tip: "Sodium hypochlorite (NaOCl) trade solution is typically 10–12% available chlorine.",
      },
      {
        name: "Available Chlorine from Hypochlorite",
        formula: "Cl₂ equivalent = Volume (L) × Strength (%) × Density (kg/L) × 10",
        units: "g Cl₂",
        tip: "For 12% NaOCl: 1 L contains ~120 g available Cl₂ (density ≈ 1.17 kg/L). Adjust for actual product strength.",
      },
      {
        name: "Fluoride Dosing",
        formula: "Feed Rate = [Target F (mg/L) × Q (L/h)] ÷ [Fluoride Product Strength (mg F/L)]",
        units: "L/h",
        tip: "Health Canada target: 0.7 mg/L fluoride. Most provinces follow this guideline. Fluorosilicic acid (H₂SiF₆) is the most common fluoridation chemical.",
      },
      {
        name: "Lime Dose for Softening",
        formula: "Lime dose (mg/L as CaO) = 2.5 × CO₂ + 1.85 × Ca-hardness + 1.39 × Mg-hardness",
        tip: "Approximate formula for lime-soda softening. Actual dose depends on water chemistry. Excess lime raises pH above 11 for Mg removal.",
      },
    ],
  },
  {
    id: "sedimentation",
    label: "Sedimentation & Coagulation",
    icon: "🏗️",
    color: "#B45309",
    bg: "#FFFBEB",
    formulas: [
      {
        name: "Stokes' Law (Settling Velocity)",
        formula: "Vs = [g × (ρ_p − ρ_w) × d²] ÷ (18 × μ)",
        units: "m/s",
        variables: [
          { sym: "Vs", desc: "Settling velocity (m/s)" },
          { sym: "g", desc: "Gravitational acceleration = 9.81 m/s²" },
          { sym: "ρ_p", desc: "Particle density (kg/m³)" },
          { sym: "ρ_w", desc: "Water density (kg/m³)" },
          { sym: "d", desc: "Particle diameter (m)" },
          { sym: "μ", desc: "Dynamic viscosity of water (Pa·s)" },
        ],
        tip: "Applies to laminar flow settling of discrete particles. Floc particles are larger and settle faster than raw particles.",
      },
      {
        name: "Jar Test — Optimal Coagulant Dose",
        formula: "Optimal dose = lowest dose achieving turbidity ≤ 1 NTU and clear supernatant",
        tip: "Jar test procedure: vary coagulant dose across 6 jars, rapid mix 1 min at 100 rpm, slow mix 15 min at 30 rpm, settle 30 min, measure turbidity.",
      },
      {
        name: "Alum Dose and pH Effect",
        formula: "Al₂(SO₄)₃ + 6H₂O → 2Al(OH)₃↓ + 3H₂SO₄",
        tip: "Alum hydrolysis consumes alkalinity and lowers pH. Optimal coagulation pH for alum: 6.5–7.5. Add lime or soda ash to maintain alkalinity.",
      },
      {
        name: "Alkalinity Consumption by Alum",
        formula: "Alkalinity consumed (mg/L as CaCO₃) ≈ 0.5 × Alum dose (mg/L)",
        tip: "Rule of thumb: each mg/L of alum consumes ~0.5 mg/L alkalinity as CaCO₃. Minimum residual alkalinity: 30–50 mg/L for stable coagulation.",
      },
      {
        name: "Rapid Mix Velocity Gradient (G)",
        formula: "G = √(P ÷ (μ × V))",
        units: "s⁻¹",
        variables: [
          { sym: "G", desc: "Velocity gradient (s⁻¹)" },
          { sym: "P", desc: "Power input to mixer (W)" },
          { sym: "μ", desc: "Dynamic viscosity (Pa·s)" },
          { sym: "V", desc: "Basin volume (m³)" },
        ],
        tip: "Rapid mix G: 300–1,000 s⁻¹. Flocculation G: 10–100 s⁻¹. Gt (camp number) for flocculation: 10⁴–10⁵.",
      },
    ],
  },
  {
    id: "pumping",
    label: "Pumping & Head",
    icon: "⚙️",
    color: "#DC2626",
    bg: "#FEF2F2",
    formulas: [
      {
        name: "Total Dynamic Head (TDH)",
        formula: "TDH = Static Head + Friction Head + Minor Losses",
        units: "m",
        variables: [
          { sym: "Static Head", desc: "Elevation difference between suction and discharge (m)" },
          { sym: "Friction Head", desc: "Head loss due to pipe friction (Darcy-Weisbach or Hazen-Williams)" },
          { sym: "Minor Losses", desc: "Head loss from fittings, valves, bends (m)" },
        ],
        tip: "TDH determines the pump operating point. Pump must be selected to deliver required flow at the system TDH.",
      },
      {
        name: "Pump Power (Hydraulic)",
        formula: "P_hydraulic (kW) = (ρ × g × Q × H) ÷ 1,000",
        units: "kW",
        variables: [
          { sym: "ρ", desc: "Water density = 1,000 kg/m³" },
          { sym: "g", desc: "9.81 m/s²" },
          { sym: "Q", desc: "Flow rate (m³/s)" },
          { sym: "H", desc: "Total dynamic head (m)" },
        ],
        example: {
          problem: "Q = 0.05 m³/s, TDH = 30 m. What is the hydraulic power?",
          solution: "P = (1,000 × 9.81 × 0.05 × 30) ÷ 1,000",
          answer: "14.7 kW",
        },
      },
      {
        name: "Pump Efficiency",
        formula: "η (%) = (P_hydraulic ÷ P_input) × 100",
        units: "%",
        variables: [
          { sym: "P_hydraulic", desc: "Useful hydraulic power output (kW)" },
          { sym: "P_input", desc: "Electrical power consumed by motor (kW)" },
        ],
        tip: "Typical pump efficiency: 60–85%. Motor efficiency: 85–95%. Overall wire-to-water efficiency = pump η × motor η.",
      },
      {
        name: "Hazen-Williams Friction Loss",
        formula: "h_f = (10.67 × L × Q^1.852) ÷ (C^1.852 × D^4.87)",
        units: "m",
        variables: [
          { sym: "h_f", desc: "Friction head loss (m)" },
          { sym: "L", desc: "Pipe length (m)" },
          { sym: "Q", desc: "Flow rate (m³/s)" },
          { sym: "C", desc: "Hazen-Williams roughness coefficient (PVC = 150, cast iron = 100)" },
          { sym: "D", desc: "Pipe diameter (m)" },
        ],
        tip: "Common C values: PVC/HDPE = 150, new steel = 140, concrete = 120, old cast iron = 80–100.",
      },
      {
        name: "Net Positive Suction Head (NPSH)",
        formula: "NPSH_available = (P_atm + P_suction − P_vapor) ÷ (ρ × g) − h_f_suction",
        tip: "NPSH_available must exceed NPSH_required (from pump curve) to prevent cavitation. Cavitation causes noise, vibration, and impeller damage.",
      },
    ],
  },
  {
    id: "water-quality",
    label: "Water Quality Parameters",
    icon: "🧪",
    color: "#0F766E",
    bg: "#F0FDFA",
    formulas: [
      {
        name: "Hardness (as CaCO₃)",
        formula: "Total Hardness (mg/L as CaCO₃) = 2.5 × Ca²⁺ (mg/L) + 4.1 × Mg²⁺ (mg/L)",
        units: "mg/L as CaCO₃",
        variables: [
          { sym: "Ca²⁺", desc: "Calcium ion concentration (mg/L)" },
          { sym: "Mg²⁺", desc: "Magnesium ion concentration (mg/L)" },
          { sym: "2.5 / 4.1", desc: "Conversion factors to CaCO₃ equivalents" },
        ],
        tip: "Hardness classification: Soft < 75, Moderate 75–150, Hard 150–300, Very Hard > 300 mg/L as CaCO₃.",
      },
      {
        name: "Alkalinity",
        formula: "Alkalinity (mg/L as CaCO₃) = (mL titrant × N × 50,000) ÷ mL sample",
        tip: "Alkalinity is primarily bicarbonate (HCO₃⁻) in most natural waters. Provides buffering capacity. Minimum 30 mg/L needed for stable coagulation.",
      },
      {
        name: "pH and Hydrogen Ion",
        formula: "pH = −log₁₀[H⁺]",
        variables: [
          { sym: "[H⁺]", desc: "Hydrogen ion concentration (mol/L)" },
        ],
        tip: "Drinking water target: pH 7.0–8.5 (Health Canada guideline). pH affects disinfection efficiency, corrosion, and coagulation.",
      },
      {
        name: "Temperature Effect on Chlorine",
        formula: "Higher temp → faster reaction, lower CT required",
        tip: "At 5°C, CT required for Giardia inactivation is ~3× higher than at 25°C. Always use temperature-corrected CT tables.",
      },
      {
        name: "Iron and Manganese Removal",
        formula: "Oxidation: Fe²⁺ → Fe³⁺ (requires 0.14 mg/L Cl₂ per mg/L Fe²⁺)",
        tip: "Mn²⁺ oxidation requires pH > 8.0 for chlorine, or use KMnO₄ (0.5 mg/L KMnO₄ per mg/L Mn²⁺). Greensand filtration effective for both.",
      },
      {
        name: "Chlorine Residual Targets (Health Canada)",
        formula: "Free Cl₂ residual: 0.2–4.0 mg/L at point of entry; ≥ 0.05 mg/L at extremities",
        tip: "Maximum residual disinfectant level (MRDL): 4.0 mg/L free Cl₂. Chloramine systems: 3.0 mg/L total chloramine.",
      },
    ],
  },
];

// ── COMPONENT ────────────────────────────────────────────────────────────────
export default function FormulasWpiClass1() {
  usePageMeta({
    title: "WPI Class I Water Treatment Formulas — Echelon Institute",
    description:
      "WPI Class I Water Treatment formula sheet: CT values, chlorine dosage, flow rate, turbidity, chemical dosing, sedimentation, and pumping. Aligned with WPI Need-to-Know Criteria for BC, Alberta, Saskatchewan, and Manitoba.",
  });

  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0].id);
  const [expandedFormula, setExpandedFormula] = useState<string | null>(null);

  const activeCat = CATEGORIES.find(c => c.id === activeCategory)!;

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>      <style>{`
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

      <SiteNav currentPath="/formulas-wpi-class1" />

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #0F172A 0%, #164E63 50%, #0E7490 100%)",
        padding: "48px 24px 40px",
        textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(125,211,252,0.12)",
          border: "1px solid rgba(125,211,252,0.25)",
          borderRadius: 20, padding: "5px 16px", marginBottom: 16,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#7DD3FC", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            WPI — BC / AB / SK / MB
          </span>
        </div>
        <h1 style={{
          fontSize: "clamp(24px, 4vw, 40px)",
          fontWeight: 900, color: "#fff", margin: "0 0 12px",
          letterSpacing: "-0.5px", lineHeight: 1.15,
        }}>
          Class I Water Treatment<br />Formula Sheet
        </h1>
        <p style={{ fontSize: 15, color: "#94A3B8", maxWidth: 520, margin: "0 auto 24px", lineHeight: 1.6 }}>
          CT values, chlorine dosage, flow rate, turbidity, chemical dosing, sedimentation, and pumping —
          aligned with WPI Need-to-Know Criteria.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/wpi-class1-water">
            <button style={{
              padding: "10px 22px", borderRadius: 9,
              background: "linear-gradient(135deg, #0E7490, #1D4ED8)",
              color: "#fff", border: "none", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>Practice Quiz →</button>
          </Link>
          <Link href="/wpi-class1-water-mock">
            <button style={{
              padding: "10px 22px", borderRadius: 9,
              background: "rgba(255,255,255,0.1)",
              color: "#fff", border: "1px solid rgba(255,255,255,0.2)", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>Mock Exam →</button>
          </Link>
        </div>
      </div>

      {/* Category tabs */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #E2E8F0",
        padding: "0 24px",
        overflowX: "auto",
        display: "flex",
        gap: 4,
      }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: "14px 16px",
              border: "none",
              borderBottom: activeCategory === cat.id ? `3px solid ${cat.color}` : "3px solid transparent",
              background: "transparent",
              color: activeCategory === cat.id ? cat.color : "#64748B",
              fontSize: 12,
              fontWeight: activeCategory === cat.id ? 700 : 500,
              cursor: "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
              transition: "color 0.15s",
            }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Formula cards */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 80px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 12, marginBottom: 24,
        }}>
          <div style={{
            width: 4, height: 28, borderRadius: 4,
            background: activeCat.color,
          }} />
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: 0 }}>
            {activeCat.icon} {activeCat.label}
          </h2>
          <span style={{
            marginLeft: "auto",
            fontSize: 12, color: "#94A3B8", fontWeight: 600,
          }}>
            {activeCat.formulas.length} formula{activeCat.formulas.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {activeCat.formulas.map((f, idx) => {
            const key = `${activeCategory}-${idx}`;
            const isExpanded = expandedFormula === key;
            const hasDetails = f.variables || f.example || f.tip;
            return (
              <div
                key={key}
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  border: `1.5px solid ${isExpanded ? activeCat.color + "66" : "#E2E8F0"}`,
                  overflow: "hidden",
                  boxShadow: isExpanded ? `0 4px 16px ${activeCat.color}18` : "0 1px 4px rgba(0,0,0,0.05)",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
              >
                {/* Header row */}
                <div
                  onClick={() => hasDetails && setExpandedFormula(isExpanded ? null : key)}
                  style={{
                    padding: "18px 20px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 16,
                    cursor: hasDetails ? "pointer" : "default",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: activeCat.color,
                      textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6,
                    }}>
                      {f.name}
                    </div>
                    <div style={{
                      fontFamily: "'Courier New', monospace",
                      fontSize: 15, fontWeight: 700, color: "#0F172A",
                      background: activeCat.bg,
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: `1px solid ${activeCat.color}22`,
                      lineHeight: 1.5,
                    }}>
                      {f.formula}
                    </div>
                    {f.units && (
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 6, fontWeight: 600 }}>
                        Units: {f.units}
                      </div>
                    )}
                  </div>
                  {hasDetails && (
                    <div style={{
                      color: activeCat.color, fontSize: 18, fontWeight: 700,
                      transition: "transform 0.2s",
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      flexShrink: 0, marginTop: 4,
                    }}>
                      ▾
                    </div>
                  )}
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div style={{
                    padding: "0 20px 20px",
                    borderTop: `1px solid ${activeCat.color}22`,
                    display: "flex", flexDirection: "column", gap: 16,
                  }}>
                    {/* Variables */}
                    {f.variables && f.variables.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, marginTop: 16 }}>
                          Variables
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {f.variables.map(v => (
                            <div key={v.sym} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                              <code style={{
                                background: activeCat.bg,
                                border: `1px solid ${activeCat.color}33`,
                                borderRadius: 6, padding: "2px 8px",
                                fontSize: 12, fontWeight: 700, color: activeCat.color,
                                flexShrink: 0,
                              }}>{v.sym}</code>
                              <span style={{ fontSize: 13, color: "#475569", lineHeight: 1.5 }}>{v.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Example */}
                    {f.example && (
                      <div style={{
                        background: "#F8FAFC",
                        borderRadius: 10,
                        border: "1px solid #E2E8F0",
                        padding: "14px 16px",
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                          Worked Example
                        </div>
                        <div style={{ fontSize: 13, color: "#334155", marginBottom: 8, lineHeight: 1.6 }}>
                          <strong>Problem:</strong> {f.example.problem}
                        </div>
                        <div style={{ fontSize: 13, color: "#334155", marginBottom: 8, lineHeight: 1.6 }}>
                          <strong>Solution:</strong> {f.example.solution}
                        </div>
                        <div style={{
                          fontSize: 14, fontWeight: 700, color: activeCat.color,
                          background: activeCat.bg,
                          padding: "8px 12px", borderRadius: 8,
                          display: "inline-block",
                        }}>
                          ✓ {f.example.answer}
                        </div>
                      </div>
                    )}

                    {/* Tip */}
                    {f.tip && (
                      <div style={{
                        background: `${activeCat.color}0D`,
                        border: `1px solid ${activeCat.color}33`,
                        borderRadius: 10, padding: "12px 16px",
                        display: "flex", gap: 10, alignItems: "flex-start",
                      }}>
                        <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
                        <span style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>{f.tip}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick reference summary */}
        <div style={{
          marginTop: 48,
          background: "#0F172A",
          borderRadius: 16,
          padding: "28px 24px",
          color: "#fff",
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 16px", color: "#7DD3FC" }}>
            📋 WPI Class I Quick Reference
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {[
              { label: "Turbidity target", value: "≤ 0.3 NTU (95% of samples)" },
              { label: "Free Cl₂ residual", value: "0.2–4.0 mg/L at entry" },
              { label: "Giardia inactivation", value: "3-log (99.9%)" },
              { label: "Virus inactivation", value: "4-log (99.99%)" },
              { label: "Fluoride target", value: "0.7 mg/L (Health Canada)" },
              { label: "pH range (drinking water)", value: "7.0–8.5" },
              { label: "Alum optimal pH", value: "6.5–7.5" },
              { label: "Rapid mix G value", value: "300–1,000 s⁻¹" },
              { label: "Flocculation G value", value: "10–100 s⁻¹" },
              { label: "Typical SOR", value: "20–40 m/d" },
              { label: "Rapid sand filter rate", value: "5–15 m/h" },
              { label: "Backwash rate", value: "30–60 m/h" },
            ].map(item => (
              <div key={item.label} style={{
                background: "rgba(255,255,255,0.05)",
                borderRadius: 8, padding: "10px 14px",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#7DD3FC" }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation links */}
        <div style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/wpi-class1-water">
            <button style={{
              padding: "11px 22px", borderRadius: 9,
              background: "linear-gradient(135deg, #0E7490, #1D4ED8)",
              color: "#fff", border: "none", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              🌊 WPI Class I Practice Quiz →
            </button>
          </Link>
          <Link href="/wpi-class1-water-mock">
            <button style={{
              padding: "11px 22px", borderRadius: 9,
              background: "#fff", color: "#0F172A",
              border: "1.5px solid #E2E8F0", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              📋 WPI Class I Mock Exam →
            </button>
          </Link>
          <Link href="/pricing">
            <button style={{
              padding: "11px 22px", borderRadius: 9,
              background: "#fff", color: "#0F172A",
              border: "1.5px solid #E2E8F0", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              🎫 Get Full Access →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
