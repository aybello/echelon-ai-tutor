import { and, eq, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { teamFlexExtensions, teamFlexLicences } from "../../drizzle/schema";
import { getCourseKeyPricingBand, getRetakeExtensionPrice } from "./teamFlexPricing";
import { stripe } from "../stripe/stripe";
import { ENV } from "../_core/env";
import { getCommercialAvailability } from "../commercialAvailability";
import { ALL_PRODUCTS } from "../stripe/products";

export const EXTENSION_DAYS = 90;
export const REPORTING_WINDOW_DAYS = 30;

export type FlexOperatorIdentity = { email: string; userId: number | null };

export interface ExtensionEligibility {
  eligible: boolean;
  reason?: string;
  priceCents: number;
  licenceId: number;
  courseKey: string;
  extensionStartsAt?: Date;
}

function normalizedEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function deriveExtensionWindow(
  licence: {
    status: string;
    accessEndsAt: Date | null;
    originalAccessEndsAt: Date | null;
    reportingEndsAt: Date | null;
    revokedAt: Date | null;
    suspendedAt: Date | null;
  },
  paidAt: Date,
): { eligible: boolean; reason?: string; extensionStartsAt?: Date; extensionEndsAt?: Date; reportingEndsAt?: Date } {
  const originalExpiry = licence.originalAccessEndsAt ?? licence.accessEndsAt;
  if (!originalExpiry) return { eligible: false, reason: "This Course Pass has no recorded original expiry." };
  if ((licence.status !== "active" && licence.status !== "expired") || licence.revokedAt || licence.suspendedAt) {
    return { eligible: false, reason: "This Course Pass is not eligible for a Retake Extension." };
  }

  // A term is active only while its access window remains open. This avoids
  // relying on a scheduled expiry job to determine a paid extension's start.
  const isActiveAtPayment = licence.status === "active" && licence.accessEndsAt !== null && paidAt < licence.accessEndsAt;
  if (!isActiveAtPayment && (!licence.reportingEndsAt || paidAt > licence.reportingEndsAt)) {
    return { eligible: false, reason: "A Retake Extension is available only while access is active or during the 30-day reporting window after expiry." };
  }

  // A normal licence has matching original and current expiry values. The max
  // guard prevents any unusual prior repair from shortening paid access.
  const extensionStartsAt = isActiveAtPayment
    ? new Date(Math.max(originalExpiry.getTime(), licence.accessEndsAt?.getTime() ?? 0))
    : paidAt;
  const extensionEndsAt = new Date(extensionStartsAt);
  extensionEndsAt.setUTCDate(extensionEndsAt.getUTCDate() + EXTENSION_DAYS);
  const reportingEndsAt = new Date(extensionEndsAt);
  reportingEndsAt.setUTCDate(reportingEndsAt.getUTCDate() + REPORTING_WINDOW_DAYS);
  return { eligible: true, extensionStartsAt, extensionEndsAt, reportingEndsAt };
}

function extensionPrice(courseKey: string): number {
  const { examFamily, pricingBand } = getCourseKeyPricingBand(courseKey);
  return getRetakeExtensionPrice(examFamily, pricingBand);
}

export async function checkExtensionEligibility(
  licenceId: number,
  identity: FlexOperatorIdentity,
): Promise<ExtensionEligibility> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const email = normalizedEmail(identity.email);
  const ownership = identity.userId
    ? or(eq(teamFlexLicences.operatorUserId, identity.userId), eq(teamFlexLicences.invitedEmail, email))
    : eq(teamFlexLicences.invitedEmail, email);
  const [licence] = await db.select().from(teamFlexLicences)
    .where(and(eq(teamFlexLicences.id, licenceId), ownership))
    .limit(1);
  if (!licence) return { eligible: false, reason: "Course Pass not found", priceCents: 0, licenceId, courseKey: "" };

  const [extension] = await db.select().from(teamFlexExtensions)
    .where(eq(teamFlexExtensions.licenceId, licence.id)).limit(1);
  if (licence.extensionApplied || extension?.status === "applied") {
    return { eligible: false, reason: "The one Retake Extension for this Course Pass has already been used.", priceCents: 0, licenceId, courseKey: licence.courseKey };
  }
  if (extension?.status === "pending") {
    return { eligible: false, reason: "A Retake Extension checkout is already in progress for this Course Pass.", priceCents: 0, licenceId, courseKey: licence.courseKey };
  }

  const window = deriveExtensionWindow(licence, new Date());
  if (!window.eligible) return { eligible: false, reason: window.reason, priceCents: 0, licenceId, courseKey: licence.courseKey };
  return {
    eligible: true,
    priceCents: extensionPrice(licence.courseKey),
    licenceId,
    courseKey: licence.courseKey,
    extensionStartsAt: window.extensionStartsAt,
  };
}

