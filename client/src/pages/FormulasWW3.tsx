// Class 3 Wastewater Treatment — Formula Sheet
// Covers: Advanced Activated Sludge, BNR, Anaerobic Digestion, Biosolids, Tertiary Treatment, Lab
// Design: Teal/green brand, mirrors FormulasWW2.tsx structure
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
    id: "activated-sludge-advanced",
    label: "Advanced Activated Sludge",
    icon: "🔬",
    color: "#0E7490",
    bg: "#ECFEFF",
    formulas: [
      {
        name: "Oxygen Uptake Rate (OUR)",
        formula: "OUR = (DO₁ − DO₂) ÷ t",
        units: "mg/L·min",
        variables: [
          { sym: "DO₁", desc: "Initial dissolved oxygen (mg/L)" },
          { sym: "DO₂", desc: "Final dissolved oxygen after time t (mg/L)" },
          { sym: "t", desc: "Time interval (min)" },
        ],
        example: {
          problem: "DO drops from 6.2 mg/L to 3.8 mg/L in 12 minutes. What is the OUR?",
          solution: "OUR = (6.2 − 3.8) ÷ 12 = 2.4 ÷ 12 = 0.20 mg/L·min",
          answer: "0.20 mg/L·min",
        },
        tip: "OUR reflects biological activity. High OUR = active biomass. Low OUR = endogenous decay or process upset. Used to diagnose bulking, toxicity, and nitrification.",
      },
      {
        name: "Specific Oxygen Uptake Rate (SOUR)",
        formula: "SOUR = (OUR × 1000) ÷ MLVSS",
        units: "mg O₂/g VSS·h",
        variables: [
          { sym: "OUR", desc: "Oxygen uptake rate (mg/L·min)" },
          { sym: "MLVSS", desc: "Mixed liquor volatile suspended solids (mg/L)" },
        ],
        example: {
          problem: "OUR = 0.20 mg/L·min, MLVSS = 2,400 mg/L. What is SOUR?",
          solution: "SOUR = (0.20 × 60 × 1000) ÷ 2,400 = 12,000 ÷ 2,400 = 5.0 mg O₂/g VSS·h",
          answer: "5.0 mg O₂/g VSS·h",
        },
        tip: "SOUR 8–20 mg O₂/g VSS·h = healthy aerobic conditions. SOUR < 5 = low activity (old sludge, toxicity). SOUR > 25 = overloaded system.",
      },
      {
        name: "Volumetric Oxygen Transfer Rate (OTR)",
        formula: "OTR = α × SOTR × (β × C_s − C_L) ÷ C_s20",
        units: "kg O₂/h",
        variables: [
          { sym: "α", desc: "Process water correction factor (typically 0.5–0.8)" },
          { sym: "SOTR", desc: "Standard oxygen transfer rate (kg O₂/h)" },
          { sym: "β", desc: "Salinity/surface tension correction (typically 0.95–1.0)" },
          { sym: "C_s", desc: "Saturation DO at process temperature (mg/L)" },
          { sym: "C_L", desc: "Actual process DO (mg/L)" },
          { sym: "C_s20", desc: "DO saturation at 20°C (9.09 mg/L)" },
        ],
        tip: "α accounts for surfactants and contaminants reducing oxygen transfer. β accounts for salinity. Always derate aeration equipment using α·β factors in design.",
      },
      {
        name: "Nitrification Rate (NR)",
        formula: "NR = (TKN_in − TKN_out) × Q ÷ (V × MLVSS × 1000)",
        units: "g NH₄-N/g VSS·d",
        variables: [
          { sym: "TKN_in", desc: "Influent TKN (mg/L)" },
          { sym: "TKN_out", desc: "Effluent TKN (mg/L)" },
          { sym: "Q", desc: "Flow rate (m³/d)" },
          { sym: "V", desc: "Aeration basin volume (m³)" },
          { sym: "MLVSS", desc: "Mixed liquor volatile suspended solids (mg/L)" },
        ],
        tip: "Nitrification requires SRT > 10 days at 20°C. Temperature correction: SRT doubles for every 7°C drop below 20°C. Nitrifiers are slow-growing and sensitive to pH < 6.5 and toxics.",
      },
      {
        name: "Denitrification Rate (DNR)",
        formula: "DNR = (NO₃_in − NO₃_out) × Q ÷ (V_anoxic × MLVSS × 1000)",
        units: "g NO₃-N/g VSS·d",
        variables: [
          { sym: "NO₃_in", desc: "Nitrate entering anoxic zone (mg/L)" },
          { sym: "NO₃_out", desc: "Nitrate leaving anoxic zone (mg/L)" },
          { sym: "Q", desc: "Flow rate (m³/d)" },
          { sym: "V_anoxic", desc: "Anoxic zone volume (m³)" },
          { sym: "MLVSS", desc: "Mixed liquor volatile suspended solids (mg/L)" },
        ],
        tip: "Denitrification requires anoxic conditions (DO < 0.5 mg/L) and a carbon source. Internal recycle ratio (IR) controls nitrate removal efficiency. IR = 3–5× Q is typical for MLE process.",
      },
    ],
  },
  {
    id: "bnr",
    label: "Biological Nutrient Removal (BNR)",
    icon: "🌿",
    color: "#15803D",
    bg: "#F0FDF4",
    formulas: [
      {
        name: "Total Nitrogen Removal Efficiency",
        formula: "TN_removal (%) = (TN_in − TN_eff) ÷ TN_in × 100",
        units: "%",
        variables: [
          { sym: "TN_in", desc: "Influent total nitrogen (mg/L)" },
          { sym: "TN_eff", desc: "Effluent total nitrogen (mg/L)" },
        ],
        example: {
          problem: "Influent TN = 38 mg/L, effluent TN = 8 mg/L. What is the removal efficiency?",
          solution: "TN_removal = (38 − 8) ÷ 38 × 100 = 30 ÷ 38 × 100 = 78.9%",
          answer: "78.9%",
        },
        tip: "Ontario Class 3 facilities often have TN effluent limits of 10–15 mg/L. BNR processes (MLE, A²O, Bardenpho) are required to meet these limits.",
      },
      {
        name: "Phosphorus Removal — Enhanced Biological (EBPR)",
        formula: "P_removed (kg/d) = (TP_in − TP_eff) × Q × 10⁻³",
        units: "kg/d",
        variables: [
          { sym: "TP_in", desc: "Influent total phosphorus (mg/L)" },
          { sym: "TP_eff", desc: "Effluent total phosphorus (mg/L)" },
          { sym: "Q", desc: "Flow rate (m³/d)" },
        ],
        example: {
          problem: "TP_in = 6.5 mg/L, TP_eff = 0.8 mg/L, Q = 15,000 m³/d. How much P is removed per day?",
          solution: "P_removed = (6.5 − 0.8) × 15,000 × 10⁻³ = 5.7 × 15 = 85.5 kg/d",
          answer: "85.5 kg/d",
        },
        tip: "EBPR requires an anaerobic zone before the aerobic zone. PAOs (phosphorus-accumulating organisms) release P in anaerobic zone and uptake P in aerobic zone. VFA availability is critical.",
      },
      {
        name: "Chemical Phosphorus Removal (Alum Dose)",
        formula: "Alum dose (mg/L) = Al:P molar ratio × (P_to_remove × 26.98 ÷ 30.97)",
        units: "mg Al/L",
        variables: [
          { sym: "Al:P", desc: "Molar ratio (typically 1.5–2.5 mol Al per mol P)" },
          { sym: "P_to_remove", desc: "Phosphorus to remove (mg/L)" },
          { sym: "26.98", desc: "Atomic mass of Al" },
          { sym: "30.97", desc: "Atomic mass of P" },
        ],
        tip: "Alum (Al₂(SO₄)₃·18H₂O) precipitates P as AlPO₄. Ferric chloride (FeCl₃) also used. Chemical P removal increases sludge production. pH should be 6.0–7.0 for optimal precipitation.",
      },
      {
        name: "Internal Recycle Ratio (IR)",
        formula: "IR = Q_recycle ÷ Q_influent",
        units: "dimensionless",
        variables: [
          { sym: "Q_recycle", desc: "Internal recycle flow from aerobic to anoxic zone (m³/d)" },
          { sym: "Q_influent", desc: "Plant influent flow (m³/d)" },
        ],
        example: {
          problem: "Q_influent = 20,000 m³/d, Q_recycle = 80,000 m³/d. What is the IR?",
          solution: "IR = 80,000 ÷ 20,000 = 4",
          answer: "IR = 4 (400%)",
        },
        tip: "Higher IR = more nitrate returned to anoxic zone = better denitrification. But energy cost increases. Typical IR = 2–5. Maximum TN removal limited by IR: TN_removal_max = IR ÷ (IR + 1).",
      },
    ],
  },
  {
    id: "anaerobic-digestion",
    label: "Anaerobic Digestion",
    icon: "⚗️",
    color: "#7C3AED",
    bg: "#F5F3FF",
    formulas: [
      {
        name: "Digester Hydraulic Retention Time (HRT)",
        formula: "HRT = V_digester ÷ Q_sludge",
        units: "days",
        variables: [
          { sym: "V_digester", desc: "Digester volume (m³)" },
          { sym: "Q_sludge", desc: "Sludge feed rate (m³/d)" },
        ],
        example: {
          problem: "Digester volume = 3,500 m³, sludge feed = 175 m³/d. What is the HRT?",
          solution: "HRT = 3,500 ÷ 175 = 20 days",
          answer: "20 days",
        },
        tip: "Minimum HRT for mesophilic digestion (35°C) = 15–20 days. Thermophilic (55°C) = 10–12 days. HRT < 10 days risks washout of methanogens. Ontario typically requires HRT ≥ 15 days.",
      },
      {
        name: "Volatile Solids Reduction (VSR)",
        formula: "VSR (%) = (VS_in − VS_out) ÷ VS_in × 100",
        units: "%",
        variables: [
          { sym: "VS_in", desc: "Volatile solids entering digester (kg/d or mg/L)" },
          { sym: "VS_out", desc: "Volatile solids leaving digester (kg/d or mg/L)" },
        ],
        example: {
          problem: "VS_in = 4,200 kg/d, VS_out = 2,100 kg/d. What is VSR?",
          solution: "VSR = (4,200 − 2,100) ÷ 4,200 × 100 = 50%",
          answer: "50%",
        },
        tip: "Target VSR for mesophilic digestion: 50–60%. VSR < 40% indicates under-digestion (overloading, temperature issues, or toxicity). VSR > 65% is excellent performance.",
      },
      {
        name: "Biogas Production Rate",
        formula: "Biogas (m³/d) = VS_destroyed × 0.85 × 1000 ÷ 1000",
        units: "m³ biogas/d",
        variables: [
          { sym: "VS_destroyed", desc: "Volatile solids destroyed (kg/d)" },
          { sym: "0.85", desc: "Biogas yield factor (m³ biogas per kg VS destroyed, typical)" },
        ],
        example: {
          problem: "VS_destroyed = 2,100 kg/d. How much biogas is produced?",
          solution: "Biogas = 2,100 × 0.85 = 1,785 m³/d",
          answer: "1,785 m³/d",
        },
        tip: "Biogas is ~65–70% methane (CH₄) and ~30–35% CO₂. Methane has energy content of ~37.3 MJ/m³. Biogas can fuel boilers, engines, or CHP (combined heat and power) units.",
      },
      {
        name: "Digester Organic Loading Rate (OLR)",
        formula: "OLR = VS_in ÷ V_digester",
        units: "kg VS/m³·d",
        variables: [
          { sym: "VS_in", desc: "Volatile solids fed to digester (kg/d)" },
          { sym: "V_digester", desc: "Digester volume (m³)" },
        ],
        example: {
          problem: "VS_in = 4,200 kg/d, V_digester = 3,500 m³. What is the OLR?",
          solution: "OLR = 4,200 ÷ 3,500 = 1.2 kg VS/m³·d",
          answer: "1.2 kg VS/m³·d",
        },
        tip: "Acceptable OLR for mesophilic digestion: 1.6–4.8 kg VS/m³·d. OLR > 4.8 risks VFA accumulation and pH drop. OLR < 1.0 = under-utilization of digester capacity.",
      },
      {
        name: "Alkalinity-to-VFA Ratio",
        formula: "Alk:VFA ratio = Total alkalinity (mg/L as CaCO₃) ÷ VFA (mg/L as acetic acid)",
        units: "dimensionless",
        tip: "Healthy digester: Alk:VFA > 10. Ratio 6–10 = caution, reduce loading. Ratio < 6 = imminent souring risk. Alkalinity should be > 2,000 mg/L as CaCO₃ for stable digestion. Add lime or bicarbonate to correct.",
      },
    ],
  },
  {
    id: "biosolids-dewatering",
    label: "Biosolids & Dewatering",
    icon: "💧",
    color: "#B45309",
    bg: "#FFFBEB",
    formulas: [
      {
        name: "Solids Capture Efficiency (Centrifuge/Belt Press)",
        formula: "Capture (%) = (TS_cake × Q_cake) ÷ (TS_feed × Q_feed) × 100",
        units: "%",
        variables: [
          { sym: "TS_cake", desc: "Total solids in dewatered cake (%)" },
          { sym: "Q_cake", desc: "Cake production rate (kg/d or m³/d)" },
          { sym: "TS_feed", desc: "Total solids in feed sludge (%)" },
          { sym: "Q_feed", desc: "Feed sludge flow rate (kg/d or m³/d)" },
        ],
        tip: "Target solids capture: centrifuge ≥ 95%, belt press ≥ 90%. Low capture = high solids in centrate/filtrate, which recycles back to the plant head and increases loading.",
      },
      {
        name: "Cake Solids Content",
        formula: "Cake TS (%) = (Dry solids mass ÷ Wet cake mass) × 100",
        units: "%",
        example: {
          problem: "Wet cake = 5,000 kg/d, dry solids = 1,250 kg/d. What is the cake TS?",
          solution: "Cake TS = (1,250 ÷ 5,000) × 100 = 25%",
          answer: "25%",
        },
        tip: "Centrifuge cake: 20–28% TS. Belt press cake: 18–25% TS. Higher TS = lower hauling costs. Polymer dose affects cake TS — optimize polymer type and dose for best performance.",
      },
      {
        name: "Biosolids Land Application Rate",
        formula: "Application rate (t/ha) = Agronomic N rate ÷ (Biosolids TKN × Availability factor)",
        units: "t dry solids/ha",
        variables: [
          { sym: "Agronomic N rate", desc: "Crop nitrogen requirement (kg N/ha)" },
          { sym: "Biosolids TKN", desc: "Total Kjeldahl nitrogen in biosolids (kg N/t dry)" },
          { sym: "Availability factor", desc: "Fraction of N available to crop (0.5–0.7 for Class B)" },
        ],
        tip: "Ontario O. Reg. 267/03 governs biosolids land application. Class A biosolids have fewer restrictions than Class B. Application rates are limited by agronomic N need, P loading, and setback distances.",
      },
      {
        name: "Polymer Dose",
        formula: "Polymer dose (kg/t DS) = Polymer flow (L/h) × Concentration (g/L) ÷ (Sludge flow (m³/h) × TS (g/L))",
        units: "kg polymer/t dry solids",
        tip: "Typical polymer dose: belt press 3–8 kg/t DS, centrifuge 2–6 kg/t DS. Jar tests determine optimal polymer type and dose. Over-dosing wastes polymer and can reduce cake TS.",
      },
    ],
  },
  {
    id: "tertiary-treatment",
    label: "Tertiary Treatment & Effluent Filtration",
    icon: "🏗️",
    color: "#0369A1",
    bg: "#F0F9FF",
    formulas: [
      {
        name: "Filter Loading Rate (Effluent Filtration)",
        formula: "Loading rate = Q ÷ A_filter",
        units: "m³/m²·h (m/h)",
        variables: [
          { sym: "Q", desc: "Flow rate (m³/h)" },
          { sym: "A_filter", desc: "Total filter surface area (m²)" },
        ],
        example: {
          problem: "Q = 800 m³/h, filter area = 50 m². What is the loading rate?",
          solution: "Loading rate = 800 ÷ 50 = 16 m/h",
          answer: "16 m/h",
        },
        tip: "Typical effluent filter loading rates: 5–15 m/h for sand/anthracite dual media. Exceeding design rate causes breakthrough and poor effluent quality. Backwash when head loss reaches 2–3 m.",
      },
      {
        name: "UV Dose (Disinfection)",
        formula: "UV dose (mJ/cm²) = UV intensity (mW/cm²) × Exposure time (s)",
        units: "mJ/cm²",
        variables: [
          { sym: "UV intensity", desc: "Irradiance at the target point (mW/cm²)" },
          { sym: "Exposure time", desc: "Hydraulic retention time in UV reactor (s)" },
        ],
        example: {
          problem: "UV intensity = 12 mW/cm², HRT in reactor = 8 seconds. What is the UV dose?",
          solution: "UV dose = 12 × 8 = 96 mJ/cm²",
          answer: "96 mJ/cm²",
        },
        tip: "Ontario O. Reg. 170/03 requires UV dose ≥ 40 mJ/cm² for drinking water. For wastewater reuse, higher doses (80–120 mJ/cm²) are typical. Transmittance (UVT) must be monitored — low UVT reduces effective dose.",
      },
      {
        name: "Membrane Flux (MBR)",
        formula: "Flux = Q_permeate ÷ A_membrane",
        units: "L/m²·h (LMH)",
        variables: [
          { sym: "Q_permeate", desc: "Permeate flow rate (L/h)" },
          { sym: "A_membrane", desc: "Total membrane area (m²)" },
        ],
        tip: "Sustainable flux for MBR: 15–25 LMH. Operating above sustainable flux causes fouling and TMP increase. Backpulsing and chemical cleaning (CIP) restore flux. TMP should be < 30 kPa for healthy operation.",
      },
      {
        name: "Transmembrane Pressure (TMP)",
        formula: "TMP = (P_feed + P_retentate) ÷ 2 − P_permeate",
        units: "kPa or bar",
        variables: [
          { sym: "P_feed", desc: "Feed side pressure (kPa)" },
          { sym: "P_retentate", desc: "Retentate/concentrate pressure (kPa)" },
          { sym: "P_permeate", desc: "Permeate side pressure (kPa)" },
        ],
        tip: "Rising TMP at constant flux = fouling. Sudden TMP drop = membrane breach. TMP > 50 kPa triggers chemical cleaning. Maintenance cleaning (hypochlorite) weekly; recovery cleaning (citric acid + NaOCl) monthly.",
      },
    ],
  },
  {
    id: "lab-class3",
    label: "Laboratory Analysis (Class 3 Level)",
    icon: "🧪",
    color: "#6D28D9",
    bg: "#F5F3FF",
    formulas: [
      {
        name: "Ammonia Nitrogen (NH₃-N) Removal",
        formula: "NH₃-N removal (%) = (NH₃_in − NH₃_eff) ÷ NH₃_in × 100",
        units: "%",
        example: {
          problem: "Influent NH₃-N = 28 mg/L, effluent NH₃-N = 1.5 mg/L. What is the removal?",
          solution: "Removal = (28 − 1.5) ÷ 28 × 100 = 94.6%",
          answer: "94.6%",
        },
        tip: "Class 3 effluent limits often include NH₃-N < 3 mg/L (summer) and < 10 mg/L (winter). Nitrification is temperature-sensitive — expect reduced performance below 12°C.",
      },
      {
        name: "Specific Conductance (Temperature Correction)",
        formula: "SC₂₅ = SC_T ÷ [1 + 0.02 × (T − 25)]",
        units: "μS/cm at 25°C",
        variables: [
          { sym: "SC_T", desc: "Measured conductance at temperature T (μS/cm)" },
          { sym: "T", desc: "Sample temperature (°C)" },
          { sym: "0.02", desc: "Temperature coefficient (2% per °C)" },
        ],
        tip: "Conductance increases ~2% per °C. Always report conductance at 25°C reference temperature. Used to estimate TDS: TDS (mg/L) ≈ SC₂₅ × 0.65.",
      },
      {
        name: "Turbidity and TSS Relationship",
        formula: "TSS (mg/L) ≈ Turbidity (NTU) × k",
        units: "mg/L",
        variables: [
          { sym: "k", desc: "Site-specific correlation factor (typically 1.5–3.0 for secondary effluent)" },
        ],
        tip: "Turbidity is not a direct substitute for TSS but can be used for real-time process control. Establish a site-specific correlation by running paired TSS/turbidity measurements over several weeks.",
      },
      {
        name: "Fecal Coliform Log Reduction",
        formula: "Log reduction = log₁₀(C_in ÷ C_eff)",
        units: "log units",
        variables: [
          { sym: "C_in", desc: "Influent fecal coliform count (CFU/100 mL)" },
          { sym: "C_eff", desc: "Effluent fecal coliform count (CFU/100 mL)" },
        ],
        example: {
          problem: "Influent FC = 10,000,000 CFU/100 mL, effluent FC = 200 CFU/100 mL. What is the log reduction?",
          solution: "Log reduction = log₁₀(10,000,000 ÷ 200) = log₁₀(50,000) = 4.7",
          answer: "4.7 log reduction",
        },
        tip: "Ontario requires ≥ 4-log reduction of fecal coliforms for Class IV effluent. UV and chlorination both achieve this. E. coli < 200 CFU/100 mL is a common effluent limit.",
      },
    ],
  },
];

