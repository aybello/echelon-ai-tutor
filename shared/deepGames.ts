import { z } from "zod";
import {
  deepNumericDecimalSchema, deepNumericUnitIdSchema, deepUnitFactorSchema, parseBoundedDecimal,
} from "./deepGameNumeric";

/** Additive contracts only: do not extend the classic six-game wire/engine. No course content lives here. */
export const deepGameModes = ["calculation-ladder", "build-process", "find-calculation-error", "evidence-detective", "exam-escape-room"] as const;
export const deepGameModeSchema = z.enum(deepGameModes);
export type DeepGameMode = z.infer<typeof deepGameModeSchema>;
export type TaskMode = Exclude<DeepGameMode, "exam-escape-room">;
export const deepPilotCourseKeySchema = z.enum(["oit", "class1-water"]);
export const deepContentCourseKeys = ["class1-wastewater-coll", "class1-water", "class1-water-dist", "class1-ww", "class2-wastewater-coll", "class2-water", "class2-water-dist", "class2-ww", "class3-wastewater-coll", "class3-water", "class3-water-dist", "class3-ww", "class4-wastewater-coll", "class4-water", "class4-water-dist", "class4-ww", "oit", "oit-ww", "wpi-class1-wastewater", "wpi-class1-water", "wpi-class1-water-coll", "wpi-class1-water-dist", "wpi-class2-wastewater", "wpi-class2-water", "wpi-class2-water-coll", "wpi-class2-water-dist", "wpi-class3-wastewater", "wpi-class3-water", "wpi-class3-water-coll", "wpi-class3-water-dist", "wpi-class4-wastewater", "wpi-class4-water", "wpi-class4-water-coll", "wpi-class4-water-dist", "wqa"] as const;
export const deepCourseKeySchema = z.enum(deepContentCourseKeys);
export const deepGameLimits = { tasks: 500, missions: 100, missionTasks: 4, sessionTasks: 10, options: 8, packageBytes: 2_097_152, sessionBytes: 131_072 } as const;
export const deepSafeIdSchema = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,79}$/);
const version = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,79}$/);
const text = (max: number) => z.string().min(1).max(max).refine(value => value.trim().length > 0, "Blank text");
const prompt = text(2000);
const explanation = text(2000);
const unique = (values: readonly string[]) => new Set(values).size === values.length;
const distinctLabels = (options: ReadonlyArray<{ label: string }>) => unique(options.map(option => option.label.normalize("NFKC").trim().replace(/\s+/gu, " ").toLowerCase()));
export const deepOptionSchema = z.object({ id: deepSafeIdSchema, label: text(300) }).strict();
const options = z.array(deepOptionSchema).min(2).max(8).refine(values => unique(values.map(value => value.id)) && distinctLabels(values), "Duplicate options");
export const deepChoiceStepSchema = z.object({
  id: deepSafeIdSchema, prompt, options, correctOptionId: deepSafeIdSchema, explanation,
}).strict().refine(step => step.options.some(option => option.id === step.correctOptionId), "Answer is not an option");
export type ChoiceStep = z.infer<typeof deepChoiceStepSchema>;

const nonnegativeDecimal = deepNumericDecimalSchema.refine(value => {
  const parsed = parseBoundedDecimal(value);
  return parsed !== null && parsed.numerator >= 0n;
}, "Invalid or negative tolerance");
export const deepNumericStepSchema = z.object({
  id: z.literal("result"), prompt,
  /** Missing toExpected on a non-target unit makes it a distractor, not a guessed conversion. */
  unitOptions: z.array(z.object({ id: deepNumericUnitIdSchema, label: text(300), toExpected: deepUnitFactorSchema.optional() }).strict()).min(1).max(8),
  expected: deepNumericDecimalSchema, expectedUnitId: deepNumericUnitIdSchema,
  absoluteTolerance: nonnegativeDecimal, relativeTolerance: nonnegativeDecimal.optional(), explanation,
}).strict().superRefine((step, ctx) => {
  if (!unique(step.unitOptions.map(unit => unit.id)) || !distinctLabels(step.unitOptions)) ctx.addIssue({ code: "custom", message: "Duplicate units" });
  const expectedUnit = step.unitOptions.find(unit => unit.id === step.expectedUnitId);
  if (!expectedUnit || (expectedUnit.toExpected && (!deepUnitFactorSchema.safeParse(expectedUnit.toExpected).success || BigInt(expectedUnit.toExpected.numerator) !== BigInt(expectedUnit.toExpected.denominator))))
    ctx.addIssue({ code: "custom", message: "Expected unit must exist with identity conversion" });
});
export type NumericStep = z.infer<typeof deepNumericStepSchema>;

