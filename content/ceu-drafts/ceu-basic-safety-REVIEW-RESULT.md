# Basic Safety CE draft: review result

Draft: `content/ceu-drafts/ceu-basic-safety.json`. One fix round on 2026-11-17, not committed. Ids are unchanged and no `correctIndex` value was changed: every key in the real draft was already correct. Answer positions are still balanced: checks 6/6/6/6, final 5/5/5/5, alternate final 5/5/5/5.

## Models and planted-error detection

GPT-6.1 Sol and Gemini 4 hydrogen reviewed review copies, not the real draft. Each copy had one wrong `correctIndex` per unit (6 in total) and one altered number in each module lesson (4 in total).

| Unit | Plant | GPT-6.1 Sol | Gemini 4 hydrogen |
| --- | --- | --- | --- |
| hazard-ppe | c3 key (A instead of C); lesson "9 + 4 = 7" | both | both |
| confined-atmosphere | c6 key (A instead of D); lesson "2,1003 ppm" | both | both |
| excavation-energy | c5 key (B instead of A); lesson "19 ft x 0.3048" | both | both |
| chemical-emergency | c5 key (A instead of C); lesson "195 lb / 12" | both | both |
| final | excavation-energy-f2 key (Sloping instead of Shielding) | yes | yes |
| final-alt | confined-atmosphere-a4 key (C instead of A) | yes | yes |

- **Both models caught all 6 planted keys and all 4 altered numbers.**
- I checked that none of the planted errors is in the real draft. The f2 key is D (Shielding), and the lesson reads 2,500 ppm, 3 + 4 = 7, 8 ft and 96 lb.
- GPT raised many more substantive points; most of the real fixes below came from its list. Gemini was terse and found one real typo (`falls,,`) and two real wording problems: the f4 "smell may have faded" wording and the crane "loads over people" sentence. It also found a contributor-versus-warning-sign mix-up in the trench example.

## Real findings fixed

Lessons:
- hazard-ppe: the risk-matrix example now says that until the guard is back, the belt drive is kept stopped or out of reach, because a score never makes an exposed moving part acceptable (GPT).
- hazard-ppe: fit testing and seal checks now apply to tight-fitting respirators (GPT).
- hazard-ppe: the label list adds precautionary statements. The flame pictogram now "marks fire hazards, most often a flammable product". Corrosion now reads "skin or eyes or damage metal", where it had said all three always apply. Skull and crossbones now means acute toxicity. A new line says the hazard statements tell you which hazard applies (GPT).
- hazard-ppe: the double comma typo `falls,,` is fixed (Gemini).
- hazard-ppe: "Coating work inside a tank is confined-space work with its own permit" now says a tank interior is usually a confined space, coating vapors can add a hazardous atmosphere, and the confined-space program and permit decide how the work proceeds (GPT).
- confined-atmosphere: permit-required spaces now "have, or could have" a serious hazard. The employer evaluates spaces against the applicable rule (GPT).
- confined-atmosphere: in the safeguards table, the entry permit now records that the **designated entry supervisor** authorised the entry. It had said "competent person", which is the trench and excavation role (GPT).
- confined-atmosphere: IDLH equipment. The text used to accept "a supplied-air system fed through a hose" with no condition. It now says an airline respirator needs its own escape air supply, and an airline respirator without one is not enough because the hose can fail. No service-life number is given (GPT).
- excavation-energy: locate marks now show the approximate position of a line, not its exact path or depth, so digging near them is done with care (GPT).
- excavation-energy: the arc flash definition now separates the heat and light of the flash from the arc blast (pressure wave, molten metal), and includes arcs to ground (GPT).
- excavation-energy: grounding used to be described as "an easy path to earth". It now says the equipment grounding conductor and bonding give fault current a low-resistance path back to the source, so a breaker trips or a fuse blows. It reduces shock risk but does not remove it (GPT).
- excavation-energy: hot work used to present a permit and fire watch as always required. It now says most facilities control hot work with a permit or written authorization under their hot work program, and a fire watch is assigned where the program calls for one. Near a wet well, the facility's hot work procedure and gas testing decide (GPT).
- excavation-energy: noise "usually" injures hearing slowly, and a single very loud blast can harm it at once. The applicable rule sets the action levels and the facility's hearing program applies them (GPT).
- excavation-energy: "Cranes and hoists move loads over people" is now "move heavy suspended loads, so routes are planned to keep loads away from people". The single-signal-person rule now adds that anyone who sees danger may call a stop and the operator obeys it (GPT, Gemini).
- excavation-energy: the trench example used to list "four contributors". It now separates contributors (water, vibration, added load) from warning signs (crack, seepage). Rubric item 1 was changed to match (Gemini).
- chemical-emergency: cylinder orientation. Cylinders are secured in the position the supplier specifies: upright for most cylinders, while chlorine ton containers lie on their sides on rated supports. Valve caps "or other valve protection" are on when not connected. The chlorine table row now mentions ton containers (GPT).
- chemical-emergency: batteries. The text used to say every battery holds acid or caustic electrolyte and gives off hydrogen. Hydrogen is now limited to lead-acid and some other batteries, with one line saying lithium-ion hazards are mainly overheating and fire, so follow the maker's instructions (GPT).
- chemical-emergency: backflow used to be described as backsiphonage only. It now names backsiphonage (supply pressure drops) and backpressure (connected source at higher pressure) (GPT).
- chemical-emergency: "chemicals keep burning until washed off" is now "many chemicals keep injuring tissue until they are removed". The SDS and facility plan also say when a dry powder is brushed off before water is used (GPT).
- chemical-emergency worked example: "Dividing the other way gives a fraction of a day" was wrong in its units. It now reads "12 / 96 = 0.125 gives the share of the stock used per day, not days of supply". "If either leaked the result would be chlorine gas" is now "If a leak let the two mix, chlorine gas could be released" (GPT).

