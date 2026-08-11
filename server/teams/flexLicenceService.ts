/**
 * Teams Flex Licence Inventory Service
 * Handles: invite, cancel invitation, claim (operator signs in), assign, activate
 */
import { eq, and, or } from "drizzle-orm";
import { getDb } from "../db";
import { organizations, teamFlexLicences } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { ENV } from "../_core/env";
import { sendCoursePassInvitationEmail } from "../email";
import { resolveCourseKey } from "../../shared/courseRegistry";

function hashInvitationToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function addUtcCalendarMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const originalDay = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(originalDay, lastDay));
  return result;
}

// ─── Invite ───────────────────────────────────────────────────────────────────

export async function inviteOperatorToLicence(
  licenceId: number,
  operatorEmail: string,
  orgId: number,
): Promise<{ invitationSent: true }> {
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
  const invitationTokenHash = hashInvitationToken(invitationToken);
  const now = new Date();
  const normalizedEmail = operatorEmail.toLowerCase().trim();

  await db.update(teamFlexLicences)
    .set({
      status: "invited",
      invitedEmail: normalizedEmail,
      invitationToken: invitationTokenHash,
      invitedAt: now,
    })
    .where(eq(teamFlexLicences.id, licenceId));

  const [org] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  const course = resolveCourseKey(licence.courseKey);
  const claimUrl = `${ENV.appBaseUrl}/course-pass/claim?token=${encodeURIComponent(invitationToken)}`;

  try {
    await sendCoursePassInvitationEmail({
      email: normalizedEmail,
      orgName: org?.name ?? "Your organization",
      courseName: course?.displayName ?? licence.courseKey,
      termMonths: licence.termMonths,
      claimUrl,
      activationDeadline: licence.activationDeadline,
    });
  } catch (error) {
    await db.update(teamFlexLicences)
      .set({
        status: "unused",
        invitedEmail: null,
        invitationToken: null,
        invitedAt: null,
      })
      .where(and(
        eq(teamFlexLicences.id, licenceId),
        eq(teamFlexLicences.status, "invited"),
        eq(teamFlexLicences.invitationToken, invitationTokenHash),
      ));
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "The invitation email could not be sent. The licence was returned to inventory.",
      cause: error,
    });
  }

  return { invitationSent: true };
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
      invitedAt: null,
    })
    .where(eq(teamFlexLicences.id, licenceId));
}

// ─── Claim (operator signs in and claims invitation) ──────────────────────────