const taskBase = {
  id: deepSafeIdSchema, revision: version, prompt, topicId: deepSafeIdSchema,
  level: z.enum(["oit", "class1"]), assumptions: prompt,
};
export const deepLadderTaskSchema = z.object({
  ...taskBase, mode: z.literal("calculation-ladder"),
  choices: z.tuple([
    deepChoiceStepSchema.refine(step => step.id === "formula", "First step ID must be formula"),
    deepChoiceStepSchema.refine(step => step.id === "units", "Second step ID must be units"),
    deepChoiceStepSchema.refine(step => step.id === "substitution", "Third step ID must be substitution"),
  ]), result: deepNumericStepSchema,
}).strict();
export const deepProcessTaskSchema = z.object({
  ...taskBase, mode: z.literal("build-process"), configuration: prompt,
  cards: options, correctOrder: z.array(deepSafeIdSchema).min(2).max(8), explanation,
}).strict().refine(task => task.correctOrder.length === task.cards.length && unique(task.correctOrder) && task.cards.every(card => task.correctOrder.includes(card.id)), "Order must be an exact card permutation");
export const deepErrorTaskSchema = z.object({
  ...taskBase, mode: z.literal("find-calculation-error"), lines: options,
  firstWrongLineId: deepSafeIdSchema, correctedLine: text(300), explanation,
}).strict().refine(task => task.lines.some(line => line.id === task.firstWrongLineId), "First wrong line must exist");
export const deepEvidenceTaskSchema = z.object({
  ...taskBase, mode: z.literal("evidence-detective"), evidence: z.array(deepOptionSchema).min(1).max(8),
  inference: deepChoiceStepSchema.refine(step => step.id === "inference", "Step ID must be inference"),
  nextClue: deepChoiceStepSchema.refine(step => step.id === "next-clue", "Step ID must be next-clue"),
  clueText: z.record(deepSafeIdSchema, explanation),
}).strict().superRefine((task, ctx) => {
  if (!unique(task.evidence.map(item => item.id))) ctx.addIssue({ code: "custom", message: "Duplicate evidence IDs" });
  const clueIds = Object.keys(task.clueText);
  if (clueIds.length !== task.nextClue.options.length || !task.nextClue.options.every(option => clueIds.includes(option.id)))
    ctx.addIssue({ code: "custom", message: "Provide exactly one authored clue per next-clue option" });
});
export const deepTaskSchema = z.discriminatedUnion("mode", [deepLadderTaskSchema, deepProcessTaskSchema, deepErrorTaskSchema, deepEvidenceTaskSchema]);
export type LadderTask = z.infer<typeof deepLadderTaskSchema>;
export type ProcessTask = z.infer<typeof deepProcessTaskSchema>;
export type ErrorTask = z.infer<typeof deepErrorTaskSchema>;
export type EvidenceTask = z.infer<typeof deepEvidenceTaskSchema>;
export type DeepTask = z.infer<typeof deepTaskSchema>;

export const deepEscapeMissionSchema = z.object({
  id: deepSafeIdSchema, revision: version, mode: z.literal("exam-escape-room"), title: text(300),
  tasks: z.array(z.object({ taskId: deepSafeIdSchema, revision: version, occurrenceId: deepSafeIdSchema }).strict()).min(2).max(4),
}).strict().refine(mission => unique(mission.tasks.map(task => task.occurrenceId)), "Duplicate mission occurrence IDs");
export type EscapeMission = z.infer<typeof deepEscapeMissionSchema>;

