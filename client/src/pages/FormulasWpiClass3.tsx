// WPI CLASS III WATER TREATMENT — FORMULA SHEET
// Advanced treatment, membranes, process control, regulatory compliance

import { useState } from "react";
import { Link } from "wouter";
import SiteNav from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";

interface Formula {
  name: string;
  formula: string;
  variables: string[];
  example: string;
  notes?: string;
}

interface Section {
  title: string;
  emoji: string;
  color: string;
  formulas: Formula[];
}

const SECTIONS: Section[] = [
  {
    title: "Ozone & UV Disinfection",
    emoji: "⚡",
    color: "#7C3AED",
    formulas: [
      {
        name: "Ozone CT Value",
        formula: "CT = C × T",
        variables: ["CT = CT value (mg·min/L)", "C = ozone residual concentration (mg/L)", "T = contact time (min) — use T₁₀ (time for 10% of water to pass through)"],
        example: "C = 0.5 mg/L, T₁₀ = 4 min → CT = 0.5 × 4 = 2.0 mg·min/L",
        notes: "Ozone CT requirements for Giardia: 0.5 mg·min/L (1-log), 1.0 mg·min/L (2-log), 2.0 mg·min/L (3-log) at 25°C. CT increases at lower temperatures."
      },
      {
        name: "UV Dose (Fluence)",
        formula: "UV Dose = E × t",
        variables: ["UV Dose = fluence (mJ/cm²)", "E = UV irradiance (mW/cm²)", "t = exposure time (s)"],
        example: "E = 5 mW/cm², t = 8 s → UV Dose = 5 × 8 = 40 mJ/cm²",
        notes: "Regulatory minimum: 40 mJ/cm² for 4-log Cryptosporidium inactivation (GCDWQ). UV dose validated by bioassay challenge testing."
      },
      {
        name: "UV Transmittance (UVT)",
        formula: "UVT = 10^(-A) × 100%",
        variables: ["UVT = UV transmittance (%)", "A = UV absorbance at 254 nm (unitless)"],
        example: "A = 0.10 → UVT = 10^(-0.10) × 100 = 79.4%",
        notes: "Higher UVT = more UV passes through water = more effective disinfection. NOM, iron, and turbidity reduce UVT. UV reactors are validated at minimum UVT."
      },
      {
        name: "Ozone Demand",
        formula: "Ozone Demand = Ozone Applied − Ozone Residual",
        variables: ["Ozone Demand (mg/L)", "Ozone Applied = ozone dose fed to water (mg/L)", "Ozone Residual = ozone remaining after contact (mg/L)"],
        example: "Applied = 3.0 mg/L, Residual = 0.3 mg/L → Demand = 3.0 − 0.3 = 2.7 mg/L",
        notes: "Ozone demand is consumed by NOM, iron, manganese, and other oxidizable compounds. Must apply sufficient ozone to satisfy demand AND maintain residual for CT."
      },
    ]
  },
  {
    title: "Membrane Filtration",
    emoji: "🔬",
    color: "#0891B2",
    formulas: [
      {
        name: "Membrane Flux",
        formula: "J = Q / A",
        variables: ["J = flux (L/m²·h, also written LMH)", "Q = permeate flow rate (L/h)", "A = membrane area (m²)"],
        example: "Q = 500 L/h, A = 20 m² → J = 500 / 20 = 25 LMH",
        notes: "Typical design flux: MF/UF: 20–80 LMH; NF: 10–30 LMH; RO: 10–25 LMH. Higher flux = more fouling risk."
      },
      {
        name: "Recovery Rate",
        formula: "R = (Qp / Qf) × 100%",
        variables: ["R = recovery rate (%)", "Qp = permeate (product) flow rate (L/h or m³/h)", "Qf = feed flow rate (L/h or m³/h)"],
        example: "Qp = 80 m³/h, Qf = 100 m³/h → R = (80/100) × 100 = 80%",
        notes: "Typical recovery: MF/UF: 90–95%; RO: 70–85%. Higher recovery = less waste water but higher concentrate concentration and fouling risk."
      },
      {
        name: "Concentration Factor",
        formula: "CF = 1 / (1 − R)",
        variables: ["CF = concentration factor (unitless)", "R = recovery rate (decimal, not %)"],
        example: "R = 0.80 (80%) → CF = 1 / (1 − 0.80) = 1 / 0.20 = 5",
        notes: "CF tells you how concentrated the reject/concentrate stream is relative to feed. At 80% recovery, the concentrate is 5× more concentrated than the feed."
      },
      {
        name: "Transmembrane Pressure (TMP)",
        formula: "TMP = (Pf + Pc) / 2 − Pp",
        variables: ["TMP = transmembrane pressure (kPa or psi)", "Pf = feed pressure (kPa)", "Pc = concentrate pressure (kPa)", "Pp = permeate pressure (kPa, usually ≈ 0)"],
        example: "Pf = 200 kPa, Pc = 180 kPa, Pp = 0 → TMP = (200+180)/2 − 0 = 190 kPa",
        notes: "Rising TMP at constant flux indicates fouling. Falling flux at constant TMP also indicates fouling. TMP is the primary operating parameter for pressure-driven membranes."
      },
      {
        name: "Specific Flux (Permeability)",
        formula: "Kw = J / TMP",
        variables: ["Kw = specific flux or permeability (LMH/kPa or LMH/bar)", "J = flux (LMH)", "TMP = transmembrane pressure (kPa or bar)"],
        example: "J = 25 LMH, TMP = 100 kPa → Kw = 25/100 = 0.25 LMH/kPa",
        notes: "Declining Kw over time indicates fouling. Kw is used to track membrane condition and determine when cleaning is needed."
      },
    ]
  },
  {
    title: "Advanced Coagulation & Process Control",
    emoji: "⚗️",
    color: "#059669",
    formulas: [
      {
        name: "Jar Test Coagulant Dose Optimization",
        formula: "Optimal Dose = dose producing lowest filtered turbidity AND acceptable pH/alkalinity",
        variables: ["Coagulant dose (mg/L as product)", "Filtered turbidity (NTU)", "pH after coagulation (target 6.0–7.5 for alum)", "Residual alkalinity (target > 30 mg/L as CaCO₃)"],
        example: "Jar test results: 10 mg/L → 0.8 NTU; 15 mg/L → 0.15 NTU; 20 mg/L → 0.12 NTU; 25 mg/L → 0.18 NTU (pH too low). Optimal = 20 mg/L",
        notes: "Enhanced coagulation targets: TOC removal ≥ 15–25% (depending on source water alkalinity and TOC). Optimize for both turbidity AND NOM removal."
      },
      {
        name: "Alum Dose & Alkalinity Consumption",
        formula: "Alkalinity consumed (mg/L as CaCO₃) = Alum dose (mg/L) × 0.50",
        variables: ["Alum dose (mg/L as Al₂(SO₄)₃·18H₂O)", "Alkalinity consumed (mg/L as CaCO₃)"],
        example: "Alum dose = 30 mg/L → Alkalinity consumed = 30 × 0.50 = 15 mg/L as CaCO₃",
        notes: "Rule of thumb: each 1 mg/L of alum consumes ~0.5 mg/L alkalinity as CaCO₃. If residual alkalinity drops below 30 mg/L, add lime or soda ash."
      },
      {
        name: "Velocity Gradient (G)",
        formula: "G = √(P / (μ × V))",
        variables: ["G = velocity gradient (s⁻¹)", "P = power input (W)", "μ = dynamic viscosity (N·s/m², ≈ 0.001 at 20°C)", "V = basin volume (m³)"],
        example: "P = 500 W, μ = 0.001 N·s/m², V = 100 m³ → G = √(500 / (0.001 × 100)) = √5000 = 70.7 s⁻¹",
        notes: "Rapid mix: G = 300–1000 s⁻¹; Flocculation: G = 10–75 s⁻¹. Camp number (Gt) = G × detention time; target Gt = 10,000–100,000 for flocculation."
      },
      {
        name: "Sedimentation Basin Surface Overflow Rate",
        formula: "SOR = Q / A",
        variables: ["SOR = surface overflow rate (m³/m²·d or m/d)", "Q = flow rate (m³/d)", "A = basin surface area (m²)"],
        example: "Q = 10,000 m³/d, A = 500 m² → SOR = 10,000 / 500 = 20 m/d",
        notes: "Conventional sedimentation: SOR = 20–40 m/d. High-rate settlers (tube/plate): SOR = 80–200 m/d. Particles with settling velocity > SOR will be removed."
      },
    ]
  },
  {
    title: "Hydraulics & Pumping",
    emoji: "💧",
    color: "#2563EB",
    formulas: [
      {
        name: "Pump Affinity Laws — Flow",
        formula: "Q₂/Q₁ = N₂/N₁",
        variables: ["Q = flow rate (m³/h or L/s)", "N = pump speed (rpm)"],
        example: "Q₁ = 100 m³/h at N₁ = 1000 rpm. New speed N₂ = 1200 rpm → Q₂ = 100 × (1200/1000) = 120 m³/h",
        notes: "Flow is proportional to speed. Used to predict pump performance at different VFD speeds."
      },
      {
        name: "Pump Affinity Laws — Head",
        formula: "H₂/H₁ = (N₂/N₁)²",
        variables: ["H = pump head (m)", "N = pump speed (rpm)"],
        example: "H₁ = 25 m at N₁ = 1000 rpm. N₂ = 1200 rpm → H₂ = 25 × (1200/1000)² = 25 × 1.44 = 36 m",
        notes: "Head is proportional to speed squared. A 20% speed increase gives 44% more head."
      },
      {
        name: "Pump Affinity Laws — Power",
        formula: "P₂/P₁ = (N₂/N₁)³",
        variables: ["P = pump power (kW)", "N = pump speed (rpm)"],
        example: "P₁ = 10 kW at N₁ = 1000 rpm. N₂ = 1200 rpm → P₂ = 10 × (1200/1000)³ = 10 × 1.728 = 17.3 kW",
        notes: "Power is proportional to speed cubed. A 20% speed increase requires 73% more power. VFDs save energy by reducing speed during low-demand periods."
      },
      {
        name: "Net Positive Suction Head Available (NPSHa)",
        formula: "NPSHa = (Patm/ρg) + Hs − Hf − Hvp",
        variables: ["NPSHa = available NPSH (m)", "Patm = atmospheric pressure head (m)", "Hs = suction head (positive) or lift (negative) (m)", "Hf = friction losses in suction piping (m)", "Hvp = vapour pressure head of liquid (m)"],
        example: "Patm = 10.3 m, Hs = −3 m (lift), Hf = 0.5 m, Hvp = 0.24 m (20°C) → NPSHa = 10.3 − 3 − 0.5 − 0.24 = 6.56 m",
        notes: "NPSHa must exceed NPSHr (required, from pump curve) by at least 0.5–1.0 m to prevent cavitation. Cavitation causes noise, vibration, and impeller damage."
      },
    ]
  },
  {
    title: "Regulatory & QMS Calculations",
    emoji: "📋",
    color: "#DC2626",
    formulas: [
      {
        name: "Log Inactivation Credit",
        formula: "Log Inactivation = log₁₀(N₀ / N)",
        variables: ["Log Inactivation (log units)", "N₀ = influent pathogen concentration", "N = effluent pathogen concentration"],
        example: "N₀ = 10,000 organisms/L, N = 10 organisms/L → Log Inactivation = log₁₀(10,000/10) = log₁₀(1000) = 3-log",
        notes: "GCDWQ requires: Giardia: 3-log removal/inactivation; Cryptosporidium: 3-log; Viruses: 4-log. Credit is assigned for filtration (typically 2-log Giardia, 2.5-log Crypto) + disinfection."
      },
      {
        name: "Running Annual Average (RAA)",
        formula: "RAA = Sum of all quarterly samples / Number of quarters (≥ 4)",
        variables: ["RAA = running annual average (mg/L)", "Quarterly samples = THM or HAA concentrations (mg/L)", "Number of quarters = rolling 4-quarter window"],
        example: "Q1=0.060, Q2=0.075, Q3=0.090, Q4=0.055 mg/L → RAA = (0.060+0.075+0.090+0.055)/4 = 0.070 mg/L (below 0.100 MAC)",
        notes: "TTHMs MAC = 0.100 mg/L RAA; HAA5 MAC = 0.080 mg/L RAA. Samples taken at the point of maximum residence time in the distribution system."
      },
      {
        name: "Percent Removal (Treatment Efficiency)",
        formula: "Removal (%) = ((Cin − Cout) / Cin) × 100",
        variables: ["Cin = influent concentration (mg/L or NTU)", "Cout = effluent concentration (mg/L or NTU)"],
        example: "Cin = 8.0 NTU, Cout = 0.08 NTU → Removal = ((8.0−0.08)/8.0) × 100 = 99.0%",
        notes: "Used to calculate turbidity removal, TOC removal, and pathogen log removal credit. 2-log removal = 99%; 3-log = 99.9%; 4-log = 99.99%."
      },
      {
        name: "Chemical Feed Rate (Dry Chemical)",
        formula: "Feed Rate (kg/d) = Dose (mg/L) × Flow (m³/d) × 0.001",
        variables: ["Feed Rate (kg/d)", "Dose = target chemical dose (mg/L)", "Flow = plant flow rate (m³/d)", "0.001 = unit conversion (mg/L × m³/d → kg/d)"],
        example: "Dose = 5 mg/L, Flow = 10,000 m³/d → Feed Rate = 5 × 10,000 × 0.001 = 50 kg/d",
        notes: "For liquid chemicals: Feed Rate (L/d) = Dose (mg/L) × Flow (m³/d) / (Chemical concentration (mg/L) × 0.001)"
      },
    ]
  },
  {
    title: "Sludge & Residuals Management",
    emoji: "🏗️",
    color: "#92400E",
    formulas: [
      {
        name: "Sludge Volume (Alum Coagulation)",
        formula: "Sludge (kg/d) = Flow (m³/d) × (0.26 × Alum dose + SS removed) × 0.001",
        variables: ["Sludge (kg/d)", "Flow (m³/d)", "Alum dose (mg/L as alum)", "SS removed = suspended solids removed (mg/L)", "0.26 = conversion factor for alum to Al(OH)₃ sludge"],
        example: "Flow = 10,000 m³/d, Alum = 20 mg/L, SS removed = 15 mg/L → Sludge = 10,000 × (0.26×20 + 15) × 0.001 = 10,000 × 20.2 × 0.001 = 202 kg/d",
        notes: "Actual sludge volume depends on solids concentration. At 1% solids: 202 kg/d ÷ 0.01 = 20,200 L/d = 20.2 m³/d of sludge."
      },
      {
        name: "Sludge Solids Concentration",
        formula: "Solids (%) = (Mass of dry solids / Total sludge mass) × 100",
        variables: ["Solids (%) = percent solids by weight", "Mass of dry solids (kg)", "Total sludge mass (kg) = dry solids + water"],
        example: "Dry solids = 10 kg, Total sludge = 1000 kg → Solids = (10/1000) × 100 = 1.0%",
        notes: "Typical sludge concentrations: raw sludge from clarifier: 0.5–2%; thickened sludge: 3–6%; dewatered cake: 15–25%."
      },
      {
        name: "Backwash Water Volume",
        formula: "BW Volume (m³) = BW Rate (m³/m²·min) × Filter Area (m²) × BW Duration (min)",
        variables: ["BW Volume = total backwash water used (m³)", "BW Rate = backwash flow rate per unit area (m³/m²·min)", "Filter Area (m²)", "BW Duration (min)"],
        example: "BW Rate = 0.6 m³/m²·min, Area = 50 m², Duration = 15 min → BW Volume = 0.6 × 50 × 15 = 450 m³",
        notes: "Backwash water use should be < 2–3% of total production. Backwash waste is typically returned to the head of the plant for treatment."
      },
    ]
  },
];

