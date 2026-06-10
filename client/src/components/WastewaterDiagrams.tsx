// Echelon Process v3 — Wastewater Treatment SVG Diagram Components
// Design: Professional SaaS — Clean Light Theme
// All diagrams use 640×255 viewBox so labels never clip

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
  const pillW = Math.max(104, text.length * 6.5 + 16);
  return (
    <g>
      {isActive && (
        <circle cx={x} cy={y} r={8} fill="none" stroke={color} strokeWidth={2} opacity={0.5}
          style={{ animation: "ping 1.2s ease-out infinite" }} />
      )}
      <circle cx={x} cy={y} r={12} fill={isActive ? color : "#fff"} stroke={color} strokeWidth={2.5} />
      <circle cx={x} cy={y} r={5} fill={isActive ? "#fff" : color} />
      {/* label pill above dot */}
      <rect x={x - pillW / 2} y={y - 32} width={pillW} height={17} rx={4}
        fill={isActive ? color : "rgba(255,255,255,0.95)"} stroke={color} strokeWidth={1} />
      <text x={x} y={y - 20} textAnchor="middle" fontSize={8.5}
        fill={isActive ? "#fff" : color} fontWeight="700"
        style={{ pointerEvents: "none", userSelect: "none" }}>{text}</text>
      {/* hit area */}
      <rect x={x - pillW / 2 - 4} y={y - 36} width={pillW + 8} height={62} rx={6}
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
    { id: "influent",    x: 64,  y: 195, text: "Raw Influent" },
    { id: "barscreen",   x: 180, y: 195, text: "Bar Screen" },
    { id: "finescreen",  x: 310, y: 195, text: "Fine Screen" },
    { id: "gritchamber", x: 450, y: 195, text: "Grit Chamber" },
    { id: "gritpump",    x: 580, y: 195, text: "Grit Pump" },
  ];
  return (
    <svg viewBox="0 0 640 240" width="100%" height="auto">
      {/* Flow pipe */}
      <rect x={20} y={96} width={600} height={20} rx={6} fill="#DDD6FE" opacity={0.3} />
      <line x1={20} y1={106} x2={618} y2={106} stroke={color} strokeWidth={2.5}
        strokeDasharray="10 5" style={{ animation: "flow 1.4s linear infinite" }} />
      {/* Influent label */}
      <rect x={20} y={82} width={52} height={18} rx={5} fill="#EDE9FE" stroke={color} strokeWidth={1} />
      <text x={46} y={94} textAnchor="middle" fontSize={8} fill={color} fontWeight="700">SEWAGE</text>
      {/* Bar screen */}
      <rect x={162} y={72} width={14} height={68} rx={3} fill="#1E1B4B" />
      {[76,83,90,97,104,111,118,125,132].map(y => (
        <line key={y} x1={162} y1={y} x2={176} y2={y} stroke="#A78BFA" strokeWidth={1.5} />
      ))}
      {/* Fine screen */}
      <rect x={292} y={78} width={10} height={56} rx={2} fill="#374151" />
      {[82,88,94,100,106,112,118,124,130].map(y => (
        <line key={y} x1={292} y1={y} x2={302} y2={y} stroke="#C4B5FD" strokeWidth={1} />
      ))}
      {/* Grit chamber */}
      <rect x={390} y={68} width={120} height={76} rx={8} fill="#F5F3FF" stroke={color} strokeWidth={1.5} />
      <path d="M 400 144 Q 450 156 510 144" stroke={color} strokeWidth={1.5} fill="none" />
      {[[408,136],[422,140],[438,143],[454,141],[470,137],[486,134]].map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r={3.5} fill="#92400E" opacity={0.6} />
      ))}
      <path d="M 396 92 Q 450 78 504 92 Q 450 106 396 92" stroke={color} strokeWidth={1}
        fill="none" opacity={0.4} strokeDasharray="4 3"
        style={{ animation: "flow 1.2s linear infinite" }} />
      {/* Grit pump */}
      <circle cx={580} cy={106} r={22} fill="#7C3AED" opacity={0.85} />
      <text x={580} y={112} textAnchor="middle" fontSize={20} fill="white">⚙</text>
      {/* Arrow out */}
      <path d="M 602 106 L 628 106" stroke={color} strokeWidth={2.5} />
      <polygon points="624,101 636,106 624,111" fill={color} />
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ── STEP 2: Primary Clarification ──
export function PrimaryDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "inlet3",   x: 72,  y: 195, text: "Inlet" },
    { id: "scum",     x: 210, y: 195, text: "Scum Skimmer" },
    { id: "scraper2", x: 340, y: 195, text: "Sludge Scraper" },
    { id: "hopper2",  x: 460, y: 195, text: "Sludge Hopper" },
    { id: "weir2",    x: 575, y: 195, text: "Effluent Weir" },
  ];
  return (
    <svg viewBox="0 0 640 240" width="100%" height="auto">
      {/* Tank */}
      <path d="M 44 44 L 44 172 L 148 172 L 310 186 L 472 172 L 590 172 L 590 44 Z"
        fill="#FEF3C7" stroke={color} strokeWidth={2} />
      <path d="M 46 48 L 46 168 L 148 168 L 310 182 L 472 168 L 588 168 L 588 48 Z"
        fill="#FCD34D" opacity={0.15} />
      {/* Inlet pipe */}
      <path d="M 14 105 L 56 105" stroke={color} strokeWidth={3} />
      <polygon points="52,100 64,105 52,110" fill={color} />
      <rect x={56} y={44} width={9} height={118} rx={2} fill="#92400E" />
      {/* Scum layer */}
      <path d="M 72 58 Q 200 50 340 56 Q 460 60 580 54" stroke="#D97706" strokeWidth={3} fill="none" opacity={0.7} />
      <path d="M 72 58 Q 200 50 340 56 Q 460 60 580 54 L 580 70 Q 460 74 340 70 Q 200 64 72 72 Z"
        fill="#FDE68A" opacity={0.45} />
      {/* Scum skimmer arm */}
      <line x1={96} y1={54} x2={534} y2={54} stroke="#B45309" strokeWidth={2.5} strokeDasharray="6 3" />
      <circle cx={315} cy={54} r={5} fill="#B45309" />
      {/* Sludge at bottom */}
      <path d="M 46 168 L 148 168 L 310 182 L 472 168 L 588 168 L 588 190 L 46 190 Z"
        fill="#92400E" opacity={0.35} />
      <path d="M 282 182 L 310 196 L 338 182" fill="#78350F" opacity={0.7} />
      {/* Scraper arm */}
      <line x1={84} y1={138} x2={546} y2={178} stroke="#E2E8F0" strokeWidth={3} strokeLinecap="round" />
      <circle cx={315} cy={158} r={5} fill="#1E3A5C" />
      {/* Effluent weir */}
      <rect x={570} y={44} width={12} height={130} rx={2} fill="#0F766E" opacity={0.75} />
      <rect x={570} y={76} width={36} height={18} rx={3} fill="#D1FAE5" stroke="#059669" strokeWidth={1.5} />
      <path d="M 606 85 L 622 85" stroke="#059669" strokeWidth={2} />
      <polygon points="618,80 630,85 618,90" fill="#059669" />
      {/* Flow arrows */}
      {[72,105,140].map((y,i) => (
        <path key={i} d={`M ${82+i*18} ${y} Q 220 ${y-8} 360 ${y}`}
          stroke={color} strokeWidth={1.5} fill="none" opacity={0.2}
          strokeDasharray="5 3" style={{ animation: `flow ${1.5+i*0.2}s linear infinite` }} />
      ))}
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ── STEP 3: Biological Treatment (Activated Sludge) ──
export function BiologicalDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "return",    x: 72,  y: 195, text: "RAS Return" },
    { id: "aerator",   x: 210, y: 195, text: "Air Diffusers" },
    { id: "mlss",      x: 340, y: 195, text: "MLSS Zone" },
    { id: "blower",    x: 460, y: 195, text: "Blower" },
    { id: "do_sensor", x: 580, y: 195, text: "DO Sensor" },
  ];
  return (
    <svg viewBox="0 0 640 240" width="100%" height="auto">
      {/* Aeration tank */}
      <rect x={44} y={44} width={550} height={130} rx={10} fill="#D1FAE5" stroke={color} strokeWidth={2} />
      <rect x={46} y={46} width={546} height={126} rx={8} fill="#6EE7B7" opacity={0.18} />
      {/* Bubble columns */}
      {[80,130,180,230,280,330,380,430,480,530].map((x,i) => (
        <g key={i}>
          {[0,1,2].map(j => (
            <circle key={j} cx={x+j*6-6} cy={148-j*22} r={4+j}
              fill="none" stroke={color} strokeWidth={1.2} opacity={0.45-j*0.08}
              style={{ animation: `ping ${1.2+j*0.3}s ease-out infinite` }} />
          ))}
        </g>
      ))}
      {/* Diffuser pipes at bottom */}
      <rect x={56} y={164} width={532} height={6} rx={3} fill="#059669" opacity={0.5} />
      {[76,116,156,196,236,276,316,356,396,436,476,516,556].map(x => (
        <rect key={x} x={x} y={158} width={4} height={8} rx={1} fill="#059669" opacity={0.7} />
      ))}
      {/* Blower box below tank */}
      <rect x={280} y={174} width={100} height={26} rx={6} fill="#059669" opacity={0.9} />
      <text x={330} y={183} textAnchor="middle" fontSize={7} fill="white" fontWeight="700">BLOWER</text>
      <text x={330} y={194} textAnchor="middle" fontSize={9} fill="#A7F3D0" fontWeight="800" fontFamily="monospace">AIR SUPPLY</text>
      {/* Biomass particles */}
      {[[96,88],[148,108],[200,78],[262,98],[322,86],[382,102],[442,90],[502,106]].map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r={5+(i%3)} fill="#059669" opacity={0.22} />
      ))}
      {/* DO sensor */}
      <rect x={510} y={52} width={76} height={28} rx={6} fill="#1D4ED8" opacity={0.9} />
      <text x={548} y={62} textAnchor="middle" fontSize={7} fill="white" fontWeight="700">DO LEVEL</text>
      <text x={548} y={74} textAnchor="middle" fontSize={11} fill="#93C5FD" fontWeight="800" fontFamily="monospace">2.1 mg/L</text>
      {/* Inlet / Outlet arrows */}
      <path d="M 14 109 L 46 109" stroke={color} strokeWidth={3} />
      <polygon points="43,104 55,109 43,114" fill={color} />
      <path d="M 594 109 L 626 109" stroke={color} strokeWidth={3} />
      <polygon points="622,104 634,109 622,114" fill={color} />
      {/* RAS label */}
      <rect x={18} y={80} width={42} height={18} rx={5} fill="#D1FAE5" stroke={color} strokeWidth={1} />
      <text x={39} y={92} textAnchor="middle" fontSize={7} fill={color} fontWeight="700">RAS IN</text>
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ── STEP 4: Secondary Clarification ──
export function SecondaryClarifierDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "ras",      x: 72,  y: 195, text: "RAS Pump" },
    { id: "blanket",  x: 210, y: 195, text: "Sludge Blanket" },
    { id: "scraper2", x: 340, y: 195, text: "Sludge Scraper" },
    { id: "was",      x: 460, y: 195, text: "WAS Pump" },
    { id: "effweir",  x: 578, y: 195, text: "Effluent Weir" },
  ];
  return (
    <svg viewBox="0 0 640 240" width="100%" height="auto">
      {/* Tank */}
      <path d="M 44 44 L 44 172 L 148 172 L 310 186 L 472 172 L 590 172 L 590 44 Z"
        fill="#E0F2FE" stroke={color} strokeWidth={2} />
      <path d="M 46 48 L 46 168 L 148 168 L 310 182 L 472 168 L 588 168 L 588 48 Z"
        fill="#BAE6FD" opacity={0.25} />
      {/* Sludge blanket */}
      <path d="M 60 124 Q 200 112 310 116 Q 430 120 578 110"
        stroke="#0369A1" strokeWidth={2} fill="none" strokeDasharray="6 3" opacity={0.6} />
      <path d="M 60 124 Q 200 112 310 116 Q 430 120 578 110 L 578 168 L 148 168 L 60 168 Z"
        fill="#0369A1" opacity={0.1} />
      {/* Sludge at bottom */}
      <path d="M 46 168 L 148 168 L 310 182 L 472 168 L 588 168 L 588 190 L 46 190 Z"
        fill="#0369A1" opacity={0.3} />
      <path d="M 282 182 L 310 196 L 338 182" fill="#0C4A6E" opacity={0.7} />
      {/* Scraper */}
      <line x1={84} y1={138} x2={546} y2={178} stroke="#E2E8F0" strokeWidth={3} strokeLinecap="round" />
      <circle cx={315} cy={158} r={5} fill="#1E3A5C" />
      {/* Inlet */}
      <path d="M 14 105 L 56 105" stroke={color} strokeWidth={3} />
      <polygon points="52,100 64,105 52,110" fill={color} />
      <rect x={56} y={44} width={9} height={118} rx={2} fill="#0C4A6E" />
      {/* Effluent weir */}
      <rect x={570} y={44} width={12} height={130} rx={2} fill="#059669" opacity={0.75} />
      <path d="M 606 82 L 622 82" stroke="#059669" strokeWidth={2} />
      <polygon points="618,77 630,82 618,87" fill="#059669" />
      {/* RAS pump */}
      <circle cx={72} cy={172} r={0} fill="none" />
      <path d="M 148 182 L 72 182" stroke={color} strokeWidth={2} strokeDasharray="4 2" />
      <path d="M 72 182 L 72 172" stroke={color} strokeWidth={2} />
      <circle cx={72} cy={172} r={14} fill="#0369A1" opacity={0.85} />
      <text x={72} y={177} textAnchor="middle" fontSize={12} fill="white">⚙</text>
      <path d="M 72 158 L 72 138" stroke={color} strokeWidth={2} strokeDasharray="3 2" />
      <polygon points="67,140 72,128 77,140" fill={color} />
      <rect x={44} y={120} width={46} height={14} rx={4} fill="#E0F2FE" />
      <text x={67} y={130} textAnchor="middle" fontSize={7} fill={color} fontWeight="700">TO AERATION</text>
      {/* WAS pump */}
      <circle cx={460} cy={172} r={14} fill="#DC2626" opacity={0.85} />
      <text x={460} y={177} textAnchor="middle" fontSize={12} fill="white">⚙</text>
      <path d="M 460 186 L 460 210" stroke="#DC2626" strokeWidth={2} />
      <polygon points="455,207 460,220 465,207" fill="#DC2626" />
      <rect x={432} y={218} width={56} height={14} rx={4} fill="#FEE2E2" />
      <text x={460} y={228} textAnchor="middle" fontSize={7} fill="#DC2626" fontWeight="700">WASTE SLUDGE</text>
      {/* Flow arrows */}
      {[72,105,138].map((y,i) => (
        <path key={i} d={`M ${82+i*18} ${y} Q 220 ${y-6} 360 ${y}`}
          stroke={color} strokeWidth={1.5} fill="none" opacity={0.2}
          strokeDasharray="5 3" style={{ animation: `flow ${1.4+i*0.2}s linear infinite` }} />
      ))}
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ── STEP 5: Nutrient Removal ──
export function NutrientDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "anaerobic", x: 104, y: 195, text: "Anaerobic Zone" },
    { id: "anoxic",    x: 268, y: 195, text: "Anoxic Zone" },
    { id: "aerobic",   x: 448, y: 195, text: "Aerobic Zone" },
    { id: "chemfeed",  x: 580, y: 195, text: "Chem P Removal" },
  ];
  const zones = [
    { x: 44,  w: 148, label: "ANAEROBIC", sublabel: "P Release / VFA Uptake", fill: "#FCE7F3", stroke: "#BE185D", textColor: "#BE185D" },
    { x: 196, w: 168, label: "ANOXIC",    sublabel: "Denitrification NO₃→N₂",  fill: "#FEF3C7", stroke: "#B45309", textColor: "#B45309" },
    { x: 368, w: 210, label: "AEROBIC",   sublabel: "Nitrification + P Uptake", fill: "#D1FAE5", stroke: "#059669", textColor: "#059669" },
  ];
  return (
    <svg viewBox="0 0 640 240" width="100%" height="auto">
      {zones.map((z, i) => (
        <g key={i}>
          <rect x={z.x} y={44} width={z.w} height={126}
            rx={i === 0 ? 8 : 0}
            fill={z.fill} stroke={z.stroke} strokeWidth={1.5} />
          <rect x={z.x+6} y={50} width={z.w-12} height={24} rx={4} fill="rgba(255,255,255,0.75)" />
          <text x={z.x+z.w/2} y={60} textAnchor="middle" fontSize={8.5} fill={z.textColor} fontWeight="800">{z.label}</text>
          <text x={z.x+z.w/2} y={72} textAnchor="middle" fontSize={7.5} fill={z.textColor} opacity={0.8}>{z.sublabel}</text>
        </g>
      ))}
      {/* Right cap */}
      <rect x={578} y={44} width={0} height={126} fill="none" />
      {/* Zone dividers */}
      {[192, 364].map(x => (
        <line key={x} x1={x+4} y1={44} x2={x+4} y2={170} stroke="#E5E7EB" strokeWidth={2} strokeDasharray="6 3" />
      ))}
      {/* Flow arrows */}
      <path d="M 14 107 L 46 107" stroke={color} strokeWidth={3} />
      <polygon points="43,102 55,107 43,112" fill={color} />
      {[192, 364].map(x => (
        <g key={x}>
          <path d={`M ${x} 107 L ${x+20} 107`} stroke={color} strokeWidth={2.5} />
          <polygon points={`${x+16},102 ${x+28},107 ${x+16},112`} fill={color} />
        </g>
      ))}
      <path d="M 578 107 L 614 107" stroke={color} strokeWidth={3} />
      <polygon points="610,102 622,107 610,112" fill={color} />
      {/* Bubbles in aerobic zone */}
      {[384,410,436,462,488,514,540,566].map((x,i) => (
        <circle key={i} cx={x} cy={128-(i%3)*18} r={4}
          fill="none" stroke="#059669" strokeWidth={1.2} opacity={0.5}
          style={{ animation: `ping ${1.3+i*0.15}s ease-out infinite` }} />
      ))}
      {/* Chemical feed */}
      <rect x={548} y={22} width={72} height={28} rx={6} fill="#EDE9FE" stroke="#7C3AED" strokeWidth={1.5} />
      <text x={584} y={32} textAnchor="middle" fontSize={7} fill="#7C3AED" fontWeight="700">ALUM / FeCl₃</text>
      <text x={584} y={44} textAnchor="middle" fontSize={9} fill="#7C3AED" fontWeight="800">P REMOVAL</text>
      <path d="M 584 50 L 584 62" stroke="#7C3AED" strokeWidth={2} strokeDasharray="3 2" />
      <polygon points="579,60 584,70 589,60" fill="#7C3AED" />
      {/* Nitrate recycle */}
      <path d="M 558 148 Q 558 162 310 162 Q 196 162 196 148"
        stroke="#B45309" strokeWidth={1.5} fill="none" strokeDasharray="5 3" opacity={0.7} />
      <polygon points="192,144 196,155 200,144" fill="#B45309" opacity={0.7} />
      <text x={377} y={159} textAnchor="middle" fontSize={7.5} fill="#B45309" fontWeight="600">Nitrate Recycle</text>
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ── STEP 6: Disinfection (UV / Chlorine) ──
export function WastewaterDisinfectionDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "uvbank",    x: 160, y: 195, text: "UV Lamp Bank" },
    { id: "uvmonitor", x: 310, y: 195, text: "UV Intensity" },
    { id: "chlorine2", x: 450, y: 195, text: "Chlorine (alt.)" },
    { id: "ecoli",     x: 575, y: 195, text: "E. coli Sampling" },
  ];
  return (
    <svg viewBox="0 0 640 240" width="100%" height="auto">
      {/* Channel */}
      <rect x={36} y={76} width={568} height={66} rx={8} fill="#FEF9C3" stroke={color} strokeWidth={2} />
      <rect x={38} y={78} width={564} height={62} rx={6} fill="#FDE68A" opacity={0.2} />
      {/* UV lamp bank housing */}
      <rect x={100} y={64} width={220} height={88} rx={6} fill="#FEF3C7" stroke={color} strokeWidth={1.5} />
      {/* UV lamps */}
      {[118,142,166,190,214,238,262,286].map((x,i) => (
        <g key={i}>
          <rect x={x} y={68} width={6} height={80} rx={3} fill="#FDE68A" stroke="#D97706" strokeWidth={1} />
          <ellipse cx={x+3} cy={108} rx={11} ry={32} fill="#FEF9C3" opacity={0.28} />
        </g>
      ))}
      <rect x={102} y={66} width={216} height={84} rx={5} fill="#FEF08A" opacity={0.07} />
      {/* Flow */}
      <path d="M 14 109 L 38 109" stroke={color} strokeWidth={3} />
      <polygon points="35,104 47,109 35,114" fill={color} />
      <path d="M 604 109 L 630 109" stroke="#059669" strokeWidth={3} />
      <polygon points="626,104 638,109 626,114" fill="#059669" />
      {[82,109,136].map((y,i) => (
        <path key={i} d={`M ${50+i*10} ${y} L ${590-i*10} ${y}`}
          stroke={color} strokeWidth={1.5} fill="none" opacity={0.18}
          strokeDasharray="8 4" style={{ animation: `flow ${1.3+i*0.15}s linear infinite` }} />
      ))}
      {/* UV intensity monitor */}
      <rect x={336} y={56} width={90} height={32} rx={6} fill="#1D4ED8" opacity={0.9} />
      <text x={381} y={67} textAnchor="middle" fontSize={7} fill="white" fontWeight="700">UV INTENSITY</text>
      <text x={381} y={81} textAnchor="middle" fontSize={11} fill="#93C5FD" fontWeight="800" fontFamily="monospace">32 mJ/cm²</text>
      <line x1={381} y1={88} x2={381} y2={104} stroke="#1D4ED8" strokeWidth={2} strokeDasharray="3 2" />
      {/* E. coli sampling */}
      <rect x={480} y={56} width={82} height={32} rx={6} fill="#059669" opacity={0.9} />
      <text x={521} y={67} textAnchor="middle" fontSize={7} fill="white" fontWeight="700">E. COLI</text>
      <text x={521} y={81} textAnchor="middle" fontSize={10} fill="#86EFAC" fontWeight="800" fontFamily="monospace">{"<"}200 CFU</text>
      <line x1={521} y1={88} x2={521} y2={104} stroke="#059669" strokeWidth={2} strokeDasharray="3 2" />
      {/* Chlorine alternative */}
      <circle cx={450} cy={152} r={18} fill="#7C3AED" opacity={0.9} />
      <text x={450} y={158} textAnchor="middle" fontSize={12} fill="white" fontWeight="800">Cl₂</text>
      <line x1={450} y1={134} x2={450} y2={142} stroke="#7C3AED" strokeWidth={2} strokeDasharray="3 2" />
      <text x={450} y={174} textAnchor="middle" fontSize={7} fill="#7C3AED" fontWeight="600">ALT. METHOD</text>
      {labels.map(l => <LabelDot key={l.id} {...l} active={active} color={color} onClick={onClick} />)}
    </svg>
  );
}

