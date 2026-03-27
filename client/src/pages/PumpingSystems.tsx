/**
 * PumpingSystems.tsx
 * Design: Professional SaaS — Clean Dark-Accent
 * Echelon Pumping Systems Module:
 * - Tab navigation: Cutaway | Pump Curves | Series/Parallel | Exam Tips
 * - Global controls: Running toggle, Cavitation toggle, System static head slider
 * - Series/Parallel configuration with combined curve visualisation
 * - Affinity Laws calculator
 * - Key exam points and Ontario regulation callouts
 */

import { useState } from "react";
import { Link } from "wouter";
import PumpCutaway from "@/components/PumpCutaway";
import PumpCurveChart, { PumpMode } from "@/components/PumpCurveChart";

const TABS = [
  { id: "cutaway", label: "Pump Anatomy", icon: "🔩" },
  { id: "curves", label: "Pump Curves", icon: "📈" },
  { id: "config", label: "Series / Parallel", icon: "⚙️" },
  { id: "tips", label: "Exam Tips", icon: "🎯" },
];

const EXAM_TIPS = [
  {
    category: "Affinity Laws",
    color: "blue",
    tips: [
      { q: "Flow changes proportionally to speed ratio", formula: "Q₂/Q₁ = N₂/N₁" },
      { q: "Head changes as the square of speed ratio", formula: "H₂/H₁ = (N₂/N₁)²" },
      { q: "Power changes as the cube of speed ratio", formula: "P₂/P₁ = (N₂/N₁)³" },
    ],
  },
  {
    category: "Series Pumps",
    color: "amber",
    tips: [
      { q: "Add heads at the same flow rate", formula: "H_total = H₁ + H₂" },
      { q: "Use when system has high static head", formula: "Same Q, double H" },
      { q: "Both pumps must be identical for best results", formula: "H₂ = 2 × H_single" },
    ],
  },
  {
    category: "Parallel Pumps",
    color: "emerald",
    tips: [
      { q: "Add flows at the same head", formula: "Q_total = Q₁ + Q₂" },
      { q: "Use when system has high friction losses", formula: "Same H, double Q" },
      { q: "Operating point shifts right on system curve", formula: "Q₂ = 2 × Q_single" },
    ],
  },
  {
    category: "Cavitation",
    color: "red",
    tips: [
      { q: "Occurs when NPSHa < NPSHr", formula: "NPSHa > NPSHr + safety margin" },
      { q: "NPSHa = Hatm + Hz - Hvp - Hf", formula: "Must exceed NPSHr by ≥1m" },
      { q: "Signs: noise, vibration, pitting, flow loss", formula: "Reduce suction lift to fix" },
    ],
  },
  {
    category: "TDH Calculation",
    color: "purple",
    tips: [
      { q: "Total Dynamic Head = all head components", formula: "TDH = Hs + Hf + Hv + Hm" },
      { q: "Hs = static head (elevation difference)", formula: "Hf = friction head loss" },
      { q: "Hv = velocity head, Hm = minor losses", formula: "Select pump where TDH = pump head" },
    ],
  },
];

const colorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  blue: { bg: "bg-blue-950/40", border: "border-blue-800/50", text: "text-blue-100", badge: "bg-blue-900/60 text-blue-300" },
  amber: { bg: "bg-amber-950/40", border: "border-amber-800/50", text: "text-amber-100", badge: "bg-amber-900/60 text-amber-300" },
  emerald: { bg: "bg-emerald-950/40", border: "border-emerald-800/50", text: "text-emerald-100", badge: "bg-emerald-900/60 text-emerald-300" },
  red: { bg: "bg-red-950/40", border: "border-red-800/50", text: "text-red-100", badge: "bg-red-900/60 text-red-300" },
  purple: { bg: "bg-purple-950/40", border: "border-purple-800/50", text: "text-purple-100", badge: "bg-purple-900/60 text-purple-300" },
};

