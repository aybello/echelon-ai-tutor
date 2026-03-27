/**
 * PumpCutaway.tsx
 * Design: Professional SaaS — Clean Dark-Accent
 * Animated centrifugal pump cross-section SVG with:
 * - Clickable labelled components (impeller, volute, shaft, seal, bearings, inlet, outlet)
 * - Animated rotation on impeller when pump is "running"
 * - Cavitation mode: shows bubble formation near impeller eye
 * - Hover highlights with detail panel
 */

import { useState } from "react";

interface PumpPart {
  id: string;
  label: string;
  shortDesc: string;
  examTip: string;
  color: string;
  hoverColor: string;
}

const PUMP_PARTS: PumpPart[] = [
  {
    id: "impeller",
    label: "Impeller",
    shortDesc: "Rotating vaned disc that imparts velocity to the fluid via centrifugal force.",
    examTip: "Impeller diameter directly affects head and flow. Trimming the impeller reduces both head and flow (Affinity Laws).",
    color: "#3B82F6",
    hoverColor: "#60A5FA",
  },
  {
    id: "volute",
    label: "Volute Casing",
    shortDesc: "Spiral-shaped casing that converts kinetic energy (velocity) into pressure energy.",
    examTip: "The volute's increasing cross-section slows the fluid, converting velocity head to pressure head.",
    color: "#64748B",
    hoverColor: "#94A3B8",
  },
  {
    id: "shaft",
    label: "Pump Shaft",
    shortDesc: "Transmits torque from the motor to the impeller. Must be properly aligned to prevent vibration.",
    examTip: "Shaft misalignment is a leading cause of bearing failure and mechanical seal leakage.",
    color: "#78716C",
    hoverColor: "#A8A29E",
  },
  {
    id: "seal",
    label: "Mechanical Seal",
    shortDesc: "Prevents fluid from leaking along the shaft. Consists of rotating and stationary faces.",
    examTip: "Mechanical seals require a thin fluid film for lubrication. Running dry even briefly causes seal failure.",
    color: "#10B981",
    hoverColor: "#34D399",
  },
  {
    id: "bearing",
    label: "Bearings",
    shortDesc: "Support the shaft radially and axially. Lubricated by grease or oil.",
    examTip: "Excessive vibration, heat, or noise from bearings indicates misalignment, imbalance, or lubrication failure.",
    color: "#F59E0B",
    hoverColor: "#FCD34D",
  },
  {
    id: "inlet",
    label: "Suction Inlet",
    shortDesc: "Fluid enters here at low pressure. Suction conditions determine NPSH available.",
    examTip: "Suction lift increases the risk of cavitation. Keep suction piping short, straight, and fully flooded.",
    color: "#06B6D4",
    hoverColor: "#22D3EE",
  },
  {
    id: "outlet",
    label: "Discharge Outlet",
    shortDesc: "High-pressure fluid exits here. Discharge head is the total head the pump must overcome.",
    examTip: "Total Dynamic Head (TDH) = Static head + friction losses + velocity head + minor losses.",
    color: "#8B5CF6",
    hoverColor: "#A78BFA",
  },
];

interface Props {
  isRunning: boolean;
  cavitationMode: boolean;
}

