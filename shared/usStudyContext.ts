import { usStateIdentity, type USStateCode } from "./usStateNames";
import { resolveCourseKey } from "./courseRegistry";
export function readUSStudyContext(search: string) {
  const query = new URLSearchParams(search);
  const identity = usStateIdentity(query.get("state"));
  const isUS = query.get("country") === "US";
  return { isUS, state: isUS ? identity : undefined };
}
/** Context affects labels and links, never purchases, banks, currency or entitlements. */
export function withUSStudyContext(path: string, productKey: string | null | undefined, search: string): string {
  // Shared WPI courses carry US context when a US learner is studying with
  // them. Dedicated US courses are US courses by definition, so they carry it
  // as well. Ontario courses never do.
  const family = resolveCourseKey(productKey ?? "")?.examFamily;
  if (family !== "western" && family !== "us-wpi") return path;
  const context = readUSStudyContext(search);
  if (!context.isUS) return path;
  const url = new URL(path, "https://echelon.invalid");
  if (url.origin !== "https://echelon.invalid") return path;
  url.searchParams.delete("province");
  url.searchParams.set("country", "US");
  if (context.state) url.searchParams.set("state", context.state.code);
  else url.searchParams.delete("state");
  return `${url.pathname}${url.search}${url.hash}`;
}
export function usCatalogueHref(state?: USStateCode) {
  return state ? `/us/courses?state=${state}` : "/us/courses";
}
