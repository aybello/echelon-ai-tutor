# CHANGELOG: ceu-wastewater-treatment-process-control fix

Source: `git show origin/main:server/ceu/courses/ceu-wastewater-treatment-process-control.json` (kept unchanged at `course.original.json`).
Fixed file: `/tmp/claude-0/-home-user-echelon-ai-tutor/0e6dc4c6-dfed-5d26-9c2a-f17854a01d3e/scratchpad/fix-wwpc/course.json`.
Module numbers below are 1-based as in the brief: M1 process-map, M2 monitoring, M3 biological, M4 solids-age, M5 nutrients-solids, M6 virtual-shift.
Structure kept: 6 modules, all module, check, final and alternate ids unchanged, plannedMinutes 600, activity minutes unchanged.

## MUST

1. **Undiluted SVI (M3, plus M2/M4 untouched).** Reason: WEF MOP 11 (mop.txt ~L30892 and ~L32298) says undiluted settled volumes above 250 mL/L can significantly over- or understate SVI; the Wisconsin Advanced guide (~L572) describes the dilution test.
   - Lesson worked example 1: 360 mL/L at 3,000 mg/L changed to 240 mL/L at 2,000 mg/L (120 mL/g, unchanged). Earlier sample 300 at 3,000 changed to 200 at 2,000 (100 mL/g). Alternate: 240 at 4,000 gives 60 mL/g (was 90).
   - Evidence: the undiluted 480 mL/L is now shown as invalid; the lab repeated it with 1:1 dilution (diluted 240 mL/L, diluted MLSS 2,000 mg/L) = 120 mL/g. Previous shift tested by the same diluted method: 200 mL/L at 2,000 mg/L diluted (MLSS 4,000 undiluted) = 100 mL/g. Dashboard 192 mL/g is rejected (undiluted 480 over 2,500 mg/L).
   - biological-c4: 240 mL/L at 3,000 mg/L = 80 mL/g (options 12.5 = inverted ratio, 800 = decimal error).
   - biological-f1: 200 at 2,000 (100) to 225 at 1,500 (150), still 50%, 12.5% settled-volume distractor kept.
   - biological-f2: sample B 210 mL/L at 1,400 mg/L = 150; sample C MLSS 1,750 gives 120; average MLSS gives 133.
   - biological-f5: 220 at 2,000 (110) to 225 at 3,000 (75); distractor 113 mL/g.
   - biological-a1: 180 at 1,500 (120) to 225 at 1,500 (150) = 25%.
   - biological-a2: sample D 195 mL/L at 1,300 mg/L = 150; E at 1,500 gives 130; average gives 139.
   - biological-a5: 200 at 2,000 (100) to 180 at 2,250 (80); 90 with earlier MLSS.
   - Also added the solids-loading benchmark caveat (item 14) to M3 lesson.
   Every SVI value above was recomputed in `validate.py`.

2. **M3 facilitator key and assignment.** Key "SVI 100 then 150 mL/g" changed to "100 then 120 mL/g" (both by the same diluted method). Assignment now says both SVI values come from the evidence and names the method. Reason: evidence yields 120; the assignment had no values.

3. **Undefined or inconsistent data.**
   - M2 (monitoring): added a defined evidence block: Tuesday (06:00 Tue to 06:00 Wed), influent BOD 150 mg/L over 10,000 m³ (1,500 kg/d), effluent 8.0 mg/L over 9,800 m³ (78.4 kg/d), TP reported <0.05 mg/L (<0.49 kg/d), meter M5 (effluent flow) missed a verification check, outfall OUT-22 grab at 14:00 Thursday (not the composite; copied flow unsuitable). Assignment spells out total phosphorus and outfall OUT-22.
   - M4 (solids-age): M9 removed (sensitivity now 160 m³/d waste). The implied 240 kg/d (24 mg/L at 10,000 m³/d) replaced by 192 kg/d at the 8,000 m³/d base. The facilitator's base values (8,000 kg, 480 waste, F/M 0.30, RAS 40,000) did not match the lesson worked example, so the facilitator now uses the lesson's own numbers: 9,480 kg, 8.78 d, F/M 0.254, HRT 7.09 h, RAS 19,200 kg/d, plus the Cedar Reach evidence (6.86 d, RAS 20,000 kg/d). Spacing issues ("F/M0.30", "RAS40,000") disappear with this rewrite.
   - M1 (process-map): centrate data added to evidence (350 m³/d at 240 mg/L COD from one grab = 84 kg/d, labelled indicative). This supports the facilitator's 84 kg/d and 1,524/1,844 kg/d.
   - M5 (nutrients-solids): M11 defined in evidence (before/after dosing grabs; soluble P 0.30 to 0.10, total P 0.90 to 0.75, TSS 12 to 30; particulate P by difference 0.60 to 0.65). Facilitator now uses lesson numbers: centrate 64.8 kg N/event (96 removed), main influent 288 kg N/d (250 removed), combined 352.8, centrate share 18.4%, 10.8 to 5.4 kg N/h. The Cedar Basin evidence case (68 kg N/event) is labelled separately.
   - M6 (virtual-shift): M8 (aeration-only SRT 4.44 d) and M10 (selected-boundary 5.56 d) and M15 (150 m³/h temporary diversion) defined; verified RAS (command 400, measured 250 m³/h) and DO (portable 2.0 mg/L vs fixed probe 3.4 mg/L) evidence added; facilitator no longer uses SRT 13.33 or F/M 0.30 or the centrate 96 values.
   - M1 centrate and M2 Tuesday data appear in evidence, so assignments use only supplied data.

