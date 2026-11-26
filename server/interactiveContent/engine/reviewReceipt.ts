import { createHash } from "node:crypto";
import { z } from "zod";

/** Local integrity only: these hashes do not authenticate a provider or reviewer. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
  return JSON.stringify(value);
}
export const canonicalSha256 = (value: unknown) => createHash("sha256").update(canonicalJson(value)).digest("hex");
export type EducationalEntry = { courseKey: string; topicId: string; difficulty: string; example: unknown; replacesId?: string; replacesSha256?: string; reason?: string };
export function educationalPayload(entry: EducationalEntry) {
  return { courseKey: entry.courseKey, topicId: entry.topicId, difficulty: entry.difficulty, example: entry.example,
    ...(entry.replacesId === undefined ? {} : { replacesId: entry.replacesId, replacesSha256: entry.replacesSha256, reason: entry.reason }) };
}
export const educationalSha256 = (entry: EducationalEntry) => canonicalSha256(educationalPayload(entry));
export const CHECKS = ["schema", "duplicate", "longest-answer", "absolute-wording", "true-false-balance", "cause-effect-calculation"] as const;
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const text = z.string().trim().min(1).max(4000);
export const reviewDeclarationSchema = z.object({
  reviewAuthority: z.literal("owner-authorized-ai-review"), model: text,
  // Unknown historical review time is explicit, never replaced with registration time.
  reviewedAt: z.string().datetime({ offset: true }).nullable(),
  attestation: text, payloadSha256: z.record(z.string(), hash),
}).strict();
export type ReviewDeclaration = z.infer<typeof reviewDeclarationSchema>;
export const builderResultsSchema = z.object({
  checks: z.tuple([z.literal(CHECKS[0]), z.literal(CHECKS[1]), z.literal(CHECKS[2]), z.literal(CHECKS[3]), z.literal(CHECKS[4]), z.literal(CHECKS[5])]),
  errors: z.array(z.string()).length(0),
  stats: z.object({ swipe: z.object({ t: z.number().int().nonnegative(), f: z.number().int().nonnegative() }).strict(), dirs: z.object({ increase: z.number().int().nonnegative(), decrease: z.number().int().nonnegative(), unchanged: z.number().int().nonnegative() }).strict(), longest: z.number().int().nonnegative(), options: z.number().int().nonnegative() }).strict(),
  batchSha256: hash,
}).strict();
export const receiptSchema = z.object({ declaration: reviewDeclarationSchema, registeredAt: z.string().datetime({ offset: true }), builderResults: builderResultsSchema }).strict();
export const boundReviewSchema = z.object({
  verdict: z.literal("approved"), reviewer: text, reviewAuthority: z.literal("owner-authorized-ai-review"),
  reviewedAt: z.string().datetime({ offset: true }).nullable(), notes: text,
  model: text, registeredAt: z.string().datetime({ offset: true }), payloadSha256: hash, builderResultsSha256: hash,
}).strict();
export function batchSha256(doc: { additions: EducationalEntry[]; replacements: EducationalEntry[] }) {
  return canonicalSha256({ additions: doc.additions.map(educationalPayload), replacements: doc.replacements.map(educationalPayload) });
}
export function verifyReceipt(doc: { additions: (EducationalEntry & { review: z.infer<typeof boundReviewSchema> })[]; replacements: (EducationalEntry & { review: z.infer<typeof boundReviewSchema> })[]; receipt: z.infer<typeof receiptSchema> }) {
  const { declaration, builderResults, registeredAt } = doc.receipt;
  if (batchSha256(doc) !== builderResults.batchSha256) throw new Error("Stale review receipt batch payload");
  const entries = [...doc.additions, ...doc.replacements];
  if (Object.keys(declaration.payloadSha256).length !== entries.length) throw new Error("Receipt item coverage mismatch");
  for (const entry of entries) {
    const id = (entry.example as { id: string }).id, review = entry.review;
    if (review.payloadSha256 !== educationalSha256(entry) || declaration.payloadSha256[id] !== review.payloadSha256) throw new Error(`Missing or stale review receipt: ${id}`);
    if (review.builderResultsSha256 !== canonicalSha256(builderResults) || review.model !== declaration.model || review.reviewer !== declaration.model || review.reviewedAt !== declaration.reviewedAt || review.reviewAuthority !== declaration.reviewAuthority || review.registeredAt !== registeredAt || review.notes !== declaration.attestation) throw new Error(`Review receipt metadata mismatch: ${id}`);
  }
}
