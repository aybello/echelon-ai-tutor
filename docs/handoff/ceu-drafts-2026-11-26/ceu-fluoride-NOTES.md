# NOTES: ceu-fluoride (Fluoride in Drinking Water for Operators)

Draft 2026-11-26, version 2026-11-26.1. Built by `fluoride-build/` scripts in the scratchpad (build.py, qs.py, ov.py, figs.py, validate.py, recompute.py). Not registered, not committed.

## Structure
- 4 modules (what-and-why, chemicals-feeders, feed-rate-math, monitoring-safety), 6 checks each (24), 5 finals and 5 alternates each (20 and 20), 4 choices, ids ceu-fluoride-<module>-c1/f1/a1.
- Lessons 1,321 to 1,656 words including captions (hard cap 1,700), at least 4 `###` headings each, worked or scenario example in each.
- 7 original inline SVG figures (M1 2, M2 2, M3 2, M4 1), each under 3 KB, no style attributes, rendered at 390 px with Playwright and viewed (fixed a misleading liquid-level line in the feed-line figure).
- Correct positions: checks 6/6/6/6, finals 5/5/5/5, alternates 5/5/5/5. Correct option never strictly longest; banned words absent from options (validate.py).
- stream is 'drinking_water' (the schema allows one value; it is shared with wastewater).

## Constants used (stated in each question)
8.34 lb/gal; 1 mg/L = 1 ppm; 1 MGD = 1,000,000 gpd; 1,440 min/day; 3,785 mL/gal; 454 g/lb; atomic weights Na 22.99, Si 28.09, F 19.00; AFI NaF 0.45, Na2SiF6 0.607, FSA 0.792; purity 0.98 and 0.985 (dry), strength 0.23 (acid); acid weight 9.94 lb/gal; NaF solubility 4.0 g/100 mL; saturated solution 18,000 mg/L fluoride ion. All target doses and natural levels in the course are exercise inputs, not rules.

## Scope limits applied
No target level, primary or secondary limit, exposure limit, hardness limit, EBCT or test pressure is stated as a number. Safety is at recognition and purpose level: no PPE lists, spill, first-aid or overfeed action steps. The facility procedure and the applicable rule govern. All people and plants are fictional.

## California scope check
ca-treat.txt lists fluoridation items at grade T4 only (chemicals, chemistry, optimal level range, health effects) and Fluoride Analysis with an ion-specific electrode at T4. The course covers each at concept level; it states no range as a number.

## Sources
Spellman HB 2009 (sp6), Spellman Waterworks Vol 1 (sp3), Water Treatment Plant Operation Vol 2 1988 (wtp2), Water Quality Control Handbook (wqc), CDC about page and CDC engineering page (both curl 200 on 2026-11-26; content not verified, so neither is cited by a module after review). Books have no URL; the CeuSource type requires url, so those entries omit it (same as wef-mop11 in the sludge model). Owner decision pending. https://www.cdc.gov/fluoridation/ returned 200 but its engineering page only lists CDC trainings; no limits taken from it.

## SOURCECHECK totals
SUPPORTED 68, CONTRADICTED 0, NOT COVERED 14 of 82 claims (see ceu-fluoride-SOURCECHECK.md).

## Royce gap check
Royce `fdwp`, 269 slides read. Topics 35: before YES 16 PART 13 NO 6; after YES 27 PART 5 NO 3. Full table in gap-report-fluoride.md. Gap fill added wtp2 content (see gap report). Declined: all numbers, emergency steps, spill and first-aid steps, retention claims.

## Unsure
- Some M2 and M4 statements (anti-siphon valve, overfeed causes, separate storage, mid-range pump sizing) rest on the Royce topic list or general practice and are NOT COVERED by the books; kept at recognition or purpose level and flagged in SOURCECHECK.
- The mechanism of fluoride in teeth and the Colorado history are not in the books.
- Second-model review: GPT Sol 6.2 (gpt-6.2-sol) ran three rounds. Gemini neon did NOT review this course (no Gemini credential here). See ceu-fluoride-REVIEW-RESULT.md.

## Review rounds (2026-11-26)
- Three GPT Sol 6.2 rounds with planted errors, triage and fixes. Backup of the pre-review draft: ceu-fluoride.pre-review.json. Round outputs in review/fluoride/round1..3 in the scratchpad.
- Edits applied in apply_r1_fixes.py, apply_r2_fixes.py and apply_r3_fixes.py (same folder). Round 3 fixes were NOT sent to a fourth review (three-round limit).
- Revalidation: validate_fluoride.py, 49 checks, 0 failures (validation-final.txt).
- Module citations: cdc-about and cdc-eng removed from module sourceIds because their content was not verified.
- Numeric answers recomputed with python -I (review/fluoride, inline checks); finals f3, f4, f5, a2, a4, a5 and checks chem c4 and feed c4 match.
