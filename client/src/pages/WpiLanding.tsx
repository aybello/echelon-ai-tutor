// WPI LANDING PAGE — /wpi
// Province-specific landing page for BC / AB / SK / MB water operators
// Covers EOCP, AWWOA, SAHO, MWWA certification bodies
// SEO-optimised for WPI exam prep searches

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
    certBodyUrl: "https://www.eocp.ca",
    examName: "EOCP Water Treatment Level I & II",
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
    certBodyUrl: "https://www.awwoa.ab.ca",
    examName: "AWWOA Water Treatment Class I & II",
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
    certBodyUrl: "https://www.saho.org",
    examName: "SAHO Water Treatment Class I & II",
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
    certBodyUrl: "https://www.mwwa.net",
    examName: "MWWA Water Treatment Class I & II",
    levels: ["Class I", "Class II", "Class III", "Class IV"],
    color: "#7C3AED",
    bg: "#EDE9FE",
  },
];

const MODULES_C1 = [
  { icon: "⚗️", name: "Treatment Process", count: 155, desc: "Coagulation, flocculation, sedimentation, filtration, disinfection" },
  { icon: "🔧", name: "Equipment O&M", count: 130, desc: "Pumps, valves, meters, chemical feed systems, maintenance" },
  { icon: "🔬", name: "Laboratory Analysis", count: 80, desc: "Turbidity, pH, chlorine residual, bacteriological sampling" },
  { icon: "🌊", name: "Source Water", count: 75, desc: "Surface water, groundwater, watershed protection, intake management" },
  { icon: "🦺", name: "Safety & Admin", count: 62, desc: "WHMIS, confined space, emergency response, record keeping" },
];

const MODULES_C2 = [
  { icon: "⚗️", name: "Advanced Treatment Processes", count: 150, desc: "Ozonation, UV, GAC, membrane filtration, advanced oxidation" },
  { icon: "🏗️", name: "System Design & Engineering", count: 120, desc: "Hydraulics, pipe systems, pump curves, pressure management" },
  { icon: "🔬", name: "Advanced Lab & Monitoring", count: 95, desc: "SCADA, online analyzers, advanced water quality parameters" },
  { icon: "🌊", name: "Source Water & Environmental", count: 80, desc: "Watershed management, climate impacts, source protection plans" },
  { icon: "📋", name: "Management, Regulations & Safety", count: 56, desc: "Drinking Water Quality Standards, emergency planning, staff management" },
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
    q: "Can I use Echelon for both Class I and Class II WPI prep?",
    a: "Yes! We have dedicated practice banks for both WPI Class I (502 questions) and WPI Class II (501 questions). Each bank is aligned with the respective WPI Need-to-Know Criteria and includes timed mock exams, AI Tutor, and score history.",
  },
];

