/** Admin-only lead queue rules; acquisition, consent and contact state differ. */
export interface LeadTriageState {
  converted: boolean;
  optedOut: boolean;
  contactFollowUpStatus: string | null;
}
export type LeadTriageFilter = "actionable" | "all" | "bought" | "opted_out";

export function isActionableLead(lead: LeadTriageState): boolean {
  return !lead.converted && !lead.optedOut && lead.contactFollowUpStatus !== "closed";
}
export function matchesLeadTriageFilter(lead: LeadTriageState, filter: LeadTriageFilter): boolean {
  if (filter === "all") return true;
  if (filter === "actionable") return isActionableLead(lead);
  if (filter === "bought") return lead.converted;
  return lead.optedOut;
}

/** An unsubscribe from any capture suppresses that address in bulk exports. */
export function consentedTrialEmails(rows: ReadonlyArray<{ email: string; optOut: boolean }>): string[] {
  const blocked = new Set(rows.filter(row => row.optOut).map(row => row.email.trim().toLowerCase()));
  return [...new Set(rows.map(row => row.email.trim().toLowerCase()).filter(email => email && !blocked.has(email)))];
}
