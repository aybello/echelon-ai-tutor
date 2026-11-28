import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { MySqlDialect, getTableConfig } from "drizzle-orm/mysql-core";
import type { SQL } from "drizzle-orm";
import { recruitmentAssessments } from "../../drizzle/schema";
import {
  candidateQuestions, normalizeRecruitmentDifficulty, recruitmentCreateInput,
  recruitmentDifficultyLabel, scoreRecruitment, selectRecruitmentQuestions,
  type RecruitmentDifficultyMode, type RecruitmentQuestion,
} from "../../shared/recruitmentAssessment";
import { assertRecruitmentSourcesVisible, loadRecruitmentPools, usableRecruitmentQuestion } from "./questions";
import type { RecruitmentReadDb } from "./types";

const input = { orgId: 7, title: "Synthetic difficulty form", courseKey: "class2-water", questionCount: 5, timeLimitMinutes: null, expiresInDays: 7 };
const question = (n: number, difficulty: RecruitmentQuestion["difficulty"] = null, module = "Treatment"): RecruitmentQuestion => ({ id: String(n), module, prompt: `Synthetic ${n}`, options: ["One", "Two"], correctIndex: 1, difficulty });

describe("difficulty-first recruitment contract and selection", () => {
  it("registers exactly one additive standalone nullable mode column with an immutable checksum and no backfill", () => {
    const sql = readFileSync(new URL("../../drizzle/0088_recruitment_difficulty_mode.sql", import.meta.url), "utf8");
    const manifest = JSON.parse(readFileSync(new URL("../../drizzle/forward-migrations.json", import.meta.url), "utf8"));
    const migration = manifest.migrations.find((entry: { version: number }) => entry.version === 88);
    expect(migration).toMatchObject({ tag: "0088_recruitment_difficulty_mode", proposedOnly: true,
      standaloneApply: { tables: ["recruitment_assessments"] },
      verifierAllowMissingColumns: [{ table: "recruitment_assessments", column: "difficultyMode", targetType: "enum('mixed','medium','hard')", targetNullable: true }] });
    expect(migration.sha256).toBe(createHash("sha256").update(sql).digest("hex"));
    const statements = sql.replace(/^--.*$/gm, "").trim().split(";").filter(statement => statement.trim());
    expect(statements).toHaveLength(1);
    expect(statements[0].trim()).toBe("ALTER TABLE `recruitment_assessments` ADD COLUMN `difficultyMode` enum('mixed','medium','hard') NULL");
    expect(sql.replace(/^--.*$/gm, "")).not.toMatch(/UPDATE|INSERT|DELETE|DROP|DEFAULT|NOT NULL|recruitment_assignments/i);
  });

  it("defaults legacy creation to Mixed with optional automatic topics without weakening strict settings", () => {
    expect(recruitmentCreateInput.parse(input)).toEqual({ ...input, difficultyMode: "mixed", modules: [], passingScore: 70 });
    expect(recruitmentCreateInput.parse({ ...input, modules: ["Treatment"] }).difficultyMode).toBe("mixed");
    for (const difficultyMode of ["easy", "HARD", "unknown", null, 1]) {
      expect(recruitmentCreateInput.safeParse({ ...input, difficultyMode }).success).toBe(false);
    }
    expect(recruitmentCreateInput.safeParse({ ...input, modules: null }).success).toBe(false);
    expect(recruitmentCreateInput.safeParse({ ...input, modules: ["Treatment", "Treatment"] }).success).toBe(false);
    expect(recruitmentCreateInput.safeParse({ ...input, score: 100 }).success).toBe(false);
  });

  it.each([
    [" EASY ", "easy"], ["MeDIuM", "medium"], ["\tHARD\n", "hard"],
    [null, null], [undefined, null], ["difficult", null], ["", null], ["medium-hard", null], [1, null],
  ])("normalizes only exact authored difficulty %j", (value, expected) => {
    expect(normalizeRecruitmentDifficulty(value)).toBe(expected);
    expect(usableRecruitmentQuestion({ id: 1, module: "Treatment", question: "Synthetic", options: '["One","Two"]', correctIndex: 1,
      difficulty: value, cognitiveLevel: "hard" } as Parameters<typeof usableRecruitmentQuestion>[0])?.difficulty).toBe(expected);
  });

  it("labels missing historical modes as Not recorded, never Mixed", () => {
    expect(["mixed", "medium", "hard"].map(mode => recruitmentDifficultyLabel(mode as RecruitmentDifficultyMode))).toEqual(["Mixed", "Medium", "Hard"]);
    expect(recruitmentDifficultyLabel(null)).toBe("Not recorded");
    expect(recruitmentDifficultyLabel(undefined)).toBe("Not recorded");
    const column = getTableConfig(recruitmentAssessments).columns.find(column => column.name === "difficultyMode")!;
    expect(column.notNull).toBe(false); expect(column.hasDefault).toBe(false);
  });

  it("automatically round-robins all matching topics, without demanding every available topic", () => {
    const pool = Array.from({ length: 8 }, (_, i) => question(i + 1, "hard", `Topic ${i}`));
    const before = structuredClone(pool), selected = selectRecruitmentQuestions(pool, [], 5, () => 0.3, "hard");
    expect(selected).toHaveLength(5); expect(new Set(selected.map(q => q.module)).size).toBe(5);
    expect(pool).toEqual(before);
    const balanced = Array.from({ length: 12 }, (_, i) => question(i + 1, "medium", i < 8 ? "Treatment" : "Safety"));
    const form = selectRecruitmentQuestions(balanced, [], 7, () => 0.3, "medium");
    expect(Math.abs(form.filter(q => q.module === "Treatment").length - form.filter(q => q.module === "Safety").length)).toBe(1);
  });

  it("covers every explicit topic after mode filtering and refuses missing mode-topic combinations", () => {
    const pool = [...Array.from({ length: 5 }, (_, i) => question(i + 1, "hard")), question(6, "medium", "Safety"), question(7, "hard", "Controls")];
    const selected = selectRecruitmentQuestions(pool, ["Treatment", "Controls"], 5, () => 0.3, "hard");
    expect(new Set(selected.map(q => q.module))).toEqual(new Set(["Treatment", "Controls"]));
    expect(selected.every(q => q.difficulty === "hard")).toBe(true);
    expect(() => selectRecruitmentQuestions(pool, ["Treatment", "Safety"], 5, () => 0.3, "hard")).toThrow(/selected topic.*Hard mode/);
    expect(() => selectRecruitmentQuestions(pool, ["Treatment", "Controls"], 1, () => 0.3, "hard")).toThrow(/one question/);
  });

  it("does not replace scarce Hard questions with Medium, Easy, unknown, or unlabelled content", () => {
    const pool = [question(1, "hard"), question(2, "hard"), question(3, "medium"), question(4, "easy"), question(5),
      { ...question(6), difficulty: "unknown", cognitiveLevel: "hard" } as unknown as RecruitmentQuestion];
    expect(() => selectRecruitmentQuestions(pool, [], 5, () => 0.3, "hard")).toThrow(/Not enough usable questions for Hard mode/);
    expect(() => selectRecruitmentQuestions(pool, [], 5, () => 0.3, "medium")).toThrow(/Not enough usable questions for Medium mode/);
    expect(selectRecruitmentQuestions(pool, [], 6, () => 0.3, "mixed")).toHaveLength(6);
    expect(() => selectRecruitmentQuestions([], [], 5, () => 0.3, "hard")).toThrow(/Not enough usable/);
  });

  it("does not infer difficulty from a sibling bank or cognitiveLevel", async () => {
    const rows = [
      { bankKey: "class2-water", id: 1, module: "Treatment", question: "Synthetic one", options: '["One","Two"]', correctIndex: 1, difficulty: null, cognitiveLevel: "hard" },
      { bankKey: "class2-water-dist", id: 2, module: "Treatment", question: "Synthetic two", options: '["One","Two"]', correctIndex: 1, difficulty: " HARD " },
    ];
    const db = { select: () => ({ from: () => ({ where: () => ({ orderBy: async () => rows }) }) }) } as unknown as RecruitmentReadDb;
    const pools = await loadRecruitmentPools(db, ["class2-water", "class2-water-dist"]);
    expect(pools.get("class2-water")?.[0].difficulty).toBeNull();
    expect(pools.get("class2-water-dist")?.[0].difficulty).toBe("hard");
    expect(() => selectRecruitmentQuestions(pools.get("class2-water")!, [], 1, () => 0.3, "hard")).toThrow(/Not enough usable/);
  });
});

