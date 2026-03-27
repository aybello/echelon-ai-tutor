// Echelon Process v2 — Wastewater Treatment SVG Diagram Components
// Design: Professional SaaS — Clean Dark-Accent (Sora, blue/teal brand)
// Each diagram is interactive with clickable label dots

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

// ── STEP 1: Screening & Grit Removal ──
export function ScreeningDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "influent",    x: 68,  y: 165, text: "Raw Influent" },
    { id: "barscreen",   x: 185, y: 165, text: "Bar Screen" },
    { id: "finescreen",  x: 305, y: 165, text: "Fine Screen" },
    { id: "gritchamber", x: 430, y: 165, text: "Grit Chamber" },
    { id: "gritpump",    x: 540, y: 165, text: "Grit Pump" },
  ];
  return (
    <svg viewBox="0 0 610 200" width="100%" height="auto">
      {/* Flow pipe */}
      <rect x={20} y={96} width={570} height={18} rx={6} fill="#DDD6FE" opacity={0.35} />
      <line x1={20} y1={105} x2={588} y2={105} stroke={color} strokeWidth={2.5}
        strokeDasharray="10 5" style={{ animation: "flow 1.4s linear infinite" }} />
      {/* Influent label box */}
      <rect x={22} y={82} width={50} height={18} rx={5} fill="#EDE9FE" stroke={color} strokeWidth={1} />
      <text x={47} y={94} textAnchor="middle" fontSize={8} fill={color} fontWeight="700">SEWAGE</text>
      {/* Bar screen */}
      <rect x={168} y={74} width={14} height={62} rx={3} fill="#1E1B4B" />
      {[78, 85, 92, 99, 106, 113, 120, 127].map(y => (
        <line key={y} x1={168} y1={y} x2={182} y2={y} stroke="#A78BFA" strokeWidth={1.5} />
      ))}
      {/* Fine screen */}
      <rect x={290} y={80} width={10} height={50} rx={2} fill="#374151" />
      {[84, 89, 94, 99, 104, 109, 114, 119, 124].map(y => (
        <line key={y} x1={290} y1={y} x2={300} y2={y} stroke="#C4B5FD" strokeWidth={1} />
      ))}
      {/* Grit chamber */}
      <rect x={380} y={72} width={100} height={66} rx={8} fill="#F5F3FF" stroke={color} strokeWidth={1.5} />
      <path d="M 390 138 Q 430 148 470 138" stroke={color} strokeWidth={1.5} fill="none" />
      {/* Grit particles */}
      {[[398,130],[412,134],[426,136],[440,134],[454,130],[468,128]].map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r={3.5} fill="#92400E" opacity={0.6} />
      ))}
      {/* Spiral flow in grit chamber */}
      <path d="M 395 95 Q 430 82 465 95 Q 430 108 395 95" stroke={color} strokeWidth={1}
        fill="none" opacity={0.4} strokeDasharray="4 3"
        style={{ animation: "flow 1.2s linear infinite" }} />
      {/* Grit pump */}
      <circle cx={540} cy={105} r={20} fill="#7C3AED" opacity={0.85} />
      <text x={540} y={110} textAnchor="middle" fontSize={18} fill="white">⚙</text>
      {/* Arrow out */}
      <path d="M 560 105 L 595 105" stroke={color} strokeWidth={2.5} />
      <polygon points="591,100 603,105 591,110" fill={color} />
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ── STEP 2: Primary Clarification ──
export function PrimaryDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "inlet3",   x: 75,  y: 165, text: "Inlet" },
    { id: "scum",     x: 220, y: 165, text: "Scum Skimmer" },
    { id: "scraper2", x: 310, y: 165, text: "Sludge Scraper" },
    { id: "hopper2",  x: 310, y: 200, text: "Sludge Hopper" },
    { id: "weir2",    x: 490, y: 165, text: "Effluent Weir" },
  ];
  return (
    <svg viewBox="0 0 600 225" width="100%" height="auto">
      {/* Tank outline */}
      <path d="M 48 48 L 48 192 L 155 192 L 300 206 L 445 192 L 555 192 L 555 48 Z"
        fill="#FEF3C7" stroke={color} strokeWidth={2} />
      <path d="M 50 52 L 50 188 L 155 188 L 300 202 L 445 188 L 553 188 L 553 52 Z"
        fill="#FCD34D" opacity={0.18} />
      {/* Inlet pipe */}
      <path d="M 18 105 L 60 105" stroke={color} strokeWidth={3} />
      <polygon points="56,100 68,105 56,110" fill={color} />
      <rect x={60} y={48} width={9} height={112} rx={2} fill="#92400E" />
      {/* Scum layer */}
      <path d="M 75 62 Q 200 55 350 60 Q 450 63 545 58" stroke="#D97706" strokeWidth={3}
        fill="none" opacity={0.7} />
      <path d="M 75 62 Q 200 55 350 60 Q 450 63 545 58 L 545 72 Q 450 75 350 72 Q 200 67 75 74 Z"
        fill="#FDE68A" opacity={0.5} />
      {/* Scum skimmer arm */}
      <line x1={100} y1={58} x2={500} y2={58} stroke="#B45309" strokeWidth={2.5}
        strokeDasharray="6 3" />
      <circle cx={300} cy={58} r={5} fill="#B45309" />
      {/* Sludge at bottom */}
      <path d="M 50 188 L 155 188 L 300 202 L 445 188 L 553 188 L 553 210 L 50 210 Z"
        fill="#92400E" opacity={0.4} />
      <path d="M 272 202 L 300 216 L 328 202" fill="#78350F" opacity={0.7} />
      {/* Scraper arm */}
      <line x1={88} y1={145} x2={510} y2={194} stroke="#475569" strokeWidth={3} strokeLinecap="round" />
      <circle cx={300} cy={170} r={5} fill="#1E3A5C" />
      {/* Effluent weir */}
      <rect x={534} y={48} width={12} height={142} rx={2} fill="#0F766E" opacity={0.75} />
      <rect x={534} y={80} width={36} height={18} rx={3} fill="#D1FAE5" stroke="#059669" strokeWidth={1.5} />
      <path d="M 570 89 L 585 89" stroke="#059669" strokeWidth={2} />
      <polygon points="582,84 593,89 582,94" fill="#059669" />
      {/* Flow arrows */}
      {[75, 110, 148].map((y, i) => (
        <path key={i} d={`M ${85 + i * 20} ${y} Q 220 ${y - 8} 350 ${y}`}
          stroke={color} strokeWidth={1.5} fill="none" opacity={0.25}
          strokeDasharray="5 3" style={{ animation: `flow ${1.5 + i * 0.2}s linear infinite` }} />
      ))}
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ── STEP 3: Biological Treatment (Activated Sludge) ──
export function BiologicalDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "return",    x: 75,  y: 165, text: "RAS Return" },
    { id: "aerator",   x: 220, y: 165, text: "Air Diffusers" },
    { id: "mlss",      x: 310, y: 165, text: "MLSS" },
    { id: "blower",    x: 310, y: 200, text: "Blower" },
    { id: "do_sensor", x: 460, y: 165, text: "DO Sensor" },
  ];
  return (
    <svg viewBox="0 0 600 220" width="100%" height="auto">
      {/* Aeration tank */}
      <rect x={48} y={48} width={510} height={130} rx={10} fill="#D1FAE5" stroke={color} strokeWidth={2} />
      <rect x={50} y={50} width={506} height={126} rx={8} fill="#6EE7B7" opacity={0.22} />
      {/* Bubble columns */}
      {[90, 140, 190, 240, 290, 340, 390, 440, 490].map((x, i) => (
        <g key={i}>
          {[0, 1, 2].map(j => (
            <circle key={j} cx={x + j * 6 - 6} cy={155 - j * 22} r={4 + j}
              fill="none" stroke={color} strokeWidth={1.2} opacity={0.5 - j * 0.1}
              style={{ animation: `ping ${1.2 + j * 0.3}s ease-out infinite` }} />
          ))}
        </g>
      ))}
      {/* Diffuser pipes at bottom */}
      <rect x={60} y={168} width={488} height={6} rx={3} fill="#059669" opacity={0.5} />
      {[80, 120, 160, 200, 240, 280, 320, 360, 400, 440, 480, 520].map(x => (
        <rect key={x} x={x} y={162} width={4} height={8} rx={1} fill="#059669" opacity={0.7} />
      ))}
      {/* Blower box below */}
      <rect x={248} y={182} width={104} height={28} rx={6} fill="#059669" opacity={0.9} />
      <text x={300} y={191} textAnchor="middle" fontSize={7} fill="white" fontWeight="700">BLOWER</text>
      <text x={300} y={203} textAnchor="middle" fontSize={9} fill="#A7F3D0" fontWeight="800" fontFamily="monospace">AIR SUPPLY</text>
      {/* Biomass particles */}
      {[[100,90],[150,110],[200,80],[260,100],[320,88],[380,105],[440,92],[500,108]].map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r={5 + (i % 3)} fill="#059669" opacity={0.25} />
      ))}
      {/* DO sensor */}
      <rect x={430} y={62} width={78} height={28} rx={6} fill="#1D4ED8" opacity={0.9} />
      <text x={469} y={72} textAnchor="middle" fontSize={7} fill="white" fontWeight="700">DO LEVEL</text>
      <text x={469} y={84} textAnchor="middle" fontSize={11} fill="#93C5FD" fontWeight="800" fontFamily="monospace">2.1 mg/L</text>
      {/* Inlet / Outlet arrows */}
      <path d="M 18 113 L 50 113" stroke={color} strokeWidth={3} />
      <polygon points="47,108 59,113 47,118" fill={color} />
      <path d="M 558 113 L 590 113" stroke={color} strokeWidth={3} />
      <polygon points="586,108 598,113 586,118" fill={color} />
      {/* RAS label */}
      <rect x={22} y={82} width={40} height={18} rx={5} fill="#D1FAE5" stroke={color} strokeWidth={1} />
      <text x={42} y={94} textAnchor="middle" fontSize={7} fill={color} fontWeight="700">RAS IN</text>
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ── STEP 4: Secondary Clarification ──
export function SecondaryClarifierDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "ras",      x: 80,  y: 165, text: "RAS Pump" },
    { id: "was",      x: 80,  y: 200, text: "WAS Pump" },
    { id: "blanket",  x: 240, y: 165, text: "Sludge Blanket" },
    { id: "scraper2", x: 330, y: 165, text: "Sludge Scraper" },
    { id: "effweir",  x: 510, y: 165, text: "Effluent Weir" },
  ];
  return (
    <svg viewBox="0 0 600 225" width="100%" height="auto">
      {/* Tank */}
      <path d="M 48 48 L 48 192 L 155 192 L 300 206 L 445 192 L 555 192 L 555 48 Z"
        fill="#E0F2FE" stroke={color} strokeWidth={2} />
      <path d="M 50 52 L 50 188 L 155 188 L 300 202 L 445 188 L 553 188 L 553 52 Z"
        fill="#BAE6FD" opacity={0.3} />
      {/* Sludge blanket */}
      <path d="M 65 130 Q 200 118 300 122 Q 420 126 540 115"
        stroke="#0369A1" strokeWidth={2} fill="none" strokeDasharray="6 3" opacity={0.7} />
      <path d="M 65 130 Q 200 118 300 122 Q 420 126 540 115 L 540 188 L 155 188 L 65 188 Z"
        fill="#0369A1" opacity={0.12} />
      {/* Sludge at bottom */}
      <path d="M 50 188 L 155 188 L 300 202 L 445 188 L 553 188 L 553 210 L 50 210 Z"
        fill="#0369A1" opacity={0.35} />
      <path d="M 272 202 L 300 216 L 328 202" fill="#0C4A6E" opacity={0.7} />
      {/* Scraper */}
      <line x1={88} y1={145} x2={510} y2={194} stroke="#475569" strokeWidth={3} strokeLinecap="round" />
      <circle cx={300} cy={170} r={5} fill="#1E3A5C" />
      {/* Inlet */}
      <path d="M 18 105 L 60 105" stroke={color} strokeWidth={3} />
      <polygon points="56,100 68,105 56,110" fill={color} />
      <rect x={60} y={48} width={9} height={112} rx={2} fill="#0C4A6E" />
      {/* Effluent weir */}
      <rect x={534} y={48} width={12} height={142} rx={2} fill="#059669" opacity={0.75} />
      <path d="M 570 89 L 590 89" stroke="#059669" strokeWidth={2} />
      <polygon points="587,84 598,89 587,94" fill="#059669" />
      {/* RAS & WAS pumps */}
      <circle cx={80} cy={210} r={16} fill="#0369A1" opacity={0.85} />
      <text x={80} y={215} textAnchor="middle" fontSize={12} fill="white">⚙</text>
      <path d="M 155 202 L 80 202 L 80 194" stroke={color} strokeWidth={2} strokeDasharray="4 2" />
      <path d="M 80 226 L 80 244" stroke={color} strokeWidth={2} />
      <polygon points="75,241 80,252 85,241" fill={color} />
      <rect x={20} y={232} width={40} height={14} rx={4} fill="#E0F2FE" />
      <text x={40} y={242} textAnchor="middle" fontSize={7} fill={color} fontWeight="700">TO AERATION</text>
      {/* Flow arrows */}
      {[75, 105, 135].map((y, i) => (
        <path key={i} d={`M ${85 + i * 18} ${y} Q 220 ${y - 6} 350 ${y}`}
          stroke={color} strokeWidth={1.5} fill="none" opacity={0.22}
          strokeDasharray="5 3" style={{ animation: `flow ${1.4 + i * 0.2}s linear infinite` }} />
      ))}
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ── STEP 5: Nutrient Removal ──
export function NutrientDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "anaerobic", x: 105, y: 165, text: "Anaerobic Zone" },
    { id: "anoxic",    x: 240, y: 165, text: "Anoxic Zone" },
    { id: "aerobic",   x: 390, y: 165, text: "Aerobic Zone" },
    { id: "chemfeed",  x: 510, y: 165, text: "Chem P Removal" },
  ];
  const zones = [
    { x: 48,  w: 130, label: "ANAEROBIC", sublabel: "P Release / VFA Uptake", fill: "#FCE7F3", stroke: "#BE185D", textColor: "#BE185D" },
    { x: 188, w: 160, label: "ANOXIC",    sublabel: "Denitrification NO₃→N₂",  fill: "#FEF3C7", stroke: "#B45309", textColor: "#B45309" },
    { x: 358, w: 190, label: "AEROBIC",   sublabel: "Nitrification + P Uptake", fill: "#D1FAE5", stroke: "#059669", textColor: "#059669" },
  ];
  return (
    <svg viewBox="0 0 600 210" width="100%" height="auto">
      {zones.map((z, i) => (
        <g key={i}>
          <rect x={z.x} y={48} width={z.w} height={118} rx={i === 0 ? "8 0 0 8" : i === 2 ? "0 8 8 0" : "0"}
            fill={z.fill} stroke={z.stroke} strokeWidth={1.5} />
          <rect x={z.x + 6} y={54} width={z.w - 12} height={22} rx={4} fill="rgba(255,255,255,0.7)" />
          <text x={z.x + z.w / 2} y={63} textAnchor="middle" fontSize={8.5} fill={z.textColor} fontWeight="800">{z.label}</text>
          <text x={z.x + z.w / 2} y={74} textAnchor="middle" fontSize={7.5} fill={z.textColor} opacity={0.8}>{z.sublabel}</text>
        </g>
      ))}
      {/* Zone dividers */}
      {[178, 348].map(x => (
        <line key={x} x1={x + 10} y1={48} x2={x + 10} y2={166} stroke="#E5E7EB" strokeWidth={2} strokeDasharray="6 3" />
      ))}
      {/* Flow arrows through zones */}
      <path d="M 18 113 L 50 113" stroke={color} strokeWidth={3} />
      <polygon points="47,108 59,113 47,118" fill={color} />
      {[178, 348].map(x => (
        <g key={x}>
          <path d={`M ${x} 113 L ${x + 20} 113`} stroke={color} strokeWidth={2.5} />
          <polygon points={`${x + 16},108 ${x + 28},113 ${x + 16},118`} fill={color} />
        </g>
      ))}
      <path d="M 548 113 L 580 113" stroke={color} strokeWidth={3} />
      <polygon points="576,108 588,113 576,118" fill={color} />
      {/* Bubbles in aerobic zone */}
      {[375, 400, 425, 455, 480, 510, 535].map((x, i) => (
        <circle key={i} cx={x} cy={130 - (i % 3) * 18} r={4}
          fill="none" stroke="#059669" strokeWidth={1.2} opacity={0.5}
          style={{ animation: `ping ${1.3 + i * 0.15}s ease-out infinite` }} />
      ))}
      {/* Chemical feed for P removal */}
      <rect x={490} y={30} width={70} height={28} rx={6} fill="#EDE9FE" stroke="#7C3AED" strokeWidth={1.5} />
      <text x={525} y={40} textAnchor="middle" fontSize={7} fill="#7C3AED" fontWeight="700">ALUM / FeCl₃</text>
      <text x={525} y={52} textAnchor="middle" fontSize={9} fill="#7C3AED" fontWeight="800">P REMOVAL</text>
      <path d="M 525 58 L 525 72" stroke="#7C3AED" strokeWidth={2} strokeDasharray="3 2" />
      <polygon points="520,70 525,80 530,70" fill="#7C3AED" />
      {/* Recycle arrow (nitrate recycle) */}
      <path d="M 540 140 Q 540 155 300 155 Q 180 155 180 140"
        stroke="#B45309" strokeWidth={1.5} fill="none" strokeDasharray="5 3" opacity={0.7} />
      <polygon points="176,136 180,147 184,136" fill="#B45309" opacity={0.7} />
      <text x={360} y={152} textAnchor="middle" fontSize={7.5} fill="#B45309" fontWeight="600">Nitrate Recycle</text>
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ── STEP 6: Disinfection ──
export function WastewaterDisinfectionDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "uvbank",    x: 180, y: 165, text: "UV Lamp Bank" },
    { id: "uvmonitor", x: 310, y: 165, text: "UV Intensity Monitor" },
    { id: "chlorine2", x: 180, y: 200, text: "Chlorine (alt.)" },
    { id: "ecoli",     x: 460, y: 165, text: "E. coli Sampling" },
  ];
  return (
    <svg viewBox="0 0 600 220" width="100%" height="auto">
      {/* Channel */}
      <rect x={40} y={80} width={520} height={60} rx={8} fill="#FEF9C3" stroke={color} strokeWidth={2} />
      <rect x={42} y={82} width={516} height={56} rx={6} fill="#FDE68A" opacity={0.25} />
      {/* UV lamp bank housing */}
      <rect x={120} y={68} width={200} height={84} rx={6} fill="#FEF3C7" stroke={color} strokeWidth={1.5} />
      {/* UV lamps */}
      {[140, 165, 190, 215, 240, 265, 290].map((x, i) => (
        <g key={i}>
          <rect x={x} y={72} width={6} height={76} rx={3} fill="#FDE68A" stroke="#D97706" strokeWidth={1} />
          <rect x={x} y={72} width={6} height={76} rx={3} fill="#FEF08A" opacity={0.7}
            style={{ filter: "blur(1px)" }} />
          <ellipse cx={x + 3} cy={110} rx={12} ry={30} fill="#FEF9C3" opacity={0.3} />
        </g>
      ))}
      {/* UV glow effect */}
      <rect x={122} y={70} width={196} height={80} rx={5} fill="#FEF08A" opacity={0.08} />
      {/* Flow through channel */}
      <path d="M 18 110 L 42 110" stroke={color} strokeWidth={3} />
      <polygon points="39,105 51,110 39,115" fill={color} />
      <path d="M 560 110 L 590 110" stroke="#059669" strokeWidth={3} />
      <polygon points="586,105 598,110 586,115" fill="#059669" />
      {/* Flow arrows */}
      {[88, 110, 132].map((y, i) => (
        <path key={i} d={`M ${55 + i * 10} ${y} L ${560 - i * 10} ${y}`}
          stroke={color} strokeWidth={1.5} fill="none" opacity={0.2}
          strokeDasharray="8 4" style={{ animation: `flow ${1.3 + i * 0.15}s linear infinite` }} />
      ))}
      {/* UV intensity monitor */}
      <rect x={340} y={62} width={88} height={32} rx={6} fill="#1D4ED8" opacity={0.9} />
      <text x={384} y={73} textAnchor="middle" fontSize={7} fill="white" fontWeight="700">UV INTENSITY</text>
      <text x={384} y={87} textAnchor="middle" fontSize={11} fill="#93C5FD" fontWeight="800" fontFamily="monospace">32 mJ/cm²</text>
      <line x1={384} y1={94} x2={384} y2={108} stroke="#1D4ED8" strokeWidth={2} strokeDasharray="3 2" />
      {/* E. coli sampling */}
      <rect x={430} y={62} width={80} height={32} rx={6} fill="#059669" opacity={0.9} />
      <text x={470} y={73} textAnchor="middle" fontSize={7} fill="white" fontWeight="700">E. COLI</text>
      <text x={470} y={87} textAnchor="middle" fontSize={10} fill="#86EFAC" fontWeight="800" fontFamily="monospace">{"<"}200 CFU</text>
      <line x1={470} y1={94} x2={470} y2={108} stroke="#059669" strokeWidth={2} strokeDasharray="3 2" />
      {/* Chlorine alternative */}
      <circle cx={160} cy={178} r={16} fill="#7C3AED" opacity={0.9} />
      <text x={160} y={183} textAnchor="middle" fontSize={11} fill="white" fontWeight="800">Cl₂</text>
      <line x1={160} y1={162} x2={160} y2={140} stroke="#7C3AED" strokeWidth={2} strokeDasharray="3 2" />
      <text x={160} y={202} textAnchor="middle" fontSize={7} fill="#7C3AED" fontWeight="600">ALT. METHOD</text>
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ── STEP 7: Sludge Processing ──
export function SludgeDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "thickener",  x: 95,  y: 165, text: "Sludge Thickener" },
    { id: "digester",   x: 240, y: 165, text: "Anaerobic Digester" },
    { id: "biogas",     x: 240, y: 200, text: "Biogas Recovery" },
    { id: "dewatering", x: 390, y: 165, text: "Dewatering Press" },
    { id: "biosolids",  x: 520, y: 165, text: "Biosolids" },
  ];
  return (
    <svg viewBox="0 0 600 215" width="100%" height="auto">
      {/* Thickener tank */}
      <path d="M 30 58 L 30 148 L 75 158 L 120 148 L 120 58 Z"
        fill="#F3F4F6" stroke={color} strokeWidth={1.5} />
      <path d="M 32 60 L 32 146 L 75 155 L 118 146 L 118 60 Z"
        fill="#9CA3AF" opacity={0.2} />
      <path d="M 32 130 L 75 140 L 118 130" stroke={color} strokeWidth={1.5} fill="none" opacity={0.5} />
      <text x={75} y={82} textAnchor="middle" fontSize={7.5} fill={color} fontWeight="700">THICKENER</text>
      <text x={75} y={94} textAnchor="middle" fontSize={9} fill={color} fontWeight="800" fontFamily="monospace">3–6% DS</text>
      {/* Arrow thickener → digester */}
      <path d="M 120 108 L 155 108" stroke={color} strokeWidth={2.5} />
      <polygon points="151,103 163,108 151,113" fill={color} />
      {/* Digester (egg-shaped) */}
      <ellipse cx={240} cy={108} rx={70} ry={62} fill="#F3F4F6" stroke={color} strokeWidth={2} />
      <ellipse cx={240} cy={108} rx={66} ry={58} fill="#374151" opacity={0.08} />
      <text x={240} y={98} textAnchor="middle" fontSize={7.5} fill={color} fontWeight="700">ANAEROBIC</text>
      <text x={240} y={109} textAnchor="middle" fontSize={7.5} fill={color} fontWeight="700">DIGESTER</text>
      <text x={240} y={122} textAnchor="middle" fontSize={9} fill={color} fontWeight="800" fontFamily="monospace">35°C / 25d</text>
      {/* Biogas pipe */}
      <path d="M 240 46 L 240 28" stroke="#D97706" strokeWidth={3} />
      <rect x={205} y={14} width={70} height={22} rx={6} fill="#FEF3C7" stroke="#D97706" strokeWidth={1.5} />
      <text x={240} y={23} textAnchor="middle" fontSize={7} fill="#D97706" fontWeight="700">BIOGAS ⚡</text>
      <text x={240} y={33} textAnchor="middle" fontSize={8} fill="#D97706" fontWeight="800" fontFamily="monospace">65% CH₄</text>
      {/* Arrow digester → dewatering */}
      <path d="M 310 108 L 345 108" stroke={color} strokeWidth={2.5} />
      <polygon points="341,103 353,108 341,113" fill={color} />
      {/* Dewatering press */}
      <rect x={355} y={68} width={110} height={80} rx={8} fill="#F3F4F6" stroke={color} strokeWidth={1.5} />
      <text x={410} y={88} textAnchor="middle" fontSize={7.5} fill={color} fontWeight="700">BELT PRESS /</text>
      <text x={410} y={99} textAnchor="middle" fontSize={7.5} fill={color} fontWeight="700">CENTRIFUGE</text>
      {/* Press rollers */}
      {[370, 395, 420, 445].map(x => (
        <circle key={x} cx={x} cy={125} r={8} fill="#9CA3AF" stroke="#6B7280" strokeWidth={1} />
      ))}
      <rect x={362} y={118} width={96} height={14} rx={3} fill="#D1D5DB" opacity={0.5} />
      {/* Water drips */}
      {[375, 400, 425, 450].map(x => (
        <path key={x} d={`M ${x} 136 Q ${x} 142 ${x} 148`} stroke="#60A5FA" strokeWidth={1.5}
          strokeDasharray="2 2" style={{ animation: `flow 0.8s linear infinite` }} />
      ))}
      {/* Arrow dewatering → biosolids */}
      <path d="M 465 108 L 490 108" stroke={color} strokeWidth={2.5} />
      <polygon points="486,103 498,108 486,113" fill={color} />
      {/* Biosolids pile */}
      <ellipse cx={540} cy={128} rx={45} ry={20} fill="#6B7280" opacity={0.7} />
      <ellipse cx={540} cy={118} rx={38} ry={16} fill="#4B5563" opacity={0.8} />
      <ellipse cx={540} cy={110} rx={28} ry={12} fill="#374151" opacity={0.9} />
      <text x={540} y={148} textAnchor="middle" fontSize={7.5} fill={color} fontWeight="700">BIOSOLIDS</text>
      <text x={540} y={158} textAnchor="middle" fontSize={8} fill={color} fontWeight="800" fontFamily="monospace">15–25% DS</text>
      {/* Sludge inlet arrow */}
      <path d="M 18 108 L 32 108" stroke={color} strokeWidth={3} />
      <polygon points="28,103 40,108 28,113" fill={color} />
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ── Router ──
export function WWDiagramFor({ stepId, color, active, onClick }: {
  stepId: string;
  color: string;
  active: string | null;
  onClick: (id: string | null) => void;
}) {
  const props = { active, onClick, color };
  if (stepId === "screening")    return <ScreeningDiagram {...props} />;
  if (stepId === "primary")      return <PrimaryDiagram {...props} />;
  if (stepId === "biological")   return <BiologicalDiagram {...props} />;
  if (stepId === "secondary")    return <SecondaryClarifierDiagram {...props} />;
  if (stepId === "nutrient")     return <NutrientDiagram {...props} />;
  if (stepId === "disinfection") return <WastewaterDisinfectionDiagram {...props} />;
  if (stepId === "sludge")       return <SludgeDiagram {...props} />;
  return null;
}
