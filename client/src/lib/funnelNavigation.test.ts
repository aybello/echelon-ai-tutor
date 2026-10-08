import * as React from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ALL_PRODUCTS, PRODUCT_STUDY_PATHS } from "@shared/products";

const state = vi.hoisted(() => ({ search: "", path: "/pricing", isUS: false, ready: true, products: [] as { key: string; questionCount: number }[] }));
vi.mock("wouter", () => ({
  Link: ({ children, ...props }: { children: React.ReactNode; href: string }) => createElement("a", props, children),
  useSearch: () => state.search,
  useLocation: () => [state.path, vi.fn()],
}));
vi.mock("@/lib/trpc", () => ({
  trpc: new Proxy({}, { get: (_target, namespace) => new Proxy({}, { get: (_target, procedure) => ({
    useQuery: () => namespace === "stripe" && procedure === "getCommercialAvailability"
      ? { data: state.ready ? { products: state.products } : undefined, isLoading: !state.ready, isError: false }
      : { data: undefined, isLoading: false },
    useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  }) }) }),
}));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: false }) }));
vi.mock("@/hooks/useGeoRegion", () => ({ useGeoRegion: () => ({ isUS: state.isUS, region: "ca" }) }));
vi.mock("@/hooks/usePageMeta", () => ({ usePageMeta: vi.fn() }));
vi.mock("@/lib/marketingAnalytics", () => ({ getMarketingAttribution: () => ({ source: "direct", device: "desktop" }) }));
vi.mock("@/lib/anonymousAnalytics", () => ({ getAnonymousAnalyticsId: () => "synthetic-visitor-id" }));
vi.mock("@/lib/previewMode", () => ({ isPreviewModeActive: () => false }));
vi.mock("@/components/CheckoutContactModal", () => ({ default: () => null }));
vi.mock("@/components/NotifyModal", () => ({ default: () => null }));

import SiteNav from "@/components/SiteNav";
import CourseFinder from "@/components/CourseFinder";
import PurchaseGate from "@/components/PurchaseGate";
import Pricing from "@/pages/Pricing";
import Partnerships from "@/pages/Partnerships";

beforeEach(() => {
  state.search = ""; state.path = "/pricing"; state.isUS = false; state.ready = true;
  state.products = ALL_PRODUCTS.map(product => ({ key: product.key, questionCount: 400 }));
  vi.stubGlobal("React", React);
  vi.stubGlobal("window", { location: { pathname: "/pricing", search: "", origin: "https://echelon.example.test" } });
});
afterEach(() => vi.unstubAllGlobals());
const render = (component: React.ComponentType<any>, props = {}) => renderToStaticMarkup(createElement(component, props));

function selectedPricingArea() {
  return render(Pricing).split('<select id="individual-course-picker"')[1].split('<div style="display:none"')[0];
}