export async function createRetakeExtensionCheckout(
  licenceId: number,
  identity: FlexOperatorIdentity,
): Promise<{ url: string; extensionId: number }> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const email = normalizedEmail(identity.email);

  let extensionId = 0;
  let courseKey = "";
  let priceCents = 0;
  let checkoutExpiresAt: number | undefined;
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT id FROM team_flex_licences WHERE id = ${licenceId} FOR UPDATE`);
    const [licence] = await tx.select().from(teamFlexLicences).where(eq(teamFlexLicences.id, licenceId)).limit(1);
    const ownsLicence = Boolean(licence) && (
      (identity.userId !== null && licence!.operatorUserId === identity.userId) ||
      licence!.invitedEmail?.toLowerCase() === email
    );
    if (!licence || !ownsLicence) throw new TRPCError({ code: "FORBIDDEN", message: "This Course Pass is not assigned to your verified email." });

    const [existing] = await tx.select().from(teamFlexExtensions)
      .where(eq(teamFlexExtensions.licenceId, licenceId)).limit(1);
    if (licence.extensionApplied || existing?.status === "applied") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "The one Retake Extension for this Course Pass has already been used." });
    }
    if (existing?.status === "pending") {
      throw new TRPCError({ code: "CONFLICT", message: "A Retake Extension checkout is already in progress. Complete it in Stripe or wait for it to expire." });
    }
    if (existing?.stripeCheckoutSessionId || existing?.stripePaymentIntentId) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "A previous Retake Extension payment requires review before another checkout can start.",
      });
    }
    const window = deriveExtensionWindow(licence, new Date());
    if (!window.eligible) throw new TRPCError({ code: "BAD_REQUEST", message: window.reason ?? "This Course Pass is not eligible for a Retake Extension." });

    const releasedCourseKeys = new Set(
      (await getCommercialAvailability(tx as any, ALL_PRODUCTS)).map(product => product.key),
    );
    if (!releasedCourseKeys.has(licence.courseKey)) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This course is not currently available for a Retake Extension." });
    }

    const paymentDeadline = window.reportingEndsAt;
    const earliestStripeExpiry = Date.now() + 31 * 60 * 1000;
    if (!paymentDeadline || paymentDeadline.getTime() <= earliestStripeExpiry) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "The Retake Extension reporting window is too close to expiry to open a secure checkout." });
    }
    checkoutExpiresAt = Math.floor(Math.min(paymentDeadline.getTime(), Date.now() + 24 * 60 * 60 * 1000) / 1000);

    courseKey = licence.courseKey;
    priceCents = extensionPrice(courseKey);
    if (existing) {
      await tx.update(teamFlexExtensions).set({
        purchaserUserId: identity.userId,
        priceCents,
        stripeCheckoutSessionId: null,
        stripePaymentIntentId: null,
        status: "pending",
        appliedAt: null,
        newAccessEndsAt: null,
      }).where(eq(teamFlexExtensions.id, existing.id));
      extensionId = existing.id;
    } else {
      const [created] = await tx.insert(teamFlexExtensions).values({
        licenceId,
        organizationId: licence.organizationId,
        purchaserUserId: identity.userId,
        extensionDays: EXTENSION_DAYS,
        priceCents,
        status: "pending",
      });
      extensionId = Number((created as any).insertId);
    }
  });

  let checkoutSessionId: string | null = null;
  try {
    if (!checkoutExpiresAt) throw new Error("Retake Extension checkout expiry was not calculated");
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "cad",
          unit_amount: priceCents,
          product_data: {
            name: `Echelon Retake Extension — ${courseKey}`,
            description: "One additional 90-day study period for the assigned Course Pass.",
          },
        },
      }],
      automatic_tax: { enabled: true },
      expires_at: checkoutExpiresAt,
      metadata: {
        type: "team_flex_extension",
        teamFlexExtensionId: String(extensionId),
        licenceId: String(licenceId),
      },
      success_url: `${ENV.appBaseUrl}/course-pass/claim?extension_session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${ENV.appBaseUrl}/course-pass/claim`,
    });
    checkoutSessionId = session.id;
    const updateResult = await db.update(teamFlexExtensions).set({ stripeCheckoutSessionId: session.id })
      .where(and(eq(teamFlexExtensions.id, extensionId), eq(teamFlexExtensions.status, "pending")));
    if (Number((updateResult as any)[0]?.affectedRows ?? (updateResult as any).affectedRows ?? 0) !== 1) {
      throw new Error("Retake Extension checkout state changed before the Stripe session could be recorded");
    }
    if (!session.url) throw new Error("Stripe did not provide a Checkout URL");
    return { url: session.url, extensionId };
  } catch (error) {
    let sessionExpired = !checkoutSessionId;
    if (checkoutSessionId) {
      try {
        await stripe.checkout.sessions.expire(checkoutSessionId);
        sessionExpired = true;
      } catch {
        sessionExpired = false;
      }
    }
    if (sessionExpired) {
      await db.update(teamFlexExtensions).set({ status: "checkout_failed", stripeCheckoutSessionId: null })
        .where(and(eq(teamFlexExtensions.id, extensionId), eq(teamFlexExtensions.status, "pending")));
    }
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Retake Extension checkout is temporarily unavailable. Please try again shortly." });
  }
}

/**
 * Releases an abandoned, unpaid Checkout Session so the licence holder can
 * start a fresh Retake Extension checkout. Stripe calls this only after the
 * session has expired. The exact session ID prevents an older webhook from
 * changing a newer attempt.
 */
export async function releaseExpiredRetakeExtensionCheckout(
  extensionId: number,
  stripeCheckoutSessionId: string,
): Promise<{ released: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT id FROM team_flex_extensions WHERE id = ${extensionId} FOR UPDATE`);
    const [extension] = await tx.select().from(teamFlexExtensions)
      .where(eq(teamFlexExtensions.id, extensionId))
      .limit(1);
    if (!extension || extension.status !== "pending" || extension.stripeCheckoutSessionId !== stripeCheckoutSessionId) {
      return { released: false };
    }
    await tx.update(teamFlexExtensions).set({
      status: "checkout_expired",
      stripeCheckoutSessionId: null,
    }).where(eq(teamFlexExtensions.id, extension.id));
    return { released: true };
  });
}

