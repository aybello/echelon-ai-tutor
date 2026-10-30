import * as React from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let search = "state=AK&stream=water-treatment";

vi.mock("@/hooks/usePageMeta", () => ({ usePageMeta: vi.fn() }));
vi.mock("wouter", () => ({
  Link: ({ children, ...props }: { children: React.ReactNode; href: string }) => createElement("a", props, children),
  useLocation: () => ["/us/courses", vi.fn()],
  useSearch: () => search,
}));

import USCourses from "./USCourses";

beforeEach(() => vi.stubGlobal("React", React));
afterEach(() => vi.unstubAllGlobals());

function renderCourses(query: string) {
  search = query;
  return renderToStaticMarkup(createElement(USCourses));
}

describe("U.S. catalogue source-backed coverage notes", () => {
  it("renders the selected mixed-route note rather than only an aggregate count", () => {
    const html = renderCourses("state=AK&stream=water-treatment");
    expect(html).toContain('data-state-coverage="source-backed"');
    expect(html).toContain('data-program-coverage="state-with-wpi-component"');
    expect(html).toContain("Water Treatment · State program + WPI component.");
    expect(html).toContain("Only the listed standardized WPI classes are linked.");
  });

  it("fails closed for a selected state-specific route while retaining its evidence note", () => {
    const html = renderCourses("state=CA&stream=water-treatment");
    expect(html).toContain('data-program-coverage="state-specific"');
    expect(html).toContain("Water Treatment · State-specific / no shared course.");
    expect(html).toContain("No source-backed shared course is available for this state and stream.");
  });
});
