// ECHELON AI TUTOR — ConfidenceInsight Component
// Design: Overconfidence / underconfidence alert callout

interface Props {
  confidence: number | null;
  correct: boolean;
}

export default function ConfidenceInsight({ confidence, correct }: Props) {
  if (!confidence) return null;

  const isOverconfident = confidence >= 4 && !correct;
  const isUnderconfident = confidence <= 2 && correct;

  if (!isOverconfident && !isUnderconfident) return null;

  return (
    <div
      style={{
        background: isOverconfident ? "#FEF2F2" : "#F0FDF4",
        borderRadius: 8,
        padding: "10px 12px",
        marginTop: 8,
        borderLeft: `3px solid ${isOverconfident ? "#DC2626" : "#059669"}`,
        animation: "fadeUp 0.3s ease both",
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: isOverconfident ? "#DC2626" : "#059669",
        }}
      >
        {isOverconfident ? "⚠️ Overconfidence Alert  " : "💪 Underconfidence Alert  "}
      </span>
      <span style={{ fontSize: 11, color: "#374151", lineHeight: 1.6 }}>
        {isOverconfident
          ? "You were highly confident but got this wrong — this topic needs more focused study."
          : "You were unsure but got it right! Your instincts on this topic are better than you think."}
      </span>
    </div>
  );
}
