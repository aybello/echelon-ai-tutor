/**
 * QuestionOfTheDay — Daily habit loop widget
 * Shows a single question per day (rotates at midnight).
 * Biased toward the user's weak topics if logged in.
 * Can be embedded on the Landing page, Dashboard, or any page.
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { QUESTIONS } from "@/lib/questions";

export default function QuestionOfTheDay() {
  const { isAuthenticated } = useAuth();
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const { data: qotdData, isLoading } = trpc.quiz.getQotd.useQuery(
    { examType: "oit", totalQuestions: QUESTIONS.length },
    { refetchOnWindowFocus: false, staleTime: 1000 * 60 * 60 }
  );

  const completeQotd = trpc.quiz.completeQotd.useMutation();

  // Resolve question from local bank using server-provided index
  const question = useMemo(() => {
    if (!qotdData) return null;
    return QUESTIONS[qotdData.questionIndex] ?? QUESTIONS[0];
  }, [qotdData]);

  const handleConfirm = () => {
    if (selected === null || !question || !qotdData) return;
    setConfirmed(true);
    if (isAuthenticated) {
      completeQotd.mutate({
        questionId: question.id,
        examType: "oit",
        dateKey: qotdData.dateKey,
        correct: selected === question.correct,
      });
    }
  };

  if (isLoading) {
    return (
      <div style={{
        background: "linear-gradient(135deg, #1E3A5F 0%, #0F766E 100%)",
        borderRadius: 20,
        padding: "28px 24px",
        color: "#fff",
        fontFamily: "'Sora', sans-serif",
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.7, marginBottom: 8 }}>⚡ QUESTION OF THE DAY</div>
        <div style={{ height: 16, background: "rgba(255,255,255,0.15)", borderRadius: 8, marginBottom: 12 }} />
        <div style={{ height: 12, background: "rgba(255,255,255,0.1)", borderRadius: 8, width: "70%" }} />
      </div>
    );
  }

  if (!question || !qotdData) return null;

  const isCorrect = selected === question.correct;

  return (
    <div style={{
      background: "linear-gradient(135deg, #1E3A5F 0%, #0F766E 100%)",
      borderRadius: 20,
      padding: "28px 24px",
      color: "#fff",
      fontFamily: "'Sora', sans-serif",
      boxShadow: "0 8px 32px rgba(15, 118, 110, 0.25)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", opacity: 0.7 }}>
              QUESTION OF THE DAY
            </div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>
              {new Date().toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })}
            </div>
          </div>
        </div>
        <div style={{
          background: "rgba(255,255,255,0.15)",
          borderRadius: 20,
          padding: "4px 12px",
          fontSize: 11,
          fontWeight: 600,
        }}>
          {question.module}
        </div>
      </div>

      {/* Question */}
      <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5, marginBottom: 16, color: "#F0F9FF" }}>
        {question.q}
      </p>

      {/* Options */}
      {!confirmed ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {question.options.map((opt: string, i: number) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: selected === i ? "2px solid #34D399" : "1.5px solid rgba(255,255,255,0.2)",
                background: selected === i ? "rgba(52, 211, 153, 0.15)" : "rgba(255,255,255,0.07)",
                color: "#fff",
                textAlign: "left",
                fontSize: 13,
                fontWeight: selected === i ? 600 : 400,
                cursor: "pointer",
                fontFamily: "'Sora', sans-serif",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ opacity: 0.6, marginRight: 8 }}>{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <div style={{
          padding: "14px 16px",
          borderRadius: 12,
          background: isCorrect ? "rgba(52, 211, 153, 0.15)" : "rgba(248, 113, 113, 0.15)",
          border: `1.5px solid ${isCorrect ? "#34D399" : "#F87171"}`,
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: isCorrect ? "#34D399" : "#F87171" }}>
            {isCorrect ? "✅ Correct!" : "❌ Not quite"}
          </div>
          <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.5, margin: 0 }}>
            {question.explanation}
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {!confirmed ? (
          <button
            onClick={handleConfirm}
            disabled={selected === null}
            style={{
              flex: 1,
              padding: "11px 16px",
              borderRadius: 12,
              background: selected !== null ? "#34D399" : "rgba(255,255,255,0.15)",
              color: selected !== null ? "#0F172A" : "rgba(255,255,255,0.5)",
              fontWeight: 700,
              fontSize: 14,
              border: "none",
              cursor: selected !== null ? "pointer" : "not-allowed",
              fontFamily: "'Sora', sans-serif",
            }}
          >
            Confirm Answer
          </button>
        ) : (
          <Link href="/quiz" style={{ flex: 1 }}>
            <button style={{
              width: "100%",
              padding: "11px 16px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.15)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              border: "1.5px solid rgba(255,255,255,0.3)",
              cursor: "pointer",
              fontFamily: "'Sora', sans-serif",
            }}>
              📚 Keep Studying →
            </button>
          </Link>
        )}
      </div>

      {!isAuthenticated && (
        <p style={{ fontSize: 11, opacity: 0.5, marginTop: 12, textAlign: "center" }}>
          Sign in to track your daily streak and weak topics
        </p>
      )}
    </div>
  );
}
