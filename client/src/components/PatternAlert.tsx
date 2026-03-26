// ECHELON AI TUTOR — PatternAlert Component
// Design: Amber warning card with "Ask Tutor" CTA

import { PatternInsight } from "@/lib/questions";

interface Props {
  patterns: PatternInsight[];
  onAskTutor: () => void;
}

export default function PatternAlert({ patterns, onAskTutor }: Props) {
  const worst = patterns[0];

  return (
    <div
      style={{
        background: "#FEF3C7",
        borderRadius: 14,
        padding: "16px 18px",
        border: "2px solid #FCD34D",
        marginBottom: 16,
        animation: "popIn 0.25s ease both",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#92400E", marginBottom: 4 }}>
            🧠 Pattern Detected — {worst.pct}% wrong in {worst.module}
          </div>
          <div style={{ fontSize: 11, color: "#78350F", lineHeight: 1.6 }}>
            You've missed {worst.wrongCount} of {worst.total} {worst.module} questions.
            This suggests a deeper misunderstanding — not just bad luck.
            Let your AI Tutor diagnose the root cause.
          </div>
        </div>
        <button
          onClick={onAskTutor}
          style={{
            marginLeft: 12,
            padding: "8px 14px",
            borderRadius: 10,
            border: "none",
            background: "#D97706",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
            fontFamily: "inherit",
          }}
        >
          Ask Tutor →
        </button>
      </div>
    </div>
  );
}
