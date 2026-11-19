import { createHash } from "node:crypto";
import {
  canonicalDeepPayload, deepCoursePackageSchema, deepGameLimits, deepSessionResponseSchema,
  type DeepCoursePackage, type DeepSessionResponse,
} from "../../shared/deepGames";
import { deepAssessmentIssue } from "./tracking";

export { deepCoursePackageSchema } from "../../shared/deepGames";
export const DEEP_REVIEW_MODEL = "gemini-4-hydrogen";
export const DEEP_REVIEW_AUTHORITY = `owner-authorized-ai-review:${DEEP_REVIEW_MODEL}`;

/** Integrity check of a server-authored review attestation, not an external signature or live model call. */
export function deepPayloadSha256(value: unknown): string {
  return createHash("sha256").update(canonicalDeepPayload(value), "utf8").digest("hex");
}
export function deepJsonBytes(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}
function freezeDeep<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}

/** Strict projection strips nothing silently: unknown/publication fields must fail, never leak. */
export function validateDeepSessionResponse(value: unknown): DeepSessionResponse {
  const session = deepSessionResponseSchema.parse(value);
  if (deepJsonBytes(session) >= deepGameLimits.sessionBytes) throw new Error("Deep session byte limit exceeded");
  deepAssessmentIssue(session); // Also enforces all existing observation string/step/option bounds.
  return freezeDeep(session);
}

/** Hashes cover exact parsed payloads and revisions; invalid packages never become registered content. */
export function validateDeepCoursePackage(value: unknown, expectedCourseKey?: string): DeepCoursePackage {
  if (deepJsonBytes(value) >= deepGameLimits.packageBytes) throw new Error("Deep package byte limit exceeded");
  const data = deepCoursePackageSchema.parse(value);
  if (expectedCourseKey !== undefined && data.courseKey !== expectedCourseKey) throw new Error("Deep course mismatch");
  if (data.publication.reviewedBy !== DEEP_REVIEW_AUTHORITY) throw new Error("Deep review authority mismatch");
  const core = { courseKey: data.courseKey, version: data.version, tasks: data.tasks, missions: data.missions };
  if (deepPayloadSha256(core) !== data.publication.packageSha256) throw new Error("Deep package hash mismatch");
  for (const task of data.tasks) {
    const receipt = data.publication.taskReceipts.find(receipt => receipt.taskId === task.id)!;
    if (receipt.sha256 !== deepPayloadSha256(task)) throw new Error("Deep task hash mismatch");
  }
  for (const mission of data.missions) {
    const receipt = data.publication.missionReceipts.find(receipt => receipt.missionId === mission.id)!;
    if (receipt.sha256 !== deepPayloadSha256(mission)) throw new Error("Deep mission hash mismatch");
  }
  const usedSources = new Set(data.publication.taskReceipts.flatMap(receipt => receipt.sourceIds));
  if (data.sources.some(source => !usedSources.has(source.id))) throw new Error("Deep source coverage mismatch");

  const base = { courseKey: data.courseKey, version: data.version, sessionId: "00000000-0000-4000-8000-000000000000" };
  // Reserve the largest wire capability. Publication must support any bounded selected session,
  // not just a lucky small sample. No tracking persistence or identity reads happen here.
  const activityTracking = {
    tracking: true as const, sessionId: base.sessionId, capability: "x".repeat(2048),
    nextSequence: 3001, expiresAt: "2099-01-01T00:00:00.000Z", source: "observed" as const,
  };
  for (const task of data.tasks) {
    validateDeepSessionResponse({ ...base, mode: task.mode, tasks: [{ id: "item:0", sourceId: task.id, task }] });
  }
  const modes = new Set(data.tasks.map(task => task.mode));
  for (const mode of modes) {
    const tasks = data.tasks.filter(task => task.mode === mode)
      .sort((a, b) => deepJsonBytes(b) - deepJsonBytes(a)).slice(0, deepGameLimits.sessionTasks)
      .map((task, index) => ({ id: `item:${index}`, sourceId: task.id, task }));
    validateDeepSessionResponse({ ...base, mode, tasks, activityTracking });
  }
  for (const mission of data.missions) {
    const tasks = mission.tasks.map(ref => ({
      id: ref.occurrenceId, sourceId: ref.taskId,
      task: data.tasks.find(task => task.id === ref.taskId && task.revision === ref.revision)!,
    }));
    validateDeepSessionResponse({ ...base, mode: "exam-escape-room", mission, tasks, activityTracking });
  }
  return freezeDeep(data);
}
