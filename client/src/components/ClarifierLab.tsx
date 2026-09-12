import { useMemo, useState } from "react";
import { CirclePlay, Eye, Layers3, RotateCcw, Waves } from "lucide-react";
import { CLARIFIER_PARTS, CLARIFIER_STAGES, ClarifierView } from "@/lib/clarifierLab";

const VIEW_OPTIONS: { id: ClarifierView; label: string; icon: typeof Eye }[] = [
  { id: "isometric", label: "3D view", icon: Eye },
  { id: "top", label: "Top view", icon: Layers3 },
  { id: "cutaway", label: "Cutaway", icon: RotateCcw },
  { id: "exploded", label: "Exploded", icon: Layers3 },
];

interface ClarifierLabProps {
  onStudyLink?: () => void;
}

export default function ClarifierLab({ onStudyLink }: ClarifierLabProps) {
  const [activePart, setActivePart] = useState("feedwell");
  const [activeStage, setActiveStage] = useState("distribute");
  const [view, setView] = useState<ClarifierView>("isometric");
  const [waterVisible, setWaterVisible] = useState(true);
  const [solidsVisible, setSolidsVisible] = useState(true);
  const [flowing, setFlowing] = useState(true);

  const selectedPart = useMemo(
    () => CLARIFIER_PARTS.find((part) => part.id === activePart) ?? CLARIFIER_PARTS[0],
    [activePart],
  );
  const selectedStage = CLARIFIER_STAGES.find((stage) => stage.id === activeStage) ?? CLARIFIER_STAGES[0];
  const isTop = view === "top";
  const isCutaway = view === "cutaway";
  const isExploded = view === "exploded";
  const highlight = (id: string) => activePart === id || activeStage === id;

  const selectable = (id: string) => ({
    role: "button" as const,
    tabIndex: 0,
    onClick: () => setActivePart(id),
    onKeyDown: (event: React.KeyboardEvent<SVGGElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setActivePart(id);
      }
    },
    style: { cursor: "pointer" },
  });

  return (
    <section className="space-y-5" aria-label="Interactive circular clarifier learning module">
      <style>{`
        @keyframes clarifierFlow { to { stroke-dashoffset: -28; } }
        @keyframes clarifierSweep { to { transform: rotate(360deg); } }
        @keyframes clarifierPulse { 0%,100% { opacity: .35; } 50% { opacity: .95; } }
        .clarifier-flow { animation: clarifierFlow 1.3s linear infinite; }
        .clarifier-sweep { transform-origin: 320px 205px; animation: clarifierSweep 12s linear infinite; }
        .clarifier-pulse { animation: clarifierPulse 1.8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .clarifier-flow, .clarifier-sweep, .clarifier-pulse { animation: none !important; }
        }
      `}</style>

      <div className="grid gap-4 xl:grid-cols-[1fr_330px]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-3 shadow-2xl shadow-slate-900/20 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
              <span className={`h-2 w-2 rounded-full bg-emerald-400 ${flowing ? "clarifier-pulse" : ""}`} />
              Circular clarifier · centre feed
            </div>
            <div className="flex flex-wrap gap-1 rounded-xl border border-slate-700 bg-slate-900 p-1" role="group" aria-label="Clarifier view">
              {VIEW_OPTIONS.map((option) => {
                const Icon = option.icon;
                const selected = view === option.id;
                return (
                  <button key={option.id} onClick={() => setView(option.id)} aria-pressed={selected}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${selected ? "bg-sky-400 text-slate-950" : "text-slate-300 hover:bg-slate-800"}`}>
                    <Icon size={14} /> {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[radial-gradient(circle_at_50%_15%,#183b5a_0%,#091522_48%,#050b12_100%)]">
            <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(120deg,transparent,rgba(125,211,252,.08),transparent)]" />
            <svg viewBox="0 0 640 430" className="block h-auto w-full" role="img" aria-label="Interactive circular clarifier illustration">
              <defs>
                <radialGradient id="clarifier-water" cx="50%" cy="40%" r="65%">
                  <stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.16" />
                </radialGradient>
                <linearGradient id="clarifier-wall" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#CBD5E1" />
                  <stop offset="100%" stopColor="#64748B" />
                </linearGradient>
                <linearGradient id="clarifier-sludge" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#B45309" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#78350F" stopOpacity="0.55" />
                </linearGradient>
                <filter id="clarifier-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {!isTop && <ellipse cx="320" cy="356" rx="232" ry="42" fill="#020617" opacity="0.65" />}
              <g transform={isTop ? "translate(0 24)" : "translate(0 0)"}>
                {!isTop && <path d="M110 202 L110 313 Q320 388 530 313 L530 202" fill="url(#clarifier-wall)" opacity={isExploded ? 0.2 : 0.72} />}
                <ellipse cx="320" cy={isTop ? 205 : 202} rx={215} ry={isTop ? 155 : 112} fill="#0F172A" stroke="#94A3B8" strokeWidth="8" />
                <ellipse cx="320" cy={isTop ? 205 : 202} rx={201} ry={isTop ? 143 : 101} fill={waterVisible && !isExploded ? "url(#clarifier-water)" : "#111827"} stroke="#334155" strokeWidth="3" />

                {waterVisible && !isExploded && (
                  <g opacity={flowing ? 1 : 0.35}>
                    <ellipse cx="320" cy={isTop ? 205 : 202} rx="156" ry={isTop ? 109 : 74} fill="none" stroke="#7DD3FC" strokeOpacity="0.33" strokeWidth="2" strokeDasharray="10 10" className={flowing ? "clarifier-flow" : ""} />
                    <ellipse cx="320" cy={isTop ? 205 : 202} rx="112" ry={isTop ? 77 : 52} fill="none" stroke="#BAE6FD" strokeOpacity="0.26" strokeWidth="2" strokeDasharray="6 9" className={flowing ? "clarifier-flow" : ""} />
                  </g>
                )}

                {solidsVisible && !isTop && !isExploded && (
                  <path d="M130 278 Q320 340 510 278 L495 310 Q320 356 145 310 Z" fill="url(#clarifier-sludge)" opacity={activeStage === "settle" || activeStage === "collect" ? 0.92 : 0.55} />
                )}
                {solidsVisible && isTop && !isExploded && (
                  <ellipse cx="320" cy="234" rx="118" ry="64" fill="#B45309" opacity={activeStage === "settle" || activeStage === "collect" ? 0.3 : 0.14} />
                )}

                <g {...selectable("weir")} aria-label="Effluent weir and launder" transform={isExploded ? "translate(0 72)" : undefined}>
                  <ellipse cx="320" cy={isTop ? 205 : 202} rx="189" ry={isTop ? 132 : 89} fill="none" stroke={highlight("weir") ? "#6EE7B7" : "#34D399"} strokeWidth={highlight("weir") ? 10 : 6} opacity="0.88" />
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
                    const rad = (angle * Math.PI) / 180;
                    const x = 320 + 189 * Math.cos(rad);
                    const y = (isTop ? 205 : 202) + (isTop ? 132 : 89) * Math.sin(rad);
                    return <line key={angle} x1={x} y1={y - 4} x2={x} y2={y + 4} stroke="#D1FAE5" strokeWidth="3" />;
                  })}
                </g>

                <g {...selectable("feedwell")} aria-label="Centre feedwell" transform={isExploded ? "translate(0 -96)" : undefined}>
                  <ellipse cx="320" cy={isTop ? 205 : 202} rx="55" ry={isTop ? 38 : 25} fill={highlight("feedwell") ? "#0284C7" : "#075985"} stroke="#7DD3FC" strokeWidth={highlight("feedwell") ? 5 : 3} />
                  {!isTop && <rect x="298" y="137" width="44" height="65" rx="8" fill="#0C4A6E" stroke="#38BDF8" strokeWidth="3" />}
                  <path d={`M320 ${isTop ? 133 : 120} L320 ${isTop ? 174 : 168}`} stroke="#E0F2FE" strokeWidth="5" strokeLinecap="round" />
                  <polygon points={`312,${isTop ? 168 : 162} 328,${isTop ? 168 : 162} 320,${isTop ? 182 : 176}`} fill="#E0F2FE" />
                </g>

                <g {...selectable("bridge")} aria-label="Access bridge and drive" transform={isExploded ? "translate(0 -42)" : undefined}>
                  <rect x="120" y={isTop ? 194 : 154} width="400" height="18" rx="9" fill={highlight("bridge") ? "#FDE68A" : "#94A3B8"} stroke="#E2E8F0" strokeWidth="2" />
                  <rect x="303" y={isTop ? 177 : 133} width="34" height="32" rx="8" fill={highlight("bridge") ? "#F59E0B" : "#475569"} stroke="#FCD34D" strokeWidth="2" />
                  <circle cx="320" cy={isTop ? 193 : 149} r="7" fill="#FCD34D" />
                </g>

                <g {...selectable("scrapers")} aria-label="Scraper arms" className={flowing && !isExploded ? "clarifier-sweep" : ""} transform={isExploded ? "translate(0 22)" : undefined}>
                  <line x1="320" y1={isTop ? 205 : 202} x2="148" y2={isTop ? 255 : 254} stroke={highlight("scrapers") ? "#E9D5FF" : "#C084FC"} strokeWidth={highlight("scrapers") ? 9 : 6} strokeLinecap="round" />
                  <line x1="320" y1={isTop ? 205 : 202} x2="492" y2={isTop ? 155 : 150} stroke={highlight("scrapers") ? "#E9D5FF" : "#C084FC"} strokeWidth={highlight("scrapers") ? 9 : 6} strokeLinecap="round" />
                  <circle cx="320" cy={isTop ? 205 : 202} r="14" fill="#8B5CF6" stroke="#E9D5FF" strokeWidth="3" />
                </g>

                {!isTop && (
                  <g {...selectable("hopper")} aria-label="Sludge hopper" transform={isExploded ? "translate(0 24)" : undefined}>
                    <path d="M286 304 L320 340 L354 304 Z" fill={highlight("hopper") ? "#F59E0B" : "#92400E"} stroke="#FDE68A" strokeWidth="2" />
                    <line x1="320" y1="340" x2="320" y2="370" stroke="#F97316" strokeWidth="7" strokeLinecap="round" />
                    <polygon points="310,365 330,365 320,380" fill="#FDBA74" />
                  </g>
                )}
                {isTop && (
                  <g {...selectable("hopper")} aria-label="Sludge hopper" transform={isExploded ? "translate(0 24)" : undefined}>
                    <circle cx="320" cy="205" r="25" fill={highlight("hopper") ? "#F59E0B" : "#92400E"} stroke="#FDBA74" strokeWidth="3" />
                    <path d="M320 190 L320 219" stroke="#FDBA74" strokeWidth="3" />
                  </g>
                )}

                <g {...selectable("scum")} aria-label="Surface skimmer" transform={isExploded ? "translate(-48 -44)" : undefined}>
                  <path d={`M145 ${isTop ? 131 : 134} Q230 ${isTop ? 98 : 102} 286 ${isTop ? 124 : 132}`} fill="none" stroke={highlight("scum") ? "#FDA4AF" : "#FB7185"} strokeWidth={highlight("scum") ? 9 : 5} strokeLinecap="round" />
                  <rect x="130" y={isTop ? 125 : 125} width="44" height="13" rx="6" fill="#FB7185" opacity="0.9" />
                </g>

                <g {...selectable("underflow")} aria-label="Underflow withdrawal" transform={isExploded ? "translate(46 12)" : undefined}>
                  <path d={isTop ? "M320 230 L320 278 L402 278" : "M320 370 L320 396 L402 396"} fill="none" stroke={highlight("underflow") ? "#FDBA74" : "#F97316"} strokeWidth={highlight("underflow") ? 10 : 7} strokeLinecap="round" />
                  <circle cx="410" cy={isTop ? 278 : 396} r="13" fill="#7C2D12" stroke="#FDBA74" strokeWidth="2" />
                  <path d={`M403 ${isTop ? 278 : 396} L417 ${isTop ? 278 : 396}`} stroke="#FDBA74" strokeWidth="2" />
                </g>

                {isCutaway && (
                  <path d="M320 202 L540 115 L540 330 L320 334 Z" fill="#020617" opacity="0.72" stroke="#7DD3FC" strokeDasharray="8 6" strokeWidth="2" />
                )}
                {isExploded && (
                  <g fill="none" stroke="#7DD3FC" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.78">
                    <path d="M320 105 L320 160" />
                    <path d="M130 110 L204 160" />
                    <path d="M510 150 L450 190" />
                    <path d="M320 294 L320 256" />
                    <path d="M420 338 L380 285" />
                  </g>
                )}
              </g>
              <text x="34" y="34" fill="#7DD3FC" fontSize="13" fontWeight="700">INTERACTIVE EQUIPMENT VIEW</text>
              <text x="34" y="54" fill="#94A3B8" fontSize="11">{isExploded ? "Components separated to reveal the operating assembly." : "Select a highlighted component to inspect its operating role."}</text>
              {isExploded && (
                <g fontSize="10" fontWeight="700" fill="#E0F2FE">
                  <text x="274" y="74">FEEDWELL</text>
                  <text x="88" y="98">SCUM SKIMMER</text>
                  <text x="428" y="136">SCRAPER ARMS</text>
                  <text x="266" y="378">HOPPER</text>
                  <text x="436" y="382">UNDERFLOW</text>
                  <text x="458" y="312">WEIR &amp; LAUNDER</text>
                </g>
              )}
            </svg>

            <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
              <button onClick={() => setFlowing((value) => !value)} aria-pressed={flowing} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${flowing ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-200" : "border-slate-600 bg-slate-900/80 text-slate-300"}`}>
                <CirclePlay size={14} /> {flowing ? "Flow animation on" : "Flow animation off"}
              </button>
              <button onClick={() => setWaterVisible((value) => !value)} aria-pressed={waterVisible} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${waterVisible ? "border-sky-400/60 bg-sky-500/15 text-sky-100" : "border-slate-600 bg-slate-900/80 text-slate-300"}`}>
                <Waves size={14} /> Water {waterVisible ? "shown" : "hidden"}
              </button>
              <button onClick={() => setSolidsVisible((value) => !value)} aria-pressed={solidsVisible} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${solidsVisible ? "border-amber-400/60 bg-amber-500/15 text-amber-100" : "border-slate-600 bg-slate-900/80 text-slate-300"}`}>
                <Layers3 size={14} /> Solids {solidsVisible ? "shown" : "hidden"}
              </button>
            </div>
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-3 w-3 rounded-full" style={{ background: selectedPart.color }} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Selected component</p>
              <h2 className="text-xl font-black text-slate-900">{selectedPart.label}</h2>
            </div>
          </div>
          <p className="text-sm leading-6 text-slate-600">{selectedPart.function}</p>
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">Operator lens</p>
            <p className="mt-1 text-sm leading-6 text-amber-950">{selectedPart.operatorLens}</p>
          </div>
          <div className="mt-3 rounded-2xl border border-sky-200 bg-sky-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-700">Exam connection</p>
            <p className="mt-1 text-sm leading-6 text-sky-950">{selectedPart.examConnection}</p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {CLARIFIER_PARTS.map((part) => (
              <button key={part.id} onClick={() => setActivePart(part.id)} aria-pressed={activePart === part.id}
                className={`rounded-xl border px-2.5 py-2 text-left text-xs font-semibold transition-colors ${activePart === part.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50"}`}>
                {part.label}
              </button>
            ))}
          </div>
        </aside>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Follow the flow</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Clarification is a controlled separation process.</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-500">This schematic explains a common centre-feed circular clarifier. Operating limits and response actions always follow local procedures and approved design documents.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {CLARIFIER_STAGES.map((stage) => {
            const selected = activeStage === stage.id;
            return (
              <button key={stage.id} onClick={() => setActiveStage(stage.id)} aria-pressed={selected}
                className={`rounded-2xl border p-4 text-left transition-all ${selected ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/15" : "border-slate-200 bg-slate-50 text-slate-700 hover:-translate-y-0.5 hover:border-slate-400"}`}>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black" style={{ background: selected ? "rgba(255,255,255,.18)" : `${stage.accent}20`, color: selected ? "#fff" : stage.accent }}>{stage.step}</span>
                <p className="mt-4 text-sm font-black">{stage.title}</p>
                <p className={`mt-2 text-xs leading-5 ${selected ? "text-slate-200" : "text-slate-500"}`}>{stage.description}</p>
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-sky-50 p-4">
          <p className="text-sm text-sky-950"><span className="font-bold">Current focus:</span> {selectedStage.title} — {selectedStage.description}</p>
          <button onClick={onStudyLink} className="rounded-xl bg-sky-700 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-sky-800">
            Open wastewater study guide
          </button>
        </div>
      </div>
    </section>
  );
}
