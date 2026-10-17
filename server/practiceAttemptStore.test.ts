import { describe, expect, it, vi } from "vitest";
import { MySqlDialect, getTableConfig } from "drizzle-orm/mysql-core";
import { questionAttempts, studentProfiles, users, type InsertQuestionAttempt } from "../drizzle/schema";
import { practiceOperationHash, savePracticeAttempt } from "./practiceAttemptStore";

const input = { examType: "class1-water", bankKey: "class1-water", questionId: 101,
  selectedIndex: 2, quizMode: "standard", sessionId: "550e8400-e29b-41d4-a716-446655440000", attemptToken: "original-receipt" };
const attempt = (): InsertQuestionAttempt => ({ userId: 42, studentEmail: "operator@example.com",
  examType: input.examType, bankKey: input.bankKey, courseKey: input.examType,
  questionId: 101, selectedIndex: 2, topic: "Disinfection", correct: "yes", quizMode: "standard",
  sessionId: input.sessionId, operationId: "550e8400-e29b-41d4-a716-446655440001",
  operationPayloadHash: practiceOperationHash("actor-42", input) });

/** In-memory transactional adapter: the unique insert, current reads and rollback
 * are modeled explicitly, rather than treating all DB calls as successful. */
function database() {
  let rows: any[] = [], profile: any = null, tail = Promise.resolve();
  let fail = false;
  const dialect = new MySqlDialect();
  const lock = vi.fn();
  const db: any = {
    select: () => ({ from: (table: unknown) => ({ where: (condition: any) => {
      const params = dialect.sqlToQuery(condition).params;
      const read = () => table === questionAttempts ? rows.filter(r => r.operationId === params[0]) : table === users ? [] : profile ? [profile] : [];
      return { limit: () => Object.assign(Promise.resolve().then(read), { for: async (mode: string) => { lock(mode); return read(); } }) };
    } }) }),
    insert: (table: unknown) => ({ values: (value: any) => {
      if (table === studentProfiles) return { onDuplicateKeyUpdate: async () => { profile ??= { id: 1, topicAccuracy: "{}", totalAttempts: 0, currentStreak: 0, longestStreak: 0, lastActiveDate: null }; } };
      return Promise.resolve().then(() => {
        if (value.operationId && rows.some(r => r.operationId === value.operationId)) throw { cause: { code: "ER_DUP_ENTRY", errno: 1062 } };
        rows.push({ ...value });
      });
    } }),
    update: () => ({ set: (values: any) => ({ where: async () => { if (fail) throw new Error("profile failed"); profile = { ...profile, ...values }; } }) }),
    transaction: async (callback: any) => {
      let release!: () => void;
      const before = tail;
      tail = new Promise<void>(resolve => { release = resolve; });
      await before;
      const snapshot = structuredClone({ rows, profile });
      try { return await callback(db); }
      catch (error) { rows = snapshot.rows; profile = snapshot.profile; throw error; }
      finally { release(); }
    },
  };
  return { db, lock, rows: () => rows, profile: () => profile, fail: (value: boolean) => { fail = value; } };
}

describe("persistent practice save", () => {
  it("declares a nullable globally unique operation ID distinct from session ID", () => {
    const config = getTableConfig(questionAttempts);
    expect(questionAttempts.operationId.notNull).toBe(false);
    expect(config.indexes.find(i => i.config.name === "qa_operation_id_unique")?.config.unique).toBe(true);
  });
  it.each([
    { examType: "another-course" }, { bankKey: "another-bank" }, { questionId: 102 },
    { selectedIndex: 1 }, { quizMode: "quick10" }, { sessionId: "other-session" },
    { confidence: "low" }, { bookmarked: true }, { attemptToken: "different-receipt" },
  ])("binds the exact payload %j", change => {
    expect(practiceOperationHash("actor-42", { ...input, ...change })).not.toBe(practiceOperationHash("actor-42", input));
  });
  it("binds the actor and canonicalizes only absent optional defaults", () => {
    expect(practiceOperationHash("other-actor", input)).not.toBe(practiceOperationHash("actor-42", input));
    expect(practiceOperationHash("actor-42", { ...input, confidence: null, bookmarked: false })).toBe(practiceOperationHash("actor-42", input));
  });
  it("acknowledges a retry without any repeated profile write", async () => {
    const d = database();
    expect(await savePracticeAttempt(d.db, attempt())).toEqual({ success: true, correct: true });
    expect(await savePracticeAttempt(d.db, attempt())).toEqual({ success: true, correct: true });
    expect(d.rows()).toHaveLength(1); expect(d.profile().totalAttempts).toBe(1);
    expect(d.lock).toHaveBeenCalledTimes(1);
    expect(d.lock).toHaveBeenCalledWith("update");
  });
  it("uses the saved score on retry, not a later rescore of edited content", async () => {
    const d = database(); await savePracticeAttempt(d.db, attempt());
    expect(await savePracticeAttempt(d.db, { ...attempt(), correct: "no" })).toEqual({ success: true, correct: true });
  });
  it("rejects another actor or changed payload without exposing saved correctness", async () => {
    const d = database(); await savePracticeAttempt(d.db, attempt());
    expect(await savePracticeAttempt(d.db, { ...attempt(), userId: 99, operationPayloadHash: "different-actor" })).toEqual({ success: false });
    expect(await savePracticeAttempt(d.db, { ...attempt(), selectedIndex: 1, operationPayloadHash: "different-payload" })).toEqual({ success: false });
    expect(d.rows()).toHaveLength(1); expect(d.profile().totalAttempts).toBe(1);
  });
  it("concurrent duplicates use the unique insert and increment the profile once", async () => {
    const d = database();
    const results = await Promise.all(Array.from({ length: 12 }, () => savePracticeAttempt(d.db, attempt())));
    expect(results).toEqual(Array.from({ length: 12 }, () => ({ success: true, correct: true })));
    expect(d.rows()).toHaveLength(1); expect(d.profile().totalAttempts).toBe(1);
  });
  it("different operations in the same session each increment the locked profile", async () => {
    const d = database();
    await Promise.all([savePracticeAttempt(d.db, attempt()), savePracticeAttempt(d.db, { ...attempt(), operationId: "550e8400-e29b-41d4-a716-446655440002" })]);
    expect(d.rows()).toHaveLength(2); expect(d.profile().totalAttempts).toBe(2);
    expect(JSON.parse(d.profile().topicAccuracy).Disinfection).toEqual({ correct: 2, total: 2 });
  });
  it("rolls back attempt and profile together and allows a clean retry", async () => {
    const d = database(); d.fail(true);
    await expect(savePracticeAttempt(d.db, attempt())).rejects.toThrow("profile failed");
    expect(d.rows()).toEqual([]); expect(d.profile()).toBeNull();
    d.fail(false); expect(await savePracticeAttempt(d.db, attempt())).toEqual({ success: true, correct: true });
    expect(d.profile().totalAttempts).toBe(1);
  });
  it("legacy clients with NULL operation IDs are not accidentally deduplicated", async () => {
    const d = database();
    await savePracticeAttempt(d.db, { ...attempt(), operationId: null, operationPayloadHash: null });
    await savePracticeAttempt(d.db, { ...attempt(), operationId: null, operationPayloadHash: null });
    expect(d.rows()).toHaveLength(2); expect(d.profile().totalAttempts).toBe(2);
  });
});
