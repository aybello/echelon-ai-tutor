import { describe, expect, it } from "vitest";
import { safeSupervisorCsvCell, supervisorNextAction, type SupervisorEvidence } from "./supervisorActionPlan";
const base: SupervisorEvidence = {
  memberStatus: "assigned", totalAttempts: 70, readinessScore: 65, weakestTopic: "Disinfection",
  examRisk: "none", daysUntilExam: 40, lastActive: "2026-10-13T12:00:00.000Z",
};
const now = new Date("2026-10-14T12:00:00.000Z");
describe("supervisor action recommendations", () => {
  it("prioritizes revoked access", () => expect(supervisorNextAction({...base, memberStatus:"revoked"}, now)).toContain("historical"));
  it("prioritizes onboarding before readiness", () => expect(supervisorNextAction({...base, totalAttempts:0}, now)).toContain("diagnostic"));
  it("prioritizes urgent exams", () => expect(supervisorNextAction({...base, examRisk:"critical"}, now)).toContain("supervisor"));
  it("identifies inactivity", () => expect(supervisorNextAction({...base, lastActive:"2026-09-15"}, now)).toContain("inactivity"));
  it("recommends targeted study without guaranteeing a pass", () => expect(supervisorNextAction(base, now)).toContain("Disinfection"));
  it("recommends mock evidence for strong study indicators", () => expect(supervisorNextAction({...base, readinessScore:85}, now)).toContain("timed mock"));
  it("escapes spreadsheet formulas, delimiters and embedded quotes", () => {
    expect(safeSupervisorCsvCell("=1+1")).toBe("\"'=1+1\"");
    expect(safeSupervisorCsvCell('+SUM(1,2)')).toContain("'+SUM");
    expect(safeSupervisorCsvCell('Alpha, "Beta"')).toBe('\"Alpha, ""Beta""\"');
  });
});