export async function fulfilRetakeExtension(
  extensionId: number,
  checkout: { id: string; paymentIntentId: string | null; amountSubtotal: number; currency: string; paymentStatus: string },
  paidAt: Date,
): Promise<{ success: boolean; alreadyApplied?: boolean; error?: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (checkout.paymentStatus !== "paid" && checkout.paymentStatus !== "no_payment_required") return { success: false, error: "Checkout Session is not paid" };

  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT id FROM team_flex_extensions WHERE id = ${extensionId} FOR UPDATE`);
    const [extension] = await tx.select().from(teamFlexExtensions).where(eq(teamFlexExtensions.id, extensionId)).limit(1);
    if (!extension) return { success: false, error: "Retake Extension record not found" };
    if (extension.status === "applied") return { success: true, alreadyApplied: true };
    if (extension.status !== "pending" || extension.stripeCheckoutSessionId !== checkout.id) return { success: false, error: "Retake Extension checkout does not match the pending record" };
    if (checkout.currency.toLowerCase() !== "cad" || checkout.amountSubtotal !== extension.priceCents) return { success: false, error: "Retake Extension payment does not match the expected amount" };

    await tx.execute(sql`SELECT id FROM team_flex_licences WHERE id = ${extension.licenceId} FOR UPDATE`);
    const [licence] = await tx.select().from(teamFlexLicences).where(eq(teamFlexLicences.id, extension.licenceId)).limit(1);
    if (!licence || licence.extensionApplied) return { success: false, error: "Course Pass extension state has changed" };
    const window = deriveExtensionWindow(licence, paidAt);
    if (!window.eligible || !window.extensionStartsAt || !window.extensionEndsAt || !window.reportingEndsAt) return { success: false, error: window.reason ?? "Course Pass is no longer eligible" };

    await tx.update(teamFlexLicences).set({
      extensionApplied: true,
      originalAccessEndsAt: licence.originalAccessEndsAt ?? licence.accessEndsAt,
      extensionStartsAt: window.extensionStartsAt,
      accessEndsAt: window.extensionEndsAt,
      reportingEndsAt: window.reportingEndsAt,
      status: "active",
    }).where(eq(teamFlexLicences.id, licence.id));
    await tx.update(teamFlexExtensions).set({
      stripePaymentIntentId: checkout.paymentIntentId,
      status: "applied",
      appliedAt: paidAt,
      newAccessEndsAt: window.extensionEndsAt,
    }).where(eq(teamFlexExtensions.id, extension.id));
    return { success: true };
  });
}
