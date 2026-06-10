// WPI Class II Water Treatment — Formula Sheet
// Covers: Advanced CT & Ozone Disinfection, Membrane Filtration, Advanced Hydraulics,
//         Chemical Dosing & Coagulation, Ozone & UV Systems, Sludge Management, Pumping & Energy
// Aligned with WPI Class II Need-to-Know Criteria (BC/AB/SK/MB)
// Design: Teal/green brand, mirrors FormulasWpiClass1.tsx structure

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
    id: "ozone-uv",
    label: "Ozone & UV Disinfection",
    icon: "⚡",
    color: "#0F766E",
    bg: "#F0FDFA",
    formulas: [
      {
        name: "Ozone CT Value",
        formula: "CT_O₃ = C_O₃ × T₁₀",
        units: "mg·min/L",
        variables: [
          { sym: "CT_O₃", desc: "Ozone disinfection credit (mg·min/L)" },
          { sym: "C_O₃", desc: "Residual ozone concentration at outlet (mg/L)" },
          { sym: "T₁₀", desc: "10th percentile contact time (min)" },
        ],
        example: {
          problem: "Ozone residual = 0.4 mg/L, T₁₀ = 8 min. What is the CT?",
          solution: "CT = 0.4 × 8",
          answer: "3.2 mg·min/L",
        },
        tip: "Ozone is ~10× more effective than chlorine at equivalent CT. Required CT for Giardia 3-log inactivation at 15°C is ~1.43 mg·min/L.",
      },
      {
        name: "Ozone Transfer Efficiency",
        formula: "OTE = (O₃_transferred / O₃_applied) × 100",
        units: "%",
        variables: [
          { sym: "OTE", desc: "Ozone transfer efficiency (%)" },
          { sym: "O₃_transferred", desc: "Mass of ozone dissolved in water (g/h)" },
          { sym: "O₃_applied", desc: "Mass of ozone fed to contactor (g/h)" },
        ],
        example: {
          problem: "Ozone applied = 200 g/h, ozone transferred = 170 g/h. What is OTE?",
          solution: "OTE = (170 / 200) × 100",
          answer: "85%",
        },
        tip: "Typical OTE for fine bubble diffusers is 80–95%. Higher water depth and smaller bubbles improve OTE.",
      },
      {
        name: "UV Dose",
        formula: "UV Dose = Intensity × Time",
        units: "mJ/cm²",
        variables: [
          { sym: "UV Dose", desc: "Inactivation credit (mJ/cm²)" },
          { sym: "Intensity", desc: "UV irradiance at sensor (mW/cm²)" },
          { sym: "Time", desc: "Exposure time (seconds)" },
        ],
        example: {
          problem: "UV intensity = 15 mW/cm², exposure time = 3 s. What is the UV dose?",
          solution: "UV Dose = 15 × 3",
          answer: "45 mJ/cm²",
        },
        tip: "Health Canada requires ≥40 mJ/cm² for 3-log Cryptosporidium inactivation. UV dose is validated using biodosimetry (challenge testing).",
      },
      {
        name: "UV Transmittance",
        formula: "UVT = 10^(−A) × 100",
        units: "%",
        variables: [
          { sym: "UVT", desc: "UV transmittance at 254 nm (%)" },
          { sym: "A", desc: "UV absorbance at 254 nm (unitless)" },
        ],
        example: {
          problem: "UV absorbance = 0.10. What is the UVT?",
          solution: "UVT = 10^(−0.10) × 100 = 0.794 × 100",
          answer: "79.4%",
        },
        tip: "Higher UVT means cleaner water and better UV penetration. Surface water typically 70–90% UVT; groundwater 90–98% UVT.",
      },
    ],
  },
  {
    id: "membrane",
    label: "Membrane Filtration",
    icon: "🔬",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    formulas: [
      {
        name: "Flux Rate",
        formula: "J = Q / A",
        units: "L/m²·h (LMH)",
        variables: [
          { sym: "J", desc: "Flux (LMH — litres per square metre per hour)" },
          { sym: "Q", desc: "Permeate flow rate (L/h)" },
          { sym: "A", desc: "Total membrane area (m²)" },
        ],
        example: {
          problem: "Permeate flow = 50,000 L/h, membrane area = 500 m². What is the flux?",
          solution: "J = 50,000 / 500",
          answer: "100 LMH",
        },
        tip: "Typical design flux: MF/UF 20–80 LMH, NF 10–30 LMH, RO 15–25 LMH. Higher flux increases fouling risk.",
      },
      {
        name: "Recovery Rate",
        formula: "R = (Q_permeate / Q_feed) × 100",
        units: "%",
        variables: [
          { sym: "R", desc: "System recovery (%)" },
          { sym: "Q_permeate", desc: "Permeate (product) flow (m³/h)" },
          { sym: "Q_feed", desc: "Feed water flow (m³/h)" },
        ],
        example: {
          problem: "Feed = 100 m³/h, permeate = 85 m³/h. What is the recovery?",
          solution: "R = (85 / 100) × 100",
          answer: "85%",
        },
        tip: "MF/UF typically 90–98% recovery. RO typically 70–85%. Higher recovery means less concentrate waste but more fouling.",
      },
      {
        name: "Transmembrane Pressure (TMP)",
        formula: "TMP = (P_feed + P_concentrate) / 2 − P_permeate",
        units: "kPa or psi",
        variables: [
          { sym: "TMP", desc: "Transmembrane pressure (kPa)" },
          { sym: "P_feed", desc: "Feed side pressure (kPa)" },
          { sym: "P_concentrate", desc: "Concentrate side pressure (kPa)" },
          { sym: "P_permeate", desc: "Permeate side pressure (kPa)" },
        ],
        example: {
          problem: "P_feed = 200 kPa, P_concentrate = 180 kPa, P_permeate = 10 kPa. What is TMP?",
          solution: "TMP = (200 + 180) / 2 − 10 = 190 − 10",
          answer: "180 kPa",
        },
        tip: "Rising TMP at constant flux indicates fouling. Trigger backwash or chemical cleaning when TMP exceeds design threshold (typically 1.5–2× initial TMP).",
      },
      {
        name: "Concentration Factor (CF)",
        formula: "CF = 1 / (1 − R)",
        units: "dimensionless",
        variables: [
          { sym: "CF", desc: "Concentration factor of rejected species" },
          { sym: "R", desc: "Recovery fraction (decimal, not %)" },
        ],
        example: {
          problem: "System recovery = 80% (R = 0.80). What is the CF?",
          solution: "CF = 1 / (1 − 0.80) = 1 / 0.20",
          answer: "5×",
        },
        tip: "At 80% recovery, rejected contaminants concentrate 5× in the reject stream. Use CF to size concentrate disposal systems.",
      },
    ],
  },
  {
    id: "advanced-hydraulics",
    label: "Advanced Hydraulics & Pipe Systems",
    icon: "🌊",
    color: "#0369A1",
    bg: "#E0F2FE",
    formulas: [
      {
        name: "Hazen-Williams Equation",
        formula: "V = 0.8492 × C × R^0.63 × S^0.54",
        units: "m/s",
        variables: [
          { sym: "V", desc: "Flow velocity (m/s)" },
          { sym: "C", desc: "Hazen-Williams roughness coefficient (dimensionless)" },
          { sym: "R", desc: "Hydraulic radius = A/P (m)" },
          { sym: "S", desc: "Hydraulic slope = head loss / pipe length (m/m)" },
        ],
        tip: "C values: new PVC = 150, new ductile iron = 130, old cast iron = 80–100. Lower C = more friction loss.",
      },
      {
        name: "Darcy-Weisbach Head Loss",
        formula: "h_f = f × (L/D) × (V²/2g)",
        units: "m",
        variables: [
          { sym: "h_f", desc: "Friction head loss (m)" },
          { sym: "f", desc: "Darcy friction factor (dimensionless)" },
          { sym: "L", desc: "Pipe length (m)" },
          { sym: "D", desc: "Pipe diameter (m)" },
          { sym: "V", desc: "Flow velocity (m/s)" },
          { sym: "g", desc: "Gravitational acceleration = 9.81 m/s²" },
        ],
        example: {
          problem: "f = 0.02, L = 500 m, D = 0.3 m, V = 2 m/s. What is h_f?",
          solution: "h_f = 0.02 × (500/0.3) × (4/19.62) = 0.02 × 1667 × 0.204",
          answer: "6.8 m",
        },
      },
      {
        name: "Hydraulic Grade Line (HGL)",
        formula: "HGL = Elevation + Pressure Head",
        units: "m",
        variables: [
          { sym: "HGL", desc: "Hydraulic grade line elevation (m)" },
          { sym: "Pressure Head", desc: "P / (ρg) in metres of water" },
        ],
        tip: "HGL must remain above pipe crown to maintain positive pressure. If HGL drops below pipe, negative pressure (vacuum) can occur causing pipe collapse or contamination.",
      },
      {
        name: "Water Hammer Pressure Rise",
        formula: "ΔP = ρ × a × ΔV",
        units: "kPa",
        variables: [
          { sym: "ΔP", desc: "Pressure surge (kPa)" },
          { sym: "ρ", desc: "Water density ≈ 1000 kg/m³" },
          { sym: "a", desc: "Wave speed (m/s) — typically 900–1200 m/s for steel pipe" },
          { sym: "ΔV", desc: "Change in velocity (m/s)" },
        ],
        tip: "Prevent water hammer by: slow valve closure (>2× wave travel time), surge tanks, air release valves, and variable speed drives on pumps.",
      },
    ],
  },
  {
    id: "coagulation",
    label: "Coagulation & Chemical Dosing",
    icon: "⚗️",
    color: "#7C3AED",
    bg: "#F5F3FF",
    formulas: [
      {
        name: "Jar Test Optimal Dose Scaling",
        formula: "Full-scale dose (mg/L) = Jar test dose (mg/L)",
        tip: "Jar test doses translate directly to full scale in mg/L. Convert to volume: Chemical volume (mL/min) = [Dose (mg/L) × Flow (L/min)] / [Stock concentration (mg/mL)].",
      },
      {
        name: "Alum Dose to Alkalinity Consumption",
        formula: "Alkalinity consumed = Alum dose × 0.50",
        units: "mg/L as CaCO₃",
        variables: [
          { sym: "Alkalinity consumed", desc: "Alkalinity used by alum reaction (mg/L as CaCO₃)" },
          { sym: "Alum dose", desc: "Al₂(SO₄)₃·18H₂O dose (mg/L)" },
        ],
        example: {
          problem: "Alum dose = 30 mg/L. How much alkalinity is consumed?",
          solution: "Alkalinity consumed = 30 × 0.50",
          answer: "15 mg/L as CaCO₃",
        },
        tip: "Minimum residual alkalinity of 30–50 mg/L as CaCO₃ is needed for good coagulation. Add lime or soda ash if alkalinity is insufficient.",
      },
      {
        name: "Chemical Feed Pump Rate",
        formula: "Q_pump = (Dose × Q_plant) / C_stock",
        units: "L/h",
        variables: [
          { sym: "Q_pump", desc: "Chemical pump flow rate (L/h)" },
          { sym: "Dose", desc: "Target chemical dose (mg/L)" },
          { sym: "Q_plant", desc: "Plant flow rate (L/h)" },
          { sym: "C_stock", desc: "Stock solution concentration (mg/L)" },
        ],
        example: {
          problem: "Dose = 5 mg/L, plant flow = 10,000 L/h, stock = 50,000 mg/L (5%). What is the pump rate?",
          solution: "Q_pump = (5 × 10,000) / 50,000",
          answer: "1.0 L/h",
        },
      },
      {
        name: "Fluoride Dose Calculation",
        formula: "Feed rate = (Target − Background) × Q / (Stock × purity)",
        units: "L/h",
        variables: [
          { sym: "Target", desc: "Target fluoride concentration (mg/L) — typically 0.7 mg/L" },
          { sym: "Background", desc: "Natural fluoride in source water (mg/L)" },
          { sym: "Q", desc: "Plant flow rate (L/h)" },
          { sym: "Stock", desc: "Fluoride stock concentration (mg/L)" },
          { sym: "purity", desc: "Chemical purity fraction (e.g., 0.98 for 98% pure)" },
        ],
        tip: "Health Canada guideline: 0.7 mg/L fluoride. Excess fluoride (>1.5 mg/L) causes dental fluorosis. Always account for background fluoride in source water.",
      },
    ],
  },
  {
    id: "sludge",
    label: "Sludge & Residuals Management",
    icon: "🏗️",
    color: "#B45309",
    bg: "#FFFBEB",
    formulas: [
      {
        name: "Sludge Volume (Alum)",
        formula: "Sludge (kg/d) = Q × (0.44 × Alum + TSS_removed + Turbidity_removed × 1.5) / 1,000,000",
        units: "kg/d",
        variables: [
          { sym: "Q", desc: "Plant flow (L/d)" },
          { sym: "0.44 × Alum", desc: "Aluminium hydroxide precipitate from alum (mg/L)" },
          { sym: "TSS_removed", desc: "Suspended solids removed (mg/L)" },
          { sym: "Turbidity_removed × 1.5", desc: "Approximate TSS from turbidity removal" },
        ],
        tip: "Sludge production increases significantly during high-turbidity events. Size thickeners and lagoons for peak conditions (10× average turbidity).",
      },
      {
        name: "Solids Loading Rate",
        formula: "SLR = (Q × C) / A",
        units: "kg/m²·d",
        variables: [
          { sym: "SLR", desc: "Solids loading rate (kg/m²·d)" },
          { sym: "Q", desc: "Flow to thickener (m³/d)" },
          { sym: "C", desc: "Solids concentration in feed (kg/m³)" },
          { sym: "A", desc: "Thickener surface area (m²)" },
        ],
        example: {
          problem: "Q = 200 m³/d, C = 5 kg/m³, A = 50 m². What is SLR?",
          solution: "SLR = (200 × 5) / 50",
          answer: "20 kg/m²·d",
        },
        tip: "Typical design SLR for gravity thickeners: 15–30 kg/m²·d for alum sludge, 50–100 kg/m²·d for lime sludge.",
      },
      {
        name: "Sludge Density Index (SDI)",
        formula: "SDI = [1 − (t₁₅/t_initial)] × 100 / 15",
        units: "% per minute",
        variables: [
          { sym: "t₁₅", desc: "Time to filter 500 mL after 15 minutes of fouling (s)" },
          { sym: "t_initial", desc: "Initial time to filter 500 mL (s)" },
        ],
        tip: "SDI < 3 is required for RO feed water. SDI > 5 indicates excessive fouling potential. Used to evaluate pre-treatment effectiveness before membrane systems.",
      },
      {
        name: "Biosolids Percent Solids",
        formula: "% Solids = (Dry mass / Wet mass) × 100",
        units: "%",
        variables: [
          { sym: "Dry mass", desc: "Mass after drying at 105°C (g)" },
          { sym: "Wet mass", desc: "Original wet sample mass (g)" },
        ],
        example: {
          problem: "Wet sludge = 500 g, dried sludge = 25 g. What is % solids?",
          solution: "% Solids = (25 / 500) × 100",
          answer: "5%",
        },
      },
    ],
  },
  {
    id: "pumping-energy",
    label: "Pumping & Energy",
    icon: "⚙️",
    color: "#DC2626",
    bg: "#FEF2F2",
    formulas: [
      {
        name: "Pump Hydraulic Power",
        formula: "P_hydraulic = ρ × g × Q × H",
        units: "W (watts)",
        variables: [
          { sym: "ρ", desc: "Water density = 1000 kg/m³" },
          { sym: "g", desc: "Gravity = 9.81 m/s²" },
          { sym: "Q", desc: "Flow rate (m³/s)" },
          { sym: "H", desc: "Total dynamic head (m)" },
        ],
        example: {
          problem: "Q = 0.05 m³/s, H = 30 m. What is hydraulic power?",
          solution: "P = 1000 × 9.81 × 0.05 × 30",
          answer: "14,715 W ≈ 14.7 kW",
        },
      },
      {
        name: "Pump Shaft Power (with efficiency)",
        formula: "P_shaft = P_hydraulic / η_pump",
        units: "W or kW",
        variables: [
          { sym: "P_shaft", desc: "Power input to pump shaft (W)" },
          { sym: "P_hydraulic", desc: "Hydraulic power output (W)" },
          { sym: "η_pump", desc: "Pump efficiency (decimal, e.g., 0.75 for 75%)" },
        ],
        example: {
          problem: "Hydraulic power = 14.7 kW, pump efficiency = 78%. What is shaft power?",
          solution: "P_shaft = 14.7 / 0.78",
          answer: "18.8 kW",
        },
      },
      {
        name: "Specific Energy Consumption",
        formula: "SEC = P_shaft / Q",
        units: "kWh/m³",
        variables: [
          { sym: "SEC", desc: "Specific energy consumption (kWh/m³)" },
          { sym: "P_shaft", desc: "Shaft power (kW)" },
          { sym: "Q", desc: "Flow rate (m³/h)" },
        ],
        example: {
          problem: "Shaft power = 18.8 kW, flow = 180 m³/h. What is SEC?",
          solution: "SEC = 18.8 / 180",
          answer: "0.104 kWh/m³",
        },
        tip: "Typical SEC for water treatment: 0.1–0.5 kWh/m³. RO desalination: 3–5 kWh/m³. Track SEC to identify pump wear and efficiency losses.",
      },
      {
        name: "Affinity Laws — Flow",
        formula: "Q₂/Q₁ = N₂/N₁",
        units: "dimensionless ratio",
        variables: [
          { sym: "Q₁, Q₂", desc: "Flow rates at speeds N₁ and N₂" },
          { sym: "N₁, N₂", desc: "Pump rotational speeds (RPM)" },
        ],
        tip: "Affinity laws: Flow ∝ Speed, Head ∝ Speed², Power ∝ Speed³. Reducing speed by 20% reduces power by ~49% — huge energy savings with VFDs.",
      },
      {
        name: "Affinity Laws — Power",
        formula: "P₂/P₁ = (N₂/N₁)³",
        units: "dimensionless ratio",
        example: {
          problem: "Pump runs at 1800 RPM using 50 kW. Speed reduced to 1440 RPM. New power?",
          solution: "P₂ = 50 × (1440/1800)³ = 50 × 0.8³ = 50 × 0.512",
          answer: "25.6 kW",
        },
      },
    ],
  },
  {
    id: "source-water",
    label: "Source Water & Environmental",
    icon: "🌿",
    color: "#15803D",
    bg: "#F0FDF4",
    formulas: [
      {
        name: "Watershed Loading Rate",
        formula: "Load (kg/d) = C (mg/L) × Q (m³/d) × 0.001",
        units: "kg/d",
        variables: [
          { sym: "C", desc: "Contaminant concentration (mg/L)" },
          { sym: "Q", desc: "Stream flow (m³/d)" },
          { sym: "0.001", desc: "Unit conversion factor (mg/L × m³ → kg)" },
        ],
        example: {
          problem: "Nitrate = 5 mg/L, stream flow = 10,000 m³/d. What is the daily load?",
          solution: "Load = 5 × 10,000 × 0.001",
          answer: "50 kg/d",
        },
      },
      {
        name: "Dilution Factor",
        formula: "DF = Q_total / Q_effluent",
        units: "dimensionless",
        variables: [
          { sym: "DF", desc: "Dilution factor in receiving water" },
          { sym: "Q_total", desc: "Total flow after mixing (m³/s)" },
          { sym: "Q_effluent", desc: "Effluent discharge flow (m³/s)" },
        ],
        example: {
          problem: "River flow = 10 m³/s, effluent = 0.5 m³/s. What is the dilution factor?",
          solution: "DF = (10 + 0.5) / 0.5",
          answer: "21×",
        },
      },
      {
        name: "Mixing Zone Concentration",
        formula: "C_mix = (Q_river × C_river + Q_effluent × C_effluent) / (Q_river + Q_effluent)",
        units: "mg/L",
        variables: [
          { sym: "C_mix", desc: "Concentration after complete mixing (mg/L)" },
          { sym: "Q_river, C_river", desc: "Upstream river flow and concentration" },
          { sym: "Q_effluent, C_effluent", desc: "Effluent flow and concentration" },
        ],
        tip: "Use mass balance mixing equation for any conservative contaminant. For reactive contaminants (e.g., BOD), additional decay modelling is required.",
      },
    ],
  },
];