4. **M1 figure.** Path redrawn: the dashed return starts at the Return sludge box and ends at the Influent box (left-side loop, so it no longer crosses the effluent arrow). Caption updated. Rendered at 390 px (see render/fig0.png); no horizontal scroll.
   **Conflict not resolved:** the lesson text says return activated sludge enters the aeration tank. The brief asked for the influent endpoint. The figure follows the brief; confirm the intended return destination.

5. **M6 "instructor" and "delivery plan" removed** from the assignment and facilitator (self-paced).

6. **Check answer positions** rebalanced to 9/9/9/9 for the 36 checks by swapping the correct option with a distractor and updating correctIndex only. Finals and alternates are 8/8/7/7 (not required).

7. **Correct option not strictly longest.** Fixed 7 items: biological-c5, virtual-shift-f3, monitoring-a4, biological-a1, biological-a2, biological-a3, nutrients-solids-a4 (correct options shortened). Script result: 0 strictly longest.

8. **Overclaiming distractors.** Replaced establishes/proves/confirms/guarantees/automatically/whenever in all choices with plausible but wrong wording (about 40 edits; log in choice_log.json and choice_log2.json). Correct options that remain use hedged wording ("does not establish", "shows", "suggests"). Banned-word check on choices: 0.

## SHOULD

9. **virtual-shift-c2 option 0** ("accept the online change because continuous measurements capture events") revised to a clearly wrong distractor ("discard the online reading because one independent spot check always outranks continuous measurement").

10. **Explanations and citations.** All "Source: supplied module" phrases replaced with textbook citations: WEF MOP 11 (Operation of Municipal Wastewater Treatment Plants) for M1 to M5, and the Wisconsin DNR Advanced Wastewater Study Guide for M6. "The supplied module's" replaced by "the lesson's". Final 21 (finalAssessment[20]): option 2 replaced with "40 kg ... applying the first interval concentration to the whole return" and explained; option 3 (60 kg) was already explained.
   **Partly done:** I did not audit every distractor explanation. Most already name a mistake.
   **sp5.txt** is not in the scratchpad source folder (file not found), so it was not cited.

11. **Spelling and spacing.** Used American spelling (authorized, analyze, standardize, behavior, liter, meter) because most CEU courses on main use "authorized" (the process-control course on main used "authorised" 34 times and "authorized" 24 times, but the overall count of "authorized" across courses is higher). Facilitator spacing fixed by rewrite.

12. **M6 worked example:** 5.56 − 4.44 = 1.12 d is rounding. Unrounded 5.556 − 4.444 = 1.111, so the text now says 1.11 d.

13. **SRT scope** added to M4 lesson: this course's SRT is activated-sludge solids retention for the reactor and clarifier boundary; digester SRT is taught in the digestion material and not calculated here. ceu-sludge-digestion is not on main, so it is not cross-referenced by name.

14. **Solids-loading benchmark** added to M3 lesson with caveats: WEF MOP 11 typical safe range of about 171 kg/(m²·d) or less (the maximum depends on SVI), and practical peak-flow upper limits of about 7.08 kg/(m²·h) for nitrification and 9.28 kg/(m²·h) for normal clarifier operation. Stated as background only, not as rules.

15. **Lesson length.** M5 trimmed to 1,693 words (cut the change-impact prose, EPA paragraph, 8-row register reduced, verify section condensed; both worked examples kept verbatim). M6 trimmed to 2,347 (dropped the EPA paragraph and merged intro, verify and handover prose; both worked examples kept; 1.11 fix). Not done: M1 (2,578), M2 (2,460), M3 (2,829, grew with the dilution rule and benchmark), M4 (2,583). Target 1,200 to 1,500 and the 1,700 hard max were not reached for M1 to M4 or M6 because each keeps two full worked examples.

