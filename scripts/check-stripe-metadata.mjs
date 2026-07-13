import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

// Search by customer email
const emails = ['pemon@utilitieskingston.com', 'cdooher@utilitieskingston.com'];

for (const email of emails) {
  console.log(`\n=== Searching for ${email} ===`);
  const customers = await stripe.customers.list({ email, limit: 5 });
  if (customers.data.length === 0) {
    console.log('No customer found');
    continue;
  }
  for (const customer of customers.data) {
    console.log(`Customer: ${customer.id} (${customer.email})`);
    const subs = await stripe.subscriptions.list({ customer: customer.id, limit: 10 });
    for (const sub of subs.data) {
      console.log(`  Sub: ${sub.id} | status: ${sub.status} | qty: ${sub.items.data[0]?.quantity}`);
      console.log(`  Metadata:`, JSON.stringify(sub.metadata));
      // Also check the checkout session that created this
      const sessions = await stripe.checkout.sessions.list({ subscription: sub.id, limit: 3 });
      for (const s of sessions.data) {
        console.log(`  Checkout session: ${s.id} | status: ${s.status}`);
        console.log(`  Session metadata:`, JSON.stringify(s.metadata));
      }
    }
  }
}
