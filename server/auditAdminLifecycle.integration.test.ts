import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { accountSignIns, changelog, contactSubmissions, trialEmails, users } from "../drizzle/schema";
import { assertAuditIntegrationDatabaseTarget } from "./auditIntegrationGuard";
import { getDb } from "./db";
import { router } from "./_core/trpc";
import type { TrpcContext } from "./_core/context";
import { adminRouter } from "./routers/admin";
import { changelogRouter } from "./routers/changelogRouter";
import { municipalProcurementRouter } from "./municipalProcurement";
import { readMunicipalCallback } from "../shared/municipalCallback";
import { isActionableLead } from "../shared/adminLeadTriage";

vi.mock("./email", async original => ({ ...await original<typeof import("./email")>(), sendContactEmail: vi.fn().mockResolvedValue(undefined) }));
vi.mock("./_core/notification", () => ({ notifyOwner: vi.fn().mockResolvedValue(true) }));

const suite = process.env.AUDIT_INTEGRATION_TEST_DB === "1" ? describe : describe.skip;
const testRouter = router({ changelog: router(changelogRouter), admin: adminRouter, municipal: municipalProcurementRouter });
const caller = (role?: "admin" | "user") => testRouter.createCaller({
  user: role ? { id: 1, role, email: "admin@example.test" } : null,
  studentEmail: null, req: { ip: "192.0.2.14", headers: {} }, res: {},
} as TrpcContext);
let db: NonNullable<Awaited<ReturnType<typeof getDb>>>;
const releaseIds: number[] = [];
const contactIds: number[] = [];
const trialIds: number[] = [];
const tag = randomUUID();
const email = `audit-admin-${tag}@example.test`;

