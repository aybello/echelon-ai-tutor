# U.S. Domain and Go-to-Market Plan

**Status:** Planning only — no domain purchase, DNS, application, checkout, advertising, email, content release, publication, or deployment is authorized by this document.

## Recommendation

Use **`echeloninstitute.com`** as Echelon Institute's primary U.S. customer domain and retain **`echeloninstitute.ca`** as the Canadian customer domain.

The intended structure is:

- `echeloninstitute.ca` — Canada: Ontario and Canadian/Western preparation.
- `echeloninstitute.com` — United States: U.S. operator study support, state routing, U.S. pricing, and U.S.-specific marketing.
- One product, one codebase, one evidence and question-governance system. The domains are regional entry points, not separate companies or disconnected course products.

Use the correctly spelled domain with one `t` in **Institute**. Do not use the non-resolving typo `echeloninsttitute.com` as a customer-facing brand domain.

As checked on October 30, 2026, `echeloninstitute.com` is already registered and serves a generic “This domain may be for sale” page. It must be acquired from its current owner before any U.S. domain implementation begins. This is an acquisition decision, not a technical task to work around.

## Why a U.S. Domain Is Worth It

A dedicated U.S. domain makes the audience, currency, policies, state routing, and search intent immediately clear. The current published U.S. section at [echeloninstitute.ca/us](https://echeloninstitute.ca/us) correctly presents shared WPI study support, tells learners to confirm their state scope, and lists prices in CAD. That is a safe discovery surface, but it is not the strongest long-term U.S. conversion experience.

The U.S. offer must stay precise. A visitor should always be able to see whether their state and stream are:

1. **WPI Direct** — the state route uses the relevant WPI-standardized preparation scope.
2. **State program + WPI component** — Echelon Institute has relevant WPI preparation, but the learner may need additional state-specific study.
3. **State-specific / no shared course** — no shared-WPI preparation should be presented as a match. The page should explain that the route is not currently available, or direct the learner only to an approved dedicated course when one exists.

This matches the current source-backed state-routing work and avoids the two damaging claims to avoid: “we cover every state” and “we are the official exam provider.”

## Mandatory Pre-Launch Gates

### 1. Acquire and clear the name before paid U.S. marketing

Obtain an owner-approved acquisition quote and purchase approval for `echeloninstitute.com`. Do not purchase the typo as a substitute for the primary name.

Before putting material spend behind the U.S. brand, complete a U.S. trademark and common-law name review for education, training, software, and water-operator services. An unrelated leadership/coaching organization already uses [The Echelon Institute](https://theecheloninstitute.com/), so the review should assess confusion risk in the relevant service classes rather than assume that the different audience resolves it. Use the [USPTO Trademark Search](https://www.uspto.gov/trademarks/search) and a qualified U.S. trademark professional for the final legal conclusion.

**Gate owner:** Ay / legal advisor

**Done when:** the acquisition price is accepted, ownership is confirmed in an account controlled by Echelon Institute, and name-use risk has been assessed for the intended U.S. training and software services.

### 2. Make the U.S. product commercial-ready

The 50-state/200-state-stream routing map is complete. It is a market-routing asset, not proof that every state can be sold a dedicated course today.

Before selling at scale, complete these product gates:

- Choose the U.S. customer price and currency. The current public U.S. pricing context shows CAD. U.S. buyers should see a deliberate USD or clearly disclosed CAD offer; do not leave currency ambiguous.
- Verify U.S. checkout against the exact commercial catalogue, state-routing label, return URL, receipt wording, and access entitlement. Do this with an approved non-production or isolated verification path; do not create a real customer purchase solely for testing.
- Release no new question bank until it is independently reviewed, approved, imported through the separately authorized content-release path, verified in the intended database, and confirmed learner-visible only for its approved course.
- Keep the current 200-question U.S. private package in `in_review`. It is not a released product.
- Preserve state-specific availability. Texas Class D Water remains a dedicated state-specific route; it must not be represented as a nationwide shared-WPI course.

**Gate owner:** Product / engineering

**Done when:** a customer can choose an approved state and stream, see an accurate course-scope label and price, pay through the correct U.S. checkout path, receive the intended access, and find the same scope statement in the product, receipt, and account.

### 3. Build the U.S. domain as a regional front door

After acquisition, implement a host-aware regional experience rather than cloning the application.

| Concern | Canada | United States |
|---|---|---|
| Primary host | `echeloninstitute.ca` | `echeloninstitute.com` |
| Customer entry | Canada homepage | U.S. operator-study homepage |
| State/province finder | Province-first | State-first |
| Pricing | Canadian offer | Deliberate U.S. offer and currency |
| Course framing | Canadian and Western exam paths | State/stream evidence label and U.S. course scope |
| SEO canonical | `.ca` Canada pages | `.com` U.S. pages |

The U.S. root should be the U.S. marketing and state-finder experience, not a redirect to `/us` on the Canadian domain. Reuse existing components, routing data, and access rules. Do not duplicate question delivery or create separate question governance.

The implementation checklist is:

- Point the apex and `www` U.S. host to the approved hosting project and enforce one canonical host.
- Add `.com` as an allowed OAuth/callback, Stripe success/cancel, CSP, analytics, sitemap, robots, canonical, and structured-data host only after DNS ownership is verified.
- Keep authentication cookies host-only. Do not attempt to share session cookies across `.ca` and `.com`; account recovery by email is safer than cross-domain cookie sharing.
- Give every public page one regional canonical URL. Avoid duplicate `.ca/us/*` and `.com/*` pages competing in search.
- Add `en-CA` and `en-US` alternate metadata only when equivalent pages genuinely exist.
- Keep state-route labels and unavailable states server-rendered so crawlers and no-JavaScript visitors see the same boundaries as application users.

**Gate owner:** Engineering / release owner

**Done when:** public routes, SEO metadata, checkout returns, email links, authentication, legal pages, and analytics have been verified on the actual `.com` host without weakening Canadian behavior.

## Market Entry Sequence

### Phase A — Soft U.S. discovery now

Use the existing U.S. state pages only for careful, educational discovery. The message is:

> Find your state, confirm your exam path, and see whether Echelon Institute offers shared WPI study support or a dedicated approved course.

Publish only source-backed educational material:

- State and stream guides based on the existing official-source matrix.
- “How to check your water operator exam provider and classification” explainers.
- Formula, process, and study-planning education that does not claim state approval.
- Short-form field-learning content that leads to the state finder, not directly to a generic national checkout.

This phase can collect non-commercial interest only through approved consent language and an accurate waitlist or update form. It should not run broad paid acquisition into an offer whose course, price, currency, or state scope is unclear.

### Phase B — Limited commercial launch

Launch paid acquisition only for the subsets that pass the commercial-ready gates:

- Verified WPI Direct routes with existing learner-visible shared courses.
- Approved dedicated state courses with released and verified bank inventory.
- Approved State program + WPI component routes, but only with an explicit “shared preparation plus state-specific study may be required” label.

Start with high-intent search and direct partnerships, not broad national awareness spend.

**High-intent search:** Use state/stream/course-language pages and ads such as “water distribution operator exam study support” rather than “guaranteed [state] exam prep.” Send each ad to the matching state page and course route, never to a generic checkout.

**Partnership outreach:** Build a small target list of utility employers, workforce-training providers, operator associations, and continuing-education organizations. Lead with a review of the state route, a short product demo, and a pilot or team-training conversation. Do not imply endorsement by a regulator, association, or exam vendor without written permission.

**Founder-led content:** Publish a repeating weekly sequence:

1. A state-route or credential explainer.
2. A technical study lesson or calculation walkthrough.
3. A short operator career, preparation, or employer-training story.
4. A product demonstration showing how state selection drives the correct study path.

### Phase C — Scale state-specific acquisition carefully

Scale only after the state-specific content is released through the evidence, independent-review, import, and post-release verification process.

Each state-specific commercial page must show:

- The state, stream, credential level, and exam/provider scope covered.
- What is included and what is not included.
- The last source-review date.
- A no-guarantee statement.
- A route to report content errors.

Treat each new state as a mini-launch with its own evidence record, product configuration, state page, conversion evidence, and support review. Do not market future-state availability before the relevant bank is genuinely released.

## First Marketing Assets to Build After the Gates

1. **U.S. state-finder landing page** on the `.com` host with one primary action: “Find your state and exam path.”
2. **One source-backed state/stream page template** with plain-language scope, free-preview route, and unavailable-state treatment.
3. **U.S. pricing and access page** with deliberate currency, 12-month access explanation, refund/policy links, and no implied pass guarantee.
4. **A five-email educational sequence** for opted-in U.S. leads: state route, exam planning, study system, product preview, and invite to the matching approved course.
5. **Three direct-operator video concepts**: how to identify the right exam path, what practice data can and cannot tell you, and a process/calculation study lesson.
6. **A team-training one-pager** for utility managers focused on visibility, study consistency, and assigned-course scope—not test-score guarantees.

## Measurement and Stop Rules

Use one regional dashboard that separates Canada and U.S. traffic, but preserves a single product funnel. Track:

- State finder completion rate.
- State-page to free-preview rate.
- Preview to checkout-start rate.
- Checkout-start to completed purchase rate.
- Purchase to first study session rate.
- Team-demo requests and pilot conversion.
- Support/error reports by state and stream.

Every campaign URL should carry a source, medium, campaign, state, and stream parameter. Do not record unnecessary personal data to evaluate channel performance.

Pause a campaign immediately if it sends users to an unavailable state route, mismatched stream, incorrect currency, failed checkout, inaccurate route claim, or a product with unresolved content evidence.

## Decision Needed From Ay

1. Confirm that the intended acquisition target is **`echeloninstitute.com`**, not the misspelled domain.
2. Approve or decline requesting an acquisition quote from the current domain owner. A purchase itself requires a separate explicit approval.
3. Choose the U.S. commercial model: USD pricing or clearly disclosed CAD pricing during the initial limited launch.
4. Choose the first U.S. commercial cohort only after the release owner confirms the matching courses and checkout are genuinely ready.

## References

[1]: https://echeloninstitute.ca/us "Echelon Institute US operator study support"
[2]: https://theecheloninstitute.com/ "The Echelon Institute leadership coaching site"
[3]: https://www.uspto.gov/trademarks/search "USPTO trademark search"
