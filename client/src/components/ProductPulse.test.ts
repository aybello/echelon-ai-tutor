import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const component = readFileSync(new URL("./ProductPulse.tsx", import.meta.url), "utf8");
const practice = readFileSync(new URL("./QuizShell.tsx", import.meta.url), "utf8");
const quick10 = readFileSync(new URL("../pages/Quick10.tsx", import.meta.url), "utf8");

describe("product pulse source contract", () => {
  it("offers the three private, actionable response choices", () => {
    expect(component).toContain("How is Echelon working for you?");
    expect(component).toContain("I found what I needed");
    expect(component).toContain("I got stuck");
    expect(component).toContain("I have a suggestion");
    expect(component).toContain("Optional, private feedback. This is not a public review.");
  });

  it("keeps the prompt optional and cooldown-controlled", () => {
    expect(component).toContain('const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000');
    expect(component).toContain('window.localStorage.getItem(COOLDOWN_KEY)');
    expect(component).toContain('setVisible(false)');
    expect(component).toContain('comment });');
  });

  it("does not invite feedback during an active practice or Quick 10 question", () => {
    expect(practice).toContain('if (!current && history.length > 0)');
    expect(practice).toContain('timedSeconds <= 0 && <ProductPulse');
    expect(quick10).toContain('phase === "done" && session');
    expect(quick10).toContain('<ProductPulse courseKey={session.courseKey} source="quick10" />');
    expect(component).not.toContain("GOOGLE_REVIEW_URL");
  });
});
