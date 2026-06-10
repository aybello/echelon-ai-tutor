/**
 * ProcessControl.tsx
 * Design: Professional SaaS — Clean Light (matches Process.tsx)
 * Echelon Process Control & Instrumentation Guide:
 * - Tab navigation: Instruments | PID Control | SCADA | Exam Tips
 * - Interactive instrument explorer with clickable instrument cards
 * - PID controller interactive diagram with tuning guide
 * - SCADA system overview with component explorer
 * - Exam tips organised by topic with Ontario regulation callouts
 */
import { useState } from "react";
import { Link } from "wouter";
import SiteNav from "@/components/SiteNav";
import { useLocation } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";

const TABS = [
  { id: "instruments", label: "Instruments", icon: "🔬" },
  { id: "pid",         label: "PID Control",  icon: "🎛️" },
  { id: "scada",       label: "SCADA",         icon: "🖥️" },
  { id: "tips",        label: "Exam Tips",     icon: "🎯" },
];

// ── Instrument data ──────────────────────────────────────────────────────────
const INSTRUMENT_CATEGORIES = [
  {
    id: "flow",
    label: "Flow Meters",
    icon: "💧",
    color: "blue",
    instruments: [
      {
        name: "Magnetic Flow Meter (Mag Meter)",
        principle: "Faraday's Law of electromagnetic induction — a magnetic field is applied across the pipe and the voltage induced by the conductive fluid is proportional to velocity.",
        measures: "Volumetric flow rate of conductive liquids",
        range: "0.1–10 m/s fluid velocity",
        accuracy: "±0.5% of reading",
        advantages: ["No moving parts — minimal maintenance", "No pressure drop across the meter", "Works with dirty/slurry flows", "Bidirectional measurement"],
        limitations: ["Only works with conductive fluids (min ~5 µS/cm)", "Requires full pipe (no air pockets)", "More expensive than mechanical meters"],
        failureModes: ["Air entrainment causes erratic readings", "Low conductivity fluid (e.g. deionised water) gives no signal", "Electrode fouling from scale or grease", "Empty pipe alarm if pipe runs dry"],
        examTip: "Mag meters are the most common flow meter in Ontario water/WW plants. Key exam point: they require electrically conductive fluid and a full pipe.",
        regulation: "Required for accurate flow reporting under O. Reg. 170/03 Schedule 7",
      },
      {
        name: "Ultrasonic Flow Meter",
        principle: "Transit-time method: two transducers send ultrasonic pulses upstream and downstream. The difference in travel time is proportional to flow velocity.",
        measures: "Volumetric flow rate (clamp-on or inline)",
        range: "0–12 m/s",
        accuracy: "±1–2% (clamp-on), ±0.5% (inline)",
        advantages: ["Clamp-on version requires no pipe cutting", "Works with non-conductive fluids", "No pressure drop", "Good for large-diameter pipes"],
        limitations: ["Sensitive to air bubbles and suspended solids", "Clamp-on accuracy affected by pipe wall condition", "Requires straight pipe run (10D upstream, 5D downstream)"],
        failureModes: ["Air bubbles scatter signal — erratic readings", "Heavy suspended solids attenuate signal", "Pipe scaling reduces signal transmission", "Incorrect pipe diameter entry causes calibration error"],
        examTip: "Ultrasonic meters are used where mag meters can't be installed (non-conductive fluids, large pipes, retrofits). Clamp-on versions are non-invasive.",
        regulation: "Used for bulk water metering and leak detection programs",
      },
      {
        name: "Venturi Meter",
        principle: "Differential pressure measurement — flow is calculated from the pressure difference between the inlet and the throat using Bernoulli's equation.",
        measures: "Volumetric flow rate via differential pressure",
        range: "Depends on pipe size and throat ratio",
        accuracy: "±0.5–1%",
        advantages: ["No moving parts", "Very low permanent pressure loss (~10% of differential)", "Handles high-solids flows", "Long service life"],
        limitations: ["Requires accurate differential pressure transmitter", "Fixed range — cannot be easily re-ranged", "Requires straight pipe upstream/downstream"],
        failureModes: ["Plugged pressure taps from solids or scale", "Differential pressure transmitter drift", "Cavitation at high velocities in throat", "Air pockets in pressure lines give false readings"],
        examTip: "Venturi meters use Bernoulli's principle. The throat creates a pressure drop — higher flow = larger pressure difference. Formula: Q = Cd × A × √(2ΔP/ρ)",
        regulation: "Common in raw water intake and chemical feed metering",
      },
      {
        name: "Rotameter (Variable Area Meter)",
        principle: "A float rises in a tapered tube until the upward drag force equals gravity. Float position indicates flow rate.",
        measures: "Volumetric flow rate (typically low flows)",
        range: "Low flow — typically mL/min to L/min",
        accuracy: "±2–5%",
        advantages: ["Simple, low cost", "No power required (direct-reading)", "Good for chemical feed verification"],
        limitations: ["Must be installed vertically", "Limited to clean, low-viscosity fluids", "Float can stick if fluid is dirty"],
        failureModes: ["Float sticking from scale or debris", "Incorrect reading if installed at angle", "Float damage from water hammer"],
        examTip: "Rotameters are commonly used to verify chemical dosing rates (chlorine, alum, fluoride). They require vertical installation.",
        regulation: "Used for chemical feed verification in treatment plants",
      },
    ],
  },
  {
    id: "level",
    label: "Level Sensors",
    icon: "📏",
    color: "teal",
    instruments: [
      {
        name: "Ultrasonic Level Sensor",
        principle: "Emits ultrasonic pulses toward the liquid surface and measures the time for the echo to return. Distance = (speed of sound × time) / 2.",
        measures: "Liquid level in tanks, wet wells, reservoirs",
        range: "0.3–15 m typical",
        accuracy: "±3–5 mm",
        advantages: ["Non-contact — no wetted parts", "Works with corrosive liquids", "Easy installation", "Self-cleaning (no fouling)"],
        limitations: ["Foam or turbulence can scatter signal", "Temperature affects speed of sound (compensation required)", "Vapours can attenuate signal"],
        failureModes: ["Foam on surface gives false low reading", "Condensation on transducer face", "Temperature gradient in tank causes refraction", "Rogue echoes from tank walls (false targets)"],
        examTip: "Non-contact level measurement — ideal for wet wells and chemical tanks. Key: foam causes false low readings. Temperature compensation is built into modern units.",
        regulation: "Used for wet well level control and reservoir monitoring under O. Reg. 170/03",
      },
      {
        name: "Pressure Transducer (Submersible)",
        principle: "A pressure sensor submerged at the tank bottom measures hydrostatic pressure. Level = pressure / (ρ × g).",
        measures: "Liquid level via hydrostatic pressure",
        range: "0–10 m typical (higher ranges available)",
        accuracy: "±0.1% full scale",
        advantages: ["Highly accurate", "Works in foamy or turbulent conditions", "Simple installation (drop-in)"],
        limitations: ["Wetted parts — requires compatible materials", "Vent tube can block or freeze", "Density changes (temperature) affect reading"],
        failureModes: ["Blocked vent tube causes drift", "Sediment burial changes zero point", "Cable damage in wet well", "Density change from temperature shift"],
        examTip: "Submersible pressure transducers are the most common wet well level sensor in Ontario. Vent tube blockage is the most common failure mode on exams.",
        regulation: "Required for wet well level control and pump station automation",
      },
      {
        name: "Float Switch",
        principle: "A buoyant float rises and falls with liquid level, mechanically actuating a switch at set points.",
        measures: "Discrete level (on/off) — not continuous",
        range: "Fixed set points",
        accuracy: "N/A (on/off only)",
        advantages: ["Very simple and reliable", "Low cost", "No power required for basic versions", "Widely used for pump start/stop"],
        limitations: ["Only provides discrete level, not continuous measurement", "Float can stick or tangle in wet wells", "Not suitable for precise level control"],
        failureModes: ["Float tangled in debris or rags", "Cable fouling in wet well", "Float puncture causes sinking", "Grease coating prevents float from rising"],
        examTip: "Float switches are used for pump start/stop control in wet wells. They provide on/off signals only — not continuous level data. Rags and grease are common failure causes.",
        regulation: "Used as backup level controls and high-level alarms",
      },
    ],
  },
  {
    id: "quality",
    label: "Water Quality Sensors",
    icon: "🧪",
    color: "purple",
    instruments: [
      {
        name: "Turbidimeter (Nephelometer)",
        principle: "Measures scattered light at 90° to the beam source. Turbidity is reported in NTU (Nephelometric Turbidity Units).",
        measures: "Turbidity (suspended particles) in NTU",
        range: "0–100 NTU (online), 0–4000 NTU (portable)",
        accuracy: "±2% or 0.01 NTU (whichever is greater)",
        advantages: ["Continuous online monitoring", "Early warning of filter breakthrough", "Regulatory compliance monitoring"],
        limitations: ["Bubble interference causes false high readings", "Colour interference in some waters", "Requires regular calibration with formazin standards"],
        failureModes: ["Air bubbles give false high NTU readings", "Fouled optical window from biofilm or scale", "Calibration drift from standard degradation", "Stray light from scratched flow cell"],
        examTip: "Turbidity is the primary indicator of filter performance. O. Reg. 170/03 requires turbidity ≤1 NTU at all times and ≤0.3 NTU in 95% of samples. Bubbles are the most common source of false high readings.",
        regulation: "O. Reg. 170/03: ≤1 NTU at all times, ≤0.3 NTU in 95% of measurements after filtration",
      },
      {
        name: "Chlorine Analyser (Amperometric)",
        principle: "Measures the electrical current generated when free chlorine oxidises at a gold or platinum electrode. Current is proportional to chlorine concentration.",
        measures: "Free chlorine residual (mg/L)",
        range: "0–5 mg/L typical",
        accuracy: "±0.05 mg/L or ±5%",
        advantages: ["Continuous online monitoring", "Fast response time", "Regulatory compliance monitoring at entry points"],
        limitations: ["Temperature and pH affect reading (compensation required)", "Requires regular membrane replacement", "Manganese and other oxidants can interfere"],
        failureModes: ["Fouled membrane reduces sensitivity", "Air bubbles in sample stream", "Incorrect pH compensation", "Manganese interference causes false high reading"],
        examTip: "Chlorine analysers must be calibrated against grab sample DPD tests. O. Reg. 170/03 requires minimum 0.2 mg/L free chlorine residual at all points in the distribution system.",
        regulation: "O. Reg. 170/03: minimum 0.2 mg/L free chlorine at all times in distribution system",
      },
      {
        name: "pH Sensor (Glass Electrode)",
        principle: "A glass membrane develops a voltage proportional to the hydrogen ion activity in solution. Measured against a reference electrode.",
        measures: "pH (0–14 scale)",
        range: "0–14 pH",
        accuracy: "±0.02 pH",
        advantages: ["Continuous online monitoring", "Fast response", "Critical for coagulation and disinfection optimisation"],
        limitations: ["Glass electrode is fragile", "Requires regular calibration (2-point minimum)", "Junction potential drift in reference electrode"],
        failureModes: ["Cracked or coated glass membrane", "Clogged reference junction", "Temperature compensation failure", "Protein or oil coating on electrode"],
        examTip: "Optimal coagulation pH is 6.5–7.5. Optimal chloramine formation requires pH control. pH affects chlorine speciation: below pH 7.5, HOCl dominates (more effective disinfectant).",
        regulation: "Drinking water pH target: 7.0–10.5 (ODWQS). Optimal for disinfection: 6.5–8.0",
      },
      {
        name: "Dissolved Oxygen (DO) Sensor",
        principle: "Optical (luminescent) sensors measure the quenching of fluorescent dye by oxygen molecules. Electrochemical sensors measure oxygen reduction current.",
        measures: "Dissolved oxygen concentration (mg/L or % saturation)",
        range: "0–20 mg/L",
        accuracy: "±0.1 mg/L",
        advantages: ["Optical sensors require minimal maintenance", "Critical for biological treatment control", "No reagents required (optical type)"],
        limitations: ["Electrochemical sensors require membrane replacement", "Fouling from biofilm in wastewater applications", "Salinity and temperature affect saturation"],
        failureModes: ["Biofilm fouling on membrane/optical window", "Salinity interference (lower DO saturation in saline water)", "Temperature compensation failure", "Membrane puncture on electrochemical type"],
        examTip: "DO control in activated sludge: target 1.5–2.5 mg/L in aeration basin. Below 1 mg/L causes filamentous bulking. Above 3 mg/L wastes energy.",
        regulation: "Effluent DO requirements vary by receiving water — typically ≥4 mg/L in effluent",
      },
    ],
  },
];

