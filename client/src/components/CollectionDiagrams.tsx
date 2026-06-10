// Echelon — Wastewater Collection Process Diagrams
// SVG diagrams for each collection system step
// viewBox 0 0 640 240, animated flow lines, clickable LabelDot components

import React from "react";

interface LabelDotProps {
  x: number;
  y: number;
  id: string;
  text: string;
  active: string | null;
  color: string;
  onClick: (id: string | null) => void;
}

function LabelDot({ x, y, id, text, active, color, onClick }: LabelDotProps) {
  const isActive = active === id;
  return (
    <g>
      {isActive && (
        <circle cx={x} cy={y} r={10} fill="none" stroke={color} strokeWidth={2} opacity={0.4}
          style={{ animation: "ping 1.2s ease-out infinite" }} />
      )}
      <circle cx={x} cy={y} r={12} fill={isActive ? color : "#fff"} stroke={color} strokeWidth={2.5} />
      <circle cx={x} cy={y} r={5} fill={isActive ? "#fff" : color} />
      <rect x={x - 54} y={y - 32} width={108} height={17} rx={5}
        fill={isActive ? color : "rgba(255,255,255,0.95)"} stroke={isActive ? "none" : color} strokeWidth={1} />
      <text x={x} y={y - 20} textAnchor="middle" fontSize={8.5}
        fill={isActive ? "#fff" : color} fontWeight="700"
        style={{ pointerEvents: "none", userSelect: "none" as const }}>{text}</text>
      <rect x={x - 56} y={y - 36} width={112} height={62} rx={6}
        fill="transparent" style={{ cursor: "pointer" }}
        onClick={() => onClick(isActive ? null : id)} />
    </g>
  );
}

interface DiagramProps {
  active: string | null;
  onClick: (id: string | null) => void;
  color: string;
}

