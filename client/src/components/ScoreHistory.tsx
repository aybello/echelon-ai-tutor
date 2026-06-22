/**
 * ScoreHistory — displays the last 5 mock exam attempts for a given session/stream.
 * Used on the results screen of Class1MockExam and WQAMockExam.
 */
import { trpc } from "@/lib/trpc";

interface ScoreHistoryProps {
  sessionId: string;
  examType: "class1" | "wqa" | "oit" | "oit-ww" | "class1-water" | "class1-ww" | "class2-water" | "class2-ww" | "class3-water" | "class3-ww" | "class4-water" | "class4-ww" | "wpi-class1-water" | "wpi-class2-water" | "wpi-class3-water" | "wpi-class4-water" | "wpi-class1-wastewater" | "wpi-class2-wastewater" | "wpi-class3-wastewater" | "wpi-class4-wastewater" | "wpi-class1-water-dist" | "wpi-class2-water-dist" | "wpi-class3-water-dist" | "wpi-class4-water-dist" | "wpi-class1-water-coll" | "wpi-class2-water-coll" | "wpi-class3-water-coll" | "wpi-class4-water-coll" | "class1-water-dist" | "class2-water-dist" | "class3-water-dist" | "class4-water-dist" | "class1-wastewater-coll" | "class2-wastewater-coll" | "class3-wastewater-coll" | "class4-wastewater-coll";
  stream?: "water" | "wastewater";
  /** The current attempt's score (0–1) — excluded from the history list since it's already shown in the hero */
  currentResultId?: number;
  /** If true, only shows Math Practice (calc-only) sessions */
  calcOnly?: boolean;
}

function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export default function ScoreHistory({ sessionId, examType, stream, calcOnly }: ScoreHistoryProps) {
  const { data: history, isLoading } = trpc.exam.getHistory.useQuery(
    { sessionId, examType, stream, calcOnly },
    { enabled: !!sessionId }
  );

  if (isLoading) {
    return (
      <div style={{ background: "#fff", borderRadius: 20, padding: "24px", marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>📈 Your Score History</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ flex: 1, height: 60, background: "#F1F5F9", borderRadius: 12, animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return null; // Don't show the panel if there's no history yet
  }

  // Reverse so oldest is on the left (trend left→right)
  const sorted = [...history].reverse();

  // Trend arrow: compare most recent to second most recent
  const latest = history[0];
  const prev = history[1];
  let trendIcon = "";
  let trendColor = "#64748B";
  if (prev) {
    const latestPct = latest.score / latest.total;
    const prevPct = prev.score / prev.total;
    if (latestPct > prevPct + 0.02) { trendIcon = "↑"; trendColor = "#059669"; }
    else if (latestPct < prevPct - 0.02) { trendIcon = "↓"; trendColor = "#DC2626"; }
    else { trendIcon = "→"; trendColor = "#D97706"; }
  }

  return (
    <div style={{ background: "#fff", borderRadius: 20, padding: "24px", marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>📈 Your Score History</div>
          {calcOnly && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "#7C3AED", background: "#F5F3FF", padding: "2px 8px", borderRadius: 6, border: "1px solid #DDD6FE" }}>🧮 Math Practice</span>
          )}
        </div>
        {trendIcon && (
          <div style={{ fontSize: 13, fontWeight: 700, color: trendColor }}>
            {trendIcon} {trendIcon === "↑" ? "Improving" : trendIcon === "↓" ? "Declining" : "Steady"}
          </div>
        )}
      </div>

      {/* Mini bar chart */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 56, marginBottom: 16 }}>
        {sorted.map((r, i) => {
          const pct = r.score / r.total;
          const isLatest = i === sorted.length - 1;
          const barColor = r.passed === "yes" ? "#059669" : "#DC2626";
          const barHeight = Math.max(8, Math.round(pct * 56));
          return (
            <div
              key={r.id}
              title={`${Math.round(pct * 100)}% — ${formatDate(r.createdAt)}`}
              style={{
                flex: 1,
                height: barHeight,
                background: barColor,
                borderRadius: "4px 4px 0 0",
                opacity: isLatest ? 1 : 0.55,
                border: isLatest ? `2px solid ${barColor}` : "none",
                cursor: "default",
                transition: "height 0.4s ease",
              }}
            />
          );
        })}
        {/* Fill empty slots so bars are consistent width */}
        {Array.from({ length: Math.max(0, 5 - sorted.length) }).map((_, i) => (
          <div key={`empty-${i}`} style={{ flex: 1, height: 4, background: "#F1F5F9", borderRadius: "4px 4px 0 0" }} />
        ))}
      </div>

      {/* 70% pass line label */}
      <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 12, textAlign: "right" }}>
        Pass mark: 70% &nbsp;|&nbsp; Last {history.length} attempt{history.length !== 1 ? "s" : ""}
      </div>

      {/* Attempt rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {history.map((r, i) => {
          const pct = r.score / r.total;
          const passed = r.passed === "yes";
          const isLatest = i === 0;
          return (
            <div
              key={r.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 12,
                background: isLatest ? (passed ? "#F0FDF4" : "#FEF2F2") : "#F8FAFC",
                border: isLatest ? `1px solid ${passed ? "#BBF7D0" : "#FECACA"}` : "1px solid #F1F5F9",
              }}
            >
              {/* Pass/fail badge */}
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: passed ? "#059669" : "#DC2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                flexShrink: 0,
              }}>
                {passed ? "✓" : "✗"}
              </div>

              {/* Score + date */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: passed ? "#059669" : "#DC2626" }}>
                    {Math.round(pct * 100)}%
                  </span>
                  <span style={{ fontSize: 11, color: "#64748B" }}>
                    {r.score}/{r.total} correct
                  </span>
                  {isLatest && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#7C3AED", background: "#F5F3FF", padding: "2px 6px", borderRadius: 6 }}>
                      Latest
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                  {formatDate(r.createdAt)} &nbsp;·&nbsp; {formatTime(r.timeTakenSeconds)}
                  {r.stream && <span> &nbsp;·&nbsp; {r.stream.charAt(0).toUpperCase() + r.stream.slice(1)}</span>}
                  {r.calcOnly === "yes" && <span style={{ color: "#7C3AED", fontWeight: 600 }}> &nbsp;·&nbsp; 🧮 Math</span>}
                </div>
              </div>

              {/* Score bar */}
              <div style={{ width: 60, flexShrink: 0 }}>
                <div style={{ height: 6, background: "#E2E8F0", borderRadius: 100 }}>
                  <div style={{
                    height: "100%",
                    width: `${pct * 100}%`,
                    background: passed ? "#059669" : "#DC2626",
                    borderRadius: 100,
                  }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