describe("difficulty-bearing source acceptance and historical delivery", () => {
  const snapshot = Array.from({ length: 5 }, (_, i) => question(i + 1, i === 2 ? "hard" : null));
  function sourceDb(difficulty: string | null) {
    const reads: { id: number; lock: string }[] = [];
    const db = { select: vi.fn(() => ({ from: () => ({ where: (filter: SQL) => ({ limit: () => ({ for: async (lock: string) => {
      const id = Number(new MySqlDialect().sqlToQuery(filter).params[0]); reads.push({ id, lock });
      const q = snapshot[id - 1];
      return [{ id, module: q.module, question: q.prompt, options: JSON.stringify(q.options), correctIndex: q.correctIndex,
        difficulty: id === 3 ? difficulty : q.difficulty }];
    } }) }) }) })) } as unknown as RecruitmentReadDb;
    return { db, reads };
  }

  it.each(["medium", "easy", "unknown", null])("rejects changed normalized difficulty %j before accepting creation, with snapshot untouched", async value => {
    const { db, reads } = sourceDb(value), before = structuredClone(snapshot);
    await expect(assertRecruitmentSourcesVisible(db, "class2-water", snapshot, { requireUnchangedPayload: true })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(reads).toEqual([1, 2, 3].map(id => ({ id, lock: "share" })));
    expect(snapshot).toEqual(before);
  });

  it("accepts equivalent uppercase/whitespace difficulty while freezing normalized metadata", async () => {
    const { db, reads } = sourceDb(" HARD ");
    await expect(assertRecruitmentSourcesVisible(db, "class2-water", snapshot, { requireUnchangedPayload: true })).resolves.toBeUndefined();
    expect(reads).toHaveLength(5); expect(snapshot[2].difficulty).toBe("hard");
  });

  it("rejects newly tagged sources sampled as null even in Mixed mode", async () => {
    const { db } = sourceDb("hard"), sampled = snapshot.map(q => ({ ...q, difficulty: null }));
    await expect(assertRecruitmentSourcesVisible(db, "class2-water", sampled, { requireUnchangedPayload: true })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("keeps historical and recorded forms visibility-only after difficulty edits, with unchanged scoring and candidate redaction", async () => {
    const historical = snapshot.map(({ difficulty: _difficulty, ...q }) => q), before = structuredClone(historical);
    const { db } = sourceDb("medium");
    await expect(assertRecruitmentSourcesVisible(db, "class2-water", historical)).resolves.toBeUndefined();
    await expect(assertRecruitmentSourcesVisible(db, "class2-water", snapshot)).resolves.toBeUndefined();
    expect(historical).toEqual(before); expect(historical.every(q => !Object.hasOwn(q, "difficulty"))).toBe(true);
    expect(scoreRecruitment(snapshot, { "3": 1 })).toEqual(scoreRecruitment(historical, { "3": 1 }));
    expect(candidateQuestions(snapshot)).toEqual(candidateQuestions(historical));
    expect(JSON.stringify(candidateQuestions(snapshot))).not.toMatch(/correctIndex|difficulty|explanation|score/);
  });
});
