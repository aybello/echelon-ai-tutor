import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
const importerPath = "../scripts/recovery/stageLegacyQuestionArchive.mjs";
const importer: any = await import(importerPath);
const EXPECTED_BANK_COUNTS: Record<string, number> = importer.EXPECTED_BANK_COUNTS;
const EXPECTED_TARGET_QUESTION_COUNT: number = importer.EXPECTED_TARGET_QUESTION_COUNT;
const TARGET_BANK_KEYS: string[] = importer.TARGET_BANK_KEYS;
const buildStagingPackageFromArchiveBytes: (bytes: Buffer) => any = importer.buildStagingPackageFromArchiveBytes;
const buildStagingPackageFromFixtureBytes: (bytes: Buffer, expectedArchiveSha256: string) => any = importer.buildStagingPackageFromFixtureBytes;
const decryptBackupJson: (encrypted: Buffer, key: Buffer) => any = importer.decryptBackupJson;
const digest: (value: unknown) => string = importer.digest;
const encryptBackupJson: (snapshot: unknown, key: Buffer) => { encrypted: Buffer } = importer.encryptBackupJson;
const validateCleanBaseline: (snapshot: any) => any = importer.validateCleanBaseline;

const sourceQuestion = (bankKey: string, questionNum: number) => ({
  bankKey,
  questionNum,
  module: "Validated module",
  difficulty: "medium",
  question: `Question ${bankKey}-${questionNum}?`,
  options: JSON.stringify(["A", "B", "C", "D"]),
  correctIndex: 0,
  explanation: "A controlled explanation.",
  steps: null,
  tip: null,
  isCalc: "no",
  topic: "Validated topic",
  cognitiveLevel: "recall",
  sourceTitle: null,
  sourceReference: null,
  sourceUrl: null,
  blueprintObjective: null,
  reviewStatus: "unreviewed",
});

function archiveFixture(change?: (rows: ReturnType<typeof sourceQuestion>[]) => void) {
  const rows = TARGET_BANK_KEYS.flatMap((bankKey) => {
    const count = EXPECTED_BANK_COUNTS[bankKey];
    return Array.from({ length: count }, (_, offset) => sourceQuestion(bankKey, offset + 1));
  });
  change?.(rows);
  const requiredArchiveTables = [
    "ai_chat_sessions", "bookmarks", "contact_submissions", "dashboard_otps", "diagnostic_sessions", "email_otp_codes",
    "exam_outcomes", "exam_results", "flashcard_progress", "magic_links", "organization_members", "organization_term_operator_usage",
    "organizations", "purchases", "question_attempts", "stripe_event_log", "student_profiles", "subscriptions", "team_flex_extensions",
    "team_flex_licences", "team_flex_order_items", "team_flex_orders", "trial_emails", "trigger_logs", "users", "waitlist",
  ];
  const bytes = gzipSync(Buffer.from(JSON.stringify({
    tables: [{ name: "questions", rows }, ...requiredArchiveTables.map((name) => ({ name, rows: [] }))],
  })));
  return { bytes, expectedArchiveSha256: createHash("sha256").update(bytes).digest("hex") };
}

function cleanSnapshot() {
  return {
    questions: [
      ...Array.from({ length: 489 }, () => ({ bankKey: "oit" })),
      ...Array.from({ length: 483 }, () => ({ bankKey: "oit-ww" })),
    ],
    metadata: [],
    overviews: [],
  };
}

