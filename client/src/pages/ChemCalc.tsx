// ECHELON — Chemical Feed Calculator Page
// Live dosing calculators for chlorine, alum, lime, fluoride, and polymer

import { useState } from "react";
import { Link } from "wouter";

const NAV_LINKS = [
  { href: "/", label: "🎯 AI Tutor" },
  { href: "/process", label: "🔬 Drinking Water" },
  { href: "/wastewater", label: "🔩 Wastewater" },
  { href: "/career", label: "🗺️ Career Map" },
  { href: "/pumping", label: "⚙️ Pumping" },
  { href: "/mock-exam", label: "📝 Mock Exam" },
  { href: "/chem-calc", label: "🧪 Chem Calc" },
  { href: "/lab", label: "🔬 Lab" },
];

type Tab = "chlorine" | "alum" | "lime" | "fluoride" | "polymer";

const TABS: { id: Tab; label: string; icon: string; color: string }[] = [
  { id: "chlorine", label: "Chlorine", icon: "🟡", color: "#D97706" },
  { id: "alum",     label: "Alum",     icon: "🔵", color: "#1D4ED8" },
  { id: "lime",     label: "Lime",     icon: "⚪", color: "#64748B" },
  { id: "fluoride", label: "Fluoride", icon: "🟢", color: "#059669" },
  { id: "polymer",  label: "Polymer",  icon: "🟣", color: "#7C3AED" },
];

function round(n: number, d = 2) {
  return Math.round(n * 10 ** d) / 10 ** d;
}

