// WpiLanding.tsx
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
    certBodyUrl: "https://www.awwoa.ab.ca",
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
    certBodyUrl: "https://www.saho.org",
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
    certBodyUrl: "https://www.mwwa.net",
    examName: "MWWA Water Treatment Class I–IV",
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

const MODULES_C3 = [
  { icon: "🔬", name: "Advanced Process Control", count: 110, desc: "Membrane systems, ozone CT, advanced filtration, process optimization" },
  { icon: "🏗️", name: "Advanced Hydraulics & Design", count: 100, desc: "System hydraulics, pump station design, distribution modelling" },
  { icon: "⚗️", name: "Advanced Water Quality", count: 90, desc: "Disinfection by-products, emerging contaminants, regulatory limits" },
  { icon: "🌊", name: "Source Water Protection", count: 80, desc: "Watershed risk assessment, source protection plans, climate resilience" },
  { icon: "📋", name: "Regulatory Compliance & QMS", count: 75, desc: "DWQMS, auditing, corrective action, operator licensing" },
  { icon: "🦺", name: "Emergency & Safety Management", count: 47, desc: "Emergency response planning, incident command, WHMIS advanced" },
];

const MODULES_C4 = [
  { icon: "🏭", name: "Advanced Process Control", count: 110, desc: "Full plant optimization, advanced CT, membrane integrity, process modelling" },
  { icon: "💧", name: "Advanced Water Quality", count: 100, desc: "DBP formation, taste & odour, emerging contaminants, regulatory compliance" },
  { icon: "🚨", name: "Emergency Response & Contingency", count: 85, desc: "Emergency planning, incident command, business continuity, crisis communications" },
  { icon: "👔", name: "Plant Management & Leadership", count: 80, desc: "Asset management, capital planning, staff development, budget management" },
  { icon: "📋", name: "Regulatory Compliance & Reporting", count: 75, desc: "DWQMS, regulatory reporting, audit management, enforcement response" },
  { icon: "🌊", name: "Source Water Protection", count: 51, desc: "Strategic watershed management, source protection plan implementation" },
];

const MODULES_WW1 = [
  { icon: "🚰", name: "Wastewater Collection Systems", count: 110, desc: "Sewer systems, lift stations, infiltration/inflow, maintenance" },
  { icon: "⚗️", name: "Primary & Secondary Treatment", count: 130, desc: "Screening, grit removal, primary clarifiers, activated sludge, trickling filters" },
  { icon: "🧪", name: "Solids Handling & Biosolids", count: 90, desc: "Thickening, digestion, dewatering, biosolids land application" },
  { icon: "🔬", name: "Laboratory & Monitoring", count: 85, desc: "BOD, TSS, pH, dissolved oxygen, effluent sampling, SCADA" },
  { icon: "🦺", name: "Safety & Regulations", count: 85, desc: "WHMIS, confined space, H2S monitoring, regulatory compliance" },
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
    a: "Yes! We have dedicated practice banks for all four WPI Water Treatment class levels: Class I (502 questions), Class II (501 questions), Class III (502 questions), and Class IV (501 questions). Each bank is aligned with the respective WPI Need-to-Know Criteria and includes timed mock exams, AI Tutor, formula sheet, and score history.",
  },
  {
    q: "Is WPI Wastewater Treatment prep available?",
    a: "Yes — all four WPI Wastewater classes are now live. Class I (500 questions) covers Collection Systems, Primary & Secondary Treatment, Solids Handling, Lab & Monitoring, and Safety. Class II (501 questions) covers advanced secondary treatment, nutrient removal, and biosolids management. Class III (501 questions) covers Biological Nutrient Removal, Membrane Bioreactors, Industrial Pretreatment, and Advanced Biosolids. Class IV (502 questions) covers Advanced Process Control, Resource Recovery, Emerging Technologies, Plant Management, and Emergency Response. A WPI Wastewater Full Ladder Bundle (Class I–IV) is also available at CA$299, saving CA$157 vs. buying individually.",
  },
];