// ── PID data ─────────────────────────────────────────────────────────────────
const PID_PARAMS = [
  {
    id: "P",
    name: "Proportional (P)",
    color: "#3B82F6",
    description: "Output is proportional to the current error. Higher gain = faster response but can cause oscillation.",
    formula: "Output = Kp × Error",
    tooLow: "Slow response, large steady-state offset",
    tooHigh: "Oscillation, instability, overshoot",
    typical: "Kp = 0.5–5 (process dependent)",
    examTip: "Proportional control alone always has offset (steady-state error). Adding integral eliminates offset.",
  },
  {
    id: "I",
    name: "Integral (I)",
    color: "#10B981",
    description: "Output is proportional to the accumulated error over time. Eliminates steady-state offset but can cause windup.",
    formula: "Output = Ki × ∫Error dt",
    tooLow: "Slow elimination of offset, sluggish response",
    tooHigh: "Integral windup, overshoot, oscillation",
    typical: "Ti = 1–10 minutes (reset time)",
    examTip: "Integral windup occurs when the controller output saturates (e.g. valve fully open) but error persists — the integral term keeps accumulating. Anti-windup circuits prevent this.",
  },
  {
    id: "D",
    name: "Derivative (D)",
    color: "#F59E0B",
    description: "Output is proportional to the rate of change of error. Anticipates future error and dampens overshoot.",
    formula: "Output = Kd × dError/dt",
    tooLow: "No damping benefit, overshoot persists",
    tooHigh: "Amplifies noise, erratic output",
    typical: "Td = 0.1–1 minutes (rate time)",
    examTip: "Derivative action is sensitive to measurement noise. It is often disabled or set low in noisy processes (e.g. turbidity control). Most water/WW loops use PI only.",
  },
];

