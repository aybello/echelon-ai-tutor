import { MySqlDialect } from "drizzle-orm/mysql-core";
import type { SQL } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { assertRecruitmentSnapshot, assertRecruitmentSourcesVisible, loadRecruitmentPool, usableRecruitmentQuestion, type RecruitmentBankRow } from "./questions";
import type { RecruitmentReadDb } from "./types";
import type { RecruitmentQuestion } from "../../shared/recruitmentAssessment";

const row: RecruitmentBankRow = { id: 1, module: "Treatment", question: "Synthetic question", options: JSON.stringify(["Option one", "Option two"]), correctIndex: 1 };
const snapshot: RecruitmentQuestion[] = Array.from({ length: 5 }, (_, i) => ({ id: String(i + 1), module: "Treatment", prompt: `Synthetic question ${i + 1}`, options: ["One", "Two"], correctIndex: 0 }));

describe("recruitment usable question pool", () => {
  it("projects only required snapshot fields from a valid authoritative row", () => {
    expect(usableRecruitmentQuestion({ ...row, explanation: "not part of the recruitment snapshot" } as RecruitmentBankRow)).toEqual({ id: "1", module: "Treatment", prompt: "Synthetic question", options: ["Option one", "Option two"], correctIndex: 1 });
  });

  it.each([
    ["unparseable options", { options: "{malformed-json}" }],
    ["options object", { options: '{"0":"One","1":"Two"}' }],
    ["null options", { options: "null" }],
    ["one option", { options: '["One"]' }],
    ["too many options", { options: JSON.stringify(Array.from({ length: 9 }, (_, i) => `Option ${i}`)) }],
    ["blank option", { options: '["One"," "]' }],
    ["non-string option", { options: '["One",2]' }],
    ["negative key", { correctIndex: -1 }],
    ["outside key", { correctIndex: 2 }],
    ["fractional key", { correctIndex: 0.5 }],
    ["string key", { correctIndex: "1" }],
    ["missing module", { module: "" }],
    ["blank prompt", { question: " \n " }],
    ["zero ID", { id: 0 }],
    ["fractional ID", { id: 1.5 }],
    ["unsafe ID", { id: Number.MAX_SAFE_INTEGER + 1 }],
  ])("withholds %s from usable catalog counts and selection", (_label, overrides) => {
    expect(usableRecruitmentQuestion({ ...row, ...overrides } as RecruitmentBankRow)).toBeNull();
  });

  it("queries the requested bank with governed learner visibility and removes malformed rows", async () => {
    const orderBy = vi.fn().mockResolvedValue([row, { ...row, id: 2, options: "{bad}" }]);
    const where = vi.fn((_filter: SQL) => ({ orderBy }));
    const from = vi.fn(() => ({ where }));
    const db = { select: vi.fn(() => ({ from })) } as unknown as RecruitmentReadDb;
    expect(await loadRecruitmentPool(db, "synthetic-bank")).toEqual([usableRecruitmentQuestion(row)]);
    const predicate = new MySqlDialect().sqlToQuery(where.mock.calls[0][0]);
    expect(predicate.sql).toContain("`questions`.`bankKey` = ?");
    expect(predicate.sql).toContain("`questions`.`reviewStatus` not in");
    expect(predicate.params[0]).toBe("synthetic-bank");
    expect(predicate.params).toContain("in_review");
    expect(predicate.params).toContain("rejected");
    expect(orderBy).toHaveBeenCalledOnce();
  });

  it("does not substitute fixtures when an authoritative bank has no usable questions", async () => {
    const db = { select: () => ({ from: () => ({ where: () => ({ orderBy: async () => [] }) }) }) } as unknown as RecruitmentReadDb;
    expect(await loadRecruitmentPool(db, "synthetic-missing-bank")).toEqual([]);
  });

  it("accepts a valid frozen snapshot without mutating its questions", () => {
    const before = structuredClone(snapshot);
    expect(assertRecruitmentSnapshot(snapshot)).toBe(snapshot);
    expect(snapshot).toEqual(before);
  });

  it.each([
    ["null", null], ["object", {}], ["undersized", snapshot.slice(0, 4)],
    ["oversized", Array.from({ length: 101 }, (_, i) => ({ ...snapshot[0], id: String(i) }))],
    ["duplicate IDs", [...snapshot.slice(0, 4), snapshot[0]]],
    ["null question", [...snapshot.slice(0, 4), null]],
    ["invalid answer key", snapshot.map((q, i) => i ? q : { ...q, correctIndex: 100 })],
  ])("refuses a corrupt %s snapshot with a safe content-unavailable error", (_label, value) => {
    try {
      assertRecruitmentSnapshot(value as RecruitmentQuestion[]);
      expect.fail("Invalid snapshot was accepted");
    } catch (error) {
      expect(error).toMatchObject({ code: "INTERNAL_SERVER_ERROR", message: "Assessment content is unavailable. Contact the hiring team." });
    }
  });
});

