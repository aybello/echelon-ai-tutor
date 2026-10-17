import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import mysql from "mysql2/promise";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { savePracticeAttempt, practiceOperationHash } from "./practiceAttemptStore";
import { recordDiagnosticActivity } from "./learnerActivity";
import { readOverallLearnerActivity } from "./courseLearnerProfile";
import type { InsertQuestionAttempt } from "../drizzle/schema";

// Opt in only to a freshly provisioned local disposable server. No credentials,
// DATABASE_URL, hostname or production database are ever consulted by this test.
const socketPath = process.env.PRACTICE_TEST_MYSQL_SOCKET;
if (socketPath && !/^\/home\/ubuntu\/jobs\/[^/]+\/practice\.sock$/.test(socketPath)) {
  throw new Error("Integration tests require a job-local disposable practice.sock");
}
const database = `practice_test_${randomUUID().replaceAll("-", "")}`;
let admin: mysql.Connection, pool: mysql.Pool;
let db: MySql2Database<Record<string, never>>;
const input = { examType: "class1-water", bankKey: "class1-water", questionId: 101, selectedIndex: 2, quizMode: "standard", sessionId: randomUUID(), attemptToken: "test-issued-receipt" };
const row = (operationId: string | null = randomUUID()): InsertQuestionAttempt => ({
  operationId, operationPayloadHash: operationId ? practiceOperationHash("actor-42", input) : null,
  userId: 42, studentEmail: "operator@example.test", examType: input.examType,
  bankKey: input.bankKey, courseKey: input.examType, questionId: 101, selectedIndex: 2,
  topic: "Disinfection", correct: "yes", quizMode: "standard", sessionId: input.sessionId,
});

