/**
 * PumpCurveChart.tsx
 * Design: Professional SaaS — Clean Dark-Accent
 * Interactive pump performance curves using Recharts:
 * - H-Q curve (Head vs Flow) for single pump
 * - System curve (parabolic resistance)
 * - Operating point intersection (draggable via flow slider)
 * - Efficiency curve overlay
 * - NPSH required vs available (cavitation mode)
 * - Series mode: doubles head at same flow
 * - Parallel mode: doubles flow at same head
 */

import {
  CartesianGrid,
  ComposedChart,
  Label,
  Legend,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo } from "react";

export type PumpMode = "single" | "series" | "parallel";

interface Props {
  mode: PumpMode;
  cavitationMode: boolean;
  systemStaticHead: number; // metres
}

// Single pump H-Q curve: H = H0 - k*Q^2  (H0=45m, k=0.004)
const H0 = 45;
const K = 0.004;
const pumpHead = (q: number) => Math.max(0, H0 - K * q * q);

// Efficiency curve: peaks at Q=70 L/s
const pumpEff = (q: number) => {
  const peak = 82;
  const qBep = 70;
  return Math.max(0, peak - 0.012 * Math.pow(q - qBep, 2));
};

// NPSH required: rises steeply at high flow
const npshRequired = (q: number) => 1.5 + 0.0008 * q * q;

// NPSH available (fixed installation): 6m
const NPSH_AVAIL = 6;

// System curve: H_sys = H_static + R*Q^2
const systemHead = (q: number, staticHead: number) =>
  staticHead + 0.002 * q * q;

// Find operating point (intersection of pump curve and system curve)
function findOperatingPoint(
  mode: PumpMode,
  staticHead: number
): { q: number; h: number } {
  // Bisection method
  let lo = 0, hi = 150;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const ph = modifiedHead(mode, mid);
    const sh = systemHead(mid, staticHead);
    if (ph > sh) lo = mid;
    else hi = mid;
  }
  const q = (lo + hi) / 2;
  return { q, h: systemHead(q, staticHead) };
}

