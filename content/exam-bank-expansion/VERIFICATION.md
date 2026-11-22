# Exam-Bank Expansion: Verification

Build: 200 new exam questions for each of the 35 in-scope course keys from the game-content build (electrician-309a excluded). **7,000 new items total.** All checks below were run centrally by the coordinator on the finished set, after every batch and every repair had landed, on Sun Nov 22, 2026. Tooling lives in `tools/` in this folder (`validate.py`, `verify_calcs.py`, `dedup.py`, `assemble.py`, `courses_data.py`, `gen_specs.py`).

## 1. Schema validation

Tool: `tools/validate.py`, run over all 35 courses against each course's own bank schema.

Each course's additions were authored to the exact field set of its existing bank. Four schema variants exist across the banks and each course was validated against its own variant:

- **oit** (oit, oit-ww): the OIT field set, including stream, formula (empty string for conceptual items), blueprintObjective, and reviewStatus "unreviewed". OIT calculation items carry their verification expression only in the verify file, matching the bank.
- **treat** (class1-water, class1-ww, all class2/3/4 water and wastewater-treatment courses, all WPI water and wastewater-treatment courses, wqa): the class1-treatment field set; calculation items add formula, expression, expected, decimalPlaces, unit, steps, and tip.
- **net** (all distribution and collection courses except class3-water-dist): the class1-networks field set; calculation items add formula, calculationExpression, decimalPlaces, unit, and steps, with no in-item expected field, matching the bank.
- **cand** (class3-water-dist only): the candidate-bank field set. No itemId, no optionA-D fields, no correctAnswer field; calculation items carry a calculationCheck object and steps, with reviewStatus "in_review".

The validator checks field presence and types, option and answer consistency, correctIndex spread (no answer position above 40 percent), the difficulty pattern (conceptual items 1-10 easy, 11-30 medium, 31-40 hard; calculations 41-45 medium, 46-50 hard per batch), and the ban on em dashes in authored fields (question, options, correctAnswer, explanation, topic, formula, steps). Source title and source reference fields are bank-verbatim metadata and are exempt from the em dash check, because several existing bank titles contain one and had to be preserved exactly for schema fidelity.

**Result: 0 errors, 0 warnings on all 35 courses.**

## 2. Calculation verification

Tool: `tools/verify_calcs.py`. Every calculation item carries a record in its batch's `batch-N.verify.json` file: the item id, an arithmetic-only expression (pi written as 3.1416), the expected value, decimal places, and unit. The verifier recomputes each expression in exact rational arithmetic (Python `Fraction`, no floating point), rounds to the stated decimal places, and cross-checks the result against the verify record, the item's own expected and correctAnswer fields where the schema carries them, and the correct option text.

**Result: 1,400 calculation records checked (40 per course x 35 courses), 0 problems.**

## 3. Deduplication

Tool: `tools/dedup.py`. Four checks, run per course:

1. **Exact duplicates**: normalized question stems (lowercased, punctuation and whitespace collapsed) compared against the course's existing bank and within the new set.
2. **Near duplicates**: stems with all numbers masked out, compared by token Jaccard similarity at a 0.85 threshold, against the existing bank and within the new set. This catches the same question restated with different numbers.
3. **Expression duplicates**: calculation expressions compared across the new set and the existing bank.
4. **Cross-set check**: the oit and oit-ww additions both target the shared OIT wastewater bank, so their wastewater items were also checked against each other.

The first central run flagged 34 masked near-duplicates and 7 expression duplicates, all of them calculation items whose stems repeated an earlier item's structure with different numbers. No flag was an exact duplicate and no near-duplicate flag was against an existing bank stem. Every flagged item (the later one of each pair) was replaced in place with a genuinely different scenario on the same topic, preserving its itemId, questionNum, topic, module, difficulty, and calculation type, with a new expression and new distractors. The full check suite was then re-run centrally as the final step, so `tools/dedup-report.json` holds the complete 35-course report.

**Final result: exact 0, near 0, expression 0, cross-set 0 on every course. Total hard duplicates: 0.**

### Dedup limitation, stated honestly

Eleven courses had their existing bank available in the local clone, and for those the dedup ran against the real bank (oit 972 existing items, oit-ww 483, the four class1 banks and four class2 banks and class3-water-dist at 250 each). For the other 24 courses (class3-water, class4-water, class3-ww, class4-ww, class4-water-dist, class3-wastewater-coll, class4-wastewater-coll, wqa, and all 16 WPI courses) no bank exists in the local clone, so dedup against the live bank could not be run locally. For those courses, within-set deduplication (all four checks across the 200 new items) plus strict per-batch topic separation were used instead. A dedup pass against the live banks should be run at merge time for those 24 courses.

## 4. Assembly

Tool: `tools/assemble.py` merged each course's four batches into its addition file(s): `additions.json` (200 items) for 33 courses, `additions-water.json` (100) plus `additions-wastewater.json` (100) for oit, and `additions-wastewater.json` (200) for oit-ww. An independent count of the assembled files confirms **7,000 items**.

## 5. Release-law compliance

Per the Manus release rules (`~/workspace/echelon/release-path-rules-2026-11-22.md`): this build is content-only additions in a staging folder. No repo bank was modified, nothing was pushed, no existing content was regenerated or overwritten, no review receipts were created, renamed, or altered, and no pricing, checkout, entitlement, scoring, or employer-routing behavior was touched. These files are not deployable as they stand; the merge, registry, and live-verification steps in the release rules still apply when father decides to release them.

## 6. Review level

**These 7,000 questions are AI-authored and mechanically verified only. They have NOT been human-reviewed, NOT reviewed by a subject-matter expert, and are NOT endorsed by any exam board or regulator (including OWWCO, EOCP, or WPI/ABC).** The mechanical verification proves schema conformity, internal consistency, arithmetic correctness, and freedom from duplicates within the limits stated above. It does not prove that any individual question is technically correct, unambiguous, or exam-appropriate. A human review pass is required before any of this content is released to learners.
