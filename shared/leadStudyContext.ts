import { resolveCourseKey } from "./courseRegistry";
import { buildPricingHref, funnelProvince } from "./funnelNavigation";

export const STUDY_FOLLOW_UP_CONSENT_VERSION = "two-study-emails-v1";
export const STUDY_FOLLOW_UP_CONSENT_COPY =
  "Email me up to two study reminders and course offers. I can unsubscribe at any time.";

/** Persist only recognized study context, never the original URL or arbitrary query data. */
export function leadPricingHref(source: string, studySearch = ""): string {
  const course = resolveCourseKey(source);
  const context = new URLSearchParams(studySearch);
  if (course?.examFamily === "us-wpi" || course?.examFamily === "us-state") {
    context.set("country", "US");
    if (course.courseKey === "us-texas-class-d-water") context.set("state", "TX");
  }
  return buildPricingHref(course?.productKey, funnelProvince(context.get("province")), context.toString());
}

export function leadStudyContext(source: string, studySearch = ""): string {
  return new URL(leadPricingHref(source, studySearch), "https://echelon.invalid").search.slice(1);
}

/** Repair already-sent email URLs without overriding an explicit current selection. */
export function legacyLeadPricingRedirect(search: string): string | null {
  if (search.length > 512) return null;
  const params = new URLSearchParams(search);
  if (params.has("product")) return null;
  const course = resolveCourseKey(params.get("course") ?? "");
  if (!course?.isActive) return null;
  const target = leadPricingHref(course.courseKey, search);
  return new URL(target, "https://echelon.invalid").searchParams.has("product") ? target : null;
}
