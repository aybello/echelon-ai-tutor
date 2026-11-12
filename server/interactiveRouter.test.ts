import { EventEmitter } from "node:events";
import { nodeHTTPRequestHandler } from "@trpc/server/adapters/node-http";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import * as courseRegistry from "../shared/courseRegistry";
import { getAllCourses } from "../shared/courseRegistry";
import { resolveAccessForRequest } from "./_core/accessService";
import { inspectInteractiveRegistration, loadInteractivePackage, validateInteractivePackage } from "./interactiveContent/loader";
import { releasePackages } from "./interactiveContent/release-2026-11-12/registry";
import releaseMetadata from "./interactiveContent/release-2026-11-12/release-metadata.json";
import { interactiveModes } from "./interactiveContent/schema";
import { interactiveRouter } from "./routers/interactiveRouter";
// @ts-expect-error The standalone offline converter is plain JavaScript.
import { validatePack } from "../scripts/validate-interactive-drafts.mjs";

vi.mock("./_core/accessService", () => ({ resolveAccessForRequest: vi.fn() }));
vi.mock("./interactiveContent/loader", async original => ({
  ...await original<typeof import("./interactiveContent/loader")>(),
  loadInteractivePackage: vi.fn(),
}));

const setHeader = vi.fn();
const ctx: TrpcContext = { user: null, studentEmail: null, req: { headers: {} } as TrpcContext["req"], res: { setHeader } as unknown as TrpcContext["res"] };
const makeExample = (mode: typeof interactiveModes[number], kind: "preview" | "paid") => {
  const base = { id: `${kind}-${mode}`, mode, prompt: "Synthetic prompt" };
  switch (mode) {
    case "rapid-swipe": return { ...base, correctAnswer: true, explanation: "Synthetic" };
    case "before-after": return { ...base, correctAnswer: "before", explanation: "Synthetic" };
    case "speed-match": return { ...base, pairs: [
      { id: "a", left: "Left A", right: "Right A" },
      { id: "b", left: "Left B", right: "Right B" },
      { id: "c", left: "Left C", right: "Right C" },
    ] };
    default: return { ...base, options: [{ id: "a", label: "Alpha" }, { id: "b", label: "Beta" }], correctOptionId: "a", explanation: "Synthetic" };
  }
};
const fixture = {
  courseKey: "class1-water", status: "approved", version: "test-only-v1",
  previewIds: Object.fromEntries(interactiveModes.map(mode => [mode, `preview-${mode}`])) as Record<typeof interactiveModes[number], string>,
  examples: interactiveModes.flatMap(mode => [makeExample(mode, "paid"), makeExample(mode, "preview")]),
};
const approved = { approved: true, content: fixture };
const caller = interactiveRouter.createCaller(ctx);
const previewIds = interactiveModes.map(mode => `preview-${mode}`);
const validated = (content: unknown) => validateInteractivePackage("class1-water", { approved: true, content });

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(resolveAccessForRequest).mockResolvedValue(false);
  vi.mocked(loadInteractivePackage).mockImplementation(key => key === fixture.courseKey ? inspectInteractiveRegistration(key, approved) : { status: "absent" });
});

