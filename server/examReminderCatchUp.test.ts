import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { runExamReminders } from "./jobs/examReminders";

/**
 * The daily exam-reminder schedule silently disappeared in September 2026 and
 * every learner whose 30/14/7/1-day window passed during the outage received
 * nothing. These tests pin the catch-up rule that fixed it: when a run finds
 * missed windows, it sends exactly one email for the most urgent pending
 * window and retires every missed window so recovery never double-mails.
 */

const sendMail = vi.fn().mockResolvedValue(undefined);

vi.mock("nodemailer", () => ({
  default: { createTransport: () => ({ sendMail }) },
  createTransport: () => ({ sendMail }),
}));

const rows: any[] = [];
const recorded: Array<{ id: number; interval: number }> = [];

vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => ({ from: () => rowsQuery() }),
    update: () => ({ set: () => ({ where: async () => undefined }) }),
  }),
}));

function rowsQuery() {
  const q: any = Promise.resolve(rows);
  q.where = () => ({ limit: async () => rows });
  return q;
}

vi.mock("./jobs/durableWork", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./jobs/durableWork")>();
  return {
    ...actual,
    deliverOnce: async (_db: unknown, _key: string, send: () => Promise<unknown>) => {
      await send();
      return true;
    },
  };
});

vi.mock("./examDateRecords", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./examDateRecords")>();
  return {
    ...actual,
    recordExamReminder: async (_db: unknown, row: any, interval: number) => {
      recorded.push({ id: row.id, interval });
      const history = JSON.parse(row.remindersSent) as number[];
      if (!history.includes(interval)) history.push(interval);
      row.remindersSent = JSON.stringify(history);
    },
  };
});

function daysFromNow(days: number) {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function makeRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    email: "operator@example.com",
    productKey: "wpi-class4-wastewater",
    examDate: daysFromNow(28),
    remindersSent: "[]",
    createdAt: new Date(),
    updatedAt: new Date(),
    orgId: null,
    organizationMemberId: null,
    courseKey: null,
    ...overrides,
  };
}

describe("exam reminder catch-up after missed runs", () => {
  beforeEach(() => {
    rows.length = 0;
    recorded.length = 0;
    sendMail.mockClear();
    process.env.SMTP_HOST = "smtp.test.local";
    process.env.SMTP_USER = "no-reply@echeloninstitute.ca";
    process.env.SMTP_PASS = "test";
  });

  afterEach(() => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
  });

  it("sends the missed 30-day reminder once the window has passed", async () => {
    rows.push(makeRow({ examDate: daysFromNow(28) }));
    const result = await runExamReminders();
    expect(result.errors).toEqual([]);
    expect(result.sent).toBe(1);
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail.mock.calls[0][0].subject).toContain("28 days");
    expect(recorded.map((r) => r.interval)).toEqual([30]);
  });

  it("sends one email and retires every missed window when several passed", async () => {
    // 6 days out with nothing sent: the 30 and 14 day windows were missed,
    // the 7-day window is pending. One email, keyed to the 7-day window.
    rows.push(makeRow({ examDate: daysFromNow(6) }));
    const result = await runExamReminders();
    expect(result.sent).toBe(1);
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail.mock.calls[0][0].subject).toContain("6 days");
    expect(recorded.map((r) => r.interval).sort((a, b) => a - b)).toEqual([7, 14, 30]);
  });

  it("does not resend windows already acknowledged", async () => {
    rows.push(makeRow({ examDate: daysFromNow(6), remindersSent: "[30,14,7]" }));
    const result = await runExamReminders();
    expect(result.sent).toBe(0);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("stays silent on exam day and after", async () => {
    rows.push(makeRow({ examDate: daysFromNow(0) }));
    rows.push(makeRow({ id: 2, examDate: daysFromNow(-3) }));
    const result = await runExamReminders();
    expect(result.sent).toBe(0);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("sends the tomorrow reminder at one day out", async () => {
    rows.push(makeRow({ examDate: daysFromNow(1), remindersSent: "[30,14,7]" }));
    const result = await runExamReminders();
    expect(result.sent).toBe(1);
    expect(sendMail.mock.calls[0][0].subject).toContain("TOMORROW");
    expect(recorded.map((r) => r.interval)).toEqual([1]);
  });
});
