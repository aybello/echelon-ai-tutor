# Payment confirmation and OIT repair — 2026-09-21

## Changes

- Purchase reconciliation compares the Stripe session ID with the recorded purchase before flagging missing access. Matching refunded or expired rows are skipped without changing access. Identity/product mismatches and database failures remain visible. The reconciliation job never inserts or updates purchases.
- Purchase confirmation polls sequentially, pauses visibly after five retries or a failed check, and offers a manual recheck. A previously confirmed payment stays confirmed after a transient failure. Course/setup links appear only after the server confirms the purchase record. Customers are told not to purchase again.
- OIT question 6 now asks for the first response to a chlorine detector alarm by an operator not trained for leak response. All four options have comparable detail and test action priorities. The correct answer remains at index 2 and the question ID remains 35031. The explanation cites [CCOHS Chlorine](https://www.ccohs.ca/oshanswers/chemicals/chem_profiles/chlorine.html), specifically incidental release measures and handling practices, reviewed September 21, 2026. The earlier ambiguous frost-only inference is not needed to answer the new scenario.

## Code release

No schema migration is required. Run the full Quality Gate, including the new `e2e/purchase-confirmation.spec.ts`. Its controlled API responses test desktop/mobile delayed fulfillment, exhausted polling, manual retry, initial and subsequent errors, and slow requests without contacting Stripe or writing customer data.

After deploying, verify a dedicated QA checkout with a delayed notification, then recheck access on the confirmation page. Read-only reconciliation should skip a recorded checkout and report an actually missing one. It must not restore refunded access or create purchases.

## Separate content application

Deploying the application does **not** import question content. Use the existing authoritative-database release environment with certificate-verified TLS; do not paste secrets into chat or repository files.

1. Run `pnpm oit:repair-reported-items` without `--apply`. Review `ready`, `changes`, `unchanged` and `planHash`.
2. Version `2026-09-21-v2` accepts only the exact original baseline, the exact previously published v1 question-6 repair, or the exact v2 result. It rejects all other content/identity/status changes. If the other three v1 corrections are already present, only question 6 changes. An original baseline still receives the existing four-item repair.
3. Apply the reviewed plan with a new private backup file:

   ```sh
   pnpm oit:repair-reported-items -- --apply \
     --expected-plan-sha256 <hash-from-current-dry-run> \
     --backup-file /home/ubuntu/private/echelon-authoritative-recovery/oit-content-repair-backups/reported-oit-v2-before.json
   ```

4. The tool locks and rechecks the reviewed state, creates a durable private before-image, updates in place, increments `contentVersion`, and verifies the result before committing. It does not change question IDs, answer positions, review statuses or historical attempts. An unchanged rerun is a no-op.
5. Run a fresh dry-run and verify no changes remain; inspect the learner-rendered question after cache refresh. Keep the private backup and release evidence. Do not claim the content is live until this succeeds.

## Verification boundary

These changes do not query, restore or certify historical customer data or prove production backup recoverability. Those operational checks remain separate from this code/content repair.

## Local validation

- Application and scripts TypeScript checks passed.
- Production client/server build passed (existing bundle-size warnings remain).
- 63 focused tests passed across reconciliation, managed-job handling, purchase writer boundaries, pass terms, payment timestamp/checkout validation, OIT repair/backup safety and continuation behavior.
- All seven browser regressions passed against the production client build with Chrome Headless Shell 151.0.7922.34, including 1280px desktop and 390px mobile widths. API responses were controlled fixtures; this is not evidence of a real production payment.
- No production data was read or written and no content import was performed during implementation.
