// Account.tsx — Restore Access / My Passes
// Design: Light theme — white cards, #F1F5F9 background, slate text (matches site)
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
  "class1-water-dist": { label: "Class 1 Water Distribution Pass", quizPath: "/class1-water-dist", mockPath: "/class1-water-dist-mock", flashcardPath: "/class1-water-dist-flashcards", color: "#0369A1", bg: "#F0F9FF", icon: "🔧", track: "Ontario" },
  "class2-water-dist": { label: "Class 2 Water Distribution Pass", quizPath: "/class2-water-dist", mockPath: "/class2-water-dist-mock", flashcardPath: "/class2-water-dist-flashcards", color: "#0E7490", bg: "#ECFEFF", icon: "🔧", track: "Ontario" },
  "class3-water-dist": { label: "Class 3 Water Distribution Pass", quizPath: "/class3-water-dist", mockPath: "/class3-water-dist-mock", flashcardPath: "/class3-water-dist-flashcards", color: "#1E40AF", bg: "#EFF6FF", icon: "🔧", track: "Ontario" },
  "class4-water-dist": { label: "Class 4 Water Distribution Pass", quizPath: "/class4-water-dist", mockPath: "/class4-water-dist-mock", flashcardPath: "/class4-water-dist-flashcards", color: "#4C1D95", bg: "#F5F3FF", icon: "🔧", track: "Ontario" },
  "class1-wastewater-coll": { label: "Class 1 Wastewater Collection Pass", quizPath: "/class1-wastewater-coll", mockPath: "/class1-wastewater-coll-mock", flashcardPath: "/class1-wastewater-coll-flashcards", color: "#065F46", bg: "#ECFDF5", icon: "🏗️", track: "Ontario" },
  "class2-wastewater-coll": { label: "Class 2 Wastewater Collection Pass", quizPath: "/class2-wastewater-coll", mockPath: "/class2-wastewater-coll-mock", flashcardPath: "/class2-wastewater-coll-flashcards", color: "#0F766E", bg: "#F0FDFA", icon: "🏗️", track: "Ontario" },
  "class3-wastewater-coll": { label: "Class 3 Wastewater Collection Pass", quizPath: "/class3-wastewater-coll", mockPath: "/class3-wastewater-coll-mock", flashcardPath: "/class3-wastewater-coll-flashcards", color: "#1D4ED8", bg: "#EFF6FF", icon: "🏗️", track: "Ontario" },
  "class4-wastewater-coll": { label: "Class 4 Wastewater Collection Pass", quizPath: "/class4-wastewater-coll", mockPath: "/class4-wastewater-coll-mock", flashcardPath: "/class4-wastewater-coll-flashcards", color: "#6D28D9", bg: "#F5F3FF", icon: "🏗️", track: "Ontario" },
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
  const color = pct >= 80 ? "#16a34a" : pct >= 50 ? "#d97706" : "#94a3b8";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color, fontWeight: 700 }}>
      <span style={{ display: "inline-block", width: 56, height: 4, borderRadius: 4, background: "#E2E8F0", overflow: "hidden" }}>
        <span style={{ display: "block", width: pct + "%", height: "100%", background: color, borderRadius: 4, transition: "width 0.4s ease" }} />
      </span>
      {knownCount}/{totalCards} cards mastered ({pct}%)
    </span>
  );
}

