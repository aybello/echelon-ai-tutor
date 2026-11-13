# Echelon Institute Product Audit

**Date:** 29 September 2026  
**Scope:** Read-only audit of the live public product, buyer flow, product code, aggregate operational data, and public search setup.  
**Code baseline reviewed:** `2bbf3abe`  
**Primary lens:** Revenue, trust, conversion, learner retention, and B2B adoption.

> **Bottom line:** Echelon already has a serious product. The limiting factor is not a lack of features. It is that the public offer and measurement layer do not yet communicate or prove the product as clearly as the app itself does.

## Executive judgment

Echelon has the parts of a real operator-prep business: course-specific practice, mock exams, flashcards, study notes, formulas, an AI Tutor, a study plan, manager analytics, team licensing, checkout, and auditable training records. The priority is to make those assets easier to trust, easier to buy, and easier to use repeatedly.

The strongest immediate work is **not** a new feature. It is to remove unsupported recognition language, lead with course selection rather than one OIT trial for every visitor, measure the complete buyer journey, route B2B interest into a real lead record, and activate the existing team accounts. The CEU pilot should remain non-credit and should not be monetized until the lesson quality is at the standard expected of a structured professional course.

## What is working

| Area | Evidence | Product implication |
|---|---|---|
| Checkout completion | The last 90 days show 12 checkout starts and 11 completed checkouts. | The payment finish line appears healthier than the earlier selection-to-checkout handoff. Do not rebuild checkout first. |
| Core learning usage | About 3,515 question attempts from 100 distinct learning identities in the past 30 days, plus 16 mock exams. | Learners are using the core practice product. Improve the progression loop before adding more study tools. |
| Team infrastructure | Teams supports annual and Flex purchasing, named licences, invitations, manager dashboards, readiness signals, exports, reminders, and training records. | The B2B offer is more mature than the public presentation makes it seem. Focus on adoption and proof. |
| Course inventory | The live metadata contains 36 question banks and 22,682 questions. | Echelon has a large inventory. Public copy must use a verified count rather than stale static numbers. |
| Search foundation | The live sitemap has 180 URLs, including 35 public course URLs. Public pages have canonical metadata. | The technical base for organic acquisition exists. The next gains are content quality, accuracy, and priority pages. |
| CEU transparency | The public CEU catalogue clearly calls itself a non-credit pilot. | This is the correct commercial and regulatory position while the courses are improved. |

## Priority improvements

