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

  /* ── Email OTP login gate — show inline form, no redirect ── */
  // Wait for both auth checks to finish before showing the gate — prevents flash
  const authResolved = !authLoading && !dashboardMe.isLoading;
  if (authResolved && !hasAccess) {
    return (
      <div style={{ fontFamily: "Sora, sans-serif", background: SLATE_900, minHeight: "100vh" }}>
        <SiteNav currentPath="/dashboard" />
        <div style={{ maxWidth: 440, margin: "0 auto", padding: "80px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
            <h1 style={{ color: "#1E293B", fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>My Dashboard</h1>
            <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, margin: "0 0 6px" }}>
              Track your mock exam scores and study progress.
            </p>
            <p style={{ color: "#94A3B8", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              Enter your email to access your results — no password needed.
            </p>
          </div>

          <div style={{ background: SLATE_800, borderRadius: 14, padding: "28px 24px", border: "1px solid #E2E8F0" }}>
            {otpStep === "email" ? (
              <>
                <label style={{ display: "block", color: "#94A3B8", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Email Address</label>
                <input
                  type="email"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                  placeholder="you@example.com"
                  style={{
                    width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid #E2E8F0",
                    background: SLATE_900, color: "#1E293B", fontSize: 15, boxSizing: "border-box", marginBottom: 16,
                    outline: "none",
                  }}
                />
                {otpError && <p style={{ color: RED, fontSize: 13, marginBottom: 12 }}>{otpError}</p>}
                <button
                  onClick={handleSendOtp}
                  disabled={sendOtp.isPending || !otpEmail.trim()}
                  style={{
                    width: "100%", padding: "12px", borderRadius: 8, border: "none", cursor: "pointer",
                    background: `linear-gradient(135deg, ${BLUE}, ${TEAL})`,
                    color: "#fff", fontWeight: 700, fontSize: 15, opacity: sendOtp.isPending ? 0.7 : 1,
                  }}
                >
                  {sendOtp.isPending ? "Sending..." : "Send Code"}
                </button>
              </>
            ) : (
              <>
                <p style={{ color: "#94A3B8", fontSize: 13, marginBottom: 16 }}>
                  A 6-digit code was sent to <strong style={{ color: "#1E293B" }}>{otpEmail}</strong>. Enter it below.
                </p>
                <label style={{ display: "block", color: "#94A3B8", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && otpCode.length === 6 && handleVerifyOtp()}
                  placeholder="000000"
                  style={{
                    width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid #E2E8F0",
                    background: SLATE_900, color: "#1E293B", fontSize: 24, letterSpacing: 8, textAlign: "center",
                    boxSizing: "border-box", marginBottom: 16, outline: "none",
                  }}
                />
                {otpError && <p style={{ color: RED, fontSize: 13, marginBottom: 12 }}>{otpError}</p>}
                <button
                  onClick={handleVerifyOtp}
                  disabled={verifyOtp.isPending || otpCode.length !== 6}
                  style={{
                    width: "100%", padding: "12px", borderRadius: 8, border: "none", cursor: "pointer",
                    background: `linear-gradient(135deg, ${BLUE}, ${TEAL})`,
                    color: "#fff", fontWeight: 700, fontSize: 15, opacity: verifyOtp.isPending ? 0.7 : 1,
                    marginBottom: 12,
                  }}
                >
                  {verifyOtp.isPending ? "Verifying..." : "Access Dashboard"}
                </button>
                <button
                  onClick={() => { setOtpStep("email"); setOtpCode(""); setOtpError(""); }}
                  style={{ background: "none", border: "none", color: "#64748B", fontSize: 13, cursor: "pointer", width: "100%" }}
                >
                  Use a different email
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const stats = overview.data;
  const isLoading = overview.isLoading;

  return (
    <div style={{ fontFamily: "Sora, sans-serif", background: SLATE_900, minHeight: "100vh" }}>
      <SiteNav currentPath="/dashboard" />

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 20px 120px" }}>
        {/* ── Header ── */}
        <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ color: "#1E293B", fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
              📊 My Dashboard
            </h1>
            <p style={{ color: "#94A3B8", fontSize: 14, marginTop: 6 }}>
              Welcome back, {displayName}. Here's your study progress.
            </p>
          </div>
          {hasAccess && (
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <a href="/account" style={{
                background: "none", border: "1px solid #E2E8F0", borderRadius: 8,
                padding: "6px 14px", color: "#94A3B8", fontSize: 13, cursor: "pointer",
                textDecoration: "none", display: "inline-block",
              }}>
                📚 My Courses
              </a>
              <button
                onClick={handleDashboardLogout}
                disabled={dashboardLogout.isPending}
                style={{ background: "none", border: "1px solid #E2E8F0", borderRadius: 8, padding: "6px 14px", color: "#64748B", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
              >
                {dashboardLogout.isPending ? "Signing out..." : "🚪 Log Out"}
              </button>
            </div>
          )}
        </div>

        {/* ── Exam Countdown Banner ── */}
        {examCountdown.data && (
          <div
            style={{
              background: `linear-gradient(135deg, ${BLUE}22, ${TEAL}22)`,
              border: `1px solid ${examCountdown.data.paceStatus === "falling_behind" ? RED : examCountdown.data.paceStatus === "needs_more" ? AMBER : TEAL}44`,
              borderRadius: 14,
              padding: "16px 20px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 32 }}>⏱️</div>
              <div>
                <div style={{ color: "#1E293B", fontSize: 15, fontWeight: 800 }}>
                  {EXAM_TYPE_LABELS[examCountdown.data.examName] ?? examCountdown.data.examName}
                </div>
                <div style={{ color: "#94A3B8", fontSize: 13, marginTop: 2 }}>
                  {new Date(examCountdown.data.examDate).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" })}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    color: examCountdown.data.daysUntil <= 7 ? RED : examCountdown.data.daysUntil <= 14 ? AMBER : TEAL,
                    fontSize: 28,
                    fontWeight: 900,
                    fontFamily: "'Sora', sans-serif",
                    lineHeight: 1,
                  }}
                >
                  {examCountdown.data.daysUntil}
                </div>
                <div style={{ color: "#94A3B8", fontSize: 11, fontWeight: 600 }}>days left</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#1E293B", fontSize: 18, fontWeight: 800, fontFamily: "'Sora', sans-serif", lineHeight: 1 }}>
                  {examCountdown.data.avgQuestionsPerDay}
                </div>
                <div style={{ color: "#94A3B8", fontSize: 11, fontWeight: 600 }}>Qs/day avg</div>
              </div>
              <div
                style={{
                  padding: "5px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  background:
                    examCountdown.data.paceStatus === "on_track" ? GREEN + "20" :
                    examCountdown.data.paceStatus === "needs_more" ? AMBER + "20" : RED + "20",
                  color:
                    examCountdown.data.paceStatus === "on_track" ? GREEN :
                    examCountdown.data.paceStatus === "needs_more" ? AMBER : RED,
                }}
              >
                {examCountdown.data.paceStatus === "on_track" ? "On Track" :
                 examCountdown.data.paceStatus === "needs_more" ? "Needs More" : "Falling Behind"}
              </div>
            </div>
          </div>
        )}

        {/* ── Hero Stats Row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 28 }}>
          <StatCard label="Questions Answered" value={isLoading ? "—" : String(stats?.totalAttempts ?? 0)} icon="📝" color={BLUE} />
          <StatCard label="Overall Accuracy" value={isLoading ? "—" : `${stats?.overallAccuracy ?? 0}%`} icon="🎯" color={stats?.overallAccuracy && stats.overallAccuracy >= 70 ? GREEN : AMBER} />
          <StatCard label="Current Streak" value={isLoading ? "—" : `${stats?.currentStreak ?? 0} day${(stats?.currentStreak ?? 0) !== 1 ? "s" : ""}`} icon="🔥" color={AMBER} />
          <StatCard label="Longest Streak" value={isLoading ? "—" : `${stats?.longestStreak ?? 0} days`} icon="🏆" color={TEAL} />
        </div>

        {/* ── Weak Topics Focus ── */}
        {topicAccuracy.data && topicAccuracy.data.topics?.length > 0 && (() => {
          const weak = topicAccuracy.data.topics
            .filter((t: any) => {
              const acc = t.total > 0 ? (t.correct / t.total) * 100 : 100;
              return acc < 60 && t.total >= 3;
            })
            .sort((a: any, b: any) => (a.correct / a.total) - (b.correct / b.total))
            .slice(0, 4);
          if (weak.length === 0) return null;
          return (
            <Section title="⚠️ Focus Areas">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
                {weak.map((t: any, i: number) => {
                  const acc = Math.round((t.correct / t.total) * 100);
                  return (
                    <div
                      key={i}
                      style={{
                        background: SLATE_900,
                        borderRadius: 10,
                        padding: "12px 14px",
                        border: `1px solid ${acc < 40 ? RED : AMBER}33`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ color: "#1E293B", fontSize: 13, fontWeight: 700 }}>{t.topic}</span>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            background: acc < 40 ? RED + "20" : AMBER + "20",
                            color: acc < 40 ? RED : AMBER,
                          }}
                        >
                          {acc}%
                        </span>
                      </div>
                      <div
                        style={{
                          height: 6,
                          borderRadius: 3,
                          background: SLATE_700,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${acc}%`,
                            borderRadius: 3,
                            background: acc < 40 ? RED : AMBER,
                          }}
                        />
                      </div>
                      <div style={{ color: "#64748B", fontSize: 11, marginTop: 6 }}>
                        {t.correct}/{t.total} correct \u00B7 Needs review
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          );
        })()}

        {/* ── Daily Activity Chart ── */}
        <Section title="📅 Daily Activity (Last 30 Days)">
          {dailyActivity.isLoading ? (
            <Skeleton height={200} />
          ) : (dailyActivity.data?.length ?? 0) === 0 ? (
            <EmptyState text="No activity yet. Start a quiz to see your daily progress here." />
          ) : (
            <div style={{ height: 220 }}>
              <Bar
                data={activityChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: true, position: "top", labels: { color: "#94A3B8", font: { size: 11, family: "Sora" } } },
                  },
                  scales: {
                    x: { ticks: { color: "#64748B", font: { size: 10 }, maxRotation: 45 }, grid: { display: false } },
                    y: { ticks: { color: "#64748B", font: { size: 11 }, stepSize: 5 }, grid: { color: "#1E293B" }, beginAtZero: true },
                  },
                }}
              />
            </div>
          )}
        </Section>

        {/* ── Two-column: Topic Accuracy + Difficulty ── */}
        <div className="dashboard-two-col" style={{ display: "grid", gap: 16, marginBottom: 16 }}>
          <Section title="📚 Topic Accuracy" style={{ margin: 0 }}>
            {topicAccuracy.isLoading ? (
              <Skeleton height={200} />
            ) : (topicAccuracy.data?.topics.length ?? 0) === 0 ? (
              <EmptyState text="No topic data yet. Answer some quiz questions to see your strengths and weaknesses." />
            ) : (
              <div style={{ height: 280 }}>
                <Bar
                  data={topicChartData}
                  options={{
                    indexAxis: "y" as const,
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (ctx) => {
                            const topic = topicAccuracy.data?.topics[ctx.dataIndex];
                            return topic ? `${topic.accuracy}% (${topic.correct}/${topic.total})` : "";
                          },
                        },
                      },
                    },
                    scales: {
                      x: { min: 0, max: 100, ticks: { color: "#64748B", font: { size: 11 }, callback: (v) => v + "%" }, grid: { color: "#1E293B" } },
                      y: { ticks: { color: "#64748B", font: { size: 11, family: "Sora" } }, grid: { display: false } },
                    },
                  }}
                />
              </div>
            )}
            {/* Weak topics alert */}
            {(topicAccuracy.data?.weakTopics.length ?? 0) > 0 && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: RED + "15", border: `1px solid ${RED}33`, borderRadius: 10 }}>
                <div style={{ color: RED, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>⚠️ Focus Areas (below 65%)</div>
                <div style={{ color: "#1E293B", fontSize: 13 }}>
                  {topicAccuracy.data?.weakTopics.join(", ")}
                </div>
              </div>
            )}
          </Section>

          <Section title="⚡ Difficulty Split" style={{ margin: 0 }}>
            {difficultyBreakdown.isLoading ? (
              <Skeleton height={200} />
            ) : (difficultyBreakdown.data?.length ?? 0) === 0 ? (
              <EmptyState text="No data yet." />
            ) : (
              <>
                <div style={{ height: 180, display: "flex", justifyContent: "center" }}>
                  <Doughnut
                    data={difficultyChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      cutout: "60%",
                      plugins: {
                        legend: { position: "bottom", labels: { color: "#94A3B8", font: { size: 11, family: "Sora" }, padding: 12 } },
                      },
                    }}
                  />
                </div>
                {/* Accuracy per difficulty */}
                <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "center" }}>
                  {(difficultyBreakdown.data ?? [])
                    .filter((d) => ["easy", "medium", "hard"].includes(d.difficulty))
                    .map((d) => (
                      <div
                        key={d.difficulty}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 8,
                          background: SLATE_800,
                          textAlign: "center",
                          flex: 1,
                        }}
                      >
                        <div style={{ color: d.difficulty === "easy" ? GREEN : d.difficulty === "medium" ? AMBER : RED, fontSize: 16, fontWeight: 800 }}>
                          {d.accuracy}%
                        </div>
                        <div style={{ color: "#94A3B8", fontSize: 10, textTransform: "capitalize" }}>{d.difficulty}</div>
                      </div>
                    ))}
                </div>
              </>
            )}
          </Section>
        </div>

        {/* ── Course Breakdown ── */}
        <Section title="🎓 Course Breakdown">
          {courseBreakdown.isLoading ? (
            <Skeleton height={100} />
          ) : (courseBreakdown.data?.length ?? 0) === 0 ? (
            <EmptyState text="No course data yet. Start practicing to see your per-course stats." />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
              {courseBreakdown.data?.map((c) => (
                <div
                  key={c.examType}
                  style={{
                    background: SLATE_800,
                    borderRadius: 12,
                    padding: "14px 16px",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <div style={{ color: "#1E293B", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                    {EXAM_TYPE_LABELS[c.examType] ?? c.examType}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <div style={{ color: c.accuracy >= 70 ? GREEN : c.accuracy >= 50 ? AMBER : RED, fontSize: 22, fontWeight: 900, fontFamily: "'Sora', sans-serif" }}>
                        {c.accuracy}%
                      </div>
                      <div style={{ color: "#64748B", fontSize: 11 }}>{c.correct}/{c.total} correct</div>
                    </div>
                    {/* Mini progress bar */}
                    <div style={{ width: 60, height: 6, borderRadius: 3, background: SLATE_700, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${c.accuracy}%`,
                          height: "100%",
                          borderRadius: 3,
                          background: c.accuracy >= 70 ? GREEN : c.accuracy >= 50 ? AMBER : RED,
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── Two-column: AI Sessions + Recommended Resources ── */}
        <div className="dashboard-two-col" style={{ display: "grid", gap: 16, marginBottom: 16 }}>
          {/* ── AI Tutor Session History ── */}
          <Section title="🤖 AI Tutor Sessions" style={{ margin: 0 }}>
            {aiSessions.isLoading ? (
              <Skeleton height={140} />
            ) : (aiSessions.data?.length ?? 0) === 0 ? (
              <EmptyState text="No AI tutor sessions yet. Open the AI Tutor during a quiz to get personalized help." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {aiSessions.data?.slice(0, 5).map((s) => (
                  <div
                    key={s.id}
                    style={{
                      background: SLATE_900,
                      borderRadius: 10,
                      padding: "12px 14px",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background: BLUE + "20",
                          color: BLUE,
                        }}
                      >
                        {EXAM_TYPE_LABELS[s.examType] ?? s.examType}
                      </span>
                      <span style={{ color: "#64748B", fontSize: 11 }}>
                        {new Date(s.sessionStart).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                        {" \u00B7 "}
                        {s.messageCount} msgs
                      </span>
                    </div>
                    <div style={{ color: "#64748B", fontSize: 12, lineHeight: 1.5 }}>
                      {s.summary.length > 120 ? s.summary.slice(0, 117) + "\u2026" : s.summary}
                    </div>
                    {s.topicsCovered && (
                      <div style={{ color: "#64748B", fontSize: 11, marginTop: 6 }}>
                        Topics: {s.topicsCovered}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* ── Recommended Resources ── */}
          <Section title="📚 Recommended For You" style={{ margin: 0 }}>
            {recommendedResources.isLoading ? (
              <Skeleton height={140} />
            ) : (recommendedResources.data?.length ?? 0) === 0 ? (
              <EmptyState text="Answer more questions to get personalized resource recommendations." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recommendedResources.data?.map((r, i) => (
                  <a
                    key={i}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block",
                      background: SLATE_900,
                      borderRadius: 10,
                      padding: "12px 14px",
                      border: "1px solid #E2E8F0",
                      textDecoration: "none",
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = BLUE)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = SLATE_700)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14 }}>
                        {r.type === "official" ? "\ud83c\udfe2" : r.type === "video" ? "\ud83c\udfac" : r.type === "textbook" ? "\ud83d\udcd6" : r.type === "practice" ? "\u270d\ufe0f" : r.type === "community" ? "\ud83d\udcac" : "\ud83d\udee0\ufe0f"}
                      </span>
                      <span style={{ color: "#1E293B", fontSize: 13, fontWeight: 700 }}>{r.title}</span>
                    </div>
                    <div style={{ color: "#94A3B8", fontSize: 11, lineHeight: 1.4 }}>
                      {r.description.length > 100 ? r.description.slice(0, 97) + "\u2026" : r.description}
                    </div>
                    {r.reason && (
                      <div style={{ color: TEAL, fontSize: 11, marginTop: 4, fontWeight: 600 }}>
                        \u2192 {r.reason}
                      </div>
                    )}
                  </a>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* ── Recent Sessions ── */}
        <Section title="🕐 Recent Sessions">
          {recentSessions.isLoading ? (
            <Skeleton height={120} />
          ) : (recentSessions.data?.length ?? 0) === 0 ? (
            <EmptyState text="No sessions recorded yet. Complete a quiz to see your session history." />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${SLATE_700}` }}>
                    <th style={{ textAlign: "left", padding: "8px 12px", color: "#94A3B8", fontWeight: 600, fontSize: 11 }}>Date</th>
                    <th style={{ textAlign: "left", padding: "8px 12px", color: "#94A3B8", fontWeight: 600, fontSize: 11 }}>Course</th>
                    <th style={{ textAlign: "left", padding: "8px 12px", color: "#94A3B8", fontWeight: 600, fontSize: 11 }}>Mode</th>
                    <th style={{ textAlign: "right", padding: "8px 12px", color: "#94A3B8", fontWeight: 600, fontSize: 11 }}>Score</th>
                    <th style={{ textAlign: "right", padding: "8px 12px", color: "#94A3B8", fontWeight: 600, fontSize: 11 }}>Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.data?.map((s, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${SLATE_800}` }}>
                      <td style={{ padding: "10px 12px", color: "#64748B" }}>
                        {new Date(s.startedAt).toLocaleDateString("en-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#1E293B", fontWeight: 600 }}>
                        {EXAM_TYPE_LABELS[s.examType] ?? s.examType}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#94A3B8", textTransform: "capitalize" }}>
                        {s.quizMode ?? "standard"}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#1E293B", textAlign: "right", fontFamily: "'Sora', sans-serif", fontWeight: 700 }}>
                        {s.correct}/{s.total}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            background: s.accuracy >= 70 ? GREEN + "20" : s.accuracy >= 50 ? AMBER + "20" : RED + "20",
                            color: s.accuracy >= 70 ? GREEN : s.accuracy >= 50 ? AMBER : RED,
                          }}
                        >
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
