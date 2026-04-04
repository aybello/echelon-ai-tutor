// WPI Class I Wastewater Treatment — Formula & Reference Sheet
import { useState } from "react";
import { Link } from "wouter";
import SiteNav from "@/components/SiteNav";

interface FormulaCard {
  title: string;
  formula: string;
  variables: { symbol: string; meaning: string }[];
  example?: string;
  notes?: string;
}

interface FormulaSection {
  id: string;
  heading: string;
  color: string;
  cards: FormulaCard[];
}

const SECTIONS: FormulaSection[] = [
  {
    id: "flow",
    heading: "Flow & Hydraulics",
    color: "#1D4ED8",
    cards: [
      {
        title: "Flow Rate",
        formula: "Q = A × V",
        variables: [
          { symbol: "Q", meaning: "Flow rate (m³/s or m³/d)" },
          { symbol: "A", meaning: "Cross-sectional area (m²)" },
          { symbol: "V", meaning: "Velocity (m/s)" },
        ],
        example: "A = 0.5 m², V = 0.3 m/s → Q = 0.15 m³/s",
        notes: "1 m³/s = 86,400 m³/d",
      },
      {
        title: "Hydraulic Retention Time (HRT)",
        formula: "HRT = V ÷ Q",
        variables: [
          { symbol: "HRT", meaning: "Hydraulic retention time (hours or days)" },
          { symbol: "V", meaning: "Tank volume (m³)" },
          { symbol: "Q", meaning: "Flow rate (m³/d)" },
        ],
        example: "V = 2000 m³, Q = 5000 m³/d → HRT = 0.4 d = 9.6 h",
      },
      {
        title: "Pump Head",
        formula: "TDH = Static Head + Friction Head + Minor Losses",
        variables: [
          { symbol: "TDH", meaning: "Total dynamic head (m)" },
          { symbol: "Static Head", meaning: "Elevation difference (m)" },
          { symbol: "Friction Head", meaning: "Head loss due to pipe friction (m)" },
        ],
        notes: "Use Hazen-Williams or Darcy-Weisbach for friction head calculations.",
      },
      {
        title: "Pump Power",
        formula: "P = (Q × ρ × g × TDH) ÷ η",
        variables: [
          { symbol: "P", meaning: "Power (W or kW)" },
          { symbol: "Q", meaning: "Flow rate (m³/s)" },
          { symbol: "ρ", meaning: "Density of water (1000 kg/m³)" },
          { symbol: "g", meaning: "Gravitational acceleration (9.81 m/s²)" },
          { symbol: "TDH", meaning: "Total dynamic head (m)" },
          { symbol: "η", meaning: "Pump efficiency (decimal)" },
        ],
        example: "Q = 0.05 m³/s, TDH = 20 m, η = 0.75 → P = 13.1 kW",
      },
      {
        title: "Manning's Equation (Gravity Sewers)",
        formula: "V = (1/n) × R^(2/3) × S^(1/2)",
        variables: [
          { symbol: "V", meaning: "Flow velocity (m/s)" },
          { symbol: "n", meaning: "Manning's roughness coefficient (0.013 for concrete)" },
          { symbol: "R", meaning: "Hydraulic radius (m) = Area / Wetted Perimeter" },
          { symbol: "S", meaning: "Slope of the hydraulic grade line (m/m)" },
        ],
        notes: "Minimum velocity for self-cleaning: 0.6 m/s (2 fps) at design flow.",
      },
    ],
  },
  {
    id: "primary",
    heading: "Primary Treatment",
    color: "#7C3AED",
    cards: [
      {
        title: "Surface Overflow Rate (SOR)",
        formula: "SOR = Q ÷ A",
        variables: [
          { symbol: "SOR", meaning: "Surface overflow rate (m³/m²·d)" },
          { symbol: "Q", meaning: "Flow rate (m³/d)" },
          { symbol: "A", meaning: "Surface area of clarifier (m²)" },
        ],
        example: "Q = 5000 m³/d, A = 400 m² → SOR = 12.5 m³/m²·d",
        notes: "Typical primary clarifier SOR: 24–48 m³/m²·d",
      },
      {
        title: "Weir Overflow Rate (WOR)",
        formula: "WOR = Q ÷ L",
        variables: [
          { symbol: "WOR", meaning: "Weir overflow rate (m³/m·d)" },
          { symbol: "Q", meaning: "Flow rate (m³/d)" },
          { symbol: "L", meaning: "Total weir length (m)" },
        ],
        notes: "Typical WOR: < 250 m³/m·d for primary clarifiers",
      },
      {
        title: "BOD Removal Efficiency",
        formula: "E = (BOD_in − BOD_out) ÷ BOD_in × 100%",
        variables: [
          { symbol: "E", meaning: "Removal efficiency (%)" },
          { symbol: "BOD_in", meaning: "Influent BOD (mg/L)" },
          { symbol: "BOD_out", meaning: "Effluent BOD (mg/L)" },
        ],
        example: "BOD_in = 250 mg/L, BOD_out = 20 mg/L → E = 92%",
      },
    ],
  },
  {
    id: "secondary",
    heading: "Secondary Treatment (Activated Sludge)",
    color: "#059669",
    cards: [
      {
        title: "Food-to-Microorganism Ratio (F/M)",
        formula: "F/M = (Q × BOD) ÷ (V × MLVSS)",
        variables: [
          { symbol: "F/M", meaning: "Food-to-microorganism ratio (kg BOD/kg MLVSS·d)" },
          { symbol: "Q", meaning: "Flow rate (m³/d)" },
          { symbol: "BOD", meaning: "Influent BOD (mg/L or kg/m³)" },
          { symbol: "V", meaning: "Aeration tank volume (m³)" },
          { symbol: "MLVSS", meaning: "Mixed liquor volatile suspended solids (mg/L)" },
        ],
        example: "Q = 5000 m³/d, BOD = 200 mg/L, V = 2000 m³, MLVSS = 2500 mg/L → F/M = 0.2 kg/kg·d",
        notes: "Typical F/M: 0.05–0.15 for extended aeration; 0.2–0.6 for conventional AS",
      },
      {
        title: "Sludge Retention Time (SRT / SludgeAge)",
        formula: "SRT = (V × MLSS) ÷ (Q_w × SS_w)",
        variables: [
          { symbol: "SRT", meaning: "Sludge retention time (days)" },
          { symbol: "V", meaning: "Aeration tank volume (m³)" },
          { symbol: "MLSS", meaning: "Mixed liquor suspended solids (mg/L)" },
          { symbol: "Q_w", meaning: "Waste activated sludge flow rate (m³/d)" },
          { symbol: "SS_w", meaning: "WAS suspended solids concentration (mg/L)" },
        ],
        example: "V = 2000 m³, MLSS = 3000 mg/L, Q_w = 200 m³/d, SS_w = 8000 mg/L → SRT = 3.75 d",
        notes: "Nitrification requires SRT > 10 days at 15°C",
      },
      {
        title: "Sludge Volume Index (SVI)",
        formula: "SVI = (SV₃₀ × 1000) ÷ MLSS",
        variables: [
          { symbol: "SVI", meaning: "Sludge volume index (mL/g)" },
          { symbol: "SV₃₀", meaning: "Settled sludge volume after 30 min (mL/L)" },
          { symbol: "MLSS", meaning: "Mixed liquor suspended solids (mg/L)" },
        ],
        example: "SV₃₀ = 250 mL/L, MLSS = 2500 mg/L → SVI = 100 mL/g",
        notes: "Good settling: SVI < 120 mL/g. Bulking: SVI > 200 mL/g",
      },
      {
        title: "Return Activated Sludge (RAS) Rate",
        formula: "RAS% = SVI × MLSS ÷ (1000 − SVI × MLSS/1000) × 100",
        variables: [
          { symbol: "RAS%", meaning: "Return sludge ratio (% of influent flow)" },
          { symbol: "SVI", meaning: "Sludge volume index (mL/g)" },
          { symbol: "MLSS", meaning: "Target MLSS (mg/L)" },
        ],
        notes: "Simplified: RAS% ≈ MLSS / (RAS SS − MLSS) × 100. Typical RAS: 25–100% of Q.",
      },
      {
        title: "Oxygen Demand (Theoretical)",
        formula: "O₂ = Q × (BOD_in − BOD_out) × 1.42 × (ΔX/ΔT)",
        variables: [
          { symbol: "O₂", meaning: "Oxygen required (kg/d)" },
          { symbol: "Q", meaning: "Flow rate (m³/d)" },
          { symbol: "BOD", meaning: "BOD concentration (mg/L = g/m³)" },
          { symbol: "1.42", meaning: "O₂ equivalent of cell mass (kg O₂/kg VSS)" },
        ],
        notes: "Simplified: O₂ demand ≈ 1.0–1.5 kg O₂ per kg BOD removed",
      },
    ],
  },
  {
    id: "disinfection",
    heading: "Disinfection",
    color: "#DC2626",
    cards: [
      {
        title: "Chlorine Dose",
        formula: "Dose = Demand + Residual",
        variables: [
          { symbol: "Dose", meaning: "Chlorine added (mg/L)" },
          { symbol: "Demand", meaning: "Chlorine consumed by wastewater (mg/L)" },
          { symbol: "Residual", meaning: "Chlorine remaining after contact time (mg/L)" },
        ],
        example: "Demand = 6 mg/L, Residual = 2 mg/L → Dose = 8 mg/L",
      },
      {
        title: "CT Value",
        formula: "CT = C × T",
        variables: [
          { symbol: "CT", meaning: "Disinfection CT value (mg·min/L)" },
          { symbol: "C", meaning: "Disinfectant concentration (mg/L)" },
          { symbol: "T", meaning: "Contact time (minutes)" },
        ],
        example: "C = 2 mg/L, T = 30 min → CT = 60 mg·min/L",
        notes: "Required CT for 4-log Giardia inactivation at 15°C: ~170 mg·min/L for free chlorine",
      },
      {
        title: "Chlorine Feed Rate",
        formula: "Feed Rate = Q × Dose ÷ 1000",
        variables: [
          { symbol: "Feed Rate", meaning: "Chlorine feed rate (kg/d)" },
          { symbol: "Q", meaning: "Flow rate (m³/d)" },
          { symbol: "Dose", meaning: "Chlorine dose (mg/L = g/m³)" },
        ],
        example: "Q = 5000 m³/d, Dose = 8 mg/L → Feed Rate = 40 kg/d",
      },
      {
        title: "UV Dose",
        formula: "UV Dose = Irradiance × Exposure Time",
        variables: [
          { symbol: "UV Dose", meaning: "UV dose (mJ/cm²)" },
          { symbol: "Irradiance", meaning: "UV intensity (mW/cm²)" },
          { symbol: "Exposure Time", meaning: "Contact time (seconds)" },
        ],
        notes: "Minimum UV dose for 4-log virus inactivation: 186 mJ/cm²",
      },
    ],
  },
  {
    id: "solids",
    heading: "Solids Handling",
    color: "#D97706",
    cards: [
      {
        title: "Sludge Production",
        formula: "P = Q × (TSS_in − TSS_out) ÷ 1000",
        variables: [
          { symbol: "P", meaning: "Sludge production (kg/d)" },
          { symbol: "Q", meaning: "Flow rate (m³/d)" },
          { symbol: "TSS_in", meaning: "Influent TSS (mg/L)" },
          { symbol: "TSS_out", meaning: "Effluent TSS (mg/L)" },
        ],
        example: "Q = 5000 m³/d, TSS_in = 250 mg/L, TSS_out = 20 mg/L → P = 1150 kg/d",
      },
      {
        title: "Sludge Volume",
        formula: "V_sludge = P ÷ (ρ × %solids)",
        variables: [
          { symbol: "V_sludge", meaning: "Sludge volume (m³/d)" },
          { symbol: "P", meaning: "Sludge mass (kg/d)" },
          { symbol: "ρ", meaning: "Sludge density (~1000 kg/m³ for liquid sludge)" },
          { symbol: "%solids", meaning: "Solids content (decimal)" },
        ],
        example: "P = 1000 kg/d, %solids = 0.02 (2%) → V = 50 m³/d",
      },
      {
        title: "Volatile Solids Reduction",
        formula: "VSR = (VS_in − VS_out) ÷ VS_in × 100%",
        variables: [
          { symbol: "VSR", meaning: "Volatile solids reduction (%)" },
          { symbol: "VS_in", meaning: "Volatile solids fed to digester (kg/d)" },
          { symbol: "VS_out", meaning: "Volatile solids leaving digester (kg/d)" },
        ],
        notes: "Target VSR for anaerobic digestion: ≥ 38% (Class B biosolids requirement)",
      },
      {
        title: "Digester Loading Rate",
        formula: "Loading = VS_fed ÷ V_digester",
        variables: [
          { symbol: "Loading", meaning: "Volatile solids loading rate (kg VS/m³·d)" },
          { symbol: "VS_fed", meaning: "Volatile solids fed (kg/d)" },
          { symbol: "V_digester", meaning: "Digester volume (m³)" },
        ],
        notes: "Typical mesophilic digester loading: 1.6–4.8 kg VS/m³·d",
      },
    ],
  },
  {
    id: "nutrient",
    heading: "Nutrient Removal",
    color: "#0F766E",
    cards: [
      {
        title: "Nitrification Oxygen Demand",
        formula: "O₂_nitrification = 4.57 × ΔNH₃",
        variables: [
          { symbol: "O₂_nitrification", meaning: "Oxygen required for nitrification (mg/L)" },
          { symbol: "4.57", meaning: "Stoichiometric O₂ demand per mg NH₃-N oxidized" },
          { symbol: "ΔNH₃", meaning: "Ammonia removed (mg/L as N)" },
        ],
        example: "ΔNH₃ = 30 mg/L → O₂ = 137 mg/L",
      },
      {
        title: "Denitrification Alkalinity Recovery",
        formula: "Alkalinity recovered = 3.57 × ΔNO₃",
        variables: [
          { symbol: "Alkalinity recovered", meaning: "Alkalinity produced (mg/L as CaCO₃)" },
          { symbol: "3.57", meaning: "Alkalinity recovered per mg NO₃-N denitrified" },
          { symbol: "ΔNO₃", meaning: "Nitrate removed (mg/L as N)" },
        ],
      },
      {
        title: "Phosphorus Removal — Alum Dose",
        formula: "Alum dose ≈ 9.6 × P_removed",
        variables: [
          { symbol: "Alum dose", meaning: "Alum required (mg/L as Al₂(SO₄)₃)" },
          { symbol: "P_removed", meaning: "Phosphorus to be removed (mg/L as P)" },
        ],
        notes: "Molar ratio Al:P ≈ 1.5–2.0 for reliable removal to < 1 mg/L",
      },
      {
        title: "Phosphorus Removal — Ferric Chloride Dose",
        formula: "FeCl₃ dose ≈ 5.2 × P_removed",
        variables: [
          { symbol: "FeCl₃ dose", meaning: "Ferric chloride required (mg/L)" },
          { symbol: "P_removed", meaning: "Phosphorus to be removed (mg/L as P)" },
        ],
        notes: "Molar ratio Fe:P ≈ 1.5–2.0 for reliable removal",
      },
    ],
  },
  {
    id: "lab",
    heading: "Laboratory Calculations",
    color: "#6D28D9",
    cards: [
      {
        title: "BOD Calculation",
        formula: "BOD = (DO_initial − DO_final) × Dilution Factor",
        variables: [
          { symbol: "BOD", meaning: "Biochemical oxygen demand (mg/L)" },
          { symbol: "DO_initial", meaning: "Initial dissolved oxygen (mg/L)" },
          { symbol: "DO_final", meaning: "Final dissolved oxygen after 5 days (mg/L)" },
          { symbol: "Dilution Factor", meaning: "Sample volume / Total volume" },
        ],
        example: "DO_i = 8.5, DO_f = 3.5, DF = 10 → BOD = (8.5−3.5) × 10 = 50 mg/L",
      },
      {
        title: "TSS Calculation",
        formula: "TSS = (W_filter+residue − W_filter) ÷ V_sample × 10⁶",
        variables: [
          { symbol: "TSS", meaning: "Total suspended solids (mg/L)" },
          { symbol: "W", meaning: "Weight of filter + residue after drying (g)" },
          { symbol: "V_sample", meaning: "Volume of sample filtered (mL)" },
        ],
        example: "W_residue = 0.025 g, V = 500 mL → TSS = 50 mg/L",
      },
      {
        title: "Dilution Factor",
        formula: "DF = V_total ÷ V_sample",
        variables: [
          { symbol: "DF", meaning: "Dilution factor (dimensionless)" },
          { symbol: "V_total", meaning: "Total volume of diluted sample (mL)" },
          { symbol: "V_sample", meaning: "Volume of original sample (mL)" },
        ],
        example: "1 mL sample in 300 mL total → DF = 300",
      },
      {
        title: "Percent Solids",
        formula: "%TS = (Dry weight ÷ Wet weight) × 100",
        variables: [
          { symbol: "%TS", meaning: "Percent total solids (%)" },
          { symbol: "Dry weight", meaning: "Weight after drying at 105°C (g)" },
          { symbol: "Wet weight", meaning: "Weight of wet sample (g)" },
        ],
        example: "Dry = 25 g, Wet = 1000 g → %TS = 2.5%",
      },
    ],
  },
];

