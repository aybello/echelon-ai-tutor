import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import postcss from "postcss";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ missedCount: 0 }));
vi.mock("wouter", () => ({
  useSearch: () => "?province=ON",
  Link: ({ href, children, ...props }: any) => React.createElement("a", { href, ...props }, children),
}));
vi.mock("@/lib/trpc", () => ({ trpc: {
  useUtils: () => ({}),
  quiz: { getMissedQuestions: { useQuery: () => ({ data: { total: state.missedCount } }) } },
  dashboard: { toggleBookmark: { useMutation: () => ({ isPending: false }) } },
} }));
vi.mock("@/components/PracticeSaveStatus", () => ({ default: () => null, useVerifiedPracticeSaveScope: () => null }));
vi.mock("@/components/SiteNav", () => ({ default: () => React.createElement("header", { className: "echelon-site-header" }) }));
vi.mock("@/components/ModuleOverview", () => ({ default: () => null }));
vi.mock("@/components/ReportErrorModal", () => ({ default: () => null }));
vi.mock("@/components/FeedbackModal", () => ({ default: () => null }));
vi.mock("@/components/NextStepCard", () => ({ default: () => null }));
vi.mock("@/components/PreviewStudyPlanPrompt", () => ({ default: () => null }));
vi.mock("@/components/StudyNotesTopics", () => ({ default: () => null }));
vi.mock("@/components/QuizSkeleton", () => ({ default: () => null }));
vi.mock("@/components/PracticeQuestionStatus", () => ({ default: () => null }));

import QuizShell, { type QuizShellProps } from "./QuizShell";

const noop = () => {};
function render(overrides: Partial<QuizShellProps> = {}) {
  return renderToStaticMarkup(React.createElement(QuizShell, {
    currentPath: "/class1-water", examType: "class1-water", courseLabel: "Water Treatment", courseTitle: "Practice Quiz",
    history: [], correctCount: 0, wrongCount: 0, sessionSize: 15, selectedModule: null,
    onModuleChange: noop, calcOnly: false, onCalcOnlyToggle: noop,
    current: { id: 1, question: "Synthetic layout question", options: ["One", "Two"], correctAnswer: 0 },
    selected: null, confidence: 50, confirmed: false, showSteps: false, tutorOpen: false,
    onSelect: noop, onConfirm: noop, onNext: noop, onGoBack: noop, onConfidenceChange: noop,
    onToggleSteps: noop, onTutorOpen: noop, onTutorClose: noop, onResetSession: noop,
    ...overrides,
  }));
}
const css = (file: string) => postcss.parse(readFileSync(resolve(process.cwd(), `client/src/components/${file}`), "utf8"));

beforeEach(() => { state.missedCount = 0; vi.stubGlobal("React", React); });
afterEach(() => { vi.unstubAllGlobals(); });

describe("shared desktop quiz layout", () => {
  it("does not reserve or render an empty rail, including answers without named topics", () => {
    for (const history of [[], [{ correct: true }], [{ module: "  ", correct: false }]]) {
      const html = render({ history });
      expect(html).not.toContain("has-session-rail");
      expect(html).not.toContain('aria-label="This session"');
      expect(html).toContain('data-testid="practice-question"');
    }
  });

  it("keeps the topic summary when there are named answers or missed questions", () => {
    const html = render({ history: [{ module: "Pumps", correct: true }] });
    expect(html).toContain("has-session-rail");
    expect(html).toContain('aria-label="This session"');
    expect(html).toContain("Pumps");
    state.missedCount = 2;
    expect(render()).toContain("2 missed questions");
    expect(render()).toContain("has-session-rail");
  });

  it("never adds a rail column alongside a tutor or a gate", () => {
    const history = [{ module: "Pumps", correct: true }];
    const tutor = render({ history, tutorOpen: true, renderAITutor: () => React.createElement("aside", null, "Synthetic tutor") });
    expect(tutor).toContain("has-tutor");
    expect(tutor).toContain("Synthetic tutor");
    expect(tutor).not.toContain("has-session-rail");
    expect(tutor).not.toContain('aria-label="This session"');
    const gated = render({ history, gate: React.createElement("div", null, "Synthetic gate") });
    expect(gated).toContain("Synthetic gate");
    expect(gated).not.toContain("has-session-rail");
    expect(gated).not.toContain('data-testid="practice-question"');
  });

  it("renders one games shortcut and one accessible session progress bar, preserving the separate timer", () => {
    const html = render({ timedSeconds: 30 });
    expect(html.match(/Play games/g)).toHaveLength(1);
    expect(html).toMatch(/class="practice-quick-links"[^]*?Play games/);
    expect(html.match(/width:0%/g)).toHaveLength(1);
    expect(html.match(/role="progressbar"/g)).toHaveLength(1);
    expect(html).toContain('aria-label="Session progress"');
    expect(html).toContain("30s");
    expect(render({ sessionSize: undefined })).not.toContain('role="progressbar"');
  });

  it("makes the two-column desktop layout conditional and preserves mobile tutor stacking", () => {
    const quiz = css("QuizPage.css");
    const railRules: string[] = [];
    quiz.walkDecls("grid-template", declaration => {
      if (declaration.value.includes("300px")) {
        railRules.push((declaration.parent as postcss.Rule).selector);
        expect((declaration.parent?.parent as postcss.AtRule).params).toBe("(min-width: 1280px)");
      }
    });
    expect(railRules).toEqual([".practice-screen.has-session-rail:not(.has-tutor)"]);
    let desktopHeader = false;
    let desktopOpenOptions = false;
    quiz.walkRules(rule => {
      if (rule.selector === ".practice-screen .practice-header-inner") {
        desktopHeader = (rule.parent as postcss.AtRule).params === "(min-width: 1024px)";
      }
      if (rule.selector === ".practice-screen .practice-options[open]") {
        desktopOpenOptions = rule.nodes.some(node => node.type === "decl" && node.prop === "grid-column" && node.value === "1 / -1");
      }
    });
    expect(desktopHeader).toBe(true);
    expect(desktopOpenOptions).toBe(true);
    const workspace = css("StudyWorkspace.css");
    let mobileTutor = false;
    workspace.walkRules(".practice-screen.has-tutor", rule => {
      if ((rule.parent as postcss.AtRule).params === "(max-width: 720px)") {
        mobileTutor = rule.nodes.some(node => node.type === "decl" && node.prop === "grid-template" && node.value.endsWith("/ minmax(0, 1fr)"));
      }
    });
    expect(mobileTutor).toBe(true);
  });
});
