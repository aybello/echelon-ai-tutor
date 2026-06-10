// WPI CLASS II WASTEWATER TREATMENT FORMULA SHEET
import { useState } from "react";
import { Link } from "wouter";
import SiteNav from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";

interface FormulaCard {
  title: string;
  formula: string;
  variables: string[];
  example: string;
  result: string;
  notes?: string;
}

interface FormulaSection {
  category: string;
  icon: string;
  color: string;
  cards: FormulaCard[];
}

const SECTIONS: FormulaSection[] = [
  {
    category: "Secondary Treatment — Activated Sludge",
    icon: "🦠",
    color: "#1e40af",
    cards: [
      {
        title: "Food-to-Microorganism (F/M) Ratio",
        formula: "F/M = BOD Load (kg/d) ÷ MLVSS (kg)",
        variables: [
          "BOD Load (kg/d) = Influent BOD (mg/L) × Flow (m³/d) ÷ 1,000",
          "MLVSS (kg) = MLVSS (mg/L) × Basin Volume (m³) ÷ 1,000",
          "Typical range: 0.2–0.5 kg BOD/kg MLVSS/d (conventional)",
        ],
        example: "BOD Load = 250 mg/L × 10,000 m³/d ÷ 1,000 = 2,500 kg/d; MLVSS = 2,500 mg/L × 4,000 m³ ÷ 1,000 = 10,000 kg",
        result: "F/M = 2,500 ÷ 10,000 = 0.25 kg BOD/kg MLVSS/d",
      },
      {
        title: "Sludge Volume Index (SVI)",
        formula: "SVI (mL/g) = SSV₃₀ (mL/L) ÷ MLSS (g/L)",
        variables: [
          "SSV₃₀ = Settled sludge volume after 30 min (mL/L)",
          "MLSS = Mixed liquor suspended solids (g/L)",
          "Good settling: SVI 80–150 mL/g; Bulking: >150 mL/g",
        ],
        example: "SSV₃₀ = 250 mL/L; MLSS = 3.0 g/L",
        result: "SVI = 250 ÷ 3.0 = 83 mL/g (good settling)",
      },
      {
        title: "Sludge Retention Time (SRT / MCRT)",
        formula: "SRT (d) = Total Solids in System (kg) ÷ Solids Wasted per Day (kg/d)",
        variables: [
          "Total Solids = MLSS (mg/L) × Basin Volume (m³) ÷ 1,000",
          "Solids Wasted = WAS flow (m³/d) × WAS TSS (mg/L) ÷ 1,000 + Effluent TSS loss",
          "Typical SRT: 5–15 days (with nitrification: 10–20 days)",
        ],
        example: "MLSS = 3,000 mg/L × 4,000 m³ ÷ 1,000 = 12,000 kg; WAS = 200 m³/d × 8,000 mg/L ÷ 1,000 = 1,600 kg/d",
        result: "SRT = 12,000 ÷ 1,600 = 7.5 days",
      },
      {
        title: "Hydraulic Retention Time (HRT)",
        formula: "HRT (h) = Basin Volume (m³) ÷ Flow Rate (m³/h)",
        variables: [
          "Basin Volume = Length × Width × Depth (m³)",
          "Flow Rate = Daily flow ÷ 24 (m³/h)",
          "Typical HRT: 4–8 hours (conventional activated sludge)",
        ],
        example: "Basin = 4,000 m³; Flow = 10,000 m³/d ÷ 24 = 416.7 m³/h",
        result: "HRT = 4,000 ÷ 416.7 = 9.6 hours",
      },
    ],
  },
  {
    category: "Nutrient Removal",
    icon: "🧪",
    color: "#065f46",
    cards: [
      {
        title: "Nitrogen Loading Rate",
        formula: "TN Load (kg/d) = TN (mg/L) × Flow (m³/d) ÷ 1,000",
        variables: [
          "TN = Total Nitrogen (ammonia + nitrate + organic N)",
          "Typical municipal wastewater TN: 30–50 mg/L",
          "Effluent TN target (nutrient-sensitive): <3 mg/L",
        ],
        example: "TN = 40 mg/L; Flow = 10,000 m³/d",
        result: "TN Load = 40 × 10,000 ÷ 1,000 = 400 kg/d",
      },
      {
        title: "Denitrification Rate",
        formula: "NO₃-N Removed (mg/L) = Influent NO₃-N − Effluent NO₃-N",
        variables: [
          "Carbon required for denitrification ≈ 3–4 g BOD per g NO₃-N removed",
          "Methanol dose ≈ 2.5–3.0 g methanol per g NO₃-N (post-anoxic)",
          "Internal recycle ratio (MLE): typically 2–4× influent flow",
        ],
        example: "Influent NO₃-N = 25 mg/L; Effluent NO₃-N = 3 mg/L",
        result: "NO₃-N Removed = 25 − 3 = 22 mg/L; Carbon needed ≈ 22 × 3.5 = 77 mg/L BOD",
      },
      {
        title: "Chemical Phosphorus Removal — Alum Dose",
        formula: "Alum Dose (mg/L) = Molar Ratio × P Concentration × (MW Alum ÷ MW P)",
        variables: [
          "Al₂(SO₄)₃·18H₂O MW = 666 g/mol; P MW = 31 g/mol",
          "Molar ratio Al:P ≈ 1.5–2.0 for effective removal",
          "Practical rule: 10–15 mg/L alum per 1 mg/L P to be removed",
        ],
        example: "P to remove = 4 mg/L; Molar ratio = 1.5",
        result: "Alum Dose ≈ 4 × 1.5 × (666/2 ÷ 31) = 4 × 1.5 × 10.7 ≈ 64 mg/L alum",
      },
      {
        title: "Phosphorus Mass Balance",
        formula: "P Removed (kg/d) = P In − P Out = (P_in − P_eff) × Q ÷ 1,000",
        variables: [
          "P_in = Influent total phosphorus (mg/L)",
          "P_eff = Effluent total phosphorus (mg/L)",
          "Q = Flow rate (m³/d)",
        ],
        example: "P_in = 8 mg/L; P_eff = 0.5 mg/L; Q = 10,000 m³/d",
        result: "P Removed = (8 − 0.5) × 10,000 ÷ 1,000 = 75 kg/d",
      },
    ],
  },
  {
    category: "Biosolids Management",
    icon: "♻️",
    color: "#7c3aed",
    cards: [
      {
        title: "Volatile Solids Destruction",
        formula: "VS Destruction (%) = (VS_in − VS_out) ÷ VS_in × 100",
        variables: [
          "VS_in = Volatile solids entering digester (kg/d)",
          "VS_out = Volatile solids leaving digester (kg/d)",
          "Target: 40–60% for mesophilic anaerobic digestion",
        ],
        example: "VS_in = 1,000 kg/d; VS_out = 450 kg/d",
        result: "VS Destruction = (1,000 − 450) ÷ 1,000 × 100 = 55%",
      },
      {
        title: "Biogas Production Estimate",
        formula: "Biogas (m³/d) ≈ VS Destroyed (kg/d) × 0.75–1.0 m³/kg",
        variables: [
          "Typical yield: 0.75–1.0 m³ biogas per kg VS destroyed",
          "Methane content: 60–70% of biogas",
          "Energy value: ~22 MJ/m³ methane (6.1 kWh/m³)",
        ],
        example: "VS Destroyed = 550 kg/d; yield = 0.85 m³/kg",
        result: "Biogas = 550 × 0.85 = 467.5 m³/d; Methane ≈ 467.5 × 0.65 = 304 m³/d",
      },
      {
        title: "Sludge Thickening — Solids Loading Rate",
        formula: "SLR (kg/m²/d) = Sludge Flow (m³/d) × TSS (mg/L) ÷ 1,000 ÷ Thickener Area (m²)",
        variables: [
          "Gravity thickener SLR: 25–100 kg/m²/d (primary sludge)",
          "DAF thickener SLR: 50–150 kg/m²/d (WAS)",
          "Hydraulic loading: 1–4 m³/m²/h (gravity thickener)",
        ],
        example: "WAS flow = 500 m³/d; TSS = 8,000 mg/L; Area = 50 m²",
        result: "SLR = 500 × 8,000 ÷ 1,000 ÷ 50 = 80 kg/m²/d",
      },
      {
        title: "Biosolids Cake Solids Content",
        formula: "Solids Content (%) = Dry Solids (kg) ÷ Total Wet Cake (kg) × 100",
        variables: [
          "Belt filter press: 15–25% solids",
          "Centrifuge: 18–28% solids",
          "Screw press: 18–25% solids",
          "Heat drying: 85–95% solids",
        ],
        example: "Wet cake = 10,000 kg; Dry solids = 2,200 kg",
        result: "Solids Content = 2,200 ÷ 10,000 × 100 = 22%",
      },
    ],
  },
  {
    category: "Advanced Treatment",
    icon: "🔬",
    color: "#b45309",
    cards: [
      {
        title: "Membrane Flux",
        formula: "Flux (L/m²/h) = Permeate Flow (L/h) ÷ Membrane Area (m²)",
        variables: [
          "Typical MBR flux: 10–25 L/m²/h (sustainable)",
          "Peak flux: up to 40 L/m²/h (short-term)",
          "Transmembrane pressure (TMP): 0.1–0.5 bar (normal operation)",
        ],
        example: "Permeate flow = 500 m³/d = 20,833 L/h; Membrane area = 1,000 m²",
        result: "Flux = 20,833 ÷ 1,000 = 20.8 L/m²/h",
      },
      {
        title: "UV Disinfection Dose",
        formula: "UV Dose (mJ/cm²) = UV Intensity (mW/cm²) × Contact Time (s)",
        variables: [
          "Typical wastewater UV dose: 40–100 mJ/cm²",
          "Class A reuse: ≥100 mJ/cm²",
          "Dose depends on UV transmittance (UVT) of effluent",
        ],
        example: "UV Intensity = 10 mW/cm²; Contact time = 8 s",
        result: "UV Dose = 10 × 8 = 80 mJ/cm²",
      },
      {
        title: "Ozone Dose",
        formula: "O₃ Dose (mg/L) = O₃ Applied (g/h) ÷ Flow (m³/h) × 1,000",
        variables: [
          "Typical wastewater ozone dose: 5–15 mg/L",
          "Ozone transfer efficiency: 80–95% (fine bubble diffusers)",
          "CT for disinfection: varies by target organism",
        ],
        example: "O₃ Applied = 5,000 g/h; Flow = 500 m³/h",
        result: "O₃ Dose = 5,000 ÷ 500 × 1,000 = 10 mg/L",
      },
      {
        title: "Chlorination — Chlorine Demand",
        formula: "Chlorine Demand (mg/L) = Chlorine Applied − Chlorine Residual",
        variables: [
          "Chlorine Applied = dose added to effluent (mg/L)",
          "Chlorine Residual = remaining after contact time (mg/L)",
          "Typical wastewater effluent demand: 5–20 mg/L",
        ],
        example: "Applied = 15 mg/L; Residual = 2 mg/L",
        result: "Chlorine Demand = 15 − 2 = 13 mg/L",
      },
    ],
  },
  {
    category: "Process Control Calculations",
    icon: "⚙️",
    color: "#0f766e",
    cards: [
      {
        title: "Return Activated Sludge (RAS) Rate",
        formula: "RAS Rate (%) = RAS Flow ÷ Influent Flow × 100",
        variables: [
          "Typical RAS rate: 50–100% of influent flow",
          "RAS concentration can be estimated from clarifier underflow",
          "Higher RAS needed when MLSS target is high or SVI is elevated",
        ],
        example: "RAS Flow = 6,000 m³/d; Influent Flow = 10,000 m³/d",
        result: "RAS Rate = 6,000 ÷ 10,000 × 100 = 60%",
      },
      {
        title: "Waste Activated Sludge (WAS) Rate",
        formula: "WAS (m³/d) = (MLSS × V_basin) ÷ (SRT × TSS_WAS) − (Q_eff × TSS_eff ÷ TSS_WAS)",
        variables: [
          "V_basin = Aeration basin volume (m³)",
          "SRT = Target sludge retention time (days)",
          "TSS_WAS = TSS in waste sludge stream (mg/L)",
          "Simplified: WAS ≈ Total Solids ÷ (SRT × WAS TSS concentration)",
        ],
        example: "Total solids = 12,000 kg; SRT = 10 d; WAS TSS = 8,000 mg/L = 8 kg/m³",
        result: "WAS = 12,000 ÷ (10 × 8) = 150 m³/d",
      },
      {
        title: "Surface Overflow Rate (SOR) — Secondary Clarifier",
        formula: "SOR (m³/m²/d) = Flow (m³/d) ÷ Surface Area (m²)",
        variables: [
          "Typical SOR: 16–32 m³/m²/d (average flow)",
          "Peak SOR: up to 48 m³/m²/d",
          "Lower SOR = better settling performance",
        ],
        example: "Flow = 10,000 m³/d; Clarifier area = 500 m²",
        result: "SOR = 10,000 ÷ 500 = 20 m³/m²/d",
      },
      {
        title: "Oxygen Uptake Rate (OUR) / Specific OUR (SOUR)",
        formula: "SOUR (mg O₂/g VSS/h) = OUR (mg/L/h) ÷ MLVSS (g/L)",
        variables: [
          "OUR = rate of DO decrease in a sealed sample (mg/L/h)",
          "Typical SOUR: 8–20 mg O₂/g VSS/h (healthy sludge)",
          "Low SOUR (<5) may indicate old sludge or inhibition",
        ],
        example: "OUR = 40 mg/L/h; MLVSS = 2.5 g/L",
        result: "SOUR = 40 ÷ 2.5 = 16 mg O₂/g VSS/h",
      },
    ],
  },
  {
    category: "Safety & Regulatory",
    icon: "🛡️",
    color: "#dc2626",
    cards: [
      {
        title: "Effluent Compliance — BOD Removal Efficiency",
        formula: "Removal (%) = (Influent BOD − Effluent BOD) ÷ Influent BOD × 100",
        variables: [
          "Typical secondary treatment target: ≥85% BOD removal",
          "Effluent BOD limit (Ontario ECA): 25 mg/L (30-day avg)",
          "Effluent TSS limit: 25 mg/L (30-day avg)",
        ],
        example: "Influent BOD = 200 mg/L; Effluent BOD = 12 mg/L",
        result: "Removal = (200 − 12) ÷ 200 × 100 = 94%",
      },
      {
        title: "Chlorine Contact Time (CT) for Disinfection",
        formula: "CT (mg·min/L) = Residual Cl₂ (mg/L) × Contact Time (min)",
        variables: [
          "Wastewater effluent CT for 2-log E. coli reduction: ~30–50 mg·min/L",
          "Contact time typically 15–30 minutes",
          "Effective CT = T₁₀ (time for 10% of water to pass through)",
        ],
        example: "Residual = 2 mg/L; Contact time = 20 min",
        result: "CT = 2 × 20 = 40 mg·min/L",
      },
      {
        title: "Biosolids Land Application Rate",
        formula: "Application Rate (t/ha) = Crop N Requirement (kg/ha) ÷ Available N in Biosolids (kg/t)",
        variables: [
          "Available N = (Ammonia-N × 0.5) + (Organic N × mineralization rate)",
          "Typical Class B biosolids available N: 10–20 kg/t dry weight",
          "Application rate limited by N, P, or metals — use most restrictive",
        ],
        example: "Crop N need = 150 kg/ha; Available N = 15 kg/t dry biosolids",
        result: "Application Rate = 150 ÷ 15 = 10 t/ha dry biosolids",
      },
      {
        title: "Dilution Factor for Effluent Toxicity",
        formula: "Dilution Factor = Receiving Water Flow ÷ (Receiving Water Flow + Effluent Flow)",
        variables: [
          "Higher dilution = lower toxicity risk to receiving water",
          "Whole effluent toxicity (WET) testing uses serial dilutions",
          "LC50 = concentration lethal to 50% of test organisms",
        ],
        example: "River flow = 10 m³/s; Effluent = 0.1 m³/s",
        result: "Dilution Factor = 10 ÷ (10 + 0.1) ≈ 99:1 dilution",
      },
    ],
  },
];

