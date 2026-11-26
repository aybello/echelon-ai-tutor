import { expect, it } from "vitest";
const { auditWpiClass4Evidence, WPI_CLASS4_OUTLINE } = await import(new URL("../scripts/lib/wpiClass4Evidence.mjs", import.meta.url).href);
const { hashWpiQuestionRows, hashWpiNewQuestionRows } = await import(new URL("../scripts/lib/wpiClass4Release.mjs", import.meta.url).href);
function input() {
  const rows = Array.from({ length: 907 }, (_, i) => ({ id: i < 657 ? i + 1 : null, questionNum: i < 657 ? i + 1 : 2001 + i - 657,
    bankKey: "wpi-class4-wastewater", question: `Unique problem ${i}`, explanation: "Worked explanation",
    options: JSON.stringify(["-1", "+1", "2", "3"]), correctIndex: i % 4,
    module: WPI_CLASS4_OUTLINE[i % 4].module, cognitiveLevel: i % 8 < 4 ? "recall" : "application", isCalc: i % 3 === 0 ? "yes" : "no",
    sourceTitle: "Source", sourceReference: "Section 1", blueprintObjective: "Objective" }));
  const existing = rows.slice(0, 657), additions = rows.slice(657);
  return { existing, additions, manifest: { bankKey: "wpi-class4-wastewater", existingRowsSha256: hashWpiQuestionRows(existing), newRowsSha256: hashWpiNewQuestionRows(additions) } };
}
it("audits the whole package without imposing mock proportions on the bank", () => {
  const report = auditWpiClass4Evidence(input());
  expect(report.count).toBe(907);
  expect(report.errors).toEqual([]);
  expect(report.coverageGaps).toEqual([]);
  expect(report.answerPositions.reduce((a: number, b: number) => a + b, 0)).toBe(907);
});
it("detects tampering, unavailable calculation coverage, missing references and answer cues", () => {
  const data = input();
  for (const row of [...data.existing, ...data.additions]) row.isCalc = "no";
  data.existing[0].sourceReference = "";
  data.existing[0].options = JSON.stringify(["This correct response contains a very detailed explanation that stands out from all the other options", "B", "C", "D"]);
  const report = auditWpiClass4Evidence(data);
  expect(report.errors).toContain("Existing content checksum mismatch");
  expect(report.coverageGaps.some((gap: string) => gap.includes("calculations"))).toBe(true);
  expect(report.missingReferences).toContain(1);
  expect(report.answerCueFlags).toContain(1);
});
