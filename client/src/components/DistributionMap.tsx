// DistributionMap.tsx — Unified Water Distribution Process Diagram
import { DIST_STEPS } from "@/lib/distributionData";

interface DistributionMapProps {
  onStepClick: (stepId: string) => void;
  activeStepId?: string;
}

const PIPE_LABELS: Record<string, string> = {
  "pumping→transmission":          "275–550 kPa\ntreated water",
  "transmission→storage":          "Bulk flow\nto storage",
  "storage→pressurezones":         "Gravity\npressure",
  "pressurezones→distribution_mains": "PRV-regulated\n140–700 kPa",
  "distribution_mains→crossconnection": "Street-level\ndelivery",
  "crossconnection→service":       "Backflow\nprotected",
};

const STEP_WIDTH = 110;
const STEP_HEIGHT = 110;
const H_GAP = 60;
const ROW_Y = [0, 200];
const COLS = 4;

function getStepPos(idx: number): { x: number; y: number } {
  if (idx < COLS) {
    return { x: idx * (STEP_WIDTH + H_GAP), y: ROW_Y[0] };
  } else {
    const col = COLS - 1 - (idx - COLS);
    return { x: col * (STEP_WIDTH + H_GAP), y: ROW_Y[1] };
  }
}

const TOTAL_W = COLS * STEP_WIDTH + (COLS - 1) * H_GAP;
const TOTAL_H = ROW_Y[1] + STEP_HEIGHT + 20;

