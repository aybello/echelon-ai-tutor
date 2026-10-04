import * as React from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ALL_PRODUCTS, PRODUCT_STUDY_PATHS } from "@shared/products";
import { buildPricingHref } from "@shared/funnelNavigation";
import { US_STATE_NAMES } from "@shared/usStateNames";

const state = vi.hoisted(() => ({ search: "", geoUS: false, ready: true, products: [] as { key: string; questionCount: number }[] }));
vi.mock("wouter", () => ({
  Link: ({ children, ...props }: { children: React.ReactNode; href: string }) => createElement("a", props, children),
  useSearch: () => state.search,
  useLocation: () => ["/pricing", vi.fn()],
}));
vi.mock("@/lib/trpc", () => ({
  trpc: new Proxy({}, { get: (_target, namespace) => new Proxy({}, { get: (_target, procedure) => ({
    useQuery: () => namespace === "stripe" && procedure === "getCommercialAvailability"
      ? { data: state.ready ? { products: state.products } : undefined, isLoading: !state.ready, isError: false }
      : { data: undefined, isLoading: false },
    useMutation: () => ({ mutate: vi.fn(), isPending: false }),
  }) }) }),
}));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: false }) }));
vi.mock("@/hooks/useGeoRegion", () => ({ useGeoRegion: () => ({ isUS: state.geoUS, region: "ca" }) }));
vi.mock("@/hooks/usePageMeta", () => ({ usePageMeta: vi.fn() }));
vi.mock("@/lib/marketingAnalytics", () => ({ getMarketingAttribution: () => ({ source: "direct", device: "desktop" }) }));
vi.mock("@/components/LandingNav", () => ({ default: () => null }));
vi.mock("@/components/CheckoutContactModal", () => ({ default: () => null }));
vi.mock("@/components/NotifyModal", () => ({ default: () => null }));
import Pricing from "./Pricing";

const pricingSource = readFileSync(new URL("./Pricing.tsx", import.meta.url), "utf8");
const purchaseSource = readFileSync(new URL("../components/PurchaseGate.tsx", import.meta.url), "utf8");
const quizSource = readFileSync(new URL("../components/QuizGate.tsx", import.meta.url), "utf8");
const render = () => renderToStaticMarkup(createElement(Pricing));
const setSearch = (search: string) => { state.search = search; window.location.search = `?${search}`; };

beforeEach(() => {
  state.geoUS = false; state.ready = true;
  state.products = ALL_PRODUCTS.map(product => ({ key: product.key, questionCount: 400 }));
  vi.stubGlobal("React", React);
  vi.stubGlobal("window", { location: { pathname: "/pricing", search: "", origin: "https://echelon.example.test" } });
  setSearch("product=wpi-class3-water&country=US&state=WA");
});
afterEach(() => vi.unstubAllGlobals());

