import { describe, expect, it } from "vitest";
// @ts-expect-error - this standalone guarded release helper is executed as ESM by Node and Vitest.
import { digest, reconcileClass1CompleteRepair } from "../scripts/lib/class1CompleteRepair.mjs";

const banks = ["class1-water", "class1-wastewater", "class1-water-dist", "class1-wastewater-coll"];
const question = (bankKey: string, id: number) => ({ id, bankKey, questionNum: 1, module: "Fundamentals", difficulty: "easy", question: "Question", options: "[\"A\",\"B\",\"C\",\"D\"]", correctIndex: 0, explanation: "Explanation", steps: null, tip: null, isCalc: "no", topic: null, cognitiveLevel: "recall", sourceTitle: null, sourceReference: null, sourceUrl: null, blueprintObjective: null, reviewStatus: "unreviewed" });
const metadata = (bankKey: string) => ({ bankKey, modules: "[]", moduleTargets: null, formulaLinks: null, totalQuestions: 1, contentVersion: 1, blueprintVersion: 1, minCalcPerMock: null, recallTargetPct: null });

function patchFor(before: ReturnType<typeof question>) {
  const after = { ...before, explanation: "Repaired explanation" };
  return { bankKey: before.bankKey, questionNum: before.questionNum, databaseId: before.id, beforeHash: digest(before), afterHash: digest(after), before, after, changes: { explanation: { before: before.explanation, after: after.explanation } } };
}

function testPackage() {
  const questions = banks.map((bankKey, index) => question(bankKey, index + 1));
  return {
    questions,
    pkg: {
      patches: Array.from({ length: 1601 }, (_, index) => ({ ...patchFor(questions[index % questions.length]), questionNum: index + 1, databaseId: index + 1, before: { ...questions[index % questions.length], id: index + 1, questionNum: index + 1 }, after: { ...questions[index % questions.length], id: index + 1, questionNum: index + 1, explanation: "Repaired explanation" } })).map((patch) => ({ ...patch, beforeHash: digest(patch.before), afterHash: digest(patch.after) })),
      metadataPatches: banks.map((bankKey) => {
        const before = metadata(bankKey); const after = { ...before, contentVersion: 2 };
        return { bankKey, before, after, beforeHash: digest(before), afterHash: digest(after) };
      }),
    },
  };
}

describe("Class 1 complete-repair reconciliation", () => {
  it("rejects a package that attempts to change a protected answer key", () => {
    const { pkg } = testPackage();
    pkg.patches[0].after.correctIndex = 1;
    pkg.patches[0].after.explanation = pkg.patches[0].before.explanation;
    pkg.patches[0].afterHash = digest(pkg.patches[0].after);
    // @ts-expect-error - intentional malicious package mutation for the guard test.
    pkg.patches[0].changes = { correctIndex: { before: 0, after: 1 } };
    expect(() => reconcileClass1CompleteRepair({ pkg, currentQuestions: [], currentMetadata: [] })).toThrow("Protected question field changed");
  });
});
