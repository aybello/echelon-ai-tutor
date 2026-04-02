// ADMIN DASHBOARD — /admin
// Gated to role === 'admin'. Shows trial emails, waitlist signups, and error reports.

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";

type Tab = "trials" | "waitlist" | "errors" | "scores" | "revenue";

const EXAM_TYPE_LABELS: Record<string, string> = {
  oit: "OIT",
  class1: "Class 1",
  wqa: "WQA",
};

const EXAM_TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  oit: { bg: "#DBEAFE", color: "#1D4ED8" },
  class1: { bg: "#DCFCE7", color: "#15803D" },
  wqa: { bg: "#EDE9FE", color: "#6D28D9" },
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
  const purchasesQ = trpc.admin.getPurchases.useQuery({ limit: 500 }, { enabled: user?.role === "admin" && activeTab === "revenue" });;

  const utils = trpc.useUtils();

  const dismissError = trpc.admin.dismissErrorReport.useMutation({
    onSuccess: () => utils.admin.getErrorReports.invalidate(),
  });
  const removeWaitlist = trpc.admin.removeWaitlistEntry.useMutation({
    onSuccess: () => { utils.admin.getWaitlist.invalidate(); utils.admin.stats.invalidate(); },
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
  ];

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "revenue", label: "Revenue", icon: "💰" },
    { id: "trials", label: "Trial Emails", icon: "📧" },
    { id: "waitlist", label: "Waitlist", icon: "📋" },
    { id: "errors", label: "Error Reports", icon: "🐛" },
    { id: "scores", label: "Score History", icon: "📊" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0F172A", fontFamily: "'Sora', sans-serif", color: "#F1F5F9" }}>
      <style>{`
        .admin-row:hover { background: rgba(255,255,255,0.04) !important; }
        .admin-btn:hover { opacity: 0.8; }
        @media (max-width: 640px) {
          .admin-stats { grid-template-columns: 1fr !important; }
          .admin-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
        }
      `}</style>

      {/* Top bar */}
      <div style={{ background: "#1E293B", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #1D4ED8, #0F766E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800 }}>E</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#F1F5F9" }}>ECHELON ADMIN</div>
            <div style={{ fontSize: 10, color: "#64748B" }}>Internal dashboard</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 12, color: "#64748B" }}>Signed in as <strong style={{ color: "#94A3B8" }}>{user.name ?? user.email}</strong></span>
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
        <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "#1E293B", borderRadius: 12, padding: 4 }}>
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
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                💰 Purchase History
                {purchasesQ.data && <span style={{ marginLeft: 8, fontSize: 11, color: "#64748B", fontWeight: 400 }}>{purchasesQ.data.length} orders</span>}
              </div>
              {purchasesQ.data && purchasesQ.data.length > 0 && (
                <div style={{ fontSize: 13, fontWeight: 800, color: "#34D399" }}>
                  Total: CA${(purchasesQ.data.reduce((s, p) => s + p.amountCAD, 0) / 100).toFixed(2)}
                </div>
              )}
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
                      {["#", "Product", "Email", "Amount", "Date"].map(h => (
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
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#94A3B8" }}>{row.email}</td>
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
      </div>
    </div>
  );
}
