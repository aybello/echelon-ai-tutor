import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const query = vi.hoisted(() => ({ rows: [] as any[] }));
vi.mock("@/lib/trpc", () => ({
  trpc: { teamFlex: {
    getFlexProgress: { useQuery: () => ({ data: query.rows, isError: false }) },
    listLicences: { useQuery: () => ({ data: query.rows, isError: false }) },
  } },
}));

import { FlexProgressDashboard } from "./FlexProgressDashboard";

const base = {
  licenceId: 1, courseKey: "oit", status: "active", operatorEmail: "person@example.test",
  operatorKey: "user:1", totalAttempts: 10, correctAttempts: 0, accuracy: 0,
  readinessScore: 0, readinessAvailable: false, activityAvailable: true, daysActive30: 0, accessEndsAt: "2099-01-01",
};

function render(rows: (Omit<typeof base, "accessEndsAt"> & { accessEndsAt: string | null })[]) {
  query.rows = rows;
  return renderToStaticMarkup(createElement(FlexProgressDashboard, { orgId: 1 }));
}

describe("Flex readiness display", () => {
  beforeAll(() => vi.stubGlobal("React", React));
  afterAll(() => vi.unstubAllGlobals());

  it("shows insufficient recent data for historical attempts and no available average", () => {
    const html = render([base]);
    expect(html).toContain("Not enough recent data");
    expect(html).toContain("Not available");
    expect(html).not.toContain("0% — Needs Focus");
    expect(html).not.toContain("Not started");
  });

  it("shows Not started when there are no historical attempts", () => {
    const html = render([{ ...base, totalAttempts: 0 }]);
    expect(html).toContain("Not started");
    expect(html).toMatch(/Not available<\/p><p[^>]*>Avg Accuracy/);
    expect(html).not.toContain("Not enough recent data");
  });

  it("does not label incomplete active or expired activity as unstarted or zero", () => {
    for (const status of ["active", "expired"]) {
      const html = render([{ ...base, status, totalAttempts: 0, activityAvailable: false }]);
      expect(html).not.toContain("Not started");
      expect(html).toMatch(/Not available<\/p><p[^>]*>Questions Answered/);
      expect(html).toMatch(/Not available<\/p><p[^>]*>Avg Accuracy/);
      expect(html).toMatch(/Not available<\/p><p[^>]*>Actively Studying/);
      expect(html.match(/Not available/g)?.length).toBeGreaterThanOrEqual(6);
    }
  });

  it("keeps a real zero accuracy with recorded answers", () => {
    const html = render([base]);
    expect(html).toMatch(/0%<\/p><p[^>]*>Avg Accuracy/);
  });

  it("does not present partial activity as complete in a mixed cohort", () => {
    for (const unknown of [
      { ...base, licenceId: 2, totalAttempts: 0, activityAvailable: false },
      { ...base, licenceId: 2, totalAttempts: 0, activityAvailable: false, accessEndsAt: null },
      { ...base, licenceId: 2, totalAttempts: 0, activityAvailable: false, status: "expired" },
    ]) {
      const html = render([{ ...base, readinessAvailable: true, readinessScore: 72 }, unknown]);
      expect(html).toMatch(/Not available<\/p><p[^>]*>Questions Answered/);
      expect(html).toMatch(/Not available<\/p><p[^>]*>Avg Accuracy/);
      expect(html).toMatch(/Not available<\/p><p[^>]*>Avg readiness: active licences with recent data/);
      expect(html).toContain("72% — Progressing");
    }
  });

  it("labels the average as only active licences with recent data", () => {
    const html = render([
      { ...base, readinessAvailable: true, readinessScore: 72 },
      { ...base, licenceId: 2, readinessAvailable: false },
    ]);
    expect(html).toMatch(/>72<\/p><p[^>]*>Avg readiness: active licences with recent data/);
    expect(html).toContain("Not enough recent data");
  });

  it("shows a genuine zero score and its existing label", () => {
    const html = render([{ ...base, readinessAvailable: true }]);
    expect(html).toContain("0% — Needs Focus");
    expect(html).toMatch(/>0<\/p><p[^>]*>Avg readiness: active licences with recent data/);
    expect(html).not.toContain("Not available");
    expect(html).not.toContain("Not enough recent data");
  });
});
