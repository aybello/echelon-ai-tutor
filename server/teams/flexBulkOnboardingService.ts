import crypto from "crypto";
import { and, asc, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { organizations, teamFlexLicences, type TeamFlexLicence } from "../../drizzle/schema";
import { resolveCourseKey } from "../../shared/courseRegistry";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { sendCoursePassInvitationEmail } from "../email";

export const MAX_BULK_ONBOARDING_ROWS = 250;

export interface FlexBulkRowInput {
  clientRowId: string;
  operatorEmail: string;
  courseKey: string;
}

export type FlexBulkRowErrorCode =
  | "invalid_email"
  | "invalid_course"
  | "duplicate_row"
  | "duplicate_assignment"
  | "no_inventory";

export interface FlexBulkPreviewRow {
  clientRowId: string;
  operatorEmail: string;
  courseKey: string;
  valid: boolean;
  licenceId: number | null;
  activationDeadline: Date | null;
  errorCode: FlexBulkRowErrorCode | null;
  error: string | null;
}

export interface FlexBulkInventorySummary {
  courseKey: string;
  courseName: string;
  total: number;
  unused: number;
}

export interface FlexBulkPreview {
  valid: boolean;
  rows: FlexBulkPreviewRow[];
  inventory: FlexBulkInventorySummary[];
  requested: number;
  available: number;
}

export interface FlexBulkSendResult {
  clientRowId: string;
  operatorEmail: string;
  courseKey: string;
  licenceId: number | null;
  invitationSent: boolean;
  error: string | null;
}

interface PreparedRow extends FlexBulkRowInput {
  operatorEmail: string;
  courseKey: string;
}

interface PlannedAssignment {
  row: PreparedRow;
  licence: TeamFlexLicence;
}

interface FlexBulkPlan {
  preview: FlexBulkPreview;
  assignments: PlannedAssignment[];
}

interface ReservedAssignment extends PlannedAssignment {
  rawToken: string;
  tokenHash: string;
}

function canonicalCourseKey(courseKey: string): string | null {
  return resolveCourseKey(courseKey.trim())?.courseKey ?? null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 320;
}

function hashInvitationToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function activeAssignmentKey(licence: TeamFlexLicence): string | null {
  if (!licence.invitedEmail || ["unused", "expired", "revoked"].includes(licence.status)) return null;
  const courseKey = canonicalCourseKey(licence.courseKey);
  if (!courseKey) return null;
  return `${licence.invitedEmail.toLowerCase().trim()}|${courseKey}`;
}

export function planFlexBulkOnboarding(
  inputRows: FlexBulkRowInput[],
  licences: TeamFlexLicence[],
  now = new Date(),
): FlexBulkPlan {
  const inventoryByCourse = new Map<string, TeamFlexLicence[]>();
  const summaryByCourse = new Map<string, FlexBulkInventorySummary>();

  for (const licence of licences) {
    const courseKey = canonicalCourseKey(licence.courseKey);
    if (!courseKey) continue;
    const courseName = resolveCourseKey(courseKey)?.displayName ?? courseKey;
    const summary = summaryByCourse.get(courseKey) ?? { courseKey, courseName, total: 0, unused: 0 };
    summary.total += 1;
    if (licence.status === "unused" && licence.activationDeadline >= now) {
      summary.unused += 1;
      const available = inventoryByCourse.get(courseKey) ?? [];
      available.push(licence);
      inventoryByCourse.set(courseKey, available);
    }
    summaryByCourse.set(courseKey, summary);
  }

  for (const available of Array.from(inventoryByCourse.values())) {
    available.sort((a, b) => {
      const deadlineDelta = a.activationDeadline.getTime() - b.activationDeadline.getTime();
      return deadlineDelta || a.id - b.id;
    });
  }

  const existingAssignments = new Set(
    licences.map(activeAssignmentKey).filter((key): key is string => key !== null),
  );
  const seenRows = new Set<string>();
  const previewRows: FlexBulkPreviewRow[] = [];
  const assignments: PlannedAssignment[] = [];

  for (const rawRow of inputRows) {
    const operatorEmail = rawRow.operatorEmail.toLowerCase().trim();
    const courseKey = canonicalCourseKey(rawRow.courseKey);
    const base = {
      clientRowId: rawRow.clientRowId,
      operatorEmail,
      courseKey: courseKey ?? rawRow.courseKey.trim(),
    };

    if (!isValidEmail(operatorEmail)) {
      previewRows.push({ ...base, valid: false, licenceId: null, activationDeadline: null, errorCode: "invalid_email", error: "Enter a valid operator email." });
      continue;
    }
    if (!courseKey) {
      previewRows.push({ ...base, valid: false, licenceId: null, activationDeadline: null, errorCode: "invalid_course", error: "Select a valid Course Pass course." });
      continue;
    }

    const assignmentKey = `${operatorEmail}|${courseKey}`;
    if (seenRows.has(assignmentKey)) {
      previewRows.push({ ...base, valid: false, licenceId: null, activationDeadline: null, errorCode: "duplicate_row", error: "This operator and course appear more than once in the cohort." });
      continue;
    }
    seenRows.add(assignmentKey);

    if (existingAssignments.has(assignmentKey)) {
      previewRows.push({ ...base, valid: false, licenceId: null, activationDeadline: null, errorCode: "duplicate_assignment", error: "This operator already has this Course Pass assigned or invited." });
      continue;
    }

    const available = inventoryByCourse.get(courseKey) ?? [];
    const licence = available.shift();
    if (!licence) {
      previewRows.push({ ...base, valid: false, licenceId: null, activationDeadline: null, errorCode: "no_inventory", error: "No unused paid licence is available for this course." });
      continue;
    }

    const row: PreparedRow = { ...rawRow, operatorEmail, courseKey };
    assignments.push({ row, licence });
    previewRows.push({ ...base, valid: true, licenceId: licence.id, activationDeadline: licence.activationDeadline, errorCode: null, error: null });
  }

  const inventory = Array.from(summaryByCourse.values()).sort((a, b) => a.courseName.localeCompare(b.courseName));
  const available = inventory.reduce((sum, item) => sum + item.unused, 0);
  return {
    preview: {
      valid: inputRows.length > 0 && previewRows.every((row) => row.valid),
      rows: previewRows,
      inventory,
      requested: inputRows.length,
      available,
    },
    assignments,
  };
}

export async function previewFlexBulkOnboarding(
  orgId: number,
  rows: FlexBulkRowInput[],
): Promise<FlexBulkPreview> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const licences = await db
    .select()
    .from(teamFlexLicences)
    .where(eq(teamFlexLicences.organizationId, orgId))
    .orderBy(asc(teamFlexLicences.activationDeadline), asc(teamFlexLicences.id));
  return planFlexBulkOnboarding(rows, licences).preview;
}

