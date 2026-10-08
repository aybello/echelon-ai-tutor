/**
 * Server-resolved US study context.
 *
 * The client may ASK for a state, but nothing here trusts that input to
 * authorize anything. A state is accepted only if it is a known US state and
 * the course itself is a US course. The result is display and teaching
 * context: it never changes banks, entitlements, currency or pricing.
 *
 * This exists because the AI tutor must not take regulatory direction from a
 * query parameter. A learner typing "?state=CA" must not unlock advice about
 * California licensing.
 */
import { getCourseByKey } from "../shared/courseRegistry";
import { usStateIdentity } from "../shared/usStateNames";

export interface ResolvedUSStudyContext {
  courseKey: string;
  stream: "water-treatment" | "water-distribution";
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
 * Returns null unless the course is a known, US-family course with a supported
 * stream. Unknown keys, Canadian keys and unsupported streams all fail closed.
 */
export function resolveUSStudyContext(
  courseKey: string,
  requestedState?: string | null,
): ResolvedUSStudyContext | null {
  const course = getCourseByKey(courseKey);
  if (!course) return null;
  if (course.examFamily !== "us-wpi") return null;
  if (!US_SUPPORTED_STREAMS.has(course.track)) return null;

  // An unrecognized state silently becomes "no state", never an error and
  // never a pass-through of attacker-supplied text.
  const identity = requestedState ? usStateIdentity(requestedState) : undefined;

  return {
    courseKey: course.courseKey,
    stream: course.track as ResolvedUSStudyContext["stream"],
    stateCode: identity?.code ?? null,
    stateName: identity?.name ?? null,
    unitConvention: "us-customary",
    criteriaEdition: "WPI 2025 Class I criteria",
  };
}
