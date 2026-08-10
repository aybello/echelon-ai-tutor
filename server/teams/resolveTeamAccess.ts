/**
 * Federated Team Access Resolution
 * Checks both Flex licences and Annual memberships to determine if an operator
 * has access to a given course. Returns ALL grants — neither source can revoke the other.
 */
import { eq, and, sql, lte, gte } from "drizzle-orm";
import { getDb } from "../db";
import { teamFlexLicences, organizationMembers, organizations } from "../../drizzle/schema";

export interface FlexAccessGrant {
  source: "flex";
  orgId: number;
  orgName: string;
  courseKey: string;
  licenceId: number;
  accessEndsAt: Date;
  reportingEndsAt: Date | null;
}

export interface AnnualAccessGrant {
  source: "annual";
  orgId: number;
  orgName: string;
  courseKey: string;
  accessEndsAt: Date | null; // null = renews
}

export type TeamAccessGrant = FlexAccessGrant | AnnualAccessGrant;

export interface TeamAccessResult {
  hasAccess: boolean;
  grants: TeamAccessGrant[];
  effectiveAccessEndsAt: Date | null; // latest expiry (null = ongoing Annual)
}

export async function resolveTeamAccess(
  operatorUserId: number | null,
  operatorEmail: string,
  courseKey: string,
): Promise<TeamAccessResult> {
  const db = await getDb();
  if (!db) return { hasAccess: false, grants: [], effectiveAccessEndsAt: null };

  const grants: TeamAccessGrant[] = [];
  const now = new Date();

  // 1. Check Flex licences (by userId only for claimed licences)
  if (operatorUserId) {
    const flexLicences = await db
      .select({
        id: teamFlexLicences.id,
        organizationId: teamFlexLicences.organizationId,
        courseKey: teamFlexLicences.courseKey,
        accessEndsAt: teamFlexLicences.accessEndsAt,
        reportingEndsAt: teamFlexLicences.reportingEndsAt,
      })
      .from(teamFlexLicences)
      .where(and(
        eq(teamFlexLicences.operatorUserId, operatorUserId),
        eq(teamFlexLicences.courseKey, courseKey),
        eq(teamFlexLicences.status, "active"),
        lte(teamFlexLicences.startsAt, now),
        gte(teamFlexLicences.accessEndsAt, now),
      ));

    for (const lic of flexLicences) {
      // Look up org name
      const [org] = await db
        .select({ name: organizations.name })
        .from(organizations)
        .where(eq(organizations.id, lic.organizationId))
        .limit(1);

      grants.push({
        source: "flex",
        orgId: lic.organizationId,
        orgName: org?.name ?? "Unknown",
        courseKey: lic.courseKey,
        licenceId: lic.id,
        accessEndsAt: lic.accessEndsAt!,
        reportingEndsAt: lic.reportingEndsAt ?? null,
      });
    }
  }

  // 2. Check Annual access (existing logic via organizationMembers)
  // An Annual member has access to all courses in their assigned stream
  const emailNormalized = operatorEmail.toLowerCase().trim();
  const annualMembers = await db
    .select({
      orgId: organizationMembers.orgId,
      courseKey: organizationMembers.courseKey,
      status: organizationMembers.status,
    })
    .from(organizationMembers)
    .where(and(
      eq(organizationMembers.email, emailNormalized),
      eq(organizationMembers.status, "active"),
    ));

  for (const member of annualMembers) {
    // Check if the org is active and the member's courseKey matches (or is null = all-access)
    if (member.courseKey === courseKey || member.courseKey === null) {
      const [org] = await db
        .select({ name: organizations.name, termEnd: organizations.termEnd, status: organizations.status })
        .from(organizations)
        .where(and(
          eq(organizations.id, member.orgId),
          eq(organizations.status, "active"),
        ))
        .limit(1);

      if (org) {
        grants.push({
          source: "annual",
          orgId: member.orgId,
          orgName: org.name,
          courseKey,
          accessEndsAt: org.termEnd ?? null, // null if auto-renewing
        });
      }
    }
  }

  // 3. Determine effective access
  const hasAccess = grants.length > 0;
  let effectiveAccessEndsAt: Date | null = null;

  if (hasAccess) {
    // null means ongoing (Annual auto-renew) — that's the "longest"
    const hasOngoing = grants.some(g => g.accessEndsAt === null);
    if (hasOngoing) {
      effectiveAccessEndsAt = null;
    } else {
      // Latest expiry across all grants
      effectiveAccessEndsAt = grants.reduce<Date | null>((latest, g) => {
        if (!g.accessEndsAt) return latest;
        if (!latest || g.accessEndsAt > latest) return g.accessEndsAt;
        return latest;
      }, null);
    }
  }

  return { hasAccess, grants, effectiveAccessEndsAt };
}
