import { beforeEach, describe, expect, it } from "vitest";
import { ENV } from "./_core/env";
import { issueMockSession, mockOwner, mockSpecification, verifyMockSession, validateMockSubmission, selectMockQuestions } from "./mockExamSession";
describe("mock session authority", () => {
  beforeEach(() => { ENV.cookieSecret = "test-only-signing-key"; });
  it("binds the session to the verified learner, bank, duration and complete question list", () => {
    const spec = mockSpecification("class4-ww");
    expect(spec.bankKey).toBe("class4-wastewater");
    const owner = mockOwner({ userId: null, studentEmail: "one@example.com" });
    const issued = issueMockSession({ ...spec, owner, preview: false, questionNums: Array.from({ length: 100 }, (_, i) => i + 1) }, 1000);
    expect(verifyMockSession(issued.token, owner)).toMatchObject({ deadline: 10801000, bankKey: "class4-wastewater" });
    expect(() => verifyMockSession(issued.token, mockOwner({ userId: null, studentEmail: "two@example.com" }))).toThrow("another learner");
    expect(() => validateMockSubmission(issued.manifest, { sessionId: issued.manifest.sessionId, bankKey: "class4-ww", examType: "class4-ww", answers: [{ questionNum: 1 }] })).toThrow("exactly once");
  });
  it("cannot issue a short full exam or a preview for a paid-only course", () => {
    const spec = mockSpecification("class4-ww");
    expect(() => issueMockSession({ ...spec, owner: "test", preview: false, questionNums: [1] })).toThrow("complete");
    expect(() => issueMockSession({ ...spec, owner: "test", preview: true, questionNums: Array.from({ length: 30 }, (_, i) => i + 1) })).toThrow("complete");
  });
  it("keeps course-specific exam sizes and fails closed on unknown courses", () => {
    expect(mockSpecification("oit-ww")).toMatchObject({ count: 50, duration: 3600 });
    expect(mockSpecification("electrician-309a")).toMatchObject({ count: 100, duration: 14400 });
    expect(mockSpecification("class1-water").examType).toBe("class1");
    expect(() => mockSpecification("made-up")).toThrow("Unknown");
  });
  it("selects unique questions to configured targets and fills only from eligible pool", () => {
    const pool = Array.from({ length: 150 }, (_, i) => ({ id: i + 1, module: i < 75 ? "A" : "B" }));
    const sample = selectMockQuestions([...pool, pool[0]], { A: 40, B: 60 }, 100);
    expect(sample).toHaveLength(100); expect(new Set(sample.map(q => q.id)).size).toBe(100);
    expect(sample.filter(q => q.module === "A")).toHaveLength(40);
  });
});
