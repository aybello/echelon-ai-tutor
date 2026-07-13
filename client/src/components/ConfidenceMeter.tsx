// ECHELON AI TUTOR — ConfidenceMeter Component
// Redesigned: minimal 2-option inline toggle so it doesn't distract from the quiz.
// "Sure" maps to value 4, "Not Sure" maps to value 1 — preserving compatibility
// with the existing HistoryEntry confidence field and pattern detection logic.

interface Props {
  value: number | null;
  onChange: (v: number) => void;
  disabled?: boolean;
}

export default function ConfidenceMeter({ value, onChange, disabled }: Props) {
  const sure    = value !== null && value >= 3;
  const notSure = value !== null && value < 3;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{
        fontSize: 10,
        fontWeight: 700,
        color: "#94A3B8",
        letterSpacing: "0.08em",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}>
        CONFIDENCE:
      </span>

      <div style={{ display: "flex", gap: 6 }}>
        {/* Not Sure */}
        <button
          onClick={() => !disabled && onChange(1)}
          disabled={disabled}
          style={{
            padding: "4px 12px",
            borderRadius: 20,
            border: `1.5px solid ${notSure ? "#D97706" : "#E5E7EB"}`,
            background: notSure ? "#FFFBEB" : "transparent",
            color: notSure ? "#D97706" : "#94A3B8",
            fontSize: 11,
            fontWeight: 700,
            cursor: disabled ? "default" : "pointer",
            fontFamily: "inherit",
            transition: "all 0.15s ease",
            lineHeight: 1,
          }}
        >
          🤔 Not Sure
        </button>

        {/* Sure */}
        <button
          onClick={() => !disabled && onChange(4)}
          disabled={disabled}
          style={{
            padding: "4px 12px",
            borderRadius: 20,
            border: `1.5px solid ${sure ? "#059669" : "#E5E7EB"}`,
            background: sure ? "#F0FDF4" : "transparent",
            color: sure ? "#059669" : "#94A3B8",
            fontSize: 11,
            fontWeight: 700,
            cursor: disabled ? "default" : "pointer",
            fontFamily: "inherit",
            transition: "all 0.15s ease",
            lineHeight: 1,
          }}
        >
          ✓ Sure
        </button>
      </div>
    </div>
  );
}
