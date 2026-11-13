import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { TutorGuideMark } from "./TutorGuideMark";

const render = (props?: React.ComponentProps<typeof TutorGuideMark>) =>
  renderToStaticMarkup(createElement(TutorGuideMark, props));

describe("TutorGuideMark", () => {
  beforeAll(() => vi.stubGlobal("React", React));
  afterAll(() => vi.unstubAllGlobals());

  it("renders the study-guidance mark by default with decorative SVG semantics", () => {
    const html = render({ size: 18, color: "#087F78" });

    expect(html).toContain("lucide-book-open-check");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('focusable="false"');
    expect(html).toContain('width="18"');
    expect(html).toContain('stroke="#087F78"');
    expect(html).not.toContain("lucide-brain-circuit");
  });

  it("uses the analysis mark only when pattern analysis is explicitly selected", () => {
    const html = render({ mode: "analysis", size: 14 });

    expect(html).toContain("lucide-brain-circuit");
    expect(html).not.toContain("lucide-book-open-check");
    expect(html).toContain('width="14"');
  });
});
