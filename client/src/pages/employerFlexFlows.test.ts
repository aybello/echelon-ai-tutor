import * as React from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTeamCourseOptions } from "../../../shared/courseRegistry";

const state = vi.hoisted(() => ({
  token: "a".repeat(64), email: "operator@employer.test" as string | null,
  invitation: undefined as any, invitationError: false, licences: [] as any[],
  overview: undefined as any, overviewError: false, summary: undefined as any,
  selectedLicenceId: null as number | null, seatCount: null as number | null,
  renderDialogs: false, buttons: [] as any[], queries: [] as any[], mutations: [] as any[],
}));
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, useState: (initial: unknown) => {
    const result = actual.useState(initial);
    if (initial === null && state.selectedLicenceId !== null) return [state.selectedLicenceId, result[1]];
    if (initial === 0 && state.seatCount !== null) return [state.seatCount, result[1]];
    return result;
  } };
});
vi.mock("wouter", () => ({
  Link: ({ children, ...props }: any) => createElement("a", props, children),
  useLocation: () => ["/team", vi.fn()], useSearch: () => "",
}));
vi.mock("@/_core/hooks/useLogout", () => ({ useLogout: () => ({ logout: vi.fn(), isPending: false }) }));
vi.mock("@/components/LandingNav", () => ({ default: () => null }));
vi.mock("@/components/FlexProgressDashboard", () => ({ FlexProgressDashboard: () => createElement("div", null, "Flex study report") }));
vi.mock("@/components/LearnerAssessmentDetails", () => ({ default: () => null, FlexLearnerDrilldowns: () => null }));
vi.mock("@/components/ExamOutcomesPanel", () => ({ default: () => null }));
vi.mock("@/components/ui/button", () => ({ Button: ({ children, asChild, ...props }: any) => {
  state.buttons.push({ children, ...props });
  return asChild ? children : createElement("button", props, children);
} }));
vi.mock("@/components/ui/dialog", () => {
  const block = ({ children }: any) => createElement("div", null, children);
  return { Dialog: ({ children }: any) => state.renderDialogs ? block({ children }) : null,
    useDialogComposition: () => ({ setComposing: vi.fn(), markCompositionEnd: vi.fn(), justEndedComposing: () => false }),
    DialogContent: block, DialogHeader: block, DialogTitle: block, DialogDescription: block, DialogFooter: block };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/trpc", () => ({ trpc: new Proxy({}, { get: (_target, namespace) => {
  if (namespace === "useUtils") return () => ({});
  return new Proxy({}, { get: (_target, procedure) => ({
    useQuery: (input: unknown, options: unknown) => {
      state.queries.push({ namespace, procedure, input, options });
      let data: unknown;
      let isError = false;
      if (namespace === "dashboardAuth") data = { email: state.email };
      if (namespace === "teamFlex" && procedure === "getInvitation") { data = state.invitation; isError = state.invitationError; }
      if (namespace === "teamFlex" && ["myLicences", "listLicences"].includes(String(procedure))) data = state.licences;
      if (namespace === "org" && procedure === "getOrgOverview") { data = state.overview; isError = state.overviewError; }
      if (namespace === "org" && ["listManagedOrganizations", "listMembers"].includes(String(procedure))) data = [];
      if (namespace === "orgIntel" && procedure === "getTeamReadinessSummary") data = state.summary;
      return { data, isLoading: false, isFetching: false, isError, error: isError ? { message: "Unable to load" } : null, refetch: vi.fn() };
    },
    useMutation: () => ({ mutate: (input: unknown) => state.mutations.push({ namespace, procedure, input }), isPending: false }),
  }) });
} }) }));

import CoursePassClaim from "./CoursePassClaim";
import OrgDashboard from "./OrgDashboard";
import { FlexLicencePanel } from "../components/FlexLicencePanel";

const assigned = (id = 11, status = "assigned") => ({
  id, status, courseKey: "class1-water", courseName: `Course for pass ${id}`,
  termMonths: 6, activationDeadline: new Date("2027-02-18T12:00:00Z"),
  accessEndsAt: null, activatedAt: null, reportingEndsAt: null, mockExamPath: "/class1-water/mock-exam",
});
const renderClaim = () => renderToStaticMarkup(createElement(CoursePassClaim));
const renderManager = () => renderToStaticMarkup(createElement(OrgDashboard));
const button = (label: string) => state.buttons.find(item => item.children === label);
const source = (file: string) => readFileSync(new URL(file, import.meta.url), "utf8");

