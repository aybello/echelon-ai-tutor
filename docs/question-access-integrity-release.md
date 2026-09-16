# Question access and practice integrity repair

This repair removes answer-bearing seed banks and persistent question caches from the browser build. Questions are delivered by the existing server preview/entitlement gates. A failed fetch shows recovery instead of exposing an embedded paid-bank fallback. Existing browser question caches are removed at startup; saved learning progress is retained. Study notes still refresh independently on return.

Practice delivery now issues an expiring signed receipt bound to the canonical bank, delivered IDs and verified learner identity. Submissions validate that receipt, recheck paid access and current question visibility, and obtain scoring, topic and course attribution from the server. Missing/mismatched/expired receipts do not write history. Ordinary practice cannot submit mock results; mocks retain their separate signed-session flow. Free previews remain available and anonymous answers are scored without unowned database rows. The free governed 309A bank retains its own active-beta visibility controls and supports the same receipts.

A verified current account takes precedence over a stale browser access token. Token-only practice uses the email verified by the signed token, with a live entitlement check for paid access. Failed saves now show an error; there is no automatic mutation retry.

## Release and verification

- No schema migration or question-bank import is required.
- Review alongside PR #89 (logout/account access). Neither PR replaces the other. Preserve both client startup changes if rebasing after that PR lands.
- Run the complete Quality Gate, including `practicePaging.integration.test.ts`, scoring tests and the Teams browser journey. The database tests use synthetic identities in the isolated CI database, not customer accounts.
- After the normal deployment, use a test account to open its purchased course, answer practice questions, and confirm canonical-course history. Test an unauthenticated preview and a failed question fetch. Verify the obsolete `echelon_qbank_` keys disappear without deleting learning progress.
- Previously open pages do not have receipts. Reload practice after deployment or after a receipt expires (two hours); the save error explicitly requests refreshing access.

## Limits and remaining audit work

These receipts establish authorized delivery and current paid access, not human engagement or single-use/anti-replay evidence. Deliberately repeated practice can still create separate attempts. An authorized learner can inspect the bounded questions and answers delivered to their browser. Same-tab mock recovery still stores the authorized active exam in session storage.

Removing seed files from the current build does not remove their copies from public Git history. Repository visibility/history cleanup requires a separate owner decision. No such change is included.

Checkout verification scope, durable schedule ownership/environment isolation and subscription-webhook recovery remain separate audit work. This release does not change production accounts, purchases, invitations or question publication.
