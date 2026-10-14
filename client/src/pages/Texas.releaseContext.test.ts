import * as React from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({ trpc: { dashboardAuth: { me: { useQuery: () => ({ data: null }) } } } }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: false }) }));
vi.mock("@/hooks/usePageMeta", () => ({ usePageMeta: vi.fn() }));
vi.mock("wouter", () => ({
  Link: ({ children, ...props }: { children: React.ReactNode; href: string }) => createElement("a", props, children),
  useSearch: () => "country=US&state=TX", useParams: () => ({ slug: "texas" }),
}));
import SiteNav from "../components/SiteNav";
import USStatePage from "./USStatePage";
beforeEach(() => vi.stubGlobal("React", React));
afterEach(() => vi.unstubAllGlobals());

describe("Texas published course identity", () => {
  it.each(["/us-texas-class-d-water", "/us-texas-class-d-water-mock", "/us-texas-class-d-water-flashcards", "/formulas-us-texas-class-d-water"])("keeps %s in Texas/US rather than Ontario or Class I", currentPath => {
    const html = renderToStaticMarkup(createElement(SiteNav, { currentPath }));
    expect(html).toContain("Texas / Class D Water");
    expect(html).toContain('href="/us"');
    expect(html).not.toContain("Ontario</small>");
    expect(html).not.toContain("US Class I</small>");
    expect(html).not.toContain("province=BC");
  });
  it("marks the offered local course available but does not claim other Texas credentials exist", () => {
    const html = renderToStaticMarkup(createElement(USStatePage));
    expect(html).toContain("Dedicated Class D preparation available");
    expect(html).not.toContain("Dedicated prep not yet available");
    expect(html).toContain("Other Texas credentials below remain research needs");
    expect(html).not.toContain("Dedicated prep is not available or being sold yet");
  });
});
