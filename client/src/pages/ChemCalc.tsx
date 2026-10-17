// ECHELON — Chemical Feed Calculator Page
// Live dosing calculators for chlorine, alum, lime, fluoride, and polymer

import { useState } from "react";
import SiteNav from "@/components/SiteNav";
import GuideNav from "@/components/GuideNav";
import { getGuideResumeStep } from "@/hooks/useGuideProgress";
import { usePageMeta } from "@/hooks/usePageMeta";
import { calculateChlorine, formatChlorineValue, type ChlorineForm } from "@/lib/chlorineCalculation";
import { calculateAlum, calculateFluoride, calculateLime, calculatePolymer } from "@/lib/chemicalFeedCalculation";

type Tab = "chlorine" | "alum" | "lime" | "fluoride" | "polymer";

const TABS: { id: Tab; label: string; icon: string; color: string }[] = [
  { id: "chlorine", label: "Chlorine", icon: "🟡", color: "#D97706" },
  { id: "alum",     label: "Alum",     icon: "🔵", color: "#1D4ED8" },
  { id: "lime",     label: "Lime",     icon: "⚪", color: "#64748B" },
  { id: "fluoride", label: "Fluoride", icon: "🟢", color: "#059669" },
  { id: "polymer",  label: "Polymer",  icon: "🟣", color: "#7C3AED" },
];

function round(n: number, d = 2) {
  return formatChlorineValue(n, d);
}

