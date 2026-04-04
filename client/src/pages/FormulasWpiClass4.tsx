// WPI CLASS IV WATER TREATMENT — FORMULA SHEET
// Chief Operator Level: Advanced Process Control, Plant Management, Regulatory Compliance

import { useState } from "react";
import { Link } from "wouter";
import SiteNav from "@/components/SiteNav";

interface FormulaEntry {
  name: string;
  formula: string;
  units: string;
  example: string;
  notes: string;
}

interface FormulaCategory {
  title: string;
  icon: string;
  color: string;
  formulas: FormulaEntry[];
}

const CATEGORIES: FormulaCategory[] = [
  {
    title: "Advanced Disinfection & CT Calculations",
    icon: "🧪",
    color: "#1e3a5f",
    formulas: [
      {
        name: "CT Value (Disinfection Credit)",
        formula: "CT = C × T",
        units: "mg/L · min",
        example: "Cl₂ residual = 1.5 mg/L, contact time = 40 min → CT = 60 mg/L·min",
        notes: "C = disinfectant residual (mg/L) at the outlet; T = theoretical detention time (min). For chlorine at pH 7 and 15°C, CT = 60 achieves 3-log Giardia inactivation.",
      },
      {
        name: "Effective CT (Baffling Factor)",
        formula: "T₁₀ = BF × HRT",
        units: "min",
        example: "HRT = 60 min, BF = 0.5 → T₁₀ = 30 min",
        notes: "BF = baffling factor (0.1–1.0 per regulatory tables). T₁₀ is the time for 10% of tracer to pass through. Use T₁₀ for CT credit calculations.",
      },
      {
        name: "Log Inactivation (Chick-Watson)",
        formula: "log(N₀/N) = k × C^n × T",
        units: "dimensionless",
        example: "k = 0.02, C = 1 mg/L, n = 1, T = 30 min → log inactivation = 0.6",
        notes: "k = rate constant (varies by organism and disinfectant); n = dilution coefficient (typically 1 for chlorine). Used to calculate inactivation credit for regulatory compliance.",
      },
      {
        name: "Ozone CT for Giardia (3-log)",
        formula: "CT_O₃ = 0.63 mg/L·min (at 15°C, pH 7)",
        units: "mg/L · min",
        example: "Ozone residual = 0.3 mg/L, T₁₀ = 3 min → CT = 0.9 > 0.63 ✓",
        notes: "Ozone is far more effective than chlorine. At 15°C, only 0.63 mg/L·min achieves 3-log Giardia inactivation vs. 60 mg/L·min for chlorine at pH 7.",
      },
      {
        name: "UV Dose for Giardia (3-log)",
        formula: "UV Dose = E × t (mJ/cm²)",
        units: "mJ/cm²",
        example: "3-log Giardia requires ≥5.8 mJ/cm²; 4-log Cryptosporidium requires ≥22 mJ/cm²",
        notes: "UV dose = irradiance (mW/cm²) × exposure time (s). UV provides no residual — must be combined with chemical disinfection for distribution system protection.",
      },
      {
        name: "Disinfection Byproduct (DBP) Formation",
        formula: "THM_f = k × [NOM] × [Cl₂] × t^n × pH^m × T^p",
        units: "μg/L",
        example: "Higher NOM, higher Cl₂ dose, longer contact time, higher pH → higher THM formation",
        notes: "Simplified empirical relationship. Key levers: reduce NOM before chlorination (enhanced coagulation, GAC), minimize Cl₂ dose, lower pH, reduce contact time before distribution.",
      },
    ],
  },
  {
    title: "Membrane & Advanced Treatment",
    icon: "🔬",
    color: "#1a4a2e",
    formulas: [
      {
        name: "Membrane Flux",
        formula: "J = Q / A",
        units: "L/m²·h (LMH)",
        example: "Flow = 500 L/h, membrane area = 25 m² → J = 20 LMH",
        notes: "J = permeate flux; Q = permeate flow rate; A = effective membrane area. Typical UF flux: 20–80 LMH; RO flux: 15–30 LMH. Higher flux increases fouling rate.",
      },
      {
        name: "Recovery Rate",
        formula: "R = (Q_p / Q_f) × 100%",
        units: "%",
        example: "Feed = 1000 L/h, permeate = 750 L/h → R = 75%",
        notes: "R = recovery; Q_p = permeate flow; Q_f = feed flow. Concentrate flow = Q_f − Q_p. Higher recovery reduces waste but increases concentration polarization and fouling.",
      },
      {
        name: "Transmembrane Pressure (TMP)",
        formula: "TMP = (P_f + P_c)/2 − P_p",
        units: "kPa or bar",
        example: "P_f = 200 kPa, P_c = 180 kPa, P_p = 0 kPa → TMP = 190 kPa",
        notes: "P_f = feed pressure; P_c = concentrate pressure; P_p = permeate pressure. Rising TMP at constant flux indicates fouling. Trigger backwash/CIP when TMP exceeds setpoint.",
      },
      {
        name: "Specific Energy Consumption (SEC)",
        formula: "SEC = P / Q_p",
        units: "kWh/m³",
        example: "Motor power = 5 kW, permeate flow = 10 m³/h → SEC = 0.5 kWh/m³",
        notes: "SEC measures energy efficiency of membrane systems. Typical UF: 0.05–0.3 kWh/m³; RO: 0.5–3 kWh/m³. Monitor for increases indicating fouling or mechanical issues.",
      },
      {
        name: "Langelier Saturation Index (LSI)",
        formula: "LSI = pH_actual − pH_s",
        units: "dimensionless",
        example: "pH = 7.8, pH_s = 8.2 → LSI = −0.4 (slightly corrosive)",
        notes: "pH_s = saturation pH (function of Ca²⁺, alkalinity, TDS, temperature). LSI > 0: scale-forming; LSI < 0: corrosive; LSI = 0: balanced. Target LSI slightly positive for corrosion control.",
      },
      {
        name: "Ozone Dose",
        formula: "D = C_applied × t / Q",
        units: "mg/L",
        example: "O₃ generator output = 100 g/h, flow = 10,000 L/h → dose = 10 mg/L",
        notes: "Applied ozone dose = mass of ozone applied / volume of water treated. Transferred dose is lower due to off-gas losses. Monitor residual ozone to verify CT compliance.",
      },
    ],
  },
  {
    title: "Hydraulics & Energy Management",
    icon: "⚡",
    color: "#3a1a5f",
    formulas: [
      {
        name: "Pump Affinity Laws — Flow",
        formula: "Q₂/Q₁ = N₂/N₁",
        units: "m³/h or L/s",
        example: "Speed increases 20% → flow increases 20%",
        notes: "Q = flow rate; N = pump speed (RPM). Used to predict pump performance at different speeds with variable frequency drives (VFDs).",
      },
      {
        name: "Pump Affinity Laws — Head",
        formula: "H₂/H₁ = (N₂/N₁)²",
        units: "m",
        example: "Speed increases 20% → head increases 44%",
        notes: "H = total dynamic head. Head increases as the square of speed ratio — much more sensitive to speed changes than flow.",
      },
      {
        name: "Pump Affinity Laws — Power",
        formula: "P₂/P₁ = (N₂/N₁)³",
        units: "kW",
        example: "Speed increases 20% → power increases 73%",
        notes: "P = shaft power. Power increases as the cube of speed ratio. Reducing speed by 20% saves ~49% of power — the basis for VFD energy savings.",
      },
      {
        name: "Wire-to-Water Efficiency",
        formula: "η_total = (Q × H × ρ × g) / P_input",
        units: "%",
        example: "Q = 0.1 m³/s, H = 30 m, P_input = 45 kW → η = (0.1×30×1000×9.81)/45000 = 65%",
        notes: "η_total = motor efficiency × pump efficiency. Typical combined efficiency: 60–80%. Monitor for decreases indicating wear, cavitation, or motor degradation.",
      },
      {
        name: "Energy Cost per Volume",
        formula: "Cost = (P × t × rate) / V",
        units: "$/m³",
        example: "50 kW pump, 8 h/day, $0.10/kWh, 5,000 m³/day → $0.008/m³",
        notes: "Track energy cost per m³ produced as a KPI. Increases indicate declining pump efficiency, increased head, or rising energy rates. Target: 0.01–0.05 $/m³ for most surface water plants.",
      },
      {
        name: "Water Hammer Pressure Rise",
        formula: "ΔP = ρ × a × ΔV",
        units: "kPa",
        example: "ρ = 1000 kg/m³, wave speed a = 1200 m/s, ΔV = 0.5 m/s → ΔP = 600 kPa",
        notes: "a = wave speed (function of pipe material and water compressibility); ΔV = velocity change. Slow valve closure (>2× wave travel time) prevents water hammer. Install surge tanks or air vessels for protection.",
      },
    ],
  },
  {
    title: "Chemical Dosing & Process Optimization",
    icon: "⚗️",
    color: "#5f2a1a",
    formulas: [
      {
        name: "Chemical Feed Rate",
        formula: "Feed Rate = (Dose × Q × ρ_w) / (C_stock × ρ_stock)",
        units: "L/h or mL/min",
        example: "Dose = 5 mg/L, Q = 100 m³/h, C_stock = 10% (100,000 mg/L) → Feed = 0.5 L/h",
        notes: "Dose = target concentration (mg/L); Q = flow (L/h); C_stock = stock solution concentration (mg/L). Always verify with grab samples and jar tests.",
      },
      {
        name: "Coagulant Dose Optimization (Jar Test)",
        formula: "Optimal dose = lowest dose achieving target turbidity and zeta potential",
        units: "mg/L",
        example: "Jar test: 10, 20, 30, 40 mg/L alum → 30 mg/L achieves <1 NTU settled turbidity",
        notes: "Jar tests simulate coagulation-flocculation-sedimentation. Vary dose, pH, mixing intensity. Target settled turbidity <1 NTU, filtered turbidity <0.1 NTU. Adjust for seasonal source water changes.",
      },
      {
        name: "Alkalinity Consumption by Alum",
        formula: "Alk consumed = 0.5 × Alum dose (as Al₂(SO₄)₃·18H₂O)",
        units: "mg/L as CaCO₃",
        example: "Alum dose = 30 mg/L → Alk consumed ≈ 15 mg/L as CaCO₃",
        notes: "Alum hydrolysis consumes alkalinity and lowers pH. If alkalinity < 2× alum dose, add lime or soda ash to maintain pH 6.5–7.5 for optimal coagulation.",
      },
      {
        name: "Fluoride Dosing",
        formula: "Feed Rate = (Target − Background) × Q / C_stock",
        units: "L/h",
        example: "Target = 0.7 mg/L, background = 0.1 mg/L, Q = 1000 m³/h, C_stock = 18,000 mg/L → Feed = 33 L/h",
        notes: "Health Canada optimal range: 0.7 mg/L. Maximum acceptable concentration (MAC): 1.5 mg/L. Monitor continuously with online analyzer. Fluoride is a regulated chemical requiring secure storage.",
      },
      {
        name: "Lime Softening — Carbonate Hardness Removal",
        formula: "Lime dose = CO₂ + Ca-hardness + Mg-hardness (as CaCO₃)",
        units: "mg/L as CaCO₃",
        example: "CO₂ = 10, Ca-hardness = 150, Mg-hardness = 50 mg/L → Lime dose ≈ 210 mg/L as CaCO₃",
        notes: "Excess lime (pH > 10.5) required for Mg removal. Recarbonation with CO₂ stabilizes water after softening. Target finished water hardness: 80–120 mg/L as CaCO₃.",
      },
      {
        name: "Chloramine Formation",
        formula: "Cl₂:NH₃-N ratio determines product: <5:1 → monochloramine; >7.6:1 → breakpoint",
        units: "mass ratio",
        example: "Target monochloramine: add NH₃ first, then Cl₂ at 4:1 ratio",
        notes: "Monochloramine (NH₂Cl) produces fewer THMs/HAAs than free chlorine. Requires careful ratio control — excess chlorine causes dichloramine (taste/odour) or breakpoint chlorination.",
      },
    ],
  },
  {
    title: "Regulatory & Compliance Calculations",
    icon: "📋",
    color: "#1a3a5f",
    formulas: [
      {
        name: "Running Annual Average (RAA)",
        formula: "RAA = Sum of last 4 quarterly averages / 4",
        units: "μg/L or mg/L",
        example: "Q1 = 40, Q2 = 55, Q3 = 45, Q4 = 50 μg/L → RAA = 47.5 μg/L THMs",
        notes: "THMs and HAAs are regulated as RAAs. If any quarterly average exceeds the MAC, the RAA may still comply — but the trend must be addressed. Exceedance triggers public notification.",
      },
      {
        name: "Turbidity Compliance (Filtered Systems)",
        formula: "95th percentile of all measurements in a month must be ≤0.3 NTU",
        units: "NTU",
        example: "200 measurements: 95th percentile = 190th highest value. If ≤0.3 NTU → compliant",
        notes: "Under GUDI and surface water regulations, 95% of filtered turbidity measurements must be ≤0.3 NTU; no single measurement may exceed 1.0 NTU (Ontario). Continuous monitoring required.",
      },
      {
        name: "Log Removal Credit Calculation",
        formula: "Total log credit = Treatment credit + Disinfection credit ≥ Required log removal",
        units: "log",
        example: "Required: 4-log Giardia. Filtration credit: 2.5 log. Disinfection needed: ≥1.5 log",
        notes: "Regulatory frameworks specify required log removals for Giardia, Cryptosporidium, and viruses. Treatment processes receive credit; remaining removal must come from disinfection CT.",
      },
      {
        name: "Sanitary Survey Score Calculation",
        formula: "Score = (Points earned / Total possible points) × 100%",
        units: "%",
        example: "Earned 85/100 points → 85% score. Typically ≥80% = satisfactory",
        notes: "Sanitary surveys evaluate source protection, treatment, distribution, operations, and management. Deficiencies generate corrective action requirements with deadlines.",
      },
      {
        name: "Reportable Adverse Result — Notification Timeline",
        formula: "Notification to MOH and Director within 24 hours of discovery",
        units: "hours",
        example: "E. coli detected at 3:00 PM → notify MOH and Director by 3:00 PM next day at latest",
        notes: "Under Ontario O. Reg. 170/03 and equivalent provincial regulations. The clock starts at discovery, not at confirmation. Issue public advisory if required by the Medical Officer of Health.",
      },
      {
        name: "Lead and Copper Rule — 90th Percentile",
        formula: "90th percentile = value at position 0.9 × (n+1) when sorted ascending",
        units: "μg/L",
        example: "10 samples sorted: 90th percentile = 9th value. If ≤10 μg/L Pb → compliant",
        notes: "Samples collected from first-draw at high-risk taps (lead service lines, lead solder). Action level: Pb = 10 μg/L (Health Canada). Trigger corrosion control optimization if exceeded.",
      },
    ],
  },
  {
    title: "Asset Management & Capital Planning",
    icon: "🏗️",
    color: "#2a4a1a",
    formulas: [
      {
        name: "Asset Replacement Value (ARV)",
        formula: "ARV = Σ (Unit replacement cost × Quantity)",
        units: "$",
        example: "10 km of 300mm pipe at $500/m = $5,000,000 ARV",
        notes: "ARV is the estimated cost to replace all assets at current prices. Used to calculate the infrastructure gap and annual capital investment needed to maintain the system.",
      },
      {
        name: "Infrastructure Gap",
        formula: "Gap = Required annual investment − Actual annual investment",
        units: "$/year",
        example: "ARV = $50M, 50-year life → required = $1M/year. Actual = $400K/year → Gap = $600K/year",
        notes: "Required annual investment ≈ ARV / average asset life. A persistent infrastructure gap leads to accelerating deterioration and increasing risk of failure.",
      },
      {
        name: "Net Present Value (NPV)",
        formula: "NPV = Σ [CF_t / (1+r)^t] − Initial Investment",
        units: "$",
        example: "Project saves $100K/year for 20 years at 5% discount rate: NPV = $100K × 12.46 − $1M = $246K",
        notes: "CF_t = cash flow in year t; r = discount rate. NPV > 0 means the project creates value. Used to compare capital project alternatives on a consistent basis.",
      },
      {
        name: "Benefit-Cost Ratio (BCR)",
        formula: "BCR = PV of Benefits / PV of Costs",
        units: "dimensionless",
        example: "PV benefits = $2M, PV costs = $1.5M → BCR = 1.33 (proceed if BCR > 1)",
        notes: "BCR > 1 indicates benefits exceed costs in present value terms. Used for regulatory submissions and grant applications to justify capital investments.",
      },
      {
        name: "Condition Assessment Score",
        formula: "CI = f(age, material, failure history, inspection results)",
        units: "1–5 scale",
        example: "CI 1 = very good; CI 5 = very poor/imminent failure. Prioritize CI 4–5 for replacement",
        notes: "Condition index integrates physical inspection, operational data, and failure history. Combine with consequence of failure to prioritize rehabilitation/replacement investments.",
      },
      {
        name: "Life Cycle Cost (LCC)",
        formula: "LCC = Capital cost + PV(O&M) + PV(Replacement) − PV(Salvage)",
        units: "$",
        example: "Pump A: capital $50K, O&M $5K/year for 20 years at 5% = $50K + $62K = $112K LCC",
        notes: "LCC enables fair comparison of alternatives with different capital and operating cost profiles. A higher-capital option with lower O&M may have lower LCC over the asset life.",
      },
    ],
  },
  {
    title: "Source Water & Environmental",
    icon: "🌊",
    color: "#1a4a4a",
    formulas: [
      {
        name: "Watershed Loading (Pollutant Load)",
        formula: "Load = C × Q × conversion factor",
        units: "kg/day",
        example: "Nitrate = 5 mg/L, Q = 1 m³/s → Load = 5 mg/L × 86,400 L/day × 10⁻⁶ = 432 kg/day",
        notes: "Pollutant load = concentration × flow. Used to quantify nutrient, sediment, or contaminant inputs to source water. Guides source protection priority setting.",
      },
      {
        name: "Drinking Water Equivalent Level (DWEL)",
        formula: "DWEL = NOAEL × BW / (UF × DWI)",
        units: "mg/L",
        example: "NOAEL = 1 mg/kg/day, BW = 70 kg, UF = 1000, DWI = 2 L/day → DWEL = 0.035 mg/L",
        notes: "NOAEL = no-observed-adverse-effect level; BW = body weight; UF = uncertainty factor; DWI = daily water intake. Basis for MAC development for chemical contaminants.",
      },
      {
        name: "Dilution Factor",
        formula: "DF = Q_river / (Q_river + Q_effluent)",
        units: "dimensionless",
        example: "River = 10 m³/s, effluent = 0.1 m³/s → DF = 10/10.1 = 0.99 (99% dilution)",
        notes: "Used to estimate downstream contaminant concentrations from upstream discharges. Higher dilution factor = lower risk to downstream intakes. Important for source water risk assessment.",
      },
      {
        name: "Cyanobacteria Cell Count to Chlorophyll-a",
        formula: "Chlorophyll-a (μg/L) ≈ cell count (cells/mL) × 0.001 (approximate)",
        units: "μg/L",
        example: "100,000 cells/mL → ~100 μg/L Chl-a (alert level for HAB management)",
        notes: "WHO alert levels: Level 1 = 20,000 cells/mL (low risk); Level 2 = 100,000 cells/mL (moderate risk); Level 3 = 10M cells/mL (high risk). Trigger treatment adjustments and public advisories.",
      },
    ],
  },
];

