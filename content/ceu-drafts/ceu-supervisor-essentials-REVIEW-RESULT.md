# Supervisor Essentials CE draft: review result

Draft: `content/ceu-drafts/ceu-supervisor-essentials.json` ("Supervisor Essentials for Water and Wastewater Operators"). This is one fix round on 2026-11-17. Nothing is committed.

- No ids changed.
- No `correctIndex` value changed. Every key in the real draft was already correct.
- No SVG was edited. One figure caption (the styles spectrum) was reworded to match the corrected text and the figure's own labels.
- Answer positions are still balanced: checks 6/6/6/6, final 5/5/5/5, alternate final 5/5/5/5.
- The correct answer is still strictly the longest option in 5 of 24 checks, 5 of 20 finals and 4 of 20 alternates, the same as before the fix.
- The JSON parses and keeps its 2-space indent. It was edited with an exact-string replacement script that asserts each old string occurs once in its field.

## Models and planted-error detection

GPT-6.2 Sol, GPT-6.2 Astra and Gemini 4 hydrogen reviewed review copies, not the real draft. The copies had 12 planted errors: six wrong `correctIndex` values, two altered explanation numbers and four altered lesson numbers. I (Opus) reviewed the real draft separately. I checked each model finding against the real draft before acting on it.

| Unit | Plant | Sol | Astra | Gemini |
| --- | --- | --- | --- | --- |
| stepping-into-role | c3 key (A, "Above the manager") | yes | yes | yes |
| stepping-into-role | c5 explanation "23 hours" (real: 14) | yes | yes | yes |
| stepping-into-role | lesson "15 hours / 83 hours" (real: 40) | yes | yes | yes |
| responsibility-accountability | c6 key (A, false "completed" entry) | yes | yes | yes |
| responsibility-accountability | lesson "Step 7" (real: Step 2) | yes | yes | yes |
| management-styles | c5 key (A, 96 operators) | yes | yes | yes |
| management-styles | lesson "45 / 15 = 7.5" (real: 45 / 6) | yes | yes | yes |
| leading-through-change | c5 key (B, "Operator is lazy") | yes | yes | yes |
| leading-through-change | c6 explanation "8 percent" (real: 4.0) | yes | yes | yes |
| leading-through-change | lesson "270 minutes, or 12 hours" (real: 4.5) | yes | yes | yes |
| final | management-styles-f2 key (A, 8 supervisors) | yes | yes | yes |
| final-alt | responsibility-accountability-a4 key (B, assume any operator can cover) | yes | yes | yes |

- **All three models caught 12 of 12 plants.** I confirmed each one in the 18 output files rather than relying on the summary. None of these errors is in the real draft, so none of those "fixes" was applied.
- Sol gave the most findings, many of them overclaim and logic points. Astra overlapped with Sol on most substantive points. Gemini reported only the plants plus one nit (the rounded 0.2 distractor).

## Real findings fixed

53 string edits in total, grouped below.

### Calculations and stems that did not give what the explanation assumed
- stepping-into-role-f2 (Dara) and the Marisol lesson example and evidence: the stem gave a 40-hour week only for the old role, while the key divides by 40. They now say "15 of her 40 paid hours" (Sol; Astra and Sol also raised it for the lesson).
- stepping-into-role-a2 (Kofi): the explanation says the 22 hours are "now available" for supervising, which needs the same week. The stem now says "14 of his 40 paid hours" (Sol).
- leading-through-change-a2: 10 / 2 = 5 shifts holds only if each 3-hour session fits in one shift. The stem now says each operator is released "for the full 3-hour session", and the explanation says why the hours do not change the count (Astra, Sol).
- responsibility-accountability-a1: the "4 operators" explanation used "40-hour weeks", a number not in the question (36-hour week). It now reads "ignored the leave allowance, 168 / 36 = 4.67, then rounded down" (mine).
- leading-through-change-f5: "225 hours" now "counted one round only, 225 minutes, and labelled the minutes as hours" (Astra). "15.0 hours" now "treated the meetings as weekly, four rounds instead of two", which is the actual derivation (mine).
- management-styles-a3: "subtracted 15 from 320 thousand" is now "subtracted $15,000 from $320,000" (Astra, Sol).
- management-styles-c5: 4 / 24 = 0.167, so the "0.2 operators" distractor is now "0.17 operators". The explanation shows 4 / 24 = 0.17 and says it is supervisors per operator (Astra, Sol; Gemini as a nit). I applied it because two models called it substantive and the change is one number.
- Harlow Creek roster (responsibility-accountability lesson): "a fraction of a person cannot be scheduled" overclaimed, since part-time relief is possible. Step 3 now says 3 operators "when the roster uses whole full-time positions" and that 2 operators give 2 x 36 = 72 hours, 8 short of 80. The manager note and facilitatorGuide now say "about 8 hours a week uncovered" (Astra, Sol).

