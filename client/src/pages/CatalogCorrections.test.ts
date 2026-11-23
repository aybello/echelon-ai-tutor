import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  search: "", courseKey: "oit", track: "water", hasAccess: false,
  mockProps: undefined as any, flashcardProps: undefined as any,
  boundaryProps: undefined as any, structuredData: undefined as any,
  metadata: [] as any[], bankKeys: [] as string[],
}));
vi.mock("react", async original => {
  const actual: any = await original();
  return { ...actual, useState: (initial: any) => actual.useState(initial === "water" ? state.track : initial) };
});
vi.mock("wouter", () => ({
  Link: ({ children, ...props }: any) => createElement("a", props, children),
  Redirect: () => null,
  useLocation: () => ["/courses/oit", vi.fn()],
  useSearch: () => state.search,
  useRoute: (route: string) => route === "/courses/:courseKey" ? [true, { courseKey: state.courseKey }] : [false, {}],
}));
vi.mock("@/components/SiteNav", () => ({ default: () => null, ECHELON_LOGO_URL: "/test-logo.svg" }));
vi.mock("@/components/LandingNav", () => ({ default: () => null }));
vi.mock("@/components/ProvinceBanner", () => ({ default: () => null }));
vi.mock("@/components/QuizSkeleton", () => ({ default: () => null }));
vi.mock("@/hooks/usePageMeta", () => ({ usePageMeta: (meta: any) => state.metadata.push(meta) }));
vi.mock("@/hooks/useStructuredData", () => ({ useStructuredData: (data: any) => { state.structuredData = data; } }));
vi.mock("@/hooks/useProvince", () => ({ useProvince: () => ({ showPrompt: false, setProvince: vi.fn(), dismiss: vi.fn() }) }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: false }) }));
vi.mock("@/hooks/useGeoRegion", () => ({ useGeoRegion: () => ({ isUS: false }) }));
vi.mock("@/lib/previewMode", () => ({ isPreviewModeActive: () => false }));
vi.mock("@/lib/marketingAnalytics", () => ({ getMarketingAttribution: () => ({}) }));
vi.mock("@/lib/anonymousAnalytics", () => ({ getAnonymousAnalyticsId: () => "synthetic-visitor" }));
vi.mock("@/lib/trpc", () => ({ trpc: {
  quiz: { getBankMeta: { useQuery: () => ({ data: { totalQuestions: 650 } }) } },
  stripe: {
    createCheckoutSession: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    checkAccess: { useQuery: () => ({ data: { hasAccess: state.hasAccess }, isLoading: false }) },
  },
  funnelAnalytics: { track: { useMutation: () => ({ mutate: vi.fn() }) } },
} }));
vi.mock("@/hooks/useQuestionBank", () => ({
  useMockExamMetadata: (key: string) => {
    state.bankKeys.push(key);
    return { totalQuestions: 650, moduleTargets: { "Original module": 100 }, isLoading: false, dbUnavailable: false };
  },
  useQuestionBank: (key: string) => {
    state.bankKeys.push(key);
    return { questions: [], modules: [], isLoading: false, dbUnavailable: false };
  },
}));
vi.mock("@/components/MockExamShell", () => ({ default: (props: any) => {
  state.mockProps = props;
  return createElement("section", null, createElement("h1", null, props.title), props.infoLine);
} }));
vi.mock("@/components/FlashcardShell", () => ({ default: (props: any) => {
  state.flashcardProps = props;
  return createElement("h1", null, `Flashcards: ${props.examName}`);
} }));
vi.mock("@/components/FlashcardErrorBoundary", () => ({ default: (props: any) => {
  state.boundaryProps = props;
  return props.children;
} }));

import SeoLandingPage from "./SeoLandingPage";
import OitHub from "./OitHub";
import OITMockExam from "./OITMockExam";
import OITWastewaterMockExam from "./OITWastewaterMockExam";
import WQAMockExam from "./WQAMockExam";
import Class1WastewaterMockExam from "./Class1WastewaterMockExam";
import Class2WastewaterMockExam from "./Class2WastewaterMockExam";
import Class3WastewaterMockExam from "./Class3WastewaterMockExam";
import Class4WastewaterMockExam from "./Class4WastewaterMockExam";
import WpiClass1WaterCollFlashcards from "./WpiClass1WaterCollFlashcards";
import WpiClass2WaterCollFlashcards from "./WpiClass2WaterCollFlashcards";
import WpiClass3WaterCollFlashcards from "./WpiClass3WaterCollFlashcards";
import WpiClass4WaterCollFlashcards from "./WpiClass4WaterCollFlashcards";
import WpiLanding from "./WpiLanding";
import PurchaseGate from "@/components/PurchaseGate";
import { readPricingSelection } from "@shared/funnelNavigation";
import { getCourseSeoPage, SITE_URL } from "@shared/seoCatalog";

