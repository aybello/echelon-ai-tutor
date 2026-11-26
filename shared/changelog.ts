export interface ChangelogTimestampEntry {
  updatedAt: Date | string;
}

/** New changelog entries use a lower sort order so they always appear first. */
export function nextChangelogSortOrder(currentMinimum: number | null | undefined): number {
  if (currentMinimum == null || !Number.isFinite(Number(currentMinimum))) return 0;
  return Number(currentMinimum) - 1;
}

/** Returns the most recent content change represented by the visible entries. */
export function latestChangelogTimestamp(entries: ChangelogTimestampEntry[]): Date | null {
  const timestamps = entries
    .map(entry => new Date(entry.updatedAt).getTime())
    .filter(Number.isFinite);
  if (timestamps.length === 0) return null;
  return new Date(Math.max(...timestamps));
}

export function formatChangelogTimestamp(value: Date | null): string {
  if (!value) return "Updates load live";
  return value.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
