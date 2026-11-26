import { useState, useEffect, useRef } from "react";
import { Activity, AlertTriangle, Droplets, Gauge, Waves, Zap, ThermometerSun, Wind } from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type TelemetryItem = {
  label: string;
  value: string | number;
  unit: string;
  status: "normal" | "warning" | "critical";
  trend: number[];
};

type ProcessNode = string;

// ─── RADIAL GAUGE ─────────────────────────────────────────────────────────────
export function RadialGauge({
  value,
  max = 100,
  label,
  unit,
  status,
  size = 120,
}: {
  value: number;
  max?: number;
  label: string;
  unit: string;
  status: "normal" | "warning" | "critical";
  size?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const animRef = useRef<number>(0);
  const jitterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetRef = useRef(value);

  useEffect(() => {
    targetRef.current = value;
    const start = displayValue;
    const diff = value - start;
    const duration = 800;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(start + diff * eased);
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [value]);

  useEffect(() => {
    jitterRef.current = setInterval(() => {
      const jitterRange = Math.max(0.3, targetRef.current * 0.015);
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      setDisplayValue(Math.max(0, targetRef.current + jitter));
    }, 600 + Math.random() * 400);
    return () => { if (jitterRef.current) clearInterval(jitterRef.current); };
  }, [value]);

  const radius = (size - 20) / 2;
  const circumference = Math.PI * radius;
  const percent = Math.min(displayValue / max, 1);
  const strokeDashoffset = circumference * (1 - percent);

  const statusColor = status === "critical" ? "#DC2626" : status === "warning" ? "#D97706" : "#0D9488";
  const bgArc = "#E2E8F0";

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
        <path
          d={`M ${10} ${size * 0.6} A ${radius} ${radius} 0 0 1 ${size - 10} ${size * 0.6}`}
          fill="none"
          stroke={bgArc}
          strokeWidth={8}
          strokeLinecap="round"
        />
        <path
          d={`M ${10} ${size * 0.6} A ${radius} ${radius} 0 0 1 ${size - 10} ${size * 0.6}`}
          fill="none"
          stroke={statusColor}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.23,1,0.32,1)" }}
        />
        <g style={{ transformOrigin: `${size / 2}px ${size * 0.6}px`, transform: `rotate(${-180 + percent * 180}deg)`, transition: "transform 0.8s cubic-bezier(0.23,1,0.32,1)" }}>
          <line x1={size / 2} y1={size * 0.6} x2={size / 2} y2={size * 0.6 - radius + 14} stroke={statusColor} strokeWidth={2} strokeLinecap="round" />
          <circle cx={size / 2} cy={size * 0.6} r={4} fill={statusColor} />
        </g>
        <text x={size / 2} y={size * 0.6 - 8} textAnchor="middle" fill="#0F172A" fontSize={size * 0.16} fontWeight={900} fontFamily="'JetBrains Mono', monospace">
          {displayValue.toFixed(1)}
        </text>
        <text x={size / 2} y={size * 0.6 + 8} textAnchor="middle" fill="#64748B" fontSize={9} fontWeight={600}>
          {unit}
        </text>
      </svg>
      <span className="mt-1 text-[9px] font-bold uppercase tracking-[.14em] text-slate-500">{label}</span>
    </div>
  );
}

// ─── ALARM PANEL ──────────────────────────────────────────────────────────────
type Alarm = {
  id: string;
  severity: "critical" | "warning" | "info";
  message: string;
  time: string;
  acknowledged?: boolean;
};

export function AlarmPanel({ alarms }: { alarms: Alarm[] }) {
  const [flashState, setFlashState] = useState(true);

  useEffect(() => {
    const hasCritical = alarms.some(a => a.severity === "critical" && !a.acknowledged);
    if (!hasCritical) return;
    const interval = setInterval(() => setFlashState(prev => !prev), 500);
    return () => clearInterval(interval);
  }, [alarms]);

  const severityConfig = {
    critical: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: AlertTriangle },
    warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: Zap },
    info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: Activity },
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${alarms.some(a => a.severity === "critical") ? (flashState ? "bg-red-500" : "bg-transparent") : "bg-emerald-500"}`} />
          <span className="text-[9px] font-black uppercase tracking-[.16em] text-slate-500">Alarm register</span>
        </div>
        <span className="text-[9px] font-mono text-slate-400">{alarms.length} active</span>
      </div>
      <div className="max-h-[140px] space-y-1.5 overflow-y-auto scrollbar-thin">
        {alarms.map(alarm => {
          const config = severityConfig[alarm.severity];
          const Icon = config.icon;
          return (
            <div
              key={alarm.id}
              className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${config.bg} ${config.border} ${alarm.severity === "critical" && !alarm.acknowledged && flashState ? "opacity-100" : alarm.severity === "critical" && !alarm.acknowledged ? "opacity-60" : "opacity-100"}`}
            >
              <Icon className={`mt-0.5 h-3 w-3 shrink-0 ${config.text}`} />
              <div className="min-w-0 flex-1">
                <div className={`text-[10px] font-bold leading-4 ${config.text}`}>{alarm.message}</div>
                <div className="text-[8px] font-mono text-slate-400">{alarm.time}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PROCESS FLOW DIAGRAM (SVG) ──────────────────────────────────────────────
