# Supervisor Essentials for Water and Wastewater Operators: draft notes

Draft only. Not committed, not registered in any catalogue. Key `ceu-supervisor-essentials`, version `2026-11-17.1`, `plannedMinutes` 210 (module activity minutes 53/53/52/52). Non-credit pilot wording copied from the existing courses; no approved CEUs or contact hours are implied.

`stream` is `drinking_water` because the schema allows one value. The content applies to both streams (drinking water and wastewater): nothing in it is specific to either, and the catalogue entry should say so.

## Counts
- 4 modules (`stepping-into-role`, `responsibility-accountability`, `management-styles`, `leading-through-change`); 6 quick checks each (24); 20 final and 20 alternate questions (5 per module each). 64 questions, 64 unique prompts, unique ids, 4 choices each.
- Correct positions: checks 6/6/6/6, finals 5/5/5/5, alternates 5/5/5/5. Correct answer is the longest option in 5 of 24 checks, 5 of 20 finals and 4 of 20 alternates (strictly longest; ties not counted).
- Final questions: 11 of 20 are scenario judgements and 6 of 20 are calculations (30 percent); alternates have 11 scenario judgements and 6 calculations. Each module has at least one calculation in its finals.
- Lessons (words excluding figures): 1,273 / 1,268 / 1,232 / 1,244; 7 or 8 `###` headings each. Worked examples with steps and units in every lesson.
- Figures: 5 original inline SVGs: role map (module 1), documentation loop (2), management styles spectrum and flat versus layered chart (3), escalation decision flow (4). Each SVG is under 2.9 KB, viewBox only, no style attributes, text 12 units, colours #1d2d40 / #2f6db2 / greys, shapes and labels carry the meaning. Rendered at 390 px with Playwright and inspected; the documentation loop centre text, the escalation flow labels and an arrowhead in the role map were fixed after the first render. PNGs are in `scratchpad/diagrams-supv/`.

## Sources (each `curl -sIL -m 20` returned 200 on 2026-11-17)
1. https://www.epa.gov/dwreginfo/drinking-water-distribution-system-tools-and-resources
2. https://www.epa.gov/dwcapacity/about-operator-certification (states that requirements vary from state to state)
3. https://www.ccohs.ca/oshanswers/legisl/responsi.html (supervisors act for the employer; Canadian context)
4. https://www.ccohs.ca/oshanswers/hsprograms/investig.html (incident investigation and records)

None of the four is a supervision textbook. They support the cautions (rules vary, supervisors carry duties for the work they direct, factual records), not the style models, which are standard management teaching written in our own words.

Textbook references (paraphrased, not copied; no passage, table or question reproduced): Handbook of Water and Wastewater Treatment Plant Operations (public-health and pathogen background in the chapters on microbiology and water quality, Ch 14 and 16) and Spellman's Standard Handbook (Ch 19 permits, records and reports) informed the records and public-health framing at purpose level only.

## Checklist coverage (gap report `supervisor.md`)
| Item | Where |
| --- | --- |
| Operator-to-supervisor shift, consistency, former peers | Lesson 1; checks 1-2; finals/alternates M1 |
| Position above operators, below manager; authority varies; dictionary and legal meaning of supervisor | Lesson 1 (title versus real authority, check local employment rules); M1 questions |
| Supervisor's job: guide the group, see each member productive | Lesson 2; M2 check 1 |
| Responsible charge as a concept, personal consequences, check your state's rules | Lesson 2; M2 check 5, finals and alternates on certification |
| Five styles: definition, shift look, advantages/disadvantages, when each suits | Lesson 3; M3 questions; spectrum figure |
| Same-task comparison (a filter check) | Lesson 3 (Birchwood filter check, own scenario); M3 check 1 |
| Documentation and checklists; no signing a task not performed | Lesson 2 (loop figure, signature section); M2 questions |
| Organisation charts, layers versus flat | Lesson 3 and figure; M3 check 6 |
| Staffing and certification categories, general only | Lesson 2; no tables or class numbers |
| Public-health awareness, waterborne and water-associated pathogens at purpose level | Lesson 2; M2 final and alternate (Legionella as water-associated) |
Nothing in the checklist was left out. Module 4 content (delegation, coaching, poor performer, documentation, escalation, transition example) follows the course brief.

## Constants and assumptions used
- All hours-per-week figures are fictional plans, not standards: 40-hour week, 36-hour week, 10 or 15 percent of paid hours lost to leave and training, 24 x 7 = 168 weekly hours, 16 x 5 = 80 hours, 4 weeks per month, 52 weeks per year, 60 minutes per hour.
- Span of control = people reporting / supervisors, rounded up to a whole supervisor where stated. Spans of 6, 7, 8 and 9 are illustration only; the lesson says no single number is correct.
- Budget figures ($250,000 at 12 percent, $320,000 at 15 percent) are stated in each question as assumptions, not as a standard share or rate.
- Every calculation was recomputed with `python3 -I` (`verify.py` in the scratchpad): all 16 calculation questions matched, none has an answer equal to a number in its question, and every distractor derivation and lesson worked example was re-derived.

## Scope limits applied
- No Florida tables, category numbers, classification wording or staffing numbers. Certification, classification, coverage and employment rules are written as "check your state's or province's rules".
- No tax, rate, interest or staffing figure is stated as universal.
- Safety content is recognition and purpose only; the escalation flow says facility procedures set the steps. All names, utilities and amounts are fictional. Royce U wording, stories, questions and images were not used.

## Unsure or for a reviewer
- Lesson 1 and 4 mention typical authority and discipline steps in general terms; labour agreements may change them, which the lessons say.
- Source 3 and 4 are Canadian occupational-safety pages used for the general idea of supervisor duties and factual records; a reviewer may want a US supervision source (for example a state operator-training page) added.
- The documentation-loop and escalation figures show a conceptual process only, not a facility procedure.
