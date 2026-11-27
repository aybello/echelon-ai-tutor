# Sludge Digestion: second-model review result

Course: `ceu-sludge-digestion`, version `2026-11-26.1`. Draft only; not committed or registered.

## Reviewer
- Model: GPT-6.2 Sol, model id `gpt-6.2-sol` (exact id in the api.openai.com `/v1/models` list; `gpt-6.2-sol-healthcare` was not used).
- **Gemini did NOT review this course.** The second model in the original script has no credential here, so its call was removed.
- Script: `/tmp/claude-0/-home-user-echelon-ai-tutor/0e6dc4c6-dfed-5d26-9c2a-f17854a01d3e/scratchpad/review/review_course_sol.py` (adapted from `origin/main:docs/handoff/tools/review_course.py`).
- Outputs: `.../scratchpad/review/digestion/round1`, `round2`, `round3` (one file per unit, plus `plants.json` listing the planted errors).
- Textbook excerpts given per module: WEF MOP 11 chapter 30 (anaerobic, for modules 1, 2 and the finals), chapters 31 and 32 (aerobic and additional, for module 3), chapter 29 (thickening, for module 4). Full chapter text.

## Rounds
Three rounds, the limit. Each round planted new errors in a review copy (seeds 7, 8, 9). Round 3 still found real problems; those were fixed after the review and were **not re-reviewed**.

## Planted-error catch rate
| Round | Planted | Caught | Missed |
|---|---|---|---|
| 1 | 12 | 12 | none |
| 2 | 13 | 12 | anaerobic lesson "15 to 43 days" (should read 15 to 20) |
| 3 | 12 | 10 | same anaerobic lesson; operation lesson "6 or 7 percent" changed to 15 |
| Total | 37 | 34 (92%) | |

By type: answer keys 18 of 18; lesson numbers 9 of 12; explanation numbers 7 of 7.

## Findings and triage
"Real" means checked against the book or the arithmetic and found wrong or unclear. "False positive" means checked and not changed, with the reason.

