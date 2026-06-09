// Echelon Institute — My Courses Page
// Shows all courses the signed-in student has purchased, with direct links to practice and mock exams.

import { useEffect, useState } from "react";
import { Link } from "wouter";
import SiteNav from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ALL_PRODUCTS, PRODUCT_STUDY_PATHS } from "@shared/products";

/* ── Design tokens ── */
const SLATE_900 = "#0F172A";
const SLATE_800 = "#1E293B";
const SLATE_700 = "#334155";
const BLUE = "#3B82F6";
const TEAL = "#14B8A6";

/* ── Exam type → product key reverse map ── */
const EXAM_TYPE_TO_PRODUCT_KEY: Record<string, string> = {};
for (const p of ALL_PRODUCTS) {
  for (const t of p.examTypes) {
    EXAM_TYPE_TO_PRODUCT_KEY[t] = p.key;
  }
}

/* ── Course card data ── */
interface CourseCard {
  key: string;
  shortName: string;
  name: string;
  quizPath: string;
  mockPath: string;
}

function getCoursesFromLocalStorage(): CourseCard[] {
  try {
    const productKeys: string[] = JSON.parse(localStorage.getItem("echelon_purchased_products") ?? "[]");
    const examTypes: string[] = JSON.parse(localStorage.getItem("echelon_subscription_exam_types") ?? "[]");

    // Collect all product keys from both sources
    const allKeys = new Set<string>(productKeys);
    for (const et of examTypes) {
      const pk = EXAM_TYPE_TO_PRODUCT_KEY[et];
      if (pk) allKeys.add(pk);
    }

    const cards: CourseCard[] = [];
    for (const key of Array.from(allKeys)) {
      const product = ALL_PRODUCTS.find(p => p.key === key);
      const paths = PRODUCT_STUDY_PATHS[key];
      if (product && paths) {
        cards.push({
          key,
          shortName: product.shortName,
          name: product.name,
          quizPath: paths.quizPath,
          mockPath: paths.mockPath,
        });
      }
    }
    return cards;
  } catch {
    return [];
  }
}

