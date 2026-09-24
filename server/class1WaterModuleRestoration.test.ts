import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
// @ts-ignore The guarded restoration planner is a standalone ESM module.
import { CLASS1_WATER_BANK, CLASS1_WATER_MODULE_ORDER, isClass1WaterModuleRestored, planClass1WaterModuleRestoration } from "../scripts/lib/class1WaterModuleRestoration.mjs";

const BANK: string = CLASS1_WATER_BANK;
const MODULES: string[] = [...CLASS1_WATER_MODULE_ORDER];

function rows() {
  return MODULES.map((module, index) => ({
    id: index + 1,
    bankKey: BANK,
    questionNum: index + 1,
    module: "Water Treatment",
    reviewStatus: "unreviewed",
  }));
}

function classifications() {
  return MODULES.map((module, index) => ({
    questionNum: index + 1,
    module,
    confidence: 92,
    rationale: `Tests ${module}.`,
  }));
}

function metadata() {
  return [{
    bankKey: BANK,
    modules: JSON.stringify(["Safety", "Water Treatment"]),
    totalQuestions: 600,
    contentVersion: 1,
  }];
}

describe("Class 1 Water module restoration plan", () => {
  it("restores only backed module filters and increments the content version", () => {
    const plan = planClass1WaterModuleRestoration({ rows: rows(), metadata: metadata(), classifications: classifications() });

    expect(plan.ready).toBe(true);
    expect(plan.questionCount).toBe(MODULES.length);
    expect(plan.modules).toEqual(MODULES);
    expect(plan.counts).toEqual(Object.fromEntries(MODULES.map((module) => [module, 1])));
    expect(plan.questionChanges).toHaveLength(MODULES.length);
    expect(plan.metadata).toMatchObject({
      beforeModules: ["Safety", "Water Treatment"],
      afterModules: MODULES,
      beforeTotalQuestions: 600,
      afterTotalQuestions: MODULES.length,
      beforeContentVersion: 1,
      afterContentVersion: 2,
    });
    expect(plan.scopeDigest).toMatch(/^[a-f0-9]{64}$/);
  });

  it("fails closed when a learner-visible question lacks a classification", () => {
    const plan = planClass1WaterModuleRestoration({
      rows: rows(),
      metadata: metadata(),
      classifications: classifications().slice(1),
    });

    expect(plan.ready).toBe(false);
    expect(plan.errors.join(" ")).toContain("does not match question count");
    expect(plan.errors.join(" ")).toContain("missing a classification");
  });

  it("fails closed for an unsupported module or a staged question", () => {
    const invalidClassification = classifications();
    invalidClassification[0] = { ...invalidClassification[0], module: "Safety" };
    const stagedRows = rows();
    stagedRows[1] = { ...stagedRows[1], reviewStatus: "in_review" };

    const plan = planClass1WaterModuleRestoration({
      rows: stagedRows,
      metadata: metadata(),
      classifications: invalidClassification,
    });

    expect(plan.ready).toBe(false);
    expect(plan.errors.join(" ")).toContain("unsupported module");
    expect(plan.errors.join(" ")).toContain("not learner-visible");
  });

  it("recognizes a completed restoration so its release cannot be replayed", () => {
    const restoredRows = rows().map((row, index) => ({ ...row, module: MODULES[index] }));
    const restoredMetadata = [{
      bankKey: BANK,
      modules: JSON.stringify(MODULES),
      totalQuestions: MODULES.length,
      contentVersion: 2,
    }];

    const plan = planClass1WaterModuleRestoration({
      rows: restoredRows,
      metadata: restoredMetadata,
      classifications: classifications(),
    });

    expect(plan.ready).toBe(true);
    expect(plan.questionChanges).toHaveLength(0);
    expect(isClass1WaterModuleRestored(plan)).toBe(true);
  });

  it("uses the active external cutover target rather than a generic database URL", () => {
    const releaseSource = readFileSync(resolve(import.meta.dirname, "../scripts/recovery/restoreClass1WaterModules.mjs"), "utf8");

    expect(releaseSource).toContain('authoritativeProductionConnectionOptions');
    expect(releaseSource).toContain('mysql.createConnection(authoritativeProductionConnectionOptions())');
    expect(releaseSource).not.toContain('mysql.createConnection(process.env.DATABASE_URL)');
  });
});
