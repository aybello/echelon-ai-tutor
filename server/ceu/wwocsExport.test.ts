import { expect, it } from "vitest";
import { ceuCourse } from "./catalogue";
import { newCeuRecord } from "./learningState";
import { formatWWOCSUpload } from "./wwocsExport";
it("formats OWWCO completion upload only with a real course ID and completed numeric operator", () => {
  const record = newCeuRecord(
    ceuCourse("ceu-sampling-data-quality")!,
    "Example Learner",
    "90000064"
  );
  record.completion = {
    id: "id",
    at: "2026-09-25T01:00:00Z",
    name: "Example Learner",
    operatorNumber: "90000064",
    courseId: "ceu-sampling-data-quality",
    recordedMinutes: 180,
    finalScore: 8,
    finalTotal: 8,
    statement: "Pilot record",
  };
  expect(() => formatWWOCSUpload([record])).toThrow("approved WWOCS course ID");
  expect(formatWWOCSUpload([record], "48")).toBe("90000064;48;20260924\r\n");
  expect(
    formatWWOCSUpload([record, record], "48").split("\r\n").filter(Boolean)
  ).toHaveLength(2);
  record.completion = undefined;
  expect(() => formatWWOCSUpload([record], "48")).toThrow("completion");
});
