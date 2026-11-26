import * as React from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let slug = "texas";
vi.mock("@/hooks/usePageMeta", () => ({ usePageMeta: vi.fn() }));
vi.mock("wouter", () => ({
  Link: ({ children, ...props }: { children: React.ReactNode; href: string }) => createElement("a", props, children),
  useParams: () => ({ slug }),
}));

import USStatePage from "./USStatePage";

beforeEach(() => { slug = "texas"; vi.stubGlobal("React", React); });
afterEach(() => vi.unstubAllGlobals());

describe("Texas Class D state-page scope", () => {
  it("renders one combined Class D card rather than duplicating it for treatment and distribution", () => {
    const html = renderToStaticMarkup(createElement(USStatePage));
    expect(html.match(/data-course-key="us-texas-class-d-water"/g)).toHaveLength(1);
    expect(html).toContain("Covers Texas water treatment and water distribution");
    expect(html).toContain("Texas-specific preparation");
  });
});

it("renders Pennsylvania exact bank links with preview-only and non-official copy", () => {
  slug = "pennsylvania";
  const html = renderToStaticMarkup(createElement(USStatePage));
  for (const key of ["pa-class-e-water-distribution", "pa-wastewater-collection-e4"]) {
    expect(html.match(new RegExp(`data-course-key="${key}"`, "g"))).toHaveLength(1);
    expect(html).toContain(`/us/practice/${key}?country=US&amp;state=PA`);
  }
  expect(html).toContain("full Pennsylvania course-pass sales are not available yet");
  expect(html).toContain("Not an official exam blueprint");
});