const WATER_CLASSES = [
  {
    level: "CLASS I",
    questions: "502",
    price: "CA$79",
    priceNum: 7900,
    color: "#0E7490",
    bg: "#F0FDFF",
    border: "#A5F3FC",
    quizHref: "/wpi-class1-water",
    mockHref: "/wpi-class1-water-mock",
    formulaHref: "/formulas-wpi-class1",
    formulaDesc: "CT values, dosing, flow rate",
    features: ["502 practice questions", "Timed mock exam", "Formula sheet", "AI Tutor", "Score history"],
  },
  {
    level: "CLASS II",
    questions: "501",
    price: "CA$99",
    priceNum: 9900,
    color: "#0F766E",
    bg: "#F0FDFA",
    border: "#99F6E4",
    quizHref: "/wpi-class2-water",
    mockHref: "/wpi-class2-water-mock",
    formulaHref: "/formulas-wpi-class2",
    formulaDesc: "Ozone, UV, membranes, hydraulics",
    features: ["501 advanced questions", "Timed mock exam", "Formula sheet", "AI Tutor", "Score history"],
  },
  {
    level: "CLASS III",
    questions: "502",
    price: "CA$129",
    priceNum: 12900,
    color: "#1D4ED8",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    quizHref: "/wpi-class3-water",
    mockHref: "/wpi-class3-water-mock",
    formulaHref: "/formulas-wpi-class3",
    formulaDesc: "Ozone CT, membranes, process control",
    features: ["502 senior questions", "Timed mock exam", "Formula sheet", "AI Tutor", "Score history"],
  },
  {
    level: "CLASS IV",
    questions: "501",
    price: "CA$149",
    priceNum: 14900,
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    quizHref: "/wpi-class4-water",
    mockHref: "/wpi-class4-water-mock",
    formulaHref: "/formulas-wpi-class4",
    formulaDesc: "Advanced plant management formulas",
    features: ["501 chief-operator questions", "Timed mock exam", "Formula sheet", "AI Tutor", "Score history"],
    badge: "👑 Chief Operator",
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

  const province = PROVINCES.find(p => p.code === activeProvince) ?? PROVINCES[0];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
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
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 800, color: "#0F172A", textAlign: "center", marginBottom: 8 }}>
            Select Your Province
          </h2>
          <p style={{ fontSize: 14, color: "#64748B", textAlign: "center", marginBottom: 32 }}>
            WPI exams are administered by your provincial certification body
          </p>

          {/* Province tabs */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
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

          {/* Province detail */}
          <div style={{
            background: province.bg,
            border: `2px solid ${province.color}22`,
            borderRadius: 20,
            padding: "28px",
            display: "flex",
            gap: 32,
            flexWrap: "wrap",
          }}>
            <div style={{ flex: "1 1 220px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: province.color, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 8 }}>
                {province.flag} {province.name}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 4, fontFamily: "'Sora', sans-serif" }}>
                {province.certBody}
              </div>
              <div style={{ fontSize: 13, color: "#475569", marginBottom: 12 }}>{province.certBodyFull}</div>
              <div style={{ fontSize: 12, color: "#64748B", marginBottom: 16 }}>
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

            <div style={{ flex: "1 1 280px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>Available Prep Materials</div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                {[
                  { href: "/wpi-class1-water", label: "🌊 Class I Water Practice", sub: "502 questions · 15 free" },
                  { href: "/wpi-class1-water-mock", label: "📋 Class I Water Mock Exam", sub: "100 questions · 2 hours" },
                  { href: "/formulas-wpi-class1", label: "📐 Class I Water Formulas", sub: "CT values, dosing, flow rate" },
                  { href: "/wpi-class2-water", label: "🌊 Class II Water Practice", sub: "501 questions · 15 free" },
                  { href: "/wpi-class2-water-mock", label: "📋 Class II Water Mock Exam", sub: "100 questions · 2 hours" },
                  { href: "/formulas-wpi-class2", label: "📐 Class II Water Formulas", sub: "Ozone, UV, membranes, hydraulics" },
                  { href: "/wpi-class3-water", label: "🌊 Class III Water Practice", sub: "502 questions · 15 free" },
                  { href: "/wpi-class3-water-mock", label: "📋 Class III Water Mock Exam", sub: "100 questions · 2 hours" },
                  { href: "/formulas-wpi-class3", label: "📐 Class III Water Formulas", sub: "Ozone CT, membranes, process control" },
                  { href: "/wpi-class4-water", label: "🌊 Class IV Water Practice", sub: "501 questions · 15 free" },
                  { href: "/wpi-class4-water-mock", label: "📋 Class IV Water Mock Exam", sub: "100 questions · 2 hours" },
                  { href: "/formulas-wpi-class4", label: "📐 Class IV Water Formulas", sub: "Advanced plant management formulas" },
                  { href: "/wpi-class1-wastewater", label: "🌊 Class I Wastewater Practice", sub: "500 questions · 15 free" },
                  { href: "/wpi-class1-wastewater-mock", label: "📋 Class I Wastewater Mock Exam", sub: "100 questions · 2 hours" },
                  { href: "/formulas-wpi-class1-ww", label: "📐 Class I Wastewater Formulas", sub: "BOD, TSS, HRT, SRT, loading rates" },
                  { href: "/wpi-class2-wastewater", label: "🌊 Class II Wastewater Practice", sub: "501 questions · 15 free" },
                  { href: "/wpi-class2-wastewater-mock", label: "📋 Class II Wastewater Mock Exam", sub: "100 questions · 2 hours" },
                  { href: "/formulas-wpi-class2-ww", label: "📐 Class II Wastewater Formulas", sub: "BNR, SRT, SVI, biosolids" },
                  { href: "/wpi-class3-wastewater", label: "🌊 Class III Wastewater Practice", sub: "501 questions · 15 free" },
                  { href: "/wpi-class3-wastewater-mock", label: "📋 Class III Wastewater Mock Exam", sub: "100 questions · 2 hours" },
                  { href: "/formulas-wpi-class3-ww", label: "📐 Class III Wastewater Formulas", sub: "BNR kinetics, MBR, biosolids, industrial pretreatment" },
                  { href: "/wpi-class4-wastewater", label: "🏛️ Class IV Wastewater Practice", sub: "502 questions · 15 free" },
                  { href: "/wpi-class4-wastewater-mock", label: "📋 Class IV Wastewater Mock Exam", sub: "100 questions · 2 hours" },
                  { href: "/formulas-wpi-class4-ww", label: "📐 Class IV Wastewater Formulas", sub: "Advanced process control, BNR, biogas, asset management" },
                ].map(item => (
                  <Link key={item.href} href={item.href}>
                    <div style={{
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: 10,
                      padding: "10px 14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{item.label}</div>
                        <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>{item.sub}</div>
                      </div>
                      <span style={{ color: province.color, fontSize: 14 }}>→</span>
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
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800, color: "#0F172A", textAlign: "center", marginBottom: 8 }}>
            What's Covered
          </h2>
          <p style={{ fontSize: 14, color: "#64748B", textAlign: "center", marginBottom: 48 }}>
            Questions aligned with the WPI Need-to-Know Criteria for each class level
          </p>

          {/* Water Treatment Classes */}
          {[
            { label: "CLASS I WATER", count: "502", color: "#0E7490", modules: MODULES_C1 },
            { label: "CLASS II WATER", count: "501", color: "#0F766E", modules: MODULES_C2 },
            { label: "CLASS III WATER", count: "502", color: "#1D4ED8", modules: MODULES_C3 },
            { label: "CLASS IV WATER", count: "501", color: "#7C3AED", modules: MODULES_C4 },
            { label: "CLASS I WASTEWATER", count: "500", color: "#B45309", modules: MODULES_WW1 },
          ].map(cls => (
            <div key={cls.label} style={{ marginBottom: 48 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ background: cls.color, color: "#FFFFFF", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 6 }}>
                  {cls.label}
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>{cls.count} Questions</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
                {cls.modules.map(m => (
                  <div key={m.name} style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: 14,
                    padding: "18px",
                  }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{m.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 3 }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>{m.count} questions</div>
                    <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5 }}>{m.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing CTA ───────────────────────────────────────────────────── */}
      <section style={{ background: "#FFFFFF", padding: "64px 20px", borderTop: "1px solid #E2E8F0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800, color: "#0F172A", textAlign: "center", marginBottom: 8 }}>
            Unlock Full Access
          </h2>
          <p style={{ fontSize: 15, color: "#64748B", marginBottom: 40, lineHeight: 1.7, textAlign: "center" }}>
            Start with 15 free questions per session — no account required. Upgrade to unlock all questions, timed mock exams, AI Tutor, and score history.
          </p>

          {/* Water Treatment cards */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 16, textAlign: "center" }}>
              💧 Water Treatment
            </div>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              {WATER_CLASSES.map(cls => (
                <div key={cls.level} style={{
                  background: cls.bg,
                  border: `2px solid ${cls.border}`,
                  borderRadius: 20,
                  padding: "24px 20px",
                  width: 220,
                  textAlign: "left",
                  flexShrink: 0,
                }}>
                  {(cls as any).badge && (
                    <div style={{ display: "inline-block", background: cls.color, color: "#FFFFFF", fontSize: 10, fontWeight: 700, borderRadius: 6, padding: "2px 8px", marginBottom: 8, letterSpacing: "0.05em" }}>{(cls as any).badge}</div>
                  )}
                  <div style={{ fontSize: 10, fontWeight: 700, color: cls.color, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 6 }}>WPI {cls.level}</div>
                  <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: "#0F172A", marginBottom: 3 }}>{cls.price}</div>
                  <div style={{ fontSize: 11, color: "#64748B", marginBottom: 16 }}>Unlimited · {cls.questions} questions</div>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px", display: "flex", flexDirection: "column" as const, gap: 6 }}>
                    {cls.features.map(f => (
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
                      borderRadius: 10,
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

          {/* WPI Water Bundle callout */}
          <div style={{ marginBottom: 40, display: "flex", justifyContent: "center" }}>
            <div style={{
              background: "linear-gradient(135deg, #ECFEFF 0%, #EFF6FF 100%)",
              border: "2px solid #A5F3FC",
              borderRadius: 20,
              padding: "28px 32px",
              maxWidth: 680,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 24,
              flexWrap: "wrap" as const,
            }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#0E7490", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 6 }}>💡 Best Value — WPI Bundle</div>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>WPI Water Full Ladder</div>
                <div style={{ fontSize: 13, color: "#475569", marginBottom: 8 }}>WPI Class I–IV Water · 2,000+ questions · Save CA$157</div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const }}>
                  {["WPI Class I Water", "WPI Class II Water", "WPI Class III Water", "WPI Class IV Water"].map(item => (
                    <span key={item} style={{ fontSize: 11, color: "#0E7490", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ color: "#059669" }}>✓</span> {item}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: "center" as const, flexShrink: 0 }}>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 30, fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>CA$299</div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 12 }}>one-time · no subscription</div>
                <Link href="/pricing">
                  <button style={{
                    background: "#0E7490",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 10,
                    padding: "12px 24px",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    whiteSpace: "nowrap" as const,
                  }}>
                    Get WPI Water Bundle →
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Wastewater cards */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 16, textAlign: "center" }}>
              ♻️ Wastewater Treatment
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const, justifyContent: "center" }}>
              {[
                { label: "WPI CLASS I WASTEWATER", price: "CA$79", questions: "500", color: "#B45309", bg: "#FFFBEB", border: "#FDE68A", href: "/wpi-class1-wastewater", btnLabel: "Get WW Class I Pass →", features: ["500 wastewater questions", "Timed mock exam", "Formula sheet", "AI Tutor", "Score history"] },
                { label: "WPI CLASS II WASTEWATER", price: "CA$99", questions: "501", color: "#0F766E", bg: "#F0FDFA", border: "#99F6E4", href: "/wpi-class2-wastewater", btnLabel: "Get WW Class II Pass →", features: ["501 advanced WW questions", "Timed mock exam", "Formula sheet", "AI Tutor", "Score history"] },
                { label: "WPI CLASS III WASTEWATER", price: "CA$129", questions: "501", color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE", href: "/wpi-class3-wastewater", btnLabel: "Get WW Class III Pass →", features: ["501 senior WW questions", "Timed mock exam", "Formula sheet", "AI Tutor", "Score history"] },
                { label: "WPI CLASS IV WASTEWATER", price: "CA$149", questions: "502", color: "#6D28D9", bg: "#F5F3FF", border: "#C4B5FD", href: "/wpi-class4-wastewater", btnLabel: "Get WW Class IV Pass →", features: ["502 chief operator questions", "Timed mock exam", "Formula sheet", "AI Tutor", "Score history"], badge: "👑 Chief Operator" },
              ].map(ww => (
                <div key={ww.label} style={{
                  background: ww.bg,
                  border: `2px solid ${ww.border}`,
                  borderRadius: 20,
                  padding: "24px 20px",
                  width: 240,
                  textAlign: "left" as const,
                  flexShrink: 0,
                }}>
                  {(ww as any).badge && (
                    <div style={{ display: "inline-block", background: ww.color, color: "#FFFFFF", fontSize: 10, fontWeight: 700, borderRadius: 6, padding: "2px 8px", marginBottom: 8, letterSpacing: "0.05em" }}>{(ww as any).badge}</div>
                  )}
                  <div style={{ fontSize: 10, fontWeight: 700, color: ww.color, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 6 }}>{ww.label}</div>
                  <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: "#0F172A", marginBottom: 3 }}>{ww.price}</div>
                  <div style={{ fontSize: 11, color: "#64748B", marginBottom: 16 }}>Unlimited · {ww.questions} questions</div>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px", display: "flex", flexDirection: "column" as const, gap: 6 }}>
                    {ww.features.map(f => (
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
                      borderRadius: 10,
                      padding: "10px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}>
                      {ww.btnLabel}
                    </button>
                  </Link>

                </div>
              ))}
             </div>
          {/* WPI Wastewater Bundle callout */}
          <div style={{ marginTop: 32, display: "flex", justifyContent: "center" }}>
            <div style={{
              background: "linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)",
              border: "2px solid #BFDBFE",
              borderRadius: 20,
              padding: "28px 32px",
              maxWidth: 680,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 24,
              flexWrap: "wrap" as const,
            }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#1D4ED8", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 6 }}>💡 Best Value — WPI Bundle</div>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>WPI Wastewater Full Ladder</div>
                <div style={{ fontSize: 13, color: "#475569", marginBottom: 8 }}>WPI Class I–IV Wastewater · 1,500+ questions · Save CA$157</div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const }}>
                  {["WPI Class I WW", "WPI Class II WW", "WPI Class III WW", "WPI Class IV WW"].map(item => (
                    <span key={item} style={{ fontSize: 11, color: "#1D4ED8", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ color: "#059669" }}>✓</span> {item}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: "center" as const, flexShrink: 0 }}>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 30, fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>CA$299</div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 12 }}>one-time · no subscription</div>
                <Link href="/pricing">
                  <button style={{
                    background: "#1D4ED8",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 10,
                    padding: "12px 24px",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    whiteSpace: "nowrap" as const,
                  }}>
                    Get WPI WW Bundle →
                  </button>
                </Link>
              </div>
            </div>
          </div>

          </div>
        </div>
      </section>
      {/* ── WPI vs OWWCO Comparison Table ────────────────────────────── */}
      <section style={{ background: "#FFFFFF", padding: "64px 20px", borderTop: "1px solid #E2E8F0" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800, color: "#0F172A", textAlign: "center" as const, marginBottom: 8 }}>
            WPI vs. OWWCO — Which Exam Do You Need?
          </h2>
          <p style={{ textAlign: "center" as const, fontSize: 14, color: "#64748B", marginBottom: 40, maxWidth: 600, margin: "0 auto 40px" }}>
            Both WPI and OWWCO use standardized national question banks. Your province determines which certification body you register with.
          </p>
          <div style={{ overflowX: "auto" as const }}>
            <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F1F5F9" }}>
                  {["Province", "Cert Body", "Exam System", "Levels Available", "Question Format", "Passing Score"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left" as const, fontWeight: 700, color: "#0F172A", borderBottom: "2px solid #E2E8F0", whiteSpace: "nowrap" as const }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { province: "🇧🇨 BC", body: "EOCP", system: "WPI", levels: "Class I–IV Water & WW", format: "Multiple choice", pass: "70%", highlight: true },
                  { province: "🇦🇧 AB", body: "AWWOA", system: "WPI", levels: "Class I–IV Water & WW", format: "Multiple choice", pass: "70%", highlight: true },
                  { province: "🇸🇰 SK", body: "SAHO", system: "WPI", levels: "Class I–IV Water & WW", format: "Multiple choice", pass: "70%", highlight: true },
                  { province: "🇲🇧 MB", body: "MWWA", system: "WPI", levels: "Class I–IV Water & WW", format: "Multiple choice", pass: "70%", highlight: true },
                  { province: "🇨🇦 ON", body: "OWWCO", system: "OWWCO", levels: "OIT, Class 1–4 Water & WW, WQA", format: "Multiple choice", pass: "70%", highlight: false },
                ].map((row, i) => (
                  <tr key={i} style={{ background: row.highlight ? "#ECFEFF" : i % 2 === 0 ? "#FFFFFF" : "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                    <td style={{ padding: "12px 14px", fontWeight: 600, color: "#0F172A" }}>{row.province}</td>
                    <td style={{ padding: "12px 14px", color: row.highlight ? "#0E7490" : "#1D4ED8", fontWeight: 600 }}>{row.body}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ background: row.highlight ? "#CFFAFE" : "#DBEAFE", color: row.highlight ? "#0E7490" : "#1D4ED8", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{row.system}</span>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#475569" }}>{row.levels}</td>
                    <td style={{ padding: "12px 14px", color: "#475569" }}>{row.format}</td>
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: "#16A34A" }}>{row.pass}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ textAlign: "center" as const, fontSize: 12, color: "#94A3B8", marginTop: 16 }}>
            Passing score and format may vary — always verify with your provincial certification body before registering.
          </p>
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
