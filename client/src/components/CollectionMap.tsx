// CollectionMap.tsx — Unified Wastewater Collection System Diagram
// Single straight horizontal row, all 7 steps, large visible arrows

import { COLL_STEPS } from "@/lib/collectionData";

interface CollectionMapProps {
  onStepClick: (stepId: string) => void;
  activeStepId?: string;
}

const PIPE_LABELS: string[] = [
  "Building\ndrain",
  "Min 2%\nslope",
  "Gravity\nflow",
  "Collected\nsewage",
  "Pumped\npressure",
  "Force main\ndischarge",
];

const SW = 120;
const SH = 120;
const GAP = 72;
const PAD = 20;

export default function CollectionMap({ onStepClick, activeStepId }: CollectionMapProps) {
  const steps = COLL_STEPS;
  const totalW = PAD * 2 + steps.length * SW + (steps.length - 1) * GAP;
  const totalH = SH + 80;

  return (
    <div style={{ width: "100%", overflowX: "auto", overflowY: "visible" }}>
      <style>{`
        @keyframes collFlow { from { stroke-dashoffset: 24 } to { stroke-dashoffset: 0 } }
        .coll-pipe { animation: collFlow 0.7s linear infinite; }
        .coll-node { cursor: pointer; }
      `}</style>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        style={{ width: "100%", minWidth: Math.min(totalW, 900), display: "block" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {steps.map((s) => (
            <marker key={s.id} id={`collarr-${s.id}`} markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
              <path d="M0,0.5 L4,2.5 L0,4.5 Z" fill={s.color} />
            </marker>
          ))}
        </defs>

        {steps.slice(0, -1).map((s, i) => {
          const fromX = PAD + i * (SW + GAP) + SW;
          const toX = PAD + (i + 1) * (SW + GAP);
          const midX = (fromX + toX) / 2;
          const cy = 40 + SH / 2;
          const label = PIPE_LABELS[i] ?? "";
          return (
            <g key={s.id}>
              <line x1={fromX} y1={cy} x2={toX - 2} y2={cy} stroke="#E2E8F0" strokeWidth={8} strokeLinecap="round" />
              <line x1={fromX} y1={cy} x2={toX - 6} y2={cy} stroke={s.color} strokeWidth={5} strokeLinecap="round"
                strokeDasharray="10 7" className="coll-pipe" markerEnd={`url(#collarr-${s.id})`} opacity={0.85} />
              {label && (
                <g>
                  <rect x={midX - 38} y={cy - 28} width={76} height={22} rx={11} fill="white" stroke={s.color} strokeWidth={1.2} opacity={0.95} />
                  <text x={midX} y={cy - 20} textAnchor="middle" fontSize={7.5} fill={s.color} fontFamily="'Sora', sans-serif" fontWeight={700}>{label.split("\n")[0]}</text>
                  {label.split("\n")[1] && <text x={midX} y={cy - 11} textAnchor="middle" fontSize={7.5} fill="#64748B" fontFamily="'Sora', sans-serif" fontWeight={600}>{label.split("\n")[1]}</text>}
                </g>
              )}
            </g>
          );
        })}

        {steps.map((step, i) => {
          const x = PAD + i * (SW + GAP);
          const y = 40;
          const isActive = activeStepId === step.id;
          const words = step.label.split(" ");
          const mid = Math.ceil(words.length / 2);
          const line1 = words.slice(0, mid).join(" ");
          const line2 = words.slice(mid).join(" ");
          const twoLine = step.label.length > 13 && words.length > 1;
          return (
            <g key={step.id} className="coll-node" onClick={() => onStepClick(step.id)} transform={`translate(${x}, ${y})`}>
              {isActive && <rect x={-5} y={-5} width={SW + 10} height={SH + 10} rx={22} fill="none" stroke={step.color} strokeWidth={3} opacity={0.45} />}
              <rect x={0} y={0} width={SW} height={SH} rx={18}
                fill={isActive ? step.bg : "#FFFFFF"}
                stroke={isActive ? step.color : "#E2E8F0"}
                strokeWidth={isActive ? 2.5 : 1.5}
                style={{ filter: isActive ? `drop-shadow(0 4px 16px ${step.color}45)` : "drop-shadow(0 2px 8px rgba(0,0,0,0.07))" }}
              />
              <rect x={8} y={8} width={24} height={17} rx={8.5} fill={step.color} />
              <text x={20} y={20} textAnchor="middle" fontSize={9.5} fill="white" fontWeight={800} fontFamily="'Sora', sans-serif">{step.num}</text>
              <text x={SW / 2} y={58} textAnchor="middle" fontSize={28}>{step.icon}</text>
              {twoLine ? (
                <>
                  <text x={SW / 2} y={74} textAnchor="middle" fontSize={10} fontWeight={700} fill={isActive ? step.color : "#1E293B"} fontFamily="'Sora', sans-serif">{line1}</text>
                  <text x={SW / 2} y={86} textAnchor="middle" fontSize={10} fontWeight={700} fill={isActive ? step.color : "#1E293B"} fontFamily="'Sora', sans-serif">{line2}</text>
                </>
              ) : (
                <text x={SW / 2} y={76} textAnchor="middle" fontSize={10} fontWeight={700} fill={isActive ? step.color : "#1E293B"} fontFamily="'Sora', sans-serif">{step.label}</text>
              )}
              <text x={SW / 2} y={SH - 7} textAnchor="middle" fontSize={7} fill={step.color} fontFamily="'Sora', sans-serif" fontWeight={600} opacity={0.75}>tap to explore →</text>
            </g>
          );
        })}

        <text x={PAD + steps.length * SW + (steps.length - 1) * GAP - SW / 2} y={40 + SH + 20}
          textAnchor="middle" fontSize={9} fill="#7C3AED" fontFamily="'Sora', sans-serif" fontWeight={700}>
          → WASTEWATER TREATMENT PLANT
        </text>
      </svg>
    </div>
  );
}
