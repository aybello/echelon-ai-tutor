import ModuleOverviewPanel from "@/components/ModuleOverview";
import type { ModuleOverview } from "@/lib/questionTypes";
import { availableStudyNote, resolveStudyNotesTopics } from "@/lib/studyNotesTopics";
import React, { type ReactNode } from "react";

type Props = {
  courseKey?: string;
  practiceModule: string | null;
  selectedTopic: string | null;
  overviews: Record<string, ModuleOverview>;
  modules: readonly { name: string; icon?: string; bg?: string; color?: string }[];
  onSelect: (topic: string) => void;
  renderSupplement?: (topic: string) => ReactNode;
};
export default function StudyNotesTopics({ courseKey, practiceModule, selectedTopic, overviews, modules, onSelect, renderSupplement }: Props) {
  const resolution = resolveStudyNotesTopics(courseKey, practiceModule, Object.keys(overviews));
  const active = availableStudyNote(selectedTopic, resolution.topics);
  const style = modules.find(module => module.name === active);
  return (
    <div style={{ padding: "20px 22px" }}>
      <div style={{ fontSize: 13, color: "#64748B", marginBottom: 14 }}>
        {resolution.topics.length === 0
          ? "Study notes are not available yet. Return to practice and try again shortly."
          : practiceModule && resolution.recommendedTopics.length === 0
            ? "No direct notes match this practice topic. Choose any available note topic below."
            : resolution.recommendedTopics.length > 1
              ? `Related notes for ${practiceModule}: choose a topic below.`
              : "Choose a note topic. You can switch topics at any time."}
      </div>
      <div aria-label="Note topics" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
        {resolution.topics.map(topic => {
          const module = modules.find(module => module.name === topic);
          const recommended = resolution.recommendedTopics.includes(topic);
          return <button key={topic} type="button" aria-pressed={active === topic} onClick={() => onSelect(topic)} style={{
            padding: "12px 14px", background: module?.bg ?? "#DBEAFE", color: module?.color ?? "#1D4ED8",
            border: `1.5px solid ${module?.color ?? "#1D4ED8"}33`, borderRadius: 10,
            fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textAlign: "left",
          }}>
            {module?.icon && <span style={{ marginRight: 6 }}>{module.icon}</span>}{topic}
            {recommended && <span style={{ display: "block", fontSize: 10, marginTop: 3 }}>Related to practice topic</span>}
          </button>;
        })}
      </div>
      {active && <div style={{ marginTop: 14 }}>
        <ModuleOverviewPanel key={active + "-modal"} overview={overviews[active]} moduleName={active}
          moduleColor={style?.color} moduleBg={style?.bg} moduleIcon={style?.icon} defaultExpanded={true}>
          {renderSupplement?.(active)}
        </ModuleOverviewPanel>
      </div>}
    </div>
  );
}
