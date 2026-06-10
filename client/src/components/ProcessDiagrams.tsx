// Echelon Process v3 — SVG Diagram Components
// Design: Professional SaaS — Clean Light Theme
// Each diagram: viewBox 0 0 640 240, labels always inside bounds, no clipping

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
        <circle cx={x} cy={y} r={10} fill="none" stroke={color} strokeWidth={2} opacity={0.4}
          style={{ animation: "ping 1.2s ease-out infinite" }} />
      )}
      <circle cx={x} cy={y} r={12} fill={isActive ? color : "#fff"} stroke={color} strokeWidth={2.5} />
      <circle cx={x} cy={y} r={5} fill={isActive ? "#fff" : color} />
      {/* Label pill above dot */}
      <rect x={x - 54} y={y - 32} width={108} height={17} rx={5}
        fill={isActive ? color : "rgba(255,255,255,0.95)"} stroke={isActive ? "none" : color} strokeWidth={1} />
      <text x={x} y={y - 20} textAnchor="middle" fontSize={8.5}
        fill={isActive ? "#fff" : color} fontWeight="700"
        style={{ pointerEvents: "none", userSelect: "none" as const }}>{text}</text>
      {/* Invisible hit area */}
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

// ─── 1. INTAKE ───────────────────────────────────────────────────────────────
export function IntakeDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "source",     x: 75,  y: 195, text: "Water Source" },
    { id: "barscreen",  x: 195, y: 195, text: "Bar Screen" },
    { id: "finescreen", x: 320, y: 195, text: "Fine Screen" },
    { id: "pump",       x: 445, y: 195, text: "Low-lift Pump" },
    { id: "flowmeter",  x: 565, y: 195, text: "Flow Meter" },
  ];
  return (
    <svg viewBox="0 0 640 230" width="100%" height="auto">
      {/* Water body */}
      <ellipse cx={75} cy={110} rx={55} ry={35} fill="#BAE6FD" stroke="#0369A1" strokeWidth={2} />
      <text x={75} y={107} textAnchor="middle" fontSize={8} fill="#0369A1" fontWeight="700">LAKE /</text>
      <text x={75} y={118} textAnchor="middle" fontSize={8} fill="#0369A1" fontWeight="700">RIVER</text>
      {/* Wave lines on water */}
      {[95, 103, 111].map((y, i) => (
        <path key={i} d={`M ${45 + i * 5} ${y} Q ${65} ${y - 4} ${85} ${y} Q ${105} ${y + 4} ${115} ${y}`}
          stroke="#7DD3FC" strokeWidth={1} fill="none" opacity={0.6} />
      ))}
      {/* Main pipe */}
      <rect x={128} y={101} width={480} height={18} rx={6} fill="#7DD3FC" opacity={0.3} />
      <line x1={128} y1={110} x2={610} y2={110} stroke="#0369A1" strokeWidth={2.5}
        strokeDasharray="10 5" style={{ animation: "flow 1.4s linear infinite" }} />
      {/* Bar screen */}
      <rect x={178} y={82} width={16} height={56} rx={3} fill="#1E3A5C" opacity={0.85} />
      {[88, 96, 104, 112, 120, 128].map(y => (
        <line key={y} x1={178} y1={y} x2={194} y2={y} stroke="#7DD3FC" strokeWidth={1.5} opacity={0.7} />
      ))}
      {/* Fine screen */}
      <rect x={304} y={88} width={12} height={44} rx={2} fill="#374151" opacity={0.8} />
      {[92, 97, 102, 107, 112, 117, 122, 127].map(y => (
        <line key={y} x1={304} y1={y} x2={316} y2={y} stroke="#93C5FD" strokeWidth={1} opacity={0.8} />
      ))}
      {/* Pump */}
      <circle cx={445} cy={110} r={22} fill="#1D4ED8" opacity={0.9} />
      <circle cx={445} cy={110} r={14} fill="#1D4ED8" />
      <text x={445} y={116} textAnchor="middle" fontSize={16} fill="white">⚙</text>
      {/* Flow meter */}
      <rect x={548} y={96} width={32} height={28} rx={7} fill="#0F766E" opacity={0.9} />
      <text x={564} y={108} textAnchor="middle" fontSize={9} fill="white" fontWeight="700">FM</text>
      <text x={564} y={119} textAnchor="middle" fontSize={8} fill="#6EE7B7">≋</text>
      {/* Outlet arrow */}
      <path d="M 582 110 L 620 110" stroke="#0369A1" strokeWidth={2.5} />
      <polygon points="616,105 628,110 616,115" fill="#0369A1" />
      {/* Labels */}
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ─── 2. COAGULATION ──────────────────────────────────────────────────────────
export function CoagulationDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "rawwater",  x: 75,  y: 195, text: "Raw Water In" },
    { id: "chemical",  x: 200, y: 195, text: "Chemical Dosing" },
    { id: "rapidmix",  x: 360, y: 195, text: "Rapid Mix Basin" },
    { id: "outlet",    x: 540, y: 195, text: "To Flocculation" },
  ];
  return (
    <svg viewBox="0 0 640 230" width="100%" height="auto">
      {/* Inlet pipe */}
      <rect x={20} y={101} width={130} height={18} rx={6} fill="#7DD3FC" opacity={0.3} />
      <line x1={20} y1={110} x2={148} y2={110} stroke="#0369A1" strokeWidth={2.5}
        strokeDasharray="8 4" style={{ animation: "flow 1.2s linear infinite" }} />
      {/* Chemical dosing tank */}
      <rect x={155} y={55} width={50} height={60} rx={8} fill="#EDE9FE" stroke="#7C3AED" strokeWidth={2} />
      <rect x={158} y={58} width={44} height={20} rx={4} fill="#DDD6FE" />
      <text x={180} y={72} textAnchor="middle" fontSize={8} fill="#7C3AED" fontWeight="700">ALUM</text>
      <text x={180} y={84} textAnchor="middle" fontSize={8} fill="#7C3AED" fontWeight="600">TANK</text>
      {/* Liquid level in tank */}
      <rect x={158} y={82} width={44} height={30} rx={3} fill="#C4B5FD" opacity={0.4} />
      {/* Dosing line */}
      <line x1={180} y1={115} x2={180} y2={135} stroke="#7C3AED" strokeWidth={2} strokeDasharray="4 2" />
      <polygon points="175,132 180,144 185,132" fill="#7C3AED" />
      {/* Rapid mix basin */}
      <rect x={248} y={58} width={224} height={120} rx={10} fill="#F0F9FF" stroke="#0369A1" strokeWidth={2} />
      <rect x={250} y={60} width={220} height={116} rx={8} fill="#BAE6FD" opacity={0.25} />
      {/* Mixer shaft + impeller */}
      <rect x={357} y={40} width={6} height={26} rx={2} fill="#1E3A5C" />
      <rect x={340} y={63} width={40} height={6} rx={3} fill="#374151" />
      <rect x={355} y={63} width={10} height={55} rx={3} fill="#374151" />
      <rect x={330} y={100} width={60} height={6} rx={3} fill="#374151" />
      <circle cx={360} cy={103} r={10} fill="#1D4ED8" opacity={0.85} />
      {/* Turbulence ripples */}
      {[[290, 90], [320, 115], [350, 85], [390, 120], [410, 95], [430, 110]].map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={5 + (i % 3) * 3} fill="none"
          stroke="#0369A1" strokeWidth={1} opacity={0.25} />
      ))}
      {/* pH readout */}
      <rect x={455} y={68} width={82} height={28} rx={6} fill="#EDE9FE" stroke="#7C3AED" strokeWidth={1} />
      <text x={496} y={80} textAnchor="middle" fontSize={7} fill="#7C3AED" fontWeight="700">TARGET pH</text>
      <text x={496} y={91} textAnchor="middle" fontSize={11} fill="#7C3AED" fontWeight="800" fontFamily="monospace">6.5–7.2</text>
      {/* Outlet pipe */}
      <rect x={472} y={101} width={148} height={18} rx={6} fill="#7DD3FC" opacity={0.3} />
      <line x1={474} y1={110} x2={618} y2={110} stroke="#0369A1" strokeWidth={2.5}
        strokeDasharray="8 4" style={{ animation: "flow 1.2s linear infinite" }} />
      <polygon points="614,105 626,110 614,115" fill="#0369A1" />
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ─── 3. FLOCCULATION ─────────────────────────────────────────────────────────
export function FlocculationDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "inlet",  x: 50,  y: 195, text: "From Coagulation" },
    { id: "basin1", x: 175, y: 195, text: "Stage 1 — Fast" },
    { id: "basin2", x: 335, y: 195, text: "Stage 2 — Slow" },
    { id: "basin3", x: 490, y: 195, text: "Stage 3 — Gentle" },
    { id: "outlet", x: 600, y: 195, text: "To Sedimentation" },
  ];
  const basins = [
    { x: 90,  g: "G ≈ 75/s",  col: "#FCE7F3", stroke: "#BE185D", speed: "0.8s" },
    { x: 255, g: "G ≈ 35/s",  col: "#FDF4FF", stroke: "#9333EA", speed: "1.3s" },
    { x: 415, g: "G ≈ 10/s",  col: "#F0FDF4", stroke: "#16A34A", speed: "2.2s" },
  ];
  return (
    <svg viewBox="0 0 640 230" width="100%" height="auto">
      {/* Inlet arrow */}
      <path d="M 10 113 L 88 113" stroke="#BE185D" strokeWidth={3} />
      <polygon points="85,108 97,113 85,118" fill="#BE185D" />
      {/* Three basins */}
      {basins.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={58} width={140} height={110} rx={10} fill={b.col} stroke={b.stroke} strokeWidth={2} />
          {/* G value badge */}
          <rect x={b.x + 20} y={65} width={100} height={18} rx={5} fill="rgba(255,255,255,0.9)" />
          <text x={b.x + 70} y={77} textAnchor="middle" fontSize={8.5} fill={b.stroke} fontWeight="700">{b.g}</text>
          {/* Paddle mixer */}
          <rect x={b.x + 67} y={45} width={6} height={20} rx={2} fill="#374151" />
          <rect x={b.x + 38} y={100} width={64} height={5} rx={2} fill={b.stroke} opacity={0.85} />
          <rect x={b.x + 38} y={118} width={64} height={5} rx={2} fill={b.stroke} opacity={0.85} />
          <rect x={b.x + 67} y={88} width={6} height={44} rx={2} fill="#374151" />
          <circle cx={b.x + 70} cy={110} r={8} fill={b.stroke} opacity={0.9} />
          {/* Rotation indicator */}
          <circle cx={b.x + 70} cy={110} r={22} fill="none" stroke={b.stroke} strokeWidth={1.5}
            strokeDasharray="5 4" opacity={0.4}
            style={{ animation: `flow ${b.speed} linear infinite`, transformOrigin: `${b.x + 70}px 110px` }} />
          {/* Floc particles — grow larger in each stage */}
          {Array.from({ length: 10 }).map((_, j) => (
            <circle key={j}
              cx={b.x + 18 + j * 11}
              cy={140 + (j % 3) * 7}
              r={2 + i * 2}
              fill={b.stroke} opacity={0.18 + i * 0.08} />
          ))}
        </g>
      ))}
      {/* Connecting pipes */}
      {[230, 395].map((x, i) => (
        <g key={i}>
          <rect x={x} y={106} width={25} height={14} rx={4} fill="#E9D5FF" opacity={0.6} />
          <line x1={x} y1={113} x2={x + 25} y2={113} stroke="#9333EA" strokeWidth={2}
            strokeDasharray="4 2" style={{ animation: "flow 1s linear infinite" }} />
        </g>
      ))}
      {/* Outlet arrow */}
      <path d="M 555 113 L 628 113" stroke="#059669" strokeWidth={3} />
      <polygon points="624,108 636,113 624,118" fill="#059669" />
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ─── 4. SEDIMENTATION (CLARIFIER) ────────────────────────────────────────────
export function ClarifierDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "inlet2",      x: 90,  y: 195, text: "Inlet Zone" },
    { id: "flocblanket", x: 240, y: 195, text: "Floc Blanket" },
    { id: "scraper",     x: 370, y: 195, text: "Sludge Scraper" },
    { id: "weir",        x: 510, y: 195, text: "Effluent Weir" },
    { id: "sludge",      x: 310, y: 215, text: "Sludge Hopper" },
  ];
  return (
    <svg viewBox="0 0 640 240" width="100%" height="auto">
      {/* Basin outline — trapezoidal bottom */}
      <path d="M 45 45 L 45 175 L 160 185 L 320 192 L 480 185 L 590 175 L 590 45 Z"
        fill="#E0F2FE" stroke="#0369A1" strokeWidth={2} />
      {/* Water fill */}
      <path d="M 47 47 L 47 172 L 160 182 L 320 189 L 480 182 L 588 172 L 588 47 Z"
        fill="#BAE6FD" opacity={0.4} />
      {/* Inlet baffle */}
      <rect x={47} y={45} width={10} height={120} rx={2} fill="#1E3A5C" opacity={0.8} />
      {/* Inlet pipe */}
      <path d="M 10 110 L 57 110" stroke="#0369A1" strokeWidth={3} />
      <polygon points="53,105 65,110 53,115" fill="#0369A1" />
      {/* Floc blanket zone */}
      <path d="M 80 120 Q 200 108 320 115 Q 440 122 560 110 L 560 172 L 480 182 L 160 182 L 80 172 Z"
        fill="#A78BFA" opacity={0.18} />
      <path d="M 80 120 Q 200 108 320 115 Q 440 122 560 110"
        stroke="#7C3AED" strokeWidth={1.5} fill="none" strokeDasharray="6 3" opacity={0.6} />
      {/* Sludge at bottom */}
      <path d="M 47 172 L 160 182 L 320 192 L 480 182 L 588 172 L 588 185 L 480 195 L 320 205 L 160 195 L 47 185 Z"
        fill="#92400E" opacity={0.3} />
      {/* Sludge hopper */}
      <path d="M 290 192 L 320 215 L 350 192" fill="#78350F" opacity={0.65} />
      <line x1={320} y1={215} x2={320} y2={228} stroke="#78350F" strokeWidth={3} />
      <polygon points="315,225 320,232 325,225" fill="#78350F" opacity={0.7} />
      {/* Scraper arm */}
      <line x1={80} y1={135} x2={540} y2={188} stroke="#E2E8F0" strokeWidth={3.5} strokeLinecap="round" />
      <circle cx={310} cy={162} r={7} fill="#1E3A5C" />
      <line x1={310} y1={45} x2={310} y2={162} stroke="#374151" strokeWidth={2} strokeDasharray="5 3" opacity={0.5} />
      {/* Effluent weir */}
      <rect x={570} y={45} width={14} height={130} rx={2} fill="#0F766E" opacity={0.8} />
      <rect x={570} y={90} width={40} height={22} rx={4} fill="#CCFBF1" stroke="#0F766E" strokeWidth={1.5} />
      <text x={590} y={103} textAnchor="middle" fontSize={7.5} fill="#0F766E" fontWeight="700">WEIR</text>
      {/* Outlet arrow */}
      <path d="M 610 110 L 632 110" stroke="#0F766E" strokeWidth={2.5} />
      <polygon points="628,105 640,110 628,115" fill="#0F766E" />
      {/* Flow arrows */}
      {[70, 100, 130].map((y, i) => (
        <path key={i} d={`M ${75 + i * 20} ${y} Q 250 ${y - 10} 420 ${y}`}
          stroke="#0369A1" strokeWidth={1.5} fill="none" opacity={0.25}
          strokeDasharray="5 3" style={{ animation: `flow ${1.6 + i * 0.3}s linear infinite` }} />
      ))}
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ─── 5. FILTRATION ───────────────────────────────────────────────────────────
export function FilterDiagram({ active, onClick, color }: DiagramProps) {
  // Labels placed OUTSIDE the filter box to avoid stacking inside it
  // Influent above, layer labels on right side, turbidity + underdrain below
  const labels = [
    { id: "influent",   x: 320, y: 30,  text: "Filter Influent" },
    { id: "anthracite", x: 590, y: 86,  text: "Anthracite" },
    { id: "sand",       x: 590, y: 131, text: "Sand Layer" },
    { id: "gravel",     x: 590, y: 165, text: "Gravel" },
    { id: "underdrain", x: 320, y: 218, text: "Underdrain" },
    { id: "turbidity",  x: 75,  y: 218, text: "Turbidity Monitor" },
  ];
  // Media dot patterns — shifted right to leave room for right-side labels
  const anthrDots: [number, number][] = [];
  const sandDots:  [number, number][] = [];
  const gravDots:  [number, number][] = [];
  for (let x = 58; x < 530; x += 18) {
    anthrDots.push([x, 68 + (x % 3) * 5]);
    sandDots.push([x + 4, 115 + (x % 3) * 4]);
  }
  for (let x = 58; x < 530; x += 22) {
    gravDots.push([x, 155 + (x % 3) * 5]);
  }
  return (
    <svg viewBox="0 0 660 245" width="100%" height="auto">
      {/* Filter box — narrower to leave right margin for labels */}
      <rect x={50} y={44} width={490} height={168} rx={8} fill="#1E293B" stroke="#94A3B8" strokeWidth={2} />
      {/* Influent water layer */}
      <rect x={52} y={46} width={486} height={16} rx={4} fill="#BAE6FD" opacity={0.75} />
      {/* Influent arrow from above */}
      <path d="M 320 10 L 320 44" stroke="#0369A1" strokeWidth={2.5} />
      <polygon points="315,41 320,50 325,41" fill="#0369A1" />
      {/* Anthracite zone */}
      <rect x={52} y={62} width={486} height={48} fill="#374151" opacity={0.06} />
      {anthrDots.map((d, i) => <circle key={i} cx={d[0]} cy={d[1]} r={4.5} fill="#374151" opacity={0.5} />)}
      {/* Sand zone */}
      <rect x={52} y={110} width={486} height={42} fill="#D97706" opacity={0.06} />
      {sandDots.map((d, i) => <circle key={i} cx={d[0]} cy={d[1]} r={3} fill="#D97706" opacity={0.6} />)}
      {/* Gravel zone */}
      <rect x={52} y={152} width={486} height={26} fill="#92400E" opacity={0.07} />
      {gravDots.map((d, i) => <circle key={i} cx={d[0]} cy={d[1]} r={5.5} fill="#92400E" opacity={0.4} />)}
      {/* Underdrain */}
      <rect x={52} y={178} width={486} height={32} rx={4} fill="#94A3B8" />
      {[68, 96, 124, 152, 180, 208, 236, 264, 292, 320, 348, 376, 404, 432, 460, 488, 516].map(x => (
        <rect key={x} x={x} y={178} width={8} height={32} rx={2} fill="#94A3B8" />
      ))}
      {/* Flow arrows (downward through media) */}
      {[110, 200, 295, 395, 480].map((x, i) => (
        <path key={i} d={`M ${x} 46 L ${x} 175`} stroke="#0369A1" strokeWidth={1.5} fill="none"
          opacity={0.2} strokeDasharray="6 4" style={{ animation: `flow ${1.2 + i * 0.15}s linear infinite` }} />
      ))}
      {/* Effluent outlet at bottom */}
      <path d="M 320 212 L 320 232" stroke="#0F766E" strokeWidth={3} />
      <polygon points="315,229 320,238 325,229" fill="#0F766E" opacity={0.85} />
      {/* Zone divider lines on right — connect to right-side label dots */}
      <line x1={540} y1={86}  x2={555} y2={86}  stroke="#374151" strokeWidth={1.5} strokeDasharray="3 2" opacity={0.5} />
      <line x1={540} y1={131} x2={555} y2={131} stroke="#D97706" strokeWidth={1.5} strokeDasharray="3 2" opacity={0.5} />
      <line x1={540} y1={165} x2={555} y2={165} stroke="#92400E" strokeWidth={1.5} strokeDasharray="3 2" opacity={0.5} />
      {/* Turbidity monitor — bottom left, outside filter box */}
      <rect x={18} y={196} width={84} height={34} rx={7} fill="#1D4ED8" opacity={0.9} />
      <text x={60} y={208} textAnchor="middle" fontSize={7} fill="white" fontWeight="700">TURBIDITY</text>
      <text x={60} y={222} textAnchor="middle" fontSize={11} fill="#4ADE80" fontWeight="800" fontFamily="monospace">0.12 NTU</text>
      <line x1={102} y1={213} x2={118} y2={200} stroke="#1D4ED8" strokeWidth={2} strokeDasharray="3 2" />
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ─── 6. DISINFECTION ─────────────────────────────────────────────────────────
export function DisinfectionDiagram({ active, onClick, color }: DiagramProps) {
  // Wider viewBox (760px) so 6 labels have room without overlapping
  const labels = [
    { id: "inflow",   x: 65,  y: 210, text: "Inlet" },
    { id: "chlorine", x: 195, y: 232, text: "Cl₂ Injection" },
    { id: "baffles",  x: 335, y: 210, text: "Baffle Walls" },
    { id: "ctzone",   x: 475, y: 210, text: "CT Contact Zone" },
    { id: "residual", x: 600, y: 232, text: "Residual Monitor" },
    { id: "outflow",  x: 710, y: 210, text: "To Distribution" },
  ];
  // Serpentine path — chamber x=40–640
  const serpentine = "M 65 115 L 180 115 L 180 68 L 280 68 L 280 162 L 380 162 L 380 68 L 480 68 L 480 162 L 580 162 L 580 115 L 648 115";
  return (
    <svg viewBox="0 0 760 255" width="100%" height="auto">
      {/* Contact chamber — x=40 to 660, height 50–168 */}
      <rect x={40} y={50} width={620} height={120} rx={8} fill="#FFFBEB" stroke="#D97706" strokeWidth={2} />
      {/* CT zone highlight */}
      <rect x={185} y={53} width={415} height={114} rx={5} fill="#FCD34D" opacity={0.07} />
      {/* Baffle walls — match serpentine x positions */}
      {[180, 280, 380, 480, 580].map((x, i) => (
        <rect key={x} x={x - 4} y={i % 2 === 0 ? 50 : 95} width={8} height={75} rx={2} fill="#374151" opacity={0.75} />
      ))}
      {/* Water flow path */}
      <path d={serpentine} stroke="#0369A1" strokeWidth={14} fill="none" opacity={0.1} strokeLinecap="round" />
      <path d={serpentine} stroke="#0369A1" strokeWidth={2.5} fill="none"
        strokeDasharray="9 5" style={{ animation: "flow 1.3s linear infinite" }} />
      {/* Inlet arrow */}
      <path d="M 10 115 L 42 115" stroke="#0369A1" strokeWidth={3} />
      <polygon points="38,110 50,115 38,120" fill="#0369A1" />
      {/* Outlet arrow */}
      <path d="M 650 115 L 700 115" stroke="#059669" strokeWidth={3} />
      <polygon points="696,110 708,115 696,120" fill="#059669" />
      {/* Cl₂ injector — below chamber left, between label dots */}
      <circle cx={195} cy={192} r={18} fill="#7C3AED" opacity={0.9} />
      <text x={195} y={197} textAnchor="middle" fontSize={12} fill="white" fontWeight="800">Cl₂</text>
      <line x1={195} y1={174} x2={195} y2={130} stroke="#7C3AED" strokeWidth={2} strokeDasharray="4 2" />
      {/* Residual monitor display — below chamber right, clear of label dot */}
      <rect x={548} y={180} width={96} height={34} rx={7} fill="#059669" opacity={0.9} />
      <text x={596} y={193} textAnchor="middle" fontSize={7.5} fill="white" fontWeight="700">FREE Cl₂</text>
      <text x={596} y={207} textAnchor="middle" fontSize={11} fill="#86EFAC" fontWeight="800" fontFamily="monospace">0.52 mg/L</text>
      <line x1={580} y1={180} x2={560} y2={170} stroke="#059669" strokeWidth={2} strokeDasharray="3 2" />
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ─── 7. DISTRIBUTION ─────────────────────────────────────────────────────────
export function DistributionDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "pump2",     x: 85,  y: 195, text: "Pumping Station" },
    { id: "tower",     x: 210, y: 195, text: "Elevated Storage" },
    { id: "main",      x: 340, y: 195, text: "Transmission Main" },
    { id: "reservoir", x: 460, y: 195, text: "Ground Reservoir" },
    { id: "service",   x: 575, y: 195, text: "Service Connection" },
  ];
  return (
    <svg viewBox="0 0 640 230" width="100%" height="auto">
      {/* Treatment plant box */}
      <rect x={18} y={72} width={72} height={62} rx={8} fill="#EFF6FF" stroke="#1D4ED8" strokeWidth={1.5} />
      <text x={54} y={96} textAnchor="middle" fontSize={7} fill="#1D4ED8" fontWeight="700">TREATMENT</text>
      <text x={54} y={107} textAnchor="middle" fontSize={7} fill="#1D4ED8" fontWeight="700">PLANT</text>
      <circle cx={54} cy={120} r={13} fill="#1D4ED8" opacity={0.85} />
      <text x={54} y={125} textAnchor="middle" fontSize={14} fill="white">⚙</text>
      {/* Main distribution pipe */}
      <rect x={90} y={101} width={530} height={18} rx={6} fill="#BAE6FD" opacity={0.4} />
      <line x1={90} y1={110} x2={622} y2={110} stroke="#0369A1" strokeWidth={2.5}
        strokeDasharray="10 5" style={{ animation: "flow 1.5s linear infinite" }} />
      {/* Elevated storage tower */}
      <line x1={210} y1={68} x2={210} y2={110} stroke="#374151" strokeWidth={5} />
      {/* Tank body */}
      <ellipse cx={210} cy={52} rx={32} ry={16} fill="#BAE6FD" stroke="#0369A1" strokeWidth={1.5} />
      <rect x={178} y={36} width={64} height={17} rx={4} fill="#BAE6FD" stroke="#0369A1" strokeWidth={1.5} />
      <text x={210} y={48} textAnchor="middle" fontSize={8} fill="#0369A1" fontWeight="700">TOWER</text>
      {/* Pressure gauge */}
      <rect x={300} y={65} width={78} height={28} rx={7} fill="#EFF6FF" stroke="#1D4ED8" strokeWidth={1.5} />
      <text x={339} y={76} textAnchor="middle" fontSize={7} fill="#1D4ED8" fontWeight="700">PRESSURE</text>
      <text x={339} y={87} textAnchor="middle" fontSize={11} fill="#1D4ED8" fontWeight="800" fontFamily="monospace">350 kPa</text>
      <line x1={339} y1={93} x2={339} y2={110} stroke="#1D4ED8" strokeWidth={1.5} strokeDasharray="3 2" />
      {/* Ground reservoir */}
      <rect x={422} y={80} width={76} height={32} rx={8} fill="#D1FAE5" stroke="#059669" strokeWidth={1.5} />
      <text x={460} y={94} textAnchor="middle" fontSize={7} fill="#059669" fontWeight="700">GROUND</text>
      <text x={460} y={105} textAnchor="middle" fontSize={7} fill="#059669" fontWeight="700">RESERVOIR</text>
      {/* Chlorine residual readout */}
      <rect x={422} y={118} width={76} height={24} rx={5} fill="#D1FAE5" stroke="#059669" strokeWidth={1} />
      <text x={460} y={128} textAnchor="middle" fontSize={7} fill="#059669" fontWeight="700">FREE Cl₂</text>
      <text x={460} y={137} textAnchor="middle" fontSize={10} fill="#059669" fontWeight="800" fontFamily="monospace">0.3 mg/L</text>
      {/* Service connections (houses) */}
      {[535, 565, 595].map((x, i) => (
        <g key={i}>
          {/* Roof */}
          <polygon points={`${x},72 ${x + 14},60 ${x + 28},72`} fill="#FCA5A5" stroke="#EF4444" strokeWidth={1.5} />
          {/* Walls */}
          <rect x={x + 2} y={72} width={24} height={20} rx={1} fill="#FEE2E2" stroke="#EF4444" strokeWidth={1.5} />
          {/* Door */}
          <rect x={x + 9} y={82} width={8} height={10} rx={1} fill="#EF4444" opacity={0.55} />
          {/* Service pipe */}
          <line x1={x + 13} y1={92} x2={x + 13} y2={110} stroke="#059669" strokeWidth={1.5} strokeDasharray="3 2" />
        </g>
      ))}
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────
export function DiagramFor({ stepId, color, active, onClick }: {
  stepId: string;
  color: string;
  active: string | null;
  onClick: (id: string | null) => void;
}) {
  const props = { active, onClick, color };
  if (stepId === "intake")        return <IntakeDiagram {...props} />;
  if (stepId === "coagulation")   return <CoagulationDiagram {...props} />;
  if (stepId === "flocculation")  return <FlocculationDiagram {...props} />;
  if (stepId === "sedimentation") return <ClarifierDiagram {...props} />;
  if (stepId === "filtration")    return <FilterDiagram {...props} />;
  if (stepId === "disinfection")  return <DisinfectionDiagram {...props} />;
  if (stepId === "distribution")  return <DistributionDiagram {...props} />;
  return null;
}
