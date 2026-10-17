import { beforeEach, describe, expect, it, vi } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { getTableName, sql } from "drizzle-orm";
import { quizRouter } from "./routers/quizRouter";
import { dashboardRouter } from "./routers/dashboardRouter";
import { readCourseLearnerProfile, readOverallLearnerActivity } from "./courseLearnerProfile";
import { latestPracticeAttemptValue, readPracticeReviewCounts } from "./practiceReviewEligibility";
import { buildDiagnosticBaseline } from "../shared/activationPlan";
import { getDb } from "./db";
vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./_core/accessService", () => ({ resolveAccessForRequest: vi.fn().mockResolvedValue(true) }));
vi.mock("./_core/learningIdentity", () => ({ resolveLearningIdentity: vi.fn().mockResolvedValue({ userId: 7, studentEmail: "learner@example.test" }) }));
vi.mock("./practiceQuestionReceipt", () => ({ practiceIdentity: vi.fn().mockResolvedValue({ owner: "test-owner", context: {} }), issuePracticeReceipt: vi.fn().mockResolvedValue("issued-receipt") }));
vi.mock("./teams/attemptAttribution", () => ({ resolveAttemptAttribution: vi.fn() }));
const dialect = new MySqlDialect();
const ctx: any = { user: { id: 7, email: "learner@example.test" }, studentEmail: null, req: { headers: {} }, res: {} };
describe("diagnostic-to-practice destination", () => {
  beforeEach(() => vi.clearAllMocks());
  it("returns a real fixture topic slice instead of interpreting its label as a module", async () => {
    const fixture = JSON.parse(readFileSync(new URL("../content/oit/questions/oit-water-500.json", import.meta.url), "utf8"));
    const rows = Array.isArray(fixture) ? fixture : fixture.questions;
    const target = rows.find((row: any) => row.topic === "source-water assessment");
    expect(target).toBeTruthy();
    const baseline = buildDiagnosticBaseline(Array.from({ length: 15 }, () => ({ module: target.topic, correct: false })));
    const topic = new URL(`https://local.test/quiz?topic=${encodeURIComponent(baseline.weakTopics[0])}`).searchParams.get("topic")!;
    let query = ""; let params: unknown[] = [];
    const where = vi.fn((filter: any) => {
      const sql = dialect.sqlToQuery(filter); query = sql.sql; params = sql.params;
      const matching = rows.filter((row: any) => row.topic === topic).map((row: any, index: number) => ({
        ...row, bankKey: "oit", questionNum: row.id ?? index + 1, options: JSON.stringify(row.options),
        steps: null, isCalc: "no", correctIndex: row.correctIndex ?? 0,
      }));
      return { then: (resolve: any) => Promise.resolve([{ total: matching.length }]).then(resolve),
        orderBy: () => ({ limit: async () => matching }) };
    });
    vi.mocked(getDb).mockResolvedValue({ select: () => ({ from: () => ({ where }) }) } as any);
    const result = await quizRouter.createCaller(ctx).getRandomQuestions({ bankKey: "oit", topic, limit: 50 });
    expect(result.questions.length).toBeGreaterThan(0);
    expect(result.questions.every(question => question.topic === topic)).toBe(true);
    expect(query).toContain("COALESCE(`questions`.`topic`, `questions`.`module`) = ?");
    expect(query).not.toContain("`questions`.`module` = ?");
    expect(params).toContain(topic);
    expect(result.questions[0].attemptToken).toBe("issued-receipt");
  });
});
describe("course profile ledger isolation", () => {
  it("keeps opposite results on identically named topics separate, never reading the mixed cache", async () => {
    const queries: string[] = [];
    const db: any = { select: () => ({ from: () => ({ where: (filter: any) => {
      const compiled = dialect.sqlToQuery(filter); queries.push(compiled.sql);
      const water = compiled.params.includes("oit");
      return { groupBy: async () => [{ topic: "Safety", total: 15, correct: water ? 15 : 0 }],
        then: (resolve: any) => Promise.resolve([{ total: 1 }]).then(resolve) };
    } }) }) };
    const identity = { userId: 7, email: "learner@example.test" };
    const water = await readCourseLearnerProfile(db, identity, "oit");
    const wastewater = await readCourseLearnerProfile(db, identity, "class1-ww");
    expect(water.strongTopics).toEqual(["Safety"]); expect(water.weakTopics).toEqual([]);
    expect(wastewater.weakTopics).toEqual(["Safety"]); expect(wastewater.strongTopics).toEqual([]);
    expect(queries.every(query => query.includes("courseKey") && query.includes("userId") && query.includes("studentEmail"))).toBe(true);
    expect(queries.some(query => query.includes("student_profiles"))).toBe(false);
  });
});

