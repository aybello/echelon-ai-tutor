import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import rawManifest from "./wastewaterMockAreaManifest.json";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { questions } from "../drizzle/schema";
import { parseLearnerQuestions } from "./routers/quizRouter";
import { resolveWastewaterMockArea, wastewaterMockContentSha256 } from "./wastewaterMockAreaResolver";
import { issueMockSession, mockOwner, mockSpecification, selectMappedMockQuestions, validateMockSubmission, verifyMockSession } from "./mockExamSession";
import { ontarioWastewaterMockProfile } from "../shared/ontarioWastewaterMock";

vi.mock("./db", async original => ({ ...await original<typeof import("./db")>(), getDb: vi.fn() }));
vi.mock("./_core/learningIdentity", () => ({ resolveLearningIdentity: vi.fn(async () => ({ userId: null, studentEmail: "coverage@example.invalid" })) }));
vi.mock("./_core/accessService", async original => ({ ...await original<typeof import("./_core/accessService")>(), resolveAccessForRequest: vi.fn(async () => true) }));
vi.mock("./teams/attemptAttribution", async original => {
  const actual = await original<typeof import("./teams/attemptAttribution")>();
  return { ...actual, resolveAttemptAttribution: vi.fn(async () => ({ ...actual.PERSONAL_ATTRIBUTION })) };
});

// Opt in explicitly via the offline script's temporary private gate. The safe
// runner clears inherited environment, so a file is used rather than a secret-
// bearing env override. No bank content or fixed export path is stored in Git.
const gatePath = resolve(tmpdir(), `echelon-wastewater-mock-coverage-${process.getuid?.() ?? "local"}.json`);
const enabled = existsSync(gatePath);
const identity = { userId: null, studentEmail: "coverage@example.invalid" };
function seeded(seed: number) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 0x100000000; };
}
function outsideRepository(path: string) {
  const repo = resolve(import.meta.dirname, "..");
  const location = relative(repo, resolve(path));
  return isAbsolute(path) && (location.startsWith("../") || isAbsolute(location));
}

