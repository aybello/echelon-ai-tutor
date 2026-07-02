/**
 * /login/otp — Email OTP (6-digit code) login for org operators.
 *
 * Step 1: Enter email → request code
 * Step 2: Enter 6-digit code → verify → redirect to /quiz or /team
 */

import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import LandingNav from "@/components/LandingNav";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_5c9ed3a7.webp";

type Step = "email" | "code" | "success" | "error";

export default function OtpLogin() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [errorMsg, setErrorMsg] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [isManager, setIsManager] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const requestOtp = trpc.emailOtp.requestOtp.useMutation({
    onSuccess: () => {
      setStep("code");
      setErrorMsg("");
      // Focus first code input after transition
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    },
    onError: () => {
      setErrorMsg("Something went wrong. Please try again.");
    },
  });

  const verifyOtp = trpc.emailOtp.verifyOtp.useMutation({
    onSuccess: (data) => {
      if (data.valid) {
        // Store access in localStorage — same pattern as magic link
        if (data.accessToken) {
          localStorage.setItem("echelon_access_token", data.accessToken);
        }
        localStorage.setItem("echelon_subscription_email", data.email);
        localStorage.setItem("echelon_trial_email", data.email);
        localStorage.setItem("echelon_trial_unlocked", "true");
        if (data.examTypes.length > 0) {
          localStorage.setItem("echelon_subscription_exam_types", JSON.stringify(data.examTypes));
          localStorage.setItem("echelon_purchased_products", JSON.stringify(data.examTypes));
        }
        setIsManager(!!data.isManager);
        setStep("success");
        const redirectPath = data.isManager ? "/team" : "/quiz";
        setTimeout(() => navigate(redirectPath), 2500);
      } else {
        if (data.reason === "expired") {
          setErrorMsg("This code has expired. Please request a new one.");
        } else if (data.reason === "too_many_attempts") {
          setErrorMsg("Too many incorrect attempts. Please request a new code.");
        } else if (data.reason === "wrong_code") {
          const left = data.attemptsRemaining ?? 0;
          setAttemptsLeft(left);
          setErrorMsg(`Incorrect code. ${left} attempt${left === 1 ? "" : "s"} remaining.`);
          setCode(["", "", "", "", "", ""]);
          setTimeout(() => inputRefs.current[0]?.focus(), 50);
        } else {
          setErrorMsg("Verification failed. Please try again.");
        }
      }
    },
    onError: () => {
      setErrorMsg("Something went wrong. Please try again.");
    },
  });

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setErrorMsg("");
    requestOtp.mutate({ email: email.trim().toLowerCase() });
  }

  function handleCodeInput(index: number, value: string) {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setErrorMsg("");

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits filled
    if (digit && index === 5) {
      const fullCode = [...newCode].join("");
      if (fullCode.length === 6) {
        verifyOtp.mutate({ email, code: fullCode });
      }
    }
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleCodePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split("");
      setCode(newCode);
      setErrorMsg("");
      inputRefs.current[5]?.focus();
      verifyOtp.mutate({ email, code: pasted });
    }
  }

  function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length < 6) return;
    verifyOtp.mutate({ email, code: fullCode });
  }

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 20,
    border: "1px solid #E2E8F0",
    padding: "48px 40px",
    maxWidth: 460,
    width: "100%",
    textAlign: "center",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  };

  const btnStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "14px 40px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #1D4ED8, #0E7490)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    width: "100%",
    marginTop: 8,
  };

  return (
    <div
      style={{
        fontFamily: "'Sora', sans-serif",
        background: "#F8FAFC",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <LandingNav currentPath="/login/otp" />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          width: "100%",
        }}
      >
        {/* Step 1: Email entry */}
        {step === "email" && (
          <div style={cardStyle}>
            <img
              src={LOGO_URL}
              alt="Echelon Institute"
              style={{ height: 48, marginBottom: 20, objectFit: "contain" }}
            />
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔑</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "0 0 8px" }}>
              Sign In with a Code
            </h1>
            <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, margin: "0 0 28px" }}>
              Enter your work email and we'll send you a 6-digit code to sign in instantly.
            </p>
            <form onSubmit={handleEmailSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoFocus
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "1.5px solid #CBD5E1",
                  fontSize: 15,
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box",
                  marginBottom: 8,
                  color: "#0F172A",
                }}
              />
              {errorMsg && (
                <p style={{ color: "#DC2626", fontSize: 13, margin: "0 0 8px" }}>{errorMsg}</p>
              )}
              <button
                type="submit"
                style={{ ...btnStyle, opacity: requestOtp.isPending ? 0.7 : 1 }}
                disabled={requestOtp.isPending}
              >
                {requestOtp.isPending ? "Sending code…" : "Send Code →"}
              </button>
            </form>
            <p style={{ marginTop: 20, fontSize: 13, color: "#94A3B8" }}>
              Prefer a magic link?{" "}
              <Link href="/account" style={{ color: "#1D4ED8", textDecoration: "none", fontWeight: 600 }}>
                Use the Account page
              </Link>
            </p>
          </div>
        )}

        {/* Step 2: Code entry */}
        {step === "code" && (
          <div style={cardStyle}>
            <img
              src={LOGO_URL}
              alt="Echelon Institute"
              style={{ height: 48, marginBottom: 20, objectFit: "contain" }}
            />
            <div style={{ fontSize: 36, marginBottom: 12 }}>📬</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "0 0 8px" }}>
              Check Your Email
            </h1>
            <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, margin: "0 0 6px" }}>
              We sent a 6-digit code to
            </p>
            <p style={{ color: "#0F172A", fontSize: 15, fontWeight: 700, margin: "0 0 28px" }}>
              {email}
            </p>
            <form onSubmit={handleCodeSubmit}>
              {/* 6-digit code input boxes */}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "center",
                  marginBottom: 20,
                }}
                onPaste={handleCodePaste}
              >
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeInput(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    style={{
                      width: 52,
                      height: 60,
                      borderRadius: 10,
                      border: `2px solid ${digit ? "#1D4ED8" : "#CBD5E1"}`,
                      fontSize: 28,
                      fontWeight: 800,
                      textAlign: "center",
                      fontFamily: "'Courier New', monospace",
                      color: "#0F172A",
                      outline: "none",
                      background: digit ? "#EFF6FF" : "#fff",
                      transition: "border-color 0.15s, background 0.15s",
                    }}
                  />
                ))}
              </div>
              {errorMsg && (
                <p style={{ color: "#DC2626", fontSize: 13, margin: "0 0 12px" }}>{errorMsg}</p>
              )}
              <button
                type="submit"
                style={{
                  ...btnStyle,
                  opacity: verifyOtp.isPending || code.join("").length < 6 ? 0.6 : 1,
                }}
                disabled={verifyOtp.isPending || code.join("").length < 6}
              >
                {verifyOtp.isPending ? "Verifying…" : "Verify Code →"}
              </button>
            </form>
            <p style={{ marginTop: 20, fontSize: 13, color: "#94A3B8" }}>
              Didn't get the code?{" "}
              <button
                onClick={() => {
                  setCode(["", "", "", "", "", ""]);
                  setErrorMsg("");
                  requestOtp.mutate({ email });
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#1D4ED8",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: "inherit",
                }}
              >
                Resend code
              </button>
            </p>
            <p style={{ marginTop: 8, fontSize: 13, color: "#94A3B8" }}>
              Wrong email?{" "}
              <button
                onClick={() => {
                  setStep("email");
                  setCode(["", "", "", "", "", ""]);
                  setErrorMsg("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#1D4ED8",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: "inherit",
                }}
              >
                Change email
              </button>
            </p>
          </div>
        )}

        {/* Step 3: Success */}
        {step === "success" && (
          <div style={cardStyle}>
            <img
              src={LOGO_URL}
              alt="Echelon Institute"
              style={{ height: 48, marginBottom: 20, objectFit: "contain" }}
            />
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#DCFCE7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: 32,
              }}
            >
              ✓
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0F172A", margin: "0 0 8px" }}>
              You're signed in!
            </h1>
            <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, margin: "0 0 20px" }}>
              Welcome back, <strong>{email}</strong>. Redirecting to your {isManager ? "team dashboard" : "courses"}…
            </p>
            <Link href={isManager ? "/team" : "/quiz"}>
              <button style={btnStyle}>
                {isManager ? "Go to Team Dashboard →" : "Go to Practice Quiz →"}
              </button>
            </Link>
          </div>
        )}

        {/* Error state */}
        {step === "error" && (
          <div style={cardStyle}>
            <img
              src={LOGO_URL}
              alt="Echelon Institute"
              style={{ height: 48, marginBottom: 20, objectFit: "contain" }}
            />
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#FEE2E2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: 32,
              }}
            >
              ✕
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "0 0 8px" }}>
              Something went wrong
            </h1>
            <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, margin: "0 0 20px" }}>
              Please try again or contact support.
            </p>
            <button onClick={() => setStep("email")} style={btnStyle}>
              Try Again →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