export default function PumpCutaway({ isRunning, cavitationMode }: Props) {
  const [activePart, setActivePart] = useState<string | null>(null);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  const selectedPart = PUMP_PARTS.find(p => p.id === (activePart || hoveredPart));
  const highlight = (id: string) => hoveredPart === id || activePart === id;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* SVG Diagram */}
      <div className="flex-1 min-w-0">
        <div className="relative bg-slate-900 rounded-2xl p-4 border border-slate-700">
          {isRunning && (
            <div className="absolute top-3 right-3 flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 rounded-full px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs font-semibold">RUNNING</span>
            </div>
          )}
          {cavitationMode && (
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-500/20 border border-red-500/40 rounded-full px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-red-400 text-xs font-semibold">CAVITATION</span>
            </div>
          )}

          <svg
            viewBox="0 0 520 380"
            className="w-full"
            style={{ maxHeight: 380 }}
          >
            {/* Definitions */}
            <defs>
              <radialGradient id="fluidGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#0284C7" stopOpacity="0.2" />
              </radialGradient>
              <radialGradient id="impellerGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {/* Cavitation bubbles */}
              {cavitationMode && (
                <>
                  <circle id="bubble" r="3" fill="none" stroke="#FCA5A5" strokeWidth="1" />
                </>
              )}
              <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes bubble1 { 0%,100% { opacity:0; transform: translate(0,0) scale(0.5); } 50% { opacity:1; transform: translate(-8px,-12px) scale(1.2); } }
                @keyframes bubble2 { 0%,100% { opacity:0; transform: translate(0,0) scale(0.3); } 60% { opacity:0.8; transform: translate(6px,-15px) scale(1); } }
                @keyframes bubble3 { 0%,100% { opacity:0; transform: translate(0,0) scale(0.4); } 40% { opacity:1; transform: translate(-4px,-10px) scale(0.9); } }
                @keyframes flowPulse { 0%,100% { opacity:0.3; } 50% { opacity:0.8; } }
                .impeller-spin { transform-origin: 260px 190px; animation: ${isRunning ? "spin 0.8s linear infinite" : "none"}; }
                .bubble-1 { animation: ${cavitationMode && isRunning ? "bubble1 1.2s ease-in-out infinite" : "none"}; }
                .bubble-2 { animation: ${cavitationMode && isRunning ? "bubble2 0.9s ease-in-out infinite 0.3s" : "none"}; }
                .bubble-3 { animation: ${cavitationMode && isRunning ? "bubble3 1.5s ease-in-out infinite 0.6s" : "none"}; }
                .flow-pulse { animation: ${isRunning ? "flowPulse 1s ease-in-out infinite" : "none"}; }
              `}</style>
            </defs>

            {/* ── Background fluid fill in volute ── */}
            <ellipse cx="260" cy="190" rx="115" ry="115" fill="url(#fluidGrad)" opacity="0.15" />

            {/* ── VOLUTE CASING ── */}
            <g
              className="cursor-pointer"
              onClick={() => setActivePart(activePart === "volute" ? null : "volute")}
              onMouseEnter={() => setHoveredPart("volute")}
              onMouseLeave={() => setHoveredPart(null)}
            >
              {/* Outer casing */}
              <ellipse cx="260" cy="190" rx="125" ry="125"
                fill={highlight("volute") ? "#334155" : "#1E293B"}
                stroke={highlight("volute") ? "#94A3B8" : "#475569"}
                strokeWidth="3" />
              {/* Volute spiral cutout — inner wall */}
              <ellipse cx="260" cy="190" rx="95" ry="95"
                fill={highlight("volute") ? "#1E293B" : "#0F172A"}
                stroke={highlight("volute") ? "#64748B" : "#334155"}
                strokeWidth="2" />
              {/* Discharge nozzle */}
              <rect x="355" y="155" width="55" height="40" rx="4"
                fill={highlight("volute") ? "#334155" : "#1E293B"}
                stroke={highlight("volute") ? "#94A3B8" : "#475569"}
                strokeWidth="2" />
              <text x="383" y="179" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="sans-serif">Discharge</text>
            </g>

            {/* ── OUTLET label ── */}
            <g
              className="cursor-pointer"
              onClick={() => setActivePart(activePart === "outlet" ? null : "outlet")}
              onMouseEnter={() => setHoveredPart("outlet")}
              onMouseLeave={() => setHoveredPart(null)}
            >
              <rect x="408" y="162" width="60" height="26" rx="4"
                fill={highlight("outlet") ? "#4C1D95" : "#2D1B69"}
                stroke={highlight("outlet") ? "#A78BFA" : "#6D28D9"}
                strokeWidth="2" />
              {/* Flow arrow */}
              <path d="M415 175 L460 175 M450 168 L460 175 L450 182"
                stroke={highlight("outlet") ? "#A78BFA" : "#7C3AED"}
                strokeWidth="2" fill="none"
                className="flow-pulse" />
            </g>

            {/* ── SUCTION INLET ── */}
            <g
              className="cursor-pointer"
              onClick={() => setActivePart(activePart === "inlet" ? null : "inlet")}
              onMouseEnter={() => setHoveredPart("inlet")}
              onMouseLeave={() => setHoveredPart(null)}
            >
              <rect x="5" y="162" width="90" height="56" rx="4"
                fill={highlight("inlet") ? "#164E63" : "#0C2A38"}
                stroke={highlight("inlet") ? "#22D3EE" : "#0891B2"}
                strokeWidth="2" />
              {/* Suction flow arrow */}
              <path d="M10 190 L80 190 M70 183 L80 190 L70 197"
                stroke={highlight("inlet") ? "#22D3EE" : "#06B6D4"}
                strokeWidth="2" fill="none"
                className="flow-pulse" />
              <text x="47" y="208" textAnchor="middle" fill="#67E8F9" fontSize="9" fontFamily="sans-serif">Suction</text>
            </g>

            {/* ── SHAFT ── */}
            <g
              className="cursor-pointer"
              onClick={() => setActivePart(activePart === "shaft" ? null : "shaft")}
              onMouseEnter={() => setHoveredPart("shaft")}
              onMouseLeave={() => setHoveredPart(null)}
            >
              <rect x="248" y="300" width="24" height="70" rx="4"
                fill={highlight("shaft") ? "#57534E" : "#3C3834"}
                stroke={highlight("shaft") ? "#A8A29E" : "#78716C"}
                strokeWidth="2" />
              <rect x="238" y="355" width="44" height="12" rx="3"
                fill={highlight("shaft") ? "#57534E" : "#3C3834"}
                stroke={highlight("shaft") ? "#A8A29E" : "#78716C"}
                strokeWidth="2" />
              <text x="260" y="376" textAnchor="middle" fill="#A8A29E" fontSize="9" fontFamily="sans-serif">To Motor</text>
            </g>

            {/* ── BEARINGS ── */}
            <g
              className="cursor-pointer"
              onClick={() => setActivePart(activePart === "bearing" ? null : "bearing")}
              onMouseEnter={() => setHoveredPart("bearing")}
              onMouseLeave={() => setHoveredPart(null)}
            >
              {/* Front bearing housing */}
              <rect x="230" y="290" width="60" height="22" rx="5"
                fill={highlight("bearing") ? "#78350F" : "#451A03"}
                stroke={highlight("bearing") ? "#FCD34D" : "#D97706"}
                strokeWidth="2" />
              <text x="260" y="305" textAnchor="middle" fill="#FCD34D" fontSize="8" fontFamily="sans-serif">Bearing</text>
            </g>

            {/* ── MECHANICAL SEAL ── */}
            <g
              className="cursor-pointer"
              onClick={() => setActivePart(activePart === "seal" ? null : "seal")}
              onMouseEnter={() => setHoveredPart("seal")}
              onMouseLeave={() => setHoveredPart(null)}
            >
              <rect x="235" y="268" width="50" height="18" rx="4"
                fill={highlight("seal") ? "#064E3B" : "#022C22"}
                stroke={highlight("seal") ? "#34D399" : "#059669"}
                strokeWidth="2" />
              <text x="260" y="281" textAnchor="middle" fill="#34D399" fontSize="8" fontFamily="sans-serif">Mech. Seal</text>
            </g>

            {/* ── IMPELLER (animated) ── */}
            <g className="impeller-spin">
              {/* Hub */}
              <circle cx="260" cy="190" r="18"
                fill={highlight("impeller") ? "#1D4ED8" : "#1E3A8A"}
                stroke={highlight("impeller") ? "#60A5FA" : "#3B82F6"}
                strokeWidth="2" />
              {/* Vanes — 6 curved blades */}
              {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const x1 = 260 + 18 * Math.cos(rad);
                const y1 = 190 + 18 * Math.sin(rad);
                const x2 = 260 + 72 * Math.cos(rad + 0.4);
                const y2 = 190 + 72 * Math.sin(rad + 0.4);
                const cx1 = 260 + 40 * Math.cos(rad + 0.1);
                const cy1 = 190 + 40 * Math.sin(rad + 0.1);
                return (
                  <path
                    key={i}
                    d={`M ${x1} ${y1} Q ${cx1} ${cy1} ${x2} ${y2}`}
                    stroke={highlight("impeller") ? "#93C5FD" : "#60A5FA"}
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                  />
                );
              })}
              {/* Outer shroud ring */}
              <circle cx="260" cy="190" r="72"
                fill="none"
                stroke={highlight("impeller") ? "#3B82F6" : "#1D4ED8"}
                strokeWidth="2"
                strokeDasharray="6 4"
                opacity="0.6" />
            </g>

            {/* Impeller clickable overlay */}
            <circle cx="260" cy="190" r="80"
              fill="transparent"
              className="cursor-pointer"
              onClick={() => setActivePart(activePart === "impeller" ? null : "impeller")}
              onMouseEnter={() => setHoveredPart("impeller")}
              onMouseLeave={() => setHoveredPart(null)}
            />

            {/* ── CAVITATION BUBBLES ── */}
            {cavitationMode && (
              <g>
                <circle cx="185" cy="185" r="4" fill="none" stroke="#FCA5A5" strokeWidth="1.5" className="bubble-1" />
                <circle cx="195" cy="200" r="3" fill="none" stroke="#FCA5A5" strokeWidth="1.5" className="bubble-2" />
                <circle cx="178" cy="195" r="5" fill="none" stroke="#F87171" strokeWidth="1.5" className="bubble-3" />
                <circle cx="190" cy="178" r="3.5" fill="none" stroke="#FCA5A5" strokeWidth="1" className="bubble-1" style={{ animationDelay: "0.4s" }} />
                <circle cx="172" cy="188" r="4" fill="none" stroke="#F87171" strokeWidth="1.5" className="bubble-2" style={{ animationDelay: "0.8s" }} />
                {/* Red warning glow at impeller eye */}
                <circle cx="215" cy="190" r="20" fill="#EF4444" opacity="0.08" />
                <text x="145" y="230" fill="#FCA5A5" fontSize="9" fontFamily="sans-serif" fontWeight="bold">Vapor Bubbles</text>
                <text x="145" y="242" fill="#FCA5A5" fontSize="8" fontFamily="sans-serif">Collapsing at impeller eye</text>
              </g>
            )}

            {/* ── LABELS (floating callouts) ── */}
            {/* Volute label */}
            <g className="pointer-events-none">
              <line x1="260" y1="75" x2="260" y2="95" stroke="#64748B" strokeWidth="1" strokeDasharray="3 2" />
              <text x="260" y="68" textAnchor="middle" fill={highlight("volute") ? "#CBD5E1" : "#64748B"} fontSize="10" fontFamily="sans-serif" fontWeight="600">Volute Casing</text>
            </g>
            {/* Impeller label */}
            <g className="pointer-events-none">
              <line x1="260" y1="190" x2="310" y2="140" stroke="#3B82F6" strokeWidth="1" strokeDasharray="3 2" />
              <text x="318" y="136" fill={highlight("impeller") ? "#93C5FD" : "#3B82F6"} fontSize="10" fontFamily="sans-serif" fontWeight="600">Impeller</text>
            </g>
            {/* Seal label */}
            <g className="pointer-events-none">
              <line x1="260" y1="268" x2="210" y2="250" stroke="#10B981" strokeWidth="1" strokeDasharray="3 2" />
              <text x="140" y="248" fill={highlight("seal") ? "#6EE7B7" : "#10B981"} fontSize="10" fontFamily="sans-serif" fontWeight="600">Mech. Seal</text>
            </g>
            {/* Bearing label */}
            <g className="pointer-events-none">
              <line x1="290" y1="301" x2="330" y2="310" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 2" />
              <text x="332" y="314" fill={highlight("bearing") ? "#FDE68A" : "#F59E0B"} fontSize="10" fontFamily="sans-serif" fontWeight="600">Bearing</text>
            </g>
            {/* Shaft label */}
            <g className="pointer-events-none">
              <line x1="260" y1="355" x2="310" y2="345" stroke="#78716C" strokeWidth="1" strokeDasharray="3 2" />
              <text x="312" y="349" fill={highlight("shaft") ? "#D6D3D1" : "#78716C"} fontSize="10" fontFamily="sans-serif" fontWeight="600">Shaft</text>
            </g>
            {/* Inlet label */}
            <g className="pointer-events-none">
              <text x="47" y="158" textAnchor="middle" fill={highlight("inlet") ? "#67E8F9" : "#0891B2"} fontSize="10" fontFamily="sans-serif" fontWeight="600">Inlet</text>
            </g>
            {/* Outlet label */}
            <g className="pointer-events-none">
              <text x="438" y="155" textAnchor="middle" fill={highlight("outlet") ? "#C4B5FD" : "#7C3AED"} fontSize="10" fontFamily="sans-serif" fontWeight="600">Outlet</text>
            </g>
          </svg>

          <p className="text-center text-slate-500 text-xs mt-2">Click any component to learn more</p>
        </div>
      </div>

      {/* Detail Panel */}
      <div className="lg:w-72 flex-shrink-0">
        {selectedPart ? (
          <div className="bg-slate-800 border border-slate-600 rounded-2xl p-5 h-full">
            <div className="flex items-center gap-3 mb-4">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: selectedPart.color }}
              />
              <h3 className="text-white font-bold text-lg">{selectedPart.label}</h3>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">{selectedPart.shortDesc}</p>
            <div className="bg-blue-950/50 border border-blue-800/50 rounded-xl p-4">
              <p className="text-blue-300 text-xs font-semibold uppercase tracking-wide mb-2">Exam Tip</p>
              <p className="text-blue-100 text-sm leading-relaxed">{selectedPart.examTip}</p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 h-full flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm font-medium">Click a component</p>
            <p className="text-slate-500 text-xs mt-1">to see its function and exam tips</p>
            <div className="mt-6 w-full space-y-2">
              {PUMP_PARTS.map(part => (
                <button
                  key={part.id}
                  onClick={() => setActivePart(part.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors text-left"
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: part.color }} />
                  <span className="text-slate-300 text-xs">{part.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
