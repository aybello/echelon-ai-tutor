# Echelon production release gate

Merged, deployed, and production-proven are different states. A release is not complete until the applicable checks below have evidence attached.

## Automated gate

- TypeScript check passes.
- Deterministic unit and acceptance tests pass.
- Client and server production bundles build.
- Required production secrets are present: `JWT_SECRET`, `DATABASE_URL`, `CRON_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS`.
- No unsupported testimonials, unqualified coverage claims, or conflicting prices are introduced.

## City of Winnipeg Course Pass smoke test

Run this only after a real paid Course Pass order exists.

1. Confirm Stripe payment and the exact purchased inventory in the manager dashboard.
2. Invite one designated test operator to the correct course.
3. Confirm email delivery and that the invitation link opens the expected organization and course.
4. Request and verify an OTP using the invited email.
5. Claim the invitation and explicitly activate the licence.
6. Confirm the correct course opens.
7. Confirm an unpurchased course fails closed.
8. Answer one question and complete one mock submission.
9. Confirm progress appears only in the purchasing organization's manager dashboard.
10. Resend, cancellation, CSV export, and licence inventory totals must remain correct.

Record the order ID, invitation ID, test email, course key, timestamp, screenshots, and result. Do not use a real learner's private answers in the evidence package.

## Content authority gate

Instructional content that states a legal or regulatory requirement must include the jurisdiction, source URL, exact section or schedule where applicable, review date, and technical reviewer. Content without that evidence must be labelled exam guidance or field practice, not regulation.
