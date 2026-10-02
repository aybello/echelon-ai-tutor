# Coordinated UI and UX workspace update

This branch updates the shared learning surfaces using the navy, ivory, sage and serif design approved on October 2, 2026. Production deployment remains subject to the complete release checks and verification of the code actually serving the site.

## User experience

- The homepage's primary action leads to a province/system/level course finder backed by the canonical active-course registry. The existing catalogue and OIT preview remain available.
- The shared practice shell gives the question and answer options more space, groups module/mode/settings under Practice options, and accepts answers without a confidence rating. Unrated answers retain null confidence. Notes, formula links, Tutor and relevant process resources remain accessible.
- The learner dashboard presents one primary study step and optional Quick 10, with charts, outcomes and history under Progress. Explicit course selection scopes the study-plan query and destination; the weak-topic action uses that scoped plan rather than cross-course totals.
- Active mock exam responsive CSS applies in every exam state. The phone navigator can expand, jump to a question and collapse again.
- The manager dashboard separates Operators and access from Reports and outcomes. The roster includes per-course progress, expandable study details, name/email search and study-activity filtering. Assigned access is distinguished from recorded practice; invitation delivery or sign-in is not inferred from missing evidence. Existing Course Pass, Flex, billing, annual-licence rules, exports, reminders and confirmation dialogs remain.
- Continuing education keeps overview → self-paced lessons → final exam → results → certificate. Course-only navigation is used while learning. Save feedback reflects pending and acknowledged writes. Existing 80% passing rule and non-credit pilot status remain.
- Settings are a labelled keyboard dialog with Escape, focus containment and focus restoration. Primary controls are larger and reduced-motion preferences are respected.
- The original droplet logo and licensed Inter/Fraunces fonts are served with the app. The new homepage illustration is decorative; it does not replace an instructional process diagram.

No pricing, question-bank content, database migrations, authentication authority, Stripe logic or entitlement rules are changed. Existing process-guide content and equipment models are preserved.

## Working preview

`prototypes/ui-ux-preview` renders the actual components with fictional, local fixtures. It has no network API link and does not access production, send mail or create payments. The preview practice questions are illustrative and are not imported into the question bank. Its CEU and mock responses demonstrate UI states, not production assessment validation.

- Local preview: `node_modules/.bin/vite --config prototypes/ui-ux-preview/vite.config.ts`
- Desktop/mobile browser checks: `node_modules/.bin/playwright test --config prototypes/ui-ux-preview/playwright.config.ts`
- Single HTML review file: `node prototypes/ui-ux-preview/build-single-file.mjs /absolute/output/echelon-ui-preview.html`

Open the downloaded HTML in a browser and choose a screen from the review bar. CEU lessons can be advanced and resumed; the sample-completion control enables inspection of the final-exam UI. Reloading resets the fictional records. The live application entry never imports the prototype or its answer fixtures.

## Release verification

Review desktop and phone layouts before merge. Run the complete Quality Gate on the branch, including existing database-backed journeys. After deployment, verify a purchased learner's module selection, optional-confidence answer, saved history, Notes/Tutor links, active mock navigator, manager roster/course editing/report export and CEU save/resume using dedicated QA accounts. Local prototype browser checks cannot certify production purchases, entitlements or data delivery.

## Local validation

Application, script and preview TypeScript checks pass, as do the production build and 1,454 deterministic tests (19 suite-defined skips). Eleven browser journeys cover the real homepage's branding and OIT entry points, course selection, module filtering, optional confidence, learner and manager views, phone layouts, settings keyboard focus, CEU save/resume and exam-to-certificate flow, plus the downloaded HTML with the browser offline. Preview fixtures do not certify production purchasing or database writes.

The existing database-backed Teams tests select the named operator progress report and verify saved question counts, mock scores and started status by their column headings. The CEU test targets the exact final-exam control within course navigation, while retaining failure, retry and resume checks. Neither journey's assessment, persistence or access assertions are removed.
