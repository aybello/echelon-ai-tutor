import * as React from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  attention: {
    atRisk: [
      {
        memberId: 201,
        email: "multi-course-operator@echelon.test",
        courseKey: "class1-ww",
        courseLabel: "Class 1 Wastewater Treatment",
        courseAccuracy: 0,
        examDate: new Date("2026-11-11T12:00:00.000Z"),
        daysUntilExam: 14,
      },
    ],
    stalled: [],
  },
}));

const queryResult = (data: unknown) => ({
  data,
  isLoading: false,
  isFetching: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
});
const mutationResult = () => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
  error: null,
});

vi.mock("wouter", () => ({
  Link: ({ children, ...props }: { children: React.ReactNode; href: string }) =>
    createElement("a", props, children),
  useLocation: () => ["/team", vi.fn()],
  useSearch: () => "",
}));
vi.mock("@/_core/hooks/useLogout", () => ({
  useLogout: () => ({ logout: vi.fn(), isPending: false }),
}));
vi.mock("@/components/FlexLicencePanel", () => ({
  FlexLicencePanel: () => null,
}));
vi.mock("@/components/FlexProgressDashboard", () => ({
  FlexProgressDashboard: () => null,
}));
vi.mock("@/components/ProductState", () => ({
  ProductEmptyState: () => null,
  ProductErrorState: () => null,
  ProductLoadingState: () => null,
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));
vi.mock("@/lib/trpc", () => ({
  trpc: new Proxy(
    {},
    {
      get: (_target, namespace) => {
        if (namespace === "useUtils")
          return () => ({
            org: {
              getOrgOverview: { invalidate: vi.fn() },
              listMembers: { invalidate: vi.fn() },
              getAttention: { invalidate: vi.fn() },
            },
          });
        return new Proxy(
          {},
          {
            get: (_target, procedure) => ({
              useQuery: () => {
                if (
                  namespace === "org" &&
                  procedure === "listManagedOrganizations"
                )
                  return queryResult([]);
                if (namespace === "org" && procedure === "getOrgOverview")
                  return queryResult({
                    orgId: 7,
                    orgName: "Fixture municipality",
                    province: "ontario",
                    status: "active",
                    billingType: "course-pass",
                    stripeSubscriptionId: null,
                    seatsTotal: 4,
                    seatsAssigned: 1,
                    seatsUsedThisTerm: 1,
                    activeThisWeek: 1,
                    avgReadiness: 45,
                    onTrackCount: 0,
                    allowedCourseKeys: ["class1-water", "class1-ww"],
                    termStart: new Date("2026-01-01T00:00:00.000Z"),
                    termEnd: new Date("2027-01-01T00:00:00.000Z"),
                  });
                if (namespace === "org" && procedure === "listMembers")
                  return queryResult([]);
                if (namespace === "org" && procedure === "getAttention")
                  return queryResult(state.attention);
                return queryResult(undefined);
              },
              useMutation: mutationResult,
            }),
          }
        );
      },
    }
  ),
}));

import OrgDashboard from "./OrgDashboard";

const render = () => renderToStaticMarkup(createElement(OrgDashboard));

beforeEach(() => {
  state.attention = {
    atRisk: [
      {
        memberId: 201,
        email: "multi-course-operator@echelon.test",
        courseKey: "class1-ww",
        courseLabel: "Class 1 Wastewater Treatment",
        courseAccuracy: 0,
        examDate: new Date("2026-11-11T12:00:00.000Z"),
        daysUntilExam: 14,
      },
    ],
    stalled: [],
  };
  vi.stubGlobal("React", React);
});

describe("OrgDashboard upcoming-exam attention card", () => {
  it("renders the returned course label beside its course-specific practice accuracy", () => {
    const html = render();

    expect(html).toContain("multi-course-operator@echelon.test");
    expect(html).toContain("Class 1 Wastewater Treatment");
    expect(html).toContain("Exam in 14 days");
    expect(html).toContain("0% course practice accuracy");
    expect(html).not.toContain("50% practice accuracy");
  });
});
