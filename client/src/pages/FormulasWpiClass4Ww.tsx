// WPI CLASS IV WASTEWATER TREATMENT FORMULA SHEET
import { useState } from "react";
import { Link } from "wouter";
import SiteNav from "@/components/SiteNav";

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
    category: "Advanced Process Control",
    icon: "⚙️",
    color: "#1D4ED8",
    cards: [
      {
        title: "Sludge Volume Index (SVI)",
        formula: "SVI = (Settled sludge volume mL/L × 1000) / MLSS mg/L",
        variables: ["Settled sludge volume: mL/L after 30-min settling", "MLSS: Mixed Liquor Suspended Solids (mg/L)"],
        example: "Settled volume = 250 mL/L, MLSS = 2,500 mg/L",
        result: "SVI = (250 × 1000) / 2500 = 100 mL/g",
        notes: "Good settling: SVI 50–150 mL/g. Bulking: SVI > 150 mL/g.",
      },
      {
        title: "Food-to-Microorganism Ratio (F:M)",
        formula: "F:M = BOD_applied (kg/d) / MLVSS_in_aeration (kg)",
        variables: ["BOD_applied: kg/d = Flow (m³/d) × BOD (mg/L) / 1000", "MLVSS: Mixed Liquor Volatile Suspended Solids (kg)"],
        example: "BOD = 300 mg/L, Flow = 10,000 m³/d, MLVSS = 2,000 mg/L, Volume = 3,000 m³",
        result: "F:M = (10,000 × 300/1000) / (2,000 × 3,000/1000) = 3,000 / 6,000 = 0.5 kg BOD/kg MLVSS·d",
        notes: "Conventional: 0.2–0.4. Extended aeration: 0.05–0.15.",
      },
      {
        title: "Solids Retention Time (SRT / MCRT)",
        formula: "SRT = MLSS_in_system (kg) / (WAS_rate + Effluent_SS) (kg/d)",
        variables: ["MLSS_in_system: Total solids in aeration basin (kg)", "WAS_rate: Waste activated sludge rate (kg/d)", "Effluent_SS: Solids leaving in effluent (kg/d)"],
        example: "MLSS = 5,000 kg, WAS = 400 kg/d, Effluent SS = 50 kg/d",
        result: "SRT = 5,000 / (400 + 50) = 11.1 days",
        notes: "Nitrification requires SRT > 10 days at 15°C. Denitrification: 15–30 days.",
      },
      {
        title: "Hydraulic Retention Time (HRT)",
        formula: "HRT (h) = Volume (m³) / Flow (m³/h)",
        variables: ["Volume: Aeration basin volume (m³)", "Flow: Influent flow rate (m³/h)"],
        example: "Volume = 3,000 m³, Flow = 500 m³/h",
        result: "HRT = 3,000 / 500 = 6 hours",
        notes: "Typical activated sludge HRT: 4–8 hours. Extended aeration: 18–36 hours.",
      },
      {
        title: "Return Activated Sludge (RAS) Rate",
        formula: "RAS ratio = Q_RAS / Q_influent",
        variables: ["Q_RAS: Return sludge flow (m³/d)", "Q_influent: Influent flow (m³/d)"],
        example: "Q_RAS = 4,000 m³/d, Q_influent = 10,000 m³/d",
        result: "RAS ratio = 4,000 / 10,000 = 0.4 (40%)",
        notes: "Typical RAS ratio: 25–75% of influent flow.",
      },
    ],
  },
  {
    category: "Biological Nutrient Removal (BNR)",
    icon: "♻️",
    color: "#15803D",
    cards: [
      {
        title: "Nitrogen Mass Balance",
        formula: "TN_removed = TN_in − TN_effluent",
        variables: ["TN_in: Total nitrogen in influent (mg/L)", "TN_effluent: Total nitrogen in effluent (mg/L)"],
        example: "TN_in = 40 mg/L, TN_effluent = 8 mg/L",
        result: "TN_removed = 40 − 8 = 32 mg/L (80% removal)",
        notes: "Typical effluent TN target: ≤ 10 mg/L for advanced treatment.",
      },
      {
        title: "Nitrification Rate",
        formula: "Nitrification = NH₄⁺_in − NH₄⁺_effluent (mg/L)",
        variables: ["NH₄⁺_in: Influent ammonia (mg/L as N)", "NH₄⁺_effluent: Effluent ammonia (mg/L as N)"],
        example: "NH₄⁺_in = 30 mg/L, NH₄⁺_effluent = 1 mg/L",
        result: "Nitrification = 30 − 1 = 29 mg/L NH₄⁺ oxidized",
        notes: "Oxygen demand: 4.57 g O₂ per g NH₄⁺-N nitrified.",
      },
      {
        title: "Denitrification Rate",
        formula: "NO₃⁻_removed = NO₃⁻_in − NO₃⁻_effluent (mg/L)",
        variables: ["NO₃⁻_in: Nitrate entering anoxic zone (mg/L)", "NO₃⁻_effluent: Effluent nitrate (mg/L)"],
        example: "NO₃⁻_in = 25 mg/L, NO₃⁻_effluent = 5 mg/L",
        result: "NO₃⁻_removed = 25 − 5 = 20 mg/L",
        notes: "Carbon source required: ~4 g BOD per g NO₃⁻-N removed.",
      },
      {
        title: "Phosphorus Removal (Bio-P)",
        formula: "TP_removed = TP_in − TP_effluent (mg/L)",
        variables: ["TP_in: Total phosphorus influent (mg/L)", "TP_effluent: Total phosphorus effluent (mg/L)"],
        example: "TP_in = 8 mg/L, TP_effluent = 0.5 mg/L",
        result: "TP_removed = 8 − 0.5 = 7.5 mg/L (94% removal)",
        notes: "Enhanced Bio-P (EBPR) can achieve TP < 1 mg/L without chemicals.",
      },
      {
        title: "Chemical Phosphorus Removal — Alum Dose",
        formula: "Al:P molar ratio = Al dose (mg/L as Al) / P to remove (mg/L as P) × (27/31)",
        variables: ["Al dose: Aluminum sulfate dose (mg/L as Al)", "P: Phosphorus to remove (mg/L as P)", "Molar masses: Al = 27, P = 31"],
        example: "Remove 5 mg/L P, Al:P ratio = 1.5",
        result: "Al dose = 1.5 × 5 × (27/31) = 6.5 mg/L as Al → Alum dose = 6.5 × (342/54) = 41 mg/L",
        notes: "Al:P molar ratio of 1.5–2.0 typical for effluent TP < 1 mg/L.",
      },
    ],
  },
  {
    category: "Biogas & Energy Recovery",
    icon: "⚡",
    color: "#C2410C",
    cards: [
      {
        title: "Biogas Production from Digestion",
        formula: "Biogas (m³/d) = VS_destroyed (kg/d) × Specific gas yield (m³/kg VS)",
        variables: ["VS_destroyed: Volatile solids destroyed in digester (kg/d)", "Specific gas yield: typically 0.75–1.12 m³/kg VS"],
        example: "VS_destroyed = 1,000 kg/d, yield = 0.85 m³/kg VS",
        result: "Biogas = 1,000 × 0.85 = 850 m³/d",
        notes: "Biogas is typically 60–70% methane (CH₄). Energy content: ~22 MJ/m³ biogas.",
      },
      {
        title: "Methane Energy Content",
        formula: "Energy (kWh/d) = CH₄ volume (m³/d) × 9.97 kWh/m³",
        variables: ["CH₄ volume: Methane produced per day (m³/d)", "9.97 kWh/m³: Energy content of methane at STP"],
        example: "CH₄ = 500 m³/d",
        result: "Energy = 500 × 9.97 = 4,985 kWh/d",
        notes: "CHP (combined heat and power) efficiency: ~35% electrical, ~45% thermal.",
      },
      {
        title: "Volatile Solids Reduction",
        formula: "VS_reduction (%) = (VS_in − VS_out) / VS_in × 100",
        variables: ["VS_in: Volatile solids entering digester (kg/d)", "VS_out: Volatile solids leaving digester (kg/d)"],
        example: "VS_in = 2,000 kg/d, VS_out = 900 kg/d",
        result: "VS_reduction = (2,000 − 900) / 2,000 × 100 = 55%",
        notes: "Mesophilic digestion target: ≥ 38% VS reduction. Thermophilic: ≥ 40%.",
      },
      {
        title: "Digester Loading Rate",
        formula: "OLR (kg VS/m³·d) = VS_fed (kg/d) / Digester volume (m³)",
        variables: ["VS_fed: Volatile solids fed to digester daily (kg/d)", "Digester volume: Active digester volume (m³)"],
        example: "VS_fed = 2,000 kg/d, Volume = 2,500 m³",
        result: "OLR = 2,000 / 2,500 = 0.8 kg VS/m³·d",
        notes: "Mesophilic OLR: 1.6–4.8 kg VS/m³·d. Overloading causes VFA accumulation.",
      },
    ],
  },
  {
    category: "Effluent Quality & Regulatory",
    icon: "📋",
    color: "#A16207",
    cards: [
      {
        title: "BOD Removal Efficiency",
        formula: "BOD removal (%) = (BOD_in − BOD_out) / BOD_in × 100",
        variables: ["BOD_in: Influent BOD (mg/L)", "BOD_out: Effluent BOD (mg/L)"],
        example: "BOD_in = 250 mg/L, BOD_out = 10 mg/L",
        result: "BOD removal = (250 − 10) / 250 × 100 = 96%",
        notes: "Secondary treatment target: ≥ 85% BOD removal or ≤ 25 mg/L effluent BOD.",
      },
      {
        title: "TSS Removal Efficiency",
        formula: "TSS removal (%) = (TSS_in − TSS_out) / TSS_in × 100",
        variables: ["TSS_in: Influent total suspended solids (mg/L)", "TSS_out: Effluent TSS (mg/L)"],
        example: "TSS_in = 220 mg/L, TSS_out = 12 mg/L",
        result: "TSS removal = (220 − 12) / 220 × 100 = 94.5%",
        notes: "Secondary treatment target: ≥ 85% TSS removal or ≤ 25 mg/L effluent TSS.",
      },
      {
        title: "Effluent Dilution Factor",
        formula: "DF = (Q_river + Q_effluent) / Q_effluent",
        variables: ["Q_river: Receiving water flow (m³/s or L/s)", "Q_effluent: Effluent discharge flow (m³/s or L/s)"],
        example: "Q_river = 10 m³/s, Q_effluent = 0.5 m³/s",
        result: "DF = (10 + 0.5) / 0.5 = 21",
        notes: "Higher dilution factor = less stringent effluent limits required.",
      },
      {
        title: "Chlorine Residual (CT Value)",
        formula: "CT = Concentration (mg/L) × Contact time (min)",
        variables: ["Concentration: Free chlorine residual (mg/L)", "Contact time: T₁₀ (min) — time for 10% of water to pass"],
        example: "Cl₂ = 1.5 mg/L, T₁₀ = 30 min",
        result: "CT = 1.5 × 30 = 45 mg·min/L",
        notes: "CT for 4-log Giardia inactivation at 15°C, pH 7: ~65 mg·min/L.",
      },
    ],
  },
  {
    category: "Biosolids & Solids Management",
    icon: "🌱",
    color: "#0F766E",
    cards: [
      {
        title: "Biosolids Production Rate",
        formula: "Biosolids (kg/d) = TSS_removed (kg/d) + Biomass_growth (kg/d)",
        variables: ["TSS_removed: Solids removed in primary + secondary (kg/d)", "Biomass_growth: Net biological growth (kg/d)"],
        example: "TSS_removed = 800 kg/d, Biomass = 400 kg/d",
        result: "Biosolids = 800 + 400 = 1,200 kg/d dry solids",
        notes: "Typical: 0.8–1.2 kg dry solids per kg BOD removed.",
      },
      {
        title: "Sludge Thickening — Gravity",
        formula: "Solids loading (kg/m²·d) = Solids fed (kg/d) / Thickener area (m²)",
        variables: ["Solids fed: Dry solids to thickener (kg/d)", "Thickener area: Surface area of gravity thickener (m²)"],
        example: "Solids = 1,200 kg/d, Area = 60 m²",
        result: "Solids loading = 1,200 / 60 = 20 kg/m²·d",
        notes: "Gravity thickener design loading: 25–80 kg/m²·d for primary sludge.",
      },
      {
        title: "Centrifuge Capture Efficiency",
        formula: "Capture (%) = (Solids_in − Solids_centrate) / Solids_in × 100",
        variables: ["Solids_in: Solids fed to centrifuge (kg/d)", "Solids_centrate: Solids in centrate (kg/d)"],
        example: "Solids_in = 1,000 kg/d, Solids_centrate = 30 kg/d",
        result: "Capture = (1,000 − 30) / 1,000 × 100 = 97%",
        notes: "Target capture efficiency: ≥ 95% for biosolids dewatering.",
      },
      {
        title: "Biosolids Land Application — Loading Rate",
        formula: "N loading (kg/ha) = Biosolids applied (t/ha) × TKN (kg/t) × Availability factor",
        variables: ["Biosolids applied: Wet tonnes per hectare", "TKN: Total Kjeldahl Nitrogen in biosolids (kg/t)", "Availability factor: 0.5 for Class B, 0.7 for Class A"],
        example: "Applied = 10 t/ha, TKN = 50 kg/t, Class B (factor = 0.5)",
        result: "N loading = 10 × 50 × 0.5 = 250 kg N/ha",
        notes: "Typical agronomic N rate: 150–300 kg N/ha/yr depending on crop.",
      },
    ],
  },
  {
    category: "Emergency Response & Risk",
    icon: "🚨",
    color: "#B91C1C",
    cards: [
      {
        title: "Overflow Volume Calculation",
        formula: "Overflow volume (m³) = (Inflow − Capacity) × Duration (h) × 3,600 / 1,000",
        variables: ["Inflow: Peak wet weather flow (L/s)", "Capacity: Treatment capacity (L/s)", "Duration: Duration of overflow event (h)"],
        example: "Inflow = 500 L/s, Capacity = 350 L/s, Duration = 2 h",
        result: "Overflow = (500 − 350) × 2 × 3,600 / 1,000 = 1,080 m³",
        notes: "Report all SSOs (Sanitary Sewer Overflows) per regulatory requirements.",
      },
      {
        title: "Chlorine Demand for Emergency Disinfection",
        formula: "Cl₂ demand (mg/L) = Cl₂ applied − Cl₂ residual",
        variables: ["Cl₂ applied: Chlorine dose added (mg/L)", "Cl₂ residual: Remaining free chlorine after contact (mg/L)"],
        example: "Cl₂ applied = 8 mg/L, Cl₂ residual = 0.5 mg/L",
        result: "Cl₂ demand = 8 − 0.5 = 7.5 mg/L",
        notes: "Emergency disinfection target: ≥ 0.5 mg/L free chlorine residual after 30 min.",
      },
      {
        title: "Pump Station Wet Well Volume",
        formula: "Wet well volume (m³) = Peak flow (m³/min) × Cycle time (min) / 4",
        variables: ["Peak flow: Maximum inflow to wet well (m³/min)", "Cycle time: Desired pump on/off cycle time (min)"],
        example: "Peak flow = 2 m³/min, Cycle time = 10 min",
        result: "Wet well volume = 2 × 10 / 4 = 5 m³",
        notes: "Minimum wet well volume prevents excessive pump cycling (< 6 starts/hr).",
      },
    ],
  },
  {
    category: "Asset Management & Economics",
    icon: "🏛️",
    color: "#6D28D9",
    cards: [
      {
        title: "Net Present Value (NPV)",
        formula: "NPV = Σ [CF_t / (1 + r)^t] − Initial Cost",
        variables: ["CF_t: Cash flow in year t ($)", "r: Discount rate (decimal)", "t: Year number", "Initial Cost: Capital investment ($)"],
        example: "Annual savings = $50,000, r = 5%, 20 years, Initial cost = $500,000",
        result: "NPV = $50,000 × [(1−(1.05)⁻²⁰)/0.05] − $500,000 = $623,111 − $500,000 = +$123,111",
        notes: "Positive NPV = project is economically viable.",
      },
      {
        title: "Life Cycle Cost",
        formula: "LCC = Capital cost + PV(O&M costs) + PV(Replacement costs) − PV(Salvage value)",
        variables: ["Capital cost: Initial investment ($)", "PV: Present value of future costs ($)", "O&M: Operations and maintenance costs ($/yr)"],
        example: "Capital = $1M, PV(O&M) = $800K, PV(Replacement) = $200K, PV(Salvage) = $50K",
        result: "LCC = $1,000,000 + $800,000 + $200,000 − $50,000 = $1,950,000",
        notes: "Use LCC to compare alternatives over their full service life.",
      },
      {
        title: "Energy Intensity",
        formula: "Energy intensity (kWh/m³) = Total energy use (kWh/d) / Flow treated (m³/d)",
        variables: ["Total energy use: Facility-wide energy consumption (kWh/d)", "Flow treated: Average daily flow (m³/d)"],
        example: "Energy = 5,000 kWh/d, Flow = 10,000 m³/d",
        result: "Energy intensity = 5,000 / 10,000 = 0.5 kWh/m³",
        notes: "Benchmark: 0.3–0.6 kWh/m³ for secondary treatment. Advanced: 0.6–1.0 kWh/m³.",
      },
      {
        title: "Unit Cost of Treatment",
        formula: "Unit cost ($/m³) = Total annual cost ($) / Annual volume treated (m³)",
        variables: ["Total annual cost: All operating + capital costs ($)", "Annual volume: Total flow treated per year (m³)"],
        example: "Annual cost = $2,000,000, Annual volume = 3,650,000 m³",
        result: "Unit cost = $2,000,000 / 3,650,000 = $0.548/m³",
        notes: "Typical range: $0.20–$1.50/m³ depending on treatment level and plant size.",
      },
    ],
  },
];