suite("isolated admin, changelog and procurement lifecycle", () => {
  beforeAll(async () => {
    assertAuditIntegrationDatabaseTarget(process.env.DATABASE_URL, target =>
      target.hostname === "127.0.0.1" && target.port === "3311"
      && target.pathname === "/echelon_audit_funnel" && target.username === "root" && !target.password);
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("External network forbidden in admin tests"))));
    db = (await getDb())!;
    if (!db) throw new Error("Disposable database unavailable");
  });
  afterAll(async () => {
    if (db) {
      if (releaseIds.length) await db.delete(changelog).where(inArray(changelog.id, releaseIds));
      if (contactIds.length) await db.delete(contactSubmissions).where(inArray(contactSubmissions.id, contactIds));
      if (trialIds.length) await db.delete(trialEmails).where(inArray(trialEmails.id, trialIds));
    }
    vi.unstubAllGlobals();
  });

  it("rejects unauthenticated and non-admin reads/writes before side effects", async () => {
    for (const role of [undefined, "user"] as const) {
      await expect(caller(role).changelog.adminList()).rejects.toBeDefined();
      await expect(caller(role).changelog.create({ date: "October 2026", title: "No write", body: "No write" })).rejects.toBeDefined();
      await expect(caller(role).admin.getLeadCapture({ limit: 10 })).rejects.toBeDefined();
      await expect(caller(role).admin.setContactFollowUpStatus({ id: 1, status: "closed" })).rejects.toBeDefined();
    }
  });
  it("pages every sign-in identity and visit across concurrent new sign-ins", async () => {
    const admin = caller("admin").admin;
    const addresses = Array.from({ length: 30 }, (_, index) => `directory-${tag}-${index}@example.test`);
    const address = addresses[0];
    const [{ id: accountId }] = await db.insert(users).values({ openId: tag, name: "Directory account", email: address }).$returningId();
    try {
      await db.insert(accountSignIns).values(addresses.map(verifiedEmail => ({ verifiedEmail, method: "email_otp" as const })));
      await db.insert(accountSignIns).values(Array.from({ length: 26 }, () => ({ verifiedEmail: address, method: "dashboard_otp" as const })));
      await db.insert(accountSignIns).values({ userId: accountId, method: "oauth" });
      const first = await admin.signInPeople({});
      expect(first.items).toHaveLength(25);
      expect(first.items.find(row => row.learner.key === `user:${accountId}`)).toMatchObject({ count: 1, learner: { name: "Directory account", email: address } });
      expect(first.items.find(row => row.learner.key === `email:${address}`)).toMatchObject({ count: 27, method: "Dashboard OTP", learner: { name: null } });

      // This person was near the end of the original directory, then signed in again.
      await db.insert(accountSignIns).values({ verifiedEmail: addresses[1], method: "legacy_magic_link" });
      const keys = first.items.map(row => row.learner.key);
      let cursor = first.next;
      while (cursor && !keys.includes(`email:${addresses[1]}`)) {
        const page = await admin.signInPeople({ cursor });
        keys.push(...page.items.map(row => row.learner.key));
        cursor = page.next;
      }
      for (const verifiedEmail of addresses) expect(keys).toContain(`email:${verifiedEmail}`);
      expect(new Set(keys).size).toBe(keys.length);

      const visits = await admin.signInHistory({ learner: { email: address } });
      expect(visits.items).toHaveLength(25);
      const older = await admin.signInHistory({ learner: { email: address }, before: visits.next! });
      expect(older.items.map(row => row.method)).toEqual(["Dashboard OTP", "Email OTP"]);
      expect(older.next).toBeNull();
      expect(new Set([...visits.items, ...older.items].map(row => row.id)).size).toBe(27);
      const oauth = await admin.signInHistory({ learner: { userId: accountId } });
      expect(oauth.items.map(row => row.method)).toEqual(["OAuth"]);
    } finally {
      await db.delete(accountSignIns).where(inArray(accountSignIns.verifiedEmail, addresses));
      await db.delete(accountSignIns).where(eq(accountSignIns.userId, accountId));
      await db.delete(users).where(eq(users.id, accountId));
    }
  });
  it("creates, edits, hides, republishes, orders and deletes a stored release", async () => {
    const created = await caller("admin").changelog.create({ date: "October 2026", title: `Synthetic release ${tag}`, body: "Synthetic lifecycle evidence" });
    releaseIds.push(created.id);
    expect((await caller().changelog.list())[0].id).toBe(created.id);
    const admin = await caller("admin").changelog.adminList();
    expect(admin.some(row => row.origin === "bundled")).toBe(true);
    expect(admin.find(row => row.id === created.id)?.origin).toBe("database");
    await caller("admin").changelog.update({ id: created.id, title: `Edited ${tag}`, visible: false });
    expect((await caller().changelog.list()).some(row => row.id === created.id)).toBe(false);
    expect((await caller("admin").changelog.adminList()).find(row => row.id === created.id)).toMatchObject({ visible: false, title: `Edited ${tag}` });
    await caller("admin").changelog.update({ id: created.id, visible: true });
    expect((await caller().changelog.list()).some(row => row.id === created.id)).toBe(true);
    await expect(caller("admin").changelog.update({ id: -20261014, visible: false })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller("admin").changelog.delete({ id: -20261014 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await caller("admin").changelog.delete({ id: created.id });
    expect((await caller().changelog.list()).some(row => row.id === created.id)).toBe(false);
    await expect(caller("admin").changelog.update({ id: created.id, title: "Gone" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller("admin").changelog.delete({ id: created.id })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
  it("persists a callback once, exposes its phone to admins, retains old suppression and closes the inquiry", async () => {
    const input = { kind: "quote" as const, requestKey: randomUUID(), name: "Synthetic Manager", email,
      organization: `Synthetic Utility ${tag}`, region: "nova-scotia" as const, tier: "all-access" as const,
      seats: 5, phone: "+1 202-555-0142", callbackRequested: true, preferredCallbackTime: "9–11 Eastern" };
    const first = await caller().municipal.request(input);
    contactIds.push(first.receiptId);
    expect((await caller().municipal.request(input)).receiptId).toBe(first.receiptId);
    const [row] = await db.select().from(contactSubmissions).where(eq(contactSubmissions.id, first.receiptId));
    expect(readMunicipalCallback(row.message)).toMatchObject({ phone: input.phone });
    let lead = (await caller("admin").admin.getLeadCapture({ limit: 500 })).people.find(person => person.email === email);
    expect(lead).toMatchObject({ phone: input.phone, contactRequestId: first.receiptId, optedOut: false });
    expect(isActionableLead(lead!)).toBe(true);

    // The old opt-out is intentionally outside the single most-recent trial row.
    const inserted = await db.insert(trialEmails).values([
      { email: email.toUpperCase(), source: "oit", optOut: true, createdAt: new Date("2020-01-01T00:00:00Z") },
      { email, source: "oit", createdAt: new Date(Date.now() + 1000) },
    ]).$returningId();
    trialIds.push(...inserted.map(row => row.id));
    lead = (await caller("admin").admin.getLeadCapture({ limit: 1 })).people.find(person => person.email === email);
    expect(lead?.optedOut).toBe(true);
    expect(isActionableLead(lead!)).toBe(false);
    await caller("admin").admin.setContactFollowUpStatus({ id: first.receiptId, status: "closed" });
    expect((await db.select().from(contactSubmissions).where(eq(contactSubmissions.id, first.receiptId)))[0].followUpStatus).toBe("closed");
  });
});