export default function DistributionMap({ onStepClick, activeStepId }: DistributionMapProps) {
  const steps = DIST_STEPS;

  const connectors: { path: string; label: string; midX: number; midY: number }[] = [];
  for (let i = 0; i < steps.length - 1; i++) {
    const from = getStepPos(i);
    const to = getStepPos(i + 1);
    const key = `${steps[i].id}→${steps[i + 1].id}`;
    const label = PIPE_LABELS[key] ?? "";
    const fy = from.y + STEP_HEIGHT / 2;
    const ty = to.y + STEP_HEIGHT / 2;

    let path: string;
    let midX: number;
    let midY: number;

    if (from.y === to.y) {
      const startX = from.x + STEP_WIDTH;
      const endX = to.x;
      path = `M ${startX} ${fy} L ${endX} ${ty}`;
      midX = (startX + endX) / 2;
      midY = fy - 14;
    } else {
      const startX = from.x + STEP_WIDTH / 2;
      const startY = from.y + STEP_HEIGHT;
      const endX = to.x + STEP_WIDTH / 2;
      const endY = to.y;
      const midRowY = (startY + endY) / 2;
      path = `M ${startX} ${startY} L ${startX} ${midRowY} L ${endX} ${midRowY} L ${endX} ${endY}`;
      midX = (startX + endX) / 2;
      midY = midRowY;
    }

    connectors.push({ path, label, midX, midY });
  }

  return (
    <div style={{ width: "100%", overflowX: "auto", overflowY: "visible" }}>
      <style>{`
        @keyframes distFlowDash { from { stroke-dashoffset: 20 } to { stroke-dashoffset: 0 } }
        .dist-flow-pipe { animation: distFlowDash 0.8s linear infinite; }
        .dist-step-node { cursor: pointer; transition: filter 0.15s; }
        .dist-step-node:hover { filter: brightness(1.08) drop-shadow(0 4px 12px rgba(0,0,0,0.18)); }
      `}</style>
      <svg
        viewBox={`-20 -20 ${TOTAL_W + 40} ${TOTAL_H + 40}`}
        style={{ width: "100%", minWidth: 680, display: "block" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <marker id="dist-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#60A5FA" />
          </marker>
        </defs>

        {connectors.map((c, i) => {
          const fromStep = steps[i];
          return (
            <g key={i}>
              <path d={c.path} stroke="#E2E8F0" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <path
                d={c.path} stroke={fromStep.color} strokeWidth={4} fill="none"
                strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8 6"
                className="dist-flow-pipe" markerEnd="url(#dist-arrow)" opacity={0.7}
              />
              {c.label && (
                <g>
                  <rect x={c.midX - 40} y={c.midY - 14} width={80} height={28} rx={6} fill="white" stroke="#E2E8F0" strokeWidth={1} />
                  {c.label.split("\n").map((line, li) => (
                    <text key={li} x={c.midX} y={c.midY - 3 + li * 11} textAnchor="middle" fontSize={8} fill="#64748B" fontFamily="'Sora', sans-serif" fontWeight={600}>{line}</text>
                  ))}
                </g>
              )}
            </g>
          );
        })}

        {steps.map((step, i) => {
          const { x, y } = getStepPos(i);
          const isActive = activeStepId === step.id;
          return (
            <g key={step.id} className="dist-step-node" onClick={() => onStepClick(step.id)} transform={`translate(${x}, ${y})`}>
              {isActive && (
                <rect x={-4} y={-4} width={STEP_WIDTH + 8} height={STEP_HEIGHT + 8} rx={20} fill="none" stroke={step.color} strokeWidth={3} opacity={0.5} />
              )}
              <rect
                x={0} y={0} width={STEP_WIDTH} height={STEP_HEIGHT} rx={16}
                fill={isActive ? step.bg : "#FFFFFF"}
                stroke={isActive ? step.color : "#E2E8F0"}
                strokeWidth={isActive ? 2.5 : 1.5}
                style={{ filter: isActive ? `drop-shadow(0 4px 14px ${step.color}40)` : "drop-shadow(0 2px 6px rgba(0,0,0,0.06))" }}
              />
              <rect x={8} y={8} width={22} height={16} rx={8} fill={step.color} />
              <text x={19} y={19} textAnchor="middle" fontSize={9} fill="white" fontWeight={800} fontFamily="'Sora', sans-serif">{step.num}</text>
              <text x={STEP_WIDTH / 2} y={52} textAnchor="middle" fontSize={26}>{step.icon}</text>
              <text x={STEP_WIDTH / 2} y={72} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={isActive ? step.color : "#1E293B"} fontFamily="'Sora', sans-serif">
                {step.label.length > 14 ? step.label.split(" ")[0] : step.label}
              </text>
              {step.label.split(" ").length > 1 && step.label.length > 14 && (
                <text x={STEP_WIDTH / 2} y={83} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={isActive ? step.color : "#1E293B"} fontFamily="'Sora', sans-serif">
                  {step.label.split(" ").slice(1).join(" ")}
                </text>
              )}
              <text x={STEP_WIDTH / 2} y={97} textAnchor="middle" fontSize={7.5} fill="#94A3B8" fontFamily="'Sora', sans-serif">
                {step.shortDesc.length > 20 ? step.shortDesc.slice(0, 18) + "…" : step.shortDesc}
              </text>
              <text x={STEP_WIDTH / 2} y={STEP_HEIGHT - 5} textAnchor="middle" fontSize={7} fill={step.color} fontFamily="'Sora', sans-serif" fontWeight={600} opacity={0.8}>
                Tap to explore →
              </text>
            </g>
          );
        })}

        <text x={-16} y={STEP_HEIGHT / 2 - 10} fontSize={8} fill="#94A3B8" fontFamily="'Sora', sans-serif" fontWeight={700} transform="rotate(-90, -16, 55)">
          TREATMENT PLANT
        </text>
        <text
          x={getStepPos(steps.length - 1).x + STEP_WIDTH / 2}
          y={ROW_Y[1] + STEP_HEIGHT + 16}
          textAnchor="middle" fontSize={8} fill="#059669"
          fontFamily="'Sora', sans-serif" fontWeight={700}
        >
          ✓ CONSUMER TAP
        </text>
      </svg>
    </div>
  );
}