export default function WpiLanding() {
  usePageMeta({
    title: "WPI Water Treatment Exam Prep — BC EOCP, Alberta AWWOA, SK, MB | Echelon Institute",
    description:
      "Prepare for the WPI Water Treatment exam with 1,000+ practice questions for Class I and Class II. Covers BC (EOCP), Alberta (AWWOA), Saskatchewan (SAHO), and Manitoba (MWWA) certification requirements.",
    path: "/wpi",
    keywords:
      "WPI exam prep, BC EOCP water treatment, Alberta AWWOA water operator, Saskatchewan SAHO water, Manitoba MWWA water, WPI Class I practice questions, WPI Class II practice questions",
  });

  const [activeProvince, setActiveProvince] = useState("BC");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const province = PROVINCES.find(p => p.code === activeProvince) ?? PROVINCES[0];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
      <SiteNav currentPath="/wpi" />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{
        background: "linear-gradient(135deg, #0C4A6E 0%, #0E7490 50%, #0F766E 100%)",
        padding: "72px 20px 80px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

        <div style={{ position: "relative", maxWidth: 720, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 100,
            padding: "6px 16px",
            fontSize: 12,
            fontWeight: 700,
            color: "#BAE6FD",
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            marginBottom: 24,
          }}>
            🌊 WPI — Western Canada Water Operator Exam Prep
          </div>

          <h1 style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: 800,
            color: "#FFFFFF",
            lineHeight: 1.15,
            marginBottom: 20,
            letterSpacing: "-0.02em",
          }}>
            Pass Your WPI Water<br />Treatment Exam
          </h1>

          <p style={{
            fontSize: "clamp(15px, 2vw, 18px)",
            color: "rgba(255,255,255,0.8)",
            lineHeight: 1.7,
            marginBottom: 32,
            maxWidth: 560,
            margin: "0 auto 32px",
          }}>
            1,000+ practice questions for WPI Class I & II — aligned with the Need-to-Know Criteria used by <strong style={{ color: "#BAE6FD" }}>EOCP (BC)</strong>, <strong style={{ color: "#BAE6FD" }}>AWWOA (AB)</strong>, <strong style={{ color: "#BAE6FD" }}>SAHO (SK)</strong>, and <strong style={{ color: "#BAE6FD" }}>MWWA (MB)</strong>.
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
                🌊 Try Class I Free →
              </button>
            </Link>
            <Link href="/wpi-class2-water">
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
                Try Class II Free →
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 32, justifyContent: "center", marginTop: 48, flexWrap: "wrap" }}>
            {[
              { value: "1,003", label: "Practice Questions" },
              { value: "4", label: "WPI Provinces" },
              { value: "70%", label: "Pass Mark" },
              { value: "AI", label: "Tutor Included" },
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
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 800, color: "#0F172A", textAlign: "center", marginBottom: 8 }}>
            Select Your Province
          </h2>
          <p style={{ fontSize: 14, color: "#64748B", textAlign: "center", marginBottom: 32 }}>
            The WPI exam content is standardized — your certification body issues the licence
          </p>

          {/* Province tabs */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 40 }}>
            {PROVINCES.map(p => (
              <button
                key={p.code}
                onClick={() => setActiveProvince(p.code)}
                style={{
                  padding: "12px 24px",
                  borderRadius: 12,
                  border: activeProvince === p.code ? `2px solid ${p.color}` : "2px solid #E2E8F0",
                  background: activeProvince === p.code ? p.bg : "#FFFFFF",
                  color: activeProvince === p.code ? p.color : "#64748B",
                  fontSize: 14,
                  fontWeight: activeProvince === p.code ? 700 : 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
              >
                {p.flag} {p.name}
              </button>
            ))}
          </div>

          {/* Province detail card */}
          <div style={{
            background: province.bg,
            border: `1px solid ${province.color}30`,
            borderRadius: 20,
            padding: "32px",
            display: "flex",
            gap: 32,
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}>
            <div style={{ flex: "1 1 280px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: province.color, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 8 }}>
                {province.flag} {province.name}
              </div>
              <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>
                {province.certBody}
              </h3>
              <p style={{ fontSize: 14, color: "#475569", marginBottom: 16, lineHeight: 1.6 }}>
                {province.certBodyFull}
              </p>
              <div style={{ fontSize: 13, color: "#64748B", marginBottom: 8 }}>
                <strong>Exam Name:</strong> {province.examName}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                {province.levels.map(level => (
                  <span key={level} style={{
                    background: province.color,
                    color: "#FFFFFF",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 6,
                  }}>
                    {level}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ flex: "1 1 280px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>Available Prep Materials</div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                {[
                  { href: "/wpi-class1-water", label: "🌊 Class I Practice Quiz", sub: "502 questions · 15 free" },
                  { href: "/wpi-class1-water-mock", label: "📋 Class I Mock Exam", sub: "100 questions · 2 hours" },
                  { href: "/formulas-wpi-class1", label: "📐 Class I Formula Sheet", sub: "CT values, dosing, flow rate" },
                  { href: "/wpi-class2-water", label: "🌊 Class II Practice Quiz", sub: "501 questions · 15 free" },
                  { href: "/wpi-class2-water-mock", label: "📋 Class II Mock Exam", sub: "100 questions · 2 hours" },
                  { href: "/formulas-wpi-class2", label: "📐 Class II Formula Sheet", sub: "Ozone, UV, membranes, hydraulics" },
                ].map(item => (
                  <Link key={item.href} href={item.href}>
                    <div style={{
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: 10,
                      padding: "12px 16px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{item.label}</div>
                        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{item.sub}</div>
                      </div>
                      <span style={{ color: province.color, fontSize: 16 }}>→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── What's Covered ────────────────────────────────────────────────── */}
      <section style={{ padding: "64px 20px", background: "#F8FAFC" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800, color: "#0F172A", textAlign: "center", marginBottom: 8 }}>
            What's Covered
          </h2>
          <p style={{ fontSize: 14, color: "#64748B", textAlign: "center", marginBottom: 48 }}>
            Questions aligned with the WPI Need-to-Know Criteria for each class level
          </p>

          {/* Class I */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ background: "#0E7490", color: "#FFFFFF", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 6 }}>
                CLASS I
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>502 Questions</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {MODULES_C1.map(m => (
                <div key={m.name} style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: 14,
                  padding: "20px",
                }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{m.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 8 }}>{m.count} questions</div>
                  <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>{m.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Class II */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ background: "#0F766E", color: "#FFFFFF", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 6 }}>
                CLASS II
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>501 Questions</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {MODULES_C2.map(m => (
                <div key={m.name} style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: 14,
                  padding: "20px",
                }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{m.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 8 }}>{m.count} questions</div>
                  <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>{m.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing CTA ───────────────────────────────────────────────────── */}
      <section style={{ background: "#FFFFFF", padding: "64px 20px", borderTop: "1px solid #E2E8F0" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>
            Unlock Full Access
          </h2>
          <p style={{ fontSize: 15, color: "#64748B", marginBottom: 40, lineHeight: 1.7 }}>
            Start with 15 free questions per session — no account required. Upgrade to unlock all questions, timed mock exams, AI Tutor, and score history.
          </p>

          <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
            {/* Class I card */}
            <div style={{
              background: "#F0FDFF",
              border: "2px solid #A5F3FC",
              borderRadius: 20,
              padding: "28px 24px",
              width: 260,
              textAlign: "left",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#0E7490", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 8 }}>WPI Class I</div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 32, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>CA$79</div>
              <div style={{ fontSize: 12, color: "#64748B", marginBottom: 20 }}>Unlimited access · 502 questions</div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column" as const, gap: 8 }}>
                {["502 practice questions", "Timed mock exam", "WPI formula sheet", "AI Tutor", "Score history"].map(f => (
                  <li key={f} style={{ fontSize: 13, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#0E7490", fontWeight: 700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/pricing">
                <button style={{
                  width: "100%",
                  background: "#0E7490",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}>
                  Get Class I Pass →
                </button>
              </Link>
            </div>

            {/* Class II card */}
            <div style={{
              background: "#F0FDFA",
              border: "2px solid #99F6E4",
              borderRadius: 20,
              padding: "28px 24px",
              width: 260,
              textAlign: "left",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#0F766E", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 8 }}>WPI Class II</div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 32, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>CA$99</div>
              <div style={{ fontSize: 12, color: "#64748B", marginBottom: 20 }}>Unlimited access · 501 questions</div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column" as const, gap: 8 }}>
                {["501 advanced questions", "Timed mock exam", "AI Tutor", "Score history", "Advanced modules"].map(f => (
                  <li key={f} style={{ fontSize: 13, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#0F766E", fontWeight: 700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/pricing">
                <button style={{
                  width: "100%",
                  background: "#0F766E",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}>
                  Get Class II Pass →
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section style={{ padding: "64px 20px", background: "#F8FAFC" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800, color: "#0F172A", textAlign: "center", marginBottom: 40 }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
            {FAQS.map((faq, i) => (
              <div
                key={i}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: 14,
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    padding: "18px 20px",
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
                  <div style={{ padding: "0 20px 18px", fontSize: 14, color: "#475569", lineHeight: 1.7 }}>
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
                🌊 Start Class I Practice →
              </button>
            </Link>
            <Link href="/wpi-class2-water">
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
                Start Class II Practice →
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