export default function FormulasWpiClass4() {
  const [activeCategory, setActiveCategory] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCategories = CATEGORIES.map((cat) => ({
    ...cat,
    formulas: cat.formulas.filter(
      (f) =>
        searchTerm === "" ||
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.formula.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.notes.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter((cat) => cat.formulas.length > 0);

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#e2e8f0" }}>
      <SiteNav currentPath="/formulas-wpi-class4" />

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)", padding: "48px 24px 32px", borderBottom: "1px solid #1e293b" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <Link href="/wpi" style={{ color: "#60a5fa", fontSize: 14, textDecoration: "none" }}>← WPI Certification Hub</Link>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 40 }}>🏗️</span>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: "#f1f5f9" }}>
                WPI Class IV Water Treatment — Formula Sheet
              </h1>
              <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: 15 }}>
                Chief Operator Level · Advanced Process Control · Plant Management · Regulatory Compliance
              </p>
            </div>
          </div>

          {/* Province badges */}
          <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
            {["BC — EOCP Level IV", "AB — AWWOA Class IV", "SK — SAHO Class IV", "MB — MWWA Class IV"].map((p) => (
              <span key={p} style={{ background: "#1e3a5f", border: "1px solid #3b82f6", color: "#93c5fd", padding: "4px 12px", borderRadius: 20, fontSize: 13 }}>{p}</span>
            ))}
          </div>

          {/* Search */}
          <div style={{ marginTop: 20, maxWidth: 400 }}>
            <input
              type="text"
              placeholder="Search formulas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", padding: "10px 16px", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", fontSize: 15, outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", display: "flex", gap: 24, flexWrap: "wrap" }}>
        {/* Category tabs */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <div style={{ position: "sticky", top: 24 }}>
            <p style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Categories</p>
            {CATEGORIES.map((cat, i) => (
              <button
                key={i}
                onClick={() => { setActiveCategory(i); setSearchTerm(""); }}
                style={{
                  display: "block", width: "100%", textAlign: "left", padding: "10px 14px",
                  background: activeCategory === i ? cat.color : "transparent",
                  border: activeCategory === i ? `1px solid ${cat.color}` : "1px solid transparent",
                  borderRadius: 8, color: activeCategory === i ? "#f1f5f9" : "#94a3b8",
                  cursor: "pointer", marginBottom: 4, fontSize: 13, transition: "all 0.15s",
                }}
              >
                <span style={{ marginRight: 8 }}>{cat.icon}</span>{cat.title}
              </button>
            ))}
          </div>
        </div>

        {/* Formula cards */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {(searchTerm ? filteredCategories : [CATEGORIES[activeCategory]]).map((cat, ci) => (
            <div key={ci}>
              {searchTerm && (
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{cat.icon}</span>{cat.title}
                </h2>
              )}
              <div style={{ display: "grid", gap: 16 }}>
                {cat.formulas.map((f, fi) => (
                  <div key={fi} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#f1f5f9" }}>{f.name}</h3>
                      <span style={{ background: "#0f172a", border: "1px solid #475569", color: "#94a3b8", padding: "2px 10px", borderRadius: 12, fontSize: 12, whiteSpace: "nowrap" }}>{f.units}</span>
                    </div>

                    {/* Formula box */}
                    <div style={{ background: "#0f172a", border: "1px solid #3b82f6", borderRadius: 8, padding: "12px 16px", marginBottom: 12, fontFamily: "monospace", fontSize: 15, color: "#60a5fa", letterSpacing: 0.5 }}>
                      {f.formula}
                    </div>

                    {/* Example */}
                    <div style={{ background: "#0f2a1a", border: "1px solid #166534", borderRadius: 8, padding: "10px 14px", marginBottom: 10 }}>
                      <span style={{ fontSize: 11, color: "#4ade80", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Example</span>
                      <p style={{ margin: "4px 0 0", fontSize: 13, color: "#86efac" }}>{f.example}</p>
                    </div>

                    {/* Notes */}
                    <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>{f.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Reference Table */}
      <div style={{ background: "#1e293b", borderTop: "1px solid #334155", padding: "40px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", marginBottom: 20 }}>⚡ Quick Reference — Class IV Key Values</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#0f172a" }}>
                  {["Parameter", "Typical Value / Limit", "Regulatory Reference", "Notes"].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#60a5fa", fontWeight: 600, borderBottom: "1px solid #334155" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Giardia CT (Cl₂, 15°C, pH 7)", "60 mg/L·min (3-log)", "GUDI / Surface Water Regs", "Use T₁₀ with baffling factor"],
                  ["Ozone CT (Giardia, 3-log)", "0.63 mg/L·min", "GUDI", "Far more efficient than Cl₂"],
                  ["UV Dose (Giardia, 3-log)", "5.8 mJ/cm²", "UV Disinfection Guidance", "No residual — combine with Cl₂"],
                  ["UV Dose (Crypto, 4-log)", "22 mJ/cm²", "UV Disinfection Guidance", "Crypto resistant to Cl₂"],
                  ["Filtered turbidity (95th %ile)", "≤0.3 NTU", "O. Reg. 170/03 / Prov. Regs", "No single reading >1.0 NTU"],
                  ["THM MAC (RAA)", "100 μg/L", "Health Canada GCDWQ", "Running annual average"],
                  ["HAA MAC (RAA)", "80 μg/L", "Health Canada GCDWQ", "Running annual average"],
                  ["Lead MAC", "10 μg/L (90th %ile)", "Health Canada GCDWQ", "First-draw samples"],
                  ["Fluoride optimal", "0.7 mg/L", "Health Canada", "MAC = 1.5 mg/L"],
                  ["Chlorine residual (distribution)", "≥0.05 mg/L free Cl₂", "Provincial regulations", "Minimum at all points"],
                  ["Notification of adverse result", "Within 24 hours", "O. Reg. 170/03", "To MOH and Director"],
                  ["Baffling factor (poor)", "0.1", "CT Guidance", "Unbaffled tanks"],
                  ["Baffling factor (excellent)", "0.7–1.0", "CT Guidance", "Plug flow / serpentine"],
                  ["Membrane flux (UF typical)", "20–80 LMH", "Manufacturer guidance", "Monitor for fouling"],
                  ["VFD power savings (20% speed reduction)", "~49% power reduction", "Affinity laws", "P ∝ N³"],
                ].map(([param, value, ref, notes], i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#1e293b" : "#0f172a" }}>
                    <td style={{ padding: "9px 14px", color: "#e2e8f0", borderBottom: "1px solid #1e293b" }}>{param}</td>
                    <td style={{ padding: "9px 14px", color: "#4ade80", fontFamily: "monospace", borderBottom: "1px solid #1e293b" }}>{value}</td>
                    <td style={{ padding: "9px 14px", color: "#94a3b8", borderBottom: "1px solid #1e293b" }}>{ref}</td>
                    <td style={{ padding: "9px 14px", color: "#64748b", borderBottom: "1px solid #1e293b" }}>{notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer nav */}
      <div style={{ background: "#0f172a", borderTop: "1px solid #1e293b", padding: "24px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          <Link href="/wpi-class4-water" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14 }}>📝 Class IV Practice Quiz</Link>
          <Link href="/wpi-class4-water-mock" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14 }}>🎯 Class IV Mock Exam</Link>
          <Link href="/formulas-wpi-class3" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 14 }}>← Class III Formulas</Link>
          <Link href="/wpi" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 14 }}>🌊 WPI Hub</Link>
        </div>
      </div>
    </div>
  );
}
