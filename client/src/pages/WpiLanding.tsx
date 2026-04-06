// WPI Landing Page — BC / AB / SK / MB water & wastewater operator exam prep
// Redesigned for coherence: Hero → Province → Curriculum overview → Pricing → FAQ → Footer CTA

import { useState } from "react";
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import SiteNav from "@/components/SiteNav";

const PROVINCES = [
  {
    code: "BC",
    name: "British Columbia",
    flag: "🏔️",
    certBody: "EOCP",
    certBodyFull: "Environmental Operators Certification Program",
    examName: "EOCP Water Treatment Level I–IV",
    levels: ["Level I", "Level II", "Level III", "Level IV"],
    color: "#0369A1",
    bg: "#E0F2FE",
  },
  {
    code: "AB",
    name: "Alberta",
    flag: "🛢️",
    certBody: "AWWOA",
    certBodyFull: "Alberta Water & Wastewater Operators Association",
    examName: "AWWOA Water Treatment Class I–IV",
    levels: ["Class I", "Class II", "Class III", "Class IV"],
    color: "#B45309",
    bg: "#FEF3C7",
  },
  {
    code: "SK",
    name: "Saskatchewan",
    flag: "🌾",
    certBody: "SAHO",
    certBodyFull: "Saskatchewan Association of Health Organizations",
    examName: "SAHO Water Treatment Class I–IV",
    levels: ["Class I", "Class II", "Class III", "Class IV"],
    color: "#15803D",
    bg: "#DCFCE7",
  },
  {
    code: "MB",
    name: "Manitoba",
    flag: "🦬",
    certBody: "MWWA",
    certBodyFull: "Manitoba Water & Wastewater Association",
    examName: "MWWA Water Treatment Class I–IV",
    levels: ["Class I", "Class II", "Class III", "Class IV"],
    color: "#7C3AED",
    bg: "#EDE9FE",
  },
];

// Compact curriculum: each class has a short topic list (not exhaustive module cards)
const CURRICULUM = [
  {
    track: "💧 Water Treatment",
    classes: [
      {
        label: "Class I",
        questions: 502,
        color: "#0E7490",
        quizHref: "/wpi-class1-water",
        topics: ["Treatment processes (coagulation, filtration, disinfection)", "Equipment O&M (pumps, valves, chemical feed)", "Lab analysis (turbidity, pH, chlorine residual)", "Source water & watershed protection", "Safety, WHMIS, record keeping"],
      },
      {
        label: "Class II",
        questions: 598,
        color: "#0F766E",
        quizHref: "/wpi-class2-water",
        topics: ["Advanced treatment (ozone, UV, GAC, membranes)", "System design & hydraulics", "Advanced lab & SCADA monitoring", "Source water & environmental management", "Regulations, DWQMS, staff management"],
      },
      {
        label: "Class III",
        questions: 531,
        color: "#1D4ED8",
        quizHref: "/wpi-class3-water",
        topics: ["Advanced process control & optimization", "Hydraulics, pump stations, distribution modelling", "Disinfection by-products & emerging contaminants", "Source protection plans & climate resilience", "DWQMS auditing & regulatory compliance"],
      },
      {
        label: "Class IV",
        questions: 592,
        color: "#7C3AED",
        quizHref: "/wpi-class4-water",
        topics: ["Full plant optimization & process modelling", "Advanced water quality & DBP management", "Emergency response & business continuity", "Asset management, capital planning, leadership", "DWQMS, regulatory reporting, enforcement"],
      },
    ],
  },
  {
    track: "♻️ Wastewater Treatment",
    classes: [
      {
        label: "Class I",
        questions: 594,
        color: "#B45309",
        quizHref: "/wpi-class1-wastewater",
        topics: ["Wastewater collection & lift stations", "Primary & secondary treatment (activated sludge, trickling filters)", "Solids handling, digestion & biosolids", "Lab & monitoring (BOD, TSS, DO)", "Safety, WHMIS, H₂S monitoring"],
      },
      {
        label: "Class II",
        questions: 599,
        color: "#0F766E",
        quizHref: "/wpi-class2-wastewater",
        topics: ["Advanced secondary treatment & nutrient removal", "Biological nitrogen & phosphorus removal", "Advanced biosolids management", "SCADA & process monitoring", "Regulatory compliance & effluent standards"],
      },
      {
        label: "Class III",
        questions: 607,
        color: "#1D4ED8",
        quizHref: "/wpi-class3-wastewater",
        topics: ["Biological nutrient removal (BNR)", "Membrane bioreactors (MBR)", "Industrial pretreatment programs", "Advanced biosolids & resource recovery", "Emergency response & plant management"],
      },
      {
        label: "Class IV",
        questions: 606,
        color: "#6D28D9",
        quizHref: "/wpi-class4-wastewater",
        topics: ["Advanced process control & resource recovery", "Emerging technologies & innovation", "Plant management, leadership & budgeting", "Strategic emergency response planning", "Regulatory compliance & enforcement"],
      },
    ],
  },
];

