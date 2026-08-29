import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const requireDatabase = process.env.REQUIRE_OIT_IMPORTER_DB === "1";
const hasDatabase = Boolean(process.env.DATABASE_URL);
if (requireDatabase && !hasDatabase) {
  throw new Error("DATABASE_URL is required when REQUIRE_OIT_IMPORTER_DB=1.");
}

const integrationDescribe = describe.skipIf(!hasDatabase);
const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDirectory, "..");
const sourceQuestion = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "content", "oit", "questions", "oit-water-500.json"), "utf8"),
)[0];
const suffix = `${process.pid}_${Date.now()}`;
const questionsTable = `oit_import_questions_${suffix}`;
const metaTable = `oit_import_meta_${suffix}`;

let connection: any;
let importOitPayloads: (input: {
  connection: any;
  payloads: any[];
  log?: (message: string) => void;
  questionsTable?: string;
  metaTable?: string;
}) => Promise<any>;

function question(overrides: Record<string, unknown> = {}) {
  return {
    ...sourceQuestion,
    bankKey: "oit-test",
    questionNum: 1001,
    steps: "Verify the stated values before calculating.",
    tip: "Keep the units visible.",
    ...overrides,
  };
}

function payload(questions = [question()]) {
  return [{ bankKey: "oit-test", questions }];
}

function importPayloads(payloads: any[]) {
  return importOitPayloads({
    connection,
    payloads,
    log: () => undefined,
    questionsTable,
    metaTable,
  });
}

