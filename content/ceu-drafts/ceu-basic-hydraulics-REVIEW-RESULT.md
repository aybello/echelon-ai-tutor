# Basic Hydraulics CE draft: review result

Draft: `content/ceu-drafts/ceu-basic-hydraulics.json` (one fix round, 2026-11-16). Ids, correctIndex values and 4-choice structure unchanged. Answer positions still balanced: checks 6/6/6/6, final 5/5/5/5, alternate final 5/5/5/5.

Process note: these edits were made in the working tree only. A parallel session's commit `a208f55e` ("Basic Math CE course: draft ...") then picked them up, so they are already in HEAD under that commit's message.

## Models and planted-error detection

Both models reviewed review copies, not the real draft. Each copy had one wrong correctIndex per unit plus one altered number per unit (13 plants in total, listed in `plants.json`).

| Unit | Plants | GPT-6.1 Sol | Gemini 4 hydrogen |
| --- | --- | --- | --- |
| pressure-head | c3 key; lesson 120 to 243 psi | both | both |
| flow-velocity | c6 key; lesson "10 in" to "23 in" | both | both |
| friction-pumps | c5 key; c3 explanation; lesson 20 to 43 percent | all 3 | all 3 |
| operating-problems | c5 key; lesson x60 to x123 | both | both |
| final | f2 key; f1 explanation | both | both |
| final-alt | a4 key; a1 explanation | both | both (rerun) |

- Gemini's first final-alt run returned no content (`finish_reason: length`): the 8,000-token limit was spent on hidden reasoning. A rerun with the same review copy and the same limit failed the same way. Plants were regenerated with seed 7 and matched `plants.json`. A second rerun with `max_tokens` 32,000 succeeded.
- Both models caught 13 of 13 plants. One weakness: on the pressure-head 243 psi plant, GPT suggested recomputing with 243 psi instead of restoring 120. Gemini restored the correct number.
- GPT raised many more general-theory points, and most were too pedantic for an entry-level course. Gemini was terser and also found one real wording slip in the real text (c1 "closes a hydrant cap gauge").

## Real findings fixed (in the real draft)

