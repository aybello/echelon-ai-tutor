import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  applyReportedOitItemRepair,
  planReportedOitItemRepair,
  reportedOitItemRepairs,
} from "../scripts/lib/oitReportedItemRepair.mjs";

type Repair = (typeof reportedOitItemRepairs)[number];
type StoredRow = {
  id: number;
  bankKey: string;
  questionNum: number;
  question: string;
  options: string;
  correctIndex: number;
  explanation: string;
  sourceTitle: string | null;
  sourceReference: string | null;
  sourceUrl: string | null;
  reviewStatus: string;
};

type FailureMode = "question-update" | "readback" | "metadata-update" | "metadata-readback" | undefined;
const metadata = { bankKey: "oit", totalQuestions: 500, contentVersion: 12 };

function rowFor(repair: Repair, id: number, content = repair.expected): StoredRow {
  return {
    id,
    bankKey: repair.bankKey,
    questionNum: repair.questionNum,
    question: content.question,
    options: JSON.stringify(content.options),
    correctIndex: content.correctIndex,
    explanation: content.explanation,
    sourceTitle: content.sourceTitle,
    sourceReference: content.sourceReference,
    sourceUrl: content.sourceUrl,
    reviewStatus: "unreviewed",
  };
}

function expectedRows() {
  return reportedOitItemRepairs.map((repair: Repair) => rowFor(repair, repair.expectedId));
}

function createConnection({ rows = expectedRows(), failure }: { rows?: StoredRow[]; failure?: FailureMode } = {}) {
  let committed = false;
  let rolledBack = false;
  let contentVersionUpdates = 0;
  let contentVersion = metadata.contentVersion;
  let questionReadCount = 0;
  let metadataReadCount = 0;
  const events: string[] = [];
  const state = rows.map(row => ({ ...row }));
  let transactionSnapshot: { rows: StoredRow[]; contentVersion: number; contentVersionUpdates: number } | undefined;
  const connection = {
    beginTransaction: async () => {
      transactionSnapshot = {
        rows: state.map(row => ({ ...row })),
        contentVersion,
        contentVersionUpdates,
      };
      events.push("begin");
    },
    commit: async () => { events.push("commit"); committed = true; },
    rollback: async () => {
      if (transactionSnapshot) {
        state.splice(0, state.length, ...transactionSnapshot.rows.map(row => ({ ...row })));
        contentVersion = transactionSnapshot.contentVersion;
        contentVersionUpdates = transactionSnapshot.contentVersionUpdates;
      }
      events.push("rollback");
      rolledBack = true;
    },
    execute: async (sql: string, values: unknown[] = []) => {
      if (sql.startsWith("SELECT bankKey, totalQuestions, contentVersion")) {
        metadataReadCount += 1;
        events.push(contentVersion > metadata.contentVersion ? "metadata-read-after" : `metadata-read-${metadataReadCount}`);
        if (failure === "metadata-readback" && contentVersion > metadata.contentVersion) {
          return [[{ bankKey: "oit", totalQuestions: 499, contentVersion }]];
        }
        return [[{ bankKey: "oit", totalQuestions: metadata.totalQuestions, contentVersion }]];
      }
      if (sql.startsWith("SELECT id, bankKey, questionNum")) {
        questionReadCount += 1;
        events.push(`questions-read-${questionReadCount}`);
        if (failure === "readback" && questionReadCount > 2) {
          const drifted = state.map(row => ({ ...row }));
          drifted[0].explanation = "Unexpected read-back state";
          return [drifted];
        }
        return [[...state].sort((a, b) => a.questionNum - b.questionNum)];
      }
      if (sql.startsWith("UPDATE questions\n         SET question")) {
        const [question, options, correctIndex, explanation, sourceTitle, sourceReference, sourceUrl, id, bankKey, questionNum] = values;
        events.push(`question:${questionNum}`);
        if (failure === "question-update") return [{ affectedRows: 0 }];
        const row = state.find(candidate => candidate.id === id && candidate.bankKey === bankKey && candidate.questionNum === questionNum);
        if (!row) return [{ affectedRows: 0 }];
        Object.assign(row, { question, options, correctIndex, explanation, sourceTitle, sourceReference, sourceUrl });
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith("UPDATE question_bank_meta")) {
        events.push("metadata");
        if (failure === "metadata-update") return [{ affectedRows: 0 }];
        if (values[0] !== contentVersion + 1 || values[1] !== contentVersion) return [{ affectedRows: 0 }];
        contentVersion = Number(values[0]);
        contentVersionUpdates += 1;
        return [{ affectedRows: 1 }];
      }
      throw new Error(`Unexpected query: ${sql}`);
    },
  };
  return {
    connection,
    rows: state,
    events,
    get committed() { return committed; },
    get rolledBack() { return rolledBack; },
    get contentVersionUpdates() { return contentVersionUpdates; },
    get contentVersion() { return contentVersion; },
    mutateFirstRow() { state[0].explanation = "Injected callback mutation"; },
  };
}

