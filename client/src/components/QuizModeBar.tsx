/**
 * QuizModeBar — Quick 10 and Missed Quiz mode selector
 * Sits above the QuizShell header actions on all quiz pages.
 * Handles attempt logging silently in the background.
 */
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export type QuizMode = "standard" | "quick10" | "missed";

interface QuizModeBarProps {
  examType: string;          // e.g. "oit" | "wpi-class1-water" | "wpi-class1-dist"
  currentMode: QuizMode;
  onModeChange: (mode: QuizMode) => void;
  missedCount?: number;      // how many missed questions are available
}

export default function QuizModeBar({ examType, currentMode, onModeChange, missedCount }: QuizModeBarProps) {
  const { isAuthenticated } = useAuth();

  const styles = {
    bar: {
      display: "flex",
      gap: 8,
      padding: "10px 16px 0",
      flexWrap: "wrap" as const,
    },
    btn: (active: boolean, color: string): React.CSSProperties => ({
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "7px 14px",
      borderRadius: 20,
      border: active ? `2px solid ${color}` : "1.5px solid #E2E8F0",
      background: active ? color : "#fff",
      color: active ? "#fff" : "#475569",
      fontWeight: active ? 700 : 500,
      fontSize: 13,
      cursor: "pointer",
      fontFamily: "'Sora', sans-serif",
      transition: "all 0.15s ease",
      whiteSpace: "nowrap" as const,
    }),
    badge: (active: boolean): React.CSSProperties => ({
      background: active ? "rgba(255,255,255,0.3)" : "#E2E8F0",
      color: active ? "#fff" : "#64748B",
      borderRadius: 10,
      padding: "1px 7px",
      fontSize: 11,
      fontWeight: 700,
    }),
  };

  return (
    <div style={styles.bar}>
      {/* Standard mode */}
      <button
        style={styles.btn(currentMode === "standard", "#1D4ED8")}
        onClick={() => onModeChange("standard")}
        title="Full question bank — random questions from all modules"
      >
        📚 Standard
      </button>

      {/* Quick 10 */}
      <button
        style={styles.btn(currentMode === "quick10", "#0F766E")}
        onClick={() => onModeChange("quick10")}
        title="10 questions — perfect for a quick study session on your lunch break"
      >
        ⚡ Quick 10
        <span style={styles.badge(currentMode === "quick10")}>10 Qs</span>
      </button>

      {/* Missed Quiz — only shown to authenticated users */}
      {isAuthenticated && (
        <button
          style={styles.btn(currentMode === "missed", "#DC2626")}
          onClick={() => onModeChange("missed")}
          title="Retry every question you've gotten wrong — the fastest way to improve"
          disabled={missedCount === 0}
        >
          🔁 Retry Mistakes
          {missedCount !== undefined && (
            <span style={styles.badge(currentMode === "missed")}>
              {missedCount > 0 ? `${missedCount}` : "0"}
            </span>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Attempt Logger ───────────────────────────────────────────────────────────
/**
 * useAttemptLogger — returns a fire-and-forget logAttempt function.
 * Call it inside handleConfirm / handleNext on every answered question.
 * Silent failure — never blocks the quiz experience.
 */
export function useAttemptLogger(examType: string, quizMode: QuizMode = "standard") {
  const logAttempt = trpc.quiz.logAttempt.useMutation();

  return function log(params: {
    topic: string;
    questionId: number;
    correct: boolean;
    difficulty?: string;
  }) {
    // Fire and forget — don't await, don't show errors to user
    logAttempt.mutate({
      examType,
      topic: params.topic,
      questionId: params.questionId,
      correct: params.correct,
      difficulty: params.difficulty,
      quizMode,
    });
  };
}
