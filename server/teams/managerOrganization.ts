/**
 * Shared manager-organization lifecycle selection.
 *
 * A manager email can legitimately appear on more than one organization row
 * after an abandoned checkout, renewal, or migration. Callers must evaluate
 * every matching row before choosing one; selecting an arbitrary row and then
 * checking its status can hide a newer paid organization behind an older
 * pending or cancelled record.
 */

const MANAGER_ACCESS_STATUSES = new Set(["active", "past_due"]);

export type ManagerOrganizationCandidate = {
  id: number;
  status: string | null;
  termEnd: Date | null;
  createdAt: Date | null;
};

export function selectCurrentManagerOrganization<
  T extends ManagerOrganizationCandidate,
>(rows: readonly T[], now = new Date()): T | null {
  const eligible = rows.filter((row) =>
    MANAGER_ACCESS_STATUSES.has(row.status ?? "") &&
    row.termEnd != null &&
    row.termEnd.getTime() > now.getTime(),
  );

  eligible.sort((a, b) => {
    const createdDifference =
      (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);
    return createdDifference !== 0 ? createdDifference : b.id - a.id;
  });

  return eligible[0] ?? null;
}
