import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  organizationMembers,
  organizations,
} from "../../drizzle/schema";
import { eq, and, gt } from "drizzle-orm";
import { normalizeEmail } from "./access";

export type LearningIdentity = {
  userId: number | null;
  studentEmail: string | null;
  orgId: number | null;
  organizationMemberId: number | null;
};

/**
 * Resolve the learning identity for a quiz/exam attempt.
 * Priority: OAuth user > OTP session email > guest token.
 * Also resolves org membership for operators in a team plan.
 */
export async function resolveLearningIdentity(ctx: {
  user: { id: number; email?: string | null } | null;
  studentEmail?: string | null;
}): Promise<LearningIdentity> {
  const userId = ctx.user?.id ?? null;
  const rawEmail = userId
    ? (ctx.user?.email ?? null)
    : (ctx.studentEmail ?? null);
  const studentEmail = rawEmail ? normalizeEmail(rawEmail) || null : null;

  // Resolve org membership if we have an email
  let orgId: number | null = null;
  let organizationMemberId: number | null = null;

  if (studentEmail) {
    try {
      const db = await getDb();
      if (db) {
        const now = new Date();
        const memberRows = await db
          .select({
            id: organizationMembers.id,
            orgId: organizationMembers.orgId,
            orgTermEnd: organizations.termEnd,
          })
          .from(organizationMembers)
          .innerJoin(organizations, eq(organizationMembers.orgId, organizations.id))
          .where(
            and(
              eq(organizationMembers.email, studentEmail),
              eq(organizationMembers.role, "operator"),
              eq(organizationMembers.status, "assigned"),
              gt(organizations.termEnd, now),
            ),
          )
          .limit(1);
        if (memberRows.length > 0) {
          orgId = memberRows[0].orgId;
          organizationMemberId = memberRows[0].id;
        }
      }
    } catch {
      // fail open — org membership is supplementary, not required
    }
  }

  return { userId, studentEmail, orgId, organizationMemberId };
}
