// Echelon Institute — US Courses Directory v2
// Design: matches USLanding.tsx — dark bg, inline styles, stream-colored cards
import { useState } from "react";
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { FadeUp } from "@/components/animations";
import { US_STREAMS, US_LEVELS } from "@/lib/stateConfig";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_5c9ed3a7.webp";

const STREAM_GRADIENTS: Record<string, string> = {
  "water-treatment": "linear-gradient(135deg, #0369A1, #0E7490)",
  "wastewater-treatment": "linear-gradient(135deg, #0F766E, #059669)",
  "water-distribution": "linear-gradient(135deg, #1D4ED8, #0369A1)",
  "wastewater-collection": "linear-gradient(135deg, #6D28D9, #4F46E5)",
};
const STREAM_ACCENT: Record<string, string> = {
  "water-treatment": "#38BDF8",
  "wastewater-treatment": "#34D399",
  "water-distribution": "#60A5FA",
  "wastewater-collection": "#A78BFA",
};
const STREAM_BORDER: Record<string, string> = {
  "water-treatment": "rgba(56,189,248,0.2)",
  "wastewater-treatment": "rgba(52,211,153,0.2)",
  "water-distribution": "rgba(96,165,250,0.2)",
  "wastewater-collection": "rgba(167,139,250,0.2)",
};
const STREAM_DESCRIPTIONS: Record<string, string> = {
  "water-treatment": "Coagulation, flocculation, sedimentation, filtration, disinfection, chemical feed, source water quality, and regulatory compliance.",
  "wastewater-treatment": "Primary/secondary/tertiary treatment, activated sludge, nutrient removal, biosolids, lab analysis, and equipment operation.",
  "water-distribution": "Pipe materials, pressure zones, cross-connection control, water quality monitoring, hydrant maintenance, and system hydraulics.",
  "wastewater-collection": "Gravity sewers, force mains, lift stations, infiltration/inflow, CCTV inspection, cleaning equipment, and confined space safety.",
};
const LEVEL_DESCRIPTIONS: Record<string, string> = {
  class1: "Entry-level certification. Covers fundamental concepts, basic treatment processes, and introductory regulations.",
  class2: "Intermediate certification. Covers process control, equipment troubleshooting, and expanded regulatory knowledge.",
  class3: "Advanced certification. Covers complex process optimization, advanced math, and supervisory responsibilities.",
  class4: "Expert certification. Covers plant design principles, advanced treatment technologies, and management-level competencies.",
};

function getQuizRoute(level: string, stream: string): string {
  const levelNum = level.replace("class", "");
  const streamMap: Record<string, string> = {
    "water-treatment": "water",
    "wastewater-treatment": "ww",
    "water-distribution": "dist",
    "wastewater-collection": "coll",
  };
  return `/wpi-class${levelNum}-${streamMap[stream]}`;
}
function getMockRoute(level: string, stream: string): string {
  const levelNum = level.replace("class", "");
  const streamMap: Record<string, string> = {
    "water-treatment": "water",
    "wastewater-treatment": "ww",
    "water-distribution": "dist",
    "wastewater-collection": "coll",
  };
  return `/wpi-class${levelNum}-${streamMap[stream]}-mock`;
}
function getFlashcardRoute(level: string, stream: string): string {
  const levelNum = level.replace("class", "");
  const streamMap: Record<string, string> = {
    "water-treatment": "water",
    "wastewater-treatment": "ww",
    "water-distribution": "dist",
    "wastewater-collection": "coll",
  };
  return `/wpi-class${levelNum}-${streamMap[stream]}-flashcards`;
}

