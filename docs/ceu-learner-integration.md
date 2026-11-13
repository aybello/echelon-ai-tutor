# CEU learner integration decision

**Mode:** Redesign-preserve / extension

**Preserve**

- Public catalogue and course routes: `/continuing-education` and `/continuing-education/:courseKey`
- The learner sequence: overview → lessons → final exam → results → non-credit pilot certificate
- Server-side learning records, learner ownership, protected final-answer keys, grading, completion rules, saved progress, retry behavior, and certificate ownership
- Public-safe non-credit language and certificate anchor: `#ceu-certificate`
- Course curriculum JSON, accessible labels, mobile lesson navigation, and the existing browser journey
- No payments, pricing, entitlement, access-duration, infrastructure, or data changes

**Improve**

- Use Echelon's shared `SiteNav` instead of a separate CEU product header
- Add a compact Echelon-aligned course context bar below the shared navigation
- Use the established Echelon Sora typography, navy/blue/teal token roles, white surfaces, slate canvas, and card/action vocabulary
- Keep dashboard and account paths available through the common product shell

**Remove**

- The standalone `ceu-app-header`, duplicate CEU wordmark treatment, isolated CEU navigation, and the separate visual token system that made the course feel like a different application

**Protected contracts**

- Route structure, navigation destinations, accessible control names, form fields, legal disclosures, test selectors, saved-state keys, and all server API contracts remain unchanged.

**Design read**

- **Artifact:** Professional learning course workspace
- **Audience:** Ontario water and wastewater operators
- **Visual language:** Echelon operational learning workspace
- **Mode:** Redesign-preserve / extension
- **Visual variance:** 2/10
- **Motion intensity:** 2/10
- **Information density:** 7/10
- **Asset dependence:** 10/10, using Echelon's existing real logo through `SiteNav`
- **Brand fidelity:** 10/10

**Highest-risk change:** Replacing the CEU header without weakening exam-draft exit protection.

**Rollback / fallback:** The refactor is localized to the CEU course page and styles. Its data contracts and routes remain untouched, so the UI commit can be reverted without a migration or learner-record change.