export default function FormulasWpiClass4Ww() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = SECTIONS.map((s) => ({
    ...s,
    cards: s.cards.filter(
      (c) =>
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.formula.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((s) => !search || s.cards.length > 0);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}>
      <SiteNav currentPath="/formulas-wpi-class4-ww" />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px 80px" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Link href="/wpi">
              <button style={{ background: "none", border: "none", color: "#64748B", fontSize: 13, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
                ← WPI Exams
              </button>
            </Link>
            <span style={{ color: "#CBD5E1" }}>·</span>
            <Link href="/wpi-class4-wastewater">
              <button style={{ background: "none", border: "none", color: "#64748B", fontSize: 13, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
                Class IV Wastewater Practice
              </button>
            </Link>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0,
            }}>
              🏛️
            </div>
            <div>
              <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 900, color: "#0F172A", margin: 0 }}>
                WPI Class IV Wastewater Formula Sheet
              </h1>
              <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0" }}>
                Advanced process control · BNR · Biogas · Biosolids · Asset management · Emergency response
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Search formulas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "10px 16px", borderRadius: 10,
              border: "1.5px solid #E2E8F0", fontSize: 14, fontFamily: "inherit",
              background: "#fff", color: "#0F172A", outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Section tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          <button
            onClick={() => setActiveSection(null)}
            style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", border: "none",
              background: !activeSection ? "#0F172A" : "#F1F5F9",
              color: !activeSection ? "#fff" : "#475569",
            }}
          >
            All Sections
          </button>
          {SECTIONS.map((s) => (
            <button
              key={s.category}
              onClick={() => setActiveSection(activeSection === s.category ? null : s.category)}
              style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit", border: "none",
                background: activeSection === s.category ? s.color : "#F1F5F9",
                color: activeSection === s.category ? "#fff" : "#475569",
              }}
            >
              {s.icon} {s.category}
            </button>
          ))}
        </div>

        {/* Formula sections */}
        {filtered
          .filter((s) => !activeSection || s.category === activeSection)
          .map((section) => (
            <div key={section.category} style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 20 }}>{section.icon}</span>
                <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 800, color: section.color, margin: 0 }}>
                  {section.category}
                </h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 16 }}>
                {section.cards.map((card) => (
                  <div key={card.title} style={{
                    background: "#fff", borderRadius: 14, padding: "20px",
                    border: "1px solid #E2E8F0",
                  }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: "0 0 10px" }}>
                      {card.title}
                    </h3>
                    <div style={{
                      background: "#F8FAFC", borderRadius: 8, padding: "10px 14px",
                      fontFamily: "monospace", fontSize: 13, color: section.color,
                      fontWeight: 600, marginBottom: 12, lineHeight: 1.5,
                    }}>
                      {card.formula}
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      {card.variables.map((v, i) => (
                        <div key={i} style={{ fontSize: 12, color: "#64748B", marginBottom: 3, lineHeight: 1.4 }}>
                          • {v}
                        </div>
                      ))}
                    </div>
                    <div style={{
                      background: "#F0FDF4", borderRadius: 8, padding: "10px 14px",
                      border: "1px solid #BBF7D0", marginBottom: card.notes ? 10 : 0,
                    }}>
                      <div style={{ fontSize: 12, color: "#374151", marginBottom: 4 }}>
                        <strong>Example:</strong> {card.example}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#15803D" }}>
                        → {card.result}
                      </div>
                    </div>
                    {card.notes && (
                      <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.5, marginTop: 8 }}>
                        💡 {card.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

        {/* CTA */}
        <div style={{
          marginTop: 32, padding: "20px 24px",
          background: "linear-gradient(135deg, #F5F3FF, #EEF2FF)",
          borderRadius: 14, border: "1px solid #C4B5FD",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>
              Ready to test your knowledge?
            </div>
            <div style={{ fontSize: 12, color: "#64748B" }}>
              502-question practice quiz · 100-question timed mock exam
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/wpi-class4-wastewater">
              <button style={{
                padding: "10px 20px", borderRadius: 10,
                background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
                color: "#fff", border: "none", fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                Practice Quiz →
              </button>
            </Link>
            <Link href="/wpi-class4-wastewater-mock">
              <button style={{
                padding: "10px 20px", borderRadius: 10, background: "#fff",
                color: "#0F172A", border: "1.5px solid #E2E8F0", fontSize: 13,
                fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>
                Mock Exam →
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
