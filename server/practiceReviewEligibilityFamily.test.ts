import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { sql } from "drizzle-orm";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { ELECTRICIAN_309A_PROGRAM_KEY } from "../shared/certificationPrograms";
import { resolveCourseKey } from "../shared/courseRegistry";
import { readPracticeReviewCounts } from "./practiceReviewEligibility";

const dialect = new MySqlDialect();
const identity = { userId: 7, email: "learner@example.test" };
const bank = { id: 20, programKey: ELECTRICIAN_309A_PROGRAM_KEY, bankKey: "electrician-309a",
  releaseChannel: "beta", active: 1, commercialEligibility: 0, teamEligibility: 0, publishedAt: "2026-10-17" };
const question = { id: 9001, bankVersionId: 20, bankItemNumber: 101, module: "A",
  contentStatus: "beta_approved", publicEligibility: 1 };
const attempt = { id: 1, userId: 7, studentEmail: "learner@example.test", courseKey: "electrician-309a",
  bankKey: "electrician-309a", examType: "electrician-309a", topic: "A", questionId: 101,
  correct: "no", confidence: "low", createdAt: "2026-10-17 12:00:00" };

type Row = Record<string, string | number | null>;
// SELECT-only CTEs execute compiled application SQL in memory, never a live DB.
function fixtureDb(attempts: Row[] = [attempt], certRows: Row[] = [question], banks: Row[] = [bank],
  ordinary: Row[] = [{ bankKey: "oit", questionNum: 101, reviewStatus: "approved" }]) {
  const cte = (name: string, rows: Row[], template: Row) => {
    const columns = Object.keys(template);
    return `${name}(${columns.join(",")}) AS (${rows.length ? rows.map(row =>
      `SELECT ${columns.map(key => row[key] == null ? "NULL" : typeof row[key] === "number" ? row[key] : `'${String(row[key]).replaceAll("'", "''")}'`).join(",")}`).join(" UNION ALL ")
      : `SELECT ${columns.map(() => "NULL").join(",")} WHERE 0`})`;
  };
  const prefix = "WITH " + [cte("question_attempts", attempts, attempt), cte("certification_questions", certRows, question),
    cte("certification_bank_versions", banks, bank), cte("questions", ordinary, { bankKey: "", questionNum: 0, reviewStatus: "" })].join(",") + " ";
  return { select: (fields: any) => ({ from: (table: any) => {
    let join = sql``;
    const builder = {
      innerJoin(other: any, condition: any) { join = sql` INNER JOIN ${other} ON ${condition}`; return builder; },
      async where(filter: any) {
        const compiled = dialect.sqlToQuery(sql`SELECT ${fields.missed} AS missed, ${fields.lowConfidence} AS lowConfidence FROM ${table}${join} WHERE ${filter}`);
        return JSON.parse(execFileSync("python3", ["-c", "import sqlite3,json,sys; p=json.load(sys.stdin); c=sqlite3.connect(':memory:'); c.execute('PRAGMA query_only=ON'); c.row_factory=sqlite3.Row; print(json.dumps([dict(r) for r in c.execute(p['sql'],p['params'])]))"],
          { input: JSON.stringify({ sql: prefix + compiled.sql, params: compiled.params }), encoding: "utf8" }));
      },
    };
    return builder;
  } }) } as any;
}

