# Account isolation repair — release checks

This is the first focused codebase-audit repair, based on `acc50b73229107b154e83adc935ade0d67073422`.
It needs no database migration and makes no production-data changes.

## Behavior

- Both logout RPCs expire OAuth and verified-email cookies. Account, learner, manager and dashboard sign-out controls share the same client cleanup.
- Successful logout cancels cached queries, clears device-local Echelon access tokens, question samples and exam recovery drafts, notifies other tabs, and replaces the page with `/account`. Unrelated preferences such as the theme remain. A shared-device reset also ends the server session.
- Failed logout displays an error and permits retry. It never claims that server cookies have been removed without acknowledgement.
- `stripe.checkAccess` ignores its legacy caller-supplied email. A verified email session takes priority over a stale browser token; token-only access retains its live entitlement recheck.
- Annual team access requires an assigned course, a recognized organization status and a future term end. Multi-course assignments work; missing assignments no longer imply all-access.

Signing out removes this browser's credentials; it does not revoke copies of previously issued bearer tokens on other devices. Server-wide token revocation is outside this batch.

## Evidence and review

Before changing the implementation, regression tests reproduced both single-cookie logout failures and access grants based on an unrelated email plus an invalid/unentitled token. Focused tests also cover cancellation of pending account queries, blocked browser storage, annual membership state, missing assignments and expired terms.

The browser regression uses synthetic account reads and the real HTTP logout endpoint. It verifies both cookie removals, storage cleanup in two tabs, subsequent account reuse, and a failed request followed by a successful retry. It does not log in a real customer or test real OTP delivery. The existing database-backed Teams journey remains in the Quality Gate.

Require the complete Quality Gate on the reviewed head, including `e2e/logout.spec.ts`. The local Chromium download was unavailable; remote browser results must be checked rather than inferred from unit tests.

## Manus release verification

After independent review and deployment, use dedicated QA identities to test OAuth, OTP learner and team-manager sign-out. Leave a study tab open, sign out in another tab, and verify that both require a fresh sign-in. Sign in as a second QA identity and confirm that the first identity's paid courses, mock draft and account data are absent. Verify an assigned annual course still opens and an expired/unassigned course does not. Do not use Sally's account or send customer invitations for QA.

The remaining audit findings (attempt submission authorization, checkout identity scope, bundled paid seeds, scheduler/environment isolation and individual-subscription recovery) are separate work. This PR does not claim the whole audit is resolved.