const packageCore = {
  courseKey: deepCourseKeySchema, version,
  tasks: z.array(deepTaskSchema).min(1).max(deepGameLimits.tasks), missions: z.array(deepEscapeMissionSchema).max(deepGameLimits.missions),
};
const sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const taskReceipt = z.object({ taskId: deepSafeIdSchema, revision: version, sha256, sourceIds: z.array(deepSafeIdSchema).min(1).max(12) }).strict();
const missionReceipt = z.object({ missionId: deepSafeIdSchema, revision: version, sha256 }).strict();
/** SERVER PUBLICATION ONLY. Structural validation is not cryptographic review verification.
 * Server must SHA-256 canonicalDeepPayload for each receipt and {courseKey,version,tasks,missions}
 * for packageSha256, and check byte limits before publishing. Never send this package to a browser.
 */
export const deepCoursePackageSchema = z.object({
  ...packageCore,
  sources: z.array(z.object({ id: deepSafeIdSchema, title: text(300), locator: text(2000), note: text(2000).optional() }).strict()).min(1).max(100),
  publication: z.object({
    published: z.literal(true), reviewedBy: text(200), reviewedAt: z.string().datetime({ offset: true }), packageSha256: sha256,
    taskReceipts: z.array(taskReceipt).min(1).max(deepGameLimits.tasks), missionReceipts: z.array(missionReceipt).max(deepGameLimits.missions),
  }).strict(),
}).strict().superRefine((data, ctx) => {
  const invalid = (message: string) => ctx.addIssue({ code: "custom", message });
  if (!unique(data.tasks.map(task => task.id)) || !unique(data.missions.map(mission => mission.id))) invalid("Duplicate authored IDs");
  if (data.missions.some(mission => data.tasks.some(task => task.id === mission.id))) invalid("Task and mission IDs must be distinct");
  const expectedLevel = data.courseKey === "oit" || data.courseKey === "oit-ww" ? "oit" : "class1";
  if (data.tasks.some(task => task.level !== expectedLevel)) invalid("Task level does not match explicit course");
  for (const mission of data.missions) for (const ref of mission.tasks)
    if (!data.tasks.some(task => task.id === ref.taskId && task.revision === ref.revision)) invalid("Mission reference missing or revised");
  if (!unique(data.sources.map(source => source.id))) invalid("Duplicate source IDs");
  const receipts = data.publication;
  if (receipts.taskReceipts.length !== data.tasks.length || !unique(receipts.taskReceipts.map(receipt => receipt.taskId)) || data.tasks.some(task => !receipts.taskReceipts.some(receipt => receipt.taskId === task.id && receipt.revision === task.revision))) invalid("Task review coverage mismatch");
  if (receipts.missionReceipts.length !== data.missions.length || !unique(receipts.missionReceipts.map(receipt => receipt.missionId)) || data.missions.some(mission => !receipts.missionReceipts.some(receipt => receipt.missionId === mission.id && receipt.revision === mission.revision))) invalid("Mission review coverage mismatch");
  for (const receipt of receipts.taskReceipts)
    if (!unique(receipt.sourceIds) || receipt.sourceIds.some(id => !data.sources.some(source => source.id === id))) invalid("Review source missing or duplicated");
});
export type DeepCoursePackage = z.infer<typeof deepCoursePackageSchema>;

/** Stable JSON for server SHA-256 receipts: sorted object keys, original array order, no undefined fields. */
export function canonicalDeepPayload(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalDeepPayload).join(",")}]`;
  if (typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).filter(key => object[key] !== undefined).sort().map(key => `${JSON.stringify(key)}:${canonicalDeepPayload(object[key])}`).join(",")}}`;
  }
  throw new TypeError("Expected a JSON payload");
}