Questions:
- confined-atmosphere-f4: the key used to read "The smell may have faded, so stop and use instruments". It blamed the gas instead of the nose and implied staying in place to take readings. It now reads "Smell may be dulled, so leave and have the air tested". The explanation says to stop work, move to fresh air, report, and have trained people test before work resumes (GPT, Gemini).
- confined-atmosphere-c2: distractor B, "Air quality inside depends on the weather outside", was partly true and was only rejected by adding "only" in the explanation. It is replaced with "Clear outdoor air means the air inside is clear too". Key D said "Gas can form through ... rust", but rusting uses up oxygen. D now reads "Decay, rust, leaks or nearby work can change the air", and the explanation names both effects (GPT).
- confined-atmosphere-f1: the prompt now states that the wet well is a permit-required space (GPT).
- hazard-ppe-c3: the prompt now asks for "the hazard it most commonly signals", and the explanation says "a fire hazard, most often a flammable material" (GPT).
- hazard-ppe-c5: the explanation no longer says every tank is a confined space (GPT).
- hazard-ppe-c6: the prompt now says "tight-fitting respirator" (GPT).
- hazard-ppe-a3: the key now reads "burn skin or eyes or damage metal", and the explanation was changed to match (GPT).
- hazard-ppe-a5: the explanation claimed "infection risk does not depend on size", which was too absolute. It now says a small bite can still carry serious infection or rabies risk (GPT).
- excavation-energy-a2: the prompt used to say a permit "must be in place". It now states that the plant's hot work program covers the job and asks which control fits, and the explanation was changed to match (GPT).
- excavation-energy-a4: key B used to say "path to earth". It now says "a path back to the source so a breaker trips", and the explanation was changed to match (GPT).
- excavation-energy-a1: the explanation adds that anyone may call a stop (GPT).
- excavation-energy-c4: the explanation no longer says road closure "is not its job". Some jobs do close a road (GPT).
- excavation-energy-c5: the explanation no longer says a tag holds a device off. It now says stored energy is also released or blocked (GPT).
- excavation-energy-f5: the key "and removes the lock" read as an instruction to the learner. It now reads "and will remove the lock", and the explanation adds that the lock stays until its owner removes it (mine).
- chemical-emergency-c1: the explanation now names backsiphonage and backpressure (GPT).
- chemical-emergency-c6: the prompt is narrowed to upright cylinders. Distractor A used to read "gas settles unevenly when the cylinder lies down", which is partly defensible for liquefied chlorine, where orientation decides whether liquid or gas reaches the valve. It is replaced with "Upright cylinders hold more gas than ones lying flat" (GPT lead, my rewording).

