import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import mysql from "mysql2/promise";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { contactSubmissions } from "../drizzle/schema";
import { getDb } from "./db";
import { sendContactEmail } from "./email";
import { notifyOwner } from "./_core/notification";
import { persistedPartnershipInquiry } from "./partnershipInquiry";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { PartnershipInquiryInput } from "../shared/partnershipInquiry";
import { splitMigrationStatements } from "../scripts/db/migrationSafety";
import { assertAuditIntegrationDatabaseTarget } from "./auditIntegrationGuard";

// Only secondary delivery is mocked: database helpers, Drizzle, MySQL uniqueness,
// persisted receipt lookup, and tRPC authorization all execute normally.
vi.mock("./email", async original => ({
  ...await original<typeof import("./email")>(), sendContactEmail: vi.fn(),
}));
vi.mock("./_core/notification", () => ({ notifyOwner: vi.fn() }));
vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn(() => { throw new Error("Provider access forbidden in receipt tests"); }) }));

const suite = process.env.AUDIT_INTEGRATION_TEST_DB === "1" ? describe : describe.skip;
const execFileAsync = promisify(execFile);
const keys: string[] = [];
const historicalIds: number[] = [];
const prefix = `funnel-synthetic-${randomUUID()}`;
let db: NonNullable<Awaited<ReturnType<typeof getDb>>>;
let connection: mysql.Connection;

function fixture(label: string): PartnershipInquiryInput {
  const requestKey = randomUUID();
  keys.push(requestKey);
  return {
    requestKey, name: " Synthetic Partner ", email: "partner@example.test",
    organization: `${prefix}-${label}`, partnershipType: "Municipal Utility",
    message: "Synthetic inquiry with exact fields.\nRetain spacing and this line.", website: "",
  };
}
const rowsFor = (key: string) => db.select().from(contactSubmissions).where(eq(contactSubmissions.requestKey, key));
const caller = (role?: "admin" | "user") => appRouter.createCaller({
  user: role ? {
    id: 1, openId: "synthetic-funnel-user", name: "Synthetic User", email: "synthetic@example.test",
    loginMethod: "test", role, province: null, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
  } : null,
  req: { headers: {}, protocol: "http" }, res: {},
} as TrpcContext);