const WATER_CLASSES = [
  { level: "CLASS I", questions: "502", price: "CA$149", priceNum: 14900, color: "#0E7490", bg: "#F0FDFF", border: "#A5F3FC", quizHref: "/wpi-class1-water" },
  { level: "CLASS II", questions: "598", price: "CA$199", priceNum: 19900, color: "#0F766E", bg: "#F0FDFA", border: "#99F6E4", quizHref: "/wpi-class2-water" },
  { level: "CLASS III", questions: "531", price: "CA$349", priceNum: 34900, color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE", quizHref: "/wpi-class3-water" },
  { level: "CLASS IV", questions: "592", price: "CA$499", priceNum: 49900, color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", quizHref: "/wpi-class4-water", badge: "👑 Chief Operator" },
];

const WW_CLASSES = [
  { level: "CLASS I", questions: "594", price: "CA$149", color: "#B45309", bg: "#FFFBEB", border: "#FDE68A", quizHref: "/wpi-class1-wastewater" },
  { level: "CLASS II", questions: "599", price: "CA$199", color: "#0F766E", bg: "#F0FDFA", border: "#99F6E4", quizHref: "/wpi-class2-wastewater" },
  { level: "CLASS III", questions: "607", price: "CA$349", color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE", quizHref: "/wpi-class3-wastewater" },
  { level: "CLASS IV", questions: "606", price: "CA$499", color: "#6D28D9", bg: "#F5F3FF", border: "#C4B5FD", quizHref: "/wpi-class4-wastewater", badge: "👑 Chief Operator" },
];

const FAQS = [
  {
    q: "What is the WPI exam format?",
    a: "The WPI (Water/Wastewater Practitioner Institute) exam is a multiple-choice exam used across BC, Alberta, Saskatchewan, and Manitoba. Class I exams typically have 100 questions with a 70% pass mark. The exam covers treatment processes, equipment operation, laboratory analysis, source water protection, and safety.",
  },
  {
    q: "How is the WPI exam different from OWWCO (Ontario)?",
    a: "Both use the same WPI question bank developed by the Western Canada Operator Certification Committee. The key difference is the certification body: BC uses EOCP, Alberta uses AWWOA, Saskatchewan uses SAHO, and Manitoba uses MWWA. Ontario uses OWWCO. The exam content and format are standardized across WPI provinces.",
  },
  {
    q: "How many questions are on the WPI Class I Water Treatment exam?",
    a: "The WPI Class I Water Treatment exam has 100 questions. Our practice bank has 502 questions aligned with the WPI Class I Need-to-Know Criteria, giving you comprehensive coverage of all exam topics.",
  },
  {
    q: "What score do I need to pass the WPI exam?",
    a: "The passing score for WPI exams is 70% (70 out of 100 questions). Our mock exams simulate the real exam format with 100 questions and a 2-hour time limit, and show you clearly whether you passed or failed the 70% threshold.",
  },
  {
    q: "Does Echelon cover the full WPI Water Treatment ladder (Class I–IV)?",
    a: "Yes. We have dedicated practice banks for all four WPI Water Treatment class levels: Class I (502 questions), Class II (598 questions), Class III (531 questions), and Class IV (592 questions). Each bank is aligned with the respective WPI Need-to-Know Criteria and includes timed mock exams, AI Tutor, formula sheet, and score history.",
  },
  {
    q: "Is WPI Wastewater Treatment prep available?",
    a: "Yes — all four WPI Wastewater classes are live. Class I (594 questions) covers Collection Systems, Primary & Secondary Treatment, Solids Handling, Lab & Monitoring, and Safety. Classes II–IV cover progressively advanced topics including BNR, MBR, resource recovery, and plant management. Each class is available individually — no bundles required.",
  },
];

export default function WpiLanding() {
  usePageMeta({
    title: "WPI Water Treatment Exam Prep — BC EOCP, Alberta AWWOA, SK, MB | Echelon Institute",
    description:
      "Prepare for the WPI Water & Wastewater Treatment exams with 4,000+ practice questions for Class I–IV Water and Class I–IV Wastewater. Covers BC (EOCP), Alberta (AWWOA), Saskatchewan (SAHO), and Manitoba (MWWA).",
    path: "/wpi",
    keywords:
      "WPI exam prep, BC EOCP water treatment, Alberta AWWOA water operator, Saskatchewan SAHO water, Manitoba MWWA water, WPI Class I practice questions, WPI Class II practice questions, WPI Class III wastewater, WPI Class IV wastewater",
  });

  const [activeProvince, setActiveProvince] = useState("BC");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [openCurriculum, setOpenCurriculum] = useState<string | null>(null);

  const province = PROVINCES.find(p => p.code === activeProvince) ?? PROVINCES[0];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
      <style>{`
        @media (max-width: 640px) {
          .wpi-province-card { flex-direction: column !important; }
          .wpi-province-btns { min-width: 0 !important; width: 100% !important; }
          .wpi-pricing-cards { gap: 10px !important; }
          .wpi-pricing-card { width: calc(50% - 5px) !important; min-width: 140px !important; padding: 16px 12px !important; }
          .wpi-hero-section { padding: 48px 16px 36px !important; }
          .wpi-province-tabs { flex-wrap: wrap !important; gap: 6px !important; }
          .wpi-province-tab { flex: 1 1 auto !important; }
          .wpi-features-grid { grid-template-columns: 1fr !important; }
          .wpi-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 380px) {
          .wpi-pricing-card { width: 100% !important; }
        }
      `}</style>
      <SiteNav currentPath="/wpi" />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{
        background: "linear-gradient(135deg, #0C4A6E 0%, #0E7490 50%, #0F766E 100%)",
        padding: "72px 20px 56px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 100,
            padding: "6px 16px",
            marginBottom: 24,
          }}>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
              🌊 WPI Exam Prep — BC · AB · SK · MB
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: "clamp(28px, 5vw, 48px)",
            fontWeight: 800,
            color: "#FFFFFF",
            lineHeight: 1.15,
            marginBottom: 20,
            letterSpacing: "-0.02em",
          }}>
            Pass Your WPI Water &amp; Wastewater Exam
          </h1>

          <p style={{
            fontSize: "clamp(15px, 2vw, 18px)",
            color: "rgba(255,255,255,0.8)",
            lineHeight: 1.7,
            marginBottom: 32,
            maxWidth: 560,
            margin: "0 auto 32px",
          }}>
            4,000+ practice questions for WPI Class I–IV Water Treatment and Class I–IV Wastewater — aligned with the Need-to-Know Criteria used by <strong style={{ color: "#BAE6FD" }}>EOCP (BC)</strong>, <strong style={{ color: "#BAE6FD" }}>AWWOA (AB)</strong>, <strong style={{ color: "#BAE6FD" }}>SAHO (SK)</strong>, and <strong style={{ color: "#BAE6FD" }}>MWWA (MB)</strong>.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/wpi-class1-water">
              <button style={{
                background: "#FFFFFF",
                color: "#0C4A6E",
                border: "none",
                borderRadius: 12,
                padding: "14px 28px",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}>
                🌊 Try Class I Water Free →
              </button>
            </Link>
            <Link href="/wpi-class1-wastewater">
              <button style={{
                background: "rgba(255,255,255,0.12)",
                color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 12,
                padding: "14px 28px",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}>
                Try Class I Wastewater Free →
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 32, justifyContent: "center", marginTop: 48, flexWrap: "wrap" }}>
            {[
              { value: "4,000+", label: "Practice Questions" },
              { value: "8", label: "Exam Levels" },
              { value: "4", label: "WPI Provinces" },
              { value: "70%", label: "Pass Mark" },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#FFFFFF", fontFamily: "'Sora', sans-serif" }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Province Selector ─────────────────────────────────────────────── */}
      <section style={{ background: "#FFFFFF", padding: "48px 20px", borderBottom: "1px solid #E2E8F0" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, color: "#0F172A", textAlign: "center", marginBottom: 8 }}>
            Select Your Province
          </h2>
          <p style={{ fontSize: 14, color: "#64748B", textAlign: "center", marginBottom: 28 }}>
            WPI exams are administered by your provincial certification body
          </p>

          {/* Province tabs */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
            {PROVINCES.map(p => (
              <button
                key={p.code}
                onClick={() => setActiveProvince(p.code)}
                style={{
                  background: activeProvince === p.code ? p.color : "#F1F5F9",
                  color: activeProvince === p.code ? "#FFFFFF" : "#475569",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
              >
                {p.flag} {p.code} — {p.certBody}
              </button>
            ))}
          </div>

          {/* Province detail card */}
          <div style={{
            background: province.bg,
            border: `2px solid ${province.color}22`,
            borderRadius: 16,
            padding: "24px 28px",
            display: "flex",
            gap: 28,
            flexWrap: "wrap",
            alignItems: "center",
          }}>
            <div style={{ flex: "1 1 260px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: province.color, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 6 }}>
                {province.flag} {province.name}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 2, fontFamily: "'Sora', sans-serif" }}>
                {province.certBody}
              </div>
              <div style={{ fontSize: 13, color: "#475569", marginBottom: 10 }}>{province.certBodyFull}</div>
              <div style={{ fontSize: 12, color: "#64748B", marginBottom: 14 }}>
                <strong>Exam:</strong> {province.examName}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {province.levels.map(level => (
                  <span key={level} style={{
                    background: province.color,
                    borderRadius: 6,
                    color: "#FFFFFF",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 10px",
                  }}>
                    {level}
                  </span>
                ))}
              </div>
            </div>

            <div className="wpi-province-btns" style={{ flex: "1 1 220px", display: "flex", flexDirection: "column" as const, gap: 10, minWidth: 0 }}>
              <Link href="/wpi-class1-water">
                <div style={{
                  background: province.color,
                  color: "#FFFFFF",
                  borderRadius: 10,
                  padding: "12px 20px",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  textAlign: "center" as const,
                }}>
                  Try Class I Water Free →
                </div>
              </Link>
              <Link href="/wpi-class1-wastewater">
                <div style={{
                  background: "#FFFFFF",
                  color: province.color,
                  border: `2px solid ${province.color}`,
                  borderRadius: 10,
                  padding: "12px 20px",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  textAlign: "center" as const,
                }}>
                  Try Class I Wastewater Free →
                </div>
              </Link>
              <Link href="/pricing">
                <div style={{
                  color: "#64748B",
                  fontSize: 13,
                  textAlign: "center" as const,
                  cursor: "pointer",
                  textDecoration: "underline",
                  paddingTop: 2,
                }}>
                  View all courses & pricing →
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Curriculum Overview (compact accordion) ───────────────────────── */}
      <section style={{ padding: "56px 20px", background: "#F8FAFC" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, color: "#0F172A", textAlign: "center", marginBottom: 8 }}>
            What's on the Exam
          </h2>
          <p style={{ fontSize: 14, color: "#64748B", textAlign: "center", marginBottom: 36 }}>
            Each class level is aligned with the WPI Need-to-Know Criteria. Click any level to see the topic breakdown.
          </p>

          {CURRICULUM.map(track => (
            <div key={track.track} style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#64748B", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 12 }}>
                {track.track}
              </div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                {track.classes.map(cls => {
                  const key = `${track.track}-${cls.label}`;
                  const isOpen = openCurriculum === key;
                  return (
                    <div key={key} style={{
                      background: "#FFFFFF",
                      border: `1px solid ${isOpen ? cls.color + "44" : "#E2E8F0"}`,
                      borderRadius: 12,
                      overflow: "hidden",
                    }}>
                      <button
                        onClick={() => setOpenCurriculum(isOpen ? null : key)}
                        style={{
                          width: "100%",
                          background: "transparent",
                          border: "none",
                          padding: "16px 20px",
                          textAlign: "left",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          fontFamily: "inherit",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{
                            background: cls.color,
                            color: "#FFFFFF",
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: 6,
                            whiteSpace: "nowrap" as const,
                          }}>
                            {cls.label}
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                            {cls.questions} practice questions
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <Link href={cls.quizHref} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                            <span style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: cls.color,
                              background: cls.color + "14",
                              padding: "4px 10px",
                              borderRadius: 6,
                              whiteSpace: "nowrap" as const,
                            }}>
                              Try free →
                            </span>
                          </Link>
                          <span style={{ color: "#94A3B8", fontSize: 16, flexShrink: 0 }}>{isOpen ? "−" : "+"}</span>
                        </div>
                      </button>
                      {isOpen && (
                        <div style={{ padding: "0 20px 16px 20px" }}>
                          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column" as const, gap: 6 }}>
                            {cls.topics.map(topic => (
                              <li key={topic} style={{ fontSize: 13, color: "#475569", display: "flex", alignItems: "flex-start", gap: 8 }}>
                                <span style={{ color: cls.color, fontWeight: 700, marginTop: 1, flexShrink: 0 }}>·</span>
                                {topic}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ background: "#FFFFFF", padding: "56px 20px", borderTop: "1px solid #E2E8F0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, color: "#0F172A", textAlign: "center", marginBottom: 8 }}>
            Unlock Full Access
          </h2>
          <p style={{ fontSize: 15, color: "#64748B", marginBottom: 40, lineHeight: 1.7, textAlign: "center" }}>
            Start with 15 free questions per session — no account required. Upgrade to unlock all questions, timed mock exams, AI Tutor, and score history.
          </p>

          {/* Water Treatment */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 16, textAlign: "center" }}>
              💧 Water Treatment
            </div>
            <div className="wpi-pricing-cards" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              {WATER_CLASSES.map(cls => (
                <div key={cls.level} className="wpi-pricing-card" style={{
                  background: cls.bg,
                  border: `2px solid ${cls.border}`,
                  borderRadius: 18,
                  padding: "22px 18px",
                  width: 210,
                  textAlign: "left",
                  flexShrink: 0,
                }}>
                  {(cls as any).badge && (
                    <div style={{ display: "inline-block", background: cls.color, color: "#FFFFFF", fontSize: 10, fontWeight: 700, borderRadius: 6, padding: "2px 8px", marginBottom: 8 }}>{(cls as any).badge}</div>
                  )}
                  <div style={{ fontSize: 10, fontWeight: 700, color: cls.color, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 6 }}>WPI {cls.level}</div>
                  <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800, color: "#0F172A", marginBottom: 2 }}>{cls.price}</div>
                  <div style={{ fontSize: 11, color: "#64748B", marginBottom: 14 }}>Unlimited · {cls.questions} questions</div>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 14px", display: "flex", flexDirection: "column" as const, gap: 5 }}>
                    {["Practice questions", "Timed mock exam", "Formula sheet", "AI Tutor", "Score history"].map(f => (
                      <li key={f} style={{ fontSize: 12, color: "#0F172A", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: cls.color, fontWeight: 700, fontSize: 11 }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/pricing">
                    <button style={{
                      width: "100%",
                      background: cls.color,
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 8,
                      padding: "10px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}>
                      Get {cls.level} Pass →
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Wastewater Treatment */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 16, textAlign: "center" }}>
              ♻️ Wastewater Treatment
            </div>
            <div className="wpi-pricing-cards" style={{ display: "flex", gap: 14, flexWrap: "wrap" as const, justifyContent: "center" }}>
              {WW_CLASSES.map(ww => (
                <div key={ww.level} className="wpi-pricing-card" style={{
                  background: ww.bg,
                  border: `2px solid ${ww.border}`,
                  borderRadius: 18,
                  padding: "22px 18px",
                  width: 210,
                  textAlign: "left" as const,
                  flexShrink: 0,
                }}>
                  {(ww as any).badge && (
                    <div style={{ display: "inline-block", background: ww.color, color: "#FFFFFF", fontSize: 10, fontWeight: 700, borderRadius: 6, padding: "2px 8px", marginBottom: 8 }}>{(ww as any).badge}</div>
                  )}
                  <div style={{ fontSize: 10, fontWeight: 700, color: ww.color, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 6 }}>WPI {ww.level} WW</div>
                  <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800, color: "#0F172A", marginBottom: 2 }}>{ww.price}</div>
                  <div style={{ fontSize: 11, color: "#64748B", marginBottom: 14 }}>Unlimited · {ww.questions} questions</div>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 14px", display: "flex", flexDirection: "column" as const, gap: 5 }}>
                    {["Practice questions", "Timed mock exam", "Formula sheet", "AI Tutor", "Score history"].map(f => (
                      <li key={f} style={{ fontSize: 12, color: "#0F172A", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: ww.color, fontWeight: 700, fontSize: 11 }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/pricing">
                    <button style={{
                      width: "100%",
                      background: ww.color,
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 8,
                      padding: "10px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}>
                      Get {ww.level} WW Pass →
                    </button>
                  </Link>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── WPI vs OWWCO Comparison Table ────────────────────────────── */}
      <section style={{ background: "#F8FAFC", padding: "56px 20px", borderTop: "1px solid #E2E8F0" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, color: "#0F172A", textAlign: "center" as const, marginBottom: 8 }}>
            WPI vs. OWWCO — Which Exam Do You Need?
          </h2>
          <p style={{ textAlign: "center" as const, fontSize: 14, color: "#64748B", marginBottom: 32, maxWidth: 560, margin: "0 auto 32px" }}>
            Your province determines which certification body you register with. Both systems use standardized national question banks.
          </p>
          <div style={{ overflowX: "auto" as const }}>
            <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F1F5F9" }}>
                  {["Province", "Cert Body", "Exam System", "Levels Available", "Passing Score"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left" as const, fontWeight: 700, color: "#0F172A", borderBottom: "2px solid #E2E8F0", whiteSpace: "nowrap" as const }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { province: "🇧🇨 BC", body: "EOCP", system: "WPI", levels: "Class I–IV Water & WW", pass: "70%", highlight: true },
                  { province: "🇦🇧 AB", body: "AWWOA", system: "WPI", levels: "Class I–IV Water & WW", pass: "70%", highlight: true },
                  { province: "🇸🇰 SK", body: "SAHO", system: "WPI", levels: "Class I–IV Water & WW", pass: "70%", highlight: true },
                  { province: "🇲🇧 MB", body: "MWWA", system: "WPI", levels: "Class I–IV Water & WW", pass: "70%", highlight: true },
                  { province: "🇨🇦 ON", body: "OWWCO", system: "OWWCO", levels: "OIT, Class 1–4 Water & WW, WQA", pass: "70%", highlight: false },
                ].map((row, i) => (
                  <tr key={i} style={{ background: row.highlight ? "#ECFEFF" : i % 2 === 0 ? "#FFFFFF" : "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                    <td style={{ padding: "12px 14px", fontWeight: 600, color: "#0F172A" }}>{row.province}</td>
                    <td style={{ padding: "12px 14px", fontWeight: 600, color: "#0F172A" }}>{row.body}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ background: row.highlight ? "#CFFAFE" : "#DBEAFE", color: row.highlight ? "#0E7490" : "#1D4ED8", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{row.system}</span>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#475569" }}>{row.levels}</td>
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: "#16A34A" }}>{row.pass}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ textAlign: "center" as const, fontSize: 12, color: "#94A3B8", marginTop: 14 }}>
            Passing score and format may vary — always verify with your provincial certification body before registering.
          </p>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section style={{ padding: "56px 20px", background: "#FFFFFF", borderTop: "1px solid #E2E8F0" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, color: "#0F172A", textAlign: "center", marginBottom: 32 }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
            {FAQS.map((faq, i) => (
              <div
                key={i}
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    padding: "16px 20px",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    fontFamily: "inherit",
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{faq.q}</span>
                  <span style={{ color: "#0E7490", fontSize: 18, flexShrink: 0 }}>{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 20px 16px", fontSize: 14, color: "#475569", lineHeight: 1.7 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer CTA ────────────────────────────────────────────────────── */}
      <section style={{
        background: "linear-gradient(135deg, #0C4A6E, #0E7490)",
        padding: "56px 20px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: "#FFFFFF", marginBottom: 12 }}>
            Ready to Start Practising?
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", marginBottom: 28 }}>
            15 free questions per session — no account required. Start now and see how you score.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/wpi-class1-water">
              <button style={{
                background: "#FFFFFF",
                color: "#0C4A6E",
                border: "none",
                borderRadius: 12,
                padding: "14px 28px",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}>
                🌊 Start Class I Water →
              </button>
            </Link>
            <Link href="/wpi-class1-wastewater">
              <button style={{
                background: "rgba(255,255,255,0.12)",
                color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 12,
                padding: "14px 28px",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}>
                Start Class I Wastewater →
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
