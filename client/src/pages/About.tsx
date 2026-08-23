// Echelon Institute — About Page (accurate content only)

import { Link } from "wouter";
import LandingNav from "@/components/LandingNav";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { formatChangelogTimestamp, latestChangelogTimestamp } from "@shared/changelog";
import type { ChangelogEntry } from "../../../drizzle/schema";

const TIMELINE = [
  {
    year: "2025",
    title: "The Gap Identified",
    body: "Ay Bello, an Environmental Engineer (EIT) and Master of Digital Transformation and Innovation graduate from the University of Ottawa, identified a clear gap in Canada's water sector — operators were studying for some of the most technically demanding exams in the trades with resources that hadn't evolved in decades.",
  },
  {
    year: "Early 2026",
    title: "Built from Scratch",
    body: "Using AI-assisted development, Echelon Institute was designed and built from the ground up — interactive SVG process diagrams, an adaptive practice engine, an AI tutor with confidence scoring and pattern detection, and a full career path and salary map based on real 2025 OCWA data.",
  },
  {
    year: "2026",
    title: "Platform Launched",
    body: "Echelon Institute launched publicly in Ontario with 400+ OIT practice questions, 10 study modules, interactive process diagrams for drinking water and wastewater treatment, pumping and laboratory modules, and a formula reference. It later expanded with WPI-aligned preparation for operators in British Columbia, Alberta, Saskatchewan, and Manitoba.",
  },
];

const VALUES = [
  {
    icon: "🎯",
    title: "Operator-First",
    body: "Courses are organized around Ontario-specific or WPI-aligned operator topics. Echelon is an independent preparation provider, and candidates should always confirm current requirements with OWWCO, EOCP, or their applicable certifying authority.",
  },
  {
    icon: "🧠",
    title: "Understand, Don't Memorize",
    body: "The AI Tutor doesn't just tell you the answer — it explains why a CT value matters, how to calculate a chlorine dose for a specific flow rate, and what O. Reg. 170/03 requires for turbidity monitoring. Understanding beats memorization every time.",
  },
  {
    icon: "📈",
    title: "Career-Long Learning",
    body: "Certification is not a destination — it's a career ladder. Echelon Institute is designed to support operators from their first OIT exam through Class 4, with content that grows with your career.",
  },
];

