/**
 * Student Performance Dashboard
 * Surfaces study progress, accuracy trends, topic strengths/weaknesses, and streak data
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { usePageMeta } from "@/hooks/usePageMeta";
import SiteNav from "@/components/SiteNav";
import { useMemo, useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

/* ── Exam type labels (shared with Admin) ── */
const EXAM_TYPE_LABELS: Record<string, string> = {
  oit: "OIT Water", "oit-ww": "OIT Wastewater",
  "class1-water": "Class 1 Water", "class2-water": "Class 2 Water",
  "class3-water": "Class 3 Water", "class4-water": "Class 4 Water",
  "class1-ww": "Class 1 WW", "class2-ww": "Class 2 WW",
  "class3-ww": "Class 3 WW", "class4-ww": "Class 4 WW",
  class1: "Class 1", wqa: "WQA",
  "wpi-class1-water": "WPI I Water", "wpi-class2-water": "WPI II Water",
  "wpi-class3-water": "WPI III Water", "wpi-class4-water": "WPI IV Water",
  "wpi-class1-wastewater": "WPI I WW", "wpi-class2-wastewater": "WPI II WW",
  "wpi-class3-wastewater": "WPI III WW", "wpi-class4-wastewater": "WPI IV WW",
  "wpi-class1-water-dist": "WPI I Dist", "wpi-class2-water-dist": "WPI II Dist",
  "wpi-class3-water-dist": "WPI III Dist", "wpi-class4-water-dist": "WPI IV Dist",
  "wpi-class1-water-coll": "WPI I Coll", "wpi-class2-water-coll": "WPI II Coll",
  "wpi-class3-water-coll": "WPI III Coll", "wpi-class4-water-coll": "WPI IV Coll",
};

/* ── Colors ── */
const BLUE = "#3B82F6";
const TEAL = "#14B8A6";
const AMBER = "#F59E0B";
const RED = "#EF4444";
const GREEN = "#22C55E";
const SLATE_700 = "#E2E8F0";
const SLATE_800 = "#F1F5F9";
const SLATE_900 = "#FFFFFF";