export default function USCourses() {
  usePageMeta({
    title: "US Water Operator Exam Courses | All 4 Streams & 4 Levels — Echelon Institute",
    description: "Browse all ABC/WPI water operator certification prep courses. Water treatment, wastewater treatment, distribution, and collection — Class I through Class IV.",
  });

  const [activeStream, setActiveStream] = useState<string | null>(null);
  const displayStreams = activeStream
    ? US_STREAMS.filter(s => s.key === activeStream)
    : US_STREAMS;

  return (
    <div style={{ background: "#0F172A", minHeight: "100vh", fontFamily: "system-ui, sans-serif", color: "#fff" }}>
      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(15,23,42,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/us">
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <img src={LOGO_URL} alt="Echelon" width={28} height={28} style={{ filter: "brightness(0) invert(1)", height: 28, width: 28 }} />
            <span style={{ fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: "Sora, sans-serif", letterSpacing: "-0.02em" }}>Echelon US</span>
          </div>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/us/states"><span style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", cursor: "pointer", fontWeight: 500 }}>All States</span></Link>
          <Link href="/pricing"><span style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", cursor: "pointer", fontWeight: 500 }}>Pricing</span></Link>
          <Link href="/us/courses">
            <button style={{ padding: "8px 18px", borderRadius: 8, background: "linear-gradient(135deg, #2563EB, #0E7490)", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Start Free →
            </button>
          </Link>
        </div>
      </nav>

      {/* Page header */}
      <section style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 60%, #0E7490 100%)", padding: "60px 24px 72px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 700, margin: "0 auto" }}>
          <div style={{ display: "inline-block", background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", padding: "6px 14px", borderRadius: 20, marginBottom: 20, border: "1px solid rgba(255,255,255,0.15)" }}>
            16 COURSES · 4 STREAMS · 4 CLASS LEVELS
          </div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, color: "#fff", margin: "0 0 16px", fontFamily: "Sora, sans-serif", letterSpacing: "-0.03em" }}>
            All US Operator Courses
          </h1>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.65)", margin: "0 0 32px", lineHeight: 1.6 }}>
            Practice quizzes, timed mock exams, and flashcards for every ABC/WPI certification stream and class level. First 15 questions free on every course.
          </p>
          {/* Stream filter */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
            <button
              onClick={() => setActiveStream(null)}
              style={{
                padding: "8px 18px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                background: activeStream === null ? "#fff" : "rgba(255,255,255,0.08)",
                color: activeStream === null ? "#0F172A" : "rgba(255,255,255,0.7)",
                border: activeStream === null ? "none" : "1px solid rgba(255,255,255,0.15)",
              }}
            >
              All Streams
            </button>
            {US_STREAMS.map(s => (
              <button
                key={s.key}
                onClick={() => setActiveStream(s.key)}
                style={{
                  padding: "8px 18px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                  background: activeStream === s.key ? "#fff" : "rgba(255,255,255,0.08)",
                  color: activeStream === s.key ? "#0F172A" : "rgba(255,255,255,0.7)",
                  border: activeStream === s.key ? "none" : "1px solid rgba(255,255,255,0.15)",
                }}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Course grid */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {displayStreams.map((stream, si) => (
            <FadeUp key={stream.key} delay={si * 0.06}>
              <div id={stream.key}>
                {/* Stream header */}
                <div style={{ background: STREAM_GRADIENTS[stream.key], borderRadius: 14, padding: "24px 28px", marginBottom: 16, border: `1px solid ${STREAM_BORDER[stream.key]}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <span style={{ fontSize: 24 }}>{stream.icon}</span>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "Sora, sans-serif" }}>{stream.label}</h2>
                  </div>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.6 }}>{STREAM_DESCRIPTIONS[stream.key]}</p>
                </div>
                {/* Level cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                  {US_LEVELS.map((level, idx) => (
                    <div
                      key={level.key}
                      style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${STREAM_BORDER[stream.key]}`, borderRadius: 12, padding: "20px", transition: "all 0.15s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.07)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: `${STREAM_ACCENT[stream.key]}18`, color: STREAM_ACCENT[stream.key], border: `1px solid ${STREAM_ACCENT[stream.key]}30` }}>
                          {level.label}
                        </span>
                        {idx === 0 && (
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "rgba(34,197,94,0.1)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.2)" }}>
                            Free Trial
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 6px", fontFamily: "Sora, sans-serif" }}>
                        {stream.label}
                      </h3>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 16px", lineHeight: 1.55 }}>
                        {LEVEL_DESCRIPTIONS[level.key]}
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <Link href={getQuizRoute(level.key, stream.key)}>
                          <button style={{ width: "100%", padding: "9px 0", borderRadius: 8, background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.18)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)"; }}>
                            Practice Quiz
                          </button>
                        </Link>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <Link href={getMockRoute(level.key, stream.key)}>
                            <button style={{ width: "100%", padding: "8px 0", borderRadius: 8, background: "transparent", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.12)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#fff"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.3)"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.55)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)"; }}>
                              Mock Exam
                            </button>
                          </Link>
                          <Link href={getFlashcardRoute(level.key, stream.key)}>
                            <button style={{ width: "100%", padding: "8px 0", borderRadius: 8, background: "transparent", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.12)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#fff"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.3)"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.55)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)"; }}>
                              Flashcards
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>
          ))}
        </div>

        {/* Bottom CTA */}
        <FadeUp delay={0.2}>
          <div style={{ marginTop: 64, textAlign: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18, padding: "48px 32px" }}>
            <h2 style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 800, color: "#fff", margin: "0 0 12px", fontFamily: "Sora, sans-serif", letterSpacing: "-0.02em" }}>
              Need All Streams?
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", margin: "0 0 28px", lineHeight: 1.6 }}>
              The All Access bundle gives you unlimited practice for all four streams and all four class levels.
            </p>
            <Link href="/pricing">
              <button className="btn-pulse" style={{ padding: "13px 32px", borderRadius: 10, background: "linear-gradient(135deg, #2563EB, #0E7490)", color: "#fff", border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 24px rgba(37,99,235,0.35)" }}>
                View Pricing →
              </button>
            </Link>
          </div>
        </FadeUp>
      </div>
    </div>
  );
}
