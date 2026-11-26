import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Actual dashboard/child callbacks, with hook state and mutation capture only.
// The child store follows React's key identity; no server, email, or DB is used.
const harness = vi.hoisted(() => ({
  dashboard: [] as any[], child: [] as any[], active: [] as any[],
  cursor: 0, childKey: undefined as string | null | undefined, mutations: [] as any[],
}));
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState: (initial: any) => {
    const store = harness.active;
    const index = harness.cursor++;
    if (!(index in store)) store[index] = typeof initial === "function" ? initial() : initial;
    return [store[index], (value: any) => {
      store[index] = typeof value === "function" ? value(store[index]) : value;
    }];
  },
  useRef: (initial: any) => {
    const index = harness.cursor++;
    return harness.active[index] ??= { current: initial };
  },
  useEffect: vi.fn(),
  useMemo: (factory: any) => factory(),
}));
vi.mock("wouter", () => ({ Link: "fixture-link", useLocation: () => ["/team", vi.fn()], useSearch: () => "" }));
vi.mock("@/_core/hooks/useLogout", () => ({ useLogout: () => ({ logout: vi.fn(), isPending: false }) }));
vi.mock("@/components/ui/select", () => ({
  Select: "fixture-select", SelectContent: "fixture-select-content", SelectItem: "fixture-select-item",
  SelectTrigger: "fixture-select-trigger", SelectValue: "fixture-select-value",
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));
vi.mock("@/lib/trpc", () => ({ trpc: new Proxy({}, { get: (_target, namespace) => {
  if (namespace === "useUtils") return () => ({});
  return new Proxy({}, { get: (_target, procedure) => ({
    useQuery: (input: any) => {
      const orgId = input?.orgId ?? 7;
      let data: any;
      if (procedure === "listManagedOrganizations") data = [
        { id: 7, name: "Synthetic A", status: "active" }, { id: 8, name: "Synthetic B", status: "active" },
      ];
      if (procedure === "getOrgOverview") data = {
        orgId, orgName: orgId === 8 ? "Synthetic B" : "Synthetic A", province: "ontario",
        tier: "all-access", billingType: "stripe", stripeSubscriptionId: "synthetic-subscription",
        status: "active", seatsTotal: 10, seatsAssigned: 1, seatsUsedThisTerm: 1,
        termEnd: new Date("2030-01-01"), termStart: new Date("2026-01-01"),
        activeThisWeek: 0, avgReadiness: 0, onTrackCount: 0,
      };
      if (procedure === "listMembers") data = [{
        id: orgId * 10, email: "shared-operator@echelon.test", name: "Synthetic operator",
        status: "assigned", operatorStatus: "not_started", accuracy: null,
        courseKey: orgId === 8 ? "class1-water" : "class2-water",
      }];
      if (procedure === "listLicences") data = [{
        id: orgId * 10, courseKey: "class1-water", termMonths: 3, status: "unused",
        activationDeadline: new Date("2030-01-01"),
      }];
      return { data, isLoading: false, isFetching: false, isError: false, error: null, refetch: vi.fn() };
    },
    useMutation: () => {
      const store = harness.active;
      const index = harness.cursor++;
      const mutation = store[index] ??= { data: undefined };
      return {
        data: mutation.data, isPending: false, reset: () => { mutation.data = undefined; },
        mutate: (input: any) => {
          harness.mutations.push({ namespace, procedure, input });
          if (procedure === "previewBulkOnboarding") mutation.data = {
            valid: true, requested: input.rows.length, rows: [], inventory: [],
          };
        },
      };
    },
  }) });
} }) }));

import OrgDashboard from "./OrgDashboard";
import { FlexLicencePanel } from "@/components/FlexLicencePanel";
import { Dialog } from "@/components/ui/dialog";

function elements(tree: any): any[] {
  if (Array.isArray(tree)) return tree.flatMap(elements);
  if (!React.isValidElement(tree)) return [];
  return [tree, ...elements((tree as any).props.children)];
}
function text(tree: any): string {
  if (Array.isArray(tree)) return tree.map(text).join("");
  if (React.isValidElement(tree)) return text((tree as any).props.children);
  return typeof tree === "string" ? tree : "";
}
function renderDashboard() {
  harness.active = harness.dashboard;
  harness.cursor = 0;
  return OrgDashboard();
}
function renderFlex(tree: any) {
  const panel = elements(tree).find(element => element.type === FlexLicencePanel);
  expect(panel).toBeTruthy();
  if (panel.key !== harness.childKey) {
    harness.child = [];
    harness.childKey = panel.key;
  }
  harness.active = harness.child;
  harness.cursor = 0;
  return FlexLicencePanel(panel.props);
}
function action(tree: any, label: string) {
  const found = elements(tree).find(element => element.props.onClick && text(element.props.children) === label);
  expect(found, `callback ${label}`).toBeTruthy();
  return found;
}
function dialog(tree: any, title: string) {
  const found = elements(tree).find(element => element.type === Dialog && text(element).includes(title));
  expect(found, `dialog ${title}`).toBeTruthy();
  return found;
}
function changeOrg(tree: any, id: number) {
  elements(tree).find(element => element.type === "fixture-select").props.onValueChange(String(id));
  return renderDashboard();
}
function startA() { return changeOrg(renderDashboard(), 7); }
function input(tree: any, predicate: (props: any) => boolean, value: string) {
  const field = elements(tree).find(element => element.props.onChange && predicate(element.props));
  expect(field).toBeTruthy();
  field.props.onChange({ target: { value } });
}
function openAssignment(tree: any) {
  dialog(tree, "Add Operator").props.onOpenChange(true);
  return renderDashboard();
}
function selectCourse(tree: any) {
  elements(tree).find(element => element.props.id === "assign-course-class1-water").props.onCheckedChange(true);
}
beforeEach(() => {
  harness.dashboard = []; harness.child = []; harness.active = []; harness.cursor = 0;
  harness.childKey = undefined; harness.mutations = [];
  vi.stubGlobal("React", React);
});
afterEach(() => vi.unstubAllGlobals());

describe("organization-local pending forms", () => {
  it("discards A's inline draft and only saves B after a fresh edit", () => {
    let tree = startA();
    elements(tree).find(element => element.props["aria-label"] === "Edit courses for Synthetic operator").props.onClick();
    tree = renderDashboard();
    expect(action(tree, "Save")).toBeTruthy();
    tree = changeOrg(tree, 8);
    expect(elements(tree).some(element => element.props.onClick && text(element.props.children) === "Save")).toBe(false);
    expect(harness.mutations).toEqual([]);
    elements(tree).find(element => element.props["aria-label"] === "Edit courses for Synthetic operator").props.onClick();
    tree = renderDashboard(); action(tree, "Save").props.onClick();
    expect(harness.mutations).toEqual([{ namespace: "org", procedure: "updateSeatCourse", input: {
      orgId: 8, email: "shared-operator@echelon.test", courseKeys: ["class1-water"],
    } }]);
  });

  it("closes and clears the single assignment draft on switching", () => {
    let tree = openAssignment(startA());
    input(tree, props => props.type === "email", "a-cohort@echelon.test");
    input(tree, props => props.placeholder === "e.g. Sample Learner 3", "A learner");
    selectCourse(tree); tree = renderDashboard();
    expect(dialog(tree, "Add Operator").props.open).toBe(true);
    tree = changeOrg(tree, 8);
    expect(dialog(tree, "Add Operator").props.open).toBe(false);
    tree = openAssignment(tree);
    expect(elements(dialog(tree, "Add Operator")).filter(element => element.props.onChange).map(element => element.props.value)).toEqual(["", ""]);
    expect(elements(tree).find(element => element.props.id === "assign-course-class1-water").props.checked).toBe(false);
    action(dialog(tree, "Add Operator"), "Add Operator").props.onClick();
    expect(harness.mutations).toEqual([]);
  });

  it("clears the annual bulk cohort, course selection, and bulk mode", () => {
    let tree = openAssignment(startA()); action(tree, "Bulk (paste list)").props.onClick();
    tree = renderDashboard();
    input(tree, props => props.rows === 6, "a-cohort@echelon.test"); selectCourse(tree);
    tree = changeOrg(renderDashboard(), 8);
    expect(dialog(tree, "Add Operator").props.open).toBe(false);
    tree = openAssignment(tree); action(tree, "Bulk (paste list)").props.onClick();
    tree = renderDashboard();
    expect(elements(tree).find(element => element.props.rows === 6).props.value).toBe("");
    expect(elements(tree).find(element => element.props.id === "assign-course-class1-water").props.checked).toBe(false);
    action(dialog(tree, "Add Operator"), "Add Operator").props.onClick();
    expect(harness.mutations).toEqual([]);
  });

  it("disarms revoke confirmation instead of retargeting the shared email", () => {
    let tree = startA(); action(tree, "Remove access").props.onClick(); tree = renderDashboard();
    expect(dialog(tree, "Revoke Access").props.open).toBe(true);
    tree = changeOrg(tree, 8);
    expect(dialog(tree, "Revoke Access").props.open).toBe(false);
    action(dialog(tree, "Revoke Access"), "Revoke Access").props.onClick();
    expect(harness.mutations).toEqual([]);
  });

  it("disarms and resets the pending exam outcome", () => {
    let tree = startA(); action(tree, "Record result").props.onClick(); tree = renderDashboard();
    action(tree, "Failed").props.onClick(); input(tree, props => props.type === "date", "2026-11-01");
    tree = changeOrg(renderDashboard(), 8);
    expect(dialog(tree, "Record Exam Result").props.open).toBe(false);
    expect(elements(tree).find(element => element.props.type === "date").props.value).toBe("");
    action(tree, "Save Result").props.onClick(); expect(harness.mutations).toEqual([]);
    action(tree, "Record result").props.onClick(); tree = renderDashboard(); action(tree, "Save Result").props.onClick();
    expect(harness.mutations).toEqual([{ namespace: "org", procedure: "recordExamOutcome", input: {
      orgId: 8, memberEmail: "shared-operator@echelon.test", courseKey: "class1-water", result: "passed", examDate: undefined,
    } }]);
  });

  it("closes the pending annual seat purchase and resets its quantity", () => {
    let tree = startA(); action(tree, "Add Annual Seats").props.onClick(); tree = renderDashboard();
    input(tree, props => props.type === "number", "15"); tree = changeOrg(renderDashboard(), 8);
    expect(dialog(tree, "Add Annual Seats").props.open).toBe(false);
    expect(elements(tree).find(element => element.props.type === "number").props.value).toBe(0);
    expect(action(tree, "Add Seats").props.disabled).toBe(true);
    action(tree, "Add Seats").props.onClick(); expect(harness.mutations).toEqual([]);
  });

  it("preserves a draft when selecting the already selected organization", () => {
    let tree = startA();
    elements(tree).find(element => element.props["aria-label"] === "Edit courses for Synthetic operator").props.onClick();
    tree = changeOrg(renderDashboard(), 7); action(tree, "Save").props.onClick();
    expect(harness.mutations).toEqual([{ namespace: "org", procedure: "updateSeatCourse", input: {
      orgId: 7, email: "shared-operator@echelon.test", courseKeys: ["class2-water"],
    } }]);
  });

  it("remounts the real Flex panel, clearing the validated A cohort before B", () => {
    let dashboard = startA(); let tree = renderFlex(dashboard);
    action(tree, "Bulk onboard").props.onClick(); tree = renderFlex(dashboard);
    input(tree, props => props.rows === 4, "a-cohort@echelon.test,class1-water");
    tree = renderFlex(dashboard); action(tree, "Import pasted rows").props.onClick();
    tree = renderFlex(dashboard); action(tree, "Validate cohort").props.onClick();
    tree = renderFlex(dashboard); expect(action(tree, "Send 1 invitations").props.disabled).toBe(false);
    expect(harness.mutations).toHaveLength(1);
    expect(harness.mutations[0]).toMatchObject({ namespace: "teamFlex", procedure: "previewBulkOnboarding", input: { orgId: 7 } });
    dashboard = changeOrg(dashboard, 8); tree = renderFlex(dashboard);
    expect(dialog(tree, "Bulk onboard Course Pass operators").props.open).toBe(false);
    expect(elements(tree).some(element => element.props.onClick && text(element.props.children) === "Send 1 invitations")).toBe(false);
    expect(action(tree, "Send 0 invitations").props.disabled).toBe(true);
    action(tree, "Bulk onboard").props.onClick(); tree = renderFlex(dashboard);
    expect(action(tree, "Send 1 invitations").props.disabled).toBe(true);
    expect(elements(tree).find(element => element.props.type === "email").props.value).toBe("");
    expect(harness.mutations.filter(mutation => mutation.procedure === "bulkInviteLicences")).toEqual([]);
  });

  it("clears the reviewed Flex single invitation on remount", () => {
    let dashboard = startA(); let tree = renderFlex(dashboard);
    action(tree, "Invite").props.onClick(); tree = renderFlex(dashboard);
    input(tree, props => props.type === "email", "a-cohort@echelon.test");
    tree = renderFlex(dashboard); action(tree, "Review").props.onClick(); tree = renderFlex(dashboard);
    expect(action(tree, "Send 1 invitation").props.disabled).toBe(false);
    dashboard = changeOrg(dashboard, 8); tree = renderFlex(dashboard);
    expect(dialog(tree, "Review Course Pass invitation").props.open).toBe(false);
    expect(action(tree, "Send 1 invitation").props.disabled).toBe(true);
    action(tree, "Send 1 invitation").props.onClick(); expect(harness.mutations).toEqual([]);
  });
});
