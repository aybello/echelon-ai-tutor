# Echelon AI Tutor — Architecture Reference

> **Read this file before building any feature.**
> Update it whenever you add something reusable.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Tailwind CSS 4, Wouter (routing), tRPC client, shadcn/ui |
| Backend | Express 4, tRPC 11, Drizzle ORM, MySQL (TiDB) |
| Auth | Manus OAuth (owner/admin) + custom OTP email login (students) |
| Payments | Stripe (one-time purchases + subscriptions) |
| Email | Nodemailer via SMTP (`server/email.ts`) |
| Storage | S3 via `server/storage.ts` |
| AI | `server/_core/llm.ts` → `invokeLLM()` |
| Jobs | Nightly trigger engine + exam reminders (`server/jobs/`) |

---

## File Structure

```
client/src/
  App.tsx                  ← All routes (wouter Switch/Route, lazy imports)
  index.css                ← Design tokens (CSS variables, Tailwind theme)
  main.tsx                 ← tRPC + QueryClient providers
  const.ts                 ← getLoginUrl(), Manus OAuth helpers
  _core/hooks/useAuth.ts   ← useAuth() — Manus OAuth state only
  pages/                   ← Page-level components (see Routes section)
  components/              ← Reusable components (see Components section)
  lib/trpc.ts              ← tRPC client binding

server/
  routers.ts               ← appRouter — assembles all sub-routers
  routers/
    admin.ts               ← Admin-only procedures
    dashboardAuthRouter.ts ← OTP login/logout/me for students
    dashboardRouter.ts     ← Student dashboard data (progress, stats)
    flashcardRouter.ts     ← Flashcard progress
    magicLinkRouter.ts     ← Magic link generation and consumption
    quizRouter.ts          ← Question attempt logging, QOTD, AI tutor
    stripeRouter.ts        ← Purchases, subscriptions, Stripe portal
  stripe/
    products.ts            ← One-time product → Stripe price ID mapping
    subscriptionProducts.ts← Subscription product → Stripe price ID mapping
    stripe.ts              ← Stripe client singleton
    webhook.ts             ← Stripe webhook handler (purchase/sub events)
  jobs/
    triggerEngine.ts       ← Nightly personalized email engine (5 triggers)
    examReminders.ts       ← Daily exam countdown reminders (30/14/7/1 day)
    reconcile.ts           ← Stripe reconciliation job
    retry.ts               ← withRetry() helper
  email.ts                 ← ALL email functions (purchase confirm, welcome, re-engagement)
  db.ts                    ← Drizzle query helpers
  resourceIndex.ts         ← Study resource index for AI tutor context
  rateLimit.ts             ← Express rate limiter middleware
  index.ts                 ← Server entry (registers all routers + jobs)
  _core/
    index.ts               ← Express app bootstrap (middleware, routes)
    llm.ts                 ← invokeLLM() — server-side only
    env.ts                 ← All ENV vars (single source of truth)
    cookies.ts             ← Cookie option helpers
    context.ts             ← tRPC context (req, res, user)
    trpc.ts                ← publicProcedure, protectedProcedure, router
    notification.ts        ← notifyOwner()
    oauth.ts               ← Manus OAuth helpers
    systemRouter.ts        ← system.notifyOwner procedure

shared/
  products.ts              ← SINGLE SOURCE OF TRUTH for all products/exam types
  types.ts                 ← Re-exports all Drizzle schema types
  const.ts                 ← COOKIE_NAME, UNAUTHED_ERR_MSG, ONE_YEAR_MS
  _core/errors.ts          ← Shared error types

drizzle/
  schema.ts                ← All database tables (see Database section)
```

---

## Design System

**Philosophy:** Professional SaaS — Clean Dark-Accent. Slate background, white cards, blue primary, teal secondary.

**Fonts:** `Sora` (body/display) + `Nunito` (score numbers) — loaded via Google Fonts CDN in `client/index.html`.

**Color tokens** (defined in `client/src/index.css` `:root`):

