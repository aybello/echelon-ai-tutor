/**
 * backfill-subscriber-contact.mjs
 * 
 * Looks up the Stripe checkout session for each subscriber that is missing
 * phone/name, retrieves the customer_details from Stripe, and updates the
 * subscriptions table with the correct values.
 * 
 * Run: node scripts/backfill-subscriber-contact.mjs
 */

import Stripe from 'stripe';
import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

async function main() {
  const conn = await createConnection(process.env.DATABASE_URL);

  // Get all subscriptions missing phone or customerName
  const [rows] = await conn.execute(
    `SELECT id, email, stripeSubscriptionId, stripeCustomerId, phone, customerName 
     FROM subscriptions 
     WHERE phone IS NULL OR customerName IS NULL
     ORDER BY createdAt DESC`
  );

  console.log(`Found ${rows.length} subscriptions missing phone/name`);

  for (const row of rows) {
    console.log(`\nProcessing: ${row.email} (sub: ${row.stripeSubscriptionId})`);

    let phone = null;
    let customerName = null;

    try {
      // Method 1: Look up the Stripe subscription metadata
      const sub = await stripe.subscriptions.retrieve(row.stripeSubscriptionId);
      const meta = sub.metadata || {};
      
      phone = meta.customer_phone || null;
      customerName = meta.customer_name || null;
      
      console.log(`  Subscription metadata: phone=${phone}, name=${customerName}`);

      // Method 2: If still missing, look up the customer directly
      if (!phone || !customerName) {
        const customer = await stripe.customers.retrieve(row.stripeCustomerId);
        if (!customer.deleted) {
          if (!phone && customer.phone) {
            phone = customer.phone;
            console.log(`  Customer phone: ${phone}`);
          }
          if (!customerName && customer.name) {
            customerName = customer.name;
            console.log(`  Customer name: ${customerName}`);
          }
        }
      }

      // Method 3: Look up the checkout session for this subscription
      if (!phone || !customerName) {
        // List checkout sessions for this subscription
        const sessions = await stripe.checkout.sessions.list({
          subscription: row.stripeSubscriptionId,
          limit: 5,
          expand: ['data.customer_details'],
        });
        
        for (const session of sessions.data) {
          const details = session.customer_details;
          if (!phone && details?.phone) {
            phone = details.phone;
            console.log(`  Session customer_details.phone: ${phone}`);
          }
          if (!customerName && details?.name) {
            customerName = details.name;
            console.log(`  Session customer_details.name: ${customerName}`);
          }
          // Also check session metadata
          if (!phone && session.metadata?.customer_phone) {
            phone = session.metadata.customer_phone;
            console.log(`  Session metadata phone: ${phone}`);
          }
          if (!customerName && session.metadata?.customer_name) {
            customerName = session.metadata.customer_name;
            console.log(`  Session metadata name: ${customerName}`);
          }
          if (phone && customerName) break;
        }
      }

      // Update the database if we found anything
      if (phone || customerName) {
        const updates = {};
        if (phone) updates.phone = phone;
        if (customerName) updates.customerName = customerName;
        
        const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = [...Object.values(updates), row.id];
        
        await conn.execute(
          `UPDATE subscriptions SET ${setClauses} WHERE id = ?`,
          values
        );
        console.log(`  ✅ Updated: phone=${phone}, name=${customerName}`);
      } else {
        console.log(`  ⚠️  Could not find phone/name for this subscriber`);
      }
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`);
    }
  }

  await conn.end();
  console.log('\nDone!');
}

main().catch(console.error);
