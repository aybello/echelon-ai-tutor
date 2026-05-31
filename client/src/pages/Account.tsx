// Account.tsx — Restore Access / My Passes
// Design: Professional SaaS — Clean Dark-Accent, matches site palette
import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import SiteNav from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";
import ExamDateTracker from "@/components/ExamDateTracker";
import { toast } from "sonner";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_5c9ed3a7.webp";

// Map each exam type to its display info and links
const EXAM_META: Record<
  string,
  { label: string; quizPath: string; mockPath?: string; formulaPath?: string; flashcardPath?: string; color: string; bg: string; icon: string; track: string }
> = {
  oit: { label: "OIT Practice Pass", quizPath: "/quiz", mockPath: "/oit-mock", formulaPath: "/formulas", flashcardPath: "/oit-water-flashcards", color: "#0369A1", bg: "#F0F9FF", icon: "💧", track: "Ontario" },
  "oit-ww": { label: "OIT Wastewater Practice Pass", quizPath: "/oit-ww", mockPath: "/oit-ww-mock", formulaPath: "/formulas-ww1", flashcardPath: "/oit-ww-flashcards", color: "#065F46", bg: "#ECFDF5", icon: "🌿", track: "Ontario" },
  "class1-water": { label: "Class 1 Water Treatment Pass", quizPath: "/class1-water", mockPath: "/class1-water-mock", formulaPath: "/formulas-water1", flashcardPath: "/class1-water-flashcards", color: "#0369A1", bg: "#F0F9FF", icon: "🚰", track: "Ontario" },
  "class1-ww": { label: "Class 1 Wastewater Treatment Pass", quizPath: "/class1-ww", mockPath: "/class1-ww-mock", formulaPath: "/formulas-ww1", flashcardPath: "/class1-ww-flashcards", color: "#0F766E", bg: "#F0FDFA", icon: "🌊", track: "Ontario" },
  wqa: { label: "Water Quality Analyst Pass", quizPath: "/wqa", mockPath: "/wqa-mock", formulaPath: "/formulas-wqa", flashcardPath: "/wqa-flashcards", color: "#7C3AED", bg: "#F5F3FF", icon: "🔬", track: "Ontario" },
  "class2-water": { label: "Class 2 Water Treatment Pass", quizPath: "/class2-water", mockPath: "/class2-water-mock", formulaPath: "/formulas-water2", flashcardPath: "/class2-water-flashcards", color: "#0E7490", bg: "#ECFEFF", icon: "🚰", track: "Ontario" },
  "class3-water": { label: "Class 3 Water Treatment Pass", quizPath: "/class3-water", mockPath: "/class3-water-mock", formulaPath: "/formulas-water3", flashcardPath: "/class3-water-flashcards", color: "#1E40AF", bg: "#EFF6FF", icon: "🚰", track: "Ontario" },
  "class4-water": { label: "Class 4 Water Treatment Pass", quizPath: "/class4-water", mockPath: "/class4-water-mock", formulaPath: "/formulas-water4", flashcardPath: "/class4-water-flashcards", color: "#4C1D95", bg: "#F5F3FF", icon: "🚰", track: "Ontario" },
  "class2-ww": { label: "Class 2 Wastewater Treatment Pass", quizPath: "/class2-ww", mockPath: "/class2-ww-mock", formulaPath: "/formulas-ww2", flashcardPath: "/class2-ww-flashcards", color: "#0F766E", bg: "#F0FDFA", icon: "🌊", track: "Ontario" },
  "class3-ww": { label: "Class 3 Wastewater Treatment Pass", quizPath: "/class3-ww", mockPath: "/class3-ww-mock", formulaPath: "/formulas-ww3", flashcardPath: "/class3-ww-flashcards", color: "#0F766E", bg: "#F0FDFA", icon: "🌊", track: "Ontario" },
  "class4-ww": { label: "Class 4 Wastewater Treatment Pass", quizPath: "/class4-ww", flashcardPath: "/class4-ww-flashcards", color: "#0F766E", bg: "#F0FDFA", icon: "🌊", track: "Ontario" },
  "wpi-class1-water": { label: "WPI Class I Water Treatment Pass", quizPath: "/wpi-class1-water", mockPath: "/wpi-class1-water-mock", formulaPath: "/formulas-wpi-class1", flashcardPath: "/wpi-class1-water-flashcards", color: "#0369A1", bg: "#F0F9FF", icon: "🏔️", track: "WPI" },
  "wpi-class2-water": { label: "WPI Class II Water Treatment Pass", quizPath: "/wpi-class2-water", mockPath: "/wpi-class2-water-mock", formulaPath: "/formulas-wpi-class2", flashcardPath: "/wpi-class2-water-flashcards", color: "#0E7490", bg: "#ECFEFF", icon: "🏔️", track: "WPI" },
  "wpi-class3-water": { label: "WPI Class III Water Treatment Pass", quizPath: "/wpi-class3-water", mockPath: "/wpi-class3-water-mock", formulaPath: "/formulas-wpi-class3", flashcardPath: "/wpi-class3-water-flashcards", color: "#1E40AF", bg: "#EFF6FF", icon: "🏔️", track: "WPI" },
  "wpi-class4-water": { label: "WPI Class IV Water Treatment Pass", quizPath: "/wpi-class4-water", mockPath: "/wpi-class4-water-mock", formulaPath: "/formulas-wpi-class4", flashcardPath: "/wpi-class4-water-flashcards", color: "#4C1D95", bg: "#F5F3FF", icon: "🏔️", track: "WPI" },
  "wpi-class1-wastewater": { label: "WPI Class I Wastewater Treatment Pass", quizPath: "/wpi-class1-wastewater", mockPath: "/wpi-class1-wastewater-mock", formulaPath: "/formulas-wpi-class1-ww", flashcardPath: "/wpi-class1-wastewater-flashcards", color: "#B45309", bg: "#FFFBEB", icon: "🌿", track: "WPI" },
  "wpi-class2-wastewater": { label: "WPI Class II Wastewater Treatment Pass", quizPath: "/wpi-class2-wastewater", mockPath: "/wpi-class2-wastewater-mock", formulaPath: "/formulas-wpi-class2-ww", flashcardPath: "/wpi-class2-wastewater-flashcards", color: "#0F766E", bg: "#F0FDFA", icon: "🌿", track: "WPI" },
  "wpi-class3-wastewater": { label: "WPI Class III Wastewater Treatment Pass", quizPath: "/wpi-class3-wastewater", mockPath: "/wpi-class3-wastewater-mock", formulaPath: "/formulas-wpi-class3-ww", flashcardPath: "/wpi-class3-wastewater-flashcards", color: "#1D4ED8", bg: "#EFF6FF", icon: "🌿", track: "WPI" },
  "wpi-class4-wastewater": { label: "WPI Class IV Wastewater Treatment Pass", quizPath: "/wpi-class4-wastewater", mockPath: "/wpi-class4-wastewater-mock", formulaPath: "/formulas-wpi-class4-ww", flashcardPath: "/wpi-class4-wastewater-flashcards", color: "#6D28D9", bg: "#F5F3FF", icon: "🌿", track: "WPI" },
};