| Token | Value | Use |
|---|---|---|
| `--background` | `oklch(0.96 0.005 240)` | Page background (slate-100) |
| `--foreground` | `oklch(0.1 0.015 250)` | Body text |
| `--card` | `oklch(1 0 0)` | White card background |
| `--primary` | `oklch(0.45 0.22 260)` | Blue — buttons, links, active states |
| `--primary-foreground` | `oklch(0.98 0 0)` | White text on primary |
| `--secondary` | `oklch(0.94 0.008 240)` | Subtle bg |
| `--muted-foreground` | `oklch(0.55 0.015 250)` | Secondary text |
| `--border` | `oklch(0.9 0.008 240)` | Borders |
| `--destructive` | `oklch(0.577 0.245 27.325)` | Red — errors/delete |
| `--echelon-blue` | `oklch(0.45 0.22 260)` | Brand blue |
| `--echelon-teal` | `oklch(0.42 0.14 185)` | Brand teal |

**Radius:** `--radius: 0.75rem` (base). Variants: `sm`, `md`, `lg`, `xl`.

**Rule:** Never add new color values. Use existing tokens. No new fonts.

---

## Key Shared Components

Before building anything new, check these first:

| Component | Path | Use for |
|---|---|---|
| `SiteNav` | `components/SiteNav.tsx` | Top navigation bar — used on all public pages |
| `MobileBottomNav` | `components/MobileBottomNav.tsx` | Mobile nav — used on all public pages |
| `DashboardLayout` | `components/DashboardLayout.tsx` | Admin/dashboard sidebar layout |
| `QuizShell` | `components/QuizShell.tsx` | Full quiz UI — wraps all quiz pages |
| `MockExamShell` | `components/MockExamShell.tsx` | Full mock exam UI — wraps all mock exam pages |
| `FlashcardShell` | `components/FlashcardShell.tsx` | Full flashcard UI — wraps all flashcard pages |
| `QuizModeBar` | `components/QuizModeBar.tsx` | Quiz controls bar + `useAttemptLogger` hook |
| `QuizSettingsDrawer` | `components/QuizSettingsDrawer.tsx` | Settings panel (difficulty, module, calc-only) |
| `PurchaseGate` | `components/PurchaseGate.tsx` | Access control wrapper for paid content |
| `QuizGate` | `components/QuizGate.tsx` | Trial limit gate (15 free questions) |
| `ExamDateTracker` | `components/ExamDateTracker.tsx` | Per-course exam date countdown + save |
| `AITutor` | `components/AITutor.tsx` | In-quiz AI tutor drawer |
| `AIChatBox` | `components/AIChatBox.tsx` | Full chat interface with streaming |
| `ConfidenceMeter` | `components/ConfidenceMeter.tsx` | Confidence rating UI |
| `ReadinessScore` | `components/ReadinessScore.tsx` | Readiness percentage display |
| `ScoreHistory` | `components/ScoreHistory.tsx` | Historical score chart |
| `FeedbackModal` | `components/FeedbackModal.tsx` | User feedback collection |
| `ReportErrorModal` | `components/ReportErrorModal.tsx` | Question error reporting |
| `ModuleOverview` | `components/ModuleOverview.tsx` | Module study notes display |
| `ProcessMap` | `components/ProcessMap.tsx` | Water treatment process diagram |
| `WastewaterMap` | `components/WastewaterMap.tsx` | Wastewater process diagram |
| `DistributionMap` | `components/DistributionMap.tsx` | Distribution system diagram |
| `CollectionMap` | `components/CollectionMap.tsx` | Collection system diagram |
| `PumpCurveChart` | `components/PumpCurveChart.tsx` | Pump curve visualization |
| `ErrorBoundary` | `components/ErrorBoundary.tsx` | React error boundary |
| `ProvinceBanner` | `components/ProvinceBanner.tsx` | Province selection banner |
| `CheckoutContactModal` | `components/CheckoutContactModal.tsx` | Pre-checkout contact capture |

**shadcn/ui primitives** live in `components/ui/` — use `Button`, `Input`, `Card`, `Dialog`, `Drawer`, `Badge`, `Select`, etc. from there.

---

## Hooks

| Hook | Path | Use for |
|---|---|---|
| `useAuth()` | `_core/hooks/useAuth.ts` | Manus OAuth state (`user`, `isAuthenticated`, `logout`) |
| `useAttemptLogger` | inside `QuizModeBar.tsx` | Logs question attempts to DB |
| `useQuizSession` | `hooks/useQuizSession.ts` | Full quiz session state machine |

---

## Server Routers

All procedures are accessed via `trpc.<router>.<procedure>`.