export function ProcessFlowDiagram({
  nodes,
  focusNode,
  decisions,
}: {
  nodes: ProcessNode[];
  focusNode: number;
  decisions: { points: number }[];
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[9px] font-black uppercase tracking-[.16em] text-slate-500">Process topology</span>
        <div className="flex items-center gap-1.5 text-[8px] font-bold text-emerald-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          LIVE
        </div>
      </div>
      <svg viewBox="0 0 600 80" className="w-full" style={{ minHeight: 60 }}>
        <defs>
          <style>{`
            @keyframes flowDash { from { stroke-dashoffset: 24; } to { stroke-dashoffset: 0; } }
            .flow-line { stroke-dasharray: 8 4; animation: flowDash 0.6s linear infinite; }
          `}</style>
        </defs>

        {nodes.map((_, i) => {
          if (i >= nodes.length - 1) return null;
          const x1 = 60 + i * (480 / (nodes.length - 1));
          const x2 = 60 + (i + 1) * (480 / (nodes.length - 1));
          const completed = i < focusNode;
          return (
            <line
              key={`line-${i}`}
              x1={x1 + 16}
              y1={40}
              x2={x2 - 16}
              y2={40}
              stroke={completed ? "#0D9488" : "#CBD5E1"}
              strokeWidth={2}
              className={completed ? "flow-line" : ""}
              strokeLinecap="round"
            />
          );
        })}

        {nodes.map((node, i) => {
          const x = 60 + i * (480 / (nodes.length - 1));
          const active = i === focusNode;
          const completed = i < focusNode;
          const failed = completed && decisions[i]?.points === 0;

          const fillColor = active ? "#DC2626" : completed ? (failed ? "#D97706" : "#0D9488") : "#F1F5F9";
          const strokeColor = active ? "#EF4444" : completed ? (failed ? "#F59E0B" : "#14B8A6") : "#94A3B8";
          const textColor = active ? "#DC2626" : completed ? "#0F172A" : "#64748B";

          return (
            <g key={node}>
              {active && <circle cx={x} cy={40} r={22} fill="none" stroke="#DC2626" strokeWidth={1} opacity={0.3}>
                <animate attributeName="r" values="20;24;20" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0.1;0.3" dur="1.5s" repeatCount="indefinite" />
              </circle>}
              <circle cx={x} cy={40} r={16} fill={fillColor} stroke={strokeColor} strokeWidth={2} />
              {active && <circle cx={x} cy={40} r={4} fill="#FFF">
                <animate attributeName="opacity" values="1;0.4;1" dur="0.8s" repeatCount="indefinite" />
              </circle>}
              {completed && !failed && <path d={`M${x - 4} ${40} l3 3 5-6`} fill="none" stroke="#FFF" strokeWidth={2} strokeLinecap="round" />}
              {completed && failed && <text x={x} y={44} textAnchor="middle" fill="#FFF" fontSize={12} fontWeight={900}>!</text>}
              <text x={x} y={70} textAnchor="middle" fill={textColor} fontSize={7} fontWeight={700} letterSpacing="0.02em">
                {node.length > 10 ? node.slice(0, 9) + "…" : node}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── TELEMETRY TICKER ─────────────────────────────────────────────────────────
export function TelemetryTicker({ items }: { items: TelemetryItem[] }) {
  const [fluctuated, setFluctuated] = useState(items);

  useEffect(() => {
    const interval = setInterval(() => {
      setFluctuated(prev =>
        prev.map((item, i) => {
          const original = items[i];
          if (!original) return item;
          const numVal = typeof original.value === "string" ? parseFloat(original.value) : original.value;
          if (isNaN(numVal)) return { ...original };
          const jitter = (Math.random() - 0.5) * numVal * 0.04;
          return { ...original, value: String(Math.max(0, +(numVal + jitter).toFixed(2))) };
        })
      );
    }, 1500);
    return () => clearInterval(interval);
  }, [items]);

  useEffect(() => {
    setFluctuated(items);
  }, [items]);

  const getIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes("turb")) return Droplets;
    if (l.includes("chlor") || l.includes("resid")) return Wind;
    if (l.includes("flow")) return Waves;
    if (l.includes("temp")) return ThermometerSun;
    if (l.includes("ph")) return Activity;
    if (l.includes("press")) return Gauge;
    return Activity;
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {fluctuated.map((item) => {
        const Icon = getIcon(item.label);
        const statusColor = item.status === "critical" ? "text-red-600" : item.status === "warning" ? "text-amber-600" : "text-emerald-600";
        const borderColor = item.status === "critical" ? "border-red-200" : item.status === "warning" ? "border-amber-200" : "border-slate-200";
        const bgColor = item.status === "critical" ? "bg-red-50" : item.status === "warning" ? "bg-amber-50" : "bg-white";

        return (
          <div key={item.label} className={`rounded-lg border ${borderColor} ${bgColor} p-2.5 shadow-sm`}>
            <div className="flex items-center justify-between">
              <Icon className={`h-3 w-3 ${statusColor}`} />
              <span className={`h-1.5 w-1.5 rounded-full ${item.status === "critical" ? "animate-pulse bg-red-500" : item.status === "warning" ? "bg-amber-500" : "bg-emerald-500"}`} />
            </div>
            <div className="mt-2">
              <span className={`font-mono text-lg font-black tabular-nums ${statusColor}`}>
                {typeof item.value === "number" ? item.value.toFixed(item.value >= 100 ? 0 : 1) : item.value}
              </span>
              <span className="ml-1 text-[8px] text-slate-400">{item.unit}</span>
            </div>
            <div className="mt-1 text-[8px] font-bold uppercase tracking-wider text-slate-500">{item.label}</div>
            <MiniSparkline values={item.trend} status={item.status} />
          </div>
        );
      })}
    </div>
  );
}

// ─── MINI SPARKLINE ───────────────────────────────────────────────────────────
function MiniSparkline({ values, status }: { values: number[]; status: "normal" | "warning" | "critical" }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const h = 16;
  const w = 60;
  const points = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  const color = status === "critical" ? "#DC2626" : status === "warning" ? "#D97706" : "#0D9488";

  return (
    <svg width={w} height={h} className="mt-1.5" viewBox={`0 0 ${w} ${h}`}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
    </svg>
  );
}

// ─── LIVE PLANT STATE BARS ───────────────────────────────────────────────────
export function PlantStateBars({ items }: { items: { label: string; value: number }[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[9px] font-black uppercase tracking-[.16em] text-slate-500">Barrier integrity</span>
        <span className="text-[8px] font-mono text-slate-400">real-time</span>
      </div>
      <div className="space-y-2.5">
        {items.map(item => {
          const color = item.value >= 75 ? "#0D9488" : item.value >= 50 ? "#D97706" : "#DC2626";
          return (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-600">{item.label}</span>
                <span className="font-mono text-[10px] font-black" style={{ color }}>{item.value}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${item.value}%`, background: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SCADA HEADER BAR ─────────────────────────────────────────────────────────
export function ScadaHeader({
  facilityName,
  incidentLabel,
  clockDisplay,
  stepIndex,
  totalSteps,
  commandScore,
  countdown,
  countdownMax,
  onBack,
}: {
  facilityName: string;
  incidentLabel: string;
  clockDisplay: string;
  stepIndex: number;
  totalSteps: number;
  commandScore: number;
  countdown?: number;
  countdownMax?: number;
  onBack: () => void;
}) {
  return (
    <header className="mb-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-red-300 hover:text-red-600">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900">{facilityName}</span>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-red-600">
                  INCIDENT ACTIVE
                </span>
              </div>
              <span className="text-[10px] text-slate-500">{incidentLabel}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5 text-[10px]">
          {countdown !== undefined && countdownMax !== undefined && (
            <div className="text-center">
              <div className="text-[8px] font-bold uppercase tracking-wider text-slate-400">DEADLINE</div>
              <div className={`mt-0.5 font-mono text-base font-black tabular-nums ${countdown <= 15 ? "text-red-600" : countdown <= 30 ? "text-amber-600" : "text-slate-900"}`}>
                {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}
              </div>
              <div className="mt-0.5 h-1 w-16 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full transition-all duration-1000 ${countdown <= 15 ? "bg-red-500" : countdown <= 30 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${(countdown / countdownMax) * 100}%` }} />
              </div>
            </div>
          )}
          <div className="text-center">
            <div className="text-[8px] font-bold uppercase tracking-wider text-slate-400">ELAPSED</div>
            <div className="mt-0.5 font-mono text-base font-black tabular-nums text-slate-900">{clockDisplay}</div>
          </div>
          <div className="text-center">
            <div className="text-[8px] font-bold uppercase tracking-wider text-slate-400">STEP</div>
            <div className="mt-0.5 font-mono text-base font-black tabular-nums text-slate-900">{stepIndex + 1}/{totalSteps}</div>
          </div>
          <div className="text-center">
            <div className="text-[8px] font-bold uppercase tracking-wider text-slate-400">SCORE</div>
            <div className="mt-0.5 flex items-center gap-2">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${commandScore}%` }} />
              </div>
              <span className="font-mono text-sm font-black text-blue-600">{commandScore}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
