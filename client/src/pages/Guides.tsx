import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Bookmark,
  Brain,
  Building2,
  Clock3,
  Eye,
  Wrench,
} from "lucide-react";
import { Link } from "wouter";
import GuideIcon from "@/components/GuideIcon";
import LandingNav from "@/components/LandingNav";
import { useGuideOverview } from "@/hooks/useGuideProgress";
import { GUIDE_REGISTRY } from "@/lib/guideRegistry";
import { usePageMeta } from "@/hooks/usePageMeta";

const LEARNING_LOOP = [
  { label: "See it", detail: "Follow the system", icon: Eye },
  { label: "Understand it", detail: "Learn why it works", icon: BookOpen },
  { label: "Operate it", detail: "Read field conditions", icon: Wrench },
  { label: "Remember it", detail: "Lock in exam points", icon: Brain },
  { label: "Prove it", detail: "Practise the topic", icon: BadgeCheck },
];

export default function Guides() {
  usePageMeta({
    title: "Interactive Process Guides for Water Operators",
    description: "Explore interactive drinking water, wastewater, distribution, collection, pumping, instrumentation and chemical feed guides. Save progress and practise each topic for your operator exam.",
  });

  const progress = useGuideOverview();
  const completedTotal = GUIDE_REGISTRY.reduce(
    (sum, guide) => sum + (progress.guides[guide.id]?.completedStepIds?.length ?? 0),
    0,
  );
  const totalSteps = GUIDE_REGISTRY.reduce((sum, guide) => sum + guide.stepCount, 0);
  const bookmarksTotal = GUIDE_REGISTRY.reduce(
    (sum, guide) => sum + (progress.guides[guide.id]?.bookmarkedStepIds?.length ?? 0),
    0,
  );
  const startedGuides = GUIDE_REGISTRY.filter((guide) => progress.guides[guide.id]?.lastStepId).length;

  return (
    <div className="guides-page" style={{ minHeight: "100vh", background: "#F5F8FC", color: "#0B1F38", fontFamily: "'Sora', sans-serif" }}>
      <style>{`
        .guides-page * { box-sizing: border-box; }
        .guides-hero-grid {
          background-image:
            linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 36px 36px;
        }
        .guide-card { transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease; }
        .guide-card:hover { transform: translateY(-4px); box-shadow: 0 18px 42px rgba(15, 35, 65, .12) !important; }
        .guide-card__cta { transition: gap .16s ease; }
        .guide-card:hover .guide-card__cta { gap: 10px !important; }
        @media (max-width: 900px) {
          .guides-hero__inner { grid-template-columns: 1fr !important; }
          .guides-hero__stats { max-width: none !important; }
          .guides-loop { grid-template-columns: repeat(3, 1fr) !important; }
          .guides-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .guides-institution { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 620px) {
          .guides-hero { padding: 54px 18px 74px !important; }
          .guides-hero h1 { font-size: 38px !important; }
          .guides-section { padding-left: 16px !important; padding-right: 16px !important; }
          .guides-loop { grid-template-columns: 1fr !important; }
          .guides-loop__item { border-right: 0 !important; border-bottom: 1px solid #E2E8F0; }
          .guides-loop__item:last-child { border-bottom: 0; }
          .guides-grid { grid-template-columns: 1fr !important; }
          .guides-card-topics { display: none !important; }
        }
      `}</style>

      <LandingNav currentPath="/guides" />

      <header className="guides-hero guides-hero-grid" style={{ backgroundColor: "#071A33", padding: "78px 24px 96px", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 430, height: 430, borderRadius: "50%", background: "#0B63CE", filter: "blur(110px)", opacity: 0.25, top: -180, right: -60 }} />
        <div className="guides-hero__inner" style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(0, 1.45fr) minmax(310px, .55fr)", gap: 64, alignItems: "end", position: "relative" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 11px", borderRadius: 99, border: "1px solid rgba(255,255,255,.15)", background: "rgba(255,255,255,.06)", color: "#9CC5FF", fontSize: 10, fontWeight: 800, letterSpacing: ".12em", marginBottom: 24 }}>
              ECHELON PROCESS GUIDES
            </div>
            <h1 style={{ margin: 0, maxWidth: 760, fontSize: 58, lineHeight: 1.02, letterSpacing: "-.045em", fontWeight: 850 }}>
              Understand the system.<br />Practise the exam.
            </h1>
            <p style={{ maxWidth: 680, margin: "22px 0 0", color: "#B8C6D9", fontSize: 17, lineHeight: 1.72 }}>
              Interactive technical guides that connect process flow, equipment behaviour and operator decisions to the certification questions you need to master.
            </p>
          </div>

          <div className="guides-hero__stats" style={{ background: "rgba(255,255,255,.075)", border: "1px solid rgba(255,255,255,.13)", borderRadius: 18, padding: 20, backdropFilter: "blur(12px)", maxWidth: 380 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 11 }}>
              <span style={{ color: "#D6E2F2", fontSize: 12, fontWeight: 700 }}>Your guide progress</span>
              <span style={{ color: "#fff", fontSize: 19, fontWeight: 850 }}>{completedTotal}/{totalSteps}</span>
            </div>
            <div style={{ height: 7, borderRadius: 99, background: "rgba(255,255,255,.12)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.round((completedTotal / totalSteps) * 100)}%`, borderRadius: 99, background: "linear-gradient(90deg,#54A4FF,#56D6C2)" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 }}>
              <div style={{ padding: "12px 13px", borderRadius: 12, background: "rgba(255,255,255,.06)" }}>
                <div style={{ fontSize: 21, fontWeight: 850 }}>{startedGuides}</div>
                <div style={{ color: "#9FB0C5", fontSize: 10, marginTop: 2 }}>Guides started</div>
              </div>
              <div style={{ padding: "12px 13px", borderRadius: 12, background: "rgba(255,255,255,.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 21, fontWeight: 850 }}><Bookmark size={17} /> {bookmarksTotal}</div>
                <div style={{ color: "#9FB0C5", fontSize: 10, marginTop: 2 }}>Topics saved</div>
              </div>
            </div>
            <div style={{ marginTop: 13, color: "#8093AA", fontSize: 9, lineHeight: 1.5 }}>Progress is saved automatically on this device.</div>
          </div>
        </div>
      </header>

      <main>
        <section className="guides-section" style={{ maxWidth: 1180, margin: "-34px auto 0", padding: "0 24px", position: "relative" }}>
          <div className="guides-loop" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", background: "#fff", border: "1px solid #DCE5EF", borderRadius: 17, boxShadow: "0 15px 40px rgba(19,41,72,.09)", overflow: "hidden" }}>
            {LEARNING_LOOP.map(({ label, detail, icon: Icon }, index) => (
              <div key={label} className="guides-loop__item" style={{ padding: "18px 18px", display: "flex", alignItems: "center", gap: 12, borderRight: index < LEARNING_LOOP.length - 1 ? "1px solid #E2E8F0" : 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "#EAF3FF", color: "#0B63CE", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon size={17} /></div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 850, color: "#0F172A" }}>{label}</div>
                  <div style={{ fontSize: 9, color: "#7A8A9F", marginTop: 2 }}>{detail}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="guides-section" style={{ maxWidth: 1180, margin: "0 auto", padding: "76px 24px 40px" }}>
          <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 24, marginBottom: 28, flexWrap: "wrap" }}>
            <div>
              <div style={{ color: "#0B63CE", fontSize: 10, fontWeight: 850, letterSpacing: ".13em", marginBottom: 9 }}>CHOOSE A SYSTEM</div>
              <h2 style={{ margin: 0, color: "#0B1F38", fontSize: 31, lineHeight: 1.15, letterSpacing: "-.025em" }}>Learn the plant as one connected system.</h2>
            </div>
            <p style={{ margin: 0, maxWidth: 430, color: "#63758B", fontSize: 13, lineHeight: 1.65 }}>Select your jurisdiction and certification level inside any guide. Echelon sends you to the matching practice course and topic.</p>
          </div>

          <div className="guides-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 18 }}>
            {GUIDE_REGISTRY.map((guide, index) => {
              const record = progress.guides[guide.id];
              const completed = record?.completedStepIds?.length ?? 0;
              const percent = Math.round((completed / guide.stepCount) * 100);
              const started = Boolean(record?.lastStepId);
              const href = started ? `${guide.route}?resume=1` : guide.route;

              return (
                <article
                  key={guide.id}
                  className="guide-card"
                  style={{
                    background: "#fff",
                    border: "1px solid #DDE6F0",
                    borderRadius: 18,
                    overflow: "hidden",
                    boxShadow: "0 4px 15px rgba(20, 43, 75, .04)",
                    gridColumn: index === 0 || index === 1 ? "span 1" : undefined,
                  }}
                >
                  <div style={{ height: 5, background: guide.accent }} />
                  <div style={{ padding: "22px 22px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
                      <div style={{ width: 47, height: 47, borderRadius: 14, display: "grid", placeItems: "center", color: guide.accent, background: guide.softAccent }}>
                        <GuideIcon guideId={guide.id} size={24} strokeWidth={1.9} />
                      </div>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#718196", fontSize: 9, fontWeight: 700 }}><Clock3 size={12} /> {guide.estimatedMinutes} min</div>
                    </div>
                    <div style={{ color: guide.accent, fontSize: 9, fontWeight: 850, letterSpacing: ".11em", textTransform: "uppercase", marginTop: 17 }}>{guide.eyebrow}</div>
                    <h3 style={{ margin: "7px 0 8px", fontSize: 19, lineHeight: 1.2, letterSpacing: "-.015em", color: "#0B1F38" }}>{guide.title}</h3>
                    <p style={{ margin: 0, minHeight: 60, color: "#63758B", fontSize: 12, lineHeight: 1.65 }}>{guide.description}</p>

                    <div style={{ marginTop: 17, padding: "11px 12px", borderRadius: 11, background: "#F7F9FC", border: "1px solid #E8EDF3" }}>
                      <div style={{ color: "#8090A4", fontSize: 8, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" }}>Track through the system</div>
                      <div style={{ color: "#31445C", fontSize: 10, fontWeight: 750, marginTop: 4 }}>{guide.metric}</div>
                    </div>

                    <div className="guides-card-topics" style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 14 }}>
                      {guide.topics.map((topic) => <span key={topic} style={{ padding: "5px 7px", borderRadius: 7, background: guide.softAccent, color: guide.accent, fontSize: 8, fontWeight: 800 }}>{topic}</span>)}
                    </div>

                    {started && (
                      <div style={{ marginTop: 17 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", color: "#728297", fontSize: 9, fontWeight: 700, marginBottom: 5 }}>
                          <span>{completed} of {guide.stepCount} topics complete</span><span>{percent}%</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 99, background: "#E8EDF3", overflow: "hidden" }}><div style={{ height: "100%", width: `${percent}%`, background: guide.accent }} /></div>
                      </div>
                    )}

                    <Link href={href} className="guide-card__cta" style={{ marginTop: 20, display: "inline-flex", alignItems: "center", gap: 7, color: guide.accent, fontSize: 11, fontWeight: 850, textDecoration: "none" }}>
                      {started ? "Continue guide" : "Start guide"} <ArrowRight size={15} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="guides-section" style={{ maxWidth: 1180, margin: "0 auto", padding: "38px 24px 86px" }}>
          <div className="guides-institution" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 40, alignItems: "center", padding: "34px 38px", borderRadius: 20, background: "#E8F1FC", border: "1px solid #CFE0F3" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "#fff", display: "grid", placeItems: "center", color: "#0B63CE", boxShadow: "0 5px 16px rgba(11,99,206,.12)", flexShrink: 0 }}><Building2 size={24} /></div>
              <div>
                <div style={{ color: "#0B63CE", fontSize: 9, fontWeight: 850, letterSpacing: ".12em", marginBottom: 8 }}>FOR UTILITIES AND TRAINING TEAMS</div>
                <h2 style={{ margin: 0, fontSize: 24, lineHeight: 1.22, letterSpacing: "-.02em" }}>See where operators understand the process and where they need support.</h2>
                <p style={{ margin: "10px 0 0", color: "#5C7087", fontSize: 12, lineHeight: 1.65, maxWidth: 760 }}>Use the guides alongside Echelon’s practice analytics to help managers connect process topics with readiness patterns, not question counts alone.</p>
              </div>
            </div>
            <Link href="/teams" style={{ minHeight: 42, display: "inline-flex", alignItems: "center", gap: 8, padding: "0 16px", background: "#071A33", color: "#fff", borderRadius: 10, textDecoration: "none", fontSize: 11, fontWeight: 850, whiteSpace: "nowrap" }}>Explore Teams <ArrowRight size={15} /></Link>
          </div>
        </section>
      </main>

      <footer style={{ background: "#071A33", color: "#95A7BD", padding: "26px 24px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", justifyContent: "space-between", gap: 18, flexWrap: "wrap", fontSize: 10 }}>
          <span>Echelon Institute - built for water and wastewater operators.</span>
          <span>Educational guidance must be checked against current legislation and site procedures.</span>
        </div>
      </footer>
    </div>
  );
}
