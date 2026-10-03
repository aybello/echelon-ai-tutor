# Public-tree privacy boundary

Customer records, billing identifiers, authentication tokens and private exports must not be committed. Tests and demonstrations use reserved `example.com` or `.test` addresses and explicitly synthetic identities. Public service inboxes and legitimate public service documentation can be approved narrowly in the privacy guard, not by exempting entire files or domains.

## Current operations

The old account-specific lookup, plaintext-OTP, pre-generated magic-link, subscription insertion and manager welcome scripts are retired. They intentionally fail before any database, provider or mail operation. Use current authenticated admin and guarded recovery workflows instead. Their inputs belong in owner-controlled storage outside the checkout, with restrictive permissions. Do not restore embedded recipients or tokens. The reporting-only owner exclusion now reads the private `OWNER_EMAIL` setting; when absent, no address is excluded.

The reusable exam follow-up template reads an explicitly approved private recipient manifest rather than a committed list. Approval of a code change is not approval to send mail. Demo seed/simulation scripts require a loopback MySQL database named `echelon_audit_*` or `echelon_demo_*` and explicit `DEMO_FIXTURE_APPROVED=ISOLATED_DEMO_FIXTURES`. The seed does not load a checkout environment file or issue/print an authentication token. None of these operations was executed by this repair.

## Analytics

The template analytics script remains, but automatic page/click tracking is disabled. A synchronous fail-closed hook blocks sends until the privacy boundary is ready. Only the fixed `public_page_view` event is accepted, rebuilt using an allowlisted public path and category. Dynamic route values become route templates. Query strings, fragments, referrers, arbitrary event properties and identifying document titles are not sent. Authentication, OTP, magic-link, invitation, claim, activation, purchase confirmation, account, learner and unknown routes are not tracked, on either initial load or SPA navigation.

First-party product reporting is unchanged. It uses a persistent pseudonymous browser identifier in local storage and stores only hashed identifiers on the server; this is not equivalent to no tracking storage.

## Gate and remaining containment

Run `node scripts/privacyGuard.mjs` for all tracked text, or add `--staged` to scan the exact indexed blobs rather than unstaged worktree contents. Optionally pass `--artifacts dist/public` after a safe build to scan generated public text as well. Failures report only filename and category counts, never matching values. Detection covers unexpected email literals, non-synthetic billing identifiers, common provider secrets, credential-bearing database URLs, private-key blocks, authentication-token literals and private-export filenames. It cannot establish the identity of every arbitrary name or detect every possible encoded secret; review remains necessary.

Current-tree sanitization does **not** remove data from Git history, forks, caches, old archives or previously shared copies, and does not invalidate any previously exposed credential. Historical cleanup, credential assessment/rotation, incident response, access changes and any notifications require a separately approved process. This package does not perform them.
