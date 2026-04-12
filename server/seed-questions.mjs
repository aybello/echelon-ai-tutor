/**
 * Seed script: Migrate all question banks + module overviews into the database.
 *
 * Usage: node server/seed-questions.mjs
 *
 * This script:
 *  1. Dynamically imports each question bank .ts file via tsx loader
 *  2. Normalises field names (correct/correctAnswer/correctIndex → correctIndex)
 *  3. Batch-inserts rows into the `questions` table
 *  4. Inserts metadata into `question_bank_meta`
 *  5. Imports module overviews into `module_overviews`
 */

import 'dotenv/config';
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const LIB = resolve(ROOT, 'client/src/lib');

// ─── Database connection ────────────────────────────────────────────────────
const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 5,
  ssl: { rejectUnauthorized: true },
});

// ─── Bank definitions ───────────────────────────────────────────────────────
// Each entry maps a file to its bankKey, question export name, correct-answer field,
// module export name, and optional moduleTargets/formulaLinks export names.
const BANKS = [
  // === OIT (questions.ts) — uses 'q' field for question text, 'correct' for answer ===
  {
    file: 'questions.ts',
    bankKey: 'oit',
    questionsExport: 'QUESTIONS',
    correctField: 'correct',
    questionTextField: 'q',
    modulesExport: 'OIT_MODULES',
  },
  // === Class 1 combined (class1Questions.ts) — uses 'q' field, 'correct' ===
  {
    file: 'class1Questions.ts',
    bankKey: 'class1',
    questionsExport: 'CLASS1_QUESTIONS',
    correctField: 'correct',
    questionTextField: 'q',
    modulesExport: 'CLASS1_MODULES',
  },
  // === Ontario Water banks — use 'question' field, 'correct' ===
  {
    file: 'class1WaterQuestions.ts',
    bankKey: 'class1-water',
    questionsExport: 'CLASS1_WATER_QUESTIONS',
    correctField: 'correct',
    modulesExport: 'CLASS1_WATER_MODULES',
    moduleTargetsExport: 'CLASS1_WATER_MODULE_TARGETS',
  },
  {
    file: 'class1WastewaterQuestions.ts',
    bankKey: 'class1-wastewater',
    questionsExport: 'CLASS1_WASTEWATER_QUESTIONS',
    correctField: 'correct',
    modulesExport: 'CLASS1_WASTEWATER_MODULES',
  },
  {
    file: 'class2WaterQuestions.ts',
    bankKey: 'class2-water',
    questionsExport: 'QUESTIONS',
    correctField: 'correct',
    modulesExport: 'MODULES',
  },
  {
    file: 'class2WastewaterQuestions.ts',
    bankKey: 'class2-wastewater',
    questionsExport: 'CLASS2_WW_QUESTIONS',
    correctField: 'correct',
    modulesExport: 'CLASS2_WW_MODULES',
  },
  {
    file: 'class3WaterQuestions.ts',
    bankKey: 'class3-water',
    questionsExport: 'QUESTIONS',
    correctField: 'correct',
    modulesExport: 'MODULES',
  },
  {
    file: 'class3WastewaterQuestions.ts',
    bankKey: 'class3-wastewater',
    questionsExport: 'CLASS3_WW_QUESTIONS',
    correctField: 'correct',
    modulesExport: 'CLASS3_WW_MODULES',
  },
  {
    file: 'class4WaterQuestions.ts',
    bankKey: 'class4-water',
    questionsExport: 'QUESTIONS',
    correctField: 'correct',
    modulesExport: 'CLASS4_WATER_MODULES',
  },
  {
    file: 'class4WastewaterQuestions.ts',
    bankKey: 'class4-wastewater',
    questionsExport: 'CLASS4_WW_QUESTIONS',
    correctField: 'correct',
    modulesExport: 'CLASS4_WASTEWATER_MODULES',
    formulaLinksExport: 'CLASS4_WW_FORMULA_LINKS',
  },
  // === WQA — uses 'correctIndex' field ===
  {
    file: 'wqaQuestions.ts',
    bankKey: 'wqa',
    questionsExport: 'WQA_QUESTIONS',
    correctField: 'correctIndex',
    modulesExport: 'WQA_MODULES',
    formulaLinksExport: 'WQA_FORMULA_LINKS',
  },
  // === WPI Water banks — use 'correctAnswer' ===
  {
    file: 'wpiClass1WaterQuestions.ts',
    bankKey: 'wpi-class1-water',
    questionsExport: 'wpiClass1WaterQuestions',
    correctField: 'correctAnswer',
    modulesExport: 'WPI_CLASS1_WATER_MODULES',
  },
  {
    file: 'wpiClass2WaterQuestions.ts',
    bankKey: 'wpi-class2-water',
    questionsExport: 'wpiClass2WaterQuestions',
    correctField: 'correctAnswer',
    modulesExport: 'WPI_CLASS2_WATER_MODULES',
  },
  {
    file: 'wpiClass3WaterQuestions.ts',
    bankKey: 'wpi-class3-water',
    questionsExport: 'wpiClass3WaterQuestions',
    correctField: 'correctAnswer',
    modulesExport: 'WPI_CLASS3_WATER_MODULES',
  },
  {
    file: 'wpiClass4WaterQuestions.ts',
    bankKey: 'wpi-class4-water',
    questionsExport: 'wpiClass4WaterQuestions',
    correctField: 'correctAnswer',
    modulesExport: 'WPI_CLASS4_WATER_MODULES',
  },
  // === WPI Wastewater banks ===
  {
    file: 'wpiClass1WastewaterQuestions.ts',
    bankKey: 'wpi-class1-wastewater',
    questionsExport: 'WPI_CLASS1_WASTEWATER_QUESTIONS',
    correctField: 'correctAnswer',
    modulesExport: 'WPI_CLASS1_WASTEWATER_MODULES',
  },
  {
    file: 'wpiClass2WastewaterQuestions.ts',
    bankKey: 'wpi-class2-wastewater',
    questionsExport: 'WPI_CLASS2_WASTEWATER_QUESTIONS',
    correctField: 'correctAnswer',
    modulesExport: 'WPI_CLASS2_WASTEWATER_MODULES',
  },
  {
    file: 'wpiClass3WastewaterQuestions.ts',
    bankKey: 'wpi-class3-wastewater',
    questionsExport: 'wpiClass3WastewaterQuestions',
    correctField: 'correctAnswer',
    modulesExport: 'WPI_CLASS3_WASTEWATER_MODULES',
  },
  {
    file: 'wpiClass4WastewaterQuestions.ts',
    bankKey: 'wpi-class4-wastewater',
    questionsExport: 'wpiClass4WastewaterQuestions',
    correctField: 'correctAnswer',
    modulesExport: 'WPI_CLASS4_WASTEWATER_MODULES',
  },
  // === WPI Water Distribution banks ===
  {
    file: 'wpiClass1WaterDistQuestions.ts',
    bankKey: 'wpi-class1-water-dist',
    questionsExport: 'wpiClass1WaterDistQuestions',
    correctField: 'correctAnswer',
    modulesExport: 'WPI_CLASS1_WATER_DIST_MODULES',
  },
  {
    file: 'wpiClass2WaterDistQuestions.ts',
    bankKey: 'wpi-class2-water-dist',
    questionsExport: 'wpiClass2WaterDistQuestions',
    correctField: 'correctAnswer',
    modulesExport: 'wpiClass2WaterDistModules',
  },
  {
    file: 'wpiClass3WaterDistQuestions.ts',
    bankKey: 'wpi-class3-water-dist',
    questionsExport: 'wpiClass3WaterDistQuestions',
    correctField: 'correctAnswer',
    modulesExport: 'WPI_CLASS3_WATER_DIST_MODULES',
  },
  {
    file: 'wpiClass4WaterDistQuestions.ts',
    bankKey: 'wpi-class4-water-dist',
    questionsExport: 'wpiClass4WaterDistQuestions',
    correctField: 'correctAnswer',
    modulesExport: 'WPI_CLASS4_WATER_DIST_MODULES',
  },
  // === WPI Wastewater Collection banks ===
  {
    file: 'wpiClass1WastewaterCollQuestions.ts',
    bankKey: 'wpi-class1-wastewater-coll',
    questionsExport: 'wpiClass1WastewaterCollQuestions',
    correctField: 'correctAnswer',
    modulesExport: 'WPI_CLASS1_WASTEWATER_COLL_MODULES',
  },
  {
    file: 'wpiClass2WastewaterCollQuestions.ts',
    bankKey: 'wpi-class2-wastewater-coll',
    questionsExport: 'wpiClass2WastewaterCollQuestions',
    correctField: 'correctAnswer',
    modulesExport: 'WPI_CLASS2_WASTEWATER_COLL_MODULES',
  },
  {
    file: 'wpiClass3WastewaterCollQuestions.ts',
    bankKey: 'wpi-class3-wastewater-coll',
    questionsExport: 'wpiClass3WastewaterCollQuestions',
    correctField: 'correctAnswer',
    modulesExport: 'WPI_CLASS3_WASTEWATER_COLL_MODULES',
  },
  {
    file: 'wpiClass4WastewaterCollQuestions.ts',
    bankKey: 'wpi-class4-wastewater-coll',
    questionsExport: 'wpiClass4WastewaterCollQuestions',
    correctField: 'correctAnswer',
    modulesExport: 'WPI_CLASS4_WASTEWATER_COLL_MODULES',
  },
];

