/**
 * Facilitated training-record router.
 *
 * It keeps supervisor-entered OJT records distinct from Echelon Institute
 * practice telemetry. The latter is returned only as supporting study activity;
 * it is never converted into hours or presented as automatically creditable.
 */
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import {
  onTheJobTrainingRecords,
  organizationMembers,
  organizations,
  questionAttempts,
} from "../../drizzle/schema";
import { courseKeyToLabel } from "../../shared/courseRegistry";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { isValidReportRange, isWithinDailyOjtLimit } from "../trainingRecordPolicy";
import { resolveOrgManager } from "./orgRouter";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date.");
const reportRange = z.object({ startDate: isoDate, endDate: isoDate });
const trainingRecordInput = z.object({
  memberId: z.number().int().positive(),
  sessionDate: isoDate,
  topics: z.string().trim().min(4).max(2000),
  learningObjectives: z.string().trim().min(8).max(4000),
  providerName: z.string().trim().min(2).max(200),
  providerPhone: z.string().trim().max(64).optional(),
  durationHours: z.number().min(0.25).max(7),
  structuredLearningConfirmed: z.literal(true),
});

function toStartOfDay(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function toEndOfDay(value: string) {
  return new Date(`${value}T23:59:59.999Z`);
}

function toSessionDate(value: string) {
  return new Date(`${value}T12:00:00.000Z`);
}

function validateRange(input: z.infer<typeof reportRange>) {
  const start = toStartOfDay(input.startDate);
  const end = toEndOfDay(input.endDate);
  if (start.getTime() > end.getTime()) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "The report start date must be on or before the end date." });
  }
  if (!isValidReportRange(start, end)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a report range of three years or less." });
  }
  return { start, end };
}

function resolveLearnerEmail(ctx: { user: { id: number; email?: string | null } | null; studentEmail?: string | null }) {
  const email = ctx.user?.email ?? ctx.studentEmail ?? null;
  if (!email) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Please sign in to view your training record." });
  }
  return email.trim().toLowerCase();
}

async function getScopedMember(orgId: number, memberId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const member = await db
    .select()
    .from(organizationMembers)
    .where(and(
      eq(organizationMembers.id, memberId),
      eq(organizationMembers.orgId, orgId),
      eq(organizationMembers.role, "operator"),
    ))
    .limit(1)
    .then(rows => rows[0]);
  if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "Operator not found in your organization." });
  return { db, member };
}

async function getReportData(input: {
  orgId: number;
  memberId: number;
  startDate: string;
  endDate: string;
}) {
  const { start, end } = validateRange(input);
  const { db, member } = await getScopedMember(input.orgId, input.memberId);
  const org = await db.select().from(organizations).where(eq(organizations.id, input.orgId)).limit(1).then(rows => rows[0]);
  if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found." });

  const [recordRows, activityRows] = await Promise.all([
    db.select()
      .from(onTheJobTrainingRecords)
      .where(and(
        eq(onTheJobTrainingRecords.orgId, input.orgId),
        eq(onTheJobTrainingRecords.organizationMemberId, input.memberId),
        gte(onTheJobTrainingRecords.sessionDate, start),
        lte(onTheJobTrainingRecords.sessionDate, end),
      ))
      .orderBy(desc(onTheJobTrainingRecords.sessionDate), desc(onTheJobTrainingRecords.id)),
    db.select({
      day: sql<string>`DATE_FORMAT(${questionAttempts.createdAt}, '%Y-%m-%d')`,
      courseKey: questionAttempts.courseKey,
      questionCount: sql<number>`COUNT(*)`,
      topics: sql<string | null>`GROUP_CONCAT(DISTINCT ${questionAttempts.topic} ORDER BY ${questionAttempts.topic} SEPARATOR ' | ')`,
    })
      .from(questionAttempts)
      .where(and(
        eq(questionAttempts.orgId, input.orgId),
        eq(questionAttempts.organizationMemberId, input.memberId),
        gte(questionAttempts.createdAt, start),
        lte(questionAttempts.createdAt, end),
      ))
      .groupBy(sql`DATE(${questionAttempts.createdAt})`, questionAttempts.courseKey)
      .orderBy(desc(sql`DATE(${questionAttempts.createdAt})`)),
  ]);

  const records = recordRows.map(row => ({
    id: row.id,
    sessionDate: row.sessionDate,
    topics: row.topics,
    learningObjectives: row.learningObjectives,
    providerName: row.providerName,
    providerPhone: row.providerPhone,
    durationHours: Number(row.durationHours),
    structuredLearningConfirmed: row.structuredLearningConfirmed,
    courseKey: row.courseKey,
    courseLabel: row.courseKey ? courseKeyToLabel(row.courseKey, org.province) : "Organisation training",
    recordedByEmail: row.recordedByEmail,
  }));
  const activity = activityRows.map(row => ({
    date: row.day,
    courseKey: row.courseKey,
    courseLabel: row.courseKey ? courseKeyToLabel(row.courseKey, org.province) : "Echelon Institute practice",
    questionCount: Number(row.questionCount),
    topics: row.topics ? row.topics.split(" | ") : [],
  }));
  const totalHours = records.reduce((total, row) => total + row.durationHours, 0);

  return {
    organization: { id: org.id, name: org.name, province: org.province },
    operator: { id: member.id, name: member.name, email: member.email, status: member.status, courseKey: member.courseKey },
    range: { startDate: input.startDate, endDate: input.endDate },
    records,
    totalHours: Math.round(totalHours * 100) / 100,
    activity,
  };
}

