import { describe, expect, it, vi } from "vitest";
import { WPI_CLASS4_BANK, WPI_CLASS4_BLUEPRINT } from "./mockBlueprint";
import { applyWpiBlueprintRelease, planWpiBlueprintRelease } from "./wpiBlueprintRelease";

const meta = { id: 3, bankKey: WPI_CLASS4_BANK, modules: "[]", moduleTargets: "{}", blueprintVersion: 1, contentVersion: 2, minCalcPerMock: null, recallTargetPct: null };
let id = 0;
const rows = WPI_CLASS4_BLUEPRINT.flatMap(area => ["recall", "application"].flatMap(cognitiveLevel =>
  ["yes", "no"].flatMap(isCalc => Array.from({ length: 55 }, () => ({ id: ++id, questionNum: id, bankKey: WPI_CLASS4_BANK,
    module: area.module, cognitiveLevel, isCalc, options: '["A","B","C","D"]', correctIndex: 0, reviewStatus: "approved" } as any)))));
function database() {
  const db = { beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), execute: vi.fn() };
  db.execute.mockResolvedValueOnce([[meta]]).mockResolvedValueOnce([rows]).mockResolvedValueOnce([{ affectedRows: 1 }])
    .mockResolvedValueOnce([[{ ...meta, ...planWpiBlueprintRelease(meta, rows).after, contentVersion: 3 }]]);
  return db;
}
describe("guarded Class IV blueprint release", () => {
  it("preflights parsed, visible, classified questions and the metadata change", () => {
    const plan = planWpiBlueprintRelease(meta, rows);
    expect(plan.canActivate).toBe(true); expect(plan.alreadyConfigured).toBe(false);
    expect(plan.after).toMatchObject({ blueprintVersion: 2025, minCalcPerMock: 16, recallTargetPct: 25 });
    for (const replacement of [{ cognitiveLevel: null }, { reviewStatus: "in_review" }, { reviewStatus: "rejected" }, { options: "bad JSON" }]) {
      expect(planWpiBlueprintRelease(meta, rows.map(q => ({ ...q, ...replacement }))).canActivate).toBe(false);
    }
  });
  it("supports documented historic module aliases", () => {
    const legacy = rows.map(q => ({ ...q, module: q.module === WPI_CLASS4_BLUEPRINT[1].module ? "Treatment Process" : q.module }));
    expect(planWpiBlueprintRelease(meta, legacy).canActivate).toBe(true);
  });
  it("backs up the locked snapshot before updating exactly one metadata row", async () => {
    const db = database();
    const backup = vi.fn(async () => { expect(db.execute).toHaveBeenCalledTimes(2); });
    const result = await applyWpiBlueprintRelease(db, planWpiBlueprintRelease(meta, rows).sha256, backup);
    expect(result.applied).toBe(true);
    expect(backup).toHaveBeenCalledWith({ metadata: meta, questions: rows });
    expect(db.execute.mock.calls[2][0]).toContain("contentVersion = contentVersion + 1");
    expect(db.execute.mock.calls[2][1].slice(-2)).toEqual([meta.id, WPI_CLASS4_BANK]);
    expect(db.commit).toHaveBeenCalledOnce();
  });
  it("rolls back on a changed baseline or failed durable backup without issuing an update", async () => {
    for (const stale of [true, false]) {
      const db = database();
      await expect(applyWpiBlueprintRelease(db, stale ? "a".repeat(64) : planWpiBlueprintRelease(meta, rows).sha256,
        async () => { throw new Error("disk full"); })).rejects.toThrow(stale ? "changed" : "disk full");
      expect(db.execute).toHaveBeenCalledTimes(2); expect(db.rollback).toHaveBeenCalledOnce(); expect(db.commit).not.toHaveBeenCalled();
    }
  });
  it("verifies after applying and is idempotent", async () => {
    const db = database(); db.execute.mockReset().mockResolvedValueOnce([[meta]]).mockResolvedValueOnce([rows])
      .mockResolvedValueOnce([{ affectedRows: 1 }]).mockResolvedValueOnce([[meta]]);
    await expect(applyWpiBlueprintRelease(db, planWpiBlueprintRelease(meta, rows).sha256, async () => {})).rejects.toThrow("verification");
    expect(db.rollback).toHaveBeenCalledOnce();
    const configured = { ...meta, ...planWpiBlueprintRelease(meta, rows).after };
    const again = database(); again.execute.mockReset().mockResolvedValueOnce([[configured]]).mockResolvedValueOnce([rows]);
    const backup = vi.fn();
    expect((await applyWpiBlueprintRelease(again, "a".repeat(64), backup)).applied).toBe(false);
    expect(again.execute).toHaveBeenCalledTimes(2); expect(backup).not.toHaveBeenCalled();
  });
});