// ── QUICK REFERENCE TABLE ────────────────────────────────────────────────────
const QUICK_REF = [
  { param: "Ozone CT (Giardia 3-log, 15°C)", value: "≥ 1.43 mg·min/L" },
  { param: "UV Dose (Cryptosporidium 3-log)", value: "≥ 40 mJ/cm²" },
  { param: "MF/UF Typical Flux", value: "20–80 LMH" },
  { param: "RO Recovery (typical)", value: "70–85%" },
  { param: "MF/UF Recovery (typical)", value: "90–98%" },
  { param: "Alum to Alkalinity Ratio", value: "1 mg/L alum consumes 0.50 mg/L alk (as CaCO₃)" },
  { param: "Target Fluoride (Health Canada)", value: "0.7 mg/L" },
  { param: "SDI for RO Feed", value: "< 3 (preferred < 2)" },
  { param: "Typical Pump Efficiency", value: "70–85%" },
  { param: "VFD Power Savings (20% speed reduction)", value: "≈ 49% power reduction" },
  { param: "Water Density", value: "1000 kg/m³ at 4°C" },
  { param: "Gravity", value: "9.81 m/s²" },
];

// ── COMPONENT ────────────────────────────────────────────────────────────────
export default function FormulasWpiClass2() {
  usePageMeta({
    title: "WPI Class II Water Treatment Formula Sheet | Echelon Institute",
    description:
      "Complete WPI Class II Water Treatment formula reference. Covers ozone & UV disinfection, membrane filtration, advanced hydraulics, coagulation, sludge management, and pumping. For EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB) operators.",
    path: "/formulas-wpi-class2",
    keywords:
      "WPI Class II formulas, EOCP Class II, AWWOA Class II, membrane filtration formulas, ozone CT value, UV dose calculation, water treatment advanced formulas",
  });

  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [expandedFormula, setExpandedFormula] = useState<string | null>(null);

  const cat = CATEGORIES.find(c => c.id === activeCategory) ?? CATEGORIES[0];

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", background: "#FFFFFF", minHeight: "100vh" }}>      <style>{`
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

      <SiteNav currentPath="/formulas-wpi-class2" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #0C4A6E 0%, #0F766E 100%)",
        padding: "40px 20px 48px",
        textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(0,0,0,0.10)",
          border: "1px solid rgba(0,0,0,0.14)",
          borderRadius: 100,
          padding: "5px 14px",
          fontSize: 11,
          fontWeight: 700,
          color: "#BAE6FD",
          letterSpacing: "0.08em",
          textTransform: "uppercase" as const,
          marginBottom: 16,
        }}>
          🌊 WPI Class II — BC / AB / SK / MB
        </div>
        <h1 style={{
          fontFamily: "'Sora', sans-serif",
          fontSize: "clamp(24px, 4vw, 36px)",
          fontWeight: 800,
          color: "#FFFFFF",
          marginBottom: 10,
          letterSpacing: "-0.02em",
        }}>
          WPI Class II Water Treatment<br />Formula Sheet
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", maxWidth: 560, margin: "0 auto 20px" }}>
          Advanced formulas for ozone & UV disinfection, membrane filtration, hydraulics, coagulation, sludge management, and pumping. Aligned with WPI Class II Need-to-Know Criteria.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/wpi-class2-water">
            <button style={{
              background: "#FFFFFF",
              color: "#0C4A6E",
              border: "none",
              borderRadius: 10,
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}>
              🌊 Class II Practice →
            </button>
          </Link>
          <Link href="/wpi-class2-water-mock">
            <button style={{
              background: "rgba(0,0,0,0.10)",
              color: "#FFFFFF",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 10,
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}>
              📋 Class II Mock Exam →
            </button>
          </Link>
          <Link href="/formulas-wpi-class1">
            <button style={{
              background: "rgba(0,0,0,0.10)",
              color: "#FFFFFF",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 10,
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}>
              📐 Class I Formulas →
            </button>
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 16px" }}>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" as const }}>

          {/* ── Sidebar ──────────────────────────────────────────────────── */}
          <div style={{ width: 220, flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 10 }}>
              Categories
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  style={{
                    background: activeCategory === c.id ? c.bg : "transparent",
                    border: activeCategory === c.id ? `1px solid ${c.color}30` : "1px solid transparent",
                    borderRadius: 10,
                    padding: "10px 14px",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: activeCategory === c.id ? 700 : 500,
                    color: activeCategory === c.id ? c.color : "#E2E8F0",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "all 0.15s",
                  }}
                >
                  <span>{c.icon}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>

            {/* Quick Ref link */}
            <button
              onClick={() => setActiveCategory("quick-ref")}
              style={{
                marginTop: 8,
                background: activeCategory === "quick-ref" ? "#FEF3C7" : "transparent",
                border: activeCategory === "quick-ref" ? "1px solid #F59E0B30" : "1px solid transparent",
                borderRadius: 10,
                padding: "10px 14px",
                textAlign: "left",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: activeCategory === "quick-ref" ? 700 : 500,
                color: activeCategory === "quick-ref" ? "#B45309" : "#E2E8F0",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
              }}
            >
              <span>⚡</span>
              <span>Quick Reference</span>
            </button>
          </div>

          {/* ── Main Content ─────────────────────────────────────────────── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {activeCategory === "quick-ref" ? (
              <div>
                <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800, color: "#FFFFFF", marginBottom: 20 }}>
                  ⚡ Quick Reference — WPI Class II
                </h2>
                <div style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: 16,
                  overflow: "hidden",
                }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                    <thead>
                      <tr style={{ background: "#FFFFFF" }}>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" as const, letterSpacing: "0.05em", borderBottom: "1px solid #E2E8F0" }}>Parameter</th>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" as const, letterSpacing: "0.05em", borderBottom: "1px solid #E2E8F0" }}>Value / Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      {QUICK_REF.map((row, i) => (
                        <tr key={i} style={{ borderBottom: i < QUICK_REF.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                          <td style={{ padding: "12px 16px", fontSize: 13, color: "#FFFFFF", fontWeight: 500 }}>{row.param}</td>
                          <td style={{ padding: "12px 16px", fontSize: 13, color: "#0F766E", fontWeight: 700, fontFamily: "monospace" }}>{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                  <span style={{ fontSize: 28 }}>{cat.icon}</span>
                  <div>
                    <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800, color: "#FFFFFF", marginBottom: 2 }}>
                      {cat.label}
                    </h2>
                    <div style={{ fontSize: 12, color: "#64748B" }}>{cat.formulas.length} formulas</div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
                  {cat.formulas.map((f, i) => {
                    const key = `${cat.id}-${i}`;
                    const isOpen = expandedFormula === key;
                    return (
                      <div
                        key={key}
                        style={{
                          background: "#FFFFFF",
                          border: `1px solid ${isOpen ? cat.color + "40" : "#94A3B8"}`,
                          borderRadius: 16,
                          overflow: "hidden",
                          transition: "border-color 0.15s",
                        }}
                      >
                        {/* Formula header */}
                        <button
                          onClick={() => setExpandedFormula(isOpen ? null : key)}
                          style={{
                            width: "100%",
                            background: "transparent",
                            border: "none",
                            padding: "18px 20px",
                            textAlign: "left",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: 12,
                            fontFamily: "inherit",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF", marginBottom: 6 }}>{f.name}</div>
                            <div style={{
                              fontFamily: "monospace",
                              fontSize: 15,
                              fontWeight: 700,
                              color: cat.color,
                              background: cat.bg,
                              display: "inline-block",
                              padding: "4px 12px",
                              borderRadius: 8,
                            }}>
                              {f.formula}
                            </div>
                            {f.units && (
                              <span style={{ marginLeft: 8, fontSize: 11, color: "#64748B", fontFamily: "monospace" }}>
                                [{f.units}]
                              </span>
                            )}
                          </div>
                          <span style={{ color: cat.color, fontSize: 18, flexShrink: 0, marginTop: 2 }}>
                            {isOpen ? "−" : "+"}
                          </span>
                        </button>

                        {/* Expanded content */}
                        {isOpen && (
                          <div style={{ padding: "0 20px 20px", borderTop: `1px solid ${cat.color}20` }}>
                            {/* Variables */}
                            {f.variables && f.variables.length > 0 && (
                              <div style={{ marginTop: 16 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8 }}>Variables</div>
                                <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                                  {f.variables.map(v => (
                                    <div key={v.sym} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                                      <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: cat.color, minWidth: 100, flexShrink: 0 }}>{v.sym}</span>
                                      <span style={{ fontSize: 13, color: "#64748B" }}>{v.desc}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Example */}
                            {f.example && (
                              <div style={{ marginTop: 16, background: "#FFFFFF", borderRadius: 10, padding: "14px 16px" }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8 }}>Worked Example</div>
                                <div style={{ fontSize: 13, color: "#FFFFFF", marginBottom: 6 }}>
                                  <strong>Q:</strong> {f.example.problem}
                                </div>
                                <div style={{ fontSize: 13, color: "#64748B", marginBottom: 4 }}>
                                  <strong>Solution:</strong> {f.example.solution}
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: cat.color }}>
                                  ✓ Answer: {f.example.answer}
                                </div>
                              </div>
                            )}

                            {/* Tip */}
                            {f.tip && (
                              <div style={{ marginTop: 12, background: cat.bg, borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>
                                <strong style={{ color: cat.color }}>💡 Tip: </strong>{f.tip}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
