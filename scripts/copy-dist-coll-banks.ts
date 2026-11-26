/**
 * Copy existing Distribution/Collection questions from the main Ontario banks
 * into new dedicated sub-bank keys, mirroring the WPI structure.
 *
 * Mapping:
 *   class1-water   / Water Distribution       -> class1-water-dist
 *   class2-water   / Water Distribution       -> class2-water-dist
 *   class3-water   / Water Distribution       -> class3-water-dist
 *   class4-water   / Water Distribution       -> class4-water-dist
 *   class1-wastewater / Wastewater Collection -> class1-wastewater-coll
 *   class2-wastewater / Collection Systems    -> class2-wastewater-coll
 *   class3-wastewater / Wastewater Collection -> class3-wastewater-coll
 *   class4-wastewater / Wastewater Collection -> class4-wastewater-coll
 */
import { getDb } from '../server/db';
import { sql } from 'drizzle-orm';

const COPIES: Array<{ srcBank: string; srcModule: string; destBank: string; destModule: string }> = [
  { srcBank: 'class1-water',      srcModule: 'Water Distribution',    destBank: 'class1-water-dist',      destModule: 'Water Distribution' },
  { srcBank: 'class2-water',      srcModule: 'Water Distribution',    destBank: 'class2-water-dist',      destModule: 'Water Distribution' },
  { srcBank: 'class3-water',      srcModule: 'Water Distribution',    destBank: 'class3-water-dist',      destModule: 'Water Distribution' },
  { srcBank: 'class4-water',      srcModule: 'Water Distribution',    destBank: 'class4-water-dist',      destModule: 'Water Distribution' },
  { srcBank: 'class1-wastewater', srcModule: 'Wastewater Collection', destBank: 'class1-wastewater-coll', destModule: 'Wastewater Collection' },
  { srcBank: 'class2-wastewater', srcModule: 'Collection Systems',    destBank: 'class2-wastewater-coll', destModule: 'Collection Systems' },
  { srcBank: 'class3-wastewater', srcModule: 'Wastewater Collection', destBank: 'class3-wastewater-coll', destModule: 'Wastewater Collection' },
  { srcBank: 'class4-wastewater', srcModule: 'Wastewater Collection', destBank: 'class4-wastewater-coll', destModule: 'Wastewater Collection' },
];

async function main() {
  const db = await getDb();
  if (!db) throw new Error('DB connection failed');

  for (const { srcBank, srcModule, destBank, destModule } of COPIES) {
    // Check if dest bank already has questions
    const [existCheck] = await (db as any).execute(
      sql`SELECT COUNT(*) as cnt FROM questions WHERE bankKey = ${destBank}`
    );
    const existCount = (existCheck as any[])[0]?.cnt ?? 0;
    if (existCount > 0) {
      console.log(`SKIP ${destBank}: already has ${existCount} questions`);
      continue;
    }

    // Count source questions
    const [srcCheck] = await (db as any).execute(
      sql`SELECT COUNT(*) as cnt FROM questions WHERE bankKey = ${srcBank} AND module = ${srcModule}`
    );
    const srcCount = (srcCheck as any[])[0]?.cnt ?? 0;
    console.log(`Copying ${srcCount} questions from ${srcBank}/${srcModule} -> ${destBank}/${destModule}...`);

    if (srcCount === 0) {
      console.warn(`  WARNING: no source questions found for ${srcBank}/${srcModule}`);
      continue;
    }

    // Insert copy with new bankKey and renumbered questionNums
    await (db as any).execute(sql`
      INSERT INTO questions (bankKey, questionNum, module, difficulty, question, options, correctIndex, explanation, steps, tip, isCalc, topic)
      SELECT
        ${destBank},
        ROW_NUMBER() OVER (ORDER BY questionNum) as questionNum,
        ${destModule},
        difficulty,
        question,
        options,
        correctIndex,
        explanation,
        steps,
        tip,
        isCalc,
        topic
      FROM questions
      WHERE bankKey = ${srcBank} AND module = ${srcModule}
      ORDER BY questionNum
    `);

    const [dstCheck] = await (db as any).execute(
      sql`SELECT COUNT(*) as cnt FROM questions WHERE bankKey = ${destBank}`
    );
    console.log(`  Done: ${(dstCheck as any[])[0]?.cnt} questions in ${destBank}`);
  }

  console.log('\nAll copies complete.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