export default function FormulasWpiClass1Ww() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const filtered = activeSection
    ? SECTIONS.filter((s) => s.id === activeSection)
    : SECTIONS;

  return (
    <div style={{ minHeight: "100vh", background: "#0F172A", color: "#F1F5F9" }}>
      <SiteNav currentPath="/formulas-wpi-class1-ww" />

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", borderBottom: "1px solid #334155", padding: "48px 24px 32px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <Link href="/wpi" style={{ color: "#94A3B8", fontSize: 14, textDecoration: "none" }}>WPI</Link>
            <span style={{ color: "#475569" }}>/</span>
            <span style={{ color: "#94A3B8", fontSize: 14 }}>Class I Wastewater</span>
            <span style={{ color: "#475569" }}>/</span>
            <span style={{ color: "#F1F5F9", fontSize: 14 }}>Formula Sheet</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
            WPI Class I Wastewater Treatment
          </h1>
          <p style={{ color: "#94A3B8", fontSize: 16, marginBottom: 24 }}>
            Formula & Reference Sheet — BC (EOCP) · AB (AWWOA) · SK (SAHO) · MB (MWWA)
          </p>

          {/* Section Filter */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button
              onClick={() => setActiveSection(null)}
              style={{
                padding: "6px 14px", borderRadius: 20, border: "1px solid",
                borderColor: !activeSection ? "#3B82F6" : "#334155",
                background: !activeSection ? "#1E3A5F" : "transparent",
                color: !activeSection ? "#93C5FD" : "#94A3B8",
                cursor: "pointer", fontSize: 13,
              }}
            >
              All Sections
            </button>
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(activeSection === s.id ? null : s.id)}
                style={{
                  padding: "6px 14px", borderRadius: 20, border: "1px solid",
                  borderColor: activeSection === s.id ? s.color : "#334155",
                  background: activeSection === s.id ? s.color + "22" : "transparent",
                  color: activeSection === s.id ? s.color : "#94A3B8",
                  cursor: "pointer", fontSize: 13,
                }}
              >
                {s.heading}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        {filtered.map((section) => (
          <div key={section.id} style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: section.color, marginBottom: 20, borderBottom: `2px solid ${section.color}33`, paddingBottom: 8 }}>
              {section.heading}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 16 }}>
              {section.cards.map((card) => (
                <div key={card.title} style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 12, padding: 20 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "#F1F5F9", marginBottom: 12 }}>{card.title}</h3>
                  <div style={{ background: "#0F172A", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontFamily: "monospace", fontSize: 15, color: section.color, fontWeight: 600 }}>
                    {card.formula}
                  </div>
                  <div style={{ marginBottom: card.example || card.notes ? 12 : 0 }}>
                    {card.variables.map((v) => (
                      <div key={v.symbol} style={{ display: "flex", gap: 8, marginBottom: 4, fontSize: 13 }}>
                        <span style={{ color: section.color, fontFamily: "monospace", minWidth: 80, fontWeight: 600 }}>{v.symbol}</span>
                        <span style={{ color: "#94A3B8" }}>{v.meaning}</span>
                      </div>
                    ))}
                  </div>
                  {card.example && (
                    <div style={{ background: "#0F172A", borderRadius: 6, padding: "8px 12px", fontSize: 13, color: "#CBD5E1", marginBottom: card.notes ? 8 : 0 }}>
                      <span style={{ color: "#64748B", marginRight: 6 }}>Example:</span>{card.example}
                    </div>
                  )}
                  {card.notes && (
                    <div style={{ fontSize: 12, color: "#64748B", fontStyle: "italic", marginTop: 4 }}>
                      {card.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Quick Reference Table */}
        <div style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 12, padding: 24, marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#F1F5F9", marginBottom: 16 }}>Quick Reference — Typical Operating Ranges</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #334155" }}>
                  {["Parameter", "Typical Range", "Units", "Notes"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#94A3B8", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Primary clarifier SOR", "24–48", "m³/m²·d", "Average flow conditions"],
                  ["Secondary clarifier SOR", "16–32", "m³/m²·d", "Average flow conditions"],
                  ["Aeration tank HRT", "4–8", "hours", "Conventional activated sludge"],
                  ["MLSS (conventional AS)", "1500–3000", "mg/L", ""],
                  ["MLSS (extended aeration)", "3000–6000", "mg/L", ""],
                  ["SRT (nitrification)", "> 10", "days", "At 15°C"],
                  ["SVI (good settling)", "< 120", "mL/g", ""],
                  ["SVI (bulking)", "> 200", "mL/g", ""],
                  ["F/M (conventional AS)", "0.2–0.6", "kg BOD/kg MLVSS·d", ""],
                  ["F/M (extended aeration)", "0.05–0.15", "kg BOD/kg MLVSS·d", ""],
                  ["RAS rate", "25–100", "% of Q", ""],
                  ["DO in aeration tank", "1.5–3.0", "mg/L", ""],
                  ["Digester SRT (mesophilic)", "15–30", "days", ""],
                  ["VS reduction (digestion)", "> 38", "%", "Class B requirement"],
                  ["Chlorine residual (effluent)", "0.5–1.0", "mg/L", "After 30-min contact"],
                ].map(([param, range, unit, note]) => (
                  <tr key={param} style={{ borderBottom: "1px solid #1E293B" }}>
                    <td style={{ padding: "8px 12px", color: "#CBD5E1" }}>{param}</td>
                    <td style={{ padding: "8px 12px", color: "#3B82F6", fontWeight: 600 }}>{range}</td>
                    <td style={{ padding: "8px 12px", color: "#94A3B8" }}>{unit}</td>
                    <td style={{ padding: "8px 12px", color: "#64748B" }}>{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <p style={{ color: "#94A3B8", marginBottom: 16 }}>Ready to test your knowledge?</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/wpi-class1-wastewater" style={{ background: "#1D4ED8", color: "#fff", padding: "12px 24px", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>
              Practice Quiz
            </Link>
            <Link href="/wpi-class1-wastewater-mock" style={{ background: "#1E293B", color: "#93C5FD", padding: "12px 24px", borderRadius: 8, textDecoration: "none", fontWeight: 600, border: "1px solid #334155" }}>
              Mock Exam
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