| Rank | Improvement | Why now | Recommended change | Business effect | Effort |
|---:|---|---|---|---|---|
| 1 | **Remove unsupported recognition language** | Some public descriptions say Echelon courses are “Recognized by EOCP, AWWOA, SAHO, and MWWA,” while the footer and FAQ correctly say Echelon is independent and not endorsed. | Replace every recognition, approval, and endorsement implication with consistent independent-prep language. Keep alignment claims only where they are factual and supportable. | Protects trust, lowers legal and reputational risk, and prevents qualified buyers from disengaging when copy contradicts itself. | Small |
| 2 | **Fix the product-selection to checkout handoff** | Directional event counts show 86 product selections but only 12 checkout starts, while 11 of those starts completed. | Review individual, Teams Annual, and Teams Flex journeys separately. Make the selected course, price, 12-month term, and purchase action obvious. Remove duplicate choices and unclear transitions. | More high-intent buyers should reach the currently healthy checkout finish line. | Medium |
| 3 | **Lead with course selection, not only OIT** | The homepage sends every visitor into an OIT-specific free experience before course choice. Echelon sells a broader catalogue. | Replace the one-size primary CTA with **Choose your exam**. Keep a clearly labeled free OIT trial as a secondary path. Show a visible Teams route for organizational buyers. | Better intent matching and fewer visitors entering the wrong study path. | Small |
| 4 | **Instrument the full funnel before declaring a winner** | The app records many key events, but the evidence does not show a complete page-view and source-attribution layer. | Track landing view, source, province, device, course choice, pricing view, product selection, checkout start, completion, and post-purchase activation with privacy-safe journey IDs. Define every event in one internal analytics dictionary. | Lets Echelon spend engineering and ad budget on the actual bottleneck rather than the loudest opinion. | Medium |
| 5 | **Convert partnership interest into saved leads** | The Partnerships form launches a `mailto:` link even though Echelon already has a database-backed contact router. | Submit partnership inquiries through the existing contact flow, save organization, buyer, team size, timing, and need, confirm receipt, and assign a response owner. Retain email as a fallback. | Creates a trackable B2B pipeline and avoids dependence on a buyer having a configured mail client. | Small |
| 6 | **Activate existing team accounts before building more B2B product** | There are seven active organizations with 74 active seats, but these billing-capacity figures must not be confused with active learners. | Review purchased capacity, invitations, assignments, first study activity, and manager usage with each organization. Use the existing dashboard and reminder tools to identify the real adoption blocker. | Improves renewal odds and can surface expansion opportunities from existing customers. | Medium |
| 7 | **Build a diagnostic-to-study progression loop** | Echelon records diagnostics, practice, study goals, and mocks, but current aggregates do not establish return behaviour or progression. | After a diagnostic, give the learner one clear next action, a weekly goal, a resume point, and a milestone that recommends a mock exam. Measure 7-day and 30-day course return rates. | Better learner momentum, more perceived value, and stronger retention. | Medium |
| 8 | **Validate public-page speed before optimizing blindly** | Public pages returned successfully but showed roughly 373–381 KB HTML transfers and simple cold requests of roughly 3.1–4.9 seconds. | Measure actual mobile and desktop browser performance for the homepage, a course page, pricing, and Teams. Then reduce the largest proven contributors to slow first visits. | Better first-visit usability and a potential lift in acquisition conversion. | Medium |
| 9 | **Treat CEU quality as a trust project, not a revenue project** | The CEU catalogue is open and truthfully non-credit, but the lesson writing has an acknowledged structure and readability problem. | Establish a lesson standard: clear outcome, section headings, short paragraphs, bullets, worked example, scenario, reflection, and comprehension check. Rewrite and review a representative course before scaling. | Protects the Echelon brand and creates a credible future course product. | Large |

## Critical claim corrections

These are **trust-critical**, not cosmetic.

1. **Remove “Recognized by EOCP, AWWOA, SAHO, and MWWA”** from public product and landing copy unless Echelon holds written proof of that exact recognition. The platform may describe itself as independent preparation aligned to published subject matter where that is true.
2. **Replace or remove “18,876+ practice questions across 36 courses.”** The current authoritative metadata shows **36 question banks and 22,682 questions**. Those are not automatically the same thing as 36 public courses, so the public statement should be generated from a verified source or written more carefully.
3. **Keep CEU wording exact:** non-credit pilot, no approved CEUs, no accreditation, no operator qualification, and no regulatory recognition awarded.
4. **Do not call practice activity or readiness a certification outcome.** Readiness is a study-support signal, not an official exam prediction or guarantee.

## Revenue funnel findings

The current event data is useful but still directional. It shows a likely upstream purchase issue:

```text
Pricing views                 254
Buyer paths selected          124
Products selected              86
Checkout starts                12
Checkout completions           11
```

The right conclusion is not that Echelon has a 14% conversion rate from selection to checkout. These are aggregate event counts, not a deduplicated cohort funnel. The right conclusion is that the **product-selection to checkout-start handoff deserves inspection before checkout itself is redesigned**.

### First buyer-flow changes to test

1. Homepage primary CTA: **Choose your certification exam**.
2. Course selector immediately below the hero with Ontario Water, Ontario Wastewater, WPI, and OIT paths.
3. Course-specific free preview labels, not a generic OIT path for every visitor.
4. Selected-course summary on the pricing and checkout entry screens:
   - Course name
   - Question-bank size
   - Exact price
   - **12 months from successful payment**
   - One-time payment, no subscription
5. Separate copy and analytics for Individuals, Teams Annual, and Teams Flex.

## Learner retention findings

