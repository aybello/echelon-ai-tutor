// ADMIN DASHBOARD — /admin
// Gated to role === 'admin'. Shows trial emails, waitlist signups, and error reports.

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";

type Tab = "trials" | "waitlist" | "errors" | "scores" | "revenue" | "health" | "feedback";

const EXAM_TYPE_LABELS: Record<string, string> = {
  // OIT
  oit: "OIT Water",
  "oit-ww": "OIT Wastewater",
  // Ontario Class 1–4 Water
  "class1-water": "Class 1 Water",
  "class2-water": "Class 2 Water",
  "class3-water": "Class 3 Water",
  "class4-water": "Class 4 Water",
  // Ontario Class 1–4 Wastewater
  "class1-ww": "Class 1 Wastewater",
  "class2-ww": "Class 2 Wastewater",
  "class3-ww": "Class 3 Wastewater",
  "class4-ww": "Class 4 Wastewater",
  // Legacy
  class1: "Class 1 (Legacy)",
  // WQA
  wqa: "WQA",
  // WPI Water Treatment
  "wpi-class1-water": "WPI Class I Water",
  "wpi-class2-water": "WPI Class II Water",
  "wpi-class3-water": "WPI Class III Water",
  "wpi-class4-water": "WPI Class IV Water",
  // WPI Wastewater
  "wpi-class1-wastewater": "WPI Class I Wastewater",
  "wpi-class2-wastewater": "WPI Class II Wastewater",
  "wpi-class3-wastewater": "WPI Class III Wastewater",
  "wpi-class4-wastewater": "WPI Class IV Wastewater",
  // WPI Distribution
  "wpi-class1-water-dist": "WPI Class I Distribution",
  "wpi-class2-water-dist": "WPI Class II Distribution",
  "wpi-class3-water-dist": "WPI Class III Distribution",
  "wpi-class4-water-dist": "WPI Class IV Distribution",
  // WPI Collection
  "wpi-class1-water-coll": "WPI Class I Collection",
  "wpi-class2-water-coll": "WPI Class II Collection",
  "wpi-class3-water-coll": "WPI Class III Collection",
  "wpi-class4-water-coll": "WPI Class IV Collection",
};

const EXAM_TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  oit: { bg: "#DBEAFE", color: "#1D4ED8" },
  "oit-ww": { bg: "#CCFBF1", color: "#0F766E" },
  "class1-water": { bg: "#DCFCE7", color: "#15803D" },
  "class2-water": { bg: "#DCFCE7", color: "#15803D" },
  "class3-water": { bg: "#DCFCE7", color: "#15803D" },
  "class4-water": { bg: "#DCFCE7", color: "#15803D" },
  "class1-ww": { bg: "#CCFBF1", color: "#0F766E" },
  "class2-ww": { bg: "#CCFBF1", color: "#0F766E" },
  "class3-ww": { bg: "#CCFBF1", color: "#0F766E" },
  "class4-ww": { bg: "#CCFBF1", color: "#0F766E" },
  class1: { bg: "#F1F5F9", color: "#475569" },
  wqa: { bg: "#EDE9FE", color: "#6D28D9" },
  "wpi-class1-water": { bg: "#FEF9C3", color: "#A16207" },
  "wpi-class2-water": { bg: "#FEF9C3", color: "#A16207" },
  "wpi-class3-water": { bg: "#FEF9C3", color: "#A16207" },
  "wpi-class4-water": { bg: "#FEF9C3", color: "#A16207" },
  "wpi-class1-wastewater": { bg: "#FFEDD5", color: "#C2410C" },
  "wpi-class2-wastewater": { bg: "#FFEDD5", color: "#C2410C" },
  "wpi-class3-wastewater": { bg: "#FFEDD5", color: "#C2410C" },
  "wpi-class4-wastewater": { bg: "#FFEDD5", color: "#C2410C" },
  "wpi-class1-water-dist": { bg: "#E0F2FE", color: "#0369A1" },
  "wpi-class2-water-dist": { bg: "#E0F2FE", color: "#0369A1" },
  "wpi-class3-water-dist": { bg: "#E0F2FE", color: "#0369A1" },
  "wpi-class4-water-dist": { bg: "#E0F2FE", color: "#0369A1" },
  "wpi-class1-water-coll": { bg: "#FEE2E2", color: "#B91C1C" },
  "wpi-class2-water-coll": { bg: "#FEE2E2", color: "#B91C1C" },
  "wpi-class3-water-coll": { bg: "#FEE2E2", color: "#B91C1C" },
  "wpi-class4-water-coll": { bg: "#FEE2E2", color: "#B91C1C" },
};

