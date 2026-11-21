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

## Task 3: upload the module photos (added later)
One AI-generated illustrative photo per module, 1400 px wide JPEG (about 200-390 KB), in `docs/handoff/ceu-two-courses-photos/`. Upload each to managed media the same way as the Basic Safety lesson photos (`/manus-storage/<name>_<hash>.jpg`) and reply with the final URLs. Claude then adds them to the lessons. Re-run the managed-media baseline step if it changes.

| File | Module | Alt text |
|---|---|---|
| water-1-source-and-train.jpg | Water 1 | A municipal water treatment plant intake on a calm river, with a concrete intake structure and screens. |
| water-2-coagulation-sedimentation.jpg | Water 2 | A sedimentation basin at a water treatment plant, with a rapid-mix chamber at the inlet and a visible floc blanket near the inflow. |
| water-3-filtration-disinfection.jpg | Water 3 | A filter gallery in a water treatment plant, with water above a clean filter bed and pipe gallery valves beyond. |
| water-4-monitoring-records.jpg | Water 4 | A plant operator holding a handheld meter while a sample is drawn from a tap, with a logbook on the bench. |
| wastewater-1-characteristics-and-train.jpg | Wastewater 1 | A municipal wastewater treatment plant from above, with clarifiers, aeration basins and an operations building. |
| wastewater-2-preliminary-and-primary.jpg | Wastewater 2 | A mechanical bar screen holding captured debris beside a grit channel at a wastewater plant headworks. |
| wastewater-3-activated-sludge-basics.jpg | Wastewater 3 | An aeration basin at a wastewater plant, with air mixing the brown mixed liquor. |
| wastewater-4-effluent-monitoring-records.jpg | Wastewater 4 | A wastewater effluent sampling station with an automatic composite sampler and a sample bottle, with the discharge channel behind. |

Captions should say "Illustrative image".
