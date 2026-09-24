import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
// @ts-ignore Standalone governed release planner written in ESM.
import { ONTARIO_TREATMENT_MODULE_PROFILES, isOntarioTreatmentModuleRestored, planOntarioTreatmentModuleRestoration, preservedRowHash } from "../scripts/lib/ontarioTreatmentModuleRestoration.mjs";

const BANK = "class2-water";
const PROFILE = ONTARIO_TREATMENT_MODULE_PROFILES[BANK];

function rows() {
  return PROFILE.modules.map((module: string, index: number) => ({
    id: index + 1,
    bankKey: BANK,
    questionNum: index + 1,
    module: PROFILE.genericModule,
    question: `Fixture ${index + 1}`,
    options: '["A","B","C","D"]',
    correctIndex: 0,
    explanation: `Explanation ${index + 1}`,
    isCalc: "no",
    reviewStatus: "approved",
  }));
}

function classifications(sourceRows = rows()) {
  return sourceRows.map((row: ReturnType<typeof rows>[number], index: number) => ({
    questionNum: row.questionNum,
    module: PROFILE.modules[index],
    confidence: 92,
    rationale: `Tests ${PROFILE.modules[index]}.`,
    sourceHash: preservedRowHash(row),
  }));
}

function metadata() {
  return [{
    bankKey: BANK,
    modules: JSON.stringify(PROFILE.modules),
    totalQuestions: PROFILE.modules.length,
    contentVersion: 1,
  }];
}

describe("Ontario treatment module restoration plan", () => {
  it("reclassifies only existing questions and preserves the approved detailed menu", () => {
    const sourceRows = rows();
    const plan = planOntarioTreatmentModuleRestoration({
      bankKey: BANK,
      rows: sourceRows,
      metadata: metadata(),
      classifications: classifications(sourceRows),
    });

    expect(plan.ready).toBe(true);
    expect(plan.questionCount).toBe(PROFILE.modules.length);
    expect(plan.modules).toEqual(PROFILE.modules);
    expect(plan.questionChanges).toHaveLength(PROFILE.modules.length);
    expect(plan.counts).toEqual(Object.fromEntries(PROFILE.modules.map((module: string) => [module, 1])));
    expect(plan.metadata).toMatchObject({
      beforeTotalQuestions: PROFILE.modules.length,
      afterTotalQuestions: PROFILE.modules.length,
      beforeContentVersion: 1,
      afterContentVersion: 2,
      moduleMenuChanged: false,
    });
  });

  it("fails closed if a question changes after classification", () => {
    const sourceRows = rows();
    const plan = planOntarioTreatmentModuleRestoration({
      bankKey: BANK,
      rows: [{ ...sourceRows[0], question: "Changed fixture" }, ...sourceRows.slice(1)],
      metadata: metadata(),
      classifications: classifications(sourceRows),
    });

    expect(plan.ready).toBe(false);
    expect(plan.errors.join(" ")).toContain("changed after classification");
  });

  it("fails closed when metadata inventory does not match the learner-visible row count", () => {
    const sourceRows = rows();
    const plan = planOntarioTreatmentModuleRestoration({
      bankKey: BANK,
      rows: sourceRows,
      metadata: [{ ...metadata()[0], totalQuestions: 503 }],
      classifications: classifications(sourceRows),
    });

    expect(plan.ready).toBe(false);
    expect(plan.errors.join(" ")).toContain("metadata question count does not match");
  });

  it("keeps the classifier hash stable when a release-only database field is present", () => {
    const sourceRow = rows()[0];
    const withReleaseOnlyFields = {
      ...sourceRow,
      topic: "release-only metadata",
      tip: "release-only guidance",
      sourceTitle: "release-only source",
      reviewedBy: "reviewer@example.test",
      reviewedAt: new Date("2026-09-24T00:00:00.000Z"),
    };

    expect(preservedRowHash(withReleaseOnlyFields)).toBe(preservedRowHash(sourceRow));
  });

  it("fails closed when the approved metadata menu is changed or incomplete", () => {
    const sourceRows = rows();
    const incomplete = classifications(sourceRows).slice(1);
    const wrongMetadata = [{ ...metadata()[0], modules: JSON.stringify([PROFILE.modules[0]]) }];
    const plan = planOntarioTreatmentModuleRestoration({
      bankKey: BANK,
      rows: sourceRows,
      metadata: wrongMetadata,
      classifications: incomplete,
    });

    expect(plan.ready).toBe(false);
    expect(plan.errors.join(" ")).toContain("approved detailed module profile");
    expect(plan.errors.join(" ")).toContain("missing a classification");
  });

  it("recognizes a completed restoration so replay is blocked", () => {
    const sourceRows = rows().map((row: ReturnType<typeof rows>[number], index: number) => ({
      ...row,
      module: PROFILE.modules[index],
    }));
    const plan = planOntarioTreatmentModuleRestoration({
      bankKey: BANK,
      rows: sourceRows,
      metadata: [{ ...metadata()[0], totalQuestions: sourceRows.length, contentVersion: 2 }],
      classifications: classifications(sourceRows),
    });

    expect(plan.ready).toBe(true);
    expect(plan.questionChanges).toHaveLength(0);
    expect(isOntarioTreatmentModuleRestored(plan)).toBe(true);
  });

  it("uses the authoritative target and requires an exact multi-bank release confirmation", () => {
    const releaseSource = readFileSync(resolve(import.meta.dirname, "../scripts/recovery/restoreOntarioTreatmentModules.mjs"), "utf8");

    expect(releaseSource).toContain('authoritativeProductionConnectionOptions');
    expect(releaseSource).toContain('mysql.createConnection(authoritativeProductionConnectionOptions())');
    expect(releaseSource).toContain('SELECT DATABASE() AS databaseName');
    expect(releaseSource).toContain('CONFIRM_ONTARIO_TREATMENT_MODULE_RESTORATION');
    expect(releaseSource).toContain('question_content_snapshots');
    expect(releaseSource).toContain('sourceHashExceptModule');
    expect(releaseSource).toContain("COALESCE(`reviewStatus`, 'approved')=?");
    expect(releaseSource).toContain('Before-image snapshot payload mismatch');
    expect(releaseSource).toContain('A partial or duplicate multi-bank release is not permitted.');
    expect(releaseSource).not.toContain('mysql.createConnection(process.env.DATABASE_URL)');
  });
});