describe("current governed frozen source validation", () => {
  function sourcesDb(unavailableId?: number, override: Partial<RecruitmentBankRow> = {}) {
    const reads: { params: unknown[]; sql: string; lock?: string }[] = [];
    const db = { select: vi.fn((_fields: unknown) => ({ from: () => ({ where: (filter: SQL) => {
      const query = new MySqlDialect().sqlToQuery(filter), read = { ...query, lock: undefined as string | undefined };
      reads.push(read);
      return { limit: () => ({ for: async (lock: string) => {
        read.lock = lock;
        const id = Number(query.params[0]), sampled = snapshot.find(q => q.id === String(id)) ?? snapshot[0];
        return id === unavailableId ? [] : [{ id, module: sampled.module, question: sampled.prompt,
          options: JSON.stringify(sampled.options), correctIndex: sampled.correctIndex, ...(id === 3 ? override : {}) }];
      } }) };
    } }) })) };
    return { db: db as unknown as RecruitmentReadDb, reads, select: db.select };
  }

  it("locks exact authoritative IDs in numeric order with bank and governed predicates, not replacement content", async () => {
    const frozen = [10, 2, 9, 1, 11].map(id => ({ ...snapshot[0], id: String(id) })), before = structuredClone(frozen);
    const { db, reads } = sourcesDb();
    await assertRecruitmentSourcesVisible(db, "synthetic-bank", frozen);
    expect(reads.map(read => read.params[0])).toEqual([1, 2, 9, 10, 11]);
    for (const read of reads) {
      expect(read.lock).toBe("share");
      expect(read.params.slice(1)).toEqual(["synthetic-bank", "in_review", "rejected"]);
      expect(read.sql).toContain("`questions`.`id` = ?");
      expect(read.sql).toContain("`questions`.`bankKey` = ?");
      expect(read.sql).toContain("`questions`.`reviewStatus` not in");
    }
    expect(frozen).toEqual(before);
  });

  it("fails the whole frozen form on any unavailable source rather than shrinking or resampling", async () => {
    const before = structuredClone(snapshot), { db, reads } = sourcesDb(3);
    await expect(assertRecruitmentSourcesVisible(db, "synthetic-bank", snapshot)).rejects.toMatchObject({
      code: "PRECONDITION_FAILED", message: expect.stringMatching(/manager.*replacement assessment form/i),
    });
    expect(reads.map(read => read.params[0])).toEqual([1, 2, 3]); expect(snapshot).toEqual(before);
  });

  it("accepts unchanged creation payloads with parsed options equality and full source fields under ordered locks", async () => {
    const before = structuredClone(snapshot), { db, reads, select } = sourcesDb(undefined, { options: '[ "One", "Two" ]' });
    await assertRecruitmentSourcesVisible(db, "synthetic-bank", snapshot, { requireUnchangedPayload: true });
    expect(reads.map(read => read.params[0])).toEqual([1, 2, 3, 4, 5]);
    expect(reads.every(read => read.lock === "share")).toBe(true);
    expect(Object.keys(select.mock.calls[0][0] as object)).toEqual(["id", "module", "question", "options", "correctIndex"]);
    expect(snapshot).toEqual(before);
  });

  it.each([
    ["answer key", { correctIndex: 1 }], ["prompt", { question: "Edited prompt" }],
    ["module", { module: "Safety" }], ["option text", { options: '["One","Edited"]' }],
    ["option order", { options: '["Two","One"]' }], ["option count", { options: '["One","Two","Three"]' }],
    ["malformed JSON", { options: "{invalid}" }], ["options object", { options: '{"0":"One","1":"Two"}' }],
    ["blank option", { options: '["One"," "]' }], ["invalid key", { correctIndex: 2 }],
    ["blank prompt", { question: " " }], ["missing module", { module: "" }],
  ])("rejects changed or malformed locked creation %s without changing the snapshot", async (_label, override) => {
    const before = structuredClone(snapshot), { db, reads } = sourcesDb(undefined, override);
    await expect(assertRecruitmentSourcesVisible(db, "synthetic-bank", snapshot, { requireUnchangedPayload: true }))
      .rejects.toMatchObject({ code: "PRECONDITION_FAILED", message: expect.stringMatching(/manager.*replacement assessment form/i) });
    expect(reads.map(read => read.params[0])).toEqual([1, 2, 3]); expect(snapshot).toEqual(before);
  });

  it("never compares an already frozen form against newer authored payloads, even malformed newer options", async () => {
    const before = structuredClone(snapshot), { db, reads } = sourcesDb(undefined,
      { correctIndex: 1, module: "Safety", question: "Edited prompt", options: "{invalid}" });
    await assertRecruitmentSourcesVisible(db, "synthetic-bank", snapshot);
    expect(reads.map(read => read.params[0])).toEqual([1, 2, 3, 4, 5]); expect(snapshot).toEqual(before);
  });

  it.each(["q1", "01", "1e0", "0", "-1", "1.5", "9007199254740992"])("rejects non-authoritative ID %s before any question lookup", async id => {
    const { db, reads } = sourcesDb();
    await expect(assertRecruitmentSourcesVisible(db, "synthetic-bank", [{ ...snapshot[0], id }, ...snapshot.slice(1)])).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(reads).toEqual([]);
  });
});
