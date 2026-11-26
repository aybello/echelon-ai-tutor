import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/components/FlashcardShell.tsx"), "utf8");

describe("FlashcardShell action-control layout", () => {
  it("keeps flipped card faces inside a compact fixed-height interactive area", () => {
    expect(source).toContain(".fc-inner { position: relative; width: 100%; height: 240px;");
    expect(source).toContain(".fc-inner { height: 220px; }");
    expect(source).toContain("bottom: 0;");
    expect(source).toContain("overflow-y: auto;");
  });

  it("places learner decisions in a foreground action row", () => {
    expect(source).toContain(".fc-actions-row { position: relative; z-index: 4;");
    expect(source).toContain('<div className="fc-actions-row">');
  });

  it("exposes the rendered study card and prompt for reliable end-to-end readiness checks", () => {
    expect(source).toContain('data-testid="flashcard-study-card"');
    expect(source).toContain('data-testid="flashcard-prompt"');
  });

  it("groups secondary controls without removing module or mastery actions", () => {
    expect(source).toContain('<details className="fc-options">');
    expect(source).toContain("Flashcard options");
    expect(source).toContain('aria-label="Filter flashcards by module"');
    expect(source).toContain("onClick={handleShuffle}");
    expect(source).toContain("onClick={handleStudyDeck}");
    expect(source).toContain("onClick={handleReviewUnknown}");
    expect(source).toContain("markKnown();");
    expect(source).toContain("markUnknown();");
  });
});
