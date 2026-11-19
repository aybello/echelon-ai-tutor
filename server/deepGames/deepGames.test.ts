import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { build } from "esbuild";
import {
  canonicalDeepPayload, deepGameModes, deepSessionResponseSchema,
  type DeepCoursePackage, type DeepTask, type DeepSessionResponse,
} from "../../shared/deepGames";
import { assessmentActivityIssueSchema } from "../../shared/assessmentActivity";
import { DEEP_REVIEW_AUTHORITY, deepJsonBytes, deepPayloadSha256, validateDeepCoursePackage, validateDeepSessionResponse } from "./schema";
import { createDeepCourseRegistry, deepContentModuleUrls, isDeepCourseSupported } from "./registry";
import { createDeepGameService, DeepGameUnavailableError, DeepGameVersionError, getDeepCatalog, startDeepSession } from "./service";
import { deepAssessmentIssue } from "./tracking";
import { deepGamesRouter } from "../routers/deepGamesRouter";
import { router } from "../_core/trpc";
import type { TrpcContext } from "../_core/context";
import { assessmentActivityAllowed, issueAssessmentActivity } from "../assessmentActivity";
import { resolveVerifiedIdentity } from "../_core/accessService";
import { resolveAttemptAttribution } from "../teams/attemptAttribution";
import { issueSubscriptionToken } from "../_core/subscriptionToken";

// Synthetic private test data ONLY. These receipts do not assert that the fixtures
// were authored or reviewed by Hydrogen, and must never be imported by release content.
vi.mock("../_core/env", () => ({ ENV: { cookieSecret: "fixture-deep-games-only" } }));
vi.mock("../db", () => ({ getDb: vi.fn(() => { throw Error("No database in deep-game tests"); }) }));
vi.mock("../_core/access", () => ({ normalizeEmail: (value?: string | null) => (value ?? "").trim().toLowerCase() }));
vi.mock("../_core/accessService", () => ({ resolveVerifiedIdentity: vi.fn() }));
vi.mock("../teams/attemptAttribution", () => ({
  PERSONAL_ATTRIBUTION: { orgId: null, organizationMemberId: null, flexLicenceId: null },
  resolveAttemptAttribution: vi.fn(),
}));
vi.mock("../assessmentActivity", async original => ({
  ...await original<typeof import("../assessmentActivity")>(), issueAssessmentActivity: vi.fn(),
}));
vi.mock("./service", async original => ({
  ...await original<typeof import("./service")>(), getDeepCatalog: vi.fn(), startDeepSession: vi.fn(),
}));