| Router | Prefix | Key procedures |
|---|---|---|
| `system` | `trpc.system.*` | `notifyOwner` |
| `admin` | `trpc.admin.*` | Admin CRUD, user management |
| `stripe` | `trpc.stripe.*` | `createCheckoutSession`, `getMyPurchases`, `getPurchasesByEmail`, `getSubscriptionsByEmail`, `createPortalSession` |
| `flashcard` | `trpc.flashcard.*` | Progress tracking |
| `quiz` | `trpc.quiz.*` | `logAttempt`, `getQOTD`, `chat` (AI tutor), `getStudentProfile` |
| `dashboard` | `trpc.dashboard.*` | Student stats, score history, exam countdown |
| `magicLink` | `trpc.magicLink.*` | `sendMagicLink`, `consumeMagicLink` |
| `dashboardAuth` | `trpc.dashboardAuth.*` | `sendOtp`, `verifyOtp`, `me`, `logout` |

---

## Authentication — Two Separate Systems

### 1. Manus OAuth (owner/admin only)
- Handled by `server/_core/oauth.ts`
- Frontend: `useAuth()` from `_core/hooks/useAuth.ts`
- `protectedProcedure` in `server/_core/trpc.ts` requires this
- Login URL: `getLoginUrl()` from `client/src/const.ts`

### 2. OTP Email Login (students)
- Handled by `dashboardAuthRouter.ts`
- Cookie: `echelon_dashboard_session` (httpOnly, secure in prod)
- Requires `cookie-parser` middleware (registered in `server/_core/index.ts`)
- Frontend reads session via `trpc.dashboardAuth.me.useQuery()`
- Post-login redirect: `/account`
- Logout clears cookie + all `echelon_*` localStorage keys → redirect to `/`

---

## localStorage Keys

All keys are prefixed `echelon_`. Never create new keys without documenting here.

| Key | Set by | Purpose |
|---|---|---|
| `echelon_subscription_email` | OTP login, Account restore, Purchase success | Student's email — used for attempt tracking and Account page auto-populate |
| `echelon_trial_email` | OTP login, Account restore | Alias for subscription email |
| `echelon_trial_unlocked` | OTP login, Account restore | `"true"` if student has any access |
| `echelon_access_token` | OTP login, Account restore | JWT access token |
| `echelon_purchased_products` | OTP login, Account restore, Purchase success | JSON array of purchased product keys |
| `echelon_subscription_exam_types` | OTP login, Account restore | JSON array of exam types unlocked by subscription |
| `echelon_province` | ProvinceBanner | Selected province |
| `echelon_subscription_province` | Account restore | Province from subscription |
| `echelon_subscription_tier` | Account restore | Subscription tier |
| `echelon_qbank_v2_oit` | QuizModeBar | Cached OIT question bank |
| `echelon_session_count` | QuizModeBar | Session count for prompts |

---

## Database Tables

All in MySQL (TiDB). Schema in `drizzle/schema.ts`.

| Table | Purpose |
|---|---|
| `users` | Manus OAuth users (admin/owner only) |
| `purchases` | One-time Stripe purchases (email, productKey, stripeId) |
| `subscriptions` | Stripe subscriptions (email, planKey, status) |
| `question_attempts` | Every quiz answer (studentEmail, questionId, correct, confidence) |
| `exam_results` | Mock exam scores |
| `exam_dates` | Student exam dates + reminder tracking |
| `flashcard_progress` | Per-card mastery state |
| `student_profiles` | AI tutor memory per student |
| `ai_chat_sessions` | AI tutor conversation history |
| `dashboard_otps` | OTP codes for student login |
| `magic_links` | One-time email sign-in tokens |
| `waitlist` | Waitlist signups |
| `trial_emails` | Free trial email captures |
| `contact_submissions` | Contact form submissions |
| `question_error_reports` | Student-reported question errors |
| `user_feedback` | General feedback |
| `questions` | Question bank (DB-stored questions) |
| `question_bank_meta` | Metadata per question bank |
| `module_overviews` | Module study notes content |
| `qotd_completions` | Question-of-the-day completions |
| `trigger_logs` | Nightly email trigger history (cooldown tracking) |

---

## Product Catalog

**Single source of truth:** `shared/products.ts`

Both the server (Stripe) and client (Pricing page) import from here. Never duplicate product data.

Key exports:
- `INDIVIDUAL_PRODUCTS` — one-time practice passes
- `SUBSCRIPTION_PRODUCTS` — annual all-access plans
- `PRODUCT_STUDY_PATHS` — maps productKey → `{ quizPath, mockPath }`
- `getAllExamTypes()` — all exam type strings
- `getAllSubscriptionExamTypes()` — exam types unlocked by subscriptions

