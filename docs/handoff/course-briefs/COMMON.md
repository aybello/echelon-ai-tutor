# Foundation course writer brief: rules common to every course

Read these first: `content/ceu-drafts/ceu-basic-hydraulics.json` and `ceu-basic-math.json` (finished, reviewed models: copy their exact field structure, tone, depth, `###` lesson layout with worked examples showing every step and unit, quick-check and final-question style, explanations that name the mistake behind each distractor, and the original inline SVG approach), their `-NOTES.md` and `-REVIEW-RESULT.md`, `shared/ceuLearning.ts` (types) and `docs/handoff/HANDOFF-2026-11-17.md` (rules). Skim `docs/us-launch/US_BANK_WRITER_BRIEF.md` and `docs/us-launch/state-dossiers/` for what exams exclude.

Do NOT commit, do NOT register the course in any catalogue, do not edit any existing file. Write only `content/ceu-drafts/<file>.json` and `<file>-NOTES.md` for your course.

## Audience and wording
Operators and trainees across the US and Canada preparing for certification exams and renewal. US customary units with metric on first use. Non-credit pilot wording as in the models; never imply approved CEUs or contact hours. Content is written in our own words, own scenarios and own numbers. Do not use or imitate any outside course's text, questions, examples or images.

## Structure the tests enforce (keep exactly)
- 4 modules. 6 quick checks per module. 5 final questions per module in `finalAssessment` and 5 in `alternateFinalAssessment` (20 and 20), all different from each other and from the checks. Every question exactly 4 choices and a valid `correctIndex`.
- Each lesson about 1,200 to 1,500 words (not counting SVG), at least four `### ` headings, over 600 characters, with a worked or scenario example.
- Each module: `id`, `title`, `objectives` (at least 2), `lesson`, `evidence` (fictional scenario, must contain the word fictional, over 120 chars), `assignment` (over 100 chars), `rubric` (at least 3 items), `facilitatorGuide` (over 200 chars), `activities` (minutes sum over all modules to `plannedMinutes`; the LAST activity of the LAST module has an instruction containing the words final assessment), `sourceIds`, `checks`. Final questions carry `objective` equal to a module id.
- Unique question ids (pattern `<course key>-<module id>-c1..`, `-f1..`, `-a1..`) and unique prompts across checks, finals and alternates.
- Top-level fields as in the models: key, version, title, shortTitle, stream ('drinking_water', note in NOTES that it is shared with wastewater), audience, prerequisites, introduction, plannedMinutes, delivery, sources, modules, finalAssessment, alternateFinalAssessment.

## Question quality rules
Wrong options are real mistakes a learner might believe; each explanation names the mistake behind the distractors; no all/none/both of the above; options parallel in form and similar length; correct-answer positions balanced; none of these words inside options: always, never, only, all, every, none, cannot, completely, entirely, solely; no filler tails. Every calculation recomputed with a `python3 -I` script; the correct answer to a calculation must not equal a number written in its question; state every constant and assumption inside each question.

## Hard limits
No exact regulatory limits, residual values, exposure limits, sample counts, deadlines or rule numbers as numbers (say "the applicable rule or permit sets the value"). Recognition and purpose only for anything safety-critical; no step-by-step safety or emergency procedures. Facility procedures govern. All scenarios fictional, fictional names.

## Diagrams
At least five ORIGINAL inline SVG figures in lessons: `<figure><svg viewBox=... role="img" aria-label="..."><title>...</title>...</svg><figcaption>...</figcaption></figure>`. No fixed width or height, no style attributes, no scripts, no external images, each under 3 KB, text at least 11 viewBox units, colours #1d2d40 text and #2f6db2 accent plus neutral greys, never colour alone. Draw from scratch. Render each at 390 px wide with Playwright (`NODE_PATH=/home/user/echelon-ai-tutor/node_modules/.pnpm/playwright@1.63.0/node_modules`, `chromium.launch()` with no options) into the scratchpad diagrams folder named in your course brief and LOOK at every PNG; fix overlaps and tiny labels.

## Sources
3 or 4 sources, each URL verified with `curl -sIL -m 20 URL` returning 200, preferring EPA, OSHA, NIOSH, CCOHS, NIST, state agency or university operator-training pages. Fill every field like the models with accessed '2026-11-17'. Never invent URLs.

## Checks before you reply
JSON parses; counts hold; ids and prompts unique; every question 4 choices; no banned words in options; recompute every calculation; lesson lengths in range. In the NOTES file: sources, counts, every constant used, anything you are unsure about, the scope limits applied. Reply in under 120 words.

## Required step before writing or improving any course: read the Royce U equivalent
1. Extract the equivalent Royce U course text into the scratchpad (`royce/<code>/data/slide<N>.js`; text from the `<span>` elements; `bsp` Basic Safety, `cpp` Chlorination Principles, `bip` Basic Instrumentation, `wdo1p` and `wdo2p` Water Distribution Overview, `bhp` Basic Hydraulics, `bmp` Basic Math). Read every slide, not a sample.
2. Build a topic list from it and check each topic against our draft (lesson and questions): YES, PART or NO.
3. Fill every NO and PART with original content in our own words, our own scenarios and our own correct numbers, from official or standard sources. Do not copy their wording, questions, examples, images or numbers. Do not write their exact numeric limits (their safety numbers are the regulators' and are not ours to restate; use "the applicable rule sets the value").
4. Record the gap table and what changed in the course NOTES file.
