import { interactivePackageSchema, type InteractivePackage } from "./schema";
import { releasePackages } from "./release-2026-11-12/registry";

/**
 * Explicit server-only allowlist; no runtime file discovery or aliases.
 * Approval means software release eligibility, not human or instructor review.
 * See the release metadata for AI review, scope, and known limitations.
 */
export type PackageRegistration = { approved: boolean; content: unknown };
const approvedPackages: Readonly<Record<string, PackageRegistration>> = releasePackages;

export type InteractivePackageLoadResult =
  | { status: "absent" }
  | { status: "invalid" }
  | { status: "valid"; package: InteractivePackage };

export function validateInteractivePackage(courseKey: string, registration: PackageRegistration | undefined): InteractivePackage | null {
  // Even an unexpected exception in malformed registered content must not leak
  // its details or turn a registered package into a legacy fallback.
  try {
    if (!registration || registration.approved !== true) return null;
    const parsed = interactivePackageSchema.safeParse(registration.content);
    if (!parsed.success || parsed.data.courseKey !== courseKey) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

// This function is for an entry known to be registered; even an undefined or
// malformed entry is invalid, not absent.
export function inspectInteractiveRegistration(courseKey: string, registration: PackageRegistration | undefined): Exclude<InteractivePackageLoadResult, { status: "absent" }> {
  const pkg = validateInteractivePackage(courseKey, registration);
  return pkg ? { status: "valid", package: pkg } : { status: "invalid" };
}

export function loadInteractivePackage(courseKey: string): InteractivePackageLoadResult {
  if (!Object.hasOwn(approvedPackages, courseKey)) return { status: "absent" };
  return inspectInteractiveRegistration(courseKey, approvedPackages[courseKey]);
}
