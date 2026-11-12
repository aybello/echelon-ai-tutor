import { TRPCError } from "@trpc/server";
import { eq, inArray } from "drizzle-orm";
import { organizations, teamFlexLicences } from "../../drizzle/schema";
import type { FlexReportingLicence } from "./flexReporting";
import { listCurrentDelegatedOrganizations, managerOrganizationIsCurrent } from "./delegatedManagers";
import { normalizeEmail } from "../_core/access";
import { getDb } from "../db";

export type ManagerContext = { user: { id: number; email?: string | null } | null; studentEmail?: string | null };
export const managerEmailForContext = (ctx: ManagerContext) => normalizeEmail(ctx.user ? ctx.user.email : ctx.studentEmail);
export { managerOrganizationIsCurrent };

/** Primary ownership stays authoritative; only explicitly approved delegates join discovery. */
export async function listManagedOrganizations(ctx: ManagerContext, options: { ownerOnly?: boolean } = {}) {
  const email = managerEmailForContext(ctx);
  if (!email) throw new TRPCError({ code: "UNAUTHORIZED", message: "Please sign in to access the team dashboard." });
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const owned = await db.select().from(organizations).where(eq(organizations.managerEmail, email));
  const delegated = options.ownerOnly ? [] : await listCurrentDelegatedOrganizations(db, email);
  const rows = Array.from(new Map([...owned, ...delegated].map(row => [row.id, row])).values());
  return rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id);
}

export async function resolveManagedOrganization(ctx: ManagerContext, options: { orgId?: number; purpose?: "dashboard" | "billing"; allowMissing?: boolean; ownerOnly?: boolean } = {}) {
  const rows = await listManagedOrganizations(ctx, { ownerOnly: options.ownerOnly || options.purpose === "billing" });
  const billing = options.purpose === "billing";
  const now = new Date();
  const managedOrgIds = rows.map(row => row.id);
  const reportingLicencesByOrg = new Map<number, FlexReportingLicence[]>();
  if (managedOrgIds.length > 0) {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const licences = await db
      .select({
        organizationId: teamFlexLicences.organizationId,
        status: teamFlexLicences.status,
        reportingEndsAt: teamFlexLicences.reportingEndsAt,
        accessEndsAt: teamFlexLicences.accessEndsAt,
        activationDeadline: teamFlexLicences.activationDeadline,
      })
      .from(teamFlexLicences)
      .where(inArray(teamFlexLicences.organizationId, managedOrgIds));
    for (const licence of licences) {
      const group = reportingLicencesByOrg.get(licence.organizationId) ?? [];
      group.push(licence);
      reportingLicencesByOrg.set(licence.organizationId, group);
    }
  }
  const isCurrent = (row: typeof rows[number]) => managerOrganizationIsCurrent(
    row,
    now,
    reportingLicencesByOrg.get(row.id) ?? [],
  );
  // Billing can recover a paid lapsed/cancelled team, but cannot activate it or
  // fall through to an unrelated personal customer when a team exists.
  const eligible = rows.filter(row => billing ? !["pending", "checkout_failed"].includes(row.status) : isCurrent(row));
  let candidates = eligible;
  if (options.orgId != null) {
    if (!rows.some(row => row.id === options.orgId)) throw new TRPCError({ code: "FORBIDDEN", message: "You are not a manager of this organization." });
    candidates = eligible.filter(row => row.id === options.orgId);
  } else if (billing) {
    const current = eligible.filter(isCurrent);
    if (current.length) candidates = current;
  }
  if (candidates.length > 1) throw new TRPCError({ code: "CONFLICT", message: "Choose the organization you want to manage." });
  if (candidates[0]) return candidates[0];
  if (!rows.length && options.allowMissing && options.orgId == null) return null;
  if (!rows.length) throw new TRPCError({ code: "UNAUTHORIZED", message: "No manager account found for this email." });
  throw new TRPCError({ code: "FORBIDDEN", message: billing
    ? "This team has no completed billing account. Contact support to recover billing."
    : "This team has no current contract, activation, or reporting window. Manage team billing to renew; learner access is unchanged." });
}
