/**
 * Teams Flex Licence Inventory Service
 * Handles: invite, cancel invitation, claim (operator signs in), assign, activate
 */
import { eq, and, isNull } from "drizzle-orm";
import { getDb } from "../db";
import { teamFlexLicences } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";

// ─── Invite ───────────────────────────────────────────────────────────────────

export async function inviteOperatorToLicence(
  licenceId: number,
  operatorEmail: string,
  managerUserId: number,
  orgId: number,
): Promise<{ invitationToken: string }> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const [licence] = await db
    .select()
    .from(teamFlexLicences)
    .where(and(
      eq(teamFlexLicences.id, licenceId),
      eq(teamFlexLicences.organizationId, orgId),
      eq(teamFlexLicences.status, "unused"),
    ))
    .limit(1);

  if (!licence) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Licence not found or not in unused status" });
  }

  const invitationToken = crypto.randomBytes(32).toString("hex");
  const now = new Date();

  await db.update(teamFlexLicences)
    .set({
      status: "invited",
      invitedEmail: operatorEmail.toLowerCase().trim(),
      invitationToken,
    })
    .where(eq(teamFlexLicences.id, licenceId));

  return { invitationToken };
}

// ─── Cancel Invitation ────────────────────────────────────────────────────────

export async function cancelFlexInvitation(
  licenceId: number,
  orgId: number,
): Promise<void> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const [licence] = await db
    .select()
    .from(teamFlexLicences)
    .where(and(
      eq(teamFlexLicences.id, licenceId),
      eq(teamFlexLicences.organizationId, orgId),
      eq(teamFlexLicences.status, "invited"),
    ))
    .limit(1);

  if (!licence) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Licence not found or not in invited status" });
  }

  // Return to unused — NOT revocation
  await db.update(teamFlexLicences)
    .set({
      status: "unused",
      invitedEmail: null,
      invitationToken: null,
    })
    .where(eq(teamFlexLicences.id, licenceId));
}

// ─── Claim (operator signs in and claims invitation) ──────────────────────────

export async function claimFlexLicence(
  invitationToken: string,
  operatorUserId: number,
): Promise<{ licenceId: number; courseKey: string }> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const [licence] = await db
    .select()
    .from(teamFlexLicences)
    .where(and(
      eq(teamFlexLicences.invitationToken, invitationToken),
      eq(teamFlexLicences.status, "invited"),
    ))
    .limit(1);

  if (!licence) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Invalid or expired invitation" });
  }

  // Check activation deadline hasn't passed
  if (new Date() > licence.activationDeadline) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "This licence has expired. Contact your manager." });
  }

  await db.update(teamFlexLicences)
    .set({
      status: "assigned",
      operatorUserId,
      invitationToken: null, // consumed
    })
    .where(eq(teamFlexLicences.id, licence.id));

  return { licenceId: licence.id, courseKey: licence.courseKey };
}

// ─── Assign (manager directly assigns to a known user) ────────────────────────

export async function assignFlexLicence(
  licenceId: number,
  operatorUserId: number,
  orgId: number,
): Promise<void> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const [licence] = await db
    .select()
    .from(teamFlexLicences)
    .where(and(
      eq(teamFlexLicences.id, licenceId),
      eq(teamFlexLicences.organizationId, orgId),
    ))
    .limit(1);

  if (!licence) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Licence not found" });
  }

  if (licence.status !== "unused" && licence.status !== "invited") {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Cannot assign licence in '${licence.status}' status` });
  }

  await db.update(teamFlexLicences)
    .set({
      status: "assigned",
      operatorUserId,
      invitedEmail: null,
      invitationToken: null,
    })
    .where(eq(teamFlexLicences.id, licenceId));
}

// ─── Activate (explicit, first-write-wins) ────────────────────────────────────

// ─── Change Course (same-band only, before activation) ────────────────────────

export async function changeFlexLicenceCourse(
  licenceId: number,
  newCourseKey: string,
  orgId: number,
): Promise<void> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const [licence] = await db
    .select()
    .from(teamFlexLicences)
    .where(and(
      eq(teamFlexLicences.id, licenceId),
      eq(teamFlexLicences.organizationId, orgId),
    ))
    .limit(1);

  if (!licence) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Licence not found" });
  }

  // Only allowed before activation
  if (licence.activatedAt) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot change course after activation" });
  }

  // Only allowed in pre-activation states
  if (!["unused", "invited", "assigned"].includes(licence.status)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Cannot change course in '${licence.status}' status` });
  }

  // Same-band validation: import pricing helper
  const { getCourseKeyPricingBand } = await import("./teamFlexPricing");
  const currentBand = getCourseKeyPricingBand(licence.courseKey);
  const newBand = getCourseKeyPricingBand(newCourseKey);

  if (currentBand.examFamily !== newBand.examFamily || currentBand.pricingBand !== newBand.pricingBand) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Cross-band course changes require manual support. Contact support@echeloninstitute.ca for assistance.",
    });
  }

  await db.update(teamFlexLicences)
    .set({ courseKey: newCourseKey })
    .where(eq(teamFlexLicences.id, licenceId));
}

export async function activateFlexLicence(
  licenceId: number,
  operatorUserId: number,
): Promise<{ accessEndsAt: Date }> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const [licence] = await db
    .select()
    .from(teamFlexLicences)
    .where(and(
      eq(teamFlexLicences.id, licenceId),
      eq(teamFlexLicences.operatorUserId, operatorUserId),
      eq(teamFlexLicences.status, "assigned"),
    ))
    .limit(1);

  if (!licence) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Licence not found or not assigned to you" });
  }

  // First-write-wins: if already activated, return existing dates
  if (licence.activatedAt) {
    return { accessEndsAt: licence.accessEndsAt! };
  }

  const now = new Date();
  const accessEndsAt = new Date(now);
  accessEndsAt.setMonth(accessEndsAt.getMonth() + licence.termMonths);

  const reportingEndsAt = new Date(accessEndsAt);
  reportingEndsAt.setDate(reportingEndsAt.getDate() + 30);

  await db.update(teamFlexLicences)
    .set({
      status: "active",
      activatedAt: now,
      accessEndsAt,
      originalAccessEndsAt: accessEndsAt,
    })
    .where(and(
      eq(teamFlexLicences.id, licenceId),
      eq(teamFlexLicences.status, "assigned"), // CAS guard: first-write-wins
    ));

  return { accessEndsAt };
}