const CONTROL_MODES = [
  { id: "manual", label: "Manual", desc: "Operator sets output directly. Used during commissioning, maintenance, or emergency.", color: "#64748B" },
  { id: "auto", label: "Automatic", desc: "PID controller adjusts output based on setpoint vs. measured value. Normal operating mode.", color: "#3B82F6" },
  { id: "cascade", label: "Cascade", desc: "Output of master controller is setpoint for slave controller. Used for flow-controlled chemical dosing.", color: "#8B5CF6" },
  { id: "ratio", label: "Ratio", desc: "Output tracks a ratio to another process variable. Used for chlorine dosing proportional to flow.", color: "#10B981" },
];

// ── SCADA data ───────────────────────────────────────────────────────────────
const SCADA_COMPONENTS = [
  {
    id: "field",
    label: "Field Instruments",
    icon: "🔬",
    color: "#06B6D4",
    desc: "Sensors and actuators at the process level — flow meters, level sensors, analysers, pumps, valves.",
    details: ["Transmit 4–20 mA or digital signals to PLCs", "Receive control signals from PLCs (valve position, pump speed)", "HART protocol allows digital communication over 4–20 mA wiring", "Foundation Fieldbus and Profibus used in newer installations"],
  },
  {
    id: "plc",
    label: "PLC / RTU",
    icon: "⚙️",
    color: "#3B82F6",
    desc: "Programmable Logic Controllers execute control logic locally. RTUs (Remote Terminal Units) are used at remote sites.",
    details: ["Scan inputs, execute ladder logic, update outputs every 10–100 ms", "Store setpoints, alarms, and control parameters", "Communicate with SCADA via Modbus, DNP3, or Ethernet/IP", "Fail-safe logic maintains safe state on communication loss"],
  },
  {
    id: "network",
    label: "Communication Network",
    icon: "🌐",
    color: "#8B5CF6",
    desc: "Industrial network connecting PLCs/RTUs to the SCADA server — fibre, Ethernet, cellular, or radio.",
    details: ["Fibre optic: high bandwidth, immune to EMI — preferred for plant floor", "Cellular (4G/LTE): used for remote pump stations and reservoirs", "Radio (licensed): used where fibre is not feasible", "Cybersecurity: network segmentation, VPN, firewall between OT and IT networks"],
  },
  {
    id: "scada_server",
    label: "SCADA Server",
    icon: "🖥️",
    color: "#10B981",
    desc: "Central server that collects, stores, and displays process data. Runs historian, alarm management, and HMI software.",
    details: ["Historian stores time-series data for trending and reporting", "Alarm management: priority levels, acknowledgement, suppression", "Redundant servers prevent single point of failure", "OPC-UA standard for data exchange between systems"],
  },
  {
    id: "hmi",
    label: "HMI / Operator Console",
    icon: "📊",
    color: "#F59E0B",
    desc: "Human-Machine Interface — graphical displays where operators monitor and control the process.",
    details: ["Mimics (P&ID-style graphics) show real-time process state", "Trend displays show historical data", "Alarm lists with priority, time, and acknowledgement status", "Setpoint changes and manual overrides logged with operator ID"],
  },
];

