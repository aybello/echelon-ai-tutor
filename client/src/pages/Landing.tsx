// Echelon Institute — Homepage / Landing Page
// Design: Bold, modern SaaS — feels like the product itself
// Audience: Ontario water/wastewater operators seeking certification

import { Link } from "wouter";
import { useState } from "react";
import NotifyModal from "@/components/NotifyModal";

const WATER_COURSES = [
  {
    code: "OIT-W",
    title: "Water OIT",
    subtitle: "Operator-in-Training",
    price: 119,
    duration: "4–6 weeks",
    questions: 500,
    description: "Foundation course covering basic water treatment principles, safety, and Ontario regulations. Your first step toward certification.",
    topics: ["Water Sources & Quality", "Basic Treatment Processes", "O. Reg. 170/03", "Safety & First Aid", "Basic Math & Calculations"],
    badge: "Most Popular",
    badgeColor: "#2563EB",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  {
    code: "CL1-W",
    title: "Water Class 1",
    subtitle: "Class 1 Certification",
    price: 179,
    duration: "6–8 weeks",
    questions: 500,
    description: "Covers coagulation, flocculation, sedimentation, filtration, and disinfection in depth. Prepares you for the OWWCO Class 1 exam.",
    topics: ["Coagulation & Flocculation", "Sedimentation & Filtration", "Chlorination & CT Values", "O. Reg. 128/04", "Process Control Basics"],
    badge: null,
    color: "#0369A1",
    bg: "#F0F9FF",
    border: "#BAE6FD",
  },
  {
    code: "CL2-W",
    title: "Water Class 2",
    subtitle: "Class 2 Certification",
    price: 229,
    duration: "8–10 weeks",
    questions: 500,
    description: "Advanced process control, chemical handling, hydraulics, and troubleshooting for mid-career operators.",
    topics: ["Advanced Hydraulics", "Chemical Feed Systems", "Process Troubleshooting", "SCADA Fundamentals", "Regulatory Compliance"],
    badge: null,
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    comingSoon: true,
  },
  {
    code: "CL3-W",
    title: "Water Class 3",
    subtitle: "Class 3 Certification",
    price: 279,
    duration: "10–12 weeks",
    questions: 500,
    description: "System design principles, advanced math, and management of large-scale water treatment operations.",
    topics: ["System Design Principles", "Advanced Process Math", "Capital Planning Basics", "Staff Supervision", "Emergency Response"],
    badge: null,
    color: "#1E40AF",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    comingSoon: true,
  },
  {
    code: "CL4-W",
    title: "Water Class 4",
    subtitle: "Class 4 Certification",
    price: 329,
    duration: "12–14 weeks",
    questions: 500,
    description: "The highest certification level. Full system management, regulatory compliance, and strategic operations leadership.",
    topics: ["Full System Management", "Regulatory Leadership", "Advanced Troubleshooting", "Capital & Budget Planning", "Class 4 Exam Prep"],
    badge: "Premium",
    badgeColor: "#7C3AED",
    color: "#6D28D9",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    comingSoon: true,
  },
];

const WASTEWATER_COURSES = [
  {
    code: "OIT-WW",
    title: "Wastewater OIT",
    subtitle: "Operator-in-Training",
    price: 119,
    duration: "4–6 weeks",
    questions: 500,
    description: "Introduction to wastewater collection, treatment principles, and Ontario regulations. Start your wastewater career here.",
    topics: ["Wastewater Characteristics", "Collection Systems", "Basic Treatment Processes", "O. Reg. 129/04", "Safety Fundamentals"],
    badge: "Most Popular",
    badgeColor: "#059669",
    color: "#065F46",
    bg: "#ECFDF5",
    border: "#A7F3D0",
  },
  {
    code: "CL1-WW",
    title: "Wastewater Class 1",
    subtitle: "Class 1 Certification",
    price: 179,
    duration: "6–8 weeks",
    questions: 500,
    description: "Primary and secondary treatment, activated sludge basics, and effluent quality standards.",
    topics: ["Primary Clarification", "Activated Sludge Process", "BOD & TSS Control", "Effluent Standards", "Basic Lab Testing"],
    badge: null,
    color: "#047857",
    bg: "#F0FDF4",
    border: "#BBF7D0",
  },
  {
    code: "CL2-WW",
    title: "Wastewater Class 2",
    subtitle: "Class 2 Certification",
    price: 229,
    duration: "8–10 weeks",
    questions: 500,
    description: "Advanced biological treatment, nutrient removal, sludge management, and process troubleshooting.",
    topics: ["Nutrient Removal (BNR)", "Sludge Processing & Dewatering", "SRT & SVI Calculations", "Advanced Lab Analysis", "Process Optimization"],
    badge: null,
    color: "#0F766E",
    bg: "#F0FDFA",
    border: "#99F6E4",
    comingSoon: true,
  },
  {
    code: "CL3-WW",
    title: "Wastewater Class 3",
    subtitle: "Class 3 Certification",
    price: 279,
    duration: "10–12 weeks",
    questions: 500,
    description: "Large-scale wastewater system management, advanced process control, and regulatory leadership.",
    topics: ["Large System Operations", "Advanced Process Control", "Regulatory Reporting", "Staff & Budget Management", "Emergency Planning"],
    badge: null,
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    comingSoon: true,
  },
  {
    code: "CL4-WW",
    title: "Wastewater Class 4",
    subtitle: "Class 4 Certification",
    price: 329,
    duration: "12–14 weeks",
    questions: 500,
    description: "The pinnacle of wastewater certification. Strategic operations, capital planning, and full regulatory compliance.",
    topics: ["Full System Leadership", "Capital & Infrastructure Planning", "Advanced Troubleshooting", "Regulatory Compliance", "Class 4 Exam Mastery"],
    badge: "Premium",
    badgeColor: "#7C3AED",
    color: "#6D28D9",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    comingSoon: true,
  },
];

const FEATURES = [
  {
    icon: "🤖",
    title: "AI Tutor",
    description: "Ask anything, get instant expert answers. The AI Tutor knows Ontario regulations, process chemistry, and exam strategy.",
    color: "#2563EB",
    href: "/quiz",
  },
  {
    icon: "🎯",
    title: "Adaptive Practice",
    description: "The engine learns your weak spots and serves targeted questions. Study smarter, not longer.",
    color: "#7C3AED",
    href: "/quiz",
  },
  {
    icon: "🏭",
    title: "Interactive Process Guides",
    description: "Click through animated treatment plant diagrams. See how every component works — not just read about it.",
    color: "#059669",
    href: "/process",
  },
  {
    icon: "⚙️",
    title: "Pumping Systems Module",
    description: "Live pump curves, cavitation toggle, series/parallel configurations. The most technical module on the exam, made visual.",
    color: "#D97706",
    href: "/pumping",
  },
  {
    icon: "🧪",
    title: "Chemical Feed Calculator",
    description: "Real-time dosing calculations for chlorine, alum, lime, and fluoride. Know the formula and the answer.",
    color: "#DC2626",
    href: "/chem-calc",
  },
  {
    icon: "📐",
    title: "Formula Sheet",
    description: "33 Ontario operator exam formulas with worked examples and exam tips. CT values, SVI, pump power, and more.",
    color: "#0E7490",
    href: "/formulas",
  },
  {
    icon: "🗺️",
    title: "Career Map",
    description: "See your full career path — OIT to Class 4 — with salary ranges, employer landscape, and certification timelines.",
    color: "#1D4ED8",
    href: "/career",
  },
];

const STATS = [
  { value: "475", label: "OIT Practice Questions" },
  { value: "10", label: "Certification Courses" },
  { value: "3", label: "Specialization Tracks" },
  { value: "Free", label: "OIT Access" },
];

function CourseCard({ course }: { course: typeof WATER_COURSES[0] }) {
  const [expanded, setExpanded] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: `1.5px solid ${course.border}`,
        borderRadius: 16,
        padding: "24px",
        position: "relative",
        transition: "box-shadow 0.2s, transform 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.10)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
    >
      {course.badge && (
        <div style={{
          position: "absolute", top: 16, right: 16,
          background: course.badgeColor, color: "#fff",
          fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
          letterSpacing: "0.05em", textTransform: "uppercase",
        }}>
          {course.badge}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{
          background: course.bg, color: course.color,
          fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
          letterSpacing: "0.05em", textTransform: "uppercase",
        }}>
          {course.code}
        </span>
        <span style={{ color: "#94A3B8", fontSize: 11 }}>{course.duration}</span>
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: "0 0 2px 0", fontFamily: "Sora, sans-serif" }}>
        {course.title}
      </h3>
      <p style={{ fontSize: 12, color: course.color, fontWeight: 600, margin: "0 0 10px 0" }}>{course.subtitle}</p>
      <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, margin: "0 0 16px 0" }}>{course.description}</p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <span style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", fontFamily: "Sora, sans-serif" }}>${course.price}</span>
          <span style={{ fontSize: 12, color: "#94A3B8", marginLeft: 4 }}>CAD</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#F8FAFC", borderRadius: 8, padding: "6px 12px" }}>
          <span style={{ fontSize: 11, color: "#64748B" }}>📝 {course.questions} questions</span>
        </div>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%", padding: "8px", borderRadius: 8,
          border: `1px solid ${course.border}`, background: "transparent",
          color: course.color, fontSize: 12, fontWeight: 600,
          cursor: "pointer", marginBottom: 12, fontFamily: "inherit",
          transition: "background 0.15s",
        }}
      >
        {expanded ? "▲ Hide Topics" : "▼ View Topics"}
      </button>

      {expanded && (
        <ul style={{ margin: "0 0 16px 0", padding: "0 0 0 16px" }}>
          {course.topics.map(t => (
            <li key={t} style={{ fontSize: 12, color: "#475569", marginBottom: 4 }}>{t}</li>
          ))}
        </ul>
      )}

      {course.comingSoon ? (
        <button
          onClick={() => setNotifyOpen(true)}
          style={{
            width: "100%", padding: "12px",
            background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
            color: "#fff", border: "none", borderRadius: 10,
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            fontFamily: "inherit", transition: "opacity 0.15s",
          }}
        >
          🔔 Notify Me When Available
        </button>
      ) : (
        <Link href="/quiz">
          <button style={{
            width: "100%", padding: "12px",
            background: `linear-gradient(135deg, ${course.color}, ${course.color}CC)`,
            color: "#fff", border: "none", borderRadius: 10,
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            fontFamily: "inherit", transition: "opacity 0.15s",
          }}>
            Start Studying →
          </button>
        </Link>
      )}

      {notifyOpen && (
        <NotifyModal
          courseCode={course.code}
          courseTitle={course.title}
          onClose={() => setNotifyOpen(false)}
        />
      )}
    </div>
  );
}

