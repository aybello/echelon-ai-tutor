# Historical Customer Recovery Controls

The recovery process begins with a private Stripe export. The export must never be placed in the repository, attached to public assets, or pasted into chat. The normalizer accepts a file path outside the repository, produces a non-sensitive manifest by default, and does not write evidence rows unless a one-time operator approval variable is present.

Evidence staging is not entitlement recovery. Staged rows have no product mapping, no claimant verification, no approval, and no ability to create purchases, subscriptions, accounts, access tokens, or course access. A later recovery operation must require a separate written authorization, a reviewed product mapping, verified control of the original purchase email, and an approved evidence row. Refunded, disputed, duplicate, or already-imported evidence must fail closed.

The live application must use the Echelon Institute Stripe merchant account. Do not use a stale sandbox credential to retrieve or stage evidence. Use the owner-controlled Stripe dashboard export and record only its private archive reference and SHA-256 manifest in recovery operations.

The optional `--summary` output is a category-level recovery review only. It deliberately excludes customer identifiers, raw descriptions, payment IDs, and customer-level amounts. Its product labels are conservative candidates, not entitlement decisions. Every candidate still requires claimant verification and explicit approval before any import.
