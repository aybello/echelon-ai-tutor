import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAllCourses, getCourseByKey } from "@shared/courseRegistry";
import { managerAccountDestination } from "@/lib/managerAccountRoute";
import { otpSuccessDestination, purchasedCourseNavigation, sanitizeAccountNext } from "./accountAccess";

const state = vi.hoisted(() => ({
  slots: [] as unknown[], cursor: 0, search: "", oauth: false, otp: null as string | null,
  courses: [] as string[], manager: false, subscriptions: [] as any[],
  options: {} as Record<string, any>, serverLogout: vi.fn(), toastError: vi.fn(),
  mutations: {} as Record<string, ReturnType<typeof vi.fn>>,
  notify: vi.fn(), queryClient: { cancelQueries: vi.fn(), clear: vi.fn() },
}));
vi.mock("react", async importOriginal => ({
  ...await importOriginal<typeof import("react")>(),
  useState: (initial: unknown) => {
    const index = state.cursor++;
    if (!(index in state.slots)) state.slots[index] = typeof initial === "function" ? initial() : initial;
    return [state.slots[index], (value: unknown) => {
      state.slots[index] = typeof value === "function" ? value(state.slots[index]) : value;
    }];
  },
  useEffect: vi.fn(), useLayoutEffect: vi.fn(), useRef: (initial: unknown) => ({ current: initial }),
}));
vi.mock("wouter", () => ({
  Link: ({ children, ...props }: any) => React.createElement("a", props, children),
  useSearch: () => state.search,
}));
vi.mock("@/_core/hooks/useAuth", async () => {
  const { useLogout } = await import("@/_core/hooks/useLogout");
  return { useAuth: () => ({ isAuthenticated: state.oauth, logout: useLogout().logout }) };
});
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => state.queryClient }));
vi.mock("@shared/identityChange", () => ({
  IDENTITY_CHANGE_EVENT_KEY: "echelon.identity-change.event", notifyIdentityChange: () => state.notify(),
}));
vi.mock("sonner", () => ({ toast: { error: (...args: unknown[]) => state.toastError(...args) } }));
vi.mock("@/hooks/usePageMeta", () => ({ usePageMeta: vi.fn() }));
vi.mock("@/components/SiteNav", () => ({ default: () => null }));
vi.mock("@/components/LandingNav", () => ({ default: () => null }));
vi.mock("@/components/ExamDateTracker", () => ({ default: () => null }));
vi.mock("@/components/GamesPassButton", () => ({ default: () => null }));
vi.mock("@/components/PurchaseExamDatePrompt", () => ({ default: () => null }));
vi.mock("@/lib/googleAds", () => ({ adsMeasurement: () => null }));
vi.mock("../../../server/_core/env", () => ({ ENV: { isProduction: false } }));
vi.mock("../../../server/_core/access", () => ({ normalizeEmail: (email: string) => email.trim().toLowerCase() }));
vi.mock("@/lib/trpc", () => ({
  trpc: new Proxy({}, { get: (_target, namespace) => new Proxy({}, { get: (_target, procedure) => ({
    useQuery: () => {
      let data: unknown;
      if (namespace === "dashboardAuth") data = { email: state.otp };
      if (namespace === "access") data = { isManager: state.manager, accessibleCourses: state.courses.map(courseKey => ({ courseKey })), purchasedProductKeys: state.courses };
      if (namespace === "stripe" && procedure === "getMyPurchases") data = { purchases: [], unlockedExamTypes: state.courses };
      if (namespace === "stripe" && String(procedure).includes("getMySubscriptions")) data = { subscriptions: state.subscriptions, unlockedExamTypes: [] };
      if (namespace === "flashcard") data = { progress: {} };
      return { data, isFetching: false };
    },
    useMutation: (options: unknown) => {
      const key = `${String(namespace)}.${String(procedure)}`;
      state.options[key] = options;
      const mutate = state.mutations[key] ??= vi.fn();
      return { mutate, mutateAsync: state.serverLogout, isPending: false };
    },
  }) }) }),
}));

import Account from "./Account";
import OtpLogin from "./OtpLogin";
import PurchaseSuccess from "./PurchaseSuccess";
import { clearIdentityCookies } from "../../../server/_core/logout";
import { COOKIE_NAME } from "@shared/const";