describe("course-family practice review counts", () => {
  it("counts public beta bank item numbers rather than certification row IDs, including course aliases", async () => {
    for (const key of ["electrician-309a", "electrician-309a-demo"]) {
      expect(await readPracticeReviewCounts(fixtureDb(), identity, key)).toEqual({ totalMissed: 1, totalLowConf: 1 });
    }
  });
  it("latest timestamp wins over ID and latest correct clears missed while retaining low confidence", async () => {
    const attempts = [attempt, { ...attempt, id: 2, correct: "yes", createdAt: "2026-10-17 13:00:00" },
      { ...attempt, id: 99, createdAt: "2026-10-17 11:00:00" }];
    expect(await readPracticeReviewCounts(fixtureDb(attempts), identity, "electrician-309a"))
      .toEqual({ totalMissed: 0, totalLowConf: 1 });
  });
  it("breaks timestamp ties by newest row and counts repeated misses once", async () => {
    expect(await readPracticeReviewCounts(fixtureDb([attempt, { ...attempt, id: 2 }]), identity, "electrician-309a"))
      .toEqual({ totalMissed: 1, totalLowConf: 1 });
    expect(await readPracticeReviewCounts(fixtureDb([attempt, { ...attempt, id: 2, correct: "yes", confidence: "high" }]), identity, "electrician-309a"))
      .toEqual({ totalMissed: 0, totalLowConf: 0 });
  });
  it.each(["draft", "technical_approved", "rejected", "retired"])("excludes %s content", async contentStatus => {
    expect(await readPracticeReviewCounts(fixtureDb([attempt], [{ ...question, contentStatus }]), identity, "electrician-309a"))
      .toEqual({ totalMissed: 0, totalLowConf: 0 });
  });
  it("excludes private and removed questions", async () => {
    for (const rows of [[{ ...question, publicEligibility: 0 }], []]) {
      expect(await readPracticeReviewCounts(fixtureDb([attempt], rows), identity, "electrician-309a"))
        .toEqual({ totalMissed: 0, totalLowConf: 0 });
    }
  });
  it.each([{ active: 0 }, { releaseChannel: "internal" }, { releaseChannel: "retired" },
    { commercialEligibility: 1 }, { teamEligibility: 1 }, { programKey: "another-program" }, { bankKey: "another-bank" }])(
    "excludes ineligible bank %j", async override => {
      expect(await readPracticeReviewCounts(fixtureDb([attempt], [question], [{ ...bank, ...override }]), identity, "electrician-309a"))
        .toEqual({ totalMissed: 0, totalLowConf: 0 });
    });
  it("ignores other learners, another course, and database row IDs", async () => {
    const unrelated = [{ ...attempt, id: 2, userId: 99, studentEmail: "other@example.test", correct: "yes" },
      { ...attempt, id: 3, courseKey: "oit", correct: "yes" }, { ...attempt, id: 4, questionId: 9001, correct: "yes" }];
    expect(await readPracticeReviewCounts(fixtureDb([attempt, ...unrelated]), identity, "electrician-309a"))
      .toEqual({ totalMissed: 1, totalLowConf: 1 });
    expect(await readPracticeReviewCounts(fixtureDb(unrelated), identity, "electrician-309a"))
      .toEqual({ totalMissed: 0, totalLowConf: 0 });
  });
  it("supports normalized verified email identity", async () => {
    expect(await readPracticeReviewCounts(fixtureDb([{ ...attempt, userId: null }]),
      { userId: null, email: " Learner@Example.Test " }, "electrician-309a")).toEqual({ totalMissed: 1, totalLowConf: 1 });
  });
  it.each(["oit", "class1-wastewater", "wpi-class1-water", "us-class1-water"])(
    "keeps ordinary water and region shared-course resolution unchanged for %s", async key => {
      const course = resolveCourseKey(key)!;
      const canonical = course.courseKey;
      const ordinaryAttempt = { ...attempt, courseKey: canonical, bankKey: course.questionBankKey, examType: canonical };
      expect(await readPracticeReviewCounts(fixtureDb([ordinaryAttempt], [], [],
        [{ bankKey: course.questionBankKey, questionNum: 101, reviewStatus: "approved" }]), identity, key))
        .toEqual({ totalMissed: 1, totalLowConf: 1 });
      expect(await readPracticeReviewCounts(fixtureDb([ordinaryAttempt], [], [],
        [{ bankKey: course.questionBankKey, questionNum: 101, reviewStatus: "rejected" }]), identity, key))
        .toEqual({ totalMissed: 0, totalLowConf: 0 });
    });
});