// ── STEP 7: Sludge Processing ──
export function SludgeDiagram({ active, onClick, color }: DiagramProps) {
  const labels = [
    { id: "thickener",  x: 80,  y: 195, text: "Sludge Thickener" },
    { id: "digester",   x: 248, y: 195, text: "Anaerobic Digester" },
    { id: "biogas",     x: 248, y: 32,  text: "Biogas Recovery" },
    { id: "dewatering", x: 420, y: 195, text: "Dewatering Press" },
    { id: "biosolids",  x: 570, y: 195, text: "Biosolids" },
  ];
  return (
    <svg viewBox="0 0 640 240" width="100%" height="auto">
      {/* Thickener tank */}
      <path d="M 22 52 L 22 152 L 70 162 L 118 152 L 118 52 Z"
        fill="#F3F4F6" stroke={color} strokeWidth={1.5} />
      <path d="M 24 54 L 24 150 L 70 159 L 116 150 L 116 54 Z"
        fill="#9CA3AF" opacity={0.18} />
      <path d="M 24 130 L 70 142 L 116 130" stroke={color} strokeWidth={1.5} fill="none" opacity={0.5} />
      <text x={70} y={78} textAnchor="middle" fontSize={7.5} fill={color} fontWeight="700">THICKENER</text>
      <text x={70} y={92} textAnchor="middle" fontSize={9} fill={color} fontWeight="800" fontFamily="monospace">3–6% DS</text>
      {/* Arrow thickener → digester */}
      <path d="M 118 107 L 152 107" stroke={color} strokeWidth={2.5} />
      <polygon points="148,102 160,107 148,112" fill={color} />
      {/* Digester (egg-shaped) */}
      <ellipse cx={248} cy={107} rx={76} ry={66} fill="#F3F4F6" stroke={color} strokeWidth={2} />
      <ellipse cx={248} cy={107} rx={72} ry={62} fill="#374151" opacity={0.07} />
      <text x={248} y={96} textAnchor="middle" fontSize={7.5} fill={color} fontWeight="700">ANAEROBIC</text>
      <text x={248} y={108} textAnchor="middle" fontSize={7.5} fill={color} fontWeight="700">DIGESTER</text>
      <text x={248} y={122} textAnchor="middle" fontSize={9} fill={color} fontWeight="800" fontFamily="monospace">35°C / 25d</text>
      {/* Biogas pipe */}
      <path d="M 248 41 L 248 22" stroke="#D97706" strokeWidth={3} />
      <rect x={208} y={8} width={80} height={22} rx={6} fill="#FEF3C7" stroke="#D97706" strokeWidth={1.5} />
      <text x={248} y={17} textAnchor="middle" fontSize={7} fill="#D97706" fontWeight="700">BIOGAS ⚡</text>
      <text x={248} y={27} textAnchor="middle" fontSize={8} fill="#D97706" fontWeight="800" fontFamily="monospace">65% CH₄</text>
      {/* Arrow digester → dewatering */}
      <path d="M 324 107 L 358 107" stroke={color} strokeWidth={2.5} />
      <polygon points="354,102 366,107 354,112" fill={color} />
      {/* Dewatering press */}
      <rect x={368} y={62} width={120} height={88} rx={8} fill="#F3F4F6" stroke={color} strokeWidth={1.5} />
      <text x={428} y={84} textAnchor="middle" fontSize={7.5} fill={color} fontWeight="700">BELT PRESS /</text>
      <text x={428} y={96} textAnchor="middle" fontSize={7.5} fill={color} fontWeight="700">CENTRIFUGE</text>
      {[380,404,428,452,476].map(x => (
        <circle key={x} cx={x} cy={130} r={9} fill="#9CA3AF" stroke="#6B7280" strokeWidth={1} />
      ))}
      <rect x={372} y={122} width={112} height={16} rx={3} fill="#D1D5DB" opacity={0.5} />
      {[386,410,434,458].map(x => (
        <path key={x} d={`M ${x} 140 Q ${x} 148 ${x} 155`} stroke="#60A5FA" strokeWidth={1.5}
          strokeDasharray="2 2" style={{ animation: `flow 0.8s linear infinite` }} />
      ))}
      {/* Arrow dewatering → biosolids */}
      <path d="M 488 107 L 516 107" stroke={color} strokeWidth={2.5} />
      <polygon points="512,102 524,107 512,112" fill={color} />
      {/* Biosolids pile */}
      <ellipse cx={570} cy={138} rx={48} ry={22} fill="#6B7280" opacity={0.65} />
      <ellipse cx={570} cy={126} rx={40} ry={18} fill="#4B5563" opacity={0.75} />
      <ellipse cx={570} cy={116} rx={30} ry={13} fill="#374151" opacity={0.85} />
      <text x={570} y={158} textAnchor="middle" fontSize={7.5} fill={color} fontWeight="700">BIOSOLIDS</text>
      <text x={570} y={170} textAnchor="middle" fontSize={8} fill={color} fontWeight="800" fontFamily="monospace">15–25% DS</text>
      {/* Sludge inlet arrow */}
      <path d="M 0 107 L 22 107" stroke={color} strokeWidth={3} />
      <polygon points="18,102 30,107 18,112" fill={color} />
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