export const trainingRecordsRouter = router({
  listManagerOperators: publicProcedure.query(async ({ ctx }) => {
    const { orgId } = await resolveOrgManager(ctx);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const rows = await db.select({
      id: organizationMembers.id,
      name: organizationMembers.name,
      email: organizationMembers.email,
      status: organizationMembers.status,
      courseKey: organizationMembers.courseKey,
    })
      .from(organizationMembers)
      .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.role, "operator")))
      .orderBy(organizationMembers.name, organizationMembers.email);
    return { operators: rows };
  }),

  managerReport: publicProcedure
    .input(reportRange.extend({ memberId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const { orgId } = await resolveOrgManager(ctx);
      return getReportData({ orgId, ...input });
    }),

  myReport: publicProcedure
    .input(reportRange)
    .query(async ({ ctx, input }) => {
      const email = resolveLearnerEmail(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const member = await db.select({ id: organizationMembers.id, orgId: organizationMembers.orgId })
        .from(organizationMembers)
        .where(and(
          eq(organizationMembers.email, email),
          eq(organizationMembers.role, "operator"),
          eq(organizationMembers.status, "assigned"),
        ))
        .orderBy(organizationMembers.id)
        .limit(1)
        .then(rows => rows[0]);
      if (!member) {
        throw new TRPCError({ code: "FORBIDDEN", message: "A team training record is not available for this account." });
      }
      return getReportData({ orgId: member.orgId, memberId: member.id, ...input });
    }),

  create: publicProcedure
    .input(trainingRecordInput)
    .mutation(async ({ ctx, input }) => {
      const { orgId, managerEmail } = await resolveOrgManager(ctx);
      const { db, member } = await getScopedMember(orgId, input.memberId);
      if (member.status !== "assigned") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Training records can only be added for an assigned operator." });
      }
      const sessionDate = toSessionDate(input.sessionDate);
      const existingRows = await db.select({
        total: sql<string>`COALESCE(SUM(${onTheJobTrainingRecords.durationHours}), 0)`,
      })
        .from(onTheJobTrainingRecords)
        .where(and(
          eq(onTheJobTrainingRecords.orgId, orgId),
          eq(onTheJobTrainingRecords.organizationMemberId, member.id),
          gte(onTheJobTrainingRecords.sessionDate, toStartOfDay(input.sessionDate)),
          lte(onTheJobTrainingRecords.sessionDate, toEndOfDay(input.sessionDate)),
        ));
      const recordedHours = Number(existingRows[0]?.total ?? 0);
      if (!isWithinDailyOjtLimit(recordedHours, input.durationHours)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "The record would exceed the 7-hour daily cap. Edit the entry or choose another date." });
      }
      const result = await db.insert(onTheJobTrainingRecords).values({
        orgId,
        organizationMemberId: member.id,
        studentEmail: member.email,
        courseKey: member.courseKey,
        sessionDate,
        topics: input.topics,
        learningObjectives: input.learningObjectives,
        providerName: input.providerName,
        providerPhone: input.providerPhone || null,
        durationHours: String(input.durationHours),
        structuredLearningConfirmed: true,
        recordedByEmail: managerEmail,
      });
      return { id: Number(result[0].insertId), success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const { orgId } = await resolveOrgManager(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const result = await db.delete(onTheJobTrainingRecords)
        .where(and(eq(onTheJobTrainingRecords.id, input.id), eq(onTheJobTrainingRecords.orgId, orgId)));
      if (Number(result[0].affectedRows) === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Training record not found in your organization." });
      }
      return { success: true };
    }),
});
