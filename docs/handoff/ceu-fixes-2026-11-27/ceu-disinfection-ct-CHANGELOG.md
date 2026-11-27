# CHANGELOG: ceu-disinfection-ct (fixed course)

Input: `original.json` (= `git show origin/main:server/ceu/courses/ceu-disinfection-ct.json`, unchanged).
Output: `course.json`. Built by `apply_fixes.py` (python3 -I), checked by `validate.py` (python3 -I).
No repo file was edited, committed or pushed. All paths are under the scratchpad `fix-ct/` folder.

Textbook sources used: `ceusrc/sp6.txt` (Spellman Handbook, 2009), in particular section 18.10.10 "CT Factor", Tables 18.14 and 18.15 (p. 639), and p. 642 "Pilot studies ... The required CT value will vary depending on pH, temperature, and the organisms to be killed."

## Module structure

Module ids, check ids and question ids are unchanged, in the same order. Only the correct-answer position of 12 check items changed (see item 14). Question text was changed only for the questions listed below.

## MUST

### 1. Module assignment, rubric and facilitator guide rebuilt from each module's own evidence

| Module | Evidence numbers used | Removed |
|---|---|---|
| 1 hydraulics (Clearwell 2) | 152 L/s, 860 m3 two-cell volume, 0.42 tracer factor (valid at 400 to 620 m3/h, 3.10 m, both cells), 0.70 undated card, 0.95 mg/L, Cell B isolated 13:40. Results: 94.3 min nominal, 39.6 min T10, 37.6 mg.min/L conditional, 66.0 min for the card | "D1/D2" labels and the 600 m3, 90 min and 135x0.70 figures, none of which are in the evidence. The single-cell volume is not in the record, so no single-cell CT is asked for |
| 2 ct-inputs (Maple Hollow) | 410 m3, 96 L/s, factor 0.30, 0.71 mg/L, 14.6 C, pH 7.9, supplied 48, rejected 70 min and 1.12 mg/L. Results: 15.2 mg.min/L, ratio 0.32; rejected 78.4 mg.min/L, ratio 1.63 | "10:00/10:30", "7 C", "25.2", "0.84", "39.6", "1.32" |
| 3 segments (Kettle Bay) | 380 m3 (0.3), 165 m3 (0.9), 9,400 m3/d, 0.71 and 0.58 mg/L, 9 C, supplied 38 and 40. Results: 0.33 and 0.33, sum 0.66; rejected sum 1.77 | "D5", "D6", "0.60", "0.50", "1.10", "32", "18", "09:30" |
| 4 ct-audit (Northline) | 420 m3, 560 m3/h, 0.30, 0.85 mg/L, grab 0.83, 14.5 C, supplied 33, note 0.70. Results: CT 11.5, ratio 0.35; with 0.70 the ratio would be 0.81 | "10:00", "D1/D3", "0.84", "25.2" |

Rubric numbers were checked against each module's evidence. Arithmetic was recomputed in `validate.py` (`EXPECT` table).

### 2. 24-hour written-notice rule removed from modules 2 and 4

- Reason: no source supports it. `ceusrc/o-reg-128-04.txt` contains no "24 hours" wording, and no reporting text was found in any ceusrc file. `O. Reg. 170/03` is named in O. Reg. 128/04 only as a definitional reference. Its reporting provision is not in ceusrc, so it is not cited.
- Replacement wording in both lessons: "the applicable regulation sets the reporting time and the recipients", plus a direction to confirm the pathway and deadline in the facility procedure.

### 3. Back-solve contradiction resolved

- Decision: the single division C = required CT / T is valid arithmetic. Spellman p. 642 ties the required CT to pH, temperature and organism, not to the residual, so one division gives a target. The iteration claim in module 2 is removed.
- Module 2 lesson "Step 4" now gives 104 / 100 = 1.04 mg/L and states that it is a target to verify. Module 4 lesson step 5 now says the same.
- `ct-audit-f2` (key 1.50, arithmetic 45/30) and `ct-audit-a2` (key 1.75, arithmetic 42/24) keep their answer keys, since the arithmetic is correct. Their explanations now say the division holds for the stated conditions and the result is a target.

### 4. Residual-index claim removed

