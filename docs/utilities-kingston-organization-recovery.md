# Utilities Kingston Organization Recovery Controls

## Purpose

This runbook governs the one-time recovery of two verified historical **Utilities Kingston** annual organization purchases after the earlier Echelon database loss. It is a narrow exception to the standard historical individual-customer workflow. It is not a Stripe sale replay and does not use historical Stripe records as live billing identifiers.

## Authorized recovery scope

The owner approved the following reconstruction on September 18, 2026. The Treatment manager owns **14** annual seats. The Distribution manager owns **10** annual seats. Each manager receives a separate organization dashboard. The annual term for each dashboard begins at the exact protected Stripe payment timestamp and ends on the same UTC calendar date one year later. A February 29 purchase ends on February 28 in the following non-leap year.

The importer creates exactly two active Ontario all-access organization records and exactly two manager memberships. It creates no operator memberships, users, purchases, subscriptions, Team Flex licences, annual-licence usage records, messages, emails, Stripe API requests, or charges. No operator is assigned because no current operator roster was evidenced.

## Evidence and approval requirements

The private plan must bind the two immutable Stripe evidence keys to the Treatment and Distribution groups, respectively. It must contain the checksum of the protected Stripe archive and a durable authorization reference. The importer compares the plan against both the staged evidence table and the protected archive before writing. The archive is the source of the precise historical payment timestamps.

The plan is stored only outside the repository in protected storage. Customer names, emails, payment identifiers, amounts, and raw evidence never appear in source code, public reports, Git history, Notion, or chat.

## Safety sequence

The operator first runs `preflight`. It verifies the archive checksum, evidence status, approved seat counts, separate manager identities, lack of existing recovery mapping, lack of conflicting organization records, and exact expected database baseline. The result is a private report with a digest.

The operator then supplies the exact plan-derived confirmation token and a 32-byte backup key held outside the repository. Before the write, the tool creates an encrypted before-image backup, immediately decrypts it to prove restoration, takes a named database lock, uses a serializable transaction, locks the two evidence rows, and repeats every mutable precondition.

Within one transaction, the tool records a recovery batch, creates the two organizations and manager memberships, persists two immutable evidence-to-output mapping rows, and marks only the two evidence rows as imported. It validates that the only permitted database deltas are the two organizations, two manager memberships, one batch, and two mapping records. Any other delta causes rollback.

## Re-run behavior

The recovery key, plan digest, evidence mappings, organization mappings, manager mappings, and external references are unique. A repeat of the same completed plan returns an already-applied verification without making a second write. A changed plan or conflicting evidence fails closed.

## Post-recovery boundaries

The two managers may sign in through the normal manager identity flow and assign operator seats later. Their operator assignments remain subject to the annual 14-seat and 10-seat limits. The recovery does not send onboarding mail automatically. Any contact or roster invitation is a separate, owner-controlled action.

The 31 ambiguous individual historical payments remain subject to claimant verification, product mapping, and explicit approval. This exception does not relax that process.