const render = (component: React.ComponentType<any>, props = {}) => renderToStaticMarkup(createElement(component, props));
beforeEach(() => {
  state.search = ""; state.courseKey = "oit"; state.track = "water"; state.hasAccess = false;
  state.mockProps = undefined; state.flashcardProps = undefined; state.boundaryProps = undefined;
  state.structuredData = undefined; state.metadata = []; state.bankKeys = [];
  vi.stubGlobal("React", React);
  vi.stubGlobal("window", { location: { pathname: "/courses/oit", search: "" } });
});
afterEach(() => vi.unstubAllGlobals());

describe("course-detail pricing navigation", () => {
  it.each([
    ["class1-water", "", "ON", false, undefined],
    ["class4-ww", "province=AB&country=US&state=TX", "ON", false, undefined],
    ["wpi-class1-water", "", "BC", false, undefined],
    ["wpi-class2-wastewater", "province=AB", "AB", false, undefined],
    ["wpi-class1-water", "country=US&state=FL", "BC", true, "FL"],
    ["us-class1-water", "", "BC", true, undefined],
    ["us-class1-water-dist", "state=TX", "BC", true, "TX"],
    ["us-class1-water", "country=US&state=FL&email=private&next=bad", "BC", true, "FL"],
  ])("keeps exact %s product and valid jurisdiction for %s", (key, search, province, isUS, usState) => {
    state.courseKey = key as string; state.search = search as string;
    const html = render(SeoLandingPage);
    const courseNode = state.structuredData[0]["@graph"].find((node: any) => node["@type"] === "Course");
    const offerUrl = new URL(courseNode.offers.url);
    const href = `${offerUrl.pathname}${offerUrl.search}`;
    expect(html).toContain(`href="${href.replaceAll("&", "&amp;")}"`);
    expect(offerUrl.origin).toBe(SITE_URL);
    expect(readPricingSelection(offerUrl.search)).toEqual({ province, requestedProductKey: key });
    expect(offerUrl.searchParams.get("country")).toBe(isUS ? "US" : null);
    expect(offerUrl.searchParams.get("state")).toBe(usState ?? null);
    expect(offerUrl.searchParams.has("email")).toBe(false);
    expect(offerUrl.searchParams.has("next")).toBe(false);
    expect(courseNode.offers.price).toBe((getCourseSeoPage(key as string)!.priceCAD / 100).toFixed(0));
    expect(courseNode.offers.priceCurrency).toBe("CAD");
  });
});

it("shows each actual OIT mock format and both free course game links, not just the old demo", () => {
  const html = render(OitHub);
  expect(html).toContain("Water mock: 100 questions · 3 hours");
  expect(html).toContain("Wastewater mock: 50 questions · 1 hour");
  expect(html).toContain('href="/courses/oit/interactive"');
  expect(html).toContain('href="/courses/oit-ww/interactive"');
  expect(html).toContain("Play free Water OIT games");
  expect(html).toContain("Play free Wastewater OIT games");
  expect(html).not.toContain('href="/interactive-learning"');
  expect(html).not.toContain("Timed 100-question mock exam with module results");
  expect(html).toContain("CA$49");
  render(OITMockExam);
  expect(state.mockProps).toMatchObject({ examQuestions: 100, examDuration: 10800 });
  render(OITWastewaterMockExam);
  expect(state.mockProps).toMatchObject({ examQuestions: 50, examDuration: 3600 });
});