async function sendReservedInvitation(
  orgName: string,
  reservation: ReservedAssignment,
): Promise<FlexBulkSendResult> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const course = resolveCourseKey(reservation.row.courseKey);
  const claimUrl = `${ENV.appBaseUrl}/course-pass/claim?token=${encodeURIComponent(reservation.rawToken)}`;

  try {
    await sendCoursePassInvitationEmail({
      email: reservation.row.operatorEmail,
      orgName,
      courseName: course?.displayName ?? reservation.row.courseKey,
      termMonths: reservation.licence.termMonths,
      claimUrl,
      activationDeadline: reservation.licence.activationDeadline,
    });
    return {
      clientRowId: reservation.row.clientRowId,
      operatorEmail: reservation.row.operatorEmail,
      courseKey: reservation.row.courseKey,
      licenceId: reservation.licence.id,
      invitationSent: true,
      error: null,
    };
  } catch {
    await db
      .update(teamFlexLicences)
      .set({ status: "unused", invitedEmail: null, invitationToken: null, invitedAt: null })
      .where(and(
        eq(teamFlexLicences.id, reservation.licence.id),
        eq(teamFlexLicences.status, "invited"),
        eq(teamFlexLicences.invitationToken, reservation.tokenHash),
      ));
    return {
      clientRowId: reservation.row.clientRowId,
      operatorEmail: reservation.row.operatorEmail,
      courseKey: reservation.row.courseKey,
      licenceId: reservation.licence.id,
      invitationSent: false,
      error: "Email delivery failed. The licence was returned to inventory and this row can be retried.",
    };
  }
}

export async function bulkInviteFlexOperators(
  orgId: number,
  rows: FlexBulkRowInput[],
): Promise<{ preview: FlexBulkPreview; results: FlexBulkSendResult[] }> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const transactionResult = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT id FROM team_flex_licences WHERE organizationId = ${orgId} FOR UPDATE`);
    const licences = await tx
      .select()
      .from(teamFlexLicences)
      .where(eq(teamFlexLicences.organizationId, orgId))
      .orderBy(asc(teamFlexLicences.activationDeadline), asc(teamFlexLicences.id));
    const plan = planFlexBulkOnboarding(rows, licences);
    if (!plan.preview.valid) return { preview: plan.preview, reservations: [] as ReservedAssignment[] };

    const invitedAt = new Date();
    const reservations: ReservedAssignment[] = [];
    for (const assignment of plan.assignments) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = hashInvitationToken(rawToken);
      await tx
        .update(teamFlexLicences)
        .set({
          status: "invited",
          courseKey: assignment.row.courseKey,
          invitedEmail: assignment.row.operatorEmail,
          invitationToken: tokenHash,
          invitedAt,
        })
        .where(and(
          eq(teamFlexLicences.id, assignment.licence.id),
          eq(teamFlexLicences.organizationId, orgId),
          eq(teamFlexLicences.status, "unused"),
        ));
      reservations.push({ ...assignment, rawToken, tokenHash });
    }
    return { preview: plan.preview, reservations };
  });

  if (!transactionResult.preview.valid) return { preview: transactionResult.preview, results: [] };

  const [org] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  const results: FlexBulkSendResult[] = [];
  for (let index = 0; index < transactionResult.reservations.length; index += 4) {
    const chunk = transactionResult.reservations.slice(index, index + 4);
    results.push(...await Promise.all(chunk.map((reservation) => sendReservedInvitation(org?.name ?? "Your organization", reservation))));
  }
  return { preview: transactionResult.preview, results };
}
