import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const integrationDescribe = describe.skipIf(!hasDatabase);
const suffix = `${process.pid}_${Date.now()}`;
const questionsTable = `class1_networks_release_questions_${suffix}`;
const metaTable = `class1_networks_release_meta_${suffix}`;
const attemptsTable = `class1_networks_release_attempts_${suffix}`;

let connection: any;
let importer: any;
let release: any;

const counts: Record<string, number> = {
  "class1-water-dist": 716,
  "class1-wastewater-coll": 724,
};

async function seedBaseline() {
  await connection.execute(`INSERT INTO \`${metaTable}\` (bankKey, modules, totalQuestions, contentVersion, blueprintVersion) VALUES (?, '[]', ?, 7, 1)`, ["class1-water-dist", 716]);
  await connection.execute(`INSERT INTO \`${metaTable}\` (bankKey, modules, totalQuestions, contentVersion, blueprintVersion) VALUES (?, '[]', ?, 7, 1)`, ["class1-wastewater-coll", 724]);
  for (const [bankKey, count] of Object.entries(counts)) {
    for (let questionNum = 1; questionNum <= count; questionNum += 1) {
      await connection.execute(
        `INSERT INTO \`${questionsTable}\` (bankKey, questionNum, module, difficulty, question, options, correctIndex, explanation, isCalc, topic, cognitiveLevel, reviewStatus)
         VALUES (?, ?, 'Existing', 'easy', ?, '["A","B","C","D"]', 0, 'Existing explanation.', 'no', 'Existing', 'recall', 'unreviewed')`,
        [bankKey, questionNum, `Existing ${bankKey} question ${questionNum}`],
      );
    }
  }
}

async function stageExactPackage() {
  const packageInfo = importer.loadClass1NetworksPackage();
  const before = await importer.readClass1NetworksProductionSnapshot({ connection, questionsTable, metaTable, attemptsTable });
  const baseline = importer.createBaseline({ checksum: packageInfo.checksum, ...before });
  await importer.stageClass1NetworksPackage({
    connection, payloads: packageInfo.payloads, checksum: packageInfo.checksum, baseline,
    questionsTable, metaTable, attemptsTable, log: () => undefined,
  });
  return packageInfo;
}

