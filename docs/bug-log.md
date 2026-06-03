# Echelon Institute — Bug Log

A running record of every production bug, its root cause, customer impact, fix applied, and what should have caught it earlier. Updated after every incident.

---

## BUG-001 — Trial Questions Only Showing Disinfection Module

**Date:** June 3, 2026  
**Severity:** High — affected all trial users and newly-purchased users  
**Reported by:** Trista Huggett (paying customer)

**Symptom:** The practice quiz, flashcards, and mock exam only showed questions from the Disinfection module. Switching modules did nothing.

**Root Cause:** Two compounding issues:
1. The server's trial slice used `rows.slice(0, 15)` ordered by `questionNum`. The first 15 questions in the DB are all Disinfection. Trial users only ever saw Disinfection.
2. After a user trialed (15 Disinfection questions cached in localStorage), then purchased, the stale cache was never invalidated. The module selector filtered against the 15-question cache, returning 0 results for any non-Disinfection module.

**Customer Impact:** Trista Huggett paid $49 CAD and could not access any module except Disinfection. She emailed to report the issue.

**Fix Applied:**
- Server: Changed trial slice to round-robin module sampling (1 question per module, cycling until 15 reached)
- Frontend: `useQuestionBank` now always replaces the cache with live server data when it arrives, regardless of size comparison

**What Should Have Caught It:**
- Testing the "returning user" path: trial first → purchase → return to quiz on same browser
- Querying the DB to verify what `LIMIT 15 ORDER BY questionNum` actually returns before shipping

---

## BUG-002 — Correct Answers Displayed as Wrong

**Date:** June 3, 2026  
**Severity:** High — affected all users with a stale localStorage cache  
**Reported by:** Trista Huggett (paying customer)

**Symptom:** After selecting the correct answer and confirming, the quiz showed the answer as wrong (red highlight, "✗ Incorrect").

**Root Cause:** The localStorage cache intentionally strips `correctIndex` (set to `-1`) as a security measure to prevent cheating. When `useQuestionBank` returned cached questions, `useQuizSession` evaluated answers using `correctIndex: -1`. No answer option has index `-1`, so every answer appeared wrong.

**Customer Impact:** Trista flagged ~30 questions as having wrong answers. All were correct — the display was broken.

**Fix Applied:** `useQuestionBank` now fires a background server fetch even on cache hits and merges the real `correctIndex` values into the displayed questions before the user can confirm an answer.

**What Should Have Caught It:**
- Testing with a pre-existing localStorage cache (not a fresh browser)
- A unit test asserting that `correctIndex` is never `-1` when questions are returned to the quiz component

---

## BUG-003 — Restore Access Returns "No Purchases Found" for Unauthenticated Users

**Date:** June 3, 2026  
**Severity:** Medium — blocked paying customers from restoring access on new devices  
**Reported by:** Trista Huggett (paying customer)

**Symptom:** On the Account/Restore Access page, entering a purchase email returned "no purchases associated with this email" even for valid customers.

**Root Cause:** The restore access flow called `getMyPurchases` — a protected procedure requiring login. Unauthenticated users always received an empty result. There was no public email-based lookup endpoint.

**Customer Impact:** Trista could not restore access on her laptop without logging in.

**Fix Applied:** Added a new public `getPurchasesByEmail` procedure. The Account page now uses this endpoint for unauthenticated users, returning product keys and unlocked exam types by email match.

**What Should Have Caught It:**
- Testing the restore flow while logged out
- User journey test covering the "new device, no localStorage, not logged in" scenario

---

## BUG-004 — Feedback Modal Appearing After Every Question

**Date:** June 3, 2026  
**Severity:** Medium — disrupted quiz flow for users with stale caches  
**Reported by:** Internal (observed during debugging)

**Symptom:** The "Session Complete" feedback modal appeared after answering just 1-2 questions, not after the expected 15.

**Root Cause:** When a user selected a non-Disinfection module, the question pool filtered to 0 results (stale cache only had Disinfection). `getAdaptiveNext` returned `null`, setting `current` to `null`. The QuizShell condition `!current && history.length > 0` triggered the session-complete screen immediately.

**Customer Impact:** Quiz appeared to end after 1-2 questions when switching modules.

**Fix Applied:** Added a minimum threshold of 5 answered questions before the feedback modal can appear. Root cause (stale cache) also fixed in BUG-001/002.

**What Should Have Caught It:**
- Testing module switching with an empty question pool for the selected module

---

## BUG-005 — Subscription Webhook Silently Dropping New Subscribers

**Date:** June 3, 2026  
**Severity:** Critical — paying subscribers received no access  
**Reported by:** Owner (noticed subscription in Stripe with no DB record)  
**Affected Customer:** Matthew Cooper (matt.cooop@gmail.com) — $99 CAD, Class 1 All-Access Ontario

**Symptom:** A customer subscribed and paid $99 CAD. Their subscription showed as active in Stripe but they had no access on the site.

**Root Cause:** The `createSubscriptionCheckout` procedure set `tier` and `province` in the checkout session's `metadata` field. However, Stripe's `customer.subscription.created` webhook fires with the **subscription object**, not the checkout session. The subscription object only inherits metadata from `subscription_data.metadata` — a separate field that was never set. The webhook handler checked for `tier`/`province` on the subscription object, found nothing, logged a warning, and returned without writing to the DB.

**Customer Impact:** Matthew Cooper paid $99 CAD and had no access. Manually recovered by direct DB insert.

**Fix Applied:** Added `subscription_data: { metadata: { subscription_tier, subscription_province } }` to the `stripe.checkout.sessions.create()` call. Future subscribers will have their metadata correctly attached to the subscription object.

**Manual Recovery:** Subscription row manually inserted for Matthew Cooper with `tier: all-access`, `province: ontario`, expires June 3, 2027.

**What Should Have Caught It:**
- Reading Stripe docs specifically for `subscription_data.metadata` vs session `metadata`
- An integration test that creates a real test-mode checkout session and verifies the resulting subscription object has the correct metadata fields
- End-to-end test in Stripe test mode before going live

---

## Prevention Checklist (Added After These Incidents)

Going forward, before any feature involving payments, access control, or localStorage is shipped:

- [ ] Test the "returning user with stale cache" path (not just fresh browser)
- [ ] Test the "new device, not logged in, no localStorage" path
- [ ] Verify DB writes by querying the DB after every Stripe event (not just checking Stripe dashboard)
- [ ] For Stripe integrations: verify metadata is on the correct object (session vs subscription vs customer)
- [ ] Run the full user journey checklist (now automated in `scripts/journey-checks.py`)
- [ ] Test with real Stripe test-mode events (not just mocked webhook payloads)
