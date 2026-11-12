import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignJWT } from "jose";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import type { TrpcContext } from "./_core/context";
import { interactiveModes } from "./interactiveContent/schema";
import { validateInteractivePackage } from "./interactiveContent/loader";
import { interactiveRouter } from "./routers/interactiveRouter";
import { quizRouter } from "./routers/quizRouter";
import { router } from "./_core/trpc";
import { issueSubscriptionToken } from "./_core/subscriptionToken";
import { assertAccess } from "./_core/accessService";
import { getDb } from "./db";
import { loadInteractivePackage } from "./interactiveContent/loader";

// No real DB, network, or registered content. Access resolution, token
// verification, tRPC routers, question sampling, and receipts remain real.
vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./_core/env", async original => ({
  ...await original<typeof import("./_core/env")>(),
  ENV: { ...(await original<typeof import("./_core/env")>()).ENV, cookieSecret: "test-only-not-for-production", ownerOpenId: "fixture-owner-openid" },
}));
vi.mock("./interactiveContent/loader", async original => ({
  ...await original<typeof import("./interactiveContent/loader")>(), loadInteractivePackage: vi.fn(),
}));
// Attribution is downstream of access, and is deliberately not under test.
vi.mock("./teams/attemptAttribution", () => ({ resolveAttemptAttribution: vi.fn(async () => undefined), validateIssuedAttribution: vi.fn() }));

const examples = interactiveModes.flatMap(mode => ["preview", "paid"].map(kind => {
  const base = { id: `${kind}-${mode}`, mode, prompt: "Synthetic prompt" };
  if (mode === "rapid-swipe") return { ...base, correctAnswer: true, explanation: "Synthetic" };
  if (mode === "before-after") return { ...base, correctAnswer: "before", explanation: "Synthetic" };
  if (mode === "speed-match") return { ...base, pairs: [
    { id: "a", left: "A", right: "1" }, { id: "b", left: "B", right: "2" }, { id: "c", left: "C", right: "3" },
  ] };
  return { ...base, options: [{ id: "a", label: "A" }, { id: "b", label: "B" }], correctOptionId: "a", explanation: "Synthetic" };
}));
const packageFixture = validateInteractivePackage("class1-water", { approved: true, content: {
  courseKey: "class1-water", status: "approved", version: "synthetic-v1", examples,
  previewIds: Object.fromEntries(interactiveModes.map(mode => [mode, `preview-${mode}`])),
} });
const rows = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1, bankKey: "class1-water", questionNum: i + 1, module: "Synthetic module", difficulty: "medium",
  question: `Synthetic question ${i + 1}`, options: '["a","b","c","d"]', correctIndex: 0,
  explanation: "Synthetic explanation", steps: null, tip: null, isCalc: "no", topic: null, cognitiveLevel: null,
}));
const app = router({ interactive: interactiveRouter, quiz: quizRouter });
const user = (role: "user" | "admin", openId = "ordinary-openid") => ({ id: 123, email: "alice@example.test", role, openId });
function caller(oauth: ReturnType<typeof user> | null, studentEmail: string | null = null) {
  return app.createCaller({ user: oauth, studentEmail, req: { headers: {} }, res: { setHeader: vi.fn() } } as unknown as TrpcContext);
}
const reads: string[] = [];
function fakeDb(purchaseRows: object[] = [], entitledEmail?: string) {
  const select = (fields: Record<string, unknown>) => {
    let kind: string;
    if ("questionNum" in fields) kind = "questions";
    else if ("productKey" in fields) kind = "purchases";
    else if ("tier" in fields && "province" in fields) kind = "subscriptions";
    else if ("orgProvince" in fields) kind = "seats";
    else if ("activationDeadline" in fields && "courseKey" in fields) kind = "flex";
    else if ("createdAt" in fields) kind = "managers";
    else if ("organizationId" in fields) kind = "teamFlex";
    else if ("orgId" in fields && "courseKeys" in fields) kind = "teamAnnual";
    else throw new Error(`Unexpected projection: ${Object.keys(fields)}`);
    reads.push(kind);
    const data = kind === "questions" ? rows : kind === "purchases" ? purchaseRows : [];
    const query = { where: (condition: Parameters<MySqlDialect["sqlToQuery"]>[0]) => {
      const filtered = kind === "purchases" && entitledEmail && !new MySqlDialect().sqlToQuery(condition).params.includes(entitledEmail) ? [] : data;
      return kind === "questions" ? { orderBy: async () => filtered } : Promise.resolve(filtered);
    }, innerJoin: () => query };
    return { from: () => query };
  };
  vi.mocked(getDb).mockResolvedValue({ select } as never);
}
async function expectContent(c: ReturnType<typeof caller>, locked: boolean, accessToken?: string) {
  const content = await c.interactive.getContent({ courseKey: "class1-water", ...(accessToken ? { accessToken } : {}) });
  expect(content).toMatchObject({ available: true, locked, version: "synthetic-v1" });
  expect(content.examples.map(x => x.id)).toEqual(examples.filter(x => !locked || x.id.startsWith("preview-")).map(x => x.id));
}
async function expectQuiz(c: ReturnType<typeof caller>, locked: boolean, accessToken?: string) {
  const quiz = await c.quiz.getInteractiveQuestions({ bankKey: "class1-water", ...(accessToken ? { accessToken } : {}) });
  expect(quiz).toMatchObject({ locked, total: 30, trialLimit: 15 });
  expect(quiz.questions).toHaveLength(locked ? 15 : 30);
  expect(quiz.questions.every(q => Boolean(q.attemptToken))).toBe(true);
}
async function expectBoth(c: ReturnType<typeof caller>, locked: boolean, accessToken?: string) {
  await expectContent(c, locked, accessToken);
  await expectQuiz(c, locked, accessToken);
}
beforeEach(() => {
  vi.clearAllMocks(); reads.length = 0;
  if (!packageFixture) throw new Error("Synthetic package validation failed");
  vi.mocked(loadInteractivePackage).mockReturnValue({ status: "valid", package: packageFixture });
  fakeDb();
});

