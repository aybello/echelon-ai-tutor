// Ontario OIT hub — landing page for /oit
// Client-rendered companion to the SSR body in server/pageSsr.ts (path "/oit").
// Google sees the SSR body; hydrated users get this interactive page with
// direct CTAs to the free previews, flashcards, and mock exams.
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import SiteNav from "@/components/SiteNav";

const CARD_BASE = {
  display: "block",
  padding: "18px 20px",
  borderRadius: 12,
  textDecoration: "none",
  border: "1px solid",
  transition: "transform 0.15s, box-shadow 0.15s",
} as const;

const STREAMS = [
  {
    stream: "Water OIT",
    tagline: "Water Treatment & Distribution fundamentals",
    accent: "#0369A1",
    bg: "#F0F9FF",
    border: "#BAE6FD",
    tryHref: "/quiz",
    mockHref: "/oit-mock",
    flashcardsHref: "/oit-water-flashcards",
  },
  {
    stream: "Wastewater OIT",
    tagline: "Wastewater Treatment & Collection fundamentals",
    accent: "#0F766E",
    bg: "#F0FDFA",
    border: "#99F6E4",
    tryHref: "/oit-ww",
    mockHref: "/oit-ww-mock",
    flashcardsHref: "/oit-ww-flashcards",
  },
];

export default function OitHub() {
  usePageMeta({
    title: "Ontario OIT Exam Prep — Free Practice | Echelon Institute",
    description:
      "Ontario Operator-in-Training (OIT) exam prep for water and wastewater. Start with 15 free questions, then unlock the full 12-month pass for CA$49.",
    path: "/oit",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      <SiteNav currentPath="/oit" />

      {/* Hero */}
      <section style={{ padding: "48px 24px 24px", maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: "#0F172A", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
          Ontario OIT Exam Prep
        </h1>
        <p style={{ fontSize: 18, color: "#475569", margin: "0 auto 20px", maxWidth: 640, lineHeight: 1.5 }}>
          Start with 15 free questions on either stream — no account, no credit card. Unlock the full 12-month pass for <strong>CA$49</strong>.
        </p>
      </section>

      {/* Stream picker */}
      <section style={{ padding: "0 24px 40px", maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          {STREAMS.map(s => (
            <div key={s.stream} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 16, padding: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: s.accent, margin: "0 0 6px" }}>{s.stream}</h2>
              <p style={{ fontSize: 14, color: "#475569", margin: "0 0 20px" }}>{s.tagline}</p>

              <Link
                href={s.tryHref}
                style={{
                  ...CARD_BASE,
                  background: s.accent,
                  color: "#FFFFFF",
                  borderColor: s.accent,
                  fontWeight: 700,
                  marginBottom: 10,
                  textAlign: "center",
                }}
              >
                Try 15 free questions — no signup
              </Link>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Link
                  href={s.flashcardsHref}
                  style={{
                    ...CARD_BASE,
                    padding: "10px 12px",
                    background: "#FFFFFF",
                    color: s.accent,
                    borderColor: s.border,
                    fontSize: 13,
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  Flashcards
                </Link>
                <Link
                  href={s.mockHref}
                  style={{
                    ...CARD_BASE,
                    padding: "10px 12px",
                    background: "#FFFFFF",
                    color: s.accent,
                    borderColor: s.border,
                    fontSize: 13,
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  Mock exam
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What's included */}
      <section style={{ padding: "16px 24px 40px", maxWidth: 960, margin: "0 auto" }}>
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 28 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 16px" }}>
            What's in the CA$49 Ontario OIT Exam Pass
          </h2>
          <ul style={{ margin: 0, padding: "0 0 0 20px", color: "#334155", fontSize: 15, lineHeight: 1.7 }}>
            <li>500+ adaptive practice questions organised by module and difficulty</li>
            <li>400+ concept flashcards with spaced repetition</li>
            <li>Timed 100-question mock exam that mirrors the real OWWCO test format</li>
            <li>AI Tutor for concept and calculation explanations, in plain language</li>
            <li>Interactive process guides, formula sheets and math practice</li>
            <li>12 months of access from the day you purchase</li>
          </ul>
          <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/pricing"
              style={{ ...CARD_BASE, background: "#0F172A", color: "#FFFFFF", borderColor: "#0F172A", fontWeight: 700 }}
            >
              See all pricing
            </Link>
            <Link
              href="/canada/ontario"
              style={{ ...CARD_BASE, background: "#FFFFFF", color: "#0F172A", borderColor: "#CBD5E1", fontWeight: 700 }}
            >
              See every Ontario course
            </Link>
          </div>
        </div>
      </section>

      {/* Independence disclosure */}
      <section style={{ padding: "0 24px 48px", maxWidth: 960, margin: "0 auto" }}>
        <p style={{ fontSize: 13, color: "#64748B", margin: 0, lineHeight: 1.6 }}>
          Eligibility, registration, permitted references and exam requirements are set by OWWCO. Confirm the current rules on the{" "}
          <a href="https://owwco.ca" target="_blank" rel="noopener noreferrer" style={{ color: "#0369A1" }}>
            OWWCO website
          </a>{" "}
          before you register. Echelon Institute is independent and is not affiliated with or endorsed by OWWCO, MOECP, EOCP, WPI or any provincial certifying authority.
        </p>
      </section>
    </div>
  );
}