export default function FormulasWW3() {
  usePageMeta({
    title: "Class 3 Wastewater Formula Sheet",
    description: "Complete formula reference for Ontario Class 3 Wastewater Treatment certification — BNR, anaerobic digestion, biosolids, MBR, tertiary treatment, and lab analysis.",
    path: "/formulas-ww3",
    keywords: "Class 3 wastewater formulas, BNR, anaerobic digestion, biosolids, MBR, Ontario operator exam",
  });

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCategories = CATEGORIES.map((cat) => ({
    ...cat,
    formulas: cat.formulas.filter((f) =>
      !searchTerm ||
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.formula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.tip ?? "").toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter((cat) => cat.formulas.length > 0);

  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF", fontFamily: "'Sora', sans-serif" }}>      <style>{`
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

      <SiteNav currentPath="/formulas-ww3" />

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0E7490 0%, #7C3AED 100%)", padding: "32px 24px 24px", color: "#fff" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 32 }}>📐</span>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Class 3 Wastewater Formula Sheet</h1>
              <p style={{ margin: 0, fontSize: 13, opacity: 0.85 }}>Advanced process formulas for Ontario Class 3 Wastewater Treatment certification</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <span style={{ background: "rgba(255,255,255,0.18)", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>
              {CATEGORIES.reduce((acc, c) => acc + c.formulas.length, 0)} Formulas
            </span>
            <span style={{ background: "rgba(255,255,255,0.18)", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>
              {CATEGORIES.length} Modules
            </span>
            <Link href="/class3-ww">
              <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#fff", textDecoration: "none" }}>
                🏭 Practice Quiz →
              </span>
            </Link>
            <Link href="/class3-ww-mock">
              <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#fff", textDecoration: "none" }}>
                📝 Mock Exam →
              </span>
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        {/* Search */}
        <input
          type="text"
          placeholder="Search formulas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 14, marginBottom: 20, boxSizing: "border-box", outline: "none" }}
        />

        {/* Category tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          <button
            onClick={() => setActiveCategory(null)}
            style={{ padding: "6px 14px", borderRadius: 20, border: "1.5px solid", borderColor: activeCategory === null ? "#0E7490" : "#94A3B8", background: activeCategory === null ? "#0E7490" : "#fff", color: activeCategory === null ? "#fff" : "#E2E8F0", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              style={{ padding: "6px 14px", borderRadius: 20, border: "1.5px solid", borderColor: activeCategory === cat.id ? cat.color : "#94A3B8", background: activeCategory === cat.id ? cat.color : "#fff", color: activeCategory === cat.id ? "#fff" : "#E2E8F0", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Formula cards */}
        {filteredCategories
          .filter((cat) => !activeCategory || cat.id === activeCategory)
          .map((cat) => (
            <div key={cat.id} id={cat.id} style={{ marginBottom: 32, scrollMarginTop: 80 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 24 }}>{cat.icon}</span>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: cat.color, margin: 0 }}>{cat.label}</h2>
              </div>
              <div style={{ display: "grid", gap: 16 }}>
                {cat.formulas.map((f, i) => (
                  <div key={i} style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.07)", overflow: "hidden" }}>
                    {/* Formula header */}
                    <div style={{ background: cat.bg, padding: "16px 20px", borderBottom: `2px solid ${cat.color}20` }}>
                      <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: cat.color }}>{f.name}</h3>
                      <div style={{ background: "#fff", borderRadius: 8, padding: "10px 14px", fontFamily: "monospace", fontSize: 14, color: "#F8FAFC", fontWeight: 600, border: `1px solid ${cat.color}30` }}>
                        {f.formula}
                      </div>
                      {f.units && (
                        <div style={{ marginTop: 6, fontSize: 12, color: "#64748B" }}>Units: <strong>{f.units}</strong></div>
                      )}
                    </div>

                    <div style={{ padding: "16px 20px" }}>
                      {/* Variables */}
                      {f.variables && f.variables.length > 0 && (
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Variables</div>
                          <div style={{ display: "grid", gap: 4 }}>
                            {f.variables.map((v, j) => (
                              <div key={j} style={{ display: "flex", gap: 8, fontSize: 13 }}>
                                <span style={{ fontFamily: "monospace", fontWeight: 700, color: cat.color, minWidth: 80 }}>{v.sym}</span>
                                <span style={{ color: "#64748B" }}>{v.desc}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Example */}
                      {f.example && (
                        <div style={{ background: "#FFFFFF", borderRadius: 10, padding: "14px", marginBottom: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Worked Example</div>
                          <p style={{ fontSize: 13, color: "#F8FAFC", margin: "0 0 8px", fontWeight: 600 }}>{f.example.problem}</p>
                          <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 6px", whiteSpace: "pre-line" }}>{f.example.solution}</p>
                          <p style={{ fontSize: 13, color: cat.color, fontWeight: 700, margin: 0 }}>Answer: {f.example.answer}</p>
                        </div>
                      )}

                      {/* Exam tip */}
                      {f.tip && (
                        <div style={{ background: `${cat.bg}`, border: `1px solid ${cat.color}30`, borderRadius: 8, padding: "10px 14px" }}>
                          <span style={{ fontSize: 12, color: "#64748B" }}>💡 <strong style={{ color: cat.color }}>Exam tip:</strong> {f.tip}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