// ── Exam Tips ────────────────────────────────────────────────────────────────
const EXAM_TIPS_DATA = [
  {
    category: "Flow Measurement",
    color: "blue",
    tips: [
      { q: "Mag meter requires conductive fluid", formula: "Min conductivity ~5 µS/cm" },
      { q: "Venturi uses differential pressure", formula: "Q ∝ √ΔP (Bernoulli)" },
      { q: "Ultrasonic needs straight pipe run", formula: "10D upstream, 5D downstream" },
      { q: "Rotameter must be vertical", formula: "Float position ∝ flow rate" },
    ],
  },
  {
    category: "Level Measurement",
    color: "teal",
    tips: [
      { q: "Ultrasonic: foam causes false LOW reading", formula: "Level = (speed of sound × time) / 2" },
      { q: "Pressure transducer: blocked vent = drift", formula: "Level = Pressure / (ρg)" },
      { q: "Float switch: rags cause failure in wet wells", formula: "On/off control only" },
      { q: "Hydrostatic: density changes affect reading", formula: "Compensate for temperature" },
    ],
  },
  {
    category: "Water Quality",
    color: "purple",
    tips: [
      { q: "Turbidity ≤1 NTU at all times (O. Reg. 170/03)", formula: "≤0.3 NTU in 95% of samples" },
      { q: "Free chlorine ≥0.2 mg/L in distribution", formula: "CT = concentration × contact time" },
      { q: "pH affects chlorine speciation", formula: "pH <7.5 → HOCl dominates (more effective)" },
      { q: "DO target in aeration basin: 1.5–2.5 mg/L", formula: "Below 1 mg/L → filamentous bulking" },
    ],
  },
  {
    category: "PID Control",
    color: "amber",
    tips: [
      { q: "P-only control always has steady-state offset", formula: "Add I to eliminate offset" },
      { q: "Integral windup: output saturates, I keeps accumulating", formula: "Anti-windup circuit prevents" },
      { q: "Derivative amplifies noise — often disabled", formula: "Most water/WW loops use PI only" },
      { q: "Cascade control: master sets slave setpoint", formula: "Used for flow-controlled dosing" },
    ],
  },
  {
    category: "SCADA & Alarms",
    color: "green",
    tips: [
      { q: "4–20 mA: 4 mA = 0%, 20 mA = 100%", formula: "< 3.8 mA = broken wire alarm" },
      { q: "Fail-safe: loss of signal → safe state", formula: "Valve fails open or closed (design choice)" },
      { q: "Alarm rationalisation: priority 1 = immediate action", formula: "P1 > P2 > P3 > informational" },
      { q: "Historian stores all process data with timestamp", formula: "Required for regulatory reporting" },
    ],
  },
];

const colorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  blue:   { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700",   badge: "bg-blue-100 text-blue-700" },
  teal:   { bg: "bg-teal-50",   border: "border-teal-200",   text: "text-teal-700",   badge: "bg-teal-100 text-teal-700" },
  purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", badge: "bg-purple-100 text-purple-700" },
  amber:  { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700",  badge: "bg-amber-100 text-amber-700" },
  green:  { bg: "bg-emerald-50",border: "border-emerald-200",text: "text-emerald-700",badge: "bg-emerald-100 text-emerald-700" },
};

// ── Component ────────────────────────────────────────────────────────────────
export default function ProcessControl() {
  usePageMeta({
    title: "Process Control",
    description: "Process control concepts for water and wastewater treatment operators.",
  });

  const [location] = useLocation();
  const [activeTab, setActiveTab]           = useState("instruments");
  const [activeCat, setActiveCat]           = useState("flow");
  const [activeInstrument, setActiveInstrument] = useState<number>(0);
  const [activePID, setActivePID]           = useState("P");
  const [activeSCADA, setActiveSCADA]       = useState("field");
  const [pidSetpoint, setPidSetpoint]       = useState(50);
  const [pidMeasured, setPidMeasured]       = useState(42);

  const currentCat = INSTRUMENT_CATEGORIES.find(c => c.id === activeCat)!;
  const currentInstrument = currentCat.instruments[activeInstrument];
  const currentPID = PID_PARAMS.find(p => p.id === activePID)!;
  const currentSCADA = SCADA_COMPONENTS.find(c => c.id === activeSCADA)!;
  const pidError = pidSetpoint - pidMeasured;

  return (
    <div className="min-h-screen text-slate-900" style={{ background: "#FFFFFF", fontFamily: "'Sora', sans-serif" }}>
      <SiteNav currentPath={location} />

      {/* ── Header ── */}
      <header style={{ background: "#fff", borderBottom: "1px solid #E5E7EB" }} className="sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">Echelon</Link>
            <span className="text-slate-400 text-lg">/</span>
            <span className="text-slate-700 font-semibold text-sm">Process Control & Instrumentation</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: "Pumping",  href: "/pumping" },
              { label: "Process",  href: "/process" },
              { label: "Formulas", href: "/formulas" },
              { label: "Career",   href: "/career" },
            ].map(l => (
              <Link key={l.href} href={l.href}>
                <span className="px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium transition-colors cursor-pointer">{l.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* ── Hero ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-xl">🎛️</div>
          <div>
            <div className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-0.5">Class 3–4 · Ontario & WPI</div>
            <h1 className="text-2xl font-bold text-slate-900">Process Control & Instrumentation</h1>
          </div>
          </div>
          <p className="text-slate-500 text-base max-w-2xl">
            Interactive guide to instrumentation, PID control, and SCADA systems used in Ontario water and wastewater facilities. Covers flow meters, level sensors, analysers, control loops, and alarm management.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            {[
              { label: "Flow Meters", value: "4 types" },
              { label: "Level Sensors", value: "3 types" },
              { label: "Quality Sensors", value: "4 types" },
              { label: "PID Modes", value: "4 modes" },
              { label: "SCADA Components", value: "5 layers" },
            ].map(s => (
              <div key={s.label} style={{ background: "#fff", border: "1px solid #E5E7EB" }} className="rounded-xl px-3 py-2">
                <p className="text-slate-400 text-xs mb-0.5">{s.label}</p>
                <p className="text-slate-900 font-bold text-sm">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB" }} className="flex gap-1 rounded-xl p-1 mb-6 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* INSTRUMENTS TAB                                                   */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "instruments" && (
          <div>
            {/* Category selector */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {INSTRUMENT_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCat(cat.id); setActiveInstrument(0); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                    activeCat === cat.id
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-white"
                  }`}
                  style={activeCat !== cat.id ? { background: "#fff" } : {}}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span className="text-xs opacity-60">({cat.instruments.length})</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Instrument list */}
              <div className="flex flex-col gap-2">
                {currentCat.instruments.map((inst, i) => (
                  <button
                    key={inst.name}
                    onClick={() => setActiveInstrument(i)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      activeInstrument === i
                        ? "border-blue-500 text-slate-900"
                        : "border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                    style={{ background: activeInstrument === i ? "#EFF6FF" : "#fff" }}
                  >
                    <p className="font-semibold text-sm leading-snug text-slate-900">{inst.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{inst.measures}</p>
                  </button>
                ))}
              </div>

              {/* Instrument detail */}
              <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <h2 className="text-xl font-bold text-slate-900 mb-1">{currentInstrument.name}</h2>
                <p className="text-blue-600 text-sm font-medium mb-4">{currentInstrument.measures}</p>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { label: "Range", value: currentInstrument.range },
                    { label: "Accuracy", value: currentInstrument.accuracy },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl p-3" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                      <p className="text-slate-400 text-xs mb-1">{s.label}</p>
                      <p className="text-slate-900 font-semibold text-sm">{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mb-4">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Operating Principle</p>
                  <p className="text-slate-600 text-sm leading-relaxed">{currentInstrument.principle}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-emerald-600 text-xs font-semibold uppercase tracking-wider mb-2">✓ Advantages</p>
                    <ul className="space-y-1">
                      {currentInstrument.advantages.map(a => (
                        <li key={a} className="text-slate-600 text-xs flex gap-2"><span className="text-emerald-500 mt-0.5">•</span>{a}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-red-500 text-xs font-semibold uppercase tracking-wider mb-2">✗ Limitations</p>
                    <ul className="space-y-1">
                      {currentInstrument.limitations.map(l => (
                        <li key={l} className="text-slate-600 text-xs flex gap-2"><span className="text-red-400 mt-0.5">•</span>{l}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-amber-600 text-xs font-semibold uppercase tracking-wider mb-2">⚠ Common Failure Modes</p>
                  <ul className="space-y-1">
                    {currentInstrument.failureModes.map(f => (
                      <li key={f} className="text-slate-600 text-xs flex gap-2"><span className="text-amber-500 mt-0.5">→</span>{f}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl p-4 mb-3" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderLeft: "4px solid #1D4ED8" }}>
                  <p className="text-blue-700 text-xs font-semibold uppercase tracking-wider mb-1">🎯 Exam Tip</p>
                  <p className="text-blue-800 text-sm">{currentInstrument.examTip}</p>
                </div>

                {currentInstrument.regulation && (
                  <div className="rounded-xl p-3" style={{ background: "#F5F3FF", border: "1px solid #DDD6FE", borderLeft: "4px solid #7C3AED" }}>
                    <p className="text-purple-700 text-xs font-semibold uppercase tracking-wider mb-1">📋 Regulation</p>
                    <p className="text-purple-800 text-xs">{currentInstrument.regulation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* PID CONTROL TAB                                                   */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "pid" && (
          <div>
            {/* Live PID error visualiser */}
            <div className="rounded-2xl p-6 mb-6" style={{ background: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
              <h2 className="text-slate-900 font-bold text-lg mb-1">Live Control Loop Visualiser</h2>
              <p className="text-slate-500 text-sm mb-5">Adjust setpoint and measured value to see how error drives PID output.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-slate-500 text-xs block mb-1">Setpoint (SP): <span className="text-slate-900 font-bold">{pidSetpoint}%</span></label>
                  <input type="range" min={0} max={100} value={pidSetpoint} onChange={e => setPidSetpoint(+e.target.value)} className="w-full accent-blue-500" />
                </div>
                <div>
                  <label className="text-slate-500 text-xs block mb-1">Measured Value (PV): <span className="text-slate-900 font-bold">{pidMeasured}%</span></label>
                  <input type="range" min={0} max={100} value={pidMeasured} onChange={e => setPidMeasured(+e.target.value)} className="w-full accent-emerald-500" />
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    { label: "Error (SP − PV)", value: `${pidError > 0 ? "+" : ""}${pidError}%`, color: pidError === 0 ? "#10B981" : pidError > 0 ? "#F59E0B" : "#EF4444" },
                    { label: "P Action", value: `${(pidError * 2).toFixed(1)}% output`, color: "#3B82F6" },
                    { label: "Direction", value: pidError > 0 ? "Increase output ↑" : pidError < 0 ? "Decrease output ↓" : "No action ✓", color: pidError === 0 ? "#10B981" : "#F59E0B" },
                  ].map(r => (
                    <div key={r.label} className="rounded-xl p-3 flex justify-between items-center" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                      <span className="text-slate-500 text-xs">{r.label}</span>
                      <span className="font-bold text-sm" style={{ color: r.color }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* PID parameter cards */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {PID_PARAMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setActivePID(p.id)}
                  className={`px-5 py-2 rounded-xl text-sm font-bold border transition-all ${
                    activePID === p.id ? "text-white border-transparent" : "border-slate-200 text-slate-600 hover:text-slate-900"
                  }`}
                  style={activePID === p.id ? { background: p.color, borderColor: p.color } : { background: "#fff" }}
                >
                  {p.name}
                </button>
              ))}
            </div>

            <div className="rounded-2xl p-6 mb-6" style={{ background: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
              <h3 className="text-xl font-bold text-slate-900 mb-1">{currentPID.name}</h3>
              <p className="text-slate-500 text-sm mb-4">{currentPID.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="rounded-xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                  <p className="text-slate-400 text-xs mb-1">Formula</p>
                  <p className="text-slate-900 font-mono font-bold">{currentPID.formula}</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                  <p className="text-slate-400 text-xs mb-1">Typical Setting</p>
                  <p className="text-slate-900 font-semibold text-sm">{currentPID.typical}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="rounded-xl p-4" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                  <p className="text-red-600 text-xs font-semibold mb-1">Too Low →</p>
                  <p className="text-red-700 text-sm">{currentPID.tooLow}</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
                  <p className="text-orange-600 text-xs font-semibold mb-1">Too High →</p>
                  <p className="text-orange-700 text-sm">{currentPID.tooHigh}</p>
                </div>
              </div>
              <div className="rounded-xl p-4" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderLeft: "4px solid #1D4ED8" }}>
                <p className="text-blue-700 text-xs font-semibold uppercase tracking-wider mb-1">🎯 Exam Tip</p>
                <p className="text-blue-800 text-sm">{currentPID.examTip}</p>
              </div>
            </div>

            {/* Control modes */}
            <h3 className="text-slate-900 font-bold text-lg mb-3">Control Modes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CONTROL_MODES.map(m => (
                <div key={m.id} className="rounded-xl p-4" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                    <p className="text-slate-900 font-bold text-sm">{m.label}</p>
                  </div>
                  <p className="text-slate-600 text-sm">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SCADA TAB                                                         */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "scada" && (
          <div>
            <div className="rounded-2xl p-6 mb-6" style={{ background: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
              <h2 className="text-slate-900 font-bold text-lg mb-1">SCADA System Architecture</h2>
              <p className="text-slate-500 text-sm mb-5">
                SCADA (Supervisory Control and Data Acquisition) systems monitor and control water and wastewater infrastructure across multiple sites. Click each layer to explore its role.
              </p>

              {/* Architecture diagram */}
              <div className="flex flex-col gap-2 mb-6">
                {SCADA_COMPONENTS.map((comp, i) => (
                  <button
                    key={comp.id}
                    onClick={() => setActiveSCADA(comp.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                      activeSCADA === comp.id
                        ? "border-opacity-100"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                    style={{ background: activeSCADA === comp.id ? "#F0F9FF" : "#fff", borderColor: activeSCADA === comp.id ? comp.color : undefined }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${comp.color}20` }}>
                      {comp.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: comp.color }}>Layer {i + 1}</span>
                      </div>
                      <p className="text-slate-900 font-semibold text-sm">{comp.label}</p>
                      <p className="text-slate-400 text-xs truncate">{comp.desc}</p>
                    </div>
                    <span className="text-slate-400 text-xs flex-shrink-0">{activeSCADA === comp.id ? "▼" : "▶"}</span>
                  </button>
                ))}
              </div>

              {/* Detail panel */}
              <div className="rounded-xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{currentSCADA.icon}</span>
                  <div>
                    <p className="text-slate-900 font-bold">{currentSCADA.label}</p>
                    <p className="text-slate-500 text-sm">{currentSCADA.desc}</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {currentSCADA.details.map(d => (
                    <li key={d} className="flex gap-2 text-slate-600 text-sm">
                      <span style={{ color: currentSCADA.color }} className="mt-0.5 flex-shrink-0">→</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 4-20mA reference */}
            <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
              <h3 className="text-slate-900 font-bold text-lg mb-4">4–20 mA Signal Standard</h3>
              <p className="text-slate-500 text-sm mb-4">The 4–20 mA current loop is the universal standard for transmitting process measurements in industrial facilities.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { ma: "4 mA",    meaning: "0% (minimum range)",     color: "#3B82F6" },
                  { ma: "12 mA",   meaning: "50% (mid-range)",        color: "#10B981" },
                  { ma: "20 mA",   meaning: "100% (maximum range)",   color: "#F59E0B" },
                  { ma: "<3.8 mA", meaning: "Broken wire / fault",    color: "#EF4444" },
                ].map(s => (
                  <div key={s.ma} className="rounded-xl p-3 text-center" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                    <p className="font-bold text-lg mb-1" style={{ color: s.color }}>{s.ma}</p>
                    <p className="text-slate-600 text-xs">{s.meaning}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-4" style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderLeft: "4px solid #D97706" }}>
                <p className="text-amber-700 text-xs font-semibold uppercase tracking-wider mb-1">⚠ Exam Tip</p>
                <p className="text-amber-800 text-sm">The 4 mA live zero (not 0 mA) allows the system to detect a broken wire — if the signal drops below ~3.8 mA, an alarm is triggered. This is a key advantage over 0–10V voltage signals.</p>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* EXAM TIPS TAB                                                     */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "tips" && (
          <div>
            <div className="rounded-xl p-4 mb-6" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
              <p className="text-slate-600 text-sm">
                <span className="font-bold text-slate-900">Process control and instrumentation</span> is tested at Class 3 and 4 levels in both Ontario and WPI streams. Questions focus on instrument selection, failure modes, PID tuning, and SCADA alarm management. These topics rarely appear at Class 1–2 but are heavily weighted at senior levels.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {EXAM_TIPS_DATA.map(section => {
                const c = colorMap[section.color];
                return (
                  <div key={section.category} className={`${c.bg} border ${c.border} rounded-2xl p-5`}>
                    <h3 className={`font-bold text-lg mb-4 ${c.text}`}>{section.category}</h3>
                    <div className="space-y-3">
                      {section.tips.map((tip, i) => (
                        <div key={i} className="rounded-xl p-3" style={{ background: "#fff" }}>
                          <p className="text-slate-900 text-sm font-medium mb-1">{tip.q}</p>
                          <p className={`text-xs font-mono ${c.text}`}>{tip.formula}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
