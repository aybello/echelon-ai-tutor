export function formatAdminCurrency(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? "—" : `CA$${value.toFixed(2)}`;
}

export function formatAdminPercent(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? "—" : `${value}%`;
}

export function rateFromCounts(numerator: number | null | undefined, denominator: number | null | undefined): number | null {
  if (numerator == null || denominator == null || denominator <= 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}
