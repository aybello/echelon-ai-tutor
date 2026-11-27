# Manus: deploy the nine new CEU courses (staged, not merged)

Owner instruction: prepare a pull request against `main`. Do not merge, and do not deploy to production, until the owner approves in writing.

Read first: `docs/handoff/CEU-COURSE-BUILD-RUNBOOK.md` and `docs/handoff/ceu-drafts-2026-11-26/README.md`.

## Source
Branch `claude/hello-5oz7m4`, folder `docs/handoff/ceu-drafts-2026-11-26/` (commit `69b45fc81` or later).
Course files: `ceu-sludge-thickening`, `ceu-sludge-digestion`, `ceu-sludge-dewatering`, `ceu-lift-stations`, `ceu-effluent-filtration`, `ceu-reverse-osmosis`, `ceu-lime-softening`, `ceu-fluoride`, `ceu-chloramines` (`.json`). Each has `-NOTES.md`, `-SOURCECHECK.md`, `-REVIEW-RESULT.md`, and a `gap-report-<course>.md`.

## Blockers: do these first, and stop if any is open
1. **Book sources have no `url`.** The `CeuSource` type requires one. Do not invent URLs. Wait for the owner's decision: (a) make `url` optional in the type and the importer, or (b) an agreed publisher page per book. Until then, do not add these courses to the catalogue.
2. **Gemini review is missing for all nine.** Only GPT Sol 6.2 reviewed them. Record this on the PR. Do not claim a Gemini review.
3. **Owner has not approved publication.** Stop at the open PR.

## Steps (after the blocker is resolved)
1. Create a branch from `main`, for example `manus/ceu-nine-courses`.
2. Copy each course JSON to `server/ceu/courses/`, using the same file names.
3. Add a catalogue entry for each course to `shared/ceuCatalogueData.json`, following the existing entries. Use the `group` value the owner chooses (`applied` or `foundations`). The catalogue currently has 19 entries, so it will have 28. Keep `plannedContactHours` at 4 (240 minutes) unless the owner says otherwise.
4. Covers: none exist yet for these nine. Create them from the brief, one 16:9 JPEG per course, using the existing cover style in `content/ceu-drafts/covers/`. Upload to managed media the same way the existing course covers are served. Do not use `/ceu-covers/` paths in catalogue data (the managed-media rule rejects them).
5. Re-baseline managed media: follow the same steps as the two foundation courses (`server/ceu/managedMedia.test.ts`, `server/ceu/fixtures/managed-media-baseline-7f604509.json`). Record the old and new digest in the PR.
6. Run the CEU tests: `server/ceu/*` and `shared/ceuCourses.test.ts`, plus any catalogue test. Use the repo's test wrapper, not a bare vitest command. All must pass. Paste results into the PR.
7. Check that each course's activity minutes sum to `plannedMinutes` (240), that the last activity of the last module mentions "final assessment", and that every `sourceIds` entry exists in `sources`.
8. Open a PR against `main`. Title: "CEU: add nine staged courses (not published)". The body must list: each course and its review status (Sol 6.2 done; Gemini not done), the URL decision, the cover and baseline changes, test results, and "do not merge without owner approval".

## Do not
- Do not merge the PR, deploy, or change any learner-facing progress or certificate data.
- Do not change the existing 19 course files or their question IDs.
- Do not change pricing, access, or entitlement code.
- Do not add the Lime Softening, Fluoride or Chloramines courses to a public list until the owner says so. Mark them as draft in the PR body.

## Report back
Reply with the PR link, test results, the covers you produced, and anything that failed or that you could not do.
