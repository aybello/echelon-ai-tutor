// Class 4 Wastewater Treatment — Formula Sheet
// Covers: Advanced Treatment, Equipment O&M, Laboratory, Biosolids, Plant Management
// Design: Teal/green brand, mirrors FormulasWW3.tsx structure
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
    id: "advanced-treatment",
    label: "Advanced Treatment Process Monitoring",
    icon: "🔬",
    color: "#0E7490",
    bg: "#ECFEFF",
    formulas: [
      {
        name: "Biological Nutrient Removal — Total Nitrogen (TN) Removal Efficiency",
        formula: "TN Removal (%) = (TN_in − TN_eff) ÷ TN_in × 100",
        units: "%",
        variables: [
          { sym: "TN_in", desc: "Influent total nitrogen (mg/L)" },
          { sym: "TN_eff", desc: "Effluent total nitrogen (mg/L)" },
        ],
        example: {
          problem: "Influent TN = 42 mg/L, effluent TN = 6 mg/L. What is the TN removal efficiency?",
          solution: "TN Removal = (42 − 6) ÷ 42 × 100 = 36 ÷ 42 × 100 = 85.7%",
          answer: "85.7%",
        },
        tip: "Class 4 plants typically target TN < 10 mg/L. Effluent TN rising with stable MLSS often indicates anoxic zone DO intrusion or insufficient carbon for denitrification.",
      },
      {
        name: "Internal Recycle Ratio (IRR)",
        formula: "IRR = Q_recycle ÷ Q_influent",
        units: "dimensionless",
        variables: [
          { sym: "Q_recycle", desc: "Internal mixed liquor recycle flow rate (m³/d)" },
          { sym: "Q_influent", desc: "Influent flow rate (m³/d)" },
        ],
        example: {
          problem: "Influent flow = 10,000 m³/d, internal recycle = 30,000 m³/d. What is the IRR?",
          solution: "IRR = 30,000 ÷ 10,000 = 3.0",
          answer: "IRR = 3.0 (300%)",
        },
        tip: "IRR of 2–4 is typical for 4-stage Bardenpho and MLE processes. Higher IRR improves TN removal but increases pumping energy. IRR > 5 rarely improves performance.",
      },
      {
        name: "Denitrification Rate (DNR)",
        formula: "DNR = (NO₃_in − NO₃_out) × Q ÷ (V_anoxic × MLVSS)",
        units: "g NO₃-N/g VSS·d",
        variables: [
          { sym: "NO₃_in", desc: "Nitrate entering anoxic zone (mg/L)" },
          { sym: "NO₃_out", desc: "Nitrate leaving anoxic zone (mg/L)" },
          { sym: "Q", desc: "Flow through anoxic zone (m³/d)" },
          { sym: "V_anoxic", desc: "Anoxic zone volume (m³)" },
          { sym: "MLVSS", desc: "Mixed liquor volatile suspended solids (g/m³)" },
        ],
        tip: "Typical DNR = 0.03–0.11 g NO₃-N/g VSS·d at 20°C. Low DNR indicates insufficient carbon (BOD:TKN < 5:1) or temperature inhibition. Add methanol or acetate as supplemental carbon.",
      },
      {
        name: "Phosphorus Removal — Luxury Uptake (EBPR)",
        formula: "P_release = MLVSS × f_PAO × q_P",
        units: "mg P/L",
        variables: [
          { sym: "MLVSS", desc: "Mixed liquor volatile suspended solids (mg/L)" },
          { sym: "f_PAO", desc: "Fraction of PAOs in biomass (typically 0.15–0.35)" },
          { sym: "q_P", desc: "Specific P release rate (mg P/g VSS·h)" },
        ],
        tip: "EBPR requires a true anaerobic zone (DO = 0, NO₃ = 0). Nitrate intrusion into the anaerobic zone is the #1 cause of EBPR failure. Monitor VFA:TP ratio; target > 4 mg VFA/mg TP.",
      },
      {
        name: "Membrane Bioreactor — Flux",
        formula: "J = Q_permeate ÷ A_membrane",
        units: "L/m²·h (LMH)",
        variables: [
          { sym: "Q_permeate", desc: "Permeate flow rate (L/h)" },
          { sym: "A_membrane", desc: "Total membrane area (m²)" },
        ],
        example: {
          problem: "Permeate flow = 500,000 L/h, total membrane area = 20,000 m². What is the flux?",
          solution: "J = 500,000 ÷ 20,000 = 25 LMH",
          answer: "25 LMH",
        },
        tip: "Typical MBR flux = 15–30 LMH at design conditions. Flux > 30 LMH increases fouling rate. TMP rising at constant flux = membrane fouling. Reduce flux and increase backwash frequency.",
      },
      {
        name: "Trans-Membrane Pressure (TMP)",
        formula: "TMP = P_feed − P_permeate",
        units: "kPa",
        variables: [
          { sym: "P_feed", desc: "Feed side pressure (kPa)" },
          { sym: "P_permeate", desc: "Permeate side pressure (kPa)" },
        ],
        tip: "TMP rising > 5 kPa/day at constant flux indicates fouling. Initiate maintenance clean (citric acid or sodium hypochlorite). Recovery clean required when TMP > 50 kPa.",
      },
      {
        name: "MBBR — Surface Area Loading Rate (SALR)",
        formula: "SALR = BOD_load ÷ A_media",
        units: "g BOD/m²·d",
        variables: [
          { sym: "BOD_load", desc: "Applied BOD load (g/d)" },
          { sym: "A_media", desc: "Total effective media surface area (m²)" },
        ],
        tip: "Typical MBBR SALR for carbonaceous removal = 5–15 g BOD/m²·d. For nitrification = 0.5–2.0 g NH₄-N/m²·d. Media fill fraction typically 40–70% of reactor volume.",
      },
      {
        name: "SRT (Solids Retention Time) for Nitrification",
        formula: "SRT_min = 1 ÷ (μ_max_AOB × (NH₄ ÷ (K_s + NH₄)) − b_AOB)",
        units: "days",
        variables: [
          { sym: "μ_max_AOB", desc: "Maximum growth rate of AOB at 20°C (≈ 0.9 d⁻¹)" },
          { sym: "K_s", desc: "Half-saturation constant for NH₄ (≈ 0.5–1.0 mg/L)" },
          { sym: "b_AOB", desc: "Decay rate of AOB (≈ 0.05 d⁻¹)" },
          { sym: "NH₄", desc: "Effluent ammonia concentration (mg/L)" },
        ],
        tip: "At 20°C, minimum SRT for nitrification ≈ 4–6 days. Apply safety factor of 1.5–2.0. At 10°C, minimum SRT doubles. Nitrification failure at SRT < safety factor × SRT_min.",
      },
    ],
  },
  {
    id: "equipment",
    label: "Equipment Operation & Maintenance",
    icon: "⚙️",
    color: "#15803D",
    bg: "#F0FDF4",
    formulas: [
      {
        name: "Centrifuge — Centrifugal Force (G-Force)",
        formula: "G = 1.118 × 10⁻⁵ × r × N²",
        units: "× g (relative centrifugal force)",
        variables: [
          { sym: "r", desc: "Radius from centre to liquid surface (cm)" },
          { sym: "N", desc: "Rotational speed (RPM)" },
        ],
        example: {
          problem: "Centrifuge bowl radius = 25 cm, speed = 2,000 RPM. What is the G-force?",
          solution: "G = 1.118 × 10⁻⁵ × 25 × 2,000² = 1.118 × 10⁻⁵ × 25 × 4,000,000 = 1,118 × g",
          answer: "1,118 × g",
        },
        tip: "Higher G-force improves solids capture but increases wear and energy. Typical decanter centrifuge G-force = 1,500–3,000 × g for biosolids dewatering.",
      },
      {
        name: "Centrifuge — Solids Recovery",
        formula: "Solids Recovery (%) = (TS_cake × Q_cake) ÷ (TS_feed × Q_feed) × 100",
        units: "%",
        variables: [
          { sym: "TS_cake", desc: "Total solids in dewatered cake (%)" },
          { sym: "Q_cake", desc: "Cake production rate (kg/h)" },
          { sym: "TS_feed", desc: "Total solids in feed sludge (%)" },
          { sym: "Q_feed", desc: "Feed sludge flow rate (kg/h)" },
        ],
        tip: "Target solids recovery > 90% for Class A biosolids. Polymer dose optimization: increase dose if recovery < 90%, reduce if centrate TSS is very low (over-dosing wastes polymer).",
      },
      {
        name: "UV Disinfection — UV Dose",
        formula: "UV Dose = I × t",
        units: "mJ/cm²",
        variables: [
          { sym: "I", desc: "UV intensity (mW/cm²)" },
          { sym: "t", desc: "Exposure time (seconds)" },
        ],
        example: {
          problem: "UV intensity = 30 mW/cm², exposure time = 10 seconds. What is the UV dose?",
          solution: "UV Dose = 30 × 10 = 300 mJ/cm²",
          answer: "300 mJ/cm²",
        },
        tip: "Ontario Reg. 170/03 requires UV dose ≥ 40 mJ/cm² for drinking water. For wastewater reuse, target ≥ 100 mJ/cm². UV transmittance (UVT) < 55% requires dose correction. Clean lamps regularly.",
      },
      {
        name: "UV Transmittance (UVT)",
        formula: "UVT (%) = 10^(−A) × 100",
        units: "%",
        variables: [
          { sym: "A", desc: "UV absorbance at 254 nm (dimensionless)" },
        ],
        example: {
          problem: "UV absorbance = 0.20. What is the UVT?",
          solution: "UVT = 10^(−0.20) × 100 = 0.631 × 100 = 63.1%",
          answer: "63.1%",
        },
        tip: "UVT < 55% severely reduces UV effectiveness. High TSS, iron, humic acids, and nitrite reduce UVT. Pre-treatment (filtration, coagulation) improves UVT before UV disinfection.",
      },
      {
        name: "Chemical Feed — Polymer Dose",
        formula: "Polymer Dose (kg/d) = Q_sludge × TS_feed × Dose_specific",
        units: "kg/d",
        variables: [
          { sym: "Q_sludge", desc: "Sludge feed flow rate (m³/d)" },
          { sym: "TS_feed", desc: "Feed sludge total solids concentration (kg/m³)" },
          { sym: "Dose_specific", desc: "Specific polymer dose (kg polymer/tonne dry solids)" },
        ],
        tip: "Typical polymer dose for biosolids dewatering = 5–15 kg/tonne DS. Jar testing determines optimal dose. Over-dosing is expensive and can reduce cake solids. Under-dosing reduces capture efficiency.",
      },
      {
        name: "Pump Efficiency",
        formula: "η_pump = (Q × H × ρ × g) ÷ P_shaft × 100",
        units: "%",
        variables: [
          { sym: "Q", desc: "Flow rate (m³/s)" },
          { sym: "H", desc: "Total dynamic head (m)" },
          { sym: "ρ", desc: "Fluid density (kg/m³, water ≈ 1,000)" },
          { sym: "g", desc: "Gravitational acceleration (9.81 m/s²)" },
          { sym: "P_shaft", desc: "Shaft power input (W)" },
        ],
        tip: "Pump efficiency typically 65–85%. Efficiency drops with wear (impeller erosion), off-design operation, or cavitation. Monitor pump curves and compare to design point quarterly.",
      },
    ],
  },
  {
    id: "laboratory",
    label: "Laboratory Analysis & Interpretation",
    icon: "🧪",
    color: "#6D28D9",
    bg: "#F5F3FF",
    formulas: [
      {
        name: "Biochemical Oxygen Demand (BOD₅) — Seeded",
        formula: "BOD₅ = [(DO_i − DO_f) − (B_i − B_f) × P] ÷ f",
        units: "mg/L",
        variables: [
          { sym: "DO_i", desc: "Initial DO of diluted sample (mg/L)" },
          { sym: "DO_f", desc: "Final DO of diluted sample after 5 days (mg/L)" },
          { sym: "B_i", desc: "Initial DO of seed control (mg/L)" },
          { sym: "B_f", desc: "Final DO of seed control (mg/L)" },
          { sym: "P", desc: "Fraction of seed in sample bottle" },
          { sym: "f", desc: "Decimal fraction of sample used (dilution factor)" },
        ],
        example: {
          problem: "DO_i = 8.2, DO_f = 2.1, B_i = 8.0, B_f = 6.5, P = 0.10, f = 0.02. What is BOD₅?",
          solution: "BOD₅ = [(8.2 − 2.1) − (8.0 − 6.5) × 0.10] ÷ 0.02 = [6.1 − 0.15] ÷ 0.02 = 5.95 ÷ 0.02 = 297.5 mg/L",
          answer: "297.5 mg/L",
        },
        tip: "Valid BOD test: DO depletion 2–7 mg/L, DO_f > 1 mg/L. Seed correction critical for industrial wastewater. Nitrification inhibitor (TCMP) added to measure only carbonaceous BOD.",
      },
      {
        name: "Volatile Suspended Solids (VSS)",
        formula: "VSS = (W_dried − W_ignited) ÷ V_sample × 1000",
        units: "mg/L",
        variables: [
          { sym: "W_dried", desc: "Weight of dried residue at 105°C (g)" },
          { sym: "W_ignited", desc: "Weight after ignition at 550°C (g)" },
          { sym: "V_sample", desc: "Sample volume (mL)" },
        ],
        tip: "VSS/TSS ratio (volatile fraction) should be 0.75–0.85 for healthy activated sludge. Low VSS/TSS = inert inorganic accumulation (grit, precipitates). High VSS/TSS = young sludge or industrial input.",
      },
      {
        name: "Specific Resistance to Filtration (SRF)",
        formula: "SRF = 2 × b × A² × ΔP ÷ (μ × C)",
        units: "m/kg",
        variables: [
          { sym: "b", desc: "Slope of t/V vs V plot (s/m⁶)" },
          { sym: "A", desc: "Filter area (m²)" },
          { sym: "ΔP", desc: "Applied pressure (Pa)" },
          { sym: "μ", desc: "Filtrate viscosity (Pa·s)" },
          { sym: "C", desc: "Mass of dry solids per unit volume of filtrate (kg/m³)" },
        ],
        tip: "SRF < 10¹² m/kg = good dewaterability. SRF > 10¹³ m/kg = poor dewaterability, requires polymer conditioning. SRF test predicts centrifuge and belt press performance.",
      },
      {
        name: "Respirometry — Specific Oxygen Uptake Rate (SOUR)",
        formula: "SOUR = OUR × 1000 ÷ MLVSS",
        units: "mg O₂/g VSS·h",
        variables: [
          { sym: "OUR", desc: "Oxygen uptake rate (mg/L·min)" },
          { sym: "MLVSS", desc: "Mixed liquor volatile suspended solids (mg/L)" },
        ],
        tip: "SOUR 8–20 = active aerobic conditions. SOUR < 5 = low activity (old sludge, toxicity, low temperature). SOUR > 25 = overloaded. Used to diagnose bulking, toxicity, and nitrification.",
      },
      {
        name: "Effluent Toxicity — LC₅₀",
        formula: "LC₅₀ = Concentration causing 50% mortality in test organisms",
        units: "% effluent (v/v)",
        tip: "Ontario ECA may require whole effluent toxicity (WET) testing using rainbow trout or Daphnia magna. LC₅₀ > 100% means effluent is not acutely toxic at 100% concentration. Chronic toxicity (IC₂₅) is more sensitive.",
      },
      {
        name: "Phosphorus — Ortho-P to TP Ratio",
        formula: "Ortho-P:TP = Ortho-P ÷ TP × 100",
        units: "%",
        variables: [
          { sym: "Ortho-P", desc: "Soluble reactive phosphorus (mg/L)" },
          { sym: "TP", desc: "Total phosphorus (mg/L)" },
        ],
        tip: "Ortho-P:TP > 80% in effluent indicates most P is in dissolved form — chemical precipitation (alum, ferric) or EBPR needed. Ortho-P:TP < 30% indicates P is mainly particulate — improve solids removal.",
      },
      {
        name: "Nitrogen — TKN",
        formula: "TKN = Organic N + NH₄⁺-N",
        units: "mg/L",
        tip: "TKN measures organic nitrogen + ammonia. Does NOT include nitrate or nitrite. TKN ÷ BOD ratio > 0.1 indicates nitrogen-limited conditions. Typical municipal wastewater TKN = 35–60 mg/L.",
      },
    ],
  },
  {
    id: "biosolids",
    label: "Biosolids Management & Regulations",
    icon: "♻️",
    color: "#0F766E",
    bg: "#F0FDFA",
    formulas: [
      {
        name: "Biosolids — Volatile Solids Reduction (VSR)",
        formula: "VSR (%) = (VS_in − VS_out) ÷ VS_in × 100",
        units: "%",
        variables: [
          { sym: "VS_in", desc: "Volatile solids entering digester (kg/d)" },
          { sym: "VS_out", desc: "Volatile solids leaving digester (kg/d)" },
        ],
        example: {
          problem: "VS_in = 5,000 kg/d, VS_out = 2,750 kg/d. What is the VSR?",
          solution: "VSR = (5,000 − 2,750) ÷ 5,000 × 100 = 2,250 ÷ 5,000 × 100 = 45%",
          answer: "45%",
        },
        tip: "Ontario Reg. 267/03 requires VSR ≥ 38% for Class B biosolids via anaerobic digestion. Class A (EQ) requires additional pathogen reduction (e.g., thermophilic digestion, lime stabilization).",
      },
      {
        name: "Biosolids — Specific Gravity Correction for Dry Tonnes",
        formula: "Dry Mass (kg/d) = Q_sludge (m³/d) × TS (%) × SG × 10",
        units: "kg/d",
        variables: [
          { sym: "Q_sludge", desc: "Sludge volume (m³/d)" },
          { sym: "TS", desc: "Total solids content (%)" },
          { sym: "SG", desc: "Specific gravity of sludge (typically 1.02–1.06)" },
        ],
        example: {
          problem: "Sludge flow = 200 m³/d, TS = 4%, SG = 1.03. What is the dry mass?",
          solution: "Dry Mass = 200 × 4 × 1.03 × 10 = 8,240 kg/d",
          answer: "8,240 kg/d (8.24 tonnes/d)",
        },
        tip: "Accurate dry mass calculation is essential for Reg. 267/03 nutrient management planning. Land application rates are based on agronomic nitrogen loading, not volume.",
      },
      {
        name: "Land Application — Agronomic Rate",
        formula: "Rate (kg/ha) = Crop N Requirement ÷ (TKN × Availability Factor)",
        units: "kg dry solids/ha",
        variables: [
          { sym: "Crop N Requirement", desc: "Nitrogen uptake by crop (kg N/ha)" },
          { sym: "TKN", desc: "Total Kjeldahl nitrogen in biosolids (kg N/tonne DS)" },
          { sym: "Availability Factor", desc: "Fraction of TKN available to crop (0.3–0.8 depending on form)" },
        ],
        tip: "Ontario Reg. 267/03 limits land application based on agronomic nitrogen need. Phosphorus accumulation in soil may be the limiting factor on some fields. Maintain 100 m setback from water bodies.",
      },
      {
        name: "Pathogen Reduction — Log Reduction",
        formula: "Log Reduction = log₁₀(N_in ÷ N_out)",
        units: "log₁₀ units",
        variables: [
          { sym: "N_in", desc: "Pathogen concentration entering process (CFU/g or MPN/g)" },
          { sym: "N_out", desc: "Pathogen concentration leaving process (CFU/g or MPN/g)" },
        ],
        example: {
          problem: "Fecal coliforms: N_in = 10⁷ MPN/g, N_out = 10³ MPN/g. What is the log reduction?",
          solution: "Log Reduction = log₁₀(10⁷ ÷ 10³) = log₁₀(10⁴) = 4 log",
          answer: "4 log reduction",
        },
        tip: "Class A EQ biosolids: fecal coliforms < 1,000 MPN/g or Salmonella < 3 MPN/4g. Class B: fecal coliforms < 2 × 10⁶ MPN/g. Class A requires additional vector attraction reduction (VAR).",
      },
      {
        name: "Biogas Production Rate",
        formula: "V_biogas = VS_destroyed × Y_biogas",
        units: "m³/d",
        variables: [
          { sym: "VS_destroyed", desc: "Volatile solids destroyed in digester (kg/d)" },
          { sym: "Y_biogas", desc: "Biogas yield (typically 0.75–1.12 m³ biogas/kg VS destroyed)" },
        ],
        tip: "Biogas is typically 60–70% methane, 30–40% CO₂. Energy content ≈ 22 MJ/m³ biogas. Biogas production dropping at constant loading = digester upset (pH, temperature, toxic inhibition).",
      },
    ],
  },
  {
    id: "plant-management",
    label: "Plant Management, Safety & Administration",
    icon: "📋",
    color: "#B91C1C",
    bg: "#FFF1F2",
    formulas: [
      {
        name: "Energy Intensity",
        formula: "Energy Intensity = Total Energy (kWh/d) ÷ Flow Treated (m³/d)",
        units: "kWh/m³",
        tip: "Typical municipal WWTP energy intensity = 0.3–0.6 kWh/m³. Aeration accounts for 50–60% of energy. MBR plants use 0.8–1.5 kWh/m³. Benchmark against similar plants and target 10–20% reduction.",
      },
      {
        name: "Cost Per Tonne of Biosolids Processed",
        formula: "Unit Cost = Total Annual Biosolids Cost ($) ÷ Dry Tonnes Produced (t/yr)",
        units: "$/tonne DS",
        tip: "Typical biosolids management cost = $100–$400/tonne DS depending on treatment level and disposal method. Land application is usually lowest cost; incineration highest. Class A biosolids may have market value.",
      },
      {
        name: "Permit Compliance Rate",
        formula: "Compliance Rate (%) = (Compliant Samples ÷ Total Samples) × 100",
        units: "%",
        tip: "Ontario ECA requires 100% compliance with effluent limits. Exceedances must be reported to MECP within 2 hours (acute) or 2 days (chronic). Root cause analysis and corrective action required for all exceedances.",
      },
      {
        name: "Confined Space — Atmospheric Testing Order",
        formula: "Test Order: O₂ → Flammable Gas → Toxic Gas (H₂S, CO)",
        tip: "O₂ must be tested first: 19.5–23.0% is safe range. < 19.5% = oxygen deficient (IDLH). > 23.0% = oxygen enriched (fire hazard). H₂S IDLH = 50 ppm. LEL for methane = 5%. Never enter without continuous monitoring.",
      },
      {
        name: "SCADA — Alarm Priority Classification",
        formula: "Priority 1 (Critical): Immediate response required\nPriority 2 (High): Response within 15 min\nPriority 3 (Medium): Response within 1 hour\nPriority 4 (Low): Response within shift",
        tip: "Alarm rationalization reduces nuisance alarms. Target < 1 alarm per 10 minutes during steady-state operation. Flooding alarms, effluent limit exceedance, and equipment failure are always Priority 1.",
      },
      {
        name: "Staffing Level — Ontario Reg. 128/04",
        formula: "Class 4 WW plant requires: Operator-in-Charge (OIC) holding Class 4 WW licence + sufficient licensed operators for continuous coverage",
        tip: "OIC is responsible for overall plant operation and compliance. Operator of Record (OOR) is responsible for day-to-day operations. Class 4 plants must have a Class 4 OIC on call 24/7. Document all OIC decisions.",
      },
    ],
  },
];