async function insertStoredQuestion(row: any, reviewStatus = "in_review") {
  await connection.execute(
    `INSERT INTO \`${questionsTable}\`
      (bankKey, questionNum, module, difficulty, question, options, correctIndex,
       explanation, steps, tip, isCalc, topic, cognitiveLevel, sourceTitle,
       sourceReference, sourceUrl, blueprintObjective, reviewStatus)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.bankKey, row.questionNum, row.module, row.difficulty, row.question,
      JSON.stringify(row.options), row.correctIndex, row.explanation, row.steps ?? null,
      row.tip ?? null, row.isCalc, row.topic, row.cognitiveLevel, row.sourceTitle,
      row.sourceReference, row.sourceUrl, row.blueprintObjective, reviewStatus,
    ],
  );
}

integrationDescribe("OIT importer database integration", () => {
  beforeAll(async () => {
    const mysql = await import("mysql2/promise");
    connection = await mysql.createConnection(process.env.DATABASE_URL!);
    // @ts-expect-error The importer service is an ESM JavaScript module intentionally used by the CLI.
    ({ importOitPayloads } = await import("../scripts/lib/oitImporter.mjs"));

    await connection.execute(`CREATE TABLE \`${metaTable}\` (
      bankKey VARCHAR(100) PRIMARY KEY,
      totalQuestions INT NOT NULL DEFAULT 0,
      contentVersion INT NOT NULL DEFAULT 1
    )`);
    await connection.execute(`CREATE TABLE \`${questionsTable}\` (
      bankKey VARCHAR(100) NOT NULL,
      questionNum INT NOT NULL,
      module VARCHAR(255) NOT NULL,
      difficulty VARCHAR(32) NOT NULL,
      question TEXT NOT NULL,
      options JSON NOT NULL,
      correctIndex INT NOT NULL,
      explanation TEXT NOT NULL,
      steps TEXT NULL,
      tip TEXT NULL,
      isCalc VARCHAR(8) NOT NULL,
      topic VARCHAR(255) NULL,
      cognitiveLevel VARCHAR(64) NULL,
      sourceTitle VARCHAR(500) NULL,
      sourceReference TEXT NULL,
      sourceUrl TEXT NULL,
      blueprintObjective TEXT NULL,
      reviewStatus VARCHAR(32) NOT NULL,
      reviewedBy BIGINT NULL,
      reviewedAt DATETIME NULL,
      PRIMARY KEY (bankKey, questionNum)
    )`);
  });

  beforeEach(async () => {
    await connection.execute(`DELETE FROM \`${questionsTable}\``);
    await connection.execute(`DELETE FROM \`${metaTable}\``);
    await connection.execute(`INSERT INTO \`${metaTable}\` (bankKey, totalQuestions, contentVersion) VALUES ('oit-test', 0, 7)`);
  });

  afterAll(async () => {
    if (!connection) return;
    await connection.execute(`DROP TABLE IF EXISTS \`${questionsTable}\``);
    await connection.execute(`DROP TABLE IF EXISTS \`${metaTable}\``);
    await connection.end();
  });

  it("inserts fresh content in review, preserves steps and tip, and refreshes metadata", async () => {
    const result = await importPayloads(payload());
    expect(result).toMatchObject({ inserted: 1, movedToReview: 0, identical: 0, verified: 1 });

    const [rows] = await connection.execute(`SELECT reviewStatus, steps, tip FROM \`${questionsTable}\` WHERE bankKey='oit-test' AND questionNum=1001`);
    expect(rows[0]).toEqual(expect.objectContaining({
      reviewStatus: "in_review",
      steps: "Verify the stated values before calculating.",
      tip: "Keep the units visible.",
    }));
    const [meta] = await connection.execute(`SELECT totalQuestions, contentVersion FROM \`${metaTable}\` WHERE bankKey='oit-test'`);
    expect(meta[0]).toEqual(expect.objectContaining({ totalQuestions: 0, contentVersion: 8 }));
  });

  it("is idempotent and does not bump metadata for an identical replay", async () => {
    await importPayloads(payload());
    const result = await importPayloads(payload());
    expect(result).toMatchObject({ inserted: 0, movedToReview: 0, identical: 1, verified: 1 });
    const [meta] = await connection.execute(`SELECT contentVersion FROM \`${metaTable}\` WHERE bankKey='oit-test'`);
    expect(meta[0].contentVersion).toBe(8);
  });

  it.each([
    ["question", "Changed immutable stem"],
    ["steps", "Changed immutable steps"],
    ["tip", "Changed immutable tip"],
  ])("rejects an immutable %s conflict", async (field, changedValue) => {
    await insertStoredQuestion(question());
    await expect(importPayloads(payload([question({ [field]: changedValue })]))).rejects.toThrow(/Immutable OIT content conflict/);
  });

  it("rolls back an earlier insert when a later row conflicts", async () => {
    await insertStoredQuestion(question({ questionNum: 1002 }));
    await expect(importPayloads(payload([
      question({ questionNum: 1001 }),
      question({ questionNum: 1002, question: "Conflicting deployed content" }),
    ]))).rejects.toThrow(/Immutable OIT content conflict/);
    const [rows] = await connection.execute(`SELECT questionNum FROM \`${questionsTable}\` WHERE bankKey='oit-test' ORDER BY questionNum`);
    expect(rows.map((row: any) => row.questionNum)).toEqual([1002]);
    const [meta] = await connection.execute(`SELECT contentVersion FROM \`${metaTable}\` WHERE bankKey='oit-test'`);
    expect(meta[0].contentVersion).toBe(7);
  });

  it("moves only legacy unreviewed rows to review and preserves deliberate decisions", async () => {
    await insertStoredQuestion(question({ questionNum: 1001 }), "unreviewed");
    await insertStoredQuestion(question({ questionNum: 1002 }), "approved");
    await insertStoredQuestion(question({ questionNum: 1003 }), "rejected");
    const result = await importPayloads(payload([
      question({ questionNum: 1001 }),
      question({ questionNum: 1002 }),
      question({ questionNum: 1003 }),
    ]));
    expect(result).toMatchObject({ inserted: 0, movedToReview: 1, identical: 2, verified: 3 });
    const [rows] = await connection.execute(`SELECT questionNum, reviewStatus FROM \`${questionsTable}\` ORDER BY questionNum`);
    expect(rows).toEqual([
      expect.objectContaining({ questionNum: 1001, reviewStatus: "in_review" }),
      expect.objectContaining({ questionNum: 1002, reviewStatus: "approved" }),
      expect.objectContaining({ questionNum: 1003, reviewStatus: "rejected" }),
    ]);
    const [meta] = await connection.execute(`SELECT totalQuestions, contentVersion FROM \`${metaTable}\` WHERE bankKey='oit-test'`);
    expect(meta[0]).toEqual(expect.objectContaining({ totalQuestions: 1, contentVersion: 8 }));
  });

  it("fails safely when bank metadata is missing", async () => {
    await connection.execute(`DELETE FROM \`${metaTable}\` WHERE bankKey='oit-test'`);
    await expect(importPayloads(payload())).rejects.toThrow(/Missing question_bank_meta/);
    const [rows] = await connection.execute(`SELECT COUNT(*) AS count FROM \`${questionsTable}\``);
    expect(Number(rows[0].count)).toBe(0);
  });

  it("keeps in-review rows out of the learner-visible count", async () => {
    await importPayloads(payload());
    await insertStoredQuestion(question({ questionNum: 1002 }), "approved");
    const [rows] = await connection.execute(`SELECT COUNT(*) AS count FROM \`${questionsTable}\` WHERE reviewStatus NOT IN ('in_review', 'rejected')`);
    expect(Number(rows[0].count)).toBe(1);
  });

  it("rejects unsafe test table identifiers", async () => {
    await expect(importOitPayloads({
      connection,
      payloads: payload(),
      questionsTable: "questions; DROP TABLE questions",
      metaTable,
    })).rejects.toThrow(/Unsafe table name/);
  });
});
