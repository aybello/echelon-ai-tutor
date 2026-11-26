export type FlexReportingLicence = {
  status: string;
  accessEndsAt: Date | null;
  reportingEndsAt: Date | null;
  activationDeadline?: Date | null;
};

/**
 * A Course Pass is reportable after study access ends, but only during its
 * recorded reporting grace window. Revoked and suspended passes never qualify.
 */
export function flexLicenceHasOpenReportingWindow(
  licence: Pick<FlexReportingLicence, "status" | "reportingEndsAt">,
  now = new Date(),
): boolean {
  return ["active", "expired"].includes(licence.status)
    && licence.reportingEndsAt !== null
    && licence.reportingEndsAt.getTime() >= now.getTime();
}

/**
 * Assigned and invited licences stay visible for onboarding. Activated passes
 * stay visible while study access is open, then through their reporting grace.
 */
export function flexLicenceIsVisibleInManagerReport(
  licence: FlexReportingLicence,
  now = new Date(),
): boolean {
  if (["assigned", "invited"].includes(licence.status)) return true;
  if (licence.status === "active" && licence.accessEndsAt !== null && licence.accessEndsAt > now) return true;
  return flexLicenceHasOpenReportingWindow(licence, now);
}

/** Return the furthest still-open reporting date across an organization's paid passes. */
export function latestOpenFlexReportingEnd(
  licences: readonly Pick<FlexReportingLicence, "status" | "reportingEndsAt">[],
  now = new Date(),
): Date | null {
  return licences.reduce<Date | null>((latest, licence) => {
    if (!flexLicenceHasOpenReportingWindow(licence, now)) return latest;
    if (!latest || licence.reportingEndsAt! > latest) return licence.reportingEndsAt;
    return latest;
  }, null);
}

/** Manager administration follows paid inventory; this never grants study access. */
export function flexLicenceKeepsManagerAccess(
  licence: FlexReportingLicence,
  now = new Date(),
): boolean {
  if (["unused", "invited", "assigned"].includes(licence.status)) {
    return !!licence.activationDeadline && licence.activationDeadline >= now;
  }
  return (licence.status === "active" && !!licence.accessEndsAt && licence.accessEndsAt > now)
    || flexLicenceHasOpenReportingWindow(licence, now);
}
