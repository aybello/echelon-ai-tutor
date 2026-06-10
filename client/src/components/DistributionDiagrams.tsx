// Echelon — Water Distribution Process Diagrams
// SVG diagrams for each distribution system step
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

// ─── 1. HIGH-LIFT PUMPING ────────────────────────────────────────────────────
export function PumpingStationDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "pump_inlet",     x: 80,  y: 195, text: "Pump Inlet" },
    { id: "impeller",       x: 200, y: 195, text: "Impeller" },
    { id: "vsd",            x: 330, y: 195, text: "VSD Drive" },
    { id: "discharge",      x: 460, y: 195, text: "Discharge" },
    { id: "pressure_gauge", x: 580, y: 195, text: "Pressure Gauge" },
  ];
  return (
    <svg viewBox="0 0 640 230" width="100%" height="auto">
      {/* Clearwell / wet well */}
      <rect x={20} y={70} width={80} height={80} rx={8} fill="#BAE6FD" stroke="#0369A1" strokeWidth={2} />
      <text x={60} y={105} textAnchor="middle" fontSize={8} fill="#0369A1" fontWeight="700">CLEAR</text>
      <text x={60} y={116} textAnchor="middle" fontSize={8} fill="#0369A1" fontWeight="700">WELL</text>
      {/* Water level lines */}
      {[80, 90, 100].map((y, i) => (
        <line key={i} x1={25} y1={y} x2={95} y2={y} stroke="#7DD3FC" strokeWidth={1} opacity={0.6} />
      ))}
      {/* Suction pipe */}
      <rect x={100} y={101} width={60} height={18} rx={5} fill="#BAE6FD" opacity={0.4} />
      <line x1={100} y1={110} x2={160} y2={110} stroke="#0369A1" strokeWidth={2.5}
        strokeDasharray="8 4" style={{ animation: "flow 1.2s linear infinite" }} />
      {/* Pump body */}
      <ellipse cx={200} cy={110} rx={38} ry={32} fill="#E0F2FE" stroke="#0369A1" strokeWidth={2} />
      <text x={200} y={106} textAnchor="middle" fontSize={7} fill="#0369A1" fontWeight="700">CENTRIFUGAL</text>
      <text x={200} y={117} textAnchor="middle" fontSize={7} fill="#0369A1" fontWeight="700">PUMP</text>
      {/* Impeller symbol */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return <line key={i} x1={200} y1={110} x2={200 + 18 * Math.cos(rad)} y2={110 + 18 * Math.sin(rad)}
          stroke="#0369A1" strokeWidth={2} opacity={0.6} />;
      })}
      {/* Motor / VSD box */}
      <rect x={280} y={82} width={90} height={56} rx={8} fill="#EFF6FF" stroke="#1D4ED8" strokeWidth={2} />
      <text x={325} y={108} textAnchor="middle" fontSize={8} fill="#1D4ED8" fontWeight="700">MOTOR /</text>
      <text x={325} y={120} textAnchor="middle" fontSize={8} fill="#1D4ED8" fontWeight="700">VSD</text>
      {/* Shaft connecting motor to pump */}
      <line x1={238} y1={110} x2={280} y2={110} stroke="#374151" strokeWidth={4} />
      {/* Discharge pipe */}
      <rect x={370} y={101} width={200} height={18} rx={5} fill="#BAE6FD" opacity={0.4} />
      <line x1={370} y1={110} x2={570} y2={110} stroke="#0369A1" strokeWidth={2.5}
        strokeDasharray="8 4" style={{ animation: "flow 1.2s linear infinite" }} />
      {/* Check valve symbol */}
      <polygon points="390,100 390,120 408,110" fill="#1D4ED8" opacity={0.8} />
      {/* Pressure gauge */}
      <circle cx={540} cy={80} r={20} fill="#EFF6FF" stroke="#1D4ED8" strokeWidth={2} />
      <text x={540} y={76} textAnchor="middle" fontSize={7} fill="#1D4ED8" fontWeight="700">kPa</text>
      <text x={540} y={87} textAnchor="middle" fontSize={10} fill="#1D4ED8" fontWeight="800" fontFamily="monospace">350</text>
      <line x1={540} y1={100} x2={540} y2={110} stroke="#1D4ED8" strokeWidth={1.5} />
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ─── 2. TRANSMISSION MAIN ────────────────────────────────────────────────────
export function TransmissionMainDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "main_pipe",  x: 100, y: 195, text: "Transmission Main" },
    { id: "air_valve",  x: 240, y: 195, text: "Air Relief Valve" },
    { id: "isolation",  x: 380, y: 195, text: "Isolation Valve" },
    { id: "blowoff",    x: 520, y: 195, text: "Blow-off Valve" },
  ];
  return (
    <svg viewBox="0 0 640 230" width="100%" height="auto">
      {/* Ground line */}
      <line x1={20} y1={145} x2={620} y2={145} stroke="#D1D5DB" strokeWidth={1} strokeDasharray="6 4" />
      <text x={30} y={158} fontSize={8} fill="#9CA3AF">GROUND LEVEL</text>
      {/* Main pipe */}
      <rect x={20} y={100} width={600} height={28} rx={8} fill="#BAE6FD" opacity={0.4} />
      <line x1={20} y1={114} x2={620} y2={114} stroke="#0369A1" strokeWidth={3}
        strokeDasharray="12 5" style={{ animation: "flow 1.5s linear infinite" }} />
      {/* Pipe label */}
      <text x={50} y={96} fontSize={8} fill="#0369A1" fontWeight="700">Ø 600mm DI MAIN</text>
      {/* Air relief valve at high point */}
      <line x1={240} y1={100} x2={240} y2={70} stroke="#374151" strokeWidth={2} />
      <rect x={218} y={50} width={44} height={22} rx={6} fill="#FEF3C7" stroke="#D97706" strokeWidth={1.5} />
      <text x={240} y={61} textAnchor="middle" fontSize={7} fill="#D97706" fontWeight="700">AIR/VAC</text>
      <text x={240} y={70} textAnchor="middle" fontSize={7} fill="#D97706" fontWeight="700">RELIEF</text>
      {/* Isolation valve */}
      <rect x={362} y={100} width={36} height={28} rx={4} fill="#EDE9FE" stroke="#7C3AED" strokeWidth={2} />
      <line x1={380} y1={90} x2={380} y2={100} stroke="#7C3AED" strokeWidth={2} />
      <rect x={370} y={82} width={20} height={10} rx={3} fill="#7C3AED" />
      <text x={380} y={89} textAnchor="middle" fontSize={7} fill="#fff" fontWeight="700">GATE</text>
      {/* Blow-off valve */}
      <line x1={520} y1={128} x2={520} y2={165} stroke="#374151" strokeWidth={2} />
      <rect x={500} y={165} width={40} height={20} rx={5} fill="#D1FAE5" stroke="#059669" strokeWidth={1.5} />
      <text x={520} y={175} textAnchor="middle" fontSize={7} fill="#059669" fontWeight="700">BLOW-OFF</text>
      {/* Velocity arrow */}
      <polygon points="290,108 310,114 290,120" fill="#0369A1" opacity={0.7} />
      <text x={295} y={134} fontSize={8} fill="#0369A1" fontWeight="700">v &lt; 1.5 m/s</text>
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ─── 3. STORAGE ──────────────────────────────────────────────────────────────
export function StorageDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "inlet_pipe",     x: 80,  y: 195, text: "Inlet Pipe" },
    { id: "altitude_valve", x: 200, y: 195, text: "Altitude Valve" },
    { id: "tank_body",      x: 340, y: 195, text: "Tank / Reservoir" },
    { id: "level_sensor",   x: 470, y: 195, text: "Level Sensor" },
    { id: "overflow",       x: 590, y: 195, text: "Overflow" },
  ];
  return (
    <svg viewBox="0 0 640 230" width="100%" height="auto">
      {/* Elevated tank */}
      {/* Legs */}
      <line x1={290} y1={145} x2={270} y2={55} stroke="#374151" strokeWidth={4} />
      <line x1={390} y1={145} x2={410} y2={55} stroke="#374151" strokeWidth={4} />
      <line x1={340} y1={145} x2={340} y2={55} stroke="#374151" strokeWidth={3} strokeDasharray="4 2" />
      {/* Cross bracing */}
      <line x1={275} y1={120} x2={405} y2={80} stroke="#374151" strokeWidth={1.5} opacity={0.5} />
      <line x1={275} y1={80} x2={405} y2={120} stroke="#374151" strokeWidth={1.5} opacity={0.5} />
      {/* Tank body */}
      <rect x={255} y={22} width={170} height={36} rx={6} fill="#BAE6FD" stroke="#0369A1" strokeWidth={2} />
      <ellipse cx={340} cy={22} rx={85} ry={12} fill="#7DD3FC" stroke="#0369A1" strokeWidth={2} />
      <ellipse cx={340} cy={58} rx={85} ry={12} fill="#BAE6FD" stroke="#0369A1" strokeWidth={2} />
      <text x={340} y={42} textAnchor="middle" fontSize={8} fill="#0369A1" fontWeight="700">ELEVATED TANK</text>
      {/* Water level indicator */}
      <rect x={260} y={28} width={160} height={24} rx={4} fill="#7DD3FC" opacity={0.5} />
      {/* Level sensor */}
      <line x1={460} y1={22} x2={460} y2={58} stroke="#7C3AED" strokeWidth={1.5} strokeDasharray="3 2" />
      <rect x={448} y={10} width={50} height={14} rx={4} fill="#EDE9FE" stroke="#7C3AED" strokeWidth={1.5} />
      <text x={473} y={20} textAnchor="middle" fontSize={7} fill="#7C3AED" fontWeight="700">LEVEL: 85%</text>
      {/* Overflow pipe */}
      <line x1={425} y1={26} x2={580} y2={26} stroke="#DC2626" strokeWidth={1.5} strokeDasharray="4 3" />
      <line x1={580} y1={26} x2={580} y2={60} stroke="#DC2626" strokeWidth={1.5} strokeDasharray="4 3" />
      <text x={510} y={20} textAnchor="middle" fontSize={7} fill="#DC2626" fontWeight="700">OVERFLOW</text>
      {/* Inlet/outlet pipe */}
      <rect x={20} y={101} width={240} height={18} rx={5} fill="#BAE6FD" opacity={0.4} />
      <line x1={20} y1={110} x2={260} y2={110} stroke="#0369A1" strokeWidth={2.5}
        strokeDasharray="8 4" style={{ animation: "flow 1.5s linear infinite" }} />
      {/* Altitude valve */}
      <rect x={172} y={100} width={36} height={20} rx={4} fill="#FEF3C7" stroke="#D97706" strokeWidth={2} />
      <text x={190} y={113} textAnchor="middle" fontSize={7} fill="#D97706" fontWeight="700">ALT V</text>
      {/* Pipe up to tank */}
      <line x1={260} y1={110} x2={290} y2={55} stroke="#0369A1" strokeWidth={2.5} />
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ─── 4. PRESSURE ZONES ───────────────────────────────────────────────────────
export function PressureZoneDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "zone_meter",   x: 80,  y: 195, text: "Zone Meter" },
    { id: "prv_body",     x: 210, y: 195, text: "PRV Assembly" },
    { id: "prv_bypass",   x: 340, y: 195, text: "PRV Bypass" },
    { id: "booster_pump", x: 480, y: 195, text: "Booster Pump" },
  ];
  return (
    <svg viewBox="0 0 640 230" width="100%" height="auto">
      {/* Zone labels */}
      <rect x={20} y={20} width={120} height={22} rx={6} fill="#EFF6FF" stroke="#1D4ED8" strokeWidth={1.5} />
      <text x={80} y={34} textAnchor="middle" fontSize={8} fill="#1D4ED8" fontWeight="700">HIGH ZONE — 550 kPa</text>
      <rect x={400} y={20} width={120} height={22} rx={6} fill="#D1FAE5" stroke="#059669" strokeWidth={1.5} />
      <text x={460} y={34} textAnchor="middle" fontSize={8} fill="#059669" fontWeight="700">LOW ZONE — 350 kPa</text>
      {/* High-pressure pipe */}
      <rect x={20} y={101} width={180} height={18} rx={5} fill="#BAE6FD" opacity={0.4} />
      <line x1={20} y1={110} x2={200} y2={110} stroke="#0369A1" strokeWidth={3}
        strokeDasharray="8 4" style={{ animation: "flow 1.4s linear infinite" }} />
      {/* Zone meter */}
      <rect x={60} y={98} width={40} height={24} rx={5} fill="#EFF6FF" stroke="#1D4ED8" strokeWidth={1.5} />
      <text x={80} y={108} textAnchor="middle" fontSize={7} fill="#1D4ED8" fontWeight="700">FLOW</text>
      <text x={80} y={118} textAnchor="middle" fontSize={7} fill="#1D4ED8" fontWeight="700">METER</text>
      {/* PRV body */}
      <rect x={195} y={90} width={70} height={40} rx={8} fill="#FEF3C7" stroke="#D97706" strokeWidth={2} />
      <text x={230} y={107} textAnchor="middle" fontSize={8} fill="#D97706" fontWeight="700">PRV</text>
      <text x={230} y={118} textAnchor="middle" fontSize={7} fill="#D97706" fontWeight="700">350 kPa</text>
      {/* Bypass line */}
      <path d="M 200 100 Q 230 60 260 100" stroke="#E2E8F0" strokeWidth={1.5} fill="none" strokeDasharray="4 3" />
      <rect x={315} y={88} width={40} height={24} rx={5} fill="#1E293B" stroke="#E2E8F0" strokeWidth={1.5} />
      <text x={335} y={100} textAnchor="middle" fontSize={7} fill="#E2E8F0" fontWeight="700">BYPASS</text>
      <text x={335} y={110} textAnchor="middle" fontSize={7} fill="#E2E8F0" fontWeight="700">VALVE</text>
      {/* Low-pressure pipe */}
      <rect x={265} y={101} width={135} height={18} rx={5} fill="#D1FAE5" opacity={0.5} />
      <line x1={265} y1={110} x2={400} y2={110} stroke="#059669" strokeWidth={2.5}
        strokeDasharray="8 4" style={{ animation: "flow 1.4s linear infinite" }} />
      {/* Pressure labels */}
      <text x={150} y={90} textAnchor="middle" fontSize={9} fill="#0369A1" fontWeight="800">550 kPa →</text>
      <text x={310} y={90} textAnchor="middle" fontSize={9} fill="#059669" fontWeight="800">→ 350 kPa</text>
      {/* Booster pump for high elevation */}
      <line x1={400} y1={110} x2={440} y2={110} stroke="#059669" strokeWidth={2.5} />
      <ellipse cx={470} cy={110} rx={28} ry={22} fill="#D1FAE5" stroke="#059669" strokeWidth={2} />
      <text x={470} y={107} textAnchor="middle" fontSize={7} fill="#059669" fontWeight="700">BOOST</text>
      <text x={470} y={117} textAnchor="middle" fontSize={7} fill="#059669" fontWeight="700">PUMP</text>
      <line x1={498} y1={110} x2={540} y2={110} stroke="#059669" strokeWidth={2.5}
        strokeDasharray="8 4" style={{ animation: "flow 1.4s linear infinite" }} />
      {/* High elevation area */}
      <polygon points="540,90 600,55 620,90" fill="#94A3B8" stroke="#E2E8F0" strokeWidth={1.5} />
      <text x={580} y={80} textAnchor="middle" fontSize={7} fill="#E2E8F0" fontWeight="700">HIGH</text>
      <text x={580} y={90} textAnchor="middle" fontSize={7} fill="#E2E8F0" fontWeight="700">ELEV.</text>
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ─── 5. DISTRIBUTION MAINS ───────────────────────────────────────────────────
export function DistributionMainsDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "gate_valve", x: 80,  y: 195, text: "Gate Valve" },
    { id: "hydrant",    x: 220, y: 195, text: "Fire Hydrant" },
    { id: "tee",        x: 360, y: 195, text: "Tee / Loop" },
    { id: "curb_box",   x: 500, y: 195, text: "Curb Stop" },
  ];
  return (
    <svg viewBox="0 0 640 230" width="100%" height="auto">
      {/* Ground line */}
      <line x1={20} y1={140} x2={620} y2={140} stroke="#D1D5DB" strokeWidth={1} strokeDasharray="6 4" />
      {/* Main horizontal pipe */}
      <rect x={20} y={101} width={600} height={18} rx={5} fill="#BAE6FD" opacity={0.4} />
      <line x1={20} y1={110} x2={620} y2={110} stroke="#0369A1" strokeWidth={2.5}
        strokeDasharray="8 4" style={{ animation: "flow 1.5s linear infinite" }} />
      {/* Gate valve */}
      <rect x={60} y={100} width={36} height={20} rx={4} fill="#EDE9FE" stroke="#7C3AED" strokeWidth={2} />
      <line x1={78} y1={90} x2={78} y2={100} stroke="#7C3AED" strokeWidth={2} />
      <rect x={68} y={82} width={20} height={10} rx={3} fill="#7C3AED" />
      <text x={78} y={89} textAnchor="middle" fontSize={7} fill="#fff" fontWeight="700">GV</text>
      {/* Fire hydrant */}
      <line x1={220} y1={100} x2={220} y2={60} stroke="#374151" strokeWidth={2} />
      <rect x={205} y={40} width={30} height={22} rx={5} fill="#FCA5A5" stroke="#DC2626" strokeWidth={2} />
      <rect x={208} y={34} width={24} height={8} rx={3} fill="#EF4444" />
      <text x={220} y={55} textAnchor="middle" fontSize={7} fill="#fff" fontWeight="700">HYDRANT</text>
      {/* Tee / loop connection */}
      <line x1={360} y1={100} x2={360} y2={60} stroke="#0369A1" strokeWidth={2.5} />
      <rect x={340} y={101} width={40} height={18} rx={4} fill="#BAE6FD" opacity={0.6} />
      <text x={360} y={55} textAnchor="middle" fontSize={7} fill="#0369A1" fontWeight="700">LOOP</text>
      <path d="M 360 60 Q 430 40 500 60" stroke="#0369A1" strokeWidth={2} fill="none" strokeDasharray="5 3" />
      <line x1={500} y1={60} x2={500} y2={100} stroke="#0369A1" strokeWidth={2.5} />
      {/* Curb stop / service line */}
      <line x1={500} y1={128} x2={500} y2={165} stroke="#059669" strokeWidth={2} strokeDasharray="3 2" />
      <rect x={484} y={165} width={32} height={16} rx={4} fill="#D1FAE5" stroke="#059669" strokeWidth={1.5} />
      <text x={500} y={176} textAnchor="middle" fontSize={7} fill="#059669" fontWeight="700">CURB</text>
      {/* Houses */}
      {[130, 280, 440, 570].map((x, i) => (
        <g key={i}>
          <polygon points={`${x},72 ${x + 14},58 ${x + 28},72`} fill="#FCA5A5" stroke="#EF4444" strokeWidth={1.5} />
          <rect x={x + 2} y={72} width={24} height={20} rx={1} fill="#FEE2E2" stroke="#EF4444" strokeWidth={1.5} />
          <rect x={x + 9} y={82} width={8} height={10} rx={1} fill="#EF4444" opacity={0.55} />
          <line x1={x + 13} y1={92} x2={x + 13} y2={110} stroke="#059669" strokeWidth={1.5} strokeDasharray="3 2" />
        </g>
      ))}
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ─── 6. CROSS-CONNECTION CONTROL ─────────────────────────────────────────────
export function CrossConnectionDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "rpz_body",     x: 80,  y: 195, text: "RPZ Assembly" },
    { id: "check1",       x: 210, y: 195, text: "Check Valve 1" },
    { id: "relief_valve", x: 340, y: 195, text: "Relief Valve" },
    { id: "check2",       x: 470, y: 195, text: "Check Valve 2" },
    { id: "air_gap",      x: 590, y: 195, text: "Air Gap" },
  ];
  return (
    <svg viewBox="0 0 640 230" width="100%" height="auto">
      {/* Supply pipe (left) */}
      <rect x={20} y={101} width={80} height={18} rx={5} fill="#BAE6FD" opacity={0.4} />
      <line x1={20} y1={110} x2={100} y2={110} stroke="#0369A1" strokeWidth={2.5}
        strokeDasharray="8 4" style={{ animation: "flow 1.4s linear infinite" }} />
      <text x={55} y={96} textAnchor="middle" fontSize={8} fill="#0369A1" fontWeight="700">SUPPLY</text>
      {/* RPZ housing */}
      <rect x={100} y={88} width={300} height={44} rx={10} fill="#FEE2E2" stroke="#DC2626" strokeWidth={2} />
      <text x={250} y={82} textAnchor="middle" fontSize={8} fill="#DC2626" fontWeight="700">RPZ ASSEMBLY</text>
      {/* Check valve 1 */}
      <polygon points="140,100 140,120 162,110" fill="#DC2626" opacity={0.85} />
      <line x1={140} y1={88} x2={140} y2={132} stroke="#DC2626" strokeWidth={1.5} />
      <text x={151} y={80} textAnchor="middle" fontSize={7} fill="#DC2626" fontWeight="700">CV1</text>
      {/* Middle zone pipe */}
      <rect x={162} y={101} width={76} height={18} rx={4} fill="#FCA5A5" opacity={0.5} />
      {/* Relief valve (drains down) */}
      <line x1={200} y1={128} x2={200} y2={165} stroke="#D97706" strokeWidth={2} />
      <rect x={182} y={165} width={36} height={18} rx={5} fill="#FEF3C7" stroke="#D97706" strokeWidth={1.5} />
      <text x={200} y={175} textAnchor="middle" fontSize={7} fill="#D97706" fontWeight="700">RELIEF</text>
      <text x={200} y={183} textAnchor="middle" fontSize={7} fill="#D97706" fontWeight="700">DRAIN</text>
      {/* Check valve 2 */}
      <polygon points="238,100 238,120 260,110" fill="#DC2626" opacity={0.85} />
      <line x1={238} y1={88} x2={238} y2={132} stroke="#DC2626" strokeWidth={1.5} />
      <text x={249} y={80} textAnchor="middle" fontSize={7} fill="#DC2626" fontWeight="700">CV2</text>
      {/* Downstream pipe */}
      <rect x={400} y={101} width={80} height={18} rx={5} fill="#D1FAE5" opacity={0.5} />
      <line x1={400} y1={110} x2={480} y2={110} stroke="#059669" strokeWidth={2.5} />
      <text x={440} y={96} textAnchor="middle" fontSize={8} fill="#059669" fontWeight="700">DOWNSTREAM</text>
      {/* Air gap illustration */}
      <rect x={500} y={70} width={40} height={30} rx={4} fill="#BAE6FD" stroke="#0369A1" strokeWidth={1.5} />
      <text x={520} y={83} textAnchor="middle" fontSize={7} fill="#0369A1" fontWeight="700">SUPPLY</text>
      <text x={520} y={93} textAnchor="middle" fontSize={7} fill="#0369A1" fontWeight="700">OUTLET</text>
      {/* Air gap space */}
      <line x1={520} y1={100} x2={520} y2={118} stroke="#E2E8F0" strokeWidth={1} strokeDasharray="3 2" />
      <text x={560} y={110} fontSize={7} fill="#E2E8F0" fontWeight="700">AIR GAP</text>
      {/* Receiving vessel */}
      <rect x={500} y={118} width={40} height={30} rx={4} fill="#D1FAE5" stroke="#059669" strokeWidth={1.5} />
      <text x={520} y={131} textAnchor="middle" fontSize={7} fill="#059669" fontWeight="700">TANK</text>
      <text x={520} y={141} textAnchor="middle" fontSize={7} fill="#059669" fontWeight="700">FLOOD RIM</text>
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ─── 7. SERVICE CONNECTION ────────────────────────────────────────────────────
export function ServiceConnectionDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "corp_stop",   x: 80,  y: 195, text: "Corp Stop" },
    { id: "service_line",x: 220, y: 195, text: "Service Line" },
    { id: "curb_stop",   x: 360, y: 195, text: "Curb Stop" },
    { id: "meter",       x: 490, y: 195, text: "Water Meter" },
    { id: "meter_pit",   x: 590, y: 195, text: "Meter Pit" },
  ];
  return (
    <svg viewBox="0 0 640 230" width="100%" height="auto">
      {/* Ground line */}
      <line x1={20} y1={100} x2={620} y2={100} stroke="#D1D5DB" strokeWidth={1} strokeDasharray="6 4" />
      <text x={30} y={95} fontSize={8} fill="#9CA3AF">GROUND LEVEL</text>
      {/* Property line */}
      <line x1={380} y1={40} x2={380} y2={170} stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="5 3" />
      <text x={385} y={55} fontSize={8} fill="#F59E0B" fontWeight="700">PROPERTY</text>
      <text x={385} y={65} fontSize={8} fill="#F59E0B" fontWeight="700">LINE</text>
      {/* Distribution main */}
      <rect x={20} y={110} width={620} height={20} rx={6} fill="#BAE6FD" opacity={0.5} />
      <line x1={20} y1={120} x2={620} y2={120} stroke="#0369A1" strokeWidth={3}
        strokeDasharray="10 5" style={{ animation: "flow 1.5s linear infinite" }} />
      <text x={60} y={145} fontSize={8} fill="#0369A1" fontWeight="700">DISTRIBUTION MAIN (Ø 150mm)</text>
      {/* Corp stop */}
      <line x1={80} y1={110} x2={80} y2={75} stroke="#059669" strokeWidth={2.5} />
      <circle cx={80} cy={75} r={8} fill="#D1FAE5" stroke="#059669" strokeWidth={2} />
      <text x={80} y={79} textAnchor="middle" fontSize={7} fill="#059669" fontWeight="700">CS</text>
      {/* Service line */}
      <line x1={80} y1={67} x2={360} y2={67} stroke="#059669" strokeWidth={2.5}
        strokeDasharray="6 3" style={{ animation: "flow 1.5s linear infinite" }} />
      {/* Curb stop */}
      <circle cx={360} cy={67} r={10} fill="#FEF3C7" stroke="#D97706" strokeWidth={2} />
      <text x={360} y={71} textAnchor="middle" fontSize={7} fill="#D97706" fontWeight="700">CV</text>
      {/* Meter pit / vault */}
      <rect x={440} y={50} width={80} height={36} rx={6} fill="#EDE9FE" stroke="#7C3AED" strokeWidth={1.5} />
      <text x={480} y={63} textAnchor="middle" fontSize={7} fill="#7C3AED" fontWeight="700">METER PIT</text>
      {/* Meter */}
      <rect x={455} y={68} width={50} height={14} rx={4} fill="#fff" stroke="#7C3AED" strokeWidth={1.5} />
      <text x={480} y={78} textAnchor="middle" fontSize={7} fill="#7C3AED" fontWeight="700">m³ METER</text>
      {/* Line from curb stop to meter */}
      <line x1={370} y1={67} x2={455} y2={75} stroke="#059669" strokeWidth={2} />
      {/* House */}
      <polygon points="540,45 570,25 600,45" fill="#FCA5A5" stroke="#EF4444" strokeWidth={1.5} />
      <rect x={542} y={45} width={56} height={40} rx={2} fill="#FEE2E2" stroke="#EF4444" strokeWidth={1.5} />
      <rect x={558} y={60} width={12} height={25} rx={1} fill="#EF4444" opacity={0.55} />
      {/* Line from meter to house */}
      <line x1={505} y1={75} x2={570} y2={75} stroke="#059669" strokeWidth={2} />
      <line x1={570} y1={75} x2={570} y2={85} stroke="#059669" strokeWidth={2} />
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────
export function DistDiagramFor({ stepId, color, active, onClick }: {
  stepId: string;
  color: string;
  active: string | null;
  onClick: (id: string | null) => void;
}) {
  const props = { active, onClick, color };
  if (stepId === "pumping")            return <PumpingStationDiagram {...props} />;
  if (stepId === "transmission")       return <TransmissionMainDiagram {...props} />;
  if (stepId === "storage")            return <StorageDiagram {...props} />;
  if (stepId === "pressurezones")      return <PressureZoneDiagram {...props} />;
  if (stepId === "distribution_mains") return <DistributionMainsDiagram {...props} />;
  if (stepId === "crossconnection")    return <CrossConnectionDiagram {...props} />;
  if (stepId === "service")            return <ServiceConnectionDiagram {...props} />;
  return null;
}
