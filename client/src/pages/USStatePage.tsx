// Echelon Institute — US State Page v2
// Design: matches USLanding / USStates / USCourses — inline styles, dark bg
import { Link, useParams } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { FadeUp } from "@/components/animations";
import { getStateBySlug, US_STREAMS, US_LEVELS } from "@/lib/stateConfig";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_5c9ed3a7.webp";

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

function getQuizRoute(level: string, stream: string): string {
  const levelNum = level.replace("class", "");
  return `/wpi-class${levelNum}-${stream}`;
}
function getMockRoute(level: string, stream: string): string {
  const levelNum = level.replace("class", "");
  return `/wpi-class${levelNum}-${stream}-mock`;
}

function USNav() {
  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(15,23,42,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <Link href="/us/states">
        <span style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", cursor: "pointer", fontWeight: 500 }}>← All States</span>
      </Link>
      <Link href="/us">
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <img src={LOGO_URL} alt="Echelon" width={26} height={26} style={{ filter: "brightness(0) invert(1)", height: 26, width: 26 }} />
          <span style={{ fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: "Sora, sans-serif", letterSpacing: "-0.02em" }}>Echelon US</span>
        </div>
      </Link>
      <Link href="/pricing">
        <button style={{ padding: "8px 18px", borderRadius: 8, background: "linear-gradient(135deg, #2563EB, #0E7490)", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Pricing
        </button>
      </Link>
    </nav>
  );
}

export default function USStatePage() {
  const params = useParams<{ slug: string }>();
  const state = getStateBySlug(params.slug ?? "");

  usePageMeta({
    title: state
      ? `${state.name} Water Operator Exam Prep | ABC/WPI Certification — Echelon Institute`
      : "State Not Found — Echelon Institute",
    description: state
      ? `Prepare for your ${state.name} ${state.certBodyAbbr} water or wastewater operator certification exam. AI-powered practice aligned to the 2025 WPI Need-to-Know Criteria.`
      : "State not found.",
  });

  if (!state) {
    return (
      <div style={{ background: "#0F172A", minHeight: "100vh", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>State Not Found</h1>
          <Link href="/us/states">
            <button style={{ padding: "10px 24px", borderRadius: 8, background: "#2563EB", color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              View All States →
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Limited coverage ────────────────────────────────────────────────────────
  if (state.coverage === "limited") {
    return (
      <div style={{ background: "#0F172A", minHeight: "100vh", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
        <USNav />
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <FadeUp>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 24 }}>
              <span style={{ background: "rgba(37,99,235,0.15)", color: "#60A5FA", border: "1px solid rgba(37,99,235,0.3)", borderRadius: 20, padding: "5px 14px", fontSize: 13, fontWeight: 700 }}>🇺🇸 {state.code}</span>
              <span style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 20, padding: "5px 14px", fontSize: 13, fontWeight: 700 }}>Coming Soon</span>
            </div>
            <h1 style={{ fontSize: "clamp(26px, 5vw, 42px)", fontWeight: 800, color: "#fff", margin: "0 0 16px", fontFamily: "Sora, sans-serif", letterSpacing: "-0.03em" }}>
              {state.name} Exam Prep — Coming Soon
            </h1>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.6)", lineHeight: 1.65, margin: "0 0 32px", maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
              {state.name} uses a state-administered exam through {state.certBodyAbbr} that is independent of the ABC/WPI standardized framework. We are building a dedicated {state.name} question bank and expect to launch in late 2025.
            </p>
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "20px 24px", display: "inline-block", textAlign: "left", marginBottom: 32 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 6 }}>Certifying Authority</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{state.certBody}</div>
              <a href={state.certBodyUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#60A5FA", fontSize: 13, textDecoration: "none" }}>Official certification page →</a>
            </div>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>Be the first to know when {state.name} exam prep launches.</p>
              <a
                href={`mailto:abello@echeloninstitute.ca?subject=Waitlist: ${encodeURIComponent(state.name)} Exam Prep&body=I'm interested in exam prep for ${encodeURIComponent(state.name)}. Please add me to the waitlist.`}
                style={{ display: "inline-block", padding: "12px 28px", borderRadius: 10, background: "linear-gradient(135deg, #2563EB, #0E7490)", color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none", boxShadow: "0 4px 20px rgba(37,99,235,0.3)" }}
              >
                Join the Waitlist →
              </a>
            </div>
            <div style={{ marginTop: 48, background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 16, padding: "32px 28px" }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 0 10px", fontFamily: "Sora, sans-serif" }}>Practice with WPI Content in the Meantime</h2>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, margin: "0 0 20px" }}>
                While we build the {state.name}-specific bank, our WPI Class I–IV question banks cover the same core water and wastewater science.
              </p>
              <Link href="/us/courses">
                <button style={{ padding: "10px 24px", borderRadius: 8, background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  Browse WPI Courses →
                </button>
              </Link>
            </div>
            <p style={{ marginTop: 32, fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Not affiliated with {state.certBodyAbbr}</p>
          </FadeUp>
        </div>
      </div>
    );
  }

  // ── Partial + Full coverage ─────────────────────────────────────────────────
  const isPartial = state.coverage === "partial";

  return (
    <div style={{ background: "#0F172A", minHeight: "100vh", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      <USNav />

      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 60%, #0E7490 100%)", padding: "52px 24px 64px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
            <span style={{ background: "rgba(37,99,235,0.2)", color: "#60A5FA", border: "1px solid rgba(37,99,235,0.35)", borderRadius: 20, padding: "5px 14px", fontSize: 13, fontWeight: 700 }}>🇺🇸 {state.code}</span>
            {isPartial ? (
              <span style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 20, padding: "5px 14px", fontSize: 13, fontWeight: 700 }}>~85% WPI Coverage</span>
            ) : (
              <span style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20, padding: "5px 14px", fontSize: 13, fontWeight: 700 }}>ABC/WPI Exam</span>
            )}
          </div>
          <h1 style={{ fontSize: "clamp(26px, 5vw, 44px)", fontWeight: 800, color: "#fff", margin: "0 0 14px", fontFamily: "Sora, sans-serif", letterSpacing: "-0.03em" }}>
            {state.name} Water Operator Exam Prep
          </h1>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.65)", lineHeight: 1.65, margin: "0 0 24px", maxWidth: 640 }}>
            {state.examNote} Echelon Institute provides AI-powered practice questions, timed mock exams, and flashcards aligned to the 2025 WPI Need-to-Know Criteria.
          </p>
          {isPartial && (
            <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.22)", borderRadius: 12, padding: "16px 20px", marginBottom: 24, maxWidth: 640 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ fontSize: 16, marginTop: 1 }}>⚠️</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B", marginBottom: 4 }}>Partial Coverage Note</div>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: 0 }}>
                    {state.name} administers its own state exam through {state.certBodyAbbr}, but the exam content is based on the ABC/WPI Need-to-Know Criteria. Our WPI question banks cover approximately 85% of what you will see on the {state.certBodyAbbr} exam. State-specific regulations may not be covered.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "16px 20px", display: "inline-block" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 4 }}>Certifying Authority</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{state.certBody}</div>
            <a href={state.certBodyUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#60A5FA", fontSize: 13, textDecoration: "none" }}>Official certification page →</a>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
        {/* Course grid */}
        <FadeUp>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 6px", fontFamily: "Sora, sans-serif" }}>Available Courses</h2>
          {isPartial && (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 20px" }}>WPI-aligned content · ~85% coverage for {state.certBodyAbbr} exam</p>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 48, marginTop: isPartial ? 0 : 20 }}>
            {US_STREAMS.map(stream => (
              <div key={stream.key} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${STREAM_BORDER[stream.key]}`, borderRadius: 14, overflow: "hidden" }}>
                <div style={{ background: STREAM_GRADIENTS[stream.key], padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{stream.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{stream.label}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>4 class levels · 100 questions each</div>
                  </div>
                </div>
                <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {US_LEVELS.map(level => (
                    <div key={level.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: `${STREAM_ACCENT[stream.key]}18`, color: STREAM_ACCENT[stream.key], border: `1px solid ${STREAM_ACCENT[stream.key]}30` }}>
                          {level.label}
                        </span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{level.description}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Link href={getQuizRoute(level.key, stream.key)}>
                          <button style={{ padding: "4px 10px", borderRadius: 6, background: "transparent", color: "rgba(255,255,255,0.6)", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)"; }}>
                            Practice
                          </button>
                        </Link>
                        <Link href={getMockRoute(level.key, stream.key)}>
                          <button style={{ padding: "4px 10px", borderRadius: 6, background: "transparent", color: "rgba(255,255,255,0.6)", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)"; }}>
                            Mock Exam
                          </button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </FadeUp>

        {/* Exam info */}
        <FadeUp delay={0.05}>
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "28px 32px", marginBottom: 48 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 0 20px", fontFamily: "Sora, sans-serif" }}>About the {state.certBodyAbbr} Exam</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24 }}>
              {[
                { label: "Exam Format", value: "100 multiple-choice questions", sub: "Dual US/metric units on all calculation questions" },
                { label: "Passing Score", value: "70% (70 of 100 questions)", sub: "Up to 10 unscored pre-test questions may be included" },
                { label: "Exam Provider", value: isPartial ? state.certBodyAbbr : "ABC / Water Professionals International (WPI)", sub: isPartial ? `${state.name} state-administered exam based on WPI criteria` : "Computer-based testing at Pearson VUE centers" },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 4 }}>{item.value}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>

        {/* CTA */}
        <FadeUp delay={0.1}>
          <div style={{ textAlign: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18, padding: "48px 32px" }}>
            <h2 style={{ fontSize: "clamp(20px, 4vw, 30px)", fontWeight: 800, color: "#fff", margin: "0 0 10px", fontFamily: "Sora, sans-serif", letterSpacing: "-0.02em" }}>Ready to Start Preparing?</h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", margin: "0 0 28px", lineHeight: 1.6 }}>Free practice questions included. No account required to begin.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
              <Link href="/wpi-class1-water">
                <button className="btn-pulse" style={{ padding: "12px 28px", borderRadius: 10, background: "linear-gradient(135deg, #2563EB, #0E7490)", color: "#fff", border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(37,99,235,0.3)" }}>
                  Start Free Practice →
                </button>
              </Link>
              <Link href="/pricing">
                <button style={{ padding: "12px 28px", borderRadius: 10, background: "transparent", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.2)", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  View Pricing
                </button>
              </Link>
            </div>
            <p style={{ marginTop: 20, fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Not affiliated with {state.certBodyAbbr}, ABC, or WPI</p>
          </div>
        </FadeUp>
      </div>
    </div>
  );
}