// ── CHLORINE CALCULATOR ──
function ChlorineCalc() {
  const [flow, setFlow] = useState("10000"); // m³/day
  const [dose, setDose] = useState("2.5");   // mg/L
  const [purity, setPurity] = useState("65"); // % available Cl₂ (HTH granular)
  const [form, setForm] = useState<ChlorineForm>("granular");
  const result = calculateChlorine({ flow, dose, granularPurity: purity, form });

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 16, marginBottom: 24 }}>
        <div>
          <label htmlFor="chlorine-flow" style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>Flow Rate (m³/day)</label>
          <input id="chlorine-flow" type="number" min="0" step="any" value={flow} onChange={e => setFlow(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #E2E8F0", fontSize: 14, fontWeight: 600, color: "#0F172A", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div>
          <label htmlFor="chlorine-dose" style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>Target Dose (mg/L)</label>
          <input id="chlorine-dose" type="number" min="0" step="any" value={dose} onChange={e => setDose(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #E2E8F0", fontSize: 14, fontWeight: 600, color: "#0F172A", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div>
          <label htmlFor="chem-form-select" style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>Chemical Form</label>
          <select id="chem-form-select" value={form} onChange={e => setForm(e.target.value as typeof form)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #E2E8F0", fontSize: 13, fontWeight: 600, color: "#0F172A", fontFamily: "inherit", background: "#fff", boxSizing: "border-box" }}>
            <option value="gas">Chlorine Gas (99.5% Cl₂)</option>
            <option value="liquid">Sodium Hypochlorite (12.5%)</option>
            <option value="granular">HTH Granular (65% Cl₂)</option>
          </select>
        </div>
        <div>
          <label htmlFor="chlorine-purity" style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>
            Available Cl₂ (%) — {form === "gas" ? "99.5" : form === "liquid" ? "12.5" : "65"}% typical
          </label>
          <input id="chlorine-purity" type="number" min="0" max="100" step="any" value={form === "gas" ? "99.5" : form === "liquid" ? "12.5" : purity}
            onChange={e => setPurity(e.target.value)}
            disabled={form !== "granular"}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #E2E8F0", fontSize: 14, fontWeight: 600, color: "#0F172A", fontFamily: "inherit", outline: "none", background: form !== "granular" ? "#F8FAFC" : "#fff", boxSizing: "border-box" }} />
        </div>
      </div>

      {!result && <p role="status" style={{ color: "#9A3412", fontSize: 13 }}>
        Enter finite positive flow and dose values, and an available Cl₂ purity greater than 0% and at most 100%. Values must produce finite positive results.
      </p>}
      {result && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))", gap: 12 }}>
          {[
            { label: "Active Cl₂ Mass Needed", value: `${formatChlorineValue(result.activeMassKgDay)} kg/day`, sub: `${formatChlorineValue(result.activeMassGDay)} g/day as Cl₂`, color: "#D97706" },
            { label: form === "liquid" ? "Hypochlorite Volume" : "Product Mass", value: form === "liquid" ? `${formatChlorineValue(result.liquidVolumeLDay!)} L/day` : `${formatChlorineValue(result.productMassKgDay)} kg/day`, sub: form === "liquid" ? `${formatChlorineValue(result.liquidVolumeLDay! / 24, 2)} L/hr` : `${formatChlorineValue(result.productMassKgDay / 24, 3)} kg/hr`, color: "#1D4ED8" },
            { label: form === "liquid" ? "Solution Feed Rate" : form === "granular" ? "Dry Product Feed Rate" : "Gas Product Feed Rate", value: form === "liquid" ? `${formatChlorineValue(result.liquidFeedMlMin!)} mL/min` : `${formatChlorineValue(result.productFeedGMin)} g/min`, sub: "continuous product feed", color: "#059669" },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{ background: "#F8FAFC", borderRadius: 14, padding: "20px 16px", border: `2px solid ${color}33`, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color }}>{value}</div>
              <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 4 }}>{sub}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 20, background: "#FFF7ED", borderRadius: 12, padding: "14px 18px", border: "1px solid #FED7AA" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#C2410C", marginBottom: 6 }}>📐 Formula</div>
        <div style={{ fontFamily: "monospace", fontSize: 12, color: "#78350F", lineHeight: 1.8, overflowWrap: "anywhere" }}>
          Active Cl₂ (kg/day) = Flow (m³/day) × Dose (mg/L) × 1000 (L/m³) ÷ 1,000,000 (mg/kg)<br/>
          {form === "liquid" ? <>
            Solution (L/day) = Active Cl₂ (kg/day) ÷ (1.2 kg/L × 0.125)<br/>
            12.5% w/w available Cl₂; assumed solution density 1.2 kg/L<br/>
            Solution Feed (mL/min) = Solution (L/day) × 1000 (mL/L) ÷ 1440 (min/day)
          </> : <>
            Product (kg/day) = Active Cl₂ (kg/day) ÷ {form === "gas" ? "0.995 (99.5% purity)" : "(entered available Cl₂ % ÷ 100)"}<br/>
            {form === "granular" ? "Dry Product" : "Gas Product"} Feed (g/min) = Product (kg/day) × 1000 (g/kg) ÷ 1440 (min/day)
          </>}
        </div>
        <p style={{ fontSize: 11, color: "#9A3412", margin: "10px 0 0", lineHeight: 1.6 }}>
          Educational calculation tool using the stated assumptions. Results are for learning, not operational dosing instructions.
        </p>
      </div>
    </div>
  );
}

// ── ALUM CALCULATOR ──
function AlumCalc() {
  const [flow, setFlow] = useState("10000");
  const [dose, setDose] = useState("30"); // mg/L as Al₂(SO₄)₃
  const [conc, setConc] = useState("48"); // % liquid alum (48% = 480 g/L)
  const result = calculateAlum({ flow, dose, concentration: conc });

  return (
    <div>
      <div className="chemcalc-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
        {[
          { id: "alum-flow", label: "Flow Rate (m³/day)", val: flow, set: setFlow },
          { id: "alum-dose", label: "Alum Dose (mg/L)", val: dose, set: setDose },
          { id: "alum-concentration", label: "Liquid Alum Conc. (%)", val: conc, set: setConc },
        ].map(({ id, label, val, set }) => (
          <div key={label}>
            <label htmlFor={id} style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>{label}</label>
            <input id={id} type="number" min="0" step="any" value={val} onChange={e => set(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #E2E8F0", fontSize: 14, fontWeight: 600, color: "#0F172A", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </div>
        ))}
      </div>

      {!result && <p role="status" style={{ color: "#9A3412", fontSize: 13 }}>Enter finite positive flow, dose, and liquid alum concentration values at or below 100%.</p>}
      {result && (
        <>
          <div className="chemcalc-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 12 }}>
            {[
              { label: "Alum Mass Needed", value: `${round(result.massNeededKgDay)} kg/day`, sub: `${round(result.massNeededKgDay / 24, 2)} kg/hr`, color: "#1D4ED8" },
              { label: "Liquid Volume", value: `${round(result.volumeNeededLDay)} L/day`, sub: `${round(result.feedRateMlMin)} mL/min`, color: "#7C3AED" },
            ].map(({ label, value, sub, color }) => (
              <div key={label} style={{ background: "#F8FAFC", borderRadius: 14, padding: "20px 16px", border: `2px solid ${color}33`, textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color }}>{value}</div>
                <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 4 }}>{sub}</div>
              </div>
            ))}
          </div>
          <div className="chemcalc-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            <div style={{ background: "#FFF7ED", borderRadius: 14, padding: "16px", border: "1px solid #FED7AA" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#C2410C", marginBottom: 4 }}>⚠️ Alkalinity Consumed</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#D97706" }}>{round(result.alkalinityConsumedMgL)} mg/L as CaCO₃</div>
              <div style={{ fontSize: 10, color: "#92400E", marginTop: 4 }}>May need lime addition if alkalinity &lt; 50 mg/L</div>
            </div>
            <div style={{ background: "#F0FDF4", borderRadius: 14, padding: "16px", border: "1px solid #BBF7D0" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#15803D", marginBottom: 4 }}>🧱 Sludge Produced</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#059669" }}>{round(result.sludgeKgDay)} kg dry/day</div>
              <div style={{ fontSize: 10, color: "#166534", marginTop: 4 }}>~0.44 kg dry solids per kg alum dosed</div>
            </div>
          </div>
        </>
      )}

      <div style={{ marginTop: 20, background: "#EFF6FF", borderRadius: 12, padding: "14px 18px", border: "1px solid #BFDBFE" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#1D4ED8", marginBottom: 6 }}>📌 Exam Tips</div>
        <div style={{ fontSize: 11, color: "#1E3A5F", lineHeight: 1.8 }}>
          • Typical alum dose: 10–50 mg/L for surface water coagulation<br/>
          • Optimal pH for alum coagulation: 6.5–7.5<br/>
          • Each mg/L alum consumes ~0.5 mg/L alkalinity as CaCO₃<br/>
          • Jar testing determines optimal dose for each raw water
        </div>
      </div>
    </div>
  );
}

// ── LIME CALCULATOR ──
function LimeCalc() {
  const [flow, setFlow] = useState("10000");
  const [currentAlk, setCurrentAlk] = useState("80"); // mg/L as CaCO₃
  const [purity, setPurity] = useState("90"); // % CaO
  // This educational estimate deliberately uses a fixed target rather than
  // pretending that pH alone determines a lime dose.
  const targetAlkalinity = "100";
  const result = calculateLime({ flow, currentAlkalinity: currentAlk, targetAlkalinity, purity });

  return (
    <div>
      <div className="chemcalc-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {[
          { id: "lime-flow", label: "Flow Rate (m³/day)", val: flow, set: setFlow },
          { id: "lime-current-alkalinity", label: "Current Alkalinity (mg/L as CaCO₃)", val: currentAlk, set: setCurrentAlk },
          { id: "lime-purity", label: "Lime Purity (% CaO)", val: purity, set: setPurity },
        ].map(({ id, label, val, set }) => (
          <div key={label}>
            <label htmlFor={id} style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>{label}</label>
            <input id={id} type="number" min="0" step="any" value={val} onChange={e => set(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #E2E8F0", fontSize: 14, fontWeight: 600, color: "#0F172A", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </div>
        ))}
      </div>

      <p style={{ color: "#475569", fontSize: 12, margin: "0 0 16px" }}>Educational alkalinity-deficit estimate using a fixed target of 100 mg/L as CaCO₃.</p>
      <div style={{ color: "#475569", fontSize: 12, marginBottom: 16, lineHeight: 1.8 }}>
        Product dose (mg/L) = max(0, 100 − current alkalinity as CaCO₃) × 0.56 ÷ (CaO purity % / 100).<br/>
        Product mass (kg/day) = Flow (m³/day) × Product dose (mg/L) ÷ 1000.<br/>
        CaO/CaCO₃ = 56/100 = 0.56; hydrated lime uses 74/100, not the CaO factor. Source: <a href="https://www.mrwa.com/wp-content/uploads/2021/04/16-Lime-Softening.pdf#page=6" target="_blank" rel="noopener noreferrer">MRWA Lime Softening, page 6</a>.<br/>
        Educational estimate only — not a complete softening demand, design calculation, or operational dosing instruction.
      </div>
      {!result && <p role="status" style={{ color: "#9A3412", fontSize: 13 }}>Enter finite values: positive flow and lime purity at or below 100%; current alkalinity may be zero.</p>}
      {result && result.alkalinityDeficitMgL > 0 && (
        <div className="chemcalc-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { label: "Lime Dose", value: `${round(result.limeDoseMgL)} mg/L`, sub: "CaO product at entered purity", color: "#64748B" },
            { label: "Lime Mass", value: `${round(result.limeMassKgDay)} kg/day`, sub: `${round(result.limeMassKgDay / 24, 2)} kg/hr`, color: "#1D4ED8" },
            { label: "Feed Rate", value: `${round(result.feedRateGMin)} g/min`, sub: "dry feeder", color: "#059669" },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{ background: "#F8FAFC", borderRadius: 14, padding: "20px 16px", border: `2px solid ${color}33`, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color }}>{value}</div>
              <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 4 }}>{sub}</div>
            </div>
          ))}
        </div>
      )}

      {result && result.alkalinityDeficitMgL <= 0 && (
        <div style={{ background: "#F0FDF4", borderRadius: 12, padding: "16px 20px", border: "1px solid #BBF7D0", textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#15803D" }}>No alkalinity deficit in this educational estimate</div>
          <div style={{ fontSize: 11, color: "#166534", marginTop: 4 }}>Current alkalinity ({currentAlk} mg/L) meets or exceeds the 100 mg/L target</div>
        </div>
      )}

      <div style={{ marginTop: 20, background: "#F8FAFC", borderRadius: 12, padding: "14px 18px", border: "1px solid #E2E8F0" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6 }}>📌 Exam Tips</div>
        <div style={{ fontSize: 11, color: "#374151", lineHeight: 1.8 }}>
          • Lime raises pH and alkalinity — used for corrosion control and softening<br/>
          • CaO (quicklime) is more reactive than Ca(OH)₂ (hydrated lime)<br/>
          • Target alkalinity for corrosion control: 80–120 mg/L as CaCO₃<br/>
          • Lime softening removes hardness (Ca²⁺, Mg²⁺) at pH &gt; 10
        </div>
      </div>
    </div>
  );
}

// ── FLUORIDE CALCULATOR ──
function FluorideCalc() {
  const [flow, setFlow] = useState("10000");
  const [existing, setExisting] = useState("0.1"); // mg/L F⁻
  const [target, setTarget] = useState("0.7");     // mg/L F⁻
  const [chemical, setChemical] = useState<"hfs" | "naf" | "fsa">("hfs");

  // Chemical properties
  const chemicals = {
    hfs: { name: "Hydrofluosilicic Acid (H₂SiF₆)", conc: 0.23, density: 1.22 },
    naf: { name: "Sodium Fluoride (NaF)", conc: 0.45, density: 1.0 },
    fsa: { name: "Sodium Fluorosilicate (Na₂SiF₆)", conc: 0.607, density: 1.0 },
  };

  const chem = chemicals[chemical];
  const result = calculateFluoride({ flow, existing, target, concentration: chem.conc, density: chem.density, form: chemical === "hfs" ? "liquid" : "dry" });

  return (
    <div>
      <div className="chemcalc-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div>
          <label htmlFor="fluoride-flow" style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>Flow Rate (m³/day)</label>
          <input id="fluoride-flow" type="number" min="0" step="any" value={flow} onChange={e => setFlow(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #E2E8F0", fontSize: 14, fontWeight: 600, color: "#0F172A", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div>
          <label htmlFor="fluoride-chem-select" style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>Fluoride Chemical</label>
          <select id="fluoride-chem-select" value={chemical} onChange={e => setChemical(e.target.value as typeof chemical)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #E2E8F0", fontSize: 12, fontWeight: 600, color: "#0F172A", fontFamily: "inherit", background: "#fff", boxSizing: "border-box" }}>
            <option value="hfs">Hydrofluosilicic Acid (23% F)</option>
            <option value="naf">Sodium Fluoride (45% F)</option>
            <option value="fsa">Sodium Fluorosilicate (60.7% F)</option>
          </select>
        </div>
        <div>
          <label htmlFor="fluoride-existing" style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>Existing Fluoride (mg/L)</label>
          <input id="fluoride-existing" type="number" min="0" step="any" value={existing} onChange={e => setExisting(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #E2E8F0", fontSize: 14, fontWeight: 600, color: "#0F172A", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div>
          <label htmlFor="fluoride-target" style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>Target Fluoride (mg/L); Ontario: 0.7 mg/L</label>
          <input id="fluoride-target" type="number" min="0" step="any" value={target} onChange={e => setTarget(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #E2E8F0", fontSize: 14, fontWeight: 600, color: "#0F172A", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </div>
      </div>

      <p style={{ color: "#475569", fontSize: 12, lineHeight: 1.8 }}>
        Educational mass basis: the listed percentages are elemental F by product mass (23% F for the liquid option, not 23% H₂SiF₆). Product (kg/day) = F mass (kg/day) ÷ F mass fraction.<br/>
        {chemical === "hfs" ? "Liquid volume (L/day) = product (kg/day) ÷ 1.22 kg/L; feed (mL/min) = volume × 1000 ÷ 1440." : "Dry product feed (g/min) = product (kg/day) × 1000 ÷ 1440; no solution volume or bulk density is assumed."}
      </p>
      {result && <div style={{ background: "#F0FDF4", borderRadius: 12, padding: "12px 16px", marginBottom: 16, border: "1px solid #BBF7D0" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#15803D" }}>Fluoride Dose Required: </span>
        <span style={{ fontSize: 14, fontWeight: 900, color: "#059669" }}>{round(result.doseMgL, 3)} mg/L F⁻</span>
        <span style={{ fontSize: 11, color: "#166534", marginLeft: 8 }}>({target} − {existing} mg/L)</span>
      </div>}

      {!result && <p role="status" style={{ color: "#9A3412", fontSize: 13 }}>Enter finite positive flow and target values, plus a finite existing fluoride value of zero or more.</p>}
      {result && result.doseMgL > 0 && (
        <div className="chemcalc-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { label: "F⁻ Mass Needed", value: `${round(result.massFKgDay * 1000)} g/day`, sub: `${round(result.massFKgDay, 3)} kg/day`, color: "#059669" },
            { label: chemical === "hfs" ? "Chemical Volume" : "Chemical Mass", value: `${round(result.productAmountDay)} ${result.productUnit}`, sub: chem.name.split(" (")[0], color: "#1D4ED8" },
            { label: chemical === "hfs" ? "Solution Feed Rate" : "Dry Product Feed Rate", value: `${round(result.feedRatePerMin)} ${result.feedRateUnit}`, sub: chemical === "hfs" ? "metering pump" : "dry feeder", color: "#7C3AED" },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{ background: "#F8FAFC", borderRadius: 14, padding: "20px 16px", border: `2px solid ${color}33`, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color }}>{value}</div>
              <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 4 }}>{sub}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 20, background: "#ECFDF5", borderRadius: 12, padding: "14px 18px", border: "1px solid #A7F3D0" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#065F46", marginBottom: 6 }}>📌 Ontario Fluoride Standards</div>
        <div style={{ fontSize: 11, color: "#065F46", lineHeight: 1.8 }}>
          • Ontario target: 0.7 mg/L (Health Canada guideline)<br/>
          • MAC: 1.5 mg/L (O. Reg. 169/03)<br/>
          • Aesthetic objective: 1.0 mg/L<br/>
          • Most common chemical: Hydrofluosilicic acid (H₂SiF₆) — liquid, easier to handle
        </div>
      </div>
    </div>
  );
}

// ── POLYMER CALCULATOR ──
function PolymerCalc() {
  const [flow, setFlow] = useState("10000");
  const [dose, setDose] = useState("0.5"); // mg/L
  const [stockConc, setStockConc] = useState("0.5"); // % stock solution

  const result = calculatePolymer({ flow, dose, stockConcentration: stockConc });

  return (
    <div>
      <div className="chemcalc-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
        {[
          { id: "polymer-flow", label: "Flow Rate (m³/day)", val: flow, set: setFlow },
          { id: "polymer-dose", label: "Polymer Dose (mg/L)", val: dose, set: setDose },
          { id: "polymer-concentration", label: "Stock Solution Conc. (%)", val: stockConc, set: setStockConc },
        ].map(({ id, label, val, set }) => (
          <div key={label}>
            <label htmlFor={id} style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>{label}</label>
            <input id={id} type="number" min="0" step="any" value={val} onChange={e => set(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #E2E8F0", fontSize: 14, fontWeight: 600, color: "#0F172A", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </div>
        ))}
      </div>

      {!result && <p role="status" style={{ color: "#9A3412", fontSize: 13 }}>Enter finite positive flow, polymer dose, and stock concentration values at or below 100%.</p>}
      {result && (
        <div className="chemcalc-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { label: "Polymer Mass", value: `${round(result.massNeededGDay)} g/day`, sub: `${round(result.massNeededKgDay, 3)} kg/day`, color: "#7C3AED" },
            { label: "Stock Solution", value: `${round(result.stockVolumeLDay)} L/day`, sub: `at ${stockConc}% concentration`, color: "#1D4ED8" },
            { label: "Feed Rate", value: `${round(result.feedRateMlMin)} mL/min`, sub: "metering pump", color: "#059669" },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{ background: "#F8FAFC", borderRadius: 14, padding: "20px 16px", border: `2px solid ${color}33`, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color }}>{value}</div>
              <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 4 }}>{sub}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 20, background: "#F5F3FF", borderRadius: 12, padding: "14px 18px", border: "1px solid #DDD6FE" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#5B21B6", marginBottom: 6 }}>📌 Polymer Application Tips</div>
        <div style={{ fontSize: 11, color: "#4C1D95", lineHeight: 1.8 }}>
          • Typical dose: 0.1–2 mg/L (cationic polymer as coagulant aid)<br/>
          • Always dilute to 0.1–0.5% before feeding — never feed neat<br/>
          • Add polymer AFTER primary coagulant (alum/ferric) for best results<br/>
          • Over-dosing can cause charge reversal and re-stabilize floc
        </div>
      </div>
    </div>
  );
}

export default function ChemCalc() {
  usePageMeta({
    title: "Chemical Calculator",
    description: "Water and wastewater chemical dosage calculator. Calculate chlorine dosing, chemical feed rates, and more.",
    noindex: true
  });

  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const resumeId = getGuideResumeStep("chemical-feed", TABS.map((tab) => tab.id));
    return (resumeId as Tab | null) ?? "chlorine";
  });

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Sora', sans-serif" }}>
      <style>{`
        .chemcalc-grid-2 > *, .chemcalc-grid-3 > * { min-width: 0; overflow-wrap: anywhere; }
        .chemcalc-table-wrap { max-width: 100%; overflow-x: auto; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @media (max-width: 640px) {
          .chemcalc-main { padding: 16px 14px 60px !important; }
          .chemcalc-grid-2 { grid-template-columns: 1fr !important; }
          .chemcalc-grid-3 { grid-template-columns: 1fr !important; }
          .chemcalc-card { padding: 20px 16px !important; }
          .chemcalc-table-wrap { overflow-x: auto; }
          .chemcalc-hero { padding: 20px 18px !important; }
        }
      `}</style>

      <SiteNav currentPath="/chem-calc" />
      <GuideNav
        guideId="chemical-feed"
        currentStepId={activeTab}
        currentStepLabel={TABS.find((tab) => tab.id === activeTab)?.label ?? "Chlorine"}
        totalSteps={TABS.length}
      />

      <div className="chemcalc-main" style={{ maxWidth: 800, margin: "0 auto", padding: "28px 20px 80px", animation: "fadeUp 0.3s ease both" }}>

        {/* Hero */}
        <div className="chemcalc-hero" style={{ background: "linear-gradient(135deg, #1D4ED8, #0F766E)", borderRadius: 20, padding: "28px 32px", marginBottom: 24, color: "#fff" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>🧪 Chemical Feed Calculator</h1>
          <p style={{ fontSize: 13, opacity: 0.9, margin: 0, lineHeight: 1.6 }}>
            Live dosing calculations for all major water treatment chemicals. Enter your flow rate and target dose — get feed rates instantly.
          </p>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {TABS.map(({ id, label, icon, color }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                padding: "10px 18px", borderRadius: 20,
                border: `2px solid ${activeTab === id ? color : "#E2E8F0"}`,
                background: activeTab === id ? `${color}15` : "#fff",
                color: activeTab === id ? color : "#64748B",
                fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Calculator card */}
        <div className="chemcalc-card" style={{ background: "#fff", borderRadius: 20, padding: "32px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", animation: "fadeUp 0.25s ease both" }} key={activeTab}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: "0 0 24px" }}>
            {TABS.find(t => t.id === activeTab)?.icon} {TABS.find(t => t.id === activeTab)?.label} Calculator
          </h2>
          {activeTab === "chlorine"  && <ChlorineCalc />}
          {activeTab === "alum"      && <AlumCalc />}
          {activeTab === "lime"      && <LimeCalc />}
          {activeTab === "fluoride"  && <FluorideCalc />}
          {activeTab === "polymer"   && <PolymerCalc />}
        </div>

        {/* Quick reference table */}
        <div className="chemcalc-card" style={{ background: "#fff", borderRadius: 20, padding: "28px 32px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", marginTop: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: "0 0 16px" }}>📋 Typical Dose Ranges — Quick Reference</h2>
          <div className="chemcalc-table-wrap">
          <table style={{ width: "100%", minWidth: 620, borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {["Chemical", "Typical Dose", "Purpose", "pH Range", "Key Note"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#64748B", borderBottom: "2px solid #E2E8F0", fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Chlorine (Cl₂)", "1–5 mg/L", "Disinfection", "6.5–8.5", "CT value determines effectiveness"],
                ["Alum Al₂(SO₄)₃", "10–50 mg/L", "Coagulation", "6.5–7.5", "Consumes alkalinity"],
                ["Ferric Chloride", "5–30 mg/L", "Coagulation", "5.0–7.0", "Wider pH range than alum"],
                ["Lime (CaO)", "5–50 mg/L", "pH/Alk adjust", "8.0–9.5", "Raises pH and alkalinity"],
                ["Fluoride (H₂SiF₆)", "0.3–0.8 mg/L", "Dental health", "Any", "Ontario target: 0.7 mg/L"],
                ["Polymer (cationic)", "0.1–2 mg/L", "Coagulant aid", "Any", "Always dilute before feeding"],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: "10px 12px", color: j === 0 ? "#0F172A" : "#374151", fontWeight: j === 0 ? 700 : 400 }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
}
