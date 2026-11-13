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

function render(rows: (Omit<typeof base, "accessEndsAt" | "operatorEmail" | "operatorKey"> & { accessEndsAt: string | Date | null; operatorEmail: string | null; operatorKey: string | null })[]) {
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
      if (status === "active") expect(html).toMatch(/Not available<\/p><p[^>]*>Actively Studying/);
      else expect(html).toMatch(/>0<\/p><p[^>]*>Actively Studying/);
    }
  });

  it("keeps a real zero accuracy with recorded answers", () => {
    const html = render([base]);
    expect(html).toMatch(/0%<\/p><p[^>]*>Avg Accuracy/);
  });

  it("shows the activated count only when active licence ends are known", () => {
    for (const accessEndsAt of [null, "invalid"]) {
      const html = render([base, { ...base, licenceId: 2, accessEndsAt }]);
      expect(html).toContain("Not available activated / 2 licences");
      expect(html).not.toContain("1 activated / 2 licences");
    }
    expect(render([base, { ...base, licenceId: 2, accessEndsAt: "2000-01-01", activityAvailable: false }])).toContain("1 activated / 2 licences");
    expect(render([{ ...base, activityAvailable: false }])).toContain("1 activated / 1 licences");
    expect(render([base, { ...base, licenceId: 2, status: "assigned", accessEndsAt: null }])).toContain("1 activated / 2 licences");
  });

  it("labels assigned users without emails and suppresses unknown unique identities", () => {
    for (const operatorEmail of [null, "  "]) {
      const html = render([{ ...base, operatorEmail, operatorKey: null, daysActive30: 1 }]);
      expect(html).toContain(">Unknown</span>");
      expect(html).toContain("Not available unique assigned learners");
      expect(html).toMatch(/Not available<\/p><p[^>]*>Actively Studying/);
      expect(html).not.toContain("Unassigned");
      const assigned = render([{ ...base, operatorEmail, operatorKey: "user:1", daysActive30: 1 }]);
      expect(assigned).toContain(">Assigned operator</span>");
      expect(assigned).toContain("1 unique assigned learners");
      expect(assigned).toMatch(/>1<\/p><p[^>]*>Actively Studying/);
    }
  });

  it("shows elapsed sub-day expirations and missing active ends consistently", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-21T12:00:00Z"));
    try {
      const elapsed = render([{ ...base, accessEndsAt: "2026-10-21T11:59:59Z" }]);
      expect(elapsed).toContain("Study expired · reporting only");
      expect(elapsed).toContain(">Expired</span>");
      expect(elapsed).not.toContain("Expires today");
      for (const accessEndsAt of [null, "invalid"]) {
        const unknown = render([{ ...base, accessEndsAt }]);
        expect(unknown).not.toContain(">Activated</span>");
        expect(unknown).toMatch(/<td class="py-3"><span[^>]*>Not available<\/span><\/td>/);
      }
      expect(render([{ ...base, status: "assigned", accessEndsAt: null }])).toMatch(/<td class="py-3"><span[^>]*>—<\/span><\/td>/);
    } finally { vi.useRealTimers(); }
  });

  it("does not present partial activity as complete in a mixed cohort", () => {
    for (const unknown of [
      { ...base, licenceId: 2, totalAttempts: 0, activityAvailable: false },
      { ...base, licenceId: 2, totalAttempts: 0, activityAvailable: false, accessEndsAt: null },
      { ...base, licenceId: 2, totalAttempts: 0, activityAvailable: false, accessEndsAt: "invalid" },
    ]) {
      const html = render([{ ...base, readinessAvailable: true, readinessScore: 72 }, unknown]);
      expect(html).toMatch(/Not available<\/p><p[^>]*>Questions Answered/);
      expect(html).toMatch(/Not available<\/p><p[^>]*>Avg Accuracy/);
      expect(html).toMatch(/Not available<\/p><p[^>]*>Avg readiness: active licences with recent data/);
      expect(html).toMatch(/Not available<\/p><p[^>]*>Actively Studying/);
      expect(html).toContain("72% — Progressing");
    }
  });

  it("keeps active metrics visible when unrelated historical or pending activity is unknown", () => {
    for (const unknown of [
      { ...base, licenceId: 2, status: "expired", activityAvailable: false },
      { ...base, licenceId: 2, status: "assigned", activityAvailable: false },
      { ...base, licenceId: 2, accessEndsAt: "2000-01-01", activityAvailable: false },
    ]) {
      const html = render([{ ...base, readinessAvailable: true, readinessScore: 72, daysActive30: 1 }, unknown]);
      expect(html).toMatch(/Not available<\/p><p[^>]*>Questions Answered/);
      expect(html).toMatch(/Not available<\/p><p[^>]*>Avg Accuracy/);
      expect(html).toMatch(/>72<\/p><p[^>]*>Avg readiness: active licences with recent data/);
      expect(html).toMatch(/>1<\/p><p[^>]*>Actively Studying/);
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
