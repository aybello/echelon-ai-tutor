import { afterAll, beforeAll, describe, expect, it } from "vitest";
import mysql from "mysql2/promise";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { savePracticeAttempt, practiceOperationHash } from "./practiceAttemptStore";
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
});
