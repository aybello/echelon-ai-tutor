# CHANGELOG: ceu-drinking-water-compliance (jurisdiction-neutral rebuild)

Source: `git show origin/main:server/ceu/courses/ceu-drinking-water-compliance.json`, saved unchanged as `original.json`.
Output: `course.json` (built by `build.py` from `src/`, validated by `validate.py`). Nothing in the repo was edited, committed or pushed.
Date of work: 2026-11-27. Source access date: 2026-11-27.

## 1. Audience and introduction (task 1)
- Reason: owner decision, jurisdiction-neutral for US and Canadian operators.
- Changed: `audience`, `introduction`, `prerequisites`, `delivery`, `version` (now `2026-11-27.1`).
- Ontario appears only as labelled "Ontario example" in lessons and items. A validator check fails any Ontario mention without the label (passes).
- Evidence: `src/intro.py`.

## 2. Structure and time (task 2)
- Six modules kept (same ids and titles). Six checks, five finals, five alternates per module (36 / 30 / 30).
- `plannedMinutes` = 360. Activities per module: lesson 15, reading 10, exercise 20, exercise 10, assessment 5 = 60; total 360.
- Evidence: `build.py` (activities), `validate.py` output (`plannedMinutes` 360, activities sum to 60 per module).

## 3. Overlap with other courses (task 3)
- Cross-reference sentences added (one per topic) naming `ceu-sampling-data-quality`, `ceu-water-treatment-process-control` and `ceu-coagulation-filtration`.
- Cut: the sample-identity register table, holding-time and receipt-condition worked examples, duplicate-precision and completeness statistics (sampling, limits, practicum), the T10/detention worked example (limits), the CT calculation (practicum), and the 91.7% / 98.6% completeness arithmetic (limits).
- Items replaced because they taught that overlapping material (ids kept): `limits-c4` (T10 to sample-line transit), `limits-f1` and `limits-a1` (T10 to travel-time based earliest influence), `sampling-c5` (holding-time non-detect to knowledge timeline after a reissue), `sampling-f1` (clock-corrected holding time to running-average recompute), `sampling-f2` (holding-time exceedance to notice that relied on an invalidated value), `sampling-a1` (clock holding time to running-average recompute), `sampling-a3` (receipt temperature margin to location-only amendment), `sampling-a5` (new: undocumented invalidation in a summary).
- `sampling-a2` and `sampling-a4` keep their ids but now hold the former `a4` (notice quoting a wrong line) and `a5` (receipt outside method condition) respectively; the id was re-sequenced, not reused for a new question.

## 4. Regulatory statements (task 4)
- Every written-notice interval is now stated as "the applicable regulation or permit sets this", with the source named (40 CFR Part 141 and state rules; provincial or territorial regulation; Ontario example SDWA s.18 and O. Reg. 170/03 Sch. 16).
- The 24-hour interval is kept only as a labelled "classroom assumption, for arithmetic only and not a rule", in the prompt or the paragraph where the arithmetic is used. Validator checks each occurrence.
- Removed: the THM 100 µg/L comparator (sampling lesson step 4 and item prompts; the recompute now stops at the average), the CT 18 mg·min/L comparator (practicum lesson and item), the 10 °C receipt condition (no longer used anywhere in the course).
- Evidence: `validate.py` banned-term scan (THM, 100 µg, 18 mg, 10 degrees: 0 hits) and labelling scan (passes).

## 5. Operational response steps (task 5)
- Removed the "Required response" column from the limit register and the "Interim protective action" column from the conflict table. Removed the filter-to-waste, reduce-flow and adjust-dose steps. Recognition and purpose remain.

## 6. Term replacement (task 6)
- "Environmental Compliance Approval" removed everywhere; the records lesson now uses "the applicable drinking water permit or licence". Validator: 0 hits.

## 7. Three explanations citing the wrong option (task 7)
- `sampling-c1`: explanation pointed to "the first option" for the exact-match claim (which is the last option). Rewritten to name each option's mistake by content.
- `sampling-c2`: explanation mislabelled the options by position. Rewritten by content.
- `sampling-c6`: explanation said "the second option" was the code correction (it was the third). Rewritten by content.
- Validator: no explanation refers to an option by position.

## 8. Distractors and sources (task 8)
- Every one of the 96 explanations rewritten to name the mistake behind each wrong option. Obvious distractors (e.g., "the reviewer becomes the sole duty holder", "the absence of a reply means completed") were replaced by plausible errors tied to the course's concepts.
- "Source: supplied module" removed (0 occurrences). Explanations cite the regulation, the EPA document or the textbook instead.

