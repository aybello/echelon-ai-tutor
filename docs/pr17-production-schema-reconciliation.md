# PR #17 Production Schema Reconciliation

**Scope.** This document records a read-only comparison of the sanitized production metadata contract against `drizzle/schema.ts`. It contains no customer records, emails, names, payments, or application data. The comparison was completed without production schema writes, baseline adoption, migration replay, or `db:push`.

**Decision rule.** A discrepancy is blocking only when the repository model and the live production contract are incompatible and there is no declared, checksum-validated forward-only migration to account for the difference. Missing indexes that are explicitly created by an unapplied, additive migration remain visible as non-blocking warnings until approval and application.

## Blocking findings found before reconciliation

| # | Finding | Actual production metadata | Original repository expectation | Product/code evidence | Classification | Exact correction | Production write required now? | Ay approval required? |
|---:|---|---|---|---|---|---|---|---|
| 1 | `stripe_event_log_status_idx` absent | No index on `stripe_event_log(status)` | Source declares `stripe_event_log_status_idx(status)` | `stripe_event_log` is the webhook event ledger; status is used for operational event-state handling | Required additive migration | Add proposed `0054_add_stripe_event_log_status_idx.sql`; retain the source index declaration | No | Yes, before applying 0054 |
| 2 | `subscriptions.currentPeriodStart` nullability drift | `timestamp NOT NULL` | Nullable timestamp | Stripe webhook and reconciliation writes call `getSubscriptionPeriod()` | Incorrect `schema.ts` and incomplete write guards | Model as `.notNull()` and skip/alert before insert when period start is unavailable | No | No |
| 3 | `subscriptions.province` type drift | `enum('ontario','western') NOT NULL` | `varchar(32) NOT NULL` | `SubscriptionProvince` permits only `ontario` and `western` | Incorrect `schema.ts` | Model with `mysqlEnum`; validate incoming Stripe metadata | No | No |
| 4 | `subscriptions.status` type drift | `enum('active','cancelled','past_due','unpaid','expired') NOT NULL DEFAULT 'active'` | `varchar(32) NOT NULL DEFAULT 'active'` | Subscription lifecycle code emits active, past_due, cancelled; the production contract also preserves unpaid and expired | Incorrect `schema.ts` | Model the exact five-value enum | No | No |
| 5 | `subscriptions.stripeSubscriptionId` nullability drift | `varchar(128) NOT NULL UNIQUE` | Nullable unique varchar; comment said org rows use null | Org assignment code writes deterministic `org-{orgId}-{email}-{courseKey}` IDs | Incorrect `schema.ts` and stale comment | Make the column `.notNull().unique()` and document synthetic IDs for org-managed rows | No | No |
| 6 | `subscriptions.tier` type drift | `enum('class1','class2','class3','class4','all-access') NOT NULL` | `varchar(32) NOT NULL` | Product catalog and strict course mapping emit only the five enum values | Incorrect `schema.ts` | Model with `mysqlEnum`; fail closed on invalid metadata or course mappings | No | No |
| 7 | `team_flex_orders_org_status_idx` absent | No index on `team_flex_orders(organizationId,status)` | Source declares `team_flex_orders_org_status_idx(organizationId,status)` | Teams Flex order fulfillment uses organization and status state transitions | Required additive migration | Add proposed `0055_add_team_flex_orders_org_status_idx.sql`; retain the source index declaration | No | Yes, before applying 0055 |

## Production extras found before reconciliation

