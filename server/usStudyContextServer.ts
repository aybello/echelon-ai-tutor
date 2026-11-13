/**
 * Server-resolved US study context.
 *
 * The client may ASK for a state, but nothing here trusts that input to
 * authorize anything. A state is accepted only if it is a known US state and
 * the course is a US course or a confirmed shared US WPI route. Display and teaching
 * context: it never changes banks, entitlements, currency or pricing.
 *
 * This exists because the AI tutor must not take regulatory direction from a
 * query parameter. A learner typing "?state=CA" must not unlock advice about
 * California licensing.
 */
import { getCourseByKey } from "../shared/courseRegistry";
import { sharedUSCourses, matchedUSCourses, getStateByCode } from "../shared/usExamRouting";
import { usStateIdentity } from "../shared/usStateNames";

export interface ResolvedUSStudyContext {
  courseKey: string;
  stream: "water-treatment" | "water-distribution" | "wastewater-treatment" | "wastewater-collection";
  /** Null when the learner has not chosen a recognized state. */
  stateCode: string | null;
  stateName: string | null;
  unitConvention: "us-customary";
  /** Exam edition the content was drafted against. Not proof of state adoption. */
  criteriaEdition: string;
}

/** Streams that currently have reviewed US Class I content. */
const US_SUPPORTED_STREAMS = new Set(["water-treatment", "water-distribution"]);

/**
 * Resolve US study context for a course key.
 *
 * Shared western courses require explicit US context and an approved US route;
 * a requested known state must match that course. Other Canadian keys fail closed.
 */
export function resolveUSStudyContext(
  courseKey: string,
  requestedState?: string | null,
  requestedCountry?: "US" | "CA",
): ResolvedUSStudyContext | null {
  const course = getCourseByKey(courseKey);
  if (!course) return null;
  const shared = course.examFamily === "western" && requestedCountry === "US"
    && sharedUSCourses().some(item => item.courseKey === course.courseKey && item.isActive);
  if (!shared && course.examFamily !== "us-wpi" && course.examFamily !== "us-state") return null;
  if (!shared && !US_SUPPORTED_STREAMS.has(course.track)) return null;
  const state = getStateByCode(requestedState);
  if (shared && state && !matchedUSCourses(state).some(item => item.courseKey === course.courseKey)) return null;

  // An unrecognized state silently becomes "no state", never an error and
  // never a pass-through of attacker-supplied text.
  const identity = requestedState ? usStateIdentity(requestedState) : undefined;

  return {
    courseKey: course.courseKey,
    stream: course.track as ResolvedUSStudyContext["stream"],
    stateCode: identity?.code ?? null,
    stateName: identity?.name ?? null,
    unitConvention: "us-customary",
    criteriaEdition: course.examFamily === "us-state"
      ? "state-specific public operator criteria"
      : shared ? `Shared WPI Class ${course.classLevel} technical core; state adoption not established` : "WPI 2025 Class I criteria",
  };
}
