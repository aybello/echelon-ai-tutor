/** Ontario OJT guardrails applied to manager-entered training records. */
export const OJT_MAX_HOURS_PER_DAY = 7;
export const OJT_MAX_REPORT_DAYS = 366 * 3;

export function isValidReportRange(start: Date, end: Date): boolean {
  return start.getTime() <= end.getTime()
    && (end.getTime() - start.getTime()) / 86_400_000 <= OJT_MAX_REPORT_DAYS;
}

export function isWithinDailyOjtLimit(existingHours: number, addedHours: number): boolean {
  return existingHours + addedHours <= OJT_MAX_HOURS_PER_DAY + Number.EPSILON;
}
