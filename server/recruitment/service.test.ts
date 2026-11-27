import { getTableName } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Organization, OrganizationMember, RecruitmentAssessmentRow, RecruitmentAssignmentRow } from "../../drizzle/schema";
import type { TrpcContext } from "../_core/context";

const mocks = vi.hoisted(() => ({ recruitmentManager: vi.fn(), assertRecruitmentSeat: vi.fn(), recruitmentDb: vi.fn(), readRecruitmentAssessment: vi.fn(), persistRecruitmentTransition: vi.fn() }));
vi.mock("./access", async original => ({ ...await original<typeof import("./access")>(), recruitmentManager: mocks.recruitmentManager, assertRecruitmentSeat: mocks.assertRecruitmentSeat }));
vi.mock("./store", () => ({ recruitmentDb: mocks.recruitmentDb, readRecruitmentAssessment: mocks.readRecruitmentAssessment, persistRecruitmentTransition: mocks.persistRecruitmentTransition }));
import { inviteRecruitmentCandidate, recruitmentDefinitionSummary, revokeRecruitmentAssignment } from "./service";
import { recruitmentResult } from "./state";

const NOW = Date.parse("2026-11-27T19:00:00Z");
const ID = "11111111-1111-4111-8111-111111111111";
const FORM_ID = "22222222-2222-4222-8222-222222222222";
const EMAIL = "manager@example.test";
const context = { user: null, studentEmail: EMAIL, req: {}, res: {} } as unknown as TrpcContext;
const org = () => ({ id: 7, name: "Synthetic utility", province: "ontario", tier: "all-access", billingType: "stripe", status: "active", termStart: new Date(NOW - 1000), termEnd: new Date(NOW + 86_400_000), managerEmail: EMAIL } as Organization);
const member = () => ({ id: 31, orgId: 7, email: "candidate@example.test", name: "Synthetic candidate", role: "operator", status: "assigned", courseKey: "class2-water", courseKeys: null } as OrganizationMember);
const form = () => ({ id: FORM_ID, orgId: 7, title: "Synthetic assessment", courseKey: "class2-water", courseLabel: "Class 2 Water", modules: ["Treatment"], questionCount: 5, timeLimitMinutes: 5, createdAtMs: NOW - 1000, expiresAtMs: NOW + 900_000,
  questions: Array.from({ length: 5 }, (_, i) => ({ id: `q${i + 1}`, module: "Treatment", prompt: `Synthetic prompt ${i + 1}`, options: ["One", "Two"], correctIndex: 0 })),
} as RecruitmentAssessmentRow);
const invited = () => ({ id: ID, assessmentId: FORM_ID, orgId: 7, memberId: 31, candidateEmail: member().email, candidateName: member().name, creatorEmail: EMAIL, status: "invited", startedAtMs: null, submittedAtMs: null, consentVersion: null, consentAcceptedAtMs: null, expiresAtMs: NOW + 900_000, createdAtMs: NOW - 1000, updatedAtMs: NOW - 1000, answers: {}, score: null, revision: 0, revokedAtMs: null, revokedByEmail: null } as RecruitmentAssignmentRow);
const active = () => ({ ...invited(), status: "active" as const, startedAtMs: NOW, revision: 1 });

/** Read/write spy only: no assertion of real MySQL transaction isolation. */
function fakeManagerDb(lockedOrg: Organization, existing?: RecruitmentAssignmentRow) {
  const reads: { table: string; lock: string | null }[] = [];
  const insertValues = vi.fn(async () => undefined);
  const insert = vi.fn(() => ({ values: insertValues }));
  const tx = {
    select: vi.fn(() => ({ from: (table: Parameters<typeof getTableName>[0]) => ({ where: () => {
      const name = getTableName(table), read = { table: name, lock: null as string | null };
      reads.push(read);
      const rows = name === "organizations" ? [lockedOrg] : name === "recruitment_assignments" ? (existing ? [existing] : []) : [];
      const builder = {
        limit: () => builder,
        for: (lock: string) => { read.lock = lock; return builder; },
        then: (resolve: (value: unknown[]) => unknown, reject?: (reason: unknown) => unknown) => Promise.resolve(rows).then(resolve, reject),
      };
      return builder;
    } }) })),
    insert,
  };
  const db = { transaction: vi.fn(async (callback: (tx: unknown) => unknown) => callback(tx)) };
  mocks.recruitmentDb.mockResolvedValue(db);
  return { db, reads, insert, insertValues };
}

beforeEach(() => {
  vi.resetAllMocks(); vi.useFakeTimers(); vi.setSystemTime(NOW);
  mocks.recruitmentManager.mockResolvedValue(org());
  mocks.assertRecruitmentSeat.mockResolvedValue(member());
  mocks.readRecruitmentAssessment.mockResolvedValue(form());
  mocks.persistRecruitmentTransition.mockResolvedValue(undefined);
});
afterEach(() => vi.useRealTimers());

