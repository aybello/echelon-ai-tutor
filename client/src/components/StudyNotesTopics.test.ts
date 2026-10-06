import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import StudyNotesTopics from "./StudyNotesTopics";
import { availableStudyNote, resolveStudyNotesTopics, WPI_CLASS1_WASTEWATER_NOTE_TOPICS } from "@/lib/studyNotesTopics";
import type { ModuleOverview } from "@/lib/questionTypes";

// Vitest uses classic JSX for the existing ModuleOverview renderer; Vite's
// production React plugin supplies the automatic JSX runtime.
beforeAll(() => vi.stubGlobal("React", React));
afterAll(() => vi.unstubAllGlobals());

const topics = ["Primary & Secondary Treatment", "Safety, Regulations & Admin", "Wastewater Collection Systems", "Laboratory & Monitoring", "Solids Handling & Biosolids"];
const overviews = Object.fromEntries(topics.map(title => [title, {
  title, intro: `Readable ${title} notes`, keyPoints: [{ heading: "Topic", body: "Relevant reviewed study topic." }], examTips: [],
}])) as Record<string, ModuleOverview>;
function render(module: string | null, selected?: string | null, notes = overviews) {
  const resolution = resolveStudyNotesTopics("wpi-class1-wastewater", module, Object.keys(notes));
  return renderToStaticMarkup(createElement(StudyNotesTopics, {
    courseKey: "wpi-class1-wastewater", practiceModule: module,
    selectedTopic: selected === undefined ? resolution.initialTopic : selected,
    overviews: notes, modules: [], onSelect: () => {},
  }));
}

describe("WPI notes routing and fallback", () => {
  it.each(Object.keys(WPI_CLASS1_WASTEWATER_NOTE_TOPICS))("resolves %s for both deep links and question shortcuts", module => {
    const resolution = resolveStudyNotesTopics("wpi-class1-wastewater", module, topics);
    expect(resolution.recommendedTopics.length).toBeGreaterThan(0);
    expect(new Set(resolution.topics)).toEqual(new Set(topics));
    const html = render(module);
    expect(html.match(/<button /g)).toHaveLength(resolution.initialTopic ? 6 : 5);
    expect(html).toContain('aria-label="Note topics"');
    for (const related of resolution.recommendedTopics) {
      expect(html).toContain(related.replaceAll("&", "&amp;"));
      const selected = render(module, related);
      expect(selected).toContain(`Readable ${related}`.replaceAll("&", "&amp;"));
      expect(selected.match(/<button /g)).toHaveLength(6); // picker plus panel collapse
    }
  });
  it("offers a chooser for cross-topic chapters instead of guessing the first note", () => {
    expect(resolveStudyNotesTopics("wpi-class1-wastewater", "Treatment Process", topics).initialTopic).toBeNull();
    expect(render("Treatment Process")).toContain("choose a topic below");
    expect(resolveStudyNotesTopics("wpi-class1-wastewater", "Laboratory Analysis", topics).initialTopic).toBe("Laboratory & Monitoring");
    expect(render("Laboratory Analysis")).toContain("Readable Laboratory &amp; Monitoring notes");
  });
  it("always shows available topics when a selected practice or note key is unknown", () => {
    expect(render("Unknown practice chapter", "Stale selected note")).toContain("No direct notes match");
    expect(render("Unknown practice chapter", "Stale selected note").match(/<button /g)).toHaveLength(5);
    expect(availableStudyNote("stale", topics)).toBeNull();
    expect(render(null).match(/<button /g)).toHaveLength(5);
    expect(render("Laboratory Analysis", null, {})).toContain("Study notes are not available yet");
  });
  it("filters unavailable recommendations and preserves exact matches in other courses", () => {
    const remaining = topics.filter(topic => topic !== "Laboratory & Monitoring");
    expect(resolveStudyNotesTopics("wpi-class1-wastewater", "Laboratory Analysis", remaining)).toMatchObject({ initialTopic: null, recommendedTopics: [] });
    expect(render("Laboratory Analysis", "Laboratory & Monitoring", Object.fromEntries(remaining.map(topic => [topic, overviews[topic]])))).toContain("No direct notes match");
    expect(resolveStudyNotesTopics("class1-ww", "Primary Treatment", ["Primary Treatment"]).initialTopic).toBe("Primary Treatment");
    expect(resolveStudyNotesTopics("wpi-class2-wastewater", "Laboratory Analysis", topics).initialTopic).toBeNull();
  });
});