const REPORT_TYPE_LABELS: Record<string, string> = {
  wrong_answer: "Wrong Answer",
  wrong_calculation: "Wrong Calculation",
  unclear_question: "Unclear Question",
  other: "Other",
};

const REPORT_TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  wrong_answer: { bg: "#FEE2E2", color: "#B91C1C" },
  wrong_calculation: { bg: "#FFEDD5", color: "#C2410C" },
  unclear_question: { bg: "#FEF9C3", color: "#A16207" },
  other: { bg: "#F1F5F9", color: "#475569" },
};

function formatDate(d: Date | string) {
  return new Date(d).toLocaleString("en-CA", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function Admin() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("revenue");
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  // Data queries
  const stats = trpc.admin.stats.useQuery(undefined, { enabled: user?.role === "admin" });
  const trialsQ = trpc.admin.getTrialEmails.useQuery({ limit: 200 }, { enabled: user?.role === "admin" && activeTab === "trials" });
  const waitlistQ = trpc.admin.getWaitlist.useQuery({ limit: 200 }, { enabled: user?.role === "admin" && activeTab === "waitlist" });
  const errorsQ = trpc.admin.getErrorReports.useQuery({ limit: 200 }, { enabled: user?.role === "admin" && activeTab === "errors" });
  const scoresQ = trpc.admin.getScoreHistory.useQuery({ limit: 500, examType: "all" }, { enabled: user?.role === "admin" && activeTab === "scores" });
  const purchasesQ = trpc.admin.getPurchases.useQuery({ limit: 500 }, { enabled: user?.role === "admin" && activeTab === "revenue" });
  const healthQ = trpc.admin.getSystemHealth.useQuery(undefined, { enabled: user?.role === "admin" && activeTab === "health", refetchInterval: 60_000 });
  const feedbackQ = trpc.admin.getFeedback.useQuery({ limit: 200 }, { enabled: user?.role === "admin" && activeTab === "feedback" });
  const reconcile = trpc.admin.reconcilePurchases.useMutation({
    onSuccess: (data) => {
      purchasesQ.refetch();
      if (data.recovered > 0) {
        alert(`Reconciliation complete. Recovered ${data.recovered} missing purchase(s): ${data.details.map((d: any) => `${d.email} -> ${d.productKey}`).join(", ")}`);
      } else {
        alert("All purchases are already in sync. No missing records found.");
      }
    },
    onError: (err) => alert(`Reconciliation failed: ${err.message}`),
  });

  const utils = trpc.useUtils();

  const dismissError = trpc.admin.dismissErrorReport.useMutation({
    onSuccess: () => utils.admin.getErrorReports.invalidate(),
  });
  const removeWaitlist = trpc.admin.removeWaitlistEntry.useMutation({
    onSuccess: () => { utils.admin.getWaitlist.invalidate(); utils.admin.stats.invalidate(); },
  });
  const dismissFeedback = trpc.admin.dismissFeedback.useMutation({
    onSuccess: () => { utils.admin.getFeedback.invalidate(); utils.admin.stats.invalidate(); },
  });

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 1500);
  };

  const copyAllEmails = (emails: string[]) => {
    navigator.clipboard.writeText(emails.join("\n"));
    setCopiedEmail("__all__");
    setTimeout(() => setCopiedEmail(null), 1500);
  };

  const downloadCSV = (rows: Record<string, unknown>[], filename: string) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(","),
      ...rows.map(row =>
        headers.map(h => {
          const val = String(row[h] ?? "");
          return val.includes(",") || val.includes('"') || val.includes("\n")
            ? `"${val.replace(/"/g, '""')}"`
            : val;
        }).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Auth gate ──
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#94A3B8", fontFamily: "'Sora', sans-serif", fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Sora', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <div style={{ color: "#F1F5F9", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Sign in required</div>
          <a href={getLoginUrl()} style={{ color: "#38BDF8", fontSize: 14 }}>Sign in →</a>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div style={{ minHeight: "100vh", background: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Sora', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⛔</div>
          <div style={{ color: "#F1F5F9", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Admin access only</div>
          <div style={{ color: "#94A3B8", fontSize: 13, marginBottom: 20 }}>Your account ({user.email ?? user.name}) does not have admin privileges.</div>
          <Link href="/"><button style={{ padding: "10px 24px", borderRadius: 20, border: "none", background: "#1D4ED8", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>← Back to Home</button></Link>
        </div>
      </div>
    );
  }

  // ── Dashboard ──
  const statItems = [
    { label: "Total Revenue", value: stats.data?.totalRevenueCAD != null ? `CA$${stats.data.totalRevenueCAD.toFixed(2)}` : "—", icon: "💰", color: "#34D399", tab: "revenue" as Tab },
    { label: "Purchases", value: stats.data?.purchaseCount ?? "—", icon: "🛒", color: "#38BDF8", tab: "revenue" as Tab },
    { label: "Trial Signups", value: stats.data?.trialCount ?? "—", icon: "📧", color: "#A78BFA", tab: "trials" as Tab },
    { label: "Error Reports", value: stats.data?.errorCount ?? "—", icon: "🐛", color: "#F87171", tab: "errors" as Tab },
    { label: "Feedback", value: stats.data ? `${stats.data.feedbackCount} (★${stats.data.avgRating})` : "—", icon: "💬", color: "#FBBF24", tab: "feedback" as Tab },
  ];

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "revenue", label: "Revenue", icon: "💰" },
    { id: "trials", label: "Trial Emails", icon: "📧" },
    { id: "waitlist", label: "Waitlist", icon: "📋" },
    { id: "errors", label: "Error Reports", icon: "🐛" },
    { id: "scores", label: "Score History", icon: "📊" },
    { id: "feedback", label: "Feedback", icon: "💬" },
    { id: "health", label: "System Health", icon: "🩺" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0F172A", fontFamily: "'Sora', sans-serif", color: "#F1F5F9" }}>
      <style>{`
        .admin-row:hover { background: rgba(255,255,255,0.04) !important; }
        .admin-btn:hover { opacity: 0.8; }
        @media (max-width: 640px) {
          .admin-stats { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .admin-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .admin-tab-bar { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; scrollbar-width: none !important; }
          .admin-tab-bar::-webkit-scrollbar { display: none !important; }
          .admin-tab-bar button { white-space: nowrap !important; flex-shrink: 0 !important; flex: 0 0 auto !important; font-size: 11px !important; padding: 8px 10px !important; }
          .admin-top-bar { padding: 10px 14px !important; }
          .admin-signed-in { display: none !important; }
        }
      `}</style>

      {/* Top bar */}
      <div className="admin-top-bar" style={{ background: "#1E293B", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #1D4ED8, #0F766E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800 }}>E</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#F1F5F9" }}>ECHELON ADMIN</div>
            <div style={{ fontSize: 10, color: "#64748B" }}>Internal dashboard</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span className="admin-signed-in" style={{ fontSize: 12, color: "#64748B" }}>Signed in as <strong style={{ color: "#94A3B8" }}>{user.name ?? user.email}</strong></span>
          <Link href="/"><button className="admin-btn" style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#94A3B8", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>← Site</button></Link>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px 80px" }}>
        {/* Page header */}
        <div className="admin-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, marginBottom: 4 }}>Admin Dashboard</h1>
            <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>Trial signups, waitlist entries, and question error reports</p>
          </div>
          <button
            className="admin-btn"
            onClick={() => { stats.refetch(); trialsQ.refetch(); waitlistQ.refetch(); errorsQ.refetch(); scoresQ.refetch(); }}
            style={{ padding: "8px 16px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#94A3B8", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
          >
            ↻ Refresh
          </button>
        </div>

        {/* Stats cards */}
        <div className="admin-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
          {statItems.map(s => (
            <button
              key={s.tab}
              onClick={() => setActiveTab(s.tab)}
              style={{
                background: activeTab === s.tab ? "rgba(255,255,255,0.06)" : "#1E293B",
                border: `1.5px solid ${activeTab === s.tab ? s.color + "60" : "rgba(255,255,255,0.06)"}`,
                borderRadius: 16, padding: "20px 24px", textAlign: "left",
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: s.color, marginBottom: 2 }}>
                {stats.isLoading ? "…" : String(s.value)}
              </div>
              <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>{s.label}</div>
            </button>
          ))}
        </div>

        {/* Tab bar */}
        <div className="admin-tab-bar" style={{ display: "flex", gap: 4, marginBottom: 16, background: "#1E293B", borderRadius: 12, padding: 4 }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: "9px 12px", borderRadius: 8, border: "none",
                background: activeTab === tab.id ? "#334155" : "transparent",
                color: activeTab === tab.id ? "#F1F5F9" : "#64748B",
                fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── TRIAL EMAILS TAB ── */}
        {activeTab === "trials" && (
          <div style={{ background: "#1E293B", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                📧 Trial Email Signups
                {trialsQ.data && <span style={{ marginLeft: 8, fontSize: 11, color: "#64748B", fontWeight: 400 }}>{trialsQ.data.length} total</span>}
              </div>
              {trialsQ.data && trialsQ.data.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    className="admin-btn"
                    onClick={() => copyAllEmails(trialsQ.data!.map(r => r.email))}
                    style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#38BDF8", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    {copiedEmail === "__all__" ? "✓ Copied!" : "📋 Copy All Emails"}
                  </button>
                  <button
                    className="admin-btn"
                    onClick={() => downloadCSV(
                      trialsQ.data!.map(r => ({ email: r.email, source: r.source, signed_up: new Date(r.createdAt).toISOString() })),
                      `echelon-trial-emails-${new Date().toISOString().slice(0,10)}.csv`
                    )}
                    style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#A78BFA", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    ⬇ Download CSV
                  </button>
                </div>
              )}
            </div>
            {trialsQ.isLoading && <div style={{ padding: 32, textAlign: "center", color: "#64748B", fontSize: 13 }}>Loading…</div>}
            {trialsQ.data && trialsQ.data.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "#475569", fontSize: 13 }}>No trial signups yet.</div>
            )}
            {trialsQ.data && trialsQ.data.length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                    {["#", "Email", "Source", "Date"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                    <th style={{ padding: "10px 16px" }} />
                  </tr>
                </thead>
                <tbody>
                  {trialsQ.data.map((row, i) => (
                    <tr key={row.id} className="admin-row" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "12px 16px", fontSize: 11, color: "#475569" }}>{i + 1}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#E2E8F0" }}>{row.email}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 100, background: "#1D4ED820", color: "#38BDF8", fontSize: 10, fontWeight: 700 }}>{row.source}</span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 11, color: "#64748B" }}>{formatDate(row.createdAt)}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <button
                          className="admin-btn"
                          onClick={() => copyEmail(row.email)}
                          style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#64748B", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          {copiedEmail === row.email ? "✓" : "Copy"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── WAITLIST TAB ── */}
        {activeTab === "waitlist" && (
          <div style={{ background: "#1E293B", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                📋 Waitlist Signups
                {waitlistQ.data && <span style={{ marginLeft: 8, fontSize: 11, color: "#64748B", fontWeight: 400 }}>{waitlistQ.data.length} total</span>}
              </div>
              {waitlistQ.data && waitlistQ.data.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    className="admin-btn"
                    onClick={() => copyAllEmails(waitlistQ.data!.map(r => r.email))}
                    style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#34D399", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    {copiedEmail === "__all__" ? "✓ Copied!" : "📋 Copy All Emails"}
                  </button>
                  <button
                    className="admin-btn"
                    onClick={() => downloadCSV(
                      waitlistQ.data!.map(r => ({ email: r.email, course_code: r.courseCode, course_title: r.courseTitle, signed_up: new Date(r.createdAt).toISOString() })),
                      `echelon-waitlist-${new Date().toISOString().slice(0,10)}.csv`
                    )}
                    style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#A78BFA", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    ⬇ Download CSV
                  </button>
                </div>
              )}
            </div>
            {waitlistQ.isLoading && <div style={{ padding: 32, textAlign: "center", color: "#64748B", fontSize: 13 }}>Loading…</div>}
            {waitlistQ.data && waitlistQ.data.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "#475569", fontSize: 13 }}>No waitlist signups yet.</div>
            )}
            {waitlistQ.data && waitlistQ.data.length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                    {["#", "Email", "Course", "Date"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                    <th style={{ padding: "10px 16px" }} />
                  </tr>
                </thead>
                <tbody>
                  {waitlistQ.data.map((row, i) => (
                    <tr key={row.id} className="admin-row" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "12px 16px", fontSize: 11, color: "#475569" }}>{i + 1}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#E2E8F0" }}>{row.email}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#34D399" }}>{row.courseCode}</div>
                        <div style={{ fontSize: 11, color: "#64748B" }}>{row.courseTitle}</div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 11, color: "#64748B" }}>{formatDate(row.createdAt)}</td>
                      <td style={{ padding: "12px 16px", display: "flex", gap: 6 }}>
                        <button
                          className="admin-btn"
                          onClick={() => copyEmail(row.email)}
                          style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#64748B", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          {copiedEmail === row.email ? "✓" : "Copy"}
                        </button>
                        <button
                          className="admin-btn"
                          onClick={() => { if (confirm(`Remove ${row.email} from ${row.courseCode} waitlist?`)) removeWaitlist.mutate({ id: row.id }); }}
                          style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#F87171", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── SCORE HISTORY TAB ── */}
        {activeTab === "scores" && (
          <div style={{ background: "#1E293B", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                📊 Exam Score History
                {scoresQ.data && <span style={{ marginLeft: 8, fontSize: 11, color: "#64748B", fontWeight: 400 }}>{scoresQ.data.length} results</span>}
              </div>
              {scoresQ.data && scoresQ.data.length > 0 && (
                <button
                  className="admin-btn"
                  onClick={() => downloadCSV(
                    scoresQ.data!.map(r => ({
                      session_id: r.sessionId,
                      exam_type: r.examType,
                      stream: r.stream ?? "",
                      score: r.score,
                      total: r.total,
                      percent: Math.round(r.score / r.total * 100),
                      passed: r.passed,
                      time_taken_seconds: r.timeTakenSeconds ?? "",
                      date: new Date(r.createdAt).toISOString(),
                    })),
                    `echelon-score-history-${new Date().toISOString().slice(0,10)}.csv`
                  )}
                  style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#A78BFA", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                >
                  ⬇ Download CSV
                </button>
              )}
            </div>
            {scoresQ.isLoading && <div style={{ padding: 32, textAlign: "center", color: "#64748B", fontSize: 13 }}>Loading…</div>}
            {scoresQ.data && scoresQ.data.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "#475569", fontSize: 13 }}>No exam results yet.</div>
            )}
            {scoresQ.data && scoresQ.data.length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                    {["#", "Exam", "Score", "Result", "Time", "Date"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scoresQ.data.map((row, i) => {
                    const pct = Math.round(row.score / row.total * 100);
                    const passed = row.passed === "yes";
                    const typeStyle = EXAM_TYPE_COLORS[row.examType] ?? { bg: "rgba(255,255,255,0.06)", color: "#94A3B8" };
                    const timeTaken = row.timeTakenSeconds ? `${Math.floor(row.timeTakenSeconds / 60)}m ${row.timeTakenSeconds % 60}s` : "—";
                    return (
                      <tr key={row.id} className="admin-row" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "12px 16px", fontSize: 11, color: "#475569" }}>{i + 1}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ padding: "3px 10px", borderRadius: 100, background: typeStyle.bg + "30", color: typeStyle.color, fontSize: 10, fontWeight: 700 }}>
                            {EXAM_TYPE_LABELS[row.examType] ?? row.examType.toUpperCase()}
                          </span>
                          {row.stream && <span style={{ marginLeft: 6, fontSize: 10, color: "#64748B" }}>{row.stream}</span>}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: passed ? "#34D399" : "#F87171" }}>{pct}%</span>
                          <span style={{ marginLeft: 6, fontSize: 11, color: "#64748B" }}>{row.score}/{row.total}</span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ padding: "3px 10px", borderRadius: 100, background: passed ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)", color: passed ? "#34D399" : "#F87171", fontSize: 10, fontWeight: 700 }}>
                            {passed ? "PASS" : "FAIL"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 11, color: "#64748B" }}>{timeTaken}</td>
                        <td style={{ padding: "12px 16px", fontSize: 11, color: "#64748B" }}>{formatDate(row.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* -- REVENUE TAB -- */}
        {activeTab === "revenue" && (
          <div style={{ background: "#1E293B", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                💰 Purchase History
                {purchasesQ.data && <span style={{ marginLeft: 8, fontSize: 11, color: "#64748B", fontWeight: 400 }}>{purchasesQ.data.length} orders</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {purchasesQ.data && purchasesQ.data.length > 0 && (
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#34D399" }}>
                    Total: CA${(purchasesQ.data.reduce((s, p) => s + p.amountCAD, 0) / 100).toFixed(2)}
                  </div>
                )}
                <button
                  className="admin-btn"
                  onClick={() => reconcile.mutate({ hoursBack: 48 })}
                  disabled={reconcile.isPending}
                  title="Check Stripe for any paid sessions in the last 48h that are missing from our database and insert them"
                  style={{ fontSize: 11, fontWeight: 700, padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(99,102,241,0.4)", background: "rgba(99,102,241,0.15)", color: "#A5B4FC", cursor: reconcile.isPending ? "not-allowed" : "pointer", opacity: reconcile.isPending ? 0.6 : 1, fontFamily: "inherit" }}
                >
                  {reconcile.isPending ? "Syncing..." : "Sync Stripe (48h)"}
                </button>
              </div>
            </div>
            {purchasesQ.isLoading && <div style={{ padding: 32, textAlign: "center", color: "#64748B", fontSize: 13 }}>Loading…</div>}
            {purchasesQ.data && purchasesQ.data.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "#475569", fontSize: 13 }}>No purchases yet. Share the pricing page to get your first sale!</div>
            )}
            {purchasesQ.data && purchasesQ.data.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                      {["#", "Product", "Name", "Email", "Phone", "Amount", "Date"].map(h => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {purchasesQ.data.map((row, i) => (
                      <tr key={row.id} className="admin-row" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "12px 16px", fontSize: 11, color: "#475569" }}>{i + 1}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#F1F5F9" }}>{row.productName}</div>
                          <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>{row.productKey}</div>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#F1F5F9", fontWeight: 600 }}>{(row as any).customerName ?? <span style={{ color: "#334155", fontWeight: 400 }}>—</span>}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#94A3B8" }}>{row.email}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#94A3B8" }}>{(row as any).phone ?? <span style={{ color: "#334155" }}>—</span>}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: "#34D399" }}>CA${(row.amountCAD / 100).toFixed(2)}</span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 11, color: "#64748B" }}>{formatDate(row.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* -- SYSTEM HEALTH TAB -- */}
        {activeTab === "health" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#1E293B", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  🩺 System Health
                  {healthQ.data && <span style={{ marginLeft: 8, fontSize: 11, color: "#64748B", fontWeight: 400 }}>Last checked: {formatDate(healthQ.data.timestamp)}</span>}
                </div>
                <button className="admin-btn" onClick={() => healthQ.refetch()} style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#94A3B8", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>↻ Refresh</button>
              </div>
              {healthQ.isLoading && <div style={{ padding: 32, textAlign: "center", color: "#64748B", fontSize: 13 }}>Running checks…</div>}
              {healthQ.data && (
                <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                  {healthQ.data.checks.map((c) => {
                    const statusColor = c.status === "ok" ? "#34D399" : c.status === "warn" ? "#FBBF24" : "#F87171";
                    const statusBg = c.status === "ok" ? "rgba(52,211,153,0.08)" : c.status === "warn" ? "rgba(251,191,36,0.08)" : "rgba(248,113,113,0.08)";
                    const statusIcon = c.status === "ok" ? "✅" : c.status === "warn" ? "⚠️" : "❌";
                    return (
                      <div key={c.name} style={{ padding: "14px 16px", borderRadius: 12, background: statusBg, border: `1px solid ${statusColor}30` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 14 }}>{statusIcon}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: statusColor }}>{c.name}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.5 }}>{c.detail}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent purchases in last 24h */}
            {healthQ.data && (
              <div style={{ background: "#1E293B", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>
                    💳 Purchases (Last 24h)
                    <span style={{ marginLeft: 8, fontSize: 11, color: "#64748B", fontWeight: 400 }}>{healthQ.data.recentPurchases.length} purchase(s)</span>
                  </div>
                </div>
                {healthQ.data.recentPurchases.length === 0 && (
                  <div style={{ padding: 32, textAlign: "center", color: "#475569", fontSize: 13 }}>No purchases in the last 24 hours.</div>
                )}
                {healthQ.data.recentPurchases.length > 0 && (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                          {["Product", "Email", "Amount", "Time"].map(h => (
                            <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {healthQ.data.recentPurchases.map((row, i) => (
                          <tr key={i} className="admin-row" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                            <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 700, color: "#F1F5F9" }}>{row.productKey}</td>
                            <td style={{ padding: "12px 16px", fontSize: 12, color: "#94A3B8" }}>{row.email}</td>
                            <td style={{ padding: "12px 16px" }}><span style={{ fontSize: 13, fontWeight: 800, color: "#34D399" }}>CA${(row.amountCAD / 100).toFixed(2)}</span></td>
                            <td style={{ padding: "12px 16px", fontSize: 11, color: "#64748B" }}>{formatDate(row.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* -- ERROR REPORTS TAB -- */}
        {activeTab === "errors" && (
          <div style={{ background: "#1E293B", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                🐛 Question Error Reports
                {errorsQ.data && <span style={{ marginLeft: 8, fontSize: 11, color: "#64748B", fontWeight: 400 }}>{errorsQ.data.length} open</span>}
              </div>
            </div>
            {errorsQ.isLoading && <div style={{ padding: 32, textAlign: "center", color: "#64748B", fontSize: 13 }}>Loading…</div>}
            {errorsQ.data && errorsQ.data.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "#475569", fontSize: 13 }}>No error reports. 🎉</div>
            )}
            {errorsQ.data && errorsQ.data.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {errorsQ.data.map((row) => {
                  const typeStyle = REPORT_TYPE_COLORS[row.reportType] ?? REPORT_TYPE_COLORS.other;
                  return (
                    <div key={row.id} className="admin-row" style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
                            <span style={{ padding: "3px 10px", borderRadius: 100, background: typeStyle.bg, color: typeStyle.color, fontSize: 10, fontWeight: 700 }}>
                              {REPORT_TYPE_LABELS[row.reportType] ?? row.reportType}
                            </span>
                            <span style={{ padding: "3px 10px", borderRadius: 100, background: "rgba(255,255,255,0.06)", color: "#94A3B8", fontSize: 10, fontWeight: 600 }}>
                              Q{row.questionId} · {row.module}
                            </span>
                            <span style={{ fontSize: 10, color: "#475569" }}>{formatDate(row.createdAt)}</span>
                          </div>
                          <div style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.5, marginBottom: row.details ? 6 : 0 }}>
                            {row.questionText}
                          </div>
                          {row.details && (
                            <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 6, padding: "8px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 8, lineHeight: 1.5 }}>
                              <strong style={{ color: "#64748B" }}>Details:</strong> {row.details}
                            </div>
                          )}
                        </div>
                        <button
                          className="admin-btn"
                          onClick={() => { if (confirm("Mark this error report as resolved and dismiss it?")) dismissError.mutate({ id: row.id }); }}
                          disabled={dismissError.isPending}
                          style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(52,211,153,0.3)", background: "transparent", color: "#34D399", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
                        >
                          ✓ Dismiss
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* -- FEEDBACK TAB -- */}
        {activeTab === "feedback" && (
          <div style={{ background: "#1E293B", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                💬 User Feedback
                {feedbackQ.data && <span style={{ marginLeft: 8, fontSize: 11, color: "#64748B", fontWeight: 400 }}>{feedbackQ.data.length} entries</span>}
              </div>
              {feedbackQ.data && feedbackQ.data.length > 0 && (
                <button
                  className="admin-btn"
                  onClick={() => downloadCSV(feedbackQ.data!.map(r => ({
                    id: r.id,
                    rating: r.rating,
                    comment: r.comment ?? "",
                    examType: r.examType,
                    feedbackType: r.feedbackType,
                    email: r.email ?? "",
                    userId: r.userId ?? "",
                    createdAt: formatDate(r.createdAt),
                  })), "echelon-feedback.csv")}
                  style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(56,189,248,0.3)", background: "transparent", color: "#38BDF8", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                >
                  ⬇ Export CSV
                </button>
              )}
            </div>
            {feedbackQ.isLoading && <div style={{ padding: 32, textAlign: "center", color: "#64748B", fontSize: 13 }}>Loading…</div>}
            {feedbackQ.data && feedbackQ.data.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "#475569", fontSize: 13 }}>No feedback yet.</div>
            )}
            {feedbackQ.data && feedbackQ.data.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {feedbackQ.data.map((row) => {
                  const examStyle = EXAM_TYPE_COLORS[row.examType] ?? { bg: "#F1F5F9", color: "#475569" };
                  const stars = "★".repeat(row.rating) + "☆".repeat(5 - row.rating);
                  return (
                    <div key={row.id} className="admin-row" style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
                            <span style={{ fontSize: 16, color: "#FBBF24", letterSpacing: 2 }}>{stars}</span>
                            <span style={{ padding: "3px 10px", borderRadius: 100, background: examStyle.bg, color: examStyle.color, fontSize: 10, fontWeight: 700 }}>
                              {EXAM_TYPE_LABELS[row.examType] ?? row.examType}
                            </span>
                            <span style={{ padding: "3px 10px", borderRadius: 100, background: row.feedbackType === "quiz_gate" ? "#FEF9C3" : "#DBEAFE", color: row.feedbackType === "quiz_gate" ? "#A16207" : "#1D4ED8", fontSize: 10, fontWeight: 700 }}>
                              {row.feedbackType === "quiz_gate" ? "Trial Gate" : "Session End"}
                            </span>
                            <span style={{ fontSize: 10, color: "#475569" }}>{formatDate(row.createdAt)}</span>
                          </div>
                          {row.comment && (
                            <div style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.5, marginBottom: 4 }}>
                              "{row.comment}"
                            </div>
                          )}
                          <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>
                            {row.email ? row.email : row.userId ? `User #${row.userId}` : "Anonymous"}
                          </div>
                        </div>
                        <button
                          className="admin-btn"
                          onClick={() => { if (confirm("Delete this feedback entry?")) dismissFeedback.mutate({ id: row.id }); }}
                          disabled={dismissFeedback.isPending}
                          style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#F87171", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
                        >
                          ✕ Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