const WQA_COURSES = [
  {
    code: "WQA",
    title: "Water Quality Analyst",
    subtitle: "Ontario WQA Certification Prep",
    price: 199,
    duration: "6–8 weeks",
    questions: 400,
    description: "Complete preparation for the Ontario Water Quality Analyst certification under O. Reg. 128/04. Covers sampling protocols, analytical methods, QA/QC programs, chain of custody, and regulatory reporting for accredited drinking water labs.",
    topics: ["Sampling Techniques & Chain of Custody", "Analytical Methods & Lab Equipment", "QA/QC Programs & Method Validation", "O. Reg. 128/04 Requirements", "Regulatory Reporting & Documentation"],
    badge: "Single Certification",
    badgeColor: "#7C3AED",
    color: "#6D28D9",
    bg: "#FAF5FF",
    border: "#DDD6FE",
    comingSoon: true,
  },
];

export default function Landing() {
  const [activeTrack, setActiveTrack] = useState<"water" | "wastewater" | "wqa">("water");

  return (
    <div style={{ fontFamily: "Sora, Nunito, sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>

      {/* ── Navigation ── */}
      <nav style={{
        background: "#FFFFFF",
        borderBottom: "1px solid #E2E8F0",
        padding: "0 24px",
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 64,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #1D4ED8, #0E7490)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#fff", fontSize: 18 }}>⚗</span>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>Echelon Institute</div>
            <div style={{ fontSize: 10, color: "#64748B", fontWeight: 500, marginTop: -2 }}>Ontario Operator Certification</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {[
            { label: "Courses", href: "#courses" },
            { label: "Study Tools", href: "#tools" },
            { label: "Formulas", href: "/formulas" },
            { label: "Career Map", href: "/career" },
          ].map(item => (
            <a key={item.label} href={item.href} style={{
              padding: "6px 14px", borderRadius: 8,
              color: "#475569", fontSize: 13, fontWeight: 600,
              textDecoration: "none", transition: "color 0.15s",
            }}>
              {item.label}
            </a>
          ))}
          <Link href="/quiz">
            <button style={{
              padding: "8px 20px", borderRadius: 10,
              background: "linear-gradient(135deg, #1D4ED8, #0E7490)",
              color: "#fff", border: "none", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              Try Free →
            </button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0E7490 100%)",
        padding: "80px 24px 100px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background grid pattern */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", maxWidth: 800, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)",
            borderRadius: 20, padding: "6px 16px", marginBottom: 24,
            border: "1px solid rgba(255,255,255,0.15)",
          }}>
            <span style={{ fontSize: 12 }}>🇨🇦</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
              Built for Ontario Water & Wastewater Operators
            </span>
          </div>

          <h1 style={{
            fontSize: "clamp(32px, 5vw, 56px)",
            fontWeight: 800,
            color: "#FFFFFF",
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            margin: "0 0 20px 0",
          }}>
            Pass Your Operator Exam.<br />
            <span style={{ background: "linear-gradient(90deg, #38BDF8, #34D399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Advance Your Career.
            </span>
          </h1>

          <p style={{
            fontSize: "clamp(15px, 2vw, 18px)",
            color: "rgba(255,255,255,0.75)",
            lineHeight: 1.7,
            maxWidth: 600,
            margin: "0 auto 36px",
          }}>
            Ontario's only AI-powered exam prep platform for water and wastewater operators.
            Adaptive practice questions, interactive process guides, and an AI tutor available 24/7.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/quiz">
              <button style={{
                padding: "14px 32px", borderRadius: 12,
                background: "linear-gradient(135deg, #2563EB, #0E7490)",
                color: "#fff", border: "none", fontSize: 15, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 4px 24px rgba(37,99,235,0.4)",
              }}>
                Try Free OIT Practice →
              </button>
            </Link>
            <a href="#courses">
              <button style={{
                padding: "14px 32px", borderRadius: 12,
                background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)",
                color: "#fff", border: "1px solid rgba(255,255,255,0.2)",
                fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>
                View All Courses
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section style={{
        background: "#FFFFFF",
        borderBottom: "1px solid #E2E8F0",
        padding: "28px 24px",
      }}>
        <div style={{
          maxWidth: 900, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 24, textAlign: "center",
        }}>
          {STATS.map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em", fontFamily: "Sora, sans-serif" }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: "#64748B", fontWeight: 500, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Course Catalogue ── */}
      <section id="courses" style={{ padding: "72px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", margin: "0 0 12px 0" }}>
            Choose Your Certification Track
          </h2>
          <p style={{ fontSize: 16, color: "#64748B", maxWidth: 560, margin: "0 auto 32px" }}>
            Three certification tracks — Water Treatment (5 levels), Wastewater Treatment (5 levels), and Water Quality Analyst (single Ontario certification). Every course includes hundreds of practice questions and full AI Tutor access.
          </p>

          {/* Track Toggle */}
          <div style={{
            display: "inline-flex", background: "#F1F5F9", borderRadius: 12, padding: 4, gap: 4, flexWrap: "wrap", justifyContent: "center",
          }}>
            <button
              onClick={() => setActiveTrack("water")}
              style={{
                padding: "10px 24px", borderRadius: 10, border: "none",
                background: activeTrack === "water" ? "#1D4ED8" : "transparent",
                color: activeTrack === "water" ? "#fff" : "#64748B",
                fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.2s",
              }}
            >
              💧 Water Treatment
            </button>
            <button
              onClick={() => setActiveTrack("wastewater")}
              style={{
                padding: "10px 24px", borderRadius: 10, border: "none",
                background: activeTrack === "wastewater" ? "#059669" : "transparent",
                color: activeTrack === "wastewater" ? "#fff" : "#64748B",
                fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.2s",
              }}
            >
              ♻️ Wastewater Treatment
            </button>
            <button
              onClick={() => setActiveTrack("wqa")}
              style={{
                padding: "10px 24px", borderRadius: 10, border: "none",
                background: activeTrack === "wqa" ? "#7C3AED" : "transparent",
                color: activeTrack === "wqa" ? "#fff" : "#64748B",
                fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.2s",
              }}
            >
              🔬 Water Quality Analyst
            </button>
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 24,
        }}>
          {(activeTrack === "water" ? WATER_COURSES : activeTrack === "wastewater" ? WASTEWATER_COURSES : WQA_COURSES).map(course => (
            <CourseCard key={course.code} course={course} />
          ))}
        </div>
      </section>

      {/* ── Study Tools Feature Section ── */}
      <section id="tools" style={{
        background: "#0F172A",
        padding: "72px 24px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em", margin: "0 0 12px 0" }}>
              Every Tool You Need to Pass
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", maxWidth: 500, margin: "0 auto" }}>
              Built specifically for Ontario operator exams — not generic quiz apps repurposed for water treatment.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 20,
          }}>
            {FEATURES.map(f => (
              <Link key={f.title} href={f.href}>
                <div style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16, padding: "28px 24px",
                  transition: "background 0.2s, transform 0.15s, box-shadow 0.15s",
                  cursor: "pointer",
                  height: "100%",
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.10)";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 28px ${f.color}30`;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                  }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: `${f.color}22`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24, marginBottom: 16,
                  }}>
                    {f.icon}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", margin: "0 0 8px 0" }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, margin: "0 0 14px 0" }}>{f.description}</p>
                  <div style={{ fontSize: 11, fontWeight: 700, color: f.color }}>Open →</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{
        background: "linear-gradient(135deg, #1D4ED8, #0E7490)",
        padding: "64px 24px",
        textAlign: "center",
      }}>
        <h2 style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 800, color: "#FFFFFF", margin: "0 0 12px 0", letterSpacing: "-0.02em" }}>
          Start with the OIT — It's Free
        </h2>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", margin: "0 0 32px 0" }}>
          Try 475 OIT practice questions across 10 modules with full AI Tutor access. No account required.
        </p>
        <Link href="/quiz">
          <button style={{
            padding: "16px 40px", borderRadius: 12,
            background: "#FFFFFF", color: "#1D4ED8",
            border: "none", fontSize: 16, fontWeight: 800,
            cursor: "pointer", fontFamily: "inherit",
            boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
          }}>
            Start Free OIT Practice →
          </button>
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        background: "#0F172A",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        padding: "32px 24px",
        textAlign: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg, #1D4ED8, #0E7490)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#fff", fontSize: 14 }}>⚗</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF" }}>Echelon Institute</span>
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>
          Ontario's AI-powered exam prep platform for water and wastewater operators.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16 }}>
          {[
            { label: "AI Tutor Quiz", href: "/quiz" },
            { label: "Formula Sheet", href: "/formulas" },
            { label: "Drinking Water", href: "/process" },
            { label: "Wastewater", href: "/wastewater" },
            { label: "Career Map", href: "/career" },
            { label: "Pumping Systems", href: "/pumping" },
            { label: "Lab & Sampling", href: "/lab" },
          ].map(link => (
            <Link key={link.label} href={link.href}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", cursor: "pointer", textDecoration: "none" }}>
                {link.label}
              </span>
            </Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