Lessons:
- pressure-head lesson: the sentence "Head ... does not depend on the fluid being pressurised or the pipe size" was misleading, because converting pressure to head depends on density. Removed. The 120 ft lift statement now says "ignoring friction".
- pressure-head lesson: "Static pressure depends only on height of water" now says this holds for a gravity system fed from an open tank.
- pressure-head lesson: dynamic pressure now reads "also called flowing or operating pressure; lower than static with the same supply conditions". A one-line note says engineering texts use the term for velocity pressure.
- pressure-head lesson: "A large drop means a long or restricted path" softened to "often points to".
- pressure-head lesson, Part B: gauges stated to be at about the same height.
- flow-velocity lesson: velocity "changes in proportion to [diameter's] square" was a wrong direction. Now "inversely with the square", with the formula V2 = V1 x (d1/d2)^2. The common-mistake line now says "larger pipe, slower water".
- flow-velocity lesson: the ratio check "2.86 x 2.78 = 7.94" actually gives 7.95. Now "7.95, matching 7.94 within rounding".
- flow-velocity lesson: added a note that gallons are US gallons, since the audience includes Canada.
- friction-pumps lesson: velocity head was described as "well under a foot" at 2 to 8 ft/s, but 8 ft/s gives 0.99 ft. Now gives the range 0.06 to 1 ft.
- friction-pumps lesson: qualifiers added that NPSHr "generally rises" with flow and that shutoff head is highest "on a typical curve" (check the manufacturer's curve).
- friction-pumps lesson: affinity-law intro now says "same pump and impeller". Added one sentence: with a large static head, actual flow at reduced speed falls more than the flow law suggests.
- friction-pumps lesson, Heron Bay example: noted that 230,624 comes from unrounded values (26.33 x 8,760 = 230,651). Currency was missing its unit, so "0.10 / 256" now reads "10 cents / 256 dollars".
- operating-problems lesson: NPSH wording changed to "no longer safely above required". The air-binding sentence ("Air is air that should not be there") was rewritten.
- operating-problems lesson: throttling sentence qualified to a centrifugal-pump system. "Pressure falls wherever friction takes head" and the far-customer line are qualified to level ground.
- operating-problems lesson: the tank example's "Net in ft3/min" is now "Net outflow" (the sign had been dropped). The common mistake "throttling valve as isolation valve, or the reverse" is replaced with "isolation-only valve held partly open". Water-hammer caption changed from "the instant the valve closes" to "as the valve closes".

Questions:
- pressure-head-c1: the prompt said "closes a hydrant cap gauge", which makes no physical sense. Changed to "reads".
- pressure-head-c5: the explanation said shutoff pressure "has nothing to do with a hydrant test". Reworded.
- flow-velocity-c1: the explanation called A/V a "time-like quantity" and V/A "the equation for nothing". Both now give the correct units.
- friction-pumps-c3: added "Neglecting velocity head" so the item matches the lesson's TDH formula.
- operating-problems-c3: the distractor explanation called throttling a discharge-side effect, which was wrong because suction throttling can cause cavitation. Fixed.
- operating-problems-c4: "the operator adjusts by hand" changed to "set by hand or by an actuator".
- operating-problems-c6: prompt now specifies the discharge of a centrifugal pump. Choices say "head loss across the valve" instead of "in the line", because total line loss is not guaranteed to rise. The key is unchanged.
- pressure-head-f1: two nearly identical distractors (427.4 and 427.3 psi). Replaced 427.3 with 65.4 psi (atmospheric pressure subtracted wrongly) and updated the explanation.
- pressure-head-f3: added that the gauges are at the same height.
- friction-pumps-f3: added "centrifugal".
- pressure-head-f4: the explanation called the static reading "total head". Now "static pressure head".
- flow-velocity-a2: the prompt said "1,000,000 gal per MGD". Now "1 MGD = 1,000,000 gal per day". The explanation of the 8,064 distractor now matches its arithmetic.
- operating-problems-a2: absolute claims softened to "not a usual cause", matching the prompt's "usual cause".
- pressure-head-a4: the explanation of the 17.0 kPa distractor did not reproduce the number. Now: 12 m = 39.4 ft x 0.433 = 17.0 psi, labelled kPa.
- friction-pumps-a4: the 230,624 kWh distractor relied on a 90 ft head the prompt never gives. Replaced with 2,357 kWh (motor efficiency left out).
- pressure-head-a5: the explanation said atmospheric pressure "has no effect on gauge readings", which is false as written. Reworded.
- friction-pumps-a5: prompt now specifies a centrifugal pump with a typical falling curve whose shutoff head is its highest head. The explanation no longer says "system head must be below pump head".
- friction-pumps-a1: dropped "and system" from the affinity-law wording.

All numbers were recomputed with a python3 -I script: every lesson example, the facilitator guides and all 64 questions with their distractor arithmetic. No other arithmetic errors were found in the real draft. The planted errors exist only in the review copies.

## Figures (6 inline SVGs)

All agree with the text:
- Tank figure: 10 ft = 4.33 psi, 20 ft = 8.66 psi.
- Continuity arrows.
- Suction lift/head TDH layouts, consistent with the caption.
- Pump/system curves: the operating point at (238, 104) lies on both Bézier curves to within 0.5 px.
- Water-hammer trace: caption reworded.
- Valve strip: matches the valve table.

## Rejected and why

- GPT: full TDH and pump-head equations with elevation, pressure and velocity-difference terms everywhere. Too heavy for entry level. Short "same height" and "neglect velocity head" qualifiers were added instead.
- GPT: NPSH3 / 3-percent head-drop criterion and a margin in c6 choice A. The lesson and the c6 explanation already require a margin, and the 3-percent detail is beyond scope.
- GPT: radial versus axial power-curve behaviour in operating-problems-f3. The prompt already says centrifugal, and the item is standard exam material.
- GPT: rewriting the friction-pumps-c3 explanation because multiplying two heads does not give feet. The distractor is intentionally wrong; the explanation is fine.
- GPT: "dynamic pressure" items should say "flowing pressure". Handled with a lesson note instead, because operator exams do use "dynamic".
- GPT: water-hammer wave travel time, and globe/butterfly valves both isolating and throttling. Captions and the common-mistake line were adjusted only lightly.
- GPT and Gemini: a1 explanation "41.13" should be 41.135 / 41.14. Rejected as trivial rounding.

## Leftover nits (not fixed this round)

- operating-problems-f5: three of the four choices name kinetic or centrifugal pumps. The item is defensible, but the distractors are not very diverse.
- friction-pumps-c3 still uses a non-dimensional "540 ft" distractor.
- operating-problems-f3: "power falls with speed" is fine, but a radial-flow qualifier could be added.
- Facilitator guides were checked arithmetically only.

## Caveats

- Not compared against any official exam, certifying-agency need-to-know list or current Sacramento State manual edition.
- The sources (EPA EPANET, Sacramento State course listings, EPA NPDES training) are landing pages. No specific constant or claim is cited to a page or section.
- The constants are the conventional rounded operator values (2.31, 0.433, 449, 7.48, 1.547, 3,960).
- Reviewer models saw lessons with the SVGs stripped, so the figure check is mine alone.
- Duration (180 min) has not been validated, and no contact hours are awarded.

## Second round: five added topics (2026-11-17)

After comparing the course with an outside free course on the same subject, five topics were added: hydrostatics versus hydrodynamics, static suction and discharge head, priming and starting a centrifugal pump (recognition level only), specific pump types, and mud and telescoping valves. To keep the course structure unchanged (6 checks per module, 5 final questions per module in each set), eight existing questions were replaced with new ones on the added topics (checks pressure-head-c6, friction-pumps-c1, operating-problems-c4 and c6; finals pressure-head-a3, friction-pumps-a2, operating-problems-a2 and a3). Two new figures were added or redrawn: a pump-types strip and a valve strip with seven valves.

The whole course was reviewed again by GPT-6.1 Sol and Gemini 4 hydrogen on a review copy with 13 planted errors (a wrong key and an altered number or explanation per unit). **Both caught all 13 (13 of 13 each).** No Opus review was done in this round because the Claude usage limit was reached; the fixes below were applied by the main session instead, and the course has had one Opus review from the first round.

**Real problems found in the added content and fixed:**
- A pneumatic ejector was labelled "kinetic". It pushes batches out with compressed air, so it is now labelled "air displacement"; jet eductor and airlift were relabelled "jet-driven" and "air-driven", and the kinetic definition was changed to say it describes impeller and propeller pumps. The pump-types figure header now reads "Kinetic and air-driven" (found by GPT and Gemini).
- Rotary lobe pumps were described as "two lobes"; they have two synchronized lobed rotors (GPT).
- Air binding was described as outside air only; it is now air or gas gathered in the pump (GPT). Question c3's explanation was changed to match.
- Water hammer was described as a pressure spike only; pressure waves can also drop pressure (GPT).
- Question c4p said the pumped liquid lubricates bearings in general; it now refers to the shaft seal (GPT).
- Question a2p said cavitation means "the pump still delivers some flow"; reworded (GPT).
- Question f3 said power always rises with flow on a centrifugal pump; now "for many centrifugal pumps" and "usually" (GPT).
- Question c6t's note on axial flow pumps now says "large, low-head flows" (Gemini).

**Raised again and not changed:** GPT again raised the general-theory points rejected in round one (the full total-head equation, NPSH3 margin, affinity laws as corresponding points). Gemini noted two rounding differences (a 2,037 versus 2,038 ft/s distractor in flow-velocity-a5 and a 230,624 kWh figure computed from unrounded values). These were left as nits.

**Not covered:** the fixes in this round were not reviewed a second time, and priming is deliberately kept at recognition level (no start-up procedure).
