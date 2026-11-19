import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  canonicalDeepPayload, deepCatalogResponseSchema, deepCoursePackageSchema, deepEscapeMissionSchema,
  deepNumericStepSchema, deepSessionResponseSchema, deepStartInputSchema, deepTaskSchema,
} from "./deepGames";

// Synthetic structural fixtures only, deliberately not real course material.
const base = { id: "test", revision: "r1", prompt: "Synthetic fixture", topicId: "test", level: "oit", assumptions: "Not authored learning content" };
const options = [{ id: "a", label: "Alpha" }, { id: "b", label: "Beta" }];
const choice = (id: string) => ({ id, prompt: "Synthetic decision", options, correctOptionId: "a", explanation: "Synthetic explanation" });
const numeric = { id: "result", prompt: "Synthetic number", unitOptions: [{ id: "u", label: "Unit" }], expected: "0", expectedUnitId: "u", absoluteTolerance: "0.1", explanation: "Synthetic numeric feedback" };
const ladder = { ...base, mode: "calculation-ladder", choices: [choice("formula"), choice("units"), choice("substitution")], result: numeric };
const process = { ...base, id: "process", mode: "build-process", configuration: "Synthetic configuration", cards: options, correctOrder: ["b", "a"], explanation: "Synthetic explanation" };
const error = { ...base, id: "error", mode: "find-calculation-error", lines: options, firstWrongLineId: "b", correctedLine: "Synthetic correction", explanation: "Synthetic explanation" };
const evidence = { ...base, id: "evidence", mode: "evidence-detective", evidence: options, inference: choice("inference"), nextClue: choice("next-clue"), clueText: { a: "First clue", b: "Second clue" } };
const mission = { id: "mission", revision: "r1", mode: "exam-escape-room", title: "Synthetic mission", tasks: [{ taskId: "test", revision: "r1", occurrenceId: "one" }, { taskId: "test", revision: "r1", occurrenceId: "two" }] };
const hash = (value: unknown) => createHash("sha256").update(canonicalDeepPayload(value)).digest("hex");
const core = { courseKey: "oit", version: "v1", tasks: [ladder, process, error, evidence], missions: [mission] };
const pkg = {
  ...core, sources: [{ id: "source", title: "Synthetic reference", locator: "private-fixture-location" }],
  publication: { published: true, reviewedBy: "Fixture only", reviewedAt: "2026-11-19T00:00:00Z", packageSha256: hash(core), taskReceipts: core.tasks.map(task => ({ taskId: task.id, revision: task.revision, sha256: hash(task), sourceIds: ["source"] })), missionReceipts: [{ missionId: mission.id, revision: mission.revision, sha256: hash(mission) }] },
};
const session = { courseKey: "oit", version: "v1", sessionId: "session", mode: "calculation-ladder", tasks: [{ id: "one", sourceId: "test", task: ladder }] };
const escapeSession = { ...session, mode: "exam-escape-room", mission, tasks: mission.tasks.map(ref => ({ id: ref.occurrenceId, sourceId: ref.taskId, task: ladder })) };