function storage(initial: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(initial));
  return {
    get length() { return values.size; }, key: index => [...values.keys()][index] ?? null,
    getItem: key => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); },
    removeItem: key => { values.delete(key); }, clear: () => values.clear(),
  };
}
function render(page: () => React.ReactElement) {
  state.cursor = 0;
  return page();
}
function html(page: () => React.ReactElement) { return renderToStaticMarkup(render(page)); }
function elements(tree: React.ReactNode): React.ReactElement<any>[] {
  if (Array.isArray(tree)) return tree.flatMap(elements);
  if (!React.isValidElement<{ children?: React.ReactNode }>(tree)) return [];
  return [tree, ...elements(tree.props.children)];
}
const receipt = (overrides = {}) => ({
  paid: true, productKey: "class3-water-dist", email: "learner@example.test", requiresSignIn: true,
  accessExpiresAt: new Date("2030-01-01"), fulfillmentPending: false, ...overrides,
});
function verifiedPurchase(overrides = {}) {
  render(PurchaseSuccess);
  state.options["stripe.verifySession"].onSuccess(receipt(overrides));
  return html(PurchaseSuccess);
}

beforeEach(() => {
  vi.resetAllMocks(); vi.useFakeTimers();
  state.slots = []; state.cursor = 0; state.search = ""; state.oauth = false; state.otp = null;
  state.courses = []; state.manager = false; state.subscriptions = []; state.options = {}; state.mutations = {};
  const local = storage({ echelon_trial_email: "learner@example.test", echelon_access_token: "old", theme: "light" });
  const session = storage({ "echelon.session": "old" });
  vi.stubGlobal("React", React); vi.stubGlobal("localStorage", local);
  vi.stubGlobal("window", { localStorage: local, sessionStorage: session, location: {
    search: "?session_id=cs_fixture&product=oit", href: "", replace: vi.fn(), assign: vi.fn(),
  } });
  state.serverLogout.mockResolvedValue({ success: true });
  state.queryClient.cancelQueries.mockResolvedValue(undefined);
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("canonical purchased-course destinations", () => {
  it.each([1, 2, 3, 4].flatMap(level => [`class${level}-water-dist`, `class${level}-wastewater-coll`]))("uses the registry paths and label for %s", key => {
    const course = getCourseByKey(key)!;
    const navigation = purchasedCourseNavigation(key)!;
    expect(navigation.courseKey).toBe(key);
    expect(navigation.links).toEqual([
      { label: `${course.displayName} — Practice Quiz`, path: course.quizPath },
      { label: `${course.displayName} — Mock Exam`, path: course.mockExamPath },
    ]);
    expect(navigation.links.every(link => link.path !== "/quiz")).toBe(true);
  });
  it("keeps every canonical course destination in sync without granting access", () => {
    for (const course of getAllCourses()) {
      const navigation = purchasedCourseNavigation(course.productKey);
      expect(navigation?.links[0].path).toBe(course.quizPath);
      expect(navigation?.links[1].path).toBe(course.mockExamPath);
    }
    for (const unknown of ["", "not-a-product", "__proto__", "class1", "bundle-water"]) {
      expect(purchasedCourseNavigation(unknown)).toBeNull();
    }
  });
  it("uses the verified product, not the URL hint, and preserves each OTP course next", () => {
    const markup = verifiedPurchase();
    expect(markup).toContain('href="/login/otp?next=%2Fclass3-water-dist"');
    expect(markup).toContain('href="/login/otp?next=%2Fclass3-water-dist-mock"');
    expect(markup).toContain('href="/activate/class3-water-dist"');
    expect(markup).toContain("Class 3 Water Distribution and Supply");
    expect(markup).not.toContain('next=%2Fquiz');
    state.options["stripe.verifySession"].onError();
    expect(html(PurchaseSuccess)).toContain("Payment Successful!");
    expect(html(PurchaseSuccess)).toContain("%2Fclass3-water-dist");
  });
  it("opens verified courses directly when already signed in", () => {
    const markup = verifiedPurchase({ requiresSignIn: false, productKey: "class2-wastewater-coll" });
    expect(markup).toContain('href="/class2-wastewater-coll"');
    expect(markup).toContain('href="/class2-wastewater-coll-mock"');
  });
  it.each(["", "unknown-product"])("falls back to account, never OIT or setup, for %s", productKey => {
    const markup = verifiedPurchase({ productKey });
    expect(markup).toContain('href="/login/otp?next=%2Faccount"');
    expect(markup).toContain("contact support");
    expect(markup).not.toContain("/activate/");
    expect(markup).not.toContain("%2Fquiz");
  });
  it("keeps pending fulfillment from presenting course access or study setup", () => {
    const markup = verifiedPurchase({ fulfillmentPending: true });
    expect(markup).toContain("Your payment is confirmed");
    expect(markup).not.toContain("/activate/");
    expect(markup).not.toContain("%2Fclass3-water-dist");
  });
});

describe("verified OTP destinations and neutral inbox instructions", () => {
  it.each(["/recruitment/11111111-1111-4111-8111-111111111111", "/account", "/recruitment/not-an-id"])(
    "binds canonical recruitment destination only through request, verification and resend (%s)", next => {
      window.location.search = `?email=applicant%40example.test&next=${encodeURIComponent(next)}`;
      let tree = render(OtpLogin);
      elements(tree).find(element => element.type === "form")!.props.onSubmit({ preventDefault: vi.fn() });
      const scope = next.endsWith("11111111-1111-4111-8111-111111111111") ? { assignmentId: "11111111-1111-4111-8111-111111111111" } : {};
      expect(state.mutations["emailOtp.requestOtp"]).toHaveBeenLastCalledWith({ email: "applicant@example.test", ...scope });
      state.options["emailOtp.requestOtp"].onSuccess({ sent: true });
      tree = render(OtpLogin);
      const pasteTarget = elements(tree).find(element => element.props.onPaste)!;
      pasteTarget.props.onPaste({ preventDefault: vi.fn(), clipboardData: { getData: () => "314159" } });
      expect(state.mutations["emailOtp.verifyOtp"]).toHaveBeenLastCalledWith({ email: "applicant@example.test", code: "314159", ...scope });
      tree = render(OtpLogin);
      elements(tree).find(element => element.type === "form")!.props.onSubmit({ preventDefault: vi.fn() });
      expect(state.mutations["emailOtp.verifyOtp"]).toHaveBeenLastCalledWith({ email: "applicant@example.test", code: "314159", ...scope });
      elements(tree).find(element => element.type === "button" && String(element.props.children).startsWith("Resend"))!.props.onClick();
      expect(state.mutations["emailOtp.requestOtp"]).toHaveBeenLastCalledWith({ email: "applicant@example.test", ...scope });
    },
  );

  it("defaults learners to account and managers to team while keeping explicit destinations", () => {
    expect(otpSuccessDestination("", false)).toBe("/account");
    expect(otpSuccessDestination("", true)).toBe("/team");
    for (const next of ["/class4-water-dist", "/class2-wastewater-coll-mock", "/team/billing", "/account?billing=personal"]) {
      expect(otpSuccessDestination(next, false)).toBe(next);
      expect(otpSuccessDestination(next, true)).toBe(next);
    }
    expect(managerAccountDestination("next=%2Fteam%2Fbilling")).toBe("/team/billing");
    expect(managerAccountDestination("billing=personal")).toBeNull();
  });
  it.each(["https://example.test", "//example.test", "/\\example.test", "/%5cexample.test", "/%2fexample.test", "/\n/other", "/%0d%0aother", "/bad%", "/javascript:bad"])("rejects unsafe next %j", next => {
    expect(sanitizeAccountNext(next)).toBe("");
    expect(otpSuccessDestination(next, false)).toBe("/account");
  });
  it.each([
    ["", false, "/account", "Go to My Account"],
    ["", true, "/team", "Go to Team Dashboard"],
    ["/class2-wastewater-coll", false, "/class2-wastewater-coll", "Continue"],
    ["/team/billing", true, "/team/billing", "Go to Team Dashboard"],
    ["/account?billing=personal", true, "/account?billing=personal", "Go to My Account"],
  ] as const)("uses the same hard destination for timer and success action (%s, manager %s)", (next, isManager, destination, label) => {
    window.location.search = `?next=${encodeURIComponent(next)}`;
    render(OtpLogin);
    state.options["emailOtp.verifyOtp"].onSuccess({ valid: true, isManager, email: "learner@example.test", examTypes: [] });
    const markup = html(OtpLogin);
    expect(markup).toContain(`href="${destination.replaceAll("&", "&amp;")}"`);
    expect(markup).toContain(label);
    vi.advanceTimersByTime(2500);
    expect(window.location.assign).toHaveBeenCalledWith(destination);
  });
  it("uses purchase/invitation email and never promises delivery for an unknown account", () => {
    const entry = html(OtpLogin);
    expect(entry).toContain("email used at checkout or invited by your team");
    expect(entry).toContain("If it matches an eligible account");
    expect(entry).not.toContain("instantly");
    state.options["emailOtp.requestOtp"].onSuccess({ sent: true });
    const code = html(OtpLogin);
    expect(code).toContain("Check your inbox for a six-digit sign-in code");
    expect(code).toContain("If no code arrives");
    expect(code).not.toContain("We sent");
  });
  it("Account forwards a safe explicit course next through OTP", () => {
    state.search = "?next=%2Fclass4-water-dist";
    const form = elements(render(Account)).find(element => element.type === "form")!;
    form.props.onSubmit({ preventDefault: vi.fn() });
    expect(window.location.href).toBe("/login/otp?email=learner%40example.test&next=%2Fclass4-water-dist");
  });
});

describe("account switching reuses the existing complete logout", () => {
  it.each(["oauth", "email"] as const)("clears %s identity from both active and empty account switch buttons", async identity => {
    for (const active of [false, true]) {
      state.slots = []; state.cursor = 0;
      state.oauth = identity === "oauth"; state.otp = identity === "email" ? "learner@example.test" : null;
      state.courses = active ? ["class2-water"] : [];
      localStorage.setItem("echelon_subscription_email", "learner@example.test");
      localStorage.setItem("echelon_access_token", "old");
      window.sessionStorage.setItem("echelon.session", "old");
      const button = elements(render(Account)).find(element => element.type === "button" && element.props.children === "Sign out and use a different email")!;
      expect(button).toBeTruthy();
      await button.props.onClick();
      expect(state.serverLogout).toHaveBeenCalled();
      expect(state.queryClient.cancelQueries).toHaveBeenCalled();
      expect(state.queryClient.clear).toHaveBeenCalled();
      expect(localStorage.getItem("echelon_subscription_email")).toBeNull();
      expect(localStorage.getItem("echelon_access_token")).toBeNull();
      expect(window.sessionStorage.getItem("echelon.session")).toBeNull();
      expect(localStorage.getItem("theme")).toBe("light");
      expect(window.location.replace).toHaveBeenCalledWith("/account");
      state.oauth = false; state.otp = null; state.slots = [];
      expect(html(Account)).toContain("Sign In with Code");
    }
  });
  it("does not claim to switch email when server logout fails", async () => {
    state.otp = "learner@example.test";
    state.serverLogout.mockRejectedValue(Error("offline"));
    const button = elements(render(Account)).find(element => element.type === "button" && element.props.children === "Sign out and use a different email")!;
    await button.props.onClick();
    expect(state.toastError).toHaveBeenCalled();
    expect(state.queryClient.clear).not.toHaveBeenCalled();
    expect(localStorage.getItem("echelon_access_token")).toBe("old");
    expect(window.location.replace).not.toHaveBeenCalled();
  });
  it("the unchanged logout endpoint clears OAuth and verified-email cookies", () => {
    const clearCookie = vi.fn();
    clearIdentityCookies({ protocol: "https", headers: {} } as any, { clearCookie } as any);
    expect(clearCookie).toHaveBeenCalledWith(COOKIE_NAME, expect.objectContaining({ path: "/", secure: true }));
    expect(clearCookie).toHaveBeenCalledWith("echelon_dashboard_session", { path: "/" });
    const source = readFileSync(new URL("../../../server/routers.ts", import.meta.url), "utf8");
    expect(source).toMatch(/logout: publicProcedure\.mutation\([\s\S]*?clearIdentityCookies\(ctx\.req, ctx\.res\)/);
  });
  it("describes inactive access accurately and labels Ontario without EOCP", () => {
    state.otp = "learner@example.test";
    expect(html(Account)).toContain("No active passes or subscriptions");
    expect(html(Account)).toContain("Access may have expired or become inactive");
    expect(html(Account)).not.toContain("No purchases found");
    state.courses = ["class2-water"];
    state.subscriptions = [{ id: 1, orgId: null, tier: "class1", province: "ontario", currentPeriodEnd: new Date("2030-01-01") }];
    expect(html(Account)).toContain("Ontario");
    expect(html(Account)).not.toContain("EOCP");
  });
});
