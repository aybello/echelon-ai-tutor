// Echelon Institute — US States Directory v2
// Design: matches USLanding.tsx — dark bg, inline styles, consistent nav
import { useState } from "react";
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { FadeUp } from "@/components/animations";
import { US_STATE_CONFIGS, FEATURED_US_STATES, type USStateCode, type USStateConfig } from "@/lib/stateConfig";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_5c9ed3a7.webp";

const REGION_GROUPS: { label: string; emoji: string; states: USStateCode[] }[] = [
  { label: "Midwest", emoji: "🌾", states: ["IA", "MN", "WI", "MI", "IN", "OH", "MO", "ND", "SD", "NE", "KS"] },
  { label: "Northeast", emoji: "🏙️", states: ["ME", "NH", "VT", "MA", "RI", "CT", "NJ", "DE", "MD", "PA", "WV"] },
  { label: "South", emoji: "🌴", states: ["VA", "NC", "SC", "GA", "AL", "MS", "AR", "OK", "LA", "KY", "TN"] },
  { label: "West", emoji: "⛰️", states: ["WA", "OR", "ID", "MT", "WY", "CO", "UT", "NV", "AZ", "NM", "AK", "HI"] },
];

function StateCard({ state }: { state: USStateConfig }) {
  const coverageColor =
    state.coverage === "full"
      ? { border: "rgba(34,197,94,0.2)", bg: "rgba(34,197,94,0.05)", dot: "#22C55E", label: "Full Coverage" }
      : state.coverage === "partial"
      ? { border: "rgba(245,158,11,0.25)", bg: "rgba(245,158,11,0.05)", dot: "#F59E0B", label: "Partial Coverage" }
      : { border: "rgba(239,68,68,0.2)", bg: "rgba(239,68,68,0.05)", dot: "#EF4444", label: "Limited" };

  return (
    <Link href={`/us/states/${state.slug}`}>
      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: `1px solid rgba(255,255,255,0.1)`,
          borderRadius: 12,
          padding: "16px",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.background = "rgba(255,255,255,0.07)";
          el.style.borderColor = "rgba(96,165,250,0.35)";
          el.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.background = "rgba(255,255,255,0.04)";
          el.style.borderColor = "rgba(255,255,255,0.1)";
          el.style.transform = "translateY(0)";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#60A5FA", fontFamily: "Sora, sans-serif" }}>{state.code}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: coverageColor.dot }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: coverageColor.dot, display: "inline-block" }} />
            {coverageColor.label}
          </span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 4 }}>{state.name}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{state.certBodyAbbr}</div>
      </div>
    </Link>
  );
}

export default function USStates() {
  usePageMeta({
    title: "US Water Operator Certification by State | ABC/WPI Exam Prep — Echelon Institute",
    description: "Find water and wastewater operator certification exam prep for your state. Echelon covers all 45 states that use the ABC/WPI standardized exam system.",
  });

  const [search, setSearch] = useState("");
  const allStates: USStateConfig[] = Object.values(US_STATE_CONFIGS) as USStateConfig[];
  const searchResults = search.trim()
    ? allStates.filter(
        s =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.code.toLowerCase().includes(search.toLowerCase()) ||
          s.certBodyAbbr.toLowerCase().includes(search.toLowerCase())
      )
    : null;

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
          <Link href="/us/courses"><span style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", cursor: "pointer", fontWeight: 500 }}>All Courses</span></Link>
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
            45 STATES COVERED
          </div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, color: "#fff", margin: "0 0 16px", fontFamily: "Sora, sans-serif", letterSpacing: "-0.03em" }}>
            Find Your State
          </h1>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.65)", margin: "0 0 32px", lineHeight: 1.6 }}>
            Echelon covers all US states that use the ABC/WPI standardized exam. Select your state to see your certifying authority and start practicing.
          </p>
          {/* Search */}
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <input
              type="text"
              placeholder="Search by state name, abbreviation, or agency..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", padding: "13px 18px", borderRadius: 10, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", textAlign: "center" }}
            />
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
        {/* Search results */}
        {searchResults && (
          <div style={{ marginBottom: 48 }}>
            {searchResults.length === 0 ? (
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", padding: "48px 0" }}>
                No states found matching "{search}"
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                {searchResults.map(state => <StateCard key={state.code} state={state} />)}
              </div>
            )}
          </div>
        )}

        {/* Featured */}
        {!searchResults && (
          <>
            <FadeUp>
              <div style={{ marginBottom: 40 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", marginBottom: 14, textTransform: "uppercase" }}>Most Popular</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10 }}>
                  {FEATURED_US_STATES.map(code => {
                    const state = US_STATE_CONFIGS[code];
                    return (
                      <Link key={code} href={`/us/states/${state.slug}`}>
                        <div
                          style={{ background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.3)", borderRadius: 10, padding: "12px", textAlign: "center", cursor: "pointer", transition: "all 0.15s" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(37,99,235,0.2)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(37,99,235,0.12)"; }}
                        >
                          <div style={{ fontSize: 14, fontWeight: 800, color: "#60A5FA" }}>{state.code}</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>{state.name}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </FadeUp>

            {/* By region */}
            {REGION_GROUPS.map((region, ri) => (
              <FadeUp key={region.label} delay={ri * 0.05}>
                <div style={{ marginBottom: 40 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", marginBottom: 14, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{region.emoji}</span> {region.label}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                    {region.states
                      .filter(code => US_STATE_CONFIGS[code as USStateCode])
                      .map(code => <StateCard key={code} state={US_STATE_CONFIGS[code as USStateCode]} />)}
                  </div>
                </div>
              </FadeUp>
            ))}

            {/* States not covered */}
            <FadeUp>
              <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 14, padding: "24px 28px", marginTop: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#F59E0B", margin: "0 0 8px" }}>
                  California, Texas, Florida, and New York
                </h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, margin: 0 }}>
                  These four states use their own state-specific exam systems (SWRCB, TCEQ, FDEP, and NYSDOH respectively) rather than the ABC/WPI standardized exam. Echelon does not currently offer prep for these state-specific exams, but we are working on it.
                </p>
              </div>
            </FadeUp>
          </>
        )}
      </div>
    </div>
  );
}
