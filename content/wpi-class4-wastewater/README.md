# WPI Class IV Wastewater — audit checkpoint, not a release

Received September 11, 2026: 657 production questions from Manus's complete
content-only export, with unique row IDs and question numbers. The row checksum
matches `043fced6fbc3878a58070bc691255ab0c875421bc83d299ee2b36fa5c5321857`.

## Completed at this checkpoint

- Validated full export scope, count, identity uniqueness and checksum.
- Recomputed 111 numerical cases using Decimal arithmetic and independently
  checked the declared answers using JavaScript arithmetic.
- Wrote 131 candidate repairs: 111 numerical items and 20 process/regulatory
  items. Rebuilt numeric options with consistent units and distinct values;
  removed leaked old repair commentary. Some updates clarify assumptions or
  change the question's meaning and must not silently reinterpret saved history.
- Preserved row IDs, question numbers, bank key, status and correct-index positions.
- Kept the complete original before-image for each candidate so an importer can
  reject concurrent changes rather than overwrite them.
- Created an explicit ledger for all 657 questions. Every row still has a pending
  full editorial-review status; candidate repairs are not full release approval.

Concrete defects corrected include SOTE/SOTR confusion (#4), methane/COD basis
(#58), WSER enabling Act (#120), absent correct SRT/substrate answers (#503/#506),
power versus energy (#521), omitted RAS in solids loading (#524), incorrect annual
arithmetic (#542/#551), incorrect Monod substitution (#565/#568), inconsistent
US/metric loading units (#580), invented WAS flow (#587), hydroxide equivalent
weight (#590), impossible annual pump hours (#604), missing ferric-dose answer
(#617), US Class B pathogen requirements (#636), unphysical diffuser extrapolation
(#646) and wire-to-water versus pump-only efficiency (#649).

## Remaining work — do not report completion

No new expansion questions have been authored in this checkpoint. Full editorial,
source, blueprint, duplicate, distractor and difficulty review remains outstanding.
After these candidate edits, the mechanical length screen flags 476 items where
correct-option word count is at least twice that of the longest distractor and
at least 12 words. This screen identifies review candidates, not 476 independently
proven factual errors. A further 125 rows trigger a jurisdiction/standard-source
screen; these sets overlap.

The Manitoba criteria edition applicable to the actual sitting is still not
confirmed. Do not claim automatic adoption of WPI's newest publication. Do not
turn that uncertainty into a reason to stop correcting independently verifiable
technical errors. Continue the existing-bank repair before the 250 additions.

## Reproduce locally

```sh
python scripts/build-wpi-class4-repairs.py
node --test tests/content/wpi-class4-repairs.test.mjs
```

The five tests include checks across all 111 declared numerical cases and every
candidate before/after record. These are content-package tests, not production
browser testing or an independent subject-matter certification. Numerical
alternatives still need final distractor-quality review; arithmetic correctness
alone does not make a strong Class IV examination item.

## Manus handoff

Do not run this checkpoint as an import or merge/deploy it as a content release.
There is intentionally no database-writing command. For a later controlled
release, reconcile the complete fresh bank with the before-images, retain a
verified backup, and apply a precise reviewed worklist atomically. Any mismatch
must abort that candidate update. No deletion, reinsertion, renumbering, status
promotion or global regrading is authorized by these files.

Retaining IDs is necessary but not sufficient to protect history. Existing
issued mock snapshots and their stored answers/scores must remain immutable;
review whether cached question versions and old attempts render against live
question text before release. Drain/version active sessions as appropriate and
verify the active operator's progress after the controlled release. Never rewrite
past scores from the new key/content without a separate explicit correction plan.

## Direct source checks used in this checkpoint

- WSER enabling Act and regulatory scope:
  https://laws-lois.justice.gc.ca/eng/regulations/SOR-2012-139/FullText.html
- US pathogen alternatives, explicitly distinguished from Manitoba requirements:
  https://www.ecfr.gov/current/title-40/chapter-I/subchapter-O/part-503/subpart-D/section-503.32
- WPI current criteria index (not proof of Manitoba adoption):
  https://gowpi.org/services/2025-need-to-know-criteria/

Checked September 11, 2026. Other process corrections are engineering review
candidates; a complete item-level supporting-source audit is not claimed. The
methane correction derives its result from balanced stoichiometry and the molar
gas volume explicitly supplied in the question.
