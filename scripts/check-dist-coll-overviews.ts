import { getDb } from '../server/db';
import { moduleOverviews } from '../drizzle/schema';
import { like, or, inArray, sql } from 'drizzle-orm';

const db = await getDb();

// Check dist/coll banks
const distCollRows = await db
  .select({ bankKey: moduleOverviews.bankKey, cnt: sql<number>`count(*)` })
  .from(moduleOverviews)
  .where(or(like(moduleOverviews.bankKey, '%-dist'), like(moduleOverviews.bankKey, '%-coll')))
  .groupBy(moduleOverviews.bankKey);

console.log('Module overviews for dist/coll banks:');
console.log(JSON.stringify(distCollRows, null, 2));

// Also check existing banks for comparison
const existingRows = await db
  .select({ bankKey: moduleOverviews.bankKey, cnt: sql<number>`count(*)` })
  .from(moduleOverviews)
  .where(inArray(moduleOverviews.bankKey, ['class1-water', 'class1-wastewater', 'class2-water']))
  .groupBy(moduleOverviews.bankKey);

console.log('\nExisting banks for comparison:');
console.log(JSON.stringify(existingRows, null, 2));

process.exit(0);
