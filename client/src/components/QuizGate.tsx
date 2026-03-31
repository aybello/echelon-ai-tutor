import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

interface QuizGateProps {
  questionsAnswered: number;
  onUnlocked: () => void;
  onDismiss?: () => void; // optional: restart another free 15-question session
}

const TRIAL_UNLOCKED_KEY = "echelon_trial_unlocked";

export function isTrialUnlocked(): boolean {
  try {
    return localStorage.getItem(TRIAL_UNLOCKED_KEY) === "true";
  } catch {
    return false;
  }
}

export function setTrialUnlocked(): void {
  try {
    localStorage.setItem(TRIAL_UNLOCKED_KEY, "true");
  } catch {
    // ignore
  }
}

export default function QuizGate({ questionsAnswered, onUnlocked, onDismiss }: QuizGateProps) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const unlockMutation = trpc.trial.unlock.useMutation({
    onSuccess: () => {
      setTrialUnlocked();
      setSubmitted(true);
      setTimeout(() => {
        onUnlocked();
      }, 1400);
    },
    onError: () => {
      // Even on error, unlock locally so the user isn't blocked
      setTrialUnlocked();
      setSubmitted(true);
      setTimeout(() => {
        onUnlocked();
      }, 1400);
    },
  });

  function validateEmail(val: string): boolean {
    if (!val.trim()) {
      setEmailError("Please enter your email address.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) {
      setEmailError("Please enter a valid email address.");
      return false;
    }
    setEmailError("");
    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateEmail(email)) return;
    unlockMutation.mutate({ email: email.trim().toLowerCase() });
  }

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(15, 23, 42, 0.88)",
      backdropFilter: "blur(6px)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 20,
        padding: "40px 36px",
        maxWidth: 480,
        width: "100%",
        boxShadow: "0 32px 80px rgba(0,0,0,0.35)",
        textAlign: "center",
      }}>
        {submitted ? (
          /* ── Success state ── */
          <div>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
            <h2 style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#0F172A",
              marginBottom: 8,
              fontFamily: "Sora, sans-serif",
            }}>
              You're in — full access unlocked!
            </h2>
            <p style={{ color: "#64748B", fontSize: 15 }}>
              Loading your next question…
            </p>
          </div>
        ) : (
          /* ── Gate form ── */
          <>
            {/* Icon */}
            <div style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #1D4ED8 0%, #0EA5E9 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: 28,
            }}>
              🏆
            </div>

            {/* Headline */}
            <h2 style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#0F172A",
              marginBottom: 8,
              fontFamily: "Sora, sans-serif",
              lineHeight: 1.3,
            }}>
              You've completed your 15 free questions!
            </h2>

            {/* Stats badge */}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#EFF6FF",
              border: "1px solid #BFDBFE",
              borderRadius: 100,
              padding: "6px 14px",
              fontSize: 13,
              color: "#1D4ED8",
              fontWeight: 600,
              marginBottom: 16,
            }}>
              ✓ {questionsAnswered} questions answered
            </div>

            <p style={{
              color: "#475569",
              fontSize: 15,
              lineHeight: 1.6,
              marginBottom: 28,
            }}>
              Enter your email to unlock the <strong>full question bank</strong> — 600+ practice questions across all Ontario operator exam modules, completely free.
            </p>

            {/* Email form */}
            <form onSubmit={handleSubmit} noValidate>
              <div style={{ marginBottom: 12 }}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (emailError) validateEmail(e.target.value);
                  }}
                  style={{
                    width: "100%",
                    padding: "13px 16px",
                    borderRadius: 10,
                    border: emailError ? "1.5px solid #EF4444" : "1.5px solid #CBD5E1",
                    fontSize: 15,
                    outline: "none",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={e => {
                    if (!emailError) e.target.style.borderColor = "#1D4ED8";
                  }}
                  onBlur={e => {
                    if (!emailError) e.target.style.borderColor = "#CBD5E1";
                  }}
                  autoFocus
                />
                {emailError && (
                  <p style={{ color: "#EF4444", fontSize: 13, marginTop: 6, textAlign: "left" }}>
                    {emailError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={unlockMutation.isPending}
                style={{
                  width: "100%",
                  padding: "13px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: unlockMutation.isPending
                    ? "#93C5FD"
                    : "linear-gradient(135deg, #1D4ED8 0%, #0EA5E9 100%)",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: unlockMutation.isPending ? "not-allowed" : "pointer",
                  fontFamily: "Sora, sans-serif",
                  letterSpacing: "0.01em",
                  transition: "opacity 0.15s",
                }}
              >
                {unlockMutation.isPending ? "Unlocking…" : "Unlock Full Access →"}
              </button>
            </form>

            <p style={{ color: "#94A3B8", fontSize: 12, marginTop: 14, marginBottom: 20 }}>
              No spam, no credit card. Just your study progress.
            </p>

            {/* ── Escape options ── */}
            <div style={{
              borderTop: "1px solid #E2E8F0",
              paddingTop: 18,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}>
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  style={{
                    width: "100%",
                    padding: "11px 20px",
                    borderRadius: 10,
                    border: "1.5px solid #CBD5E1",
                    background: "#F8FAFC",
                    color: "#374151",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#F1F5F9")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#F8FAFC")}
                >
                  🔄 Try Another 15 Free Questions
                </button>
              )}
              <Link href="/">
                <button
                  style={{
                    width: "100%",
                    padding: "11px 20px",
                    borderRadius: 10,
                    border: "1.5px solid #CBD5E1",
                    background: "#F8FAFC",
                    color: "#374151",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#F1F5F9")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#F8FAFC")}
                >
                  ← Back to Homepage
                </button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