describe("strict additive deep task contracts", () => {
  it.each([ladder, process, error, evidence])("accepts each of four task variants %#", task => {
    expect(deepTaskSchema.safeParse(task).success).toBe(true);
    expect(deepTaskSchema.safeParse({ ...task, privateReceipt: "forbidden" }).success).toBe(false);
  });
  it("does not create a fifth cloned escape task variant", () => {
    expect(deepTaskSchema.safeParse(mission).success).toBe(false);
    expect(deepEscapeMissionSchema.safeParse(mission).success).toBe(true);
  });
  it("locks ladder tuple step aliases and authored choice membership", () => {
    for (const choices of [[choice("units"), choice("formula"), choice("substitution")], [choice("formula"), choice("units")], [choice("formula"), choice("units"), { ...choice("substitution"), correctOptionId: "missing" }]])
      expect(deepTaskSchema.safeParse({ ...ladder, choices }).success).toBe(false);
  });
  it("requires exact process permutations and unique options", () => {
    for (const correctOrder of [["a", "a"], ["a"], ["a", "unknown"], ["a", "b", "a"]])
      expect(deepTaskSchema.safeParse({ ...process, correctOrder }).success).toBe(false);
    expect(deepTaskSchema.safeParse({ ...process, cards: [{ id: "a", label: "Alpha" }, { id: "b", label: " ＡＬＰＨＡ " }] }).success).toBe(false);
  });
  it("requires an existing first wrong line and complete independently authored clues", () => {
    expect(deepTaskSchema.safeParse({ ...error, firstWrongLineId: "missing" }).success).toBe(false);
    for (const clueText of [{ a: "One" }, { a: "One", b: "Two", c: "Extra" }])
      expect(deepTaskSchema.safeParse({ ...evidence, clueText }).success).toBe(false);
    expect(deepTaskSchema.safeParse({ ...evidence, inference: choice("next-clue") }).success).toBe(false);
  });
  it("rejects malformed tolerance policies safely without throwing", () => {
    for (const absoluteTolerance of ["-1", "1e-3", "NaN", "", "Infinity", "1\n"])
      expect(deepNumericStepSchema.safeParse({ ...numeric, absoluteTolerance }).success).toBe(false);
    for (const expectedUnitId of ["missing", "wrong\n"])
      expect(deepNumericStepSchema.safeParse({ ...numeric, expectedUnitId }).success).toBe(false);
    for (const toExpected of [{ numerator: "1", denominator: "0" }, { numerator: "bad", denominator: "1" }, { numerator: "2", denominator: "1" }])
      expect(deepNumericStepSchema.safeParse({ ...numeric, unitOptions: [{ id: "u", label: "Unit", toExpected }] }).success).toBe(false);
    expect(deepNumericStepSchema.safeParse({ ...numeric, relativeTolerance: "-0.1" }).success).toBe(false);
    expect(deepNumericStepSchema.safeParse({ ...numeric, expected: "-1", absoluteTolerance: "0" }).success).toBe(true);
  });
});

describe("server publication and reference-only mission boundaries", () => {
  it("requires explicit pilot metadata, review/source coverage and exact task revisions", () => {
    expect(deepCoursePackageSchema.safeParse(pkg).success).toBe(true);
    for (const courseKey of ["electrician-309a", "class2-water", "wastewater", "class1-water"])
      expect(deepCoursePackageSchema.safeParse({ ...pkg, courseKey }).success).toBe(false);
    expect(deepCoursePackageSchema.safeParse({ ...pkg, publication: { ...pkg.publication, published: false } }).success).toBe(false);
    expect(deepCoursePackageSchema.safeParse({ ...pkg, publication: { ...pkg.publication, taskReceipts: [] } }).success).toBe(false);
    expect(deepCoursePackageSchema.safeParse({ ...pkg, sources: [] }).success).toBe(false);
    expect(deepCoursePackageSchema.safeParse({ ...pkg, publication: { ...pkg.publication, packageSha256: "not-a-sha" } }).success).toBe(false);
    expect(deepCoursePackageSchema.safeParse({ ...pkg, publication: { ...pkg.publication, missionReceipts: [] } }).success).toBe(false);
    expect(deepCoursePackageSchema.safeParse({ ...pkg, tasks: [ladder, ladder] }).success).toBe(false);
  });
  it("permits repeated references with separate occurrences, not missing/revised/nested missions", () => {
    for (const taskId of ["missing", "mission"])
      expect(deepCoursePackageSchema.safeParse({ ...pkg, missions: [{ ...mission, tasks: mission.tasks.map(ref => ({ ...ref, taskId })) }] }).success).toBe(false);
    expect(deepCoursePackageSchema.safeParse({ ...pkg, missions: [{ ...mission, tasks: mission.tasks.map(ref => ({ ...ref, revision: "r2" })) }] }).success).toBe(false);
    for (const tasks of [[mission.tasks[0]], [mission.tasks[0], mission.tasks[0]], [...mission.tasks, ...mission.tasks, { ...mission.tasks[0], occurrenceId: "five" }]])
      expect(deepEscapeMissionSchema.safeParse({ ...mission, tasks }).success).toBe(false);
  });
  it("canonical hashes bind exact authored payloads independently of object key insertion order", () => {
    expect(canonicalDeepPayload({ b: [2, 1], a: "x", optional: undefined })).toBe('{"a":"x","b":[2,1]}');
    expect(hash({ a: 1, b: 2 })).toBe(hash({ b: 2, a: 1 }));
    expect(hash(ladder)).not.toBe(hash({ ...ladder, prompt: "Changed exact payload" }));
    expect(hash(mission)).not.toBe(hash({ ...mission, tasks: [...mission.tasks].reverse() }));
    for (const value of [NaN, Infinity, 1n, undefined, new Date()]) expect(() => canonicalDeepPayload(value)).toThrow();
  });
});

