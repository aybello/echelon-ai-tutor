import { TRPCError } from "@trpc/server";
import { and, eq, gt, inArray, lte } from "drizzle-orm";
import { hiringTerms, organizationMembers, organizations, subscriptions, type Organization, type OrganizationMember, type RecruitmentAssignmentRow } from "../../drizzle/schema";
import { getCourseByKey, type CourseEntry } from "../../shared/courseRegistry";
import { courseKeyToTierStrict } from "../../shared/products";
import { assertAccess, identityEmail, normalizeEmail, resolveEntitlementsByEmail, resolveVerifiedIdentity } from "../_core/accessService";
import { clearVerifiedEmailSessionCookie } from "../_core/emailSession";
import type { TrpcContext } from "../_core/context";
import { allowedCourseKeysForOrg, getSubscriptionExamTypes, isSubscriptionProvince, isSubscriptionTier, subscriptionProvinceForOrg } from "../stripe/subscriptionProducts";
import { DELEGATED_MANAGER_ROLE } from "../teams/delegatedManagers";
import { resolveManagedOrganization } from "../teams/resolveManagerOrganization";
import { assignedAnnualCourseKeys } from "../trainingRecords";
import type { RecruitmentReadDb } from "./types";
import { assessmentOnlyCapabilityMatches, issueAssessmentOnlySession } from "../_core/assessmentOnlySession";

export function verifiedRecruitmentEmail(ctx: TrpcContext): string {
  const email = identityEmail(resolveVerifiedIdentity(ctx)) ?? ctx.assessmentOnlySession?.candidateEmail ?? null;
  if (!email) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in with your verified email to access this assessment." });
  return email;
}

export function assertCurrentAnnualOrganization(org: Organization, nowMs: number): void {
  if (!["active", "past_due"].includes(org.status) || org.billingType === "course-pass" || org.tier === "course-pass"
    || (org.termStart !== null && org.termStart.getTime() > nowMs)
    || !org.termEnd || org.termEnd.getTime() <= nowMs || !allowedCourseKeysForOrg(org.tier, org.province).length) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Recruitment assessments require a current Annual team contract." });
  }
}

/** Strict canonical key plus region/stream/NS ceiling; aliases never enter definitions. */
export function recruitmentCourseForOrg(org: Organization, key: string): CourseEntry {
  const course = getCourseByKey(key);
  const expectedFamily = org.province === "nova-scotia" ? "western" : org.province;
  if (!course?.isActive || !course.teamAssignable || course.examFamily !== expectedFamily
    || !allowedCourseKeysForOrg(org.tier, org.province).includes(key)
    || !courseKeyToTierStrict(key, org.province)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Choose an active canonical course included in this team's region and plan." });
  }
  return course;
}

export async function recruitmentManager(ctx: TrpcContext, orgId: number, annual: boolean): Promise<Organization> {
  verifiedRecruitmentEmail(ctx);
  const org = await resolveManagedOrganization(ctx, { orgId, purpose: "dashboard" });
  if (!org) throw new TRPCError({ code: "FORBIDDEN", message: "Team reporting is unavailable." });
  // Historical Annual reporting remains resolver-authorized; Flex-only teams never qualify.
  if (org.billingType === "course-pass" || org.tier === "course-pass") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Recruitment reporting requires an Annual team organization." });
  }
  if (annual) assertCurrentAnnualOrganization(org, Date.now());
  return org;
}

export function recruitmentSeatCourses(org: Organization, member: OrganizationMember): string[] {
  if (member.orgId !== org.id || member.status !== "assigned" || member.role === DELEGATED_MANAGER_ROLE) return [];
  return assignedAnnualCourseKeys(member.courseKey, member.courseKeys).filter(key => {
    try { recruitmentCourseForOrg(org, key); return true; } catch { return false; }
  });
}

export type RecruitmentSubscription = Pick<typeof subscriptions.$inferSelect,
  "orgId" | "email" | "tier" | "province" | "status" | "currentPeriodStart" | "currentPeriodEnd" | "stripeSubscriptionId">;

/** A personal or different-org purchase cannot satisfy this recruitment requirement.
 * The existing Annual writer's course-specific sentinel binds the row to this course,
 * not merely to another course of the same class tier. No subscription writes here. */
export function recruitmentSubscriptionCovers(sub: RecruitmentSubscription, org: Organization, email: string, key: string, nowMs: number): boolean {
  const tier = courseKeyToTierStrict(key, org.province);
  return sub.orgId === org.id && normalizeEmail(sub.email) === email
    && ["active", "past_due"].includes(sub.status)
    && sub.currentPeriodStart.getTime() <= nowMs && sub.currentPeriodEnd.getTime() > nowMs
    && isSubscriptionTier(sub.tier) && isSubscriptionProvince(sub.province)
    && sub.tier === tier && sub.province === subscriptionProvinceForOrg(org.province)
    && sub.stripeSubscriptionId === `org-${org.id}-${email}-${key}`
    && getSubscriptionExamTypes(sub.tier, sub.province).includes(key);
}