### Authority, records and responsibility
- Permit conditions: the lesson listed "changing permit conditions" as a manager or board power, which conflicted with stepping-into-role-c4's correct explanation that the regulator sets them. It now says "requesting changes to permit conditions", and some of these decisions "also need a regulator's approval" (Astra, Sol).
- stepping-into-role-c1 and c4 explanations: rate setting and capital approval are no longer "a manager's work". They are now decisions at manager, board or regulator level, and in some places a utility regulator approves rates (Astra, Sol).
- "Employment law differs between states, provinces and union agreements" now treats a union agreement as adding its own terms, not as law (Sol).
- stepping-into-role-a1: recommending discipline is now "a discipline recommendation the manager usually follows can count as real authority ... check the test that applies" (Astra, Sol).
- stepping-into-role-f5: key A "Assign the repair to the operator on duty" now reads "to a qualified operator". Being on duty does not show competence (Astra, Sol). Key position unchanged.
- stepping-into-role-f3: the "different supervisor" explanation now separates handing off to protect a friendship from following a conflict-of-interest policy (Sol).
- stepping-into-role-a5: the "refuse any overtime" explanation no longer says she "uses authority too narrowly", since she does not know her authority. It now says she blocks requests instead of finding out the limits or routing urgent ones to someone who can approve (Sol).
- responsibility-accountability-f2: the coworker's report is unverified. The explanation now says "an honest correction if the entry proves false", that leaving the entry "leaves a reported discrepancy unchecked", and that countersigning "vouches for an entry that may be false" (Astra, Sol).
- responsibility-accountability-c5: "the rules name who holds the role" is now "the rules set how the role is designated" (Sol).
- responsibility-accountability-a2: key A "Shorten it" could cut required checks. It now reads "Cut redundant lines, sign as work is done and spot-check equipment". The explanation no longer says short lists "get honest answers" (Astra, Sol). Key position unchanged.

### Public health
- Legionella (lesson): the text now says it infects people who breathe in mist rather than drink the water, "which is why it is often called water-associated rather than waterborne in the drinking-water sense". This keeps the checklist's waterborne versus water-associated framing without claiming Legionella disease is never classed as waterborne (Astra).
- responsibility-accountability-a5 prompt: now "a water-associated pathogen concern, where people are exposed some way other than by drinking the water", so the sewage-in-main distractor is clearly excluded (Astra, Sol). Key D unchanged.
- responsibility-accountability-f5: "Treatment and distribution are the barrier" now reads "Treatment, and the safeguards that keep water safe in distribution, are the barriers" (Sol).

### Management styles and organisation charts
- Styles figure caption and the paragraph below it: autocratic and paternalistic both have the leader deciding, so "differ by who makes the call" was inaccurate. They now "move from the leader deciding toward the crew having more say over decisions and methods". Bureaucratic now rests on "the written rule, not one person's preference". This matches the SVG's own labels ("Leader decides", "Group decides", "The written rule decides"), so the SVG was not changed (Astra, Sol).
- management-styles-c1: the paternalistic distractor is now explained by explanation, protection and expected loyalty, not "a decision by the supervisor", since the laissez-faire supervisor does decide the check is weekly (Astra, Sol).
- management-styles-a5: "describes the laissez-faire or democratic styles" is now "a risk of the hands-off laissez-faire style". Democratic leadership does decide (Sol).
- management-styles-f1: the "find their own methods" explanation now says experienced staff work "within approved procedures" (Astra).
- management-styles-f4: the stem now says the supervisor "has the authority to approve it". Before, the explanation assumed an authority the stem did not give (Sol).
- Span of control: "a narrow span gives ... more layers and more cost" now reads "for the same workforce ... needs more supervisors, and often more layers and more cost" (Astra, Sol).
- "a span of 12 cannot coach each person weekly ... cannot decide quickly" now reads "will find it hard to" and "is likely to be slow" (Astra, Sol).

