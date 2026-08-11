import { ArrowRight, Bookmark, Check, LayoutGrid } from "lucide-react";
import { Link } from "wouter";
import GuideIcon from "@/components/GuideIcon";
import {
  GUIDE_BY_ID,
  GUIDE_REGISTRY,
  getPracticeHref,
  type GuideId,
  type GuideJurisdiction,
  type GuideLevel,
} from "@/lib/guideRegistry";
import { useGuideProgress } from "@/hooks/useGuideProgress";

interface GuideNavProps {
  guideId: GuideId;
  currentStepId: string;
  currentStepLabel: string;
  totalSteps: number;
}

const LEVELS: Array<{ value: GuideLevel; label: string }> = [
  { value: "oit", label: "OIT" },
  { value: "1", label: "Class 1" },
  { value: "2", label: "Class 2" },
  { value: "3", label: "Class 3" },
  { value: "4", label: "Class 4" },
];

export default function GuideNav({ guideId, currentStepId, currentStepLabel, totalSteps }: GuideNavProps) {
  const guide = GUIDE_BY_ID[guideId];
  const progress = useGuideProgress(guideId, totalSteps, currentStepId);
  const practiceHref = getPracticeHref(
    guideId,
    currentStepId,
    progress.preferences.jurisdiction,
    progress.preferences.level,
  );

  const handleJurisdiction = (value: GuideJurisdiction) => progress.setJurisdiction(value);
  const visibleLevels = progress.preferences.jurisdiction === "wpi"
    ? LEVELS.filter((level) => level.value !== "oit")
    : LEVELS;

  return (
    <section className="guide-nav" aria-label="Process Guides navigation">
      <style>{`
        .guide-nav { position: relative; z-index: 30; font-family: 'Sora', sans-serif; }
        .guide-nav__rail { scrollbar-width: none; }
        .guide-nav__rail::-webkit-scrollbar { display: none; }
        .guide-nav__selector { appearance: none; }
        @media (max-width: 760px) {
          .guide-nav__top { padding: 12px 14px !important; align-items: flex-start !important; }
          .guide-nav__hub-label span { display: none; }
          .guide-nav__rail { width: 100%; order: 3; }
          .guide-nav__toolbar { padding: 12px 14px !important; }
          .guide-nav__progress { width: 100% !important; min-width: 0 !important; }
          .guide-nav__actions { width: 100%; }
          .guide-nav__actions a { flex: 1; justify-content: center; }
          .guide-nav__selectors { width: 100%; }
          .guide-nav__selector { flex: 1; }
        }
      `}</style>

      <div
        className="guide-nav__top"
        style={{
          background: "#071A33",
          color: "#fff",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Link href="/guides" className="guide-nav__hub-label" style={{ textDecoration: "none", color: "#fff" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
            <LayoutGrid size={15} /> PROCESS GUIDES
          </span>
        </Link>

        <div
          className="guide-nav__rail"
          style={{ display: "flex", gap: 5, overflowX: "auto", flex: 1, padding: "1px 0" }}
        >
          {GUIDE_REGISTRY.map((item) => {
            const active = item.id === guideId;
            return (
              <Link
                key={item.id}
                href={item.route}
                aria-current={active ? "page" : undefined}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 10px",
                  borderRadius: 8,
                  color: active ? "#071A33" : "rgba(255,255,255,0.68)",
                  background: active ? "#fff" : "transparent",
                  border: active ? "1px solid #fff" : "1px solid rgba(255,255,255,0.08)",
                  textDecoration: "none",
                  fontSize: 10,
                  fontWeight: active ? 800 : 600,
                  whiteSpace: "nowrap",
                }}
              >
                <GuideIcon guideId={item.id} size={13} strokeWidth={2.2} />
                {item.shortTitle}
              </Link>
            );
          })}
        </div>
      </div>

      <div
        className="guide-nav__toolbar"
        style={{
          background: "#fff",
          borderBottom: "1px solid #DDE5EF",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          boxShadow: "0 3px 12px rgba(15, 23, 42, 0.04)",
        }}
      >
        <div className="guide-nav__progress" style={{ minWidth: 190, flex: "1 1 230px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
            <span style={{ color: "#0F172A", fontSize: 11, fontWeight: 800 }}>{currentStepLabel}</span>
            <span style={{ color: "#64748B", fontSize: 10, fontWeight: 700 }}>
              {progress.record.completedStepIds.length}/{totalSteps} complete
            </span>
          </div>
          <div style={{ height: 5, borderRadius: 99, background: "#E8EEF5", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress.progressPercent}%`, background: guide.accent, transition: "width 0.2s ease" }} />
          </div>
        </div>

        <div className="guide-nav__selectors" style={{ display: "flex", gap: 6 }}>
          <select
            className="guide-nav__selector"
            aria-label="Exam jurisdiction"
            value={progress.preferences.jurisdiction}
            onChange={(event) => handleJurisdiction(event.target.value as GuideJurisdiction)}
            style={{ border: "1px solid #D5DEE9", borderRadius: 8, padding: "8px 28px 8px 10px", background: "#F8FAFC", color: "#334155", fontSize: 10, fontWeight: 700 }}
          >
            <option value="ontario">Ontario</option>
            <option value="wpi">WPI / ABC</option>
          </select>
          <select
            className="guide-nav__selector"
            aria-label="Certification level"
            value={progress.preferences.jurisdiction === "wpi" && progress.preferences.level === "oit" ? "1" : progress.preferences.level}
            onChange={(event) => progress.setLevel(event.target.value as GuideLevel)}
            style={{ border: "1px solid #D5DEE9", borderRadius: 8, padding: "8px 28px 8px 10px", background: "#F8FAFC", color: "#334155", fontSize: 10, fontWeight: 700 }}
          >
            {visibleLevels.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
          </select>
        </div>

        <div className="guide-nav__actions" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => progress.toggleBookmark(currentStepId)}
            aria-pressed={progress.isCurrentBookmarked}
            style={{
              width: 36,
              height: 36,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 9,
              border: `1px solid ${progress.isCurrentBookmarked ? guide.accent : "#D5DEE9"}`,
              background: progress.isCurrentBookmarked ? guide.softAccent : "#fff",
              color: progress.isCurrentBookmarked ? guide.accent : "#64748B",
              cursor: "pointer",
            }}
            title={progress.isCurrentBookmarked ? "Remove bookmark" : "Bookmark this topic"}
          >
            <Bookmark size={16} fill={progress.isCurrentBookmarked ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            onClick={() => progress.toggleComplete(currentStepId)}
            aria-pressed={progress.isCurrentComplete}
            style={{
              minHeight: 36,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 9,
              border: `1px solid ${progress.isCurrentComplete ? guide.accent : "#D5DEE9"}`,
              background: progress.isCurrentComplete ? guide.softAccent : "#fff",
              color: progress.isCurrentComplete ? guide.accent : "#475569",
              padding: "0 11px",
              fontSize: 10,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            <Check size={15} /> {progress.isCurrentComplete ? "Completed" : "Mark complete"}
          </button>
          <a
            href={practiceHref}
            style={{
              minHeight: 36,
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              borderRadius: 9,
              background: guide.accent,
              color: "#fff",
              padding: "0 13px",
              fontSize: 10,
              fontWeight: 800,
              textDecoration: "none",
              boxShadow: `0 5px 14px ${guide.accent}2A`,
            }}
          >
            Practise this topic <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </section>
  );
}
