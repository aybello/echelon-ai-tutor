import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it, vi } from "vitest";

// Execute the actual TSX handler bodies with isolated bindings. No DOM, API,
// credentials, fake correctness, or parallel agent files are required.
const source = readFileSync(resolve(process.cwd(), "client/src/components/MockExamShell.tsx"), "utf8");
const ast = ts.createSourceFile("MockExamShell.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function handler(predicate: (text: string) => boolean, bindings: Record<string, unknown>) {
  let found: ts.ArrowFunction | undefined;
  function visit(node: ts.Node) {
    if (ts.isArrowFunction(node) && predicate(node.getText(ast))) found ??= node;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  if (!found) throw new Error("Mock tracking handler not found");
  const compiled = ts.transpileModule(`return (${found.getText(ast)});`, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  return new Function(...Object.keys(bindings), compiled)(...Object.values(bindings));
}

function selection(selected: number | null, isSelected = false) {
  const observeActivity = vi.fn();
  const setAnswers = vi.fn();
  const callback = handler(text => text.startsWith("() =>") && text.includes("if (isSelected || showPreviewGate)"), {
    isSelected, showPreviewGate: false, observeActivity, activityItemId: () => "class1-water:17", currentQ: { id: 17 },
    answers: [{ selected }], currentIdx: 0, i: 3, setAnswers,
  });
  callback();
  return { observeActivity, setAnswers };
}

function acknowledgement(overrides: Record<string, unknown> = {}) {
  const observeActivity = vi.fn();
  const setSaveStatus = vi.fn();
  const setActivityCompleted = vi.fn();
  const callback = handler(text => text.startsWith("(result, submitted) =>"), {
    sessionId: "signed-exam", sessionToken: "signed-token", trackingActorKey: "user:5", currentActorRef: { current: "user:5" },
    setQuestions: vi.fn(), setScoredResult: vi.fn(), setReviewToken: vi.fn(), resultSavedRef: { current: false },
    setSaveStatus, activityCompleted: false, observeActivity, setActivityCompleted, ...overrides,
  });
  const result = { review: [], reviewToken: "review-only", persisted: false, score: 0, total: 100 };
  callback(result, { sessionId: "signed-exam", sessionToken: "signed-token" });
  return { observeActivity, setSaveStatus, setActivityCompleted };
}

describe("mock client observed handlers", () => {
  it("records the original option index without disclosing or inventing correctness", () => {
    const { observeActivity, setAnswers } = selection(null);
    expect(observeActivity).toHaveBeenCalledOnce();
    expect(observeActivity).toHaveBeenCalledWith({ action: "answer_submitted", itemId: "class1-water:17", chosenAnswer: "3" });
    expect(setAnswers.mock.calls[0][0]([{ questionIndex: 0, selected: null }])).toEqual([{ questionIndex: 0, selected: 3 }]);
  });
  it("records a changed selection as a revision, not a scored retry", () => {
    const { observeActivity } = selection(0);
    expect(observeActivity).toHaveBeenCalledOnce();
    expect(observeActivity).toHaveBeenCalledWith({ action: "selection_changed", itemId: "class1-water:17", chosenAnswer: "3" });
  });
  it("does not invent another answer for clicking the already selected option", () => {
    const { observeActivity, setAnswers } = selection(3, true);
    expect(observeActivity).not.toHaveBeenCalled();
    expect(setAnswers).not.toHaveBeenCalled();
  });
  it("finishes only on a genuine final acknowledgement, including a local guest result", () => {
    const { observeActivity, setSaveStatus, setActivityCompleted } = acknowledgement();
    expect(observeActivity).toHaveBeenCalledOnce();
    expect(observeActivity).toHaveBeenCalledWith({ action: "completed" });
    expect(setSaveStatus).toHaveBeenCalledWith("guest");
    expect(setActivityCompleted).toHaveBeenCalledWith(true);
  });
  it("does not attach a late acknowledgement to a different actor", () => {
    const { observeActivity, setSaveStatus } = acknowledgement({ currentActorRef: { current: "user:6" } });
    expect(observeActivity).not.toHaveBeenCalled();
    expect(setSaveStatus).not.toHaveBeenCalled();
  });
  it("does not attach a late acknowledgement to a retaken exam", () => {
    const { observeActivity } = acknowledgement({ sessionId: "new-retake" });
    expect(observeActivity).not.toHaveBeenCalled();
  });
  it("does not fabricate another completion on restored acknowledged results", () => {
    expect(acknowledgement({ activityCompleted: true }).observeActivity).not.toHaveBeenCalled();
  });
  it("records only an explicitly opened question explanation, not all rendered review rows", () => {
    const observeActivity = vi.fn();
    const callback = handler(text => text.startsWith("event =>") && text.includes('action: "explanation_opened"'), {
      observeActivity, activityItemId: () => "physical-bank:8", q: { id: 8 },
    });
    callback({ currentTarget: { open: false } });
    expect(observeActivity).not.toHaveBeenCalled();
    callback({ currentTarget: { open: true } });
    expect(observeActivity).toHaveBeenCalledOnce();
    expect(observeActivity).toHaveBeenCalledWith({ action: "explanation_opened", itemId: "physical-bank:8" });
  });
  it("keeps submit intent, expiry, cleanup and restored answers separate from completion", () => {
    const submitIntent = source.slice(source.indexOf("const handleSubmit ="), source.indexOf("// Restore only"));
    const restore = source.slice(source.indexOf("// Restore only"), source.indexOf("const results ="));
    expect(submitIntent).not.toContain('action: "completed"');
    expect(restore).not.toContain('action: "completed"');
    expect(restore).not.toContain('action: "answer_submitted"');
    expect(restore).toContain("saved.activityTracking");
    expect(restore).toContain('action: "resumed"');
    expect(restore).toContain("saved.trackingActorKey !== activityActorKey");
  });
});
