import { randomUUID } from "node:crypto";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { abandonedCheckouts, organizations, scheduledWork, subscriptions, teamFlexOrders, trialEmails } from "../drizzle/schema";
import { STUDY_FOLLOW_UP_CONSENT_VERSION } from "../shared/leadStudyContext";
import { assertAuditIntegrationDatabaseTarget } from "./auditIntegrationGuard";
import { getDb } from "./db";
import { deliverOnce, workKey } from "./jobs/durableWork";
import { runLeadFollowUps } from "./jobs/leadFollowUps";
import { hasHistoricalPayment, unsubscribeFollowUpEmail } from "./leadFollowUpPolicy";

const suite = process.env.AUDIT_INTEGRATION_TEST_DB === "1" ? describe : describe.skip;
suite.sequential("lead follow-up delivery and suppression on isolated MySQL", () => {
  let db: NonNullable<Awaited<ReturnType<typeof getDb>>>;
  const emails: string[] = [];
  beforeAll(async () => {
    assertAuditIntegrationDatabaseTarget(process.env.DATABASE_URL, () => false);
    db = (await getDb())!;
    if (!db) throw new Error("Disposable MySQL database required");
  });
  afterEach(async () => {
    if (!emails.length) return;
    for (const email of emails) for (const stage of [1, 2]) {
      await db.delete(scheduledWork).where(eq(scheduledWork.workKey, workKey("lead-follow-up-v1", `${email}:${stage}`)));
    }
    await db.delete(trialEmails).where(inArray(trialEmails.email, emails));
    await db.delete(abandonedCheckouts).where(inArray(abandonedCheckouts.email, emails));
    await db.delete(subscriptions).where(inArray(subscriptions.email, emails));
    await db.delete(teamFlexOrders).where(inArray(teamFlexOrders.managerEmail, emails));
    await db.delete(organizations).where(inArray(organizations.managerEmail, emails));
    emails.length = 0;
  });
  async function lead(consented = true) {
    const email = `follow-up-${randomUUID()}@example.org`;
    emails.push(email);
    await db.insert(trialEmails).values({ email, source: "us-texas-class-d-water", studyContext: "country=US&state=TX",
      createdAt: new Date(Date.now() - 4 * 86400000),
      followUpConsentAt: consented ? new Date() : null,
      followUpConsentVersion: consented ? STUDY_FOLLOW_UP_CONSENT_VERSION : null,
    });
    return email;
  }
  const sender = () => vi.fn(async (_input: Parameters<typeof runLeadFollowUps>[0] extends ((input: infer I) => any) | undefined ? I : never) => {});

  it("sends once across concurrent workers and uses a persisted token and Texas offer", async () => {
    const email = await lead();
    const send = sender();
    await Promise.all([runLeadFollowUps(send), runLeadFollowUps(send)]);
    expect(send).toHaveBeenCalledTimes(1);
    const [saved] = await db.select().from(trialEmails).where(eq(trialEmails.email, email));
    expect(send.mock.calls[0][0]).toMatchObject({ email,
      offerUrl: "https://echeloninstitute.ca/pricing?product=us-texas-class-d-water&country=US&state=TX",
      unsubscribeUrl: `https://echeloninstitute.ca/api/unsubscribe-lead?token=${saved.unsubscribeToken}`,
    });
    expect(saved.followUpStage).toBe(1);
  });

  it("does not resend an ambiguous SMTP attempt", async () => {
    await lead();
    const send = vi.fn(async () => { throw new Error("Synthetic SMTP acknowledgement timeout"); });
    await runLeadFollowUps(send);
    await runLeadFollowUps(send);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("recovers the stage marker after delivery was completed before a crash", async () => {
    const email = await lead();
    await deliverOnce(db, workKey("lead-follow-up-v1", `${email}:1`), async () => {});
    const send = sender();
    await runLeadFollowUps(send);
    expect(send).not.toHaveBeenCalled();
    const [saved] = await db.select().from(trialEmails).where(eq(trialEmails.email, email));
    expect(saved.followUpStage).toBe(1);
  });

  it("never infers permission from a legacy capture", async () => {
    await lead(false);
    const send = sender();
    await runLeadFollowUps(send);
    expect(send).not.toHaveBeenCalled();
  });

  it("honours an older duplicate opt-out even when the newer capture is consented", async () => {
    const email = await lead();
    await db.insert(trialEmails).values({ email, source: "quiz_gate", optOut: true });
    const send = sender();
    await runLeadFollowUps(send);
    expect(send).not.toHaveBeenCalled();
  });

  it.each(["subscription", "cancelled-team", "course-pass"] as const)("suppresses a historical %s buyer", async kind => {
    const email = await lead();
    if (kind === "subscription") {
      await db.insert(subscriptions).values({ email, tier: "class1", province: "ontario",
        stripeSubscriptionId: `sub_test_${randomUUID()}`, status: "cancelled", amountCAD: null,
        currentPeriodStart: new Date(), currentPeriodEnd: new Date(),
      });
    } else if (kind === "cancelled-team") {
      await db.insert(organizations).values({ name: "Synthetic Utility", province: "ontario", seatsTotal: 5,
        managerEmail: email, stripeSubscriptionId: `sub_test_${randomUUID()}`, termEnd: new Date(), status: "cancelled", billingType: "stripe",
      });
    } else {
      await db.insert(teamFlexOrders).values({ organizationId: 987654321, managerEmail: email,
        totalLicences: 1, subtotalCents: 3900, totalBeforeTaxCents: 3900, status: "paid",
      });
    }
    expect(await hasHistoricalPayment(db, email)).toBe(true);
    const send = sender();
    await runLeadFollowUps(send);
    expect(send).not.toHaveBeenCalled();
  });

  it("does not mistake an unpaid placeholder subscription for historical payment", async () => {
    const email = await lead();
    await db.insert(subscriptions).values({ email, tier: "class1", province: "ontario",
      stripeSubscriptionId: `placeholder-${randomUUID()}`, status: "active", amountCAD: 0,
      currentPeriodStart: new Date(), currentPeriodEnd: new Date(),
    });
    expect(await hasHistoricalPayment(db, email)).toBe(false);
    const send = sender();
    await runLeadFollowUps(send);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("unsubscribes every duplicate capture and cart for the normalized email", async () => {
    const email = await lead();
    await db.insert(trialEmails).values({ email, source: "quiz_gate" });
    await db.insert(abandonedCheckouts).values({ email, stripeSessionId: `cs_test_${randomUUID()}`, productKey: "oit" });
    await unsubscribeFollowUpEmail(db, ` ${email.toUpperCase()} `);
    expect((await db.select().from(trialEmails).where(eq(trialEmails.email, email))).every(row => row.optOut)).toBe(true);
    const [cart] = await db.select().from(abandonedCheckouts).where(eq(abandonedCheckouts.email, email));
    expect(cart.optOut).toBe(true);
  });
});
