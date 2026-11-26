// WastewaterMap.tsx — Unified Wastewater Treatment Process Diagram
// Snake layout, clean proportioned arrows

import { WW_STEPS } from "@/lib/wastewaterData";

interface WastewaterMapProps {
  onStepClick: (stepId: string) => void;
  activeStepId?: string;
}

const PIPE_LABELS: string[] = [
  "Raw sewage\n200–300 mg/L",
  "Primary\neffluent",
  "Activated\nsludge mix",
  "Secondary\neffluent",
  "Disinfected\neffluent",
  "<10 mg/L\nBOD",
];

const COLS = 4;
const SW = 130;
const SH = 130;
const HGAP = 56;
const VGAP = 72;
const PAD = 16;

function pos(idx: number) {
  const row = Math.floor(idx / COLS);
  const col = row % 2 === 0 ? idx % COLS : COLS - 1 - (idx % COLS);
  return { x: PAD + col * (SW + HGAP), y: PAD + row * (SH + VGAP) };
}

export default function WastewaterMap({ onStepClick, activeStepId }: WastewaterMapProps) {
  const steps = WW_STEPS;
  const rows = Math.ceil(steps.length / COLS);
  const totalW = PAD * 2 + COLS * SW + (COLS - 1) * HGAP;
  const totalH = PAD * 2 + rows * SH + (rows - 1) * VGAP + 24;

  const connectors = steps.slice(0, -1).map((s, i) => {
    const from = pos(i);
    const to = pos(i + 1);
    const fromRow = Math.floor(i / COLS);
    const toRow = Math.floor((i + 1) / COLS);
    const label = PIPE_LABELS[i] ?? "";
    let d: string, labelX: number, labelY: number;

    if (fromRow === toRow) {
      const ltr = fromRow % 2 === 0;
      const x1 = ltr ? from.x + SW : from.x;
      const x2 = ltr ? to.x : to.x + SW;
      const cy = from.y + SH / 2;
      d = `M${x1},${cy} L${x2},${cy}`;
      labelX = (x1 + x2) / 2;
      labelY = cy - 18;
    } else {
      const x1 = from.x + SW / 2;
      const y1 = from.y + SH;
      const x2 = to.x + SW / 2;
      const y2 = to.y;
      const midY = y1 + VGAP / 2;
      d = `M${x1},${y1} L${x1},${midY} L${x2},${midY} L${x2},${y2}`;
      labelX = (x1 + x2) / 2;
      labelY = midY - 4;
    }
    return { d, label, labelX, labelY, color: s.color, id: s.id };
  });

  return (
    <div style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" as const }}>
      <style>{`
        @keyframes wwSnakeFlow { from { stroke-dashoffset: 20 } to { stroke-dashoffset: 0 } }
        .ww-snake-pipe { animation: wwSnakeFlow 0.75s linear infinite; }
        .ww-snake-node { cursor: pointer; }
      `}</style>
      <svg viewBox={`0 0 ${totalW} ${totalH}`} style={{ width: "100%", minWidth: 560, display: "block" }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          {connectors.map((c) => (
            <marker key={c.id} id={`ww-arr-${c.id}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0.5 L5,3 L0,5.5 Z" fill={c.color} />
            </marker>
          ))}
        </defs>

        {connectors.map((c) => (
          <g key={c.id}>
            <path d={c.d} stroke="#E2E8F0" strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d={c.d} stroke={c.color} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="9 6" className="ww-snake-pipe" markerEnd={`url(#ww-arr-${c.id})`} opacity={0.82} />
            {c.label && (
              <g>
                <rect x={c.labelX - 38} y={c.labelY - 13} width={76} height={22} rx={11} fill="white" stroke={c.color} strokeWidth={1.2} opacity={0.96} />
                <text x={c.labelX} y={c.labelY - 4} textAnchor="middle" fontSize={7.5} fill={c.color} fontFamily="'Sora', sans-serif" fontWeight={700}>{c.label.split("\n")[0]}</text>
                {c.label.split("\n")[1] && <text x={c.labelX} y={c.labelY + 5} textAnchor="middle" fontSize={7.5} fill="#64748B" fontFamily="'Sora', sans-serif" fontWeight={600}>{c.label.split("\n")[1]}</text>}
              </g>
            )}
          </g>
        ))}

        {steps.map((step, i) => {
          const { x, y } = pos(i);
          const isActive = activeStepId === step.id;
          const words = step.label.split(" ");
          const mid = Math.ceil(words.length / 2);
          const line1 = words.slice(0, mid).join(" ");
          const line2 = words.slice(mid).join(" ");
          const twoLine = step.label.length > 13 && words.length > 1;
          return (
            <g key={step.id} className="ww-snake-node" onClick={() => onStepClick(step.id)} transform={`translate(${x},${y})`}>
              {isActive && <rect x={-5} y={-5} width={SW + 10} height={SH + 10} rx={22} fill="none" stroke={step.color} strokeWidth={3} opacity={0.4} />}
              <rect x={0} y={0} width={SW} height={SH} rx={18}
                fill={isActive ? step.bg : "#FFFFFF"} stroke={isActive ? step.color : "#E2E8F0"} strokeWidth={isActive ? 2.5 : 1.5}
                style={{ filter: isActive ? `drop-shadow(0 4px 16px ${step.color}45)` : "drop-shadow(0 2px 8px rgba(0,0,0,0.07))" }} />
              <rect x={8} y={8} width={24} height={17} rx={8.5} fill={step.color} />
              <text x={20} y={20} textAnchor="middle" fontSize={9.5} fill="white" fontWeight={800} fontFamily="'Sora', sans-serif">{step.num}</text>
              <text x={SW / 2} y={62} textAnchor="middle" fontSize={30}>{step.icon}</text>
              {twoLine ? (
                <>
                  <text x={SW / 2} y={82} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={isActive ? step.color : "#1E293B"} fontFamily="'Sora', sans-serif">{line1}</text>
                  <text x={SW / 2} y={95} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={isActive ? step.color : "#1E293B"} fontFamily="'Sora', sans-serif">{line2}</text>
                </>
              ) : (
                <text x={SW / 2} y={84} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={isActive ? step.color : "#1E293B"} fontFamily="'Sora', sans-serif">{step.label}</text>
              )}
              <text x={SW / 2} y={SH - 7} textAnchor="middle" fontSize={7.5} fill={step.color} fontFamily="'Sora', sans-serif" fontWeight={600} opacity={0.7}>tap to explore →</text>
            </g>
          );
        })}

        <text x={pos(steps.length - 1).x + SW / 2} y={pos(steps.length - 1).y + SH + 18}
          textAnchor="middle" fontSize={9} fill="#059669" fontFamily="'Sora', sans-serif" fontWeight={700}>
          ✓ TREATED EFFLUENT DISCHARGED
        </text>
      </svg>
    </div>
  );
}