---

## Routes

Public pages use `SiteNav` + `MobileBottomNav`. No sidebar.

| Path | Component | Auth |
|---|---|---|
| `/` | `Landing.tsx` | Public |
| `/pricing` | `Pricing.tsx` | Public |
| `/about` | `About.tsx` | Public |
| `/account` | `Account.tsx` | Public (shows courses if localStorage email set) |
| `/login` | `Login.tsx` | Public |
| `/auth/magic` | `MagicLinkConsume.tsx` | Public |
| `/dashboard` | `StudentDashboard.tsx` | OTP session required |
| `/admin` | `Admin.tsx` | Manus OAuth required |
| `/process` | `Process.tsx` | Public |
| `/wastewater` | `Wastewater.tsx` | Public |
| `/distribution-guide` | `WaterDistribution.tsx` | Public |
| `/collection-guide` | `WastewaterCollection.tsx` | Public |
| `/pumping` | `PumpingSystems.tsx` | Public |
| `/process-control` | `ProcessControl.tsx` | Public |
| `/chem-calc` | `ChemCalc.tsx` | Public |
| `/formulas` | `Formulas.tsx` | Public |
| `/career-map` | `CareerMap.tsx` | Public |
| `/oit` | OIT quiz | PurchaseGate (key: `oit`) |
| `/oit-mock` | OIT mock exam | PurchaseGate |
| `/oit-ww` | OIT Wastewater quiz | PurchaseGate (key: `oit-ww`) |
| `/class1-water` | Class 1 Water quiz | PurchaseGate |
| `/wpi/*` | WPI class quizzes | PurchaseGate |
| `/*-flashcards` | Flashcard pages | PurchaseGate |

---

## Email System

All email functions live in `server/email.ts`. Use existing functions. Never create a parallel email transport.

| Function | Trigger |
|---|---|
| `sendPurchaseConfirmationEmail` | Stripe `checkout.session.completed` webhook |
| `sendWelcomeOnboardingEmail` | 24h after purchase (Stripe webhook, delayed) |
| `sendReEngagementEmail` | One-time blast via `scripts/send-reengagement.mjs` |
| `sendMagicLinkEmail` | `magicLinkRouter.sendMagicLink` |
| `sendOtpEmail` | `dashboardAuthRouter.sendOtp` |
| `sendContactEmail` | Contact form submission |
| `sendExamReminderEmail` | `jobs/examReminders.ts` (daily job) |
| Trigger engine emails | `jobs/triggerEngine.ts` (nightly job, LLM-generated) |

SMTP config comes from `ENV.SMTP_*` (injected by platform).

---

## Background Jobs

Registered in `server/jobs/triggerEngine.ts` via `TriggerEngine.start()`, called from `server/_core/index.ts`.

| Job | Schedule | File |
|---|---|---|
| Trigger engine (personalized emails) | Nightly 9 PM UTC | `jobs/triggerEngine.ts` |
| Exam reminders | Daily 8 AM UTC | `jobs/examReminders.ts` |
| Stripe reconciliation | On-demand | `jobs/reconcile.ts` |

---

## Access Control Pattern

Student access is determined by `localStorage` keys set during purchase or OTP login:

```ts
// Check if a student has access to a specific exam type
const hasAccess = (examType: string): boolean => {
  const purchased = JSON.parse(localStorage.getItem("echelon_purchased_products") ?? "[]");
  const subTypes = JSON.parse(localStorage.getItem("echelon_subscription_exam_types") ?? "[]");
  return purchased.includes(examType) || subTypes.includes(examType);
};
```

`PurchaseGate` component wraps all paid content and handles the gate UI.

---

## Conventions

- **tRPC only** — never use `fetch`/Axios for API calls. All backend calls go through `trpc.*`.
- **Shared types** — import from `@shared/types` or `@shared/products`. Never redefine.
- **DB helpers** — add query functions to `server/db.ts`, not inline in routers.
- **Router size** — keep routers under ~150 lines. Split into `server/routers/<feature>.ts`.
- **Email** — add new email functions to `server/email.ts`. Never create a second transport.
- **Products** — add new products to `shared/products.ts` only. Never hardcode product keys.
- **Design** — use existing CSS tokens. No new colors, no new fonts.
- **Navigation** — new pages must be added to `App.tsx` (lazy import + Route) and linked from `SiteNav` or `MobileBottomNav` as appropriate.
- **Tests** — add vitest tests in `server/*.test.ts`. Run `pnpm test` before every checkpoint.
- **TypeScript** — run `npx tsc --noEmit` before every checkpoint. Zero errors required.