export default function PumpingSystems() {
  const [activeTab, setActiveTab] = useState("cutaway");
  const [isRunning, setIsRunning] = useState(false);
  const [cavitationMode, setCavitationMode] = useState(false);
  const [pumpMode, setPumpMode] = useState<PumpMode>("single");
  const [staticHead, setStaticHead] = useState(20);

  // Affinity Laws calculator state
  const [n1, setN1] = useState(1450);
  const [n2, setN2] = useState(1750);
  const [q1, setQ1] = useState(80);
  const [h1, setH1] = useState(30);
  const ratio = n2 / n1;
  const q2 = (q1 * ratio).toFixed(1);
  const h2 = (h1 * ratio * ratio).toFixed(1);
  const p2Ratio = (ratio * ratio * ratio).toFixed(2);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ── Header ── */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/">
              <span className="text-blue-400 font-black text-xl tracking-tight cursor-pointer hover:text-blue-300 transition-colors">
                ECHELON
              </span>
            </Link>
            <span className="text-slate-600 text-lg">/</span>
            <span className="text-slate-300 font-semibold text-sm">Pumping Systems</span>
          </div>
          <nav className="flex items-center gap-1 flex-wrap">
            <Link href="/">
              <span className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer">
                AI Tutor
              </span>
            </Link>
            <Link href="/process">
              <span className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer">
                Drinking Water
              </span>
            </Link>
            <Link href="/wastewater">
              <span className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer">
                Wastewater
              </span>
            </Link>
            <Link href="/career">
              <span className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer">
                Career Map
              </span>
            </Link>
            <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold">
              Pumping
            </span>
            <Link href="/mock-exam">
              <span className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer">
                📝 Mock Exam
              </span>
            </Link>
            <Link href="/chem-calc">
              <span className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer">
                🧪 Chem Calc
              </span>
            </Link>
            <Link href="/lab">
              <span className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer">
                🔬 Lab
              </span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* ── Hero ── */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">⚙️</span>
                <h1 className="text-3xl font-black text-white tracking-tight">Pumping Systems</h1>
              </div>
              <p className="text-slate-400 text-base max-w-2xl">
                Interactive centrifugal pump module — explore anatomy, performance curves, cavitation behaviour, and series/parallel configurations used in Ontario water and wastewater facilities.
              </p>
            </div>
            {/* Regulation badge */}
            <div className="bg-blue-950/50 border border-blue-800/50 rounded-xl px-4 py-3 text-sm flex-shrink-0">
              <p className="text-blue-300 text-xs font-semibold uppercase tracking-wide mb-1">Ontario Regulation</p>
              <p className="text-blue-100 font-medium">O. Reg. 170/03 — Schedule 8</p>
              <p className="text-blue-300 text-xs mt-0.5">Pumping station requirements</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { label: "Pump Type", value: "Centrifugal", sub: "Most common in water/WW" },
              { label: "Typical Efficiency", value: "70–85%", sub: "At best efficiency point" },
              { label: "Impeller Speed", value: "1,450–3,500 rpm", sub: "50/60 Hz motor" },
              { label: "TDH Range", value: "5–100 m", sub: "Depends on system" },
            ].map(s => (
              <div key={s.label} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3">
                <p className="text-slate-400 text-xs mb-1">{s.label}</p>
                <p className="text-white font-bold text-sm">{s.value}</p>
                <p className="text-slate-500 text-xs">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Global Controls ── */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 mb-6">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-3">Simulation Controls</p>
          <div className="flex flex-wrap gap-4 items-center">
            {/* Running toggle */}
            <button
              onClick={() => setIsRunning(r => !r)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                isRunning
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-slate-700 hover:bg-slate-600 text-slate-300"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isRunning ? "bg-white animate-pulse" : "bg-slate-500"}`} />
              {isRunning ? "Pump Running" : "Pump Stopped"}
            </button>

            {/* Cavitation toggle */}
            <button
              onClick={() => setCavitationMode(c => !c)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                cavitationMode
                  ? "bg-red-700 hover:bg-red-800 text-white"
                  : "bg-slate-700 hover:bg-slate-600 text-slate-300"
              }`}
            >
              <span className="text-base">💧</span>
              {cavitationMode ? "Cavitation ON" : "Cavitation OFF"}
            </button>

            {/* Static head slider */}
            <div className="flex items-center gap-3 flex-1 min-w-48">
              <label className="text-slate-400 text-xs font-medium whitespace-nowrap">
                Static Head: <span className="text-white font-bold">{staticHead} m</span>
              </label>
              <input
                type="range"
                min={5}
                max={40}
                value={staticHead}
                onChange={e => setStaticHead(Number(e.target.value))}
                className="flex-1 accent-blue-500"
              />
            </div>
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="flex gap-1 mb-6 bg-slate-800/60 rounded-xl p-1 w-fit flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}

        {/* CUTAWAY TAB */}
        {activeTab === "cutaway" && (
          <div className="space-y-6">
            <PumpCutaway isRunning={isRunning} cavitationMode={cavitationMode} />

            {/* How it works */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-4">How a Centrifugal Pump Works</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { step: "1", title: "Fluid Enters", desc: "Liquid enters the pump eye (centre of impeller) along the shaft axis at low pressure from the suction pipe.", color: "#06B6D4" },
                  { step: "2", title: "Impeller Accelerates", desc: "The rotating impeller vanes impart kinetic energy to the fluid, flinging it outward by centrifugal force at high velocity.", color: "#3B82F6" },
                  { step: "3", title: "Volute Converts", desc: "The expanding volute casing slows the fluid, converting velocity head (kinetic energy) into pressure head.", color: "#8B5CF6" },
                ].map(s => (
                  <div key={s.step} className="flex gap-3">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: s.color }}
                    >
                      {s.step}
                    </span>
                    <div>
                      <p className="text-white font-semibold text-sm mb-1">{s.title}</p>
                      <p className="text-slate-400 text-xs leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PUMP CURVES TAB */}
        {activeTab === "curves" && (
          <div className="space-y-6">
            <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <h3 className="text-white font-bold text-lg">Live Performance Curves</h3>
                  <p className="text-slate-400 text-sm">Adjust static head to see operating point shift in real time</p>
                </div>
              </div>
              <PumpCurveChart mode="single" cavitationMode={cavitationMode} systemStaticHead={staticHead} />
            </div>

            {/* Reading the curves */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
                <h4 className="text-white font-bold mb-3">Reading the H-Q Curve</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex gap-2"><span className="text-blue-400 font-bold">→</span> Shutoff head: maximum head at zero flow</li>
                  <li className="flex gap-2"><span className="text-blue-400 font-bold">→</span> Free delivery: maximum flow at zero head</li>
                  <li className="flex gap-2"><span className="text-orange-400 font-bold">→</span> Operating point: intersection with system curve</li>
                  <li className="flex gap-2"><span className="text-indigo-400 font-bold">→</span> BEP: Best Efficiency Point — ideal operating zone</li>
                </ul>
              </div>
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
                <h4 className="text-white font-bold mb-3">System Curve Shape</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex gap-2"><span className="text-orange-400 font-bold">→</span> Starts at static head (elevation difference)</li>
                  <li className="flex gap-2"><span className="text-orange-400 font-bold">→</span> Rises parabolically due to friction losses</li>
                  <li className="flex gap-2"><span className="text-orange-400 font-bold">→</span> Higher static head shifts curve up</li>
                  <li className="flex gap-2"><span className="text-orange-400 font-bold">→</span> Larger pipe diameter flattens the curve</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* SERIES/PARALLEL TAB */}
        {activeTab === "config" && (
          <div className="space-y-6">
            {/* Mode selector */}
            <div className="grid grid-cols-3 gap-3">
              {([
                { id: "single", label: "Single Pump", icon: "⚙️", desc: "Baseline performance", color: "blue" },
                { id: "series", label: "2 Pumps in Series", icon: "⬆️", desc: "Double the head", color: "amber" },
                { id: "parallel", label: "2 Pumps in Parallel", icon: "➡️", desc: "Double the flow", color: "emerald" },
              ] as const).map(m => (
                <button
                  key={m.id}
                  onClick={() => setPumpMode(m.id)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    pumpMode === m.id
                      ? m.color === "blue" ? "border-blue-500 bg-blue-950/50" : m.color === "amber" ? "border-amber-500 bg-amber-950/50" : "border-emerald-500 bg-emerald-950/50"
                      : "border-slate-700 bg-slate-800/40 hover:border-slate-500"
                  }`}
                >
                  <div className="text-2xl mb-2">{m.icon}</div>
                  <p className="text-white font-bold text-sm">{m.label}</p>
                  <p className="text-slate-400 text-xs mt-1">{m.desc}</p>
                </button>
              ))}
            </div>

            {/* Visual schematic */}
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-4">Piping Schematic</p>
              {pumpMode === "single" && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <div className="text-slate-400 text-sm">Suction →</div>
                  <div className="bg-blue-800 border-2 border-blue-500 rounded-xl px-6 py-3 text-white font-bold text-sm">Pump 1</div>
                  <div className="text-slate-400 text-sm">→ Discharge</div>
                </div>
              )}
              {pumpMode === "series" && (
                <div className="flex items-center justify-center gap-2 py-4 flex-wrap">
                  <div className="text-slate-400 text-sm">Suction →</div>
                  <div className="bg-amber-800 border-2 border-amber-500 rounded-xl px-5 py-3 text-white font-bold text-sm">Pump 1</div>
                  <div className="text-amber-400 font-bold text-lg">→</div>
                  <div className="bg-amber-800 border-2 border-amber-500 rounded-xl px-5 py-3 text-white font-bold text-sm">Pump 2</div>
                  <div className="text-slate-400 text-sm">→ Discharge</div>
                  <div className="w-full text-center mt-3">
                    <span className="bg-amber-900/50 border border-amber-700 text-amber-300 text-xs px-3 py-1 rounded-full">
                      Outlet of Pump 1 feeds directly into inlet of Pump 2 — heads add together
                    </span>
                  </div>
                </div>
              )}
              {pumpMode === "parallel" && (
                <div className="flex flex-col items-center py-4 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="text-slate-400 text-sm">Suction →</div>
                    <div className="flex flex-col gap-2">
                      <div className="bg-emerald-800 border-2 border-emerald-500 rounded-xl px-5 py-2 text-white font-bold text-sm">Pump 1</div>
                      <div className="bg-emerald-800 border-2 border-emerald-500 rounded-xl px-5 py-2 text-white font-bold text-sm">Pump 2</div>
                    </div>
                    <div className="text-slate-400 text-sm">→ Common Discharge Header</div>
                  </div>
                  <span className="bg-emerald-900/50 border border-emerald-700 text-emerald-300 text-xs px-3 py-1 rounded-full mt-2">
                    Both pumps draw from same suction header — flows add together at same head
                  </span>
                </div>
              )}
            </div>

            {/* Combined curves */}
            <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-5">
              <h3 className="text-white font-bold text-lg mb-4">Combined Performance Curves</h3>
              <PumpCurveChart mode={pumpMode} cavitationMode={cavitationMode} systemStaticHead={staticHead} />
            </div>

            {/* Affinity Laws Calculator */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
              <h3 className="text-white font-bold text-lg mb-1">Affinity Laws Calculator</h3>
              <p className="text-slate-400 text-sm mb-5">Predict pump performance after a speed change (e.g., VFD adjustment)</p>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-slate-300 font-semibold text-sm">Known Conditions (Speed N₁)</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-slate-400 text-xs block mb-1">Speed N₁ (rpm): <span className="text-white font-bold">{n1}</span></label>
                      <input type="range" min={800} max={3600} step={50} value={n1} onChange={e => setN1(Number(e.target.value))} className="w-full accent-blue-500" />
                    </div>
                    <div>
                      <label className="text-slate-400 text-xs block mb-1">Flow Q₁ (L/s): <span className="text-white font-bold">{q1}</span></label>
                      <input type="range" min={10} max={140} step={5} value={q1} onChange={e => setQ1(Number(e.target.value))} className="w-full accent-blue-500" />
                    </div>
                    <div>
                      <label className="text-slate-400 text-xs block mb-1">Head H₁ (m): <span className="text-white font-bold">{h1}</span></label>
                      <input type="range" min={5} max={60} step={1} value={h1} onChange={e => setH1(Number(e.target.value))} className="w-full accent-blue-500" />
                    </div>
                    <div>
                      <label className="text-slate-400 text-xs block mb-1">New Speed N₂ (rpm): <span className="text-white font-bold">{n2}</span></label>
                      <input type="range" min={800} max={3600} step={50} value={n2} onChange={e => setN2(Number(e.target.value))} className="w-full accent-purple-500" />
                    </div>
                  </div>
                </div>
                <div className="bg-slate-900 rounded-xl p-5 space-y-4">
                  <h4 className="text-slate-300 font-semibold text-sm">Predicted Conditions (Speed N₂ = {n2} rpm)</h4>
                  <div className="space-y-3">
                    {[
                      { label: "New Flow Q₂", value: `${q2} L/s`, formula: `Q₁ × (N₂/N₁) = ${q1} × ${ratio.toFixed(2)}`, color: "#3B82F6" },
                      { label: "New Head H₂", value: `${h2} m`, formula: `H₁ × (N₂/N₁)² = ${h1} × ${ratio.toFixed(2)}²`, color: "#A78BFA" },
                      { label: "Power Ratio P₂/P₁", value: `${p2Ratio}×`, formula: `(N₂/N₁)³ = ${ratio.toFixed(2)}³`, color: "#F59E0B" },
                    ].map(r => (
                      <div key={r.label} className="border border-slate-700 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <span className="text-slate-400 text-xs">{r.label}</span>
                          <span className="font-black text-lg" style={{ color: r.color }}>{r.value}</span>
                        </div>
                        <p className="text-slate-600 text-xs mt-1 font-mono">{r.formula}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-blue-950/50 border border-blue-800/50 rounded-lg p-3">
                    <p className="text-blue-300 text-xs font-semibold mb-1">Speed Ratio</p>
                    <p className="text-white font-bold text-lg">{ratio.toFixed(3)}</p>
                    <p className="text-blue-400 text-xs">N₂/N₁ = {n2}/{n1}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EXAM TIPS TAB */}
        {activeTab === "tips" && (
          <div className="space-y-5">
            <div className="bg-blue-950/30 border border-blue-800/40 rounded-2xl p-5 mb-2">
              <p className="text-blue-200 text-sm leading-relaxed">
                <span className="font-bold text-blue-100">Pumping systems</span> are heavily tested across all Ontario certification levels. Class 1–2 exams focus on TDH calculations and pump selection; Class 3–4 exams add VFD operation, pump troubleshooting, and system curve analysis. The Affinity Laws appear on virtually every Class 2+ exam.
              </p>
            </div>
            {EXAM_TIPS.map(section => {
              const c = colorMap[section.color];
              return (
                <div key={section.category} className={`${c.bg} border ${c.border} rounded-2xl p-5`}>
                  <h3 className={`font-bold text-lg mb-4 ${c.text}`}>{section.category}</h3>
                  <div className="space-y-3">
                    {section.tips.map((tip, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${c.badge} flex-shrink-0 mt-0.5`}>
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <p className={`text-sm ${c.text}`}>{tip.q}</p>
                          <code className="text-xs text-slate-400 font-mono mt-1 block">{tip.formula}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Ontario Regulation box */}
            <div className="bg-slate-800/60 border border-slate-600 rounded-2xl p-5">
              <h3 className="text-white font-bold text-lg mb-4">Ontario Regulatory Requirements</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { reg: "O. Reg. 170/03 — Sch. 8", desc: "Pumping stations must have standby power and emergency pumping capacity for water systems." },
                  { reg: "O. Reg. 129/04 — Sch. 8", desc: "Wastewater pumping stations require wet well level alarms, overflow protection, and backup power." },
                  { reg: "MECP Design Guidelines", desc: "Pumping stations must be designed for peak hourly flow with one pump out of service." },
                  { reg: "CSA B214", desc: "Installation of hydronic heating systems — relevant for booster pump applications." },
                ].map(r => (
                  <div key={r.reg} className="bg-slate-900/60 rounded-xl p-4">
                    <p className="text-blue-300 text-xs font-semibold mb-1">{r.reg}</p>
                    <p className="text-slate-300 text-sm">{r.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
