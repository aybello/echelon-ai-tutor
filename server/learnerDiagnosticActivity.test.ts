import { afterEach, describe, expect, it, vi } from "vitest";
import { getTableName, sql } from "drizzle-orm";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { execFileSync } from "node:child_process";
import { activationRouter } from "./routers/activationRouter";
import { readCourseLearnerProfile, readOverallLearnerActivity } from "./courseLearnerProfile";
import { recordDiagnosticActivity } from "./learnerActivity";
import { getDb } from "./db";
import { resolveLearningIdentity } from "./_core/learningIdentity";
vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("./_core/learningIdentity", () => ({ resolveLearningIdentity: vi.fn() }));
vi.mock("./_core/accessService", () => ({
  assertAccess: vi.fn(), resolveVerifiedIdentity: () => ({ type: "user", userId: 7 }),
  getAccessibleCoursesForIdentity: vi.fn(), identityEmail: () => null,
}));
const dialect = new MySqlDialect();
// Read-only in-memory SQL, with MySQL date/maximum functions implemented locally.
function execute(query: ReturnType<typeof sql>, cte = "", params: unknown[] = []) {
  const compiled = dialect.sqlToQuery(query);
  return JSON.parse(execFileSync("python3", ["-c", `import sqlite3,json,sys,datetime
p=json.load(sys.stdin); c=sqlite3.connect(':memory:'); c.row_factory=sqlite3.Row
c.execute('PRAGMA query_only=ON')
c.create_function('GREATEST', -1, max)
c.create_function('TIMESTAMPDIFF', 3, lambda unit,a,b: int((datetime.datetime.fromisoformat(b)-datetime.datetime.fromisoformat(a)).total_seconds()*1000000))
print(json.dumps([dict(r) for r in c.execute(p['sql'], p['params'])]))`], {
    input: JSON.stringify({ sql: cte + compiled.sql.replaceAll("TIMESTAMPDIFF(MICROSECOND,", "TIMESTAMPDIFF('MICROSECOND',"), params: [...params, ...compiled.params] }), encoding: "utf8",
  }));
}
function activityTx(initial: any = null) {
  let profile = initial ? { id: 1, ...initial } : null;
  const writes: string[][] = [];
  const tx: any = {
    select: () => ({ from: (table: any) => ({ where: () => {
      const rows = () => getTableName(table) === "users" ? [] : profile ? [profile] : [];
      const limit = () => Object.assign(Promise.resolve(rows()), { for: async () => rows() });
      return { limit, orderBy: () => ({ limit }) };
    } }) }),
    insert: () => ({ values: (values: any) => ({ onDuplicateKeyUpdate: async () => {
      profile ??= { id: 1, totalAttempts: 0, currentStreak: 0, longestStreak: 0, totalSessions: 0, ...values };
    } }) }),
    update: () => ({ set: (values: any) => ({ where: async () => {
      writes.push(Object.keys(values)); profile = { ...profile, ...values };
    } }) }),
  };
  return { tx, writes, profile: () => profile };
}
afterEach(() => vi.useRealTimers());
describe("diagnostic activity only", () => {
  it.each([7, null])("fresh identity %s completes and repeat acknowledgement does not count again", async userId => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-18T02:00:00Z"));
    const identity = { userId, studentEmail: "learner@example.test", orgId: null, organizationMemberId: null };
    vi.mocked(resolveLearningIdentity).mockResolvedValue(identity);
    const activity = activityTx(); let diagnostic: any = null; let attempts: any[] = [];
    let inTransaction = false; let transactions = 0;
    const questionRows = Array.from({ length: 15 }, (_, i) => ({ questionNum: i + 1, correctIndex: 0, module: "Safety", topic: "Safety", difficulty: "easy" }));
    const select = () => ({ from: (table: any) => ({ where: () => {
      const name = getTableName(table);
      const rows = name === "diagnostic_sessions" ? (diagnostic ? [diagnostic] : []) : name === "learner_onboarding" ? [{ id: 1 }] : name === "student_profiles" ? [activity.profile()].filter(Boolean) : questionRows;
      return { then: (resolve: any) => Promise.resolve(rows).then(resolve), limit: async () => rows, orderBy: () => ({ limit: async () => rows }) };
    } }) });
    const db: any = { select, transaction: async (fn: any) => {
      transactions++; inTransaction = true;
      try { return await fn({ select: activity.tx.select, insert: (table: any) => ({ values: (values: any) => {
        expect(inTransaction).toBe(true);
        const name = getTableName(table);
        if (name === "student_profiles") return activity.tx.insert(table).values(values);
        if (name === "diagnostic_sessions") { expect(diagnostic).toBeNull(); diagnostic = values; }
        else attempts = values;
        return Promise.resolve();
      } }), update: (table: any) => getTableName(table) === "student_profiles" ? activity.tx.update() : ({ set: () => ({ where: async () => {} }) }) }); }
      finally { inTransaction = false; }
    } };
    vi.mocked(getDb).mockResolvedValue(db);
    const caller = activationRouter.createCaller({ user: userId ? { id: userId } : null, req: { headers: {} }, res: {} } as any);
    const input = { courseKey: "oit", sessionId: "12345678-1234-4234-8234-123456789012", answers: questionRows.map(q => ({ questionId: q.questionNum, selectedIndex: 0 })) };
    await caller.submitDiagnostic(input);
    expect(await readOverallLearnerActivity(db, { userId, email: identity.studentEmail })).toEqual({ totalSessions: 1, currentStreak: 1, longestStreak: 1 });
    expect(activity.profile()).toMatchObject({ lastActiveDate: "2026-10-17", topicAccuracy: "{}", weakTopics: "[]", strongTopics: "[]", totalAttempts: 0 });
    await caller.submitDiagnostic(input);
    expect(transactions).toBe(1); expect(attempts).toHaveLength(15);
    expect(activity.profile().totalSessions).toBe(1);
    expect(activity.writes).toEqual([["currentStreak", "longestStreak", "totalSessions", "lastActiveDate"]]);
  });
  it.each([
    ["2026-10-17", 4, 4], ["2026-10-16", 4, 5], ["2026-10-14", 4, 1],
  ])("existing %s streak %s becomes %s without mastery writes", async (lastActiveDate, currentStreak, expected) => {
    const activity = activityTx({ lastActiveDate, currentStreak, longestStreak: 8, totalSessions: 10, topicAccuracy: "{mixed:true}", totalAttempts: 99 });
    await recordDiagnosticActivity(activity.tx, { userId: 7, studentEmail: null }, "oit", new Date("2026-10-18T02:00:00Z"));
    expect(activity.profile()).toMatchObject({ currentStreak: expected, longestStreak: 8, totalSessions: 11, topicAccuracy: "{mixed:true}", totalAttempts: 99 });
  });
  it("advances longest streak across the Toronto spring DST calendar boundary", async () => {
    const activity = activityTx({ lastActiveDate: "2026-03-08", currentStreak: 8, longestStreak: 8, totalSessions: 10 });
    await recordDiagnosticActivity(activity.tx, { userId: null, studentEmail: "learner@example.test" }, "oit", new Date("2026-03-09T04:30:00Z"));
    expect(activity.profile()).toMatchObject({ lastActiveDate: "2026-03-09", currentStreak: 9, longestStreak: 9, totalSessions: 11 });
  });
});