integrationDescribe("Class 1 Distribution and Collection learner-visible promotion database integration", () => {
  beforeAll(async () => {
    const mysql = await import("mysql2/promise");
    connection = await mysql.createConnection(process.env.DATABASE_URL!);
    // @ts-expect-error Standalone ESM helpers are exercised at runtime by Node and Vitest.
    importer = await import("../scripts/lib/class1NetworksImporter.mjs");
    // @ts-expect-error Standalone ESM helpers are exercised at runtime by Node and Vitest.
    release = await import("../scripts/lib/class1NetworksRelease.mjs");
    await connection.execute(`CREATE TABLE \`${metaTable}\` (
      id INT AUTO_INCREMENT PRIMARY KEY, bankKey VARCHAR(64) NOT NULL UNIQUE, modules TEXT NOT NULL,
      moduleTargets TEXT NULL, formulaLinks TEXT NULL, totalQuestions INT NOT NULL, contentVersion INT NOT NULL,
      blueprintVersion INT NOT NULL, minCalcPerMock INT NULL, recallTargetPct INT NULL
    )`);
    await connection.execute(`CREATE TABLE \`${questionsTable}\` (
      id INT AUTO_INCREMENT PRIMARY KEY, bankKey VARCHAR(64) NOT NULL, questionNum INT NOT NULL,
      module VARCHAR(128) NOT NULL, difficulty VARCHAR(16) NULL, question TEXT NOT NULL, options TEXT NOT NULL,
      correctIndex INT NOT NULL, explanation TEXT NOT NULL, steps TEXT NULL, tip TEXT NULL, isCalc VARCHAR(8) NOT NULL,
      topic VARCHAR(128) NULL, cognitiveLevel VARCHAR(64) NULL, sourceTitle VARCHAR(255) NULL,
      sourceReference VARCHAR(512) NULL, sourceUrl VARCHAR(1024) NULL, blueprintObjective VARCHAR(255) NULL,
      reviewStatus VARCHAR(32) NOT NULL, UNIQUE KEY \`bank_question_idx\` (bankKey, questionNum)
    )`);
    await connection.execute(`CREATE TABLE \`${attemptsTable}\` (id INT AUTO_INCREMENT PRIMARY KEY, questionId INT NOT NULL)`);
  });

  beforeEach(async () => {
    await connection.execute(`DELETE FROM \`${attemptsTable}\``);
    await connection.execute(`DELETE FROM \`${questionsTable}\``);
    await connection.execute(`DELETE FROM \`${metaTable}\``);
    await seedBaseline();
  }, 30_000);

  afterAll(async () => {
    if (!connection) return;
    await connection.execute(`DROP TABLE IF EXISTS \`${attemptsTable}\``);
    await connection.execute(`DROP TABLE IF EXISTS \`${questionsTable}\``);
    await connection.execute(`DROP TABLE IF EXISTS \`${metaTable}\``);
    await connection.end();
  });

  it("promotes the exact staged 500-item package atomically and updates learner-visible metadata", async () => {
    const packageInfo = await stageExactPackage();
    const result = await release.releaseClass1NetworksPackage({
      connection, payloads: packageInfo.payloads, checksum: packageInfo.checksum,
      questionsTable, metaTable, attemptsTable, apply: true, log: () => undefined,
    });
    expect(result).toMatchObject({ applied: true, mode: "learner_visible_promotion", checksum: packageInfo.checksum });

    const [questionCounts] = await connection.execute(`SELECT bankKey, COUNT(*) AS count, SUM(reviewStatus = 'in_review') AS staged, SUM(reviewStatus = 'unreviewed') AS visible FROM \`${questionsTable}\` GROUP BY bankKey ORDER BY bankKey`);
    expect(questionCounts.map((row: any) => [row.bankKey, Number(row.count), Number(row.staged), Number(row.visible)])).toEqual([
      ["class1-wastewater-coll", 974, 0, 974],
      ["class1-water-dist", 966, 0, 966],
    ]);
    const [metadata] = await connection.execute(`SELECT bankKey, totalQuestions, contentVersion FROM \`${metaTable}\` ORDER BY bankKey`);
    expect(metadata.map((row: any) => [row.bankKey, Number(row.totalQuestions), Number(row.contentVersion)])).toEqual([
      ["class1-wastewater-coll", 974, 9],
      ["class1-water-dist", 966, 9],
    ]);
    const replay = await release.releaseClass1NetworksPackage({
      connection, payloads: packageInfo.payloads, checksum: packageInfo.checksum,
      questionsTable, metaTable, attemptsTable, apply: false, log: () => undefined,
    });
    expect(replay).toMatchObject({ mode: "read_only_promotion_preflight", state: "already_visible", errors: [] });
  }, 45_000);

  it("rolls back all candidate status changes when locked learner-visible metadata has drifted", async () => {
    const packageInfo = await stageExactPackage();
    await connection.execute(`UPDATE \`${metaTable}\` SET totalQuestions = 715 WHERE bankKey = 'class1-water-dist'`);
    await expect(release.releaseClass1NetworksPackage({
      connection, payloads: packageInfo.payloads, checksum: packageInfo.checksum,
      questionsTable, metaTable, attemptsTable, apply: true, log: () => undefined,
    })).rejects.toThrow("learner-visible metadata drift");
    const [staged] = await connection.execute(`SELECT COUNT(*) AS count FROM \`${questionsTable}\` WHERE questionNum BETWEEN 2001 AND 2250 AND reviewStatus = 'in_review'`);
    expect(Number(staged[0].count)).toBe(500);
  }, 45_000);
});
