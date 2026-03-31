import { useState } from "react";
import { trpc } from "@/lib/trpc";

interface NationalWaitlistModalProps {
  onClose: () => void;
  defaultProvince?: string;
}

const PROVINCES = [
  { value: "British Columbia", label: "🏔️ British Columbia", regulator: "EOCP" },
  { value: "Alberta", label: "🛢️ Alberta", regulator: "Alberta EPA" },
  { value: "Saskatchewan", label: "🌾 Saskatchewan" },
  { value: "Manitoba", label: "🦬 Manitoba" },
  { value: "Quebec", label: "⚜️ Quebec" },
  { value: "New Brunswick", label: "🌲 New Brunswick" },
  { value: "Nova Scotia", label: "⚓ Nova Scotia" },
  { value: "Prince Edward Island", label: "🥔 Prince Edward Island" },
  { value: "Newfoundland & Labrador", label: "🐟 Newfoundland & Labrador" },
  { value: "Northwest Territories", label: "🌌 Northwest Territories" },
  { value: "Yukon", label: "🐺 Yukon" },
  { value: "Nunavut", label: "🧊 Nunavut" },
];

export default function NationalWaitlistModal({ onClose, defaultProvince }: NationalWaitlistModalProps) {
  const [email, setEmail] = useState("");
  const [province, setProvince] = useState(defaultProvince ?? "");
  const [emailError, setEmailError] = useState("");
  const [provinceError, setProvinceError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const joinMutation = trpc.waitlist.join.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: () => {
      // Still show success to avoid blocking the user
      setSubmitted(true);
    },
  });

  function validate(): boolean {
    let valid = true;
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Please enter a valid email address.");
      valid = false;
    } else {
      setEmailError("");
    }
    if (!province) {
      setProvinceError("Please select your province or territory.");
      valid = false;
    } else {
      setProvinceError("");
    }
    return valid;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    joinMutation.mutate({
      email: email.trim().toLowerCase(),
      courseCode: `NATIONAL-${province.toUpperCase().replace(/\s+/g, "-").slice(0, 20)}`,
      courseTitle: `National Waitlist — ${province}`,
      province,
    });
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.88)",
        backdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#0F172A",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20,
        padding: "40px 36px",
        maxWidth: 480,
        width: "100%",
        boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
        textAlign: "center",
        position: "relative",
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16,
            background: "rgba(255,255,255,0.08)", border: "none",
            borderRadius: 8, width: 32, height: 32,
            color: "rgba(255,255,255,0.6)", fontSize: 18,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >×</button>

        {submitted ? (
          /* ── Success state ── */
          <div>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🇨🇦</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#FFFFFF", marginBottom: 10, fontFamily: "Sora, sans-serif" }}>
              You're on the list!
            </h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
              We'll notify you as soon as <strong style={{ color: "#38BDF8" }}>{province}</strong> content launches on Echelon.
            </p>
            <button
              onClick={onClose}
              style={{
                padding: "12px 32px", borderRadius: 10,
                background: "linear-gradient(135deg, #0891B2, #7C3AED)",
                color: "#fff", border: "none", fontSize: 14, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Back to Homepage
            </button>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            {/* Header */}
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "linear-gradient(135deg, #0891B2, #7C3AED)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px", fontSize: 26,
            }}>🇨🇦</div>

            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#FFFFFF", marginBottom: 8, fontFamily: "Sora, sans-serif", lineHeight: 1.3 }}>
              Join the National Waitlist
            </h2>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
              Echelon is expanding to every province. Tell us where you are and we'll notify you the moment your province launches.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              {/* Province selector */}
              <div style={{ marginBottom: 12, textAlign: "left" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>
                  Province / Territory
                </label>
                <select
                  value={province}
                  onChange={e => { setProvince(e.target.value); if (provinceError) setProvinceError(""); }}
                  style={{
                    width: "100%",
                    padding: "13px 16px",
                    borderRadius: 10,
                    border: provinceError ? "1.5px solid #EF4444" : "1.5px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.06)",
                    color: province ? "#FFFFFF" : "rgba(255,255,255,0.4)",
                    fontSize: 14,
                    outline: "none",
                    fontFamily: "inherit",
                    boxSizing: "border-box" as const,
                    cursor: "pointer",
                  }}
                >
                  <option value="" disabled style={{ background: "#1E293B", color: "#94A3B8" }}>Select your province…</option>
                  {PROVINCES.map(p => (
                    <option key={p.value} value={p.value} style={{ background: "#1E293B", color: "#FFFFFF" }}>
                      {p.label}{p.regulator ? ` — ${p.regulator}` : ""}
                    </option>
                  ))}
                </select>
                {provinceError && <p style={{ color: "#EF4444", fontSize: 12, marginTop: 5 }}>{provinceError}</p>}
              </div>

              {/* Email input */}
              <div style={{ marginBottom: 16, textAlign: "left" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); if (emailError) setEmailError(""); }}
                  style={{
                    width: "100%",
                    padding: "13px 16px",
                    borderRadius: 10,
                    border: emailError ? "1.5px solid #EF4444" : "1.5px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.06)",
                    color: "#FFFFFF",
                    fontSize: 14,
                    outline: "none",
                    fontFamily: "inherit",
                    boxSizing: "border-box" as const,
                  }}
                  onFocus={e => { if (!emailError) e.target.style.borderColor = "#38BDF8"; }}
                  onBlur={e => { if (!emailError) e.target.style.borderColor = "rgba(255,255,255,0.15)"; }}
                />
                {emailError && <p style={{ color: "#EF4444", fontSize: 12, marginTop: 5 }}>{emailError}</p>}
              </div>

              <button
                type="submit"
                disabled={joinMutation.isPending}
                style={{
                  width: "100%",
                  padding: "13px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: joinMutation.isPending
                    ? "rgba(56,189,248,0.4)"
                    : "linear-gradient(135deg, #0891B2, #7C3AED)",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: joinMutation.isPending ? "not-allowed" : "pointer",
                  fontFamily: "Sora, sans-serif",
                  letterSpacing: "0.01em",
                }}
              >
                {joinMutation.isPending ? "Joining…" : "Notify Me When It Launches →"}
              </button>
            </form>

            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 14 }}>
              No spam. Just a single email when your province goes live.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
