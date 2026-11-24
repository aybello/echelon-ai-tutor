import * as React from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  search: "course=class1-water", tutorError: false, tutorRows: [] as any[],
  topicQuery: vi.fn(),
}));
vi.mock("react", async importOriginal => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, useState: (initial: unknown) => actual.useState(initial === "study" ? "progress" : initial) };
});
vi.mock("wouter", () => ({ useSearch: () => state.search }));
vi.mock("@/hooks/usePageMeta", () => ({ usePageMeta: vi.fn() }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: null, loading: false, isAuthenticated: false }) }));
vi.mock("@/_core/hooks/useLogout", () => ({ useLogout: () => ({ logout: vi.fn(), isPending: false }) }));
vi.mock("@/components/SiteNav", () => ({ default: () => null }));
vi.mock("@/components/StudyHomeCard", () => ({ default: () => null }));
vi.mock("@/components/Quick10Button", () => ({ default: () => null }));
vi.mock("@/components/GamesCard", () => ({ default: () => null }));
vi.mock("@/components/TutorGuideMark", () => ({ TutorGuideMark: () => null }));
vi.mock("chart.js", () => ({
  Chart: { register: vi.fn() }, CategoryScale: {}, LinearScale: {}, BarElement: {},
  ArcElement: {}, PointElement: {}, LineElement: {}, Tooltip: {}, Legend: {}, Filler: {},
}));
vi.mock("react-chartjs-2", () => ({ Bar: () => null, Doughnut: () => null, Line: () => null }));
vi.mock("@/lib/trpc", () => ({
  trpc: new Proxy({}, {
    get: (_target, namespace) => {
      if (namespace === "useUtils") return () => ({});
      return new Proxy({}, {
        get: (_target, procedure) => ({
          useQuery: (input: unknown) => {
            let data: unknown;
            if (namespace === "dashboardAuth" && procedure === "me") data = { email: "learner-fixture@echelon.test" };
            if (procedure === "topicAccuracy") {
              state.topicQuery(input);
              data = { topics: [{ name: "Pumps & Flow / Safety?", status: "weak", accuracy: 25 }], weakTopics: [], strongTopics: [] };
            }
            if (procedure === "studyFocus") data = { courseKey: "oit" };
            if (procedure === "aiSessionHistory") data = state.tutorRows;
            if (["dailyActivity", "recentSessions", "courseBreakdown", "difficultyBreakdown"].includes(String(procedure))) data = [];
            return { data, isLoading: false, isError: procedure === "aiSessionHistory" && state.tutorError, refetch: vi.fn() };
          },
          useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
        }),
      });
    },
  }),
}));

import StudentDashboard from "./StudentDashboard";
const render = () => renderToStaticMarkup(createElement(StudentDashboard));

beforeEach(() => {
  vi.stubGlobal("React", React);
  state.search = "course=class1-water";
  state.tutorError = false;
  state.tutorRows = [];
  state.topicQuery.mockClear();
});

describe("learner dashboard scoped practice and history", () => {
  it.each([
    ["class1-water", "/class1-water", "class1-water"],
    ["class1-wastewater", "/class1-ww", "class1-ww"],
    ["wpi-class2-water", "/wpi-class2-water", "wpi-class2-water"],
    ["electrician-309a", "/electrician-309a", "electrician-309a"],
    ["oit", "/quiz", "oit"],
  ])("uses the resolved %s quiz route and encoded topic", (requested, route, canonical) => {
    state.search = `course=${requested}`;
    const html = render();
    expect(html).toContain(`href="${route}?topic=Pumps%20%26%20Flow%20%2F%20Safety%3F"`);
    expect(html).not.toContain('href="/?topic=');
    expect(state.topicQuery).toHaveBeenCalledWith({ courseKey: canonical });
  });

  it.each(["", "course=unknown-course"])("does not give cross-course topics an OIT or primary-focus practice link (%s)", search => {
    state.search = search;
    const html = render();
    expect(html).not.toMatch(/href="[^\"]*\?topic=/);
    expect(html).toContain("Open a course dashboard from My Courses for topic practice.");
    expect(state.topicQuery).toHaveBeenCalledWith(undefined);
  });

  it("labels quiz-only metrics and empty histories without merging game observations", () => {
    const html = render();
    for (const copy of ["Quiz Questions Answered", "Quiz Accuracy", "Quiz-based Readiness Estimate", "Quiz Question Activity (Last 30 Days)", "Recent Quiz Answer Sessions", "Game observations are tracked separately and are not added to quiz accuracy or readiness.", "No quiz answers recorded in this view.", "No quiz answer sessions recorded in this view."]) {
      expect(html).toContain(copy);
    }
    expect(html).not.toContain("No activity yet");
    expect(html).not.toContain("No sessions recorded yet");
  });

  it("discloses the saved-history identity boundary rather than asserting no tutor use exists", () => {
    const html = render();
    expect(html).toContain("No saved AI tutor sessions found for this sign-in.");
    expect(html).toContain("Account and verified-email histories are separate.");
    expect(html).not.toContain("No AI tutor sessions yet");
  });

  it("shows a tutor-history load error rather than the empty-history message", () => {
    state.tutorError = true;
    const html = render();
    expect(html).toContain("Saved tutor history could not load.");
    expect(html).toContain("Retry tutor history");
    expect(html).not.toContain("No saved AI tutor sessions found");
  });

  it("renders returned saved history and marks absent dates as unrecorded", () => {
    state.tutorRows = [{ id: 1, examType: "class1-water", sessionStart: null, messageCount: 4, summary: "Saved fixture tutor session" }];
    const html = render();
    expect(html).toContain("Saved fixture tutor session");
    expect(html).toContain("Date not recorded");
    expect(html).not.toContain("No saved AI tutor sessions found");
  });
});
