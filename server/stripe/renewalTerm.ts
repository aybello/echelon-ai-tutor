import { and, eq } from "drizzle-orm";
import { organizationMembers, organizationTermUsage } from "../../drizzle/schema";
import type { Database } from "./eventLedger";

export async function initializeOrganizationRenewalTerm(
  db: Database,
  orgId: number,
  termStart: Date,
  termEnd: Date,
): Promise<void> {
  const activeMembers = await db
    .select({ email: organizationMembers.email })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.orgId, orgId),
        eq(organizationMembers.role, "operator"),
        eq(organizationMembers.status, "assigned"),
      ),
    );

  for (const member of activeMembers) {
    try {
      await db.insert(organizationTermUsage).values({
        orgId,
        memberEmail: member.email,
        termStart,
        termEnd,
      });
    } catch (error: any) {
      const message =
        `${error?.message ?? ""}${error?.cause?.message ?? ""}`;
      const duplicate =
        error?.code === "ER_DUP_ENTRY" ||
        error?.cause?.code === "ER_DUP_ENTRY" ||
        message.includes("term_usage_unique_idx") ||
        message.includes("Duplicate entry");
      if (!duplicate) {
        throw error;
      }
    }
  }
}
