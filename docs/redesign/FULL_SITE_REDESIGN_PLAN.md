# Echelon Full-Site Redesign Plan

**Status:** Implementing on `manus/full-site-redesign-20261029` from GitHub `main` commit `51d6ead8`.

## Product decision

The approved light technical visual system is a **whole-site** redesign, not a homepage-only treatment. The existing homepage is the visual reference, but the final release must give the public discovery, learning, learner-progress, employer, and privileged operational experiences one coherent visual language.

The homepage-only foundation is intentionally **not deployable as the finished redesign**. No deployment, WebDev checkpoint, production data action, migration, payment action, email, invitation, learner action, or content release is authorized by this plan.

## Definition of done

A single visual system is consistently applied across:

1. **Public discovery and trust** — navigation, pricing, About, Partnerships, Blog, Careers, FAQ, legal, SEO course/regional pages, and U.S. discovery.
2. **Learner study** — practice, mocks, flashcards, AI Tutor, formulas, guides, maps, Labs, Equipment Lab, and Incident Command.
3. **Learner account and progress** — OTP, access restoration, dashboard, activation, training hours, signed records, Course Pass claim, and purchase/subscription state pages.
4. **Employer and Teams** — public Teams acquisition, partnerships, manager dashboard, team training reports, and Course Pass lifecycle surfaces.
5. **Admin and operations** — privileged admin console, manager operations, continuing-education catalogue, and CEU course workspace.

The system will use:

- **Navy:** `#10253F` for hierarchy and major headings
- **Deep navy:** `#0B1D30` for bounded high-attention workspaces and command bars
- **Teal:** `#087F78` for the primary action and active technical emphasis
- **Soft teal:** `#EAF6F3`
- **White and soft surface:** `#FFFFFF`, `#F5F8F8`
- **Ink and muted text:** `#17212B`, `#647481`
- **Border:** `#DFE6E8`
- **Fonts:** Manrope for headings, Source Sans 3 for body and controls, IBM Plex Mono for compact technical metadata.

## Invariants

The redesign is visual-only. It must preserve:

- Every existing URL, redirect, route classification, query parameter, canonical/hreflang/robots/SSR behavior, public/private boundary, and U.S. state-first routing rule.
- Course selection, free previews, entitlement gates, question/answer visibility rules, signed mock sessions, scoring, AI Tutor safety boundaries, flashcard persistence, guide/lab fallbacks, and simulator state.
- OTP, access restoration, login/logout, data isolation, learner account truth states, learner diagnostic controls, training-record immutability, Course Pass lifecycle, and all manager/admin authorization boundaries.
- Stripe checkout, product availability, pricing/currency/term representation, purchase/subscription fulfillment states, Teams procurement, annual-seat and Flex-license semantics, billing scopes, and post-checkout truth states.
- Existing public claims, legal copy, independent-provider warnings, authority links, regulatory and jurisdictional limits, data-loading honesty, and accessibility semantics.

No route, tRPC input, server endpoint, database schema, migration, payment flow, entitlement calculation, learner record, question, content status, or policy will change as part of this work.

## Architecture approach

The implementation works from shared seams before route-specific polishing:

1. Establish a reusable visual token layer in `client/src/index.css` and a scoped design stylesheet.
2. Align the shared public header/dropdowns/mobile navigation without changing navigation destinations or employer pricing suppression.
3. Align shared learning shells: `QuizShell`, `MockExamShell`, `FlashcardShell`, AI Tutor, course bar, and guide/navigation seams.
4. Align learner account/progress and Teams/reporting primitives while preserving their distinct status and record contracts.
5. Align admin and CEU presentation separately, retaining the admin console and command simulation as intentional high-attention deep-navy exceptions.
6. Apply page-family wrappers and visual polish to public, U.S., legal, discovery, formula, guide, Lab, and report surfaces.

## Surface plan

### Public discovery and trust

- Use `SiteNav` as the single public navigation behavior source.
- Extend the homepage’s light technical hierarchy to pricing, informational, SEO, legal, careers/blog, and U.S. discovery pages.
- Keep pricing, employer and U.S. state-specific disclosures structurally and semantically unchanged.
- Do not activate, remove, or route `MobileBottomNav`; it currently has no caller.

### Learner study

- Use a shared technical workspace hierarchy across practice, mocks, flashcards, AI Tutor, formulas and guides.
- Preserve practice screen-fit, mock navigator, flashcard flip/review behavior, formula search and worked examples, diagram keyboard access, WebGL/diagram fallback, and reduced-motion behavior.
- Equipment Lab is the visual technical precedent. Incident Command remains intentionally deep-navy but adopts the same typography and semantic status system.

### Learner account and progress

- Create a light technical account/progress layer for OTP, account, dashboard, activation, training records, Course Pass and confirmation surfaces.
- Preserve the distinctions between verification, payment receipt, fulfillment, access, signed record, manager acknowledgement, and regulatory eligibility.

### Employer and Teams

- Present Teams procurement and manager operations using the same navy/teal typography, white panels, report hierarchy, and disciplined status chips.
- Preserve the employer-only conversion path and no-individual-pricing rule.
- Preserve all organization/seat/term/billing/reporting controls and server-authorized states.

### Admin and CEU

- Modernize the admin console into a light technical command center with a deep-navy sidebar, without changing data queries or privileged actions.
- Reconcile CEU marketing and course delivery around the shared visual system while preserving protected learning, assessment, completion and certificate boundaries.

## Visual and accessibility rules

- 4–8px radii for ordinary controls/cards; no decorative glass, neon gradients, or excessive rounded cards.
- Motion only for clear feedback, using transform/opacity and a 120–180ms strong ease-out; support reduced motion and do not animate high-frequency keyboard actions.
- Visible focus treatment, keyboard-operable menus/drawers/dialogs, readable contrast, text alongside semantic color, responsive 320px layouts, short-viewport learner study layouts, and print-safe reports/certificates.
- Do not use emoji as the only state or navigation signal. Retain explanatory text for state and qualification.

## Verification matrix

At minimum, verify one representative route per family at desktop, 768px tablet, 390px mobile, and a short learner-study viewport:

- Public: `/`, `/pricing`, `/about`, `/partnerships`, `/blog`, `/jobs`, `/faq`, `/privacy`, one SEO course page, `/us`, `/us/states`, `/us/courses`, and one U.S. state page.
- Learning: a course quiz, a mock, flashcards, `/formulas`, `/guides`, `/process`, `/lab`, `/equipment-lab`, and `/command`.
- Learner: `/account`, `/login/otp`, `/dashboard`, `/activate/:courseKey` fixture state, `/training-hours`, a record state, `/course-pass/claim`, and checkout confirmation fixture states.
- Employer: `/teams`, `/partnerships`, `/team` fixture states, and `/team/training-hours` fixture states.
- Operations: `/admin` role/loading/denial fixture states, `/continuing-education`, and a CEU course/assessment fixture state.

Run surface-focused tests during implementation, then the full suite, both TypeScript configurations, production client/server build, exact-diff review, browser accessibility/viewport checks, and no-auth public smoke checks after a separately authorized deployment.

## Release boundary

The final handoff will separately state: implemented, tested, committed, pushed, reviewed, merged, checkpointed, deployed, and runtime-verified. This plan authorizes implementation and a source-control handoff only; it does not authorize deployment.
