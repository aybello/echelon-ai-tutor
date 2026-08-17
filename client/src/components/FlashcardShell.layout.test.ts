import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/components/FlashcardShell.tsx"), "utf8");

describe("FlashcardShell action-control layout", () => {
  it("keeps flipped card faces inside a fixed-height interactive area", () => {
    expect(source).toContain(".fc-inner { position: relative; width: 100%; min-height: 500px;");
    expect(source).toContain("bottom: 0;");
    expect(source).toContain("overflow-y: auto;");
  });

  it("places learner decisions in a foreground action row", () => {
    expect(source).toContain(".fc-actions-row { position: relative; z-index: 4;");
    expect(source).toContain('<div className="fc-actions-row">');
  });
});
