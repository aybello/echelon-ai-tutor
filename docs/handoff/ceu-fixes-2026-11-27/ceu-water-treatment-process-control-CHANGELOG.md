# CHANGELOG: ceu-water-treatment-process-control

Source: `git show origin/main:server/ceu/courses/ceu-water-treatment-process-control.json` (kept as `original.json`).
Output: `course.json` (version bumped to `2026-11-27.1`). Build: `build/build.py` with per-module content in `build/m1.py` to `m6.py`, `build/finals.py`, `build/svg.py`. Validation: `validate.py` (run with `python3 -I`).
No repo file was edited, committed or pushed. Module ids, check ids, final and alternate ids, `plannedMinutes` (600), module titles and the `activities` minutes are unchanged.

## MUST

1. **Rubric numbers (evidence: lesson values).**
   - M1 rubric: 8,640 m³/d case replaced with the lesson's 80 L/s case (6,912 m³/d, 172.8 kg/d at 25 mg/L). Previous-flow case set to 60 L/s (5,184 m³/d, 129.6 kg/d). The 200 min figure is replaced by 100 min nominal and 106 min with 6 min sample transport.
   - M2 rubric: 33 and 6 replaced with 36 and 8 mg/L as CaCO3 (48−12, 20−12, lesson worked example).
   - M3 rubric: 13.2 and 11.0 replaced with 6.00 and 5.00 mg/L (lesson 12.0% and 10.0% products at 10.0 L/h and 240 m³/h) and 10.4167 mL stock per jar.
   - M4 rubric: 4, 6, 5, 0.10, 0.30 replaced with 6.00 and 7.50 m/h, 6.90 m/h aggregate, 0.12 and 0.24 m/h (lesson Filters A and B).
   - M5 rubric: 120, 60, 48, 90, 45 replaced with 100 min, 40.0 min T10, CT 36.0, ratio 1.20; 72.0 min, 28.8 min, CT 25.92, ratio 0.864.
   - M6 rubric and facilitator guide: 15 mg/L replaced with 18 and 20 mg/L (216 kg/d ÷ 12,000 m³/d; 180 kg/d ÷ 9,000 m³/d).
   - Evidence: `validate.py` recomputes each quoted value.

2. **Self-contained assignments and facilitator guides.**
   - M1: "source change" timing now refers to a change at the upstream tap using the basin example. Facilitator "75 L/s" and "09:10 flat trend" removed. The 09:45 target is removed.
   - M4: "Filter 2", "run-age change" and "8 h control" removed from the facilitator guide. The assignment now uses Filters A, B (lesson) and C (evidence). The missing backwash entry is now a generic "gap in a backwash record" example.
   - M5: "worksheet time-unit error" removed. The assignment names the two lesson intervals.
   - M2: the "storm" wording was removed from the guide and lesson.
   - Repo check: `validate.py` bans "Filter 2", "time-unit", "source change", "missing backwash", "run-age change", "09:10", "storm".

3. **24-hour notice claim (M6).** Replaced with "the applicable regulation sets the reporting time" and the site's procedure. Not verified against regulation text, so no figure is stated.

4. **Check positions 9/9/9/9.** `build.py` moves the correct option to position `i % 4` across the 36 checks (distractor order kept), so only `correctIndex` and option order change. Ids and prompts unchanged. Finals and alternates are not rebalanced (not required).

5. **"must" in filters-a3.** The distractor "must be an analyzer malfunction" is now "would need to be". Validator confirms no "must" in filters-a3.

6. **Longest-option fixes.** water-balance-c5 (shorter correct option), trial-c6 (longer distractor), trial-f3, trial-f5 (longer distractors), filters-f4 (longer distractors), coagulation-a5 (longer distractors), and an automated check that the correct option is never the longest or tied-longest in any of the 96 items.

## SHOULD

7. **Citations.** "Source: supplied module" removed from all explanations. Textbook citations (section and page from the sp6 table of contents and WQC section 6.2) added where covered:
   - sp6 §5.5.1 (p. 102), §5.4.17.3 (p. 102), §5.6.5.2 (p. 108), §5.6.7.2 (p. 114), §5.6.8.1 (p. 119), §5.6.8.2 (p. 120), §5.6.8.3 (p. 121), §5.6.9.3 (p. 126), §5.6.9.6 (p. 130), §5.6.12.5 (p. 139), §5.7.2.2 (p. 147), §5.7.7.1 (p. 161), §5.7.8.4 (p. 165), glossary "Jar test".
   - WQC Handbook section 6.2 (TOC and DOC apparatus); turbidity as an optical property.
   - Not covered by the books, so labelled "Course convention" in the lesson or explanation: DOC definition, Al₂O₃-equivalent basis, superficial loading (sp6 covers filtration rate, so the term is linked to §5.6.8.2), installed vs active area, cold-water floc, coagulant dilution basis, UV absorbance as composition indicator, T10 baffling factor, and the trial-design rules.
   - Textbook titles are not added to `sources`, because the repo catalogue test requires a URL for every source. Citations are inline only.