## 9. Answer positions (task 9)
- Checks: 9 / 9 / 9 / 9 across 36 items (validated).
- Finals: 8 / 8 / 7 / 7; alternates: 8 / 8 / 7 / 7.
- Longest-option check: zero items where the correct option is strictly longest. Three items are tied for longest (allowed by the brief's wording, listed in `validate.py` output).
- 25 items had a strictly longer correct option; the longest distractor in each was lengthened with a further wrong qualifier, not the correct answer shortened.

## 10. Numeric fixes and codes (task 10)
- "Changing 0.71 to 0.71 mg/L" (the nonsense unit example in the records lesson) replaced with a clear statement that adding units is a unit clarification and does not change the value.
- The totalizer example: 38.5 corrected to 38.6 m³/day (4,387.1 − 4,348.6 = 38.57, rounded 38.6).
- `RESP-04` and `EVENT-02` removed; the compliance-map lesson and rubric no longer cite them.
- `manus-storage` cover image removed (not in the repo). The lesson figures are inline SVG diagrams that the course can render without external files.

## 11. Lessons (task 11)
- Lesson word counts (visible text including captions and figure labels): compliance-map 1,295; limits 1,453; sampling 1,281; response 1,296; records 1,407; practicum 1,325. All within the 1,200 to 1,500 target and below the 1,700 hard max.
- Worked examples kept in each module (one or two each). Numeric items and worked-example totals were recomputed by `validate.py`; prose was reviewed by reading.
- Figures: six inline SVG flow diagrams, one per module (requirement: at least five).

## 12. Sources (task 12)
- Eight sources kept, all HTTPS, each returning HTTP 200 on a GET request (HEAD returned 403 for two Ontario URLs, so GET was used). The Ontario URLs are labelled as examples.
- Verified content: the Ontario bulletin says the duty arises "immediately after the adverse result is obtained", under SDWA s.18 and "section 16-3 of Schedule 16 to Ontario Regulation 170/03" (page at `web/68e5a1e9.html`). The Procedure for Disinfection defines CT (concentration × time) and T10 (`web/b22d30d6.html`). The EPA 815-B-19-010 page describes turbidimeter setups, SCADA systems and best practices for data quality (`web/3c7f2b3a.html`). The US EPA Public Notification Rule and 40 CFR Part 141 landing pages return 200.
- Textbook citation added inline: Crittenden et al., *MWH's Water Treatment: Principles and Design*, 3rd ed., Wiley, 2012 (limits and practicum lessons). No page numbers given.
- No URL was invented. Health Canada's guidelines URL returned no response (status 000) and was not used.

## 13. Question ids and answer keys (task 13)
- All 96 question ids kept. `correctIndex` changed wherever needed for the 9/9/9/9 balance, which is a position change; the correct answer's meaning is unchanged in every item where the original answer remains correct.
- Correct-option wording changed in 65 items, mainly to remove Ontario-only phrasing or to match the rewritten explanation. The validator reports 31 items with identical correct text.
- Items whose question was replaced (id kept): limits-c4, limits-f1, limits-a1, sampling-c5, sampling-f1, sampling-f2, sampling-a1, sampling-a3, sampling-a5 (new), practicum-c3 (sequence now stated as "from the current regulation"). Items re-sequenced: sampling-a2 and sampling-a4.

## Validation (`python3 -I validate.py`)
```
ITEMS: 96 checks 36 finals 30 alts 30
check positions: [9, 9, 9, 9]  final positions: [8, 8, 7, 7]  alt positions: [8, 8, 7, 7]
figures in course: 6
correct option is (tied-)longest in 3 of 96 items; strictly longest in 0
numeric items recomputed: 21 plus 10 assertions (all match)
PASS: no structural problems
```
Structural checks: 9 top-level keys; six modules; 6 checks, 5 finals, 5 alternates per module; unique ids and unique prompts; four choices each with no duplicates; valid `correctIndex`; `sourceIds` all exist; activities sum to 60 per module; `plannedMinutes` 360; banned terms absent; Ontario labelled as example; 24-hour arithmetic labelled as classroom assumption.

## Could not verify
1. The review's claim that the written-notice 24-hour rule is in O. Reg. 170/03 s.16-7(1). The e-Laws page is JavaScript-rendered and returned only its title; the bulletin in this build cites s.16-3 and says "immediately", with no written-notice interval. The 24-hour rule therefore appears only as a labelled classroom assumption.
2. Text of O. Reg. 128/04 (ss. 23, 25–27) and O. Reg. 170/03 (Sch. 16) beyond the bulletin's citations. Cited as Ontario examples, as in the original.
3. The full text of EPA 815-B-19-010 (only the web page was read).
4. The section-level text of 40 CFR Part 141 (only the landing page was reached).
5. The MWH textbook citation: not checked against the book, no page numbers.
6. No verified Canadian public URL. Health Canada's guidelines URL returned status 000. Canadian examples therefore rely on "provincial or territorial regulation" without a cited Canadian source.
7. Semantic quality of the 96 distractor explanations: checked by reading, not by a tool. The validator checks structure, numbers and positions only.
8. Rendering of the markdown tables and inline SVG figures in the course viewer: not previewed.
9. The original review report was not in the files available to me; the findings were taken from the brief's summary. Each point in the summary was checked against the original text where it could be.

## Points for the owner
- The 24-hour written-notice window is kept as a labelled classroom assumption. Replace it with a verified citation if the owner wants a stated rule.
- The Canadian coverage is thin (no verified Canadian URL). A verified Canadian source would close gap 6.
- Several items were replaced rather than edited (section 3), because the original arithmetic taught the overlapping courses' material.
