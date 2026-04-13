/**
 * Student Performance Dashboard
 * Surfaces study progress, accuracy trends, topic strengths/weaknesses, and streak data
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { usePageMeta } from "@/hooks/usePageMeta";
import SiteNav from "@/components/SiteNav";
import { getLoginUrl } from "@/const";
import { useMemo } from "react";
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
const SLATE_700 = "#334155";
const SLATE_800 = "#1E293B";
const SLATE_900 = "#0F172A";

export default function StudentDashboard() {
  usePageMeta({
    title: "My Dashboard — Echelon Institute",
    description: "Track your study progress, accuracy trends, and exam readiness.",
  });

  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const overview = trpc.dashboard.overview.useQuery(undefined, { enabled: isAuthenticated });
  const dailyActivity = trpc.dashboard.dailyActivity.useQuery(undefined, { enabled: isAuthenticated });
  const topicAccuracy = trpc.dashboard.topicAccuracy.useQuery(undefined, { enabled: isAuthenticated });
  const courseBreakdown = trpc.dashboard.courseBreakdown.useQuery(undefined, { enabled: isAuthenticated });
  const difficultyBreakdown = trpc.dashboard.difficultyBreakdown.useQuery(undefined, { enabled: isAuthenticated });
  const recentSessions = trpc.dashboard.recentSessions.useQuery(undefined, { enabled: isAuthenticated });

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

  /* ── Not authenticated ── */
  if (authLoading) {
    return (
      <div style={{ fontFamily: "Sora, sans-serif", background: SLATE_900, minHeight: "100vh" }}>
        <SiteNav currentPath="/dashboard" />
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <div style={{ color: "#94A3B8", fontSize: 16 }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ fontFamily: "Sora, sans-serif", background: SLATE_900, minHeight: "100vh" }}>
        <SiteNav currentPath="/dashboard" />
        <div style={{ maxWidth: 500, margin: "0 auto", padding: "100px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <h1 style={{ color: "#F1F5F9", fontSize: 26, fontWeight: 800, marginBottom: 12 }}>
            Performance Dashboard
          </h1>
          <p style={{ color: "#94A3B8", fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
            Sign in to track your study progress, accuracy trends, and exam readiness across all your courses.
          </p>
          <a
            href={getLoginUrl()}
            style={{
              display: "inline-block",
              padding: "12px 32px",
              background: `linear-gradient(135deg, ${BLUE}, ${TEAL})`,
              color: "#fff",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 15,
              textDecoration: "none",
            }}
          >
            Sign In to View Dashboard
          </a>
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
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: "#F1F5F9", fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
            📊 My Dashboard
          </h1>
          <p style={{ color: "#94A3B8", fontSize: 14, marginTop: 6 }}>
            Welcome back, {user?.name?.split(" ")[0] ?? "Operator"}. Here's your study progress.
          </p>
        </div>

        {/* ── Hero Stats Row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 28 }}>
          <StatCard label="Questions Answered" value={isLoading ? "—" : String(stats?.totalAttempts ?? 0)} icon="📝" color={BLUE} />
          <StatCard label="Overall Accuracy" value={isLoading ? "—" : `${stats?.overallAccuracy ?? 0}%`} icon="🎯" color={stats?.overallAccuracy && stats.overallAccuracy >= 70 ? GREEN : AMBER} />
          <StatCard label="Current Streak" value={isLoading ? "—" : `${stats?.currentStreak ?? 0} day${(stats?.currentStreak ?? 0) !== 1 ? "s" : ""}`} icon="🔥" color={AMBER} />
          <StatCard label="Longest Streak" value={isLoading ? "—" : `${stats?.longestStreak ?? 0} days`} icon="🏆" color={TEAL} />
        </div>

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
                      y: { ticks: { color: "#CBD5E1", font: { size: 11, family: "Sora" } }, grid: { display: false } },
                    },
                  }}
                />
              </div>
            )}
            {/* Weak topics alert */}
            {(topicAccuracy.data?.weakTopics.length ?? 0) > 0 && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: RED + "15", border: `1px solid ${RED}33`, borderRadius: 10 }}>
                <div style={{ color: RED, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>⚠️ Focus Areas (below 65%)</div>
                <div style={{ color: "#F1F5F9", fontSize: 13 }}>
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
                    border: `1px solid ${SLATE_700}`,
                  }}
                >
                  <div style={{ color: "#F1F5F9", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                    {EXAM_TYPE_LABELS[c.examType] ?? c.examType}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <div style={{ color: c.accuracy >= 70 ? GREEN : c.accuracy >= 50 ? AMBER : RED, fontSize: 22, fontWeight: 900, fontFamily: "Nunito, sans-serif" }}>
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
                      <td style={{ padding: "10px 12px", color: "#CBD5E1" }}>
                        {new Date(s.startedAt).toLocaleDateString("en-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#F1F5F9", fontWeight: 600 }}>
                        {EXAM_TYPE_LABELS[s.examType] ?? s.examType}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#94A3B8", textTransform: "capitalize" }}>
                        {s.quizMode ?? "standard"}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#F1F5F9", textAlign: "right", fontFamily: "Nunito, sans-serif", fontWeight: 700 }}>
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
        border: `1px solid ${SLATE_700}`,
        borderRadius: 14,
        padding: "18px 16px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ color, fontSize: 24, fontWeight: 900, fontFamily: "Nunito, sans-serif", lineHeight: 1.1 }}>{value}</div>
      <div style={{ color: "#94A3B8", fontSize: 11, fontWeight: 600, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Section({ title, children, style: extraStyle }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: SLATE_800,
        border: `1px solid ${SLATE_700}`,
        borderRadius: 16,
        padding: "20px 20px 16px",
        marginBottom: 16,
        ...extraStyle,
      }}
    >
      <h2 style={{ color: "#F1F5F9", fontSize: 16, fontWeight: 800, margin: "0 0 14px", letterSpacing: "-0.01em" }}>
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
