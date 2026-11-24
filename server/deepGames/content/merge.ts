import {
  canonicalDeepPayload,
  deepCoursePackageSchema,
  type DeepCoursePackage,
} from "../../../shared/deepGames";
import { deepPayloadSha256, validateDeepCoursePackage } from "../schema";

/**
 * Combines separately reviewed authoring packages into one course release.
 * Every source package is validated first. The merged release keeps each task
 * and mission receipt, deduplicates identical sources, and receives a new hash
 * over the complete merged task/mission payload.
 */
export function mergeDeepCoursePackages(packages: readonly unknown[]): DeepCoursePackage {
  if (!packages.length) throw new Error("No deep-game packages supplied");
  const validated = packages.map((value) => validateDeepCoursePackage(value));
  const courseKey = validated[0].courseKey;
  if (validated.some((pkg) => pkg.courseKey !== courseKey)) throw new Error("Deep package course mismatch");

  const tasks = validated.flatMap((pkg) => pkg.tasks);
  const missions = validated.flatMap((pkg) => pkg.missions);
  const taskIds = new Set<string>();
  const missionIds = new Set<string>();
  if (tasks.some((task) => !taskIds.add(`${task.id}:${task.revision}`))) throw new Error("Duplicate merged task");
  if (missions.some((mission) => !missionIds.add(`${mission.id}:${mission.revision}`))) throw new Error("Duplicate merged mission");

  const sources = new Map<string, DeepCoursePackage["sources"][number]>();
  for (const source of validated.flatMap((pkg) => pkg.sources)) {
    const existing = sources.get(source.id);
    if (existing && canonicalDeepPayload(existing) !== canonicalDeepPayload(source)) throw new Error("Conflicting merged source");
    sources.set(source.id, source);
  }

  const taskReceipts = validated.flatMap((pkg) => pkg.publication.taskReceipts);
  const missionReceipts = validated.flatMap((pkg) => pkg.publication.missionReceipts);
  const version = validated.map((pkg) => pkg.version).sort().at(-1)!;
  const core = { courseKey, version, tasks, missions };
  const merged = {
    ...core,
    sources: [...sources.values()],
    publication: {
      published: true as const,
      reviewedBy: validated[0].publication.reviewedBy,
      reviewedAt: validated.map((pkg) => pkg.publication.reviewedAt).sort().at(-1)!,
      packageSha256: deepPayloadSha256(core),
      taskReceipts,
      missionReceipts,
    },
  };
  return deepCoursePackageSchema.parse(merged);
}

export function assertMergedPackageIntegrity(pkg: DeepCoursePackage): DeepCoursePackage {
  if (deepPayloadSha256({ courseKey: pkg.courseKey, version: pkg.version, tasks: pkg.tasks, missions: pkg.missions }) !== pkg.publication.packageSha256)
    throw new Error("Merged deep package hash mismatch");
  return pkg;
}
