# Supervisor Essentials CE draft: review result

Draft: `content/ceu-drafts/ceu-supervisor-essentials.json`. This is one fix round on 2026-11-17. Nothing is committed.

- No ids changed. No `correctIndex` changed: every key in the real draft was already correct.
- The five SVG figures were not edited. One caption (styles spectrum) was reworded.
- Answer positions are still balanced: checks 6/6/6/6, final 5/5/5/5, alternate 5/5/5/5.

## Models and planted-error detection

GPT-6.2 Sol, GPT-6.2 Astra and Gemini 4 hydrogen reviewed review copies, not the real draft. The copies had six wrong `correctIndex` values and four altered lesson numbers.

| Unit | Plant | Sol | Astra | Gemini |
| --- | --- | --- | --- | --- |
| stepping-into-role | c3 key (A, supervisor above the manager); lesson Step 2 "15 / 83 hours" | both | both | both |
| responsibility-accountability | c6 key (A, false "completed" entry); lesson "Step 7" | both | both | both |
| management-styles | c5 key (A, 96 operators); lesson "45 / 15 = 7.5" | both | both | both |
| leading-through-change | c5 key (B, "Operator is lazy"); lesson "270 minutes, or 12 hours" | both | both | both |
| final | management-styles-f2 key (A, 8 supervisors) | yes | yes | yes |
| final-alt | responsibility-accountability-a4 key (B, assume any operator can cover) | yes | yes | yes |

- **All three models caught 6 of 6 planted keys and 4 of 4 altered numbers.** Gemini and Astra also flagged two explanation slips that existed only in the copies ("23 hours" in stepping-into-role-c5, "8 percent" in leading-through-change-c6). None of these errors is in the real draft, which has 40 hours, Step 2, 45 / 6 and 4.5 hours, and the correct keys.
- Sol and Astra gave the substantive points. Gemini was terse and limited itself to the plants.

## Real findings fixed

### Legal responsibility and authority
- stepping-into-role lesson: the utility does not change permit conditions. Managers or a board **apply for** permit changes, and the permitting authority changes them. Rates are "proposed or set" by a manager, board or council (Sol, Astra).
- stepping-into-role lesson: "Employment law differs between states, provinces and union agreements" now reads that legal tests differ between jurisdictions and laws, and a labour agreement may separately set duties and limits. stepping-into-role-f1 explanation was changed to match (Sol, Astra).
- stepping-into-role-c1 and c4 explanations: rate and capital decisions are made by "the body or official authorised", not by "a manager" or "the governing board or a senior manager" as a fixed rule (Sol, Astra).
- stepping-into-role-a1 explanation: a recommendation the manager usually acts on "can count as" real authority. The old text said recommending discipline "is" real authority. The key ("Likely yes") stays (Sol, Astra).
- responsibility-accountability-f2: a coworker's report is an allegation. The key now reads "Hear the operator, check the facts, fix the record if wrong and apply policy". Distractor B is now "Countersign the entry ... then move on", and the explanation says a review signature on an unverified entry may be read as confirmation, where it used to call it "a second false statement" (Sol, Astra).
- stepping-into-role-f5 key: "Assign the repair to **a qualified operator**", where it used to say "the operator on duty" (Sol, Astra).
- stepping-into-role-a5 explanation: refusing by default may leave the crew short; she should get the limits or reach the acting approver (Sol).
- Marisol example (lesson 1): the private talk is first "because Cedar Flats policy lets a supervisor handle a request like this directly", and the entry is then made and marked as late under procedure (Astra).

### Certification, coverage and the roster calculation
- responsibility-accountability lesson, worked example: units are now "16 hours per day x 5 days per week". The result is now "2.22 full-time equivalents; if the plant staffs with full-time positions, round up to 3". It also shows that 2 operators give 2 x 36 = 72 hours, about 8 hours short each week, and that part-time relief is another way to cover the fraction. The old text said "a fraction of a person cannot be scheduled" and "two operators leave no cover when anyone is away". The supervisor now checks that the roster covers every required hour with the right certificate class (check your state's or province's rules). The facilitatorGuide was changed to match (Sol, Astra).
- Source `epa-operator-cert` section now says "check your state's or province's rules" (my own finding).
- Florida wording: "operator in responsible charge" appears only as a concept, with "or a similar name", and with "check your state's or province's rules". No category tables, class numbers or staffing numbers appear anywhere. Checked by search.

### Public health
- Legionella (lesson 2 and responsibility-accountability-a5): the difference is now the route of exposure (breathing in mist rather than drinking). The old text said "water-associated rather than waterborne". The a5 prompt now asks which example "is usually called a water-associated pathogen concern, because exposure comes by a route other than drinking the water". The key was trimmed and two distractors lengthened (Sol, Astra).