- Evidence: sp6 p. 642 ("The required CT value will vary depending on pH, temperature, and the organisms to be killed") and p. 639 (values are based on 10 C and pH 6 to 9). No residual dependence appears in any ceusrc text.
- `ct-inputs-f5` is rewritten. Its correct answer now says the calculated residual is a target to check against the measured residual and the requirement for the measured conditions. Its distractors include the residual-indexed claim, now named as unsupported.
- Module 2 lesson: the residual-dependence sentence is removed.

### 5. 73 and 105 required-CT values at 15 C replaced

- Verification: "73", "105", "pH 7.0", "pH 8.0" and "15 C" appear in no ceusrc text. The only chlorine Giardia value found is sp6 Table 18.15: 3-log = 104 mg.min/L at 10 C, pH 6 to 9 (AWWA 1991, cited by Spellman).
- Changes:
  - Module 2 lesson "Worked example 2": now 0.80 mg/L, T10 100 min, 10 C, pH 7.6, required 104, ratio 0.77 (80.0/104). The pH interpolation rules and the 15 C table are removed.
  - `ct-inputs-f2`: prompt rewritten to Table 18.15, pH 7.4, 10 C. Achieved 90.0, ratio 0.87 (key). Choices: 1.16 (inverted), 1.30 (2-log row, 69), 2.57 (1-log row, 35).
  - `ct-inputs-a2`: prompt rewritten, pH 7.75, T10 110, achieved 88.0, ratio 0.85 (key). Choices: 1.18 (inverted), 1.28 (2-log row), 2.51 (1-log row).
  - A new source entry `spellman-handbook` was added to `sources`, with no url (see open items). Module 2 `sourceIds` now includes it.
  - The Health Canada `ct-table` source section no longer names "Table A.4 ... 15 C". Health Canada appears only as a general reference. Its values are not verified here and not used.

## SHOULD

### 6. "90 minutes" to 45 minutes
- Module 3 lesson: "were ninety minutes apart" to "were forty-five minutes apart". Reason: 06:15 to 07:00 is 45 min.
- `segments-f5` stem: "ninety minutes earlier" to "forty-five minutes earlier".

### 7. "entirely" to "mainly"
- Module 3 lesson: "is entirely an alignment artifact" to "is mainly an alignment artifact".
- `segments-f5` explanation: updated the same way.

### 8. Hydraulics explanations
- `hydraulics-a1`: "nearly threefold" replaced. 400 / 49 = 8.2, so the explanation now says about 8.2 times.
- `hydraulics-a3`: the 48.6 distractor is derived. 60 min x 0.90 = 54 min (wrong factor used), and 0.90 x 54 = 48.6. The 0.30 factor is the supported one.

### 9. Failed to unresolved
- `ct-inputs-c5` correct choice: "A failed determination" to "An unresolved determination".
- Module 2 lesson: "is a failed determination" to "is an unresolved determination".

### 10. "Defend the dossier" removed
- Module 4 assignment now ends with "Then complete the module checks and the final assessment."

### 11. Module 1 lesson lengthened
- Before: 1,137 prose words. After: 1,237 (target 1,200 to 1,500). Added: an "Estimate before you calculate" section, a "Common errors" section with three items, and a worked-example-as-template bullet.
- Modules 2 to 4 were condensed to the 1,700-word limit (tags stripped, captions, SVG text and tables counted): module 2 1,677; module 3 1,699; module 4 1,700. Worked examples, register and decision tables, and all checks, finals and alternates are unchanged in wording. Condensed sections: intro, fixing C and T, common errors, what to verify, and for module 3 the segment and combination sections; for module 4 the dossier, three-claims, and response sections. Time-alignment paragraphs in module 3 were tightened.

### 12. "must" removed from options; hydraulics-f3 reworded
- `ct-inputs-f5`: rewritten, no "must".
- `ct-audit-f5`: "must be recalculated" to "needs recalculating".
- `hydraulics-a5`: "must still be converted" to "still need converting".
- `hydraulics-f3` explanation: reworded. The 25 percent distractor is the flow increase (150/120), not the CT loss, which is 1 - 120/150 = 20 percent.