// ─── 1. WASTEWATER SOURCES ───────────────────────────────────────────────────
export function SourcesDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "house_drain",    x: 90,  y: 195, text: "Building Drain" },
    { id: "lateral_pipe",   x: 240, y: 195, text: "Lateral Pipe" },
    { id: "cleanout",       x: 380, y: 195, text: "Cleanout" },
    { id: "backwater_valve",x: 530, y: 195, text: "Backwater Valve" },
  ];
  return (
    <svg viewBox="0 0 640 230" width="100%" height="auto">
      {/* House */}
      <polygon points="30,80 80,45 130,80" fill="#FCA5A5" stroke="#EF4444" strokeWidth={2} />
      <rect x={35} y={80} width={90} height={60} rx={2} fill="#FEE2E2" stroke="#EF4444" strokeWidth={2} />
      <rect x={68} y={105} width={14} height={35} rx={1} fill="#EF4444" opacity={0.6} />
      {/* Toilet / sink symbols */}
      <circle cx={55} cy={95} r={8} fill="#BAE6FD" stroke="#0369A1" strokeWidth={1.5} />
      <text x={55} y={99} textAnchor="middle" fontSize={7} fill="#0369A1" fontWeight="700">WC</text>
      <rect x={95} y={88} width={16} height={10} rx={3} fill="#BAE6FD" stroke="#0369A1" strokeWidth={1.5} />
      <text x={103} y={96} textAnchor="middle" fontSize={6} fill="#0369A1" fontWeight="700">SINK</text>
      {/* Building drain (vertical) */}
      <line x1={82} y1={140} x2={82} y2={165} stroke="#7C3AED" strokeWidth={3} />
      {/* Ground line */}
      <line x1={20} y1={165} x2={620} y2={165} stroke="#D1D5DB" strokeWidth={1} strokeDasharray="6 4" />
      <text x={30} y={178} fontSize={8} fill="#9CA3AF">GROUND LEVEL</text>
      {/* Lateral pipe (horizontal underground) */}
      <rect x={82} y={165} width={400} height={16} rx={5} fill="#EDE9FE" opacity={0.6} />
      <line x1={82} y1={173} x2={482} y2={173} stroke="#7C3AED" strokeWidth={2.5}
        strokeDasharray="8 4" style={{ animation: "flow 1.5s linear infinite" }} />
      {/* Cleanout */}
      <line x1={280} y1={165} x2={280} y2={148} stroke="#374151" strokeWidth={2} />
      <rect x={265} y={138} width={30} height={12} rx={4} fill="#FEF3C7" stroke="#D97706" strokeWidth={1.5} />
      <text x={280} y={148} textAnchor="middle" fontSize={7} fill="#D97706" fontWeight="700">CO</text>
      {/* Backwater valve */}
      <polygon points="420,165 420,181 440,173" fill="#DC2626" opacity={0.85} />
      <line x1={420} y1={165} x2={420} y2={181} stroke="#DC2626" strokeWidth={1.5} />
      {/* Property line */}
      <line x1={380} y1={130} x2={380} y2={190} stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="5 3" />
      <text x={385} y={148} fontSize={7} fill="#F59E0B" fontWeight="700">PROP.</text>
      <text x={385} y={158} fontSize={7} fill="#F59E0B" fontWeight="700">LINE</text>
      {/* Sewer main */}
      <rect x={482} y={162} width={140} height={22} rx={8} fill="#D1FAE5" opacity={0.5} />
      <line x1={482} y1={173} x2={622} y2={173} stroke="#059669" strokeWidth={3}
        strokeDasharray="10 5" style={{ animation: "flow 1.5s linear infinite" }} />
      <text x={560} y={158} textAnchor="middle" fontSize={8} fill="#059669" fontWeight="700">SEWER MAIN</text>
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ─── 2. LATERAL & HOUSE CONNECTION ───────────────────────────────────────────
export function LateralDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "wye_conn",    x: 100, y: 195, text: "Wye Connection" },
    { id: "slope_arrow", x: 280, y: 195, text: "Slope (2% min)" },
    { id: "cleanout",    x: 460, y: 195, text: "Cleanout" },
  ];
  return (
    <svg viewBox="0 0 640 230" width="100%" height="auto">
      {/* Ground line */}
      <line x1={20} y1={100} x2={620} y2={100} stroke="#D1D5DB" strokeWidth={1} strokeDasharray="6 4" />
      {/* Sewer main (horizontal at bottom) */}
      <rect x={20} y={150} width={620} height={22} rx={8} fill="#D1FAE5" opacity={0.5} />
      <line x1={20} y1={161} x2={620} y2={161} stroke="#059669" strokeWidth={3}
        strokeDasharray="10 5" style={{ animation: "flow 1.5s linear infinite" }} />
      <text x={60} y={148} fontSize={8} fill="#059669" fontWeight="700">SEWER MAIN (Ø 200mm)</text>
      {/* Wye connection */}
      <line x1={100} y1={150} x2={80} y2={115} stroke="#0369A1" strokeWidth={3} />
      <circle cx={100} cy={155} r={8} fill="#E0F2FE" stroke="#0369A1" strokeWidth={2} />
      <text x={100} y={159} textAnchor="middle" fontSize={7} fill="#0369A1" fontWeight="700">WYE</text>
      {/* Lateral pipe — sloped */}
      <line x1={80} y1={115} x2={500} y2={75} stroke="#7C3AED" strokeWidth={3}
        strokeDasharray="8 4" style={{ animation: "flow 1.5s linear infinite" }} />
      {/* Slope indicator */}
      <line x1={220} y1={97} x2={340} y2={88} stroke="#D97706" strokeWidth={1.5} />
      <polygon points="340,88 328,84 330,92" fill="#D97706" />
      <rect x={250} y={80} width={80} height={16} rx={4} fill="#FEF3C7" stroke="#D97706" strokeWidth={1.5} />
      <text x={290} y={91} textAnchor="middle" fontSize={8} fill="#D97706" fontWeight="700">SLOPE: 2% min</text>
      {/* Cleanout */}
      <line x1={460} y1={80} x2={460} y2={60} stroke="#374151" strokeWidth={2} />
      <rect x={445} y={50} width={30} height={12} rx={4} fill="#FEF3C7" stroke="#D97706" strokeWidth={1.5} />
      <text x={460} y={60} textAnchor="middle" fontSize={7} fill="#D97706" fontWeight="700">CO</text>
      {/* Velocity label */}
      <rect x={160} y={60} width={100} height={18} rx={5} fill="#EDE9FE" stroke="#7C3AED" strokeWidth={1.5} />
      <text x={210} y={72} textAnchor="middle" fontSize={8} fill="#7C3AED" fontWeight="700">V min = 0.6 m/s</text>
      {/* House at end */}
      <polygon points="480,50 520,25 560,50" fill="#FCA5A5" stroke="#EF4444" strokeWidth={1.5} />
      <rect x={484} y={50} width={72} height={30} rx={2} fill="#FEE2E2" stroke="#EF4444" strokeWidth={1.5} />
      <line x1={520} y1={80} x2={500} y2={80} stroke="#7C3AED" strokeWidth={2} />
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ─── 3. GRAVITY SEWER MAINS ──────────────────────────────────────────────────
export function GravitySewerDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "pipe_section",  x: 100, y: 195, text: "Pipe Cross-Section" },
    { id: "flow_arrow",    x: 260, y: 195, text: "Flow Direction" },
    { id: "manhole_conn",  x: 420, y: 195, text: "Manhole Connection" },
  ];
  return (
    <svg viewBox="0 0 640 230" width="100%" height="auto">
      {/* Ground line */}
      <line x1={20} y1={80} x2={620} y2={80} stroke="#D1D5DB" strokeWidth={1} strokeDasharray="6 4" />
      <text x={30} y={74} fontSize={8} fill="#9CA3AF">GROUND LEVEL</text>
      {/* Pipe cross-section (left) */}
      <circle cx={100} cy={140} r={40} fill="#F1F5F9" stroke="#059669" strokeWidth={2.5} />
      {/* Partial fill indicator */}
      <path d="M 65 155 A 40 40 0 0 0 135 155 Z" fill="#BAE6FD" opacity={0.7} />
      <text x={100} y={138} textAnchor="middle" fontSize={8} fill="#059669" fontWeight="700">60% FULL</text>
      <text x={100} y={150} textAnchor="middle" fontSize={7} fill="#0369A1">DESIGN FLOW</text>
      <text x={100} y={162} textAnchor="middle" fontSize={7} fill="#0369A1">LEVEL</text>
      {/* Pipe profile (side view) */}
      <rect x={160} y={110} width={380} height={30} rx={8} fill="#D1FAE5" opacity={0.5} />
      <line x1={160} y1={125} x2={540} y2={125} stroke="#059669" strokeWidth={2.5}
        strokeDasharray="8 4" style={{ animation: "flow 1.5s linear infinite" }} />
      {/* Slope arrow */}
      <polygon points="200,118 240,125 200,132" fill="#059669" opacity={0.7} />
      <text x={270} y={115} textAnchor="middle" fontSize={8} fill="#059669" fontWeight="700">SLOPE → GRAVITY FLOW</text>
      {/* Manholes */}
      {[160, 380, 540].map((x, i) => (
        <g key={i}>
          <rect x={x - 20} y={80} width={40} height={32} rx={4} fill="#FEF3C7" stroke="#D97706" strokeWidth={1.5} />
          <ellipse cx={x} cy={80} rx={20} ry={6} fill="#D97706" opacity={0.7} />
          <text x={x} y={100} textAnchor="middle" fontSize={7} fill="#D97706" fontWeight="700">MH</text>
        </g>
      ))}
      {/* H2S warning */}
      <rect x={540} y={100} width={80} height={30} rx={6} fill="#FEE2E2" stroke="#DC2626" strokeWidth={1.5} />
      <text x={580} y={113} textAnchor="middle" fontSize={7} fill="#DC2626" fontWeight="700">H₂S RISK</text>
      <text x={580} y={123} textAnchor="middle" fontSize={7} fill="#DC2626" fontWeight="700">LOW VELOCITY</text>
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ─── 4. MANHOLES ─────────────────────────────────────────────────────────────
export function ManholeDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "frame_cover", x: 90,  y: 195, text: "Frame & Cover" },
    { id: "steps",       x: 230, y: 195, text: "Manhole Steps" },
    { id: "invert",      x: 380, y: 195, text: "Invert Channel" },
    { id: "drop_conn",   x: 530, y: 195, text: "Drop Connection" },
  ];
  return (
    <svg viewBox="0 0 640 230" width="100%" height="auto">
      {/* Ground line */}
      <line x1={20} y1={55} x2={620} y2={55} stroke="#D1D5DB" strokeWidth={1} strokeDasharray="6 4" />
      {/* Manhole cross-section */}
      {/* Frame and cover */}
      <rect x={155} y={40} width={90} height={18} rx={4} fill="#374151" stroke="#1F2937" strokeWidth={2} />
      <text x={200} y={53} textAnchor="middle" fontSize={8} fill="#fff" fontWeight="700">FRAME & COVER</text>
      {/* Cone section */}
      <path d="M 155 58 L 130 100 L 270 100 L 245 58 Z" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth={1.5} />
      {/* Barrel */}
      <rect x={130} y={100} width={140} height={80} rx={4} fill="#F1F5F9" stroke="#9CA3AF" strokeWidth={2} />
      {/* Steps */}
      {[115, 130, 145, 160].map((y, i) => (
        <rect key={i} x={i % 2 === 0 ? 135 : 225} y={y} width={15} height={8} rx={2}
          fill="#374151" stroke="#1F2937" strokeWidth={1} />
      ))}
      {/* Invert channel */}
      <path d="M 130 180 Q 200 168 270 180" stroke="#0369A1" strokeWidth={3} fill="none" />
      <rect x={130} y={175} width={140} height={10} rx={3} fill="#BAE6FD" opacity={0.5} />
      {/* Incoming pipe (left) */}
      <rect x={20} y={155} width={112} height={20} rx={5} fill="#D1FAE5" opacity={0.5} />
      <line x1={20} y1={165} x2={132} y2={165} stroke="#059669" strokeWidth={2.5}
        strokeDasharray="6 3" style={{ animation: "flow 1.5s linear infinite" }} />
      {/* Outgoing pipe (right) */}
      <rect x={268} y={155} width={112} height={20} rx={5} fill="#D1FAE5" opacity={0.5} />
      <line x1={268} y1={165} x2={380} y2={165} stroke="#059669" strokeWidth={2.5}
        strokeDasharray="6 3" style={{ animation: "flow 1.5s linear infinite" }} />
      {/* Drop connection (right side) */}
      <line x1={450} y1={55} x2={450} y2={180} stroke="#7C3AED" strokeWidth={3} strokeDasharray="5 3" />
      <rect x={430} y={55} width={80} height={20} rx={5} fill="#EDE9FE" opacity={0.5} />
      <line x1={430} y1={65} x2={510} y2={65} stroke="#7C3AED" strokeWidth={2.5} />
      <text x={490} y={48} textAnchor="middle" fontSize={8} fill="#7C3AED" fontWeight="700">HIGH INLET</text>
      <polygon points="450,170 440,155 460,155" fill="#7C3AED" opacity={0.8} />
      <text x={500} y={175} textAnchor="middle" fontSize={8} fill="#7C3AED" fontWeight="700">DROP CONN.</text>
      {/* H2S warning */}
      <rect x={540} y={80} width={80} height={36} rx={6} fill="#FEE2E2" stroke="#DC2626" strokeWidth={1.5} />
      <text x={580} y={95} textAnchor="middle" fontSize={7} fill="#DC2626" fontWeight="700">⚠️ CONFINED</text>
      <text x={580} y={106} textAnchor="middle" fontSize={7} fill="#DC2626" fontWeight="700">SPACE ENTRY</text>
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ─── 5. LIFT STATION ─────────────────────────────────────────────────────────
export function LiftStationDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "wet_well",      x: 90,  y: 195, text: "Wet Well" },
    { id: "float_switch",  x: 220, y: 195, text: "Level Controls" },
    { id: "submersible",   x: 360, y: 195, text: "Duty Pump" },
    { id: "standby_pump",  x: 480, y: 195, text: "Standby Pump" },
    { id: "generator",     x: 590, y: 195, text: "Generator" },
  ];
  return (
    <svg viewBox="0 0 640 230" width="100%" height="auto">
      {/* Ground line */}
      <line x1={20} y1={65} x2={620} y2={65} stroke="#D1D5DB" strokeWidth={1} strokeDasharray="6 4" />
      {/* Wet well structure */}
      <rect x={30} y={65} width={160} height={130} rx={6} fill="#F1F5F9" stroke="#374151" strokeWidth={2.5} />
      <text x={110} y={82} textAnchor="middle" fontSize={8} fill="#374151" fontWeight="700">WET WELL</text>
      {/* Sewage level */}
      <rect x={34} y={130} width={152} height={62} rx={4} fill="#BAE6FD" opacity={0.4} />
      {/* Level indicators */}
      <line x1={185} y1={100} x2={185} y2={190} stroke="#94A3B8" strokeWidth={1} strokeDasharray="3 2" />
      {[
        { y: 105, label: "HH ALARM", color: "#DC2626" },
        { y: 120, label: "H START", color: "#D97706" },
        { y: 150, label: "L STOP", color: "#059669" },
        { y: 170, label: "LL ALARM", color: "#7C3AED" },
      ].map((fl, i) => (
        <g key={i}>
          <circle cx={185} cy={fl.y} r={5} fill={fl.color} />
          <text x={192} y={fl.y + 4} fontSize={7} fill={fl.color} fontWeight="700">{fl.label}</text>
        </g>
      ))}
      {/* Incoming sewer */}
      <rect x={20} y={85} width={12} height={16} rx={3} fill="#D1FAE5" opacity={0.6} />
      <line x1={20} y1={93} x2={32} y2={93} stroke="#059669" strokeWidth={2.5}
        strokeDasharray="5 3" style={{ animation: "flow 1.5s linear infinite" }} />
      {/* Pumps */}
      {[{ x: 80, label: "DUTY" }, { x: 130, label: "STBY" }].map((p, i) => (
        <g key={i}>
          <ellipse cx={p.x} cy={170} rx={22} ry={16} fill="#EDE9FE" stroke="#7C3AED" strokeWidth={2} />
          <text x={p.x} y={168} textAnchor="middle" fontSize={7} fill="#7C3AED" fontWeight="700">{p.label}</text>
          <text x={p.x} y={178} textAnchor="middle" fontSize={7} fill="#7C3AED" fontWeight="700">PUMP</text>
        </g>
      ))}
      {/* Discharge pipe (force main) */}
      <line x1={110} y1={154} x2={110} y2={65} stroke="#0369A1" strokeWidth={3} />
      <line x1={110} y1={65} x2={450} y2={65} stroke="#0369A1" strokeWidth={3}
        strokeDasharray="8 4" style={{ animation: "flow 1.4s linear infinite" }} />
      <text x={280} y={58} textAnchor="middle" fontSize={8} fill="#0369A1" fontWeight="700">FORCE MAIN</text>
      {/* Check valve */}
      <polygon points="110,90 110,110 128,100" fill="#1D4ED8" opacity={0.8} />
      {/* Generator */}
      <rect x={530} y={80} width={90} height={50} rx={8} fill="#D1FAE5" stroke="#059669" strokeWidth={2} />
      <text x={575} y={102} textAnchor="middle" fontSize={8} fill="#059669" fontWeight="700">EMERGENCY</text>
      <text x={575} y={114} textAnchor="middle" fontSize={8} fill="#059669" fontWeight="700">GENERATOR</text>
      {/* Overflow pipe */}
      <line x1={190} y1={100} x2={300} y2={100} stroke="#DC2626" strokeWidth={1.5} strokeDasharray="4 3" />
      <text x={250} y={93} textAnchor="middle" fontSize={7} fill="#DC2626" fontWeight="700">EMERG. OVERFLOW</text>
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ─── 6. FORCE MAIN ───────────────────────────────────────────────────────────
export function ForceMainDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "fm_pipe",      x: 100, y: 195, text: "Force Main" },
    { id: "air_release",  x: 260, y: 195, text: "Air Release Valve" },
    { id: "fm_isolation", x: 430, y: 195, text: "Isolation Valve" },
  ];
  return (
    <svg viewBox="0 0 640 230" width="100%" height="auto">
      {/* Terrain profile */}
      <path d="M 20 140 Q 150 80 280 70 Q 400 60 520 120 L 620 120 L 620 200 L 20 200 Z"
        fill="#E2E8F0" stroke="#CBD5E1" strokeWidth={1} opacity={0.5} />
      <text x={50} y={165} fontSize={8} fill="#94A3B8">TERRAIN PROFILE</text>
      {/* Force main pipe (follows terrain) */}
      <path d="M 20 135 Q 150 75 280 65 Q 400 55 520 115 L 620 115"
        stroke="#0F766E" strokeWidth={4} fill="none"
        strokeDasharray="10 5" style={{ animation: "flow 1.5s linear infinite" }} />
      {/* Pipe label */}
      <text x={60} y={125} fontSize={8} fill="#0F766E" fontWeight="700">FORCE MAIN — FULL PRESSURE</text>
      {/* Lift station (left) */}
      <rect x={20} y={120} width={50} height={40} rx={6} fill="#EDE9FE" stroke="#7C3AED" strokeWidth={2} />
      <text x={45} y={138} textAnchor="middle" fontSize={7} fill="#7C3AED" fontWeight="700">LIFT</text>
      <text x={45} y={148} textAnchor="middle" fontSize={7} fill="#7C3AED" fontWeight="700">STN.</text>
      {/* Air release valve at high point */}
      <line x1={280} y1={65} x2={280} y2={38} stroke="#374151" strokeWidth={2} />
      <rect x={258} y={22} width={44} height={18} rx={5} fill="#FEF3C7" stroke="#D97706" strokeWidth={1.5} />
      <text x={280} y={33} textAnchor="middle" fontSize={7} fill="#D97706" fontWeight="700">AIR/VAC</text>
      <text x={280} y={41} textAnchor="middle" fontSize={7} fill="#D97706" fontWeight="700">VALVE</text>
      {/* Isolation valve */}
      <rect x={412} y={75} width={36} height={22} rx={4} fill="#D1FAE5" stroke="#059669" strokeWidth={2} />
      <line x1={430} y1={65} x2={430} y2={75} stroke="#059669" strokeWidth={2} />
      <rect x={420} y={57} width={20} height={10} rx={3} fill="#059669" />
      <text x={430} y={64} textAnchor="middle" fontSize={7} fill="#fff" fontWeight="700">ISO</text>
      {/* H2S warning */}
      <rect x={520} y={80} width={100} height={30} rx={6} fill="#FEE2E2" stroke="#DC2626" strokeWidth={1.5} />
      <text x={570} y={93} textAnchor="middle" fontSize={7} fill="#DC2626" fontWeight="700">H₂S RISK</text>
      <text x={570} y={103} textAnchor="middle" fontSize={7} fill="#DC2626" fontWeight="700">LONG FORCE MAINS</text>
      {/* Velocity indicator */}
      <rect x={130} y={50} width={100} height={18} rx={5} fill="#CCFBF1" stroke="#0F766E" strokeWidth={1.5} />
      <text x={180} y={62} textAnchor="middle" fontSize={8} fill="#0F766E" fontWeight="700">V min = 0.9 m/s</text>
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ─── 7. CSO CONTROL ──────────────────────────────────────────────────────────
export function CSODiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "regulator", x: 110, y: 195, text: "CSO Regulator" },
    { id: "storage",   x: 280, y: 195, text: "Storage Tunnel" },
    { id: "rtc",       x: 460, y: 195, text: "Real-Time Control" },
  ];
  return (
    <svg viewBox="0 0 640 230" width="100%" height="auto">
      {/* Combined sewer (incoming) */}
      <rect x={20} y={85} width={120} height={22} rx={6} fill="#FEE2E2" opacity={0.5} />
      <line x1={20} y1={96} x2={140} y2={96} stroke="#DC2626" strokeWidth={3}
        strokeDasharray="8 4" style={{ animation: "flow 1.4s linear infinite" }} />
      <text x={80} y={78} textAnchor="middle" fontSize={8} fill="#DC2626" fontWeight="700">COMBINED SEWER</text>
      <text x={80} y={88} textAnchor="middle" fontSize={7} fill="#DC2626">(sanitary + storm)</text>
      {/* CSO Regulator */}
      <rect x={140} y={75} width={70} height={42} rx={8} fill="#FEF3C7" stroke="#D97706" strokeWidth={2} />
      <text x={175} y={93} textAnchor="middle" fontSize={8} fill="#D97706" fontWeight="700">CSO</text>
      <text x={175} y={104} textAnchor="middle" fontSize={8} fill="#D97706" fontWeight="700">REGULATOR</text>
      {/* Flow to treatment (dry weather) */}
      <rect x={210} y={85} width={120} height={22} rx={6} fill="#D1FAE5" opacity={0.5} />
      <line x1={210} y1={96} x2={330} y2={96} stroke="#059669" strokeWidth={2.5}
        strokeDasharray="6 3" style={{ animation: "flow 1.4s linear infinite" }} />
      <text x={270} y={78} textAnchor="middle" fontSize={8} fill="#059669" fontWeight="700">TO TREATMENT</text>
      {/* Overflow pipe (wet weather) */}
      <path d="M 175 117 L 175 145 L 400 145" stroke="#DC2626" strokeWidth={2.5} fill="none" strokeDasharray="5 3" />
      <text x={270} y={138} textAnchor="middle" fontSize={8} fill="#DC2626" fontWeight="700">WET WEATHER OVERFLOW</text>
      {/* Storage tunnel */}
      <ellipse cx={280} cy={175} rx={70} ry={22} fill="#EDE9FE" stroke="#7C3AED" strokeWidth={2} />
      <text x={280} y={172} textAnchor="middle" fontSize={8} fill="#7C3AED" fontWeight="700">STORAGE</text>
      <text x={280} y={182} textAnchor="middle" fontSize={8} fill="#7C3AED" fontWeight="700">TUNNEL</text>
      <line x1={280} y1={145} x2={280} y2={153} stroke="#7C3AED" strokeWidth={2} />
      {/* Receiving water */}
      <path d="M 400 140 Q 500 130 600 140 Q 620 145 600 150 Q 500 145 400 150 Z"
        fill="#BAE6FD" stroke="#0369A1" strokeWidth={1.5} />
      <text x={500} y={148} textAnchor="middle" fontSize={8} fill="#0369A1" fontWeight="700">RECEIVING WATER</text>
      {/* RTC system */}
      <rect x={450} y={60} width={100} height={45} rx={8} fill="#D1FAE5" stroke="#059669" strokeWidth={2} />
      <text x={500} y={78} textAnchor="middle" fontSize={8} fill="#059669" fontWeight="700">REAL-TIME</text>
      <text x={500} y={89} textAnchor="middle" fontSize={8} fill="#059669" fontWeight="700">CONTROL</text>
      <text x={500} y={100} textAnchor="middle" fontSize={7} fill="#059669">(SCADA/RTC)</text>
      {/* Dry weather label */}
      <rect x={330} y={60} width={80} height={18} rx={5} fill="#EFF6FF" stroke="#1D4ED8" strokeWidth={1.5} />
      <text x={370} y={72} textAnchor="middle" fontSize={8} fill="#1D4ED8" fontWeight="700">DRY WEATHER: ALL TO PLANT</text>
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────
export function CollDiagramFor({ stepId, color, active, onClick }: {
  stepId: string;
  color: string;
  active: string | null;
  onClick: (id: string | null) => void;
}) {
  const props = { active, onClick, color };
  if (stepId === "sources")       return <SourcesDiagram {...props} />;
  if (stepId === "lateral")       return <LateralDiagram {...props} />;
  if (stepId === "gravity_sewer") return <GravitySewerDiagram {...props} />;
  if (stepId === "manholes")      return <ManholeDiagram {...props} />;
  if (stepId === "liftstation")   return <LiftStationDiagram {...props} />;
  if (stepId === "forcemain")     return <ForceMainDiagram {...props} />;
  if (stepId === "cso")           return <CSODiagram {...props} />;
  return null;
}
