import { and, eq, inArray, isNull, lt, or } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { getDb } from "../db";
import { purchases, trialEmails } from "../../drizzle/schema";
import { isSyntheticCustomerEmail } from "../../shared/revenueReporting";
import { resolveCourseKey } from "../../shared/courseRegistry";
import { resolveQuizGateOffer } from "../../shared/checkoutOffer";
import { sendLeadFollowUpEmail } from "../leadFollowUpEmail";

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
 * - the lead has purchased anything since capture (buyers are customers, not
 *   leads; customer lifecycle email is the trigger engine's job)
 * - the lead created an account and their account email purchased
 *
 * Failure handling mirrors the team order recovery: the stage is advanced
 * only after the send succeeds, so a transient SMTP failure retries on the
 * next run instead of silently dropping the lead.
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
export function resolveLeadCourse(source: string): {
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
  // The pricing page with the course preselected works for every source,
  // including gates like "paywall_browse" that are not product keys.
  const url = offer.available || course
    ? `${site}/pricing?course=${encodeURIComponent(source)}`
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
        or(
          and(eq(trialEmails.followUpStage, 0), lt(trialEmails.createdAt, stage1Cutoff)),
          and(eq(trialEmails.followUpStage, 1), lt(trialEmails.createdAt, stage2Cutoff))
        )
      )
    )
    .limit(200);

  if (candidates.length === 0) return result;

  // One query answers "has any candidate email purchased anything".
  const candidateEmails = Array.from(
    new Set(candidates.map(c => c.email.trim().toLowerCase()))
  );
  const purchasedRows = await db
    .select({ email: purchases.email })
    .from(purchases)
    .where(
      and(
        inArray(purchases.email, candidateEmails),
        eq(purchases.status, "active")
      )
    );
  const purchasedEmails = new Set(
    purchasedRows.map(r => r.email.trim().toLowerCase())
  );

  for (const lead of candidates) {
    if (result.sent >= MAX_SENDS_PER_RUN) break;
    const stage = dueStage({
      followUpStage: lead.followUpStage,
      optOut: lead.optOut,
      createdAt: lead.createdAt,
      now,
    });
    if (!stage) continue;
    result.considered += 1;

    const email = lead.email.trim().toLowerCase();

    if (isSyntheticCustomerEmail(email)) {
      result.suppressedSynthetic += 1;
      // Park synthetic rows permanently so they stop matching the candidate
      // query instead of being re-filtered forever.
      await db
        .update(trialEmails)
        .set({ followUpStage: 2, lastFollowUpAt: now })
        .where(eq(trialEmails.id, lead.id));
      continue;
    }

    if (purchasedEmails.has(email)) {
      result.suppressedPurchased += 1;
      await db
        .update(trialEmails)
        .set({ followUpStage: 2, lastFollowUpAt: now })
        .where(eq(trialEmails.id, lead.id));
      continue;
    }

    // Ensure the unsubscribe token exists before the first send.
    let token = lead.unsubscribeToken;
    if (!token) {
      token = randomBytes(32).toString("hex");
      await db
        .update(trialEmails)
        .set({ unsubscribeToken: token })
        .where(and(eq(trialEmails.id, lead.id), isNull(trialEmails.unsubscribeToken)));
    }

    const courseInfo = resolveLeadCourse(lead.source);
    try {
      await send({
        email,
        stage,
        courseLabel: courseInfo.courseLabel,
        courseUrl: courseInfo.courseUrl,
        offerUrl: courseInfo.offerUrl,
        priceLabel: courseInfo.priceLabel,
        unsubscribeUrl: `https://echeloninstitute.ca/api/unsubscribe-lead?token=${token}`,
      });
      // Advance the stage ONLY after a successful send, so failures retry.
      await db
        .update(trialEmails)
        .set({ followUpStage: stage, lastFollowUpAt: now })
        .where(eq(trialEmails.id, lead.id));
      result.sent += 1;
    } catch (error) {
      result.failed += 1;
      console.error(
        `[lead-follow-up] send failed for lead ${lead.id} stage ${stage}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  return result;
}
