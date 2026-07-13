/**
 * Creates Utilities Kingston organizations based on confirmed Stripe invoices:
 * - Philip Emon (pemon@utilitieskingston.com): 10 seats, Ontario, expires Jun 19 2027
 * - Carl Dooher (cdooher@utilitieskingston.com): 14 seats, Ontario, expires Jun 19 2027
 */
import { getDb } from '../server/db';
import { organizations, organizationMembers, subscriptions } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { grantSeat } from '../server/routers/orgRouter';

async function main() {
  const db = await getDb();
  if (!db) { console.log('no db'); process.exit(1); }

  const termEnd = new Date('2027-06-19T16:53:32.000Z');

  const orgsToCreate = [
    {
      name: 'Utilities Kingston',
      managerEmail: 'pemon@utilitieskingston.com',
      seats: 10,
      stripeSubscriptionId: 'sub_1Tk5ffIZU5R5gvMsoquBrBVQ',
      stripeCustomerId: 'cus_UjYnvzZPheOuYf',
    },
    {
      name: 'Utilities Kingston',
      managerEmail: 'cdooher@utilitieskingston.com',
      seats: 14,
      stripeSubscriptionId: 'sub_1Tk3iQIZU5R5gvMsITmGblFC',
      stripeCustomerId: 'cus_UjWl4MegtHxCXZ',
    },
  ];

  for (const org of orgsToCreate) {
    console.log(`\nCreating org for ${org.managerEmail} (${org.seats} seats)...`);

    // Insert organization
    const [insertResult] = await db.insert(organizations).values({
      name: org.name,
      province: 'ontario',
      tier: 'all-access',
      seatsTotal: org.seats,
      managerEmail: org.managerEmail,
      stripeSubscriptionId: org.stripeSubscriptionId,
      stripeCustomerId: org.stripeCustomerId,
      termEnd,
      billingType: 'stripe',
      status: 'active',
    });

    const orgId = (insertResult as any).insertId;
    console.log(`  Org created with ID: ${orgId}`);

    // Grant manager seat (creates subscription row for them)
    const orgObj = { id: orgId, name: org.name, province: 'ontario', termEnd };
    await grantSeat(db, orgObj, org.managerEmail, 'manager');
    console.log(`  Manager seat granted to ${org.managerEmail}`);

    // Update the existing subscription row to link it to this org
    await db.update(subscriptions)
      .set({ orgId })
      .where(eq(subscriptions.stripeSubscriptionId, org.stripeSubscriptionId));
    console.log(`  Subscription linked to org`);
  }

  console.log('\n✅ Done! Both orgs created successfully.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
