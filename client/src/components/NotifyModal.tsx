// NotifyModal — email capture modal for upcoming courses
// Shows a simple email input, submits to waitlist.join tRPC procedure

import { useState } from "react";
import { trpc } from "@/lib/trpc";

interface NotifyModalProps {
  courseCode: string;
  courseTitle: string;
  onClose: () => void;
}

export default function NotifyModal({ courseCode, courseTitle, onClose }: NotifyModalProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  const joinWaitlist = trpc.waitlist.join.useMutation({
    onSuccess: (data) => {
      if (data.alreadyRegistered) {
        setAlreadyRegistered(true);
      }
      setSubmitted(true);
    },
    onError: (err) => {
      setError(err.message || "Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    joinWaitlist.mutate({ email: email.trim(), courseCode, courseTitle });
  };

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
      }}
    >
      {/* Modal card */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 20, padding: "36px 32px",
          maxWidth: 420, width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          animation: "popIn 0.2s ease both",
          fontFamily: "'Sora', sans-serif",
        }}
      >
        <style>{`@keyframes popIn { from{transform:scale(0.92);opacity:0} to{transform:scale(1);opacity:1} }`}</style>

        {submitted ? (
          // ── Success state ──
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              {alreadyRegistered ? "✅" : "🎉"}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#FFFFFF", margin: "0 0 8px" }}>
              {alreadyRegistered ? "Already on the list!" : "You're on the list!"}
            </h2>
            <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6, margin: "0 0 24px" }}>
              {alreadyRegistered
                ? `${email} is already registered for ${courseTitle}. We'll notify you as soon as it launches.`
                : `We'll email ${email} as soon as ${courseTitle} is available. Stay tuned!`}
            </p>
            <button
              onClick={onClose}
              style={{
                padding: "10px 28px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #1D4ED8, #0F766E)",
                color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Done
            </button>
          </div>
        ) : (
          // ── Input state ──
          <>
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "#EDE9FE", borderRadius: 8, padding: "4px 10px",
                fontSize: 11, fontWeight: 700, color: "#6D28D9", marginBottom: 12,
              }}>
                🔔 Coming Soon
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#FFFFFF", margin: "0 0 6px" }}>
                Notify me when available
              </h2>
              <p style={{ fontSize: 13, color: "#64748B", margin: 0, lineHeight: 1.6 }}>
                Be the first to know when <strong>{courseTitle}</strong> launches. No spam — one email when it's ready.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@example.com"
                  autoFocus
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10,
                    border: error ? "1.5px solid #EF4444" : "1.5px solid #E2E8F0",
                    fontSize: 14, fontFamily: "inherit", outline: "none",
                    boxSizing: "border-box", color: "#FFFFFF",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => { if (!error) e.target.style.borderColor = "#1D4ED8"; }}
                  onBlur={(e) => { if (!error) e.target.style.borderColor = "#94A3B8"; }}
                />
                {error && (
                  <p style={{ fontSize: 12, color: "#EF4444", margin: "4px 0 0", fontWeight: 500 }}>
                    {error}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1, padding: "10px", borderRadius: 10,
                    border: "1.5px solid #E2E8F0", background: "transparent",
                    color: "#64748B", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joinWaitlist.isPending}
                  style={{
                    flex: 2, padding: "10px", borderRadius: 10, border: "none",
                    background: joinWaitlist.isPending
                      ? "#E2E8F0"
                      : "linear-gradient(135deg, #1D4ED8, #0F766E)",
                    color: "#fff", fontSize: 13, fontWeight: 700,
                    cursor: joinWaitlist.isPending ? "not-allowed" : "pointer",
                    fontFamily: "inherit", transition: "opacity 0.15s",
                  }}
                >
                  {joinWaitlist.isPending ? "Sending…" : "Notify Me →"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