describe("strict public catalog/start and selected snapshots", () => {
  it("only accepts bounded strict starts, including unsupported requests for server fail-closed handling", () => {
    const start = { courseKey: "oit", mode: "calculation-ladder", sessionSize: 1 };
    expect(deepStartInputSchema.safeParse(start).success).toBe(true);
    expect(deepStartInputSchema.safeParse({ ...start, courseKey: "electrician-309a" }).success).toBe(true);
    for (const sessionSize of [0, 11, 1.5, "1", undefined]) expect(deepStartInputSchema.safeParse({ ...start, sessionSize }).success).toBe(false);
    expect(deepStartInputSchema.safeParse({ ...start, mode: "build-the-process" }).success).toBe(false);
    expect(deepStartInputSchema.safeParse({ ...start, tasks: [ladder] }).success).toBe(false);
  });
  it("reports authored tasks separately from reference missions and never reserves empty modes", () => {
    const catalog = { courseKey: "oit", version: "v1", available: true, modes: [{ mode: "calculation-ladder", title: "Calculation", count: 1 }, { mode: "exam-escape-room", title: "Mission", count: 1 }], authoredTaskCount: 1, missionCount: 1 };
    expect(deepCatalogResponseSchema.safeParse(catalog).success).toBe(true);
    expect(deepCatalogResponseSchema.safeParse({ ...catalog, authoredTaskCount: 3 }).success).toBe(false);
    expect(deepCatalogResponseSchema.safeParse({ ...catalog, available: false }).success).toBe(false);
    expect(deepCatalogResponseSchema.safeParse({ ...catalog, modes: [{ ...catalog.modes[0], count: 0 }] }).success).toBe(false);
    expect(deepCatalogResponseSchema.safeParse({ courseKey: "electrician-309a", version: null, available: false, modes: [], authoredTaskCount: 0, missionCount: 0 }).success).toBe(true);
  });
  it("includes only selected public task keys and rejects private package fields", () => {
    expect(deepSessionResponseSchema.safeParse(session).success).toBe(true);
    for (const field of ["sources", "publication", "taskReceipts", "bank", "privatePath"])
      expect(deepSessionResponseSchema.safeParse({ ...session, [field]: pkg.sources }).success).toBe(false);
    expect(deepSessionResponseSchema.safeParse({ ...session, tasks: [{ ...session.tasks[0], sourceId: "other" }] }).success).toBe(false);
    expect(deepSessionResponseSchema.safeParse({ ...session, tasks: [...session.tasks, session.tasks[0]] }).success).toBe(false);
    expect(deepSessionResponseSchema.safeParse({ ...session, mode: "evidence-detective" }).success).toBe(false);
    expect(deepSessionResponseSchema.safeParse({ ...session, courseKey: "class1-water" }).success).toBe(false);
    expect(deepSessionResponseSchema.safeParse({ ...session, tasks: [] }).success).toBe(false);
  });
  it("validates mission expansion exact order/occurrence/source/revision without counting cloned authorship", () => {
    expect(deepSessionResponseSchema.safeParse(escapeSession).success).toBe(true);
    expect(deepSessionResponseSchema.safeParse({ ...escapeSession, mission: undefined }).success).toBe(false);
    expect(deepSessionResponseSchema.safeParse({ ...escapeSession, tasks: [...escapeSession.tasks].reverse() }).success).toBe(false);
    expect(deepSessionResponseSchema.safeParse({ ...escapeSession, tasks: [{ ...escapeSession.tasks[0], task: { ...ladder, revision: "r2" } }, escapeSession.tasks[1]] }).success).toBe(false);
    expect(deepSessionResponseSchema.safeParse({ ...session, mission }).success).toBe(false);
  });
});
