import { and, eq, gt, inArray, isNull, or } from "drizzle-orm";
import { organizationMembers, organizations, purchases, subscriptions, teamFlexLicences } from "../../drizzle/schema";
import { resolveCourseKey } from "../../shared/courseRegistry";
import { normalizeEmail } from "../_core/access";
import { getDb } from "../db";
import { getAllUnlockedExamTypes } from "../stripe/products";
import { getAllSubscriptionExamTypes } from "../stripe/subscriptionProducts";
import { assignedAnnualCourseKeys } from "../trainingRecords";

export type AttemptAttribution = { orgId: number | null; organizationMemberId: number | null; flexLicenceId: number | null };
export const PERSONAL_ATTRIBUTION: AttemptAttribution = { orgId: null, organizationMemberId: null, flexLicenceId: null };
type Identity = { userId: number | null; studentEmail: string | null };

/** Read-only: a licence is Flex membership. Never create an Annual membership to
 * attribute study, and never guess between employers, overlapping passes or a
 * personal entitlement. The signed issuance receipt carries this decision. */
export async function resolveAttemptAttribution(identity: Identity, key: string, now = new Date()): Promise<AttemptAttribution> {
  const course = resolveCourseKey(key);
  if (!course?.teamAssignable || (!identity.userId && !identity.studentEmail)) return { ...PERSONAL_ATTRIBUTION };
  const db = await getDb();
  if (!db) return { ...PERSONAL_ATTRIBUTION };
  const email = normalizeEmail(identity.studentEmail);
  const identityWhere = or(identity.userId ? eq(purchases.userId, identity.userId) : undefined, email ? eq(purchases.email, email) : undefined)!;
  const personalPurchases = await db.select().from(purchases).where(identityWhere);
  if (personalPurchases.some(row => (!row.status || row.status === "active") && (!row.accessExpiresAt || row.accessExpiresAt > now) && getAllUnlockedExamTypes([row.productKey]).includes(course.courseKey))) return { ...PERSONAL_ATTRIBUTION };
  if (email) {
    const personalSubscriptions = await db.select().from(subscriptions).where(and(eq(subscriptions.email, email), isNull(subscriptions.orgId), inArray(subscriptions.status, ["active", "past_due"]), gt(subscriptions.currentPeriodEnd, now)));
    if (personalSubscriptions.some(row => getAllSubscriptionExamTypes([{ tier: row.tier, province: row.province }]).includes(course.courseKey))) return { ...PERSONAL_ATTRIBUTION };
  }
  const candidates: AttemptAttribution[] = [];
  if (email) {
    const annual = await db.select({ member: organizationMembers, organization: organizations }).from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.orgId, organizations.id))
      .where(and(eq(organizationMembers.email, email), eq(organizationMembers.role, "operator"), eq(organizationMembers.status, "assigned"), inArray(organizations.status, ["active", "past_due"]), gt(organizations.termEnd, now)));
    for (const row of annual) if (assignedAnnualCourseKeys(row.member.courseKey, row.member.courseKeys).includes(course.courseKey)) candidates.push({ orgId: row.organization.id, organizationMemberId: row.member.id, flexLicenceId: null });
  }
  const flex = await db.select().from(teamFlexLicences).where(and(eq(teamFlexLicences.status, "active"), or(identity.userId ? eq(teamFlexLicences.operatorUserId, identity.userId) : undefined, email ? eq(teamFlexLicences.invitedEmail, email) : undefined)));
  for (const licence of flex) {
    if (resolveCourseKey(licence.courseKey)?.courseKey !== course.courseKey || !licence.activatedAt || !licence.startsAt || licence.startsAt > now || !licence.accessEndsAt || licence.accessEndsAt <= now) continue;
    candidates.push({ orgId: licence.organizationId, organizationMemberId: null, flexLicenceId: licence.id });
  }
  return candidates.length === 1 ? candidates[0] : { ...PERSONAL_ATTRIBUTION };
}

/** Prevent a later membership change from silently reassigning a issued attempt.
 * Legacy receipts without attribution remain learner-owned but unreported. */
export async function validateIssuedAttribution(identity: Identity, key: string, issued?: AttemptAttribution | null) {
  if (!issued?.orgId) return { ...PERSONAL_ATTRIBUTION };
  const current = await resolveAttemptAttribution(identity, key);
  return current.orgId === issued.orgId && current.organizationMemberId === issued.organizationMemberId && current.flexLicenceId === issued.flexLicenceId ? current : { ...PERSONAL_ATTRIBUTION };
}
