import { PROVINCE_STORAGE_KEY } from "@/hooks/useProvince";

export const CANADIAN_JURISDICTIONS = ["ON", "BC", "AB", "SK", "MB", "NS"] as const;
export type CanadianJurisdiction = typeof CANADIAN_JURISDICTIONS[number];

function parseJurisdiction(value?: string | null): CanadianJurisdiction | undefined {
  const normalized = value?.trim().toUpperCase();
  return CANADIAN_JURISDICTIONS.find((province) => province === normalized);
}

/** Uses the URL first, then the learner's saved province for direct or bookmarked course pages. */
export function readCheckoutJurisdiction(search: string, storedProvince?: string | null): CanadianJurisdiction | undefined {
  const fromRoute = parseJurisdiction(new URLSearchParams(search).get("province"));
  if (fromRoute) return fromRoute;
  if (storedProvince !== undefined) return parseJurisdiction(storedProvince);
  try {
    return parseJurisdiction(window.localStorage.getItem(PROVINCE_STORAGE_KEY));
  } catch {
    return undefined;
  }
}
