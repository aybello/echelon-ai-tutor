/**
 * Looks up pemon@utilitieskingston.ca in Stripe and prints their subscription details.
 */
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

// Search by multiple possible emails
const emailsToTry = [
  'pemon@utilitieskingston.ca',
  'pemon@utilitieskingston.com',
];

let customers = { data: [] };
for (const email of emailsToTry) {
  const result = await stripe.customers.list({ email, limit: 5 });
  if (result.data.length > 0) {
    customers = result;
    console.log('Found customer with email:', email);
    break;
  }
}

// Also search recent subscriptions with kingston in metadata
if (customers.data.length === 0) {
  console.log('No customer found by email, searching recent subscriptions...');
  const recentSubs = await stripe.subscriptions.list({ limit: 50, status: 'active' });
  for (const sub of recentSubs.data) {
    const meta = JSON.stringify(sub.metadata).toLowerCase();
    if (meta.includes('kingston') || meta.includes('utilities') || meta.includes('pemon')) {
      console.log('Found matching subscription:', sub.id);
      console.log('Metadata:', JSON.stringify(sub.metadata, null, 2));
      console.log('Customer:', sub.customer);
      console.log('Quantity:', sub.items.data[0]?.quantity);
      console.log('Period end:', new Date(sub.current_period_end * 1000).toISOString());
    }
  }
  // Also check recent checkout sessions
  const recentSessions = await stripe.checkout.sessions.list({ limit: 50 });
  for (const session of recentSessions.data) {
    const meta = JSON.stringify(session.metadata).toLowerCase();
    const custEmail = (session.customer_details?.email || '').toLowerCase();
    if (meta.includes('kingston') || meta.includes('utilities') || meta.includes('pemon') || custEmail.includes('kingston') || custEmail.includes('utilities')) {
      console.log('\nFound matching checkout session:', session.id);
      console.log('Customer email:', session.customer_details?.email);
      console.log('Status:', session.status, '| Payment:', session.payment_status);
      console.log('Metadata:', JSON.stringify(session.metadata, null, 2));
    }
  }
  process.exit(0);
}

const email = customers.data[0].email;

for (const customer of customers.data) {
  console.log('\n=== CUSTOMER ===');
  console.log('ID:', customer.id);
  console.log('Email:', customer.email);
  console.log('Name:', customer.name);
  console.log('Created:', new Date(customer.created * 1000).toISOString());

  // Get their subscriptions
  const subs = await stripe.subscriptions.list({ customer: customer.id, limit: 10 });
  for (const sub of subs.data) {
    console.log('\n--- SUBSCRIPTION ---');
    console.log('ID:', sub.id);
    console.log('Status:', sub.status);
    console.log('Current period end:', new Date(sub.current_period_end * 1000).toISOString());
    console.log('Quantity:', sub.items.data[0]?.quantity);
    console.log('Metadata:', JSON.stringify(sub.metadata, null, 2));
    console.log('Items:', sub.items.data.map(i => i.price?.nickname || i.price?.id).join(', '));
  }

  // Also check checkout sessions
  const sessions = await stripe.checkout.sessions.list({ customer: customer.id, limit: 5 });
  for (const session of sessions.data) {
    console.log('\n--- CHECKOUT SESSION ---');
    console.log('ID:', session.id);
    console.log('Status:', session.status);
    console.log('Payment status:', session.payment_status);
    console.log('Metadata:', JSON.stringify(session.metadata, null, 2));
  }
}
