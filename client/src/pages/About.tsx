// Echelon Institute — About Page
// Tells the story, mission, and Ontario exam context

import { Link } from "wouter";
import { useState } from "react";
import SiteNav from "@/components/SiteNav";

const TIMELINE = [
  {
    year: "2019",
    title: "The Problem Identified",
    body: "A Class 3 water treatment operator in Ontario noticed that the only study resources available were outdated PDF manuals and generic quiz apps built for American exams. Ontario's regulatory framework — O. Reg. 170/03, 128/04, and the OWWCO certification ladder — was nowhere to be found in any modern study tool.",
  },
  {
    year: "2021",
    title: "First Question Bank Built",
    body: "Working evenings and weekends, the first version of the question bank was assembled — 200 questions mapped to Ontario-specific regulations, CT values, and process chemistry. Shared privately with a study group of 12 operators preparing for their Class 1 exam.",
  },
  {
    year: "2023",
    title: "AI Tutor Prototype",
    body: "With advances in large language models, an AI tutor was integrated that could explain Ontario-specific concepts, walk through dosing calculations step by step, and answer questions about the OWWCO exam structure. The prototype was tested with 40 operators across Ontario.",
  },
  {
    year: "2025",
    title: "Echelon Institute Launched",
    body: "Echelon Institute launched publicly with 475 OIT practice questions, 10 study modules, interactive process diagrams, a chemical feed calculator, and the AI Tutor — all built specifically for Ontario water and wastewater operators.",
  },
];

const STATS = [
  { value: "475", label: "OIT Practice Questions" },
  { value: "10", label: "Study Modules" },
  { value: "3", label: "Certification Tracks" },
  { value: "100%", label: "Ontario-Specific Content" },
];

const VALUES = [
  {
    icon: "🎯",
    title: "Ontario-First",
    body: "Every question, formula, and regulation reference is specific to Ontario's licensing framework. We don't repurpose American content — we build from the OWWCO exam structure and Ontario Drinking Water Quality Standards.",
  },
  {
    icon: "🧠",
    title: "Understand, Don't Memorize",
    body: "The AI Tutor and step-by-step solutions are designed to build genuine understanding of water treatment processes — not just pattern-match exam answers. Operators who understand the chemistry pass and stay safe on the job.",
  },
  {
    icon: "🔬",
    title: "Built by Operators",
    body: "The curriculum was developed with input from licensed operators across Ontario — Class 1 through Class 4, water and wastewater. The content reflects what actually appears on exams and what matters in real plant operations.",
  },
  {
    icon: "📈",
    title: "Career-Long Learning",
    body: "Certification is not a destination — it's a career ladder. Echelon Institute is designed to support operators from their first OIT exam through Class 4, with content that grows with your career.",
  },
];

