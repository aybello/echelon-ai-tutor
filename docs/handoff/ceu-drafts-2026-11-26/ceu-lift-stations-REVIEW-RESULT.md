# Second-model review result: Lift Stations for Wastewater Operators (ceu-lift-stations)

## Reviewers
- **GPT Sol 6.2**, model id `gpt-6.2-sol` (the exact id listed by `GET https://api.openai.com/v1/models` on 2026-11-26; `gpt-6.2-sol` is present). Called through the proxy with `Authorization: Bearer placeholder`.
- **Gemini neon did NOT review this course.** No Gemini credential is available in this environment, so the Gemini call in the original tool was removed. Only Sol 6.2 reviewed it.
- Script: `review/lift/review_course_sol.py` in the scratchpad (adapted from `docs/handoff/tools/review_course.py`). Textbook excerpts per module are in `review/lift/src/` (WEF MOP 11 Vol I Ch. 8 with a Ch. 5 confined-space excerpt; Spellman Handbook sp6 sections 9.3 and 19.5; Spellman Vol I sp1 sections 10.3 and 11.4). Outputs: `review/lift/round1`, `round2`, `round3`.
- The Wisconsin Advanced Wastewater guide was not given to the reviewer. Its one claim (positive displacement start-up) is only a contrast.

## Method
- Planted-error design: each round copies the draft to a review copy, plants one wrong answer key per unit, changes one explanation number and one lesson number, and asks the reviewer for real problems only. The planted positions are recorded in `plants.json` and scored by a second call to the same model.
- The lesson-number plant takes the middle number of a lesson, so it lands on the same sentence in each round (controls module, "410 gpm"). It is a repeated test, not three independent samples.
- Each round's findings were triaged against the book text (grep in `ceusrc/`) and against the draft. Planted items were identified and not changed in the draft.

## Rounds
- Round 1 (seed 7): 10 planted across the four modules and the finals. Real fixes applied: about 30.
- Round 2 (seed 11): 12 planted. Real fixes applied: about 20.
- Round 3 (seed 13): 11 planted. Real fixes applied: about 12. Three rounds reached; no fourth round was run. The round-3 real findings were fixed, so the draft is not clean by the reviewer's standard on every wording point. See "Unresolved".

## Planted-error catch rate
| Round | Planted | Scorer CAUGHT | After hand check |
|---|---|---|---|
| 1 | 10 | 9 | 10 |
| 2 | 12 | 11 | 12 |
| 3 | 11 | 10 | 11 |
| Total | 33 | 30 (91%) | 33 (100%) |

The three scorer misses are the same 410 gpm / 823 gpm mismatch in the controls module. Each report names it ("the calculation uses 410 gpm, but the example gives 823 gpm"), so it is counted as caught on hand check. The scorer marked it MISSED because the report's location differs slightly from the planted sentence.

## Findings table (all rounds)
Verdicts: PLANTED = injected by the test, not in the draft; REAL = a true problem, fixed; REAL-PARTIAL = part true, wording tightened; NIT = minor, fixed; FALSE POSITIVE = not an error, reason given; EXCERPT = reviewer lacked the source passage.

