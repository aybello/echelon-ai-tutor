/**
 * /login/otp — Inbox-verified email sign-in for purchasers and team members.
 *
 * Step 1: Enter email → request code
 * Step 2: Enter 6-digit code → verify → requested page, /account, or /team
 */

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { trpc } from "@/lib/trpc";
import LandingNav from "@/components/LandingNav";
import { notifyIdentityChange } from "@shared/identityChange";
import { otpSuccessDestination, sanitizeAccountNext } from "./accountAccess";
import { useQueryClient } from "@tanstack/react-query";
import { clearBrowserIdentity } from "@/lib/logout";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_5c9ed3a7.webp";

type Step = "email" | "code" | "success" | "error";

export default function OtpLogin() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("email");
  // Pre-fill email from ?email= URL param (set by /account redirect)
  // Read ?next= param — safe same-application relative paths only
  const nextParam = (() => {
    if (typeof window === "undefined") return "";
    const raw = new URLSearchParams(window.location.search).get("next") ?? "";
    return sanitizeAccountNext(raw);
  })();

  // Canonical recruitment links carry the intended invitation through request,
  // verification and resend; other learner/manager login stays unbound.
  const assignmentId = /^\/recruitment\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.exec(nextParam)?.[1];
  const invitationScope = assignmentId ? { assignmentId } : {};
  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("email") ?? "";
  });
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [errorMsg, setErrorMsg] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [isManager, setIsManager] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startResendCooldown() {
    setResendCooldown(60);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((remaining) => {
        if (remaining <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return remaining - 1;
      });
    }, 1000);
  }

  useEffect(() => () => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
  }, []);

  // Focus as the code inputs mount, before the learner can type. A delayed
  // timer can steal focus halfway through fast entry and drop an OTP digit.
  useLayoutEffect(() => {
    if (step === "code") inputRefs.current[0]?.focus();
  }, [step]);

  const requestOtp = trpc.emailOtp.requestOtp.useMutation({
    onSuccess: () => {
      setStep("code");
      setErrorMsg("");
      startResendCooldown();
    },
    onError: (error) => {
      setErrorMsg(error.message || "We couldn't send your login code. Please try again.");
    },
  });

  const verifyOtp = trpc.emailOtp.verifyOtp.useMutation({
    onSuccess: async (data) => {
      if (data.valid) {
        if (data.sessionKind === "assessment-only") {
          // The HttpOnly invitation cookie is the applicant's entire access.
          // Do not relabel a previous learner's token, products or cached data
          // as this applicant's identity on a shared browser.
          try { await clearBrowserIdentity(queryClient); } catch { /* best effort; server guards remain authoritative */ }
        } else {
          try {
            if (data.accessToken) {
              localStorage.setItem("echelon_access_token", data.accessToken);
            } else {
              localStorage.removeItem("echelon_access_token");
            }
            localStorage.setItem("echelon_subscription_email", data.email);
            localStorage.setItem("echelon_trial_email", data.email);
            localStorage.setItem("echelon_trial_unlocked", "true");
            // Replace, rather than retain, a prior learner's course lists even
            // for manager/billing recovery sessions without course access.
            localStorage.setItem("echelon_subscription_exam_types", JSON.stringify(data.examTypes));
            localStorage.setItem("echelon_purchased_products", JSON.stringify(data.examTypes));
          } catch { /* session cookie remains valid without local storage */ }
        }
        notifyIdentityChange();
        setIsManager(!!data.isManager);
        setStep("success");
        const finalPath = otpSuccessDestination(nextParam, !!data.isManager);
        // A hard navigation makes the newly issued HttpOnly session cookie the
        // source of truth for the next page. A client-side route transition can
        // reuse an earlier anonymous dashboardAuth.me result and incorrectly
        // tell a verified Course Pass operator that the invitation is invalid.
        setTimeout(() => window.location.assign(finalPath), 2500);
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
          inputRefs.current[0]?.focus();
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
    requestOtp.mutate({ email: email.trim().toLowerCase(), ...invitationScope });
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
        verifyOtp.mutate({ email, code: fullCode, ...invitationScope });
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
      verifyOtp.mutate({ email, code: pasted, ...invitationScope });
    }
  }

  function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length < 6) return;
    verifyOtp.mutate({ email, code: fullCode, ...invitationScope });
  }

  const successDestination = otpSuccessDestination(nextParam, isManager);
  const successLabel = successDestination.startsWith("/team")
    ? "Go to Team Dashboard →"
    : successDestination.startsWith("/account")
      ? "Go to My Account →"
      : "Continue →";

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
      className="learner-redesign learner-auth-page"
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
        className="learner-auth-main"
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
          <div className="learner-auth-card" style={cardStyle}>
            <img
              src={LOGO_URL}
              alt="Echelon Institute"
              style={{ height: 48, marginBottom: 20, objectFit: "contain" }}
            />
            <div className="learner-status-glyph" aria-hidden="true">01</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "0 0 8px" }}>
              Sign In with a Code
            </h1>
            <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, margin: "0 0 28px" }}>
              Enter the email used at checkout or invited by your team. If it matches an eligible account, we'll email a six-digit sign-in code. Verify the code to protect your course access.
            </p>
            <form onSubmit={handleEmailSubmit}>
              <input
                aria-label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
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
              Need help?{" "}
              <a href="mailto:abello@echeloninstitute.ca" style={{ color: "#1D4ED8", textDecoration: "none", fontWeight: 600 }}>
                Contact support
              </a>
            </p>
          </div>
        )}

        {/* Step 2: Code entry */}
        {step === "code" && (
          <div className="learner-auth-card" style={cardStyle}>
            <img
              src={LOGO_URL}
              alt="Echelon Institute"
              style={{ height: 48, marginBottom: 20, objectFit: "contain" }}
            />
            <div className="learner-status-glyph" aria-hidden="true">02</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "0 0 8px" }}>
              Check Your Email
            </h1>
            <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, margin: "0 0 6px" }}>
              Check your inbox for a six-digit sign-in code. Email entered:
            </p>
            <p style={{ color: "#0F172A", fontSize: 15, fontWeight: 700, margin: "0 0 28px" }}>
              {email}
            </p>
            <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.6, margin: "0 0 20px" }}>
              If no code arrives, confirm you used your checkout or team-invitation email, or <a href="mailto:abello@echeloninstitute.ca" style={{ color: "#1D4ED8" }}>contact support</a>.
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
                  requestOtp.mutate({ email, ...invitationScope });
                }}
                disabled={requestOtp.isPending || resendCooldown > 0}
                style={{
                  background: "none",
                  border: "none",
                  color: resendCooldown > 0 ? "#94A3B8" : "#1D4ED8",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: requestOtp.isPending || resendCooldown > 0 ? "not-allowed" : "pointer",
                  padding: 0,
                  fontFamily: "inherit",
                }}
              >
                {requestOtp.isPending
                  ? "Sending…"
                  : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend code"}
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
          <div className="learner-auth-card" style={cardStyle}>
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
              Welcome back, <strong>{email}</strong>. {nextParam ? "Continuing to your requested page" : isManager ? "Opening your team dashboard" : "Opening your account and current course access"}…
            </p>
            <a href={successDestination} style={{ ...btnStyle, textDecoration: "none", boxSizing: "border-box" }}>
              {successLabel}
            </a>
          </div>
        )}

        {/* Error state */}
        {step === "error" && (
          <div className="learner-auth-card" style={cardStyle}>
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