const sessionId = "00000000-0000-4000-8000-000000000001";
const notRecorded = { tracking: false as const, recorded: false as const, source: "observed" as const };
const personal = { orgId: null, organizationMemberId: null, flexLicenceId: null };
const source = { id: "fixture-source", title: "Private synthetic unit-test source", locator: "fixture:not-release-content" };
const options = [{ id: "a", label: "Alpha" }, { id: "b", label: "Beta" }];
const choice = (id: string) => ({ id, prompt: `Choose at ${id}`, options: structuredClone(options), correctOptionId: "b", explanation: "PRIVATE_CORRECTION" });
function tasks(): DeepTask[] {
  const base = { revision: "r1", prompt: "Synthetic task", topicId: "fixture-topic", level: "oit" as const, assumptions: "A stated fictional classroom assumption." };
  return [
    { ...base, id: "ladder", mode: "calculation-ladder", choices: [choice("formula"), choice("units"), choice("substitution")],
      result: { id: "result", prompt: "Enter the fictional result in litres, exact to the stated unit.", expected: "938.25", expectedUnitId: "L", absoluteTolerance: "0.01", explanation: "PRIVATE_CORRECTION", unitOptions: [{ id: "L", label: "Litres" }, { id: "mL", label: "Millilitres", toExpected: { numerator: "1", denominator: "1000" } }] } },
    { ...base, id: "process", mode: "build-process", configuration: "Only this specified fictional train applies.", cards: structuredClone(options), correctOrder: ["b", "a"], explanation: "PRIVATE_CORRECTION" },
    { ...base, id: "error", mode: "find-calculation-error", lines: structuredClone(options), firstWrongLineId: "b", correctedLine: "PRIVATE_CORRECTED_LINE", explanation: "PRIVATE_CORRECTION" },
    { ...base, id: "evidence", mode: "evidence-detective", evidence: [{ id: "obs", label: "An explicitly fictional observation." }], inference: choice("inference"), nextClue: choice("next-clue"), clueText: { a: "PRIVATE_CLUE_A", b: "PRIVATE_CLUE_B" } },
  ];
}
function restamp(data: DeepCoursePackage): DeepCoursePackage {
  data.publication.packageSha256 = deepPayloadSha256({ courseKey: data.courseKey, version: data.version, tasks: data.tasks, missions: data.missions });
  data.publication.taskReceipts = data.tasks.map(task => ({ taskId: task.id, revision: task.revision, sha256: deepPayloadSha256(task), sourceIds: [source.id] }));
  data.publication.missionReceipts = data.missions.map(mission => ({ missionId: mission.id, revision: mission.revision, sha256: deepPayloadSha256(mission) }));
  return data;
}
function fixture(courseKey: DeepCoursePackage["courseKey"] = "oit"): DeepCoursePackage {
  const authored = tasks().map(task => ({ ...task, level: courseKey === "oit" ? "oit" as const : "class1" as const }));
  return restamp({
    courseKey, version: "fixture-v1", tasks: authored,
    missions: [{ id: "mission", revision: "r1", mode: "exam-escape-room", title: "Synthetic reference-only mission", tasks: authored.map((task, index) => ({ taskId: task.id, revision: task.revision, occurrenceId: `stage:${index}` })) }],
    sources: [structuredClone(source)],
    publication: { published: true, reviewedBy: DEEP_REVIEW_AUTHORITY, reviewedAt: "2026-11-19T00:00:00.000Z", packageSha256: "0".repeat(64), taskReceipts: [], missionReceipts: [] },
  });
}
function serviceFor(data = fixture(), randomIndex = () => 0) {
  const checked = validateDeepCoursePackage(data);
  return createDeepGameService({ loadCourse: async () => checked, randomIndex, newSessionId: () => sessionId });
}
async function delivered(mode: DeepSessionResponse["mode"] = "calculation-ladder", data = fixture()) {
  return serviceFor(data).startDeepSession({ courseKey: data.courseKey, mode, sessionSize: 10 });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(resolveVerifiedIdentity).mockImplementation(ctx => ctx.user ? { type: "oauth", userId: ctx.user.id, email: ctx.user.email ?? "", user: { id: ctx.user.id, email: ctx.user.email ?? "" } } : ctx.studentEmail ? { type: "otp", email: ctx.studentEmail } : { type: "anonymous" });
  vi.mocked(resolveAttemptAttribution).mockResolvedValue(personal);
  vi.mocked(issueAssessmentActivity).mockResolvedValue(notRecorded);
});

