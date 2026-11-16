# Request for Manus: apply the exam question review

Written from the review in `docs/exam-bank-review/RESULTS.md`. Nothing below has been applied, and the review session never writes to the database.

## What to apply, in order

1. **Broken items first.** Questions whose text and answers do not match, or whose steps belong to another question. These are visible faults. Filter `corrections.json` for notes mentioning "options are", "steps belong", "copied" or "do not match". The western `wpi-class1-wastewater`, `wpi-class2-wastewater` and `wpi-class2-water-dist` banks hold most of them.
2. **Wrong keys and wrong arithmetic** (`verdict: WRONG`), especially the calculation block numbered in the 240,000s.
3. **Jurisdiction and units** (`JURISDICTION`, `UNITS`).
4. **Unclear items** (`UNCLEAR`) at your discretion; many have a fix that rewrites the stem to one defensible reading.

## How

- Each finding has `id`, `bankKey`, `questionNum` and a full corrected `fix` (question, four options, `correctIndex`, explanation, `steps`). Match on `id` (the `questions` table primary key in the export).
- **Delete 34 questions** (`delete-list.json`, also `replacement: true` in `corrections.json`): these could not be repaired. Delete these rows by `id`. Their new replacement questions are in `replacements.json` (`fix` field); add them as new rows if you want to keep the bank size, or skip them if you only want the deletions.
- Where a question appears in several banks (176 appear in two, 17 in three), apply the fix to every copy; each copy has its own finding.
- Before applying, check the items in `needs-source-check.txt` against the current regulation or guideline. If you cannot, hold those items.
- Read and decide on the 144 candidates in `units-unflagged-candidates.json`.
- Keep the question-governance and receipt path you use for other content. The review did not touch any file with a hash or receipt.

## Not asked

No migration, no environment flag, no release gate change and no pricing or access change.

## Already checked

A random sample of 63 fixes was independently re-checked: all 59 real fixes were correct, and 4 deliberately broken ones were caught (see "Spot-check of the fixes" in `RESULTS.md`). No further spot-check is needed before applying. The one exception is the items in `needs-source-check.txt`, which rest on figures nobody confirmed: hold those, and apply the rest.
