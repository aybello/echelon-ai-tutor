/**
 * Teams Flex Retake Extension Service
 * Allows one 90-day extension per licence.
 * Extension start date depends on whether licence is still active or in reporting window.
 */
import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import { teamFlexLicences, teamFlexExtensions } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { getRetakeExtensionPrice, getCourseKeyPricingBand } from "./teamFlexPricing";
import { stripe } from "../stripe/stripe";

const EXTENSION_DAYS = 90;
const REPORTING_WINDOW_DAYS = 30;

export interface ExtensionEligibility {
  eligible: boolean;
  reason?: string;
  priceCents: number;
  licenceId: number;
  courseKey: string;
}

export async function checkExtensionEligibility(
  licenceId: number,
  operatorUserId: number,
): Promise<ExtensionEligibility> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const [licence] = await db
    .select()
    .from(teamFlexLicences)
    .where(and(
      eq(teamFlexLicences.id, licenceId),
      eq(teamFlexLicences.operatorUserId, operatorUserId),
    ))
    .limit(1);

  if (!licence) {
    return { eligible: false, reason: "Licence not found", priceCents: 0, licenceId, courseKey: "" };
  }

  // Already extended
  if (licence.extensionApplied) {
    return { eligible: false, reason: "Extension already applied to this licence", priceCents: 0, licenceId, courseKey: licence.courseKey };
  }

  // Must be active or expired within reporting window
  const now = new Date();
  if (licence.status === "active") {
    // OK — extension starts at originalAccessEndsAt
  } else if (licence.status === "expired" && licence.reportingEndsAt && now <= licence.reportingEndsAt) {
    // OK — in reporting window, extension starts immediately
  } else {
    return { eligible: false, reason: "Licence must be active or within 30-day reporting window", priceCents: 0, licenceId, courseKey: licence.courseKey };
  }

  const { examFamily, pricingBand } = getCourseKeyPricingBand(licence.courseKey);
  const priceCents = getRetakeExtensionPrice(examFamily, pricingBand);

  return { eligible: true, priceCents, licenceId, courseKey: licence.courseKey };
}

export async function applyExtension(
  licenceId: number,
  paymentTimestamp: Date,
): Promise<{ newAccessEndsAt: Date }> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const [licence] = await db
    .select()
    .from(teamFlexLicences)
    .where(eq(teamFlexLicences.id, licenceId))
    .limit(1);

  if (!licence) throw new TRPCError({ code: "NOT_FOUND", message: "Licence not found" });
  if (licence.extensionApplied) throw new TRPCError({ code: "BAD_REQUEST", message: "Extension already applied" });

  // Determine extension start date per spec
  const extensionStartsAt = licence.status === "active"
    ? licence.originalAccessEndsAt! // begins at original expiry
    : paymentTimestamp;             // begins now (purchased after expiry)

  const extensionEndsAt = new Date(extensionStartsAt);
  extensionEndsAt.setDate(extensionEndsAt.getDate() + EXTENSION_DAYS);

  const newReportingEndsAt = new Date(extensionEndsAt);
  newReportingEndsAt.setDate(newReportingEndsAt.getDate() + REPORTING_WINDOW_DAYS);

  // Update licence — originalAccessEndsAt is NEVER overwritten
  await db.update(teamFlexLicences)
    .set({
      extensionApplied: true,
      extensionStartsAt,
      accessEndsAt: extensionEndsAt,
      reportingEndsAt: newReportingEndsAt,
      status: "active", // restore if expired
    })
    .where(eq(teamFlexLicences.id, licenceId));

  return { newAccessEndsAt: extensionEndsAt };
}