| Rnd | Unit | Finding (short) | Verdict | Action |
|---|---|---|---|---|
| 1 | why | Key on c3 wrong | PLANTED | Caught; not in draft |
| 1 | why | Drawdown 6 ft vs 15 ft | PLANTED | Caught; not in draft |
| 1 | why | "a single capacity figure is an average" | REAL | Reworded to a reference value at one condition |
| 1 | why | 31 psi "close to" 71 ft TDH | REAL | Gauge pressure head is not TDH; removed the direct comparison |
| 1 | why | 2.31 ft/psi and elevation-only static head | REAL-PARTIAL | "For water"; equal-pressure condition stated |
| 1 | why | Friction "roughness" only; old pipe always higher | REAL | Roughness, diameter and flow; "often" |
| 1 | why | "Holding it high saves energy"; "low leaves little margin" | REAL-PARTIAL | Lowers static head; margin named (submergence, suction) |
| 1 | why | Gravity "works only until"; discharge "often a manhole" | REAL | Reworded; a station is one common layout |
| 1 | why | Draining the well as access | REAL | Added: draining does not make the well safe to enter |
| 1 | why | Demand charge on "highest rate of use" | REAL | "Some tariffs ... peak metered demand over a set interval" |
| 1 | pumps | Working-volume dimension 19 ft | PLANTED | Caught; not in draft |
| 1 | pumps | c6 key | PLANTED | Caught; not in draft |
| 1 | pumps | c3 "inverting gives 64" / squared 85.3 | FALSE POSITIVE | 27 ft is correct; 64 is the unsquared inverse; no 85.3 option. Explanation wording tightened only |
| 1 | pumps | Affinity sentence stated as actual operation | REAL | "At the corresponding point on the new pump curve" |
| 1 | pumps | "One moving part" attributed to WEF | REAL | Spellman 9.3.5 "single rotating element"; WEF attribution removed |
| 1 | pumps | Double-suction "not for raw sewage" | REAL | Check the pump's solids passage and rating |
| 1 | pumps | Wear/rags "shift the curve" | REAL | Pump curve vs system curve separated |
| 1 | pumps | Valves on each pump | REAL | Open-intake submersible pump has no suction line to valve |
| 1 | pumps | Cavitation at inlet; "at least as large" | REAL | Local pressure; NPSHA must exceed NPSHR (see R3) |
| 1 | pumps | Closed-valve start "self-limiting" | REAL | Only where the maker and station procedure allow |
| 1 | controls | 410 vs 823 gpm | PLANTED | Caught (see table note); not in draft |
| 1 | controls | c5 key | PLANTED | Caught; not in draft |
| 1 | controls | "Off keeps it from starting" as a service stop | REAL | Off is a control position, not isolation (lock out and tag out) |
| 1 | controls | High-level alarm "set below the sewer" as a rule | REAL-PARTIAL | "Normally ... in many stations" |
| 1 | controls | Floats "one discharge rate" | REAL-PARTIAL | Checked: Spellman p.369 says one discharge rate, with loading and idle-time drawbacks. Wording now matches |
| 1 | controls | Daily flow = sum of each pump's volume | REAL | Caveat: only for time a pump ran alone |
| 1 | operation | Pump 7 vs pump 2 | PLANTED | Caught; not in draft |
| 1 | operation | c5 key | PLANTED | Caught; not in draft |
| 1 | operation | Velocity "lowers" with high wet well | REAL-PARTIAL | WEF text: "continuously higher ... will lower velocities" |
| 1 | operation | H2S smell as warning | REAL | Smell is not reliable |
| 1 | operation | Drainage needed before any inspection | REAL | Direct inspection generally needs isolation and retrieval |
| 1 | operation | Amperage = falling efficiency | REAL | Use energy input with water power unchanged |
| 1 | operation | Confined space "or" list incl. poor ventilation | REAL | OSHA three-part test (own knowledge, 29 CFR 1910.146 via Spellman 11.4.1); MOP 5 lists hazards (checked) |
| 1 | operation | "Neither finding is an emergency" | REAL-PARTIAL | Both need prompt checks under station procedure |
| 1 | operation | c2 distractor "higher speed" also plausible | REAL | Replaced with a larger suction line |
| 1 | operation | c3 "averaging gives 2,123" | NIT | 2,122.5; sum is combined pump-hours |
| 1 | operation | c4 "running backwards does not protect" | REAL-PARTIAL | Routine reverse running is not a way to keep rags off |
| 1 | finals | f2 key | PLANTED | Caught; not in draft |
| 1 | finals | f4 gallons without stated rate | REAL | Stem now says 410 gpm throughout |
| 1 | finals | f1 "shows a problem exists" | REAL-PARTIAL | Option now "an alert is warranted; the cause is unknown" |
| 1 | finals | f5 "pressure changes do not set cycle time" | REAL | Head does affect flow; explanation corrected |
| 1 | final-alt | a2 distractor 213.5 psi (should be 213.4) | REAL | Corrected |
| 1 | final-alt | a1 "motor draws 20 hp" | REAL | Brake hp at the shaft |
| 1 | final-alt | a3 "dividing by 0.7457" | NIT | Explanation says the factor is applied backwards |
| 1 | final-alt | a5 gate-valve WEF attribution | FALSE POSITIVE (EXCERPT) | MOP Ch. 8 (line 11198) says gate valves should never be treated as throttling valves because they trap material. Excerpt was cut early. Overflow distractor changed anyway, as the reviewer's point on ambiguity was valid |
| 1 | final-alt | controls a4 key | PLANTED | Caught; not in draft |
| 1 | final-alt | op a2 grease traps | FALSE POSITIVE (EXCERPT) | MOP Ch. 8 lines 12772-12794 support grease traps and scraping. Excerpt was cut early |
| 1 | final-alt | op a3 Spellman attribution for motor short | REAL | Attribution removed |
| 1 | final-alt | op a4 hazard list; noise in a distractor | REAL | Noise is a listed hazard; distractor replaced |
| 2 | why | c4 key | PLANTED | Caught; not in draft |
| 2 | why | "Each sewer is laid at a slope" | REAL | Gravity sewers are laid on a slope |
| 2 | why | Pumping "so that" gravity resumes | REAL-PARTIAL | "often" |
| 2 | why | "Construction costs are higher" | REAL | "may be higher" (MOP 8-81) |
| 2 | why | Static head "solely" elevation | REAL | Equal-pressure condition stated |
| 2 | why | Friction exact square law | REAL-PARTIAL | "often approximated" |
| 2 | why | 9% increase and "flow falls" | REAL | Same reference flow; system curve moves (R3 finished) |
| 2 | pumps | 803 vs 400 gpm | PLANTED | Caught; not in draft |
| 2 | pumps | "Three kinds" of seal incl. seal water | REAL | Packing and mechanical seals; seal water as a service |
| 2 | pumps | 8.34 lb/gal water assumption | REAL-PARTIAL | Stated |
| 2 | pumps | c4 key | PLANTED | Caught; not in draft |
| 2 | pumps | c6 explanation 608 | PLANTED | Caught; original 404 is correct and kept |
| 2 | pumps | c6 "working volume" unit ambiguous (135 ft3) | REAL | Prompt asks for US gallons |
| 2 | controls | 823 vs 410 gpm | PLANTED | Caught (see table note) |
| 2 | controls | c2 key | PLANTED | Caught; not in draft |
| 2 | controls | c6 explanation 33.35 | PLANTED | Caught; not in draft |
| 2 | controls | Constant-area assumption for drawdown | REAL | Applied in round 3 |
| 2 | controls | Hand runs "regardless of level" | REAL-PARTIAL | Subject to protective interlocks |
| 2 | controls | Big run-hour gap "points to" selector/availability | REAL | "A clue to check" |
| 2 | operation | Pump 7 vs pump 2 | PLANTED | Caught; not in draft |
| 2 | operation | c4 key | PLANTED | Caught; not in draft |
| 2 | operation | "A wet well is a confined space" | REAL | "Most wet wells" (Spellman 11.4.1) |
| 2 | operation | Pump-down "regular"; safety | REAL | Weekly, under safe procedure, not an entry authorization |
| 2 | operation | Velocity "lowers" (conditional) | REAL-PARTIAL | "can lower" |
| 2 | operation | c6 looks vs enters | REAL | Prompt now says climb in |
| 2 | operation | Hours gap = starts and wear | REAL | Run time only |
| 2 | operation | Low discharge pressure + amps = wear | REAL-PARTIAL | "may point to wear" |
| 2 | operation | c2 explanation unconditional | REAL-PARTIAL | "can raise" |
| 2 | finals | f1 key | PLANTED | Caught; not in draft |
| 2 | final-alt | a4 explanation "inverts the step" | REAL-PARTIAL | Explanation now shows 0.45 x 1,440 = 648 mixing units |
| 2 | final-alt | a1 shaft rating vs brake hp | REAL | Prompt reworded |
| 2 | final-alt | a5 key | PLANTED | Caught; not in draft |
| 2 | final-alt | controls a4 average rate | REAL | Stem: each pump averaged its tested rate |
| 2 | final-alt | op a3 overstated trip cause | REAL-PARTIAL | Explanation reworded |
| 3 | why | c3 key | PLANTED | Caught; not in draft |
| 3 | why | 15 ft drawdown | PLANTED | Caught; not in draft |
| 3 | why | Actual flow falls (fixed speed assumed) | REAL-PARTIAL | "For a fixed-speed pump" |
| 3 | why | c5 open wet well not stated | REAL | Prompt states open wet well and open outlet |
| 3 | pumps | 803 vs 400 gpm | PLANTED | Caught; not in draft |
| 3 | pumps | c6 key | PLANTED | Caught; not in draft |
| 3 | pumps | Head falls with flow (universal) | REAL-PARTIAL | "for a typical centrifugal pump" |
| 3 | pumps | "Available suction head" not NPSH | REAL | NPSHA must exceed required NPSH |
| 3 | pumps | c3 operating point vs corresponding point | NIT | Prompt asks for the corresponding point |
| 3 | controls | 410 vs 823 gpm | PLANTED | Caught (see table note) |
| 3 | controls | c2 key | PLANTED | Caught; not in draft |
| 3 | controls | Float speed vs drawback | REAL | Matches Spellman p.369 (one discharge rate; loading; idle) |
| 3 | controls | Surface-area volume formula general | REAL | Constant cross-section stated |
| 3 | controls | "Alarms tell people before the station fails" | REAL | Early warning for high level only; pump failure and power loss may already have happened |
| 3 | operation | Pump 7 vs pump 2 | PLANTED | Caught; not in draft |
| 3 | operation | c2 key | PLANTED | Caught; not in draft |
| 3 | operation | 1,512 vs 1,160 "after the same period" | REAL | "Logged over the same review period" |
| 3 | operation | "Periodic" pump-down | REAL | "At least once a week" (MOP 8-84) |
| 3 | operation | All dry wells as confined spaces | REAL | Only dry wells classified as confined spaces |
| 3 | finals | f2 key | PLANTED | Caught; not in draft |
| 3 | finals | Verification notes: Table 8.1, telemetry, motor guide not in excerpt | EXCERPT | Table 8.1 (MOP line 11356) and Table 10.3 (line 15969) exist. Telemetry (Ch. 7) not re-checked in this pass |
| 3 | final-alt | why a1 key | PLANTED | Caught; not in draft |
| 3 | final-alt | pumps a1 "gives 8" | PLANTED | Caught; not in draft |
| 3 | final-alt | pumps a1 affinity at corresponding point | REAL-PARTIAL | Prompt now says corresponding point |
| 3 | final-alt | pumps a3 8.34 for water only | REAL | Stated in the prompt |
| 3 | final-alt | controls a2 bubbler reference point | REAL | Prompt names liquid surface 4.2 ft above tube outlet |
| 3 | final-alt | controls a5 "leaving to the maker undermines" | REAL-PARTIAL | Vendor may make an authorized change; still record and test |

