# Individual Exam Pass Policy

**Effective policy:** September 21, 2026
**Applies to:** New Individual Exam Pass purchases created under the current checkout policy.

## Customer promise

An **Individual Exam Pass** gives one learner access to the selected course for **12 calendar months**. The term starts at the successful Stripe payment event and ends at the matching UTC calendar-month boundary. For example, a successful payment on January 15 at 08:00 UTC expires on January 15 of the next year at 08:00 UTC. A payment on February 29 expires on February 28 of the following non-leap year at the same UTC time.

The pass is course-specific. It is not permanent access, a Team Flex licence, or Team Annual access. It does not automatically renew. A learner can purchase a new pass when the current term ends.

## Fulfilment controls

The signed Stripe webhook is the sole writer for new Individual Exam Pass purchases. The browser success page only reads the fulfilment state. This avoids duplicate purchase records and prevents an unverified browser request from granting access.

The webhook accepts both immediate card success and delayed-payment success. It creates the purchase only after a signed Stripe success event reports payment as complete. The purchase record, entitlement expiry, and confirmation-email outbox item are written together. Duplicate signed webhook deliveries do not create a second pass or receipt.

If a new checkout is missing the approved Individual Pass policy marker, Echelon grants no access and creates no purchase record. The event is recorded for evidence-bound manual review. Scheduled reconciliation and admin tools may report discrepancies, but do not create, extend, or alter Individual Exam Pass entitlements.

## Historical purchases

Historical purchase rows retain their recorded access terms. This policy does not retroactively shorten, extend, or reinterpret prior access. Historical Stripe sessions without the current policy marker are not fulfilled automatically. Any ambiguity requires the documented evidence-bound recovery review process.

## Related products

| Product | Access rule |
|---|---|
| Individual Exam Pass | One learner, one selected course, 12 calendar months from successful payment |
| Teams Flex | Course-specific organizational licences for three or six months |
| Retake Extension | One additional 90-day period, subject to the applicable original-term rules |
| Teams Annual | Year-round, stream-wide organizational access under the annual agreement |

## Release verification

Before release, verify the signed webhook paths, payment timestamp handling, duplicate delivery protection, browser read-only behavior, reconciliation read-only behavior, expiry boundaries, TypeScript, and the full automated test suite. Do not change a live access term without explicit business authorization.