export default function MyCourses() {
  usePageMeta({
    title: "My Courses — Echelon Institute",
    description: "Access your purchased courses and start practising for your exam.",
  });

  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const dashboardMe = trpc.dashboardAuth.me.useQuery();
  const dashboardLogout = trpc.dashboardAuth.logout.useMutation();
  const utils = trpc.useUtils();

  const [courses, setCourses] = useState<CourseCard[]>([]);
  // Read localStorage synchronously so it's available on first render
  // (before useEffect fires), preventing false auth redirects.
  const [email, setEmail] = useState<string | null>(() => {
    try {
      return localStorage.getItem("echelon_subscription_email") ?? localStorage.getItem("echelon_trial_email") ?? null;
    } catch { return null; }
  });

  // Load courses from localStorage on mount
  useEffect(() => {
    setCourses(getCoursesFromLocalStorage());
    try {
      const stored = localStorage.getItem("echelon_subscription_email") ?? localStorage.getItem("echelon_trial_email") ?? null;
      setEmail(stored);
    } catch { /* ignore */ }
  }, []);

  // Auth gate logic:
  // - While loading: show spinner (never redirect mid-load)
  // - After both resolve: redirect only if no session AND no Manus auth
  // - localStorage email is used to keep the page visible during load
  //   and as a fallback if the cookie check fails transiently
  const authResolved = !authLoading && !dashboardMe.isLoading;
  const emailSession = dashboardMe.data?.email ?? null;
  const hasAccess = isAuthenticated || !!emailSession;
  // Only show loading spinner if we have no local email hint (avoids flash for returning users)
  const showLoading = (authLoading || dashboardMe.isLoading) && !email;

  if (showLoading) {
    return (
      <div style={{ fontFamily: "Sora, sans-serif", background: SLATE_900, minHeight: "100vh" }}>
        <SiteNav currentPath="/my-courses" />
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <div style={{ color: "#94A3B8", fontSize: 16 }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (authResolved && !hasAccess) {
    // If localStorage has an email but the server session is gone, clear stale data
    // and redirect to login so they can re-authenticate
    if (email) {
      try {
        localStorage.removeItem("echelon_subscription_email");
        localStorage.removeItem("echelon_trial_email");
        localStorage.removeItem("echelon_access_token");
        localStorage.removeItem("echelon_trial_unlocked");
      } catch { /* ignore */ }
    }
    window.location.replace("/login");
    return null;
  }

  const displayEmail = emailSession ?? email ?? user?.email ?? null;
  const displayName = user?.name?.split(" ")[0] ?? emailSession?.split("@")[0] ?? email?.split("@")[0] ?? "Operator";

  const handleLogout = async () => {
    await dashboardLogout.mutateAsync();
    await utils.dashboardAuth.me.invalidate();
    try {
      localStorage.removeItem("echelon_trial_unlocked");
      localStorage.removeItem("echelon_trial_email");
      localStorage.removeItem("echelon_subscription_email");
      localStorage.removeItem("echelon_access_token");
      localStorage.removeItem("echelon_subscription_exam_types");
      localStorage.removeItem("echelon_purchased_products");
    } catch { /* ignore */ }
    window.location.href = "/";
  };

  return (
    <div style={{ fontFamily: "Sora, sans-serif", background: SLATE_900, minHeight: "100vh" }}>
      <SiteNav currentPath="/my-courses" />

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 20px 120px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ color: "#F1F5F9", fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
              📚 My Courses
            </h1>
            <p style={{ color: "#94A3B8", fontSize: 14, marginTop: 6 }}>
              Welcome back, {displayName}. {displayEmail && <span style={{ color: "#64748B" }}>({displayEmail})</span>}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/dashboard">
              <a style={{
                background: "none", border: `1px solid ${SLATE_700}`, borderRadius: 8,
                padding: "6px 14px", color: "#94A3B8", fontSize: 13, cursor: "pointer",
                textDecoration: "none", display: "inline-block",
              }}>
                📊 Progress Dashboard
              </a>
            </Link>
            <button
              onClick={handleLogout}
              disabled={dashboardLogout.isPending}
              style={{
                background: "none", border: `1px solid ${SLATE_700}`, borderRadius: 8,
                padding: "6px 14px", color: "#64748B", fontSize: 13, cursor: "pointer",
              }}
            >
              {dashboardLogout.isPending ? "Signing out..." : "🚪 Log Out"}
            </button>
          </div>
        </div>

        {/* Course cards */}
        {courses.length === 0 ? (
          <div style={{
            background: SLATE_800, borderRadius: 16, padding: "48px 32px", textAlign: "center",
            border: `1px solid ${SLATE_700}`,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
            <h2 style={{ color: "#F1F5F9", fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>
              No courses found
            </h2>
            <p style={{ color: "#94A3B8", fontSize: 14, margin: "0 0 24px", lineHeight: 1.6 }}>
              Your purchased courses will appear here. If you've recently purchased, try signing out and signing back in.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/pricing" style={{
                background: `linear-gradient(135deg, ${BLUE}, ${TEAL})`,
                color: "#fff", padding: "10px 20px", borderRadius: 8, textDecoration: "none",
                fontSize: 14, fontWeight: 700,
              }}>
                Browse Courses →
              </a>
              <a href="/account" style={{
                background: "none", border: `1px solid ${SLATE_700}`, color: "#94A3B8",
                padding: "10px 20px", borderRadius: 8, textDecoration: "none", fontSize: 14,
              }}>
                Restore Access
              </a>
            </div>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}>
            {courses.map(course => (
              <div key={course.key} style={{
                background: SLATE_800,
                borderRadius: 16,
                padding: "24px 20px",
                border: `1px solid ${SLATE_700}`,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}>
                <div>
                  <div style={{
                    display: "inline-block",
                    background: `${BLUE}22`,
                    color: BLUE,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "3px 10px",
                    borderRadius: 20,
                    marginBottom: 10,
                  }}>
                    Unlocked
                  </div>
                  <h3 style={{ color: "#F1F5F9", fontSize: 16, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>
                    {course.shortName}
                  </h3>
                  <p style={{ color: "#64748B", fontSize: 12, margin: "4px 0 0", lineHeight: 1.5 }}>
                    {course.name}
                  </p>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                  <a href={course.quizPath} style={{
                    flex: 1,
                    background: `linear-gradient(135deg, ${BLUE}, ${TEAL})`,
                    color: "#fff",
                    padding: "10px 0",
                    borderRadius: 8,
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 700,
                    textAlign: "center",
                    display: "block",
                  }}>
                    Practice →
                  </a>
                  <a href={course.mockPath} style={{
                    flex: 1,
                    background: "none",
                    border: `1px solid ${SLATE_700}`,
                    color: "#94A3B8",
                    padding: "10px 0",
                    borderRadius: 8,
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 600,
                    textAlign: "center",
                    display: "block",
                  }}>
                    Mock Exam
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom nav to dashboard */}
        {courses.length > 0 && (
          <div style={{ marginTop: 32, textAlign: "center" }}>
            <Link href="/dashboard">
              <a style={{ color: "#64748B", fontSize: 13, textDecoration: "none" }}>
                View your progress dashboard →
              </a>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