function reviewedPlanHash(rows = expectedRows(), reviewedMetadata = metadata) {
  return planReportedOitItemRepair(rows, reviewedMetadata).planHash;
}

describe("reported OIT item repair contract", () => {
  it("limits the candidate to four reviewed records while preserving all answer positions", () => {
    expect(reportedOitItemRepairs.map((repair: Repair) => repair.questionNum)).toEqual([6, 14, 21, 62]);
    for (const repair of reportedOitItemRepairs as Repair[]) {
      expect(repair.expected.options).toHaveLength(4);
      expect(repair.replacement.options).toHaveLength(4);
      expect(repair.replacement.correctIndex).toBe(repair.expected.correctIndex);
      if (repair.questionNum === 6) {
        expect(repair.replacement.options.filter((option: string, index: number) => option !== repair.expected.options[index])).toHaveLength(4);
      } else {
        expect(repair.replacement.options).toEqual(repair.expected.options);
      }
    }
  });

  it("balances the chlorine options and cites the alarm-response source", () => {
    const repair = reportedOitItemRepairs[0];
    const lengths = repair.replacement.options.map((option: string) => option.split(/\s+/).length);
    expect(Math.max(...lengths) / Math.min(...lengths)).toBeLessThan(1.4);
    expect(repair.replacement.options.join(" ")).not.toMatch(/open flame|no action needed|normal condensation/i);
    expect(repair.replacement.question).toContain("detector alarms");
    expect(repair.replacement.question).toContain("not trained");
    expect(repair.replacement.sourceUrl).toBe("https://www.ccohs.ca/oshanswers/chemicals/chem_profiles/chlorine.html");
  });

  it("upgrades the exact v1 repair and rejects any unreviewed variation", async () => {
    const repair = reportedOitItemRepairs[0];
    const rows = reportedOitItemRepairs.map((item: Repair) => rowFor(item, item.expectedId, item.replacement));
    rows[0] = rowFor(repair, repair.expectedId, repair.previousContents![0]);
    const plan = planReportedOitItemRepair(rows, metadata);
    expect(plan.ready).toBe(true);
    expect(plan.changes.map((item: Repair) => item.questionNum)).toEqual([6]);
    const fake = createConnection({ rows });
    await applyReportedOitItemRepair(fake.connection, {
      apply: true, expectedPlanHash: plan.planHash, backup: async () => {},
    });
    expect(fake.committed).toBe(true);
    expect(fake.contentVersionUpdates).toBe(1);
    expect(fake.rows[0].id).toBe(repair.expectedId);
    expect(fake.rows[0].correctIndex).toBe(repair.expected.correctIndex);
    expect(planReportedOitItemRepair(fake.rows, { ...metadata, contentVersion: fake.contentVersion }).changes).toEqual([]);
    rows[0].explanation += " Unreviewed change.";
    expect(planReportedOitItemRepair(rows, metadata).ready).toBe(false);
  });

  it("plans only the exact reviewed question and metadata baseline", () => {
    const plan = planReportedOitItemRepair(expectedRows(), metadata);
    expect(plan).toMatchObject({ ready: true, errors: [], unchanged: [] });
    expect(plan.changes.map((change: Repair) => change.questionNum)).toEqual([6, 14, 21, 62]);

    const drifted = expectedRows();
    drifted[0].explanation = "Unreviewed concurrent change";
    expect(planReportedOitItemRepair(drifted, metadata).errors).toContain("oit:6: content drifted from the reviewed baseline");
    expect(planReportedOitItemRepair(expectedRows(), { ...metadata, contentVersion: 13 }).planHash).not.toBe(plan.planHash);
    expect(planReportedOitItemRepair(expectedRows(), { ...metadata, totalQuestions: 499 }).planHash).not.toBe(plan.planHash);
  });

  it("recognizes an already-applied exact repair without proposing another change", () => {
    const repairedRows = reportedOitItemRepairs.map((repair: Repair) => rowFor(repair, repair.expectedId, repair.replacement));
    const plan = planReportedOitItemRepair(repairedRows, metadata);
    expect(plan).toMatchObject({ ready: true, errors: [], changes: [] });
    expect(plan.unchanged).toEqual([
      { bankKey: "oit", questionNum: 6 },
      { bankKey: "oit", questionNum: 14 },
      { bankKey: "oit", questionNum: 21 },
      { bankKey: "oit", questionNum: 62 },
    ]);
  });

  it("orders durable backup, exact readback, metadata versioning, and commit", async () => {
    const fake = createConnection();
    const planHash = reviewedPlanHash();
    const result = await applyReportedOitItemRepair(fake.connection, {
      apply: true,
      expectedPlanHash: planHash,
      backup: async ({ rows, metadataBefore }) => {
        fake.events.push("backup");
        expect(rows).toHaveLength(4);
        expect(metadataBefore).toEqual(metadata);
      },
    });

    expect(result).toMatchObject({ ready: true, applied: true, errors: [], unchanged: [], planHash });
    expect(fake.events).toEqual([
      "begin", "metadata-read-1", "questions-read-1", "backup",
      "metadata-read-2", "questions-read-2",
      "question:6", "question:14", "question:21", "question:62", "questions-read-3",
      "metadata", "metadata-read-after", "commit",
    ]);
    expect(fake.committed).toBe(true);
    expect(fake.rolledBack).toBe(false);
    expect(fake.contentVersionUpdates).toBe(1);
    expect(fake.contentVersion).toBe(13);
    expect(planReportedOitItemRepair(fake.rows, { ...metadata, contentVersion: 13 })).toMatchObject({ ready: true, changes: [], errors: [] });
  });

  it("rejects a stale reviewed metadata hash before backup or content writes", async () => {
    const fake = createConnection();
    await expect(applyReportedOitItemRepair(fake.connection, {
      apply: true,
      expectedPlanHash: reviewedPlanHash(expectedRows(), { ...metadata, contentVersion: 11 }),
      backup: async () => { fake.events.push("backup"); },
    })).rejects.toThrow(/exact reviewed plan hash/);
    expect(fake.events).toEqual(["begin", "metadata-read-1", "questions-read-1", "rollback"]);
    expect(fake.contentVersionUpdates).toBe(0);
  });

  it("rolls back before every write when durable backup creation fails", async () => {
    const fake = createConnection();
    await expect(applyReportedOitItemRepair(fake.connection, {
      apply: true,
      expectedPlanHash: reviewedPlanHash(),
      backup: async () => { throw new Error("backup durability failed"); },
    })).rejects.toThrow(/backup durability failed/);
    expect(fake.events).toEqual(["begin", "metadata-read-1", "questions-read-1", "rollback"]);
    expect(fake.contentVersionUpdates).toBe(0);
  });

  it("rejects a caller-defined replacement manifest even with a self-consistent plan hash", async () => {
    const tamperedRepairs = reportedOitItemRepairs.map((repair: Repair) => ({
      ...repair,
      replacement: { ...repair.replacement },
    }));
    tamperedRepairs[0] = {
      ...tamperedRepairs[0],
      replacement: {
        ...tamperedRepairs[0].replacement,
        explanation: `${tamperedRepairs[0].replacement.explanation} Tampered after review.`,
      },
    };

    const callerDefinedHash = planReportedOitItemRepair(expectedRows(), metadata, tamperedRepairs).planHash;
    expect(callerDefinedHash).not.toBe(reviewedPlanHash());
    const fake = createConnection();
    await expect(applyReportedOitItemRepair(fake.connection, {
      apply: true,
      expectedPlanHash: callerDefinedHash,
      // Intentional runtime injection attempt. The production apply function must ignore it.
      repairs: tamperedRepairs,
      backup: async () => { fake.events.push("backup"); },
    } as any)).rejects.toThrow(/exact reviewed plan hash/);
    expect(fake.events).toEqual(["begin", "metadata-read-1", "questions-read-1", "rollback"]);
  });

  it("rejects a caller-defined fifth OIT record and deeply freezes the canonical manifest", async () => {
    const fifthRepair = {
      ...reportedOitItemRepairs[0],
      questionNum: 999,
      expectedId: 99999,
    };
    const callerDefinedHash = planReportedOitItemRepair(
      expectedRows(),
      metadata,
      [...reportedOitItemRepairs, fifthRepair],
    ).planHash;
    const fake = createConnection();
    await expect(applyReportedOitItemRepair(fake.connection, {
      apply: true,
      expectedPlanHash: callerDefinedHash,
      repairs: [...reportedOitItemRepairs, fifthRepair],
      backup: async () => { fake.events.push("backup"); },
    } as any)).rejects.toThrow(/exact reviewed plan hash/);
    expect(fake.events).toEqual(["begin", "metadata-read-1", "questions-read-1", "rollback"]);
    expect(Object.isFrozen(reportedOitItemRepairs)).toBe(true);
    expect(Object.isFrozen(reportedOitItemRepairs[0])).toBe(true);
    expect(Object.isFrozen(reportedOitItemRepairs[0].replacement)).toBe(true);
    expect(Object.isFrozen(reportedOitItemRepairs[0].replacement.options)).toBe(true);
  });

  it("commits only canonical content when a backup callback mutates its detached payload", async () => {
    const fake = createConnection();
    await applyReportedOitItemRepair(fake.connection, {
      apply: true,
      expectedPlanHash: reviewedPlanHash(),
      backup: async ({ rows, metadataBefore }) => {
        rows[0].explanation = "Tampered backup payload";
        metadataBefore.contentVersion = 999;
      },
    });
    const repairedSix = fake.rows.find(row => row.questionNum === 6)!;
    expect(repairedSix.explanation).toBe(reportedOitItemRepairs[0].replacement.explanation);
    expect(fake.contentVersion).toBe(metadata.contentVersion + 1);
  });

  it("revalidates locked state after a callback-side database mutation before any content write", async () => {
    const fake = createConnection();
    await expect(applyReportedOitItemRepair(fake.connection, {
      apply: true,
      expectedPlanHash: reviewedPlanHash(),
      backup: async () => { fake.mutateFirstRow(); },
    })).rejects.toThrow(/state changed during backup/);
    expect(fake.events).toEqual([
      "begin", "metadata-read-1", "questions-read-1", "metadata-read-2", "questions-read-2", "rollback",
    ]);
    expect(planReportedOitItemRepair(fake.rows, metadata).changes).toHaveLength(4);
    expect(fake.contentVersion).toBe(metadata.contentVersion);
  });

  it.each<FailureMode>(["question-update", "readback", "metadata-update", "metadata-readback"])("rolls back when %s verification fails", async failure => {
    const fake = createConnection({ failure });
    await expect(applyReportedOitItemRepair(fake.connection, {
      apply: true,
      expectedPlanHash: reviewedPlanHash(),
      backup: async () => { fake.events.push("backup"); },
    })).rejects.toThrow();
    expect(fake.committed).toBe(false);
    expect(fake.rolledBack).toBe(true);
    expect(planReportedOitItemRepair(fake.rows, metadata).changes).toHaveLength(4);
    expect(fake.contentVersion).toBe(metadata.contentVersion);
    if (failure !== "metadata-update") expect(fake.contentVersionUpdates).toBe(0);
  });

  it("refuses an apply without a backup callback before making a write", async () => {
    const fake = createConnection();
    await expect(applyReportedOitItemRepair(fake.connection, {
      apply: true,
      expectedPlanHash: reviewedPlanHash(),
    })).rejects.toThrow(/durable pre-update backup/);
    expect(fake.events).toEqual(["begin", "metadata-read-1", "questions-read-1", "rollback"]);
  });

  it("refuses a replaced database row identity even when the content matches", () => {
    const rows = expectedRows();
    rows[0].id += 1;
    const plan = planReportedOitItemRepair(rows, metadata);
    expect(plan.ready).toBe(false);
    expect(plan.errors).toContain("oit:6: database row identity changed from the reviewed baseline");
  });

  it("keeps certificate-verified TLS checks at the production command boundary", () => {
    const command = fs.readFileSync(
      path.resolve(import.meta.dirname, "..", "scripts", "repair-reported-oit-items.mjs"),
      "utf8",
    );
    expect(command).toContain("settings.requireTls !== true");
    expect(command).toContain("BEGIN CERTIFICATE");
    expect(command).toContain("connectionOptions.ssl.rejectUnauthorized !== true");
    expect(command).toContain("connectionOptions.ssl.ca");
  });
});
