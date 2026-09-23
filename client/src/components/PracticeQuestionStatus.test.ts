import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import PracticeQuestionStatus from "./PracticeQuestionStatus";

const render = (overrides: Partial<Parameters<typeof PracticeQuestionStatus>[0]> = {}) => renderToStaticMarkup(createElement(PracticeQuestionStatus, {
  status: "empty", answerCount: 0, modules: [{ name: "Wastewater Treatment" }],
  selectedModule: "Secondary Treatment", calcOnly: false, hasCalcOnly: true,
  onModuleChange: vi.fn(), onCalcOnlyToggle: vi.fn(), onRestart: vi.fn(),
  ...overrides,
}));

describe("empty practice selection recovery", () => {
  it("does not claim an unanswered quiz is completed or that zero answers were saved", () => {
    const html = render();
    expect(html).toContain("No questions are available for this practice selection.");
    expect(html).not.toMatch(/Session Complete|Your 0 answers|No more questions/);
    expect(html).toContain("Restarting keeps your current filters.");
  });

  it("shows a stale selected category while offering the current category and All modules", () => {
    const html = render();
    expect(html).toContain("Selected module: Secondary Treatment");
    expect(html).toMatch(/<button[^>]*aria-pressed="false"[^>]*>All modules<\/button>/);
    expect(html).toContain(">Wastewater Treatment</button>");
    expect(html).not.toContain(">Secondary Treatment</button>");
  });

  it("indicates selected module and calculation filters accessibly", () => {
    const html = render({ selectedModule: "Wastewater Treatment", calcOnly: true });
    expect(html).toMatch(/<button[^>]*aria-pressed="true"[^>]*>Wastewater Treatment<\/button>/);
    expect(html).toMatch(/<button[^>]*aria-pressed="true"[^>]*>Turn off Calc Only<\/button>/);
  });

  it("keeps completed answers visible without promising a successful server save", () => {
    expect(render({ answerCount: 1 })).toContain("Your 1 answer remains in this session.");
    expect(render({ answerCount: 3 })).toContain("Your 3 answers remain in this session.");
  });

  it("distinguishes failed loading and retry from an empty result", () => {
    const html = render({ status: "error", error: "Connection interrupted", onRetry: vi.fn() });
    expect(html).toContain('role="alert"');
    expect(html).toContain("Connection interrupted");
    expect(html).toContain("Retry loading questions");
    expect(html).not.toContain("Restart this selection");
  });
});