describe("deep publication integrity (private synthetic fixtures)", () => {
  it.each(["oit", "class1-water"] as const)("accepts a strict self-consistent %s package and deeply freezes it", courseKey => {
    const data = validateDeepCoursePackage(fixture(courseKey), courseKey);
    expect(Object.isFrozen(data)).toBe(true);
    expect(Object.isFrozen(data.tasks[0])).toBe(true);
    expect(Object.isFrozen(data.publication.taskReceipts)).toBe(true);
  });
  it("canonicalizes object key order but retains array order and SHA-256 semantics", () => {
    expect(canonicalDeepPayload({ z: [2, 1], a: { b: 2, a: 1 } })).toBe('{"a":{"a":1,"b":2},"z":[2,1]}');
    expect(deepPayloadSha256({ a: 1, b: 2 })).toBe(deepPayloadSha256({ b: 2, a: 1 }));
    expect(deepPayloadSha256([1, 2])).not.toBe(deepPayloadSha256([2, 1]));
  });
  it.each([
    ["task payload", (data: DeepCoursePackage) => { data.tasks[0].prompt += " changed"; }],
    ["mission payload", (data: DeepCoursePackage) => { data.missions[0].title += " changed"; }],
    ["core version", (data: DeepCoursePackage) => { data.version += "-changed"; }],
    ["package digest", (data: DeepCoursePackage) => { data.publication.packageSha256 = "f".repeat(64); }],
    ["task digest", (data: DeepCoursePackage) => { data.publication.taskReceipts[0].sha256 = "f".repeat(64); }],
    ["mission digest", (data: DeepCoursePackage) => { data.publication.missionReceipts[0].sha256 = "f".repeat(64); }],
    ["review authority", (data: DeepCoursePackage) => { data.publication.reviewedBy = "gemini-4-hydrogen"; }],
    ["source alias", (data: DeepCoursePackage) => { data.publication.taskReceipts[0].sourceIds = ["other-source"]; }],
    ["unused source", (data: DeepCoursePackage) => { data.sources.push({ ...source, id: "unused" }); }],
    ["missing receipt", (data: DeepCoursePackage) => { data.publication.taskReceipts.pop(); }],
    ["receipt revision", (data: DeepCoursePackage) => { data.publication.taskReceipts[0].revision = "r2"; }],
  ] as const)("rejects tampered %s", (_, mutate) => {
    const data = fixture(); mutate(data); expect(() => validateDeepCoursePackage(data)).toThrow();
  });
  it("rejects course mismatch, extra keys, false publication and mismatched course level", () => {
    expect(() => validateDeepCoursePackage(fixture(), "class1-water")).toThrow();
    expect(() => validateDeepCoursePackage({ ...fixture(), privatePath: "/private/file" })).toThrow();
    const data = fixture(); data.publication.published = false as true;
    expect(() => validateDeepCoursePackage(data)).toThrow();
    const mixed = fixture(); mixed.tasks[0].level = "class1"; restamp(mixed);
    expect(() => validateDeepCoursePackage(mixed)).toThrow();
  });
  it.each(["missing", "revised", "mission-reference"])("rejects %s mission references even with recomputed hashes", reason => {
    const data = fixture();
    if (reason === "revised") data.missions[0].tasks[0].revision = "r2";
    else data.missions[0].tasks[0].taskId = reason === "missing" ? "not-in-course" : "mission";
    restamp(data); expect(() => validateDeepCoursePackage(data)).toThrow();
  });
  it("rejects duplicate IDs, repeated occurrence IDs and malformed card permutations", () => {
    const duplicate = fixture(); duplicate.tasks[1].id = duplicate.tasks[0].id; restamp(duplicate);
    expect(() => validateDeepCoursePackage(duplicate)).toThrow();
    const occurrence = fixture(); occurrence.missions[0].tasks[1].occurrenceId = occurrence.missions[0].tasks[0].occurrenceId; restamp(occurrence);
    expect(() => validateDeepCoursePackage(occurrence)).toThrow();
    const process = fixture(); const task = process.tasks[1];
    if (task.mode !== "build-process") throw Error("fixture"); task.correctOrder = ["a", "a"]; restamp(process);
    expect(() => validateDeepCoursePackage(process)).toThrow();
  });
  it("enforces package bytes using actual UTF-8, not JavaScript string length", () => {
    const data = fixture(); data.sources = Array.from({ length: 100 }, (_, index) => ({ id: `source-${index}`, title: "表".repeat(300), locator: "表".repeat(2000), note: "表".repeat(2000) }));
    expect(JSON.stringify(data).length).toBeLessThan(1_048_576);
    expect(deepJsonBytes(data)).toBeGreaterThan(1_048_576);
    expect(() => validateDeepCoursePackage(data)).toThrow("byte limit");
  });
  it("rejects tracking text overflow rather than truncating visible authored assumptions", () => {
    const data = fixture(); data.tasks[0].prompt = "p".repeat(1800); data.tasks[0].assumptions = "a".repeat(400); restamp(data);
    expect(() => validateDeepCoursePackage(data)).toThrow();
    const longStep = fixture(); const task = longStep.tasks[0];
    if (task.mode !== "calculation-ladder") throw Error("fixture"); task.result.prompt = "p".repeat(301); restamp(longStep);
    expect(() => validateDeepCoursePackage(longStep)).toThrow();
  });
  it("rejects any possible 10-task session exceeding actual response bytes before publication", () => {
    const data = fixture(); const task = data.tasks[0];
    if (task.mode !== "calculation-ladder") throw Error("fixture");
    task.choices.forEach(step => { step.explanation = "表".repeat(2000); });
    task.result.explanation = "表".repeat(2000);
    data.tasks = Array.from({ length: 10 }, (_, index) => ({ ...structuredClone(task), id: `large-${index}` }));
    data.missions = []; restamp(data);
    expect(deepJsonBytes(data)).toBeLessThan(1_048_576);
    expect(() => validateDeepCoursePackage(data)).toThrow("session byte limit");
  });
});