## Rejected and why

- GPT: IDLH equipment with an exact SCBA service-life figure. This is a regulatory number and is out of scope. The fix states the principle (own air or escape air) without the number.
- GPT: alternate-entry procedures and reclassification in confined-atmosphere-f1, and permit status "not discretionary". These are too detailed for recognition level. A single "permit-required" qualifier and "evaluates against the applicable rule" cover the point.
- GPT: GHS flame sub-classes (self-reactive, pyrophoric, organic peroxide), and shipped-container versus workplace label formats. These are beyond entry level. The lesson now hedges ("most often") and points to the hazard statements.
- GPT: one-call tolerance-zone rules and exact-location methods. These are procedural detail and vary by state and province. The "approximate position, dig with care" line is enough.
- GPT: first aid with water-reactive substance procedures. This is procedural. One SDS-governed line about dry powder was added instead.
- GPT: the f4 replacement text "Stop work, move to a safe area, and report ...; do not rely on smell". It is much longer than the other options and would make the key obvious. A shorter, parallel key was used.
- Gemini: "Cranes and hoists lift heavy loads around work crews". The underlying point was adopted with different wording.
- I left out changes that would add numbers, steps or legal citations, so no regulatory limit, schedule or rule number was introduced.

## My own checks

- Every lesson statement, table row, quick check, final and alternate question and explanation was read. Distractors were checked for defensibility, banned words and named mistakes. The two replaced distractors (c2 B, c6 A) were the only ones I found defensible.
- All calculations were recomputed with `python3 -I`: 0.25 percent, 3,000 ppm, 0.3 percent, 0.4 percent, 6,000 ppm, 2.13, 2.74 and 2.44 m, 8 and 7 days, 0.125, 12 and 10, 5.4 kg, 44 kg. Every distractor's arithmetic (40, 4, 0.04; 60, 600, 60,000; 22.97, 2.31, 0.04; 29.53, 2.97, 0.03; 1,152, 1,372, 0.143, 84) matches its explanation. No answer equals a number in its prompt.
- Five figures: the pyramid, PPE zones, gas positions, trench methods and storage layout. Their labels still match the lesson text, including the hierarchy order, "lighter collects high, heavier collects low" and the reacting pairs.
- Scope: no exact oxygen, LEL, toxic-gas, noise, trench-depth, slope, distance, flush-time or deadline values. No lockout, entry, rescue or emergency step lists. The fire section keeps a generic awareness order (get people out if safe, alarm, close doors, small fires only), which I judged to be awareness level, not a procedure.
- Structure after the fixes: JSON parses (2-space indent kept). 4 modules, 6 checks each, 20 finals and 20 alternates (5 per module each). Ids and prompts are unique, every question has 4 choices, there are no banned words in options and no "all/none of the above". Activities total 180 minutes, and the last activity names the final assessment. Lessons have 10, 9, 12 and 12 `###` headings.

## Leftover nits

- Lesson length grew with the fixes. By my count (text only, no SVG): about 1,540, 1,480, 1,590 and 1,630 words. Modules 3 and 4 are over the "about 1,500" target. A later pass could trim the hot work and battery paragraphs.
- The correct option is the strictly longest in chemical-emergency-f3, as before. confined-atmosphere-f4 was shortened so that it is not.
- Explanations still use the formulaic "The ... choice" pattern noted in NOTES.
- "Nobody enters a trench until ... protection is in place" is conservative: some shallow, stable cuts need no protective system. I left it, because it errs toward safety at entry level.
- The NOTES file was not updated (outside this task's edit scope). It still lists the pre-review word counts.

## Caveats

- No official source verification. The four sources (three CCOHS pages and the NIOSH trenching page) were checked for HTTP 200 only, and OSHA pages were not accessible through the proxy (403). The safety statements, including those changed here, were not checked line by line against any source. They rest on standard operator teaching and the reviewers' points.
- The reviewer models saw lessons with the SVGs stripped, so the figure check is mine alone.
- The fixes in this round were not reviewed by a second model.
- No contact hours are awarded, and the 180-minute duration is not validated.
