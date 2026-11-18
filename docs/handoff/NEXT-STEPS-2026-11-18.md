# Next steps and handoff (written 2026-11-18, about 16:20 UTC)

For the next Claude session picking this up. Read `docs/handoff/HANDOFF-2026-11-17.md` first: it has the product goal, the owner's working rules, the Royce U rules and the exam-bank and course pipelines. This file covers what changed since then, the merge order, and what is still open. Check git before relying on anything here, because PR heads move.

No client names, contact details or account information belong in this file or in any commit.

## Where things stand

- `main` is at `4c4c105` (release PR #261 merged).
- Working branch: `claude/hello-5oz7m4`. Do not push anywhere else without permission.

| PR / branch | State | Head | What it is |
|---|---|---|---|
| #264 `claude/ce-images-in-repo` | open | `3bbb1997` | Serves CE course images from `client/public/ceu-covers/` instead of `/manus-storage/` paths. Also the Basic Safety photo fixes, the empty-slide-space CSS and the `publicDir` fix for the preview server. `privacy` passed. `validate` was still running at 16:20 UTC (started 16:12:35). |
| #262 `claude/ce-course-photos` | open | `0c0458be` | A second illustrative photo in ten live courses. Merges cleanly onto `main` and onto the #264 head. |
| `claude/ce-course-photos-2` | no PR | `387c77c4` | Section photos for ten live courses (18 images). Also carries earlier copies of the #264 commits and the Basic Safety commits, including `412d50e4`, which failed validate before it was superseded. Do not merge this branch as it is. See the merge order below. |
| #263 `claude/manager-essentials-course` | open, draft content | `39f4aa3c` | Manager Essentials CE course draft (files only, not registered). |
| #259 `claude/supervisor-essentials-course` | open, draft content | `0dacf6d0` | Supervisor Essentials CE course draft (files only, not registered). |
| #257 | open, draft content | `16118717` | Water Distribution Overview CE course draft (files only, not registered). |
| #256 | open, draft content | `96a48d7d` | Basic Instrumentation CE course draft (files only, not registered). |
| #260 | closed | | Superseded by #264 and the section-photos work. |
| #261 | merged | | Activated four foundation courses and refreshed ten applied courses. |

## Merge order

The owner approved this order. Merge a step only when `validate` has passed on the exact head SHA you are merging, and pass that SHA as `expectedHeadSha`.

1. **#264 at `3bbb1997`.** Merge only if `validate` is green on that SHA. An earlier head (`412d50e4`) failed, and that failure does not apply to `3bbb1997`.
2. **#262.** Checked with `git merge-tree`: it merges cleanly onto `main` and onto the #264 head. Recheck after step 1 lands.
3. **Section photos.** Do not merge `claude/ce-course-photos-2` as it is. Checked with `git merge-tree`:
   - The branch as a whole merges cleanly onto `main`, but it conflicts with #262 in four course files: `ceu-coagulation-filtration.json`, `ceu-instrumentation-scada.json`, `ceu-sampling-data-quality.json` and `ceu-wastewater-treatment-process-control.json`.
   - Recommended route: after step 2 lands, make a new branch from `origin/main`, cherry-pick only `387c77c4`, and resolve the four course files by hand. Keep the #262 photo-two figure and add the section figure next to it. Run the CE tests, then open the PR.
   - Only open that PR when the owner asks for it.

## CI and checks

- `validate` takes about 20 to 25 minutes. It runs `prototypes/ui-ux-preview/foundations.spec.ts` against a Vite preview server.
- The preview server must serve `client/public`. `prototypes/ui-ux-preview/vite.config.ts` sets `publicDir` for this (commit `3bbb1997`). Without it, all eight foundations tests failed.
- `prototypes/ui-ux-preview/mediaFixture.ts` only routes `**/manus-storage/**`. If a spec starts relying on `/ceu-covers` images, the fixture needs to allow those requests too.
- `scripts/test-safety.cjs` blocks local end-to-end runs in this sandbox. Do not bypass it. Verify with local browser checks instead, and say in the report that the e2e suite was not run locally.
- To run the app locally, placeholder values are needed for `JWT_SECRET`, `DATABASE_URL`, `STRIPE_SECRET_KEY`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL` and `VITE_APP_ID`.

## Production checks for Manus or the owner

- **Team enrolment emails (seat assignment).** Read from the code, not from production logs:
  - `assignSeat` in `server/routers/orgRouter.ts` saves the seat, then `deliverEnrollment` sends the email.
  - `sendTeamEnrollmentEmail` in `server/email.ts` throws when SMTP is not configured outside production.
  - The org dashboard shows "enrollment failed" with a Resend option.
  - Production refuses to start without `SMTP_HOST`, `SMTP_USER` and `SMTP_PASS` (`server/_core/env.ts`, which exits with status 1). So SMTP is probably configured, and the failure is more likely at send time. Check the server logs for the enrolment failure and the mail provider's rejection or bounce records before changing code.
  - A team client still needs to assign seats in the team dashboard. The owner has not decided on a reply.
- **Gemini image route.** The owner should check the key for the native image route. It returned 401 earlier, so it was not used further.
- **Nova Scotia gate.** `createCheckoutSession` in `server/routers/stripeRouter.ts` uses the signed-in user's province, and falls back to the province in the input. A referrer-based change was tested and rejected, because `funnelCheckout.test.ts` depends on the current behaviour. Do not change it without an owner decision.
- **Basic Safety.** The owner should look at the deployed course after #264 lands: photos, slide space and the chemicals table on a phone.

## Open product work, in order

1. **Basic Hydraulics:** add section photos. Two answer options still contain banned words. Run the lint and fix them.
2. **Basic Math:** add section photos.
3. **Manager Essentials (#263):** add two more SVG diagrams (target five). Then run a second planted-error review after the fixes. The owner decides whether it is registered.
4. **Supervisor Essentials (#259):** same as Manager Essentials, after the owner's decision on the manager course.
5. **Foundation courses, one at a time, in this order:** Water Treatment Concepts, Wastewater Treatment Concepts, Preliminary and Primary Treatment, Sludge Thickening, Sludge Digestion, Sludge Dewatering, Lift Stations Overview, Effluent Filtration, Reverse Osmosis, Lime Softening, Chloramines in Drinking Water, Fluoride in Drinking Water.
6. **Live courses:** add diagrams and photos only where they help a learner, and check each one against the section it sits under.
7. **Owner items from the earlier handoff:**
   - The weekly manager summary email (idea 2). Not started.
   - US organisations and municipalities support (idea 6). Write up what it needs, and get an explicit go-ahead before touching pricing, checkout or entitlements.
   - State approvals research. Research only. Submit nothing.
   - Exam banks, from `docs/us-launch/US_BANK_QUEUE_2026-11-16.md`.

## Method for every course or course change

1. Read the Royce U equivalent first, from public pages only. Do not copy their text, questions, examples or images. Write a gap report in `docs/handoff/gap-reports/`, and a brief in `docs/handoff/course-briefs/`.
2. Draft in `content/ceu-drafts/`. The draft is not live until the owner asks for it.
3. Lint before review:
   - No banned words in answer options (always, never, only, all, every, none, cannot, completely, entirely, solely).
   - Longest correct answer at most 34% per answer position, and at most 50% on finals and alternates (`server/ceu/catalogue.test.ts`).
   - Four options per question, unique ids and unique prompts.
4. Planted-error review: plant known errors, then send the course to three reviewer models from different providers plus one Opus agent. Apply the real findings, and record anything left over in `REVIEW-RESULT.md`. The scripts are in `docs/handoff/tools/`.
5. Photos and diagrams:
   - Generate, then look at every image. Reject any image that does not match its section or shows an unsafe position. Examples from this session: a lockout with no padlock visible, a worker kneeling at a vault opening, a worker on an elevated tank rail, a worker kneeling at a river edge.
   - Name files `<courseKey>-<name>.jpg` in `client/public/ceu-covers/`.
   - Alt text and captions describe what is actually shown.
6. Visual check before handing over: screenshots of the lesson pages at phone width and desktop width. Look for broken images, empty slide space, clipped tables and thin slides.

## Ideas not yet built

- A check that every image path in `server/ceu/courses/*.json` resolves to a file in `client/public/ceu-covers/`. This would have caught the broken-image problem earlier. It could run in `validate`.
- A check that every figure has alt text and a caption.
- A slide-space check that flags a section which renders as a figure alone, or a slide with very little text next to an image. The slide splitter makes a new slide at every `###` heading, so these create thin slides.
- A phone-width screenshot test of one CE lesson page as part of `validate`.

## What was not verified

- The end-to-end suite was not run locally, because of the test-safety guard. The only automated run is `validate` on the PR.
- The visual checks were done in a local browser against a local server.
- The section-photo merge test used `git merge-tree`. It shows whether the changes conflict, not whether the courses render correctly.