// Requests accept bounded canonical-looking strings so unsupported courses can receive an unavailable catalog.
const requestedCourseKey = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/);
export const deepCatalogInputSchema = z.object({ courseKey: requestedCourseKey }).strict();
export const deepStartInputSchema = z.object({ courseKey: requestedCourseKey, mode: deepGameModeSchema, sessionSize: z.number().int().min(1).max(10), version: version.optional() }).strict();
export const deepCatalogResponseSchema = z.object({
  courseKey: requestedCourseKey, version: version.nullable(), available: z.boolean(),
  modes: z.array(z.object({ mode: deepGameModeSchema, title: text(100), count: z.number().int().min(1).max(deepGameLimits.tasks) }).strict()).max(5),
  authoredTaskCount: z.number().int().min(0).max(deepGameLimits.tasks), missionCount: z.number().int().min(0).max(deepGameLimits.missions),
}).strict().superRefine((catalog, ctx) => {
  const invalid = () => ctx.addIssue({ code: "custom", message: "Inconsistent catalog availability/counts" });
  if (!unique(catalog.modes.map(mode => mode.mode))) invalid();
  if (!catalog.available) {
    if (catalog.version !== null || catalog.modes.length || catalog.authoredTaskCount || catalog.missionCount) invalid();
  } else {
    if (!deepCourseKeySchema.safeParse(catalog.courseKey).success || !catalog.version || !catalog.modes.length) invalid();
    const taskCount = catalog.modes.filter(mode => mode.mode !== "exam-escape-room").reduce((sum, mode) => sum + mode.count, 0);
    const missionCount = catalog.modes.find(mode => mode.mode === "exam-escape-room")?.count ?? 0;
    if (taskCount !== catalog.authoredTaskCount || missionCount !== catalog.missionCount) invalid();
  }
});

/** Immutable server-selected occurrences. id is the tracking item/occurrence ID; task.id remains the source ID. */
export const deepTaskOccurrenceSchema = z.object({ id: deepSafeIdSchema, sourceId: deepSafeIdSchema, task: deepTaskSchema }).strict().refine(occurrence => occurrence.sourceId === occurrence.task.id, "Source ID mismatch");
export type DeepTaskOccurrence = z.infer<typeof deepTaskOccurrenceSchema>;
const activityTracking = z.union([
  z.object({ tracking: z.literal(true), sessionId: z.string().uuid(), capability: z.string().min(1).max(2048), nextSequence: z.number().int().min(2).max(3001), expiresAt: z.string().datetime({ offset: true }), source: z.literal("observed") }).strict(),
  z.object({ tracking: z.literal(false), recorded: z.literal(false), source: z.literal("observed") }).strict(),
]);
export const deepSessionResponseSchema = z.object({
  courseKey: deepCourseKeySchema, version, sessionId: deepSafeIdSchema, mode: deepGameModeSchema,
  tasks: z.array(deepTaskOccurrenceSchema).min(1).max(10),
  /** Reference-only mission plus the selected expanded occurrences, never an entire course bank. */
  mission: deepEscapeMissionSchema.optional(), activityTracking: activityTracking.optional(),
}).strict().superRefine((session, ctx) => {
  const invalid = (message: string) => ctx.addIssue({ code: "custom", message });
  if (!unique(session.tasks.map(task => task.id))) invalid("Duplicate session occurrence IDs");
  const expectedLevel = session.courseKey === "oit" || session.courseKey === "oit-ww" ? "oit" : "class1";
  if (session.tasks.some(item => item.task.level !== expectedLevel)) invalid("Session course/level mismatch");
  if (session.mode === "exam-escape-room") {
    if (!session.mission || session.tasks.length !== session.mission.tasks.length) invalid("One expanded mission required");
    else if (session.mission.tasks.some((ref, index) => {
      const occurrence = session.tasks[index];
      return ref.occurrenceId !== occurrence.id || ref.taskId !== occurrence.sourceId || ref.revision !== occurrence.task.revision;
    })) invalid("Mission occurrence/reference mismatch");
  } else if (session.mission || session.tasks.some(item => item.task.mode !== session.mode) || !unique(session.tasks.map(item => item.sourceId))) invalid("Ordinary session mode/source mismatch");
});
export type DeepCatalogInput = z.infer<typeof deepCatalogInputSchema>;
export type DeepStartInput = z.infer<typeof deepStartInputSchema>;
export type DeepCatalogResponse = z.infer<typeof deepCatalogResponseSchema>;
export type DeepSessionResponse = z.infer<typeof deepSessionResponseSchema>;