---

## Echelon for Teams

### Overview
Echelon for Teams allows utility managers to purchase bulk seat subscriptions and assign access to their operators. Managers log in via OTP (same flow as students) and access the `/team` dashboard.

### Database Tables

**`organizations`** — one row per org account.

| Column | Type | Notes |
|---|---|---|
| id | int PK | auto-increment |
| name | varchar(255) | org display name |
| province | varchar(32) | 'ontario' \| 'western' |
| tier | varchar(32) | always 'all-access' for now |
| seatsTotal | int | total purchased seats |
| managerEmail | varchar(320) | primary manager email |
| stripeSubscriptionId | varchar(128) | null for invoice orgs |
| stripeCustomerId | varchar(128) | null for invoice orgs |
| termEnd | timestamp | subscription expiry |
| billingType | varchar(32) | 'stripe' \| 'invoice' |
| status | varchar(32) | 'active' \| 'cancelled' |

**`organization_members`** — one row per org-operator assignment.

| Column | Type | Notes |
|---|---|---|
| id | int PK | auto-increment |
| orgId | int FK | references organizations.id |
| email | varchar(320) | operator email |
| role | varchar(32) | 'manager' \| 'operator' |
| status | varchar(32) | 'assigned' \| 'revoked' |
| assignedAt | timestamp | when seat was granted |
| revokedAt | timestamp | null until revoked |

**`subscriptions.orgId`** — nullable int FK linking a subscription row to an org. Org-managed rows use a sentinel `stripeSubscriptionId` of the form `org-{orgId}-{email}` (since the DB column is NOT NULL + UNIQUE).

### Server Routers

**`server/routers/orgRouter.ts`** — all org management procedures.
- `requireOrgManager` — middleware that resolves orgId from the manager's session email
- `getOrgOverview` — 4 metric cards (seatsTotal, seatsAssigned, avgAccuracy, atRiskCount)
- `listMembers` — full roster with accuracy, last active, exam date, operatorStatus
- `getAttention` — at-risk operators (exam within 30 days, accuracy < 70%)
- `assignSeat` — grant single operator access (enforces seat cap)
- `assignSeats` — bulk assign (enforces seat cap atomically)
- `revokeSeat` — expire subscription + mark member revoked
- `createOrganizationManual` — admin procedure for invoice-path org creation

**`server/routers/stripeRouter.ts`** additions:
- `createTeamCheckout` — Stripe Checkout session for org seat purchase
- `updateTeamSeats` — update Stripe subscription quantity (proration)
- `createBillingPortalSession` — Stripe billing portal for org managers

### Webhook Handling (`server/stripe/webhook.ts`)
- `customer.subscription.created` with `metadata.type === "org"` → creates org row + grants manager seat
- `customer.subscription.updated` with `metadata.type === "org"` → syncs seatsTotal + extends termEnd on all managed operator rows
- `customer.subscription.deleted` with `metadata.type === "org"` → sets org status=cancelled, expires all managed subscriptions, revokes all members

### Client Pages
- `/teams` (`Teams.tsx`) — public buy page with seat selector and volume pricing
- `/team/login` (`ManagerLogin.tsx`) — OTP login for managers (same flow as students)
- `/team` (`OrgDashboard.tsx`) — manager dashboard with overview cards, attention panel, member roster, assign/revoke modals, Manage Seats modal, Manage Billing button

### grantSeat Helper
`grantSeat(db, org, email, role)` in `orgRouter.ts` is the single source of truth for granting access. It:
1. Upserts the `organization_members` row (insert or re-activate if revoked)
2. Upserts the `subscriptions` row (insert with sentinel stripeSubscriptionId `org-{orgId}-{email}`, or re-activate if expired)
3. Sends enrollment email to new/re-activated operators (fire-and-forget)

### Key Invariants
- Seat cap is enforced in `assignSeat` and `assignSeats` by counting `status='assigned'` members
- Cross-org isolation is enforced by `requireOrgManager` which resolves orgId from the session email
- Org-managed subscriptions are excluded from self-serve billing portal (identified by `orgId IS NOT NULL`)
- `stripeSubscriptionId` is NOT NULL in the live DB; use sentinel `org-{orgId}-{email}` for org-managed rows
