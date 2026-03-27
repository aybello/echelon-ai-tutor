// ECHELON — Lab & Sampling Module
// Chain of custody simulator, QA/QC controls, parameter reference, and calculators

import { useState } from "react";
import { Link } from "wouter";
import SiteNav from "@/components/SiteNav";

type Tab = "sampling" | "coc" | "qaqc" | "parameters" | "calc";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "sampling",    label: "Sampling Procedures", icon: "💧" },
  { id: "coc",         label: "Chain of Custody",    icon: "📋" },
  { id: "qaqc",        label: "QA/QC Controls",      icon: "✅" },
  { id: "parameters",  label: "Parameter Reference", icon: "📊" },
  { id: "calc",        label: "Lab Calculators",     icon: "🧮" },
];

// ── SAMPLING PROCEDURES ──
const SAMPLING_PROCEDURES = [
  {
    title: "Microbiological Sampling (Total Coliform / E. coli)",
    icon: "🦠",
    color: "#DC2626",
    bg: "#FEF2F2",
    steps: [
      "Use sterile, pre-labelled sample bottles with sodium thiosulfate (Na₂S₂O₃) dechlorinating agent",
      "Remove aerator/screen from tap — do not sample through filters or softeners",
      "Flame or disinfect the tap with 70% isopropyl alcohol and allow to dry",
      "Run cold water for 2–3 minutes to flush the service line",
      "Fill bottle without touching the inside of cap or bottle neck — do not overfill",
      "Label immediately: sample ID, location, date, time, collector name",
      "Keep at 4°C during transport — deliver to lab within 24 hours (6 hours preferred)",
    ],
    regulation: "O. Reg. 170/03 Schedule 10 — sampling frequency and locations",
    examTip: "Sodium thiosulfate neutralizes residual chlorine to prevent false negatives. Bottles must be pre-dosed by the lab.",
  },
  {
    title: "Chlorine Residual (Free & Total)",
    icon: "🟡",
    color: "#D97706",
    bg: "#FFFBEB",
    steps: [
      "Measure in the field immediately — chlorine dissipates rapidly after collection",
      "Use DPD colorimetric method (DPD #1 = free chlorine, DPD #3 = total chlorine)",
      "Rinse the sample cell 3× with sample water before filling",
      "Add DPD reagent tablet or powder — do not touch reagent with fingers",
      "Read within 1 minute of adding reagent — colour fades over time",
      "Record result, sample location, time, temperature, and operator name",
      "Calibrate comparator or photometer before each sampling event",
    ],
    regulation: "O. Reg. 170/03 — minimum 0.05 mg/L free chlorine at point of consumption",
    examTip: "Free chlorine = hypochlorous acid (HOCl) + hypochlorite (OCl⁻). DPD #1 measures free Cl₂ only. DPD #3 measures combined + free (total).",
  },
  {
    title: "Turbidity Sampling",
    icon: "🌊",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    steps: [
      "Use a calibrated turbidimeter (NTU or FTU scale)",
      "Rinse the sample cell 3× with sample water",
      "Fill cell completely — avoid air bubbles which cause false high readings",
      "Wipe outside of cell with lint-free cloth before inserting into instrument",
      "Record NTU value, date, time, location, and instrument ID",
      "Calibrate with AMCO-AEPA standards (0.1, 1.0, 10, 100 NTU) per manufacturer schedule",
      "For continuous monitoring, verify against grab sample at least weekly",
    ],
    regulation: "O. Reg. 170/03 — treated water turbidity ≤ 1 NTU (target ≤ 0.3 NTU for GUDI sources)",
    examTip: "Turbidity is measured in NTU (Nephelometric Turbidity Units). High turbidity shields pathogens from disinfection — it must be controlled BEFORE chlorination.",
  },
  {
    title: "pH Sampling",
    icon: "⚗️",
    color: "#7C3AED",
    bg: "#F5F3FF",
    steps: [
      "Calibrate pH meter with 2-point calibration (pH 4.0 and 7.0 buffers, or 7.0 and 10.0)",
      "Rinse electrode with distilled water and blot dry between calibration and sample",
      "Allow electrode to stabilize in sample — wait for stable reading (±0.01 pH units)",
      "Measure temperature simultaneously — pH is temperature-dependent",
      "Record pH, temperature, date, time, location, and meter ID",
      "Rinse electrode with distilled water after use and store in storage solution",
      "Replace electrode if slope is outside 95–105% range during calibration",
    ],
    regulation: "O. Reg. 169/03 — aesthetic objective pH 6.5–8.5 for drinking water",
    examTip: "pH affects chlorine effectiveness: at pH 6.5, ~90% of chlorine is HOCl (effective). At pH 8.5, ~10% is HOCl. Lower pH = better disinfection but more corrosive.",
  },
];

