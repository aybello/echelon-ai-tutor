import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

const subIds = [
  'sub_1Tk5ffIZU5R5gvMsoquBrBVQ', // pemon
  'sub_1Tk3iQIZU5R5gvMsITmGblFC', // cdooher
];

for (const subId of subIds) {
  const sub = await stripe.subscriptions.retrieve(subId, { expand: ['customer'] });
  console.log(`\n=== ${subId} ===`);
  console.log('Customer email:', sub.customer?.email ?? sub.customer);
  console.log('Status:', sub.status);
  console.log('Quantity:', sub.items.data[0]?.quantity);
  console.log('Period end:', new Date(sub.current_period_end * 1000).toISOString());
  console.log('Metadata:', JSON.stringify(sub.metadata, null, 2));
}