describe("course sessions preserve legacy history", () => {
  const row = (id: number, sessionId: string | null, minute: number, courseKey = "oit", userId = 7, quizMode: string | null = null) => [id, userId, "learner@example.test", courseKey, courseKey, courseKey, "Safety", "yes", sessionId, quizMode, `2026-10-17T${String(10 + Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}:00`];
  it.each([
    { name: "explicit-only", rows: [row(1,"a",0),row(2,"a",5),row(3,"b",6)], expected: 2 },
    { name: "legacy-only exact gap boundary", rows: [row(1,null,0),row(2,null,29),row(3,null,59),row(4,null,60)], expected: 2 },
    { name: "mixed separates explicit from legacy", rows: [row(1,null,0),row(2,"a",10),row(3,null,29),row(4,"a",40),row(5,null,59)], expected: 3 },
    { name: "other course cannot bridge legacy gaps", rows: [row(1,null,0),row(2,null,40),row(3,null,20,"class1-ww"),row(4,"b",50,"class1-ww")], expected: 2 },
    { name: "explicit exam and mode groups", rows: [row(1,"a",0),row(2,"a",5,"oit",7,"review"),row(3,"a",6)], expected: 2 },
    { name: "other-course-only is zero", rows: [row(1,null,0,"class1-ww")], expected: 0 },
    { name: "other identity cannot bridge legacy gaps", rows: [row(1,null,0),row(2,null,40),row(3,null,20,"oit",8).map((value, index) => index === 2 ? "other@example.test" : value)], expected: 2 },
  ])("$name", async ({ rows, expected }) => {
    const columns = "id,userId,studentEmail,courseKey,bankKey,examType,topic,correct,sessionId,quizMode,createdAt";
    const cte = `WITH question_attempts(${columns}) AS (VALUES ${rows.map(() => "(?,?,?,?,?,?,?,?,?,?,?)").join(",")}) `;
    const db: any = { select: (fields: any) => ({ from: (table: any) => ({ where: (scope: any) => {
      const selection = sql.join(Object.entries(fields).map(([key, value]) => sql`${value as any} AS ${sql.identifier(key)}`), sql`, `);
      const run = (group = false) => execute(sql`SELECT ${selection} FROM ${table} WHERE ${scope} ${group ? sql`GROUP BY topic` : sql``}`, cte, rows.flat());
      return { then: (resolve: any) => Promise.resolve(run()).then(resolve), groupBy: async () => run(true) };
    } }) }) };
    const before = JSON.stringify(rows);
    expect((await readCourseLearnerProfile(db, { userId: 7, email: "learner@example.test" }, "oit")).totalSessions).toBe(expected);
    expect(JSON.stringify(rows)).toBe(before);
  });
});