/** Small inline mastery progress badge for flashcard stats */
function MasteryBadge({ knownCount, totalCards }: { knownCount: number; totalCards: number }) {
  if (!totalCards) return null;
  const pct = Math.round((knownCount / totalCards) * 100);
  const color = pct >= 80 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#94a3b8";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color, fontWeight: 700 }}>
      <span style={{ display: "inline-block", width: 56, height: 4, borderRadius: 4, background: "#1E293B", overflow: "hidden" }}>
        <span style={{ display: "block", width: pct + "%", height: "100%", background: color, borderRadius: 4, transition: "width 0.4s ease" }} />
      </span>
      {knownCount}/{totalCards} cards mastered ({pct}%)
    </span>
  );
}

/** Write product keys + email to localStorage so PurchaseGate can verify access */
function restoreLocalStorage(email: string, productKeys: string[]) {
  try {
    // Use the same key as PurchaseGate / PurchaseSuccess so access is restored correctly
    localStorage.setItem("echelon_trial_email", email);
    localStorage.setItem("echelon_purchased_products", JSON.stringify(productKeys));
    // Also set the trial-unlocked flag so the quiz gate doesn't block them
    localStorage.setItem("echelon_trial_unlocked", "true");
  } catch { /* ignore */ }
}

/** Format cents to CAD display */
function formatCAD(cents: number) {
  return `$${(cents / 100).toFixed(2)} CAD`;
}

/** Format timestamp to readable date */
function formatDate(ts: Date | string | number) {
  return new Date(ts).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}