beforeEach(() => {
  state.token = "a".repeat(64); state.email = "operator@employer.test";
  state.invitation = { licenceId: 12, courseName: "New invited course", termMonths: 3, activationDeadline: new Date("2027-03-18T12:00:00Z"), maskedEmail: "op***@employer.test" };
  state.invitationError = false; state.licences = []; state.selectedLicenceId = null; state.seatCount = null;
  state.renderDialogs = false; state.buttons = []; state.queries = []; state.mutations = []; state.summary = undefined; state.overviewError = false;
  state.overview = { orgId: 7, orgName: "Example municipality", province: "nova-scotia", status: "active",
    tier: "all-access", billingType: "stripe", stripeSubscriptionId: "sub_fixture", seatsTotal: 10,
    seatsAssigned: 2, seatsUsedThisTerm: 7, activeThisWeek: 1, avgReadiness: 45, onTrackCount: 0,
    allowedCourseKeys: ["wpi-class1-water"], termStart: new Date("2026-01-01T12:00:00Z"), termEnd: new Date("2027-01-01T12:00:00Z") };
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-19T12:00:00Z"));
  vi.stubGlobal("React", React);
  vi.stubGlobal("window", { location: { search: `?token=${state.token}` } });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("exact employer Course Pass invitation resolution", () => {
  it.each(["assigned", "active", "expired"])("never substitutes an unrelated %s pass", status => {
    state.licences = [assigned(11, status)];
    const html = renderClaim();
    expect(html).toContain("New invited course"); expect(html).not.toContain("Course for pass 11");
    expect(html).toContain("Claim Course Pass"); expect(html).not.toContain("Activate Course");
    expect(html).not.toContain('id="course-pass-picker"');
    button("Claim Course Pass").onClick();
    expect(state.mutations).toEqual([{ namespace: "teamFlex", procedure: "claimInvitation", input: { token: state.token } }]);
  });
  it("keeps Claim available for the exact invited row and uses its purchased term", () => {
    state.licences = [assigned(11, "expired"), assigned(12, "invited")];
    const html = renderClaim();
    expect(html).toContain("Course for pass 12"); expect(html).toContain("6-month access");
    expect(html).toContain("Claim Course Pass"); expect(html).not.toContain("Course for pass 11");
    expect(html).toContain(new Date("2027-02-18T12:00:00Z").toLocaleDateString());
  });
  it("activates only the exact assigned licence and shows its deadline", () => {
    state.licences = [assigned(11), assigned(12)];
    const html = renderClaim();
    expect(html).toContain("Activate by"); expect(html).toContain("6-month study period starts immediately and cannot be paused");
    expect(html).not.toContain("Claim Course Pass");
    button("Activate Course").onClick();
    expect(state.mutations[0]).toEqual({ namespace: "teamFlex", procedure: "activateLicence", input: { licenceId: 12 } });
  });
  it("requires an explicit selection for multiple passes without an invitation", () => {
    state.token = ""; state.invitation = undefined; state.licences = [assigned(11), assigned(12, "expired")];
    vi.stubGlobal("window", { location: { search: "" } });
    const html = renderClaim();
    expect(html).toContain('id="course-pass-picker"'); expect(html).not.toContain("Activation starts the clock");
    expect(html).not.toContain("Course Pass has ended");
    state.selectedLicenceId = 11;
    expect(renderClaim()).toContain("Activation starts the clock");
  });
  it("shows a picker even for one unrelated pass when a token cannot resolve", () => {
    state.invitation = undefined; state.invitationError = true; state.licences = [assigned()];
    expect(renderClaim()).toContain('id="course-pass-picker"');
    expect(renderClaim()).not.toContain("Activation starts the clock");
  });
  it("offers explicit recovery for a malformed token without claiming or auto-selecting", () => {
    state.invitation = undefined; state.licences = [assigned()];
    vi.stubGlobal("window", { location: { search: "?token=malformed" } });
    const html = renderClaim();
    expect(html).toContain('id="course-pass-picker"'); expect(html).toContain("This invitation is invalid");
    expect(html).not.toContain("Activation starts the clock"); expect(html).not.toContain("Claim Course Pass");
  });
  it("does not select another pass while a valid token lookup is unresolved", () => {
    state.invitation = undefined; state.licences = [assigned()];
    const html = renderClaim();
    expect(html).not.toContain('id="course-pass-picker"'); expect(html).not.toContain("Activation starts the clock");
  });
  it.each(["active", "expired"])("looks up retake eligibility only for the exact %s pass", status => {
    state.licences = [assigned(11, status), { ...assigned(12, status), accessEndsAt: new Date("2027-01-01T12:00:00Z") }];
    const html = renderClaim();
    expect(html).toContain("Course for pass 12"); expect(html).not.toContain("Course for pass 11");
    expect(html).not.toContain("Claim Course Pass");
    expect(state.queries.find(item => item.procedure === "getRetakeExtensionEligibility")?.input).toEqual({ licenceId: 12 });
  });
  it("does not add a picker for a single pass on the no-token inventory route", () => {
    state.invitation = undefined; state.token = ""; state.licences = [assigned()];
    vi.stubGlobal("window", { location: { search: "" } });
    const html = renderClaim();
    expect(html).not.toContain('id="course-pass-picker"'); expect(html).toContain("Activate Course");
  });
  it("disables activation after the actual deadline without changing the term", () => {
    state.licences = [{ ...assigned(12), activationDeadline: new Date("2026-11-18T12:00:00Z") }];
    expect(renderClaim()).toContain("Contact support to review available options");
    expect(button("Activate Course").disabled).toBe(true);
  });
  it("shows the actual invitation deadline before email verification", () => {
    state.email = null;
    expect(renderClaim()).toContain(new Date(state.invitation.activationDeadline).toLocaleDateString());
    expect(renderClaim()).toContain("Verify Email");
  });
});

describe("manager product terms and existing server contracts", () => {
  it("uses Nova Scotia WPI courses without Class IV distribution or collection", () => {
    const keys = getTeamCourseOptions("nova-scotia").map(item => item.key);
    expect(keys).toContain("wpi-class1-water"); expect(keys).toContain("wpi-class4-water");
    expect(keys).toContain("wpi-class3-water-coll");
    expect(keys).not.toContain("wpi-class4-water-dist"); expect(keys).not.toContain("wpi-class4-water-coll");
    expect(keys.every(key => key.startsWith("wpi-"))).toBe(true);
    expect(getTeamCourseOptions("ontario").map(item => item.key)).toContain("class1-water");
    expect(getTeamCourseOptions("western").map(item => item.key)).toContain("wpi-class4-water-dist");
    const manager = source("./OrgDashboard.tsx");
    expect(manager.match(/overview\.allowedCourseKeys\.includes\(opt\.key\)/g)).toHaveLength(2);
  });
  it("removes annual assumptions for Flex-only organizations and retains mixed Annual plus Flex", () => {
    state.overview = { ...state.overview, tier: "course-pass", billingType: "course-pass", seatsTotal: 0, stripeSubscriptionId: null };
    state.licences = [assigned()];
    const flex = renderManager();
    for (const text of ["Annual access", "Renews", "Licences Used This Term", "Annual licence term", "Annual term ends", "Assign Your First Seat"]) expect(flex).not.toContain(text);
    expect(flex).toContain("one-time purchase"); expect(flex).toContain("Course Pass reporting"); expect(flex).toContain("Activate by");
    state.overview = { ...state.overview, tier: "all-access", billingType: "invoice", seatsTotal: 10 };
    const mixed = renderManager();
    expect(mixed).toContain("Annual access"); expect(mixed).toContain("Licences Used This Term"); expect(mixed).toContain("Course Passes");
    expect(mixed).toContain("Nova Scotia (NSECC)");
  });
  it("keeps normal and recovery manager actions in employer support and team billing", () => {
    const normal = renderManager();
    expect(normal).not.toContain("billing=personal"); expect(normal).toContain("Team support");
    state.overviewError = true;
    const recovery = renderManager();
    expect(recovery).not.toContain("billing=personal"); expect(recovery).toContain("Contact team support");
    const manager = source("./OrgDashboard.tsx");
    expect(manager).toContain('billingPortal.mutate({ scope: "team", orgId: overview.orgId })');
    expect(manager).toContain('billingPortal.mutate({ ...orgInput, scope: "team" })');
  });
  it.each([4, 7, 9, 10, 10.5, 501])("disables unsupported seat quantity %s", count => {
    state.renderDialogs = true; state.seatCount = count; renderManager();
    expect(button("Add Seats").disabled).toBe(true);
    button("Add Seats").onClick(); expect(state.mutations).toEqual([]);
  });
  it("allows only a valid increase and explains support-only renewal reductions", () => {
    state.renderDialogs = true; state.seatCount = 11;
    const html = renderManager();
    expect(html).toContain('min="11"'); expect(html).toContain('max="500"');
    expect(html).toContain("does not schedule reductions"); expect(html).toContain("full contract year");
    expect(button("Add Seats").disabled).toBe(false); button("Add Seats").onClick();
    expect(state.mutations).toEqual([{ namespace: "stripe", procedure: "updateTeamSeats", input: { orgId: 7, seats: 11 } }]);
  });
  it("enforces the five-seat and used-licence floors", () => {
    state.renderDialogs = true; state.overview.seatsTotal = 2; state.overview.seatsUsedThisTerm = 3; state.seatCount = 4;
    expect(renderManager()).toContain('min="5"'); expect(button("Add Seats").disabled).toBe(true);
    state.buttons = []; state.overview.seatsUsedThisTerm = 8; state.seatCount = 7;
    expect(renderManager()).toContain('min="8"'); expect(button("Add Seats").disabled).toBe(true);
  });
  it("describes the composite estimate and exact risk conditions, including past exam dates", () => {
    state.summary = { seatsAssigned: 2, activationRate: 0, learningActivated: 0, diagnosticCompletionRate: 0, diagnosticCompleted: 0, activeThirtyDays: 0, mockParticipationRate: 0, mockParticipants: 0, totalQuestions: 0, accuracyChange: null, matchedLearnerCourses: 0, matchedPracticeAttempts: 0, examReadyCount: 1, atRiskCount: 1, inactiveCount: 0, avgReadiness: 45, topWeakTopics: [] };
    const html = renderManager();
    expect(html).toContain("Study estimate of 80 or higher"); expect(html).toContain("completed mock accuracy, attempt volume and recent activity");
    expect(html).toContain("below 50 with more than 10 practice attempts"); expect(html).toContain("21 days away or less (including past dates)");
    expect(html).toContain("practice accuracy below 70%"); expect(html).not.toContain("≥ 80% accuracy");
  });
  it("shows actual licence lifecycle dates and overdue support-only guidance", () => {
    state.licences = [{ ...assigned(11, "invited"), activationDeadline: new Date("2026-11-18T12:00:00Z") },
      { ...assigned(12, "active"), activatedAt: new Date("2026-09-01T12:00:00Z"), accessEndsAt: new Date("2027-03-01T12:00:00Z"), reportingEndsAt: new Date("2027-03-31T12:00:00Z") }];
    const html = renderToStaticMarkup(createElement(FlexLicencePanel, { orgId: 7 }));
    expect(html).toContain("Contact support to review available options"); expect(html).not.toContain("Reissue these passes");
    expect(html).toContain("Activated"); expect(html).toContain("Access ends"); expect(html).toContain("Reporting ends");
    expect(html).toContain(new Date("2027-03-31T12:00:00Z").toLocaleDateString());
    expect(state.buttons.find(item => Array.isArray(item.children) && item.children.includes("Resend"))?.disabled).toBe(true);
  });
  it("discloses the unchanged activation window before Flex checkout", () => {
    expect(source("../components/FlexOrderBuilder.tsx")).toContain("Activate each pass within 12 months of payment fulfilment. The purchased 3- or 6-month study term starts on activation.");
  });
  it("uses the shared navigation owner's employer claim-route contract", () => {
    expect(source("../components/SiteNav.tsx")).toContain('["/teams", "/team", "/course-pass/claim"].some');
  });
});