describe("rendered funnel navigation", () => {
  it.each(["ON", "BC", "AB", "SK", "MB"])("restores finder province %s and its exact course link from the URL", province => {
    const product = province === "ON" ? "class3-water" : "wpi-class3-water";
    state.path = "/"; state.search = `province=${province}&track=water-treatment&product=${product}`;
    const html = render(CourseFinder);
    expect(html).toContain(`<option value="${province.toLowerCase()}" selected="">`);
    expect(html).toContain(`<option value="${product}" selected="">`);
    expect(html).toContain(`href="/pricing?product=${product}&amp;province=${province}"`);
  });

  it.each(ALL_PRODUCTS)("renders the canonical preview and CAD price for $key", product => {
    // Each product is exercised in its own jurisdiction context. US courses are
    // reached through country=US, never through a province code, and they are
    // still priced in CAD like every other course.
    const isUSCourse = product.key.startsWith("us-");
    const province = product.key.startsWith("wpi-") || isUSCourse ? "BC" : "ON";
    state.search = isUSCourse
      ? `product=${product.key}&province=${province}&country=US`
      : `product=${product.key}&province=${province}`;
    (window.location as any).search = `?${state.search}`;
    const html = selectedPricingArea();
    expect(html).toContain(`<option value="${product.key}" selected="">`);
    // A dedicated US course links with its US context, not a province code.
    expect(html).toContain(
      isUSCourse
        ? `href="${PRODUCT_STUDY_PATHS[product.key].quizPath}?country=US"`
        : `href="${PRODUCT_STUDY_PATHS[product.key].quizPath}?province=${province}"`,
    );
    expect(html).toContain(`CA$${product.priceCAD / 100}`);
    expect(html.includes("One-time payment · 12 months access")).toBe(true);
    expect(render(Pricing).includes("12 months of access from successful payment")).toBe(true);
  });

  it("offers the dedicated US courses only under an explicit US context", () => {
    // A Canadian WPI selection must never surface a dedicated US course.
    state.search = "province=BC";
    (window.location as any).search = "?province=BC";
    const canadianWpi = selectedPricingArea();
    expect(canadianWpi).not.toContain('value="us-class1-water"');
    expect(canadianWpi).toContain('value="wpi-class1-water"');
    // An Ontario selection must never surface a dedicated US course either.
    state.search = "province=ON";
    (window.location as any).search = "?province=ON";
    const ontario = selectedPricingArea();
    expect(ontario).not.toContain('value="us-class1-water"');
    // The US context adds the dedicated courses and keeps the shared WPI ones
    // that US learners could already buy.
    state.search = "province=BC&country=US&state=WA";
    (window.location as any).search = "?province=BC&country=US&state=WA";
    const us = selectedPricingArea();
    expect(us).toContain('value="us-class1-water"');
    expect(us).toContain('value="us-class1-water-dist"');
    expect(us).toContain('value="wpi-class1-water"');
  });

  it("keeps a requested course unselected while loading or unavailable, never choosing an unrelated offer", () => {
    state.search = "product=wpi-class3-water&province=BC";
    state.ready = false;
    expect(selectedPricingArea()).toContain("Checking the verified question banks available for purchase");
    state.ready = true; state.products = [{ key: "oit", questionCount: 400 }];
    const html = selectedPricingArea();
    expect(html).toContain("Your requested course is not currently open for purchase");
    expect(html).not.toContain("Get OIT Pass");
  });

  it("renders safe sign-in and dashboard destinations from the current course", () => {
    state.search = "province=AB&token=synthetic&next=%2Faccount";
    const html = render(SiteNav, { currentPath: "/wpi-class3-water" });
    expect(html).toContain('href="/account?next=%2Fwpi-class3-water%3Fprovince%3DAB"');
    expect(html).toContain('href="/dashboard?course=wpi-class3-water&amp;province=AB"');
    expect(html).not.toContain("token%3D");
  });

  it.each([false, true])("renders an actual selectable catalogue for the gate, US=%s", isUS => {
    state.isUS = isUS;
    const html = render(PurchaseGate, { examType: "class3-ww", productKey: "class3-ww", children: createElement("p", {}, "Synthetic preview") });
    expect(html).toContain(`href="${isUS ? "/us/courses" : "/#courses"}"`);
    expect(html).toContain("Browse other courses");
  });

  it("renders the partnership form without falsely claiming a mail draft was sent", () => {
    const html = render(Partnerships);
    expect(html).toContain("Send Partnership Inquiry");
    expect(html).not.toContain("Message sent");
    expect(html).not.toContain("Your email client should have opened");
  });
});

describe("scoped UI/source wiring contracts", () => {
  it("uses tRPC persistence with an explicit retry and no mailto transport in the submit handler", () => {
    const source = readFileSync(new URL("../pages/Partnerships.tsx", import.meta.url), "utf8");
    const handler = source.split("const handleSubmit")[1].split("  return (")[0];
    expect(source).toContain("trpc.contact.partnership.useMutation()");
    expect(handler).toContain("await sendInquiry.mutateAsync(inquiryRef.current)");
    expect(handler.indexOf("await sendInquiry.mutateAsync")).toBeLessThan(handler.indexOf("setSubmitted(true)"));
    expect(handler).not.toContain("fetch(");
    expect(handler).not.toContain("mailto:");
    expect(source).toContain("Retry inquiry");
  });
  it("retains the dashboard query and restricts the checkout change to individual cancellation", () => {
    const dashboard = readFileSync(new URL("../pages/StudentDashboard.tsx", import.meta.url), "utf8");
    const stripe = readFileSync(new URL("../../../server/routers/stripeRouter.ts", import.meta.url), "utf8");
    expect(dashboard).toContain("useSearch()");
    expect(dashboard).toContain("signInHref(dashboardDestination)");
    expect(stripe).toContain("individualCheckoutCancelPath(product.key, ctx.req.headers.referer, appBaseUrl)");
    expect(stripe).toContain("cancel_url: `${appBaseUrl}/teams`");
  });
});