describe.skipIf(!socketPath)("disposable MySQL practice persistence", () => {
  beforeAll(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-17T16:00:00Z"));
    admin = await mysql.createConnection({ socketPath, user: "root" });
    await admin.query(`CREATE DATABASE \`${database}\``);
    pool = mysql.createPool({ socketPath, user: "root", database, connectionLimit: 12 });
    db = drizzle(pool);
    // The legacy shape deliberately lacks operation columns; apply the real
    // additive migration over existing NULL-compatible rows, not a fake index.
    await pool.query(`CREATE TABLE question_attempts (
      id int AUTO_INCREMENT PRIMARY KEY, userId int NULL, guestToken varchar(64), studentEmail varchar(320),
      examType varchar(64) NOT NULL, topic varchar(128) NOT NULL, questionId int NOT NULL,
      correct enum('yes','no') NOT NULL, difficulty varchar(16), quizMode varchar(32) DEFAULT 'standard',
      confidence enum('low','medium','high'), bookmarked enum('yes','no') DEFAULT 'no', sessionId varchar(36),
      selectedIndex int, bankKey varchar(64), courseKey varchar(64), orgId int, organizationMemberId int,
      flexLicenceId int, createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`);
    await pool.query(`INSERT INTO question_attempts (examType,topic,questionId,correct) VALUES ('legacy','legacy',1,'no'),('legacy','legacy',2,'yes')`);
    const migration = await readFile(new URL("../drizzle/0080_practice_attempt_idempotency.sql", import.meta.url), "utf8");
    for (const statement of migration.split("--> statement-breakpoint")) await pool.query(statement);
    await pool.query(`CREATE TABLE student_profiles (
      id int AUTO_INCREMENT PRIMARY KEY, userId int NULL, studentEmail varchar(320), examType varchar(64) NOT NULL,
      topicAccuracy text NOT NULL, weakTopics text NOT NULL, strongTopics text NOT NULL,
      totalAttempts int NOT NULL DEFAULT 0, totalSessions int NOT NULL DEFAULT 0,
      currentStreak int NOT NULL DEFAULT 0, longestStreak int NOT NULL DEFAULT 0, lastActiveDate varchar(10),
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY student_profiles_userId_idx(userId), UNIQUE KEY student_profiles_email_idx(studentEmail)
    ) ENGINE=InnoDB`);
    await pool.query("CREATE TABLE users (id int PRIMARY KEY, email varchar(320)) ENGINE=InnoDB");
  });
  afterAll(async () => {
    vi.useRealTimers();
    if (pool) await pool.end();
    if (admin) { await admin.query(`DROP DATABASE \`${database}\``); await admin.end(); }
  });
  it("preserves existing rows with NULL operation IDs and a unique nullable column", async () => {
    const [rows] = await pool.query<any[]>("SELECT operationId, operationPayloadHash FROM question_attempts WHERE examType='legacy'");
    expect(rows).toEqual([{ operationId: null, operationPayloadHash: null }, { operationId: null, operationPayloadHash: null }]);
  });
  it("concurrent identical inserts acknowledge one row and one full profile update", async () => {
    const attempt = row();
    const results = await Promise.all(Array.from({ length: 10 }, () => savePracticeAttempt(db, attempt)));
    expect(results).toEqual(Array.from({ length: 10 }, () => ({ success: true, correct: true })));
    const [rows] = await pool.query<any[]>("SELECT * FROM question_attempts WHERE operationId=?", [attempt.operationId]);
    expect(rows).toHaveLength(1);
    const [profiles] = await pool.query<any[]>("SELECT * FROM student_profiles WHERE userId=42");
    expect(profiles[0].totalAttempts).toBe(1);
    expect(JSON.parse(profiles[0].topicAccuracy)).toEqual({ Disinfection: { correct: 1, total: 1 } });
    expect(profiles[0].currentStreak).toBe(1); expect(profiles[0].longestStreak).toBe(1);
    expect(await savePracticeAttempt(db, { ...attempt, userId: 99, operationPayloadHash: "different-actor" })).toEqual({ success: false });
  });
  it("concurrent distinct operations in one session do not lose profile increments", async () => {
    // Established profile: no missing-row locks can mask lost JSON updates.
    await Promise.all(Array.from({ length: 6 }, () => savePracticeAttempt(db, row())));
    const [profiles] = await pool.query<any[]>("SELECT * FROM student_profiles WHERE userId=42");
    expect(profiles[0].totalAttempts).toBe(7);
    expect(JSON.parse(profiles[0].topicAccuracy).Disinfection.total).toBe(7);
  });
  it("a profile failure rolls back its attempt, then retry succeeds", async () => {
    const attempt = row();
    await pool.query("CREATE TRIGGER reject_profile_update BEFORE UPDATE ON student_profiles FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='test profile failure'");
    await expect(savePracticeAttempt(db, attempt)).rejects.toThrow();
    const [attempts] = await pool.query<any[]>("SELECT id FROM question_attempts WHERE operationId=?", [attempt.operationId]);
    expect(attempts).toEqual([]);
    await pool.query("DROP TRIGGER reject_profile_update");
    expect(await savePracticeAttempt(db, attempt)).toEqual({ success: true, correct: true });
    const [profiles] = await pool.query<any[]>("SELECT totalAttempts FROM student_profiles WHERE userId=42");
    expect(profiles[0].totalAttempts).toBe(8);
  });
  it("legacy clients remain independently writable with NULL IDs", async () => {
    await savePracticeAttempt(db, row(null)); await savePracticeAttempt(db, row(null));
    const [profiles] = await pool.query<any[]>("SELECT totalAttempts FROM student_profiles WHERE userId=42");
    expect(profiles[0].totalAttempts).toBe(10);
  });
  it("OAuth first diagnostic preserves legacy activity, practice adds only its own attempt, and history stays intact", async () => {
    await pool.query(`INSERT INTO student_profiles (userId,studentEmail,examType,topicAccuracy,weakTopics,strongTopics,totalAttempts,totalSessions,currentStreak,longestStreak,lastActiveDate)
      VALUES (NULL,'continuity@example.test','legacy','{"Mixed":{"correct":99,"total":100}}','["Mixed"]','[]',100,12,6,17,'2026-10-16')`);
    const [before] = await pool.query<any[]>("SELECT * FROM student_profiles WHERE studentEmail='continuity@example.test'");
    const identity = { userId: 7, email: " Continuity@Example.Test " };
    expect(await readOverallLearnerActivity(db, identity)).toEqual({ currentStreak: 6, longestStreak: 17, totalSessions: 12 });
    await db.transaction(tx => recordDiagnosticActivity(tx, { userId: 7, studentEmail: identity.email }, "oit", new Date("2026-10-17T16:00:00Z")));
    expect(await readOverallLearnerActivity(db, identity)).toEqual({ currentStreak: 7, longestStreak: 17, totalSessions: 13 });
    await savePracticeAttempt(db, { ...row(), userId: 7, studentEmail: identity.email });
    const [own] = await pool.query<any[]>("SELECT * FROM student_profiles WHERE userId=7");
    expect(own[0].totalAttempts).toBe(1); expect(own[0].totalSessions).toBe(13);
    expect(JSON.parse(own[0].topicAccuracy)).toEqual({ Disinfection: { correct: 1, total: 1 } });
    const [after] = await pool.query<any[]>("SELECT * FROM student_profiles WHERE studentEmail='continuity@example.test'");
    expect(after).toEqual(before);
    const [history] = await pool.query<any[]>("SELECT id FROM question_attempts WHERE examType='legacy'");
    expect(history).toHaveLength(2);
  });
  it("OTP mapped owner is shared by reader, diagnostic and practice; concurrent seeding happens once", async () => {
    await pool.query("INSERT INTO users VALUES (8,'mapped@example.test')");
    await pool.query(`INSERT INTO student_profiles (studentEmail,examType,topicAccuracy,weakTopics,strongTopics,totalSessions,currentStreak,longestStreak,lastActiveDate)
      VALUES ('mapped@example.test','legacy','{}','[]','[]',12,6,17,'2026-10-16')`);
    await Promise.all(Array.from({ length: 4 }, () => db.transaction(tx => recordDiagnosticActivity(tx,
      { userId: null, studentEmail: " Mapped@Example.Test " }, "oit", new Date("2026-10-17T16:00:00Z")))));
    expect(await readOverallLearnerActivity(db, { userId: null, email: "mapped@example.test" }))
      .toEqual({ currentStreak: 7, longestStreak: 17, totalSessions: 16 });
    await savePracticeAttempt(db, { ...row(), userId: null, studentEmail: "mapped@example.test" });
    const [own] = await pool.query<any[]>("SELECT * FROM student_profiles WHERE userId=8");
    expect(own).toHaveLength(1); expect(own[0].totalAttempts).toBe(1); expect(own[0].totalSessions).toBe(16);
  });
  it("does not seed another owner's row and does not remap OAuth through OTP email", async () => {
    await pool.query(`INSERT INTO student_profiles (userId,studentEmail,examType,topicAccuracy,weakTopics,strongTopics,totalSessions,currentStreak,longestStreak)
      VALUES (99,'wrong@example.test','legacy','{}','[]','[]',90,90,90)`);
    await pool.query("INSERT INTO users VALUES (99,'wrong@example.test')");
    await db.transaction(tx => recordDiagnosticActivity(tx, { userId: 9, studentEmail: "wrong@example.test" }, "oit", new Date("2026-10-17T16:00:00Z")));
    expect(await readOverallLearnerActivity(db, { userId: 9, email: "wrong@example.test" }))
      .toEqual({ currentStreak: 1, longestStreak: 1, totalSessions: 1 });
    const [other] = await pool.query<any[]>("SELECT totalSessions FROM student_profiles WHERE userId=99");
    expect(other[0].totalSessions).toBe(90);
  });
  it("actual MySQL streak assignments are order independent across three dates", async () => {
    for (const day of [17,17,18,19]) await db.transaction(tx => recordDiagnosticActivity(tx,
      { userId: 10, studentEmail: null }, "oit", new Date(`2026-10-${day}T16:00:00Z`)));
    expect(await readOverallLearnerActivity(db, { userId: 10, email: null }))
      .toEqual({ currentStreak: 3, longestStreak: 3, totalSessions: 4 });
  });

  it("existing exact profile wins over larger legacy activity without reseeding", async () => {
    await pool.query(`INSERT INTO student_profiles (studentEmail,examType,topicAccuracy,weakTopics,strongTopics,totalSessions,currentStreak,longestStreak,lastActiveDate)
      VALUES ('continuity@example.test-exact','legacy','{}','[]','[]',900,90,90,'2026-10-17')`);
    await db.transaction(tx => recordDiagnosticActivity(tx, { userId: 7, studentEmail: 'continuity@example.test-exact' }, 'oit', new Date('2026-10-17T16:00:00Z')));
    expect(await readOverallLearnerActivity(db, { userId: 7, email: 'continuity@example.test-exact' }))
      .toEqual({ currentStreak: 7, longestStreak: 17, totalSessions: 14 });
  });
  it("practice-first materialization inherits only activity and adds exactly one own attempt", async () => {
    await pool.query(`INSERT INTO student_profiles (studentEmail,examType,topicAccuracy,weakTopics,strongTopics,totalAttempts,totalSessions,currentStreak,longestStreak,lastActiveDate)
      VALUES ('practice-first@example.test','legacy','{"Mixed":{"correct":100,"total":100}}','[]','["Mixed"]',100,12,6,17,'2026-10-17')`);
    await savePracticeAttempt(db, { ...row(), userId: 11, studentEmail: 'practice-first@example.test' });
    const [profiles] = await pool.query<any[]>('SELECT * FROM student_profiles WHERE userId=11');
    expect(profiles[0]).toMatchObject({ currentStreak: 6, longestStreak: 17, totalSessions: 12, totalAttempts: 1 });
    expect(JSON.parse(profiles[0].topicAccuracy)).toEqual({ Disinfection: { correct: 1, total: 1 } });
  });

});