describe("real interactive routers with privileged OAuth identity", () => {
  it.each([
    ["admin", "interactive.getContent", user("admin"), expectContent],
    ["admin", "quiz.getInteractiveQuestions", user("admin"), expectQuiz],
    ["owner with non-admin role", "interactive.getContent", user("user", "fixture-owner-openid"), expectContent],
    ["owner with non-admin role", "quiz.getInteractiveQuestions", user("user", "fixture-owner-openid"), expectQuiz],
  ] as const)("unlocks %s on %s", async (_label, _route, oauth, check) => {
    await check(caller(oauth), false);
    expect(reads.every(kind => kind === "questions")).toBe(true); // bypass before entitlement DB reads
  });
  it.each([user("admin"), user("user", "fixture-owner-openid")])("also preserves privileges in assertAccess", async oauth => {
    await expect(assertAccess({ user: oauth, studentEmail: null } as TrpcContext, "class1-water")).resolves.toBeUndefined();
    expect(reads).toEqual([]);
  });
  it("keeps a nonadmin nonowner OAuth user on previews with no entitlement", async () => {
    await expectBoth(caller(user("user")), true);
    expect(reads.filter(kind => kind === "purchases")).toHaveLength(2);
  });
  it("rejects role and owner claims in a forged token and in a signed token without entitlement", async () => {
    const payload = { email: "spoof@example.test", examTypes: ["class1-water"], role: "admin", openId: "fixture-owner-openid" };
    const makeToken = (secret: string) => new SignJWT(payload).setProtectedHeader({ alg: "HS256" })
      .setIssuer("echelon-access").setAudience("echelon-quiz").setExpirationTime("1h")
      .sign(new TextEncoder().encode(secret));
    await expectBoth(caller(null), true, await makeToken("wrong-synthetic-secret"));
    expect(reads).toEqual(["questions"]);
    reads.length = 0;
    await expectBoth(caller(null), true, await makeToken("test-only-not-for-production"));
    expect(reads.filter(kind => kind === "purchases")).toHaveLength(2);
  });
  it("preserves anonymous and OTP paths and never replaces a verified identity with a token", async () => {
    const token = await issueSubscriptionToken({ email: "foreign@example.test", examTypes: ["class1-water"] });
    const purchase = [{ productKey: "class1-water", status: "active", accessExpiresAt: null }];
    fakeDb(purchase, "foreign@example.test");
    await expectBoth(caller(null), false, token);
    await expectBoth(caller(null, "otp@example.test"), true, token);
    fakeDb(purchase, "otp@example.test");
    await expectBoth(caller(null, "otp@example.test"), false, token);
    await expectBoth(caller(user("user"), "otp@example.test"), true, token);
    fakeDb();
    await expectBoth(caller(null), true, token); // token still needs a live entitlement
  });
});
