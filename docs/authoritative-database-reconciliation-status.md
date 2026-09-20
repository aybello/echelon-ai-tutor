# Authoritative Database Reconciliation Status

**Status:** Final frozen-source rehearsal completed and passed. **Not approved for live database routing.**

## What this record means

Echelon Institute recovered an encrypted copy of the original database. That copy is the authoritative historical source. The live application currently uses a later emergency recovery copy that contains some recovery-era records and configuration that do not exist in the original source.

A separate candidate database was built from the authoritative source. It then received the current-production-only records through guarded mapping rules. The live application, production database routing, customer access, pricing, and scheduled work were not changed during this reconciliation work.

## Reconciliation result

The candidate contains the original historical records and the emergency-recovery records that are not already represented in the original source. The private reconciliation evidence verifies the candidate table inventory, production coverage, relationship checks, duplicate payment checks, inactive authentication-token checks, strict TLS application connectivity, TypeScript validation, focused cutover tests, and a production build.

Some historical records have already-lost organization references in the original source. Those records were retained as historical data rather than silently repaired. A small set of current-production usage records has the same condition. The final rehearsal must preserve or explicitly record those references without guessing an organization.

## Controls that must remain in force

The candidate is an **isolated rehearsal database**. It was rebuilt from the verified original snapshot after a confirmed production write freeze, then reconciled and validated without any production-routing change. It must not become the production database or be reused for a later routing decision. Because normal writes were restored after the rehearsal, any later routing window must start from a new candidate database and a new confirmed write freeze.

The final reconciliation must use a consistent, read-only source transaction after the application write freeze is verified. It must record the source snapshot time and the full private audit output. The final validation must have no unexplained coverage failures, relationship failures, duplicate payment keys, active login tokens, or schema-contract failures.

The final window also requires an encrypted, restorable backup of the current production database, an explicit owner approval after the final audit passes, controlled routing to the verified external database, read-path and entitlement smoke tests, and retention of the prior production database for rollback. The existing DigitalOcean backup and point-in-time recovery verification remains a separate continuity control, not a substitute for this reconciliation.

## Data-handling rules

Protected database archives, credentials, CA certificates, customer identities, payment evidence, candidate target metadata, and detailed reconciliation reports remain under private storage. They must never be committed to Git, copied into project assets, or placed in Notion. Public repository records may document process status and safeguards only.

## Completed rehearsal

The final rehearsal completed under a verified server-side write freeze. An encrypted current-production backup was created in protected storage, and the fresh candidate passed private coverage, integrity, payment-key, inactive-token, strict-TLS application, focused cutover, TypeScript, and production-build checks. No production routing, customer record, pricing, access, payment, scheduled work, or outbound communication was changed. Normal production writes were subsequently verified as restored.

## Current next action

The next action requires **separate explicit approval for production routing**. That window must rebuild the candidate again under a new confirmed write freeze, repeat the final audit, then present the validation result before the protected production database selector can change. The current production database remains active and available for rollback. The final runbook in [1] governs that window.

## References

[1]: ./external-database-cutover-runbook.md "Echelon Institute External Database Cutover Runbook"
[2]: ./business-owned-data-continuity-plan.md "Echelon Institute Business-Owned Data Continuity Plan"