export default function FormulasWW4() {
  usePageMeta({
    title: "Class 4 Wastewater Formula Sheet",
    description:
      "Complete formula reference for Ontario Class 4 Wastewater Treatment operator exam. Covers BNR, MBR, MBBR, biosolids, UV disinfection, lab analysis, and plant management.",
    path: "/formulas-ww4",
    keywords:
      "Class 4 wastewater formulas, Ontario operator exam, BNR, MBR, biosolids, UV disinfection, OWWCO, O. Reg. 128/04",
  });

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredCategories = CATEGORIES.map((cat) => ({
    ...cat,
    formulas: cat.formulas.filter(
      (f) =>
        !search ||
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.formula.toLowerCase().includes(search.toLowerCase()) ||
        (f.tip ?? "").toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.formulas.length > 0);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}>
      <SiteNav currentPath="/formulas-ww4" />
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0E7490 0%, #0F766E 100%)", padding: "32px 24px 24px", color: "#fff" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>📐</span>
            <div>
              <p style={{ margin: 0, fontSize: 11, opacity: 0.75, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Echelon Institute</p>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Class 4 Wastewater — Formula Sheet</h1>
              <p style={{ margin: 0, fontSize: 13, opacity: 0.85 }}>Advanced Treatment · Equipment · Lab · Biosolids · Plant Management</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
            <Link href="/class4-ww">
              <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "none", color: "#fff" }}>
                ← Back to Quiz
              </span>
            </Link>
            <Link href="/class4-ww-mock">
              <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "none", color: "#fff" }}>
                📋 Mock Exam →
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
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 14, marginBottom: 16, background: "#fff", boxSizing: "border-box" }}
        />
        {/* Category filter */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          <button
            onClick={() => setActiveCategory(null)}
            style={{ padding: "6px 14px", borderRadius: 20, border: "1.5px solid", borderColor: activeCategory === null ? "#0E7490" : "#E2E8F0", background: activeCategory === null ? "#0E7490" : "#fff", color: activeCategory === null ? "#fff" : "#64748B", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              style={{ padding: "6px 14px", borderRadius: 20, border: "1.5px solid", borderColor: activeCategory === cat.id ? cat.color : "#E2E8F0", background: activeCategory === cat.id ? cat.color : "#fff", color: activeCategory === cat.id ? "#fff" : "#64748B", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
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
                    <div style={{ background: cat.bg, padding: "16px 20px", borderBottom: `2px solid ${cat.color}20` }}>
                      <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: cat.color }}>{f.name}</h3>
                      <div style={{ background: "#fff", borderRadius: 8, padding: "10px 14px", fontFamily: "monospace", fontSize: 14, color: "#1E293B", fontWeight: 600, border: `1px solid ${cat.color}30`, whiteSpace: "pre-line" }}>
                        {f.formula}
                      </div>
                      {f.units && (
                        <div style={{ marginTop: 6, fontSize: 12, color: "#64748B" }}>Units: <strong>{f.units}</strong></div>
                      )}
                    </div>
                    <div style={{ padding: "16px 20px" }}>
                      {f.variables && f.variables.length > 0 && (
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Variables</div>
                          <div style={{ display: "grid", gap: 4 }}>
                            {f.variables.map((v, j) => (
                              <div key={j} style={{ display: "flex", gap: 8, fontSize: 13 }}>
                                <span style={{ fontFamily: "monospace", fontWeight: 700, color: cat.color, minWidth: 80 }}>{v.sym}</span>
                                <span style={{ color: "#475569" }}>{v.desc}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {f.example && (
                        <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "14px", marginBottom: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Worked Example</div>
                          <p style={{ fontSize: 13, color: "#1E293B", margin: "0 0 8px", fontWeight: 600 }}>{f.example.problem}</p>
                          <p style={{ fontSize: 13, color: "#475569", margin: "0 0 6px", whiteSpace: "pre-line" }}>{f.example.solution}</p>
                          <p style={{ fontSize: 13, color: cat.color, fontWeight: 700, margin: 0 }}>Answer: {f.example.answer}</p>
                        </div>
                      )}
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