// ── CHLORINE CALCULATOR ──
function ChlorineCalc() {
  const [flow, setFlow] = useState("10000"); // m³/day
  const [dose, setDose] = useState("2.5");   // mg/L
  const [purity, setPurity] = useState("65"); // % available Cl₂ (HTH granular)
  const [form, setForm] = useState<"gas" | "liquid" | "granular">("granular");

  const flowNum = parseFloat(flow) || 0;
  const doseNum = parseFloat(dose) || 0;
  const purityNum = parseFloat(purity) / 100 || 1;

  // Mass of Cl₂ needed (g/day)
  const massNeeded_g = flowNum * 1000 * doseNum / 1000; // L × mg/L = mg → /1000 = g
  const massNeeded_kg = massNeeded_g / 1000;

  // Product mass needed (accounting for purity)
  const productMass_kg = massNeeded_kg / purityNum;

  // For liquid sodium hypochlorite (12.5% = 125 g/L, density ~1.2 kg/L)
  const hypoDensity = 1.2; // kg/L
  const hypoConc = 0.125; // 12.5% w/w
  const hypoVolume_L = productMass_kg / (hypoDensity * hypoConc);

  // Feed rate (g/min or mL/min)
  const feedRate_gMin = massNeeded_g / (24 * 60);
  const feedRate_mLMin = form === "liquid" ? (hypoVolume_L * 1000) / (24 * 60) : 0;

  const isValid = flowNum > 0 && doseNum > 0 && purityNum > 0;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>Flow Rate (m³/day)</label>
          <input type="number" value={flow} onChange={e => setFlow(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #E2E8F0", fontSize: 14, fontWeight: 600, color: "#0F172A", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>Target Dose (mg/L)</label>
          <input type="number" value={dose} onChange={e => setDose(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #E2E8F0", fontSize: 14, fontWeight: 600, color: "#0F172A", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>Chemical Form</label>
          <select value={form} onChange={e => setForm(e.target.value as typeof form)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #E2E8F0", fontSize: 13, fontWeight: 600, color: "#0F172A", fontFamily: "inherit", background: "#fff", boxSizing: "border-box" }}>
            <option value="gas">Chlorine Gas (99.5% Cl₂)</option>
            <option value="liquid">Sodium Hypochlorite (12.5%)</option>
            <option value="granular">HTH Granular (65% Cl₂)</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>
            Available Cl₂ (%) — {form === "gas" ? "99.5" : form === "liquid" ? "12.5" : "65"}% typical
          </label>
          <input type="number" value={form === "gas" ? "99.5" : form === "liquid" ? "12.5" : purity}
            onChange={e => setPurity(e.target.value)}
            disabled={form !== "granular"}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #E2E8F0", fontSize: 14, fontWeight: 600, color: "#0F172A", fontFamily: "inherit", outline: "none", background: form !== "granular" ? "#F8FAFC" : "#fff", boxSizing: "border-box" }} />
        </div>
      </div>

      {isValid && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { label: "Cl₂ Mass Needed", value: `${round(massNeeded_kg)} kg/day`, sub: `${round(massNeeded_g)} g/day`, color: "#D97706" },
            { label: form === "liquid" ? "Hypochlorite Volume" : "Product Mass", value: form === "liquid" ? `${round(hypoVolume_L)} L/day` : `${round(productMass_kg)} kg/day`, sub: form === "liquid" ? `${round(hypoVolume_L / 24, 2)} L/hr` : `${round(productMass_kg / 24, 3)} kg/hr`, color: "#1D4ED8" },
            { label: "Feed Rate", value: form === "liquid" ? `${round(feedRate_mLMin)} mL/min` : `${round(feedRate_gMin)} g/min`, sub: "continuous feed", color: "#059669" },
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
        <div style={{ fontFamily: "monospace", fontSize: 12, color: "#78350F", lineHeight: 1.8 }}>
          Mass (kg/day) = Flow (m³/day) × Dose (mg/L) × 1000 (L/m³) ÷ 1,000,000<br/>
          Product (kg/day) = Mass (kg/day) ÷ Purity (decimal)<br/>
          Feed Rate (g/min) = Mass (g/day) ÷ 1440 min/day
        </div>
      </div>
    </div>
  );
}

// ── ALUM CALCULATOR ──
function AlumCalc() {
  const [flow, setFlow] = useState("10000");
  const [dose, setDose] = useState("30"); // mg/L as Al₂(SO₄)₃
  const [conc, setConc] = useState("48"); // % liquid alum (48% = 480 g/L)

  const flowNum = parseFloat(flow) || 0;
  const doseNum = parseFloat(dose) || 0;
  const concNum = parseFloat(conc) / 100 || 0.48;
  const alumDensity = 1.33; // kg/L for 48% liquid alum

  const massNeeded_kg = (flowNum * 1000 * doseNum) / 1_000_000;
  const volumeNeeded_L = massNeeded_kg / (alumDensity * concNum);
  const feedRate_mLMin = (volumeNeeded_L * 1000) / 1440;

  // Alkalinity consumed: ~0.5 mg/L alkalinity per mg/L alum
  const alkConsumed = doseNum * 0.5;
  // Sludge produced: ~0.44 kg dry solids per kg alum
  const sludge_kg = massNeeded_kg * 0.44;

  const isValid = flowNum > 0 && doseNum > 0;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Flow Rate (m³/day)", val: flow, set: setFlow },
          { label: "Alum Dose (mg/L)", val: dose, set: setDose },
          { label: "Liquid Alum Conc. (%)", val: conc, set: setConc },
        ].map(({ label, val, set }) => (
          <div key={label}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>{label}</label>
            <input type="number" value={val} onChange={e => set(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #E2E8F0", fontSize: 14, fontWeight: 600, color: "#0F172A", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </div>
        ))}
      </div>

      {isValid && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 12 }}>
            {[
              { label: "Alum Mass Needed", value: `${round(massNeeded_kg)} kg/day`, sub: `${round(massNeeded_kg / 24, 2)} kg/hr`, color: "#1D4ED8" },
              { label: "Liquid Volume", value: `${round(volumeNeeded_L)} L/day`, sub: `${round(feedRate_mLMin)} mL/min`, color: "#7C3AED" },
            ].map(({ label, value, sub, color }) => (
              <div key={label} style={{ background: "#F8FAFC", borderRadius: 14, padding: "20px 16px", border: `2px solid ${color}33`, textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color }}>{value}</div>
                <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 4 }}>{sub}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            <div style={{ background: "#FFF7ED", borderRadius: 14, padding: "16px", border: "1px solid #FED7AA" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#C2410C", marginBottom: 4 }}>⚠️ Alkalinity Consumed</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#D97706" }}>{round(alkConsumed)} mg/L as CaCO₃</div>
              <div style={{ fontSize: 10, color: "#92400E", marginTop: 4 }}>May need lime addition if alkalinity &lt; 50 mg/L</div>
            </div>
            <div style={{ background: "#F0FDF4", borderRadius: 14, padding: "16px", border: "1px solid #BBF7D0" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#15803D", marginBottom: 4 }}>🧱 Sludge Produced</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#059669" }}>{round(sludge_kg)} kg dry/day</div>
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
  const [targetPH, setTargetPH] = useState("8.0");
  const [currentAlk, setCurrentAlk] = useState("80"); // mg/L as CaCO₃
  const [purity, setPurity] = useState("90"); // % CaO

  const flowNum = parseFloat(flow) || 0;
  const alkNum = parseFloat(currentAlk) || 0;
  const purityNum = parseFloat(purity) / 100 || 0.9;

  // Simplified: raise alkalinity by 20 mg/L per unit pH increase above 7
  // Lime dose ≈ alkalinity deficit × 0.74 (CaO/CaCO₃ ratio)
  const targetAlk = 100; // mg/L as CaCO₃ target
  const alkDeficit = Math.max(0, targetAlk - alkNum);
  const limeDose_mgL = alkDeficit * 0.74 / purityNum;
  const limeMass_kg = (flowNum * 1000 * limeDose_mgL) / 1_000_000;
  const feedRate_gMin = (limeMass_kg * 1000) / 1440;

  const isValid = flowNum > 0 && alkNum >= 0;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Flow Rate (m³/day)", val: flow, set: setFlow },
          { label: "Current Alkalinity (mg/L as CaCO₃)", val: currentAlk, set: setCurrentAlk },
          { label: "Target pH", val: targetPH, set: setTargetPH },
          { label: "Lime Purity (% CaO)", val: purity, set: setPurity },
        ].map(({ label, val, set }) => (
          <div key={label}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>{label}</label>
            <input type="number" value={val} onChange={e => set(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #E2E8F0", fontSize: 14, fontWeight: 600, color: "#0F172A", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </div>
        ))}
      </div>

      {isValid && alkDeficit > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { label: "Lime Dose", value: `${round(limeDose_mgL)} mg/L`, sub: "as CaO", color: "#64748B" },
            { label: "Lime Mass", value: `${round(limeMass_kg)} kg/day`, sub: `${round(limeMass_kg / 24, 2)} kg/hr`, color: "#1D4ED8" },
            { label: "Feed Rate", value: `${round(feedRate_gMin)} g/min`, sub: "dry feeder", color: "#059669" },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{ background: "#F8FAFC", borderRadius: 14, padding: "20px 16px", border: `2px solid ${color}33`, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color }}>{value}</div>
              <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 4 }}>{sub}</div>
            </div>
          ))}
        </div>
      )}

      {isValid && alkDeficit <= 0 && (
        <div style={{ background: "#F0FDF4", borderRadius: 12, padding: "16px 20px", border: "1px solid #BBF7D0", textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#15803D" }}>✓ Alkalinity is sufficient — no lime addition required</div>
          <div style={{ fontSize: 11, color: "#166534", marginTop: 4 }}>Current alkalinity ({currentAlk} mg/L) meets or exceeds target (100 mg/L)</div>
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

  const flowNum = parseFloat(flow) || 0;
  const existingNum = parseFloat(existing) || 0;
  const targetNum = parseFloat(target) || 0;
  const dose = Math.max(0, targetNum - existingNum);

  // Chemical properties
  const chemicals = {
    hfs: { name: "Hydrofluosilicic Acid (H₂SiF₆)", conc: 0.23, density: 1.22, unit: "L/day" },
    naf: { name: "Sodium Fluoride (NaF)", conc: 0.45, density: 1.0, unit: "kg/day" },
    fsa: { name: "Sodium Fluorosilicate (Na₂SiF₆)", conc: 0.607, density: 1.0, unit: "kg/day" },
  };

  const chem = chemicals[chemical];
  const massF_kg = (flowNum * 1000 * dose) / 1_000_000;
  const productAmount = massF_kg / (chem.conc * chem.density);
  const feedRate = (productAmount * (chem.unit === "L/day" ? 1000 : 1000)) / 1440;

  const isValid = flowNum > 0 && dose > 0;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>Flow Rate (m³/day)</label>
          <input type="number" value={flow} onChange={e => setFlow(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #E2E8F0", fontSize: 14, fontWeight: 600, color: "#0F172A", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>Fluoride Chemical</label>
          <select value={chemical} onChange={e => setChemical(e.target.value as typeof chemical)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #E2E8F0", fontSize: 12, fontWeight: 600, color: "#0F172A", fontFamily: "inherit", background: "#fff", boxSizing: "border-box" }}>
            <option value="hfs">Hydrofluosilicic Acid (23% F)</option>
            <option value="naf">Sodium Fluoride (45% F)</option>
            <option value="fsa">Sodium Fluorosilicate (60.7% F)</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>Existing Fluoride (mg/L)</label>
          <input type="number" value={existing} onChange={e => setExisting(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #E2E8F0", fontSize: 14, fontWeight: 600, color: "#0F172A", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>Target Fluoride (mg/L) — Ontario: 0.7 mg/L</label>
          <input type="number" value={target} onChange={e => setTarget(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #E2E8F0", fontSize: 14, fontWeight: 600, color: "#0F172A", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </div>
      </div>

      <div style={{ background: "#F0FDF4", borderRadius: 12, padding: "12px 16px", marginBottom: 16, border: "1px solid #BBF7D0" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#15803D" }}>Fluoride Dose Required: </span>
        <span style={{ fontSize: 14, fontWeight: 900, color: "#059669" }}>{round(dose, 3)} mg/L F⁻</span>
        <span style={{ fontSize: 11, color: "#166534", marginLeft: 8 }}>({target} − {existing} mg/L)</span>
      </div>

      {isValid && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { label: "F⁻ Mass Needed", value: `${round(massF_kg * 1000)} g/day`, sub: `${round(massF_kg, 3)} kg/day`, color: "#059669" },
            { label: chem.unit === "L/day" ? "Chemical Volume" : "Chemical Mass", value: `${round(productAmount)} ${chem.unit}`, sub: chem.name.split(" (")[0], color: "#1D4ED8" },
            { label: "Feed Rate", value: `${round(feedRate)} mL/min`, sub: "metering pump", color: "#7C3AED" },
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

  const flowNum = parseFloat(flow) || 0;
  const doseNum = parseFloat(dose) || 0;
  const stockNum = parseFloat(stockConc) / 100 || 0.005;
  const stockDensity = 1.0; // kg/L (dilute solution ≈ water)

  const massNeeded_g = (flowNum * 1000 * doseNum) / 1000;
  const massNeeded_kg = massNeeded_g / 1000;
  const stockVolume_L = massNeeded_kg / (stockDensity * stockNum);
  const feedRate_mLMin = (stockVolume_L * 1000) / 1440;

  const isValid = flowNum > 0 && doseNum > 0;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Flow Rate (m³/day)", val: flow, set: setFlow },
          { label: "Polymer Dose (mg/L)", val: dose, set: setDose },
          { label: "Stock Solution Conc. (%)", val: stockConc, set: setStockConc },
        ].map(({ label, val, set }) => (
          <div key={label}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>{label}</label>
            <input type="number" value={val} onChange={e => set(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #E2E8F0", fontSize: 14, fontWeight: 600, color: "#0F172A", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </div>
        ))}
      </div>

      {isValid && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { label: "Polymer Mass", value: `${round(massNeeded_g)} g/day`, sub: `${round(massNeeded_kg, 3)} kg/day`, color: "#7C3AED" },
            { label: "Stock Solution", value: `${round(stockVolume_L)} L/day`, sub: `at ${stockConc}% concentration`, color: "#1D4ED8" },
            { label: "Feed Rate", value: `${round(feedRate_mLMin)} mL/min`, sub: "metering pump", color: "#059669" },
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
  const [activeTab, setActiveTab] = useState<Tab>("chlorine");

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Sora', sans-serif" }}>
      <style>{`@keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }`}</style>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "13px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10, boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #1D4ED8, #0F766E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff" }}>E</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", letterSpacing: "0.04em" }}>ECHELON INSTITUTE</div>
            <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 500 }}>Chemical Feed Calculator</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {NAV_LINKS.filter(l => l.href !== "/chem-calc").map(l => (
            <Link key={l.href} href={l.href}>
              <button style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid #E5E7EB", background: "transparent", color: "#64748B", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{l.label}</button>
            </Link>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "28px 20px 80px", animation: "fadeUp 0.3s ease both" }}>

        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg, #1D4ED8, #0F766E)", borderRadius: 20, padding: "28px 32px", marginBottom: 24, color: "#fff" }}>
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
        <div style={{ background: "#fff", borderRadius: 20, padding: "32px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", animation: "fadeUp 0.25s ease both" }} key={activeTab}>
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
        <div style={{ background: "#fff", borderRadius: 20, padding: "28px 32px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", marginTop: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: "0 0 16px" }}>📋 Typical Dose Ranges — Quick Reference</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
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
  );
}