describe.skipIf(!enabled)("private active wastewater snapshot (explicit offline gate)", () => {
  let snapshot: any;
  let inputHash: string;
  let outputPath: string;
  beforeEach(() => {
    const gate = JSON.parse(readFileSync(gatePath, "utf8"));
    if (!outsideRepository(gate.input) || !outsideRepository(gate.output)) throw new Error("Private snapshot and coverage output must stay outside the repository");
    const bytes = readFileSync(gate.input);
    inputHash = createHash("sha256").update(bytes).digest("hex");
    if (inputHash !== rawManifest.provenance.sourceExportSha256) throw new Error("Active snapshot changed; renewed classification review required");
    snapshot = JSON.parse(bytes.toString("utf8"));
    outputPath = gate.output;
  });

  it("verifies complete identities/content and 20 deterministic signed quota-exact mocks per bank", () => {
    const report: any = { sourceExportSha256: inputHash, runsPerBank: 20, banks: {} };
    const before = JSON.stringify(snapshot);
    for (const [bankKey, courseKey] of [["class1-wastewater", "class1-ww"], ["class2-wastewater", "class2-ww"]] as const) {
      const rows = snapshot.questions.filter((row: any) => row.bankKey === bankKey);
      const byNum = new Map<number, any>(rows.map((row: any) => [row.questionNum, row]));
      expect(byNum.size).toBe(rows.length);
      const pool = parseLearnerQuestions(rows).map(q => ({ ...q,
        blueprintObjective: byNum.get(q.id).blueprintObjective,
        reviewStatus: byNum.get(q.id).reviewStatus,
      }));
      expect(pool).toHaveLength(rows.length);
      const manifestBank = rawManifest.banks[bankKey];
      const partition = new Set([...Object.keys(manifestBank.entries).map(Number), ...manifestBank.excludedQuestionNums]);
      expect(partition.size).toBe(rows.length);
      expect([...partition].every(num => byNum.has(num))).toBe(true);
      const entries = manifestBank.entries as Record<string, { sha256: string; area: string }>;
      for (const [num, entry] of Object.entries(entries)) {
        const q = pool.find(q => q.id === Number(num))!;
        expect(wastewaterMockContentSha256(q) === entry.sha256).toBe(true);
        expect(q.reviewStatus).toBe("unreviewed");
      }
      for (const num of manifestBank.excludedQuestionNums) expect(resolveWastewaterMockArea(bankKey, pool.find(q => q.id === num)!)).toBeNull();
      const targets = ontarioWastewaterMockProfile(bankKey)!.targets;
      const counts = Object.fromEntries(Object.keys(targets).map(area => [area, pool.filter(q => resolveWastewaterMockArea(bankKey, q) === area).length]));
      const spec = mockSpecification(courseKey);
      const runs: any[] = [];
      for (let seed = 1; seed <= 20; seed++) {
        const selected = selectMappedMockQuestions(pool, targets, 100, q => resolveWastewaterMockArea(bankKey, q), seeded(seed));
        expect(selected).toHaveLength(100);
        expect(new Set(selected.map(q => q.id)).size).toBe(100);
        const quotas = Object.fromEntries(Object.keys(targets).map(area => [area, selected.filter(q => resolveWastewaterMockArea(bankKey, q) === area).length]));
        expect(quotas).toEqual(targets);
        for (const q of selected) {
          const original = byNum.get(q.id);
          expect(q.module === original.module && q.question === original.question
            && JSON.stringify(q.options) === JSON.stringify(JSON.parse(original.options))
            && q.correctIndex === original.correctIndex).toBe(true);
        }
        const owner = mockOwner(identity);
        const issued = issueMockSession({ ...spec, owner, preview: false, questionNums: selected.map(q => q.id) }, 1_000_000);
        const verified = verifyMockSession(issued.token, owner);
        expect(verified.questionNums).toEqual(selected.map(q => q.id));
        expect(verified.deadline - verified.startedAt).toBe(10800 * 1000);
        validateMockSubmission(verified, { sessionId: verified.sessionId, examType: spec.examType, bankKey: courseKey, answers: selected.map(q => ({ questionNum: q.id })) });
        runs.push({ seed, count: selected.length, unique: 100, quotas, orderedQuestionNumsSha256: createHash("sha256").update(JSON.stringify(selected.map(q => q.id))).digest("hex") });
      }
      const equipmentPool = pool.filter(q => resolveWastewaterMockArea(bankKey, q) === "Equipment Evaluation, Maintenance & Operation");
      const insufficient = pool.filter(q => !equipmentPool.slice(0, equipmentPool.length - targets["Equipment Evaluation, Maintenance & Operation"] + 1).includes(q));
      expect(() => selectMappedMockQuestions(insufficient, targets, 100, q => resolveWastewaterMockArea(bankKey, q), seeded(1))).toThrow("Insufficient reviewed coverage");
      expect(() => selectMappedMockQuestions([...pool, pool[0]], targets, 100, q => resolveWastewaterMockArea(bankKey, q), seeded(1))).toThrow("Duplicate");
      report.banks[bankKey] = { sourceRows: rows.length, eligible: Object.keys(entries).length, excluded: manifestBank.excludedQuestionNums.length, counts, targets, runs };
    }
    expect(JSON.stringify(snapshot)).toBe(before);
    writeFileSync(outputPath, JSON.stringify(report, null, 2) + "\n", { mode: 0o600 });
  });

  it.each([["class1-wastewater", "class1-ww"], ["class2-wastewater", "class2-ww"]] as const)(
    "issues %s via the actual router with unchanged modules, signatures and no answer/governance disclosure", async (bankKey, courseKey) => {
      const rows = snapshot.questions.filter((row: any) => row.bankKey === bankKey);
      const meta = snapshot.metadata.filter((row: any) => row.bankKey === bankKey);
      vi.mocked(getDb).mockResolvedValue({ select: () => {
        let result: unknown[];
        const chain: any = {
          from(table: unknown) { result = table === questions ? rows : meta; return chain; },
          where() { return chain; }, limit() { return Promise.resolve(result); },
          then(ok: any, no: any) { return Promise.resolve(result).then(ok, no); },
        };
        return chain;
      } } as any);
      const before = JSON.stringify(rows);
      const caller = appRouter.createCaller({ user: null, studentEmail: identity.studentEmail, req: { headers: {}, cookies: {} }, res: {} } as any);
      const issued = await caller.exam.startMock({ courseKey });
      expect(issued.questions).toHaveLength(100);
      expect(new Set(issued.questions.map(q => q.id)).size).toBe(100);
      expect(issued).toMatchObject({ duration: 10800, examType: courseKey, preview: false });
      const manifest = verifyMockSession(issued.token, mockOwner(identity));
      expect(manifest.questionNums).toEqual(issued.questions.map(q => q.id));
      expect(manifest).toMatchObject({ bankKey, courseKey, attribution: { orgId: null, organizationMemberId: null, flexLicenceId: null } });
      const pool = parseLearnerQuestions(rows);
      for (const [area, quota] of Object.entries(ontarioWastewaterMockProfile(bankKey)!.targets)) {
        expect(issued.questions.filter(q => resolveWastewaterMockArea(bankKey, pool.find(row => row.id === q.id)!) === area)).toHaveLength(quota);
      }
      for (const q of issued.questions) {
        expect(q.module === rows.find((row: any) => row.questionNum === q.id).module).toBe(true);
        for (const field of ["correctIndex", "explanation", "reviewStatus", "blueprintObjective", "sha256", "area", "provenance"]) expect(q).not.toHaveProperty(field);
      }
      expect(JSON.stringify(rows)).toBe(before);
    },
  );
});
