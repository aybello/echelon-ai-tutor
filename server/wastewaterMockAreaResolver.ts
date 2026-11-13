import { createHash } from "node:crypto";
import { z } from "zod";
import rawManifest from "./wastewaterMockAreaManifest.json";
import { reviewedWastewaterMockArea, WASTEWATER_MOCK_AREAS, type WastewaterAreaQuestion, type WastewaterMockArea } from "../shared/ontarioWastewaterMock";

const bankKeys = ["class1-wastewater", "class2-wastewater"] as const;
const areaKeys = ["equipment", "process", "laboratory", "safety"] as const;
const sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const bankSchema = z.object({
  entries: z.record(z.string().regex(/^[1-9]\d*$/), z.object({
    sha256,
    area: z.enum(areaKeys),
  }).strict()),
  excludedQuestionNums: z.array(z.number().int().positive()),
}).strict().superRefine((bank, ctx) => {
  const excluded = new Set(bank.excludedQuestionNums);
  if (excluded.size !== bank.excludedQuestionNums.length
    || Object.keys(bank.entries).some(key => !Number.isSafeInteger(Number(key)) || excluded.has(Number(key)))) {
    ctx.addIssue({ code: "custom", message: "Duplicate, unsafe or overlapping classification identity" });
  }
});

export const wastewaterMockAreaManifestSchema = z.object({
  version: z.literal(1),
  digestFormat: z.literal("sha256-json-array-v1"),
  provenance: z.object({
    source: z.literal("AI-assisted task-area classification"),
    model: z.literal("gpt-6.1-sol"),
    classifiedOn: z.literal("2026-10-03"),
    reviewedOn: z.literal("2026-10-03"),
    reviewScope: z.literal("Task-area classification only; not human or technical-content approval"),
    confidence: z.literal("high"),
    selection: z.string().min(1),
    sourceExportSha256: sha256,
    sourceProposalSha256: sha256,
  }).strict(),
  banks: z.object({
    "class1-wastewater": bankSchema,
    "class2-wastewater": bankSchema,
  }).strict(),
}).strict();
export type WastewaterMockAreaManifest = z.infer<typeof wastewaterMockAreaManifestSchema>;
export type ClassifiedWastewaterQuestion = WastewaterAreaQuestion & {
  /** Learner id is questionNum, never the database row primary key. */
  id: number;
  question: string;
  options: readonly string[];
  correctIndex: number;
};

/** Exact parsed content, with option order and Unicode/whitespace unchanged.
 * Database row IDs, explanations and governance fields are not classifications.
 * The versioned JSON tuple avoids concatenation ambiguities and key-order drift.
 */
export function wastewaterMockContentSha256(question: ClassifiedWastewaterQuestion): string {
  return createHash("sha256").update(JSON.stringify([
    "echelon-wastewater-task-area-v1", question.question, question.options,
    question.correctIndex, question.module,
  ]), "utf8").digest("hex");
}

export function createWastewaterMockAreaResolver(input: unknown) {
  const manifest = wastewaterMockAreaManifestSchema.parse(input);
  const excluded = Object.fromEntries(bankKeys.map(bank => [bank, new Set(manifest.banks[bank].excludedQuestionNums)]));
  return (bankKey: string, question: ClassifiedWastewaterQuestion): WastewaterMockArea | null => {
    if (!bankKeys.some(bank => bank === bankKey) || !Number.isSafeInteger(question.id) || question.id <= 0) return null;
    const bank = manifest.banks[bankKey as typeof bankKeys[number]];
    const entry = bank.entries[String(question.id)];
    // A recognized identity never falls back after a content edit: reclassify it.
    // Snapshot exclusions also cannot be resurrected by a chapter alias or an
    // unapproved generic objective. No question governance fields are mutated.
    if (entry) {
      return wastewaterMockContentSha256(question) === entry.sha256
        ? WASTEWATER_MOCK_AREAS[entry.area] : null;
    }
    if (excluded[bankKey].has(question.id)) return null;
    // Keep the established explicit-approved and exact legacy-area behavior
    // for identities outside this classified snapshot only; never guess text.
    return reviewedWastewaterMockArea(bankKey, question);
  };
}

/** Imported only by startMock; never practice, grading/history or client code. */
export const resolveWastewaterMockArea = createWastewaterMockAreaResolver(rawManifest);
