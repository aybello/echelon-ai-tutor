// ECHELON AI TUTOR — ReadinessScore Component
// Design: Circular score ring with label and dot history strip

import { HistoryEntry } from "@/lib/questionTypes";

interface Props {
  history: HistoryEntry[];
}

export default function ReadinessScore({ history }: Props) {
  if (history.length === 0) return null;

  const correct = history.filter((h) => h.correct).length;
  const wrong = history.filter((h) => !h.correct).length;
  const score = Math.round((correct / history.length) * 100);

  const color =
    score >= 75 ? "#059669" : score >= 60 ? "#D97706" : "#DC2626";
  const label =
    score >= 75 ? "Exam Ready" : score >= 60 ? "Getting There" : "Needs Work";

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: "14px 18px",
        border: "1px solid #E5E7EB",
        display: "flex",
        alignItems: "center",
        gap: 14,
        marginBottom: 16,
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* Score ring */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          border: `3px solid ${color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: `${color}10`,
        }}
      >
        <span
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 13,
            fontWeight: 800,
            color,
          }}
        >
          {score}%
        </span>
      </div>

      {/* Labels */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>
          Session Readiness:{" "}
          <span style={{ color }}>{label}</span>
        </div>
        <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>
          {correct} correct · {wrong} wrong · {history.length} attempted
        </div>
      </div>

      {/* Dot history strip */}
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {history.slice(-8).map((h, i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: h.correct ? "#059669" : "#DC2626",
              transition: "all 0.2s",
            }}
          />
        ))}
      </div>
    </div>
  );
}