8. **Distractor explanations.** Every explanation for all 96 items now names the specific mistake in each distractor (for example, water-balance-c1 "21,600" factor-of-ten; coagulation-a2 "5.76" new density with old strength; filters-f2 and filters-a2 unexplained distractors; ct-f1 options 2 and 3; finals 21 options 2 and 3).

9. **Obvious and arguable distractors.**
   - Obvious: coagulation-c1 "solution colour" replaced with a plausible delivery-rate and density mistake; trial-c5 "observations below the mean alone" replaced with an outlier-trimming mistake.
   - Arguable: ct-c2 options 0 and 2 (replaced with a residual-timing mistake and first-arrival); ct-f4 option 1 (replaced with a halving mistake); trial-f3 option 1 (replaced with a full-success classification); trial-f5 option 2 (replaced with an omit-disinfection error); raw-water-f5 option 3 (replaced with a mismatched alkalinity and method record); raw-water-a5 "source changes" phrasing; coagulation-f4 option 2 (replaced with a no-confound claim); filters-a3 "must".

10. **Screening criteria.** M3 and M6 each use one module screen in the lesson (M3: mean ≤0.70 NTU, pH 6.50 to 7.20, range ≤0.10 NTU). Items that use a different screen state it in the prompt: coagulation-f3 (mean ≤0.60, range ≤0.08, pH 6.6 to 7.0), coagulation-a3 (mean ≤0.65, range ≤0.06, pH 6.5 to 7.1). M6 items state their own criterion (15%, 20%, 25%), and the lesson labels its 20% as illustrative.

11. **Flocculation and sedimentation.** No `ceu-water-treatment-concepts` course exists in this repo (grep of `server/ceu` returns nothing), so the prerequisite cannot be cited. A short summary (flocculation, sedimentation, surface loading rate, cold-water floc as a course convention) was added to module 3, and `prerequisites` now names it.

12. **Lesson length.** Words counted from the lesson string, including figure captions and tables: M1 1,363; M2 1,451; M3 1,497; M4 1,370; M5 1,377; M6 1,490. Worked examples kept.

13. **Figures.** Three new inline SVGs (M3 dose chain, M4 loading bars, M5 CT ratio bars). Total five with the two existing figures. viewBox, title, aria-label, no style attributes, minimum text 12 units, colours #1d2d40, #2f6db2 and greys. Rendered at 390 px with Playwright (`chromium.launch()` default), screenshots in `render/fig0.png` to `render/fig2.png`. No horizontal overflow.

14. **Cover image.** Not changed. `/manus-storage/ceu-water-treatment-process-control-cover_b42f020f.jpg` is not in the repo, so it cannot be verified or replaced.

15. **Spelling.** Standardized on "authorized" (the majority spelling across CEU courses on main: 157 "authorized" vs 111 "authorised"). Optimization family and "neutralizing" standardized as well. Other British spellings remain ("favourable", "behaviour", "analyser", "colour"), so the course is not fully US-spelled.

## Validation (`validate.py`, `python3 -I`)

- Structure: 6 modules, 6 checks each, 30 finals, 30 alternates, minutes 600 unchanged, module ids and titles unchanged.
- Unique ids and prompts across checks, finals and alternates.
- Valid correctIndex; four distinct choices per item; check positions 9/9/9/9.
- Numeric recompute of quoted values in lessons and rubrics.
- Banned text: none found, including "source change", "Filter 2", "must" in filters-a3.
- Longest-option: correct option is never the longest or tied-longest in any item.
- sourceIds all exist.
- Repo catalogue-test rules replicated: no em dash in prompts, choices or explanations; at least 4 `###` headings per lesson; evidence contains "fictional"; facilitator guide over 200 characters; assignment over 100; rubric at least 3; checks 6; finals and alternates 5 per module.
- SVG rules on all five figures.
- Result: 0 errors, 0 warnings.

## Not verified or not done

- The repo's own vitest suite (`server/ceu/catalogue.test.ts`) was not run, because it reads the repo file. Its rules were replicated in `validate.py`.
- Textbook page numbers come from the sp6 table of contents and WQC section 6.2. Individual claims were not checked against page content.
- Regulatory reporting time (item 3) not verified.
- Finals and alternates are not rebalanced to 9/9/9/9 (not required).
- Prompts changed only for spelling, and for the screen labels in coagulation-f3 and coagulation-a3.
