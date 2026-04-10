// ProcessMap.tsx — Unified Drinking Water Treatment Process Diagram
// Single straight horizontal row, all 7 steps, large visible arrows

import { STEPS } from "@/lib/processData";

interface ProcessMapProps {
  onStepClick: (stepId: string) => void;
  activeStepId?: string;
}

const PIPE_LABELS: string[] = [
  "Raw water\n5–500 NTU",
  "Destabilised\nparticles",
  "Floc\nforming",
  "Clarified\n1–10 NTU",
  "Filtered\n<0.3 NTU",
  "Disinfected\nCl₂ residual",
];

const SW = 120;   // step card width
const SH = 120;   // step card height
const GAP = 72;   // gap between cards (connector zone)
const PAD = 20;   // left/right padding

export default function ProcessMap({ onStepClick, activeStepId }: ProcessMapProps) {
  const steps = STEPS;
  const totalW = PAD * 2 + steps.length * SW + (steps.length - 1) * GAP;
  const totalH = SH + 80; // extra for pipe labels above + safe drinking water label below

  return (
    <div style={{ width: "100%", overflowX: "auto", overflowY: "visible" }}>
      <style>{`
        @keyframes pmFlow { from { stroke-dashoffset: 24 } to { stroke-dashoffset: 0 } }
        .pm-pipe { animation: pmFlow 0.7s linear infinite; }
        .pm-node { cursor: pointer; }
        .pm-node:hover rect.pm-card { filter: brightness(1.06) drop-shadow(0 6px 18px rgba(0,0,0,0.16)) !important; }
      `}</style>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        style={{ width: "100%", minWidth: Math.min(totalW, 900), display: "block" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {steps.map((s) => (
            <marker
              key={s.id}
              id={`arr-${s.id}`}
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="5"
              orient="auto"
            >
              <path d="M1,1 L9,5 L1,9 Z" fill={s.color} />
            </marker>
          ))}
        </defs>

        {/* ── CONNECTORS ── */}
        {steps.slice(0, -1).map((s, i) => {
          const fromX = PAD + i * (SW + GAP) + SW;
          const toX = PAD + (i + 1) * (SW + GAP);
          const midX = (fromX + toX) / 2;
          const cy = 40 + SH / 2; // vertical centre of cards

          const label = PIPE_LABELS[i] ?? "";

          return (
            <g key={s.id}>
              {/* Pipe track */}
              <line
                x1={fromX} y1={cy}
                x2={toX - 2} y2={cy}
                stroke="#E2E8F0"
                strokeWidth={8}
                strokeLinecap="round"
              />
              {/* Animated flow */}
              <line
                x1={fromX} y1={cy}
                x2={toX - 12} y2={cy}
                stroke={s.color}
                strokeWidth={5}
                strokeLinecap="round"
                strokeDasharray="10 7"
                className="pm-pipe"
                markerEnd={`url(#arr-${s.id})`}
                opacity={0.85}
              />
              {/* Label pill */}
              {label && (
                <g>
                  <rect
                    x={midX - 38} y={cy - 28}
                    width={76} height={22}
                    rx={11}
                    fill="white"
                    stroke={s.color}
                    strokeWidth={1.2}
                    opacity={0.95}
                  />
                  <text
                    x={midX} y={cy - 20}
                    textAnchor="middle"
                    fontSize={7.5}
                    fill={s.color}
                    fontFamily="'Sora', sans-serif"
                    fontWeight={700}
                  >
                    {label.split("\n")[0]}
                  </text>
                  {label.split("\n")[1] && (
                    <text
                      x={midX} y={cy - 11}
                      textAnchor="middle"
                      fontSize={7.5}
                      fill="#64748B"
                      fontFamily="'Sora', sans-serif"
                      fontWeight={600}
                    >
                      {label.split("\n")[1]}
                    </text>
                  )}
                </g>
              )}
            </g>
          );
        })}

        {/* ── STEP CARDS ── */}
        {steps.map((step, i) => {
          const x = PAD + i * (SW + GAP);
          const y = 40;
          const isActive = activeStepId === step.id;

          return (
            <g
              key={step.id}
              className="pm-node"
              onClick={() => onStepClick(step.id)}
              transform={`translate(${x}, ${y})`}
            >
              {/* Glow ring when active */}
              {isActive && (
                <rect
                  x={-5} y={-5}
                  width={SW + 10} height={SH + 10}
                  rx={22}
                  fill="none"
                  stroke={step.color}
                  strokeWidth={3}
                  opacity={0.45}
                />
              )}
              {/* Card */}
              <rect
                className="pm-card"
                x={0} y={0}
                width={SW} height={SH}
                rx={18}
                fill={isActive ? step.bg : "#FFFFFF"}
                stroke={isActive ? step.color : "#E2E8F0"}
                strokeWidth={isActive ? 2.5 : 1.5}
                style={{
                  filter: isActive
                    ? `drop-shadow(0 4px 16px ${step.color}45)`
                    : "drop-shadow(0 2px 8px rgba(0,0,0,0.07))",
                }}
              />
              {/* Step number badge */}
              <rect x={8} y={8} width={24} height={17} rx={8.5} fill={step.color} />
              <text
                x={20} y={20}
                textAnchor="middle"
                fontSize={9.5}
                fill="white"
                fontWeight={800}
                fontFamily="'Sora', sans-serif"
              >
                {step.num}
              </text>
              {/* Icon */}
              <text x={SW / 2} y={58} textAnchor="middle" fontSize={28}>
                {step.icon}
              </text>
              {/* Label — up to 2 lines */}
              {(() => {
                const words = step.label.split(" ");
                if (step.label.length <= 13 || words.length === 1) {
                  return (
                    <text x={SW / 2} y={76} textAnchor="middle" fontSize={10} fontWeight={700}
                      fill={isActive ? step.color : "#1E293B"} fontFamily="'Sora', sans-serif">
                      {step.label}
                    </text>
                  );
                }
                const mid = Math.ceil(words.length / 2);
                const line1 = words.slice(0, mid).join(" ");
                const line2 = words.slice(mid).join(" ");
                return (
                  <>
                    <text x={SW / 2} y={74} textAnchor="middle" fontSize={10} fontWeight={700}
                      fill={isActive ? step.color : "#1E293B"} fontFamily="'Sora', sans-serif">
                      {line1}
                    </text>
                    <text x={SW / 2} y={86} textAnchor="middle" fontSize={10} fontWeight={700}
                      fill={isActive ? step.color : "#1E293B"} fontFamily="'Sora', sans-serif">
                      {line2}
                    </text>
                  </>
                );
              })()}
              {/* Tap hint */}
              <text
                x={SW / 2} y={SH - 7}
                textAnchor="middle"
                fontSize={7}
                fill={step.color}
                fontFamily="'Sora', sans-serif"
                fontWeight={600}
                opacity={0.75}
              >
                tap to explore →
              </text>
            </g>
          );
        })}

        {/* ✓ SAFE DRINKING WATER label */}
        <text
          x={PAD + steps.length * SW + (steps.length - 1) * GAP - SW / 2}
          y={40 + SH + 20}
          textAnchor="middle"
          fontSize={9}
          fill="#059669"
          fontFamily="'Sora', sans-serif"
          fontWeight={700}
        >
          ✓ SAFE DRINKING WATER
        </text>
      </svg>
    </div>
  );
}
