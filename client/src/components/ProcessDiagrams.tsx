// Echelon Process v2 — SVG Diagram Components
// Design: Professional SaaS — Clean Dark-Accent (Sora, blue/teal brand)
// Each diagram is an interactive SVG with clickable label dots

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

export function LabelDot({ x, y, id, text, active, color, onClick }: LabelDotProps) {
  const isActive = active === id;
  return (
    <g>
      {isActive && (
        <circle cx={x} cy={y} r={8} fill="none" stroke={color} strokeWidth={2} opacity={0.5}
          style={{ animation: "ping 1.2s ease-out infinite" }} />
      )}
      <circle cx={x} cy={y} r={12} fill={isActive ? color : "#fff"} stroke={color} strokeWidth={2.5} />
      <circle cx={x} cy={y} r={5} fill={isActive ? "#fff" : color} />
      <rect x={x - 52} y={y - 30} width={104} height={16} rx={4}
        fill={isActive ? color : "rgba(255,255,255,0.92)"} />
      <text x={x} y={y - 19} textAnchor="middle" fontSize={8.5}
        fill={isActive ? "#fff" : color} fontWeight="700"
        style={{ pointerEvents: "none", userSelect: "none" }}>{text}</text>
      <rect x={x - 55} y={y - 35} width={110} height={60} rx={6}
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

export function IntakeDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "source", x: 70, y: 155, text: "Water Source" },
    { id: "barscreen", x: 195, y: 155, text: "Bar Screen" },
    { id: "finescreen", x: 305, y: 155, text: "Fine Screen" },
    { id: "pump", x: 415, y: 155, text: "Low-lift Pump" },
    { id: "flowmeter", x: 525, y: 155, text: "Flow Meter" },
  ];
  return (
    <svg viewBox="0 0 610 200" width="100%" height="auto">
      <ellipse cx={70} cy={105} rx={50} ry={28} fill="#BAE6FD" stroke="#0369A1" strokeWidth={1.5} />
      <text x={70} y={145} textAnchor="middle" fontSize={9} fill="#0369A1" fontWeight="600">LAKE / RIVER</text>
      <rect x={118} y={96} width={450} height={18} rx={6} fill="#7DD3FC" opacity={0.35} />
      <line x1={118} y1={105} x2={570} y2={105} stroke="#0369A1" strokeWidth={2.5}
        strokeDasharray="10 5" style={{ animation: "flow 1.4s linear infinite" }} />
      <rect x={178} y={78} width={14} height={54} rx={3} fill="#1E3A5C" />
      {[84, 91, 98, 105, 112, 119, 126].map(y => <line key={y} x1={178} y1={y} x2={192} y2={y} stroke="#7DD3FC" strokeWidth={1.5} />)}
      <rect x={290} y={84} width={10} height={42} rx={2} fill="#374151" />
      {[88, 93, 98, 103, 108, 113, 118].map(y => <line key={y} x1={290} y1={y} x2={300} y2={y} stroke="#93C5FD" strokeWidth={1} />)}
      <circle cx={415} cy={105} r={20} fill="#1D4ED8" opacity={0.9} />
      <text x={415} y={110} textAnchor="middle" fontSize={18} fill="white">⚙</text>
      <rect x={505} y={90} width={28} height={28} rx={6} fill="#0F766E" />
      <text x={519} y={108} textAnchor="middle" fontSize={16} fill="white">≋</text>
      <path d="M 535 105 L 590 105" stroke="#0369A1" strokeWidth={2.5} />
      <polygon points="586,100 598,105 586,110" fill="#0369A1" />
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

export function CoagulationDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "rawwater", x: 80, y: 170, text: "Raw Water In" },
    { id: "chemical", x: 200, y: 170, text: "Chemical Dosing" },
    { id: "rapidmix", x: 320, y: 170, text: "Rapid Mix Basin" },
    { id: "impeller", x: 320, y: 195, text: "High-speed Impeller" },
    { id: "outlet", x: 480, y: 170, text: "To Flocculation" },
  ];
  return (
    <svg viewBox="0 0 580 215" width="100%" height="auto">
      <rect x={20} y={95} width={120} height={20} rx={6} fill="#7DD3FC" opacity={0.4} />
      <line x1={20} y1={105} x2={138} y2={105} stroke="#0369A1" strokeWidth={2.5}
        strokeDasharray="8 4" style={{ animation: "flow 1.2s linear infinite" }} />
      <rect x={148} y={58} width={40} height={52} rx={6} fill="#EDE9FE" stroke="#7C3AED" strokeWidth={2} />
      <text x={168} y={80} textAnchor="middle" fontSize={9} fill="#7C3AED" fontWeight="700">ALUM</text>
      <text x={168} y={92} textAnchor="middle" fontSize={16}>⚗️</text>
      <path d="M 168 110 L 168 125" stroke="#7C3AED" strokeWidth={2} strokeDasharray="3 2" />
      <polygon points="163,122 168,134 173,122" fill="#7C3AED" />
      <rect x={230} y={65} width={180} height={110} rx={10} fill="#F3F4F6" stroke="#374151" strokeWidth={2} />
      <rect x={232} y={67} width={176} height={106} rx={8} fill="#BAE6FD" opacity={0.4} />
      <circle cx={320} cy={120} r={28} fill="none" stroke="#1D4ED8" strokeWidth={2} strokeDasharray="6 3"
        style={{ animation: "flow 0.8s linear infinite", transformOrigin: "320px 120px" }} />
      <line x1={320} y1={90} x2={320} y2={150} stroke="#374151" strokeWidth={3} />
      <line x1={290} y1={120} x2={350} y2={120} stroke="#374151" strokeWidth={3} />
      <circle cx={320} cy={120} r={8} fill="#1D4ED8" />
      <rect x={308} y={48} width={24} height={18} rx={4} fill="#1E3A5C" />
      <line x1={320} y1={66} x2={320} y2={90} stroke="#374151" strokeWidth={3} />
      {[[275, 100], [295, 130], [340, 95], [355, 128], [280, 118]].map((p, i) => (
        <text key={i} x={p[0]} y={p[1]} fontSize={10} fill="#0369A1" opacity={0.5}>~</text>
      ))}
      <rect x={410} y={95} width={140} height={20} rx={6} fill="#7DD3FC" opacity={0.4} />
      <line x1={412} y1={105} x2={548} y2={105} stroke="#0369A1" strokeWidth={2.5}
        strokeDasharray="8 4" style={{ animation: "flow 1.2s linear infinite" }} />
      <polygon points="544,100 556,105 544,110" fill="#0369A1" />
      <rect x={440} y={68} width={78} height={24} rx={6} fill="#EDE9FE" />
      <text x={479} y={78} textAnchor="middle" fontSize={7} fill="#7C3AED" fontWeight="700">TARGET pH</text>
      <text x={479} y={88} textAnchor="middle" fontSize={11} fill="#7C3AED" fontWeight="800" fontFamily="monospace">6.5–7.2</text>
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

export function FlocculationDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "inlet", x: 80, y: 170, text: "From Coagulation" },
    { id: "basin1", x: 175, y: 170, text: "Stage 1 (Fast Mix)" },
    { id: "paddles", x: 175, y: 195, text: "Paddle Mixer" },
    { id: "basin2", x: 310, y: 170, text: "Stage 2 (Slow Mix)" },
    { id: "basin3", x: 445, y: 170, text: "Stage 3 (Gentle)" },
    { id: "outlet", x: 540, y: 170, text: "To Sedimentation" },
  ];
  const basinColors = ["#FCE7F3", "#FDF2F8", "#FFF0F6"];
  return (
    <svg viewBox="0 0 600 215" width="100%" height="auto">
      {/* Inlet pipe */}
      <path d="M 20 113 L 80 113" stroke="#BE185D" strokeWidth={3} />
      <polygon points="77,108 88,113 77,118" fill="#BE185D" />
      {/* Three basins */}
      {[110, 245, 380].map((x, i) => (
        <g key={i}>
          <rect x={x} y={65} width={120} height={100} rx={8} fill={basinColors[i]} stroke="#BE185D" strokeWidth={1.5} opacity={0.8} />
          <rect x={x + 2} y={67} width={116} height={96} rx={6} fill="#F9A8D4" opacity={0.15} />
          {/* Paddle */}
          <circle cx={x + 60} cy={115} r={22} fill="none" stroke="#BE185D" strokeWidth={1.5} strokeDasharray="5 3"
            style={{ animation: `flow ${1.5 + i * 0.5}s linear infinite`, transformOrigin: `${x + 60}px 115px` }} />
          <line x1={x + 38} y1={115} x2={x + 82} y2={115} stroke="#9D174D" strokeWidth={2.5} />
          <line x1={x + 60} y1={93} x2={x + 60} y2={137} stroke="#9D174D" strokeWidth={2.5} />
          <circle cx={x + 60} cy={115} r={6} fill="#BE185D" />
          {/* G value label */}
          <rect x={x + 20} y={70} width={80} height={16} rx={4} fill="rgba(255,255,255,0.85)" />
          <text x={x + 60} y={81} textAnchor="middle" fontSize={8} fill="#BE185D" fontWeight="700">
            {i === 0 ? "G ≈ 75/s" : i === 1 ? "G ≈ 35/s" : "G ≈ 10/s"}
          </text>
          {/* Floc particles */}
          {Array.from({ length: 8 }).map((_, j) => (
            <circle key={j} cx={x + 20 + j * 12} cy={100 + (j % 3) * 8} r={3 + i * 1.5}
              fill="#BE185D" opacity={0.2 + i * 0.1} />
          ))}
        </g>
      ))}
      {/* Connecting pipes */}
      {[230, 365].map((x, i) => (
        <g key={i}>
          <rect x={x} y={106} width={15} height={14} rx={3} fill="#F9A8D4" opacity={0.5} />
          <line x1={x} y1={113} x2={x + 15} y2={113} stroke="#BE185D" strokeWidth={2}
            strokeDasharray="4 2" style={{ animation: "flow 1s linear infinite" }} />
        </g>
      ))}
      {/* Outlet */}
      <path d="M 500 113 L 560 113" stroke="#059669" strokeWidth={3} />
      <polygon points="556,108 568,113 556,118" fill="#059669" />
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

export function ClarifierDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "inlet2", x: 95, y: 165, text: "Inlet Zone" },
    { id: "flocblanket", x: 230, y: 165, text: "Floc Blanket" },
    { id: "scraper", x: 310, y: 165, text: "Sludge Scraper" },
    { id: "hopper", x: 310, y: 200, text: "Sludge Hopper" },
    { id: "weir", x: 490, y: 165, text: "Effluent Weir" },
    { id: "launder", x: 560, y: 165, text: "Launder" },
  ];
  return (
    <svg viewBox="0 0 620 230" width="100%" height="auto">
      <path d="M 50 50 L 50 195 L 155 195 L 310 208 L 460 195 L 570 195 L 570 50 Z"
        fill="#E0F2FE" stroke="#0369A1" strokeWidth={2} />
      <path d="M 52 55 L 52 190 L 155 190 L 310 203 L 460 190 L 568 190 L 568 55 Z"
        fill="#BAE6FD" opacity={0.55} />
      <path d="M 20 105 L 72 105" stroke="#0369A1" strokeWidth={3} />
      <polygon points="68,100 80,105 68,110" fill="#0369A1" />
      <rect x={72} y={50} width={9} height={112} rx={2} fill="#1E3A5C" />
      <path d="M 85 95 Q 200 76 325 88 Q 420 96 560 82"
        stroke="#A78BFA" strokeWidth={2} fill="none" strokeDasharray="6 3" opacity={0.8} />
      <path d="M 85 108 Q 200 90 325 100 Q 420 108 560 95 L 560 82 Q 420 96 325 88 Q 200 76 85 95 Z"
        fill="#DDD6FE" opacity={0.3} />
      <path d="M 52 190 L 155 190 L 310 203 L 460 190 L 568 190 L 568 210 L 52 210 Z"
        fill="#92400E" opacity={0.35} />
      <path d="M 282 203 L 310 218 L 338 203" fill="#78350F" opacity={0.7} />
      <line x1={88} y1={148} x2={525} y2={196} stroke="#475569" strokeWidth={3} strokeLinecap="round" />
      <circle cx={310} cy={172} r={5} fill="#1E3A5C" />
      <rect x={548} y={50} width={12} height={142} rx={2} fill="#0F766E" opacity={0.75} />
      <rect x={548} y={82} width={36} height={18} rx={3} fill="#CCFBF1" stroke="#0F766E" strokeWidth={1.5} />
      <path d="M 585 91 L 600 91" stroke="#0F766E" strokeWidth={2} />
      <polygon points="597,86 608,91 597,96" fill="#0F766E" />
      {[75, 110, 148].map((y, i) => (
        <path key={i} d={`M ${85 + i * 25} ${y} Q 220 ${y - 8} 350 ${y}`}
          stroke="#0369A1" strokeWidth={1.5} fill="none" opacity={0.3}
          strokeDasharray="5 3" style={{ animation: `flow ${1.6 + i * 0.25}s linear infinite` }} />
      ))}
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

export function FilterDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "influent", x: 305, y: 32, text: "Filter Influent" },
    { id: "anthracite", x: 305, y: 78, text: "Anthracite" },
    { id: "sand", x: 305, y: 122, text: "Sand Layer" },
    { id: "gravel", x: 305, y: 162, text: "Gravel Support" },
    { id: "underdrain", x: 305, y: 198, text: "Underdrain" },
    { id: "turbidity", x: 110, y: 170, text: "Turbidity Monitor" },
  ];
  const anthrDots = [[220, 65], [245, 72], [270, 63], [295, 70], [320, 65], [345, 72], [370, 64], [395, 70], [420, 65], [445, 72], [470, 65]];
  const sandDots = [[215, 112], [240, 118], [265, 112], [290, 120], [315, 113], [340, 119], [365, 112], [390, 119], [415, 113], [440, 119], [465, 112]];
  const gravDots = [[215, 155], [240, 160], [270, 154], [300, 160], [330, 154], [360, 160], [390, 154], [420, 160], [450, 154], [475, 160]];
  return (
    <svg viewBox="0 0 590 230" width="100%" height="auto">
      <rect x={45} y={44} width={500} height={172} rx={8} fill="#F8FAFC" stroke="#D1D5DB" strokeWidth={2} />
      <rect x={47} y={46} width={496} height={14} rx={4} fill="#BAE6FD" opacity={0.8} />
      <rect x={47} y={59} width={496} height={50} fill="#374151" opacity={0.08} />
      {anthrDots.map((d, i) => <circle key={i} cx={d[0]} cy={d[1]} r={4.5} fill="#374151" opacity={0.55} />)}
      <rect x={47} y={109} width={496} height={44} fill="#D97706" opacity={0.08} />
      {sandDots.map((d, i) => <circle key={i} cx={d[0]} cy={d[1]} r={3} fill="#D97706" opacity={0.65} />)}
      <rect x={47} y={153} width={496} height={24} fill="#92400E" opacity={0.08} />
      {gravDots.map((d, i) => <circle key={i} cx={d[0]} cy={d[1]} r={5.5} fill="#92400E" opacity={0.45} />)}
      <rect x={47} y={177} width={496} height={36} rx={4} fill="#E5E7EB" />
      {[65, 95, 125, 155, 185, 215, 245, 275, 305, 335, 365, 395, 425, 455, 485, 515].map(x => (
        <rect key={x} x={x} y={177} width={8} height={36} rx={2} fill="#CBD5E1" />
      ))}
      {[110, 200, 295, 395, 490].map((x, i) => (
        <path key={i} d={`M ${x} 46 L ${x} 174`} stroke="#0369A1" strokeWidth={1.5} fill="none"
          opacity={0.25} strokeDasharray="6 4" style={{ animation: `flow ${1.2 + i * 0.15}s linear infinite` }} />
      ))}
      <rect x={275} y={213} width={40} height={14} rx={4} fill="#0F766E" opacity={0.8} />
      <path d="M 295 227 L 295 244" stroke="#0F766E" strokeWidth={3} />
      <polygon points="290,241 295,252 300,241" fill="#0F766E" />
      {[{ y: 83, c: "#374151", t: "Anthracite" }, { y: 130, c: "#D97706", t: "Sand" }, { y: 165, c: "#92400E", t: "Gravel" }].map((m, i) => (
        <text key={i} x={554} y={m.y} fontSize={8.5} fill={m.c} fontWeight="700">{m.t}</text>
      ))}
      <rect x={32} y={155} width={90} height={30} rx={6} fill="#1D4ED8" opacity={0.9} />
      <text x={77} y={165} textAnchor="middle" fontSize={7} fill="white" fontWeight="700">TURBIDITY</text>
      <text x={77} y={178} textAnchor="middle" fontSize={11} fill="#4ADE80" fontWeight="800" fontFamily="monospace">0.12 NTU</text>
      <line x1={122} y1={170} x2={142} y2={170} stroke="#1D4ED8" strokeWidth={2} strokeDasharray="3 2" />
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

export function DisinfectionDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "inflow", x: 75, y: 165, text: "Inlet" },
    { id: "baffles", x: 210, y: 165, text: "Baffle Walls" },
    { id: "chlorine", x: 160, y: 188, text: "Cl₂ Injection" },
    { id: "ctzone", x: 310, y: 165, text: "CT Contact Zone" },
    { id: "residual", x: 435, y: 188, text: "Residual Monitor" },
    { id: "outflow", x: 548, y: 165, text: "To Distribution" },
  ];
  const serpentine = "M 75 105 L 168 105 L 168 65 L 255 65 L 255 145 L 340 145 L 340 65 L 425 65 L 425 145 L 510 145 L 510 105 L 555 105";
  return (
    <svg viewBox="0 0 620 215" width="100%" height="auto">
      <rect x={48} y={48} width={520} height={116} rx={8} fill="#FFFBEB" stroke="#D97706" strokeWidth={2} />
      {[168, 255, 340, 425, 510].map((x, i) => (
        <rect key={x} x={x - 4} y={i % 2 === 0 ? 48 : 88} width={8} height={76} rx={2} fill="#374151" opacity={0.7} />
      ))}
      <path d={serpentine} stroke="#0369A1" strokeWidth={12} fill="none" opacity={0.12} strokeLinecap="round" />
      <path d={serpentine} stroke="#0369A1" strokeWidth={2.5} fill="none"
        strokeDasharray="9 5" style={{ animation: "flow 1.3s linear infinite" }} />
      <rect x={172} y={51} width={340} height={110} rx={4} fill="#FCD34D" opacity={0.08} />
      <circle cx={160} cy={173} r={16} fill="#7C3AED" opacity={0.9} />
      <text x={160} y={178} textAnchor="middle" fontSize={11} fill="white" fontWeight="800">Cl₂</text>
      <line x1={160} y1={157} x2={160} y2={118} stroke="#7C3AED" strokeWidth={2} strokeDasharray="4 2" />
      <rect x={395} y={172} width={78} height={30} rx={6} fill="#059669" opacity={0.9} />
      <text x={434} y={182} textAnchor="middle" fontSize={7} fill="white" fontWeight="700">FREE Cl₂</text>
      <text x={434} y={195} textAnchor="middle" fontSize={11} fill="#86EFAC" fontWeight="800" fontFamily="monospace">0.52 mg/L</text>
      <line x1={434} y1={172} x2={434} y2={148} stroke="#059669" strokeWidth={2} strokeDasharray="3 2" />
      <path d="M 20 105 L 50 105" stroke="#0369A1" strokeWidth={3} />
      <polygon points="47,100 59,105 47,110" fill="#0369A1" />
      <path d="M 570 105 L 595 105" stroke="#059669" strokeWidth={3} />
      <polygon points="591,100 603,105 591,110" fill="#059669" />
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

export function DistributionDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "pump2", x: 90, y: 170, text: "Pumping Station" },
    { id: "tower", x: 210, y: 170, text: "Elevated Storage" },
    { id: "main", x: 330, y: 170, text: "Transmission Main" },
    { id: "reservoir", x: 440, y: 170, text: "Ground Reservoir" },
    { id: "service", x: 540, y: 170, text: "Service Connection" },
  ];
  return (
    <svg viewBox="0 0 600 215" width="100%" height="auto">
      <rect x={18} y={75} width={65} height={55} rx={6} fill="#EFF6FF" stroke="#1D4ED8" strokeWidth={1.5} />
      <text x={50} y={98} textAnchor="middle" fontSize={7} fill="#1D4ED8" fontWeight="700">TREATMENT</text>
      <text x={50} y={108} textAnchor="middle" fontSize={7} fill="#1D4ED8" fontWeight="700">PLANT</text>
      <circle cx={50} cy={118} r={12} fill="#1D4ED8" opacity={0.85} />
      <text x={50} y={123} textAnchor="middle" fontSize={12} fill="white">⚙</text>
      <rect x={83} y={98} width={488} height={12} rx={4} fill="#BAE6FD" opacity={0.5} />
      <line x1={83} y1={104} x2={568} y2={104} stroke="#0369A1" strokeWidth={2.5}
        strokeDasharray="10 5" style={{ animation: "flow 1.5s linear infinite" }} />
      <line x1={210} y1={65} x2={210} y2={104} stroke="#374151" strokeWidth={4} />
      <ellipse cx={210} cy={55} rx={28} ry={14} fill="#BAE6FD" stroke="#0369A1" strokeWidth={1.5} />
      <rect x={183} y={42} width={54} height={14} rx={4} fill="#BAE6FD" stroke="#0369A1" strokeWidth={1.5} />
      <text x={210} y={53} textAnchor="middle" fontSize={8} fill="#0369A1" fontWeight="700">TANK</text>
      <rect x={415} y={82} width={52} height={28} rx={6} fill="#D1FAE5" stroke="#059669" strokeWidth={1.5} />
      <text x={441} y={100} textAnchor="middle" fontSize={8} fill="#059669" fontWeight="700">RESERVOIR</text>
      {[490, 520, 550].map((x, i) => (
        <g key={i}>
          <polygon points={`${x},75 ${x + 12},63 ${x + 24},75`} fill="#FCA5A5" stroke="#EF4444" strokeWidth={1} />
          <rect x={x + 2} y={75} width={20} height={16} rx={1} fill="#FEE2E2" stroke="#EF4444" strokeWidth={1} />
          <rect x={x + 8} y={83} width={8} height={8} rx={1} fill="#EF4444" opacity={0.6} />
        </g>
      ))}
      {[496, 526, 556].map(x => (
        <line key={x} x1={x} y1={91} x2={x} y2={104} stroke="#059669" strokeWidth={1.5} strokeDasharray="3 2" />
      ))}
      <rect x={295} y={68} width={70} height={24} rx={6} fill="#EFF6FF" stroke="#1D4ED8" strokeWidth={1} />
      <text x={330} y={78} textAnchor="middle" fontSize={7} fill="#1D4ED8" fontWeight="700">PRESSURE</text>
      <text x={330} y={88} textAnchor="middle" fontSize={10} fill="#1D4ED8" fontWeight="800" fontFamily="monospace">350 kPa</text>
      <rect x={355} y={112} width={68} height={22} rx={5} fill="#D1FAE5" stroke="#059669" strokeWidth={1} />
      <text x={389} y={122} textAnchor="middle" fontSize={7} fill="#059669" fontWeight="700">FREE Cl₂</text>
      <text x={389} y={131} textAnchor="middle" fontSize={10} fill="#059669" fontWeight="800" fontFamily="monospace">0.3 mg/L</text>
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

export function DiagramFor({ stepId, color, active, onClick }: {
  stepId: string;
  color: string;
  active: string | null;
  onClick: (id: string | null) => void;
}) {
  const props = { active, onClick, color };
  if (stepId === "intake") return <IntakeDiagram {...props} />;
  if (stepId === "coagulation") return <CoagulationDiagram {...props} />;
  if (stepId === "flocculation") return <FlocculationDiagram {...props} />;
  if (stepId === "sedimentation") return <ClarifierDiagram {...props} />;
  if (stepId === "filtration") return <FilterDiagram {...props} />;
  if (stepId === "disinfection") return <DisinfectionDiagram {...props} />;
  if (stepId === "distribution") return <DistributionDiagram {...props} />;
  return null;
}
