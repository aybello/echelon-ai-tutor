import { issuePracticeReceipt, practiceIdentity } from "./practiceQuestionReceipt";
import { resolveAccessForRequest } from "./_core/accessService";
/**
 * Tests for quiz.logAttempt server-scoring behaviour.
 * Verifies that the server looks up correctIndex from the DB and
 * ignores any client-supplied "correct" field.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { appRouter } from "./routers";
import { studentProfiles } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

vi.mock("./_core/accessService", () => ({ resolveAccessForRequest: vi.fn().mockResolvedValue(true) }));
vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./_core/learningIdentity", () => ({
  resolveLearningIdentity: vi.fn().mockResolvedValue({
    userId: 42,
    studentEmail: "operator@example.com",
    orgId: 7,
    organizationMemberId: 99,
  }),
}));
vi.mock("./teams/attemptAttribution", () => ({ resolveAttemptAttribution: vi.fn(), validateIssuedAttribution: vi.fn() }));

import { getDb } from "./db";
import { resolveLearningIdentity } from "./_core/learningIdentity";
import { validateIssuedAttribution } from "./teams/attemptAttribution";

// Minimal question row returned by DB lookup
const QUESTION_ROW = { correctIndex: 2, topic: "Disinfection", difficulty: "medium", module: "Water Treatment" };

const PROFILE_ROW = { id: 1, userId: 42, studentEmail: null, topicAccuracy: "{}", totalAttempts: 0, currentStreak: 0, longestStreak: 0, totalSessions: 0, lastActiveDate: null };
type LegacyProfile = Omit<typeof PROFILE_ROW, "userId" | "studentEmail" | "lastActiveDate"> & { userId: null; studentEmail: string; lastActiveDate: string | null };

function makeDb(questionRow = QUESTION_ROW, insertResult = [], legacyProfile: LegacyProfile | null = null) {
  const insertValues = vi.fn().mockResolvedValue(insertResult);
  const profileValues = vi.fn().mockReturnValue({ onDuplicateKeyUpdate: vi.fn().mockResolvedValue([]) });
  const insertInto = vi.fn().mockImplementation(table => table === studentProfiles
    ? { values: profileValues }
    : { values: insertValues });
  const selectLimit = vi.fn().mockResolvedValue(questionRow ? [questionRow] : []);
  const selectWhere = vi.fn().mockReturnValue({ limit: selectLimit });
  const profileReads: { sql: string; params: unknown[]; lock: string | null }[] = [];
  const profileWhere = vi.fn().mockImplementation(predicate => {
    const query = new MySqlDialect().sqlToQuery(predicate);
    // Source discovery/revalidation must not return the owned destination row.
    const isLegacySource = query.sql.includes("`student_profiles`.`userId` is null");
    const rows = isLegacySource ? (legacyProfile ? [legacyProfile] : []) : [PROFILE_ROW];
    return { limit: vi.fn().mockImplementation(() => {
      const read = { sql: query.sql, params: query.params, lock: null as string | null };
      profileReads.push(read);
      // Drizzle's limit query is both awaitable and chainable with FOR UPDATE.
      return Object.assign(Promise.resolve(rows), { for: vi.fn().mockImplementation(lock => {
        read.lock = lock;
        return Promise.resolve(rows);
      }) });
    }) };
  });
  const selectFrom = vi.fn().mockImplementation(table => table === studentProfiles
    ? { where: profileWhere }
    : { where: selectWhere, innerJoin: vi.fn().mockReturnValue({ where: selectWhere }) });
  const selectFn = vi.fn().mockReturnValue({ from: selectFrom });
  const profileSet = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) });
  // The atomic practice write also materializes and updates the learner profile.
  const db: any = {
    select: selectFn,
    insert: insertInto,
    update: vi.fn().mockReturnValue({ set: profileSet }),
  };
  db.transaction = vi.fn(async callback => callback(db));
  return { db, insertValues, insertInto, selectFn, selectWhere, profileValues, profileReads, profileSet };
}

function makeCtx(user: TrpcContext["user"] = null): TrpcContext {
  return {
    user,
    studentEmail: "operator@example.com",
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const BASE_INPUT = {
  examType: "class1-water",
  questionId: 101,
  selectedIndex: 2, // matches correctIndex → correct
  quizMode: "standard" as const,
  bankKey: "class1-water",
  attemptToken: "",
  sessionId: "550e8400-e29b-41d4-a716-446655440000",
};

describe("quiz.logAttempt — server scoring", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(resolveAccessForRequest).mockResolvedValue(true);
    vi.mocked(resolveLearningIdentity).mockResolvedValue({ userId: 42, studentEmail: "operator@example.com", orgId: 7, organizationMemberId: 99 });
    vi.mocked(validateIssuedAttribution).mockImplementation(async (_identity, _key, issued) => issued ?? { orgId: null, organizationMemberId: null, flexLicenceId: null });
    const { owner } = await practiceIdentity(makeCtx());
    BASE_INPUT.attemptToken = await issuePracticeReceipt("class1-water", [101], owner, false);
  });

  it.each([undefined, "forged-receipt"])("rejects unissued answers without a valid receipt", async attemptToken => {
    const { db, insertInto } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    const result = await appRouter.createCaller(makeCtx()).quiz.logAttempt({ ...BASE_INPUT, attemptToken });
    expect(result).toEqual({ success: false });
    expect(insertInto).not.toHaveBeenCalled();
  });

  it("scores the free governed 309A bank using its active public beta table", async () => {
    const { db, insertValues, selectWhere } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    const { owner } = await practiceIdentity(makeCtx());
    const attemptToken = await issuePracticeReceipt("electrician-309a", [101], owner, false);
    const result = await appRouter.createCaller(makeCtx()).quiz.logAttempt({ ...BASE_INPUT, bankKey: "electrician-309a", attemptToken });
    expect(result).toEqual({ success: true, correct: true });
    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({ bankKey: "electrician-309a", courseKey: "electrician-309a" }));
    const sql = new MySqlDialect().sqlToQuery(selectWhere.mock.calls[0][0]);
    expect(sql.sql).toContain("certification_bank_versions");
    expect(sql.sql).toContain("programKey");
    expect(sql.params).toContain("beta_approved");
    expect(sql.params).toContain("beta");
  });

  it("rejects paid receipts after entitlement is revoked", async () => {
    vi.mocked(resolveAccessForRequest).mockResolvedValue(false);
    const { db, insertInto } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    expect(await appRouter.createCaller(makeCtx()).quiz.logAttempt(BASE_INPUT)).toEqual({ success: false });
    expect(insertInto).not.toHaveBeenCalled();
  });

  it("scores issued guest previews without saving unowned learner records", async () => {
    vi.mocked(resolveAccessForRequest).mockResolvedValue(false);
    vi.mocked(resolveLearningIdentity).mockResolvedValue({ userId: null, studentEmail: null, orgId: null, organizationMemberId: null });
    const ctx = { ...makeCtx(), studentEmail: null };
    const { owner } = await practiceIdentity(ctx);
    const attemptToken = await issuePracticeReceipt("class1-water", [101], owner, true);
    const { db, insertInto } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    expect(await appRouter.createCaller(ctx).quiz.logAttempt({ ...BASE_INPUT, attemptToken })).toEqual({ success: true, correct: true });
    expect(insertInto).not.toHaveBeenCalled();
  });

  it("derives stored course from the issued bank, not the caller's examType", async () => {
    const { db, insertValues } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    await appRouter.createCaller(makeCtx()).quiz.logAttempt({ ...BASE_INPUT, bankKey: "class1", examType: "wpi-class4-wastewater" });
    expect(insertValues.mock.calls[0][0]).toMatchObject({ bankKey: "class1-water", courseKey: "class1-water", examType: "class1-water" });
  });

  it("does not let practice submissions manufacture mock attempts", async () => {
    expect(await appRouter.createCaller(makeCtx()).quiz.logAttempt({ ...BASE_INPUT, quizMode: "mock" })).toEqual({ success: false });
    expect(getDb).not.toHaveBeenCalled();
  });

  it("returns { success: true, correct: true } when selectedIndex matches correctIndex", async () => {
    const { db } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.quiz.logAttempt({ ...BASE_INPUT, selectedIndex: 2 });
    expect(result).toEqual({ success: true, correct: true });
  });

  it("returns { success: true, correct: false } when selectedIndex does not match correctIndex", async () => {
    const { db } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.quiz.logAttempt({ ...BASE_INPUT, selectedIndex: 0 });
    expect(result).toEqual({ success: true, correct: false });
  });

  it("scores with no legacy source without locking the missing email range", async () => {
    const { db, insertValues, profileReads, profileValues, profileSet } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    expect(await appRouter.createCaller(makeCtx()).quiz.logAttempt(BASE_INPUT)).toEqual({ success: true, correct: true });
    expect(insertValues).toHaveBeenCalledTimes(1);
    expect(profileReads).toHaveLength(2);
    expect(profileReads[0]).toEqual({
      sql: "(`student_profiles`.`studentEmail` = ? and `student_profiles`.`userId` is null)",
      params: ["operator@example.com"], lock: null,
    });
    expect(profileReads[1]).toEqual({ sql: "`student_profiles`.`userId` = ?", params: [42], lock: "update" });
    const seed = profileValues.mock.calls[0][0];
    expect(seed).toMatchObject({ userId: 42, studentEmail: null, topicAccuracy: "{}", weakTopics: "[]", strongTopics: "[]" });
    for (const field of ["currentStreak", "longestStreak", "totalSessions", "lastActiveDate"]) expect(seed).not.toHaveProperty(field);
    expect(profileSet).toHaveBeenCalledTimes(1);
    expect(profileSet).toHaveBeenCalledWith(expect.objectContaining({ totalAttempts: 1, topicAccuracy: JSON.stringify({ Disinfection: { correct: 1, total: 1 } }) }));
  });

  it("revalidates a discovered legacy source under lock and seeds activity, never mastery", async () => {
    const legacy: LegacyProfile = { ...PROFILE_ROW, id: 7, userId: null, studentEmail: "operator@example.com", totalAttempts: 50,
      topicAccuracy: JSON.stringify({ Hydraulics: { correct: 40, total: 50 } }), currentStreak: 4, longestStreak: 9,
      totalSessions: 12, lastActiveDate: "2026-10-16" };
    const { db, profileReads, profileValues, profileSet } = makeDb(QUESTION_ROW, [], legacy);
    vi.mocked(getDb).mockResolvedValue(db);
    expect(await appRouter.createCaller(makeCtx()).quiz.logAttempt(BASE_INPUT)).toEqual({ success: true, correct: true });
    expect(profileReads).toHaveLength(3);
    expect(profileReads[0]).toMatchObject({ params: [legacy.studentEmail], lock: null });
    expect(profileReads[1]).toEqual({
      sql: "(`student_profiles`.`id` = ? and `student_profiles`.`userId` is null and `student_profiles`.`studentEmail` = ?)",
      params: [legacy.id, legacy.studentEmail], lock: "update",
    });
    expect(profileReads[2]).toEqual({ sql: "`student_profiles`.`userId` = ?", params: [42], lock: "update" });
    expect(profileValues).toHaveBeenCalledTimes(1);
    expect(profileValues).toHaveBeenCalledWith(expect.objectContaining({ userId: 42, studentEmail: null, topicAccuracy: "{}",
      weakTopics: "[]", strongTopics: "[]", currentStreak: 4, longestStreak: 9, totalSessions: 12, lastActiveDate: legacy.lastActiveDate }));
    expect(profileValues.mock.calls[0][0]).not.toHaveProperty("totalAttempts");
    expect(profileSet).toHaveBeenCalledTimes(1);
    expect(profileSet).toHaveBeenCalledWith(expect.objectContaining({ totalAttempts: 1, topicAccuracy: JSON.stringify({ Disinfection: { correct: 1, total: 1 } }) }));
  });

  it("persists only the server-signed, revalidated membership attribution", async () => {
    const { db, insertValues } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    const attribution = { orgId: 7, organizationMemberId: 99, flexLicenceId: null };
    const { owner } = await practiceIdentity(makeCtx());
    const attemptToken = await issuePracticeReceipt("class1-water", [101], owner, false, attribution);
    const caller = appRouter.createCaller(makeCtx());
    await caller.quiz.logAttempt({ ...BASE_INPUT, attemptToken });
    const insertedRow = insertValues.mock.calls[0][0];
    expect(insertedRow).toMatchObject(attribution);
    expect(validateIssuedAttribution).toHaveBeenCalledWith(expect.objectContaining({ userId: 42 }), "class1-water", attribution);
  });

  it("keeps legacy receipts unreported even when current learning identity has a membership", async () => {
    const { db, insertValues } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    await appRouter.createCaller(makeCtx()).quiz.logAttempt(BASE_INPUT);
    expect(insertValues.mock.calls[0][0]).toMatchObject({ orgId: null, organizationMemberId: null, flexLicenceId: null });
  });

  it("does not persist stale attribution after the membership validator rejects it", async () => {
    const { db, insertValues } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    vi.mocked(validateIssuedAttribution).mockResolvedValue({ orgId: null, organizationMemberId: null, flexLicenceId: null });
    const { owner } = await practiceIdentity(makeCtx());
    const attemptToken = await issuePracticeReceipt("class1-water", [101], owner, false, { orgId: 7, organizationMemberId: 99, flexLicenceId: null });
    await appRouter.createCaller(makeCtx()).quiz.logAttempt({ ...BASE_INPUT, attemptToken });
    expect(insertValues.mock.calls[0][0]).toMatchObject({ orgId: null, organizationMemberId: null, flexLicenceId: null });
  });

  it("persists the canonical bankKey", async () => {
    const { db, insertValues } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeCtx());
    await caller.quiz.logAttempt(BASE_INPUT);
    const insertedRow = insertValues.mock.calls[0][0];
    expect(insertedRow.bankKey).toBe("class1-water");
  });

  it("scores by bankKey plus the learner-facing question number, not the database primary key", async () => {
    const { db, selectWhere } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeCtx());
    await caller.quiz.logAttempt(BASE_INPUT);

    const lookup = new MySqlDialect().sqlToQuery(selectWhere.mock.calls[0][0]);
    expect(lookup.sql).toContain("`questions`.`bankKey` = ?");
    expect(lookup.sql).toContain("`questions`.`questionNum` = ?");
    expect(lookup.sql).not.toContain("`questions`.`id` = ?");
    expect(lookup.params).toEqual([BASE_INPUT.bankKey, BASE_INPUT.questionId, "in_review", "rejected"]);
  });

  it("persists selectedIndex in the DB row", async () => {
    const { db, insertValues } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeCtx());
    await caller.quiz.logAttempt({ ...BASE_INPUT, selectedIndex: 1 });
    const insertedRow = insertValues.mock.calls[0][0];
    expect(insertedRow.selectedIndex).toBe(1);
  });

  it("returns { success: false } when DB is unavailable", async () => {
    vi.mocked(getDb).mockResolvedValue(null);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.quiz.logAttempt(BASE_INPUT);
    expect(result.success).toBe(false);
  });

  it("returns { success: false } when question is not found in DB", async () => {
    const { db } = makeDb(null as any);
    vi.mocked(getDb).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.quiz.logAttempt(BASE_INPUT);
    expect(result.success).toBe(false);
  });

  it("never trusts a client-supplied correct field — only server scoring counts", async () => {
    // selectedIndex=0 does NOT match correctIndex=2 → must be false regardless
    const { db, insertValues } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.quiz.logAttempt({ ...BASE_INPUT, selectedIndex: 0 });
    expect(result.correct).toBe(false);
    const insertedRow = insertValues.mock.calls[0][0];
    expect(insertedRow.correct).toBe("no");
  });

  it("stores topic from question row, not from client input", async () => {
    const { db, insertValues } = makeDb({ ...QUESTION_ROW, topic: "Hydraulics" });
    vi.mocked(getDb).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeCtx());
    await caller.quiz.logAttempt(BASE_INPUT);
    const insertedRow = insertValues.mock.calls[0][0];
    expect(insertedRow.topic).toBe("Hydraulics");
  });

  it("stores confidence when provided", async () => {
    const { db, insertValues } = makeDb();
    vi.mocked(getDb).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeCtx());
    await caller.quiz.logAttempt({ ...BASE_INPUT, confidence: "high" });
    const insertedRow = insertValues.mock.calls[0][0];
    expect(insertedRow.confidence).toBe("high");
  });
});