| # | Finding | Actual production metadata | Original repository expectation | Product/code evidence | Classification | Exact correction | Production write required now? | Ay approval required? |
|---:|---|---|---|---|---|---|---|---|
| 8 | `organizations.stream` | Nullable `varchar(32)` | Not modeled | Legacy stream-tier rollout retained this column for compatibility | Intentional production state omitted from source | Add nullable `stream` to `organizations` | No | No |
| 9 | `subscriptions.updatedAt` | `timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Not modeled | Other mutable tables use the same Drizzle timestamp convention | Intentional production state omitted from source | Add `.defaultNow().onUpdateNow().notNull()` | No | No |
| 10 | `exam_dates_org_member_idx` | `(orgId, organizationMemberId, courseKey, examDate)` | Not modeled | Manager exam-date reporting is scoped by organization, member, course, and date | Incorrect `schema.ts` omission | Declare the production index | No | No |
| 11 | `exam_results_identity_idx` | `(studentEmail, courseKey, createdAt)` | Not modeled | Mock-exam history and course progress use learner/course/time identity | Incorrect `schema.ts` omission | Declare the production index | No | No |
| 12 | `exam_results_org_member_idx` | `(orgId, organizationMemberId, createdAt)` | Not modeled | Manager outcomes are organization/member scoped | Incorrect `schema.ts` omission | Declare the production index | No | No |
| 13 | `exam_results_session_unique_idx` | Unique `(sessionId)` | Not modeled | Mock-exam sessions must remain idempotent | Incorrect `schema.ts` omission | Declare the unique index | No | No |
| 14 | `idx_exam_results_email` | `(studentEmail)` | Not modeled | Learner result lookup is email-backed for non-OAuth access | Incorrect `schema.ts` omission | Declare the production index | No | No |
| 15 | `idx_exam_results_user` | `(userId)` | Not modeled | Learner result lookup is user-backed for OAuth access | Incorrect `schema.ts` omission | Declare the production index | No | No |
| 16 | `org_members_org_email_unique_idx` | Unique `(orgId, email)` | Not modeled | A person may hold only one membership per organization | Incorrect `schema.ts` omission | Declare the unique index | No | No |
| 17 | `qa_org_member_course_created_idx` | `(orgId, organizationMemberId, courseKey, createdAt)` | Not modeled | Teams learning analytics filter attempts by operator, course, and time | Incorrect `schema.ts` omission | Declare the production index | No | No |
| 18 | `idx_flex_lic_deadline` | `(status, activationDeadline)` | Not modeled | Flex licence activation-deadline maintenance is status scoped | Incorrect `schema.ts` omission | Declare the production index while retaining the pre-existing `flex_lic_deadline_idx` | No | No |
| 19 | `idx_flex_lic_expiry` | `(status, accessEndsAt)` | Not modeled | Flex expiry operations are status and end-date scoped | Incorrect `schema.ts` omission | Declare the production index | No | No |
| 20 | `idx_flex_lic_invitation` | `(invitationToken)` | Not modeled | Invitation redemption resolves the token directly | Incorrect `schema.ts` omission | Declare the production index while retaining the pre-existing composite invitation index | No | No |
| 21 | `idx_flex_items_order` | `(orderId)` | Not modeled | Order fulfillment retrieves its line items by order ID | Incorrect `schema.ts` omission | Declare the production index | No | No |
| 22 | `idx_flex_orders_org` | `(organizationId)` | Not modeled | Teams Flex management filters orders by organization | Incorrect `schema.ts` omission | Declare the production index | No | No |
| 23 | `idx_flex_orders_status` | `(status)` | Not modeled | Teams Flex operational processing filters orders by state | Incorrect `schema.ts` omission | Declare the production index | No | No |
| 24 | `uk_stripe_pi` | Unique `(stripePaymentIntentId)` | Not modeled | Stripe PaymentIntent webhook handling must be idempotent | Incorrect `schema.ts` omission | Declare the unique index | No | No |

## Proposed but unapplied production changes

| Migration | Checksum | SQL effect | Application status | Approval gate |
|---|---|---|---|---|
| `0054_add_stripe_event_log_status_idx` | `0d0c3240ae8e4eca0feb482fb97eedb38d023665b28277f34ec4449147db27e3` | `CREATE INDEX stripe_event_log_status_idx ON stripe_event_log(status)` | Proposed only; not applied | Ay must approve before the normal forward migration workflow applies it |
| `0055_add_team_flex_orders_org_status_idx` | `80af908d0cc70697e78abfd573a9e3fb8d57f3fc9cf6d4bc04eec601a8346e04` | `CREATE INDEX team_flex_orders_org_status_idx ON team_flex_orders(organizationId, status)` | Proposed only; not applied | Ay must approve before the normal forward migration workflow applies it |

## Verification outcome

The read-only verifier reports **zero blocking errors**. It preserves two non-blocking warnings, one for each declared proposed migration above. The warnings are intentional: they keep unapplied production work visible without misclassifying it as an untracked repository defect. Any missing column, type/nullability drift, index drift, or missing index without this explicit forward-migration record remains blocking.
