import { createHash } from "node:crypto";
import { questions } from "../drizzle/schema";
import { parseLearnerQuestions } from "./routers/quizRouter";
import { WPI_CLASS4_BANK, WPI_CLASS4_BLUEPRINT, WPI_CLASS4_BLUEPRINT_VERSION, selectBlueprintQuestions } from "./mockBlueprint";

type Meta = { id: number; bankKey: string; modules: string; moduleTargets: string | null; blueprintVersion: number; contentVersion: number; minCalcPerMock: number | null; recallTargetPct: number | null };
type Row = typeof questions.$inferSelect;
export function planWpiBlueprintRelease(meta: Meta, rows: Row[]) {
  if (meta.bankKey !== WPI_CLASS4_BANK || rows.some(row => row.bankKey !== WPI_CLASS4_BANK)) throw new Error("Wrong question bank");
  const ordered = [...rows].sort((a, b) => a.questionNum - b.questionNum);
  const sha256 = createHash("sha256").update(JSON.stringify({ meta, rows: ordered })).digest("hex");
  const visible = ordered.filter(row => row.reviewStatus !== "rejected" && row.reviewStatus !== "in_review");
  const pool = parseLearnerQuestions(visible);
  const errors: string[] = [];
  try { selectBlueprintQuestions(pool, WPI_CLASS4_BLUEPRINT, 100, () => 0.5); }
  catch (error) { errors.push(error instanceof Error ? error.message : String(error)); }
  const after = { modules: JSON.stringify(WPI_CLASS4_BLUEPRINT.map(a => a.module)),
    moduleTargets: JSON.stringify(Object.fromEntries(WPI_CLASS4_BLUEPRINT.map(a => [a.module, a.total]))),
    blueprintVersion: WPI_CLASS4_BLUEPRINT_VERSION, minCalcPerMock: 16, recallTargetPct: 25 };
  const alreadyConfigured = Object.entries(after).every(([key, value]) => meta[key as keyof Meta] === value);
  return { sha256, canActivate: errors.length === 0, errors, total: rows.length, eligible: pool.length,
    malformedVisible: visible.length - pool.length,
    unclassified: pool.filter(q => !["recall", "application"].includes(q.cognitiveLevel ?? "")).length,
    coverage: WPI_CLASS4_BLUEPRINT.map(a => ({ module: a.module,
      recall: pool.filter(q => q.module === a.module && q.cognitiveLevel === "recall").length,
      application: pool.filter(q => q.module === a.module && q.cognitiveLevel === "application").length,
      calculations: pool.filter(q => q.module === a.module && q.isCalc).length })),
    alreadyConfigured, after };
}
// Restricted interface: read/lock the bank, change one metadata row. No question or learner writes.
export async function applyWpiBlueprintRelease(db: { execute: (...args: any[]) => Promise<any>; beginTransaction: () => Promise<any>; commit: () => Promise<any>; rollback: () => Promise<any> },
  expectedHash: string, writeBackup: (snapshot: unknown) => Promise<void>) {
  if (!/^[a-f0-9]{64}$/.test(expectedHash)) throw new Error("Reviewed SHA-256 required");
  await db.beginTransaction();
  try {
    const [metas] = await db.execute("SELECT * FROM question_bank_meta WHERE bankKey = ? FOR UPDATE", [WPI_CLASS4_BANK]);
    if (metas.length !== 1) throw new Error("Expected one bank metadata row");
    const [rows] = await db.execute("SELECT * FROM questions WHERE bankKey = ? ORDER BY questionNum FOR UPDATE", [WPI_CLASS4_BANK]);
    const plan = planWpiBlueprintRelease(metas[0], rows);
    if (!plan.canActivate) throw new Error(plan.errors.join("; "));
    if (plan.alreadyConfigured) { await db.commit(); return { ...plan, applied: false }; }
    if (plan.sha256 !== expectedHash) throw new Error("Bank changed since review; run a fresh dry-run");
    await writeBackup({ metadata: metas[0], questions: rows });
    const [result] = await db.execute("UPDATE question_bank_meta SET modules = ?, moduleTargets = ?, blueprintVersion = ?, minCalcPerMock = ?, recallTargetPct = ?, contentVersion = contentVersion + 1 WHERE id = ? AND bankKey = ?",
      [plan.after.modules, plan.after.moduleTargets, plan.after.blueprintVersion, plan.after.minCalcPerMock, plan.after.recallTargetPct, metas[0].id, WPI_CLASS4_BANK]);
    if (result.affectedRows !== 1) throw new Error("Expected one metadata update");
    const [after] = await db.execute("SELECT * FROM question_bank_meta WHERE bankKey = ?", [WPI_CLASS4_BANK]);
    if (after.length !== 1 || !planWpiBlueprintRelease(after[0], rows).alreadyConfigured) throw new Error("Blueprint verification failed");
    await db.commit(); return { ...plan, applied: true };
  } catch (error) { await db.rollback(); throw error; }
}