export default function StudentDashboard() {
  usePageMeta({
    title: "My Dashboard — Echelon Institute",
    description: "Track your study progress, accuracy trends, and exam readiness.",
  });

  const { user, loading: authLoading, isAuthenticated } = useAuth();

  // Email OTP login state
  const dashboardMe = trpc.dashboardAuth.me.useQuery();
  const sendOtp = trpc.dashboardAuth.sendOtp.useMutation();
  const verifyOtp = trpc.dashboardAuth.verifyOtp.useMutation();
  const dashboardLogout = trpc.dashboardAuth.logout.useMutation();
  const utils = trpc.useUtils();

  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpStep, setOtpStep] = useState<"email" | "code">("email");
  const [otpError, setOtpError] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // FIX 8: Inline exam date picker state
  const [inlineExamDate, setInlineExamDate] = useState("");
  const [inlineDateSaving, setInlineDateSaving] = useState(false);
  const setExamDateMutation = trpc.examDate.set.useMutation({
    onSuccess: () => {
      setInlineDateSaving(false);
      utils.dashboard.examCountdown.invalidate();
    },
    onError: () => setInlineDateSaving(false),
  });

  // Pre-fill email from localStorage if available
  useEffect(() => {
    try {
      const stored = localStorage.getItem("echelon_subscription_email") ?? localStorage.getItem("echelon_trial_email") ?? "";
      if (stored) setOtpEmail(stored);
    } catch { /* ignore */ }
  }, []);

  // Determine if the user is authenticated via either OAuth or email OTP
  const emailSession = dashboardMe.data?.email ?? null;
  const hasAccess = isAuthenticated || !!emailSession;
  const displayName = user?.name?.split(" ")[0] ?? emailSession?.split("@")[0] ?? "Operator";

  const handleSendOtp = async () => {
    setOtpError("");
    try {
      await sendOtp.mutateAsync({ email: otpEmail.trim().toLowerCase() });
      setOtpStep("code");
      setOtpSent(true);
    } catch (e: any) {
      setOtpError(e.message ?? "Failed to send code. Please try again.");
    }
  };

  const handleVerifyOtp = async () => {
    setOtpError("");
    try {
      await verifyOtp.mutateAsync({ email: otpEmail.trim().toLowerCase(), code: otpCode.trim() });
      await utils.dashboardAuth.me.invalidate();
      await utils.dashboard.overview.invalidate();
    } catch (e: any) {
      setOtpError(e.message ?? "Invalid code. Please try again.");
    }
  };

  const handleDashboardLogout = async () => {
    // Clear the OTP session cookie
    await dashboardLogout.mutateAsync();
    await utils.dashboardAuth.me.invalidate();
    // Clear all course access from localStorage so the session is fully ended
    try {
      localStorage.removeItem("echelon_trial_unlocked");
      localStorage.removeItem("echelon_trial_email");
      localStorage.removeItem("echelon_subscription_email");
      localStorage.removeItem("echelon_access_token");
      localStorage.removeItem("echelon_subscription_exam_types");
      localStorage.removeItem("echelon_purchased_products");
    } catch { /* ignore */ }
    setOtpStep("email");
    setOtpCode("");
    setOtpSent(false);
    // Redirect to login page
    window.location.href = "/";
  };

  const overview = trpc.dashboard.overview.useQuery(undefined, { enabled: hasAccess, retry: false });
  const dailyActivity = trpc.dashboard.dailyActivity.useQuery(undefined, { enabled: hasAccess, retry: false });
  const topicAccuracy = trpc.dashboard.topicAccuracy.useQuery(undefined, { enabled: hasAccess, retry: false });
  const courseBreakdown = trpc.dashboard.courseBreakdown.useQuery(undefined, { enabled: hasAccess, retry: false });
  const difficultyBreakdown = trpc.dashboard.difficultyBreakdown.useQuery(undefined, { enabled: hasAccess, retry: false });
  const recentSessions = trpc.dashboard.recentSessions.useQuery(undefined, { enabled: hasAccess, retry: false });
  const examCountdown = trpc.dashboard.examCountdown.useQuery(undefined, { enabled: hasAccess, retry: false });
  const aiSessions = trpc.dashboard.aiSessionHistory.useQuery(undefined, { enabled: hasAccess, retry: false });
  const recommendedResources = trpc.dashboard.recommendedResources.useQuery(undefined, { enabled: hasAccess, retry: false });
  const readinessScore = trpc.dashboard.readinessScore.useQuery(undefined, { enabled: hasAccess, retry: false });
  const studyFocus = trpc.dashboard.studyFocus.useQuery(undefined, { enabled: hasAccess, retry: false });
  const studyPlan = trpc.dashboard.studyPlan.useQuery(undefined, { enabled: hasAccess, retry: false });

  /* ── Activity chart data (last 30 days) ── */
  const activityChartData = useMemo(() => {
    const raw = dailyActivity.data ?? [];
    // Fill in missing days for the last 30 days
    const days: { day: string; total: number; correct: number }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const found = raw.find((r) => r.day === key);
      days.push({ day: key, total: found?.total ?? 0, correct: found?.correct ?? 0 });
    }
    return {
      labels: days.map((d) => {
        const date = new Date(d.day + "T12:00:00");
        return date.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
      }),
      datasets: [
        {
          label: "Questions Answered",
          data: days.map((d) => d.total),
          backgroundColor: BLUE + "99",
          borderColor: BLUE,
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: "Correct",
          data: days.map((d) => d.correct),
          backgroundColor: GREEN + "99",
          borderColor: GREEN,
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [dailyActivity.data]);

  /* ── Topic accuracy chart ── */
  const topicChartData = useMemo(() => {
    const topics = topicAccuracy.data?.topics ?? [];
    const top12 = topics.slice(0, 12);
    return {
      labels: top12.map((t) => t.name.length > 20 ? t.name.slice(0, 18) + "…" : t.name),
      datasets: [
        {
          label: "Accuracy %",
          data: top12.map((t) => t.accuracy),
          backgroundColor: top12.map((t) =>
            t.status === "weak" ? RED + "CC" : t.status === "strong" ? GREEN + "CC" : BLUE + "99"
          ),
          borderColor: top12.map((t) =>
            t.status === "weak" ? RED : t.status === "strong" ? GREEN : BLUE
          ),
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [topicAccuracy.data]);

  /* ── Difficulty donut ── */
  const difficultyChartData = useMemo(() => {
    const data = difficultyBreakdown.data ?? [];
    const easy = data.find((d) => d.difficulty === "easy");
    const medium = data.find((d) => d.difficulty === "medium");
    const hard = data.find((d) => d.difficulty === "hard");
    return {
      labels: ["Easy", "Medium", "Hard"],
      datasets: [
        {
          data: [easy?.total ?? 0, medium?.total ?? 0, hard?.total ?? 0],
          backgroundColor: [GREEN + "CC", AMBER + "CC", RED + "CC"],
          borderColor: [GREEN, AMBER, RED],
          borderWidth: 2,
        },
      ],
    };
  }, [difficultyBreakdown.data]);

  /* ── Loading state ── */
  if (authLoading || dashboardMe.isLoading) {
    return (
      <div style={{ fontFamily: "Sora, sans-serif", background: SLATE_900, minHeight: "100vh" }}>
        <SiteNav currentPath="/dashboard" />
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <div style={{ color: "#94A3B8", fontSize: 16 }}>Loading...</div>
        </div>
      </div>
    );
  }

  /* ── Auth gate — redirect to /account?next=/dashboard ── */
  // Wait for both auth checks to finish before redirecting — prevents flash on page load
  const authResolved = !authLoading && !dashboardMe.isLoading;
  useEffect(() => {
    if (authResolved && !hasAccess) {
      window.location.replace("/account?next=/dashboard");
    }
  }, [authResolved, hasAccess]);

  if (!authResolved || !hasAccess) {
    return (
      <div style={{ fontFamily: "Sora, sans-serif", background: SLATE_900, minHeight: "100vh" }}>
        <SiteNav currentPath="/dashboard" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div style={{ textAlign: "center", color: "#94A3B8", fontSize: 14 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            Redirecting to sign in…
          </div>
        </div>
      </div>
    );
  }

  const stats = overview.data;
  const isLoading = overview.isLoading;
  return (
    <div style={{ fontFamily: "Sora, sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
      <SiteNav currentPath="/dashboard" />
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "28px 20px 100px" }}>

        {/* ═══════════════════════════════════════════════════
            TOP SECTION: Welcome · Readiness · Countdown · Next Step
        ═══════════════════════════════════════════════════ */}

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
          <div>
            <h1 style={{ color: "#0F172A", fontSize: 26, fontWeight: 900, margin: 0, letterSpacing: "-0.03em" }}>
              Welcome back{displayName ? `, ${displayName.split(" ")[0]}` : ""}
            </h1>
            <p style={{ color: "#64748B", fontSize: 14, marginTop: 4, marginBottom: 0 }}>
              Here's where you stand today.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <a href="/account" style={{
              background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8,
              padding: "7px 14px", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer",
              textDecoration: "none", display: "inline-block",
            }}>
              📚 My Courses
            </a>
            <button
              onClick={handleDashboardLogout}
              disabled={dashboardLogout.isPending}
              style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, padding: "7px 14px", color: "#64748B", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              {dashboardLogout.isPending ? "Signing out…" : "Log Out"}
            </button>
          </div>
        </div>

        {/* Primary Study Focus banner */}
        {studyFocus.data?.courseKey && (
          <div style={{
            background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)",
            border: "1px solid #BFDBFE",
            borderRadius: 12,
            padding: "12px 18px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>🎯</span>
              <div>
                <div style={{ color: "#1E40AF", fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>
                  Studying: {studyFocus.data.label ?? studyFocus.data.courseKey}
                </div>
                <div style={{ color: "#3B82F6", fontSize: 11, marginTop: 2 }}>
                  {studyFocus.data.source === "exam_date" ? "Prioritized by upcoming exam date" :
                   studyFocus.data.source === "recent_activity" ? "Based on recent activity" :
                   "Your enrolled course"}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <a
                href={studyFocus.data.quizPath}
                style={{ padding: "6px 14px", borderRadius: 8, background: "#3B82F6", color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none" }}
              >
                Practice
              </a>
              <a
                href={studyFocus.data.mockExamPath}
                style={{ padding: "6px 14px", borderRadius: 8, background: "#fff", border: "1px solid #BFDBFE", color: "#1E40AF", fontSize: 12, fontWeight: 700, textDecoration: "none" }}
              >
                Mock Exam
              </a>
            </div>
          </div>
        )}

        {/* Top row: Readiness ring + Countdown + Key stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>

          {/* Readiness Score */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 18px", border: "1px solid #E2E8F0", gridColumn: "span 1" }}>
            <div style={{ color: "#94A3B8", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Exam Readiness</div>
            {readinessScore.isLoading ? (
              <Skeleton height={80} />
            ) : !readinessScore.data ? (
              <div style={{ color: "#94A3B8", fontSize: 12, lineHeight: 1.5 }}>Answer questions to unlock your readiness score.</div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {/* Ring */}
                  <svg width="64" height="64" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="#E2E8F0" strokeWidth="7" />
                    <circle
                      cx="32" cy="32" r="26" fill="none"
                      stroke={readinessScore.data.score >= 80 ? "#22C55E" : readinessScore.data.score >= 60 ? "#14B8A6" : readinessScore.data.score >= 40 ? "#F59E0B" : "#EF4444"}
                      strokeWidth="7"
                      strokeDasharray={`${(readinessScore.data.score / 100) * 163.4} 163.4`}
                      strokeLinecap="round"
                      transform="rotate(-90 32 32)"
                    />
                    <text x="32" y="37" textAnchor="middle" fontSize="15" fontWeight="900" fontFamily="Sora,sans-serif"
                      fill={readinessScore.data.score >= 80 ? "#22C55E" : readinessScore.data.score >= 60 ? "#14B8A6" : readinessScore.data.score >= 40 ? "#F59E0B" : "#EF4444"}>
                      {readinessScore.data.score}
                    </text>
                  </svg>
                  <div>
                    <div style={{ color: "#0F172A", fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>{readinessScore.data.label}</div>
                    <div style={{ color: "#94A3B8", fontSize: 11, marginTop: 4, lineHeight: 1.4 }}>{readinessScore.data.nextAction}</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Exam Countdown */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 18px", border: "1px solid #E2E8F0", gridColumn: "span 1" }}>
            <div style={{ color: "#94A3B8", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Exam Countdown</div>
            {examCountdown.isLoading ? (
              <Skeleton height={80} />
            ) : !examCountdown.data ? (
              <div>
                <div style={{ color: "#94A3B8", fontSize: 12, marginBottom: 10 }}>No exam date set.</div>
                <input
                  type="date"
                  value={inlineExamDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={e => setInlineExamDate(e.target.value)}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1.5px solid #E2E8F0", fontSize: 13, color: "#0F172A", fontFamily: "inherit", marginBottom: 8, boxSizing: "border-box" }}
                />
                <button
                  onClick={() => {
                    const callerEmail = user?.email ?? emailSession;
                    const examTypes: string[] = (() => { try { return JSON.parse(localStorage.getItem("echelon_subscription_exam_types") ?? "[]"); } catch { return []; } })();
                    const productKey = examTypes[0] ?? "oit";
                    if (!callerEmail || !inlineExamDate) return;
                    setInlineDateSaving(true);
                    setExamDateMutation.mutate({ email: callerEmail, productKey, examDate: inlineExamDate });
                  }}
                  disabled={!inlineExamDate || inlineDateSaving}
                  style={{ width: "100%", padding: "8px", borderRadius: 8, border: "none", background: inlineExamDate ? "#3B82F6" : "#E2E8F0", color: inlineExamDate ? "#fff" : "#94A3B8", fontSize: 12, fontWeight: 700, cursor: inlineExamDate ? "pointer" : "not-allowed", fontFamily: "inherit" }}
                >
                  {inlineDateSaving ? "Saving…" : "Set Exam Date"}
                </button>
              </div>
            ) : (
              <>
                <div style={{ color: "#0F172A", fontSize: 13, fontWeight: 800, marginBottom: 4 }}>
                  {EXAM_TYPE_LABELS[examCountdown.data.examName] ?? examCountdown.data.examName}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 32, fontWeight: 900, fontFamily: "Sora,sans-serif", lineHeight: 1,
                    color: examCountdown.data.daysUntil <= 7 ? "#EF4444" : examCountdown.data.daysUntil <= 14 ? "#F59E0B" : "#14B8A6",
                  }}>
                    {examCountdown.data.daysUntil}
                  </span>
                  <span style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600 }}>days left</span>
                </div>
                <div style={{
                  display: "inline-block", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                  background: examCountdown.data.paceStatus === "on_track" ? "#22C55E20" : examCountdown.data.paceStatus === "needs_more" ? "#F59E0B20" : "#EF444420",
                  color: examCountdown.data.paceStatus === "on_track" ? "#22C55E" : examCountdown.data.paceStatus === "needs_more" ? "#F59E0B" : "#EF4444",
                }}>
                  {examCountdown.data.paceStatus === "on_track" ? "On Track" : examCountdown.data.paceStatus === "needs_more" ? "Needs More" : "Falling Behind"}
                </div>
              </>
            )}
          </div>

          {/* Questions Answered */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 18px", border: "1px solid #E2E8F0" }}>
            <div style={{ color: "#94A3B8", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Questions Answered</div>
            {isLoading ? <Skeleton height={50} /> : (
              <>
                <div style={{ color: "#3B82F6", fontSize: 34, fontWeight: 900, fontFamily: "Sora,sans-serif", lineHeight: 1 }}>{stats?.totalAttempts ?? 0}</div>
                <div style={{ color: "#94A3B8", fontSize: 12, marginTop: 6 }}>
                  {stats?.currentStreak ?? 0} day streak 🔥
                </div>
              </>
            )}
          </div>

          {/* Overall Accuracy */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 18px", border: "1px solid #E2E8F0" }}>
            <div style={{ color: "#94A3B8", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Overall Accuracy</div>
            {isLoading ? <Skeleton height={50} /> : (
              <>
                <div style={{
                  fontSize: 34, fontWeight: 900, fontFamily: "Sora,sans-serif", lineHeight: 1,
                  color: (stats?.overallAccuracy ?? 0) >= 70 ? "#22C55E" : (stats?.overallAccuracy ?? 0) >= 50 ? "#F59E0B" : "#EF4444",
                }}>
                  {stats?.overallAccuracy ?? 0}%
                </div>
                <div style={{ color: "#94A3B8", fontSize: 12, marginTop: 6 }}>
                  {stats?.totalSessions ?? 0} sessions total
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recommended Next Step banner */}
        {studyPlan.data?.recommendations?.[0] && (
          <div style={{
            background: "linear-gradient(135deg, #3B82F615, #14B8A615)",
            border: "1px solid #3B82F630",
            borderRadius: 14, padding: "14px 18px", marginBottom: 20,
            display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
          }}>
            <span style={{ fontSize: 22 }}>
              {{ weak_topic: "⚠️", missed_review: "❌", low_confidence: "😰", bookmarked: "🔖", mock_exam: "📋", start_practicing: "🚀" }[studyPlan.data.recommendations[0].type] ?? "📌"}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#0F172A", fontSize: 13, fontWeight: 800 }}>{studyPlan.data.recommendations[0].title}</div>
              <div style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>{studyPlan.data.recommendations[0].description}</div>
            </div>
            {studyPlan.data.recommendations[0].actionHref && (
              <a href={studyPlan.data.recommendations[0].actionHref} style={{
                padding: "8px 16px", borderRadius: 8, background: "#3B82F6", color: "#fff",
                fontSize: 13, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0,
              }}>
                Start Now →
              </a>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            MIDDLE SECTION: Action Cards
        ═══════════════════════════════════════════════════ */}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>

          {/* Continue Practicing */}
          <a href="/" style={{ textDecoration: "none" }}>
            <div style={{ background: "linear-gradient(135deg, #3B82F6, #2563EB)", borderRadius: 16, padding: "20px 18px", cursor: "pointer", height: "100%", boxSizing: "border-box" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>📝</div>
              <div style={{ color: "#fff", fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Continue Practicing</div>
              <div style={{ color: "#BFDBFE", fontSize: 12, lineHeight: 1.4 }}>Pick up where you left off with adaptive questions.</div>
            </div>
          </a>

          {/* Review Weak Topics */}
          {(topicAccuracy.data?.topics?.filter((t: any) => t.status === "weak")?.length ?? 0) > 0 ? (
            <a href={`/?topic=${encodeURIComponent(topicAccuracy.data!.topics.filter((t: any) => t.status === "weak")[0].name)}`} style={{ textDecoration: "none" }}>
              <div style={{ background: "linear-gradient(135deg, #EF4444, #DC2626)", borderRadius: 16, padding: "20px 18px", cursor: "pointer", height: "100%", boxSizing: "border-box" }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>⚠️</div>
                <div style={{ color: "#fff", fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Review Weak Topics</div>
                <div style={{ color: "#FECACA", fontSize: 12, lineHeight: 1.4 }}>
                  {topicAccuracy.data!.topics.filter((t: any) => t.status === "weak").length} topic{topicAccuracy.data!.topics.filter((t: any) => t.status === "weak").length !== 1 ? "s" : ""} need attention.
                </div>
              </div>
            </a>
          ) : (
            <a href="/?mode=standard" style={{ textDecoration: "none" }}>
              <div style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", borderRadius: 16, padding: "20px 18px", cursor: "pointer", height: "100%", boxSizing: "border-box" }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>⚠️</div>
                <div style={{ color: "#fff", fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Review Weak Topics</div>
                <div style={{ color: "#FEF3C7", fontSize: 12, lineHeight: 1.4 }}>No weak topics yet — keep practicing!</div>
              </div>
            </a>
          )}

          {/* Take Mock Exam */}
          <a href={studyFocus.data?.mockExamPath ?? "/mock-exam"} style={{ textDecoration: "none" }}>
            <div style={{ background: "linear-gradient(135deg, #14B8A6, #0D9488)", borderRadius: 16, padding: "20px 18px", cursor: "pointer", height: "100%", boxSizing: "border-box" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>📋</div>
              <div style={{ color: "#fff", fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Take Mock Exam</div>
              <div style={{ color: "#CCFBF1", fontSize: 12, lineHeight: 1.4 }}>Simulate real exam conditions and track your score.</div>
            </div>
          </a>

          {/* Review Missed Questions */}
          <a href="/?mode=missed" style={{ textDecoration: "none" }}>
            <div style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)", borderRadius: 16, padding: "20px 18px", cursor: "pointer", height: "100%", boxSizing: "border-box" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>❌</div>
              <div style={{ color: "#fff", fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Review Missed</div>
              <div style={{ color: "#EDE9FE", fontSize: 12, lineHeight: 1.4 }}>
                {studyPlan.data?.totalMissed ? `${studyPlan.data.totalMissed} questions to review.` : "Practice questions you got wrong."}
              </div>
            </div>
          </a>
        </div>

        {/* ═══════════════════════════════════════════════════
            BOTTOM SECTION: Performance · Topics · AI Tutor · Flashcards
        ═══════════════════════════════════════════════════ */}

        {/* Row 1: Daily Activity + Topic Accuracy */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

          {/* Daily Activity */}
          <Section title="📅 Daily Activity (Last 30 Days)" style={{ margin: 0 }}>
            {dailyActivity.isLoading ? (
              <Skeleton height={200} />
            ) : (dailyActivity.data?.length ?? 0) === 0 ? (
              <EmptyState text="No activity yet. Start a quiz to see your daily progress." />
            ) : (
              <div style={{ height: 200 }}>
                <Bar
                  data={activityChartData}
                  options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: true, position: "top", labels: { color: "#94A3B8", font: { size: 10, family: "Sora" } } } },
                    scales: {
                      x: { ticks: { color: "#64748B", font: { size: 9 }, maxRotation: 45 }, grid: { display: false } },
                      y: { ticks: { color: "#64748B", font: { size: 10 }, stepSize: 5 }, grid: { color: "#F1F5F9" }, beginAtZero: true },
                    },
                  }}
                />
              </div>
            )}
          </Section>

          {/* Topic Accuracy */}
          <Section title="📚 Topic Accuracy" style={{ margin: 0 }}>
            {topicAccuracy.isLoading ? (
              <Skeleton height={200} />
            ) : (topicAccuracy.data?.topics.length ?? 0) === 0 ? (
              <EmptyState text="No topic data yet. Answer some quiz questions to see your strengths and weaknesses." />
            ) : (
              <div style={{ height: 200 }}>
                <Bar
                  data={topicChartData}
                  options={{
                    indexAxis: "y" as const,
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { min: 0, max: 100, ticks: { color: "#64748B", font: { size: 10 } }, grid: { color: "#F1F5F9" } },
                      y: { ticks: { color: "#64748B", font: { size: 10 } }, grid: { display: false } },
                    },
                  }}
                />
              </div>
            )}
          </Section>
        </div>

        {/* Row 2: Weak Focus Areas + Difficulty Split */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>

          {/* Weak Focus Areas */}
          <Section title="⚠️ Focus Areas" style={{ margin: 0 }}>
            {topicAccuracy.isLoading ? (
              <Skeleton height={120} />
            ) : (() => {
              const weak = (topicAccuracy.data?.topics ?? []).filter((t: any) => t.status === "weak").slice(0, 4);
              return weak.length === 0 ? (
                <EmptyState text="No weak topics yet — you're doing great! Keep practicing." />
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                  {weak.map((t: any, i: number) => {
                    const acc = t.accuracy;
                    return (
                      <div key={i} style={{ background: "#FFF7F7", borderRadius: 10, padding: "12px 14px", border: `1px solid ${acc < 40 ? "#EF444433" : "#F59E0B33"}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ color: "#0F172A", fontSize: 12, fontWeight: 700 }}>{t.name}</span>
                          <span style={{ padding: "2px 7px", borderRadius: 5, fontSize: 10, fontWeight: 700, background: acc < 40 ? "#EF444420" : "#F59E0B20", color: acc < 40 ? "#EF4444" : "#F59E0B" }}>{acc}%</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 3, background: "#E2E8F0", overflow: "hidden", marginBottom: 8 }}>
                          <div style={{ height: "100%", width: `${acc}%`, borderRadius: 3, background: acc < 40 ? "#EF4444" : "#F59E0B" }} />
                        </div>
                        <a href={`/?topic=${encodeURIComponent(t.name)}`} style={{ display: "inline-block", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: acc < 40 ? "#EF444415" : "#F59E0B15", color: acc < 40 ? "#EF4444" : "#F59E0B", textDecoration: "none", border: `1px solid ${acc < 40 ? "#EF444433" : "#F59E0B33"}` }}>
                          Practice →
                        </a>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </Section>

          {/* Difficulty Split */}
          <Section title="⚡ Difficulty Split" style={{ margin: 0 }}>
            {difficultyBreakdown.isLoading ? (
              <Skeleton height={120} />
            ) : (difficultyBreakdown.data?.length ?? 0) === 0 ? (
              <EmptyState text="No data yet." />
            ) : (
              <div style={{ height: 160 }}>
                <Doughnut
                  data={difficultyChartData}
                  options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: "bottom", labels: { color: "#64748B", font: { size: 11 }, padding: 12 } } },
                    cutout: "65%",
                  }}
                />
              </div>
            )}
          </Section>
        </div>

        {/* Row 3: Course Breakdown */}
        <Section title="🎓 Course Breakdown">
          {courseBreakdown.isLoading ? (
            <Skeleton height={80} />
          ) : (courseBreakdown.data?.length ?? 0) === 0 ? (
            <EmptyState text="No course data yet. Start a quiz to see your course breakdown." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {courseBreakdown.data?.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ minWidth: 140, color: "#0F172A", fontSize: 13, fontWeight: 600 }}>
                    {EXAM_TYPE_LABELS[c.examType] ?? c.examType}
                  </div>
                  <div style={{ flex: 1, height: 10, borderRadius: 5, background: "#E2E8F0", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${c.accuracy}%`, borderRadius: 5, background: c.accuracy >= 70 ? "#22C55E" : c.accuracy >= 50 ? "#14B8A6" : "#F59E0B" }} />
                  </div>
                  <div style={{ minWidth: 80, textAlign: "right" }}>
                    <span style={{ color: c.accuracy >= 70 ? "#22C55E" : c.accuracy >= 50 ? "#14B8A6" : "#F59E0B", fontSize: 13, fontWeight: 800 }}>{c.accuracy}%</span>
                    <span style={{ color: "#94A3B8", fontSize: 11, marginLeft: 6 }}>{c.total} Qs</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Row 4: AI Tutor Sessions + Study Plan */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

          {/* AI Tutor Sessions */}
          <Section title="🤖 AI Tutor Sessions" style={{ margin: 0 }}>
            {aiSessions.isLoading ? (
              <Skeleton height={120} />
            ) : (aiSessions.data?.length ?? 0) === 0 ? (
              <EmptyState text="No AI tutor sessions yet. Ask the AI tutor a question while practicing." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {aiSessions.data?.slice(0, 4).map((s, i) => (
                  <div key={i} style={{ padding: "10px 12px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ color: "#0F172A", fontSize: 12, fontWeight: 700 }}>{EXAM_TYPE_LABELS[s.examType] ?? s.examType}</span>
                      <span style={{ color: "#94A3B8", fontSize: 11 }}>{new Date(s.sessionStart).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}</span>
                    </div>
                    <div style={{ color: "#64748B", fontSize: 12, lineHeight: 1.4 }}>
                      {s.summary ? (s.summary.length > 80 ? s.summary.slice(0, 77) + "…" : s.summary) : `${s.messageCount} messages`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Full Study Plan */}
          <Section title="📋 Your Study Plan" style={{ margin: 0 }}>
            {studyPlan.isLoading ? (
              <Skeleton height={120} />
            ) : !studyPlan.data || studyPlan.data.recommendations.length === 0 ? (
              <EmptyState text="Complete some questions to get a personalized study plan." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {studyPlan.data.recommendations.slice(0, 4).map((rec, i) => {
                  const iconMap: Record<string, string> = { weak_topic: "⚠️", missed_review: "❌", low_confidence: "😰", bookmarked: "🔖", mock_exam: "📋", start_practicing: "🚀" };
                  const colorMap: Record<string, string> = { weak_topic: "#EF4444", missed_review: "#F59E0B", low_confidence: "#F59E0B", bookmarked: "#3B82F6", mock_exam: "#14B8A6", start_practicing: "#22C55E" };
                  const color = colorMap[rec.type] ?? "#3B82F6";
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: color + "10", borderRadius: 10, border: `1px solid ${color}22` }}>
                      <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{iconMap[rec.type] ?? "📌"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: "#0F172A", fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{rec.title}</div>
                        <div style={{ color: "#64748B", fontSize: 11, lineHeight: 1.4 }}>{rec.description}</div>
                      </div>
                      {rec.actionHref && (
                        <a href={rec.actionHref} style={{ padding: "4px 10px", borderRadius: 6, background: color, color: "#fff", fontSize: 11, fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>Go</a>
                      )}
                    </div>
                  );
                })}
                {/* Review mode quick-links */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                  {(studyPlan.data.totalMissed ?? 0) > 0 && (
                    <a href="/quiz?mode=missed" style={{ padding: "4px 10px", borderRadius: 6, background: "#F59E0B20", color: "#F59E0B", fontSize: 11, fontWeight: 700, textDecoration: "none", border: "1px solid #F59E0B33" }}>❌ Missed ({studyPlan.data.totalMissed})</a>
                  )}
                  {(studyPlan.data.totalBookmarked ?? 0) > 0 && (
                    <a href="/quiz?mode=bookmarked" style={{ padding: "4px 10px", borderRadius: 6, background: "#3B82F620", color: "#3B82F6", fontSize: 11, fontWeight: 700, textDecoration: "none", border: "1px solid #3B82F633" }}>🔖 Bookmarks ({studyPlan.data.totalBookmarked})</a>
                  )}
                  {(studyPlan.data.totalLowConf ?? 0) > 0 && (
                    <a href="/quiz?mode=low-confidence" style={{ padding: "4px 10px", borderRadius: 6, background: "#EF444420", color: "#EF4444", fontSize: 11, fontWeight: 700, textDecoration: "none", border: "1px solid #EF444433" }}>😰 Low Confidence ({studyPlan.data.totalLowConf})</a>
                  )}
                </div>
              </div>
            )}
          </Section>
        </div>

        {/* Row 5: Recent Sessions */}
        <Section title="🕐 Recent Sessions">
          {recentSessions.isLoading ? (
            <Skeleton height={120} />
          ) : (recentSessions.data?.length ?? 0) === 0 ? (
            <EmptyState text="No sessions recorded yet. Complete a quiz to see your session history." />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
                    <th style={{ textAlign: "left", padding: "8px 12px", color: "#94A3B8", fontWeight: 600, fontSize: 11 }}>Date</th>
                    <th style={{ textAlign: "left", padding: "8px 12px", color: "#94A3B8", fontWeight: 600, fontSize: 11 }}>Course</th>
                    <th style={{ textAlign: "left", padding: "8px 12px", color: "#94A3B8", fontWeight: 600, fontSize: 11 }}>Mode</th>
                    <th style={{ textAlign: "right", padding: "8px 12px", color: "#94A3B8", fontWeight: 600, fontSize: 11 }}>Score</th>
                    <th style={{ textAlign: "right", padding: "8px 12px", color: "#94A3B8", fontWeight: 600, fontSize: 11 }}>Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.data?.map((s, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "10px 12px", color: "#64748B" }}>
                        {new Date(s.startedAt).toLocaleDateString("en-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#0F172A", fontWeight: 600 }}>
                        {EXAM_TYPE_LABELS[s.examType] ?? s.examType}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#94A3B8", textTransform: "capitalize" }}>
                        {s.quizMode ?? "standard"}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#0F172A", textAlign: "right", fontFamily: "Sora,sans-serif", fontWeight: 700 }}>
                        {s.correct}/{s.total}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: s.accuracy >= 70 ? "#22C55E20" : s.accuracy >= 50 ? "#F59E0B20" : "#EF444420", color: s.accuracy >= 70 ? "#22C55E" : s.accuracy >= 50 ? "#F59E0B" : "#EF4444" }}>
                          {s.accuracy}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

      </div>
    </div>
  );
}

/* ── Reusable sub-components ── */

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <div
      style={{
        background: SLATE_800,
        border: "1px solid #E2E8F0",
        borderRadius: 14,
        padding: "18px 16px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ color, fontSize: 24, fontWeight: 900, fontFamily: "'Sora', sans-serif", lineHeight: 1.1 }}>{value}</div>
      <div style={{ color: "#94A3B8", fontSize: 11, fontWeight: 600, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Section({ title, children, style: extraStyle }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: SLATE_800,
        border: "1px solid #E2E8F0",
        borderRadius: 16,
        padding: "20px 20px 16px",
        marginBottom: 16,
        ...extraStyle,
      }}
    >
      <h2 style={{ color: "#1E293B", fontSize: 16, fontWeight: 800, margin: "0 0 14px", letterSpacing: "-0.01em" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Skeleton({ height }: { height: number }) {
  return (
    <div
      style={{
        height,
        borderRadius: 10,
        background: `linear-gradient(90deg, ${SLATE_700} 25%, ${SLATE_800} 50%, ${SLATE_700} 75%)`,
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
      }}
    />
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ padding: "28px 16px", textAlign: "center" }}>
      <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>📭</div>
      <div style={{ color: "#64748B", fontSize: 13, lineHeight: 1.5 }}>{text}</div>
    </div>
  );
}
