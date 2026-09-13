import { describe, expect, it, vi } from "vitest";
const { ontarioMathGuide } = await import(new URL("./content/ontarioMathGuide.mjs", import.meta.url).href);
const { applyMathGuideRepair, planMathGuideRepair, mathGuideSlug } = await import(new URL("../scripts/lib/mathGuideRepair.mjs", import.meta.url).href);
import { WW_STEPS, WW_LABEL_INFO } from "../client/src/lib/wastewaterData";
const old = { ...ontarioMathGuide, id: 4, content: "old article", updatedAt: "2026-09-01", published: 1 };
function database(after = { ...old, ...ontarioMathGuide }) {
  return { beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), execute: vi.fn()
    .mockResolvedValueOnce([[old]]).mockResolvedValueOnce([{ affectedRows: 1 }]).mockResolvedValueOnce([[after]]) };
}
describe("slug-specific math guide correction", () => {
  it("corrects the actual math article and retains useful calculations", () => {
    expect(ontarioMathGuide.slug).toBe("ontario-water-operator-exam-math-formulas-cheat-sheet");
    const text = JSON.stringify(ontarioMathGuide);
    expect(text).toContain("https://owwco.ca/preparing-for-your-exam/");
    expect(text).toContain("formula/conversion tables");
    expect(text).toContain("OIT exams continue to use Ontario content");
    expect(text).toContain("188 litres/day");
    expect(text).toContain("12% available chlorine by mass");
    expect(text).not.toMatch(/20% of every|does not provide a formula sheet|formulas you must memorize/i);
  });
  it("refuses missing, duplicate or wrong articles", () => {
    for (const rows of [[], [old, old], [{ ...old, slug: "other" }]]) expect(() => planMathGuideRepair(rows)).toThrow();
  });
  it("backs up before a scoped update and preserves publication and identity fields", async () => {
    const db = database();
    const backup = vi.fn(async () => { expect(db.execute).toHaveBeenCalledTimes(1); });
    const result = await applyMathGuideRepair(db, planMathGuideRepair([old]).beforeSha256, backup);
    expect(result.applied).toBe(true);
    expect(backup).toHaveBeenCalledWith(old);
    const [sql, args] = db.execute.mock.calls[1];
    expect(sql).toContain("WHERE id = ? AND slug = ?");
    expect(sql.split(" WHERE ")[0]).not.toMatch(/SET.*(?:published|author|createdAt|slug)\s*=/);
    expect(args.slice(-2)).toEqual([old.id, mathGuideSlug]);
    expect(db.commit).toHaveBeenCalledOnce();
  });
  it("refuses concurrent edits and backup failures before any update", async () => {
    for (const stale of [true, false]) {
      const db = database();
      await expect(applyMathGuideRepair(db, stale ? "a".repeat(64) : planMathGuideRepair([old]).beforeSha256,
        async () => { throw new Error("disk full"); })).rejects.toThrow();
      expect(db.execute).toHaveBeenCalledTimes(1);
      expect(db.rollback).toHaveBeenCalledOnce();
    }
  });
  it("rolls back if read-back does not match and makes repeated application a no-op", async () => {
    const db = database(old);
    await expect(applyMathGuideRepair(db, planMathGuideRepair([old]).beforeSha256, async () => {})).rejects.toThrow("verification");
    expect(db.rollback).toHaveBeenCalledOnce();
    const already = database();
    already.execute.mockReset().mockResolvedValueOnce([[{ ...old, ...ontarioMathGuide }]]);
    const backup = vi.fn();
    expect((await applyMathGuideRepair(already, "a".repeat(64), backup)).applied).toBe(false);
    expect(backup).not.toHaveBeenCalled();
    expect(already.execute).toHaveBeenCalledTimes(1);
  });
});
describe("wastewater regulatory scope", () => {
  it("separates operating illustrations from site-specific legal requirements", () => {
    expect(WW_STEPS).toHaveLength(7);
    for (const step of WW_STEPS) expect(step.regulation).toMatch(/facility|NASM/);
    const content = JSON.stringify([WW_STEPS, WW_LABEL_INFO]);
    expect(content).not.toMatch(/O\. Reg\. 129\/04 (requires|Schedule)|Category 1 biosolids|without site-specific approval|minimum 25 mJ|1–3 RPM|<50% TSS removal minimum/);
    expect(WW_STEPS.find(step => step.id === "sludge")?.regulation).toContain("O. Reg. 267/03");
    expect(WW_LABEL_INFO.mlss).toContain("inert solids");
  });
});