const QUICK_REF = [
  { label: "Ozone CT (3-log Giardia, 25°C)", value: "2.0 mg·min/L" },
  { label: "UV Dose (4-log Crypto)", value: "40 mJ/cm²" },
  { label: "MF/UF Typical Flux", value: "20–80 LMH" },
  { label: "RO Typical Recovery", value: "70–85%" },
  { label: "Rapid Mix G", value: "300–1000 s⁻¹" },
  { label: "Flocculation G", value: "10–75 s⁻¹" },
  { label: "Flocculation Gt", value: "10,000–100,000" },
  { label: "Sedimentation SOR (conventional)", value: "20–40 m/d" },
  { label: "TTHM MAC (RAA)", value: "0.100 mg/L" },
  { label: "HAA5 MAC (RAA)", value: "0.080 mg/L" },
  { label: "Giardia log removal (filtration credit)", value: "2-log" },
  { label: "Cryptosporidium log removal (filtration credit)", value: "2.5-log" },
  { label: "Virus log removal (filtration credit)", value: "2-log" },
  { label: "Alum alkalinity consumption", value: "0.5 mg CaCO₃ per mg alum" },
  { label: "Minimum residual alkalinity (coagulation)", value: "> 30 mg/L as CaCO₃" },
];

export default function FormulasWpiClass3() {
  usePageMeta({
    title: "WPI Class 3 Water Formulas",
    description: "Essential formulas and calculations for WPI Class 3 Water operator certification exam. Quick reference formula sheet.",
  });

  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [expandedFormula, setExpandedFormula] = useState<string | null>(null);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Sora', 'Inter', sans-serif" }}>      <style>{`
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

      <SiteNav currentPath="/formulas-wpi-class3" />

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)", padding: "48px 24px 40px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", borderRadius: 20, padding: "6px 16px", fontSize: 12, fontWeight: 700, color: "#C7D2FE", marginBottom: 16, letterSpacing: "0.08em" }}>
          🌊 WPI — BC / AB / SK / MB &nbsp;·&nbsp; CLASS III WATER TREATMENT
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, color: "#fff", margin: "0 0 12px", lineHeight: 1.1 }}>
          Class III Formula Sheet
        </h1>
        <p style={{ fontSize: 16, color: "#C7D2FE", margin: "0 auto 24px", maxWidth: 520 }}>
          Advanced treatment, membranes, process control &amp; regulatory calculations for the WPI Class III exam
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/wpi-class3-water">
            <button style={{ background: "#4F46E5", color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Practice Quiz →
            </button>
          </Link>
          <Link href="/wpi-class3-water-mock">
            <button style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Mock Exam →
            </button>
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px 64px" }}>

        {/* Section tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
          <button
            onClick={() => setActiveSection(null)}
            style={{ padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: activeSection === null ? "#4338CA" : "#E2E8F0", color: activeSection === null ? "#fff" : "#475569" }}
          >
            All Sections
          </button>
          {SECTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => setActiveSection(activeSection === i ? null : i)}
              style={{ padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: activeSection === i ? s.color : "#E2E8F0", color: activeSection === i ? "#fff" : "#475569" }}
            >
              {s.emoji} {s.title}
            </button>
          ))}
        </div>

        {/* Formula sections */}
        {SECTIONS.filter((_, i) => activeSection === null || activeSection === i).map((section, si) => (
          <div key={si} style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: section.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                {section.emoji}
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: 0 }}>{section.title}</h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {section.formulas.map((f, fi) => {
                const key = `${si}-${fi}`;
                const expanded = expandedFormula === key;
                return (
                  <div key={fi} style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: `1px solid ${expanded ? section.color : "#E2E8F0"}` }}>
                    <button
                      onClick={() => setExpandedFormula(expanded ? null : key)}
                      style={{ width: "100%", padding: "18px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
                    >
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>{f.name}</div>
                        <div style={{ fontFamily: "monospace", fontSize: 14, color: section.color, fontWeight: 700 }}>{f.formula}</div>
                      </div>
                      <div style={{ fontSize: 18, color: "#94A3B8", flexShrink: 0 }}>{expanded ? "▲" : "▼"}</div>
                    </button>

                    {expanded && (
                      <div style={{ padding: "0 20px 20px", borderTop: `1px solid #F1F5F9` }}>
                        {/* Variables */}
                        <div style={{ marginTop: 16, marginBottom: 16 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Variables</div>
                          <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
                            {f.variables.map((v, vi) => (
                              <li key={vi} style={{ fontSize: 13, color: "#475569", lineHeight: 1.5 }}>{v}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Example */}
                        <div style={{ background: "#F0FDF4", borderRadius: 10, padding: "12px 16px", marginBottom: f.notes ? 12 : 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Worked Example</div>
                          <div style={{ fontSize: 13, color: "#065F46", lineHeight: 1.6 }}>{f.example}</div>
                        </div>

                        {/* Notes */}
                        {f.notes && (
                          <div style={{ background: "#EFF6FF", borderRadius: 10, padding: "12px 16px", marginTop: 12 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Exam Notes</div>
                            <div style={{ fontSize: 13, color: "#1E40AF", lineHeight: 1.6 }}>{f.notes}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Quick Reference Table */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "28px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #E2E8F0", marginTop: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: "0 0 20px" }}>⚡ Quick Reference — Class III Key Values</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
            {QUICK_REF.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, gap: 8 }}>
                <span style={{ fontSize: 12, color: "#475569", lineHeight: 1.4, flex: 1 }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#4338CA", flexShrink: 0 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Nav links */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 40 }}>
          <Link href="/formulas-wpi-class1">
            <button style={{ background: "#E0E7FF", color: "#4338CA", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              ← Class I Formulas
            </button>
          </Link>
          <Link href="/formulas-wpi-class2">
            <button style={{ background: "#E0E7FF", color: "#4338CA", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              ← Class II Formulas
            </button>
          </Link>
          <Link href="/wpi">
            <button style={{ background: "#F1F5F9", color: "#475569", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              WPI Overview
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
