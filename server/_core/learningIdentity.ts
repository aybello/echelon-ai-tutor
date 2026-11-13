import { normalizeEmail } from "./access";
import { resolveAttemptAttribution } from "../teams/attemptAttribution";

export type LearningIdentity = {
  userId: number | null;
  studentEmail: string | null;
  orgId: number | null;
  organizationMemberId: number | null;
};

/** Identity never grants membership. Course-specific attribution is read-only,
 * unique and conservative; unspecified or ambiguous study remains personal. */
export async function resolveLearningIdentity(ctx: {
  user: { id: number; email?: string | null } | null;
  studentEmail?: string | null;
}, courseKey?: string): Promise<LearningIdentity> {
  const userId = ctx.user?.id ?? null;
  const studentEmail = normalizeEmail(ctx.user ? ctx.user.email : ctx.studentEmail) || null;
  const attribution = courseKey ? await resolveAttemptAttribution({ userId, studentEmail }, courseKey) : null;
  return { userId, studentEmail, orgId: attribution?.orgId ?? null, organizationMemberId: attribution?.organizationMemberId ?? null };
}
