// Echelon Institute — About Page (accurate content only)

import { Link } from "wouter";
import LandingNav from "@/components/LandingNav";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/_core/hooks/useAuth";

const TIMELINE = [
  {
    year: "2025",
    title: "The Gap Identified",
    body: "Ay Bello, an Environmental Engineer (EIT) and Master's student in Digital Transformation at the University of Ottawa, identified a clear gap in Canada's water sector — operators were studying for some of the most technically demanding exams in the trades with resources that hadn't evolved in decades.",
  },
  {
    year: "Early 2026",
    title: "Built from Scratch",
    body: "Using AI-assisted development, Echelon Institute was designed and built from the ground up — interactive SVG process diagrams, an adaptive practice engine, an AI tutor with confidence scoring and pattern detection, and a full career path and salary map based on real 2025 OCWA data.",
  },
  {
    year: "2026",
    title: "Platform Launched",
    body: "Echelon Institute launched publicly with 500+ OIT practice questions, 10 study modules, interactive process diagrams for both drinking water and wastewater treatment, a pumping systems module, a lab and sampling module, and a formula reference — launching in Ontario with BC and Alberta coming next.",
  },
];

const VALUES = [
  {
    icon: "🍁",
    title: "Canada-First",
    body: "Every question, regulation reference, and process description is specific to each province's framework. Starting with Ontario (OWWCO/MECP), expanding to BC (EOCP) and Alberta (EPA). No American content repurposed for Canadian exams.",
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

export default function About() {
  usePageMeta({
    title: "About — Echelon Institute",
    description: "Echelon Institute was built to give Canadian water and wastewater operators the modern, interactive study tools they deserve — built on each province's actual regulatory framework.",
  });

  const { isAuthenticated } = useAuth({ lazy: true });

  return (
    <div style={{ background: "#FFFFFF", minHeight: "100vh", fontFamily: "'Sora', sans-serif" }}>
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
        background: "linear-gradient(135deg, #EFF6FF 0%, #E0F2FE 100%)",
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
            Canada's water sector deserved better study tools. We built them.
          </p>
        </div>
      </section>

      {/* ── WHY ECHELON EXISTS ── */}
      <section className="about-section" style={{ padding: "72px 24px", maxWidth: 800, margin: "0 auto" }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#FFFFFF", margin: "0 0 28px", letterSpacing: "-0.01em" }}>
          Why Echelon Exists
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {[
            "Canada's water and wastewater sector is one of the most regulated and technically demanding in the country. Operators must pass provincial exams to earn each certification level — from the Operator-in-Training (OIT) through Class 4. These exams cover province-specific regulations, process chemistry, hydraulics, and complex dosing calculations. Ontario uses OWWCO and MECP-administered exams; BC uses EOCP; Alberta uses the provincial EPA framework.",
            "Yet the only study resources available were a dense government study manual, expensive in-person courses built on decade-old PowerPoint slides, and American exam prep apps that referenced the wrong regulations entirely. There was nothing interactive. Nothing visual. Nothing that actually showed operators how a clarifier works before asking them to answer questions about it.",
            "Echelon Institute was built to fix that. Every question is mapped to each province's regulatory framework. Every visual module lets you see and interact with real treatment processes — not just read about them. The AI Tutor is trained on Canadian regulatory content and can explain why a CT value matters, how to calculate a chlorine dose for a specific flow rate, or what provincial regulations require for turbidity monitoring.",
          ].map((para, i) => (
            <p key={i} style={{
              fontSize: 16,
              color: "#64748B",
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
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#FFFFFF", margin: "0 0 36px", letterSpacing: "-0.01em" }}>
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
                <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", marginBottom: 8 }}>
                  {item.title}
                </div>
                <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.75, margin: 0 }}>
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT WE STAND FOR ── */}
      <section style={{
        background: "#FFFFFF",
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
                border: "1px solid rgba(0,0,0,0.09)",
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
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#FFFFFF", margin: 0, letterSpacing: "-0.01em" }}>
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
          }}>27 Courses Live</span>
          <span style={{ fontSize: 12, color: "#64748B", marginLeft: 8 }}>Last updated: May 2026</span>
        </div>
        <p style={{ fontSize: 15, color: "#64748B", margin: "0 0 36px", lineHeight: 1.7 }}>
          A running record of every course and feature added to the platform.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            {
              date: "May 2026",
              badge: "New",
              badgeColor: "#0F766E",
              title: "FAQ Section & Shared Navigation",
              body: "Added a dedicated FAQ section to the main landing page covering 8 common questions including time limits, provincial support, and refund policy. The WPI landing page now shares the same navigation as the main site for a consistent experience across all public pages.",
            },
            {
              date: "May 2026",
              badge: "",
              badgeColor: "#1D4ED8",
              title: "National Scope — 5 Provinces Live",
              body: "Echelon now explicitly supports Ontario (OWWCO/MECP), British Columbia (EOCP), Alberta (AWWOA/EPA), Saskatchewan (SAHO), and Manitoba (MWWA). The platform serves both water and wastewater operators at all certification levels from OIT through Class 4 across all five provinces.",
            },
            {
              date: "April 2026",
              badge: "New",
              badgeColor: "#0F766E",
              title: "Student Performance Dashboard",
              body: "Track your study progress in one place. The new dashboard shows total questions answered, overall accuracy, current and longest streaks, a 30-day activity chart, topic-by-topic accuracy breakdown, difficulty distribution, per-course progress, and recent session history. Access it from the top nav after logging in.",
            },
            {
              date: "April 2026",
              badge: "New",
              badgeColor: "#6D28D9",
              title: "WPI Class III & IV Wastewater Treatment",
              body: "1,000+ new questions across 15 modules for senior and chief operator-level WPI Wastewater certification. Class III covers advanced BNR, membrane bioreactors, industrial pretreatment, advanced biosolids, and regulatory compliance (~500 questions). Class IV covers advanced process control, BNR & resource recovery, plant management, and strategic regulatory compliance (~500 questions). Both include timed mock exam, formula sheet, and AI Tutor.",
            },
            {
              date: "April 2026",
              badge: "New",
              badgeColor: "#0369A1",
              title: "WPI Water & WPI Wastewater Full Ladder Bundles",
              body: "WPI Class I–IV Water Treatment, Wastewater Treatment, Water Distribution, and Wastewater Collection are all now live. 8,000+ questions total across all four tracks, aligned with WPI Need-to-Know Criteria, recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
            },
            {
              date: "April 2026",
              badge: "",
              badgeColor: "#7C3AED",
              title: "OIT Wastewater Treatment — Standalone Free Course",
              body: "OIT Wastewater is now available as its own dedicated free course. Covers primary and secondary treatment, biological processes, activated sludge, disinfection, biosolids basics, and regulatory fundamentals. Includes 500+ practice questions, adaptive quiz engine, AI Tutor, confidence scoring, process diagrams, and formula sheet.",
            },
            {
              date: "April 2026",
              badge: "",
              badgeColor: "#0F766E",
              title: "Class 4 Wastewater Treatment",
              body: "500 questions across 5 modules: Advanced Treatment, Equipment O&M, Lab Analysis, Biosolids Management, and Plant Management. Includes timed mock exam, formula sheet, and AI Tutor.",
            },
            {
              date: "March 2026",
              badge: "New",
              badgeColor: "#1D4ED8",
              title: "Class 4 Water Treatment",
              body: "500 questions covering full system management, regulatory leadership, advanced treatment, and strategic operations. Includes timed mock exam, formula sheet with 37 formulas, and AI Tutor.",
            },
            {
              date: "March 2026",
              badge: "",
              badgeColor: "#0F766E",
              title: "Class 3 Wastewater Treatment",
              body: "Advanced biological treatment, BNR, biosolids management, and process optimization. 500 questions, mock exam, formula sheet.",
            },
            {
              date: "February 2026",
              badge: "",
              badgeColor: "#1D4ED8",
              title: "Class 3 Water Treatment",
              body: "LSI, CT values, membranes, lime softening, SCADA, source water, and advanced process control. 500 questions, mock exam, formula sheet.",
            },
            {
              date: "February 2026",
              badge: "",
              badgeColor: "#0F766E",
              title: "Class 2 Wastewater Treatment",
              body: "Activated sludge, nutrient removal, advanced secondary treatment, and process control. 500 questions, mock exam, formula sheet.",
            },
            {
              date: "January 2026",
              badge: "",
              badgeColor: "#1D4ED8",
              title: "Class 2 Water Treatment",
              body: "Advanced treatment processes, SCADA, corrosion control, membrane filtration, and process troubleshooting. 500 questions, mock exam, formula sheet.",
            },
            {
              date: "January 2026",
              badge: "",
              badgeColor: "#0F766E",
              title: "Class 1 Wastewater Treatment",
              body: "Foundational wastewater treatment, biological processes, primary and secondary treatment, and basic operations. 500 questions, mock exam, formula sheet.",
            },
            {
              date: "January 2026",
              badge: "",
              badgeColor: "#1D4ED8",
              title: "Class 1 Water Treatment",
              body: "Core water treatment processes, coagulation, filtration, disinfection, and basic regulations. 500 questions, mock exam, formula sheet.",
            },
            {
              date: "Late 2025",
              badge: "",
              badgeColor: "#E2E8F0",
              title: "OIT Water & OIT Wastewater — Free Practice",
              body: "Platform launched with free OIT practice for both streams. Includes adaptive quiz engine, AI Tutor, confidence scoring, pattern detection, interactive process diagrams, and formula sheets.",
            },
          ].map((item, i) => (
            <div key={i} className="about-changelog-row" style={{
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
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.07em" }}>
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
                <div style={{ fontSize: 15, fontWeight: 700, color: "#FFFFFF", marginBottom: 4 }}>{item.title}</div>
                <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.7, margin: 0 }}>{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "72px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#FFFFFF", margin: "0 0 14px" }}>
            Ready to Start Studying?
          </h2>
          <p style={{ fontSize: 15, color: "#64748B", marginBottom: 32, lineHeight: 1.7 }}>
            500+ OIT practice questions, an AI Tutor that knows Canadian provincial regulations, and a formula sheet — all free.
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
            <Link href="/quiz">
              <button style={{
                padding: "14px 28px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg, #1D4ED8, #0F766E)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: "0 4px 16px rgba(29,78,216,0.3)",
              }}>
                Start Free OIT Practice →
              </button>
            </Link>
            <Link href="/formulas">
              <button style={{
                padding: "14px 28px",
                borderRadius: 10,
                border: "1px solid #E2E8F0",
                background: "#fff",
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}>
                View Formula Sheet
              </button>
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
        <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
          © 2026 Echelon Institute · Built for Canadian water and wastewater operators
        </p>
      </footer>

    </div>
  );
}
