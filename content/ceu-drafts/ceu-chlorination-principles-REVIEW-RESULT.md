# Chlorination Principles CE draft: review result

Draft: `content/ceu-drafts/ceu-chlorination-principles.json`. One fix round on 2026-11-17, not committed. All ids are unchanged. No `correctIndex` value was changed, because every key in the real draft was already correct. The six figures (SVG markup) are unchanged. Answer positions are still balanced: checks 6/6/6/6, final 5/5/5/5, alternate final 5/5/5/5.

## Models and planted-error detection

GPT-6.2 Sol, GPT-6.2 Astra and Gemini 4 hydrogen reviewed review copies, not the real draft. The copies had six wrong `correctIndex` values and four altered lesson numbers.

| Unit | Plant | Sol | Astra | Gemini |
| --- | --- | --- | --- | --- |
| forms-chemistry | c3 key (A, sodium hypochlorite); lesson "Step 7" | both | both | both |
| dose-calculations | c6 key (A, "stay the same"); lesson list item "9. Divide" | both | both | both |
| contact-residual | c5 key (A, "most dangerous"); lesson "103 / 5 = 10" | both | both | both |
| feed-problems | c5 key (A, colour change); lesson "Step 9" | both | both | both |
| final | contact-residual-f2 key (B, 4.0 h) | yes | yes | yes |
| final-alt | dose-calculations-a4 key (C, 4.3 lb/day) | yes | yes | yes |

- **Every model caught 6 of 6 planted keys and 4 of 4 altered numbers.**
- The copies also had four explanations that quoted a choice that did not exist: dose c1 "3.65 mg/L", contact c3 "40.4 mg/L", contact f1 "10.7 min" and contact a1 "9.35 min". All three models flagged all four. None of them is in the real draft, which quotes 1.1, 25.6, 5.8 and 4.9.
- None of the planted errors is in the real draft.
- Sol and Astra raised many substantive points, and most of the fixes below came from them. Gemini was terse but accurate. It found the denitrification error, the heat-strip wording and the outdated SDS section list.

## Real findings fixed

### Calculation and arithmetic errors
- contact-residual lesson: the cfm constant was wrong. 133,680 / 1,440 = 92.83, not 92.84 (92.84 comes from 7.48 gal per ft3). The example also showed 83.6 cfm and then divided by 83.56. It now reads 0.9 x 133,680 / 1,440 = 83.55 cfm, and 4,800 / 83.55 = **57.5 min** (it said 57.4). Questions already used 133,680 / 1,440 (Sol, Astra, Gemini).
- dose-calculations lesson: 38.9 / 0.65 = 59.85, so the answer is now **59.8 lb/day** (it said 59.9). Also changed "70.1 gal/day / 24 h" to "70.06 gal/day / 24 h per day" (all three).
- forms-chemistry-c6: distractor "0.085 lb per gal" did not come from the mistake its explanation described (8 / 9.4 = 0.851). It now reads **0.851 lb per gal**, and the explanation names the mistake: dividing the whole percent by the density (Sol, Astra, Gemini).
- contact-residual-c2: the "147,000 min" distractor did not match "multiplied volume by flow" (105,000 x 1,400 = 147,000,000). The choice now reads **147,000,000 min** (all three).
- dose-calculations-c3: the "1,296 MGD" explanation now says the learner divided by 1,000 instead of one million (Sol, Astra).
- feed-problems-a3: the "12.0 lb/day" explanation used to say "subtracted the flow change from the feed", which gives 29.2. It now says the learner gave the drop in feed (30 - 18) (all three).
- contact-residual-a1: 2,700 / 74.3 gives 36.3. The explanation now carries 74.27 cfm to get 36.4 (Astra, Gemini).

