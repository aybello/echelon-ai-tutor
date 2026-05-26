// WPI Landing Page — BC / AB / SK / MB water & wastewater operator exam prep
// Rebuilt: Hero → Province table → Tabbed track selector → FAQ → Footer CTA

import { useState } from "react";
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import LandingNav from "@/components/LandingNav";
import { useAuth } from "@/_core/hooks/useAuth";

// ── Data ──────────────────────────────────────────────────────────────────────

const PROVINCES = [
  { code: "BC", name: "British Columbia", body: "EOCP",  url: "https://www.eocp.ca" },
  { code: "AB", name: "Alberta",          body: "AWWOA", url: "https://www.awwoa.ab.ca" },
  { code: "SK", name: "Saskatchewan",     body: "SAHO",  url: "https://www.saho.org" },
  { code: "MB", name: "Manitoba",         body: "MWWA",  url: "https://www.mwwa.net" },
];

type ClassEntry = {
  label: string;
  code: string;
  questions: number;
  price: string;
  color: string;
  quizHref: string;
  badge?: string;
  topics: string[];
};

type Track = {
  id: string;
  label: string;
  icon: string;
  classes: ClassEntry[];
};

const TRACKS: Track[] = [
  {
    id: "water",
    label: "Water Treatment",
    icon: "💧",
    classes: [
      {
        label: "Class I", code: "WPI-W1", questions: 502, price: "CA$149", color: "#0E7490",
        quizHref: "/wpi-class1-water",
        topics: ["Source water & intake", "Coagulation & flocculation", "Sedimentation & filtration", "Disinfection & CT values", "Basic regulations & safety"],
      },
      {
        label: "Class II", code: "WPI-W2", questions: 598, price: "CA$199", color: "#0F766E",
        quizHref: "/wpi-class2-water",
        topics: ["Advanced treatment processes", "System design & hydraulics", "Lab monitoring & analysis", "Source water management", "Regulatory compliance"],
      },
      {
        label: "Class III", code: "WPI-W3", questions: 531, price: "CA$249", color: "#1D4ED8",
        quizHref: "/wpi-class3-water",
        topics: ["LSI, CT values & membranes", "Lime softening & advanced processes", "SCADA & automation", "Water quality monitoring programs", "Senior operator responsibilities"],
      },
      {
        label: "Class IV", code: "WPI-W4", questions: 592, price: "CA$299", color: "#7C3AED",
        quizHref: "/wpi-class4-water", badge: "👑 Chief Operator",
        topics: ["Full system management", "Asset management & capital planning", "Advanced water quality & DWQMS", "Strategic regulatory compliance", "Emergency response & resilience"],
      },
    ],
  },
  {
    id: "wastewater",
    label: "Wastewater Treatment",
    icon: "🌊",
    classes: [
      {
        label: "Class I", code: "WPI-WW1", questions: 594, price: "CA$149", color: "#B45309",
        quizHref: "/wpi-class1-wastewater",
        topics: ["Collection systems & pipe materials", "Primary & secondary treatment", "Solids handling & biosolids", "Lab & monitoring", "Safety & regulations"],
      },
      {
        label: "Class II", code: "WPI-WW2", questions: 599, price: "CA$199", color: "#0F766E",
        quizHref: "/wpi-class2-wastewater",
        topics: ["Secondary treatment processes", "Nutrient removal (N & P)", "Biosolids management", "Advanced treatment", "Process control & safety"],
      },
      {
        label: "Class III", code: "WPI-WW3", questions: 607, price: "CA$249", color: "#1D4ED8",
        quizHref: "/wpi-class3-wastewater",
        topics: ["Advanced biological processes", "Tertiary treatment & reuse", "Sludge digestion & dewatering", "SCADA & instrumentation", "Regulatory reporting"],
      },
      {
        label: "Class IV", code: "WPI-WW4", questions: 606, price: "CA$299", color: "#6D28D9",
        quizHref: "/wpi-class4-wastewater", badge: "👑 Chief Operator",
        topics: ["Utility management & leadership", "Advanced process engineering", "Environmental compliance", "Capital planning & asset management", "Emerging technologies"],
      },
    ],
  },
  {
    id: "distribution",
    label: "Water Distribution",
    icon: "🔧",
    classes: [
      {
        label: "Class I", code: "WPI-D1", questions: 501, price: "CA$149", color: "#0369A1",
        quizHref: "/wpi-class1-water-dist",
        topics: ["Distribution system basics", "Pipe materials & fittings", "Pressure & flow fundamentals", "Chlorine residual maintenance", "Valve & hydrant operation"],
      },
      {
        label: "Class II", code: "WPI-D2", questions: 500, price: "CA$199", color: "#0F766E",
        quizHref: "/wpi-class2-water-dist",
        topics: ["Hydraulic analysis", "Pressure zone design", "Water quality management", "Cross-connection control", "Regulatory compliance"],
      },
      {
        label: "Class III", code: "WPI-D3", questions: 500, price: "CA$249", color: "#1D4ED8",
        quizHref: "/wpi-class3-water-dist",
        topics: ["Advanced hydraulic modelling", "Transmission main design", "Multi-zone systems", "SCADA & automation", "Water quality monitoring programs"],
      },
      {
        label: "Class IV", code: "WPI-D4", questions: 500, price: "CA$299", color: "#4C1D95",
        quizHref: "/wpi-class4-water-dist", badge: "👑 Chief Operator",
        topics: ["Large-scale system management", "Asset management & capital planning", "Advanced water quality & DWQMS", "Strategic regulatory compliance", "Emergency response & resilience"],
      },
    ],
  },
  {
    id: "collection",
    label: "Wastewater Collection",
    icon: "🚧",
    classes: [
      {
        label: "Class I", code: "WPI-C1", questions: 500, price: "CA$149", color: "#065F46",
        quizHref: "/wpi-class1-water-coll",
        topics: ["Collection system components", "Lift station operation & maintenance", "Confined space & safety", "Basic hydraulics & flow calculations", "Environmental & public health"],
      },
      {
        label: "Class II", code: "WPI-C2", questions: 504, price: "CA$199", color: "#1E3A5F",
        quizHref: "/wpi-class2-water-coll",
        topics: ["Advanced collection system design", "Intermediate lift station operations", "System maintenance & rehabilitation", "Hydraulics & flow analysis", "Regulatory compliance & reporting"],
      },
      {
        label: "Class III", code: "WPI-C3", questions: 504, price: "CA$249", color: "#7C3AED",
        quizHref: "/wpi-class3-water-coll",
        topics: ["Complex system operations & SCADA", "Advanced pump station engineering", "System hydraulic modelling", "Advanced maintenance management", "Leadership, safety & regulatory management"],
      },
      {
        label: "Class IV", code: "WPI-C4", questions: 504, price: "CA$299", color: "#7F1D1D",
        quizHref: "/wpi-class4-water-coll", badge: "👑 Chief Operator",
        topics: ["System planning & capital improvement", "Advanced engineering & design", "Utility management & leadership", "Advanced regulatory & environmental management", "Emerging technologies & innovation"],
      },
    ],
  },
];