describe("explicit US study context on existing individual pricing", () => {
  it.each(US_STATE_NAMES)("uses $name as study context, never BC certification or a state course", identity => {
    setSearch(`product=wpi-class3-water&country=US&state=${identity.code}`);
    const html = render();
    expect(html).toContain("US shared WPI preparation");
    expect(html).toContain(`Study context: ${identity.name}`);
    expect(html).toContain("Not a dedicated state exam course");
    expect(html).toContain("Confirm your local exam, stream, class, edition, and eligibility");
    expect(html).toContain("State context does not confirm exam fit");
    expect(html).toContain("Canadian dollars (CAD)");
    for (const label of ["Select Your Province", "British Columbia", "EOCP", "BC / AB / SK / MB", "Canada-specific", "Prices in USD"]) expect(html).not.toContain(label);
    expect(html).toContain('<option value="wpi-class3-water" selected="">');
    expect(html).toContain(`href="${PRODUCT_STUDY_PATHS["wpi-class3-water"].quizPath}?country=US&amp;state=${identity.code}"`);
    expect(html).toContain(`href="/wpi-class3-water-flashcards?country=US&amp;state=${identity.code}"`);
    expect(html).toContain("CA$249");
    expect(html).toContain("12 months of access from successful payment");
  });

  it.each(ALL_PRODUCTS.filter(product => product.key.startsWith("wpi-")))("retains $key and its canonical CAD price without Canadian authority labels", product => {
    setSearch(`product=${product.key}&country=US&state=NY&province=BC`);
    const html = render();
    expect(html).toContain(`<option value="${product.key}" selected="">`);
    expect(html).toContain(`CA$${product.priceCAD / 100}`);
    expect(html).toContain(`href="${PRODUCT_STUDY_PATHS[product.key].quizPath}?country=US&amp;state=NY"`);
    expect(html).toContain("Study context: New York");
    for (const label of ["British Columbia", "EOCP", "BC / AB / SK / MB"]) expect(html).not.toContain(label);
  });

  it.each(["XX", "DC", "Washington", ""])("never presents invalid state %s as a match", invalid => {
    setSearch(`product=wpi-class3-water&country=US&state=${invalid}`);
    const html = render();
    expect(html).toContain("State not recognized. No state exam match is confirmed");
    expect(html).toContain("US study context — no valid state selected");
    expect(html).toContain('href="/wpi-class3-water?country=US"');
    expect(html).not.toContain("Study context: Washington");
  });

  it("accepts optional state without asserting any local exam match", () => {
    setSearch("product=wpi-class3-water&country=US");
    const html = render();
    expect(html).toContain("US study context — no valid state selected");
    expect(html).not.toContain("State not recognized");
    expect(html).toContain('href="/wpi-class3-water?country=US"');
  });

  it("restores the exact products, price, and US context on reload and Back", () => {
    const history = [buildPricingHref("wpi-class3-water", "BC", state.search), buildPricingHref("wpi-class2-wastewater", "BC", state.search)];
    for (const href of [history[0], history[1], history[0]]) {
      setSearch(href.split("?")[1]);
      const product = ALL_PRODUCTS.find(item => item.key === new URLSearchParams(state.search).get("product"))!;
      const html = render();
      expect(html).toContain(`<option value="${product.key}" selected="">`);
      expect(html).toContain(`CA$${product.priceCAD / 100}`);
      expect(html).toContain("Study context: Washington");
      expect(html).toContain(`href="${PRODUCT_STUDY_PATHS[product.key].quizPath}?country=US&amp;state=WA"`);
    }
    expect(pricingSource).toContain("navigate(buildPricingHref(e.target.value, selectedProvince, searchString))");
  });

  it("keeps an unavailable requested product unselected without substituting a sale", () => {
    state.ready = false;
    expect(render()).toContain("Checking the verified question banks available for purchase");
    expect(render()).not.toContain("Get WPI Class III Water Pass");
    state.ready = true;
    state.products = [{ key: "wpi-class1-water", questionCount: 400 }];
    const html = render();
    expect(html).toContain("Your requested course is not currently open for purchase");
    expect(html).not.toContain("Get WPI Class I Water Pass");
  });

  it.each(["product=wpi-class3-water&province=BC", "product=wpi-class3-water&province=BC&state=WA", "product=wpi-class3-water&province=BC&country=us&state=WA", "product=class3-water&province=ON&country=US&state=WA"])("does not relabel Canadian pricing without explicit US western context: %s", search => {
    state.geoUS = true;
    setSearch(search);
    const html = render();
    expect(html).toContain("Select Your Province");
    expect(html).not.toContain("Study context: Washington");
    expect(html).not.toContain("US shared WPI preparation");
  });

  it("forwards current search from both gates while preserving existing CAD checkout", () => {
    expect(purchaseSource).toContain('buildPricingHref(productKey, new URLSearchParams(searchString).get("province"), searchString)');
    expect(quizSource).toContain('buildPricingHref(productKey, new URLSearchParams(searchString).get("province"), searchString)');
    expect(quizSource.match(/<Link href=\{pricingHref\}>/g)).toHaveLength(2);
    for (const source of [purchaseSource, quizSource, pricingSource.slice(pricingSource.indexOf("function CheckoutButton"), pricingSource.indexOf("function SubscriptionCheckoutButton"))]) {
      expect(source).toContain('currency: "cad"');
    }
  });
});