// ─── Module overview mappings ───────────────────────────────────────────────
const OVERVIEW_MAP = [
  { exportName: 'OIT_WATER_OVERVIEWS', bankKey: 'oit' },
  { exportName: 'CLASS1_WASTEWATER_OVERVIEWS', bankKey: 'class1-wastewater' },
  { exportName: 'CLASS1_WATER_OVERVIEWS', bankKey: 'class1-water' },
  { exportName: 'CLASS2_WATER_OVERVIEWS', bankKey: 'class2-water' },
  { exportName: 'CLASS2_WASTEWATER_OVERVIEWS', bankKey: 'class2-wastewater' },
  { exportName: 'CLASS3_WATER_OVERVIEWS', bankKey: 'class3-water' },
  { exportName: 'CLASS3_WASTEWATER_OVERVIEWS', bankKey: 'class3-wastewater' },
  { exportName: 'CLASS4_WATER_OVERVIEWS', bankKey: 'class4-water' },
  { exportName: 'CLASS4_WASTEWATER_OVERVIEWS', bankKey: 'class4-wastewater' },
  { exportName: 'WQA_OVERVIEWS', bankKey: 'wqa' },
  { exportName: 'WPI_CLASS1_WATER_OVERVIEWS', bankKey: 'wpi-class1-water' },
  { exportName: 'WPI_CLASS1_WASTEWATER_OVERVIEWS', bankKey: 'wpi-class1-wastewater' },
  { exportName: 'WPI_CLASS2_WATER_OVERVIEWS', bankKey: 'wpi-class2-water' },
  { exportName: 'WPI_CLASS2_WASTEWATER_OVERVIEWS', bankKey: 'wpi-class2-wastewater' },
  { exportName: 'WPI_CLASS3_WATER_OVERVIEWS', bankKey: 'wpi-class3-water' },
  { exportName: 'WPI_CLASS3_WASTEWATER_OVERVIEWS', bankKey: 'wpi-class3-wastewater' },
  { exportName: 'WPI_CLASS4_WATER_OVERVIEWS', bankKey: 'wpi-class4-water' },
  { exportName: 'WPI_CLASS4_WASTEWATER_OVERVIEWS', bankKey: 'wpi-class4-wastewater' },
  { exportName: 'WPI_CLASS1_WATER_DIST_OVERVIEWS', bankKey: 'wpi-class1-water-dist' },
  { exportName: 'WPI_CLASS2_WATER_DIST_OVERVIEWS', bankKey: 'wpi-class2-water-dist' },
  { exportName: 'WPI_CLASS3_WATER_DIST_OVERVIEWS', bankKey: 'wpi-class3-water-dist' },
  { exportName: 'WPI_CLASS4_WATER_DIST_OVERVIEWS', bankKey: 'wpi-class4-water-dist' },
  { exportName: 'WPI_CLASS1_WASTEWATER_COLL_OVERVIEWS', bankKey: 'wpi-class1-wastewater-coll' },
  { exportName: 'WPI_CLASS2_WASTEWATER_COLL_OVERVIEWS', bankKey: 'wpi-class2-wastewater-coll' },
  { exportName: 'WPI_CLASS3_WASTEWATER_COLL_OVERVIEWS', bankKey: 'wpi-class3-wastewater-coll' },
  { exportName: 'WPI_CLASS4_WASTEWATER_COLL_OVERVIEWS', bankKey: 'wpi-class4-wastewater-coll' },
];