function ChangelogList({ entries, isLoading, error }: {
  entries: ChangelogEntry[] | undefined;
  isLoading: boolean;
  error: { message: string } | null;
}) {
  if (isLoading) return <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>Loading changelog...</div>;
  if (error) return <div style={{ textAlign: "center", padding: 40, color: "#64748B" }}>The latest platform updates are temporarily unavailable.</div>;
  if (!entries || entries.length === 0) return <div style={{ textAlign: "center", padding: 40, color: "#64748B" }}>No platform updates have been published yet.</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {entries.map((item) => (
        <div key={item.id} className="about-changelog-row" style={{
          display: "flex",
          gap: 16,
          padding: "18px 22px",
          background: "#fff",
          borderRadius: 14,
          border: "1px solid #E2E8F0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          alignItems: "flex-start",
        }}>
          <div style={{ flexShrink: 0, paddingTop: 2 }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: item.badgeColor,
              marginTop: 4,
            }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                {item.date}
              </span>
              {item.badge && (
                <span style={{
                  background: item.badgeColor,
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: 20,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}>{item.badge}</span>
              )}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>{item.title}</div>
            <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, margin: 0 }}>{item.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function About() {
  usePageMeta({
    title: "About — Echelon Institute",
    description: "Echelon Institute was built to give water and wastewater operators the modern, interactive study tools they deserve — built on the actual regulatory frameworks they are tested on.",
  });

  const { isAuthenticated } = useAuth({ lazy: true });
  const changelogQuery = trpc.changelog.list.useQuery(undefined, {
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  const changelogUpdatedAt = formatChangelogTimestamp(
    latestChangelogTimestamp(changelogQuery.data ?? []),
  );

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", fontFamily: "'Sora', sans-serif" }}>
      <style>{`
        @media (max-width: 640px) {
          .about-hero { padding: 48px 16px 40px !important; }
          .about-section { padding: 48px 16px !important; }
          .about-timeline { padding-left: 24px !important; }
          .about-cta-btns { flex-direction: column !important; align-items: stretch !important; }
          .about-cta-btns a, .about-cta-btns button { width: 100% !important; box-sizing: border-box; }
          .about-changelog-row { flex-direction: column !important; gap: 8px !important; }
        }
      `}</style>

      <LandingNav isAuthenticated={isAuthenticated} currentPath="/about" />

      {/* ── HERO ── */}
      <section className="about-hero" style={{
        background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)",
        padding: "80px 24px 72px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{
            display: "inline-block",
            background: "rgba(96,165,250,0.12)",
            border: "1px solid rgba(96,165,250,0.25)",
            borderRadius: 20,
            padding: "6px 16px",
            fontSize: 12,
            fontWeight: 700,
            color: "#60A5FA",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 24,
          }}>
            About Echelon Institute
          </div>
          <h1 style={{
            fontSize: "clamp(28px, 5vw, 44px)",
            fontWeight: 900,
            color: "#FFFFFF",
            margin: "0 0 20px",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
          }}>
            Built by an Engineer<br />Who Knows What's Missing
          </h1>
          <p style={{
            fontSize: 17,
            color: "rgba(255,255,255,0.72)",
            lineHeight: 1.75,
            margin: "0 auto",
            maxWidth: 580,
          }}>
            Water and wastewater operators deserved better study tools. We built them.
          </p>
        </div>
      </section>

      {/* ── WHY ECHELON EXISTS ── */}
      <section className="about-section" style={{ padding: "72px 24px", maxWidth: 800, margin: "0 auto" }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", margin: "0 0 28px", letterSpacing: "-0.01em" }}>
          Why Echelon Exists
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {[
            "Water and wastewater operators work in one of the most regulated and technically demanding fields in the trades. Whether you are sitting the Ontario OIT or a WPI Class II Water Treatment exam in Iowa, the path to certification requires mastering process chemistry, hydraulics, complex dosing calculations, and a dense body of regulatory knowledge specific to your jurisdiction.",
            "Yet the only study resources available were dense government study manuals, expensive in-person courses built on decade-old PowerPoint slides, and generic prep apps that referenced the wrong regulations entirely. There was nothing interactive. Nothing visual. Nothing that actually showed operators how a clarifier works before asking them to answer questions about it.",
            "Echelon Institute was built to fix that. Every question is mapped to the actual exam framework — provincial for Canadian operators, WPI/ABC for US operators. Every visual module lets you see and interact with real treatment processes. The AI Tutor can explain why a CT value matters, how to calculate a chlorine dose for a specific flow rate, or what regulations require for turbidity monitoring — in plain language, with worked examples.",
          ].map((para, i) => (
            <p key={i} style={{
              fontSize: 16,
              color: "#334155",
              lineHeight: 1.8,
              margin: 0,
              padding: "20px 24px",
              background: "#fff",
              borderRadius: 14,
              border: "1px solid #E2E8F0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}>
              {para}
            </p>
          ))}
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section className="about-section" style={{ padding: "0 24px 72px", maxWidth: 800, margin: "0 auto" }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", margin: "0 0 36px", letterSpacing: "-0.01em" }}>
          How We Got Here
        </h2>

        <div className="about-timeline" style={{ position: "relative", paddingLeft: 32 }}>
          {/* Vertical line */}
          <div style={{
            position: "absolute",
            left: 11,
            top: 8,
            bottom: 8,
            width: 2,
            background: "linear-gradient(180deg, #1D4ED8, #0F766E)",
            borderRadius: 2,
          }} />

          {TIMELINE.map((item, i) => (
            <div key={i} style={{ position: "relative", marginBottom: i < TIMELINE.length - 1 ? 36 : 0 }}>
              {/* Dot */}
              <div style={{
                position: "absolute",
                left: -32,
                top: 6,
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #1D4ED8, #0F766E)",
                border: "3px solid #F8FAFC",
                boxShadow: "0 0 0 2px #1D4ED8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }} />

              <div style={{
                background: "#fff",
                borderRadius: 14,
                padding: "20px 24px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#1D4ED8",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}>
                  {item.year}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>
                  {item.title}
                </div>
                <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.75, margin: 0 }}>
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT WE STAND FOR ── */}
      <section style={{
        background: "#0F172A",
        padding: "72px 24px",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: "0 0 12px", letterSpacing: "-0.01em" }}>
            What We Stand For
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", margin: "0 0 40px", lineHeight: 1.7 }}>
            The curriculum was developed by an environmental engineer with deep knowledge of Canadian provincial regulatory frameworks — including Ontario (O. Reg. 170/03, 128/04, 129/04, OWWCO/MECP), BC (EOCP), and Alberta (EPA). Content reflects what actually appears on provincial exams and what matters in real plant operations.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {VALUES.map((v) => (
              <div key={v.title} style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 16,
                padding: "28px 24px",
              }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>{v.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 10 }}>{v.title}</div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.75, margin: 0 }}>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORM CHANGELOG ── */}
      <section style={{ padding: "72px 24px", maxWidth: 860, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: "-0.01em" }}>
            Platform Changelog
          </h2>
          <span style={{
            background: "linear-gradient(135deg, #0F766E, #0E7490)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 800,
            padding: "3px 10px",
            borderRadius: 20,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}>36 Courses Live</span>
          <span style={{ fontSize: 12, color: "#94A3B8", marginLeft: 8 }}>Last updated: {changelogUpdatedAt}</span>
        </div>
        <p style={{ fontSize: 15, color: "#64748B", margin: "0 0 36px", lineHeight: 1.7 }}>
          A running record of every course and feature added to the platform.
        </p>

        <ChangelogList
          entries={changelogQuery.data}
          isLoading={changelogQuery.isLoading}
          error={changelogQuery.error}
        />
      </section>

      {/* ── CTA ── */}
      <section style={{
        background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0E7490 100%)",
        padding: "80px 24px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }} />
        <div style={{ maxWidth: 560, margin: "0 auto", position: "relative" }}>
          <h2 style={{ fontSize: 30, fontWeight: 900, color: "#fff", margin: "0 0 14px", letterSpacing: "-0.02em" }}>
            Ready to Start Studying?
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", marginBottom: 36, lineHeight: 1.7 }}>
            Try the complete OIT study system free: 15 practice questions, 50 flashcards, 30 mock-exam questions, and three AI Tutor messages. No account or credit card required.
          </p>
          {/* Google Review CTA */}
          <a
            href="https://g.page/r/CWsjBbkUlS8rEBM/review"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 10,
              background: "#FEF9C3",
              border: "1.5px solid #FDE047",
              color: "#713F12",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
              marginBottom: 20,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <span style={{ fontSize: 16 }}>⭐</span>
            Enjoying Echelon? Leave us a Google Review
          </a>
          <div className="about-cta-btns" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/quiz" style={{ padding: "14px 28px", borderRadius: 10, background: "linear-gradient(135deg, #1D4ED8, #0F766E)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(29,78,216,0.3)", textDecoration: "none", textAlign: "center" }}>
              Start Free OIT Practice →
            </Link>
            <Link href="/formulas" style={{ padding: "14px 28px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textDecoration: "none", textAlign: "center" }}>
              View Formula Sheet
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: "1px solid #E2E8F0",
        padding: "28px 24px",
        textAlign: "center",
        background: "#fff",
      }}>
        <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>
          © 2026 Echelon Institute · Built for water and wastewater operators across North America
        </p>
      </footer>

    </div>
  );
}
