/**
 * QuizModeBar — Quiz mode selector rendered inside the QuizShell header.
 * Inspired by PocketPrep: icon cards in a horizontal row, not a floating pill bar.
 * Pass the return value of <QuizModeBar ... /> into QuizShell's `headerExtra` prop.
 */
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export type QuizMode = "standard" | "quick10" | "missed";

interface QuizModeBarProps {
  examType: string;          // e.g. "oit" | "wpi-class1-water"
  currentMode: QuizMode;
  onModeChange: (mode: QuizMode) => void;
  missedCount?: number;
  /** If provided, a "Quiz Settings ⚙️" button is shown to the right of the mode cards */
  onSettingsOpen?: () => void;
}

interface ModeCard {
  id: QuizMode;
  icon: string;
  label: string;
  description: string;
  badge?: string;
  color: string;
  disabled?: boolean;
}

export default function QuizModeBar({
  examType: _examType,
  currentMode,
  onModeChange,
  missedCount,
  onSettingsOpen,
}: QuizModeBarProps) {
  const { isAuthenticated } = useAuth();

  const cards: ModeCard[] = [
    {
      id: "standard",
      icon: "📚",
      label: "Standard",
      description: "Full question bank, randomised",
      color: "#1D4ED8",
    },
    {
      id: "quick10",
      icon: "⚡",
      label: "Quick 10",
      description: "10 questions, fast session",
      badge: "10 Qs",
      color: "#0F766E",
    },
    ...(isAuthenticated
      ? [{
          id: "missed" as QuizMode,
          icon: "🔁",
          label: "Retry Mistakes",
          description: missedCount ? `${missedCount} question${missedCount !== 1 ? "s" : ""} to retry` : "No mistakes yet",
          badge: missedCount ? `${missedCount}` : undefined,
          color: "#DC2626",
          disabled: !missedCount,
        }]
      : []),
  ];

  return (
    <div className="qs-mode-bar-wrap" style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      flexWrap: "wrap" as const,
    }}>
      {/* Mode cards */}
      {cards.map(card => {
        const active = currentMode === card.id;
        return (
          <button
            key={card.id}
            onClick={() => !card.disabled && onModeChange(card.id)}
            disabled={card.disabled}
            title={card.description}
            className="qs-mode-card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              borderRadius: 12,
              border: active
                ? `2px solid rgba(255,255,255,0.9)`
                : "1.5px solid rgba(255,255,255,0.25)",
              background: active
                ? "rgba(255,255,255,0.22)"
                : "rgba(255,255,255,0.08)",
              color: "#fff",
              cursor: card.disabled ? "not-allowed" : "pointer",
              opacity: card.disabled ? 0.45 : 1,
              fontFamily: "'Sora', sans-serif",
              transition: "all 0.15s ease",
              textAlign: "left" as const,
              minWidth: 130,
              flex: "0 0 auto",
            }}
          >
            {/* Icon circle */}
            <div className="qs-mode-card-icon" style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: active ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              flexShrink: 0,
            }}>
              {card.icon}
            </div>

            {/* Text */}
            <div>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}>
                <span className="qs-mode-card-label" style={{ fontSize: 13, fontWeight: active ? 800 : 600, lineHeight: 1.2 }}>
                  {card.label}
                </span>
                {card.badge && (
                  <span style={{
                    background: active ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)",
                    borderRadius: 8,
                    padding: "1px 6px",
                    fontSize: 10,
                    fontWeight: 700,
                    lineHeight: 1.6,
                  }}>
                    {card.badge}
                  </span>
                )}
              </div>
              <div className="qs-mode-card-desc" style={{ fontSize: 11, opacity: 0.75, marginTop: 1, lineHeight: 1.3 }}>
                {card.description}
              </div>
            </div>
          </button>
        );
      })}

      {/* Quiz Settings button */}
      {onSettingsOpen && (
        <button
          onClick={onSettingsOpen}
          title="Quiz Settings"
          className="qs-mode-settings-btn"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "10px 14px",
            borderRadius: 12,
            border: "1.5px solid rgba(255,255,255,0.30)",
            background: "rgba(255,255,255,0.10)",
            color: "rgba(255,255,255,0.85)",
            cursor: "pointer",
            fontFamily: "'Sora', sans-serif",
            fontSize: 12,
            fontWeight: 700,
            transition: "all 0.15s ease",
            flex: "0 0 auto",
            letterSpacing: "0.02em",
          }}
        >
          <span style={{ fontSize: 15 }}>⚙️</span>
          <span>Quiz Settings</span>
        </button>
      )}
    </div>
  );
}

// ─── Attempt Logger ───────────────────────────────────────────────────────────
export function useAttemptLogger(examType: string, quizMode: QuizMode = "standard") {
  const logAttempt = trpc.quiz.logAttempt.useMutation();

  return function log(params: {
    topic: string;
    questionId: number;
    correct: boolean;
    difficulty?: string;
  }) {
    logAttempt.mutate({
      examType,
      topic: params.topic,
      questionId: params.questionId,
      correct: params.correct,
      difficulty: params.difficulty ?? undefined,
      quizMode,
    });
  };
}