Echelon has the right raw materials:

- Practice questions by module
- Mock exams
- Flashcards
- Notes and formulas
- AI Tutor
- Exam date and weekly-goal planning
- Current streak and history
- Diagnostic feedback

The opportunity is to turn these features into one obvious loop:

```text
Diagnostic → recommended focus → next study session → weekly target → mock milestone → review weak areas → repeat
```

### Retention metrics to add

| Metric | Why it matters |
|---|---|
| First study session within 24 hours of purchase | Tests whether buyers reach value quickly. |
| Day 7 and Day 30 course return rate | Measures real retention by course and acquisition source. |
| Diagnostic to first practice conversion | Tests whether feedback leads to action. |
| Practice to first mock conversion | Tests whether learners reach a meaningful preparation milestone. |
| Return-to-study after a weak mock | Measures whether feedback recovers motivation rather than ending the session. |
| Weekly questions completed against goal | Makes the study plan operational. |
| Manager activation and learner-activation rate | Separates B2B purchase from actual customer adoption. |

## B2B findings

The team offer is already capable of solving a meaningful employer problem: assign the right prep course, see activity and readiness indicators, export records, and remind inactive operators. That is a stronger offer than “bulk seats.”

### Recommended B2B operating play

1. Define success for every organization as:
   - Manager activated
   - Operators invited
   - Operators assigned
   - First study session completed
   - First readiness review completed
2. Contact the current active organizations and classify each blocker:
   - assignment friction
   - invitation or login friction
   - unclear course selection
   - no immediate exam date
   - low manager follow-up
3. Use the existing dashboard as a customer-success tool. Do not build a new one yet.
4. Send manager follow-ups based on adoption state, not a generic cadence.
5. Capture every partnership inquiry through the existing contact infrastructure.

> Do not infer inactivity from the difference between billed seats and assigned operators. Billing capacity, seat allocation, and actual learning usage are separate measures.

## SEO and acquisition findings

### Strong foundation

- Sitemap exists and contains 180 URLs.
- 35 public course URLs are in the sitemap.
- Public pages have canonical metadata.
- Province and course discovery pages exist.

### Opportunity

- `/continuing-education` is not in the sitemap. This may be appropriate while the CEU content is still a noindex-style pilot. Do not index it merely to add URLs. Index it only after the lesson standard is met and the purpose is clear.
- The course bank inventory, product pages, and marketing claims must remain synchronized. A stale question count is an avoidable trust leak.
- The home, pricing, and Teams pages are visually coherent but repeat similar dark hero patterns. The next design work should make the **buyer decision** more prominent than the background style.

## What not to build yet

- CEU payments, paid CEU tiers, or CEU entitlements
- A checkout rebuild
- More dashboard modules
- More AI features
- More courses before the course-selection and buyer-flow issues are resolved
- A broad CEU acquisition campaign before the content rewrite is complete

## Recommended 14-day sequence

| Day | Work | Outcome |
|---:|---|---|
| 1–2 | Correct public recognition and inventory claims | Removes immediate credibility risk. |
| 3–4 | Walk every individual, Annual, and Flex buying path | Identifies the exact selection-to-checkout friction. |
| 5–6 | Add privacy-safe page and source funnel tracking | Establishes a clean baseline. |
| 7–8 | Rework the homepage CTA and above-fold course selection | Better buyer intent matching. |
| 9–10 | Replace partnership `mailto:` flow with saved lead capture | Builds a measurable B2B pipeline. |
| 11–12 | Review all seven active organization adoption states | Finds near-term retention and expansion opportunities. |
| 13–14 | Define and approve the CEU lesson writing standard | Prevents another unstructured-content rebuild. |

## Recommended next build

Start with a **trust and conversion hardening release**:

1. Correct the unsupported recognition claims and stale inventory claim.
2. Add a course-first homepage path while retaining the free OIT preview.
3. Make the partnership form create a saved inquiry through the existing contact router.
4. Add complete funnel measurement for course selection through checkout completion.

This is the highest-probability path to more revenue without increasing product complexity.
