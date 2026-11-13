# Buyer Funnel Measurement

## Purpose

This is Echelon Institute's owner-facing measurement path for improving revenue without collecting unnecessary personal data.

> The funnel is: **public page view → buyer path → course choice → checkout start → paid checkout → access activation → learning activity.**

## Events

| Event | When it is recorded | What it captures |
|---|---|---|
| `marketing_page_viewed` | A public marketing page is opened | Normalized page path, coarse source category, device category, region category, and a hashed browser identifier |
| `pricing_viewed` | The pricing page opens | Coarse source, device, and region categories plus a hashed browser identifier |
| `buyer_path_selected` | A visitor selects Individual or Team | Buyer path and the same coarse context |
| `product_selected` | A visitor selects a course in pricing or from a homepage course card | Canonical product key and coarse context |
| `checkout_started` | Echelon creates a Stripe Checkout session | Product or team plan, amount, currency, and coarse acquisition context |
| `checkout_completed` | A server-verified purchase or team subscription is provisioned | Paid product or team plan and the saved coarse acquisition context |
| `access_activated` | The paid pass or team plan becomes usable | Activation type and the saved coarse acquisition context |
| Learning events | Diagnostic, quiz, mock exam, tutoring, or study actions | Course-scoped product usage only |

## Privacy boundary

Public funnel events **do not store** a raw referrer, search term, full query string, name, email, phone number, address, or IP address. Browser IDs and purchaser emails are hashed before persistence. The source field is one of `campaign`, `direct`, `organic`, `referral`, or `social`.

Stripe remains the payment system of record. Echelon's application never records card information.

## Owner use

Open **Admin → Product scorecard** to view the 30-day counts for marketing page views, course choices, checkout starts, completed purchases or team plans, access activations, and learning activity. Use the counts to identify the first meaningful leak in the funnel before spending on acquisition or building a new feature.

## Interpretation

- High page views with low course choices: improve course discovery, proof, or course-fit clarity.
- High course choices with low checkout starts: improve pricing clarity or reduce buyer uncertainty.
- High checkout starts with low completions: inspect Stripe checkout completion, offer terms, and payment friction.
- High activations with low learning starts: improve onboarding and the first study action.

Do not infer individual-level behavior from aggregated dashboard counts. Use documented customer-support and account tools only when a specific learner needs help.
