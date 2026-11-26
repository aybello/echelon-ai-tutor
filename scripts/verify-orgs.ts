import { getDb } from '../server/db';
import { organizations, organizationMembers } from '../drizzle/schema';
import { inArray } from 'drizzle-orm';

async function main() {
  const db = await getDb();
  if (!db) { console.log('no db'); process.exit(1); }

  const orgs = await db.select().from(organizations).where(inArray(organizations.id, [90001, 90002]));
  const members = await db.select().from(organizationMembers).where(inArray(organizationMembers.orgId, [90001, 90002]));

  for (const org of orgs) {
    const orgMembers = members.filter(m => m.orgId === org.id);
    console.log(`\nORG ${org.id}: ${org.name}`);
    console.log(`  Manager: ${org.managerEmail}`);
    console.log(`  Seats: ${org.seatsTotal} | Status: ${org.status} | Province: ${org.province}`);
    console.log(`  Expires: ${org.termEnd}`);
    console.log(`  Members (${orgMembers.length}):`);
    for (const m of orgMembers) {
      console.log(`    - ${m.email} | role: ${m.role} | status: ${m.status}`);
    }
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
