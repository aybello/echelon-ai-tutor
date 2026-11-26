import { getDb } from '../server/db';
import { sql } from 'drizzle-orm';

const BANKS = [
  {
    bankKey: 'class1-water-dist',
    modules: ['Water Distribution'],
    moduleTargets: { 'Water Distribution': 100 },
    totalQuestions: 300,
  },
  {
    bankKey: 'class2-water-dist',
    modules: ['Water Distribution'],
    moduleTargets: { 'Water Distribution': 100 },
    totalQuestions: 300,
  },
  {
    bankKey: 'class3-water-dist',
    modules: ['Water Distribution'],
    moduleTargets: { 'Water Distribution': 100 },
    totalQuestions: 300,
  },
  {
    bankKey: 'class4-water-dist',
    modules: ['Water Distribution'],
    moduleTargets: { 'Water Distribution': 100 },
    totalQuestions: 300,
  },
  {
    bankKey: 'class1-wastewater-coll',
    modules: ['Wastewater Collection'],
    moduleTargets: { 'Wastewater Collection': 100 },
    totalQuestions: 300,
  },
  {
    bankKey: 'class2-wastewater-coll',
    modules: ['Collection Systems'],
    moduleTargets: { 'Collection Systems': 100 },
    totalQuestions: 300,
  },
  {
    bankKey: 'class3-wastewater-coll',
    modules: ['Wastewater Collection'],
    moduleTargets: { 'Wastewater Collection': 100 },
    totalQuestions: 300,
  },
  {
    bankKey: 'class4-wastewater-coll',
    modules: ['Wastewater Collection'],
    moduleTargets: { 'Wastewater Collection': 100 },
    totalQuestions: 300,
  },
];

async function main() {
  const db = await getDb();
  if (!db) throw new Error('DB connection failed');

  for (const b of BANKS) {
    const modulesJson = JSON.stringify(b.modules);
    const moduleTargetsJson = JSON.stringify(b.moduleTargets);

    const [existing] = await (db as any).execute(
      sql`SELECT id FROM question_bank_meta WHERE bankKey = ${b.bankKey}`
    );
    if ((existing as any[]).length > 0) {
      console.log(`UPDATE ${b.bankKey}`);
      await (db as any).execute(sql`
        UPDATE question_bank_meta SET
          modules = ${modulesJson},
          moduleTargets = ${moduleTargetsJson},
          totalQuestions = ${b.totalQuestions}
        WHERE bankKey = ${b.bankKey}
      `);
    } else {
      console.log(`INSERT ${b.bankKey}`);
      await (db as any).execute(sql`
        INSERT INTO question_bank_meta (bankKey, modules, moduleTargets, totalQuestions)
        VALUES (${b.bankKey}, ${modulesJson}, ${moduleTargetsJson}, ${b.totalQuestions})
      `);
    }
  }
  console.log('Done seeding question_bank_meta');
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