suite("partnership receipts with real isolated MySQL and Drizzle", () => {
  beforeAll(async () => {
    // Never enable this suite using only the presence of an application DB URL.
    // The sandbox remains exact; CI uses only its pinned synthetic service.
    const url = assertAuditIntegrationDatabaseTarget(process.env.DATABASE_URL,
      target => target.hostname === "127.0.0.1" && target.port === "3311"
        && target.pathname === "/echelon_audit_funnel"
        && target.username === "root" && !target.password);
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("External HTTP forbidden in receipt tests"))));
    db = (await getDb())!;
    if (!db) throw new Error("Assigned disposable receipt database unavailable");
    connection = await mysql.createConnection(url.toString());
    const [rows] = await connection.query<mysql.RowDataPacket[]>("SELECT DATABASE() AS name");
    if (rows[0]?.name !== url.pathname.slice(1)) throw new Error("Unexpected disposable database");
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sendContactEmail).mockResolvedValue(undefined);
    vi.mocked(notifyOwner).mockResolvedValue(true);
  });

  afterAll(async () => {
    if (db) {
      for (const key of keys) await db.delete(contactSubmissions).where(eq(contactSubmissions.requestKey, key));
      for (const id of historicalIds) await db.delete(contactSubmissions).where(eq(contactSubmissions.id, id));
    }
    if (connection) {
      await connection.query("DROP TRIGGER IF EXISTS funnel_synthetic_receipt_reject");
      await connection.query("DROP TABLE IF EXISTS funnel_synthetic_contact_migration");
      await connection.end();
    }
    vi.unstubAllGlobals();
  });

  it("applies the exact additive proposal to historical synthetic rows without changing their fields and enforces durable key uniqueness", async () => {
    await connection.query(`CREATE TABLE funnel_synthetic_contact_migration (
      id int AUTO_INCREMENT PRIMARY KEY, name varchar(128) NOT NULL, email varchar(320) NOT NULL,
      subject varchar(128) NOT NULL, message text NOT NULL, createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    try {
      await connection.query("INSERT INTO funnel_synthetic_contact_migration (name,email,subject,message) VALUES (?,?,?,?)", ["Historical synthetic sender", "historical@example.test", "Synthetic historical subject", "Historical exact synthetic message.\nKeep this line."]);
      const [before] = await connection.query<mysql.RowDataPacket[]>("SELECT * FROM funnel_synthetic_contact_migration");
      const sql = await readFile(new URL("../drizzle/0076_contact_partnership_receipts.sql", import.meta.url), "utf8");
      for (const statement of splitMigrationStatements(sql)) {
        await connection.query(statement.replaceAll("`contact_submissions`", "`funnel_synthetic_contact_migration`"));
      }
      const [after] = await connection.query<mysql.RowDataPacket[]>("SELECT * FROM funnel_synthetic_contact_migration");
      expect(after[0]).toMatchObject({ ...before[0], requestKey: null, organization: null, partnershipType: null, followUpStatus: "new", notificationStatus: "pending" });
      const key = randomUUID();
      const values = ["Synthetic sender", "synthetic@example.test", "Synthetic subject", "Synthetic keyed message.", key];
      await connection.query("INSERT INTO funnel_synthetic_contact_migration (name,email,subject,message,requestKey) VALUES (?,?,?,?,?)", values);
      await expect(connection.query("INSERT INTO funnel_synthetic_contact_migration (name,email,subject,message,requestKey) VALUES (?,?,?,?,?)", values)).rejects.toMatchObject({ code: "ER_DUP_ENTRY" });
      await connection.query("INSERT INTO funnel_synthetic_contact_migration (name,email,subject,message) VALUES (?,?,?,?)", values.slice(0, 4));
      const [counts] = await connection.query<mysql.RowDataPacket[]>("SELECT COUNT(*) AS total, SUM(requestKey IS NULL) AS historical FROM funnel_synthetic_contact_migration");
      expect(Number(counts[0].total)).toBe(3);
      expect(Number(counts[0].historical)).toBe(2);
    } finally { await connection.query("DROP TABLE funnel_synthetic_contact_migration"); }
  });

  it("persists exact fields once, deduplicates twelve concurrent requests, and survives a fresh-process lost-response retry", async () => {
    const input = fixture("parallel");
    const results = await Promise.all(Array.from({ length: 12 }, () => persistedPartnershipInquiry(input)));
    const receipts = new Set(results.map(result => result.receiptId));
    expect(receipts.size).toBe(1);
    expect(results.every(result => result.success)).toBe(true);
    const rows = await rowsFor(input.requestKey);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      requestKey: input.requestKey, name: input.name, email: input.email,
      organization: input.organization, partnershipType: input.partnershipType,
      message: input.message, subject: "Partnership inquiry", followUpStatus: "new",
    });
    await vi.waitFor(async () => expect((await rowsFor(input.requestKey))[0]?.notificationStatus).toBe("sent"));
    expect(sendContactEmail).toHaveBeenCalledTimes(1);
    expect(notifyOwner).toHaveBeenCalledTimes(1);

    // A brand-new process has no in-memory store, cached Drizzle instance or test mocks.
    // Existing receipts must not attempt either external delivery channel.
    const program = `
      globalThis.fetch = () => { throw new Error("External HTTP forbidden"); };
      const { persistedPartnershipInquiry } = await import("./server/partnershipInquiry.ts");
      const result = await persistedPartnershipInquiry(JSON.parse(process.argv[1]));
      console.log("RECEIPT:" + JSON.stringify(result));
      process.exit(0);
    `;
    const { stdout } = await execFileAsync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", program, JSON.stringify(input)], {
      cwd: process.cwd(), env: process.env, timeout: 20_000,
    });
    const receiptLine = stdout.split("\n").find(line => line.startsWith("RECEIPT:"));
    expect(receiptLine).toBeDefined();
    expect(JSON.parse(receiptLine!.slice("RECEIPT:".length))).toEqual(results[0]);
    expect(await rowsFor(input.requestKey)).toHaveLength(1);
  });

  it("cannot overwrite an existing receipt with changed fields, including a concurrent conflicting payload", async () => {
    const input = fixture("conflict");
    const outcomes = await Promise.allSettled([
      persistedPartnershipInquiry(input),
      persistedPartnershipInquiry({ ...input, message: "Different synthetic inquiry text, never overwrite." }),
    ]);
    expect(outcomes.filter(outcome => outcome.status === "fulfilled")).toHaveLength(1);
    const rejected = outcomes.find(outcome => outcome.status === "rejected") as PromiseRejectedResult;
    expect(rejected.reason).toMatchObject({ code: "CONFLICT" });
    const rows = await rowsFor(input.requestKey);
    expect(rows).toHaveLength(1);
    await expect(persistedPartnershipInquiry({ ...input, message: rows[0].message })).resolves.toMatchObject({ receiptId: rows[0].id });
    await vi.waitFor(async () => expect((await rowsFor(input.requestKey))[0]?.notificationStatus).toBe("sent"));
    expect(sendContactEmail).toHaveBeenCalledTimes(1);
  });

  it.each(["mail-rejects", "owner-false", "owner-rejects"])("keeps a durable saved receipt and failed notification status when %s", async failure => {
    const input = fixture(failure);
    if (failure === "mail-rejects") vi.mocked(sendContactEmail).mockRejectedValueOnce(new Error("Synthetic mail delivery failure"));
    if (failure === "owner-false") vi.mocked(notifyOwner).mockResolvedValueOnce(false);
    if (failure === "owner-rejects") vi.mocked(notifyOwner).mockRejectedValueOnce(new Error("Synthetic notification failure"));
    const report = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      const receipt = await persistedPartnershipInquiry(input);
      expect(receipt.success).toBe(true);
      await vi.waitFor(async () => expect((await rowsFor(input.requestKey))[0]?.notificationStatus).toBe("failed"));
      await expect(persistedPartnershipInquiry(input)).resolves.toEqual(receipt);
      expect(await rowsFor(input.requestKey)).toHaveLength(1);
      expect(sendContactEmail).toHaveBeenCalledTimes(1);
      expect(notifyOwner).toHaveBeenCalledTimes(1);
      expect(report.mock.calls.flat().every(value => typeof value === "string" && !value.includes(input.email) && !value.includes(input.message))).toBe(true);
    } finally { report.mockRestore(); }
  });

  it("returns the receipt while a secondary channel is unresolved, then records its failure", async () => {
    const input = fixture("slow-notification");
    let reject!: (error: Error) => void;
    vi.mocked(sendContactEmail).mockReturnValueOnce(new Promise((_resolve, failure) => { reject = failure; }));
    const report = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      const receipt = await persistedPartnershipInquiry(input);
      expect(receipt.success).toBe(true);
      expect((await rowsFor(input.requestKey))[0]?.notificationStatus).toBe("pending");
      reject(new Error("Synthetic delayed delivery failure"));
      await vi.waitFor(async () => expect((await rowsFor(input.requestKey))[0]?.notificationStatus).toBe("failed"));
    } finally { report.mockRestore(); }
  });

  it("never acknowledges or notifies when MySQL rejects saving, and succeeds with the same key after storage recovers", async () => {
    const input = fixture("save-failure");
    await connection.query("CREATE TRIGGER funnel_synthetic_receipt_reject BEFORE INSERT ON contact_submissions FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Synthetic receipt save rejected'");
    try {
      await expect(caller().contact.partnership(input)).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
      expect(await rowsFor(input.requestKey)).toHaveLength(0);
      expect(sendContactEmail).not.toHaveBeenCalled();
      expect(notifyOwner).not.toHaveBeenCalled();
    } finally { await connection.query("DROP TRIGGER funnel_synthetic_receipt_reject"); }
    await expect(caller().contact.partnership(input)).resolves.toMatchObject({ success: true });
    await vi.waitFor(async () => expect((await rowsFor(input.requestKey))[0]?.notificationStatus).toBe("sent"));
    expect(await rowsFor(input.requestKey)).toHaveLength(1);
  });

  it("preserves nullable historical contact rows and exposes searchable saved receipts only to the existing admin role", async () => {
    const [oldRow] = await db.insert(contactSubmissions).values({ name: "Historical synthetic sender", email: "historical@example.test", subject: "Synthetic general contact", message: "Historical synthetic general contact message." }).$returningId();
    historicalIds.push(oldRow.id);
    const input = fixture("inbox");
    const receipt = await caller().contact.partnership(input);
    await vi.waitFor(async () => expect((await rowsFor(input.requestKey))[0]?.notificationStatus).toBe("sent"));
    await expect(caller().contact.partnershipInbox({ search: input.organization })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller("user").contact.partnershipInbox({ search: input.organization })).rejects.toMatchObject({ code: "FORBIDDEN" });
    const inbox = await caller("admin").contact.partnershipInbox({ search: input.organization, followUpStatus: "new" });
    expect(inbox).toHaveLength(1);
    expect(inbox[0]).toMatchObject({ id: receipt.receiptId, organization: input.organization, message: input.message, notificationStatus: "sent", followUpStatus: "new" });
    expect(await caller("admin").contact.partnershipInbox({ search: input.organization, followUpStatus: "closed" })).toHaveLength(0);
    expect(await caller("admin").contact.partnershipInbox({ search: "x' OR 1=1 --" })).toHaveLength(0);
    const [history] = await db.select().from(contactSubmissions).where(eq(contactSubmissions.id, oldRow.id));
    expect(history).toMatchObject({ requestKey: null, organization: null, partnershipType: null, subject: "Synthetic general contact" });
  });
});
