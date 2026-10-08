// Echelon Institute — US Landing Page v2
// Design: matches main Landing.tsx — dark hero, grid pattern, animated stats, inline styles
import { Link } from "wouter";
import { useState } from "react";
import { motion } from "framer-motion";
import { usePageMeta } from "@/hooks/usePageMeta";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/animations";
import { US_STATE_NAMES } from "../../../shared/usStateNames";
import React from "react";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_5c9ed3a7.webp";

function ScopeStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <span style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em", fontFamily: "Sora, sans-serif", display: "block" }}>
        {value}
      </span>
      <div style={{ fontSize: 13, color: "#64748B", fontWeight: 500, marginTop: 2 }}>{label}</div>
    </div>
  );
}

const STREAMS = [
  { key: "water", label: "Water Treatment", icon: "💧", desc: "Coagulation, filtration, disinfection, chemical feed, source water quality.", gradient: "linear-gradient(135deg, #0369A1, #0E7490)", href: "/us/courses" },
  { key: "ww", label: "Wastewater Treatment", icon: "🔄", desc: "Activated sludge, nutrient removal, biosolids, lab analysis, equipment operation.", gradient: "linear-gradient(135deg, #0F766E, #059669)", href: "/us/courses" },
  { key: "dist", label: "Water Distribution", icon: "🚰", desc: "Pipe materials, pressure zones, cross-connection control, system hydraulics.", gradient: "linear-gradient(135deg, #1D4ED8, #0369A1)", href: "/us/courses" },
  { key: "coll", label: "Wastewater Collection", icon: "🏗️", desc: "Gravity sewers, lift stations, infiltration/inflow, confined space safety.", gradient: "linear-gradient(135deg, #6D28D9, #4F46E5)", href: "/us/courses" },
];

const FEATURES = [
  { icon: "🎯", title: "Topic-Based Practice", body: "Work through practice questions and explanations by topic in your selected course." },
  { icon: "🤖", title: "AI Tutor Study Support", body: "Ask the AI Tutor to explain concepts and work through calculations in your selected course. Available with an active course pass." },
  { icon: "📋", title: "Timed Mock Exams", body: "Practise pacing and review missed topics with timed mock exams. Confirm your state's exam format with the certifying authority." },
  { icon: "🃏", title: "Flashcard Review Mode", body: "Reinforce key concepts with topic-organized flashcards covering treatment processes, equipment O&M, lab analysis, and safety procedures." },
  { icon: "📐", title: "Formula Reference Sheets", body: "Review flow calculations, chemical dosing, and hydraulics. Check your authority's rules for references permitted during the exam." },
  { icon: "📊", title: "Progress Dashboard", body: "Review practice results and topic accuracy to plan your next study session. Practice scores are not a guarantee of an exam result." },
];

