import { describe, expect, it } from "vitest";
// @ts-expect-error This standalone guarded release helper is executed as ESM by Node and Vitest.
import { loadClass1NetworksPackage } from "../scripts/lib/class1TreatmentImporter.mjs";
// @ts-expect-error This standalone guarded release helper is executed as ESM by Node and Vitest.
import { planClass1NetworksRelease } from "../scripts/lib/class1TreatmentRelease.mjs";

const packageInfo = loadClass1NetworksPackage();
const counts: Record<string, number> = {
  "class1-water": 555,
  "class1-wastewater": 565,
};

function stagedFixture() {
  let id = 1;
  const rows: any[] = Object.entries(counts).flatMap(([bankKey, count]) =>
    Array.from({ length: count }, (_, index) => ({
      id: id++, bankKey, questionNum: index + 1, module: "Existing", difficulty: "easy",
      question: `Existing ${bankKey} ${index + 1}`, options: '["A","B","C","D"]', correctIndex: 0,
      explanation: "Existing explanation.", steps: null, tip: null, isCalc: "no", topic: "Existing",
      cognitiveLevel: "recall", sourceTitle: null, sourceReference: null, sourceUrl: null,
      blueprintObjective: null, reviewStatus: "unreviewed",
    })),
  );
  for (const payload of packageInfo.payloads) {
    for (const question of payload.questions) {
      rows.push({ ...question, id: id++, options: JSON.stringify(question.options), reviewStatus: "in_review" });
    }
  }
  const metadata = Object.entries(counts).map(([bankKey, totalQuestions]) => ({
    bankKey, modules: "[]", moduleTargets: null, formulaLinks: null, totalQuestions, contentVersion: 8,
    blueprintVersion: 1, minCalcPerMock: null, recallTargetPct: null,
  }));
  return { rows, metadata };
}

describe("Class 1 Treatment guarded learner-visible promotion", () => {
  it("accepts only the complete exact all-in-review package and calculates the learner-visible inventory", () => {
    const fixture = stagedFixture();
    const plan = planClass1NetworksRelease({ payloads: packageInfo.payloads, ...fixture });
    expect(plan).toMatchObject({ ready: true, state: "ready", errors: [] });
    expect(plan.banks.map((bank: any) => [bank.bankKey, bank.stagedCount, bank.visibleBefore, bank.expectedVisibleAfter])).toEqual([
      ["class1-water", 250, 555, 805],
      ["class1-wastewater", 250, 565, 815],
    ]);
  });

  it("fails closed for immutable-content drift, mixed visibility, or stale learner-visible metadata", () => {
    const fixture = stagedFixture();
    const candidate = fixture.rows.find((row) => row.bankKey === "class1-water" && row.questionNum === 2001);
    candidate.explanation = "Unexpected content change.";
    const wrongContent = planClass1NetworksRelease({ payloads: packageInfo.payloads, ...fixture });
    expect(wrongContent.ready).toBe(false);
    expect(wrongContent.errors.join(" ")).toContain("immutable staged-content conflict");

    const mixedFixture = stagedFixture();
    mixedFixture.rows.find((row) => row.bankKey === "class1-water" && row.questionNum === 2001).reviewStatus = "unreviewed";
    mixedFixture.metadata[0].totalQuestions = 556;
    const mixed = planClass1NetworksRelease({ payloads: packageInfo.payloads, ...mixedFixture });
    expect(mixed.ready).toBe(false);
    expect(mixed.errors.join(" ")).toContain("mixed visibility states");
  });

  it("recognizes an already-visible package without scheduling a replay", () => {
    const fixture = stagedFixture();
    for (const row of fixture.rows) if (row.questionNum >= 2001) row.reviewStatus = "unreviewed";
    for (const meta of fixture.metadata) meta.totalQuestions += 250;
    const plan = planClass1NetworksRelease({ payloads: packageInfo.payloads, ...fixture });
    expect(plan).toMatchObject({ ready: false, state: "already_visible", errors: [] });
    expect(plan.changes).toEqual([]);
  });
});
