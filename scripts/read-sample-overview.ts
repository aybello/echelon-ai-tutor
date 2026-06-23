import { getDb } from '../server/db';
import { moduleOverviews } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const db = await getDb();

const rows = await db
  .select()
  .from(moduleOverviews)
  .where(eq(moduleOverviews.bankKey, 'wpi-class1-water-dist'))
  .limit(1);

if (rows.length > 0) {
  const parsed = JSON.parse(rows[0].overviewsJson);
  const modules = Object.keys(parsed);
  console.log('Modules in wpi-class1-water-dist:', modules);
  console.log('\nSample module structure for first module:');
  const firstModule = modules[0];
  console.log(JSON.stringify(parsed[firstModule], null, 2).slice(0, 800));
} else {
  console.log('No overview found');
}

process.exit(0);