const QUICK_REF = [
  { param: "MLSS (conventional AS)", value: "2,000–4,000 mg/L" },
  { param: "MLSS (MBR)", value: "8,000–15,000 mg/L" },
  { param: "SVI (good settling)", value: "80–150 mL/g" },
  { param: "F/M ratio (conventional)", value: "0.2–0.5 kg BOD/kg MLVSS/d" },
  { param: "SRT (with nitrification)", value: "10–20 days" },
  { param: "HRT (conventional AS)", value: "4–8 hours" },
  { param: "DO target (aeration basin)", value: "2–4 mg/L" },
  { param: "RAS rate", value: "50–100% of influent flow" },
  { param: "Secondary clarifier SOR", value: "16–32 m³/m²/d" },
  { param: "VS destruction (anaerobic digestion)", value: "40–60%" },
  { param: "Biogas methane content", value: "60–70%" },
  { param: "Belt filter press cake solids", value: "15–25%" },
  { param: "Effluent BOD limit (Ontario)", value: "25 mg/L (30-day avg)" },
  { param: "Effluent TSS limit (Ontario)", value: "25 mg/L (30-day avg)" },
  { param: "UV dose (wastewater)", value: "40–100 mJ/cm²" },
];

export default function FormulasWpiClass2Ww() {
  usePageMeta({
    title: "WPI Class 2 Wastewater Formulas",
    description: "Essential formulas and calculations for WPI Class 2 Wastewater operator certification exam. Quick reference formula sheet.",
  });

  const [activeSection, setActiveSection] = useState<number | null>(null);

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#e2e8f0" }}>      <style>{`
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

      <SiteNav currentPath="/formulas-wpi-class2-ww" />

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #065f46 0%, #0f172a 100%)", padding: "48px 24px 32px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <Link href="/wpi" style={{ color: "#34d399", fontSize: 14, textDecoration: "none" }}>
              ← WPI Hub
            </Link>
            <span style={{ color: "#64748b" }}>›</span>
            <span style={{ color: "#94a3b8", fontSize: 14 }}>Class II Wastewater</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>
            ♻️ WPI Class II Wastewater Formula Sheet
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 16, margin: 0 }}>
            Key formulas for the WPI Class II Wastewater Treatment Operator exam — secondary treatment, nutrient removal, biosolids management, and advanced treatment.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
            <Link href="/wpi-class2-wastewater" style={{
              background: "#065f46", color: "#34d399", padding: "8px 18px",
              borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600,
              border: "1px solid #34d399"
            }}>
              Practice Quiz →
            </Link>
            <Link href="/wpi-class2-wastewater-mock" style={{
              background: "transparent", color: "#94a3b8", padding: "8px 18px",
              borderRadius: 8, textDecoration: "none", fontSize: 14,
              border: "1px solid #334155"
            }}>
              Mock Exam →
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>

        {/* Section navigation */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
          {SECTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => setActiveSection(activeSection === i ? null : i)}
              style={{
                background: activeSection === i ? s.color : "#1e293b",
                color: activeSection === i ? "#fff" : "#94a3b8",
                border: `1px solid ${activeSection === i ? s.color : "#334155"}`,
                borderRadius: 8, padding: "6px 14px", fontSize: 13,
                cursor: "pointer", fontWeight: 500,
              }}
            >
              {s.icon} {s.category.split("—")[0].trim()}
            </button>
          ))}
        </div>

        {/* Formula sections */}
        {SECTIONS.map((section, si) => (
          (activeSection === null || activeSection === si) && (
            <div key={si} style={{ marginBottom: 40 }}>
              <h2 style={{
                fontSize: 20, fontWeight: 700, color: "#f1f5f9",
                borderLeft: `4px solid ${section.color}`,
                paddingLeft: 12, marginBottom: 20
              }}>
                {section.icon} {section.category}
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 16 }}>
                {section.cards.map((card, ci) => (
                  <div key={ci} style={{
                    background: "#1e293b", borderRadius: 12, padding: 20,
                    border: `1px solid #334155`
                  }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", margin: "0 0 10px" }}>
                      {card.title}
                    </h3>
                    <div style={{
                      background: "#0f172a", borderRadius: 8, padding: "10px 14px",
                      fontFamily: "monospace", fontSize: 13, color: "#34d399",
                      marginBottom: 12, border: "1px solid #1e3a2f"
                    }}>
                      {card.formula}
                    </div>
                    <ul style={{ margin: "0 0 12px", paddingLeft: 18 }}>
                      {card.variables.map((v, vi) => (
                        <li key={vi} style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>{v}</li>
                      ))}
                    </ul>
                    <div style={{ background: "#0f172a", borderRadius: 8, padding: "10px 14px", border: "1px solid #1e293b" }}>
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Example:</div>
                      <div style={{ fontSize: 12, color: "#cbd5e1" }}>{card.example}</div>
                      <div style={{ fontSize: 13, color: "#fbbf24", fontWeight: 600, marginTop: 6 }}>→ {card.result}</div>
                    </div>
                    {card.notes && (
                      <div style={{ marginTop: 10, fontSize: 12, color: "#64748b", fontStyle: "italic" }}>
                        💡 {card.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        ))}

        {/* Quick Reference Table */}
        <div style={{ background: "#1e293b", borderRadius: 12, padding: 24, border: "1px solid #334155", marginTop: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", margin: "0 0 16px" }}>
            📋 Quick Reference — Typical Operating Ranges
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 8 }}>
            {QUICK_REF.map((row, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 12px", background: "#0f172a", borderRadius: 8,
                border: "1px solid #1e293b"
              }}>
                <span style={{ fontSize: 13, color: "#94a3b8" }}>{row.param}</span>
                <span style={{ fontSize: 13, color: "#34d399", fontWeight: 600, textAlign: "right", marginLeft: 8 }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: 40, padding: "32px 24px", background: "#1e293b", borderRadius: 12 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", margin: "0 0 8px" }}>
            Ready to test your knowledge?
          </h3>
          <p style={{ color: "#94a3b8", margin: "0 0 20px" }}>
            Practice with 501 WPI Class II Wastewater questions
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/wpi-class2-wastewater" style={{
              background: "#065f46", color: "#fff", padding: "12px 28px",
              borderRadius: 10, textDecoration: "none", fontSize: 15, fontWeight: 700
            }}>
              Start Practice Quiz
            </Link>
            <Link href="/wpi-class2-wastewater-mock" style={{
              background: "#1e293b", color: "#94a3b8", padding: "12px 28px",
              borderRadius: 10, textDecoration: "none", fontSize: 15,
              border: "1px solid #334155"
            }}>
              Take Mock Exam
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
