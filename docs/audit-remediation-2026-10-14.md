# October 14 audit remediation — review branch, not a deployment

Based on main `7b47e3f45ec6f91e2f480581763c1c77c878e1e8`.

## Included

- Consolidates the code from PR 157 (admin sales ledger and lead triage) and PR 160 (changelog history/editor). PR 158 overlaps and must not be merged separately. Existing PRs are not closed by this branch.
- Corrects the stale homepage assertion so the complete Quality Gate can reach database and browser stages.
- Adds server-enforced admin-only contact follow-up states and shows reconciled individual/Team Flex sales without summing overlapping revenue.
- Only open inbound enquiries enter the bulk reply queue. Absence of an unsubscribe is not presented as marketing consent; trial bulk copying fails closed without explicit evidence. Historical opt-outs are checked even outside capture pagination. This does not retrofit marketing permission onto legacy records or alter the automated recovery/follow-up workers.
- Public and admin changelog use the same bundled history, with explicit read-only bundled entries, automatic newest-first ordering, visible errors, retry and honest save feedback. Missing records return errors rather than false success. Current release notes and pricing clarification are shipped with code; historical database notes are not rewritten.
- Fixes Texas course navigation mislabelled Ontario/Class I, removes the contradictory dedicated-course availability text, and makes the existing CAD-priced Texas individual pass discoverable from pricing. Does not change question data, entitlement, pricing amounts or Teams eligibility, and does not establish human subject-matter review evidence.
- Fixes municipal receipts: the former 64-character hash failed the persistence UUID contract. Keys now have a deterministic valid UUID format, include submitted contact/pricing details, and deduplicate retries. Callback permission timestamps preserve the first saved receipt across later retries.
- Adds optional callback phone/time with unchecked permission and server-recorded notice version/time in the durable enquiry message. No schema migration is required. Admin enquiry details retain the evidence; the unified inbox shows the phone. No messages are sent by admin triage.
- Routes municipal HTTP traffic through the contact limiter and adds per-procedure IP/email limits to cover batched requests. Process-local limits are bounded and collapse IPv6 subnets; multi-replica deployments still need a shared limiter store.

## Validation and release gates

Run application and script TypeScript checks, the deterministic unit/acceptance suite, privacy guard and its regressions, migration verification, client build, and a server build from the clean committed tree.

New executable tests cover real municipal router-to-persistence validation, changed payloads, retries at different times, phone permission, callback evidence, IP/email throttling, rendered Texas identity/pricing, and changelog authorization/failure behavior.

`server/auditAdminLifecycle.integration.test.ts` is wired into the existing database-backed audit CI stage. It verifies real-MySQL changelog create/edit/hide/publish/delete, admin role restrictions, durable municipal callback receipts, lead status updates, and opt-outs older than the returned capture window. It rejects all databases except the existing pinned disposable CI/local audit targets and mocks outbound notification delivery. Do not run it against production.

Before merge: require the full latest-head Quality and Privacy runs to pass, validate the authenticated admin UI and mobile/keyboard behavior, and review the consolidated diff. Do not merge the superseded admin/changelog branches independently.

## Not performed / still required

- No main merge, deployment, production database mutation, customer contact, paid transaction, or question-bank import.
- GitHub repository administration is not available to the connected integration. An owner must enable main protection/rulesets, require Quality + Privacy and review approval, and prevent direct unreviewed pushes. A green PR does not itself enforce branch protection.
- PR 148 remains separate. Its pre-SMTP retry defect, checkout reminder consent migration/configuration and release rehearsal still require dedicated remediation. This branch does not claim those workers are safe or enabled.
- Texas item-level subject-matter review/blueprint evidence and a shared multi-replica rate-limit store remain outside this patch.
- The full institutional platform (approved trial provisioning, formal PO/invoice/EFT workflow, renewal evidence packets) remains tracked separately; quote/pilot requests do not grant access.