// ─── Helper: batch insert ───────────────────────────────────────────────────
async function batchInsert(conn, sql, rows, batchSize = 200) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const placeholders = batch.map(() => `(${sql.split('(')[1].split(')')[0].split(',').map(() => '?').join(',')})`).join(',');
    const flatValues = batch.flat();
    const insertSql = `INSERT INTO questions (bankKey, questionNum, module, difficulty, question, options, correctIndex, explanation, steps, tip, isCalc, topic) VALUES ${batch.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?)').join(',')}`;
    await conn.execute(insertSql, flatValues);
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const conn = await pool.getConnection();

  try {
    // Clear existing data
    console.log('Clearing existing data...');
    await conn.execute('DELETE FROM questions');
    await conn.execute('DELETE FROM question_bank_meta');
    await conn.execute('DELETE FROM module_overviews');

    let totalQuestions = 0;

    for (const bank of BANKS) {
      const filePath = resolve(LIB, bank.file);
      console.log(`\nProcessing: ${bank.file} → bankKey: ${bank.bankKey}`);

      // Dynamic import using tsx loader
      const mod = await import(filePath);

      // Get questions array
      const questions = mod[bank.questionsExport];
      if (!questions || !Array.isArray(questions)) {
        console.error(`  ERROR: Export '${bank.questionsExport}' not found or not an array in ${bank.file}`);
        continue;
      }

      console.log(`  Found ${questions.length} questions`);

      // Get modules
      let modulesRaw = mod[bank.modulesExport];
      if (!modulesRaw) {
        console.warn(`  WARNING: Modules export '${bank.modulesExport}' not found`);
        modulesRaw = [];
      }
      // Convert to plain array if it's a readonly tuple
      modulesRaw = Array.from(modulesRaw);
      // If modules are objects (with 'name' property), extract just the name strings.
      // Some arrays have leaked question objects mixed in (e.g. wpiClass2WaterDistModules has a trailing comma
      // that causes questions to merge into the modules array). Filter to only real module entries.
      let modules;
      if (modulesRaw.length > 0 && typeof modulesRaw[0] === 'object') {
        // Real module entries have a short 'name' and no 'question' field
        const filtered = modulesRaw.filter(m => m && typeof m === 'object' && m.name && !m.question && !m.options);
        modules = filtered.map(m => m.name);
      } else {
        // Plain string arrays
        modules = modulesRaw.filter(m => typeof m === 'string');
      }

      // Get optional moduleTargets
      let moduleTargets = null;
      if (bank.moduleTargetsExport && mod[bank.moduleTargetsExport]) {
        moduleTargets = mod[bank.moduleTargetsExport];
      }

      // Get optional formulaLinks
      let formulaLinks = null;
      if (bank.formulaLinksExport && mod[bank.formulaLinksExport]) {
        formulaLinks = mod[bank.formulaLinksExport];
      }

      // Prepare question rows
      const rows = [];
      for (let qi = 0; qi < questions.length; qi++) {
        const q = questions[qi];
        // Normalise question text field
        const questionText = q.question || q.q || '';

        // Normalise correct answer field
        let correctIndex;
        if (bank.correctField === 'correctAnswer') {
          correctIndex = q.correctAnswer;
        } else if (bank.correctField === 'correctIndex') {
          correctIndex = q.correctIndex;
        } else {
          correctIndex = q.correct;
        }

        // Normalise options to JSON
        const optionsJson = JSON.stringify(q.options || []);

        // Normalise steps to JSON or null
        const stepsJson = q.steps ? JSON.stringify(q.steps) : null;

        // Normalise isCalc
        const isCalc = q.isCalc === true ? 'yes' : 'no';

        // Use 1-based array index as questionNum to avoid duplicate ID issues.
        // The original question ID is preserved for reference but the DB uses sequential numbering.
        const questionNum = qi + 1;

        rows.push([
          bank.bankKey,
          questionNum,
          q.module || '',
          q.difficulty || null,
          questionText,
          optionsJson,
          correctIndex ?? 0,
          q.explanation || '',
          stepsJson,
          q.tip || null,
          isCalc,
          q.topic || null,
        ]);
      }

      // Batch insert questions
      for (let i = 0; i < rows.length; i += 200) {
        const batch = rows.slice(i, i + 200);
        const placeholders = batch.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?)').join(',');
        const flatValues = batch.flat();
        await conn.execute(
          `INSERT INTO questions (bankKey, questionNum, module, difficulty, question, options, correctIndex, explanation, steps, tip, isCalc, topic) VALUES ${placeholders}`,
          flatValues
        );
      }

      totalQuestions += questions.length;
      console.log(`  Inserted ${questions.length} questions`);

      // Insert bank metadata
      await conn.execute(
        `INSERT INTO question_bank_meta (bankKey, modules, moduleTargets, formulaLinks, totalQuestions) VALUES (?,?,?,?,?)`,
        [
          bank.bankKey,
          JSON.stringify(modules),
          moduleTargets ? JSON.stringify(moduleTargets) : null,
          formulaLinks ? JSON.stringify(formulaLinks) : null,
          questions.length,
        ]
      );
      console.log(`  Inserted bank metadata`);
    }

    console.log(`\n=== Total questions inserted: ${totalQuestions} ===\n`);

    // ─── Module Overviews ─────────────────────────────────────────────────────
    console.log('Processing module overviews...');
    const overviewMod = await import(resolve(LIB, 'moduleOverviews.ts'));

    for (const ov of OVERVIEW_MAP) {
      const data = overviewMod[ov.exportName];
      if (!data) {
        console.warn(`  WARNING: Overview export '${ov.exportName}' not found`);
        continue;
      }
      await conn.execute(
        `INSERT INTO module_overviews (bankKey, overviewsJson) VALUES (?,?)`,
        [ov.bankKey, JSON.stringify(data)]
      );
      console.log(`  Inserted overviews for ${ov.bankKey}`);
    }

    // ─── Verification ─────────────────────────────────────────────────────────
    console.log('\n=== Verification ===');
    const [qRows] = await conn.execute('SELECT bankKey, COUNT(*) as cnt FROM questions GROUP BY bankKey ORDER BY bankKey');
    for (const row of qRows) {
      console.log(`  ${row.bankKey}: ${row.cnt} questions`);
    }
    const [totalRow] = await conn.execute('SELECT COUNT(*) as cnt FROM questions');
    console.log(`  TOTAL: ${totalRow[0].cnt} questions`);
    const [metaRows] = await conn.execute('SELECT COUNT(*) as cnt FROM question_bank_meta');
    console.log(`  Bank metadata rows: ${metaRows[0].cnt}`);
    const [ovRows] = await conn.execute('SELECT COUNT(*) as cnt FROM module_overviews');
    console.log(`  Module overview rows: ${ovRows[0].cnt}`);

  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('SEED FAILED:', err);
  process.exit(1);
});
