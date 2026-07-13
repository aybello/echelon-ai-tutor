import { getDb } from '../server/db';
import { subscriptions, organizations, organizationMembers } from '../drizzle/schema';
import { like, or } from 'drizzle-orm';

async function main() {
  const db = await getDb();
  if (!db) { console.log('no db'); process.exit(1); }

  const subs = await db.select().from(subscriptions).where(
    or(
      like(subscriptions.email, '%pemon%'),
      like(subscriptions.email, '%kingston%'),
      like(subscriptions.email, '%utilities%'),
    )
  );
  console.log('SUBSCRIPTIONS:', JSON.stringify(subs, null, 2));

  const orgs = await db.select().from(organizations);
  console.log('ORGANIZATIONS:', JSON.stringify(orgs, null, 2));

  const members = await db.select().from(organizationMembers);
  console.log('ORG MEMBERS:', JSON.stringify(members, null, 2));

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