export default function USLanding() {
  usePageMeta({
    title: "US Water Operator Exam Prep | Echelon Institute",
    description: "Dedicated US Class I water treatment and water distribution courses in US customary units, plus shared WPI preparation across four streams at Class I to IV.",
  });

  const [stateSearch, setStateSearch] = useState("");
  const searchTrimmed = stateSearch.trim().toLowerCase();
  const searchResults = searchTrimmed
    ? US_STATE_NAMES.filter(s =>
        s.name.toLowerCase().includes(searchTrimmed) ||
        s.code.toLowerCase().includes(searchTrimmed)
      )
    : null;
  const featuredStates = US_STATE_NAMES.slice(0, 15);

  return (
    <div style={{ background: "#0F172A", minHeight: "100vh", fontFamily: "'Sora', sans-serif", color: "#fff" }}>
      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(15,23,42,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "10px 24px", minHeight: 56, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <Link href="/us">
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <img src={LOGO_URL} alt="Echelon" width={28} height={28} style={{ filter: "brightness(0) invert(1)", height: 28, width: 28 }} />
            <span style={{ fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: "Sora, sans-serif", letterSpacing: "-0.02em" }}>Echelon US</span>
          </div>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Link href="/us/courses"><span style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", cursor: "pointer", fontWeight: 500 }}>Courses</span></Link>
          <Link href="/pricing?country=US"><span style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", cursor: "pointer", fontWeight: 500 }}>Pricing</span></Link>
          <Link href="/us/states" style={{ padding: "8px 18px", borderRadius: 8, background: "linear-gradient(135deg, #2563EB, #0E7490)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textDecoration: "none" }}>
            Find Your State →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0E7490 100%)", padding: "80px 24px 100px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 800, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }} style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <img src={LOGO_URL} alt="Echelon Institute" width={96} height={96} style={{ height: 96, width: 96, filter: "brightness(0) invert(1)" }} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut", delay: 0.25 }} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "6px 16px", marginBottom: 24, border: "1px solid rgba(255,255,255,0.15)" }}>
            <span style={{ fontSize: 12 }}>🇺🇸</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>Study Support for US Operators</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }} style={{ fontSize: "clamp(28px, 5vw, 56px)", fontWeight: 800, color: "#FFFFFF", lineHeight: 1.15, letterSpacing: "-0.03em", margin: "0 0 20px 0", fontFamily: "Sora, sans-serif" }}>
            Prepare for Your{" "}
            <span style={{ background: "linear-gradient(90deg, #38BDF8, #34D399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Operator Exam</span>
            <br />Start With Your State
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: "easeOut", delay: 0.55 }} style={{ fontSize: "clamp(14px, 2vw, 18px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.7, maxWidth: 600, margin: "0 auto 36px" }}>
            Dedicated US Class I courses for water treatment and water distribution, plus shared WPI preparation across four streams at Class I to IV. Check your state's exam and course scope before you choose.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut", delay: 0.7 }} style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/us/states" className="btn-pulse" style={{ padding: "14px 32px", borderRadius: 12, background: "linear-gradient(135deg, #2563EB, #0E7490)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 24px rgba(37,99,235,0.4)", textDecoration: "none" }}>
              Find Your State →
            </Link>
            <Link href="/us/courses" style={{ padding: "14px 32px", borderRadius: 12, background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textDecoration: "none" }}>
              Browse All Courses
            </Link>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.9 }} style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 12 }}>
            Review each course's free preview and access details before purchasing.
          </motion.p>
        </div>
      </section>

      {/* Stats Bar */}
      <section style={{ background: "#F1F5F9", borderBottom: "1px solid #E2E8F0", padding: "20px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 24, textAlign: "center" }}>
          <StaggerContainer style={{ display: "contents" } as React.CSSProperties}>
            <StaggerItem><ScopeStat value="4 Streams" label="Treatment, Distribution, Collection" /></StaggerItem>
            <StaggerItem><ScopeStat value="Class I-IV" label="WPI course levels" /></StaggerItem>
            <StaggerItem><ScopeStat value="398 Questions" label="Dedicated US Class I, written in US units" /></StaggerItem>
            <StaggerItem><ScopeStat value="State Rules" label="Confirm your exam and course scope" /></StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Streams */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <FadeUp>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ display: "inline-block", background: "#DBEAFE", color: "#1D4ED8", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", padding: "6px 14px", borderRadius: 20, marginBottom: 16 }}>FOUR WATER AND WASTEWATER STREAMS</div>
              <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "#fff", margin: "0 0 12px", fontFamily: "Sora, sans-serif", letterSpacing: "-0.02em" }}>
                Explore courses by stream,<br />then check the match for your state and exam level.
              </h2>
            </div>
          </FadeUp>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {STREAMS.map((stream, i) => (
              <FadeUp key={stream.key} delay={i * 0.08}>
                <Link href={stream.href}>
                  <div
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "28px 24px", cursor: "pointer", transition: "all 0.2s ease" }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = "rgba(255,255,255,0.07)"; el.style.borderColor = "rgba(255,255,255,0.2)"; el.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = "rgba(255,255,255,0.04)"; el.style.borderColor = "rgba(255,255,255,0.1)"; el.style.transform = "translateY(0)"; }}
                  >
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: stream.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>{stream.icon}</div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#fff", margin: "0 0 8px", fontFamily: "Sora, sans-serif" }}>{stream.label}</h3>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: "0 0 16px" }}>{stream.desc}</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                      {["Class I", "Class II", "Class III", "Class IV"].map(cls => (
                        <span key={cls} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}>{cls}</span>
                      ))}
                    </div>
                    <div style={{ fontSize: 13, color: "#38BDF8", fontWeight: 600 }}>View Courses →</div>
                  </div>
                </Link>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Find Your State */}
      <section style={{ background: "#0B1120", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <FadeUp>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ display: "inline-block", background: "rgba(29,78,216,0.15)", color: "#60A5FA", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", padding: "6px 14px", borderRadius: 20, marginBottom: 16, border: "1px solid rgba(96,165,250,0.2)" }}>FIND YOUR STATE</div>
              <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "#fff", margin: "0 0 12px", fontFamily: "Sora, sans-serif", letterSpacing: "-0.02em" }}>
                Start with your state's requirements
              </h2>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, margin: "0 auto", maxWidth: 700 }}>Exam providers, classifications, and requirements can differ by stream and level. Our courses teach standardized exam content, not any single state's own regulations. Your certifying authority controls eligibility, exam content, permitted references, and certification.</p>
            </div>
          </FadeUp>
          <div style={{ maxWidth: 480, margin: "0 auto 32px" }}>
            <input type="text" aria-label="Search states by name or abbreviation" placeholder="Search by state name or abbreviation..." value={stateSearch} onChange={e => setStateSearch(e.target.value)}
              style={{ width: "100%", padding: "12px 18px", borderRadius: 10, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </div>
          {searchResults ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
              {searchResults.length === 0 ? (
                <div style={{ gridColumn: "1/-1", textAlign: "center", color: "rgba(255,255,255,0.4)", padding: "32px 0" }}>No states found matching "{stateSearch}"</div>
              ) : searchResults.map(state => (
                <Link key={state.code} href={`/us/states/${state.slug}`}>
                  <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px", textAlign: "center", cursor: "pointer", transition: "border-color 0.15s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(96,165,250,0.4)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.1)"; }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#60A5FA" }}>{state.code}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{state.name}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10, marginBottom: 24 }}>
                {featuredStates.map(state => (
                  <Link key={state.code} href={`/us/states/${state.slug}`}>
                    <div style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)", borderRadius: 10, padding: "12px", textAlign: "center", cursor: "pointer", transition: "background 0.15s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(37,99,235,0.18)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(37,99,235,0.1)"; }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#60A5FA" }}>{state.code}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{state.name}</div>
                    </div>
                  </Link>
                ))}
              </div>
              <div style={{ textAlign: "center" }}>
                <Link href="/us/states" style={{ display: "inline-block", padding: "10px 24px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textDecoration: "none" }}>
                  Browse all states →
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <FadeUp>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ display: "inline-block", background: "#DBEAFE", color: "#1D4ED8", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", padding: "6px 14px", borderRadius: 20, marginBottom: 16 }}>TOOLS FOR YOUR STUDY PLAN</div>
              <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "#fff", margin: "0 0 12px", fontFamily: "Sora, sans-serif", letterSpacing: "-0.02em" }}>
                Practise, review, and build understanding<br />with tools in your selected course.
              </h2>
            </div>
          </FadeUp>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            {FEATURES.map((f, i) => (
              <FadeUp key={f.title} delay={i * 0.07}>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "28px 24px" }}>
                  <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 8px", fontFamily: "Sora, sans-serif" }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, margin: 0 }}>{f.body}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "96px 24px", background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0E7490 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <FadeUp>
            <h2 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, color: "#fff", margin: "0 0 20px", fontFamily: "Sora, sans-serif", letterSpacing: "-0.03em" }}>
              Choose Your{" "}
              <span style={{ background: "linear-gradient(90deg, #38BDF8, #34D399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Study Path</span>
            </h2>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.65)", margin: "0 0 40px", lineHeight: 1.6 }}>Check your state's requirements first, then review the course catalogue and each course's free preview.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/us/states" className="btn-pulse" style={{ padding: "14px 36px", borderRadius: 12, background: "linear-gradient(135deg, #2563EB, #0E7490)", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 24px rgba(37,99,235,0.4)", textDecoration: "none" }}>
                Find Your State →
              </Link>
              <Link href="/us/courses" style={{ padding: "14px 36px", borderRadius: 12, background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textDecoration: "none" }}>
                Browse All Courses
              </Link>
            </div>
            <p style={{ marginTop: 20, fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>Individual Exam Passes provide 12 months of access to one selected course from successful payment. Prices are in Canadian dollars (CAD). <Link href="/pricing?country=US" style={{ color: "#60A5FA" }}>Review pricing and access details</Link>.</p>
          </FadeUp>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "32px 24px", background: "#0A0F1E" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
            © {new Date().getFullYear()} Echelon Institute. Independent preparation. Not affiliated with or endorsed by ABC, WPI, or any state certifying authority.
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[{ label: "Canada", href: "/" }, { label: "Pricing", href: "/pricing?country=US" }, { label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }].map(link => (
              <Link key={link.label} href={link.href}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", cursor: "pointer" }}>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