### Records and checklists
- responsibility-accountability lesson: a step that makes no sense is now "reviewed and changed through the approved process", and every check the rules or permit require is kept. The old text said "fix the step" (Sol, Astra).
- responsibility-accountability-a2 key: "Shorten it ..." is now "Sign lines as done, drop redundant ones, spot-check results". The explanation now says redundant lines are removed through the approved process and required checks are kept (Sol, Astra).
- responsibility-accountability-a3 key now includes initials: "original readable, reason, date and initials" (Sol).
- leading-through-change lesson and c1 key: "record the actual reading, not a rounded value" now reads "as measured, in the units and precision the procedure requires". The c1 key is now "Log each reading as measured, before leaving the area" (Sol).
- leading-through-change-c5 and a4 explanations: C gives a rough time but not how late or what damage, and records no action. D in c5 claims a pattern with no dates. The old text said "has no time" and "assumes motive" (Sol, Astra).

### Management styles and span of control
- Spectrum text and caption: the line now runs from the leader keeping control to staff using their own judgement. Autocratic and paternalistic leaders both keep the decision; the paternalistic leader explains it and protects people. Laissez-faire leaves the method to each person, not to a group vote. The SVG labels ("Leader decides" / "Group decides") were left as they are; see leftover nits (Sol, Astra).
- Democratic filter check: the crew's checklist changes now go through the plant's document approval. Previously the supervisor simply "edits the checklist" (Sol).
- Democratic disadvantage (lesson) and management-styles-c3 key: decision and follow-up roles can blur unless they are assigned, and the supervisor stays accountable either way. The old text said "blur who is accountable". The c3 key now reads "It can be slow, and roles can blur unless assigned" (Sol).
- Span of control: a narrow span "allows closer supervision but may need more supervisors or more layers". A wide span "may need fewer supervisory posts" but leaves less time to coach (Sol, Astra).
- Worked example Step 2 now begins "if the five supervisors report directly to the manager". Step 3 now gives "seven teams of 6 and one of 3 (7 x 6 + 3 = 45)", where it used to say "some teams of 6" (Sol, Astra).
- "Putting it together": "cannot coach" and "cannot decide quickly" now read "may struggle" and "may be slow" (Sol, Astra).
- Mixed-style day: "the form is the point" now reads "the approved procedure must be followed exactly and the record must show it" (Sol).
- management-styles-c1 explanation: paternalistic means explaining, protecting and expecting loyalty. The old text said "a decision by the supervisor", which the scenario does contain (Sol, Astra).
- management-styles-f1 explanation: experienced staff work "within approved procedures" (Sol, Astra).
- management-styles-f4 explanation: a supervisor "can usually make" the decision, "with any approval the utility requires" (Sol).
- management-styles-a5 explanation: leaving decisions unmade describes laissez-faire, "or a democratic process where nobody is assigned to decide" (Sol).

### Leading people
- Lesson 4: "Most performance problems" now reads "Many". The fair-process order now applies to routine performance issues, and an immediate hazard is dealt with first under facility procedures. leading-through-change-c4 prompt now adds "and there is no immediate hazard" (Sol, Astra).
- leading-through-change-f1: the prompt now says required follow-up on the missed samples is under way, and asks for the first step in addressing his performance. Option A now reads "to see what they think should happen", where it used to say "agree with him" (Astra).
- leading-through-change-f4 explanation: the key is a written statement, and a say-back "can then confirm it". The old text claimed a say-back "prevents" confusion, but the key does not include one (Sol).
- leading-through-change-a3 explanation: discipline is premature "before checking whether they understood the change and had the new format". The old text said the expectation "was never made clear" (Sol, Astra).

### Calculations and their stated assumptions
- stepping-into-role lesson and f2 prompt: the supervisor week is now stated as "still paid for 40 hours" (Sol, Astra). stepping-into-role-a2 explanation: "22 fewer hands-on hours ... with his paid week unchanged" (Sol).
- leading-through-change-a2 prompt now states that each released operator can attend the full 3-hour session in that shift (Sol, Astra).
- management-styles-a3 explanation: $305,000 "treated 15 percent as a flat $15,000". The old text said "subtracted 15" (Sol, Astra).
- leading-through-change-f5 explanation: 225 hours "counted one round only and labelled its 225 minutes as hours". 15.0 hours "assumed weekly meetings, four rounds instead of two". The old text said "counting each meeting twice" (Astra, and my own finding).
- management-styles-c5 explanation: 0.2 is 4 / 24 = 0.17, shown as 0.2, which is supervisors per operator (Sol, Astra).
- leading-through-change-c6 explanation: 4.0 is 28 / 7 = 4, labelled as a percent (Sol, Astra).