export default function About() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", fontFamily: "'Sora', sans-serif" }}>

      <SiteNav currentPath="/about" />

      {/* ── HERO ── */}
      <section style={{
        background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)",
        padding: "80px 24px 72px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{
            display: "inline-block",
            background: "rgba(96,165,250,0.15)",
            border: "1px solid rgba(96,165,250,0.3)",
            borderRadius: 20,
            padding: "6px 18px",
            fontSize: 11,
            fontWeight: 700,
            color: "#60A5FA",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 20,
          }}>
            Our Story
          </div>
          <h1 style={{
            fontSize: "clamp(28px, 5vw, 48px)",
            fontWeight: 900,
            color: "#FFFFFF",
            margin: "0 0 20px 0",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}>
            Built by Ontario Operators,<br />for Ontario Operators
          </h1>
          <p style={{
            fontSize: 17,
            color: "rgba(255,255,255,0.7)",
            lineHeight: 1.75,
            maxWidth: 600,
            margin: "0 auto",
          }}>
            Echelon Institute exists because Ontario's water and wastewater operators deserved
            a study platform that actually understood their exams, their regulations, and their career.
          </p>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{
        background: "#FFFFFF",
        borderBottom: "1px solid #E2E8F0",
        padding: "28px 24px",
      }}>
        <div style={{
          maxWidth: 900,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 24,
          textAlign: "center",
        }}>
          {STATS.map(s => (
            <div key={s.label}>
              <div style={{
                fontSize: 32,
                fontWeight: 900,
                color: "#1D4ED8",
                fontFamily: "'Sora', sans-serif",
                letterSpacing: "-0.02em",
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600, marginTop: 4 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MISSION ── */}
      <section style={{ padding: "72px 24px", maxWidth: 800, margin: "0 auto" }}>
        <h2 style={{
          fontSize: "clamp(22px, 3vw, 32px)",
          fontWeight: 800,
          color: "#0F172A",
          margin: "0 0 20px 0",
          letterSpacing: "-0.02em",
        }}>
          Why Echelon Exists
        </h2>
        <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.8, marginBottom: 16 }}>
          Ontario's water and wastewater sector is one of the most regulated and technically demanding
          in the country. Operators must pass OWWCO-administered exams to earn each certification level —
          from the Operator-in-Training (OIT) through Class 4. These exams cover Ontario-specific
          regulations (O. Reg. 170/03, 128/04, 129/04), process chemistry, hydraulics, and complex
          dosing calculations.
        </p>
        <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.8, marginBottom: 16 }}>
          Yet until Echelon, the only study resources available were outdated PDF manuals, American
          exam prep apps that referenced the wrong regulations, and informal study groups sharing
          hand-written notes. Operators were spending hundreds of hours studying the wrong material
          and failing exams they were otherwise qualified to pass.
        </p>
        <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.8 }}>
          Echelon Institute was built to fix that. Every question in our bank is mapped to Ontario's
          regulatory framework. Every formula on our Formula Sheet is one that appears on Ontario exams.
          The AI Tutor is trained on Ontario-specific process chemistry and can explain why a CT value
          matters, how to calculate a chlorine dose for a specific flow rate, or what O. Reg. 170/03
          requires for turbidity monitoring.
        </p>
      </section>

      {/* ── TIMELINE ── */}
      <section style={{
        background: "#0F172A",
        padding: "72px 24px",
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{
            fontSize: "clamp(22px, 3vw, 32px)",
            fontWeight: 800,
            color: "#FFFFFF",
            margin: "0 0 48px 0",
            letterSpacing: "-0.02em",
            textAlign: "center",
          }}>
            How We Got Here
          </h2>
          <div style={{ position: "relative" }}>
            {/* Vertical line */}
            <div style={{
              position: "absolute",
              left: 56,
              top: 0,
              bottom: 0,
              width: 2,
              background: "rgba(255,255,255,0.1)",
            }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
              {TIMELINE.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                  <div style={{
                    minWidth: 56,
                    textAlign: "center",
                    position: "relative",
                    zIndex: 1,
                  }}>
                    <div style={{
                      background: "#1D4ED8",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "6px 8px",
                      borderRadius: 8,
                      letterSpacing: "0.02em",
                    }}>
                      {item.year}
                    </div>
                  </div>
                  <div style={{ paddingTop: 4 }}>
                    <div style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#FFFFFF",
                      marginBottom: 8,
                    }}>
                      {item.title}
                    </div>
                    <div style={{
                      fontSize: 13,
                      color: "rgba(255,255,255,0.65)",
                      lineHeight: 1.75,
                    }}>
                      {item.body}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section style={{ padding: "72px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{
            fontSize: "clamp(22px, 3vw, 32px)",
            fontWeight: 800,
            color: "#0F172A",
            margin: "0 0 12px 0",
            letterSpacing: "-0.02em",
            textAlign: "center",
          }}>
            What We Stand For
          </h2>
          <p style={{
            fontSize: 15,
            color: "#64748B",
            textAlign: "center",
            maxWidth: 500,
            margin: "0 auto 48px",
          }}>
            Four principles that guide every decision we make about content, tools, and curriculum.
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 24,
          }}>
            {VALUES.map(v => (
              <div key={v.title} style={{
                background: "#FFFFFF",
                borderRadius: 16,
                padding: "28px 24px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>{v.icon}</div>
                <div style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#0F172A",
                  marginBottom: 10,
                }}>
                  {v.title}
                </div>
                <div style={{
                  fontSize: 13,
                  color: "#475569",
                  lineHeight: 1.75,
                }}>
                  {v.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        background: "linear-gradient(135deg, #1D4ED8, #0E7490)",
        padding: "64px 24px",
        textAlign: "center",
      }}>
        <h2 style={{
          fontSize: "clamp(22px, 3vw, 32px)",
          fontWeight: 800,
          color: "#FFFFFF",
          margin: "0 0 12px 0",
          letterSpacing: "-0.02em",
        }}>
          Start with the OIT — It's Free
        </h2>
        <p style={{
          fontSize: 15,
          color: "rgba(255,255,255,0.8)",
          margin: "0 0 32px 0",
          maxWidth: 480,
          marginLeft: "auto",
          marginRight: "auto",
        }}>
          Try 475 OIT practice questions across 10 modules with full AI Tutor access.
          No account required.
        </p>
        <Link href="/quiz">
          <button style={{
            padding: "16px 40px",
            borderRadius: 12,
            background: "#FFFFFF",
            color: "#1D4ED8",
            border: "none",
            fontSize: 16,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "inherit",
            boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
          }}>
            Start Free OIT Practice →
          </button>
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background: "#0F172A",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        padding: "32px 24px",
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: "'Sora', sans-serif",
          fontWeight: 800,
          fontSize: 16,
          color: "#FFFFFF",
          marginBottom: 8,
        }}>
          Echelon Institute
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
          Ontario Water & Wastewater Operator Exam Prep · Built for OWWCO Certification
        </div>
        <div style={{ marginTop: 16, display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
          {[
            { label: "Home", href: "/" },
            { label: "OIT Practice", href: "/quiz" },
            { label: "Formula Sheet", href: "/formulas" },
            { label: "Career Map", href: "/career" },
            { label: "About", href: "/about" },
          ].map(l => (
            <Link key={l.href} href={l.href}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
                {l.label}
              </span>
            </Link>
          ))}
        </div>
      </footer>

      <style>{`
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .mobile-nav-toggle { display: block !important; }
        }
      `}</style>
    </div>
  );
}