describe("latest-attempt plan and delivery agreement", () => {
  // Execute SELECT-only CTE fixtures in memory: no database connection, files,
  // inserts, migrations, credentials, or application environment are used.
  function fixtureDb(attempts: Array<{ id: number; correct: string; confidence: string }>, hidden = false) {
    const cte = `WITH question_attempts(id, userId, studentEmail, courseKey, bankKey, examType, topic, questionId, correct, confidence, createdAt) AS (
      ${attempts.map(row => `SELECT ${row.id}, 7, 'learner@example.test', 'oit', 'oit', 'oit', 'Safety', 1001, '${row.correct}', '${row.confidence}', '2026-10-17'`).join(" UNION ALL ")}
    ), questions(bankKey, questionNum, reviewStatus) AS (SELECT 'oit', 1001, '${hidden ? "rejected" : "approved"}') `;
    const execute = (query: ReturnType<typeof sql>) => {
      const compiled = dialect.sqlToQuery(query);
      const output = execFileSync("python3", ["-c", "import sqlite3,json,sys; p=json.load(sys.stdin); c=sqlite3.connect(':memory:'); c.execute('PRAGMA query_only=ON'); c.row_factory=sqlite3.Row; print(json.dumps([dict(r) for r in c.execute(p['sql'], p['params'])]))"],
        { input: JSON.stringify({ sql: cte + compiled.sql, params: compiled.params }), encoding: "utf8" });
      return JSON.parse(output);
    };
    return { select: (fields: any) => ({ from: (table: any) => ({ where: (filter: any) =>
      Promise.resolve(execute(sql`SELECT ${fields.missed} AS missed, ${fields.lowConfidence} AS lowConfidence FROM ${table} WHERE ${filter}`)) }) }), execute };
  }
  const identity = { userId: 7, email: "learner@example.test" };
  it.each([
    { label: "wrong then correct", attempts: [{ id: 1, correct: "no", confidence: "low" }, { id: 2, correct: "yes", confidence: "high" }], expected: 0 },
    { label: "duplicate misses", attempts: [{ id: 1, correct: "no", confidence: "low" }, { id: 2, correct: "no", confidence: "low" }], expected: 1 },
  ])("$label counts eligible questions, matching the actual delivery predicate", async ({ attempts, expected }) => {
    const db = fixtureDb(attempts);
    expect(await readPracticeReviewCounts(db as any, identity, "oit")).toEqual({ totalMissed: expected, totalLowConf: expected });
    for (const [field, value] of [["correct", "no"], ["confidence", "low"]] as const) {
      const eligible = db.execute(sql`SELECT questionNum FROM questions WHERE ${latestPracticeAttemptValue(identity, "oit", field)} = ${value}`);
      expect(eligible).toHaveLength(expected);
    }
    const queries: string[] = [];
    vi.mocked(getDb).mockResolvedValue({ select: (fields: any) => ({ from: (table: any) => ({ where: (filter: any) => {
      queries.push(dialect.sqlToQuery(filter).sql);
      const name = getTableName(table);
      if (name === "questions") return db.select(fields).from(table).where(filter);
      if (name === "question_attempts") return { groupBy: async () => [{ topic: "Safety", total: 2, correct: expected ? 0 : 1 }] };
      if (name === "bookmarks") return Promise.resolve([{ count: 0 }]);
      return { orderBy: () => ({ limit: async () => [] }) };
    } }) }) } as any);
    const plan = await dashboardRouter.createCaller(ctx).studyPlan({ examType: "oit" });
    expect(plan?.totalMissed).toBe(expected);
    expect(plan?.totalLowConf).toBe(expected);
    expect(plan?.recommendations.some(rec => rec.type === "missed_review")).toBe(expected > 0);
    const latestQuery = dialect.sqlToQuery(latestPracticeAttemptValue(identity, "oit", "correct"));
    expect(latestQuery.sql).toContain("ORDER BY `question_attempts`.`createdAt` DESC, `question_attempts`.`id` DESC LIMIT 1");
    expect(queries.some(query => query.includes("reviewStatus"))).toBe(true);
  });
  it("does not count hidden questions that practice cannot deliver", async () => {
    expect(await readPracticeReviewCounts(fixtureDb([{ id: 1, correct: "no", confidence: "low" }], true) as any, identity, "oit"))
      .toEqual({ totalMissed: 0, totalLowConf: 0 });
  });
});

