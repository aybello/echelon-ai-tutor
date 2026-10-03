import { resolveCourseKey } from "./courseRegistry";
import { getActiveIndividualProductByKey } from "./products";

export const FUNNEL_PROVINCES = ["ON", "BC", "AB", "SK", "MB"] as const;
export type FunnelProvince = typeof FUNNEL_PROVINCES[number];

export function funnelProvince(value?: string | null): FunnelProvince | undefined {
  const code = value?.toUpperCase();
  return FUNNEL_PROVINCES.find(province => province === code);
}

function productProvince(productKey: string, province?: string | null): FunnelProvince {
  const requested = funnelProvince(province);
  return productKey.startsWith("wpi-") ? (requested && requested !== "ON" ? requested : "BC") : "ON";
}

/** Only canonical individual products are accepted. Conflicting explicit jurisdictions do not select another product. */
export function readPricingSelection(search: string) {
  const params = new URLSearchParams(search);
  const product = getActiveIndividualProductByKey(params.get("product") ?? "");
  const explicitProvince = funnelProvince(params.get("province"));
  const province = explicitProvince ?? (product ? productProvince(product.key) : params.get("tab") === "western" ? "BC" : "ON");
  const compatible = product && (product.key.startsWith("wpi-") ? province !== "ON" : province === "ON");
  return { province, requestedProductKey: compatible ? product.key : "" };
}

/** Undefined availability is loading, not permission to offer a catalogue product for sale. */
export function availablePricingSelection(search: string, liveKeys?: ReadonlySet<string>) {
  const selection = readPricingSelection(search);
  return { ...selection, selectedProductKey: liveKeys?.has(selection.requestedProductKey) ? selection.requestedProductKey : "" };
}

export function buildPricingHref(productKey?: string | null, province?: string | null): string {
  const product = getActiveIndividualProductByKey(productKey ?? "");
  const params = new URLSearchParams();
  if (product) params.set("product", product.key);
  params.set("province", product ? productProvince(product.key, province) : funnelProvince(province) ?? "ON");
  return `/pricing?${params}`;
}

export function courseProvinceHref(path: string, productKey: string, province?: string | null): string {
  if (!getActiveIndividualProductByKey(productKey)) return path;
  const url = new URL(path, "https://echelon.invalid");
  url.searchParams.set("province", productProvince(productKey, province));
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Same-origin referrer preserves the province without adding an untrusted checkout redirect input. */
export function individualCheckoutCancelPath(productKey: string, referrer: string | undefined, appBaseUrl: string): string {
  let province: FunnelProvince | undefined;
  try {
    if (referrer) {
      const url = new URL(referrer);
      if (url.origin === new URL(appBaseUrl).origin) province = funnelProvince(url.searchParams.get("province"));
    }
  } catch { /* No valid referrer: use the product's jurisdiction, never another product. */ }
  return buildPricingHref(productKey, province);
}

/** Do not carry credentials, personal identifiers, nested redirects or auth actions into a sign-in continuation. */
export function safeCurrentDestination(destination: string): string {
  if (!destination.startsWith("/") || destination.startsWith("//") || /[\\\s\u0000-\u001f:]/.test(destination)) return "/dashboard";
  let url: URL;
  try { url = new URL(destination, "https://echelon.invalid"); } catch { return "/dashboard"; }
  if (!/^\/[a-zA-Z0-9/_-]*$/.test(url.pathname) || /\/(?:api|account|login|logout|auth|magic|token|invite|preview|purchase-success|unsubscribe)(?:\/|$)/i.test(url.pathname)) return "/dashboard";
  const params = new URLSearchParams();
  for (const key of ["course", "product", "province", "mode", "tab", "track", "panel"] as const) {
    const value = url.searchParams.get(key);
    if (!value || !/^[a-zA-Z0-9-]+$/.test(value)) continue;
    if (key === "product" && !getActiveIndividualProductByKey(value)) continue;
    if (key === "course" && resolveCourseKey(value)?.courseKey !== value) continue;
    if (key === "province" && !funnelProvince(value)) continue;
    if (key === "panel" && !["notes", "tutor"].includes(value)) continue;
    params.set(key, value);
  }
  return `${url.pathname}${params.size ? `?${params}` : ""}${url.hash === "#courses" ? url.hash : ""}`;
}

export function signInHref(destination: string): string {
  return `/account?next=${encodeURIComponent(safeCurrentDestination(destination))}`;
}

export function courseCatalogueHref(isUS: boolean): string {
  return isUS ? "/us/courses" : "/#courses";
}
