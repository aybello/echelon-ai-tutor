import { TRPCError } from "@trpc/server";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { organizations, organizationMembers, organizationTermUsage, subscriptions, teamFlexLicences } from "../../drizzle/schema";
import { flexLicenceKeepsManagerAccess, type FlexReportingLicence } from "./flexReporting";
import type { getDb } from "../db";

type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;
export const DELEGATED_MANAGER_ROLE = "delegated_manager";

export function managerOrganizationIsCurrent(
  row: { status: string; termEnd: Date | null; billingType: string },
  now = new Date(),
  flexLicences: readonly FlexReportingLicence[] = [],
) {
  if (!["active", "past_due"].includes(row.status)) return false;
  if (row.termEnd && row.termEnd > now) return true;
  // Reporting windows admit managers only; they never extend Annual study access.
  return flexLicences.some(licence => flexLicenceKeepsManagerAccess(licence, now));
}

/** Explicit approval only: legacy manager rows and course-bearing delegates fail closed. */
export async function listCurrentDelegatedOrganizations(db: Database, email: string, now = new Date()) {
  const memberships = await db.select({ organization: organizations })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizationMembers.orgId, organizations.id))
    .where(and(
      eq(organizationMembers.email, email),
      eq(organizationMembers.role, DELEGATED_MANAGER_ROLE),
      eq(organizationMembers.status, "assigned"),
      isNull(organizationMembers.courseKey),
      isNull(organizationMembers.courseKeys),
      inArray(organizations.status, ["active", "past_due"]),
    ));
  const rows = memberships.map(row => row.organization);
  const lapsedIds = rows.filter(row => !row.termEnd || row.termEnd <= now).map(row => row.id);
  const licences = lapsedIds.length ? await db.select().from(teamFlexLicences)
    .where(inArray(teamFlexLicences.organizationId, lapsedIds)) : [];
  return rows.filter(row => managerOrganizationIsCurrent(row, now,
    licences.filter(licence => licence.organizationId === row.id)));
}

/** The org lock also serializes this change against Annual assignment to the same email. */
export async function changeDelegatedManager(
  db: Database,
  orgId: number,
  ownerEmail: string,
  email: string,
  action: "add" | "remove",
  name?: string,
) {
  return db.transaction(async tx => {
    await tx.execute(sql`SELECT id FROM organizations WHERE id = ${orgId} FOR UPDATE`);
    const [org] = await tx.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
    if (!org || org.managerEmail !== ownerEmail) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only the primary organization owner can manage managers." });
    }
    if (email === org.managerEmail) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "The primary owner cannot be added or removed through delegation." });
    }
    const [existing] = await tx.select().from(organizationMembers)
      .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.email, email))).limit(1);
    if (existing && (existing.role !== DELEGATED_MANAGER_ROLE || existing.courseKey !== null || existing.courseKeys !== null
      || !["assigned", "revoked"].includes(existing.status))) {
      throw new TRPCError({ code: "CONFLICT", message: "This email already has a different team membership. Paid operator or legacy manager records cannot be converted." });
    }
    if (action === "remove") {
      if (existing?.status === "assigned") {
        await tx.update(organizationMembers).set({ status: "revoked", revokedAt: new Date() })
          .where(and(eq(organizationMembers.id, existing.id), eq(organizationMembers.orgId, orgId), eq(organizationMembers.role, DELEGATED_MANAGER_ROLE)));
      }
      return { success: true, email };
    }
    // Orphaned paid history is not a blank manager identity either. Never erase it.
    const [usage] = await tx.select({ id: organizationTermUsage.id }).from(organizationTermUsage)
      .where(and(eq(organizationTermUsage.orgId, orgId), eq(organizationTermUsage.memberEmail, email))).limit(1);
    const [subscription] = await tx.select({ id: subscriptions.id }).from(subscriptions)
      .where(and(eq(subscriptions.orgId, orgId), eq(subscriptions.email, email))).limit(1);
    if (usage || subscription) {
      throw new TRPCError({ code: "CONFLICT", message: "This email has paid operator history in this team and cannot be converted to a manager-only membership." });
    }
    if (existing?.status === "assigned") return { success: true, email };
    if (existing) {
      await tx.update(organizationMembers).set({ status: "assigned", revokedAt: null, assignedAt: new Date() })
        .where(and(eq(organizationMembers.id, existing.id), eq(organizationMembers.orgId, orgId), eq(organizationMembers.role, DELEGATED_MANAGER_ROLE)));
    } else {
      await tx.insert(organizationMembers).values({ orgId, email, name: name ?? null,
        role: DELEGATED_MANAGER_ROLE, status: "assigned", courseKey: null, courseKeys: null });
    }
    // Manager membership never writes subscriptions, seatsTotal, or the usage ledger.
    return { success: true, email };
  });
}