describe("fixed-map native registry", () => {
  it("resolves source and bundled production imports from module location, never cwd", () => {
    expect(deepContentModuleUrls("file:///workspace/server/deepGames/registry.ts")).toEqual({ oit: "file:///workspace/server/deepGames/content/oit.ts", "class1-water": "file:///workspace/server/deepGames/content/class1-water.ts" });
    expect(deepContentModuleUrls("file:///release/dist/index.js")).toEqual({ oit: "file:///release/dist/deep-game-content/oit.js", "class1-water": "file:///release/dist/deep-game-content/class1-water.js" });
    expect(() => deepContentModuleUrls("https://example.test/index.js")).toThrow();
    expect(() => deepContentModuleUrls("file:///unexpected/registry.js")).toThrow();
  });
  it.each(["electrician-309a", "electrician-309a-demo", "class1", "class1-ww", "oit-ww", "wpi-class1-water", "us-class1-water", "unknown", "../oit", "__proto__", "constructor"])("does not import excluded/alias/unsafe course %s", async courseKey => {
    const importModule = vi.fn(); const registry = createDeepCourseRegistry({ importModule });
    expect(isDeepCourseSupported(courseKey)).toBe(false);
    expect(await registry.loadDeepCourse(courseKey)).toBeNull();
    expect(importModule).not.toHaveBeenCalled();
  });
  it("loads only the requested pilot, deduplicates concurrent calls and caches at most the two pilots", async () => {
    const importModule = vi.fn(async (url: string) => ({ default: fixture(url.includes("class1-water") ? "class1-water" : "oit") }));
    const registry = createDeepCourseRegistry({ importModule, moduleUrl: "file:///release/dist/index.js" });
    const [first, same] = await Promise.all([registry.loadDeepCourse("oit"), registry.loadDeepCourse("oit")]);
    expect(first).toBe(same); expect(importModule).toHaveBeenCalledTimes(1);
    expect(importModule).toHaveBeenCalledWith("file:///release/dist/deep-game-content/oit.js");
    await registry.loadDeepCourse("class1-water"); await registry.loadDeepCourse("oit");
    expect(importModule).toHaveBeenCalledTimes(2);
  });
  it("never caches invalid, wrong-course or failed modules, and redacts internal errors", async () => {
    const importModule = vi.fn().mockRejectedValueOnce(Error("/private/path WITH_ANSWERS"))
      .mockResolvedValueOnce({ default: fixture("class1-water") }).mockResolvedValue({ default: fixture() });
    const registry = createDeepCourseRegistry({ importModule });
    await expect(registry.loadDeepCourse("oit")).rejects.toThrow(/^Deep course content is unavailable$/);
    await expect(registry.loadDeepCourse("oit")).rejects.toThrow(/^Deep course content is unavailable$/);
    expect((await registry.loadDeepCourse("oit"))?.courseKey).toBe("oit");
    expect(importModule).toHaveBeenCalledTimes(3);
  });
  it("bundles registry without statically including either authored content module", async () => {
    const built = await build({ entryPoints: ["server/deepGames/registry.ts"], bundle: true, platform: "node", format: "esm", write: false, metafile: true });
    expect(Object.keys(built.metafile!.inputs).some(path => /deepGames\/content\//.test(path))).toBe(false);
    expect(built.outputFiles![0].text).toMatch(/import\(/);
  });
});

describe("bounded catalog, public snapshots and exact mission expansion", () => {
  it.each(["oit", "class1-water"] as const)("reports exact positive counts and starts all five %s modes", async courseKey => {
    const service = serviceFor(fixture(courseKey));
    expect(await service.getDeepCatalog(courseKey)).toMatchObject({ available: true, authoredTaskCount: 4, missionCount: 1, modes: deepGameModes.map(mode => ({ mode, count: 1 })) });
    for (const mode of deepGameModes) {
      const session = await service.startDeepSession({ courseKey, mode, sessionSize: 10 });
      expect(deepSessionResponseSchema.safeParse(session).success).toBe(true);
      expect(session.tasks.length).toBe(mode === "exam-escape-room" ? 4 : 1);
      expect(Object.isFrozen(session.tasks[0].task)).toBe(true);
      expect(deepJsonBytes(session)).toBeLessThan(131_072);
      const json = JSON.stringify(session);
      for (const key of ["sources", "publication", "taskReceipts", "missionReceipts", "packageSha256", "fixture:not-release-content", "reviewedBy", "sourceIds"]) expect(json).not.toContain(key);
    }
  });
  it("reports unavailable for unsupported courses or corrupt/unpublished loads, never empty mode buttons", async () => {
    const load = vi.fn(async () => { throw Error("private failure"); });
    const service = createDeepGameService({ loadCourse: load });
    for (const courseKey of ["electrician-309a", "class1", "oit-ww", "us-class1-water", "unknown"]) {
      expect(await service.getDeepCatalog(courseKey)).toEqual({ courseKey, available: false, version: null, modes: [], authoredTaskCount: 0, missionCount: 0 });
      await expect(service.startDeepSession({ courseKey, mode: "build-process", sessionSize: 1 })).rejects.toBeInstanceOf(DeepGameUnavailableError);
    }
    expect(load).not.toHaveBeenCalled();
    expect(await service.getDeepCatalog("oit")).toMatchObject({ available: false, modes: [] });
    await expect(service.startDeepSession({ courseKey: "oit", mode: "build-process", sessionSize: 1 })).rejects.toBeInstanceOf(DeepGameUnavailableError);
  });
  it("omits modes with zero content and refuses stale versions", async () => {
    const data = fixture(); data.tasks = [data.tasks[1]]; data.missions = []; restamp(data);
    const service = serviceFor(data);
    expect((await service.getDeepCatalog("oit")).modes).toEqual([{ mode: "build-process", title: "Build the Process", count: 1 }]);
    await expect(service.startDeepSession({ courseKey: "oit", mode: "build-process", sessionSize: 1, version: "stale" })).rejects.toBeInstanceOf(DeepGameVersionError);
    await expect(service.startDeepSession({ courseKey: "oit", mode: "exam-escape-room", sessionSize: 1 })).rejects.toBeInstanceOf(DeepGameUnavailableError);
  });
  it("samples at most ten distinct same-mode tasks without replacement and preserves original aliases", async () => {
    const data = fixture(); const process = data.tasks[1];
    data.tasks = Array.from({ length: 15 }, (_, index) => ({ ...structuredClone(process), id: `process-${index}` })); data.missions = []; restamp(data);
    const service = serviceFor(data, () => 0);
    const first = await service.startDeepSession({ courseKey: "oit", mode: "build-process", sessionSize: 10 });
    expect(first.tasks).toHaveLength(10); expect(new Set(first.tasks.map(item => item.sourceId)).size).toBe(10);
    expect(first.tasks.map(item => item.id)).toEqual(Array.from({ length: 10 }, (_, index) => `item:${index}`));
    const task = first.tasks[0].task;
    if (task.mode !== "build-process") throw Error("fixture"); expect(task.cards).toEqual(options);
    await expect(service.startDeepSession({ courseKey: "oit", mode: "build-process", sessionSize: 11 })).rejects.toThrow();
    await expect(service.startDeepSession({ courseKey: "../oit", mode: "build-process", sessionSize: 1 })).rejects.toThrow();
  });
  it("expands exactly one mission and disambiguates repeated sources without inventing authored counts", async () => {
    const data = fixture(); const ref = data.missions[0].tasks[0];
    data.missions[0].tasks = [{ ...ref, occurrenceId: "repeat:0" }, { ...ref, occurrenceId: "repeat:1" }]; restamp(data);
    const service = serviceFor(data);
    const session = await service.startDeepSession({ courseKey: "oit", mode: "exam-escape-room", sessionSize: 10 });
    expect(session.tasks.map(item => item.id)).toEqual(["repeat:0", "repeat:1"]);
    expect(session.tasks.map(item => item.sourceId)).toEqual([ref.taskId, ref.taskId]);
    expect((await service.getDeepCatalog("oit")).authoredTaskCount).toBe(4);
    expect(deepAssessmentIssue(session).items).toHaveLength(2);
  });
  it("rejects cross-course loader injection and malformed RNG", async () => {
    const wrong = createDeepGameService({ loadCourse: async () => fixture("class1-water") });
    expect((await wrong.getDeepCatalog("oit")).available).toBe(false);
    await expect(wrong.startDeepSession({ courseKey: "oit", mode: "build-process", sessionSize: 1 })).rejects.toThrow();
    await expect(serviceFor(fixture(), () => -1).startDeepSession({ courseKey: "oit", mode: "build-process", sessionSize: 1 })).rejects.toThrow();
  });
});

describe("observation-only tracking snapshots", () => {
  it.each(deepGameModes)("preserves stable %s aliases and visible assumptions, never corrective answers or private metadata", async mode => {
    const session = await delivered(mode); const issue = deepAssessmentIssue(session);
    expect(assessmentActivityIssueSchema.safeParse(issue).success).toBe(true);
    expect(issue).toMatchObject({ courseKey: "oit", mode, timed: false, sourceSessionId: sessionId });
    for (const item of issue.items) {
      expect(item.prompt).toContain("Assumptions: A stated fictional classroom assumption.");
      expect(item.title).toContain("@r1"); expect(item.steps!.length).toBeLessThanOrEqual(24);
      expect(item.steps!.every(step => step.options!.length <= 24)).toBe(true);
    }
    const json = JSON.stringify(issue);
    for (const forbidden of ["correctOptionId", "correctOrder", "firstWrongLineId", "correctedLine", "expected", "absoluteTolerance", "relativeTolerance", "toExpected", "PRIVATE_CORRECTION", "PRIVATE_CORRECTED_LINE", "PRIVATE_CLUE_", "938.25", "publication", "sourceIds"]) expect(json).not.toContain(forbidden);
  });
  it("uses formula/units/substitution/result and only allowed unit labels in numeric descriptors", async () => {
    const item = deepAssessmentIssue(await delivered()).items[0];
    expect(item.steps!.map(step => step.id)).toEqual(["formula", "units", "substitution", "result"]);
    expect(item.steps![3]).toEqual({ id: "result", label: "Enter the fictional result in litres, exact to the stated unit.", options: [], response: { kind: "numeric", unitOptions: [{ id: "L", label: "Litres" }, { id: "mL", label: "Millilitres" }] } });
  });
  it("uses original process cards, first-error and evidence decision aliases", async () => {
    const process = deepAssessmentIssue(await delivered("build-process")).items[0];
    expect(process.prompt).toContain("Only this specified fictional train applies.");
    expect(process.steps!.map(step => step.id)).toEqual(["slot:0", "slot:1"]);
    expect(process.steps![0].options).toEqual([{ id: "a", text: "Alpha" }, { id: "b", text: "Beta" }]);
    expect(deepAssessmentIssue(await delivered("find-calculation-error")).items[0].steps!.map(step => step.id)).toEqual(["first-error"]);
    const evidence = deepAssessmentIssue(await delivered("evidence-detective")).items[0];
    expect(evidence.steps!.map(step => step.id)).toEqual(["inference", "next-clue"]);
    expect(evidence.prompt).toContain("An explicitly fictional observation.");
  });
  it("strictly rejects public metadata injection and non-mission/mission revision mixing", async () => {
    const session = await delivered();
    expect(() => validateDeepSessionResponse({ ...session, sources: [source] })).toThrow();
    expect(() => validateDeepSessionResponse({ ...session, mission: fixture().missions[0] })).toThrow();
    const mission = structuredClone(await delivered("exam-escape-room")); mission.tasks[0].task.revision = "r2";
    expect(() => validateDeepSessionResponse(mission)).toThrow();
  });
});

const setHeader = vi.fn();
const context = (headers: Record<string, string | undefined> = {}, studentEmail: string | null = null, user: TrpcContext["user"] = null) => ({ user, studentEmail, req: { headers }, res: { setHeader } }) as unknown as TrpcContext;
const httpRouter = router({ deepGames: deepGamesRouter });
function request(method: "GET" | "POST", procedure: string, input: unknown, ctx = context()) {
  const body = JSON.stringify({ json: input });
  return fetchRequestHandler({ endpoint: "/api/trpc", router: httpRouter, createContext: () => ctx,
    req: new Request(`http://localhost/api/trpc/deepGames.${procedure}${method === "GET" ? `?input=${encodeURIComponent(body)}` : ""}`, method === "POST" ? { method, headers: { "content-type": "application/json" }, body } : { method }) });
}
describe("deep router public no-store transport and consent-first attribution", () => {
  beforeEach(async () => {
    vi.mocked(startDeepSession).mockResolvedValue(await delivered());
    vi.mocked(getDeepCatalog).mockResolvedValue(await serviceFor().getDeepCatalog("oit"));
  });
  it("supports public POST mutations only and does not require sign-in, token or payment", async () => {
    for (const [procedure, input] of [["getCatalog", { courseKey: "oit" }], ["startSession", { courseKey: "oit", mode: "calculation-ladder", sessionSize: 1 }]] as const) {
      expect((await request("POST", procedure, input)).status).toBe(200);
      expect((await request("GET", procedure, input)).status).toBe(405);
    }
    expect(setHeader).toHaveBeenCalledWith("Cache-Control", "private, no-store");
    expect(resolveAttemptAttribution).not.toHaveBeenCalled(); expect(issueAssessmentActivity).not.toHaveBeenCalled();
  });
  it("applies no-store before input validation and strips token before service delivery", async () => {
    const ctx = context();
    await expect(deepGamesRouter.createCaller(ctx).startSession({ courseKey: "../oit", mode: "build-process", sessionSize: 1 })).rejects.toThrow();
    expect(setHeader).toHaveBeenCalledWith("Cache-Control", "private, no-store");
    await deepGamesRouter.createCaller(ctx).startSession({ courseKey: "oit", mode: "calculation-ladder", sessionSize: 1, accessToken: "not-a-valid-token" });
    expect(startDeepSession).toHaveBeenCalledWith({ courseKey: "oit", mode: "calculation-ladder", sessionSize: 1 });
    await expect(deepGamesRouter.createCaller(ctx).startSession({ courseKey: "oit", mode: "build-process", sessionSize: 1, sourceId: "injected" } as never)).rejects.toThrow();
  });
  it.each([{ dnt: "1" }, { "sec-gpc": "1" }, { "x-echelon-activity": "denied" }, {}])("does not resolve identities, attribution or issue tracking without consent %j", async headers => {
    await deepGamesRouter.createCaller(context(headers)).startSession({ courseKey: "oit", mode: "calculation-ladder", sessionSize: 1, accessToken: "forged" });
    expect(resolveVerifiedIdentity).not.toHaveBeenCalled(); expect(resolveAttemptAttribution).not.toHaveBeenCalled(); expect(issueAssessmentActivity).not.toHaveBeenCalled();
  });
  it("allows anonymous consented tracking but skips employer attribution", async () => {
    const ctx = context({ "x-echelon-activity": "allowed" }); expect(assessmentActivityAllowed(ctx)).toBe(true);
    const result = await deepGamesRouter.createCaller(ctx).startSession({ courseKey: "oit", mode: "calculation-ladder", sessionSize: 1 });
    expect(issueAssessmentActivity).toHaveBeenCalledWith(ctx, expect.objectContaining({ timed: false, sourceSessionId: sessionId }), personal);
    expect(resolveAttemptAttribution).not.toHaveBeenCalled(); expect(result.activityTracking).toEqual(notRecorded);
  });
  it("verifies signed-token learners with exactly the same actor as record transport, never raw email", async () => {
    const ctx = context({ "x-echelon-activity": "allowed" });
    const accessToken = await issueSubscriptionToken({ email: " Learner@Example.test ", examTypes: [] });
    const employer = { orgId: 12, organizationMemberId: 34, flexLicenceId: null };
    vi.mocked(resolveAttemptAttribution).mockResolvedValue(employer);
    await deepGamesRouter.createCaller(ctx).startSession({ courseKey: "oit", mode: "calculation-ladder", sessionSize: 1, accessToken });
    expect(resolveAttemptAttribution).toHaveBeenCalledWith({ userId: null, studentEmail: "learner@example.test" }, "oit");
    expect(issueAssessmentActivity).toHaveBeenCalledWith(expect.objectContaining({ user: null, studentEmail: "learner@example.test" }), expect.anything(), employer);
    expect(ctx.studentEmail).toBeNull();
  });
  it("does not turn invalid or expired supplied tokens into anonymous tracking", async () => {
    for (const accessToken of ["forged", await issueSubscriptionToken({ email: "learner@example.test", examTypes: ["oit"] }, -1000)]) {
      const result = await deepGamesRouter.createCaller(context({ "x-echelon-activity": "allowed" })).startSession({ courseKey: "oit", mode: "calculation-ladder", sessionSize: 1, accessToken });
      expect(result.tasks).toHaveLength(1); expect(result.activityTracking).toEqual(notRecorded);
    }
    expect(resolveAttemptAttribution).not.toHaveBeenCalled(); expect(issueAssessmentActivity).not.toHaveBeenCalled();
  });
  it.each(["OAuth", "OTP"])("does not let a token replace an existing %s actor", async kind => {
    const user = { id: 71, email: "account@example.test", role: "user" } as TrpcContext["user"];
    const ctx = context({ "x-echelon-activity": "allowed" }, kind === "OTP" ? "account@example.test" : null, kind === "OAuth" ? user : null);
    const accessToken = await issueSubscriptionToken({ email: "different@example.test", examTypes: ["oit"] });
    await deepGamesRouter.createCaller(ctx).startSession({ courseKey: "oit", mode: "calculation-ladder", sessionSize: 1, accessToken });
    expect(resolveAttemptAttribution).toHaveBeenCalledWith({ userId: kind === "OAuth" ? 71 : null, studentEmail: "account@example.test" }, "oit");
  });
  it("retains public play and learner-only attribution during tracking outages", async () => {
    vi.mocked(resolveAttemptAttribution).mockRejectedValueOnce(Error("private failure"));
    const ctx = context({ "x-echelon-activity": "allowed" }, "learner@example.test");
    await deepGamesRouter.createCaller(ctx).startSession({ courseKey: "oit", mode: "calculation-ladder", sessionSize: 1 });
    expect(issueAssessmentActivity).toHaveBeenLastCalledWith(ctx, expect.anything(), personal);
    vi.mocked(issueAssessmentActivity).mockRejectedValueOnce(Error("storage failure"));
    expect((await deepGamesRouter.createCaller(ctx).startSession({ courseKey: "oit", mode: "calculation-ladder", sessionSize: 1 })).activityTracking).toEqual(notRecorded);
  });
  it("returns version conflict but redacts internal content failures", async () => {
    vi.mocked(startDeepSession).mockRejectedValueOnce(new DeepGameVersionError());
    await expect(deepGamesRouter.createCaller(context()).startSession({ courseKey: "oit", mode: "build-process", sessionSize: 1 })).rejects.toMatchObject({ code: "CONFLICT" });
    vi.mocked(startDeepSession).mockRejectedValueOnce(Error("private/path ANSWER=secret"));
    await expect(deepGamesRouter.createCaller(context()).startSession({ courseKey: "oit", mode: "build-process", sessionSize: 1 })).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR", message: "Deep game content is unavailable." });
  });
});