export async function claimFlexLicence(
  invitationToken: string,
  operatorEmail: string,
  operatorUserId: number | null,
): Promise<{ licenceId: number; courseKey: string }> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const normalizedEmail = operatorEmail.toLowerCase().trim();
  const invitationTokenHash = hashInvitationToken(invitationToken);
  const [licence] = await db
    .select()
    .from(teamFlexLicences)
    .where(and(
      eq(teamFlexLicences.invitationToken, invitationTokenHash),
      eq(teamFlexLicences.status, "invited"),
    ))
    .limit(1);

  if (!licence) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Invalid or expired invitation" });
  }

  if (licence.invitedEmail !== normalizedEmail) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Sign in with the email address that received this invitation." });
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
      assignedAt: new Date(),
    })
    .where(and(
      eq(teamFlexLicences.id, licence.id),
      eq(teamFlexLicences.status, "invited"),
      eq(teamFlexLicences.invitationToken, invitationTokenHash),
    ));

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
  operatorEmail: string,
  operatorUserId: number | null,
): Promise<{ licenceId: number; courseKey: string; startsAt: Date; accessEndsAt: Date; reportingEndsAt: Date }> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const normalizedEmail = operatorEmail.toLowerCase().trim();
  const identityMatch = operatorUserId
    ? or(
        eq(teamFlexLicences.operatorUserId, operatorUserId),
        eq(teamFlexLicences.invitedEmail, normalizedEmail),
      )
    : eq(teamFlexLicences.invitedEmail, normalizedEmail);

  const [licence] = await db
    .select()
    .from(teamFlexLicences)
    .where(and(
      eq(teamFlexLicences.id, licenceId),
      identityMatch,
    ))
    .limit(1);

  if (!licence) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Course Pass not found or not assigned to you" });
  }

  // First-write-wins: if already activated, return existing dates
  if (licence.status === "active" && licence.activatedAt && licence.startsAt && licence.accessEndsAt && licence.reportingEndsAt) {
    return {
      licenceId: licence.id,
      courseKey: licence.courseKey,
      startsAt: licence.startsAt,
      accessEndsAt: licence.accessEndsAt,
      reportingEndsAt: licence.reportingEndsAt,
    };
  }

  if (licence.status !== "assigned") {
    throw new TRPCError({ code: "BAD_REQUEST", message: `This Course Pass cannot be activated while it is ${licence.status}.` });
  }

  if (new Date() > licence.activationDeadline) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "This Course Pass passed its activation deadline. Contact your manager." });
  }

  const now = new Date();
  const accessEndsAt = addUtcCalendarMonths(now, licence.termMonths);

  const reportingEndsAt = new Date(accessEndsAt);
  reportingEndsAt.setDate(reportingEndsAt.getDate() + 30);

  await db.update(teamFlexLicences)
    .set({
      status: "active",
      activatedAt: now,
      startsAt: now,
      accessEndsAt,
      originalAccessEndsAt: accessEndsAt,
      reportingEndsAt,
      operatorUserId: operatorUserId ?? licence.operatorUserId,
    })
    .where(and(
      eq(teamFlexLicences.id, licenceId),
      eq(teamFlexLicences.status, "assigned"), // CAS guard: first-write-wins
    ));

  const [activated] = await db
    .select()
    .from(teamFlexLicences)
    .where(and(eq(teamFlexLicences.id, licenceId), identityMatch))
    .limit(1);
  if (!activated?.startsAt || !activated.accessEndsAt || !activated.reportingEndsAt) {
    throw new TRPCError({ code: "CONFLICT", message: "Course activation did not complete. Please try again." });
  }

  return {
    licenceId: activated.id,
    courseKey: activated.courseKey,
    startsAt: activated.startsAt,
    accessEndsAt: activated.accessEndsAt,
    reportingEndsAt: activated.reportingEndsAt,
  };
}

export async function getFlexInvitation(invitationToken: string) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const [licence] = await db
    .select()
    .from(teamFlexLicences)
    .where(and(
      eq(teamFlexLicences.invitationToken, hashInvitationToken(invitationToken)),
      eq(teamFlexLicences.status, "invited"),
    ))
    .limit(1);

  if (!licence || new Date() > licence.activationDeadline) {
    throw new TRPCError({ code: "NOT_FOUND", message: "This invitation is invalid or has expired." });
  }

  const course = resolveCourseKey(licence.courseKey);
  const email = licence.invitedEmail ?? "";
  const [local, domain] = email.split("@");
  const maskedEmail = domain ? `${local.slice(0, 2)}***@${domain}` : "the invited email";

  return {
    licenceId: licence.id,
    courseKey: licence.courseKey,
    courseName: course?.displayName ?? licence.courseKey,
    quizPath: course?.quizPath ?? "/quiz",
    mockExamPath: course?.mockExamPath ?? "/quiz",
    termMonths: licence.termMonths,
    activationDeadline: licence.activationDeadline,
    maskedEmail,
  };
}

export async function listOperatorFlexLicences(operatorEmail: string, operatorUserId: number | null) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const normalizedEmail = operatorEmail.toLowerCase().trim();
  const identityMatch = operatorUserId
    ? or(
        eq(teamFlexLicences.operatorUserId, operatorUserId),
        eq(teamFlexLicences.invitedEmail, normalizedEmail),
      )
    : eq(teamFlexLicences.invitedEmail, normalizedEmail);

  const rows = await db.select().from(teamFlexLicences).where(identityMatch);
  return rows.map((licence) => {
    const course = resolveCourseKey(licence.courseKey);
    return {
      ...licence,
      courseName: course?.displayName ?? licence.courseKey,
      quizPath: course?.quizPath ?? "/quiz",
      mockExamPath: course?.mockExamPath ?? "/quiz",
    };
  });
}