describe("recruitment duplicate invitations", () => {
  it.each(["invited", "active"] as const)("returns the original usable %s invitation without inserting or resetting it", async status => {
    const row = status === "active" ? active() : invited(), before = structuredClone(row);
    const db = fakeManagerDb(org(), row);
    expect(await inviteRecruitmentCandidate(context, 7, FORM_ID, 31)).toEqual({ assignmentId: ID });
    expect(row).toEqual(before); expect(db.insert).not.toHaveBeenCalled();
    expect(mocks.persistRecruitmentTransition).not.toHaveBeenCalled();
    expect(db.reads[0]).toEqual({ table: "organizations", lock: "update" });
  });
  it.each(["submitted", "timed_out", "expired", "revoked"] as const)("rejects duplicate terminal %s invitations with a new-form-required conflict", async status => {
    const row = { ...active(), status }, before = structuredClone(row), db = fakeManagerDb(org(), row);
    await expect(inviteRecruitmentCandidate(context, 7, FORM_ID, 31)).rejects.toMatchObject({ code: "CONFLICT", message: expect.stringMatching(/new assessment form/i) });
    expect(row).toEqual(before); expect(db.insert).not.toHaveBeenCalled(); expect(mocks.persistRecruitmentTransition).not.toHaveBeenCalled();
  });
  it.each([
    ["assessment expiry", "invited", NOW, NOW + 900_000, NOW],
    ["assignment expiry", "invited", NOW + 900_000, NOW, NOW],
    ["active assessment expiry", "active", NOW, NOW + 900_000, NOW],
    ["active assignment expiry", "active", NOW + 900_000, NOW, NOW],
    ["timer boundary", "active", NOW + 900_000, NOW + 900_000, NOW + 300_000],
    ["elapsed timer", "active", NOW + 900_000, NOW + 900_000, NOW + 300_001],
  ] as const)("rejects effectively unusable duplicate invitation at %s", async (_label, status, formExpiry, rowExpiry, nowMs) => {
    mocks.readRecruitmentAssessment.mockResolvedValue({ ...form(), expiresAtMs: formExpiry });
    const row = { ...(status === "active" ? active() : invited()), expiresAtMs: rowExpiry };
    const db = fakeManagerDb(org(), row); vi.setSystemTime(nowMs);
    await expect(inviteRecruitmentCandidate(context, 7, FORM_ID, 31)).rejects.toMatchObject({ code: "CONFLICT", message: expect.stringMatching(/new assessment form/i) });
    expect(db.insert).not.toHaveBeenCalled(); expect(mocks.persistRecruitmentTransition).not.toHaveBeenCalled();
  });
  it("permits an active duplicate just before its unchanged timer deadline", async () => {
    const row = active(), db = fakeManagerDb(org(), row); vi.setSystemTime(NOW + 299_999);
    expect(await inviteRecruitmentCandidate(context, 7, FORM_ID, 31)).toEqual({ assignmentId: ID });
    expect(row.startedAtMs).toBe(NOW); expect(db.insert).not.toHaveBeenCalled();
  });
  it("inserts one new original invitation only for an unexpired form", async () => {
    const db = fakeManagerDb(org());
    const result = await inviteRecruitmentCandidate(context, 7, FORM_ID, 31);
    expect(db.insertValues).toHaveBeenCalledOnce();
    expect(db.insertValues).toHaveBeenCalledWith(expect.objectContaining({ id: result.assignmentId, assessmentId: FORM_ID, orgId: 7, memberId: 31, status: "invited", answers: {}, revision: 0, expiresAtMs: form().expiresAtMs }));
  });
  it("rejects an expired form without inserting a new invitation", async () => {
    mocks.readRecruitmentAssessment.mockResolvedValue({ ...form(), expiresAtMs: NOW });
    const db = fakeManagerDb(org());
    await expect(inviteRecruitmentCandidate(context, 7, FORM_ID, 31)).rejects.toMatchObject({ code: "CONFLICT" });
    expect(db.insert).not.toHaveBeenCalled();
  });
});

describe("recruitment revocation reporting boundary and retained evidence", () => {
  it.each([{ billingType: "course-pass" }, { tier: "course-pass" }])("rejects a locked organization that changed to Flex (%j)", async override => {
    const db = fakeManagerDb({ ...org(), ...override } as Organization, active());
    await expect(revokeRecruitmentAssignment(context, 7, ID)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.reads).toEqual([{ table: "organizations", lock: "share" }]);
    expect(mocks.persistRecruitmentTransition).not.toHaveBeenCalled();
  });
  it("retains submitted evidence, completion count and recomputed review after revocation", async () => {
    const row = { ...active(), status: "submitted" as const, submittedAtMs: NOW - 100, answers: { q1: 0 }, score: { correct: 999 } as RecruitmentAssignmentRow["score"] };
    fakeManagerDb(org(), row);
    expect(await revokeRecruitmentAssignment(context, 7, ID)).toEqual({ success: true });
    const next = mocks.persistRecruitmentTransition.mock.calls[0][2] as RecruitmentAssignmentRow;
    expect(next).toMatchObject({ status: "revoked", submittedAtMs: NOW - 100, answers: { q1: 0 }, revokedAtMs: NOW, revokedByEmail: EMAIL });
    expect(recruitmentDefinitionSummary(form(), [next], NOW).completed).toBe(1);
    expect(recruitmentResult(form(), next, NOW)).toMatchObject({ status: "revoked", answers: { q1: 0 }, score: { correct: 1, answered: 1 } });
  });
  it("finalizes an elapsed active timer before revoking and keeps that completion evidence", async () => {
    fakeManagerDb(org(), { ...active(), answers: { q1: 0 } }); vi.setSystemTime(NOW + 300_000);
    await revokeRecruitmentAssignment(context, 7, ID);
    const next = mocks.persistRecruitmentTransition.mock.calls[0][2] as RecruitmentAssignmentRow;
    expect(next).toMatchObject({ status: "revoked", submittedAtMs: NOW + 300_000, score: { correct: 1 }, revision: 3 });
    expect(recruitmentDefinitionSummary(form(), [next], NOW + 300_000).completed).toBe(1);
  });
});
