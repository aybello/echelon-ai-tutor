# Handoff to Manus: publish the two CEU foundation courses

Owner decisions (2026-11-21): Manus does both tasks below. Claude does source checks, section photos and the remaining courses.

## Branch and state
- Publish branch: `claude/ceu-two-foundation-courses` (head `0bf4a995`), adds Water Treatment Concepts and Wastewater Treatment Concepts to the catalogue (17 -> 19 courses).
- Course JSON: `server/ceu/courses/ceu-water-treatment-concepts.json` and `ceu-wastewater-treatment-concepts.json`. Drafts also live in `content/ceu-drafts/`.
- Catalogue entries were appended without covers on purpose: the managed-media rule rejects `/ceu-covers/` paths in catalogue data.
- With the two courses registered, exactly one test fails: the managed-media byte baseline.

## Task 1: re-baseline managed media
1. Check out `claude/ceu-two-foundation-courses`.
2. Run the managed-media test (`server/ceu/managedMedia.test.ts`) and confirm the only failure is the byte baseline.
3. Regenerate `server/ceu/fixtures/managed-media-baseline-7f604509.json` and update its pinned digest (currently begins `d943ba96`). Put the old and new digest and a short diff summary in the pull request description. Change nothing else in that fixture.
4. Run the full CEU tests (`server/ceu/*`, `shared/ceuCourses.test.ts`) and confirm they pass.

## Task 2: upload the covers to managed media
Cover images (2 MB each) are in this folder: `docs/handoff/ceu-two-courses-covers/`
- `ceu-water-treatment-concepts-cover.png`
- `ceu-wastewater-treatment-concepts-cover.png`

Upload both to managed media the same way the existing course covers are served, set each course's cover in `shared/ceuCatalogueData.json` to the managed URL, and re-run Task 1 step 3 if the baseline changes again.
Do not run `scripts/ceu/generateCatalogue.mjs` blindly: its covers map still holds old Manus URLs and would change the other 17 entries.

## Then
Open the pull request against `main`. Claude will add source checks and section photos on top.
