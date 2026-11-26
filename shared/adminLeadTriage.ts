/** Admin-only lead queue rules; acquisition, consent and contact state differ. */
export interface LeadTriageState {
  converted: boolean;
  optedOut: boolean;
  contactFollowUpStatus: string | null;
  contactRequestId?: number | null;
}
export type LeadTriageFilter = "actionable" | "all" | "bought" | "opted_out";

export function isActionableLead(lead: LeadTriageState): boolean {
  // An inbound request permits a reply about that request, not general
  // marketing. Merely recording an email or not opting out proves neither.
  return !lead.converted && !lead.optedOut && Boolean(lead.contactRequestId)
    && lead.contactFollowUpStatus !== "closed";
}
export function matchesLeadTriageFilter(lead: LeadTriageState, filter: LeadTriageFilter): boolean {
  if (filter === "all") return true;
  if (filter === "actionable") return isActionableLead(lead);
  if (filter === "bought") return lead.converted;
  return lead.optedOut;
}

/** Fail closed unless explicit marketing-consent evidence is supplied. */
export function consentedTrialEmails(rows: ReadonlyArray<{ email: string; optOut: boolean; marketingConsent?: boolean }>): string[] {
  const blocked = new Set(rows.filter(row => row.optOut).map(row => row.email.trim().toLowerCase()));
  return [...new Set(rows.filter(row => row.marketingConsent === true).map(row => row.email.trim().toLowerCase()).filter(email => email && !blocked.has(email)))];
}