### Chemistry
- forms-chemistry lesson, denitrification: it said denitrification "lowers the ammonia and nitrite load". That is wrong: it turns nitrate into nitrogen gas and does not remove ammonia. The lesson now says nitrification removes ammonia, and incomplete denitrification can leave nitrite that adds demand (all three). The forms-chemistry-a4 explanation no longer calls denitrification "reverse" nitrification (Sol).
- forms-chemistry lesson, pH effect: the rise in pH from hypochlorite is no longer put down to "their sodium hydroxide". OCl- takes up hydrogen ion, and extra caustic in bleach adds to this. "Slightly" was dropped from both directions, since the size depends on dose and buffering (Sol, Astra).
- HOCl now passes into microorganisms "much more easily than" the charged ion. It used to say the ion does not pass at all (Sol).
- Available chlorine is now defined as oxidizing strength expressed as equivalent chlorine gas, with percent by weight as the course basis. A new line says some labels give "trade percent" on a volume basis, so check the basis (Sol, Astra).
- Demand definition. The lesson said demand is used "before a residual can show". It now says demand is dose minus residual after a stated contact time, with the procedure saying free or total. The breakpoint example now says "total-residual basis". In module 2, residual is "what remains after a stated contact time". A new sentence says that a bench-test demand is tied to the residual type it was measured with. dose-calculations-c1, -f5 and the Willow Gap evidence now say "on a free-residual basis" (Sol, Astra).
- forms-chemistry-f3 and -a3: the prompts said "Demand is defined from the free residual", which read as a general definition. They now say "The plant's procedure figures demand from the free residual". The explanations give the total-basis value too (1.9 and 1.5 mg/L) and say to use the basis the procedure names. The keys are kept (see Rejected).
- Breakpoint caption, zone 4 text and forms-chemistry-a2: "only past it" and "stays as free chlorine" now say that added chlorine shows up *mainly* as free chlorine on the idealized curve. The a2 explanation no longer seems to accept "ammonia is still being formed" (all three).
- forms-chemistry-c4: the prompt now says total chlorine residual, read after the same contact time (Astra).
- forms-chemistry-f4: the explanation now says di- and trichloramine cause the *strongest* taste and odour complaints. The pH distractor explanation now says these forms are favoured by lower pH (Sol).
- Nitrification "shows a sudden, unexplained rise" is now "can show", and ammonia and nitrite tests confirm it (Sol, Astra).
- Gas properties: "releases a lot of gas quickly" is now "even a small liquid leak can make a large volume of gas". "Pools in low spots" is now "tends to collect ... although air movement can carry it elsewhere". forms-chemistry-c5 option D, both c5 explanations and feed-problems-c2 were changed to match (Sol, Astra).
- forms-chemistry-f5: the key said wet service "needs resistant plastics". It now says "attack steel", and the explanation says plastics or other materials rated for the conditions (Sol, Astra).
- forms-chemistry-a5: the prompt is limited to cylinders and ton containers. The explanation now mentions tare weight, and says a charged container holds both liquid and gas, so the valve used decides which is drawn off (Sol, Astra).
- The ton container now "lies on its side with its two valves set one above the other" (Astra).
- DBPs: "They are regulated" is now "Several, including these two groups, are regulated". "Formation rises" is now "generally rises", and chloramine use now notes trade-offs. The contact-residual-f4 explanation now says "generally ... such as trihalomethanes" (Sol, Astra).

### Safety and scope
- feed-problems lesson: "Heat strips or a warm room keep a high-rate cylinder from icing" could be read as permission to heat a cylinder. It now says containers are never heated directly. A warm room, more containers on line or an evaporator handle a high feed rate. Heat strips are placed on gas piping to stop gas turning back to liquid (all three).
- Leaks and first aid: the old wording "follow the two-person rule: nobody enters a suspected release area alone" implied that two untrained people could go in. The lesson now says do not enter: only trained responders with respiratory protection go in, in teams. First aid now says "without entering a release area yourself". The feed-problems-f5 explanation was changed to match (Sol, Astra).
- "Leaks get worse unless corrected" is now "can get worse quickly". The fire wording now leaves moving or cooling containers to trained responders and incident command (Sol).
- The hazards paragraph now says liquid contact causes frostbite-like and chemical burns. The claim that a humid area makes "the same release harsher" was dropped. "SDS and rule set the exposure values" is now "SDS lists values; the applicable rule sets legal limits" (Sol, Astra).
- The SDS section list was the old MSDS layout. It now names the standard sectioned format's topics (Gemini). Community right-to-know reporting and employer hazard training are now separate sentences (Sol, Astra).

