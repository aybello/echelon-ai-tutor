# Echelon production release gate

Merged, deployed, and production-proven are different states. A release is not complete until the applicable checks below have evidence attached.

## Automated gate

- TypeScript check passes.
- Deterministic unit and acceptance tests pass.
- Client and server production bundles build.
- Required production secrets are present: `JWT_SECRET`, `DATABASE_URL`, `CRON_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS`.
- No unsupported testimonials, unqualified coverage claims, or conflicting prices are introduced.

## Audit remediation migration-first gate

The question-governance application code must not be released before migration
`drizzle/0053_question_governance.sql`. Use this order for the remediation release:

1. Create and verify a restorable production database backup.
2. Apply only the additive migration `drizzle/0053_question_governance.sql` in a low-traffic window.
3. Run `pnpm db:verify-question-governance` against the production database. It must report all seven governance columns and both review indexes as present.
4. Deploy the application commit only after that verification passes.
5. Smoke-test a normal quiz read and AI Tutor lookup for one paid course, then open the admin question-governance queue and update one test question's review state.

Do not use `pnpm db:push` for this release. If the schema verification fails,
stop the deployment and leave the existing application version running.

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
