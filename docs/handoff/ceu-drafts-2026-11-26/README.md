# Nine new CEU course drafts (2026-11-26/27)

For Manus. Read `docs/handoff/CEU-COURSE-BUILD-RUNBOOK.md` first. These are drafts only: nothing here is registered in any catalogue, and nothing is published. Do not merge to `main` without the owner's approval.

| Course key | Draft JSON | Sol 6.2 review | Gemini review |
|---|---|---|---|
| ceu-sludge-thickening | ceu-sludge-thickening.json | Done (3 rounds) | Not done |
| ceu-sludge-digestion | ceu-sludge-digestion.json | Done (3 rounds) | Not done |
| ceu-sludge-dewatering | ceu-sludge-dewatering.json | Done (3 rounds) | Not done |
| ceu-lift-stations | ceu-lift-stations.json | Done (3 rounds) | Not done |
| ceu-effluent-filtration | ceu-effluent-filtration.json | Done (3 rounds) | Not done |
| ceu-reverse-osmosis | ceu-reverse-osmosis.json | Done (3 rounds) | Not done |
| ceu-lime-softening | ceu-lime-softening.json | Done (3 rounds) | Not done |
| ceu-fluoride | ceu-fluoride.json | Done (3 rounds) | Not done |
| ceu-chloramines | ceu-chloramines.json | Done (3 rounds) | Not done |

Each course has: `-NOTES.md` (sources, counts, constants), `-SOURCECHECK.md` (claim-by-claim textbook check), `-REVIEW-RESULT.md` (second-model review record), and `gap-report-<course>.md` (Royce U topic comparison, original wording only).

## Open items for the owner and Manus
1. **Gemini review.** Not run: no Gemini credential in the build environment. Each record says so.
2. **Web links for book sources.** The course source type requires a `url`. Textbook sources have none and none was invented. Owner decision: make `url` optional, or use an agreed publisher page.
3. **Round-3 review fixes** were not re-reviewed in most courses. Each review record lists them.
4. **Length.** Some lessons are above the 1,200 to 1,500 word target (up to 1,700 including captions). Trim or accept.
5. **Figures.** Each course has five or more original inline SVGs. Re-render on the final build before publishing.
6. **Publishing.** Publishing goes through Manus: course JSON under `server/ceu/courses/`, catalogue entry, managed covers and photos, managed-media baseline, then a PR to `main`.
