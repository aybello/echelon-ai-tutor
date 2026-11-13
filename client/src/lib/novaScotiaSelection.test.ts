import * as React from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ALL_PRODUCTS } from "@shared/products";

const state = vi.hoisted(() => ({ search: "province=NS&track=water-treatment&product=wpi-class1-water", ready: true }));
vi.mock("wouter", () => ({
  Link: ({ children, ...props }: { children: React.ReactNode; href: string }) => createElement("a", props, children),
  useSearch: () => state.search,
  useLocation: () => ["/pricing", vi.fn()],
}));
vi.mock("@/lib/trpc", () => ({ trpc: new Proxy({}, { get: (_target, namespace) => new Proxy({}, { get: (_target, procedure) => ({
  useQuery: () => namespace === "stripe" && procedure === "getCommercialAvailability"
    ? { data: state.ready ? { products: ALL_PRODUCTS.map(product => ({ key: product.key, questionCount: 400 })) } : undefined, isLoading: !state.ready, isError: false }
    : { data: undefined, isLoading: false },
  useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
}) }) }) }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: false }) }));
vi.mock("@/hooks/useGeoRegion", () => ({ useGeoRegion: () => ({ isUS: false, region: "ca" }) }));
vi.mock("@/hooks/usePageMeta", () => ({ usePageMeta: vi.fn() }));
vi.mock("@/lib/marketingAnalytics", () => ({ getMarketingAttribution: () => ({ source: "direct", device: "desktop" }) }));
vi.mock("@/lib/anonymousAnalytics", () => ({ getAnonymousAnalyticsId: () => "synthetic-ns-test" }));
vi.mock("@/components/CheckoutContactModal", () => ({ default: () => null }));
vi.mock("@/components/NotifyModal", () => ({ default: () => null }));
vi.mock("@/components/LandingNav", () => ({ default: () => null }));

import CourseFinder from "@/components/CourseFinder";
import Pricing from "@/pages/Pricing";

beforeEach(() => {
  state.search = "province=NS&track=water-treatment&product=wpi-class1-water";
  state.ready = true;
  vi.stubGlobal("React", React);
  vi.stubGlobal("window", { location: { pathname: "/pricing", search: `?${state.search}`, origin: "https://echelon.example.test" } });
});
afterEach(() => vi.unstubAllGlobals());

describe("rendered Nova Scotia selection", () => {
  it("restores the finder and carries NS to practice and pricing with a caveat", () => {
    const html = renderToStaticMarkup(createElement(CourseFinder));
    expect(html).toContain('<option value="ns" selected="">Nova Scotia</option>');
    expect(html).toContain('href="/wpi-class1-water?province=NS"');
    expect(html).toContain('href="/pricing?product=wpi-class1-water&amp;province=NS"');
    expect(html).toContain("2017 ABC exams");
  });
  it("renders NS pricing without a province crash or unsupported course options", () => {
    const html = renderToStaticMarkup(createElement(Pricing));
    expect(html).toContain("Nova Scotia");
    expect(html).toContain("2017 ABC exams");
    const picker = html.split('<select id="individual-course-picker"')[1].split('<div style="display:none"')[0];
    expect(picker).toContain('value="wpi-class1-water" selected=""');
    expect(picker).toContain('href="/wpi-class1-water?province=NS"');
    for (const key of ["oit", "oit-ww", "wqa", "wpi-class4-water-dist", "wpi-class4-water-coll", "us-class1-water"]) {
      expect(picker).not.toContain(`value="${key}"`);
    }
  });
  it("does not offer a requested NS course before commercial availability is verified", () => {
    state.ready = false;
    expect(renderToStaticMarkup(createElement(Pricing))).toContain("Checking the verified question banks available for purchase");
  });
});
