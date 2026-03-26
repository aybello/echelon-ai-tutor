// ECHELON AI TUTOR — ConfidenceMeter Component
// Design: 5-level confidence selector with emoji + label tiles

interface ConfidenceLevel {
  v: number;
  label: string;
  emoji: string;
  color: string;
  bg: string;
  border: string;
}

const LEVELS: ConfidenceLevel[] = [
  { v: 1, label: "Guessing",    emoji: "🤔", color: "#DC2626", bg: "#FEF2F2", border: "#FCA5A5" },
  { v: 2, label: "Unsure",      emoji: "😕", color: "#D97706", bg: "#FFFBEB", border: "#FCD34D" },
  { v: 3, label: "Fairly sure", emoji: "🙂", color: "#2563EB", bg: "#EFF6FF", border: "#93C5FD" },
  { v: 4, label: "Confident",   emoji: "😊", color: "#059669", bg: "#F0FDF4", border: "#6EE7B7" },
  { v: 5, label: "Certain",     emoji: "💪", color: "#7C3AED", bg: "#FAF5FF", border: "#C4B5FD" },
];

interface Props {
  value: number | null;
  onChange: (v: number) => void;
  disabled?: boolean;
}

export default function ConfidenceMeter({ value, onChange, disabled }: Props) {
  return (
    <div>
      <div className="text-[10px] font-bold tracking-widest mb-2" style={{ color: "#94A3B8" }}>
        HOW CONFIDENT ARE YOU? (select before answering)
      </div>
      <div className="flex gap-2">
        {LEVELS.map((l) => {
          const isSelected = value === l.v;
          return (
            <button
              key={l.v}
              onClick={() => !disabled && onChange(l.v)}
              disabled={disabled}
              style={{
                flex: 1,
                padding: "8px 4px",
                borderRadius: 10,
                border: `2px solid ${isSelected ? l.color : "#E5E7EB"}`,
                background: isSelected ? l.bg : "#F8FAFC",
                color: isSelected ? l.color : "#94A3B8",
                fontSize: 10,
                fontWeight: 700,
                cursor: disabled ? "default" : "pointer",
                transition: "all 0.15s ease",
                textAlign: "center",
                fontFamily: "inherit",
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 3 }}>{l.emoji}</div>
              {l.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
