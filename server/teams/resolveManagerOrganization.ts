import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { organizations } from "../../drizzle/schema";
import { normalizeEmail } from "../_core/access";
import { getDb } from "../db";

export type ManagerContext = { user: { id: number; email?: string | null } | null; studentEmail?: string | null };
export const managerEmailForContext = (ctx: ManagerContext) => normalizeEmail(ctx.user ? ctx.user.email : ctx.studentEmail);
export function managerOrganizationIsCurrent(row: { status: string; termEnd: Date | null }, now = new Date()) {
  return ["active", "past_due"].includes(row.status) && !!row.termEnd && row.termEnd > now;
}

/** managerEmail is authoritative. An unrelated legacy membership is not ownership. */
export async function listManagedOrganizations(ctx: ManagerContext) {
  const email = managerEmailForContext(ctx);
  if (!email) throw new TRPCError({ code: "UNAUTHORIZED", message: "Please sign in to access the team dashboard." });
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const rows = await db.select().from(organizations).where(eq(organizations.managerEmail, email));
  return rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id);
}

export async function resolveManagedOrganization(ctx: ManagerContext, options: { orgId?: number; purpose?: "dashboard" | "billing"; allowMissing?: boolean } = {}) {
  const rows = await listManagedOrganizations(ctx);
  const billing = options.purpose === "billing";
  // Billing can recover a paid lapsed/cancelled team, but cannot activate it or
  // fall through to an unrelated personal customer when a team exists.
  const eligible = rows.filter(row => billing ? !["pending", "checkout_failed"].includes(row.status) : managerOrganizationIsCurrent(row));
  let candidates = eligible;
  if (options.orgId != null) {
    if (!rows.some(row => row.id === options.orgId)) throw new TRPCError({ code: "FORBIDDEN", message: "You are not a manager of this organization." });
    candidates = eligible.filter(row => row.id === options.orgId);
  } else if (billing) {
    const current = eligible.filter(row => managerOrganizationIsCurrent(row));
    if (current.length) candidates = current;
  }
  if (candidates.length > 1) throw new TRPCError({ code: "CONFLICT", message: "Choose the organization you want to manage." });
  if (candidates[0]) return candidates[0];
  if (!rows.length && options.allowMissing && options.orgId == null) return null;
  if (!rows.length) throw new TRPCError({ code: "UNAUTHORIZED", message: "No manager account found for this email." });
  throw new TRPCError({ code: "FORBIDDEN", message: billing
    ? "This team has no completed billing account. Contact support to recover billing."
    : "This team subscription or contract term has ended. Manage team billing to renew; learner access remains inactive." });
}