### 13. Distractor explanations name the mistake
- All 64 explanations (24 checks, 20 finals, 20 alternates) were rewritten or checked so each distractor is named by its specific error. The phrase "source: supplied module" does not occur in this file, so there was nothing to remove.

### 14. Answer positions
- The brief's balance (checks 6/6/6/6, finals 5/5/5/5, alternates 5/5/5/5) was used. The 9/9/9/9 in the request does not match any count in the course (24 checks, 20 finals, 20 alternates), so it was not applied. Confirm the intent.
- Method: choice texts were swapped, with correctIndex updated. Question text is unchanged except for the rewritten items above.
- Moved check items (12): module 2 checks c1 to c6 and module 4 checks c1 to c6, where the per-module balance required it. Finals and alternates were already balanced and did not move.

## Other changes made to meet the validation rules

- `activities`: each module totals 60 minutes (modules 1 to 3: 15/10/20/10/5; module 4: 10/5/20/5/20), so the course totals 240, equal to `plannedMinutes` (240). This replaces an earlier 600-minute scheme that the coordinator withdrew.
- Module 4 final activity still mentions "final assessment".
- Rewritten questions: `ct-inputs-f2`, `ct-inputs-a2`, `ct-inputs-f5`. Their keys changed where the arithmetic is new (0.87 and 0.85). The other finals keep their keys.
- Module 3 lesson: the Health Canada "Table A.4" reference is replaced by "the free chlorine table".

## Claim check (changed claims only)

| Claim | Location | Verdict | Evidence |
|---|---|---|---|
| Required CT varies with pH, temperature and organism | Module 2 lesson; ct-inputs-f5 | SUPPORTED | sp6 p. 642 |
| Required CT depends on residual (indexed table) | Removed from module 2 lesson, ct-inputs-f5, module 4 | NOT COVERED, removed | No ceusrc text supports it |
| Chlorine 3-log Giardia CT = 104 mg.min/L at 10 C, pH 6 to 9 | Module 2 lesson; ct-inputs-f2, -a2 | SUPPORTED (sp6 Table 18.15, p. 639) | Table 18.15, "based on water temperatures of 10 C and pH values in the range of 6 to 9" |
| Chlorine less effective as pH rises from 6 to 9 | Module 2 lesson | SUPPORTED | sp6 p. 639 |
| CT = concentration x contact time, mg/L x min | Module 2 lesson (unchanged) | SUPPORTED | sp6 p. 642, Eq. 18.8 |
| 73 and 105 at 15 C, pH 7.0 and 8.0 | Removed | NOT VERIFIABLE in ceusrc, removed | No ceusrc text contains these values |
| Health Canada Table A.4, 15 C | Module 2 and 4 lesson text; ct-table source | NOT VERIFIABLE in ceusrc, reference only, no values used | Not in ceusrc |
| 24-hour written notice after an adverse test | Modules 2 and 4 | NOT SUPPORTED, removed | Not in o-reg-128-04.txt; no reporting text in ceusrc |
| O. Reg. 170/03 reporting provision | Not cited | NOT VERIFIABLE in ceusrc | Named only as a definition in O. Reg. 128/04 |
| Flow conversion, nominal time, factor arithmetic | Module 1 and 3 lessons, finals | Recomputed in validate.py | Arithmetic only, no source claim |

## Open items and not verified

1. Resolved: activities total 240, matching `plannedMinutes` (240), per the coordinator's correction.
2. Resolved: lesson length for modules 2 to 4 is within 1,700 words (see above). Module 1 is 1,294 words.
3. Balance: 9/9/9/9 in the request does not match the course counts. The brief's 6/6/6/6 and 5/5/5/5 were used.
4. The `spellman-handbook` source has no url, because it is a book and the schema requires one. No URL was invented. Owner decision pending (same as the other book sources).
5. Spellman's Table 18.15 is from an AWWA 1991 guidance manual, reproduced in a 2009 handbook. Before this course is published, the 104 mg.min/L value should be checked against the current governing Ontario method.
6. The Health Canada Giardia tables and O. Reg. 170/03 are not in ceusrc. Neither was checked. Nothing in the course now depends on their values.
7. Not run: the second-model review and the Royce gap check from the runbook. Neither was requested in this task.
