// FormulasWater2.tsx — Class 2 Water Treatment Operator Formula Sheet
// Covers: Treatment Process, Laboratory Analysis, Equipment O&M,
//         Source Water Characteristics, Security/Safety/Administrative
// Design: Blue brand, mirrors FormulasWater1.tsx structure

import { useState } from "react";
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import SiteNav from "@/components/SiteNav";

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

const CATEGORIES: FormulaCategory[] = [
  {
    id: "treatment-process",
    label: "Treatment Process",
    icon: "⚗️",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    formulas: [
      {
        name: "Langelier Saturation Index (LSI)",
        formula: "LSI = pH − pHs",
        units: "dimensionless",
        variables: [
          { sym: "pH", desc: "Measured water pH" },
          { sym: "pHs", desc: "Saturation pH = pK2 − pKs + pCa + pAlk" },
        ],
        example: {
          problem: "Measured pH = 7.8, pHs = 7.5. What is the LSI?",
          solution: "LSI = 7.8 − 7.5",
          answer: "LSI = +0.3 (slightly scale-forming)",
        },
        tip: "LSI > 0 → scale-forming (corrosive to pipes if CaCO₃ deposits). LSI < 0 → corrosive. Target: −0.5 to +0.5 for distribution systems.",
      },
      {
        name: "Calcium Carbonate Precipitation Potential (CCPP)",
        formula: "CCPP (mg/L as CaCO₃) = (Alk_actual − Alk_sat) × 50",
        units: "mg/L as CaCO₃",
        variables: [
          { sym: "Alk_actual", desc: "Measured alkalinity (meq/L)" },
          { sym: "Alk_sat", desc: "Alkalinity at saturation pH (meq/L)" },
          { sym: "50", desc: "Equivalent weight of CaCO₃" },
        ],
        tip: "CCPP > 0 → water will deposit CaCO₃ (protective coating). CCPP < 0 → water will dissolve CaCO₃ (corrosive). Target CCPP: 4–10 mg/L for corrosion control.",
      },
      {
        name: "Coagulant Dose — Alum",
        formula: "Alum dose (mg/L) = [Alum feed rate (kg/d)] ÷ [Flow (ML/d) × 1,000]",
        units: "mg/L",
        variables: [
          { sym: "Feed rate", desc: "Alum fed per day (kg/d)" },
          { sym: "Flow", desc: "Plant flow (ML/d)" },
        ],
        example: {
          problem: "Plant flow = 15 ML/d. Alum feed rate = 120 kg/d. What is the dose?",
          solution: "Dose = 120 ÷ (15 × 1,000) = 120 ÷ 15,000",
          answer: "8 mg/L",
        },
        tip: "Alum reacts with alkalinity: Al₂(SO₄)₃ + 6 HCO₃⁻ → 2 Al(OH)₃ + 3 SO₄²⁻ + 6 CO₂. Each 1 mg/L alum consumes ~0.5 mg/L alkalinity as CaCO₃.",
      },
      {
        name: "Rapid Mix Velocity Gradient (G)",
        formula: "G (s⁻¹) = √(P ÷ (μ × V))",
        units: "s⁻¹",
        variables: [
          { sym: "P", desc: "Power input (W)" },
          { sym: "μ", desc: "Dynamic viscosity of water (Pa·s) ≈ 0.001 at 20°C" },
          { sym: "V", desc: "Basin volume (m³)" },
        ],
        example: {
          problem: "Motor power = 5,000 W, basin volume = 10 m³, μ = 0.001 Pa·s. Find G.",
          solution: "G = √(5,000 ÷ (0.001 × 10)) = √(500,000)",
          answer: "G ≈ 707 s⁻¹",
        },
        tip: "Rapid mix: G = 300–1,000 s⁻¹. Flocculation: G = 10–75 s⁻¹. Gt (camp number) = 10⁴–10⁵ for effective floc formation.",
      },
      {
        name: "Filter Run Volume",
        formula: "Run Volume (m³) = Flow Rate (m³/h) × Run Time (h)",
        units: "m³",
        variables: [
          { sym: "Flow Rate", desc: "Filtration rate through filter (m³/h)" },
          { sym: "Run Time", desc: "Hours between backwashes" },
        ],
        example: {
          problem: "Filter area = 20 m², filtration rate = 10 m/h, run time = 48 h. Find run volume.",
          solution: "Flow = 20 × 10 = 200 m³/h; Volume = 200 × 48",
          answer: "9,600 m³",
        },
        tip: "Class 2 filter design: surface loading rate typically 5–15 m/h (conventional), up to 25 m/h (pressure filters). Backwash typically 36–60 m/h.",
      },
      {
        name: "Membrane Flux",
        formula: "Flux (L/m²/h) = Permeate Flow (L/h) ÷ Membrane Area (m²)",
        units: "L/m²/h (LMH)",
        variables: [
          { sym: "Permeate Flow", desc: "Volume of water passing through membrane per hour (L/h)" },
          { sym: "Membrane Area", desc: "Total active membrane surface area (m²)" },
        ],
        example: {
          problem: "Permeate flow = 50,000 L/h, membrane area = 500 m². Find flux.",
          solution: "Flux = 50,000 ÷ 500",
          answer: "100 LMH",
        },
        tip: "Typical UF/MF flux: 40–120 LMH. High flux → more fouling. TMP (transmembrane pressure) increases as membranes foul.",
      },
      {
        name: "Recovery Rate (Membrane)",
        formula: "Recovery (%) = [Permeate Flow ÷ Feed Flow] × 100",
        units: "%",
        variables: [
          { sym: "Permeate Flow", desc: "Water passing through membrane (m³/h)" },
          { sym: "Feed Flow", desc: "Total influent to membrane system (m³/h)" },
        ],
        example: {
          problem: "Feed = 100 m³/h, permeate = 85 m³/h. What is recovery?",
          solution: "Recovery = (85 ÷ 100) × 100",
          answer: "85%",
        },
        tip: "Higher recovery → less waste, but higher fouling risk. Typical UF recovery: 85–95%. Concentrate (reject) must be managed.",
      },
    ],
  },
  {
    id: "laboratory-analysis",
    label: "Laboratory Analysis",
    icon: "🔬",
    color: "#A16207",
    bg: "#FEF9C3",
    formulas: [
      {
        name: "Turbidity Removal",
        formula: "Removal (%) = [(Turb_in − Turb_out) ÷ Turb_in] × 100",
        units: "%",
        variables: [
          { sym: "Turb_in", desc: "Raw water turbidity (NTU)" },
          { sym: "Turb_out", desc: "Treated water turbidity (NTU)" },
        ],
        example: {
          problem: "Raw = 25 NTU, treated = 0.2 NTU. Removal?",
          solution: "Removal = [(25 − 0.2) ÷ 25] × 100 = (24.8 ÷ 25) × 100",
          answer: "99.2%",
        },
        tip: "O. Reg. 170/03: treated turbidity must be ≤ 1 NTU at all times and ≤ 0.3 NTU in 95% of samples each month.",
      },
      {
        name: "Chlorine Demand",
        formula: "Demand (mg/L) = Dose (mg/L) − Residual (mg/L)",
        units: "mg/L",
        variables: [
          { sym: "Dose", desc: "Chlorine applied (mg/L)" },
          { sym: "Residual", desc: "Free chlorine remaining after contact (mg/L)" },
        ],
        example: {
          problem: "Chlorine dose = 3.5 mg/L, residual after 30 min = 0.8 mg/L. What is the demand?",
          solution: "Demand = 3.5 − 0.8",
          answer: "2.7 mg/L",
        },
        tip: "High demand indicates organic load, ammonia, or iron/manganese. Break-point chlorination eliminates ammonia; dose must exceed demand to reach free residual.",
      },
      {
        name: "Alkalinity (Titration)",
        formula: "Alkalinity (mg/L as CaCO₃) = [mL titrant × N × 50,000] ÷ mL sample",
        units: "mg/L as CaCO₃",
        variables: [
          { sym: "mL titrant", desc: "Volume of H₂SO₄ used (mL)" },
          { sym: "N", desc: "Normality of H₂SO₄ (typically 0.02 N)" },
          { sym: "50,000", desc: "Equivalent weight of CaCO₃ × 1,000" },
          { sym: "mL sample", desc: "Sample volume (mL)" },
        ],
        example: {
          problem: "5.2 mL of 0.02 N H₂SO₄ used to titrate 100 mL sample. Find alkalinity.",
          solution: "Alkalinity = (5.2 × 0.02 × 50,000) ÷ 100 = 5,200 ÷ 100",
          answer: "52 mg/L as CaCO₃",
        },
        tip: "P-alkalinity (to pH 8.3) = carbonate + hydroxide. M-alkalinity (to pH 4.5) = total alkalinity. For corrosion control, target alkalinity ≥ 40 mg/L as CaCO₃.",
      },
      {
        name: "Hardness (Total)",
        formula: "Total Hardness (mg/L as CaCO₃) = Ca hardness + Mg hardness",
        units: "mg/L as CaCO₃",
        variables: [
          { sym: "Ca hardness", desc: "Calcium hardness = [Ca²⁺ mg/L ÷ 40.08] × 100" },
          { sym: "Mg hardness", desc: "Magnesium hardness = [Mg²⁺ mg/L ÷ 24.31] × 100" },
        ],
        example: {
          problem: "Ca²⁺ = 60 mg/L, Mg²⁺ = 12 mg/L. Find total hardness.",
          solution: "Ca hardness = (60 ÷ 40.08) × 100 = 149.7; Mg hardness = (12 ÷ 24.31) × 100 = 49.4",
          answer: "≈ 199 mg/L as CaCO₃",
        },
        tip: "Soft: < 75 mg/L. Moderate: 75–150. Hard: 150–300. Very hard: > 300 mg/L as CaCO₃. Ontario MAC for hardness: no regulatory limit, but aesthetic objective ≤ 200 mg/L.",
      },
      {
        name: "Relative Percent Difference (RPD)",
        formula: "RPD (%) = |A − B| ÷ [(A + B) ÷ 2] × 100",
        units: "%",
        variables: [
          { sym: "A", desc: "First duplicate result" },
          { sym: "B", desc: "Second duplicate result" },
        ],
        example: {
          problem: "Duplicate turbidity results: 0.42 NTU and 0.46 NTU. Find RPD.",
          solution: "RPD = |0.42 − 0.46| ÷ [(0.42 + 0.46) ÷ 2] × 100 = 0.04 ÷ 0.44 × 100",
          answer: "9.1%",
        },
        tip: "Acceptable RPD depends on the parameter and method. Typically ≤ 20% for most water quality parameters. Higher RPD may indicate contamination, matrix interference, or analyst error.",
      },
      {
        name: "Percent Recovery (Spike)",
        formula: "Recovery (%) = [(Spiked − Unspiked) ÷ Spike Amount] × 100",
        units: "%",
        variables: [
          { sym: "Spiked", desc: "Concentration measured in spiked sample" },
          { sym: "Unspiked", desc: "Concentration in original sample" },
          { sym: "Spike Amount", desc: "Known concentration added" },
        ],
        example: {
          problem: "Unspiked = 2.0 mg/L, spiked = 4.7 mg/L, spike added = 3.0 mg/L. Recovery?",
          solution: "Recovery = [(4.7 − 2.0) ÷ 3.0] × 100 = 2.7 ÷ 3.0 × 100",
          answer: "90%",
        },
        tip: "Acceptable recovery range: typically 80–120%. Low recovery suggests matrix interference or analyte loss. High recovery may indicate contamination.",
      },
    ],
  },
  {
    id: "equipment-om",
    label: "Equipment O&M",
    icon: "🔧",
    color: "#15803D",
    bg: "#DCFCE7",
    formulas: [
      {
        name: "Pump Efficiency",
        formula: "Efficiency (%) = [Water Power (kW) ÷ Motor Power (kW)] × 100",
        units: "%",
        variables: [
          { sym: "Water Power", desc: "Power delivered to water = ρgQH ÷ 1,000 (kW)" },
          { sym: "Motor Power", desc: "Electrical power input to motor (kW)" },
        ],
        example: {
          problem: "Pump delivers 50 L/s against 30 m head. Motor draws 22 kW. Find efficiency.",
          solution: "Water Power = (1,000 × 9.81 × 0.05 × 30) ÷ 1,000 = 14.7 kW; Eff = (14.7 ÷ 22) × 100",
          answer: "66.8%",
        },
        tip: "Well-maintained pumps: 70–85% efficiency. Efficiency drops with wear, cavitation, or operation far from BEP (best efficiency point).",
      },
      {
        name: "Total Dynamic Head (TDH)",
        formula: "TDH (m) = Static Head + Friction Head + Velocity Head + Minor Losses",
        units: "metres",
        variables: [
          { sym: "Static Head", desc: "Elevation difference between suction and discharge (m)" },
          { sym: "Friction Head", desc: "Head loss due to pipe friction (Darcy-Weisbach or Hazen-Williams)" },
          { sym: "Velocity Head", desc: "v² ÷ (2g), usually small" },
        ],
        tip: "Hazen-Williams: hf = 10.67 × L × Q^1.852 ÷ (C^1.852 × D^4.87). C = 130 for new PVC, 100 for old cast iron.",
      },
      {
        name: "Motor Power (kW)",
        formula: "P (kW) = (ρ × g × Q × H) ÷ (1,000 × η)",
        units: "kW",
        variables: [
          { sym: "ρ", desc: "Water density ≈ 1,000 kg/m³" },
          { sym: "g", desc: "Gravitational acceleration = 9.81 m/s²" },
          { sym: "Q", desc: "Flow rate (m³/s)" },
          { sym: "H", desc: "Total dynamic head (m)" },
          { sym: "η", desc: "Combined pump + motor efficiency (decimal)" },
        ],
        example: {
          problem: "Q = 0.08 m³/s, H = 40 m, η = 0.75. Find motor power.",
          solution: "P = (1,000 × 9.81 × 0.08 × 40) ÷ (1,000 × 0.75) = 31,392 ÷ 750",
          answer: "41.9 kW",
        },
      },
      {
        name: "Chemical Feed Pump Rate",
        formula: "Feed Rate (mL/min) = [Dose (mg/L) × Flow (L/min)] ÷ Solution Strength (mg/mL)",
        units: "mL/min",
        variables: [
          { sym: "Dose", desc: "Target chemical dose (mg/L)" },
          { sym: "Flow", desc: "Plant flow rate (L/min)" },
          { sym: "Solution Strength", desc: "Concentration of chemical solution being pumped (mg/mL)" },
        ],
        example: {
          problem: "Dose = 5 mg/L, plant flow = 2,000 L/min, solution = 10% (100 mg/mL). Feed rate?",
          solution: "Feed Rate = (5 × 2,000) ÷ 100 = 10,000 ÷ 100",
          answer: "100 mL/min",
        },
        tip: "Always verify feed pump calibration with a bucket-and-stopwatch test. Diaphragm pumps drift ±5–10% over time.",
      },
      {
        name: "Pipe Flow Velocity",
        formula: "v (m/s) = Q (m³/s) ÷ A (m²)  where A = π × (D/2)²",
        units: "m/s",
        variables: [
          { sym: "Q", desc: "Flow rate (m³/s)" },
          { sym: "D", desc: "Pipe internal diameter (m)" },
          { sym: "A", desc: "Pipe cross-sectional area (m²)" },
        ],
        example: {
          problem: "Q = 0.05 m³/s through a 200 mm (0.2 m) pipe. Find velocity.",
          solution: "A = π × (0.1)² = 0.0314 m²; v = 0.05 ÷ 0.0314",
          answer: "1.59 m/s",
        },
        tip: "Distribution mains: target 0.6–1.5 m/s. Above 3 m/s → erosion risk. Below 0.3 m/s → sediment deposition and biological growth.",
      },
    ],
  },
  {
    id: "source-water",
    label: "Source Water Characteristics",
    icon: "🌊",
    color: "#6D28D9",
    bg: "#EDE9FE",
    formulas: [
      {
        name: "Specific UV Absorbance (SUVA)",
        formula: "SUVA (L/mg·m) = [UV₂₅₄ (m⁻¹) ÷ DOC (mg/L)] × 100",
        units: "L/mg·m",
        variables: [
          { sym: "UV₂₅₄", desc: "UV absorbance at 254 nm (cm⁻¹), multiply by 100 to convert to m⁻¹" },
          { sym: "DOC", desc: "Dissolved organic carbon (mg/L)" },
        ],
        example: {
          problem: "UV₂₅₄ = 0.18 cm⁻¹, DOC = 4.5 mg/L. Find SUVA.",
          solution: "SUVA = (0.18 × 100) ÷ 4.5 = 18 ÷ 4.5",
          answer: "4.0 L/mg·m",
        },
        tip: "SUVA < 2 → low humic content, coagulation less effective. SUVA 2–4 → moderate NOM. SUVA > 4 → high humic, enhanced coagulation recommended (O. Reg. 170/03 Schedule 6).",
      },
      {
        name: "Disinfection By-Product Formation Potential",
        formula: "THM Formation ∝ DOC × Cl₂ dose × contact time × temperature",
        tip: "Higher DOC, higher Cl₂ dose, longer contact time, and warmer water → more THMs and HAAs. Ontario MAC: THMs ≤ 100 µg/L, HAAs ≤ 80 µg/L (running annual average).",
      },
      {
        name: "Saturation DO (Temperature Correction)",
        formula: "DO_sat decreases ~0.2 mg/L per 1°C rise in temperature",
        tip: "At 20°C, DO_sat ≈ 9.1 mg/L. At 10°C ≈ 11.3 mg/L. Cold source water holds more oxygen — important for iron/manganese oxidation and biological treatment.",
      },
      {
        name: "Jar Test — Optimal Coagulant Dose",
        formula: "Optimal dose = lowest coagulant concentration achieving turbidity ≤ 0.3 NTU at pH 6.5–7.5",
        tip: "Jar test procedure: 6 jars, rapid mix 1 min at 200 rpm, slow mix 20 min at 30 rpm, settle 30 min, measure turbidity and pH. Vary coagulant dose across jars.",
      },
    ],
  },
  {
    id: "security-safety",
    label: "Security, Safety & Administrative",
    icon: "🛡️",
    color: "#B91C1C",
    bg: "#FEE2E2",
    formulas: [
      {
        name: "CT Value (Disinfection)",
        formula: "CT (mg·min/L) = C (mg/L) × T₁₀ (min)",
        units: "mg·min/L",
        variables: [
          { sym: "C", desc: "Disinfectant residual at the point of measurement (mg/L)" },
          { sym: "T₁₀", desc: "Time for 10% of tracer to appear at outlet (min) — conservative contact time" },
        ],
        example: {
          problem: "Free Cl₂ = 1.2 mg/L, T₁₀ = 25 min. Find CT.",
          solution: "CT = 1.2 × 25",
          answer: "30 mg·min/L",
        },
        tip: "Ontario requires CT ≥ 6 mg·min/L for Giardia inactivation (2-log) at pH 6–9 and ≥ 0°C. Higher CT required at lower temperatures and higher pH.",
      },
      {
        name: "Log Inactivation",
        formula: "Log inactivation = log₁₀(N₀ ÷ N)",
        units: "log units",
        variables: [
          { sym: "N₀", desc: "Initial pathogen concentration" },
          { sym: "N", desc: "Remaining pathogen concentration after treatment" },
        ],
        example: {
          problem: "Initial Giardia = 10,000 cysts/L, after treatment = 10 cysts/L. Log inactivation?",
          solution: "Log = log₁₀(10,000 ÷ 10) = log₁₀(1,000)",
          answer: "3-log (99.9% removal)",
        },
        tip: "O. Reg. 170/03 requires 3-log removal/inactivation of Giardia and 4-log for viruses. Filtration credits: 2-log Giardia, 2-log virus. Remaining must come from disinfection.",
      },
      {
        name: "Chlorine Dose for Breakpoint",
        formula: "Breakpoint dose ≈ 7.6 × NH₃-N (mg/L)",
        units: "mg/L Cl₂",
        variables: [
          { sym: "NH₃-N", desc: "Ammonia-nitrogen concentration (mg/L)" },
        ],
        example: {
          problem: "Source water has 0.5 mg/L NH₃-N. Estimate breakpoint chlorine dose.",
          solution: "Dose ≈ 7.6 × 0.5",
          answer: "≈ 3.8 mg/L Cl₂",
        },
        tip: "Breakpoint chlorination destroys chloramines. Must dose past the breakpoint hump to achieve free residual. Chloramines form at Cl₂:N ratios < 7.6:1.",
      },
      {
        name: "Chemical Inventory Days of Supply",
        formula: "Days of Supply = Inventory (kg) ÷ Daily Usage (kg/d)",
        units: "days",
        variables: [
          { sym: "Inventory", desc: "Current chemical stock on hand (kg)" },
          { sym: "Daily Usage", desc: "Average chemical consumption per day (kg/d)" },
        ],
        example: {
          problem: "Chlorine inventory = 500 kg. Daily usage = 12 kg/d. Days of supply?",
          solution: "Days = 500 ÷ 12",
          answer: "41.7 days",
        },
        tip: "Ontario regulations require minimum 15-day chemical supply for critical chemicals (chlorine, coagulant). Many utilities target 30 days.",
      },
    ],
  },
  {
    id: "regulatory",
    label: "Ontario Regulatory Limits",
    icon: "📋",
    color: "#0F766E",
    bg: "#CCFBF1",
    formulas: [
      {
        name: "Drinking Water Quality Standards (O. Reg. 169/03)",
        formula: "Key MACs: THMs ≤ 100 µg/L · HAAs ≤ 80 µg/L · Nitrate ≤ 10 mg/L · Lead ≤ 0.010 mg/L · Arsenic ≤ 0.010 mg/L · Turbidity ≤ 1 NTU",
        tip: "MAC = Maximum Acceptable Concentration. Aesthetic objectives (AOs) are advisory, not regulatory: e.g., hardness AO ≤ 200 mg/L, iron AO ≤ 0.3 mg/L, manganese AO ≤ 0.05 mg/L.",
      },
      {
        name: "Chlorine Residual Requirements (O. Reg. 170/03)",
        formula: "Minimum free Cl₂: ≥ 0.05 mg/L at all points in distribution · Target entry point: ≥ 0.2 mg/L",
        tip: "Maximum residual: 4.0 mg/L (aesthetic objective). Chloramine systems: maintain combined residual ≥ 0.25 mg/L. Boil water advisories triggered when residual drops to 0.",
      },
      {
        name: "Sampling Frequency (O. Reg. 170/03 Schedule 10)",
        formula: "Microbiological: monthly minimum · More frequent for larger systems · Adverse results trigger immediate resampling",
        tip: "Class 2 systems typically serve populations 500–2,500. Sampling frequency scales with population. Adverse E. coli result → 24-hour notification to MOE and public health unit.",
      },
      {
        name: "Operator Certification (O. Reg. 128/04)",
        formula: "Class 2 Water Treatment: minimum Class 2 OIT certification required for operator-in-charge",
        tip: "Operator-in-charge must hold certification equal to or higher than the facility class. Class 2 water treatment facilities require a Class 2 or higher certified operator on duty or on call.",
      },
    ],
  },
];