### Equipment and operations
- Gas figure caption: the solution line carries the chlorine solution to the injection point. The caption used to say the solution formed "at the injection point" (Sol, Astra). The figure already showed the solution line.
- Scale: reads gross weight. Gross weight less tare gives the chlorine left, and weight loss over time gives the average feed. The manifold, isolation valves and PRV are now described separately. The vacuum regulator passes gas only under the vacuum the ejector creates. The rotameter is "commonly marked in lb/day". Changeover is sensed by a drop in pressure or vacuum (Sol, Astra, Gemini).
- "Gas feeds by vacuum and weight ... calculated differently" now says both start from lb/day, and hypochlorite adds the step of dividing by lb of chlorine per gallon (Sol).
- Day-tank drawdown: the caption and example now say "no refill during the check" (Sol, Astra).
- Control: a bad flow signal changes the actual feed and residual. A miscalibrated analyzer gives a wrong reading and can mis-trim. The operating-problems rows for high chemical use, empty container and residual swings were changed to match, and so was the common-mistake line on changeover (Sol, Astra).
- feed-problems-f4: ice is now "a common sign" that withdrawal exceeds supply, not proof. feed-problems-c1, -c6 and -a4 explanations: the scale's weight change gives the feed, "can make the opening larger", and gas binding at the pump (Sol, Astra).
- Contact-residual lesson: volume and flow set the nominal time, and layout decides how much water actually gets it. A quill or diffuser introduces the chlorine, and a mixer or turbulence spreads it. Short-circuiting is a direct path that bypasses the basin, not just a straight one. DPD dilution now uses chlorine-demand-free water, as the method allows, in the lesson and in contact-residual-c3 and -a3. The sampling plan now sits beside the rule. The tank result is labelled "nominal turnover", and the dead-end readings are the same water and residual type. The coliform rationale no longer says results "would come too late". "Counts" is now "criteria". contact-residual-c6 now separates dose from residual (Sol, Astra).
- Module 2 wording: 1 mg/L is "about" 1 ppm in water. "Demand rises after storms" is now "often rises". Gas rotameters are "commonly marked in lb/day", and the hypochlorite pump result is converted to the pump's own units. "Dose measured as free chlorine" is now "residual". "Bigger flow needs more chlorine" now says "at the same dose". The unit-cancel line no longer claims that lb per gal cancels to lb/day (Sol, Astra, Gemini).

### Question form (my own)
- In 15 questions the key was clearly the longest option, which gives the answer away to test-wise learners. I shortened those keys without changing their meaning: contact-residual-c1, c5, c6, a4, a5; feed-problems-c1, c4, c5, f4, f5, a4; forms-chemistry-f2, f5, a4, a5. No explanation quoted any of these keys.
- I renamed the module 2 plant "Hollow Fern" to "Larch Hollow", because the name was too close to module 3's "Fern Hollow".

## Rejected and why