describe("interactive.getContent", () => {
  it("returns a fixed preview for every mode without client selection", async () => {
    const first = await caller.getContent({ courseKey: "class1-water" });
    const second = await caller.getContent({ courseKey: "class1-water" });
    expect(first).toEqual(second);
    expect(first).toMatchObject({ courseKey: "class1-water", available: true, locked: true, version: "test-only-v1" });
    expect(first.examples.map(x => x.id)).toEqual(previewIds);
    expect(resolveAccessForRequest).toHaveBeenCalledWith(ctx, "class1-water", { accessToken: undefined, privilegedInteractiveAccess: true });
    for (const extra of [{ mode: "rapid-swipe" }, { id: "paid-rapid-swipe" }, { page: 2 }, { limit: 100 }, { email: "victim@example.test" }]) {
      await expect(caller.getContent({ courseKey: "class1-water", ...extra } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
  });
  it("returns all approved examples only for exact-course access and forwards the token unchanged", async () => {
    vi.mocked(resolveAccessForRequest).mockResolvedValue(true);
    const result = await caller.getContent({ courseKey: "class1-water", accessToken: "token" });
    expect(result.locked).toBe(false);
    expect(result.examples.map(x => x.id)).toEqual(fixture.examples.map(x => x.id));
    expect(resolveAccessForRequest).toHaveBeenCalledWith(ctx, "class1-water", { accessToken: "token", privilegedInteractiveAccess: true });
  });
  it("does not use another course entitlement to release paid content", async () => {
    vi.mocked(resolveAccessForRequest).mockImplementation(async (_ctx, course) => course === "class1-ww");
    const result = await caller.getContent({ courseKey: "class1-water" });
    expect(result.locked).toBe(true);
    expect(result.examples.map(x => x.id)).toEqual(previewIds);
  });
  it("preserves entitlement when no package is available", async () => {
    vi.mocked(resolveAccessForRequest).mockResolvedValue(true);
    expect(await caller.getContent({ courseKey: "class1-ww" })).toEqual({ courseKey: "class1-ww", available: false, locked: false, version: null, examples: [] });
    vi.mocked(resolveAccessForRequest).mockResolvedValue(false);
    expect(await caller.getContent({ courseKey: "class1-ww" })).toEqual({ courseKey: "class1-ww", available: false, locked: true, version: null, examples: [] });
  });
  it("does not convert resolver errors into access or content", async () => {
    vi.mocked(resolveAccessForRequest).mockRejectedValue(new Error("resolver unavailable"));
    await expect(caller.getContent({ courseKey: "class1-water" })).rejects.toThrow("resolver unavailable");
    expect(loadInteractivePackage).not.toHaveBeenCalled();
    expect(setHeader).toHaveBeenCalledWith("Cache-Control", "private, no-store");
  });
  it("bounds bearer tokens consistently with existing quiz endpoints", async () => {
    await caller.getContent({ courseKey: "class1-water", accessToken: "x".repeat(8192) });
    expect(resolveAccessForRequest).toHaveBeenCalledTimes(1);
    for (const accessToken of ["", "x".repeat(8193)]) {
      await expect(caller.getContent({ courseKey: "class1-water", accessToken })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
    expect(resolveAccessForRequest).toHaveBeenCalledTimes(1);
    expect(setHeader).toHaveBeenCalledTimes(3);
  });
  it.each([
    ["unapproved", { approved: false, content: fixture }],
    ["draft", { approved: true, content: { ...fixture, status: "draft" } }],
    ["wrong course", { approved: true, content: { ...fixture, courseKey: "class1-ww" } }],
    ["tampered", { approved: true, content: { ...fixture, examples: [...fixture.examples, fixture.examples[0]] } }],
    ["malformed registered entry", undefined],
  ])("fails closed for a registered %s pack instead of returning the fallback signal", async (_label, registration) => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      vi.mocked(loadInteractivePackage).mockImplementation(key => inspectInteractiveRegistration(key, registration));
      for (const hasAccess of [false, true]) {
        vi.mocked(resolveAccessForRequest).mockResolvedValue(hasAccess);
        await expect(caller.getContent({ courseKey: "class1-water", accessToken: "secret-token" })).rejects.toMatchObject({
          code: "INTERNAL_SERVER_ERROR", message: "Interactive content is unavailable.",
        });
      }
      expect(warning.mock.calls).toEqual([
        ["Interactive content is unavailable due to a configuration error."],
        ["Interactive content is unavailable due to a configuration error."],
      ]);
      expect(setHeader).toHaveBeenCalledWith("Cache-Control", "private, no-store");
    } finally { warning.mockRestore(); }
  });
  it("excludes beta, aliases, unknown and inactive keys before access or loading", async () => {
    const inactive = getAllCourses().find(course => !course.isActive);
    for (const courseKey of ["electrician-309a", "electrician-309a-demo", "not-a-course", ...(inactive ? [inactive.courseKey] : [])]) {
      await expect(caller.getContent({ courseKey })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
    expect(resolveAccessForRequest).not.toHaveBeenCalled();
    expect(loadInteractivePackage).not.toHaveBeenCalled();
  });
  it("rejects a known but inactive canonical course", async () => {
    const course = courseRegistry.getCourseByKey("class1-water")!;
    const spy = vi.spyOn(courseRegistry, "getCourseByKey").mockReturnValue({ ...course, isActive: false });
    try {
      await expect(caller.getContent({ courseKey: "class1-water" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
      expect(resolveAccessForRequest).not.toHaveBeenCalled();
      expect(loadInteractivePackage).not.toHaveBeenCalled();
    } finally { spy.mockRestore(); }
  });
});

describe("AI-source-reviewed software release package validation", () => {
  it("registers exactly the 38 canonical non-309 keys with 3828 items and all six fixed previews", async () => {
    const actual = await vi.importActual<typeof import("./interactiveContent/loader")>("./interactiveContent/loader");
    const expected = [
      "class1-wastewater-coll", "class1-water", "class1-water-dist", "class1-ww",
      "class2-wastewater-coll", "class2-water", "class2-water-dist", "class2-ww",
      "class3-wastewater-coll", "class3-water", "class3-water-dist", "class3-ww",
      "class4-wastewater-coll", "class4-water", "class4-water-dist", "class4-ww",
      "oit", "oit-ww", "us-class1-water", "us-class1-water-dist", "us-texas-class-d-water",
      "wpi-class1-wastewater", "wpi-class1-water", "wpi-class1-water-coll", "wpi-class1-water-dist",
      "wpi-class2-wastewater", "wpi-class2-water", "wpi-class2-water-coll", "wpi-class2-water-dist",
      "wpi-class3-wastewater", "wpi-class3-water", "wpi-class3-water-coll", "wpi-class3-water-dist",
      "wpi-class4-wastewater", "wpi-class4-water", "wpi-class4-water-coll", "wpi-class4-water-dist", "wqa",
    ].sort();
    expect(Object.keys(releasePackages).sort()).toEqual(expected);
    expect(getAllCourses().filter(c => c.isActive && c.track !== "construction-electrician").map(c => c.courseKey).sort()).toEqual(expected);
    const ids = new Set<string>();
    const modes = Object.fromEntries(interactiveModes.map(mode => [mode, 0]));
    for (const key of expected) {
      const loaded = actual.loadInteractivePackage(key);
      expect(loaded.status).toBe("valid");
      if (loaded.status !== "valid") throw new Error(`Invalid release: ${key}`);
      const { package: pkg } = loaded;
      expect(pkg.courseKey).toBe(key);
      for (const mode of interactiveModes) {
        const items = pkg.examples.filter(x => x.mode === mode);
        expect(items.length).toBeGreaterThanOrEqual(2);
        expect(pkg.previewIds[mode]).toBe(items.map(x => x.id).sort()[0]);
        modes[mode] += items.length;
      }
      for (const item of pkg.examples) {
        expect(ids.has(item.id)).toBe(false);
        expect(item.id).not.toMatch(/309/i);
        ids.add(item.id);
      }
    }
    expect(ids.size).toBe(3828);
    expect(ids.has("class1-water-dist-074")).toBe(false);
    expect(ids.has("wqa-023")).toBe(true);
    expect(modes).toEqual(releaseMetadata.counts.modes);
    for (const key of ["__proto__", "constructor", "electrician-309a", "electrician-309a-demo", "class1", "not-a-course"]) {
      expect(actual.loadInteractivePackage(key)).toEqual({ status: "absent" });
    }
  });
  it("exposes only the six immutable previews without exact-course access, and all examples with access", async () => {
    const actual = await vi.importActual<typeof import("./interactiveContent/loader")>("./interactiveContent/loader");
    vi.mocked(loadInteractivePackage).mockImplementation(actual.loadInteractivePackage);
    for (const key of Object.keys(releasePackages)) {
      const result = actual.loadInteractivePackage(key);
      if (result.status !== "valid") throw new Error(`Invalid release: ${key}`);
      vi.mocked(resolveAccessForRequest).mockResolvedValue(false);
      const preview = await caller.getContent({ courseKey: key });
      expect(preview).toEqual(await caller.getContent({ courseKey: key }));
      expect(preview).toMatchObject({ courseKey: key, available: true, locked: true });
      expect(preview.examples).toHaveLength(6);
      expect(new Set(preview.examples.map(x => x.mode))).toEqual(new Set(interactiveModes));
      expect(new Set(preview.examples.map(x => x.id))).toEqual(new Set(Object.values(result.package.previewIds)));
      vi.mocked(resolveAccessForRequest).mockResolvedValue(true);
      const full = await caller.getContent({ courseKey: key, accessToken: "token" });
      expect(full.locked).toBe(false);
      expect(full.examples).toEqual(result.package.examples);
      expect(Object.keys(full).sort()).toEqual(["available", "courseKey", "examples", "locked", "version"]);
      const serialized = JSON.stringify(full);
      for (const secretField of ["sourceSha256", "provenance", "reviewReferences", "originalBytes", "reviewers"]) expect(serialized).not.toContain(secretField);
      expect(resolveAccessForRequest).toHaveBeenLastCalledWith(ctx, key, { accessToken: "token", privilegedInteractiveAccess: true });
    }
  });
  it("distinguishes a registered valid entry from all invalid entries", () => {
    expect(inspectInteractiveRegistration("class1-water", approved)).toMatchObject({ status: "valid", package: { courseKey: "class1-water" } });
    for (const registration of [undefined, { ...approved, approved: false }, { ...approved, content: { ...fixture, status: "draft" } }, { ...approved, content: { ...fixture, courseKey: "class1-ww" } }]) {
      expect(inspectInteractiveRegistration("class1-water", registration)).toEqual({ status: "invalid" });
    }
    const throwing = { approved: true, get content(): unknown { throw new Error("private-content"); } };
    expect(inspectInteractiveRegistration("class1-water", throwing)).toEqual({ status: "invalid" });
  });
  it("fails closed for absent, unapproved, draft, invalid or mismatched content", () => {
    expect(validateInteractivePackage("class1-water", undefined)).toBeNull();
    expect(validateInteractivePackage("class1-water", { ...approved, approved: false })).toBeNull();
    expect(validated({ ...fixture, status: "draft" })).toBeNull();
    expect(validateInteractivePackage("class1-ww", approved)).toBeNull();
    expect(validated({ ...fixture, examples: [...fixture.examples, fixture.examples[0]] })).toBeNull();
    expect(validated(fixture)).not.toBeNull();
  });
  it("requires all six modes, one distinct valid preview and at least one paid example per mode", () => {
    for (const mode of interactiveModes) {
      const { [mode]: _missing, ...rest } = fixture.previewIds;
      expect(validated({ ...fixture, previewIds: rest })).toBeNull();
      expect(validated({ ...fixture, examples: fixture.examples.filter(item => item.mode !== mode) })).toBeNull();
      expect(validated({ ...fixture, examples: fixture.examples.filter(item => item.id !== `paid-${mode}`) })).toBeNull();
      expect(validated({ ...fixture, previewIds: { ...fixture.previewIds, [mode]: "not-an-example" } })).toBeNull();
      const other = interactiveModes.find(candidate => candidate !== mode)!;
      expect(validated({ ...fixture, previewIds: { ...fixture.previewIds, [mode]: fixture.previewIds[other] } })).toBeNull();
    }
    expect(validated({ ...fixture, previewIds: { ...fixture.previewIds, unexpected: "preview-rapid-swipe" } })).toBeNull();
  });
  it("rejects duplicate choice IDs, missing answers and normalized duplicate labels in every choice mode", () => {
    for (const mode of ["odd-one-out", "cause-effect", "tap-the-flaw"] as const) {
      const original = makeExample(mode, "paid");
      for (const overrides of [
        { options: [{ id: "a", label: "A" }, { id: "a", label: "B" }] },
        { correctOptionId: "missing" },
        { options: [{ id: "a", label: "  Ａlpha  Beta " }, { id: "b", label: "alpha\t beta" }] },
        { options: [{ id: "a", label: "Café" }, { id: "b", label: "Cafe\u0301" }] },
      ]) {
        expect(validated({ ...fixture, examples: fixture.examples.map(item => item.id === original.id ? { ...original, ...overrides } : item) })).toBeNull();
      }
    }
  });
  it("accepts renderer-compatible legacy and named before/after examples and fails closed on leaks", () => {
    const original = makeExample("before-after", "paid");
    const validate = (overrides: Record<string, unknown>) => validated({ ...fixture, examples: fixture.examples.map(item => item.id === original.id ? { ...original, ...overrides } : item) });
    expect(validate({ correctAnswer: "after" })).not.toBeNull();
    const named = { options: ["Screening", "Sedimentation"], correctAnswer: " SEDIMENTATION ", prompt: "Which stage is earlier?" };
    expect(validate(named)).not.toBeNull();
    expect(validate({ ...named, options: [...named.options].reverse() })).not.toBeNull();
    for (const override of [
      { options: ["Screening"] }, { options: ["Screening", "Sedimentation", "Filtration"] },
      { options: ["Screening", " SCREENING "] }, { options: ["Café", "Cafe\u0301"] },
      { correctAnswer: "missing" }, { options: ["Café", "Tea"], correctAnswer: "Cafe\u0301" },
      { prompt: "The correct answer is Sedimentation" }, { instruction: "Consider SCREENING." },
      { prompt: "Water → stage A → stage B" }, { instruction: "First A then B" },
      { options: [{ id: "a", label: "Screening" }, { id: "b", label: "Sedimentation" }], correctOptionId: "a" },
    ]) expect(validate({ ...named, ...override })).toBeNull();
    expect(validate({ prompt: "The answer is before", correctAnswer: "before" })).toBeNull();
    expect(validate({ prompt: "Water → stage A → stage B", correctAnswer: "before" })).toBeNull();
    expect(validate({ prompt: "Is stage A before or after stage B?", correctAnswer: "before" })).not.toBeNull();
  });
  it("accepts every synthetic converted example as a renderer-compatible package", () => {
    const drafts = interactiveModes.flatMap(mode => ["paid", "preview"].map(kind => {
      const item = { id: `${kind}-${mode}`, mode, prompt: `Question ${kind} ${mode}`, explanation: "Synthetic explanation", sources: ["Synthetic citation"], options: [] as string[], pairs: [] as { left: string; right: string }[], answer: "" };
      if (mode === "rapid-swipe") item.answer = "true";
      else if (mode === "speed-match") { item.answer = "Match the pairs"; item.pairs = [{ left: "A", right: "One" }, { left: "B", right: "Two" }, { left: "C", right: "Three" }]; }
      else if (mode === "before-after") { item.options = ["Screening", "Sedimentation"]; item.answer = " sedimentation "; }
      else { item.options = ["Alpha", "Beta"]; item.answer = "Beta"; }
      return item;
    }));
    const converted = validatePack(drafts);
    expect(converted.valid).toBe(true);
    expect(converted.provenance).toHaveLength(drafts.length);
    const parsed = validated({ ...fixture, examples: converted.examples });
    expect(parsed).not.toBeNull();
    expect(parsed?.examples.find(item => item.id === "paid-before-after")).toMatchObject({ options: ["Screening", "Sedimentation"], correctAnswer: "sedimentation" });
  });
  it("requires at least three pairs and independently rejects duplicate IDs, left labels and right labels", () => {
    const original = makeExample("speed-match", "paid");
    const good = [
      { id: "a", left: "Left A", right: "Right A" },
      { id: "b", left: "Left B", right: "Right B" },
      { id: "c", left: "Left C", right: "Right C" },
    ];
    const variants = [good.slice(0, 2),
      [good[0], { ...good[1], id: "a" }, good[2]],
      [good[0], { ...good[1], left: "  LEFT   A " }, good[2]],
      [good[0], { ...good[1], right: "Ｒight A" }, good[2]],
    ];
    for (const pairs of variants) {
      expect(validated({ ...fixture, examples: fixture.examples.map(item => item.id === original.id ? { ...original, pairs } : item) })).toBeNull();
    }
    // The same label on opposite sides is not ambiguous within either column.
    const crossSide = [good[0], { ...good[1], right: "Left A" }, good[2]];
    expect(validated({ ...fixture, examples: fixture.examples.map(item => item.id === original.id ? { ...original, pairs: crossSide } : item) })).not.toBeNull();
  });
});

// Exercise tRPC's real Node HTTP adapter and headers without binding a socket.
async function httpRequest(method: "GET" | "POST", input: unknown, rawBody?: string) {
  const req = Object.assign(new EventEmitter(), {
    method, url: "/getContent", headers: { host: "localhost", "content-type": "application/json" },
    ...(method === "POST" ? { body: rawBody ?? { json: input } } : {}),
  });
  class Response extends EventEmitter {
    statusCode = 200;
    headersSent = false;
    headers = new Map<string, string>();
    chunks: Uint8Array[] = [];
    setHeader(name: string, value: string) { this.headers.set(name.toLowerCase(), value); return this; }
    write(chunk: Uint8Array) { this.chunks.push(chunk); return true; }
    end() { this.emit("finish"); }
  }
  const res = new Response();
  await nodeHTTPRequestHandler({
    req: req as never, res: res as never, path: "getContent", router: interactiveRouter,
    createContext: () => ({ ...ctx, req: req as never, res: res as never }),
  });
  return res;
}

describe("HTTP transport", () => {
  it("accepts POST and rejects GET for the mutation", async () => {
    expect((await httpRequest("POST", { courseKey: "class1-water", accessToken: "test-token" })).statusCode).toBe(200);
    expect((await httpRequest("GET", {})).statusCode).toBe(405);
  });
  it("sends private no-store on successful, validation, course and resolver responses", async () => {
    const success = await httpRequest("POST", { courseKey: "class1-water" });
    vi.mocked(resolveAccessForRequest).mockResolvedValueOnce(true);
    const paid = await httpRequest("POST", { courseKey: "class1-water" });
    const invalid = await httpRequest("POST", { courseKey: "class1-water", accessToken: "x".repeat(8193) });
    const course = await httpRequest("POST", { courseKey: "unknown" });
    vi.mocked(resolveAccessForRequest).mockRejectedValue(new Error("unavailable"));
    const failure = await httpRequest("POST", { courseKey: "class1-water" });
    expect([success.statusCode, paid.statusCode, invalid.statusCode, course.statusCode, failure.statusCode]).toEqual([200, 200, 400, 400, 500]);
    for (const response of [success, paid, invalid, course, failure]) expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
  it("only signals legacy fallback for an absent package, never an invalid registration", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const absent = await httpRequest("POST", { courseKey: "class1-ww" });
      expect(absent.statusCode).toBe(200);
      const absentBody = Buffer.concat(absent.chunks).toString();
      expect(absentBody).toContain('"available":false');
      vi.mocked(loadInteractivePackage).mockImplementation(key => inspectInteractiveRegistration(key, {
        approved: true, content: { ...fixture, status: "draft", version: "private-version", examples: [{ answer: "private-answer" }] },
      }));
      const invalid = await httpRequest("POST", { courseKey: "class1-water", accessToken: "private-token" });
      const body = Buffer.concat(invalid.chunks).toString();
      expect(invalid.statusCode).toBe(500);
      expect(invalid.headers.get("cache-control")).toBe("private, no-store");
      expect(body).toContain("Interactive content is unavailable.");
      for (const secret of ["private-version", "private-answer", "private-token", '"available":false', '"examples"']) expect(body).not.toContain(secret);
      expect(warning).toHaveBeenCalledWith("Interactive content is unavailable due to a configuration error.");
    } finally { warning.mockRestore(); }
  });
  it("sets no-store for malformed JSON but documents GET rejection before middleware", async () => {
    const wrongMethod = await httpRequest("GET", {});
    const invalidJson = await httpRequest("POST", {}, "{");
    expect([wrongMethod.statusCode, invalidJson.statusCode]).toEqual([405, 400]);
    expect(wrongMethod.headers.get("cache-control")).toBeUndefined();
    expect(invalidJson.headers.get("cache-control")).toBe("private, no-store");
  });
});
