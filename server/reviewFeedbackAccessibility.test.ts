import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

function contrast(foreground: string, background: string): number {
  const luminance = (hex: string) => {
    const channels = [1, 3, 5].map((i) => {
      const value = parseInt(hex.slice(i, i + 2), 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const [dark, light] = [luminance(foreground), luminance(background)].sort((a, b) => a - b);
  return (light + 0.05) / (dark + 0.05);
}

describe("practice feedback styling", () => {
  it("does not override state colors and only hovers unselected, enabled answers", () => {
    const css = postcss.parse(read("client/src/components/PracticeWorkspace.css"));
    const answerRules: postcss.Rule[] = [];
    const resultRules: postcss.Rule[] = [];
    css.walkRules((rule) => {
      if (rule.selector.includes("button[aria-pressed")) answerRules.push(rule);
      if (rule.selector.includes(".practice-result-label")) resultRules.push(rule);
    });
    expect(answerRules).toHaveLength(1);
    expect(answerRules[0].selector).toContain('button[aria-pressed="false"]:not(:disabled):hover');
    expect(answerRules[0].nodes?.some((node) => node.type === "decl" && node.prop === "color")).toBe(false);
    expect(resultRules).toHaveLength(1);
    expect(resultRules[0].nodes?.some((node) => node.type === "decl" && node.prop === "color")).toBe(false);
  });

  it("retains distinct, readable selected and confirmed feedback in the quiz", () => {
    const quiz = read("client/src/components/QuizShell.tsx");
    expect(quiz).toContain('if (isCorrect)       { bg = "#DCFCE7"; border = "#86EFAC"; color = "#15803D"; }');
    expect(quiz).toContain('else if (isWrong)    { bg = "#FEE2E2"; border = "#FCA5A5"; color = "#B91C1C"; }');
    expect(quiz).toContain('else if (isSelected) { bg = "#EFF6FF"; border = "#93C5FD"; color = "#1D4ED8"; }');
    expect(quiz).toContain('color: selected === correctIdx ? "#15803D" : "#C2410C"');
    expect(quiz).toContain('disabled={confirmed || isQuestionLoading}');
    for (const [text, background] of [
      ["#15803D", "#DCFCE7"], ["#B91C1C", "#FEE2E2"], ["#1D4ED8", "#EFF6FF"],
      ["#15803D", "#FFFFFF"], ["#C2410C", "#FFFFFF"],
    ]) expect(contrast(text, background)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("Teams plan actions", () => {
  it.each(["Explore annual", "Explore Flex"])("exposes %s to accessibility APIs and hides only its arrow", (label) => {
    const teams = read("client/src/pages/Teams.tsx");
    expect(teams).toContain(`<span className="teams-plan-action">${label} <ArrowRight aria-hidden="true" /></span>`);
    expect(teams).not.toMatch(/<span className="teams-plan-action"[^>]*aria-hidden/);
  });
});
