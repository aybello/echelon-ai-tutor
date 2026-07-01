# Echelon AI Tutor — Known Issues

This file documents known limitations, deferred fixes, and technical debt.
Each entry includes severity, impact, and recommended resolution approach.

---

## KI-001: OAuth + OTP Split Profiles (Fixed)

**Status:** Fixed — migration script written and tested

**Description:**
When a student first uses OTP email login and later signs up via Manus OAuth with the same email address, their `studentProfiles` and `questionAttempts` records are stored under two separate keys:
- OTP path: keyed by `studentEmail`
- OAuth path: keyed by `userId`

This means their study history, streak, and readiness score appear to reset after switching auth methods.

**Fix applied:**
Migration script written at `scripts/migrate-merge-split-profiles.mjs`.

The script:
1. Finds all users where both an OAuth profile (userId) and an OTP profile (studentEmail) exist for the same email.
2. Merges topicAccuracy (sums correct + total per topic), recomputes weak/strong topics.
3. Takes max(currentStreak), max(longestStreak), sum(totalAttempts), sum(totalSessions), and the most recent lastActiveDate.
4. Writes merged data into the OAuth profile row, deletes the OTP profile row.
5. Re-keys all questionAttempts rows from studentEmail to userId for that email.
6. Runs each user merge inside a transaction — all-or-nothing, idempotent.

**Usage:**
```bash
node scripts/migrate-merge-split-profiles.mjs           # dry run (default)
node scripts/migrate-merge-split-profiles.mjs --execute # apply changes
```

Dry run confirmed working against production DB (0 split profiles currently — no existing affected users).

---

## KI-002: Streak DST Boundary (Fixed)

**Status:** Fixed

**Description:**
Streak calculation in `quizRouter.ts` (`upsertStudentProfile`) previously computed "yesterday" by subtracting exactly `24 * 60 * 60 * 1000` milliseconds from `Date.now()` and then formatting with `Intl.DateTimeFormat`. During DST transitions (spring forward / fall back), the day is 23 or 25 hours long, so subtracting 24h could land on the wrong calendar date.

**Fix applied:**
Now computes yesterday by parsing today's Toronto date string (`YYYY-MM-DD`) into a local `Date` object and calling `setDate(getDate() - 1)`. This subtracts exactly one calendar day regardless of DST. The resulting date parts are re-formatted as `YYYY-MM-DD` without any timezone conversion. File: `server/routers/quizRouter.ts`, `upsertStudentProfile()`.

---

## KI-003: Mock Exam Score Rounding (Fixed in checkpoint after 60613415)

**Status:** Fixed

**Description:**
`MockExamShell.tsx` previously used `pct >= Math.round(passThreshold * 100)` to determine pass/fail. Because `pct = Math.round(score * 100)`, a score of exactly 69.5% would round to 70% and incorrectly pass a 70% threshold.

**Fix applied:**
Changed to `score >= passThreshold` (raw float comparison) in `MockExamShell.tsx`.

---

## KI-004: Stale examType in Trigger Engine (Fixed in checkpoint after 60613415)

**Status:** Fixed

**Description:**
`triggerEngine.ts` previously used `profileRow.examType` from `studentProfiles` to determine which exam a student was studying for. This field is only updated when a student submits an answer, and can become stale if the student switches courses (e.g., upgrades from Class 1 to Class 2).

**Fix applied:**
Trigger engine now calls `resolveEntitlementsByEmail` + `resolvePrimaryStudyFocus` to determine the student's current course before building email context.

---

## KI-005: Health Endpoint Exposed Config Details (Fixed in checkpoint after 60613415)

**Status:** Fixed

**Description:**
`/api/health` publicly exposed whether Stripe, SMTP, AI, and cron secret were configured. This information could be used to fingerprint the infrastructure.

**Fix applied:**
Public callers now receive only `{ status: "ok" | "degraded", ts: "..." }`. Full `checks` breakdown is only returned when the caller provides the correct `X-Health-Secret` header matching `ENV.cronSecret`.

---

## KI-006: Plaintext Email Logging (Fixed in checkpoint after 60613415)

**Status:** Fixed

**Description:**
15+ `console.log` statements across `server/email.ts`, `server/jobs/`, `server/routers/`, and `server/stripe/webhook.ts` wrote full customer email addresses to server logs in plaintext.

**Fix applied:**
All affected log lines now use `email.replace(/(^.{3}).+@/, '$1***@')` to redact the local part beyond the first 3 characters. Example: `abc@example.com` becomes `abc***@example.com`.

---

## KI-007: Login Page Dead Code (Low)

**Status:** Deferred -- harmless

**Description:**
`client/src/App.tsx` still contains lazy imports for `Login` and `ManagerLogin` components (lines 40, 49). The routes `/login` and `/team/login` now redirect to `/account` before rendering, so these imports are dead code. They do not affect bundle size because lazy imports are only loaded when the route is actually rendered.

**Fix approach:**
Remove the two lazy import lines from App.tsx and delete `client/src/pages/Login.tsx` and `client/src/pages/ManagerLogin.tsx` if they are no longer needed elsewhere.

---

## KI-008: WPI "EOCP (BC)" Label (Intentional)

**Status:** By design -- do not change

**Description:**
WPI (Western Canada) pages use "EOCP (BC)" as the certification body label. Ontario-facing pages use "MOECP / OWWCO". This is intentional -- EOCP is the correct body for BC/WPI operators.

**Do not change** WPI pages to use MOECP/OWWCO.
