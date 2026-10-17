import { and, eq, isNull, isNotNull, gt, lt, or, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { getDb } from "../db";
import { ENV } from "../_core/env";
import { trialEmails } from "../../drizzle/schema";
import { isSyntheticCustomerEmail } from "../../shared/revenueReporting";
import { resolveCourseKey } from "../../shared/courseRegistry";
import { resolveQuizGateOffer } from "../../shared/checkoutOffer";
import { sendLeadFollowUpEmail } from "../leadFollowUpEmail";
import { leadPricingHref, STUDY_FOLLOW_UP_CONSENT_VERSION } from "../../shared/leadStudyContext";
import { hasHistoricalPayment, isFollowUpSuppressed } from "../leadFollowUpPolicy";
import { deliverOnce, workKey } from "./durableWork";

/**
 * Bounded follow-up for captured quiz-gate leads.
 *
 * Why: a lead captured at the quiz gate received one study plan email at the
 * moment of capture and was then forgotten. The people most likely to buy are
 * exactly the ones who practised, left, and got busy. Two further touches,
 * then permanent silence.
 *
 * Schedule per lead:
 * - Stage 1 at 3+ days after capture: a study nudge back into their course.
 * - Stage 2 at 10+ days after capture: one clear offer, explicitly the last.
 *
 * Hard suppressions, checked at send time, in order:
 * - opted out (one-click unsubscribe)
 * - synthetic or internal test addresses
 * - historical individual, subscription or Teams payment evidence
 * - no explicit permission for these two emails
 *
 * Explicit permission and email-wide suppression are rechecked immediately
 * before SMTP. Durable email/stage receipts fence concurrent runs and crashes.
 * An ambiguous SMTP result is held for inspection, never automatically resent.
 */

const STAGE1_AGE_MS = 3 * 24 * 60 * 60 * 1000;
const STAGE2_AGE_MS = 10 * 24 * 60 * 60 * 1000;
/** Leads older than this never enter the sequence; a 60 day old lead is cold
 * and a surprise email that late reads as spam. */
const MAX_LEAD_AGE_MS = 45 * 24 * 60 * 60 * 1000;
/** Upper bound per run to keep a single run fast and SMTP-friendly. */
const MAX_SENDS_PER_RUN = 25;

export interface LeadFollowUpResult {
  considered: number;
  sent: number;
  suppressedPurchased: number;
  suppressedOptOut: number;
  suppressedSynthetic: number;
  failed: number;
  suppressedNoConsent: number;
}

/** Decide which stage, if any, a lead is due for. Pure and exported for tests. */
export function dueStage(lead: {
  followUpStage: number;
  optOut: boolean;
  createdAt: Date;
  now?: Date;
}): 1 | 2 | null {
  const now = lead.now ?? new Date();
  if (lead.optOut) return null;
  const age = now.getTime() - lead.createdAt.getTime();
  if (age > MAX_LEAD_AGE_MS) return null;
  if (lead.followUpStage === 0 && age >= STAGE1_AGE_MS) return 1;
  if (lead.followUpStage === 1 && age >= STAGE2_AGE_MS) return 2;
  return null;
}

/** Resolve the course label, link and offer for the lead's capture source. */
export function resolveLeadCourse(source: string, studyContext = ""): {
  courseLabel: string;
  courseUrl: string;
  offerUrl: string;
  priceLabel?: string;
} {
  const site = "https://echeloninstitute.ca";
  const course = resolveCourseKey(source);
  const offer = resolveQuizGateOffer(source);
  const courseLabel =
    course?.displayName ??
    (offer.available ? offer.productName : "your operator exam");
  // Known courses use the same canonical pricing contract as the browser.
  // Generic capture sources remain generic rather than inventing a product.
  const url = offer.available || course
    ? `${site}${leadPricingHref(source, studyContext)}`
    : `${site}/pricing`;
  return {
    courseLabel,
    courseUrl: url,
    offerUrl: url,
    priceLabel: offer.available ? offer.priceLabel : undefined,
  };
}

export async function runLeadFollowUps(
  send: typeof sendLeadFollowUpEmail = sendLeadFollowUpEmail
): Promise<LeadFollowUpResult> {
  const result: LeadFollowUpResult = {
    considered: 0,
    sent: 0,
    suppressedPurchased: 0,
    suppressedOptOut: 0,
    suppressedSynthetic: 0,
    failed: 0,
    suppressedNoConsent: 0,
  };

  const db = await getDb();
  if (!db) return result;

  const now = new Date();
  // Candidates: stage 0 older than 3 days, or stage 1 older than 10 days.
  const stage1Cutoff = new Date(now.getTime() - STAGE1_AGE_MS);
  const stage2Cutoff = new Date(now.getTime() - STAGE2_AGE_MS);
  const candidates = await db
    .select()
    .from(trialEmails)
    .where(
      and(
        eq(trialEmails.optOut, false),
        isNotNull(trialEmails.followUpConsentAt),
        eq(trialEmails.followUpConsentVersion, STUDY_FOLLOW_UP_CONSENT_VERSION),
        gt(trialEmails.createdAt, new Date(now.getTime() - MAX_LEAD_AGE_MS)),
        or(
          and(eq(trialEmails.followUpStage, 0), lt(trialEmails.createdAt, stage1Cutoff)),
          and(eq(trialEmails.followUpStage, 1), lt(trialEmails.createdAt, stage2Cutoff))
        )
      )
    )
    .limit(200);

  if (candidates.length === 0) return result;
  // A known configuration failure has not attempted SMTP and must not consume a receipt.
  if (send === sendLeadFollowUpEmail && (!ENV.smtpUser || !ENV.smtpPass)) {
    throw new Error("SMTP not configured for lead follow-ups");
  }

  const seenEmails = new Set<string>();
  for (const lead of candidates) {
    if (result.sent >= MAX_SENDS_PER_RUN) break;
    const stage = dueStage({ ...lead, now });
    if (!stage) continue;
    const email = lead.email.trim().toLowerCase();
    if (seenEmails.has(email)) continue;
    seenEmails.add(email);
    result.considered += 1;
    if (isSyntheticCustomerEmail(email)) {
      result.suppressedSynthetic += 1;
      continue;
    }
    if (!lead.followUpConsentAt || lead.followUpConsentVersion !== STUDY_FOLLOW_UP_CONSENT_VERSION) {
      result.suppressedNoConsent += 1;
      continue;
    }

    try {
      // The key is shared across duplicate captures of this email, not just one row.
      await deliverOnce(db, workKey("lead-follow-up-v1", `${email}:${stage}`), async () => {
        const [fresh] = await db.select().from(trialEmails).where(eq(trialEmails.id, lead.id)).limit(1);
        if (!fresh || dueStage({ ...fresh, now: new Date() }) !== stage) return;
        if (!fresh.followUpConsentAt || fresh.followUpConsentVersion !== STUDY_FOLLOW_UP_CONSENT_VERSION) {
          result.suppressedNoConsent += 1;
          return;
        }
        if (await isFollowUpSuppressed(db, email)) {
          result.suppressedOptOut += 1;
          return;
        }
        if (await hasHistoricalPayment(db, email)) {
          result.suppressedPurchased += 1;
          return;
        }
        if (!fresh.unsubscribeToken) {
          await db.update(trialEmails).set({ unsubscribeToken: randomBytes(32).toString("hex") })
            .where(and(eq(trialEmails.id, fresh.id), isNull(trialEmails.unsubscribeToken)));
        }
        // Read the persisted token: a competing writer may have won its conditional insert.
        const [saved] = await db.select().from(trialEmails).where(eq(trialEmails.id, fresh.id)).limit(1);
        if (!saved?.unsubscribeToken) throw new Error("Missing persisted unsubscribe token");
        // Close the window introduced by token persistence before the external send.
        if (await isFollowUpSuppressed(db, email)) { result.suppressedOptOut += 1; return; }
        if (await hasHistoricalPayment(db, email)) { result.suppressedPurchased += 1; return; }
        const courseInfo = resolveLeadCourse(saved.source, saved.studyContext ?? "");
        await send({ email, stage, ...courseInfo,
          unsubscribeUrl: `https://echeloninstitute.ca/api/unsubscribe-lead?token=${saved.unsubscribeToken}`,
        });
        result.sent += 1;
      });
      // Advance all duplicate rows only after a durable completion (including suppression).
      // Never move another worker's later stage backwards.
      await db.update(trialEmails).set({
        followUpStage: sql`GREATEST(${trialEmails.followUpStage}, ${stage})`, lastFollowUpAt: now,
      }).where(sql`LOWER(TRIM(${trialEmails.email})) = ${email}`);
    } catch (error) {
      result.failed += 1;
      console.error(`[lead-follow-up] delivery held for lead ${lead.id}, stage ${stage}:`,
        error instanceof Error ? error.message : error);
    }
  }
  return result;
}
