import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Regression cover for two AI Tutor panel defects found on the live site 2026-10-16.
 *
 * These assert on the component and stylesheet source because the defects were layout
 * and interaction failures that only appear in a real browser. Both were reproduced
 * live before the fix and verified in the browser after it; these checks exist so the
 * exact broken patterns cannot come back silently.
 */

const here = resolve(__dirname);
const tsx = readFileSync(resolve(here, "AITutor.tsx"), "utf8");
const css = readFileSync(resolve(here, "AITutor.css"), "utf8");

describe("AI Tutor quick prompts stay clickable", () => {
  it("does not hide the quick prompts behind a collapsed disclosure", () => {
    // The prompts used to live in a closed <details>. A closed disclosure still laid
    // its content out, which spilled under .ai-tutor-composer, so every click on a
    // prompt landed on the composer and nothing was ever sent. Measured live:
    // elementFromPoint at the button centre returned the composer, not the button.
    expect(tsx).not.toMatch(/<details[^>]*ai-tutor-prompts/);
    expect(tsx).not.toMatch(/ai-tutor-prompts[\s\S]{0,400}?<summary/);
  });

  it("renders the prompt buttons in a plain always-visible container", () => {
    const block = tsx.slice(tsx.indexOf("ai-tutor-prompts"));
    expect(block).toContain("QUICK PROMPTS");
    // The buttons must still be wired to the send path.
    expect(block).toMatch(/onClick=\{\(\) => sendMessage\(q\)\}/);
  });

  it("keeps the prompts container from being clipped away entirely", () => {
    const rule = css.match(/\.ai-tutor-prompts\s*\{[^}]*\}/);
    expect(rule).not.toBeNull();
    // overflow must stay scrollable rather than hidden, so a long prompt list is
    // still reachable in a short panel.
    expect(rule?.[0]).toContain("overflow-y: auto");
  });
});

describe("AI Tutor math stays readable", () => {
  it("gives long display math real horizontal scrolling instead of clipping it", () => {
    // Measured live: a formula needing 452px was placed in a 257px column and was
    // simply cut off at the panel edge.
    const rule = css.match(/\.ai-tutor-messages \.katex-display\s*\{[^}]*\}/);
    expect(rule).not.toBeNull();
    expect(rule?.[0]).toContain("overflow-x: auto");
  });

  it("scales long display math down on narrow viewports", () => {
    expect(css).toMatch(/@media[^{]*max-width:\s*1200px[\s\S]*?katex-display[\s\S]*?font-size/);
  });

  it("stops a copied formula from being duplicated by the MathML layer", () => {
    // Copying a formula used to yield it twice, because KaTeX renders an invisible
    // MathML accessibility copy alongside the visual HTML.
    const rule = css.match(/\.ai-tutor-messages \.katex \.katex-mathml\s*\{[^}]*\}/);
    expect(rule).not.toBeNull();
    expect(rule?.[0]).toContain("user-select: none");
    expect(rule?.[0]).toContain("position: absolute");
  });
});