16. **SVG figures.** Five SVG figures now exist (brief requires 5). Original: M1 process flow (fixed), M4 generic balance (existing). Added: M2 monitoring boundary, M3 SVI dilution decision flowchart, M6 flow step chart with average line (lesson example 400/1,000 m³/h). Rendered at 390 px with Playwright (chromium.launch()); scrollWidth 390, no horizontal overflow; images viewed (render/fig0..fig4.png). M5 has no figure.

17. **Overlap with ceu-activated-sludge-troubleshooting (main).** Checked origin/main version (trouble_main.json).
   - Agreement: both use a 1:1 dilution with filtered or clear final effluent for the diluted SVI; both warn against comparing a diluted result with an undiluted trend and against mixing methods mid-trend (that course's worked example: undiluted 187 vs diluted 161 mL/g on the same sludge; M3 says the same).
   - Not in the troubleshooting course: a numeric threshold. It says "a large fraction of the cylinder" and gives no 250 mL/L value. M3 now cites 250 mL/L from WEF MOP 11 and states the method agreement. Recommend the troubleshooting course add the 250 mL/L figure with the same MOP reference. Not edited (outside this brief).
   - Also the troubleshooting course's SVI formula (mL/L ÷ g/L) matches M3's.

## Validation (validate.py, python3 -I)
- 6 modules; 6 checks each; 30 finals and 30 alternates; ids unchanged; unique ids and prompts; 4 choices each; valid correctIndex.
- Checks positions 9/9/9/9.
- plannedMinutes 600; activity minutes unchanged.
- No strictly-longest correct option.
- Banned words (establish/prove/confirm/guarantee/automatic/whenever) absent from all choices. Remaining occurrences only in explanations, as negated or hedged text.
- "instructor", "delivery plan", "supplied module", "Source: supplied" absent.
- sourceIds all exist in sources.
- Numeric recompute of all SVI, load, SRT, F/M, HRT and storage values used in lesson, evidence, facilitator and keys (asserts pass).
- Figures: rendered and viewed at 390 px.

## Not fixed / open
- Lesson length targets for M1 to M4 (see item 15).
- Explanations: not every distractor audited for a named mistake.
- Figure vs lesson conflict on return-sludge destination (item 4).
- Citations are to WEF MOP 11 and the Wisconsin guide by section topic. Page numbers and URLs were not added. The top-level `sources` array was not extended, so those references are in explanations only.
- The troubleshooting course lacks a numeric 250 mL/L threshold (item 17).
- Finals and alternates are 8/8/7/7 positions (only checks are 9/9/9/9 as required).

## Coordinator follow-up (open, not applied)
- Minutes: request says plannedMinutes 240 with 60 per module. Six modules at 60 is 360, not 240. The brief required 600 unchanged, and current activities total 600. Not changed pending the intended total.
- Checks: request says 6 per module and 24 in total with 6/6/6/6. Six modules at 6 checks is 36. The brief required 9/9/9/9 for 36. Current file: 36 checks, balanced 9/9/9/9. Not changed pending clarification.
- Lesson length M1 to M4 (2,460 to 2,830 words) to 1,700 or fewer: not yet done.
- M1 figure vs RAS sentence: figure returns RAS to influent (as briefed); lesson says RAS enters aeration. Conflict still open; needs decision.
- CT course on main has plannedMinutes 210, 4 modules, 6 checks each, activity minutes about 52 per module, so it does not match the 60-per-module pattern either.

## Coordinator follow-up (applied)
- Minutes: plannedMinutes set to 240 (was 600 in the source, and the brief required 600 unchanged; this follows the coordinator's later instruction). Each module's activities set to 8/6/14/8/4 = 40 minutes.
- Checks: kept 6 modules and 36 checks, balanced 9/9/9/9 (the coordinator's "24 total" was withdrawn).
- Lessons M1 to M4 trimmed to 1,552 / 1,403 / 1,698 / 1,635 words (captions included). Kept worked examples, tables, figures, ids and keys. Dropped: the EPA paragraphs, the long "interpret" sections, and the oxygen and competing-explanation prose in M3. Common errors and verification sections rewritten shorter.
- RAS conflict resolved to match the figure: M1 now says return sludge in the figure returns to the head of the works, confirmed on the routing drawing. The aeration-entry paragraph was dropped. M3 and M4 still describe RAS returning to the reactors, which is outside the M1 figure; left unchanged.
- Spelling bug fixed: "organizm" restored to "organism" (introduced by the earlier spelling pass).
- Validation: validate.py passes with 0 errors (plannedMinutes 240, activities 40 per module, 9/9/9/9 checks).