export default function Account() {
  usePageMeta({
    title: "My Passes — Echelon Institute",
    description: "Restore access to your Echelon Institute practice passes. Enter your purchase email to unlock your exams on any device.",
    keywords: "restore access, my passes, Echelon Institute account",
  });

  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [emailError, setEmailError] = useState("");
  const [restored, setRestored] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const { isAuthenticated } = useAuth();

  const getPurchases = trpc.stripe.getMyPurchases.useQuery(
    undefined,
    { enabled: !!isAuthenticated, retry: false }
  );

  const getSubscriptions = trpc.stripe.getMySubscriptions.useQuery(
    undefined,
    { enabled: !!isAuthenticated, retry: false }
  );

  const createBillingPortal = trpc.stripe.createBillingPortalSession.useMutation({
    onSuccess: (data) => {
      if (data?.url) window.open(data.url, "_blank");
    },
    onError: (err) => {
      toast.error("Could not open billing portal", { description: err.message });
    },
  });

  const handleManageSubscription = () => {
    setPortalLoading(true);
    createBillingPortal.mutate(
      { origin: window.location.origin },
      { onSettled: () => setPortalLoading(false) }
    );
  };

  // Flashcard mastery stats — load all progress for this email
  const getFlashcardProgress = trpc.flashcard.getAllProgress.useQuery(
    { email: submittedEmail ?? "" },
    { enabled: !!submittedEmail, retry: false, staleTime: 30_000 }
  );
  const flashcardMastery = getFlashcardProgress.data?.progress ?? {};

  // Restore localStorage when purchases are fetched
  useEffect(() => {
    const data = getPurchases.data;
    if (data && data.purchases.length > 0 && !restored && submittedEmail) {
      const keys = data.purchases.map((p) => p.productKey);
      restoreLocalStorage(submittedEmail, keys);
      setRestored(true);
    }
  }, [getPurchases.data, submittedEmail, restored]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");
    setRestored(false);
    setSubmittedEmail(trimmed);
  };

  const unlockedExamTypes = getPurchases.data?.unlockedExamTypes ?? [];
  const purchases = getPurchases.data?.purchases ?? [];
  const hasPurchases = unlockedExamTypes.length > 0;

  // Group passes by track for cleaner display
  const ontarioPasses = unlockedExamTypes.filter(t => EXAM_META[t]?.track === "Ontario");
  const wpiPasses = unlockedExamTypes.filter(t => EXAM_META[t]?.track === "WPI");
  const otherPasses = unlockedExamTypes.filter(t => !EXAM_META[t]);

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", background: "#0F172A", minHeight: "100vh" }}>
      <SiteNav currentPath="/account" />

      <style>{`
        .account-page { max-width: 680px; margin: 0 auto; padding: 48px 24px 120px; }
        .account-card { background: #1E293B; border: 1px solid #334155; border-radius: 20px; }
        .pass-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 20px; border-bottom: 1px solid #1E293B; }
        .pass-row:last-child { border-bottom: none; }
        .pass-actions { display: flex; gap: 8px; flex-shrink: 0; }
        .pass-btn { padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; border: none; cursor: pointer; font-family: inherit; text-decoration: none; display: inline-block; white-space: nowrap; }
        .purchase-history-row { display: grid; grid-template-columns: 1fr auto auto; gap: 12px; align-items: center; padding: 12px 20px; border-bottom: 1px solid #0F172A; }
        .purchase-history-row:last-child { border-bottom: none; }
        .step-badge { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; flex-shrink: 0; }
        @media (max-width: 600px) {
          .account-page { padding: 32px 16px 120px; }
          .pass-row { flex-direction: column; align-items: flex-start; gap: 10px; }
          .pass-actions { flex-wrap: wrap; }
          .purchase-history-row { grid-template-columns: 1fr; gap: 4px; }
          .restore-form-row { flex-direction: column !important; }
          .restore-form-row input { width: 100% !important; }
          .restore-form-row button { width: 100% !important; min-height: 48px !important; }
        }
      `}</style>

      <div className="account-page">

        {/* ── Header ── */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <img src={LOGO_URL} alt="Echelon Institute" style={{ height: 52, width: "auto", filter: "brightness(0) invert(1)", marginBottom: 20 }} />
          <h1 style={{ fontSize: 30, fontWeight: 900, color: "#FFFFFF", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
            Restore Access
          </h1>
          <p style={{ fontSize: 15, color: "#94A3B8", maxWidth: 440, margin: "0 auto", lineHeight: 1.6 }}>
            Enter the email you used at checkout to unlock your passes on this device. Works on any browser or phone.
          </p>
        </div>

        {/* ── How it works ── */}
        {!submittedEmail && (
          <div style={{ display: "flex", gap: 16, marginBottom: 32, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { step: "1", label: "Enter your purchase email", icon: "✉️" },
              { step: "2", label: "We find your passes instantly", icon: "🔍" },
              { step: "3", label: "Access restored on this device", icon: "✅" },
            ].map(s => (
              <div key={s.step} style={{ display: "flex", alignItems: "center", gap: 10, background: "#1E293B", border: "1px solid #334155", borderRadius: 12, padding: "10px 16px", flex: "1 1 160px", minWidth: 160 }}>
                <div className="step-badge" style={{ background: "#1D4ED8", color: "#fff" }}>{s.step}</div>
                <div>
                  <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.icon}</div>
                  <div style={{ fontSize: 12, color: "#CBD5E1", fontWeight: 600, marginTop: 2 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Email form ── */}
        <div className="account-card" style={{ padding: 28, marginBottom: 24 }}>
          <form onSubmit={handleSubmit}>
            <label htmlFor="restore-email" style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#CBD5E1", marginBottom: 8, letterSpacing: "0.02em" }}>
              Purchase email address
            </label>
            <div className="restore-form-row" style={{ display: "flex", gap: 10 }}>
              <input
                id="restore-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit(e as unknown as React.FormEvent)}
                placeholder="jane@example.com"
                autoComplete="email"
                style={{
                  flex: 1, background: "#0F172A", border: `1.5px solid ${emailError ? "#EF4444" : "#334155"}`,
                  borderRadius: 10, padding: "11px 16px", fontSize: 14, color: "#F1F5F9",
                  fontFamily: "inherit", outline: "none", transition: "border-color 0.15s",
                }}
                onFocus={e => (e.target.style.borderColor = "#3B82F6")}
                onBlur={e => (e.target.style.borderColor = emailError ? "#EF4444" : "#334155")}
              />
              <button
                type="submit"
                disabled={getPurchases.isFetching}
                style={{
                  padding: "11px 22px", borderRadius: 10, border: "none",
                  background: getPurchases.isFetching ? "#334155" : "linear-gradient(135deg, #1D4ED8, #0E7490)",
                  color: "#fff", fontSize: 13, fontWeight: 800, cursor: getPurchases.isFetching ? "not-allowed" : "pointer",
                  fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0,
                }}
              >
                {getPurchases.isFetching ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    Checking…
                  </span>
                ) : "Find My Passes →"}
              </button>
            </div>
            {emailError && (
              <p style={{ marginTop: 8, fontSize: 12, color: "#F87171", fontWeight: 600 }}>{emailError}</p>
            )}
          </form>

          {/* Trust signals */}
          <div style={{ display: "flex", gap: 20, marginTop: 18, flexWrap: "wrap" }}>
            {[
              { icon: "🔒", text: "Email is never stored in your browser" },
              { icon: "⚡", text: "Instant access — no login required" },
              { icon: "📱", text: "Works on any device or browser" },
            ].map(t => (
              <div key={t.text} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12 }}>{t.icon}</span>
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 500 }}>{t.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Loading skeleton ── */}
        {getPurchases.isFetching && (
          <div className="account-card" style={{ padding: 28 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "14px 0", borderBottom: i < 3 ? "1px solid #0F172A" : "none" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#334155", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 12, background: "#334155", borderRadius: 6, width: "60%", marginBottom: 8 }} />
                  <div style={{ height: 10, background: "#1E293B", borderRadius: 6, width: "40%" }} />
                </div>
                <div style={{ width: 80, height: 30, background: "#334155", borderRadius: 8 }} />
              </div>
            ))}
          </div>
        )}

        {/* ── Results ── */}
        {submittedEmail && !getPurchases.isFetching && (
          <>
            {hasPurchases ? (
              <>
                {/* Success banner */}
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 14,
                  background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.08))",
                  border: "1px solid #065F46", borderRadius: 16, padding: "18px 22px", marginBottom: 24,
                }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>✅</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: "#34D399", fontWeight: 800, fontSize: 14, margin: "0 0 4px" }}>
                      {unlockedExamTypes.length} pass{unlockedExamTypes.length !== 1 ? "es" : ""} restored for{" "}
                      <span style={{ color: "#6EE7B7" }}>{submittedEmail}</span>
                    </p>
                    <p style={{ color: "#6EE7B7", fontSize: 12, margin: 0, opacity: 0.8 }}>
                      Your passes are now active on this device. Bookmark this page to restore access again anytime.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(submittedEmail ?? "");
                      setCopiedEmail(true);
                      setTimeout(() => setCopiedEmail(false), 2000);
                    }}
                    title="Copy email"
                    style={{ background: "rgba(52,211,153,0.15)", border: "1px solid #065F46", borderRadius: 8, padding: "4px 10px", fontSize: 11, color: "#34D399", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
                  >
                    {copiedEmail ? "Copied!" : "📋 Copy email"}
                  </button>
                </div>

                {/* ── Active Subscriptions ── */}
                {(getSubscriptions.data?.subscriptions ?? []).length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, paddingLeft: 4 }}>
                      🔄 Active Annual Subscriptions
                    </div>
                    <div className="account-card" style={{ overflow: "hidden" }}>
                      {(getSubscriptions.data?.subscriptions ?? []).map((sub) => {
                        const renewalDate = new Date(sub.currentPeriodEnd).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
                        const tierLabel = {
                          "class1": "Class 1 All-Access",
                          "class2": "Class 2 All-Access",
                          "class3": "Class 3 All-Access",
                          "class4": "Class 4 All-Access",
                          "all-access": "All-Access Pass",
                        }[sub.tier] ?? sub.tier;
                        const provinceLabel = sub.province === "western" ? "Western Canada (WPI)" : "Ontario (EOCP)";
                        const daysLeft = Math.max(0, Math.ceil((new Date(sub.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                        return (
                          <div key={sub.id} style={{ padding: "20px 24px", borderBottom: "1px solid #0F172A" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                <div style={{ width: 46, height: 46, borderRadius: 12, background: "linear-gradient(135deg, #7C3AED, #4F46E5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🔑</div>
                                <div>
                                  <p style={{ color: "#F1F5F9", fontWeight: 800, fontSize: 14, margin: "0 0 3px" }}>{tierLabel}</p>
                                  <p style={{ color: "#94A3B8", fontSize: 12, margin: "0 0 4px" }}>{provinceLabel}</p>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                    <span style={{ fontSize: 11, color: "#22C55E", fontWeight: 700, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 6, padding: "2px 8px" }}>Active</span>
                                    <span style={{ fontSize: 11, color: "#94A3B8" }}>Renews {renewalDate}</span>
                                    <span style={{ fontSize: 11, color: daysLeft < 30 ? "#F59E0B" : "#64748B" }}>{daysLeft} days remaining</span>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={handleManageSubscription}
                                disabled={portalLoading}
                                style={{
                                  padding: "9px 18px", borderRadius: 10, border: "1.5px solid #7C3AED",
                                  background: portalLoading ? "#1E293B" : "rgba(124,58,237,0.12)",
                                  color: portalLoading ? "#64748B" : "#A78BFA",
                                  fontSize: 12, fontWeight: 700, cursor: portalLoading ? "not-allowed" : "pointer",
                                  fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0,
                                }}
                              >
                                {portalLoading ? "Opening..." : "Manage Subscription →"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      <div style={{ padding: "12px 24px", background: "rgba(124,58,237,0.06)", borderTop: "1px solid #1E293B" }}>
                        <p style={{ fontSize: 11, color: "#64748B", margin: 0 }}>
                          Your subscription unlocks all included exam types below. To cancel, update payment, or view invoices, click "Manage Subscription" above.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ontario passes */}
                {ontarioPasses.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, paddingLeft: 4 }}>
                      🍁 Ontario Certification Passes
                    </div>
                    <div className="account-card" style={{ overflow: "hidden" }}>
                      {ontarioPasses.map(examType => {
                        const meta = EXAM_META[examType];
                        if (!meta) return null;
                        return (
                          <div key={examType} className="pass-row">
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ width: 42, height: 42, borderRadius: 10, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                                {meta.icon}
                              </div>
                              <div>
                                <p style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 13, margin: "0 0 3px" }}>{meta.label}</p>
                                <p style={{ color: "#64748B", fontSize: 11, margin: 0 }}>Unlimited practice · AI Tutor · Mock Exam · Flashcards</p>
                              </div>
                            </div>
                            <div className="pass-actions">
                              <Link href={meta.quizPath}>
                                <span className="pass-btn" style={{ background: meta.color, color: "#fff" }}>Practice →</span>
                              </Link>
                              {meta.mockPath && (
                                <Link href={meta.mockPath}>
                                  <span className="pass-btn" style={{ background: "#1E293B", color: "#94A3B8", border: "1px solid #334155" }}>Mock Exam</span>
                                </Link>
                              )}
                              {meta.flashcardPath && (
                                <Link href={meta.flashcardPath}>
                                  <span className="pass-btn" style={{ background: "#1E3A5F", color: "#93C5FD" }}>🃏 Flashcards</span>
                                </Link>
                              )}
                              {meta.formulaPath && (
                                <Link href={meta.formulaPath}>
                                  <span className="pass-btn" style={{ background: "#064E3B", color: "#6EE7B7" }}>📐 Formulas</span>
                                </Link>
                              )}
                            </div>
                            {/* Mastery badge */}
                            {meta.flashcardPath && flashcardMastery[examType] && (
                              <div style={{ paddingLeft: 54, marginTop: 4 }}>
                                <MasteryBadge knownCount={flashcardMastery[examType].knownCount} totalCards={flashcardMastery[examType].totalCards} />
                              </div>
                            )}
                            {/* Exam date tracker */}
                            {submittedEmail && (
                              <div style={{ paddingLeft: 0, width: "100%" }}>
                                <ExamDateTracker
                                  email={submittedEmail}
                                  productKey={examType}
                                  productLabel={meta.label}
                                  color={meta.color}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* WPI passes */}
                {wpiPasses.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, paddingLeft: 4 }}>
                      🌊 WPI Certification Passes
                    </div>
                    <div className="account-card" style={{ overflow: "hidden" }}>
                      {wpiPasses.map(examType => {
                        const meta = EXAM_META[examType];
                        if (!meta) return null;
                        return (
                          <div key={examType} className="pass-row">
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ width: 42, height: 42, borderRadius: 10, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                                {meta.icon}
                              </div>
                              <div>
                                <p style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 13, margin: "0 0 3px" }}>{meta.label}</p>
                                <p style={{ color: "#64748B", fontSize: 11, margin: 0 }}>Unlimited practice · AI Tutor · Mock Exam · Flashcards</p>
                              </div>
                            </div>
                            <div className="pass-actions">
                              <Link href={meta.quizPath}>
                                <span className="pass-btn" style={{ background: meta.color, color: "#fff" }}>Practice →</span>
                              </Link>
                              {meta.mockPath && (
                                <Link href={meta.mockPath}>
                                  <span className="pass-btn" style={{ background: "#1E293B", color: "#94A3B8", border: "1px solid #334155" }}>Mock Exam</span>
                                </Link>
                              )}
                              {meta.flashcardPath && (
                                <Link href={meta.flashcardPath}>
                                  <span className="pass-btn" style={{ background: "#1E3A5F", color: "#93C5FD" }}>🃏 Flashcards</span>
                                </Link>
                              )}
                              {meta.formulaPath && (
                                <Link href={meta.formulaPath}>
                                  <span className="pass-btn" style={{ background: "#064E3B", color: "#6EE7B7" }}>📐 Formulas</span>
                                </Link>
                              )}
                            </div>
                            {/* Mastery badge */}
                            {meta.flashcardPath && flashcardMastery[examType] && (
                              <div style={{ paddingLeft: 54, marginTop: 4 }}>
                                <MasteryBadge knownCount={flashcardMastery[examType].knownCount} totalCards={flashcardMastery[examType].totalCards} />
                              </div>
                            )}
                            {/* Exam date tracker */}
                            {submittedEmail && (
                              <div style={{ paddingLeft: 0, width: "100%" }}>
                                <ExamDateTracker
                                  email={submittedEmail}
                                  productKey={examType}
                                  productLabel={meta.label}
                                  color={meta.color}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Unknown passes */}
                {otherPasses.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, paddingLeft: 4 }}>Other Passes</div>
                    <div className="account-card" style={{ overflow: "hidden" }}>
                      {otherPasses.map(examType => (
                        <div key={examType} className="pass-row">
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 42, height: 42, borderRadius: 10, background: "#1E293B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📋</div>
                            <div>
                              <p style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 13, margin: "0 0 3px" }}>{examType}</p>
                              <p style={{ color: "#64748B", fontSize: 11, margin: 0 }}>Active pass</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Purchase history */}
                {purchases.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, paddingLeft: 4 }}>
                      🧾 Purchase History
                    </div>
                    <div className="account-card" style={{ overflow: "hidden" }}>
                      <div style={{ padding: "10px 20px 6px", display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12 }}>
                        <span style={{ fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Product</span>
                        <span style={{ fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</span>
                        <span style={{ fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Amount</span>
                      </div>
                      {purchases.map((p, i) => {
                        const meta = EXAM_META[p.productKey];
                        return (
                          <div key={i} className="purchase-history-row">
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 14 }}>{meta?.icon ?? "📋"}</span>
                              <span style={{ fontSize: 12, color: "#CBD5E1", fontWeight: 600 }}>{meta?.label ?? p.productKey}</span>
                            </div>
                            <span style={{ fontSize: 11, color: "#64748B", whiteSpace: "nowrap" }}>{formatDate(p.createdAt)}</span>
                            <span style={{ fontSize: 12, color: "#34D399", fontWeight: 700, whiteSpace: "nowrap" }}>{formatCAD(p.amountCAD)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Device note */}
                <div style={{ textAlign: "center", padding: "16px 20px", background: "rgba(30,41,59,0.5)", borderRadius: 12, border: "1px solid #1E293B" }}>
                  <p style={{ fontSize: 12, color: "#475569", margin: "0 0 6px" }}>
                    💡 Access is saved to <strong style={{ color: "#64748B" }}>this browser only</strong>. Switching devices? Just re-enter your email here.
                  </p>
                  <button
                    onClick={() => { setSubmittedEmail(null); setEmail(submittedEmail ?? ""); setRestored(false); }}
                    style={{ fontSize: 11, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}
                  >
                    ← Use a different email
                  </button>
                </div>
              </>
            ) : (
              /* ── No purchases found ── */
              <div className="account-card" style={{ padding: 36, textAlign: "center" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#1E293B", border: "2px solid #334155", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 20px" }}>🔍</div>
                <h2 style={{ color: "#F1F5F9", fontWeight: 800, fontSize: 18, margin: "0 0 10px" }}>No purchases found</h2>
                <p style={{ color: "#64748B", fontSize: 13, margin: "0 0 8px", lineHeight: 1.6 }}>
                  We couldn't find any purchases for{" "}
                  <span style={{ color: "#CBD5E1", fontWeight: 700 }}>{submittedEmail}</span>.
                </p>
                <p style={{ color: "#475569", fontSize: 12, margin: "0 0 28px", lineHeight: 1.6 }}>
                  Make sure you're using the exact email you entered at checkout. Check your inbox for a Stripe receipt to confirm the address.
                </p>

                {/* Common reasons */}
                <div style={{ background: "#0F172A", borderRadius: 12, padding: "16px 20px", marginBottom: 24, textAlign: "left" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", margin: "0 0 10px" }}>Common reasons:</p>
                  {[
                    "You may have used a different email (e.g., work vs. personal)",
                    "The purchase was made under a different account",
                    "Check your Stripe receipt email for the exact address used",
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                      <span style={{ color: "#F59E0B", fontSize: 12, flexShrink: 0 }}>•</span>
                      <span style={{ fontSize: 12, color: "#64748B" }}>{r}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
                  <button
                    onClick={() => { setSubmittedEmail(null); setEmail(""); }}
                    style={{ padding: "11px 28px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #1D4ED8, #0E7490)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Try a different email
                  </button>
                  <Link href="/pricing">
                    <span style={{ fontSize: 12, color: "#3B82F6", fontWeight: 600, cursor: "pointer" }}>Browse Practice Passes →</span>
                  </Link>
                  <a href="mailto:support@echeloninstitute.ca?subject=Restore%20Access%20Help&body=Hi%2C%20I%20need%20help%20restoring%20access.%20My%20purchase%20email%20was%3A%20" style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>
                    Still stuck? Email support@echeloninstitute.ca
                  </a>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── First-time visitor prompt ── */}
        {!submittedEmail && (
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <p style={{ color: "#475569", fontSize: 13 }}>
              Don't have a pass yet?{" "}
              <Link href="/pricing">
                <span style={{ color: "#3B82F6", fontWeight: 700, cursor: "pointer" }}>Browse Practice Passes →</span>
              </Link>
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