### Other wording
- Lesson 1: "Most supervisors ... start as good operators" now reads "Many ... skilled operators". The "short course pays back within weeks" claim was removed (Sol, Astra).
- stepping-into-role-f3 explanation: handing off "just to protect the friendship", and "burdens" (not "punishes") people who did nothing wrong. stepping-into-role-f4 explanation: "typically ... though the split varies by utility" (Sol nits, adopted because they are cheap and remove universal claims).

## Longest-answer pattern

- Before: the correct answer was strictly the longest option in **14 of 64** (22 percent; ties not counted). The coordinator's figure of 18 likely used a different tie rule.
- After the fixes above, some keys grew, and the count rose to 16. Then:
  - Keys were trimmed in management-styles-c3, f4, leading-through-change-c1, responsibility-accountability-a2, a5 and f2.
  - Distractors were lengthened in management-styles-c3, f4, a5, responsibility-accountability-a5 and f2.
- After: strictly longest in **9 of 64 (14 percent)**, well under 35 percent.
- Every changed option quoted in an explanation was updated there. No banned words or "of the above" appear in options. The positions were unchanged.

## Rejected and why

- **Replace management-styles-c6 key with "chart shape alone does not tell you how decisions are made"** (Sol, Astra nit): the association between layered charts and autocratic cultures is in the topic checklist, and the key already hedges it with "tend to". The lesson keeps "often". Removing it would drop a required topic.
- **Change the spectrum SVG labels** (Sol, Astra): the text and caption now carry the nuance. Redrawing the figure for an entry-level course is not worth a re-render in a fix-only round.
- **"Most states and provinces classify plants ..."** was not softened: it is accurate as a general statement, and it is followed straight away by "check your state's or province's rules".
- **leading-through-change-c6 "if all 28 logs were submitted"** (Sol): the prompt says "7 of 28 logs ... were submitted late", which means 28 logs were submitted. Changing it is pedantry.
- **management-styles-c5 "only direct reports" wording** (Sol): the prompt already says every operator reports to one of the supervisors and asks for the average. That is enough.
- **responsibility-accountability-f2 keeps "apply policy"**: Astra's longer key ("preserving the original") would make the key the longest option again. The lesson already teaches correcting by an approved method that keeps the original readable.
- **Gemini nit: write 0.17 in management-styles-c5**: the distractor stays 0.2 as a plausible rounded slip, and the explanation now shows 0.17.

## Leftover nits

- The styles-spectrum SVG still labels its ends "Leader decides" and "Group decides". The caption and text now qualify this.
- Lessons are now 1,332 / 1,336 / 1,307 / 1,270 words (figures excluded), all within 1,200 to 1,500.
- The NOTES file is outside this task's edit scope and was not updated. It still lists the earlier word counts and longest-answer counts, and the source note still says "check your state's rules".
- Nine keys remain strictly longest, for example stepping-into-role-c6 and responsibility-accountability-c5, where the definition needs the words.

## My own checks

- I read every lesson statement, worked example, evidence, rubric and facilitator line, every check, final and alternate, and every explanation and distractor.
- I recomputed 62 values with `python3 -I`, all of which matched:
  - the hours shares, the hours moved, the roster FTEs (80 / 36, 168 / 34, 168 / 32.4) and the 72-hour shortfall
  - span of control (45 / 9, 45 / 6, 24 / 4, 48 / 8, 63 / 7) and 7 x 6 + 3
  - budget shares ($30,000, $48,000) and each distractor derivation
  - delegation and one-on-one hours (4.5, 3, 10, 7.5, 104), training shifts, and the percent questions
- No correct answer appears as a number in its own prompt.
- Structure:
  - The JSON parses and keeps its 2-space, no-trailing-newline format.
  - 4 modules, 6 checks each, 20 finals and 20 alternates.
  - The 64 ids and 64 prompts are unique. Every question has 4 distinct choices, and every final names a module objective.
  - Activities total 210 minutes, and the last activity names the final assessment.
  - Every quoted choice in an explanation exists.

## Caveats

- Sources are two CCOHS and two EPA pages, checked for HTTP 200 only. No statement was verified line by line against them.
- No US supervision source is cited. The style models, delegation, coaching and documentation content are general management practice, plus the handbook references (records, public health) paraphrased.
- Legal-status and employment points stay general ("check the rules that apply to your employer"). They are not legal advice.
- The reviewer models saw the lessons with SVGs stripped, so the figure check is mine alone. The fixes in this round were not reviewed by a second model.
- No contact hours are awarded, and the 210-minute duration is not validated.