describe("guarded legacy question archive staging", () => {
  it("creates the exact quarantined 33-bank staging package without preserving old learner visibility", () => {
    const fixture = archiveFixture();
    const packageInfo = buildStagingPackageFromFixtureBytes(fixture.bytes, fixture.expectedArchiveSha256);

    expect(packageInfo).toMatchObject({
      bankCount: TARGET_BANK_KEYS.length,
      questionCount: EXPECTED_TARGET_QUESTION_COUNT,
    });
    expect(packageInfo.banks).toHaveLength(TARGET_BANK_KEYS.length);
    expect(packageInfo.rows.every((row: any) => row.reviewStatus === "in_review")).toBe(true);
    expect(packageInfo.rows.every((row: any) => row.reviewedBy === null && row.reviewedAt === null)).toBe(true);
    expect(packageInfo.rows.every((row: any) => row.sourceTitle === null && row.sourceReference === null)).toBe(true);
    const storedShape = packageInfo.rows.map((row: any) => ({
      bankKey: row.bankKey, questionNum: row.questionNum, module: row.module, difficulty: row.difficulty,
      question: row.question, options: row.options, correctIndex: row.correctIndex, explanation: row.explanation,
      steps: row.steps, tip: row.tip, isCalc: row.isCalc, topic: row.topic, cognitiveLevel: row.cognitiveLevel,
      sourceTitle: row.sourceTitle, sourceReference: row.sourceReference, sourceUrl: row.sourceUrl,
      blueprintObjective: row.blueprintObjective, reviewStatus: row.reviewStatus, reviewedBy: row.reviewedBy, reviewedAt: row.reviewedAt,
    }));
    expect(digest(storedShape.sort((left: any, right: any) => left.bankKey.localeCompare(right.bankKey) || left.questionNum - right.questionNum))).toBe(packageInfo.questionChecksum);
  });

  it("fails closed if the archive bytes do not match the immutable confirmation hash", () => {
    const fixture = archiveFixture();
    expect(() => buildStagingPackageFromArchiveBytes(fixture.bytes))
      .toThrow("archive SHA-256");
  });

  it("rejects an incomplete archive table list even if its hash is otherwise accepted", () => {
    const bytes = gzipSync(Buffer.from(JSON.stringify({
      tables: [{ name: "questions", rows: [] }],
    })));
    const expectedArchiveSha256 = createHash("sha256").update(bytes).digest("hex");
    expect(() => buildStagingPackageFromFixtureBytes(bytes, expectedArchiveSha256))
      .toThrow("complete verified pre-reset export");
  });

  it("fails closed on duplicate bank and question identities", () => {
    const fixture = archiveFixture((rows) => { rows[1].questionNum = rows[0].questionNum; });
    expect(() => buildStagingPackageFromFixtureBytes(fixture.bytes, fixture.expectedArchiveSha256)).toThrow("duplicate question number");
  });

  it("fails closed on an invalid answer option structure", () => {
    const fixture = archiveFixture((rows) => { rows[0].options = JSON.stringify(["A", "B", "C"]); });
    expect(() => buildStagingPackageFromFixtureBytes(fixture.bytes, fixture.expectedArchiveSha256)).toThrow("exactly four options");
  });

  it("requires a clean OIT-only baseline and does not allow target rows or target metadata to exist", () => {
    const baseline = validateCleanBaseline(cleanSnapshot());
    expect(baseline.counts).toMatchObject({ questions: 972, oit: 489, oitWastewater: 483 });
    expect(() => validateCleanBaseline({
      ...cleanSnapshot(),
      questions: [...cleanSnapshot().questions, { bankKey: TARGET_BANK_KEYS[0] }],
    })).toThrow("target bank already contains question rows");
    expect(() => validateCleanBaseline({
      ...cleanSnapshot(),
      metadata: [{ bankKey: TARGET_BANK_KEYS[0] }],
    })).toThrow("target bank already contains metadata rows");
  });

  it("encrypts and independently decrypts a complete pre-stage content snapshot", () => {
    const snapshot = {
      questions: [{ bankKey: "oit", questionNum: 1, reviewStatus: "unreviewed" }],
      metadata: [{ bankKey: "oit", modules: "[]", totalQuestions: 1 }],
      overviews: [{ bankKey: "oit", overviewsJson: "{}" }],
    };
    const key = Buffer.alloc(32, 7);
    const backup = encryptBackupJson(snapshot, key);
    const restored = decryptBackupJson(backup.encrypted, key);
    expect(restored).toMatchObject({
      questions: [expect.objectContaining({ bankKey: "oit", questionNum: 1, reviewStatus: "unreviewed" })],
      metadata: [{ bankKey: "oit", modules: "[]", totalQuestions: 1 }],
      overviews: [{ bankKey: "oit", overviewsJson: "{}" }],
    });
  });
});