### Leading change
- "Most performance problems begin with" is now "Many". "A thirty-second check saves weeks of confusion" is now "can catch a misunderstanding before it reaches the work" (Astra, Sol).
- "prevents rumours" is now "leaves less room for rumours". "A team approach usually finds causes faster" is now "often ... because each member brings different observations" (Sol).
- leading-through-change-c4: the prompt now adds "and there is no immediate safety risk", so checking facts first cannot conflict with the escalation flow (Sol).
- leading-through-change-f1: the prompt now says the missed samples "have been handled under the facility's procedures" and asks for the first step "in addressing his performance" (Astra).
- leading-through-change-f4: the explanation cited a say-back that is not in the key and said it "prevents confusion". It now explains the keyed written statement and says a say-back "can then confirm understanding" (Sol).
- leading-through-change-c5 and a4: the distractor notes do give a rough time ("this morning", "this week"). The explanations now say what they lack. c5's D no longer "assumes motive" and instead "claims a pattern without the facts behind it" (Astra, Sol).
- leading-through-change-a3: discipline is premature "before checking whether they understood the change or had something stopping them", not because the expectation "was never made clear" (Astra, Sol).

### Overclaims in module 1
- "a short course on giving feedback pays back within weeks" now reads "gives you techniques you can use right away", and certification "shows operating skill, not leadership skill" (Astra, Sol).
- "the planning, coaching and records will not get done" now reads "only 6 hours a week are left ... which are then likely to slip" (40 - 34 = 6). Astra called it substantive and Sol called it a nit. I applied it because "will not" is a certainty claim.

## Findings not applied, and why

- **Every plant-driven fix** (c3, c6, c5 and f2 keys; a4 key; "23 hours"; "8 percent"; "83 hours"; "Step 7"; "45 / 15"; "12 hours"): these apply only to the review copies. The real draft already has the correct values.
- **"Five that come up often in utilities" and "most supervisors lean toward one" are unsupported** (Sol): these are hedged teaching statements. This is a style point.
- **"The form is the point" and autocratic quality "depends on the supervisor being present"** (Sol): these are common textbook framings and the lesson hedges them. The caption fix already removes "the rulebook, not a person, makes the call".
- **Separate leadership style from chart shape, and rewrite management-styles-c6 option B** (Sol): the layered versus flat link is a required checklist item. The lesson and option B already hedge it with "often" and "tend to". Only Sol raised it.
- **Span example Step 2 "needs no extra layer"** (Sol): the example states that the supervisors report to the manager, so the step holds. Nit.
- **management-styles-c3: "no voice in decisions" is not autocratic by definition** (Sol): this is an acceptable simplification for a distractor, and the lesson says autocratic "questions are few".
- **"Record the actual reading, not a rounded value" ignores procedure precision** (Sol): it is an illustration of an observable expectation, not a logging rule. Nit.
- **Delegation frees 3 hours only before oversight time** (Sol): the arithmetic is right and the example is illustrative. Nit.
- **leading-through-change-c6: 28 / 7 = 4 is 400 percent** (Sol): the explanation already says the choice inverts the ratio. Nit.
- **leading-through-change-a1: agree roles before testing** (Sol): the question asks how to start, and the key (state, gather facts, list causes) is unaffected. The lesson's "agree on who does what" refers to follow-up. Only Sol raised it.
- **Unit labels in roster Step 1** (Sol): "16 hours x 5 days = 80 hours per week" is clear at this level. Nit.
- **Add part-time relief and full-time-equivalent wording to the roster example** (Astra): I applied the core point (whole positions, 72-hour gap) but did not add an FTE paragraph. The finals already say "rounded up to a whole person".
- **Reword management-styles-c5 to "operators reporting directly"** (Sol): the prompt already says "every operator reports to one of the supervisors".
- **Escalation figure is a placeholder** (Sol): this is an artefact of the review copies, which stripped SVGs. The real draft has the figure.

## What was not checked

- Sources were not re-fetched. The NOTES record HTTP 200 on 2026-11-17. No statement was checked line by line against a source. The four sources support the cautions, not the style models. The NOTES already flag that a US supervision source would help.
- SVGs were not re-rendered. I read the styles-spectrum labels to confirm the new caption matches. The reviewer models never saw the figures.
- The legal test for "supervisor" was not checked against any statute. The course frames it as "check the rules that apply to your employer".
- `vitest` was not run, because the draft is not registered in `server/ceu/catalogue.ts`. Instead, a `python3 -I` checker covered the catalogue.test.ts rules: 4 modules, 6 checks each, 5 + 5 finals per module, activity minutes 53/53/52/52 = 210 = plannedMinutes, at least four `###` headings per lesson, last activity names the final assessment, 64 unique ids and prompts, 4 distinct choices, no em dash, position and length heuristics. It also checked banned words in options, that every choice an explanation quotes exists, and that no numeric key appears in its own prompt. Result: **PASS**.
- I recomputed every calculation with `python3 -I`: the lesson examples, evidence and facilitator values, and all 16 numeric questions with each distractor's derivation. The only problems were the explanation and stem issues listed above.
- The NOTES file was not updated (outside this task's scope). Lesson word counts changed by a few words.
- These fixes were not reviewed by a second model.