## Revalidation (final draft)
- Counts: 4 modules; 24 checks (6/6/6/6 by position); 20 finals (5/5/5/5); 20 alternates (5/5/5/5). Unique ids (64) and unique prompts (64). 4 choices each. correctIndex in range.
- Banned option words: none. No correct option is strictly longest (validate.py).
- sourceIds: all exist.
- Activities: 60 minutes per module, 240 total. Last activity of the last module is the final assessment.
- Evidence contains "fictional" and is over 120 characters; assignment over 100; rubric at least 3; facilitator guide over 200; objectives at least 2 (asserted in validate.py).
- Numeric answers: `verify.py` (python3 -I) recomputes 24. 21 match to the stated rounding. Three flagged by its 0.6% tolerance (3.871 shown as 3.9; 5.055 as 5.1; 1.818 as 1.8) round correctly; checked by hand.
- Lesson words (figures excluded, tags stripped): why 1,516; pumps 1,625; controls 1,474; operation 1,406. Pumps is over the 1,500 target and under the 1,700 hard maximum; not trimmed in this pass.
- Figures: 7 original inline SVG (2, 2, 2, 1), each under 3 KB, no style attributes. Figures were not edited in this pass and were not re-rendered.

## Unresolved
- Pumps module lesson is 1,625 words (target about 1,500, hard max 1,700).
- Telemetry and SCADA wording (WEF Ch. 7) was not re-checked against a source in this pass.
- Round-3 wording points were applied, but no further round was run after them (the three-round limit).
- Book sources have no URL; the CeuSource type requires one (open owner decision; see CEU procedure).
- Only GPT Sol 6.2 reviewed the course. Gemini neon did not review it.