/** Write product keys + email to localStorage so PurchaseGate can verify access */
function restoreLocalStorage(email: string, productKeys: string[]) {
  try {
    localStorage.setItem("echelon_trial_email", email);
    localStorage.setItem("echelon_purchased_products", JSON.stringify(productKeys));
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

/** Magic Link section */
function MagicLinkSection({ email }: { email: string }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const requestMagicLink = trpc.magicLink.requestMagicLink.useMutation({
    onSuccess: () => {
      setSent(true);
      setSending(false);
      toast.success("Sign-in link sent!", { description: `Check ${email} for a magic link.` });
    },
    onError: (err) => {
      setSending(false);
      toast.error("Failed to send link", { description: err.message });
    },
  });

  const handleSend = () => {
    setSending(true);
    requestMagicLink.mutate({ email, origin: window.location.origin });
  };

  if (sent) {
    return (
      <div style={{
        background: "#EFF6FF", border: "1px solid #BFDBFE",
        borderRadius: 12, padding: "14px 20px", marginBottom: 24,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <span style={{ fontSize: 20 }}>📧</span>
        <div>
          <p style={{ color: "#1D4ED8", fontWeight: 700, fontSize: 13, margin: "0 0 2px" }}>Sign-in link sent!</p>
          <p style={{ color: "#64748B", fontSize: 12, margin: 0 }}>Check <strong style={{ color: "#1D4ED8" }}>{email}</strong> for a link that works on any device.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "#F8FAFC", border: "1px solid #E2E8F0",
      borderRadius: 12, padding: "14px 20px", marginBottom: 24,
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>🔗</span>
        <div>
          <p style={{ color: "#1E293B", fontWeight: 700, fontSize: 12, margin: "0 0 2px" }}>Need access on another device?</p>
          <p style={{ color: "#64748B", fontSize: 11, margin: 0 }}>We'll email you a one-click sign-in link.</p>
        </div>
      </div>
      <button
        onClick={handleSend}
        disabled={sending}
        style={{
          padding: "8px 16px", borderRadius: 8, border: "none",
          background: sending ? "#CBD5E1" : "linear-gradient(135deg, #1D4ED8, #0E7490)",
          color: "#fff", fontSize: 12, fontWeight: 700, cursor: sending ? "not-allowed" : "pointer",
          fontFamily: "inherit", whiteSpace: "nowrap",
        }}
      >
        {sending ? "Sending…" : "Send Sign-In Link →"}
      </button>
    </div>
  );
}

export default function Account() {
  usePageMeta({
    title: "My Passes — Echelon Institute",
    description: "Restore access to your Echelon Institute practice passes. Enter your purchase email to unlock your exams on any device.",
    keywords: "restore access, my passes, Echelon Institute account",
  });

  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem("echelon_subscription_email") ?? localStorage.getItem("echelon_trial_email") ?? "";
    } catch { return ""; }
  });
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(() => {
    try {
      return localStorage.getItem("echelon_subscription_email") ?? localStorage.getItem("echelon_trial_email") ?? null;
    } catch { return null; }
  });
  const [emailError, setEmailError] = useState("");
  const [restored, setRestored] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const { isAuthenticated, logout } = useAuth();

  const handleClearDeviceState = () => {
    try {
      localStorage.removeItem("echelon_trial_email");
      localStorage.removeItem("echelon_purchased_products");
      localStorage.removeItem("echelon_trial_unlocked");
      localStorage.removeItem("echelon_subscription_email");
      localStorage.removeItem("echelon_subscription_exam_types");
      localStorage.removeItem("echelon_access_token");
    } catch { /* ignore */ }
    setSubmittedEmail(null);
    setEmail("");
    setRestored(false);
    toast.success("Device state cleared", { description: "All saved access on this device has been removed." });
  };

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

  // FIX 1 (P0): Magic-link state for the restore-access flow.
  // We no longer look up purchases/subscriptions by email directly — that would
  // return tokens to anyone who knows a paying customer's email.
  // Instead, submitting an email triggers a magic link to that inbox; access is
  // only restored after the user clicks the link and proves inbox ownership.
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkSending, setMagicLinkSending] = useState(false);

  // Read ?next= param so we can show a helpful hint after magic link is sent
  const nextParam = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("next") ?? ""
    : "";

  const requestMagicLinkMutation = trpc.magicLink.requestMagicLink.useMutation({
    onSuccess: () => {
      setMagicLinkSent(true);
      setMagicLinkSending(false);
    },
    onError: (err) => {
      setMagicLinkSending(false);
      toast.error("Failed to send sign-in link", { description: err.message });
    },
  });

  const getFlashcardProgress = trpc.flashcard.getAllProgress.useQuery(
    { email: submittedEmail ?? "" },
    { enabled: !!submittedEmail && !!isAuthenticated, retry: false, staleTime: 30_000 }
  );
  const flashcardMastery = getFlashcardProgress.data?.progress ?? {};

  // Restore authenticated user's purchases to localStorage on load
  useEffect(() => {
    const data = getPurchases.data;
    if (data && data.purchases.length > 0 && !restored) {
      const keys = data.purchases.map((p) => p.productKey);
      const email = data.purchases[0] ? (submittedEmail ?? "") : "";
      if (email) restoreLocalStorage(email, keys);
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
    setRestored(false);
    setMagicLinkSent(false);
    setSubmittedEmail(trimmed);
    // FIX 1: Trigger magic-link immediately on submit — no email-only DB lookup
    setMagicLinkSending(true);
    requestMagicLinkMutation.mutate({ email: trimmed, origin: window.location.origin, next: nextParam || undefined });
  };

  const unlockedExamTypes = [
    ...(getPurchases.data?.unlockedExamTypes ?? []),
    ...(getSubscriptions.data?.unlockedExamTypes ?? []),
  ].filter((v, i, a) => a.indexOf(v) === i);
  const purchases = getPurchases.data?.purchases ?? [];
  const hasPurchases = unlockedExamTypes.length > 0;

  const ontarioPasses = unlockedExamTypes.filter(t => EXAM_META[t]?.track === "Ontario");
  const wpiPasses = unlockedExamTypes.filter(t => EXAM_META[t]?.track === "WPI");
  const otherPasses = unlockedExamTypes.filter(t => !EXAM_META[t]);

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", background: "#F1F5F9", minHeight: "100vh" }}>
      <SiteNav currentPath="/account" />

      <style>{`
        .account-page { max-width: 680px; margin: 0 auto; padding: 48px 24px 120px; }
        .account-card { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
        .pass-row { display: flex; flex-direction: column; gap: 10px; padding: 16px 20px; border-bottom: 1px solid #F1F5F9; }
        .pass-row-main { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; }
        .pass-row:last-child { border-bottom: none; }
        .pass-actions { display: flex; gap: 8px; flex-shrink: 0; }
        .pass-btn { padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; border: none; cursor: pointer; font-family: inherit; text-decoration: none; display: inline-block; white-space: nowrap; }
        .purchase-history-row { display: grid; grid-template-columns: 1fr auto auto; gap: 12px; align-items: center; padding: 12px 20px; border-bottom: 1px solid #F1F5F9; }
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

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <img src={LOGO_URL} alt="Echelon Institute" style={{ height: 52, width: "auto", marginBottom: 20 }} />
          <h1 style={{ fontSize: 30, fontWeight: 900, color: "#0F172A", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
            {isAuthenticated ? "My Account" : "Restore Access"}
          </h1>
          <p style={{ fontSize: 15, color: "#64748B", maxWidth: 440, margin: "0 auto", lineHeight: 1.6 }}>
            {isAuthenticated
              ? "View your active passes, subscriptions, and team seats. Manage your account below."
              : "Enter the email you used at checkout to unlock your passes on this device. Works on any browser or phone."}
          </p>
        </div>

        {/* How it works */}
        {!submittedEmail && (
          <div style={{ display: "flex", gap: 16, marginBottom: 32, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { step: "1", label: "Enter your purchase email", icon: "✉️" },
              { step: "2", label: "We find your passes instantly", icon: "🔍" },
              { step: "3", label: "Access restored on this device", icon: "✅" },
            ].map(s => (
              <div key={s.step} style={{ display: "flex", alignItems: "center", gap: 10, background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "10px 16px", flex: "1 1 160px", minWidth: 160, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div className="step-badge" style={{ background: "#1D4ED8", color: "#fff" }}>{s.step}</div>
                <div>
                  <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.icon}</div>
                  <div style={{ fontSize: 12, color: "#334155", fontWeight: 600, marginTop: 2 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Email form */}
        <div className="account-card" style={{ padding: 28, marginBottom: 24 }}>
          <form onSubmit={handleSubmit}>
            <label htmlFor="restore-email" style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 8, letterSpacing: "0.02em" }}>
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
                  flex: 1, background: "#F8FAFC", border: `1.5px solid ${emailError ? "#EF4444" : "#CBD5E1"}`,
                  borderRadius: 10, padding: "11px 16px", fontSize: 14, color: "#0F172A",
                  fontFamily: "inherit", outline: "none", transition: "border-color 0.15s",
                }}
                onFocus={e => (e.target.style.borderColor = "#3B82F6")}
                onBlur={e => (e.target.style.borderColor = emailError ? "#EF4444" : "#CBD5E1")}
              />
              <button
                type="submit"
                disabled={magicLinkSending}
                style={{
                  padding: "11px 22px", borderRadius: 10, border: "none",
                  background: magicLinkSending ? "#CBD5E1" : "linear-gradient(135deg, #1D4ED8, #0E7490)",
                  color: "#fff", fontSize: 13, fontWeight: 800, cursor: magicLinkSending ? "not-allowed" : "pointer",
                  fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0,
                }}
              >
                {magicLinkSending ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    Sending…
                  </span>
                ) : "Send Sign-In Link →"}
              </button>
            </div>
            {emailError && (
              <p style={{ marginTop: 8, fontSize: 12, color: "#EF4444", fontWeight: 600 }}>{emailError}</p>
            )}
          </form>

          {/* Trust signals */}
          <div style={{ display: "flex", gap: 20, marginTop: 18, flexWrap: "wrap" }}>
            {[
              { icon: "🔒", text: "Inbox-verified — only you can restore access" },
              { icon: "📧", text: "Sign-in link sent to your email" },
              { icon: "📱", text: "Works on any device or browser" },
            ].map(t => (
              <div key={t.text} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12 }}>{t.icon}</span>
                <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500 }}>{t.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Magic-link sent confirmation (unauthenticated restore flow) */}
        {submittedEmail && !isAuthenticated && magicLinkSent && (
          <div className="account-card" style={{ padding: 28, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#EFF6FF", border: "2px solid #BFDBFE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 20px" }}>📧</div>
            <h2 style={{ color: "#1D4ED8", fontWeight: 800, fontSize: 18, margin: "0 0 10px" }}>Check your inbox</h2>
            <p style={{ color: "#334155", fontSize: 13, margin: "0 0 8px", lineHeight: 1.6 }}>
              If an account exists for <strong style={{ color: "#1D4ED8" }}>{submittedEmail}</strong>, we've sent a sign-in link.
            </p>
            <p style={{ color: "#64748B", fontSize: 12, margin: "0 0 24px", lineHeight: 1.6 }}>
              Click the link in your email to restore access on this device. The link expires in 30 minutes.
              {nextParam && (
                <span> After signing in, you'll be taken to <strong style={{ color: "#1D4ED8" }}>{nextParam}</strong>.</span>
              )}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
              <button
                onClick={() => { setMagicLinkSending(true); requestMagicLinkMutation.mutate({ email: submittedEmail, origin: window.location.origin, next: nextParam || undefined }); }}
                disabled={magicLinkSending}
                style={{ padding: "10px 24px", borderRadius: 9, border: "1.5px solid #BFDBFE", background: "#EFF6FF", color: "#1D4ED8", fontSize: 12, fontWeight: 700, cursor: magicLinkSending ? "not-allowed" : "pointer", fontFamily: "inherit" }}
              >
                {magicLinkSending ? "Sending…" : "Resend link"}
              </button>
              <button
                onClick={() => { setSubmittedEmail(null); setEmail(""); setMagicLinkSent(false); }}
                style={{ fontSize: 11, color: "#94A3B8", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}
              >
                ← Use a different email
              </button>
            </div>
          </div>
        )}

        {/* Results — only shown for authenticated users (who have proven inbox ownership) */}
        {isAuthenticated && submittedEmail && !getPurchases.isFetching && (
          <>
            {hasPurchases ? (
              <>
                {/* Success banner */}
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 14,
                  background: "#F0FDF4", border: "1px solid #BBF7D0",
                  borderRadius: 16, padding: "18px 22px", marginBottom: 24,
                }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>✅</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: "#15803D", fontWeight: 800, fontSize: 14, margin: "0 0 4px" }}>
                      {unlockedExamTypes.length} pass{unlockedExamTypes.length !== 1 ? "es" : ""} restored for{" "}
                      <span style={{ color: "#166534" }}>{submittedEmail}</span>
                    </p>
                    <p style={{ color: "#4ADE80", fontSize: 12, margin: 0, opacity: 0.9 }}>
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
                    style={{ background: "#DCFCE7", border: "1px solid #BBF7D0", borderRadius: 8, padding: "4px 10px", fontSize: 11, color: "#15803D", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
                  >
                    {copiedEmail ? "Copied!" : "📋 Copy email"}
                  </button>
                </div>

                {/* Sign-in link option for other devices */}
                <MagicLinkSection email={submittedEmail ?? ""} />

                {/* Active Subscriptions */}
                {(getSubscriptions.data?.subscriptions ?? []).length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, paddingLeft: 4 }}>
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
                          <div key={sub.id} style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                <div style={{ width: 46, height: 46, borderRadius: 12, background: "linear-gradient(135deg, #7C3AED, #4F46E5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🔑</div>
                                <div>
                                  <p style={{ color: "#0F172A", fontWeight: 800, fontSize: 14, margin: "0 0 3px" }}>{tierLabel}</p>
                                  <p style={{ color: "#64748B", fontSize: 12, margin: "0 0 4px" }}>{provinceLabel}</p>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                    <span style={{ fontSize: 11, color: "#15803D", fontWeight: 700, background: "#DCFCE7", border: "1px solid #BBF7D0", borderRadius: 6, padding: "2px 8px" }}>Active</span>
                                    <span style={{ fontSize: 11, color: "#94A3B8" }}>Renews {renewalDate}</span>
                                    <span style={{ fontSize: 11, color: daysLeft < 30 ? "#D97706" : "#94A3B8" }}>{daysLeft} days remaining</span>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={handleManageSubscription}
                                disabled={portalLoading}
                                style={{
                                  padding: "9px 18px", borderRadius: 10, border: "1.5px solid #7C3AED",
                                  background: portalLoading ? "#F1F5F9" : "#F5F3FF",
                                  color: portalLoading ? "#94A3B8" : "#7C3AED",
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
                      <div style={{ padding: "12px 24px", background: "#FAFAFA", borderTop: "1px solid #F1F5F9" }}>
                        <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>
                          Your subscription unlocks all included exam types below. To cancel, update payment, or view invoices, click "Manage Subscription" above.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ontario passes */}
                {ontarioPasses.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, paddingLeft: 4 }}>
                      🍁 Ontario Certification Passes
                    </div>
                    <div className="account-card" style={{ overflow: "hidden" }}>
                      {ontarioPasses.map(examType => {
                        const meta = EXAM_META[examType];
                        if (!meta) return null;
                        return (
                          <div key={examType} className="pass-row">
                            <div className="pass-row-main">
                              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ width: 42, height: 42, borderRadius: 10, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                                  {meta.icon}
                                </div>
                                <div>
                                  <p style={{ color: "#0F172A", fontWeight: 700, fontSize: 13, margin: "0 0 3px" }}>{meta.label}</p>
                                  <p style={{ color: "#94A3B8", fontSize: 11, margin: 0 }}>Unlimited practice · AI Tutor · Mock Exam · Flashcards</p>
                                </div>
                              </div>
                              <div className="pass-actions">
                                <Link href={meta.quizPath}>
                                  <span className="pass-btn" style={{ background: meta.color, color: "#fff" }}>Practice →</span>
                                </Link>
                                {meta.mockPath && (
                                  <Link href={meta.mockPath}>
                                    <span className="pass-btn" style={{ background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0" }}>Mock Exam</span>
                                  </Link>
                                )}
                                {meta.flashcardPath && (
                                  <Link href={meta.flashcardPath}>
                                    <span className="pass-btn" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>🃏 Flashcards</span>
                                  </Link>
                                )}
                                {meta.formulaPath && (
                                  <Link href={meta.formulaPath}>
                                    <span className="pass-btn" style={{ background: "#F0FDF4", color: "#15803D" }}>📐 Formulas</span>
                                  </Link>
                                )}
                              </div>
                            </div>
                            {meta.flashcardPath && flashcardMastery[examType] && (
                              <div style={{ paddingLeft: 54 }}>
                                <MasteryBadge knownCount={flashcardMastery[examType].knownCount} totalCards={flashcardMastery[examType].totalCards} />
                              </div>
                            )}
                            {submittedEmail && (
                              <ExamDateTracker
                                email={submittedEmail}
                                productKey={examType}
                                productLabel={meta.label}
                                color={meta.color}
                              />
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
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, paddingLeft: 4 }}>
                      🌊 WPI Certification Passes
                    </div>
                    <div className="account-card" style={{ overflow: "hidden" }}>
                      {wpiPasses.map(examType => {
                        const meta = EXAM_META[examType];
                        if (!meta) return null;
                        return (
                          <div key={examType} className="pass-row">
                            <div className="pass-row-main">
                              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ width: 42, height: 42, borderRadius: 10, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                                  {meta.icon}
                                </div>
                                <div>
                                  <p style={{ color: "#0F172A", fontWeight: 700, fontSize: 13, margin: "0 0 3px" }}>{meta.label}</p>
                                  <p style={{ color: "#94A3B8", fontSize: 11, margin: 0 }}>Unlimited practice · AI Tutor · Mock Exam · Flashcards</p>
                                </div>
                              </div>
                              <div className="pass-actions">
                                <Link href={meta.quizPath}>
                                  <span className="pass-btn" style={{ background: meta.color, color: "#fff" }}>Practice →</span>
                                </Link>
                                {meta.mockPath && (
                                  <Link href={meta.mockPath}>
                                    <span className="pass-btn" style={{ background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0" }}>Mock Exam</span>
                                  </Link>
                                )}
                                {meta.flashcardPath && (
                                  <Link href={meta.flashcardPath}>
                                    <span className="pass-btn" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>🃏 Flashcards</span>
                                  </Link>
                                )}
                                {meta.formulaPath && (
                                  <Link href={meta.formulaPath}>
                                    <span className="pass-btn" style={{ background: "#F0FDF4", color: "#15803D" }}>📐 Formulas</span>
                                  </Link>
                                )}
                              </div>
                            </div>
                            {meta.flashcardPath && flashcardMastery[examType] && (
                              <div style={{ paddingLeft: 54 }}>
                                <MasteryBadge knownCount={flashcardMastery[examType].knownCount} totalCards={flashcardMastery[examType].totalCards} />
                              </div>
                            )}
                            {submittedEmail && (
                              <ExamDateTracker
                                email={submittedEmail}
                                productKey={examType}
                                productLabel={meta.label}
                                color={meta.color}
                              />
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
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, paddingLeft: 4 }}>Other Passes</div>
                    <div className="account-card" style={{ overflow: "hidden" }}>
                      {otherPasses.map(examType => (
                        <div key={examType} className="pass-row">
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 42, height: 42, borderRadius: 10, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📋</div>
                            <div>
                              <p style={{ color: "#0F172A", fontWeight: 700, fontSize: 13, margin: "0 0 3px" }}>{examType}</p>
                              <p style={{ color: "#94A3B8", fontSize: 11, margin: 0 }}>Active pass</p>
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
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, paddingLeft: 4 }}>
                      🧾 Purchase History
                    </div>
                    <div className="account-card" style={{ overflow: "hidden" }}>
                      <div style={{ padding: "10px 20px 6px", display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12 }}>
                        <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Product</span>
                        <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</span>
                        <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Amount</span>
                      </div>
                      {purchases.map((p, i) => {
                        const meta = EXAM_META[p.productKey];
                        return (
                          <div key={i} className="purchase-history-row">
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 14 }}>{meta?.icon ?? "📋"}</span>
                              <span style={{ fontSize: 12, color: "#334155", fontWeight: 600 }}>{meta?.label ?? p.productKey}</span>
                            </div>
                            <span style={{ fontSize: 11, color: "#94A3B8", whiteSpace: "nowrap" }}>{formatDate(p.createdAt)}</span>
                            <span style={{ fontSize: 12, color: "#15803D", fontWeight: 700, whiteSpace: "nowrap" }}>{formatCAD(p.amountCAD)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Device note */}
                <div style={{ textAlign: "center", padding: "16px 20px", background: "#FFFFFF", borderRadius: 12, border: "1px solid #E2E8F0" }}>
                  <p style={{ fontSize: 12, color: "#94A3B8", margin: "0 0 6px" }}>
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
              /* No purchases found */
              <div className="account-card" style={{ padding: 36, textAlign: "center" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#F1F5F9", border: "2px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 20px" }}>🔍</div>
                <h2 style={{ color: "#0F172A", fontWeight: 800, fontSize: 18, margin: "0 0 10px" }}>No purchases found</h2>
                <p style={{ color: "#64748B", fontSize: 13, margin: "0 0 8px", lineHeight: 1.6 }}>
                  We couldn't find any purchases for{" "}
                  <span style={{ color: "#334155", fontWeight: 700 }}>{submittedEmail}</span>.
                </p>
                <p style={{ color: "#94A3B8", fontSize: 12, margin: "0 0 28px", lineHeight: 1.6 }}>
                  Make sure you're using the exact email you entered at checkout. Check your inbox for a Stripe receipt to confirm the address.
                </p>

                <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "16px 20px", marginBottom: 24, textAlign: "left", border: "1px solid #E2E8F0" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#64748B", margin: "0 0 10px" }}>Common reasons:</p>
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
                  <a href="mailto:support@echeloninstitute.ca?subject=Restore%20Access%20Help&body=Hi%2C%20I%20need%20help%20restoring%20access.%20My%20purchase%20email%20was%3A%20" style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500 }}>
                    Still stuck? Email support@echeloninstitute.ca
                  </a>
                </div>
              </div>
            )}
          </>
        )}

        {/* First-time visitor prompt */}
        {!submittedEmail && (
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <p style={{ color: "#94A3B8", fontSize: 13 }}>
              Don't have a pass yet?{" "}
              <Link href="/pricing">
                <span style={{ color: "#3B82F6", fontWeight: 700, cursor: "pointer" }}>Browse Practice Passes →</span>
              </Link>
            </p>
          </div>
        )}

        {/* Clear device state / sign out */}
        <div style={{ marginTop: 40, borderTop: "1px solid #E2E8F0", paddingTop: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <p style={{ fontSize: 12, color: "#94A3B8", margin: 0, textAlign: "center" }}>
            Using a shared or public device? Clear all saved access from this browser.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={handleClearDeviceState}
              style={{
                padding: "9px 18px", borderRadius: 9, border: "1.5px solid #E2E8F0",
                background: "#fff", color: "#64748B", fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              🗑️ Clear Device State
            </button>
            {isAuthenticated && (
              <button
                onClick={() => logout()}
                style={{
                  padding: "9px 18px", borderRadius: 9, border: "1.5px solid #E2E8F0",
                  background: "#fff", color: "#EF4444", fontSize: 12, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Sign Out
              </button>
            )}
          </div>
          <a
            href="mailto:support@echeloninstitute.ca?subject=Account%20Help"
            style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500 }}
          >
            Need help? Contact support@echeloninstitute.ca
          </a>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
