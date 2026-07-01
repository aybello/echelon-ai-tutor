// Echelon Institute — Manager Login Page
// Email OTP flow: enter email → receive 6-digit code → verify → redirect to /team dashboard
// Identical OTP flow to Login.tsx but branded for team managers, not individual students.

import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function ManagerLogin() {
  usePageMeta({
    title: "Manager Sign In | Echelon Institute",
    description: "Sign in to your Echelon for Teams manager dashboard to track your operators' progress.",
  });

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendOtp = trpc.dashboardAuth.sendOtp.useMutation({
    onSuccess: () => {
      setStep("code");
      setError("");
      startCooldown();
    },
    onError: (err) => {
      setError(err.message || "Failed to send code. Please try again.");
    },
  });

  const verifyOtp = trpc.dashboardAuth.verifyOtp.useMutation({
    onSuccess: (data) => {
      // Store email in localStorage so access checks work immediately
      try {
        const signedInEmail = data.email.trim().toLowerCase();
        localStorage.setItem("echelon_trial_email", signedInEmail);
        localStorage.setItem("echelon_subscription_email", signedInEmail);
        if (data.accessToken) {
          localStorage.setItem("echelon_access_token", data.accessToken);
        }
      } catch { /* ignore storage errors */ }
      // Hard navigate to manager dashboard
      window.location.href = "/team";
    },
    onError: (err) => {
      setError(err.message || "Invalid or expired code. Please try again.");
      setCode(["", "", "", "", "", ""]);
      codeRefs.current[0]?.focus();
    },
  });

  function startCooldown() {
    setResendCooldown(60);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    sendOtp.mutate({ email: email.trim().toLowerCase() });
  }

  function handleCodeChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    if (digit && index < 5) {
      codeRefs.current[index + 1]?.focus();
    }
    if (digit && index === 5) {
      const fullCode = [...newCode].join("");
      if (fullCode.length === 6) {
        setError("");
        verifyOtp.mutate({ email, code: fullCode });
      }
    }
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  }

  function handleCodePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      e.preventDefault();
      setError("");
      verifyOtp.mutate({ email, code: pasted });
    }
  }

  function handleVerifySubmit(e: React.FormEvent) {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length !== 6) return;
    setError("");
    verifyOtp.mutate({ email, code: fullCode });
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0F172A 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "Sora, Inter, sans-serif",
    }}>
      {/* Logo */}
      <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, textDecoration: "none" }}>
        <img src="/logo.svg" alt="Echelon Institute" style={{ width: 36, height: 36 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        <span style={{ color: "#fff", fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>Echelon Institute</span>
      </a>

      {/* Manager badge */}
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 20,
        padding: "6px 14px",
        marginBottom: 24,
        fontSize: 13,
        color: "rgba(255,255,255,0.75)",
        fontWeight: 600,
        letterSpacing: "0.02em",
      }}>
        🏢 Team Manager Portal
      </div>

      {/* Card */}
      <div style={{
        background: "#fff",
        borderRadius: 20,
        padding: "40px 36px",
        width: "100%",
        maxWidth: 420,
        boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
      }}>
        {step === "email" ? (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: "-0.03em" }}>
                Sign in to your team dashboard
              </h1>
              <p style={{ fontSize: 14, color: "#64748B", marginTop: 8, marginBottom: 0 }}>
                Enter your manager email to receive a sign-in code
              </p>
            </div>

            <form onSubmit={handleEmailSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  Manager email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@yourorganization.com"
                  autoFocus
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: error ? "1.5px solid #EF4444" : "1.5px solid #E2E8F0",
                    fontSize: 15,
                    color: "#0F172A",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    background: "#F8FAFC",
                  }}
                />
              </div>

              {error && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 12px", marginBottom: 16, fontSize: 13, color: "#DC2626" }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={sendOtp.isPending || !email.trim()}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: 10,
                  background: sendOtp.isPending || !email.trim() ? "#94A3B8" : "linear-gradient(135deg, #1D4ED8, #0E7490)",
                  color: "#fff",
                  border: "none",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: sendOtp.isPending || !email.trim() ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  transition: "opacity 0.2s",
                }}
              >
                {sendOtp.isPending ? "Sending code..." : "Send Sign-In Code →"}
              </button>
            </form>

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #F1F5F9", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>
                Not a manager?{" "}
                <a href="/account" style={{ color: "#1D4ED8", fontWeight: 600, textDecoration: "none" }}>
                  Student sign in →
                </a>
              </p>
              <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 8, marginBottom: 0 }}>
                Want to enrol your team?{" "}
                <a href="/teams" style={{ color: "#1D4ED8", fontWeight: 600, textDecoration: "none" }}>
                  View team plans →
                </a>
              </p>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📬</div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: "-0.03em" }}>
                Check your email
              </h1>
              <p style={{ fontSize: 14, color: "#64748B", marginTop: 8, marginBottom: 0 }}>
                We sent a 6-digit code to<br />
                <strong style={{ color: "#0F172A" }}>{email}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifySubmit}>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }} onPaste={handleCodePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { codeRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleCodeChange(i, e.target.value)}
                    onKeyDown={e => handleCodeKeyDown(i, e)}
                    autoFocus={i === 0}
                    style={{
                      width: 48,
                      height: 56,
                      borderRadius: 10,
                      border: error ? "1.5px solid #EF4444" : "1.5px solid #E2E8F0",
                      fontSize: 24,
                      fontWeight: 700,
                      textAlign: "center",
                      color: "#0F172A",
                      background: digit ? "#EFF6FF" : "#F8FAFC",
                      outline: "none",
                      fontFamily: "inherit",
                      transition: "border-color 0.15s, background 0.15s",
                    }}
                  />
                ))}
              </div>

              {error && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 12px", marginBottom: 16, fontSize: 13, color: "#DC2626", textAlign: "center" }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={verifyOtp.isPending || code.join("").length !== 6}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: 10,
                  background: verifyOtp.isPending || code.join("").length !== 6 ? "#94A3B8" : "linear-gradient(135deg, #1D4ED8, #0E7490)",
                  color: "#fff",
                  border: "none",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: verifyOtp.isPending || code.join("").length !== 6 ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {verifyOtp.isPending ? "Verifying..." : "Sign In to Dashboard →"}
              </button>
            </form>

            <div style={{ marginTop: 20, textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "#94A3B8", marginBottom: 8 }}>
                Didn't receive the code?{" "}
                {resendCooldown > 0 ? (
                  <span style={{ color: "#94A3B8" }}>Resend in {resendCooldown}s</span>
                ) : (
                  <button
                    onClick={() => { setError(""); sendOtp.mutate({ email }); }}
                    disabled={sendOtp.isPending}
                    style={{ background: "none", border: "none", color: "#1D4ED8", fontWeight: 600, fontSize: 13, cursor: "pointer", padding: 0, fontFamily: "inherit" }}
                  >
                    Resend code
                  </button>
                )}
              </p>
              <button
                onClick={() => { setStep("email"); setCode(["", "", "", "", "", ""]); setError(""); }}
                style={{ background: "none", border: "none", color: "#94A3B8", fontSize: 13, cursor: "pointer", padding: 0, fontFamily: "inherit" }}
              >
                ← Use a different email
              </button>
            </div>
          </>
        )}
      </div>

      <p style={{ color: "#475569", fontSize: 12, marginTop: 24, textAlign: "center" }}>
        Echelon Institute · Canadian Water &amp; Wastewater Operator Exam Prep
      </p>
    </div>
  );
}
