import { describe, expect, it } from "vitest";
import {
  buildOperatorRows,
  canonicalSnapshotDigest,
  sessionsToCsv,
  summarizeTrainingSessions,
  type TrainingSessionView,
} from "./trainingRecords";

function session(overrides: Partial<TrainingSessionView> = {}): TrainingSessionView {
  return {
    sessionKey: "00000000-0000-4000-8000-000000000001",
    studentEmail: "operator@example.ca",
    courseKey: "class1-water",
    activityType: "quiz",
    topic: "Disinfection",
    startedAt: new Date("2026-08-28T12:00:00.000Z"),
    activeSeconds: 900,
    unitsCompleted: 10,
    score: 8,
    total: 10,
    status: "completed",
    ...overrides,
  };
}

describe("training record summaries", () => {
  it("summarizes concise totals by course and activity", () => {
    const result = summarizeTrainingSessions([
      session(),
      session({ sessionKey: "00000000-0000-4000-8000-000000000002", activityType: "flashcards", activeSeconds: 600 }),
    ]);
    expect(result.activeSeconds).toBe(1500);
    expect(result.sessionCount).toBe(2);
    expect(result.byCourse).toMatchObject([{ courseKey: "class1-water", activeSeconds: 1500, sessionCount: 2 }]);
    expect(result.byActivity.map((row) => row.label).sort()).toEqual(["Flashcards", "Practice questions"]);
  });

  it("groups manager rows by operator and assigned course", () => {
    const rows = buildOperatorRows([
      session(),
      session({ sessionKey: "00000000-0000-4000-8000-000000000002", studentEmail: "second@example.ca", activeSeconds: 300 }),
      session({ sessionKey: "00000000-0000-4000-8000-000000000003", studentEmail: "second@example.ca", activeSeconds: 400 }),
    ]);
    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.operatorEmail === "second@example.ca")).toMatchObject({ activeSeconds: 700, sessionCount: 2 });
  });
});

describe("training record integrity and export", () => {
  it("produces a stable SHA-256 digest for an attested snapshot", () => {
    expect(canonicalSnapshotDigest('{"reportId":"abc","seconds":900}'))
      .toBe("2258ae49c4bfec0f773ac1fcbf48675dfb31a2156f3ad914de3bc8a00c2a3417");
  });

  it("exports session details as standards-compliant CSV", () => {
    const csv = sessionsToCsv([session({ topic: "Pumps, valves & controls" })]);
    expect(csv).toContain("Date,Start time,Duration minutes,Course,Activity,Topic,Units,Score");
    expect(csv).toContain('"Pumps, valves & controls"');
    expect(csv).toContain("15.0");
    expect(csv).toContain("8/10");
  });
});
