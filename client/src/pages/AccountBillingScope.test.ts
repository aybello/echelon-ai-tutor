import * as React from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ search: "billing=personal", oauth: false, otp: "dual-owner@example.test" as string | null, manager: true, subscriptions: [] as any[], purchases: [] as string[], queryCalls: [] as any[] }));
vi.mock("wouter", () => ({ Link: ({ children, ...props }: { children: React.ReactNode; href: string }) => createElement("a", props, children), useSearch: () => state.search }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: state.oauth, logout: vi.fn() }) }));
vi.mock("@/hooks/usePageMeta", () => ({ usePageMeta: vi.fn() }));
vi.mock("@/components/SiteNav", () => ({ default: () => null }));
vi.mock("@/components/ExamDateTracker", () => ({ default: () => null }));
vi.mock("@/lib/trpc", () => ({
  trpc: new Proxy({}, { get: (_target, namespace) => new Proxy({}, { get: (_target, procedure) => ({
    useQuery: (_input: unknown, options: unknown) => {
      state.queryCalls.push({ namespace, procedure, options });
      let data: unknown;
      if (namespace === "dashboardAuth") data = { email: state.otp };
      if (namespace === "access") data = { isManager: state.manager, purchasedProductKeys: state.purchases, accessibleCourses: [{ courseKey: "class4-ww" }], activeSubscriptions: state.subscriptions };
      if (namespace === "stripe" && procedure === "getMyPurchases") data = { purchases: [], unlockedExamTypes: [] };
      if (namespace === "stripe" && String(procedure).includes("getMySubscriptions")) data = { subscriptions: state.subscriptions, unlockedExamTypes: ["class4-ww"] };
      if (namespace === "flashcard") data = { progress: {} };
      return { data, isFetching: false };
    },
    useMutation: () => ({ mutate: vi.fn(), isPending: false }),
  }) }) }),
}));
import Account from "./Account";
const accountSource = readFileSync(new URL("./Account.tsx", import.meta.url), "utf8");
const teamSource = readFileSync(new URL("./OrgDashboard.tsx", import.meta.url), "utf8");
const render = () => renderToStaticMarkup(createElement(Account));

beforeEach(() => {
  state.search = "billing=personal"; state.oauth = false; state.otp = "dual-owner@example.test"; state.manager = true;
  state.purchases = []; state.queryCalls = [];
  state.subscriptions = [
    { id: 1, tier: "class1", province: "ontario", orgId: null, currentPeriodEnd: new Date("2030-01-01") },
    { id: 2, tier: "all-access", province: "ontario", orgId: 41, currentPeriodEnd: new Date("2030-01-01") },
  ];
  vi.stubGlobal("React", React);
  vi.stubGlobal("window", { location: { search: "?billing=personal", replace: vi.fn() } });
  vi.stubGlobal("localStorage", { getItem: () => "dual-owner@example.test", setItem: vi.fn() });
});
afterEach(() => vi.unstubAllGlobals());

describe("personal billing UI without changing team membership or terms", () => {
  it("renders the explicit personal view for a verified OTP manager", () => {
    const html = render();
    expect(html).toContain("Individual Billing &amp; Passes");
    expect(html).toContain("nothing is transferred");
    expect(html).toContain('href="/team"');
    expect(html).toContain("Manage Subscription");
    expect(html).toContain("Active Individual Subscriptions");
    expect(html).not.toContain("Opening your team dashboard");
  });
  it("shows direct personal subscriptions and excludes the organization's all-access subscription", () => {
    const html = render();
    expect(html).toContain("Class 1 All-Access");
    expect(html).not.toContain("All-Access Pass");
    expect(html).not.toContain("Class 4 Wastewater Treatment Pass");
    expect(html.match(/Manage Subscription →/g)).toHaveLength(1);
  });
  it("still shows personal pass purchases without transferring team access", () => {
    state.purchases = ["class2-water"];
    expect(render()).toContain("Class 2 Water Treatment Pass");
    expect(render()).not.toContain("Class 4 Wastewater Treatment Pass");
  });
  it("makes the personal empty state distinct from missing Team access", () => {
    state.subscriptions = [];
    const html = render();
    expect(html).toContain("No active individual passes or subscriptions");
    expect(html).toContain("Team licences and billing are separate");
    expect(html).not.toContain("Class 4 Wastewater Treatment Pass");
  });
  it("ordinary manager Account visits still take the team redirect path", () => {
    state.search = "";
    expect(render()).toContain("Opening your team dashboard");
    expect(render()).not.toContain("Manage Subscription");
  });
  it.each(["billing=Personal", "billing=personal&billing=team", "billing=personal&orgId=41"])("invalid query %s cannot bypass the manager route", search => {
    state.search = search;
    expect(render()).toContain("Opening your team dashboard");
  });
  it("the personal query never substitutes for verified authentication", () => {
    state.oauth = false; state.otp = null; state.manager = false;
    const html = render();
    expect(html).toContain("Sign In with Code");
    expect(html).not.toContain("Manage Subscription");
  });
  it("OAuth accounts do not enable the secondary OTP subscription query", () => {
    state.oauth = true;
    expect(render()).toContain("Manage Subscription");
    expect(state.queryCalls.find(call => call.procedure === "getMySubscriptionsForEmailSession").options.enabled).toBe(false);
  });
  it("Account always sends personal scope and validates the redirect through the helper", () => {
    expect(accountSource).toContain('createBillingPortal.mutate(\n      { scope: "personal" }');
    expect(accountSource).toContain("const managerDestination = managerAccountDestination(search)");
    expect(accountSource).toContain("if (!isManager || managerDestination === null) return");
    expect(accountSource).toContain("if (isManager && !isPersonalBilling)");
    expect(accountSource).toContain('const rawNext = isPersonalBilling ? "/account?billing=personal"');
  });
  it("Team exposes an accessible explicit personal link in normal and recovery states", () => {
    expect(teamSource.match(/href="\/account\?billing=personal"/g)).toHaveLength(2);
    const link = teamSource.split('<Link href="/account?billing=personal"')[2].split("</Link>")[0];
    expect(link).toContain("Individual billing &amp; passes");
    expect(link).not.toContain("hidden");
  });
  it("normal and recovery Team billing calls stay explicitly team-scoped", () => {
    expect(teamSource).toContain('billingPortal.mutate({ scope: "team", orgId: overview.orgId })');
    expect(teamSource).toContain('billingPortal.mutate({ ...orgInput, scope: "team" })');
    expect(teamSource).not.toContain("billingPortal.mutate(orgInput)");
  });
});
