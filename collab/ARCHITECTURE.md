# Echelon AI Tutor — Architecture Reference

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind 4, Wouter (routing), tRPC client |
| Backend | Express 4, tRPC 11, Node.js (tsx watch in dev) |
| Database | MySQL / TiDB via Drizzle ORM |
| Auth | Manus OAuth (protectedProcedure) + OTP email sessions (dashboardAuth) |
| Payments | Stripe (subscriptions + one-time purchases), webhooks at /api/stripe/webhook |
| AI | Manus Forge LLM API (invokeLLM helper) |
| Email | Nodemailer + SMTP (ENV.smtpHost/User/Pass) |
| Storage | S3 via storagePut/storageGet helpers |

---

## Auth Model

Three identity paths coexist. Every server procedure must handle all three:

### 1. Manus OAuth (ctx.user)
- Completes at `/api/oauth/callback`, drops a session cookie.
- `protectedProcedure` injects `ctx.user` (id, email, name, role).
- Used for admin panel, org manager flows.

### 2. OTP Email Session (ctx.studentEmail)
- Student enters email -> receives 6-digit OTP -> cookie set by `dashboardAuth.verifyOtp`.
- Cookie name: `echelon_email_session`. Signed JWT, 30-day expiry.
- `ctx.studentEmail` is populated in `createContext` when the cookie is valid.
- Used for student dashboard, quiz access, AI tutor, flashcards.

### 3. Guest Token (signed access token)
- Short-lived JWT signed with JWT_SECRET, issued at purchase time.
- Used for one-time practice pass access without requiring login.
- Verified in `accessService.ts` via `verifyAccessTokenAndRecheckDb`.

### Identity Resolution Pattern
Most procedures use this pattern:
```ts
const userId = ctx.user?.id ?? null;
const studentEmail = ctx.studentEmail ?? null;
// Must have at least one
if (!userId && !studentEmail) throw new TRPCError({ code: "UNAUTHORIZED" });
// Query by union
.where(userId ? eq(table.userId, userId) : eq(table.studentEmail, studentEmail!))
```

For email-based entitlement checks, always use `resolveEntitlementsByEmail(email)` from `server/_core/access.ts`. This handles purchases, subscriptions, and org-managed seats.

---

## Access Control

`server/_core/accessService.ts` is the single source of truth for quiz access.

- `resolveAccessForRequest(ctx, productKey)` -- determines if the caller can access a product.
- `assertAccess(ctx, productKey)` -- throws FORBIDDEN if no access.
- Access sources: OAuth session, OTP session, signed DB-verified token.
- **No client-supplied email bypass** -- removed in P0 security fix (checkpoint 60613415).

---

## Database Schema (key tables)

| Table | Purpose |
|-------|---------|
| `users` | Manus OAuth users |
| `studentProfiles` | Per-student stats (streak, topicAccuracy, weakTopics, strongTopics). Keyed by userId OR studentEmail. |
| `questionAttempts` | Per-question attempt records. Keyed by userId OR studentEmail + examType. |
| `purchases` | One-time practice pass purchases. Keyed by email. |
| `subscriptions` | Recurring subscriptions. Keyed by email + tier + province. |
| `organizations` | Team/org accounts. managerEmail is the org admin. |
| `organizationMembers` | Org seat assignments. email + courseKey. |
| `examDates` | Student-set exam dates. email + productKey. |
| `triggerLogs` | Nudge email cooldown tracking. |
| `aiSessions` | AI tutor conversation history. |
| `bookmarks` | Per-user question bookmarks. |

---

## Question Banks

18,876 questions across 36 banks (as of July 2026):

- Ontario Treatment: Class 1-4 Water + Wastewater (8 banks)
- Ontario Distribution: Class 1-4 Water Distribution (4 banks)
- Ontario Collection: Class 1-4 Wastewater Collection (4 banks)
- OIT: Water + Wastewater (2 banks)
- WQA: Water Quality Analyst (1 bank)
- WPI: Class I-IV Water Treatment + Wastewater + Distribution + Collection (16 banks)

Questions are stored in the `questions` table with columns: bankKey, questionNum, text, options (JSON), correctIndex, explanation, module, isCalc, difficulty.

---

## Primary Study Focus

`server/_core/studyFocus.ts` exports `resolvePrimaryStudyFocus({ email, unlockedExamTypes })`.

Priority order:
1. Course with the nearest upcoming exam date (most urgent)
2. Course with the most recent study activity (from questionAttempts)
3. First unlocked course (fallback)
4. None (no entitlements)

Used by: dashboard readiness score, AI tutor context, trigger engine nudge emails.

---

## Scheduled Jobs

| Job | Schedule | File |
|-----|----------|------|
| Exam reminders | Daily 9 AM UTC | `server/jobs/examReminders.ts` |
| Trigger engine (nudge emails) | Daily 9 PM UTC | `server/jobs/triggerEngine.ts` |
| Welcome email | Hourly at :05 | `server/jobs/welcomeEmail.ts` |
| Stripe reconciliation | Daily 6 AM UTC | `server/jobs/reconcile.ts` |
| DB keep-alive | Every 5 min (Manus Heartbeat) | `/api/scheduled/db-keepalive` |

---

## Key File Locations

```
server/_core/
  index.ts          -- Express server entry, health endpoint, scheduled routes
  context.ts        -- tRPC context builder (populates ctx.user, ctx.studentEmail)
  accessService.ts  -- Quiz access control (resolveAccessForRequest, assertAccess)
  access.ts         -- Entitlement resolver (resolveEntitlementsByEmail)
  studyFocus.ts     -- Primary study focus resolver
  env.ts            -- Typed environment variable access

server/routers/
  quizRouter.ts         -- getQuestions, getRandomQuestions, submitAnswer, streak
  dashboardRouter.ts    -- readinessScore, lowConfidenceQuestions, studyFocus
  stripeRouter.ts       -- checkout, getMySubscriptions, getMySubscriptionsForEmailSession
  dashboardAuthRouter.ts -- sendOtp, verifyOtp (OTP email session management)
  magicLinkRouter.ts    -- Magic link generation and consumption

client/src/
  App.tsx               -- Route definitions (37 quiz routes + admin/account routes)
  pages/Account.tsx     -- Unified login page (OAuth + OTP)
  pages/Pricing.tsx     -- Subscription cards + checkout
  components/MockExamShell.tsx -- Mock exam engine
  components/AITutor.tsx       -- AI tutor chat
  hooks/useQuestionBank.ts     -- Quiz question fetching hook
```