| Rd | Where | Finding | Verdict | Action |
|---|---|---|---|---|
| 1-3 | Quiz keys (18 planted) | Wrong `correctIndex` in 6 questions per round | Planted, caught | None needed in the real file; keys verified correct |
| 1-3 | Lesson numbers and explanation numbers | Planted changes (for example 4,403; 43 days; 15,27 lb; 6 or 7 to 15; 602; 377; 92; 83) | Planted | Real text was correct and left as it is |
| 1 | Why-stabilise c6 choices | Choices lacked "per day" for a daily rate | Real | Added "per day" |
| 1 | Anaerobic c3 prompt | Used outflow without a constant-volume statement | Real | Prompt now says the same volume is removed daily |
| 1 | Why f1 explanation | Distractors described wrongly | Real | Rewritten (41.7 concentration only; 55.4 and 58.3 are shares remaining) |
| 1 | Why f2, c2, c4 explanations | Water called a fixed solid; VS wrongly excludes dissolved material; 18 and 82 percent origin unclear | Real | Reworded |
| 1 | Figure caption; "concentration leaving is lower" | Solids mass versus percentage; outlet concentration depends on water | Real | Reworded (percentage of total solids; concentration depends on water) |
| 1 | Use masses; arithmetic check | Flow alone does not make VSR; VS out can exceed VS in when storage is drawn down | Real | Added total solids and drawdown |
| 1 | Aerobic c2 explanation | "Sealed tanks are not features" conflates required with used | Real | Reworded to "required gas-tight tank" |
| 1 | Anaerobic c1 explanation | Nitrification called aerobic-only | Real | Reworded as nitrogen transformations |
| 1-2 | Gas, enzymes and "bacteria that make methane" | Hydrolysis compressed; methanogens are archaea | Real | Reworded as microbes; enzyme products reworded; "methane forms in last stage" |
| 1-2 | SRT and HRT definitions | Basis should be solids; decanted liquid counts in HRT | Real | Solids basis for SRT; HRT includes decant |
| 1-2 | pH falls "only once alkalinity is used up" | Overstated; buffering weakens gradually | Real | Reworded (quiz c5 and lesson) |
| 1 | Scum "by-product"; gas "something wrong with the biology" | Scum is undigested material; falling yield is a warning | Real | Reworded |
| 1-2 | Aerobic and operation SRT/HRT prompts | V/Q used as SRT; no density assumption | Real | Prompts state no decanting in a well-mixed tank and unchanged density |
| 1-2 | Operation f1, alt a5; aerobic alt a4 explanations | "80 days doubles the feed" (80 is a quarter of flow) | Real | Corrected |
| 1 | Anaerobic a5 choice C | Digester gas can drive gas mixing, so the choice was ambiguous | Real | Choice replaced with a clearly wrong use |
| 1 | Aerobic a3 | "More oxygen nitrifies more ammonia" | Real | Reworded (oxygen does not recover alkalinity) |
| 1 | Operation a3 choice D | Feed data alone cannot give reduction | Real | Choice and explanation reworded |
| 2 | Operation c6 stem | "Digester performance" for an aerobic case too | Real | Stem now says anaerobic digester |
| 2 | Operation f5 choice D | Presented as the WEF first step | Real | Choice reworded (check DO first, then raise aeration if low) |
| 2 | Anaerobic f4 choice A | "Any swing" overstated | Real | "Swings widely" |
| 2 | Too thick: "raises VS loading" | Only if more pounds of VS are fed | Real | Conditioned on VS pounds |
| 2 | Aerobic "avoids the gas hazard" | Overstates | Real | "Methane-gas hazard" |
| 2-3 | Prethickening "raises SRT and VS destruction" | Not supported as stated | Real | "Can give a longer SRT" |
| 2 | Aerobic "oxygen uptake result" | Direction unclear | Real | Phrase removed |
| 2-3 | Lime pH 12 | Reviewer: not a universal target; 2-hour contact not stated | Partly real | Reworded to "a high-pH condition" and "not a universal target". The 2-hour figure was not added, so it is not stated as a rule |
| 3 | Thin feed and HRT | Holds at the same solids feed rate | Real | Added condition |
| 3 | Sampling | "Refrigerated" as a blanket rule | Real | "Preserved as the test method requires" |
| 3 | Trends | Out-of-range readings | Real | Added "unless an alarm applies" |
| 3 | VA/alkalinity units | Reporting basis unstated | Real | "Both in mg/L as CaCO3" (WEF basis, p. 30-68) |
| 3 | Why c1 choice A; c3 choice C | Stabilisation overgeneralised; "less putrescible" as the definition | Real | Reworded |
| 3 | Anaerobic c5 explanation ending | Did not reject distractors clearly | Real | Reworded |
| 2-3 | "Thickened sludge has not yet been stabilised"; "digestion destroys" | Overstated | Real | Reworded |
| 1 | Operation: "samples come from three places" | Reviewer said these cover gas too | False positive | The three places are sludge sampling points (WEF p. 30-62, SOURCECHECK). Kept |
| 1 | Operation: "thickening does not change VS pounds" | Reviewer said capture condition missing | False positive | The lesson already says "unless the capture changes". Kept |
| 1-2 | Lime: add the 2-hour minimum | Omitted from the book's process example | False positive for a rule | The 2-hour figure is a process example, not a requirement. Not added |
| 2 | Spellman citations; "Wisconsin guide not supplied" | Reviewer had no Spellman or Wisconsin text | False positive | Spellman is not a course source. Wisconsin text was checked directly in SOURCECHECK |
| 2 | Aerobic DO 0.1 to 3.0 and 0.4 to 0.8 mg/L | No source given | False positive | SUPPORTED: WEF p. 31-27 and Table 31.9 (SOURCECHECK). Labelled typical or nominal |
| 2-3 | Above mesophilic "energy is wasted" | Blanket claim | False positive | SUPPORTED: WEF p. 30-65 (SOURCECHECK) |
| 2-3 | Aerobic "below 10 C basically ineffective" | No page in excerpt | False positive | SUPPORTED: WEF p. 31-33 (SOURCECHECK) |
| 3 | Thermophilic "55 C or higher" | Read as a minimum | False positive | SUPPORTED: WEF p. 30-6 |
| 2-3 | CO2 and nitrate "lower pH" | Nitrate does not acidify by itself | Not changed (unresolved) | The Wisconsin attribution is kept (SOURCECHECK, p. 66). The next sentence gives the nitrification mechanism |
| 3 | Caption "fixed part stays" | Assumptions missing | False positive | The caption states the condition |
| 3 | Source-specific wording "not in excerpts" | Excerpts incomplete | False positive | Claims were checked against the full WEF and Wisconsin text in SOURCECHECK |

## Revalidation (run after the last edit)
- JSON parses. Validator (`.../scratchpad/review/validate.py`): ALL PASS.
- Counts: 4 modules; 6 checks per module (24); 20 finals; 20 alternates; 64 questions.
- Unique ids and unique prompts: yes.
- Four choices each; correct positions balanced: checks 6/6/6/6; finals 5/5/5/5; alternates 5/5/5/5.
- Banned option words (always, never, cannot, only, all, every, any, none, completely, entirely, impossible, solely, must): none.
- Correct option strictly longest in 3 of 64 questions (ties and near-ties otherwise). Not in the brief's list; not changed.
- sourceIds all exist (`wi-adv-ww`, `wef-mop11`).
- Activity minutes 60 per module, 240 total. Last activity is "Sit the final assessment for this course after the last module."
- Lesson words including figure captions (SVG code and labels not counted, per COMMON.md): 1,603 / 1,699 / 1,694 / 1,700. Hard max 1,700: met.
- Five inline SVGs, largest 2,167 bytes, no style attributes.
- Lime wording: the only pH 12 mention is the WEF standard-process description, labelled as a high-pH condition, not a requirement.

## Unresolved
1. Lessons are 1,603 to 1,700 words, above COMMON.md's 1,200 to 1,500 target. Meeting the target needs cutting about 200 words per lesson.
2. The anaerobic "15 to 20 days" range was missed by the reviewer in rounds 2 and 3. The real text is correct.
3. Round 3 fixes were not re-reviewed (three-round limit).
4. CO2 and nitrate "lower pH" wording kept on Wisconsin attribution; the reviewer disagreed.
5. The WEF book source has no URL; the schema needs an owner decision (NOTES).
6. Round 1 reviewed a copy taken before two small trims (lime sentence; one clause in module 4). Later rounds reviewed the trimmed text.