export async function assertRecruitmentSeat(db: RecruitmentReadDb, org: Organization, memberId: number, key: string, email?: string, lock = false): Promise<OrganizationMember> {
  assertCurrentAnnualOrganization(org, Date.now());
  recruitmentCourseForOrg(org, key);
  const memberQuery = db.select().from(organizationMembers)
    .where(and(eq(organizationMembers.id, memberId), eq(organizationMembers.orgId, org.id), eq(organizationMembers.status, "assigned"))).limit(1);
  const [member] = await (lock ? memberQuery.for("share") : memberQuery);
  if (!member || !recruitmentSeatCourses(org, member).includes(key) || (email && normalizeEmail(member.email) !== email)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "This assessment requires the original assigned team seat and course." });
  }
  const candidateEmail = normalizeEmail(member.email);
  if (!candidateEmail) throw new TRPCError({ code: "FORBIDDEN", message: "This seat has no candidate identity." });
  const now = new Date();
  const subscriptionQuery = db.select().from(subscriptions).where(and(
    eq(subscriptions.orgId, org.id), eq(subscriptions.email, candidateEmail),
    eq(subscriptions.stripeSubscriptionId, `org-${org.id}-${candidateEmail}-${key}`),
    inArray(subscriptions.status, ["active", "past_due"]),
    lte(subscriptions.currentPeriodStart, now), gt(subscriptions.currentPeriodEnd, now),
  ));
  const rows = await (lock ? subscriptionQuery.for("share") : subscriptionQuery);
  if (!rows.some(row => recruitmentSubscriptionCovers(row, org, candidateEmail, key, Date.now()))) {
    throw new TRPCError({ code: "FORBIDDEN", message: "The assigned course needs an active same-team Annual subscription." });
  }
  return member;
}

/** Called for EVERY candidate procedure, including reads, repeats and terminal views. */
export async function assertRecruitmentCandidate(ctx: TrpcContext, db: RecruitmentReadDb, assignment: RecruitmentAssignmentRow, courseKey: string, options: { centralPreflightDone?: boolean; lock?: boolean; bootstrapApplicantCapability?: boolean } = {}): Promise<Organization> {
  const email = verifiedRecruitmentEmail(ctx);
  if (email !== normalizeEmail(assignment.candidateEmail)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "This invitation belongs to a different verified email." });
  }
  const orgQuery = db.select().from(organizations).where(eq(organizations.id, assignment.orgId)).limit(1);
  const [org] = await (options.lock ? orgQuery.for("share") : orgQuery);
  if (!org) throw new TRPCError({ code: "FORBIDDEN", message: "This team is unavailable." });
  if (assignment.accessKind === "applicant" || assignment.memberId === null) {
    assertCurrentAnnualOrganization(org, Date.now());
    if (!assignment.grantId) throw new TRPCError({ code: "FORBIDDEN", message: "This applicant invitation has no active Hiring grant." });
    const grantQuery = db.select().from(hiringTerms).where(and(
      eq(hiringTerms.id, assignment.grantId), eq(hiringTerms.orgId, assignment.orgId),
      inArray(hiringTerms.state, ["active", "cancel_at_period_end"]), eq(hiringTerms.paymentState, "active"),
      lte(hiringTerms.startsAtMs, Date.now()), gt(hiringTerms.endsAtMs, Date.now()),
    )).limit(1);
    const [grant] = await (options.lock ? grantQuery.for("share") : grantQuery);
    if (!grant) throw new TRPCError({ code: "FORBIDDEN", message: "This applicant invitation's Hiring term is no longer active." });
    const capabilityMatches = assessmentOnlyCapabilityMatches(ctx.assessmentOnlySession, {
      assignmentId: assignment.id, candidateEmail: assignment.candidateEmail, courseKey,
    });
    if (!capabilityMatches) {
      if (!options.bootstrapApplicantCapability) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This applicant invitation requires its matching assessment capability." });
      }
      ctx.assessmentOnlySession = await issueAssessmentOnlySession(ctx.res, {
        assignmentId: assignment.id, candidateEmail: assignment.candidateEmail, courseKey,
      });
      if (!(await resolveEntitlementsByEmail(assignment.candidateEmail)).hasAnyAccess) {
        clearVerifiedEmailSessionCookie(ctx.res);
      }
    }
    return org;
  }
  await assertRecruitmentSeat(db, org, assignment.memberId, courseKey, email, options.lock);
  // Central preflight runs before acquiring a transaction connection. Calling
  // the global resolver while every pool connection is locked can starve it.
  if (!options.centralPreflightDone) await assertAccess(ctx, courseKey);
  assertCurrentAnnualOrganization(org, Date.now());
  return org;
}