describe("overall streak stays independent of course mastery", () => {
  it("preserves nonzero streaks on course profile and dashboard reads without importing mixed topics", async () => {
    const db: any = { select: (fields: any) => ({ from: (table: any) => ({ where: () => {
      if (getTableName(table) === "student_profiles") {
        expect(Object.keys(fields).sort()).toEqual(["currentStreak", "longestStreak", "totalSessions"]);
        return { orderBy: () => ({ limit: async () => [{ currentStreak: 6, longestStreak: 17, totalSessions: 12 }] }) };
      }
      if (fields.topic) return { groupBy: async () => [{ topic: "Safety", correct: 0, total: 5 }] };
      return Promise.resolve([{ total: fields.correct ? 5 : 1, correct: 0 }]);
    } }) }) };
    const identity = { userId: 7, email: "learner@example.test" };
    expect(await readOverallLearnerActivity(db, identity)).toEqual({ currentStreak: 6, longestStreak: 17, totalSessions: 12 });
    vi.mocked(getDb).mockResolvedValue(db);
    const profile = await quizRouter.createCaller(ctx).getStudentProfile({ examType: "oit" });
    expect(profile).toMatchObject({ currentStreak: 6, longestStreak: 17, totalAttempts: 5, weakTopics: ["Safety"] });
    expect(await dashboardRouter.createCaller(ctx).overview({ courseKey: "oit" })).toMatchObject({ currentStreak: 6, longestStreak: 17, totalAttempts: 5, totalSessions: 1 });
    expect(await dashboardRouter.createCaller(ctx).overview()).toMatchObject({ currentStreak: 6, longestStreak: 17, totalSessions: 12 });
  });
});

describe("verified overall activity identity fallback", () => {
  const legacy = { id: 1, userId: null, email: "learner@example.test", currentStreak: 6, longestStreak: 17, totalSessions: 12 };
  const owned = { ...legacy, id: 2, userId: 7, currentStreak: 2, longestStreak: 3, totalSessions: 4 };
  const other = { ...legacy, id: 3, userId: 99, currentStreak: 99, longestStreak: 99, totalSessions: 99 };
  function fixtureDb(rows: Array<typeof legacy | typeof owned>) {
    return { select: (fields: any) => ({ from: (table: any) => ({ where: (filter: any) => ({ orderBy: (...order: any[]) => ({ limit: async () => {
      const cte = `WITH student_profiles(id, userId, studentEmail, currentStreak, longestStreak, totalSessions) AS (${rows.map(row =>
        `SELECT ${row.id}, ${row.userId ?? "NULL"}, '${row.email}', ${row.currentStreak}, ${row.longestStreak}, ${row.totalSessions}`).join(" UNION ALL ")}) `;
      const compiled = dialect.sqlToQuery(sql`SELECT ${fields.currentStreak} AS currentStreak, ${fields.longestStreak} AS longestStreak, ${fields.totalSessions} AS totalSessions FROM ${table} WHERE ${filter} ORDER BY ${sql.join(order, sql`, `)} LIMIT 1`);
      return JSON.parse(execFileSync("python3", ["-c", "import sqlite3,json,sys; p=json.load(sys.stdin); c=sqlite3.connect(':memory:'); c.execute('PRAGMA query_only=ON'); c.row_factory=sqlite3.Row; print(json.dumps([dict(r) for r in c.execute(p['sql'],p['params'])]))"], { input: JSON.stringify({ sql: cte + compiled.sql, params: compiled.params }), encoding: "utf8" }));
    } }) }) }) }) } as any;
  }
  it("preserves legacy OTP streaks 6/17 after OAuth sign-in with verified normalized email", async () => {
    expect(await readOverallLearnerActivity(fixtureDb([other, legacy]), { userId: 7, email: " Learner@Example.Test " }))
      .toEqual({ currentStreak: 6, longestStreak: 17, totalSessions: 12 });
  });
  it("deterministically prefers the exact ID row over a larger legacy email row", async () => {
    for (const rows of [[legacy, other, owned], [owned, other, legacy]]) {
      expect(await readOverallLearnerActivity(fixtureDb(rows), { userId: 7, email: legacy.email }))
        .toEqual({ currentStreak: 2, longestStreak: 3, totalSessions: 4 });
      expect(await readOverallLearnerActivity(fixtureDb(rows), { userId: 7, email: "different@example.test" }))
        .toEqual({ currentStreak: 2, longestStreak: 3, totalSessions: 4 });
    }
  });
  it.each([
    { userId: 7, email: legacy.email },
    { userId: null, email: legacy.email },
    { userId: 7, email: null },
  ])("never reads another user's email-matching row: %j", async identity => {
    expect(await readOverallLearnerActivity(fixtureDb([other]), identity))
      .toEqual({ currentStreak: 0, longestStreak: 0, totalSessions: 0 });
  });
  it("does not invent an email fallback for an email-less OAuth user", async () => {
    expect(await readOverallLearnerActivity(fixtureDb([legacy]), { userId: 7, email: null }))
      .toEqual({ currentStreak: 0, longestStreak: 0, totalSessions: 0 });
  });
  it("allows only the unowned legacy row for verified OTP", async () => {
    expect(await readOverallLearnerActivity(fixtureDb([other, legacy]), { userId: null, email: legacy.email }))
      .toEqual({ currentStreak: 6, longestStreak: 17, totalSessions: 12 });
  });
  it("rejects absent or blank verified identity", async () => {
    await expect(readOverallLearnerActivity(fixtureDb([legacy]), { userId: null, email: " " })).rejects.toThrow("verified learner identity");
  });
});