// ── CHAIN OF CUSTODY ──
interface CoCEntry {
  id: string;
  parameter: string;
  location: string;
  date: string;
  time: string;
  collector: string;
  bottleType: string;
  preservation: string;
  holdTime: string;
  temp: string;
}

function ChainOfCustody() {
  const [entries, setEntries] = useState<CoCEntry[]>([
    { id: "S001", parameter: "Total Coliform / E. coli", location: "", date: new Date().toISOString().split("T")[0], time: "", collector: "", bottleType: "100 mL sterile (Na₂S₂O₃)", preservation: "4°C", holdTime: "24 hours", temp: "" },
  ]);
  const [submitted, setSubmitted] = useState(false);

  const addEntry = () => {
    setEntries(prev => [...prev, {
      id: `S${String(prev.length + 1).padStart(3, "0")}`,
      parameter: "", location: "", date: new Date().toISOString().split("T")[0],
      time: "", collector: "", bottleType: "", preservation: "4°C", holdTime: "", temp: "",
    }]);
  };

  const updateEntry = (idx: number, field: keyof CoCEntry, value: string) => {
    setEntries(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  };

  const removeEntry = (idx: number) => {
    setEntries(prev => prev.filter((_, i) => i !== idx));
  };

  if (submitted) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>Chain of Custody Submitted</div>
        <div style={{ fontSize: 13, color: "#64748B", marginBottom: 24 }}>{entries.length} sample(s) recorded · {new Date().toLocaleString()}</div>
        <div style={{ background: "#F0FDF4", borderRadius: 16, padding: "20px", border: "1px solid #BBF7D0", marginBottom: 24, textAlign: "left" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#15803D", marginBottom: 12 }}>📋 Submitted Samples</div>
          {entries.map((e, i) => (
            <div key={i} style={{ fontSize: 11, color: "#374151", padding: "8px 0", borderBottom: i < entries.length - 1 ? "1px solid #D1FAE5" : "none" }}>
              <strong>{e.id}</strong> — {e.parameter} @ {e.location} · {e.date} {e.time} · Collector: {e.collector || "—"}
            </div>
          ))}
        </div>
        <button onClick={() => setSubmitted(false)} style={{ padding: "12px 28px", borderRadius: 12, border: "none", background: "#1D4ED8", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          ← New CoC Form
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: "#EFF6FF", borderRadius: 12, padding: "14px 18px", marginBottom: 20, border: "1px solid #BFDBFE" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1D4ED8", marginBottom: 4 }}>📋 Chain of Custody (CoC) Form</div>
        <div style={{ fontSize: 11, color: "#1E3A5F", lineHeight: 1.7 }}>
          A CoC form documents the collection, handling, and transfer of samples. It is a legal document — every sample must have a completed CoC to be accepted by an accredited lab.
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
        {entries.map((entry, idx) => (
          <div key={entry.id} style={{ background: "#F8FAFC", borderRadius: 14, padding: "20px", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#1D4ED8", background: "#DBEAFE", padding: "4px 10px", borderRadius: 20 }}>Sample {entry.id}</span>
              {entries.length > 1 && (
                <button onClick={() => removeEntry(idx)} style={{ padding: "4px 10px", borderRadius: 20, border: "1px solid #FCA5A5", background: "#FEF2F2", color: "#DC2626", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Remove</button>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {[
                { label: "Parameter", field: "parameter" as keyof CoCEntry, placeholder: "e.g. Total Coliform" },
                { label: "Sample Location", field: "location" as keyof CoCEntry, placeholder: "e.g. 123 Main St tap" },
                { label: "Collector Name", field: "collector" as keyof CoCEntry, placeholder: "Full name" },
                { label: "Date", field: "date" as keyof CoCEntry, placeholder: "YYYY-MM-DD", type: "date" },
                { label: "Time", field: "time" as keyof CoCEntry, placeholder: "HH:MM", type: "time" },
                { label: "Sample Temp (°C)", field: "temp" as keyof CoCEntry, placeholder: "e.g. 4.2" },
              ].map(({ label, field, placeholder, type }) => (
                <div key={field}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 4 }}>{label}</label>
                  <input
                    type={type || "text"}
                    value={entry[field]}
                    onChange={e => updateEntry(idx, field, e.target.value)}
                    placeholder={placeholder}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12, color: "#0F172A", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
              {[
                { label: "Bottle Type", field: "bottleType" as keyof CoCEntry },
                { label: "Preservation", field: "preservation" as keyof CoCEntry },
                { label: "Hold Time", field: "holdTime" as keyof CoCEntry },
              ].map(({ label, field }) => (
                <div key={field}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 4 }}>{label}</label>
                  <input
                    value={entry[field]}
                    onChange={e => updateEntry(idx, field, e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12, color: "#0F172A", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={addEntry} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "2px dashed #CBD5E1", background: "#F8FAFC", color: "#64748B", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          + Add Sample
        </button>
        <button onClick={() => setSubmitted(true)} style={{ flex: 2, padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #1D4ED8, #0F766E)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Submit Chain of Custody ✓
        </button>
      </div>
    </div>
  );
}

// ── QA/QC CONTROLS ──
const QAQC_CONTROLS = [
  { name: "Field Blank", icon: "⬜", color: "#64748B", purpose: "Detects contamination introduced during sampling/transport", how: "Fill a clean sample bottle with distilled water in the field, process identically to samples", frequency: "1 per 10 samples or per sampling event", passFailCriteria: "Result must be below detection limit (BDL) for all target analytes" },
  { name: "Equipment Blank", icon: "🔧", color: "#1D4ED8", purpose: "Detects contamination from sampling equipment (pumps, tubing, bailers)", how: "Rinse equipment with distilled water, collect rinse water as a sample", frequency: "1 per sampling event when reusable equipment is used", passFailCriteria: "Result must be BDL — if not, equipment must be re-cleaned" },
  { name: "Field Duplicate", icon: "🔄", color: "#059669", purpose: "Measures sampling precision (reproducibility)", how: "Collect two separate samples from the same location at the same time", frequency: "1 per 10 samples (10% duplicate rate)", passFailCriteria: "Relative Percent Difference (RPD) ≤ 20% for most parameters" },
  { name: "Matrix Spike", icon: "💉", color: "#D97706", purpose: "Measures method accuracy in the specific sample matrix", how: "Add a known amount of target analyte to a sample aliquot, compare to unspiked result", frequency: "1 per 20 samples or per batch", passFailCriteria: "Spike recovery: 70–130% for most parameters" },
  { name: "Method Blank", icon: "🧪", color: "#7C3AED", purpose: "Detects contamination introduced during lab analysis", how: "Process distilled water through the entire analytical method alongside samples", frequency: "1 per analytical batch", passFailCriteria: "Result must be BDL — if not, the entire batch may be invalid" },
  { name: "Calibration Verification", icon: "📏", color: "#DC2626", purpose: "Confirms instrument calibration is accurate throughout the run", how: "Analyze a certified reference standard (CRS) at mid-range of calibration curve", frequency: "Every 10 samples and at end of run", passFailCriteria: "CRS result within ±10% of certified value" },
];

// ── PARAMETER REFERENCE ──
const PARAMETERS = [
  { name: "Free Chlorine Residual", unit: "mg/L", mac: "—", ao: "—", ontario: "Min 0.05 mg/L at tap", method: "DPD colorimetric (field)", holdTime: "Measure immediately", preservation: "None", container: "Any clean bottle", examNote: "Must be measured in the field — cannot be sent to lab" },
  { name: "Total Coliform", unit: "CFU/100 mL", mac: "0 (treated)", ao: "—", ontario: "0 in treated water", method: "Membrane filtration or P-A test", holdTime: "24 hours (6 hr preferred)", preservation: "4°C, Na₂S₂O₃", container: "100 mL sterile", examNote: "Any detection in treated water = AWQI under O. Reg. 170/03" },
  { name: "E. coli", unit: "CFU/100 mL", mac: "0", ao: "—", ontario: "0 in treated water", method: "Membrane filtration", holdTime: "24 hours", preservation: "4°C, Na₂S₂O₃", container: "100 mL sterile", examNote: "E. coli = fecal contamination indicator. Immediate AWQI notification required." },
  { name: "Turbidity", unit: "NTU", mac: "—", ao: "1 NTU", ontario: "≤1 NTU treated; ≤0.3 NTU target", method: "Nephelometry", holdTime: "24 hours", preservation: "4°C, dark", container: "Plastic or glass", examNote: "High turbidity shields pathogens from disinfection — must be controlled before chlorination" },
  { name: "pH", unit: "pH units", mac: "—", ao: "6.5–8.5", ontario: "AO: 6.5–8.5", method: "Electrometric (pH meter)", holdTime: "Measure immediately", preservation: "None", container: "Any", examNote: "pH affects chlorine speciation: low pH = more HOCl (effective). Measure in field." },
  { name: "Nitrate (as N)", unit: "mg/L", mac: "10", ao: "—", ontario: "MAC: 10 mg/L", method: "Ion chromatography or colorimetric", holdTime: "48 hours", preservation: "4°C, H₂SO₄ to pH<2", container: "Plastic", examNote: "Causes methemoglobinemia in infants (blue baby syndrome) above 10 mg/L" },
  { name: "Lead", unit: "µg/L", mac: "5", ao: "—", ontario: "MAC: 5 µg/L (2019)", method: "ICP-MS", holdTime: "6 months", preservation: "HNO₃ to pH<2", container: "Plastic (acid-washed)", examNote: "Sample after 30-min stagnation (first-draw). Lead from service lines and solder." },
  { name: "Fluoride", unit: "mg/L", mac: "1.5", ao: "1.0", ontario: "Target: 0.7 mg/L", method: "Ion-selective electrode or IC", holdTime: "28 days", preservation: "4°C", container: "Plastic", examNote: "Ontario target is 0.7 mg/L for dental health. MAC is 1.5 mg/L." },
  { name: "Total Hardness", unit: "mg/L as CaCO₃", mac: "—", ao: "80–100 (soft)", ontario: "AO: 80–100 mg/L", method: "EDTA titration or ICP", holdTime: "6 months", preservation: "HNO₃ to pH<2", container: "Plastic or glass", examNote: "Hard water (>200 mg/L) causes scale. Soft water (<80 mg/L) is more corrosive." },
  { name: "BOD₅", unit: "mg/L", mac: "—", ao: "—", ontario: "Effluent: ≤25 mg/L (O. Reg. 129/04)", method: "5-day incubation at 20°C", holdTime: "48 hours", preservation: "4°C", container: "Glass BOD bottle", examNote: "BOD₅ = oxygen demand over 5 days at 20°C. Key wastewater treatment performance indicator." },
  { name: "Total Suspended Solids (TSS)", unit: "mg/L", mac: "—", ao: "—", ontario: "Effluent: ≤25 mg/L (O. Reg. 129/04)", method: "Gravimetric (filter + dry)", holdTime: "7 days", preservation: "4°C", container: "Plastic or glass", examNote: "TSS measured by filtering sample through 0.45 µm filter and weighing residue." },
];

// ── LAB CALCULATORS ──
function LabCalculators() {
  const [calcType, setCalcType] = useState<"rpd" | "recovery" | "dilution" | "bod">("rpd");

  // RPD
  const [rpd1, setRpd1] = useState("12.5");
  const [rpd2, setRpd2] = useState("13.1");
  const rpdVal = Math.abs((parseFloat(rpd1) - parseFloat(rpd2))) / ((parseFloat(rpd1) + parseFloat(rpd2)) / 2) * 100;
  const rpdPass = rpdVal <= 20;

  // Spike Recovery
  const [spikeUnspiked, setSpikeUnspiked] = useState("10.2");
  const [spikeSpiked, setSpikeSpiked] = useState("14.8");
  const [spikeAdded, setSpikeAdded] = useState("5.0");
  const recovery = ((parseFloat(spikeSpiked) - parseFloat(spikeUnspiked)) / parseFloat(spikeAdded)) * 100;
  const recoveryPass = recovery >= 70 && recovery <= 130;

  // Dilution
  const [c1, setC1] = useState("100");
  const [v1, setV1] = useState("10");
  const [v2, setV2] = useState("100");
  const c2 = (parseFloat(c1) * parseFloat(v1)) / parseFloat(v2);

  // BOD Calculation
  const [initialDO, setInitialDO] = useState("8.5");
  const [finalDO, setFinalDO] = useState("3.2");
  const [dilutionFactor, setDilutionFactor] = useState("20");
  const bod = (parseFloat(initialDO) - parseFloat(finalDO)) * parseFloat(dilutionFactor);

  const calcTabs = [
    { id: "rpd", label: "RPD" },
    { id: "recovery", label: "Spike Recovery" },
    { id: "dilution", label: "Dilution (C₁V₁=C₂V₂)" },
    { id: "bod", label: "BOD₅" },
  ] as const;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {calcTabs.map(({ id, label }) => (
          <button key={id} onClick={() => setCalcType(id)}
            style={{ padding: "8px 16px", borderRadius: 20, border: `2px solid ${calcType === id ? "#1D4ED8" : "#E2E8F0"}`, background: calcType === id ? "#EFF6FF" : "#fff", color: calcType === id ? "#1D4ED8" : "#64748B", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            {label}
          </button>
        ))}
      </div>

      {calcType === "rpd" && (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>Relative Percent Difference (RPD)</h3>
          <p style={{ fontSize: 12, color: "#64748B", marginBottom: 20 }}>Used to assess precision between field duplicates. RPD ≤ 20% is typically acceptable.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            {[["Sample Result", rpd1, setRpd1], ["Duplicate Result", rpd2, setRpd2]].map(([label, val, set]) => (
              <div key={label as string}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>{label as string}</label>
                <input type="number" value={val as string} onChange={e => (set as (v: string) => void)(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #E2E8F0", fontSize: 14, fontWeight: 600, color: "#0F172A", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
          </div>
          <div style={{ background: rpdPass ? "#F0FDF4" : "#FEF2F2", borderRadius: 14, padding: "20px", border: `2px solid ${rpdPass ? "#22C55E" : "#EF4444"}`, textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: rpdPass ? "#059669" : "#DC2626" }}>{isNaN(rpdVal) ? "—" : `${rpdVal.toFixed(1)}%`}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: rpdPass ? "#15803D" : "#B91C1C", marginTop: 4 }}>{rpdPass ? "✓ PASS — Acceptable precision" : "✗ FAIL — Re-sample required"}</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 6 }}>RPD = |A − B| / [(A + B) / 2] × 100</div>
          </div>
        </div>
      )}

      {calcType === "recovery" && (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>Matrix Spike Recovery</h3>
          <p style={{ fontSize: 12, color: "#64748B", marginBottom: 20 }}>Acceptable recovery: 70–130%. Outside this range indicates matrix interference or method error.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
            {[["Unspiked Sample", spikeUnspiked, setSpikeUnspiked], ["Spiked Sample", spikeSpiked, setSpikeSpiked], ["Spike Added", spikeAdded, setSpikeAdded]].map(([label, val, set]) => (
              <div key={label as string}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>{label as string}</label>
                <input type="number" value={val as string} onChange={e => (set as (v: string) => void)(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #E2E8F0", fontSize: 14, fontWeight: 600, color: "#0F172A", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
          </div>
          <div style={{ background: recoveryPass ? "#F0FDF4" : "#FEF2F2", borderRadius: 14, padding: "20px", border: `2px solid ${recoveryPass ? "#22C55E" : "#EF4444"}`, textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: recoveryPass ? "#059669" : "#DC2626" }}>{isNaN(recovery) ? "—" : `${recovery.toFixed(1)}%`}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: recoveryPass ? "#15803D" : "#B91C1C", marginTop: 4 }}>{recoveryPass ? "✓ PASS — Acceptable recovery (70–130%)" : "✗ FAIL — Outside acceptable range"}</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 6 }}>Recovery = (Spiked − Unspiked) / Spike Added × 100</div>
          </div>
        </div>
      )}

      {calcType === "dilution" && (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>Dilution Calculator (C₁V₁ = C₂V₂)</h3>
          <p style={{ fontSize: 12, color: "#64748B", marginBottom: 20 }}>Used to prepare standards, dilute concentrated samples, or calculate diluted concentrations.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
            {[["Initial Conc. C₁", c1, setC1], ["Initial Volume V₁ (mL)", v1, setV1], ["Final Volume V₂ (mL)", v2, setV2]].map(([label, val, set]) => (
              <div key={label as string}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>{label as string}</label>
                <input type="number" value={val as string} onChange={e => (set as (v: string) => void)(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #E2E8F0", fontSize: 14, fontWeight: 600, color: "#0F172A", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
          </div>
          <div style={{ background: "#EFF6FF", borderRadius: 14, padding: "20px", border: "2px solid #3B82F6", textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#1D4ED8" }}>{isNaN(c2) ? "—" : c2.toFixed(3)}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1E3A5F", marginTop: 4 }}>Final Concentration C₂</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 6 }}>C₂ = C₁ × V₁ / V₂ = {c1} × {v1} / {v2}</div>
          </div>
        </div>
      )}

      {calcType === "bod" && (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>BOD₅ Calculation</h3>
          <p style={{ fontSize: 12, color: "#64748B", marginBottom: 20 }}>Biochemical Oxygen Demand over 5 days at 20°C. Key wastewater treatment performance metric.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
            {[["Initial DO (mg/L)", initialDO, setInitialDO], ["Final DO after 5 days (mg/L)", finalDO, setFinalDO], ["Dilution Factor", dilutionFactor, setDilutionFactor]].map(([label, val, set]) => (
              <div key={label as string}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>{label as string}</label>
                <input type="number" value={val as string} onChange={e => (set as (v: string) => void)(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #E2E8F0", fontSize: 14, fontWeight: 600, color: "#0F172A", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
          </div>
          <div style={{ background: "#F0FDF4", borderRadius: 14, padding: "20px", border: "2px solid #22C55E", textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#059669" }}>{isNaN(bod) ? "—" : `${bod.toFixed(1)} mg/L`}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#15803D", marginTop: 4 }}>BOD₅</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 6 }}>BOD₅ = (DO_initial − DO_final) × Dilution Factor</div>
            <div style={{ fontSize: 11, color: "#374151", marginTop: 8 }}>
              {bod > 200 ? "🔴 High BOD — typical of raw municipal wastewater (150–300 mg/L)" :
               bod > 25 ? "🟡 Moderate BOD — may not meet O. Reg. 129/04 effluent limit of 25 mg/L" :
               "🟢 Low BOD — meets typical secondary treatment effluent standard (≤25 mg/L)"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Lab() {
  const [activeTab, setActiveTab] = useState<Tab>("sampling");

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Sora', sans-serif" }}>
      <style>{`@keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }`}</style>

      <SiteNav currentPath="/lab" />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px 80px", animation: "fadeUp 0.3s ease both" }}>

        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg, #0F766E, #1D4ED8)", borderRadius: 20, padding: "28px 32px", marginBottom: 24, color: "#fff" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>🔬 Lab & Sampling Module</h1>
          <p style={{ fontSize: 13, opacity: 0.9, margin: 0, lineHeight: 1.6 }}>
            Sampling procedures, chain of custody forms, QA/QC controls, parameter reference table, and lab calculators — everything you need for the lab section of your certification exam.
          </p>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {TABS.map(({ id, label, icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              style={{ padding: "10px 18px", borderRadius: 20, border: `2px solid ${activeTab === id ? "#0F766E" : "#E2E8F0"}`, background: activeTab === id ? "#CCFBF1" : "#fff", color: activeTab === id ? "#0F766E" : "#64748B", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div key={activeTab} style={{ animation: "fadeUp 0.25s ease both" }}>

          {/* SAMPLING PROCEDURES */}
          {activeTab === "sampling" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {SAMPLING_PROCEDURES.map((proc) => (
                <div key={proc.title} style={{ background: "#fff", borderRadius: 20, padding: "28px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: proc.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{proc.icon}</div>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>{proc.title}</h3>
                      <div style={{ fontSize: 11, color: proc.color, fontWeight: 600, background: proc.bg, display: "inline-block", padding: "2px 8px", borderRadius: 20 }}>{proc.regulation}</div>
                    </div>
                  </div>
                  <ol style={{ margin: "0 0 16px", paddingLeft: 20 }}>
                    {proc.steps.map((step, i) => (
                      <li key={i} style={{ fontSize: 12, color: "#374151", lineHeight: 1.7, marginBottom: 4 }}>{step}</li>
                    ))}
                  </ol>
                  <div style={{ background: "#EFF6FF", borderRadius: 10, padding: "10px 14px", borderLeft: "3px solid #3B82F6" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#1D4ED8" }}>💡 EXAM TIP  </span>
                    <span style={{ fontSize: 11, color: "#1E3A5F" }}>{proc.examTip}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CHAIN OF CUSTODY */}
          {activeTab === "coc" && (
            <div style={{ background: "#fff", borderRadius: 20, padding: "32px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
              <ChainOfCustody />
            </div>
          )}

          {/* QA/QC */}
          {activeTab === "qaqc" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {QAQC_CONTROLS.map((ctrl) => (
                <div key={ctrl.name} style={{ background: "#fff", borderRadius: 16, padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 24 }}>{ctrl.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>{ctrl.name}</div>
                      <div style={{ fontSize: 11, color: ctrl.color, fontWeight: 600 }}>{ctrl.frequency}</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", marginBottom: 4 }}>PURPOSE</div>
                      <div style={{ fontSize: 12, color: "#374151" }}>{ctrl.purpose}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", marginBottom: 4 }}>HOW TO PREPARE</div>
                      <div style={{ fontSize: 12, color: "#374151" }}>{ctrl.how}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 12, background: "#F0FDF4", borderRadius: 8, padding: "8px 12px", border: "1px solid #BBF7D0" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#15803D" }}>✓ PASS/FAIL: </span>
                    <span style={{ fontSize: 11, color: "#374151" }}>{ctrl.passFailCriteria}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PARAMETER REFERENCE */}
          {activeTab === "parameters" && (
            <div style={{ background: "#fff", borderRadius: 20, padding: "28px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", overflowX: "auto" }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: "0 0 20px" }}>📊 Ontario Drinking Water & Wastewater Parameter Reference</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, minWidth: 800 }}>
                <thead>
                  <tr style={{ background: "#F8FAFC" }}>
                    {["Parameter", "Unit", "MAC", "AO/Target", "Ontario Standard", "Method", "Hold Time", "Preservation", "Container"].map(h => (
                      <th key={h} style={{ padding: "10px 10px", textAlign: "left", fontWeight: 700, color: "#64748B", borderBottom: "2px solid #E2E8F0", fontSize: 10, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PARAMETERS.map((p, i) => (
                    <>
                      <tr key={p.name} style={{ borderBottom: "1px solid #F1F5F9", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                        <td style={{ padding: "10px", fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap" }}>{p.name}</td>
                        <td style={{ padding: "10px", color: "#374151", fontFamily: "monospace" }}>{p.unit}</td>
                        <td style={{ padding: "10px", color: p.mac !== "—" ? "#DC2626" : "#94A3B8", fontWeight: p.mac !== "—" ? 700 : 400 }}>{p.mac}</td>
                        <td style={{ padding: "10px", color: "#374151" }}>{p.ao}</td>
                        <td style={{ padding: "10px", color: "#1D4ED8", fontWeight: 600 }}>{p.ontario}</td>
                        <td style={{ padding: "10px", color: "#374151" }}>{p.method}</td>
                        <td style={{ padding: "10px", color: "#374151", whiteSpace: "nowrap" }}>{p.holdTime}</td>
                        <td style={{ padding: "10px", color: "#374151" }}>{p.preservation}</td>
                        <td style={{ padding: "10px", color: "#374151" }}>{p.container}</td>
                      </tr>
                      <tr key={`${p.name}-note`} style={{ borderBottom: "2px solid #F1F5F9" }}>
                        <td colSpan={9} style={{ padding: "4px 10px 10px", fontSize: 10, color: "#64748B", fontStyle: "italic" }}>
                          💡 {p.examNote}
                        </td>
                      </tr>
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* LAB CALCULATORS */}
          {activeTab === "calc" && (
            <div style={{ background: "#fff", borderRadius: 20, padding: "32px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
              <LabCalculators />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
