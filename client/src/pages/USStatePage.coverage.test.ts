import * as React from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/usePageMeta", () => ({ usePageMeta: vi.fn() }));
vi.mock("wouter", () => ({
  Link: ({ children, ...props }: { children: React.ReactNode; href: string }) => createElement("a", props, children),
  useParams: () => ({ slug: "texas" }),
}));

import USStatePage from "./USStatePage";

beforeEach(() => vi.stubGlobal("React", React));
afterEach(() => vi.unstubAllGlobals());

describe("Texas Class D state-page scope", () => {
  it("renders one combined Class D card rather than duplicating it for treatment and distribution", () => {
    const html = renderToStaticMarkup(createElement(USStatePage));
    expect(html.match(/data-course-key="us-texas-class-d-water"/g)).toHaveLength(1);
    expect(html).toContain("Covers Texas water treatment and water distribution");
    expect(html).toContain("Texas-specific preparation");
  });
});