it("labels the Water OIT mock Ontario-only, hides the picker, and links separate wastewater without changing settings", () => {
  const html = render(OITMockExam);
  expect(html).toContain('href="/oit-ww-mock"');
  expect(state.bankKeys).toEqual(["oit"]);
  expect(state.mockProps).toMatchObject({
    title: "Ontario OIT Water Mock Exam", badge: "ONTARIO OPERATOR-IN-TRAINING · WATER",
    showProvinceSelector: false, infoLine: "650 questions · Ontario OIT Water",
    productKey: "oit", price: 49, examQuestions: 100, examDuration: 10800,
    passThreshold: 0.7, freeQuestionLimit: 30, practicePath: "/quiz", currentPath: "/oit-mock",
  });
  expect(state.mockProps.metaDescription).not.toMatch(/all Canadian|BC|Alberta|Wastewater/);
  expect(state.mockProps.moduleTargets).toEqual({
    Disinfection: 11, "Chemical Feed & Storage": 12, Hydraulics: 10, "Math & Calculations": 11,
    "Ontario Regulations": 11, "Pumping Systems": 11, "Water Treatment": 11,
    "Wastewater Treatment": 5, "Water Quality & Sampling": 11, "Health & Safety": 7,
  });
});

it.each([
  [1, Class1WastewaterMockExam, 99], [2, Class2WastewaterMockExam, 149],
  [3, Class3WastewaterMockExam, 249], [4, Class4WastewaterMockExam, 299],
])("keeps Ontario Class %s wastewater mock identity/settings with accurate intro", (level, component, price) => {
  render(component as React.ComponentType);
  expect(state.bankKeys).toEqual([`class${level}-wastewater`]);
  expect(state.mockProps).toMatchObject({
    infoLine: `650 questions · Ontario Class ${level} Wastewater Treatment`,
    productKey: `class${level}-ww`, examQuestions: 100, examDuration: 10800, passThreshold: 0.7, price,
    moduleTargets: { "Original module": 100 }, stream: "wastewater",
  });
});

it.each([
  ["wqa", "Timed WQA mock exam (100 questions, 3 hours)", WQAMockExam],
  ["class4-ww", "Timed Class 4 WW mock exam (100 questions, 3 hours)", Class4WastewaterMockExam],
])("describes %s actual three-hour mock in the default purchase gate", (key, expected, component) => {
  render(component as React.ComponentType);
  expect(state.mockProps).toMatchObject({ examQuestions: 100, examDuration: 10800 });
  const html = render(PurchaseGate, { examType: key, productKey: key, children: createElement("p", null, "Preview") });
  expect(html).toContain(expected);
  expect(html).not.toContain("2 hrs");
});

it.each([
  [1, "I", WpiClass1WaterCollFlashcards], [2, "II", WpiClass2WaterCollFlashcards],
  [3, "III", WpiClass3WaterCollFlashcards], [4, "IV", WpiClass4WaterCollFlashcards],
])("corrects Class %s Collection labels while retaining legacy route/product and bank keys", (level, roman, component) => {
  state.hasAccess = true;
  const html = render(component as React.ComponentType);
  expect(html).toContain(`Flashcards: WPI Class ${roman} Wastewater Collection`);
  expect(state.metadata[0].title).toBe(`WPI Class ${level} Wastewater Collection Flashcards`);
  expect(state.metadata[0].description).toContain(`Class ${level} Wastewater Collection`);
  expect(state.boundaryProps.examName).toBe(`WPI Class ${roman} Wastewater Collection`);
  expect(state.boundaryProps.backPath).toBe(`/wpi-class${level}-water-coll`);
  expect(state.flashcardProps).toMatchObject({ examType: `wpi-class${level}-water-coll`, backPath: `/wpi-class${level}-water-coll` });
  expect(state.bankKeys).toEqual([`wpi-class${level}-wastewater-coll`]);
});

it("shows the verified 1,000+ lower bound on all Collection cards without changing prices or routes", () => {
  state.track = "collection";
  const html = render(WpiLanding);
  const cards = [...html.matchAll(/<div class="wpi-class-card"[\s\S]*?(?=<div class="wpi-class-card"|<\/section>)/g)].map(match => match[0]);
  expect(cards).toHaveLength(4);
  for (const [index, price] of [149, 199, 249, 299].entries()) {
    expect(cards[index]).toContain("1,000+ questions");
    expect(cards[index]).toContain(`CA$${price}`);
    expect(cards[index]).toContain(`href="/wpi-class${index + 1}-water-coll"`);
  }
  expect(cards[3]).toContain("WPI-C4");
  expect(cards[3]).toContain("CA$299");
  expect(cards[3]).toContain('href="/wpi-class4-water-coll"');
  expect(cards[3]).not.toMatch(/503|504/);
});
