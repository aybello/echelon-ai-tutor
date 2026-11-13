# CEU and formula audit repairs — 27 September 2026

Base: `56bf04e72114ab59acf06eac6ddaee1a6b1468b8`.

## Learner behavior

- The self-paced path remains overview → lessons → final → results → certificate. No instructor review or minimum-time gate is added.
- Next and sidebar navigation save before changing the visible slide. Future slides beyond the next available position are disabled for saved learners. Earlier slides remain reviewable. A separate resume cursor preserves the latest viewed slide without erasing the visited frontier.
- A failed save leaves the learner on the current slide. Repeating a committed slide, module, final draft or exam request after a lost response is safe. Server revision checks still reject conflicting updates.
- Both existing quick checks are shown, with independent feedback. They are optional.
- Public assessment preview contains lesson-check samples. Graded final items are separate. Each new attempt is issued server-side, with stable randomized item/option order and the same two-item-per-module coverage. CT draws eight items from a sixteen-item pool. Other courses currently use their existing eight- or twelve-item pools with randomized order; this is not a claim of alternate questions for every course.
- Existing saved final drafts and completed results without manifests retain the original question ordering. Original final-item IDs, wording and keys were preserved. New attempts retain their manifest for grading and results.
- CT lessons now include hydraulic sensitivities, a sourced table lookup, segment calculations, worked case solutions and an operational handover example.
- The catalogue now matches the delivered completion rules. Unvalidated 3/4/10-hour planning estimates no longer appear as learner duration or certificate claims. Historical internal planning metadata is retained. A timed pilot and any regulatory approval remain outstanding; this release does not award approved CEUs or contact hours.
- Optional feedback is available after the final. Feedback cannot change a certificate or grade.

## Formula corrections and evidence

Reviewed source guidance on 27 September 2026:

- [Ontario disinfection procedure](https://www.ontario.ca/page/procedure-disinfection-drinking-water-ontario): surface-water/GUDI overall minimum treatment, organism-specific credits and condition-specific CT selection. Corrected the universal CT=6 Giardia claim and the blanket 4-log Giardia/virus UV claims, including duplicated formula sheets.
- [O. Reg. 170/03](https://www.ontario.ca/laws/regulation/030170), Schedule 16, and [Ontario owner/operator guidance](https://www.ontario.ca/page/providing-safe-drinking-water-public-guide-owners-and-operators-non-municipal-year-round-residential): immediate reporting is separate from written notice within 24 hours. Corrected the WQA and WPI pages as well as the main sheet. Ontario examples on WPI pages do not purport to establish other provinces' deadlines.
- [Health Canada Appendix A](https://www.canada.ca/en/health-canada/services/publications/healthy-living/guidelines-canadian-drinking-water-quality-guideline-technical-document-enteric-protozoa-giardia-cryptosporidium/page-11-guidelines-canadian-drinking-water-quality-guideline-technical-document-enteric-protozoa-giardia-cryptosporidium.html), Table A.4: free chlorine 0.8 mg/L, 15°C, 3-log Giardia gives CT 73 at pH 7 and 105 at pH 8. The course labels this a technical table-reading example, not a universal facility requirement.
- Chemical feed example now distinguishes mass fraction, solution mass and density-based solution volume. Pump power labels distinguish W and kW. Generic turbidity, operator-role and record-retention claims were replaced with the applicable process/role/record-category distinctions.

This is a targeted correction of the identified errors and their duplicates, not certification of every formula or question bank.

## Expanded formula-sheet safety correction — 28 September 2026

- Extended the same protection to the Ontario Class 1–4 water and wastewater formula sheets and the related Western Canada water and wastewater sheets. The review removed unsupported universal values for CT, UV dose, turbidity, residuals, log credits, biosolids controls, effluent limits, and operator coverage.
- Drinking-water sheets now direct learners to the applicable procedure, source-water category, approved treatment credit, facility approval, and condition-specific table. Wastewater sheets now direct learners to the Environmental Compliance Approval or permit instead of importing drinking-water limits or inferring a limit from plant class.
- The Ontario adverse-result wording now consistently distinguishes immediate calls from the written notice due within 24 hours after the immediate report. The regression test scans all corrected sheets for the known unsafe phrases and cross-domain limit mixing.
- The repair deliberately preserves unit-conversion and calculation practice. It removes only claims that could cause a learner to treat an unverified number as a universal regulatory requirement.

## Measurement

Admin Insights now exposes a separate CEU panel using persisted course records for enrollments, lesson starts, completed modules, finals opened/submitted, retakes, passes, certificate views and ratings. The cohort is course editions enrolled in the last 30 days; it is not a unique-person count. Counts are read with keyset pagination rather than a silently truncated sample. No learner names, operator IDs or comments leave the aggregate endpoint.

Certificate views are available only from this release onward. Browser views, failed network requests, certificate download success and reliable active learning duration are not inferred from these records. Those remain separate instrumentation work. A print dialog opening is not treated as proof of a downloaded certificate.

## Release and recovery

No schema migration, customer import or production data edit is included. Existing course versions and completed certificates remain available. Deploy the new frontend and backend together. A rollback must retain the manifest-aware assessment reader/grader: an older server that ignores manifests must not grade newly shuffled attempts. If necessary, pause new finals while reverting presentation-only changes.

Run the existing Quality Gate, including `server/ceuLearning.integration.test.ts` and `e2e/ceu-learning.spec.ts`. The browser journey now checks blocked forward skipping, a failed lesson save, a failed exam save and shuffled answer selection before certificate issuance.

Local verification: both TypeScript projects, 32 focused tests and production build. The wider deterministic suite passed 1,409 tests with one import-time timeout; that Teams test file passed all 25 tests when rerun with the same test environment and lower concurrency. Full CI database/browser validation remains required; this workspace has no disposable MySQL, and the Playwright browser download returned an invalid archive. No authenticated customer or production mutation was used for testing.