const FAQS = [
  {
    q: "What is the WPI certification program?",
    a: "The Water & Wastewater Professionals Institute (WPI) administers operator certification exams recognized across BC, AB, SK, and MB. Certification levels range from Class I (entry-level) to Class IV (chief operator).",
  },
  {
    q: "How is WPI different from Ontario's OWWCO?",
    a: "WPI exams are used in western Canadian provinces (BC, AB, SK, MB), while OWWCO administers Ontario's certification program. The exam content, class structure, and certifying bodies are different — Echelon has separate question banks for each.",
  },
  {
    q: "Can I try before I buy?",
    a: "Yes — the first 15 questions of every course are free with no account required. You'll see the full question format, difficulty, and explanation style before purchasing.",
  },
  {
    q: "What's included in a practice pass?",
    a: "Each pass includes 500+ adaptive practice questions, a timed mock exam, a formula sheet, AI Tutor access, 400+ flashcards, and module study notes. Access is one-time purchase with no expiry.",
  },
  {
    q: "Do I need an account to start?",
    a: "No account is needed for the first 15 free questions. To save your progress, access the mock exam, and unlock all questions, you'll need to create a free account and purchase a pass.",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function WpiLanding() {
  const { isAuthenticated } = useAuth({ lazy: true });
  usePageMeta({
    title: "WPI Water Treatment Exam Prep — BC EOCP, Alberta AWWOA, SK, MB | Echelon Institute",
    description:
      "Prepare for the WPI Water & Wastewater exams with 8,000+ practice questions for Class I–IV Water Treatment, Wastewater Treatment, Water Distribution, and Wastewater Collection. Covers BC (EOCP), Alberta (AWWOA), Saskatchewan (SAHO), and Manitoba (MWWA).",
    path: "/wpi",
    keywords:
      "WPI exam prep, BC EOCP water treatment, Alberta AWWOA water operator, Saskatchewan SAHO water, Manitoba MWWA water, WPI Class I practice questions, WPI Class II practice questions, WPI Class III wastewater, WPI Class IV wastewater",
  });

  const [activeTrack, setActiveTrack] = useState<string>("water");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const track = TRACKS.find(t => t.id === activeTrack)!;

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&display=swap');
        .wpi-track-tab { transition: background 0.15s, color 0.15s, border-color 0.15s; }
        .wpi-track-tab:hover { background: #EFF6FF !important; color: #1D4ED8 !important; }
        .wpi-class-card { transition: box-shadow 0.15s, transform 0.15s; }
        .wpi-class-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.10) !important; transform: translateY(-2px); }
        @media (max-width: 768px) {
          .wpi-cards-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .wpi-province-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .wpi-cards-grid { grid-template-columns: 1fr !important; }
          .wpi-track-tabs { flex-wrap: wrap !important; }
          .wpi-hero-section { padding: 48px 16px 36px !important; }
          .wpi-section-pad { padding: 36px 16px !important; }
        }
      `}</style>

      <LandingNav isAuthenticated={isAuthenticated} currentPath="/wpi" />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="wpi-hero-section" style={{
        background: "linear-gradient(135deg, #0C4A6E 0%, #0E7490 50%, #0F766E 100%)",
        padding: "72px 20px 56px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 100, padding: "6px 16px", marginBottom: 24,
          }}>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
              🌊 WPI Exam Prep — BC · AB · SK · MB
            </span>
          </div>
          <h1 style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: "clamp(28px, 5vw, 46px)",
            fontWeight: 800, color: "#FFFFFF", lineHeight: 1.15,
            marginBottom: 20, letterSpacing: "-0.02em",
          }}>
            Pass Your WPI Water &amp; Wastewater Exam
          </h1>
          <p style={{
            fontSize: "clamp(15px, 2vw, 17px)", color: "rgba(255,255,255,0.8)",
            lineHeight: 1.7, marginBottom: 32, maxWidth: 560, margin: "0 auto 32px",
          }}>
            Canada's only AI-powered exam prep platform built for WPI-certified operators.
            500+ adaptive questions per class, mock exams, flashcards, and an AI tutor — available 24/7.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/wpi-class1-water">
              <button style={{
                background: "#0EA5E9", color: "#FFFFFF", border: "none",
                borderRadius: 10, padding: "13px 28px", fontSize: 15, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                Try Free — Class I Water →
              </button>
            </Link>
            <a href="#pricing">
              <button style={{
                background: "rgba(255,255,255,0.12)", color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.25)", borderRadius: 10,
                padding: "13px 28px", fontSize: 15, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                View All Passes
              </button>
            </a>
          </div>
          <div style={{ marginTop: 32, display: "flex", gap: 28, justifyContent: "center", flexWrap: "wrap" }}>
            {[["8,000+", "Questions in bank"], ["4", "Certification tracks"], ["16", "Class levels covered"], ["15", "Free questions per course"]].map(([stat, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, color: "#38BDF8" }}>{stat}</div>
                <div style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Province Recognition ───────────────────────────────────────── */}
      <section style={{ background: "#FFFFFF", padding: "40px 20px", borderBottom: "1px solid #E2E8F0" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 800, color: "#0F172A", textAlign: "center", marginBottom: 6 }}>
            Recognized Across Western Canada
          </h2>
          <p style={{ fontSize: 13, color: "#64748B", textAlign: "center", marginBottom: 20 }}>
            WPI certifications are administered by provincial bodies in 4 provinces.
          </p>
          <div className="wpi-province-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {PROVINCES.map(p => (
              <a key={p.code} href={p.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <div style={{
                  background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12,
                  padding: "16px 12px", textAlign: "center", cursor: "pointer",
                  transition: "border-color 0.15s",
                }}>
                  <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 2 }}>{p.code}</div>
                  <div style={{ fontSize: 11, color: "#64748B", fontWeight: 500, marginBottom: 6 }}>{p.name}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#0E7490", background: "#F0FDFF", padding: "3px 8px", borderRadius: 6, display: "inline-block" }}>{p.body}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tabbed Track Selector + Class Cards ───────────────────────── */}
      <section id="pricing" style={{ background: "#F8FAFC", padding: "56px 20px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, color: "#0F172A", textAlign: "center", marginBottom: 8 }}>
            Choose Your Certification Track
          </h2>
          <p style={{ fontSize: 14, color: "#64748B", textAlign: "center", marginBottom: 32 }}>
            Select a track, then choose your class level. Click any card to see the topic breakdown.
          </p>

          {/* Track tabs */}
          <div className="wpi-track-tabs" style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 32, flexWrap: "wrap" }}>
            {TRACKS.map(t => {
              const isActive = t.id === activeTrack;
              return (
                <button
                  key={t.id}
                  className="wpi-track-tab"
                  onClick={() => { setActiveTrack(t.id); setExpandedCard(null); }}
                  style={{
                    background: isActive ? "#0F172A" : "#FFFFFF",
                    color: isActive ? "#FFFFFF" : "#475569",
                    border: `1px solid ${isActive ? "#0F172A" : "#E2E8F0"}`,
                    borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  <span>{t.icon}</span> {t.label}
                </button>
              );
            })}
          </div>

          {/* Class cards grid */}
          <div className="wpi-cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {track.classes.map(cls => {
              const isExpanded = expandedCard === cls.code;
              return (
                <div
                  key={cls.code}
                  className="wpi-class-card"
                  style={{
                    background: "#FFFFFF",
                    border: `1px solid ${isExpanded ? cls.color + "55" : "#E2E8F0"}`,
                    borderRadius: 16, overflow: "hidden",
                    display: "flex", flexDirection: "column",
                    boxShadow: isExpanded ? `0 4px 16px ${cls.color}22` : "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  {/* Accent bar */}
                  <div style={{ height: 4, background: cls.color, flexShrink: 0 }} />

                  <div style={{ padding: "16px 16px 0", flex: 1 }}>
                    {/* Header row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: cls.color,
                        background: cls.color + "18", padding: "3px 8px", borderRadius: 5,
                        letterSpacing: "0.06em", textTransform: "uppercase" as const,
                      }}>
                        {cls.code}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: cls.color,
                        background: cls.color + "12", padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap" as const,
                      }}>
                        📝 {cls.questions} Q
                      </span>
                    </div>

                    {/* Class label + badge */}
                    <div style={{ marginBottom: 4 }}>
                      <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 800, color: "#0F172A" }}>{cls.label}</div>
                      {cls.badge && <div style={{ fontSize: 11, fontWeight: 700, color: cls.color, marginTop: 2 }}>{cls.badge}</div>}
                    </div>

                    {/* Price */}
                    <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800, color: "#0F172A", lineHeight: 1, marginBottom: 2 }}>{cls.price}</div>
                    <div style={{ fontSize: 11, color: "#64748B", marginBottom: 12 }}>One-time · unlimited access</div>

                    {/* Free trial */}
                    <div style={{ fontSize: 11, color: "#16A34A", fontWeight: 600, marginBottom: 12 }}>✓ 15 questions free — no account needed</div>

                    {/* Topics toggle */}
                    <button
                      onClick={() => setExpandedCard(isExpanded ? null : cls.code)}
                      style={{
                        width: "100%",
                        background: isExpanded ? cls.color + "0E" : "#F8FAFC",
                        border: `1px solid ${isExpanded ? cls.color + "33" : "#E2E8F0"}`,
                        borderRadius: 8, padding: "8px 12px",
                        fontSize: 12, fontWeight: 600,
                        color: isExpanded ? cls.color : "#475569",
                        cursor: "pointer", fontFamily: "inherit",
                        textAlign: "left" as const,
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        marginBottom: isExpanded ? 10 : 14,
                      }}
                    >
                      <span>📋 Topics covered</span>
                      <span style={{ fontSize: 14 }}>{isExpanded ? "−" : "+"}</span>
                    </button>

                    {/* Expanded topics */}
                    {isExpanded && (
                      <ul style={{ margin: "0 0 14px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column" as const, gap: 5 }}>
                        {cls.topics.map(topic => (
                          <li key={topic} style={{ fontSize: 12, color: "#475569", display: "flex", alignItems: "flex-start", gap: 6 }}>
                            <span style={{ color: cls.color, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>·</span>
                            {topic}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* CTA pinned to bottom */}
                  <div style={{ padding: "0 16px 16px", marginTop: "auto" }}>
                    <Link href={cls.quizHref}>
                      <button style={{
                        width: "100%", background: cls.color, color: "#FFFFFF",
                        border: "none", borderRadius: 8, padding: "11px",
                        fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 8,
                      }}>
                        Start Studying →
                      </button>
                    </Link>
                    <Link href="/pricing?tab=western">
                      <div style={{ textAlign: "center" as const, fontSize: 12, color: "#64748B", fontWeight: 600, cursor: "pointer" }}>View Plans →</div>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── WPI vs OWWCO Comparison ───────────────────────────────────── */}
      <section style={{ background: "#FFFFFF", padding: "56px 20px", borderTop: "1px solid #E2E8F0" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800, color: "#0F172A", textAlign: "center", marginBottom: 8 }}>
            WPI vs. OWWCO — Which Exam Do You Need?
          </h2>
          <p style={{ fontSize: 13, color: "#64748B", textAlign: "center", marginBottom: 28 }}>
            Two separate certification systems serve different provinces. Make sure you're studying for the right one.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F8FAFC" }}>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700, color: "#0F172A", borderBottom: "2px solid #E2E8F0" }}>Feature</th>
                  <th style={{ padding: "10px 16px", textAlign: "center", fontWeight: 700, color: "#0E7490", borderBottom: "2px solid #E2E8F0" }}>WPI (Western)</th>
                  <th style={{ padding: "10px 16px", textAlign: "center", fontWeight: 700, color: "#1D4ED8", borderBottom: "2px solid #E2E8F0" }}>OWWCO (Ontario)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Provinces",        "BC, AB, SK, MB",                              "Ontario only"],
                  ["Certifying body",  "EOCP / AWWOA / SAHO / MWWA",                  "OWWCO"],
                  ["Class levels",     "Class I – IV",                                "OIT, Class 1 – 4"],
                  ["Tracks",           "Water, Wastewater, Distribution, Collection",  "Water & Wastewater"],
                  ["Exam format",      "Multiple choice, written",                    "Multiple choice"],
                  ["Echelon coverage", "✅ All 16 class levels",                       "✅ All 10 courses"],
                ].map(([feature, wpi, owwco], i) => (
                  <tr key={feature} style={{ background: i % 2 === 0 ? "#FFFFFF" : "#F8FAFC" }}>
                    <td style={{ padding: "10px 16px", color: "#475569", fontWeight: 600, borderBottom: "1px solid #F1F5F9" }}>{feature}</td>
                    <td style={{ padding: "10px 16px", color: "#0F172A", textAlign: "center" as const, borderBottom: "1px solid #F1F5F9" }}>{wpi}</td>
                    <td style={{ padding: "10px 16px", color: "#0F172A", textAlign: "center" as const, borderBottom: "1px solid #F1F5F9" }}>{owwco}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section style={{ background: "#F8FAFC", padding: "56px 20px", borderTop: "1px solid #E2E8F0" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800, color: "#0F172A", textAlign: "center", marginBottom: 32 }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} style={{
                  background: "#FFFFFF",
                  border: `1px solid ${isOpen ? "#0E749044" : "#E2E8F0"}`,
                  borderRadius: 12, overflow: "hidden",
                }}>
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    style={{
                      width: "100%", background: "transparent", border: "none",
                      padding: "16px 20px", textAlign: "left" as const, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      gap: 12, fontFamily: "inherit",
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{faq.q}</span>
                    <span style={{ color: "#94A3B8", fontSize: 18, flexShrink: 0 }}>{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div style={{ padding: "0 20px 16px", fontSize: 13, color: "#475569", lineHeight: 1.7 }}>{faq.a}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Footer CTA ────────────────────────────────────────────────── */}
      <section style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)", padding: "56px 20px", textAlign: "center" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800, color: "#FFFFFF", marginBottom: 12 }}>
            Ready to start studying?
          </h2>
          <p style={{ fontSize: 14, color: "#94A3B8", marginBottom: 28, lineHeight: 1.7 }}>
            First 15 questions are free on every course — no account or credit card needed.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/wpi-class1-water">
              <button style={{
                background: "#0EA5E9", color: "#FFFFFF", border: "none",
                borderRadius: 10, padding: "13px 28px", fontSize: 15, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                Try Free Now →
              </button>
            </Link>
            <Link href="/pricing?tab=western">
              <button style={{
                background: "rgba(255,255,255,0.1)", color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.25)", borderRadius: 10,
                padding: "13px 28px", fontSize: 15, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                View All Passes
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