function modifiedHead(mode: PumpMode, q: number): number {
  if (mode === "series") return pumpHead(q) * 2;
  if (mode === "parallel") return pumpHead(q / 2);
  return pumpHead(q);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-slate-300 text-xs mb-2 font-semibold">Flow: {Number(label).toFixed(1)} L/s</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="text-white font-medium">
            {p.dataKey === "efficiency" ? `${Number(p.value).toFixed(1)}%` : `${Number(p.value).toFixed(1)} m`}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function PumpCurveChart({ mode, cavitationMode, systemStaticHead }: Props) {
  const data = useMemo(() => {
    const points = [];
    for (let q = 0; q <= 140; q += 2) {
      const entry: Record<string, number> = {
        flow: q,
        pumpHead: modifiedHead(mode, q),
        systemHead: systemHead(q, systemStaticHead),
        efficiency: pumpEff(q),
        npshRequired: npshRequired(q),
        npshAvailable: NPSH_AVAIL,
      };
      points.push(entry);
    }
    return points;
  }, [mode, systemStaticHead]);

  const op = useMemo(() => findOperatingPoint(mode, systemStaticHead), [mode, systemStaticHead]);
  const opEff = pumpEff(mode === "parallel" ? op.q / 2 : op.q);
  const opNpshR = npshRequired(mode === "parallel" ? op.q / 2 : op.q);
  const cavitationRisk = cavitationMode && opNpshR > NPSH_AVAIL;

  const modeLabel = mode === "series" ? "2 Pumps in Series" : mode === "parallel" ? "2 Pumps in Parallel" : "Single Pump";
  const modeColor = mode === "series" ? "#F59E0B" : mode === "parallel" ? "#10B981" : "#3B82F6";

  return (
    <div className="space-y-4">
      {/* Mode badge */}
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="px-3 py-1 rounded-full text-xs font-bold border"
          style={{ color: modeColor, borderColor: modeColor, backgroundColor: `${modeColor}15` }}
        >
          {modeLabel}
        </span>
        <span className="text-slate-400 text-xs">
          Operating Point: <span className="text-white font-semibold">{op.q.toFixed(1)} L/s</span> @ <span className="text-white font-semibold">{op.h.toFixed(1)} m</span>
        </span>
        <span className="text-slate-400 text-xs">
          Efficiency: <span className={`font-semibold ${opEff > 75 ? "text-emerald-400" : opEff > 60 ? "text-yellow-400" : "text-red-400"}`}>{opEff.toFixed(1)}%</span>
        </span>
        {cavitationMode && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cavitationRisk ? "bg-red-900/50 text-red-300 border border-red-700" : "bg-emerald-900/50 text-emerald-300 border border-emerald-700"}`}>
            {cavitationRisk ? `⚠ Cavitation Risk — NPSHr (${opNpshR.toFixed(1)}m) > NPSHa (${NPSH_AVAIL}m)` : `✓ No Cavitation — NPSHr (${opNpshR.toFixed(1)}m) < NPSHa (${NPSH_AVAIL}m)`}
          </span>
        )}
      </div>

      {/* Main H-Q Chart */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-700">
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-3">Head-Flow (H-Q) Curve</p>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data} margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis dataKey="flow" stroke="#E2E8F0" tick={{ fill: "#E2E8F0", fontSize: 11 }}>
              <Label value="Flow Rate (L/s)" offset={-10} position="insideBottom" fill="#E2E8F0" fontSize={11} />
            </XAxis>
            <YAxis stroke="#E2E8F0" tick={{ fill: "#E2E8F0", fontSize: 11 }} domain={[0, 100]}>
              <Label value="Head (m)" angle={-90} position="insideLeft" fill="#E2E8F0" fontSize={11} />
            </YAxis>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "#64748B", paddingTop: 8 }}
              formatter={(value) => <span style={{ color: "#64748B" }}>{value}</span>}
            />

            {/* Pump H-Q curve */}
            <Line
              type="monotone"
              dataKey="pumpHead"
              name="Pump Curve"
              stroke={modeColor}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: modeColor }}
            />

            {/* System curve */}
            <Line
              type="monotone"
              dataKey="systemHead"
              name="System Curve"
              stroke="#F97316"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              activeDot={{ r: 4, fill: "#F97316" }}
            />

            {/* Operating point */}
            <ReferenceDot
              x={Math.round(op.q / 2) * 2}
              y={op.h}
              r={7}
              fill={cavitationRisk ? "#EF4444" : "#FFFFFF"}
              stroke={cavitationRisk ? "#FCA5A5" : modeColor}
              strokeWidth={2}
              label={{ value: "OP", position: "top", fill: "#FFFFFF", fontSize: 10 }}
            />

            {/* BEP reference line */}
            <ReferenceLine x={70} stroke="#6366F1" strokeDasharray="4 3" strokeWidth={1}>
              <Label value="BEP" position="top" fill="#818CF8" fontSize={10} />
            </ReferenceLine>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Efficiency Chart */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-700">
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-3">Pump Efficiency Curve</p>
        <ResponsiveContainer width="100%" height={160}>
          <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 25, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis dataKey="flow" stroke="#E2E8F0" tick={{ fill: "#E2E8F0", fontSize: 10 }}>
              <Label value="Flow Rate (L/s)" offset={-10} position="insideBottom" fill="#E2E8F0" fontSize={10} />
            </XAxis>
            <YAxis stroke="#E2E8F0" tick={{ fill: "#E2E8F0", fontSize: 10 }} domain={[0, 100]}>
              <Label value="Efficiency (%)" angle={-90} position="insideLeft" fill="#E2E8F0" fontSize={10} />
            </YAxis>
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="efficiency"
              name="Efficiency"
              stroke="#A78BFA"
              strokeWidth={2.5}
              dot={false}
            />
            <ReferenceDot
              x={Math.round(op.q / 2) * 2}
              y={opEff}
              r={6}
              fill={opEff > 75 ? "#10B981" : opEff > 60 ? "#F59E0B" : "#EF4444"}
              stroke="#FFFFFF"
              strokeWidth={1.5}
            />
            <ReferenceLine y={75} stroke="#10B981" strokeDasharray="4 3" strokeWidth={1}>
              <Label value="75% target" position="right" fill="#6EE7B7" fontSize={9} />
            </ReferenceLine>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* NPSH Chart (cavitation mode only) */}
      {cavitationMode && (
        <div className={`bg-slate-900 rounded-2xl p-4 border ${cavitationRisk ? "border-red-700" : "border-slate-700"}`}>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-3">
            NPSH Analysis {cavitationRisk && <span className="text-red-400 ml-2">⚠ Cavitation Zone Active</span>}
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 25, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="flow" stroke="#E2E8F0" tick={{ fill: "#E2E8F0", fontSize: 10 }}>
                <Label value="Flow Rate (L/s)" offset={-10} position="insideBottom" fill="#E2E8F0" fontSize={10} />
              </XAxis>
              <YAxis stroke="#E2E8F0" tick={{ fill: "#E2E8F0", fontSize: 10 }} domain={[0, 12]}>
                <Label value="NPSH (m)" angle={-90} position="insideLeft" fill="#E2E8F0" fontSize={10} />
              </YAxis>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10, color: "#64748B", paddingTop: 4 }} />
              <Line type="monotone" dataKey="npshRequired" name="NPSHr (Required)" stroke="#F87171" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="npshAvailable" name="NPSHa (Available)" stroke="#34D399" strokeWidth={2} strokeDasharray="5 3" dot={false} />
              <ReferenceDot
                x={Math.round(op.q / 2) * 2}
                y={opNpshR}
                r={5}
                fill={cavitationRisk ? "#EF4444" : "#10B981"}
                stroke="#FFFFFF"
                strokeWidth={1.5}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
