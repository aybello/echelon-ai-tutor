// Math Practice Hub — entry point for all calc-only (Math Practice) sessions
// Lists all courses that have step-by-step calculation questions
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import SiteNav from "@/components/SiteNav";

const COURSES = [
  // Ontario
  {
    group: "Ontario (OIT / ABC)",
    items: [
      { label: "OIT Water", sub: "Class 1–4 Water Treatment", href: "/quiz?calcOnly=true", color: "#0369A1", bg: "#F0F9FF", border: "#BAE6FD", count: "~80" },
      { label: "OIT Wastewater", sub: "Class 1–4 Wastewater Treatment", href: "/oit-ww?calcOnly=true", color: "#0F766E", bg: "#F0FDFA", border: "#99F6E4", count: "~75" },
      { label: "Class 1 Water", sub: "ABC Class 1 Water Treatment", href: "/class1-water?calcOnly=true", color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE", count: "~90" },
      { label: "Class 1 Wastewater", sub: "ABC Class 1 Wastewater Treatment", href: "/class1-ww?calcOnly=true", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", count: "~85" },
      { label: "Class 2 Water", sub: "ABC Class 2 Water Treatment", href: "/class2-water?calcOnly=true", color: "#0E7490", bg: "#ECFEFF", border: "#A5F3FC", count: "~95" },
      { label: "Class 2 Wastewater", sub: "ABC Class 2 Wastewater Treatment", href: "/class2-ww?calcOnly=true", color: "#B45309", bg: "#FFFBEB", border: "#FDE68A", count: "~90" },
      { label: "Class 3 Water", sub: "ABC Class 3 Water Treatment", href: "/class3-water?calcOnly=true", color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE", count: "~234" },
      { label: "Class 3 Wastewater", sub: "ABC Class 3 Wastewater Treatment", href: "/class3-ww?calcOnly=true", color: "#059669", bg: "#F0FDF4", border: "#BBF7D0", count: "~110" },
      { label: "Class 4 Water", sub: "ABC Class 4 Water Treatment", href: "/class4-water?calcOnly=true", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", count: "~212" },
      { label: "Class 4 Wastewater", sub: "ABC Class 4 Wastewater Treatment", href: "/class4-ww?calcOnly=true", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", count: "~105" },
      { label: "WQA", sub: "Water Quality Analyst Exam", href: "/wqa?calcOnly=true", color: "#0E7490", bg: "#ECFEFF", border: "#A5F3FC", count: "115" },
    ],
  },
  // WPI (BC/AB/SK/MB)
  {
    group: "WPI — BC / Alberta / Saskatchewan / Manitoba",
    items: [
      { label: "WPI Class I Water", sub: "BC EOCP / AWWOA Class I Water", href: "/wpi-class1-water?calcOnly=true", color: "#0E7490", bg: "#F0FDFF", border: "#A5F3FC", count: "~60" },
      { label: "WPI Class II Water", sub: "BC EOCP / AWWOA Class II Water", href: "/wpi-class2-water?calcOnly=true", color: "#0F766E", bg: "#F0FDFA", border: "#99F6E4", count: "~65" },
      { label: "WPI Class III Water", sub: "BC EOCP / AWWOA Class III Water", href: "/wpi-class3-water?calcOnly=true", color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE", count: "~70" },
      { label: "WPI Class IV Water", sub: "BC EOCP / AWWOA Class IV Water", href: "/wpi-class4-water?calcOnly=true", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", count: "~75" },
      { label: "WPI Class I Wastewater", sub: "BC EOCP / AWWOA Class I Wastewater", href: "/wpi-class1-wastewater?calcOnly=true", color: "#B45309", bg: "#FFFBEB", border: "#FDE68A", count: "~55" },
      { label: "WPI Class II Wastewater", sub: "BC EOCP / AWWOA Class II Wastewater", href: "/wpi-class2-wastewater?calcOnly=true", color: "#0F766E", bg: "#F0FDFA", border: "#99F6E4", count: "~60" },
      { label: "WPI Class III Wastewater", sub: "BC EOCP / AWWOA Class III Wastewater", href: "/wpi-class3-wastewater?calcOnly=true", color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE", count: "~65" },
      { label: "WPI Class IV Wastewater", sub: "BC EOCP / AWWOA Class IV Wastewater", href: "/wpi-class4-wastewater?calcOnly=true", color: "#6D28D9", bg: "#F5F3FF", border: "#C4B5FD", count: "~70" },
    ],
  },
];

const TIPS = [
  { icon: "📐", title: "Formula First", desc: "Always write down the formula before plugging in numbers. Examiners award partial marks for correct setup." },
  { icon: "🔢", title: "Unit Conversion", desc: "Convert all units to SI (L, m³, mg/L, kg/d) before calculating. Most errors come from mixed units." },
  { icon: "✅", title: "Sanity Check", desc: "After solving, ask: 'Does this answer make physical sense?' A 10,000 mg/L chlorine dose is a red flag." },
  { icon: "⏱️", title: "Time Management", desc: "On the real exam, skip calc questions you can't solve in 2 minutes and return to them at the end." },
];

export default function MathPractice() {
  usePageMeta({
    title: "Math Practice Hub — Water & Wastewater Operator Exam Calculations | Echelon Institute",
    description: "Practice calculation-only questions for water and wastewater operator exams. Step-by-step solutions for OIT, ABC Class 1–4, WQA, and WPI exams.",
    path: "/math-practice",
    keywords: "water operator math practice, wastewater calculation questions, OIT exam calculations, ABC water exam math, WPI calculation practice, operator exam formulas",
  });

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", background: "#FFFFFF", minHeight: "100vh" }}>
      <SiteNav currentPath="/math-practice" />

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4C1D95 100%)",
        padding: "60px 24px 48px",
        textAlign: "center",
      }}>
        <div style={{ display: "inline-block", background: "rgba(167,139,250,0.2)", border: "1px solid rgba(167,139,250,0.4)", borderRadius: 100, padding: "6px 16px", fontSize: 12, fontWeight: 700, color: "#C4B5FD", letterSpacing: "0.08em", marginBottom: 20 }}>
          🧮 MATH PRACTICE HUB
        </div>
        <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, color: "#FFFFFF", margin: "0 0 16px", lineHeight: 1.2 }}>
          Master the Calculations.<br />
          <span style={{ color: "#A78BFA" }}>Pass the Exam.</span>
        </h1>
        <p style={{ fontSize: 16, color: "#C4B5FD", maxWidth: 560, margin: "0 auto 32px", lineHeight: 1.7 }}>
          Every course filtered to calculation questions only — with step-by-step solutions, exam tips, and instant feedback.
        </p>
        <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
          {[
            { value: "800+", label: "Calc Questions" },
            { value: "100%", label: "Step-by-Step" },
            { value: "18", label: "Courses" },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#FFFFFF" }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: "#A78BFA", fontWeight: 600 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Exam Tips */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 0" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 16 }}>
          💡 Exam Strategy
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 40 }}>
          {TIPS.map(tip => (
            <div key={tip.title} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 14, padding: "16px 18px" }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>{tip.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF", marginBottom: 4 }}>{tip.title}</div>
              <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.6 }}>{tip.desc}</div>
            </div>
          ))}
        </div>

        {/* Course groups */}
        {COURSES.map(group => (
          <div key={group.group} style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 16 }}>
              {group.group}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
              {group.items.map(item => (
                <Link key={item.href} href={item.href}>
                  <div style={{
                    background: item.bg,
                    border: `1.5px solid ${item.border}`,
                    borderRadius: 14,
                    padding: "16px 18px",
                    cursor: "pointer",
                    transition: "transform 0.1s, box-shadow 0.1s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: item.color, marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: "#64748B" }}>{item.sub}</div>
                    </div>
                    <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", background: "#F5F3FF", padding: "3px 8px", borderRadius: 6, marginBottom: 4 }}>
                        🧮 {item.count} calc
                      </div>
                      <div style={{ fontSize: 11, color: item.color, fontWeight: 600 }}>Start →</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Bottom CTA */}
        <div style={{
          background: "linear-gradient(135deg, #F5F3FF 0%, #EFF6FF 100%)",
          border: "2px solid #DDD6FE",
          borderRadius: 20,
          padding: "32px",
          textAlign: "center",
          marginBottom: 48,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 8 }}>
            🎯 Pro Tip
          </div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800, color: "#FFFFFF", marginBottom: 8 }}>
            Struggling with a specific topic?
          </div>
          <p style={{ fontSize: 14, color: "#64748B", marginBottom: 20, lineHeight: 1.7 }}>
            Use the module filter inside any quiz to focus on one topic at a time — e.g., "Hydraulics" or "Chemical Dosing" — then switch on Math Practice mode for targeted calculation drills.
          </p>
          <Link href="/">
            <button style={{
              background: "#7C3AED",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 10,
              padding: "12px 28px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}>
              Browse All Courses →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