- **Relabel 8.34 as "(lb/day)/(MGD x mg/L)" in every prompt** (Sol, Astra): rejected. "8.34 lb per gal" is how US certification formula sheets and the course brief state the constant. The lesson already explains why it works (a million gallons weigh 8.34 million lb). I fixed only the false unit-cancel sentence.
- **Change forms-chemistry-f3 and -a3 keys to the total-residual answer** (Astra): rejected. Standard Methods allows demand on a free or a total basis, and both questions now state the procedure's basis. The key is not wrong, so the index was kept. The explanations now show the other basis.
- **"Percent available chlorine by weight, as Cl2" in every hypochlorite prompt** (Sol, Astra): rejected as clutter for entry level. The basis is now defined once in the module 1 lesson.
- **Expansion chamber engineering detail; tolerance of materials by phase, pressure and compound; HAA biodegradation in distribution; presence/absence versus count criteria; EPCRA and jurisdiction detail** (Sol, Astra): too detailed for recognition level. Short hedges ("generally", "criteria", "separately") cover the point without adding rule detail.
- **Distractor explanation unit checks (lb²/day, day⁻¹) in feed-problems-c3 and contact-residual-a2** (Sol, Astra): pedantic. Each explanation already names the operation mistake.
- **Mention of the fusible-plug temperature** (Gemini): this is a specific safety number, so it is out of scope. The fix states the principle (never heat a container) instead.
- **Sample from a fixture** (Astra): adopted only as "unsuitable fixture". A full sampling-tap discussion is beyond scope.

## Leftover nits

- Breakpoint SVG label "4 Past breakpoint: added chlorine stays free" was left as is. The idealized wording matches the corrected caption, and editing the SVG would need a new render check.
- "More than twice as heavy as air" stays, as a physical fact, not a limit (NOTES had flagged it).
- feed-problems-c1 key (55 characters) is still slightly longer than its distractors (44 at most). The explanations keep the formulaic "The ... choice" pattern.
- Lesson words after the fixes (text only, no SVG): 1,425 / 1,319 / 1,306 / 1,489. All are in range, but module 4 is near the top.
- The NOTES file was not updated (outside this task's edit scope). It still says 92.84 and gives the pre-review word counts.

## My own checks

- I read every lesson statement, table row, worked example, check, final and alternate question, and every explanation. I checked distractors for defensibility, banned words and a named mistake.
- I recomputed every calculation with `python3 -I`, including each distractor's arithmetic: lesson examples, evidence and facilitator values (60.7 percent; 36.4 lb/day, 1.275 and 28.6 gal/day; 4,536 ft3, 102.1 cfm, 44.4 min, 70.6 percent and 0.020 mg/L/h; 16.7 lb/day and 9.0 days), and all 35 numeric questions. The only errors are the ones listed above. No correct answer appears as a number in its own prompt.
- Constants: 8.34 lb/gal, 1,000,000 gal/MGD, 1,440 min/day, 133,680 ft3/day per MGD (92.83 cfm), 3,785 mL/gal and 1 mg/L x 1 ML/d = 1 kg/day are all used correctly.
- The figures still match the text: HOCl/OCl- crossing near pH 7.5, breakpoint zones 1 to 4, the pounds formula, the gas train with a solution line, the day-tank layout and baffles.
- Scope: no exposure, residual, DBP, sample-count or deadline values, and no step-by-step container change, leak repair or first aid. The safety content is recognition and purpose, and "facility procedures govern" is kept.
- Structure after the fixes: JSON parses (2-space indent kept). 4 modules, 6 checks each, 20 finals and 20 alternates. Ids and prompts are unique, every question has 4 choices, there are no banned words in options and no "of the above". Activities total 210 minutes, and the last activity names the final assessment. Lessons have 11 to 13 `###` headings and six SVGs. 13 of 20 finals and 13 of 20 alternates are calculations.

## Caveats

- Sources were checked for HTTP 200 only. No statement was verified line by line against a source.
- The CCOHS page title could not be read (title-less response), so its `section` field needs a human check.
- Module 2 (arithmetic) has weak source support (landing-level EPA pages). A certifying-agency math or treatment manual should be added once one is confirmed.
- The operating-problems treatment of heater faults (evaporator heater, heat strips) is brief.
- The reviewer models saw lessons with the SVGs stripped, so the figure check is mine alone. The fixes in this round were not reviewed by a second model.
- No contact hours are awarded, and the 210-minute duration is not validated.
