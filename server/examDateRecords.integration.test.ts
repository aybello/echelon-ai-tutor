import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import mysql from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { eq, like } from "drizzle-orm";
import { getDb } from "./db";
import { examDates, learnerOnboarding, scheduledWork } from "../drizzle/schema";
import { upsertExamDate, removeExamDate, recordExamReminder } from "./examDateRecords";
import { deliverCurrentExamReminder } from "./jobs/examReminders";
import { workKey } from "./jobs/durableWork";
import { appRouter } from "./routers";

// Entitlement fixtures only; database and verified-identity resolution remain real.
vi.mock("./_core/accessService", async original => ({
  ...await original<typeof import("./_core/accessService")>(), assertAccess: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("./analytics", async original => ({ ...await original<typeof import("./analytics")>(), trackEvent: vi.fn() }));

const prefix = `exam-date-${randomUUID()}`;
let db: NonNullable<Awaited<ReturnType<typeof getDb>>>;
const keys: string[] = [];
const email = (suffix: string) => `${prefix}-${suffix}@example.test`;
const save = (who: string, date = "2030-06-01", productKey = "class1-water") => upsertExamDate(db, {
  email: who, productKey, date, orgId: null, organizationMemberId: null,
});
const getRows = (who: string) => db.select().from(examDates).where(eq(examDates.email, who));
const caller = (who?: string) => appRouter.createCaller({ user: null, studentEmail: who ?? null, req: {}, res: {} } as any);
const suite = process.env.DATABASE_URL ? describe : describe.skip;
suite("exam-date concurrency and reminder integrity with a real database", () => {
  beforeAll(async () => { db = (await getDb())!; if (!db) throw new Error("Database required"); });
  afterAll(async () => {
    if (!db) return;
    await db.delete(examDates).where(like(examDates.email, `${prefix}%`));
    await db.delete(learnerOnboarding).where(like(learnerOnboarding.studentEmail, `${prefix}%`));
    for (const key of keys) await db.delete(scheduledWork).where(eq(scheduledWork.workKey, key));
  });
  it("coalesces concurrent canonical/alias saves into one stable row and isolates other courses", async () => {
    const who = email("parallel");
    await Promise.all(Array.from({ length: 12 }, (_, n) => save(n % 2 ? who.toUpperCase() : who, "2030-06-01", n % 2 ? "class1" : "class1-water")));
    const [first] = await getRows(who);
    expect(await getRows(who)).toHaveLength(1);
    await save(who, "2030-06-02");
    expect((await getRows(who))[0].id).toBe(first.id);
    await save(who, "2030-06-03", "class1-ww");
    expect(await getRows(who)).toHaveLength(2);
  });
  it("preserves sent intervals on replay but resets them for a genuinely changed date", async () => {
    const who = email("replay"); await save(who);
    await db.update(examDates).set({ remindersSent: "[30,14]" }).where(eq(examDates.email, who));
    await Promise.all([save(who), save(who, "2030-06-01", "class1")]);
    expect((await getRows(who))[0].remindersSent).toBe("[30,14]");
    await save(who, "2030-07-01");
    expect((await getRows(who))[0].remindersSent).toBe("[]");
  });
  it("does not overwrite another interval or mark a replacement date with an old acknowledgement", async () => {
    const who = email("ack"); await save(who); const [old] = await getRows(who);
    await Promise.all([recordExamReminder(db, old, 30), recordExamReminder(db, old, 14)]);
    expect(JSON.parse((await getRows(who))[0].remindersSent).sort()).toEqual([14,30]);
    await save(who, "2030-07-01");
    await recordExamReminder(db, old, 7);
    expect((await getRows(who))[0].remindersSent).toBe("[]");
  });
  it("rechecks stale scans and prevents duplicate SMTP across workers and repeated saves", async () => {
    const who = email("delivery"); await save(who); const [old] = await getRows(who);
    const key = workKey("exam-email", `${who}:class1-water:2030-06-01:7`); keys.push(key);
    const send = vi.fn().mockResolvedValue(undefined);
    await Promise.allSettled([deliverCurrentExamReminder(db, old, 7, send), deliverCurrentExamReminder(db, old, 7, send)]);
    expect(send).toHaveBeenCalledTimes(1);
    await save(who);
    await deliverCurrentExamReminder(db, (await getRows(who))[0], 7, send);
    expect(send).toHaveBeenCalledTimes(1);
    await save(who, "2030-07-01");
    expect(await deliverCurrentExamReminder(db, old, 14, send)).toBe(false);
    await removeExamDate(db, who, "class1");
    expect(await deliverCurrentExamReminder(db, old, 30, send)).toBe(false);
  });
  it("does not credit the replacement date when it changes during SMTP delivery", async () => {
    const who = email("during-send"); await save(who); const [old] = await getRows(who);
    keys.push(workKey("exam-email", `${who}:class1-water:2030-06-01:7`));
    await deliverCurrentExamReminder(db, old, 7, async () => { await save(who, "2030-07-01"); });
    expect((await getRows(who))[0].remindersSent).toBe("[]");
  });
  it("enforces authenticated ownership and uses normalized keys on set/get/remove routes", async () => {
    const who = email("routes"), other = email("other");
    const input = { email: who.toUpperCase(), productKey: "class1", examDate: "2030-06-01" };
    await expect(caller().examDate.set(input)).rejects.toThrow("Unauthorized");
    await expect(caller(other).examDate.set(input)).rejects.toThrow("Unauthorized");
    await caller(who).examDate.set(input);
    expect(await caller(other).examDate.get(input)).toBeNull();
    expect((await caller(who).examDate.get(input))?.productKey).toBe("class1-water");
    await expect(caller(other).examDate.remove(input)).rejects.toThrow("Unauthorized");
    await caller(who).examDate.remove(input);
    expect(await getRows(who)).toHaveLength(0);
  });
  it("shares the atomic date writer with onboarding and clears reminders when the date is removed", async () => {
    const who = email("onboarding");
    const profile = { courseKey: "class1-water", examDate: "2030-06-01", studyDaysPerWeek: 3,
      sessionMinutes: 25 as const, confidence: "somewhat" as const };
    await caller(who).activation.saveProfile(profile);
    const [first] = await getRows(who);
    await recordExamReminder(db, first, 30);
    await Promise.all([
      caller(who).activation.saveProfile(profile),
      caller(who).examDate.set({ email: who, productKey: "class1", examDate: profile.examDate }),
    ]);
    expect(await getRows(who)).toHaveLength(1);
    expect(JSON.parse((await getRows(who))[0].remindersSent)).toEqual([30]);
    await expect(caller(who).activation.saveProfile({ ...profile, examDate: "2030-02-30" })).rejects.toThrow("Invalid exam date");
    expect((await getRows(who))[0].examDate.toISOString().slice(0,10)).toBe("2030-06-01");
    await caller(who).activation.saveProfile({ ...profile, examDate: null });
    expect(await getRows(who)).toHaveLength(0);
  });
  it("runs the real reconciliation CLI with stale-snapshot, backup and idempotency checks in an isolated schema", async () => {
    const sourceUrl = new URL(process.env.DATABASE_URL!);
    const sourceDatabase = sourceUrl.pathname.slice(1);
    if (!/^[a-zA-Z0-9_]+$/.test(sourceDatabase)) throw new Error("Unsafe fixture schema name");
    const fixture = `exam_dates_test_${randomUUID().replaceAll("-", "")}`;
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);
    const directory = await mkdtemp(path.join(tmpdir(), "exam-date-release-"));
    const backup = path.join(directory, "backup.json");
    try {
      await connection.query(`CREATE DATABASE \`${fixture}\``);
      await connection.query(`CREATE TABLE \`${fixture}\`.exam_dates LIKE \`${sourceDatabase}\`.exam_dates`);
      await connection.query(`ALTER TABLE \`${fixture}\`.exam_dates DROP INDEX exam_dates_email_product_unique`);
      await connection.query(`CREATE TABLE \`${fixture}\`.scheduled_work LIKE \`${sourceDatabase}\`.scheduled_work`);
      await connection.query(`INSERT INTO \`${fixture}\`.exam_dates
        (id,email,productKey,examDate,remindersSent,courseKey,updatedAt) VALUES
        (1,'Release@Example.test','class1','2030-06-01 00:00:00','[30]',NULL,'2026-01-01'),
        (2,'release@example.test','class1-water','2030-06-01 12:00:00','[14]','class1-water','2026-01-02')`);
      sourceUrl.pathname = `/${fixture}`;
      const run = async (args: string[] = [], approved = false) => promisify(execFile)(
        path.resolve("node_modules/.bin/tsx"), ["scripts/db/reconcileExamDates.ts", ...args], {
          timeout: 20_000, env: { ...process.env, DATABASE_URL: sourceUrl.toString(),
            EXAM_DATE_RECONCILIATION_APPROVED: approved ? "APPLY_REVIEWED_EXAM_DATES" : "",
            EXAM_DATE_WRITERS_PAUSED: approved ? "ALL_WRITERS_PAUSED" : "",
            MIGRATION_BACKUP_CONFIRMED: approved ? "BACKUP_VERIFIED" : "" },
        });
      const initial = JSON.parse((await run()).stdout);
      expect(initial.rowCount).toBe(2);
      expect(initial.changes[0].keeper.remindersSent).toBe("[30,14]");
      await expect(run(["--apply", "--sha256", initial.sha256, "--backup", backup])).rejects.toThrow();
      await expect(run(["--apply", "--sha256", "outdated", "--backup", backup], true)).rejects.toThrow();
      expect(JSON.parse((await run()).stdout).rowCount).toBe(2);
      // A possibly-sent legacy alias must not silently acquire a fresh delivery identity.
      const legacyKey = workKey("exam-email", "release@example.test:class1:2030-06-01:7");
      await connection.query(`INSERT INTO \`${fixture}\`.scheduled_work (workKey,status) VALUES (?, 'uncertain')`, [legacyKey]);
      await expect(run(["--apply", "--sha256", initial.sha256, "--backup", backup], true)).rejects.toThrow();
      await connection.query(`DELETE FROM \`${fixture}\`.scheduled_work WHERE workKey = ?`, [legacyKey]);
      await run(["--apply", "--sha256", initial.sha256, "--backup", backup], true);
      expect(JSON.parse(await readFile(backup, "utf8")).rows).toHaveLength(2);
      expect((await stat(backup)).mode & 0o777).toBe(0o600);
      const after = JSON.parse((await run()).stdout);
      expect(after.rowCount).toBe(1);
      expect(after.changes).toEqual([]);
      await connection.query(`CREATE UNIQUE INDEX exam_dates_email_product_unique ON \`${fixture}\`.exam_dates (email,productKey)`);
      await expect(connection.query(`INSERT INTO \`${fixture}\`.exam_dates (email,productKey,examDate,remindersSent)
        VALUES ('release@example.test','class1-water','2030-06-02','[]')`)).rejects.toThrow();
    } finally {
      await connection.query(`DROP DATABASE IF EXISTS \`${fixture}\``);
      await connection.end();
      await rm(directory, { recursive: true, force: true });
    }
  }, 90_000);
});