// ── RENDER HELPERS ────────────────────────────────────────────────────────────
function FormulaCard({ f }: { f: Formula }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "16px 20px", marginBottom: 12 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>{f.name}</div>
            <code style={{ fontSize: 13, background: "#F1F5F9", padding: "4px 10px", borderRadius: 6, color: "#1D4ED8", fontFamily: "monospace", display: "inline-block", lineHeight: 1.5 }}>
              {f.formula}
            </code>
            {f.units && <span style={{ fontSize: 11, color: "#64748B", marginLeft: 8 }}>[{f.units}]</span>}
          </div>
          <span style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>{open ? "▲" : "▼"}</span>
        </div>
      </button>
      {open && (
        <div style={{ marginTop: 14, borderTop: "1px solid #F1F5F9", paddingTop: 14 }}>
          {f.variables && f.variables.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Variables</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {f.variables.map(v => (
                  <div key={v.sym} style={{ display: "flex", gap: 10, fontSize: 13 }}>
                    <code style={{ background: "#F8FAFC", padding: "1px 6px", borderRadius: 4, color: "#7C3AED", fontFamily: "monospace", flexShrink: 0, minWidth: 40, textAlign: "center" }}>{v.sym}</code>
                    <span style={{ color: "#475569" }}>{v.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {f.example && (
            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#15803D", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Worked Example</div>
              <div style={{ fontSize: 13, color: "#1E293B", marginBottom: 4 }}><strong>Q:</strong> {f.example.problem}</div>
              <div style={{ fontSize: 13, color: "#475569", marginBottom: 4 }}><strong>Solution:</strong> {f.example.solution}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#15803D" }}>✓ {f.example.answer}</div>
            </div>
          )}
          {f.tip && (
            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "10px 14px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#92400E", textTransform: "uppercase", letterSpacing: "0.08em" }}>💡 Exam Tip</span>
              <p style={{ fontSize: 13, color: "#78350F", margin: "4px 0 0", lineHeight: 1.6 }}>{f.tip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FormulasWater2() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  usePageMeta({
    title: "Class 2 Water Formula Sheet | Echelon Institute",
    description: "Complete formula reference for the Ontario Class 2 Water Treatment operator exam — treatment process, lab analysis, equipment O&M, source water, and regulatory limits.",
  });

  const filtered = CATEGORIES
    .filter(c => !activeCategory || c.id === activeCategory)
    .map(c => ({
      ...c,
      formulas: search
        ? c.formulas.filter(f =>
            f.name.toLowerCase().includes(search.toLowerCase()) ||
            f.formula.toLowerCase().includes(search.toLowerCase()) ||
            (f.tip ?? "").toLowerCase().includes(search.toLowerCase())
          )
        : c.formulas,
    }))
    .filter(c => c.formulas.length > 0);

  const totalFormulas = CATEGORIES.reduce((s, c) => s + c.formulas.length, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Sora', sans-serif" }}>
      <SiteNav currentPath="/formulas-water2" />

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1D4ED8 0%, #0E7490 100%)", color: "#fff", padding: "48px 24px 40px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚗️</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, margin: "0 0 8px", letterSpacing: "-0.5px" }}>Class 2 Water Formula Sheet</h1>
        <p style={{ fontSize: 16, opacity: 0.85, margin: "0 0 20px" }}>
          {totalFormulas} formulas across {CATEGORIES.length} categories · Ontario Class 2 Water Treatment
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/class2-water">
            <button style={{ padding: "9px 18px", borderRadius: 8, background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              ← Practice Quiz
            </button>
          </Link>
          <Link href="/class2-water-mock">
            <button style={{ padding: "9px 18px", borderRadius: 8, background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              📋 Mock Exam
            </button>
          </Link>
        </div>
      </div>

      {/* Search + filter */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px 0" }}>
        <input
          type="text"
          placeholder="Search formulas, variables, or keywords…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 14, fontFamily: "inherit", outline: "none", marginBottom: 16, boxSizing: "border-box" }}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          <button
            onClick={() => setActiveCategory(null)}
            style={{ padding: "6px 14px", borderRadius: 20, border: "1.5px solid #E2E8F0", background: !activeCategory ? "#1D4ED8" : "#fff", color: !activeCategory ? "#fff" : "#475569", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            All
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(activeCategory === c.id ? null : c.id)}
              style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${c.color}`, background: activeCategory === c.id ? c.color : "#fff", color: activeCategory === c.id ? "#fff" : c.color, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* Categories */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#94A3B8", fontSize: 15 }}>
            No formulas match "{search}". Try a different keyword.
          </div>
        ) : (
          filtered.map(cat => (
            <div key={cat.id} style={{ marginBottom: 36 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: cat.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{cat.icon}</div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: cat.color, margin: 0 }}>{cat.label}</h2>
                  <div style={{ fontSize: 12, color: "#94A3B8" }}>{cat.formulas.length} formula{cat.formulas.length !== 1 ? "s" : ""}</div>
                </div>
              </div>
              {cat.formulas.map(f => <FormulaCard key={f.name} f={f} />)}
            </div>
          ))
        )}

        <div style={{ textAlign: "center", padding: "32px 0 48px", fontSize: 12, color: "#94A3B8" }}>
          Formulas reference Ontario Regulation 169/03, O. Reg. 170/03, O. Reg. 128/04, and standard water treatment engineering references.
        </div>
      </div>
    </div>
  );
}
