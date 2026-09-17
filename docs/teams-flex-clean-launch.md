# Teams and Flex Clean Launch Controls

**Release date:** September 17, 2026
**Scope:** New customer purchases only. Historical customer recovery remains a separate, evidence-gated process.

## Commercial structure

| Product | Customer use | Term | New-sale price |
|---|---|---:|---:|
| Individual Exam Pass | One learner, one released course | Permanent | Current individual course price |
| Teams Flex | Named operator, one released course | 3 or 6 months | Ontario OIT: CA$39 or CA$49. Other released courses use their approved course-band prices. |
| Retake Extension | One approved extension for an activated Teams Flex licence | 90 days | Current checkout price |
| Teams Annual, one stream | Named operator, one annual stream | 12 months, renewing subscription | CA$449 per operator per year before graduated volume discounts |
| Teams Annual, All Streams | Named operator, all released streams | 12 months, renewing subscription | CA$549 per operator per year before graduated volume discounts |

Teams Annual has a five-seat minimum. Teams Flex has no five-seat minimum. Both checkout paths calculate prices on the server and issue a Stripe Checkout session only after validating the requested product.

## Course availability

Teams Flex can only sell courses returned by `commercialAvailability`. The order builder reads the same availability response, but server validation remains authoritative. Teams Annual licences are constrained by their selected stream and the released course catalogue. The free 309A beta is deliberately excluded from all paid checkout flows.

## Retake Extension rules

A Retake Extension applies once per Teams Flex licence, preserves `originalAccessEndsAt`, and records an audit row. If an eligible extension is bought before the original term ends, the 90 days begin when that term ends. If it is bought after expiry but within the 30-day reporting window, the 90 days begin at successful payment. No extension can be purchased after that window.

## Cross-band Flex exchanges

Automated exchanges are intentionally not available at launch. A support-led exchange must follow this procedure:

1. Confirm that the original Teams Flex licence is unused and has not been activated.
2. Confirm the requested replacement course and whether the term changes.
3. Collect the documented price difference before changing access when the replacement costs more.
4. Revoke the original unused licence.
5. Issue the replacement licence with the same manager, organization, and operator context where applicable.
6. Record the original and replacement licence IDs, price difference, reason, operator, manager, and staff member in the support case so the relationship is auditable.
7. Do not exchange an activated licence, grant overlapping access, or alter historical recovery records through this procedure.

## Historical customer recovery

The clean-launch Teams and Flex paths do **not** create historical organizations, managers, seats, purchases, or entitlements. Utilities Kingston and all other historical records remain in the separate evidence-only recovery workflow until the required ownership, seat, term, and communication approvals are complete.

## Schema change

Migration `0069_team_flex_extension_verified_email.sql` permits a verified email-session purchaser to buy a Retake Extension even when the purchaser has no OAuth user ID. The change is additive and non-destructive. The existing pre-change table state was backed up in protected storage before application.
